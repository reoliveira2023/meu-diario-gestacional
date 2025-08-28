-- Fix family_members table security vulnerability
-- Add audit logging and strengthen RLS policies for family contact information

-- Create audit table for family member access
CREATE TABLE IF NOT EXISTS public.family_members_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  action TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  accessed_data JSONB, -- What data was accessed/modified
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.family_members_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit table - users can only see their own audit logs
CREATE POLICY "Users can view their own family audit logs" ON public.family_members_audit
FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON public.family_members_audit
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Create function to audit family member access
CREATE OR REPLACE FUNCTION public.audit_family_member_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Only audit if this is a real user access, not a system access
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.family_members_audit (
      user_id, 
      family_member_id, 
      action, 
      accessed_data
    ) VALUES (
      auth.uid(),
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      CASE 
        WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
        ELSE row_to_json(NEW)
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS audit_family_member_access_trigger ON public.family_members;
CREATE TRIGGER audit_family_member_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_family_member_access();

-- Strengthen existing RLS policies with additional security checks
DROP POLICY IF EXISTS "Users can view their own family members" ON public.family_members;
CREATE POLICY "Secure family member view" ON public.family_members
FOR SELECT USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Users can insert their own family members" ON public.family_members;
CREATE POLICY "Secure family member insert" ON public.family_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND auth.uid() IS NOT NULL
  -- Ensure name is not empty for valid family members
  AND name IS NOT NULL AND trim(name) != ''
  -- Ensure relationship is not empty
  AND relationship IS NOT NULL AND trim(relationship) != ''
);

DROP POLICY IF EXISTS "Users can update their own family members" ON public.family_members;
CREATE POLICY "Secure family member update" ON public.family_members
FOR UPDATE USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND auth.uid() IS NOT NULL
) WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  -- Prevent changing ownership
  AND user_id = OLD.user_id
  -- Ensure updated data is valid
  AND name IS NOT NULL AND trim(name) != ''
  AND relationship IS NOT NULL AND trim(relationship) != ''
);

DROP POLICY IF EXISTS "Users can delete their own family members" ON public.family_members;
CREATE POLICY "Secure family member delete" ON public.family_members
FOR DELETE USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND auth.uid() IS NOT NULL
);

-- Add constraints to ensure data integrity and prevent empty sensitive data
ALTER TABLE public.family_members 
ADD CONSTRAINT check_name_not_empty CHECK (name IS NOT NULL AND trim(name) != ''),
ADD CONSTRAINT check_relationship_not_empty CHECK (relationship IS NOT NULL AND trim(relationship) != ''),
ADD CONSTRAINT check_user_id_not_null CHECK (user_id IS NOT NULL);

-- Create function to validate email format if provided
CREATE OR REPLACE FUNCTION public.validate_family_member_email()
RETURNS TRIGGER AS $$
BEGIN
  -- If email is provided, validate format
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF NEW.email !~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format for family member';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email validation
DROP TRIGGER IF EXISTS validate_family_member_email_trigger ON public.family_members;
CREATE TRIGGER validate_family_member_email_trigger
  BEFORE INSERT OR UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.validate_family_member_email();