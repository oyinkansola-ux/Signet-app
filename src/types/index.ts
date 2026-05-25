export interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  organiser_name: string;
  description: string;
  brand_color: string;
  template: number;
  banner_url: string;
  scan_token: string;
  status: string;
  created_at: string;
}

export interface Attendee {
  id: string;
  event_id: string;
  name: string;
  email: string;
  ticket_type: string;
  pass_number: string;
  qr_code_data: string;
  status: string;
  scanned_at: string | null;
  created_at: string;
}

export interface ScanLog {
  id: string;
  attendee_id: string | null;
  event_id: string;
  scanned_at: string;
  result: string;
}

export type TicketType = 'General' | 'VIP' | 'Speaker' | 'Custom';
