-- Create avatars storage bucket
-- Run this SQL in your Supabase SQL Editor

-- Insert the avatars bucket into storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy to allow users to view all avatars (since they're public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Create policy to allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
