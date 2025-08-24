-- Create storage policies for avatars in photos bucket
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1] AND (storage.foldername(name))[2] = 'avatars');

CREATE POLICY "Users can view their own avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1] AND (storage.foldername(name))[2] = 'avatars');

CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1] AND (storage.foldername(name))[2] = 'avatars');

CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1] AND (storage.foldername(name))[2] = 'avatars');