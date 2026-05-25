# Signet — UI Style Direction

## Design Philosophy

Signet is a tool built for moments that matter. Weddings. Conferences. Meetups. Private gatherings. The people using it are not designers — but they want their event to feel designed.

The app's visual language reflects this. It is warm, confident, and considered. It does not shout. It does not perform. It creates the conditions for the pass — the actual product — to be the hero.

Every decision in this document serves one goal:
**The pass looks beautiful. The app gets out of the way.**

---

## Visual Mood

Clean. Warm. Purposeful.

Not startup-flashy. Not corporate-cold. Not vibe-coded generic.

Think of a well-designed invitation. The paper has weight. The type is considered. There is breathing room. Nothing is decorative for its own sake. Everything earns its place.

References: Stripe, Resend, Linear — but warmer. More human.

---

## Color System

Three colors. One role each. Nothing more.

---

### Dominant — Deep Slate
**Hex:** `#1C1C1E`

The foundation. Used for navigation, headings, key UI chrome, and anywhere the app needs to feel grounded and authoritative.

Not pure black. The warmth in this slate keeps it from feeling harsh.

**Used on:**
- Sidebar background
- Primary headings (H1, H2)
- Footer background
- Pass preview chrome
- Secondary button border and text
- Icon strokes

---

### Accent — Warm Amber
**Hex:** `#E8A020`

One accent. Used sparingly and with intention. Every time amber appears it means something — it is asking the user to act.

Not orange. Not neon yellow. Warm, controlled, and purposeful. The color of candlelight. Of a wax seal. Of occasion.

**Used ONLY on:**
- Primary CTA buttons (one per screen maximum)
- Active sidebar navigation left border indicator
- QR code border on the pass
- VIP ticket type badge

**Never used on:**
- Backgrounds
- Decorative elements
- Tabs or toggles
- More than one button per screen

---

### Neutral — Soft Stone
**Hex:** `#F5F4F0`

Warm off-white. The page breathes here. Not pure white — the warmth prevents the UI from feeling clinical.

**Used on:**
- Page background (never pure white #FFFFFF for page bg)
- Form input area backgrounds
- Secondary card surfaces
- Pass preview panel background
- Empty state backgrounds

---

### Supporting — Functional Colors Only

These are not brand colors. They exist only for system feedback.

| Role | Hex | Used for |
|---|---|---|
| Success | `#2D7A4F` | Valid scan, success toast, Checked In badge |
| Error | `#C0392B` | Invalid scan, error states, destructive button |
| Success bg | `#F0FAF4` | Checked In badge background, success states |
| Error bg | `#FDF2F2` | Error banner background, destructive hover |
| Text primary | `#1C1C1E` | All primary body and heading text |
| Text secondary | `#6B6B6B` | Labels, captions, helper text |
| Text tertiary | `#9A9A9A` | Placeholder text, disabled states |
| White | `#FFFFFF` | Card surfaces, pass body, modal backgrounds |
| Border | `#E4E3DF` | Input borders, card borders, dividers |
| Row hover | `#FAFAF8` | Table row hover state |
| Sidebar hover | `#2C2C2A` | Sidebar link hover and active background |

---

## Typography

Two typefaces. One for personality. One for function. Never uniform.

---

### Display — Instrument Serif
**Weight:** Italic only

**Used on:**
- App logo wordmark — "Signet"
- Landing page hero headline
- Large event name on the pass itself
- Empty state headline

**Why:** Adds warmth and personality. Breaks the monotony of all-sans interfaces. Creates immediate hierarchy. Connects to the idea of a signet — something historical, considered, and weighted. Nobody in the competitor space is using a serif.

---

### UI & Body — Geist
**Weights:** 400 (regular) and 500 (medium) only. Never bold. Never light.

**Used on:**
- All navigation items
- All button labels
- All form labels and inputs
- Body text and descriptions
- Dashboard data and stats
- Attendee list
- Pass details (date, venue, ticket type, pass number)
- Captions, helper text, error messages

**Why:** Designed specifically for interfaces. Clean without being Inter-generic. Holds personality at small sizes.

---

### Type Scale

| Role | Typeface | Size | Weight | Line Height |
|---|---|---|---|---|
| Hero | Instrument Serif Italic | 56px | Italic | 1.1 |
| H1 | Geist | 32px | 500 | 1.2 |
| H2 | Geist | 24px | 500 | 1.3 |
| H3 | Geist | 18px | 500 | 1.4 |
| Body | Geist | 15px | 400 | 1.6 |
| Label | Geist | 13px | 500 | 1.4 |
| Caption | Geist | 12px | 400 | 1.5 |
| Button | Geist | 14px | 500 | 1 |
| Section eyebrow | Geist | 11px | 500 | 1 — letter-spacing 2px uppercase |

---

## Spacing System

Base unit: **8px**
All spacing is multiples of 8. No exceptions.

| Token | Value | Used for |
|---|---|---|
| xs | 4px | Icon to label gaps |
| sm | 8px | Component internal padding |
| md | 16px | Between related elements |
| lg | 24px | Between sections within a card |
| xl | 40px | Between major page sections |
| 2xl | 64px | Page-level breathing room |
| 3xl | 96px | Hero sections |

White space is not empty space. It creates grouping, hierarchy, and breathing room. Elements that belong together sit closer. Elements that are separate have room between them. Proximity creates grouping — not borders or dividers.

---

## Button System

Three button types. One role each.

---

### Primary Button
The most important action on any screen. Maximum ONE per screen.

```
Background:    #E8A020
Text:          #1C1C1E  (never white on amber)
Border:        none
Border radius: 8px
Padding:       12px 24px
Font:          Geist 500 14px
Hover bg:      #D4911A
Transition:    150ms
```

**Used for:** Create Event, Generate Passes, Get Started, Sign In, Create Account, Get Started Free.

---

### Secondary Button
Supporting actions. Always outlined. Never filled. Never competes with primary.

```
Background:    transparent  (always — never filled)
Border:        1.5px solid #1C1C1E
Text:          #1C1C1E
Border radius: 8px
Padding:       12px 24px
Font:          Geist 500 14px
Hover bg:      #FAFAF8
Transition:    150ms
```

**Used for:** Next step, Back, Download, Save Changes, Send Emails, Copy Link, Add Attendee, Download CSV Template.

---

### Ghost Button
Lowest priority. Quiet. Does not draw attention.

```
Background:    transparent
Border:        none
Text:          #6B6B6B
Font:          Geist 400 14px
Hover text:    #1C1C1E
Transition:    150ms
```

**Used for:** Cancel, Sign out, Copy Scan Link, View, Open Scanner, Back navigation.

---

### Destructive Button
Only for dangerous irreversible actions.

```
Background:    transparent
Border:        1.5px solid #C0392B
Text:          #C0392B
Border radius: 8px
Padding:       12px 24px
Font:          Geist 500 14px
Hover bg:      #FDF2F2
Transition:    150ms
```

**Used for:** Delete Account only.

---

### Scanner Screen Button (special case)
Only on the green/red scan result screens — sits on a colored background.

```
Background:    transparent
Border:        1.5px solid white
Text:          white
Border radius: 8px
Padding:       14px 48px
Font:          Geist 500 14px
```

**Used for:** "Scan Next" only.

---

## Component Style

### Cards
```
Background:    #FFFFFF
Border:        1px solid #E4E3DF
Border radius: 12px
Padding:       24px
Shadow:        none — ever
Hover border:  #1C1C1E  (on clickable cards)
Transition:    150ms
```

### Form Inputs
```
Background:    #FFFFFF
Border:        1.5px solid #E4E3DF
Border radius: 8px
Height:        44px
Padding:       0 16px
Font:          Geist 400 15px
Placeholder:   #9A9A9A
Focus border:  1.5px solid #1C1C1E  (no glow, no colored outline)
Error border:  1.5px solid #C0392B
Label:         Geist 500 13px #1C1C1E — always above input
Helper text:   Geist 400 12px #6B6B6B — below input
Error text:    Geist 400 12px #C0392B — below input
```

Fields always stack vertically — row by row. Never two fields side by side.

### Ticket Type Badges
```
Border radius: 100px  (fully rounded pill)
Padding:       3px 10px
Font:          Geist 500 12px
```

| Type | Background | Text |
|---|---|---|
| General | `#F5F4F0` | `#6B6B6B` |
| VIP | `#E8A020` | `#1C1C1E` |
| Speaker | `#1C1C1E` | `#FFFFFF` |
| Custom | `#F5F4F0` | `#6B6B6B` |

### Pass Status Badges
```
Border radius: 100px
Padding:       3px 10px
Font:          Geist 500 11px
```

| Status | Background | Text |
|---|---|---|
| Not Sent | `#F5F4F0` | `#9A9A9A` |
| Sent | `#F0FAF4` | `#2D7A4F` |
| Checked In | `#1C1C1E` | `#FFFFFF` |
| Not Arrived | `#F5F4F0` | `#9A9A9A` |
| Active | `#F0FAF4` | `#2D7A4F` |
| Completed | `#F5F4F0` | `#9A9A9A` |

### Sidebar Navigation
```
Background:        #1C1C1E
Width:             240px fixed
Logo:              Instrument Serif Italic white 18px
Nav links:         Geist 400 14px #9A9A9A
Active link:       Geist 500 14px #FFFFFF
                   2px left border #E8A020
                   Background #2C2C2A
Hover:             Background #2C2C2A  color #FFFFFF  150ms
Icon size:         20px  stroke 1.5px  no fill
Bottom section:    user name Geist 500 13px white
                   user email Geist 400 12px #6B6B6B
                   sign out ghost link
```

### Toast Notifications
```
Background:    #1C1C1E
Text:          #FFFFFF  Geist 400 14px
Border radius: 8px
Padding:       12px 16px
Position:      fixed top right  margin 24px
Animation:     slide in from right  250ms ease-out
Dismiss:       auto after 3 seconds
```

### Pass Preview Panel (right panel in create event flow)
```
Background:    #F5F4F0
Pass card:     #FFFFFF  1px border #E4E3DF  12px border radius
QR border:     2px solid #E8A020
No shadow on pass card
Label below:   "Live Preview"  Geist 400 12px #9A9A9A  centered
```

### Scanner Screen (mobile)
```
Background:    #1C1C1E  full screen
Viewfinder:    four corner marks only — not a full border
               20px lines  2px solid white  4px corner radius
               Width: min(260px, 70vw)  square
```

### Scan Result Screens (mobile)
```
Valid:         #2D7A4F  full screen  white text
Already Used:  #C0392B  full screen  white text
Invalid:       #C0392B  full screen  white text
Animation:     color floods from center  300ms ease-out
```

---

## Logo Mark

A geometric wax seal — an octagon outline with a minimal S letterform inside.

```
Shape:         octagon  stroke 1.5px  no fill
Interior:      S letterform  stroke 1.5px  no fill
Size:          24x24px in sidebar and nav
               32x32px on landing page
Color:         white on dark backgrounds
               #1C1C1E on light backgrounds
Pairing:       [mark] + "Signet" in Instrument Serif Italic
Gap:           8px between mark and wordmark
```

Applied to: sidebar top, landing page nav, sign in/up cards, scanner screen bottom, footer.

---

## Animation System

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Page load | fade + 4px upward translate | 200ms | ease-out |
| Card hover | border to #1C1C1E | 150ms | linear |
| Primary button hover | bg to #D4911A | 150ms | linear |
| Pass preview update | smooth transition | 200ms | ease |
| Pass card flip (new attendee) | rotateY perspective | 400ms | ease |
| Scan result flood | color from center | 300ms | ease-out |
| Attendee row add | slide in from top | 200ms | ease-out |
| Toast notification | slide in from right | 250ms | ease-out |
| Sidebar mobile overlay | slide from left | 250ms | ease-out |
| Step progress fill | width transition | 300ms | ease-out |
| Inline confirmation | fade in | 150ms | ease |
| Regenerate bar dismiss | fade out | 150ms | ease |

All animations are subtle and purposeful. Nothing decorative. Nothing that delays the user.

---

## Layout Principles

**Desktop-first.**
All organiser flows designed at 1280px minimum width. Mobile is a responsive adaptation — not the primary design target. Exception: scanner and scan result screens are mobile-only.

**Proximity creates grouping.**
Elements that belong together sit close. Elements that are separate have breathing room. Spacing alone creates separation — not borders or dividers when avoidable.

**Hierarchy through scale and weight.**
Not through color. Eye moves from most important to least important driven by size and weight difference — not by making things bright or loud.

**White space is a design element.**
Generous padding inside cards. Generous margins between sections. A crowded interface signals a product that has not decided what matters.

**The pass is always visible.**
On the event branding and attendee screens, the pass preview is always on screen. The organiser is never working blind.

**One primary action per screen.**
Only one amber button per screen at any time. Everything else is secondary or ghost. The user always knows what the most important next step is.

**Forms always stack vertically.**
Never two fields side by side. One field per row. Full width. Always.

---


