-- Enhanced security for family_invitations table
-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Users can view their own invitations" ON family_invitations;
DROP POLICY IF EXISTS "Invited users can update invitations" ON family_invitations;
DROP POLICY IF EXISTS "Users can create family invitations" ON family_invitations;

-- Create security definer function to get masked invitation data
CREATE OR REPLACE FUNCTION public.get_family_invitations_masked()
RETURNS TABLE(
  id uuid,
  invited_name text,
  relationship text,
  email_masked text,
  phone_masked text,
  invitation_message text,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  accepted_at timestamp with time zone,
  invitation_token uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access attempt
  PERFORM log_sensitive_access('family_invitations', 'MASKED_SELECT');
  
  -- Check rate limiting for invitation access
  IF NOT check_rate_limit('ACCESS_FAMILY_INVITATIONS', 20) THEN
    RAISE EXCEPTION 'Rate limit exceeded for invitation access';
  END IF;
  
  RETURN QUERY
  SELECT 
    fi.id,
    fi.invited_name,
    fi.relationship,
    -- Mask email: show first 3 chars + *** + domain
    CASE 
      WHEN fi.invited_email IS NOT NULL THEN 
        LEFT(fi.invited_email, 3) || '***@' || SPLIT_PART(fi.invited_email, '@', 2)
      ELSE NULL
    END as email_masked,
    -- Mask phone: show first 4 and last 2 digits
    CASE 
      WHEN fi.phone IS NOT NULL THEN 
        LEFT(fi.phone, 4) || '****' || RIGHT(fi.phone, 2)
      ELSE NULL
    END as phone_masked,
    fi.invitation_message,
    fi.created_at,
    fi.expires_at,
    fi.accepted_at,
    fi.invitation_token
  FROM family_invitations fi
  WHERE fi.inviter_id = auth.uid()
  ORDER BY fi.created_at DESC;
END;
$$;

-- Create function for invited users to view their specific invitation (unmasked for acceptance)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token_param uuid)
RETURNS TABLE(
  id uuid,
  invited_name text,
  relationship text,
  invited_email text,
  invitation_message text,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  inviter_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get invitation with validation
  SELECT * INTO invitation_record 
  FROM family_invitations fi 
  WHERE fi.invitation_token = token_param 
  AND fi.expires_at > now();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Verify the current user is the invited person
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) != invitation_record.invited_email THEN
    -- Log unauthorized access attempt
    PERFORM log_sensitive_access('family_invitations', 'UNAUTHORIZED_TOKEN_ACCESS', 
      jsonb_build_object('token', token_param, 'attempted_by', auth.uid()));
    RAISE EXCEPTION 'Unauthorized access to invitation';
  END IF;
  
  -- Log legitimate access
  PERFORM log_sensitive_access('family_invitations', 'TOKEN_ACCESS', 
    jsonb_build_object('token', token_param, 'invitation_id', invitation_record.id));
  
  RETURN QUERY
  SELECT 
    invitation_record.id,
    invitation_record.invited_name,
    invitation_record.relationship,
    invitation_record.invited_email,
    invitation_record.invitation_message,
    invitation_record.created_at,
    invitation_record.expires_at,
    COALESCE(p.full_name, 'Usuário') as inviter_name
  FROM profiles p
  WHERE p.user_id = invitation_record.inviter_id;
END;
$$;

-- Recreate restrictive RLS policies
CREATE POLICY "Restricted invitation select"
ON family_invitations
FOR SELECT
TO authenticated
USING (false); -- Block direct access - must use security definer functions

CREATE POLICY "Secure invitation insert" 
ON family_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = inviter_id 
  AND auth.uid() IS NOT NULL 
  AND invited_email IS NOT NULL 
  AND TRIM(BOTH FROM invited_email) <> ''
  AND invited_name IS NOT NULL 
  AND TRIM(BOTH FROM invited_name) <> ''
  AND invited_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND check_rate_limit('SEND_FAMILY_INVITATION', 5)
);

CREATE POLICY "Secure invitation update"
ON family_invitations
FOR UPDATE
TO authenticated
USING (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND expires_at > now()
  AND accepted_at IS NULL
)
WITH CHECK (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND expires_at > now()
);

-- Add trigger to log all family invitation operations
CREATE OR REPLACE FUNCTION public.log_family_invitation_operation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_sensitive_access('family_invitations', 'INSERT', 
      jsonb_build_object(
        'invitation_id', NEW.id,
        'invited_name', NEW.invited_name,
        'relationship', NEW.relationship,
        'has_email', (NEW.invited_email IS NOT NULL),
        'has_phone', (NEW.phone IS NOT NULL),
        'expires_at', NEW.expires_at
      ));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_sensitive_access('family_invitations', 'UPDATE', 
      jsonb_build_object(
        'invitation_id', NEW.id,
        'accepted_changed', (OLD.accepted_at IS DISTINCT FROM NEW.accepted_at),
        'timestamp', now()
      ));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for family invitation operations
DROP TRIGGER IF EXISTS log_family_invitation_operations ON family_invitations;
CREATE TRIGGER log_family_invitation_operations
  AFTER INSERT OR UPDATE ON family_invitations
  FOR EACH ROW EXECUTE FUNCTION log_family_invitation_operation();