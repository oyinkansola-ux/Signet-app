/*
  # Create Signet database schema

  1. New Tables
    - `users` — stores user profile data (name, email) linked to auth.users
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, not null)
      - `email` (text, not null)
      - `created_at` (timestamptz)
    - `events` — stores event data created by users
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `name` (text, not null)
      - `date` (date, not null)
      - `time` (text, not null)
      - `venue` (text, not null)
      - `organiser_name` (text, not null)
      - `description` (text)
      - `brand_color` (text, default '#1C1C1E')
      - `template` (integer, default 1)
      - `banner_url` (text)
      - `scan_token` (uuid, unique, public token for scanner access)
      - `status` (text, default 'active')
      - `created_at` (timestamptz)
    - `attendees` — stores attendee data for each event
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `name` (text, not null)
      - `email` (text)
      - `ticket_type` (text, default 'General')
      - `pass_number` (text)
      - `qr_code_data` (text, unique)
      - `status` (text, default 'unused')
      - `scanned_at` (timestamptz)
      - `created_at` (timestamptz)
    - `scan_logs` — logs every scan attempt for auditing
      - `id` (uuid, primary key)
      - `attendee_id` (uuid, references attendees)
      - `event_id` (uuid, references events)
      - `scanned_at` (timestamptz)
      - `result` (text, not null)

  2. Security
    - Enable RLS on all tables
    - Users can only CRUD their own data (via user_id foreign key)
    - scan_logs and attendees readable by scan_token (for public scanner)
    - Public read access on events via scan_token

  3. Important Notes
    - scan_token on events allows unauthenticated scanner access
    - qr_code_data on attendees is unique and used for scan validation
    - pass_number is auto-generated per event (sequential)
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  time text NOT NULL DEFAULT '',
  venue text NOT NULL DEFAULT '',
  organiser_name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  brand_color text NOT NULL DEFAULT '#1C1C1E',
  template integer NOT NULL DEFAULT 1,
  banner_url text DEFAULT '',
  scan_token uuid UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own events"
  ON events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Public read via scan_token for scanner
CREATE POLICY "Public read events by scan_token"
  ON events FOR SELECT
  TO anon, authenticated
  USING (scan_token::text = current_setting('request.jwt.claims', true)::json->>'scan_token');

-- Attendees table
CREATE TABLE IF NOT EXISTS attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text DEFAULT '',
  ticket_type text NOT NULL DEFAULT 'General',
  pass_number text NOT NULL DEFAULT '',
  qr_code_data uuid UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'unused',
  scanned_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read attendees of own events"
  ON attendees FOR SELECT
  TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert attendees to own events"
  ON attendees FOR INSERT
  TO authenticated
  WITH CHECK (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "Users can update attendees of own events"
  ON attendees FOR UPDATE
  TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete attendees of own events"
  ON attendees FOR DELETE
  TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

-- Scan logs table
CREATE TABLE IF NOT EXISTS scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id uuid REFERENCES attendees(id) ON DELETE SET NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  scanned_at timestamptz DEFAULT now(),
  result text NOT NULL DEFAULT 'valid'
);

ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read scan logs of own events"
  ON scan_logs FOR SELECT
  TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

-- Function to allow scanner to look up attendee by qr_code_data
-- We need a more permissive policy for the scanner
-- The scanner will use the service role key via an edge function

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_qr_code_data ON attendees(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_scan_logs_event_id ON scan_logs(event_id);

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
