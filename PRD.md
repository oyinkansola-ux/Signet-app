# Signet — Product Requirements Document

## Overview

**Product Name:** Signet
**Type:** Web Application
**Version:** 1.0 MVP
**Last Updated:** May 2026

Signet is a lightweight web application that allows event organisers to generate branded digital event passes with scannable QR codes. It is designed for small and medium-sized events — meetups, weddings, workshops, conferences, and private gatherings — where organisers need professional-looking passes without advanced design or technical skills.

The name Signet is derived from the historical signet seal — a mark pressed to authenticate and validate. Every pass Signet generates is a seal of authenticity. Proof that someone is expected, that they belong, that their entry is real.

---

## The Problem

Small and medium event organisers face a gap in the market:

- **Eventbrite** is too large, too corporate, and produces generic ugly tickets
- **Luma** handles RSVPs well but has no branded pass generation or door scanning
- **Canva** produces beautiful designs but has no QR generation or attendee management
- **PassKit** is a developer tool — not accessible to non-technical organisers

The result: organisers either send plain text confirmations, manually design passes one at a time in Canva, or use nothing at all. Their events look unfinished before they even begin.

---

## The Solution

Signet sits in the gap between all of them.

Design quality of Canva + simplicity of Luma + QR functionality of Eventbrite — in one lightweight tool built for organisers who want their event to feel real and considered.

**Core value proposition:**
*Generate beautiful, branded, scannable event passes in minutes. No design skills required.*

---

## Target Users

**Primary:** Small and medium event organisers
- Tech meetup hosts
- Wedding planners and couples
- Workshop and masterclass facilitators
- Conference and summit organisers
- Private party and gathering hosts

**Geography:** Nigeria-first, globally applicable

**Technical level:** Non-technical. The product must work without any learning curve.

---

## User Persona

**Temi** — Lagos-based community organiser
Running a tech meetup for 80 people. Needs passes that look professional, carry each person's name and ticket type, include a scannable QR code, and can be sent out quickly. Has no design software. Has no developer on her team. Has a deadline.

---

## User Journey

```
Landing Page
    ↓
Sign Up / Sign In
    ↓
Dashboard (all events)
    ↓
Create New Event — Step 1: Event Details
    ↓
Create New Event — Step 2: Branding (color, template, banner)
    ↓
Create New Event — Step 3: Add Attendees (manual or CSV)
    ↓
Generate All Passes
    ↓
Download (PNG / PDF) or Email Passes
    ↓
Share Passes with Attendees
    ↓
Scan at Door (Verify Mode — scan-only link)
    ↓
Track Attendance in Dashboard
```

---

## Core Features

### 1. Authentication
- Sign up with full name, email, and password
- Sign in with email and password
- Any user can create an account — not scoped to demo credentials
- Session persistence — user can close the tab and return to their dashboard
- All data is scoped to the authenticated user only
- Optional — a user can preview the landing page without an account but must sign in to create events and manage attendees

### 2. Event Creation
Users provide:
- Event name
- Event date and time
- Venue / location
- Organiser name / organisation
- Optional event description

The event is saved as a record in the dashboard. It can be edited at any time.

### 3. Event Branding
Users customise:
- **Brand color** — one primary color applied across the pass (header, QR border, badge accents). Chosen from 12 curated swatches or a custom hex input.
- **Pass template** — three layout options:
  - **Boarding Pass** — horizontal layout, event name prominent, QR code right-aligned with dashed center divider
  - **Minimal Stripe** — bold color stripe header, clean white body, information stacked, QR at bottom
  - **Bold Banner** — brand color fills top half, white body below with QR and info
- **Optional banner/cover image** — uploaded by the organiser, used as a header element
- Real-time preview updates on the right panel as the organiser makes changes

### 4. Attendee Management
Two methods of adding attendees:

**Manual Entry**
- Attendee name (required)
- Attendee email (optional — used for emailing the pass)
- Ticket / pass type (General / VIP / Speaker / Custom)
- Add one at a time
- Each row slides into the attendee list with animation

**CSV Bulk Upload**
- Organiser downloads a CSV template from the app
- Fills in: name, email, ticket type
- Uploads the file
- App reads all rows and populates the attendee list instantly
- Success and error states clearly shown

### 5. Pass Generation
Each generated pass includes:
- Event name (Instrument Serif Italic)
- Event date, time, and venue
- Organiser details
- Attendee name
- Ticket / pass type badge
- Unique QR code tied to that specific attendee only
- Pass number / ID (e.g. #0042)
- Brand color applied across the pass
- Optional banner image

### 6. Pass Download and Sharing
- Download individual pass as **PNG** — best for WhatsApp and image sharing
- Download individual pass as **PDF** — best for printing or email attachments
- Download all passes as ZIP (PNG or PDF)
- Email pass directly to attendee's email address (if provided)
- Copy individual pass links
- Copy scan-only link for door person

### 7. QR Verification — Scanner Mode

**How it works:**
Temi generates a unique scan-only link for her event — for example `signet.app/scan/event-abc123`. She shares this link with whoever is managing the door via WhatsApp or any channel. The door person opens the link on their phone browser — no account, no login, no app download required. The link opens directly into Scanner Mode — full screen camera view. The door person points their phone at the attendee's pass (PNG or PDF on the attendee's phone screen). The app reads the QR code and shows the result instantly.

**What the attendee needs:**
Just their pass image — PNG or PDF received via WhatsApp or email. No app. No account. Just open the image and show the screen.

**The scan-only link is scoped to one event only.** The door person cannot see the organiser's dashboard, other events, or any organiser data.

**Verification states:**
- **Valid** — Full green screen. Attendee name and ticket type shown clearly. First-time scan confirmed.
- **Already Used** — Full red screen. "This pass has already been scanned." Timestamp of original scan shown.
- **Invalid** — Full red screen. "This QR code is not recognised."
- **VIP** — Full green screen with VIP badge highlighted prominently. Door person knows immediately.

Each scan result is logged automatically and reflected in real time on the organiser's Attendance Dashboard.

### 8. Pass Status Indicators
Every pass has a status that updates in real time:

- **Not Sent** — pass generated but not yet shared with attendee
- **Sent** — pass emailed or link copied
- **Checked In** — QR scanned successfully at the door

Status is visible:
1. On each pass card in the pass generation grid — badge top right corner
2. On each attendee row in the Event Overview attendees table
3. On the dashboard event list — overall event status (Active / Completed)

### 9. Attendance Dashboard
After passes are scanned, the organiser sees:
- Total attendees
- Total checked in
- Total not yet arrived
- Per-attendee status: name, ticket type, checked in / not arrived, timestamp
- Updates in real time via Supabase realtime subscription

### 10. Pass Regeneration and Editing
- Organiser can edit any attendee's details inline — no modal
- Organiser can regenerate a pass for any attendee (if they lost it) — inline confirmation, no modal
- Regenerating a pass invalidates the old QR code instantly and issues a new one
- Download link for new pass appears inline on confirmation

### 11. Multi-Event Management
- Organiser can create unlimited events
- All events visible on the Events page with search and filter
- Each event is completely separate — own attendees, passes, and scan link
- Filter by: All / Active / Completed

---

## Pass Templates

### Template 1: Boarding Pass
- Horizontal layout
- Left side: event name (Instrument Serif Italic), date, venue, organiser, attendee name, ticket type badge
- Right side separated by dashed vertical divider: large QR code, pass number
- Brand color applied as header bar at top
- Clean white body

### Template 2: Minimal Stripe
- Vertical layout
- Bold color stripe at top using brand color
- Event name in white on the stripe
- White body below: attendee name, ticket type, date, venue, QR code at bottom
- Minimal, structured

### Template 3: Bold Banner
- Vertical layout
- Brand color fills top 40% with event name and organiser in white
- White body: attendee name, ticket type badge, date, venue
- QR code at bottom with brand color border

---

## Screen List

1. Landing Page
2. Sign Up
3. Sign In
4. Dashboard — New User Empty State
5. Dashboard — Existing User
6. Create Event — Step 1: Event Details
7. Create Event — Step 2: Branding (with live pass preview)
8. Create Event — Step 3: Add Attendees (manual + CSV)
9. Create Event — Step 4: Generate
10. Pass Generation & Download
11. Event Overview — Attendees Tab
12. Event Overview — Passes Tab
13. Events Page (all events, search, filter)
14. Edit Event
15. Scanner Mode (mobile — scan-only link, no auth)
16. Scan Result Screen (mobile — valid / used / invalid / VIP)
17. Settings

---

## Layout Approach

**Desktop-first.** All organiser flows — event creation, branding, attendee management, and the dashboard — are designed for desktop at 1280px+.

**Mobile-critical screens:** The scanner and scan result screens are designed exclusively for mobile. These must be perfect on any phone.

**Responsive:** All other screens are responsive and functional on mobile. The create event two-panel layout collapses to single column on mobile with a floating "Preview Pass" button that opens a bottom sheet showing the live pass preview.

---

## Technical Requirements

### Frontend
- React + TypeScript
- Tailwind CSS
- React Router for routing
- Zustand or React Context for global state
- react-qr-code: QR code generation
- html2canvas: PNG export
- jsPDF + html2canvas: PDF export
- papaparse: CSV parsing
- html5-qrcode: camera QR scanning on scanner screen

### Backend / Database
- Supabase: authentication, database, file storage
- Supabase Realtime: live attendance updates

### Routes
Public: / · /signin · /signup · /scan/:scan_token
Protected: /dashboard · /events · /events/new · /events/:id · /events/:id/edit · /settings

### Data Model

**users**
id, name, email, created_at

**events**
id, user_id, name, date, time, venue, organiser_name, description, brand_color, template (1/2/3), banner_url, scan_token (unique public uuid), created_at

**attendees**
id, event_id, name, email, ticket_type, pass_number, qr_code_data, status (not_sent/sent/checked_in), scanned_at, created_at

**scan_logs**
id, attendee_id, event_id, scanned_at, result (valid/already_used/invalid)

---

## Non-Functional Requirements

- Desktop-first. Organiser flows optimised for laptop/desktop.
- Scanner screen perfect on any mobile phone.
- All other screens responsive on mobile.
- No emojis in the UI.
- No decorative gradients, glow effects, or neon colors.
- The pass is the hero. The app frames it — not competes with it.
- Load time under 3 seconds on a standard Nigerian mobile connection.
- All user data scoped to authenticated user only.
- One primary CTA button per screen maximum.

---

## Out of Scope for v1.0

- Dark mode (light mode only for v1.0)
- Apple Wallet / Google Wallet integration
- Payment / ticketing (paid events)
- Custom domain for event pages
- Multi-organiser teams
- WhatsApp API integration (organiser shares passes manually)
- Recurring events

---

## Success Metrics

- Organiser can create an event and generate passes in under 5 minutes
- Pass looks professional enough to screenshot and share
- QR scan gives a result in under 2 seconds
- Zero confusion on the attendee management screen

---

## Deliverables

- [x] PRD.md (this document)
- [x] styles.md
- [ ] Live link to the application
- [ ] GitHub repository link
- [ ] Demo credentials for testing
- [ ] Social media post showcasing the live product

---

## Demo Credentials

Any new account created through sign up works identically to the demo account.
