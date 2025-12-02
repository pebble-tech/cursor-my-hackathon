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
│  Phase 1: Schema & Auth ✅ ──┬──► Phase 2: Admin Import ✅                   │
│                              │                 │                             │
│                              │                 ├──► Phase 3: Participant UI ✅│
│                              │                 │                             │
│                              │                 └──► Phase 4: Credits Mgmt    │
│                              │                           │                   │
│                              │                           ▼                   │
│                              │              Phase 5: Registration Check-in   │
│                              │                           │                   │
│                              │         ┌─────────────────┴─────────────────┐ │
│                              │         │                                   │ │
│                              │         ▼                                   ▼ │
│                              │  Phase 6: Check-in System    Phase 7: Email~  │
│                              │         │                                   │ │
│                              │         └─────────────────┬─────────────────┘ │
│                              │                           ▼                   │
│                              │              Phase 8: Admin Dashboard         │
│                              │                                               │
│  ✅ = Complete    ~ = Partial                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architectural Decisions

### Dashboard Routing Strategy (Decided: Dec 2, 2025)

**Decision:** Separate routes for different user roles

```
Route Structure:
├── /                  → Landing page (all users, shows login or "Go to Dashboard")
├── /login             → Authentication page
├── /dashboard         → Participant dashboard (participants only)
├── /ops               → Ops scanner dashboard (ops + admin) [Phase 5/6]
└── /admin             → Admin management dashboard (admin only)
```

**Rationale:**
1. **UX Optimization**: Ops scanner needs mobile-first, camera-centric UI. Admin management needs desktop-first, data-table UI.
2. **Device Patterns**: Ops use phones/tablets for scanning. Admins use laptops for management.
3. **Access Control**: Clear separation of permissions per route.

**Landing Page Behavior (`/`):**
- Unauthenticated: Show event info (name, date, location) + "Login" button
- Authenticated Participant: Show event info + "Go to Dashboard" → `/dashboard`
- Authenticated Ops: Show event info + "Go to Dashboard" → placeholder (until `/ops` built)
- Authenticated Admin: Show event info + "Go to Dashboard" → `/admin`

---

## Phase 1: Database Schema & Authentication

**Status:** ✅ Completed  
**Priority:** Critical  
**Estimated Effort:** 1 day  
**Dependencies:** None

### Tasks

- [x] 1.1 Create event schema files in `packages/core/src/business.server/events/schemas/`
  - [x] Enums: `code_status`, `checkin_type` (attendance | meal)
  - [x] `credit-types.sql.ts`
  - [x] `codes.sql.ts`
  - [x] `checkin-types.sql.ts` (admin-configurable check-in categories)
  - [x] `checkin-records.sql.ts` (check-in log entries)
  - [x] `schema.ts` (exports + relations)

- [x] 1.2 Extend `UsersTable` in `packages/core/src/auth/schema.ts`
  - [x] Add `lumaId`, `role`, `participantType`, `status`, `checkedInAt`, `checkedInBy`, `qrCodeValue`
  - [x] Add indexes

- [x] 1.3 Generate and run migrations
  - [x] `pnpm db:generate`
  - [x] `pnpm db:migrate`

- [x] 1.4 Configure Better Auth with magic link plugin
  - [x] Add `magicLink` plugin to `auth.ts`
  - [x] Configure `disableSignUp: true`
  - [x] Add VIP login prevention in `sendMagicLink`

- [x] 1.5 Update auth client with `magicLinkClient` plugin
  - [x] Update `apps/web/src/utils/auth-client.ts`

- [x] 1.6 Create QR code utilities in `packages/core/src/business.server/events/`
  - [x] `events.ts` with `generateQRCodeValue()` and `verifyQRCodeValue()`

- [x] 1.7 Add environment variables
  - [x] `QR_SECRET_KEY` (min 32 chars)
  - [x] `RESEND_API_KEY`

### Deliverable

- ✅ Migrations generated and applied
- ✅ Magic link login flow configured
- ✅ QR code generation utility implemented
- ✅ Email client and templates created
- ✅ Seed script created

---

## Phase 2: Admin - Participant Import

**Status:** ✅ Completed  
**Priority:** Critical  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 1

### Tasks

- [x] 2.0 Login page
  - [x] `/login` route with magic link + Google OAuth
  - [x] Magic link for participants and ops
  - [x] Google OAuth for admin
  - [x] Post-login redirect based on role
  - [x] Error handling for unregistered/VIP users

- [x] 2.1 Create admin route layout with role guard
  - [x] `apps/web/src/routes/admin/` directory
  - [x] Role check middleware (redirect if not admin)

- [x] 2.2 CSV upload component
  - [x] File input with drag-drop
  - [x] Preview parsed data

- [x] 2.3 Participant import server function
  - [x] Parse CSV (email, name, luma_id)
  - [x] Validate format and duplicates
  - [x] Bulk create users with `status: 'registered'`
  - [x] Auto-generate QR code on creation
  - [x] Return skipped rows with reasons

- [x] 2.4 Manual user creation form
  - [x] Name + email input
  - [x] Type selector: VIP | Ops | Admin
  - [x] VIP: `participantType: 'vip'`, cannot login
  - [x] Ops/Admin: set role accordingly

- [x] 2.5 Participant list view
  - [x] Server-side paginated table
  - [x] Filter by status, type, role
  - [x] Search by name/email
  - [x] Status badge (registered/checked_in)

- [x] 2.6 Welcome email trigger
  - [x] "Send Welcome Emails" button
  - [x] Different content for regular vs VIP (VIP includes QR code image)
  - [x] Track sent status per user (`welcomeEmailSentAt` field)

### Deliverable

- ✅ Users can login via magic link or Google OAuth
- ✅ Admin can import 1000 participants from Luma CSV
- ✅ Admin can manually add VIPs, ops, and admin accounts
- ✅ QR codes auto-generated for all users
- ✅ Welcome emails can be batch-sent

---

## Phase 3: Participant Dashboard

**Status:** ✅ Completed  
**Priority:** High  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 1, Phase 2

### Tasks

- [x] 3.1 Dashboard layout (mobile-first)
  - [x] Header with name and logout
  - [x] Status badge (registered/checked-in)

- [x] 3.2 QR code display component
  - [x] Large QR (280px, close to 300px spec)
  - [x] "This QR never expires" message
  - [x] Instructions text

- [~] 3.3 Pre-check-in state
  - [ ] ~~"Check-in opens Dec 6, 9:00 AM" message~~ (deferred per 003-plan.md)
  - [x] QR code visible

- [x] 3.4 Post-check-in state
  - [x] Credits list visible
  - [x] "Checked in at [time]" badge

- [x] 3.5 Credit card component
  - [x] Sponsor icon/name
  - [x] Code value with copy button
  - [x] Redeem URL link
  - [x] Expandable instructions

- [x] 3.6 Mark as redeemed toggle
  - [x] Checkbox per credit
  - [x] Persist to database
  - [x] Filter by status (all/redeemed/pending)

### Deliverable

- ✅ Participants can see their QR code
- ✅ View and copy credit codes after check-in

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
  - [ ] Select "Day 1 Attendance" check-in type
  - [ ] Validate status is 'registered'
  - [ ] Create checkin_record for "Day 1 Attendance"
  - [ ] Update participant status to 'checked_in'
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

## Phase 6: Ops - Check-in System

**Status:** Not Started  
**Priority:** High  
**Estimated Effort:** 0.5 day  
**Dependencies:** Phase 5

### Tasks

- [ ] 6.1 Check-in type selector
  - [ ] Fetch active check-in types from DB (ordered)
  - [ ] Display as selectable list (Day 1 Attendance, Day 1 Lunch, etc.)
  - [ ] Persist selection

- [ ] 6.2 Check-in Guest flow
  - [ ] Select check-in type first
  - [ ] Scan participant QR
  - [ ] Show participant info + status for selected type only
  - [ ] "Check In" button if not already checked in

- [ ] 6.3 Check-in server function
  - [ ] Validate participant exists
  - [ ] Check for duplicate (unique constraint)
  - [ ] Insert checkin_record
  - [ ] Handle duplicate gracefully

- [ ] 6.4 Check Guest Status flow
  - [ ] Separate screen/mode
  - [ ] Scan participant QR
  - [ ] Query all check-in types with status for participant
  - [ ] Display list with checkmarks for completed

- [ ] 6.5 Check-in counter
  - [ ] Count per selected check-in type
  - [ ] Refresh on each scan

- [ ] 6.6 Already checked in error display
  - [ ] Show timestamp of original check-in
  - [ ] Clear error message

### Deliverable

- Ops can select check-in type and process check-ins
- Check Guest Status shows all check-in statuses
- Duplicates rejected with clear message

---

## Phase 7: Email Integration

**Status:** Partially Complete  
**Priority:** High  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 1

### Tasks

- [x] 7.1 Resend client setup
  - [x] `packages/core/src/email/client.ts`
  - [x] Configure API key

- [x] 7.2 Magic link email template
  - [x] HTML template (mobile-responsive)
  - [x] Subject: "Sign in to Cursor Hackathon"
  - [x] Link button with 1-hour expiry note

- [x] 7.3 Welcome email template
  - [x] Subject: "Welcome to Cursor Hackathon!"
  - [x] Platform URL
  - [x] Event date/time info

- [ ] 7.4 Check-in confirmation email
  - [ ] Subject: "You're Checked In!"
  - [ ] Credits list with codes and instructions
  - [ ] Embedded QR code image
  - [ ] Food schedule

- [x] 7.5 VIP welcome email (moved to Phase 2)
  - [x] Subject: "Welcome to Cursor Hackathon - Your VIP Pass"
  - [x] QR code image embedded
  - [x] Food schedule

- [x] 7.6 QR code to PNG conversion
  - [x] Generate data URL from QR value (`qr-image.ts`)
  - [x] Embed as inline image in email

### Deliverable

- ✅ Resend client configured
- ✅ Magic link, welcome, and VIP welcome emails working
- ✅ QR codes embedded in VIP emails
- [ ] Check-in confirmation email (pending Phase 5/6)

---

## Phase 8: Admin Dashboard & Polish

**Status:** Not Started  
**Priority:** Medium  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 5, Phase 6, Phase 7

### Tasks

- [ ] 8.1 Overview stats dashboard
  - [ ] Total registered / checked in
  - [ ] Check-ins per type
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
│  ├── Phase 1: Schema & Auth ✅                                               │
│  └── Phase 2: Admin Import ✅                                                │
│                                                                              │
│  Dec 2-3 (Tue-Wed)                                                           │
│  ├── Phase 3: Participant Dashboard                                          │
│  └── Phase 4: Credits Management                                             │
│                                                                              │
│  Dec 3-4 (Wed-Thu)                                                           │
│  ├── Phase 7: Email Integration (partial ✅, check-in email pending)         │
│  └── Phase 5: Registration Check-in (start)                                  │
│                                                                              │
│  Dec 4-5 (Thu-Fri)                                                           │
│  ├── Phase 5: Registration Check-in (complete)                               │
│  ├── Phase 6: Check-in System                                                │
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

| After Phase | Test Scenario                                               | Status |
| ----------- | ----------------------------------------------------------- | ------ |
| 1           | Run migrations, test magic link login flow                  | ✅     |
| 2           | Import 10 test users from CSV, verify QR generated          | ✅     |
| 3           | Login as participant, view QR, test copy button             | ✅     |
| 4           | Create credit type, import 10 codes                         |        |
| 5           | Full check-in: scan → status update → codes assigned        |        |
| 6           | Check-in type selection, check-in scan, duplicate rejection |        |
| 7           | Receive all email types in inbox                            |        |
| 8           | End-to-end with 100+ test users, stress test scanner        |        |

---

## Pre-Event Checklist

- [ ] 1000 participants imported from Luma (admin import ready)
- [ ] All 6 credit types created
- [ ] All sponsor codes imported
- [ ] VIPs added and ready (manual creation ready)
- [ ] Welcome emails sent to all participants (send function ready)
- [ ] Ops accounts created (manual creation ready)
- [ ] Admin accounts created (manual creation ready)
- [ ] Test check-in flow on event venue WiFi
- [ ] Backup manual check-in process documented
- [ ] Scanner devices tested (phones/tablets)

---

## Risk Mitigation

| Risk                      | Mitigation                                          |
| ------------------------- | --------------------------------------------------- |
| Scanner camera issues     | Manual lookup by email in admin                     |
| Code pool exhaustion      | Monitor in admin dashboard, have backup codes       |
| Email delivery delays     | QR visible in dashboard, don't rely solely on email |
| Network issues at venue   | Test on venue WiFi before event                     |
| Concurrent scan conflicts | Row-level locking in PostgreSQL                     |
