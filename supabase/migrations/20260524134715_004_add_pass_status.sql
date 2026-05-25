/*
  # Add pass_status column to attendees

  1. Adds a `pass_status` column to the attendees table
    - Default: 'not_sent'
    - Values: 'not_sent', 'sent', 'checked_in'
    - 'not_sent' — pass has been generated but not shared
    - 'sent' — pass has been emailed or link copied
    - 'checked_in' — attendee has been scanned at the door

  2. Updates existing attendees
    - Those with status 'used' get pass_status 'checked_in'
    - All others get 'not_sent'

  3. Enables realtime for attendees table
*/

ALTER TABLE attendees ADD COLUMN IF NOT EXISTS pass_status text NOT NULL DEFAULT 'not_sent';

-- Update existing attendees
UPDATE attendees SET pass_status = 'checked_in' WHERE status = 'used';

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE attendees;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
