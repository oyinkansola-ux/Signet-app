/*
  # Seed demo data for Signet

  1. Creates the demo user account
    - Email: temi@signet.app
    - Password: Signet2026
    - Name: Temi Adeyemi

  2. Creates a sample event
    - "Lagos Tech Meetup Vol. 3"
    - Date: May 30, 2026, Time: 4:00 PM
    - Venue: The Hive, Victoria Island, Lagos
    - Organiser: TechHub Lagos
    - Brand color: #1C1C1E, Template: 1

  3. Creates five sample attendees
    - Chidi Okonkwo (VIP, used)
    - Amara Nwosu (General, used)
    - Dami Adeleke (Speaker, used)
    - Kemi Balogun (General, unused)
    - Seun Fashola (General, unused)
*/

-- Create demo user via auth.users (the trigger will auto-create in public.users)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'temi@signet.app',
  crypt('Signet2026', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Temi Adeyemi"}'
);

-- Update the public.users record with the correct name
UPDATE public.users
SET name = 'Temi Adeyemi', email = 'temi@signet.app'
WHERE email = 'temi@signet.app';

-- Get the user id for creating the event
DO $$
DECLARE
  demo_user_id uuid;
  demo_event_id uuid;
BEGIN
  SELECT id INTO demo_user_id FROM public.users WHERE email = 'temi@signet.app';

  -- Create sample event
  INSERT INTO events (user_id, name, date, time, venue, organiser_name, description, brand_color, template, status)
  VALUES (
    demo_user_id,
    'Lagos Tech Meetup Vol. 3',
    '2026-05-30',
    '4:00 PM',
    'The Hive, Victoria Island, Lagos',
    'TechHub Lagos',
    'Monthly tech meetup for Lagos developers and designers.',
    '#1C1C1E',
    1,
    'active'
  ) RETURNING id INTO demo_event_id;

  -- Create sample attendees
  INSERT INTO attendees (event_id, name, email, ticket_type, pass_number, qr_code_data, status, scanned_at) VALUES
    (demo_event_id, 'Chidi Okonkwo', 'chidi@example.com', 'VIP', '0001', gen_random_uuid(), 'used', '2026-05-30T16:32:00'),
    (demo_event_id, 'Amara Nwosu', 'amara@example.com', 'General', '0002', gen_random_uuid(), 'used', '2026-05-30T16:18:00'),
    (demo_event_id, 'Dami Adeleke', 'dami@example.com', 'Speaker', '0003', gen_random_uuid(), 'used', '2026-05-30T16:05:00'),
    (demo_event_id, 'Kemi Balogun', 'kemi@example.com', 'General', '0004', gen_random_uuid(), 'unused', NULL),
    (demo_event_id, 'Seun Fashola', 'seun@example.com', 'General', '0005', gen_random_uuid(), 'unused', NULL);

  -- Create scan logs for used attendees
  INSERT INTO scan_logs (attendee_id, event_id, scanned_at, result)
  SELECT a.id, a.event_id, a.scanned_at, 'valid'
  FROM attendees a
  WHERE a.event_id = demo_event_id AND a.status = 'used';
END $$;
