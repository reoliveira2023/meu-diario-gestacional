-- Create table for user preferences and customization
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_colors JSONB DEFAULT '{"primary": "340 35% 75%", "secondary": "280 20% 88%", "accent": "180 25% 85%"}',
  notification_time TIME DEFAULT '09:00:00',
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_frequency TEXT DEFAULT 'daily',
  avatar_url TEXT,
  preferred_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own preferences"
ON public.user_preferences
FOR ALL
USING (auth.uid() = user_id);

-- Create reminders table
CREATE TABLE public.daily_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'mood', 'weight', 'photo', 'medical', 'general'
  title TEXT NOT NULL,
  description TEXT,
  scheduled_time TIME NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  reminder_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own reminders"
ON public.daily_reminders
FOR ALL
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_reminders_updated_at
BEFORE UPDATE ON public.daily_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();