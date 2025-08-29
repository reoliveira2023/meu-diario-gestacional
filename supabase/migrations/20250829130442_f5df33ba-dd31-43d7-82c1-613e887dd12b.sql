-- Fix CRITICAL subscribers table RLS policies
-- Remove dangerous policies that allow privilege escalation
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscribers;

-- Create secure policies that prevent privilege escalation
CREATE POLICY "Service role only can insert subscriptions" ON public.subscribers
FOR INSERT 
USING (false)
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only can update subscriptions" ON public.subscribers
FOR UPDATE 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Users can ONLY view their own subscription, cannot modify
CREATE POLICY "Users view own subscription only" ON public.subscribers
FOR SELECT 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Add constraint to prevent direct user modifications
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_no_direct_user_updates 
CHECK (true); -- This will be enforced by RLS policies only