# V1 Development Plan

**Document Date:** December 1, 2025  
**Event Date:** December 6-7, 2025  
**Reference:** [v1-doc.md](./v1-doc.md)

---

## Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT PHASES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 1: Schema & Auth ─────┬──► Phase 2: Admin Import                     │
│                              │                 │                             │
│                              │                 ├──► Phase 3: Participant UI  │
│                              │                 │                             │
│                              │                 └──► Phase 4: Credits Mgmt    │
│                              │                           │                   │
│                              │                           ▼                   │
│                              │              Phase 5: Registration Check-in   │
│                              │                           │                   │
│                              │         ┌─────────────────┴─────────────────┐ │
│                              │         │                                   │ │
│                              │         ▼                                   ▼ │
│                              │  Phase 6: Food Check-in      Phase 7: Email   │
│                              │         │                                   │ │
│                              │         └─────────────────┬─────────────────┘ │
│                              │                           ▼                   │
│                              │              Phase 8: Admin Dashboard         │
│                              │                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema & Authentication

**Status:** Not Started  
**Priority:** Critical  
**Estimated Effort:** 1 day  
**Dependencies:** None

### Tasks

- [ ] 1.1 Create hackathon schema files in `packages/core/src/hackathon.server/schemas/`
  - [ ] Enums: `user_role`, `participant_type`, `participant_status`, `code_status`, `meal_type`
  - [ ] `credit-types.sql.ts`
  - [ ] `codes.sql.ts`
  - [ ] `food-checkins.sql.ts`
  - [ ] `relations.ts`
  - [ ] `index.ts` (exports)

- [ ] 1.2 Extend `UsersTable` in `packages/core/src/auth/schema.ts`
  - [ ] Add `lumaId`, `role`, `participantType`, `status`, `checkedInAt`, `checkedInBy`, `qrCodeValue`
  - [ ] Add indexes

- [ ] 1.3 Generate and run migrations
  - [ ] `pnpm db:generate`
  - [ ] `pnpm db:migrate`

- [ ] 1.4 Configure Better Auth with magic link plugin
  - [ ] Add `magicLink` plugin to `auth.ts`
  - [ ] Configure `disableSignUp: true`
  - [ ] Add VIP login prevention in `sendMagicLink`

- [ ] 1.5 Update auth client with `magicLinkClient` plugin
  - [ ] Update `apps/web/src/utils/auth-client.ts`

- [ ] 1.6 Create QR code utilities in `packages/core/src/hackathon.server/`
  - [ ] `qr-code.ts` with `generateQRCodeValue()` and `verifyQRCodeValue()`

- [ ] 1.7 Add environment variables
  - [ ] `QR_SECRET_KEY` (min 32 chars)
  - [ ] `RESEND_API_KEY`

### Deliverable
- Migrations run successfully
- Magic link login flow works (email sending can be stubbed with console.log)
- QR code generation utility tested

---

## Phase 2: Admin - Participant Import

**Status:** Not Started  
**Priority:** Critical  
**Estimated Effort:** 0.5 day  
**Dependencies:** Phase 1

### Tasks

- [ ] 2.1 Create admin route layout with role guard
  - [ ] `apps/web/src/routes/admin/` directory
  - [ ] Role check middleware (redirect if not admin)

- [ ] 2.2 CSV upload component
  - [ ] File input with drag-drop
  - [ ] Preview parsed data

- [ ] 2.3 Participant import server function
  - [ ] Parse CSV (email, name, luma_id)
  - [ ] Validate format and duplicates
  - [ ] Bulk create users with `status: 'registered'`
  - [ ] Auto-generate QR code on creation

- [ ] 2.4 VIP manual creation form
  - [ ] Name + email input
  - [ ] Create with `participantType: 'vip'`

- [ ] 2.5 Participant list view
  - [ ] Basic table with name, email, status
  - [ ] Filter by type (regular/VIP)
  - [ ] Pagination

### Deliverable
- Admin can import 1000 participants from Luma CSV
- Admin can manually add VIPs
- QR codes auto-generated for all users

---

## Phase 3: Participant Dashboard

**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 1, Phase 2

### Tasks

- [ ] 3.1 Login page
  - [ ] Email input form
  - [ ] "Send magic link" button
  - [ ] Success state ("Check your email")
  - [ ] Error handling ("Email not registered")

- [ ] 3.2 Dashboard layout (mobile-first)
  - [ ] Header with name and logout
  - [ ] Status badge (registered/checked-in)

- [ ] 3.3 QR code display component
  - [ ] Large QR (300x300px minimum)
  - [ ] "This QR never expires" message
  - [ ] Instructions text

- [ ] 3.4 Pre-check-in state
  - [ ] "Check-in opens Dec 6, 9:00 AM" message
  - [ ] QR code visible

- [ ] 3.5 Post-check-in state
  - [ ] Credits list visible
  - [ ] "Checked in at [time]" badge

- [ ] 3.6 Credit card component
  - [ ] Sponsor icon/name
  - [ ] Code value with copy button
  - [ ] Redeem URL link
  - [ ] Expandable instructions

- [ ] 3.7 Mark as redeemed toggle
  - [ ] Checkbox per credit
  - [ ] Persist to database
  - [ ] Filter by status (all/redeemed/pending)

### Deliverable
- Participants can login via magic link
- See their QR code
- View and copy credit codes after check-in

---

## Phase 4: Admin - Credits Management

**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 0.5 day  
**Dependencies:** Phase 1

### Tasks

- [ ] 4.1 Credit type creation form
  - [ ] Name (internal key)
  - [ ] Display name
  - [ ] Email instructions
  - [ ] Web instructions (rich text)
  - [ ] Display order
  - [ ] Icon URL (optional)
  - [ ] Active toggle

- [ ] 4.2 Credit type list view
  - [ ] Table with all credit types
  - [ ] Edit/toggle active actions

- [ ] 4.3 Code CSV import per credit type
  - [ ] Select credit type
  - [ ] Upload CSV (code, redeem_url)
  - [ ] Preview and confirm
  - [ ] Duplicate detection

- [ ] 4.4 Code pool status display
  - [ ] Total codes per type
  - [ ] Assigned count
  - [ ] Remaining count
  - [ ] Visual indicator (green/yellow/red)

### Deliverable
- Admin can create 6 credit types (Cursor, Anthropic, etc.)
- Admin can import codes for each type
- Pool status visible

---

## Phase 5: Ops - Registration Check-in

**Status:** Not Started  
**Priority:** Critical  
**Estimated Effort:** 1.5 days  
**Dependencies:** Phase 1, Phase 2, Phase 4

### Tasks

- [ ] 5.1 Ops route layout with role guard
  - [ ] `apps/web/src/routes/ops/` directory
  - [ ] Role check (ops or admin)

- [ ] 5.2 QR scanner component
  - [ ] Camera access request
  - [ ] html5-qrcode integration
  - [ ] Viewfinder UI
  - [ ] Torch toggle for low light

- [ ] 5.3 QR validation server function
  - [ ] Decode base64url payload
  - [ ] Verify HMAC signature
  - [ ] Lookup participant

- [ ] 5.4 Check-in processing
  - [ ] Validate status is 'registered'
  - [ ] Update to 'checked_in'
  - [ ] Set `checkedInAt` and `checkedInBy`

- [ ] 5.5 Code assignment algorithm
  - [ ] Transaction with row-level locking
  - [ ] Assign one code per active credit type
  - [ ] Handle pool exhaustion gracefully
  - [ ] Return assigned codes list

- [ ] 5.6 Success/error display
  - [ ] Large success message with participant name
  - [ ] Code count assigned
  - [ ] Error message if already checked in
  - [ ] Auto-dismiss after 3 seconds

- [ ] 5.7 Check-in counter
  - [ ] Real-time count of checked-in today
  - [ ] Refresh on each scan

- [ ] 5.8 Recent scans history
  - [ ] Last 10 scans
  - [ ] Name, time, status (success/error)

- [ ] 5.9 VIP badge display
  - [ ] Show "VIP" badge when scanning VIP
  - [ ] Different success message (no codes)

### Deliverable
- Ops can scan QR codes
- Participants checked in with codes assigned
- Real-time feedback and counters

---

## Phase 6: Ops - Food Check-in

**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 0.5 day  
**Dependencies:** Phase 5

### Tasks

- [ ] 6.1 Mode toggle
  - [ ] Registration / Food tabs or toggle
  - [ ] Persist selection

- [ ] 6.2 Meal type selector
  - [ ] Radio buttons: LUNCH_D1, DINNER_D1, BREAKFAST_D2
  - [ ] Clear labels with date/time

- [ ] 6.3 Food check-in server function
  - [ ] Validate participant is checked in
  - [ ] Check for duplicate claim (unique constraint)
  - [ ] Insert food_checkin record
  - [ ] Handle duplicate gracefully

- [ ] 6.4 Food claim counter
  - [ ] Count per selected meal type
  - [ ] Refresh on each scan

- [ ] 6.5 Already claimed error display
  - [ ] Show timestamp of original claim
  - [ ] Clear error message

### Deliverable
- Ops can switch to food mode
- Scan for meal claims
- Duplicates rejected with clear message

---

## Phase 7: Email Integration

**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 1

### Tasks

- [ ] 7.1 Resend client setup
  - [ ] `packages/core/src/email/client.ts`
  - [ ] Configure API key

- [ ] 7.2 Magic link email template
  - [ ] HTML template (mobile-responsive)
  - [ ] Subject: "Login to Hackathon Dashboard"
  - [ ] Link button with 1-hour expiry note

- [ ] 7.3 Welcome email template
  - [ ] Subject: "Welcome to Cursor x Anthropic MY Hackathon!"
  - [ ] Platform URL
  - [ ] Event date/time info

- [ ] 7.4 Check-in confirmation email
  - [ ] Subject: "You're Checked In!"
  - [ ] Credits list with codes and instructions
  - [ ] Embedded QR code image
  - [ ] Food schedule

- [ ] 7.5 VIP check-in email
  - [ ] Subject: "Welcome VIP"
  - [ ] QR code image (no credits)
  - [ ] Food schedule only

- [ ] 7.6 QR code to PNG conversion
  - [ ] Generate PNG buffer from QR value
  - [ ] Embed as inline image in email

### Deliverable
- All email types working
- Proper templates with branding
- QR codes embedded in emails

---

## Phase 8: Admin Dashboard & Polish

**Status:** Not Started  
**Priority:** Medium  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 5, Phase 6, Phase 7

### Tasks

- [ ] 8.1 Overview stats dashboard
  - [ ] Total registered / checked in
  - [ ] Food claims per meal
  - [ ] Codes assigned per type

- [ ] 8.2 Participant search and detail view
  - [ ] Search by name or email
  - [ ] Detail modal with all info
  - [ ] Assigned codes list

- [ ] 8.3 Manual check-in button
  - [ ] Backup if QR scan fails
  - [ ] Triggers same check-in flow

- [ ] 8.4 VIP check-in workflow
  - [ ] Check-in button in VIP list
  - [ ] Sends VIP email with QR

- [ ] 8.5 Send/resend welcome email action
  - [ ] Button per participant
  - [ ] Bulk send option

- [ ] 8.6 Error handling and edge cases
  - [ ] Network errors
  - [ ] Invalid data handling
  - [ ] Graceful degradation

- [ ] 8.7 Loading states and UX polish
  - [ ] Skeleton loaders
  - [ ] Button loading states
  - [ ] Toast notifications

- [ ] 8.8 Mobile responsiveness check
  - [ ] All dashboards work on mobile
  - [ ] Scanner optimized for tablet

### Deliverable
- Complete admin visibility
- Backup manual operations
- Polish and edge cases handled

---

## Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TIMELINE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Dec 1-2 (Mon-Tue)                                                           │
│  ├── Phase 1: Schema & Auth                                                  │
│  └── Phase 2: Admin Import                                                   │
│                                                                              │
│  Dec 2-3 (Tue-Wed)                                                           │
│  ├── Phase 3: Participant Dashboard                                          │
│  └── Phase 4: Credits Management                                             │
│                                                                              │
│  Dec 3-4 (Wed-Thu)                                                           │
│  ├── Phase 7: Email Integration (parallel)                                   │
│  └── Phase 5: Registration Check-in (start)                                  │
│                                                                              │
│  Dec 4-5 (Thu-Fri)                                                           │
│  ├── Phase 5: Registration Check-in (complete)                               │
│  ├── Phase 6: Food Check-in                                                  │
│  └── Phase 8: Admin Dashboard & Polish                                       │
│                                                                              │
│  Dec 5 (Fri)                                                                 │
│  └── Final testing with 100+ test users                                      │
│                                                                              │
│  Dec 6-7 (Sat-Sun)                                                           │
│  └── EVENT DAY                                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checkpoints

| After Phase | Test Scenario |
|-------------|---------------|
| 1 | Run migrations, test magic link login flow |
| 2 | Import 10 test users from CSV, verify QR generated |
| 3 | Login as participant, view QR, test copy button |
| 4 | Create credit type, import 10 codes |
| 5 | Full check-in: scan → status update → codes assigned |
| 6 | Food scan with duplicate rejection |
| 7 | Receive all email types in inbox |
| 8 | End-to-end with 100+ test users, stress test scanner |

---

## Pre-Event Checklist

- [ ] 1000 participants imported from Luma
- [ ] All 6 credit types created
- [ ] All sponsor codes imported
- [ ] VIPs added and ready
- [ ] Welcome emails sent to all participants
- [ ] Ops accounts created
- [ ] Admin accounts created
- [ ] Test check-in flow on event venue WiFi
- [ ] Backup manual check-in process documented
- [ ] Scanner devices tested (phones/tablets)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scanner camera issues | Manual lookup by email in admin |
| Code pool exhaustion | Monitor in admin dashboard, have backup codes |
| Email delivery delays | QR visible in dashboard, don't rely solely on email |
| Network issues at venue | Test on venue WiFi before event |
| Concurrent scan conflicts | Row-level locking in PostgreSQL |

