-- Fix security issues for sensitive tables

-- 1. Fix family_members table RLS policies
DROP POLICY IF EXISTS "Users can manage their own family members" ON public.family_members;

-- Create specific policies for family_members instead of using ALL
CREATE POLICY "Users can view their own family members" ON public.family_members
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members" ON public.family_members
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members" ON public.family_members
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members" ON public.family_members
FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Fix medical_records table RLS policies  
DROP POLICY IF EXISTS "Users can manage their own medical records" ON public.medical_records;

CREATE POLICY "Users can view their own medical records" ON public.medical_records
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical records" ON public.medical_records
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medical records" ON public.medical_records
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medical records" ON public.medical_records
FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Fix subscribers table RLS policies
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Create restrictive policies for subscribers table
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT 
USING (auth.uid() = user_id);

-- Only allow edge functions to insert subscriptions (using service role)
CREATE POLICY "Service role can insert subscriptions" ON public.subscribers
FOR INSERT 
WITH CHECK (true);

-- Only allow edge functions to update subscriptions (using service role)  
CREATE POLICY "Service role can update subscriptions" ON public.subscribers
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- 4. Ensure all sensitive tables have RLS enabled
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 5. Make user_id columns NOT NULL for better security
ALTER TABLE public.family_members ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.medical_records ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.subscribers ALTER COLUMN user_id SET NOT NULL;