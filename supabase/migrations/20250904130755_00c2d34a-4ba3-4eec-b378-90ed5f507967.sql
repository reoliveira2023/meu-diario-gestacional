-- ================================
-- COMPREHENSIVE FAMILY MEMBER SECURITY FIX
-- ================================

-- 1. Create email verification system for family member invitations
CREATE TABLE IF NOT EXISTS public.family_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL,
  invited_email TEXT NOT NULL,
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_email_format CHECK (invited_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  UNIQUE(inviter_id, invited_email)
);

-- Enable RLS for family invitations
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for family invitations
CREATE POLICY "Users can create family invitations" 
ON public.family_invitations 
FOR INSERT 
WITH CHECK (
  auth.uid() = inviter_id AND 
  auth.uid() IS NOT NULL AND
  invited_email IS NOT NULL AND
  TRIM(BOTH FROM invited_email) <> '' AND
  invited_name IS NOT NULL AND
  TRIM(BOTH FROM invited_name) <> ''
);

CREATE POLICY "Users can view their own invitations" 
ON public.family_invitations 
FOR SELECT 
USING (auth.uid() = inviter_id OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Invited users can update invitations" 
ON public.family_invitations 
FOR UPDATE 
USING (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 2. Create function to safely add verified family members
CREATE OR REPLACE FUNCTION public.add_verified_family_member(
  invitation_token_param UUID,
  accept_invitation BOOLEAN DEFAULT TRUE
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
  new_family_member_id UUID;
  result JSONB;
BEGIN
  -- Check rate limiting first
  IF NOT check_rate_limit('ADD_FAMILY_MEMBER', 5) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded');
  END IF;

  -- Get invitation record
  SELECT * INTO invitation_record 
  FROM family_invitations 
  WHERE invitation_token = invitation_token_param 
  AND expires_at > now() 
  AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Verify the current user is the invited person
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) != invitation_record.invited_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  IF accept_invitation THEN
    -- Add to family_members with verification
    INSERT INTO family_members (
      user_id, name, relationship, email, phone, 
      is_invited, invited_at, joined_at
    ) VALUES (
      invitation_record.inviter_id,
      invitation_record.invited_name,
      invitation_record.relationship,
      invitation_record.invited_email,
      invitation_record.phone,
      true,
      invitation_record.created_at,
      now()
    ) RETURNING id INTO new_family_member_id;
    
    -- Mark invitation as accepted
    UPDATE family_invitations 
    SET accepted_at = now(), updated_at = now()
    WHERE invitation_token = invitation_token_param;
    
    -- Log the verification
    PERFORM log_sensitive_access('family_members', 'VERIFIED_ADD', 
      jsonb_build_object(
        'family_member_id', new_family_member_id,
        'invitation_token', invitation_token_param,
        'verified_email', invitation_record.invited_email
      ));
    
    result := jsonb_build_object(
      'success', true, 
      'family_member_id', new_family_member_id,
      'message', 'Family member added successfully'
    );
  ELSE
    -- Reject invitation
    DELETE FROM family_invitations WHERE invitation_token = invitation_token_param;
    result := jsonb_build_object('success', true, 'message', 'Invitation declined');
  END IF;
  
  RETURN result;
END;
$$;

-- 3. Create function to mask sensitive family member data
CREATE OR REPLACE FUNCTION public.get_family_members_masked(requesting_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  relationship TEXT,
  email_masked TEXT,
  phone_masked TEXT,
  is_invited BOOLEAN,
  invitation_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access attempt
  PERFORM log_sensitive_access('family_members', 'MASKED_SELECT');
  
  RETURN QUERY
  SELECT 
    fm.id,
    fm.name,
    fm.relationship,
    CASE 
      WHEN fm.email IS NOT NULL AND fm.joined_at IS NOT NULL THEN 
        LEFT(fm.email, 3) || '***@' || SPLIT_PART(fm.email, '@', 2)
      WHEN fm.email IS NOT NULL THEN
        'Convite pendente'
      ELSE 
        NULL
    END as email_masked,
    CASE 
      WHEN fm.phone IS NOT NULL AND fm.joined_at IS NOT NULL THEN 
        LEFT(fm.phone, 4) || '****' || RIGHT(fm.phone, 2)
      WHEN fm.phone IS NOT NULL THEN
        'Convite pendente'
      ELSE 
        NULL
    END as phone_masked,
    fm.is_invited,
    CASE 
      WHEN fm.joined_at IS NOT NULL THEN 'Aceito'
      WHEN fm.is_invited THEN 'Pendente'
      ELSE 'Não convidado'
    END as invitation_status,
    fm.created_at
  FROM family_members fm
  WHERE fm.user_id = requesting_user_id
  ORDER BY fm.created_at DESC;
END;
$$;

-- 4. Enhanced audit logging for family member operations
CREATE OR REPLACE FUNCTION public.log_family_member_operation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Log all family member operations with detailed context
  IF TG_OP = 'INSERT' THEN
    PERFORM log_sensitive_access('family_members', 'INSERT', 
      jsonb_build_object(
        'family_member_id', NEW.id,
        'name', NEW.name,
        'relationship', NEW.relationship,
        'has_email', (NEW.email IS NOT NULL),
        'has_phone', (NEW.phone IS NOT NULL),
        'is_invited', NEW.is_invited,
        'timestamp', now()
      ));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_sensitive_access('family_members', 'UPDATE', 
      jsonb_build_object(
        'family_member_id', NEW.id,
        'changes', jsonb_build_object(
          'email_changed', (OLD.email IS DISTINCT FROM NEW.email),
          'phone_changed', (OLD.phone IS DISTINCT FROM NEW.phone),
          'joined_changed', (OLD.joined_at IS DISTINCT FROM NEW.joined_at)
        ),
        'timestamp', now()
      ));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_sensitive_access('family_members', 'DELETE', 
      jsonb_build_object(
        'family_member_id', OLD.id,
        'name', OLD.name,
        'relationship', OLD.relationship,
        'timestamp', now()
      ));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for family member audit logging
DROP TRIGGER IF EXISTS family_member_audit_trigger ON family_members;
CREATE TRIGGER family_member_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON family_members
  FOR EACH ROW 
  EXECUTE FUNCTION log_family_member_operation();

-- 5. Function to detect suspicious family member activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_family_activity(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_adds INTEGER;
  unique_emails INTEGER;
  total_members INTEGER;
  risk_score INTEGER := 0;
  warnings TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Count recent additions (last 24 hours)
  SELECT COUNT(*) INTO recent_adds
  FROM family_members 
  WHERE user_id = user_id_param 
  AND created_at > now() - INTERVAL '24 hours';
  
  -- Count unique email domains
  SELECT COUNT(DISTINCT SPLIT_PART(email, '@', 2)) INTO unique_emails
  FROM family_members 
  WHERE user_id = user_id_param 
  AND email IS NOT NULL;
  
  -- Total family members
  SELECT COUNT(*) INTO total_members
  FROM family_members 
  WHERE user_id = user_id_param;
  
  -- Risk assessment
  IF recent_adds > 10 THEN
    risk_score := risk_score + 30;
    warnings := warnings || 'High frequency of family member additions detected';
  END IF;
  
  IF total_members > 50 THEN
    risk_score := risk_score + 20;
    warnings := warnings || 'Unusually large family network';
  END IF;
  
  IF unique_emails > 20 THEN
    risk_score := risk_score + 25;
    warnings := warnings || 'High diversity in email domains';
  END IF;
  
  -- Log if suspicious
  IF risk_score > 30 THEN
    PERFORM log_sensitive_access('family_members', 'SUSPICIOUS_ACTIVITY', 
      jsonb_build_object(
        'user_id', user_id_param,
        'risk_score', risk_score,
        'warnings', warnings,
        'recent_adds', recent_adds,
        'total_members', total_members,
        'unique_emails', unique_emails
      ));
  END IF;
  
  RETURN jsonb_build_object(
    'risk_score', risk_score,
    'warnings', warnings,
    'is_suspicious', (risk_score > 30)
  );
END;
$$;

-- 6. Enhanced RLS policies to prevent unauthorized family member creation
DROP POLICY IF EXISTS "Enhanced family member insert" ON family_members;
CREATE POLICY "Verified family member insert" 
ON family_members 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  auth.uid() IS NOT NULL AND 
  user_id IS NOT NULL AND 
  name IS NOT NULL AND 
  TRIM(BOTH FROM name) <> '' AND 
  relationship IS NOT NULL AND 
  TRIM(BOTH FROM relationship) <> '' AND
  -- Allow only if invitation was verified or no email provided (manual entry)
  (
    email IS NULL OR 
    (
      email IS NOT NULL AND 
      is_invited = true AND
      EXISTS (
        SELECT 1 FROM family_invitations fi 
        WHERE fi.inviter_id = auth.uid() 
        AND fi.invited_email = family_members.email 
        AND fi.accepted_at IS NOT NULL
      )
    )
  ) AND
  -- Rate limiting check
  check_rate_limit('ADD_FAMILY_MEMBER', 10)
);

-- 7. Add triggers for content validation and audit
CREATE TRIGGER validate_family_member_content
  BEFORE INSERT OR UPDATE ON family_members
  FOR EACH ROW 
  EXECUTE FUNCTION validate_content_length();

CREATE TRIGGER update_family_invitations_updated_at
  BEFORE UPDATE ON family_invitations
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at();

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.family_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_verified_family_member(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_family_members_masked(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_suspicious_family_activity(UUID) TO authenticated;