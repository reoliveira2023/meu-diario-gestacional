-- Fix CRITICAL subscribers table RLS policies
-- Remove dangerous policies that allow privilege escalation
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;

-- Create secure policies that prevent privilege escalation
-- Only service role can insert/update subscription data
CREATE POLICY "Service role only can insert subscriptions" ON public.subscribers
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only can update subscriptions" ON public.subscribers
FOR UPDATE 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Users can ONLY view their own subscription, cannot modify
CREATE POLICY "Users view own subscription only" ON public.subscribers
FOR SELECT 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL AND user_id IS NOT NULL);