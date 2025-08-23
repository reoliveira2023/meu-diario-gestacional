-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  due_date DATE,
  last_period_date DATE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create family members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- pai, mãe, avó materna, avó paterna, tio, tia, prima, primo, etc.
  email TEXT,
  phone TEXT,
  is_invited BOOLEAN DEFAULT false,
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for family members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Create policies for family members
CREATE POLICY "Users can manage their own family members" 
ON public.family_members 
FOR ALL 
USING (auth.uid() = user_id);

-- Create baby names table
CREATE TABLE public.baby_names (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('boy', 'girl', 'unisex')),
  origin TEXT,
  meaning TEXT,
  is_favorite BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for baby names
ALTER TABLE public.baby_names ENABLE ROW LEVEL SECURITY;

-- Create policies for baby names
CREATE POLICY "Users can manage their own baby names" 
ON public.baby_names 
FOR ALL 
USING (auth.uid() = user_id);

-- Create mood diary entries table
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for mood entries
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for mood entries
CREATE POLICY "Users can manage their own mood entries" 
ON public.mood_entries 
FOR ALL 
USING (auth.uid() = user_id);

-- Create medical records table
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('exam', 'appointment', 'vaccination', 'emergency')),
  title TEXT NOT NULL,
  week_number INTEGER,
  appointment_date DATE,
  doctor_name TEXT,
  location TEXT,
  notes TEXT,
  results TEXT,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for medical records
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Create policies for medical records
CREATE POLICY "Users can manage their own medical records" 
ON public.medical_records 
FOR ALL 
USING (auth.uid() = user_id);

-- Create weight records table
CREATE TABLE public.weight_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2),
  belly_circumference DECIMAL(5,2),
  week_number INTEGER NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_number)
);

-- Enable RLS for weight records
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;

-- Create policies for weight records
CREATE POLICY "Users can manage their own weight records" 
ON public.weight_records 
FOR ALL 
USING (auth.uid() = user_id);

-- Create baby letters table
CREATE TABLE public.baby_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  letter_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for baby letters
ALTER TABLE public.baby_letters ENABLE ROW LEVEL SECURITY;

-- Create policies for baby letters
CREATE POLICY "Users can manage their own baby letters" 
ON public.baby_letters 
FOR ALL 
USING (auth.uid() = user_id);

-- Create shopping list items table
CREATE TABLE public.shopping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_essential BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  custom_item BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for shopping items
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Create policies for shopping items
CREATE POLICY "Users can manage their own shopping items" 
ON public.shopping_items 
FOR ALL 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();