-- Create tables for social features

-- Comments table for photos and posts
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
  timeline_event_id UUID REFERENCES public.timeline_events(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  
  -- Ensure comment belongs to either a photo or timeline event
  CONSTRAINT comments_content_check CHECK (
    (photo_id IS NOT NULL AND timeline_event_id IS NULL) OR 
    (photo_id IS NULL AND timeline_event_id IS NOT NULL)
  )
);

-- Likes table for photos, timeline events and comments
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
  timeline_event_id UUID REFERENCES public.timeline_events(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure like belongs to only one item
  CONSTRAINT likes_content_check CHECK (
    (photo_id IS NOT NULL AND timeline_event_id IS NULL AND comment_id IS NULL) OR
    (photo_id IS NULL AND timeline_event_id IS NOT NULL AND comment_id IS NULL) OR
    (photo_id IS NULL AND timeline_event_id IS NULL AND comment_id IS NOT NULL)
  ),
  
  -- Prevent duplicate likes from same user on same item
  CONSTRAINT unique_user_photo_like UNIQUE (user_id, photo_id),
  CONSTRAINT unique_user_timeline_like UNIQUE (user_id, timeline_event_id), 
  CONSTRAINT unique_user_comment_like UNIQUE (user_id, comment_id)
);

-- Family messages table for private family communication
CREATE TABLE public.family_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'photo', 'voice')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Users can view comments on their own content"
ON public.comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.photos p WHERE p.id = comments.photo_id AND p.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.timeline_events t WHERE t.id = comments.timeline_event_id AND t.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.family_members f 
    WHERE f.user_id = auth.uid() AND f.email = (
      SELECT u.email FROM auth.users u 
      JOIN public.photos p ON p.user_id = u.id 
      WHERE p.id = comments.photo_id
      UNION
      SELECT u.email FROM auth.users u 
      JOIN public.timeline_events t ON t.user_id = u.id 
      WHERE t.id = comments.timeline_event_id
    )
  )
);

CREATE POLICY "Family members can create comments"
ON public.comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (
      SELECT 1 FROM public.photos p WHERE p.id = comments.photo_id AND p.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.timeline_events t WHERE t.id = comments.timeline_event_id AND t.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.family_members f 
      WHERE f.user_id = auth.uid() AND f.email = (
        SELECT u.email FROM auth.users u 
        JOIN public.photos p ON p.user_id = u.id 
        WHERE p.id = comments.photo_id
        UNION
        SELECT u.email FROM auth.users u 
        JOIN public.timeline_events t ON t.user_id = u.id 
        WHERE t.id = comments.timeline_event_id
      )
    )
  )
);

CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for likes  
CREATE POLICY "Users can view likes on their content"
ON public.likes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.photos p WHERE p.id = likes.photo_id AND p.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.timeline_events t WHERE t.id = likes.timeline_event_id AND t.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.comments c WHERE c.id = likes.comment_id AND c.user_id = auth.uid()
  ) OR
  auth.uid() = user_id
);

CREATE POLICY "Family members can manage likes"
ON public.likes
FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for family messages
CREATE POLICY "Users can view their own messages"
ON public.family_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages to family members"
ON public.family_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.family_members f 
    WHERE f.user_id = auth.uid() AND f.email = (
      SELECT email FROM auth.users WHERE id = family_messages.recipient_id
    )
  )
);

CREATE POLICY "Users can update their own messages"
ON public.family_messages
FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Add update triggers
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_messages_updated_at
BEFORE UPDATE ON public.family_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();