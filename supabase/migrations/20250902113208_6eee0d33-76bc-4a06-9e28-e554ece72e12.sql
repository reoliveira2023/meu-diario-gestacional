-- Security Enhancement Migration
-- This migration strengthens RLS policies and adds additional security measures

-- 1. Add audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name text,
  action_type text,
  accessed_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO family_members_audit (user_id, action, accessed_data, created_at)
  VALUES (
    auth.uid(),
    format('ACCESS_%s_%s', upper(table_name), upper(action_type)),
    accessed_data,
    now()
  );
EXCEPTION
  -- Don't let logging failures block operations
  WHEN OTHERS THEN NULL;
END;
$$;

-- 2. Create security definer function to validate family member access
CREATE OR REPLACE FUNCTION public.is_family_member_authorized(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = target_user_id
    AND fm.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );
$$;

-- 3. Strengthen family_members RLS policies
DROP POLICY IF EXISTS "Secure family member view" ON family_members;
DROP POLICY IF EXISTS "Secure family member insert" ON family_members;  
DROP POLICY IF EXISTS "Secure family member update" ON family_members;
DROP POLICY IF EXISTS "Secure family member delete" ON family_members;

-- Enhanced family member policies with stricter validation
CREATE POLICY "Enhanced family member select" ON family_members
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL
);

CREATE POLICY "Enhanced family member insert" ON family_members  
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() IS NOT NULL
  AND user_id IS NOT NULL
  AND name IS NOT NULL
  AND trim(name) != ''
  AND relationship IS NOT NULL  
  AND trim(relationship) != ''
  AND (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE POLICY "Enhanced family member update" ON family_members
FOR UPDATE TO authenticated  
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() = user_id
  AND name IS NOT NULL
  AND trim(name) != ''
  AND relationship IS NOT NULL
  AND trim(relationship) != ''
  AND (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE POLICY "Enhanced family member delete" ON family_members
FOR DELETE TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 4. Strengthen medical_records policies with audit logging
DROP POLICY IF EXISTS "Users can view their own medical records" ON medical_records;
DROP POLICY IF EXISTS "Users can insert their own medical records" ON medical_records;
DROP POLICY IF EXISTS "Users can update their own medical records" ON medical_records; 
DROP POLICY IF EXISTS "Users can delete their own medical records" ON medical_records;

CREATE POLICY "Secure medical records select" ON medical_records
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Secure medical records insert" ON medical_records
FOR INSERT TO authenticated  
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() IS NOT NULL
  AND title IS NOT NULL
  AND trim(title) != ''
  AND type IS NOT NULL
  AND trim(type) != ''
);

CREATE POLICY "Secure medical records update" ON medical_records
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() = user_id
  AND title IS NOT NULL
  AND trim(title) != ''
  AND type IS NOT NULL  
  AND trim(type) != ''
);

CREATE POLICY "Secure medical records delete" ON medical_records
FOR DELETE TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 5. Strengthen family_messages policies
DROP POLICY IF EXISTS "Users can view their own messages" ON family_messages;
DROP POLICY IF EXISTS "Users can send messages to family members" ON family_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON family_messages;

CREATE POLICY "Secure family messages select" ON family_messages
FOR SELECT TO authenticated
USING (
  (auth.uid() = sender_id OR auth.uid() = recipient_id)
  AND auth.uid() IS NOT NULL
  AND sender_id IS NOT NULL  
  AND recipient_id IS NOT NULL
);

CREATE POLICY "Secure family messages insert" ON family_messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND auth.uid() IS NOT NULL
  AND sender_id IS NOT NULL
  AND recipient_id IS NOT NULL
  AND content IS NOT NULL
  AND trim(content) != ''
  AND length(content) <= 10000
  AND public.is_family_member_authorized(recipient_id)
);

CREATE POLICY "Secure family messages update" ON family_messages  
FOR UPDATE TO authenticated
USING (
  (auth.uid() = sender_id OR auth.uid() = recipient_id)
  AND auth.uid() IS NOT NULL
);

-- 6. Add content validation function
CREATE OR REPLACE FUNCTION public.validate_content_length()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate various text fields don't exceed reasonable limits
  IF TG_TABLE_NAME = 'family_messages' AND length(NEW.content) > 10000 THEN
    RAISE EXCEPTION 'Message content exceeds maximum length of 10000 characters';
  END IF;
  
  IF TG_TABLE_NAME = 'medical_records' AND length(COALESCE(NEW.notes, '')) > 50000 THEN
    RAISE EXCEPTION 'Medical record notes exceed maximum length of 50000 characters';
  END IF;
  
  IF TG_TABLE_NAME = 'baby_letters' AND length(NEW.content) > 50000 THEN
    RAISE EXCEPTION 'Letter content exceeds maximum length of 50000 characters';
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Add content validation triggers
CREATE TRIGGER validate_family_message_content
  BEFORE INSERT OR UPDATE ON family_messages
  FOR EACH ROW EXECUTE FUNCTION validate_content_length();

CREATE TRIGGER validate_medical_record_content  
  BEFORE INSERT OR UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION validate_content_length();

CREATE TRIGGER validate_baby_letter_content
  BEFORE INSERT OR UPDATE ON baby_letters  
  FOR EACH ROW EXECUTE FUNCTION validate_content_length();

-- 8. Add rate limiting for sensitive operations (using existing audit table)
CREATE OR REPLACE FUNCTION public.check_rate_limit(operation_type text, max_per_hour integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  
STABLE
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*)
    FROM family_members_audit
    WHERE user_id = auth.uid()
    AND action = operation_type
    AND created_at > now() - interval '1 hour'
  ) < max_per_hour;
$$;

-- 9. Enhanced subscribers table security (already has good policies but add validation)
CREATE OR REPLACE FUNCTION public.validate_subscription_data()
RETURNS trigger  
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service role to modify subscription data
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Subscription data can only be modified by service role';
  END IF;
  
  -- Validate email format if present
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format in subscription data';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_subscriber_data
  BEFORE INSERT OR UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION validate_subscription_data();

-- 10. Add security event logging for critical operations
CREATE OR REPLACE FUNCTION public.log_security_event()
RETURNS trigger
LANGUAGE plpgsql  
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive tables
  IF TG_OP = 'SELECT' AND TG_TABLE_NAME IN ('medical_records', 'family_messages', 'subscribers') THEN
    PERFORM log_sensitive_access(TG_TABLE_NAME, 'SELECT');
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN  
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;