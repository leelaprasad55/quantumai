-- ==========================================
-- QUANTUMLEARN AI - AVATAR STORAGE CONFIG
-- ==========================================

-- 1. Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies
-- Allow public access to view avatars
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Allow users to insert their own avatars in folder <user_id>/
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
