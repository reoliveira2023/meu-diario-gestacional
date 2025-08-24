-- Fix security issues with family_members and subscribers tables

-- First, ensure RLS is enabled on family_members table
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Drop the overly broad existing policy
DROP POLICY IF EXISTS "Users can manage their own family members" ON family_members;

-- Create specific, secure policies for family_members
CREATE POLICY "Users can view their own family members" 
ON family_members FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members" 
ON family_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members" 
ON family_members FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members" 
ON family_members FOR DELETE 
USING (auth.uid() = user_id);

-- Fix security issues with subscribers table
-- Drop overly permissive policies
DROP POLICY IF EXISTS "insert_subscription" ON subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON subscribers;

-- Create secure policies for subscribers
CREATE POLICY "Authenticated users can insert subscription" 
ON subscribers FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR email = auth.email()));

CREATE POLICY "Users can update their own subscription" 
ON subscribers FOR UPDATE 
USING ((user_id = auth.uid()) OR (email = auth.email()));

-- Ensure user_id column is not nullable for better security
ALTER TABLE family_members ALTER COLUMN user_id SET NOT NULL;