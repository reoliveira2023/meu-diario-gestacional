-- Fix family_members table security - simplified version without OLD reference
-- Create audit table for family member access
CREATE TABLE IF NOT EXISTS public.family_members_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_member_id UUID,
  action TEXT NOT NULL,
  accessed_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.family_members_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit table
CREATE POLICY "Users can view their own family audit logs" ON public.family_members_audit
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert audit logs" ON public.family_members_audit
FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

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
  AND name IS NOT NULL AND trim(name) != ''
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

-- Add email validation function
CREATE OR REPLACE FUNCTION public.validate_family_member_email()
RETURNS TRIGGER AS $$
BEGIN
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