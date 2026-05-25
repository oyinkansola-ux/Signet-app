/*
  # Create storage bucket and policies for banner images

  1. Creates 'banners' storage bucket
  2. Adds RLS policies for authenticated users to upload and read banners
*/

-- Create banners storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload banners
CREATE POLICY "Users can upload banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Anyone can view banners (public bucket)
CREATE POLICY "Public read banners"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'banners');

-- Policy: Users can update their own banners
CREATE POLICY "Users can update own banners"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own banners
CREATE POLICY "Users can delete own banners"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
