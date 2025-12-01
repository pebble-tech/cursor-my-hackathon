## Cursor x Anthropic MY Hackathon Platform
## Requirements Documentation v1.0

**Document Date:** December 1, 2025  
**Event Date:** December 6-7, 2025  
**Expected Participants:** ~1,000  
**Location:** Monash University Malaysia, Level 2

---

## Executive Summary

The Cursor x Anthropic MY Hackathon Platform is a comprehensive event management system designed to streamline participant registration, check-in, credit distribution, and food voucher management for a 1,000-person hackathon event.

### Primary Objectives

1. **Simplified Check-in Process**: Enable fast, QR-based check-in for participants and VIPs
2. **Automated Credit Distribution**: Distribute sponsor credits (Cursor, Anthropic, ElevenLabs, etc.) to participants upon check-in on a first-come-first-serve basis
3. **Food Voucher Management**: Prevent duplicate food claims across multiple meal sessions (lunch, dinner, breakfast)
4. **VIP Handling**: Provide special treatment for VIP guests with permanent QR codes and no credit distribution
5. **Self-Service Platform**: Allow participants to access their QR codes and credits via web dashboard

### Key Features

- **Pre-Event Guest Import**: Bulk import approved participants from Luma CSV
- **Magic Link Authentication**: Passwordless login using email magic links
- **Permanent QR Codes**: Single QR code per participant for all interactions (check-in + food)
- **First-Come-First-Serve Credits**: Automatic code assignment during check-in until pool exhausts
- **Ops Scanner Interface**: Dedicated dashboard for operations volunteers to scan QR codes
- **Email Notifications**: Automated emails with credits and QR codes after check-in
- **VIP Management**: Separate workflow for VIP guests with email-only QR distribution

### Success Criteria

- 1,000 participants imported and ready before event day
- 95%+ successful check-ins on event day (Dec 6)
- Zero duplicate food claims across all meal sessions
- < 30 seconds average check-in time per participant
- All participants receive credit codes within 2 minutes of check-in

---

## System Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Web App)                    │
│  - Participant Dashboard (Mobile-First)                 │
│  - Ops Scanner Dashboard (Mobile/Tablet)                │
│  - Admin Dashboard (Desktop)                            │
│  Tech: Tanstack Start                                   │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   API Layer                             │
│  - Authentication (Magic Links)                         │
│  - QR Code Generation & Validation                      │
│  - Check-in Processing                                  │
│  - Code Assignment Logic                                │
│  Tech: Hono                                             │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Backend & Database                         │
│  - Convex (Backend + Real-time DB)                      │
│  - Better Auth (Authentication)                         │
│  - Resend (Email Delivery)                              │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend Framework | Tanstack Start | React-based framework for web app |
| Backend & Database | Convex | Serverless backend with real-time database |
| API Layer | Hono | Lightweight API framework |
| Authentication | Better Auth | Magic link authentication |
| Email Service | Resend | Transactional emails |
| QR Generation | qrcode library | QR code generation |
| QR Scanning | html5-qrcode | Camera-based QR scanning |

### User Journey Overview

```
Pre-Event:
Admin → Import Participants → System Sends Welcome Email

Participant → Receives Email → Clicks Platform URL → Enters Email → 
Receives Magic Link → Logs In → Sees QR Code

Event Day:
Participant → Shows QR at Registration → Ops Scans → System Checks In → 
Assigns Credits → Sends Email → Dashboard Updates

Throughout Event:
Participant → Shows QR at Food Station → Ops Scans → System Records → 
Prevents Duplicates
```

---

## User Roles & Permissions

### 1. Participant (Regular)

**Access Level:** Limited  
**Count:** ~1,000  
**Authentication:** Magic link via email

**Permissions:**
- ✅ Login to platform with Luma-registered email
- ✅ View personal QR code (permanent, never expires)
- ✅ View assigned credits after check-in
- ✅ Copy credit codes
- ✅ Mark credits as redeemed
- ✅ Edit profile name
- ❌ Cannot access other participants' data
- ❌ Cannot perform check-ins
- ❌ Cannot access admin functions

**Dashboard Features:**
- QR code display (permanent)
- Credits list with copy buttons
- Redemption instructions (detailed web version)
- Profile settings

### 2. VIP

**Access Level:** Email-only (no platform login)  
**Count:** ~10-50  
**Authentication:** None (email-only access)

**Permissions:**
- ❌ Cannot login to platform
- ✅ Receives permanent QR code via email
- ✅ Can use QR for food check-in only
- ❌ Does not receive credit codes
- ❌ No dashboard access

**Workflow:**
- Admin manually adds VIP
- Admin checks in VIP on event day
- VIP receives email with permanent QR code image
- VIP shows QR from email at food stations

### 3. Operations (Ops)

**Access Level:** Medium  
**Count:** ~10-20 volunteers  
**Authentication:** Magic link via email

**Permissions:**
- ✅ Login to ops dashboard
- ✅ Scan participant QR codes
- ✅ Process check-ins (registration desk)
- ✅ Process food check-ins (meal stations)
- ✅ View real-time check-in counts
- ✅ View recent scan history
- ❌ Cannot edit participant data
- ❌ Cannot import/export data
- ❌ Cannot manage credits

**Dashboard Features:**
- QR scanner interface (camera access)
- Check-in mode toggle (Registration / Food)
- Meal type selector for food check-ins
- Real-time feedback (success/error messages)
- Participant name display after scan
- Check-in counters and statistics
- Recent scans history (last 10)

### 4. Administrator (Admin)

**Access Level:** Full  
**Count:** ~3-5 organizers  
**Authentication:** Magic link via email

**Permissions:**
- ✅ All Ops permissions
- ✅ Import participants from CSV
- ✅ Create and manage credit types
- ✅ Import credit codes in bulk
- ✅ Add and manage VIPs
- ✅ Manual check-in participants (backup)
- ✅ View all participant data
- ✅ Edit participant information
- ✅ Send welcome emails
- ✅ Export reports (Phase 2)
- ✅ View system-wide statistics

**Dashboard Features:**
- Participant management (import, view, edit)
- Credit management (types, codes, import)
- VIP management (add, check-in)
- System statistics and dashboards
- Manual override functions

### Permission Matrix

| Feature | Participant | VIP | Ops | Admin |
|---------|-------------|-----|-----|-------|
| Login to platform | ✅ | ❌ | ✅ | ✅ |
| View own QR code | ✅ | ❌* | ❌ | ✅ |
| View own credits | ✅ | ❌ | ❌ | ✅ |
| Mark credits redeemed | ✅ | ❌ | ❌ | ✅ |
| Scan QR codes | ❌ | ❌ | ✅ | ✅ |
| Check in participants | ❌ | ❌ | ✅ | ✅ |
| Import participants | ❌ | ❌ | ❌ | ✅ |
| Manage credit types | ❌ | ❌ | ❌ | ✅ |
| Import codes | ❌ | ❌ | ❌ | ✅ |
| Add VIPs | ❌ | ❌ | ❌ | ✅ |
| View all participants | ❌ | ❌ | ✅ | ✅ |
| Export data | ❌ | ❌ | ❌ | ✅ |

*VIPs receive QR via email, not through platform

---

## Phase 1: Core Features (MVP)

These features are required for the event to function successfully on December 6-7, 2025.

### 1. Participant Management

#### 1.1 Guest Import from Luma

**Purpose:** Import pre-approved participants from Luma event platform

**Process:**
1. Admin exports "going" participants from Luma as CSV
2. CSV contains: `email`, `name`, `luma_id`
3. Admin uploads CSV to platform
4. System validates format and data integrity
5. System creates participant records with `status: registered`
6. System sends welcome email to all imported participants

**CSV Format:**
```csv
email,name,luma_id
john@example.com,John Doe,luma_abc123
sarah@example.com,Sarah Lee,luma_def456
```

**Validation Rules:**
- Email must be valid format
- Email must be unique (no duplicates)
- Name must not be empty
- Luma ID optional but recommended

**Welcome Email Template:**
```
Subject: Welcome to Cursor x Anthropic MY Hackathon!

Hi [Name],

You're registered for Cursor x Anthropic MY Hackathon! 🎉

📱 Access your dashboard:
[Platform URL]

Login with this email to:
• View your check-in QR code
• Access your credits after check-in on Dec 6

📍 Check-in opens: Dec 6, 9:00 AM at Level 2, Monash University

See you soon! 🚀
The Hackathon Team
```

#### 1.2 VIP Management

**Purpose:** Handle VIP guests who don't register via Luma

**Process:**
1. Admin manually adds VIP (name + email)
2. System creates VIP record with `participant_type: vip`
3. System generates permanent QR code immediately
4. VIP cannot login to platform (email-only workflow)
5. On event day, admin manually checks in VIP
6. System sends VIP email with QR code image

**VIP Characteristics:**
- No credit codes assigned
- Permanent QR code (never expires)
- Email-only access (no platform login)
- Special badge shown to ops during scans
- Food access only (no hackathon credits)

**VIP Check-in Email:**
```
Subject: Welcome VIP - Cursor x Anthropic MY Hackathon

Hi [Name],

Welcome to Cursor x Anthropic MY Hackathon! 🌟

🍽️ YOUR VIP FOOD ACCESS

[QR Code Image Embedded]

Show this QR code at food stations for:
• Lunch (Dec 6, 12:00 PM)
• Dinner (Dec 6, 6:00 PM)
• Breakfast (Dec 7, 9:00 AM)

Your QR code never expires. Keep this email handy!

Enjoy the event! 🚀
```

### 2. Authentication System

#### 2.1 Magic Link Login

**Purpose:** Passwordless authentication for participants and staff

**Process:**
1. User visits platform URL
2. User enters email address
3. System validates email exists in database
4. If valid, system generates magic link (expires 1 hour)
5. System sends magic link via email
6. User clicks link to login
7. System creates session (lasts 7 days)

**Email Validation:**
- Email must exist in participant table
- Email must match Luma registration
- Error message if not found: "Email not registered. Please use your Luma registration email."

**Magic Link Email:**
```
Subject: Login to Hackathon Dashboard

Hi [Name],

Click here to login (expires in 1 hour):
[Platform URL]/auth/verify?token=[UUID]

If you didn't request this, please ignore this email.
```

**Security Features:**
- One-time use tokens
- 1-hour expiration
- Token marked as used after login
- 7-day session duration
- Rate limiting: Max 5 requests per 15 minutes per email

#### 2.2 Session Management

**Session Duration:** 7 days  
**Storage:** Server-side session storage  
**Logout:** Manual logout clears session immediately

### 3. QR Code System

#### 3.1 QR Code Generation

**Key Design Decision:** Permanent QR codes (no expiration)

**Rationale:**
- Simpler event day logistics (no refresh issues)
- Works offline (participants can screenshot)
- No clock synchronization problems
- Duplicate prevention handled by session tracking, not timestamps

**QR Code Format:**
```json
{
  "participant_id": "uuid-here",
  "type": "permanent",
  "signature": "hmac-sha256-signature"
}
```

**Generation Timing:**
- **Regular Participants:** Generated on first login
- **VIPs:** Generated when admin adds VIP

**Storage:** QR code value stored in database (`participant.qr_code_value`)

#### 3.2 QR Code Validation

**Server-Side Validation Process:**
1. Decode QR payload
2. Extract `participant_id`
3. Verify HMAC signature
4. Look up participant in database
5. Check session type (check-in vs food)
6. Validate against business rules

**Validation Logic:**

**For Check-in Session:**
```
IF participant.status == "registered":
  ✓ Valid - proceed with check-in
ELSE IF participant.status == "checked_in":
  ✗ Invalid - already checked in
```

**For Food Session:**
```
IF participant.status != "checked_in":
  ✗ Invalid - not checked in yet
ELSE:
  Check food_checkins table for meal_type
  IF already claimed:
    ✗ Invalid - duplicate claim
  ELSE:
    ✓ Valid - proceed
```

**Security Features:**
- HMAC-SHA256 signature verification
- Server-side validation only (never trust client)
- Rate limiting on validation attempts
- Audit logging of all scans

#### 3.3 QR Code Display

**Participant Dashboard:**
- Large, scannable QR code (300x300px minimum)
- "This QR never expires" message
- Instructions: "Show this at registration desk" or "Show at food stations"
- Can be screenshotted and saved offline

**VIP Email:**
- QR code embedded as image (PNG format)
- High resolution (600x600px)
- Instructions included in email body

### 4. Check-in Process

#### 4.1 Registration Check-in Flow

**Location:** Registration desk, Level 2  
**Time:** Dec 6, 9:00 AM - 11:00 PM  
**Staff:** Ops volunteers with scanner devices

**Step-by-Step Process:**

**Participant Actions:**
1. Arrives at registration desk
2. Opens platform on mobile device
3. Navigates to QR code page
4. Shows QR to ops volunteer

**Ops Actions:**
1. Opens ops dashboard (check-in mode)
2. Points camera at participant's QR code
3. Waits for scan result
4. Confirms success or handles error

**System Actions:**
1. Decodes QR code payload
2. Verifies signature is valid
3. Looks up participant by `participant_id`
4. Checks current status:
   - If `registered`: Proceed to step 5
   - If `checked_in`: Show error "Already checked in at [time]"
5. Updates participant: `status = "checked_in"`, `checked_in_at = NOW()`
6. **Assigns codes** (see 4.2 below)
7. Sends check-in confirmation email
8. Shows success message to ops

**Success Display (Ops):**
```
✓ John Doe
Checked in successfully
6 codes assigned
```

**Error Display (Ops):**
```
⚠️ John Doe
Already checked in at 10:34 AM
```

#### 4.2 Code Assignment Algorithm

**Trigger:** Immediately upon successful check-in  
**Method:** First-come-first-serve from unassigned code pool

**Algorithm:**
```
assigned_codes = []

FOR EACH active_credit_type IN active_credit_types:
  
  // Lock one unassigned code
  code = SELECT * FROM codes 
         WHERE credit_type_id = active_credit_type.id 
         AND assigned_to IS NULL 
         LIMIT 1 
         FOR UPDATE  // Row-level lock
  
  IF code EXISTS:
    // Assign to participant
    UPDATE codes 
    SET assigned_to = participant.id,
        assigned_at = NOW(),
        status = 'available'
    WHERE id = code.id
    
    assigned_codes.push({
      credit_type: active_credit_type,
      code: code
    })
  
  ELSE:
    // No codes left for this type
    LOG WARNING: "Code exhausted for {credit_type.name}"
    // Participant won't receive this credit type
  
END FOR

RETURN assigned_codes
```

**Handling Code Shortages:**
- If a credit type runs out of codes, late participants simply don't receive that credit
- No error shown to participant (they only see what they got)
- Warning logged for admin review
- Email includes only assigned credits

**Example Scenarios:**

**Scenario A:** Participant #1 (early arrival)
- All 6 credit types have available codes
- Receives codes from: Cursor, Anthropic, ElevenLabs, LeanMCP, Mobbin, Vercel
- Email lists all 6 credits

**Scenario B:** Participant #900 (late arrival)
- Cursor codes exhausted (only 800 available)
- Receives codes from: Anthropic, ElevenLabs, LeanMCP, Mobbin, Vercel
- Email lists only 5 credits
- No mention of Cursor (participant doesn't know it existed)

#### 4.3 Check-in Confirmation Email

**Sent:** Immediately after successful check-in  
**Delivery:** Via Resend API  
**Format:** HTML with embedded QR image

**Email Template:**
```
Subject: You're Checked In! 🎉

Hi [Name],

Welcome to Cursor x Anthropic MY Hackathon! You're all checked in. ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 YOUR CREDITS

[FOR EACH assigned credit:]

[DISPLAY NAME]
Code: [code_value]
Redeem: [redeem_url]
Instructions: [email_instructions]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example:
CURSOR PRO CREDITS (50 credits)
Code: ABC123XYZ
Redeem: https://cursor.com/redeem
Instructions: Login to Cursor, go to Settings > Billing, 
paste your code in the redemption field.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🍽️ YOUR FOOD QR CODE

[QR Code Image Embedded - 400x400px]

Show this QR code at food stations for:
• Lunch (Dec 6, 12:00 PM)
• Dinner (Dec 6, 6:00 PM)
• Breakfast (Dec 7, 9:00 AM)

You### 5. Credit Management System

#### 5.1 Credit Type Creation

**Purpose:** Define categories of sponsor credits with instructions

**Admin Workflow:**
1. Navigate to Credit Management → Create Credit Type
2. Fill form with required fields
3. Save credit type
4. Credit type becomes available for code import

**Required Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| Name | String | Internal identifier (lowercase, no spaces) | `cursor` |
| Display Name | String | Shown to participants | `Cursor Pro Credits - 50 credits` |
| Email Instructions | Text | Concise text for email | `Login to cursor.com, go to Settings > Billing, paste code` |
| Web Instructions | Rich Text | Detailed HTML/Markdown for dashboard | `<h3>How to Redeem</h3><ol><li>Go to...` |
| Display Order | Integer | Sorting order in lists | `1` |
| Icon URL | String (optional) | Logo/icon for UI | `https://cdn.../cursor.png` |
| Is Active | Boolean | Enable/disable credit type | `true` |

**Business Rules:**
- Name must be unique
- Display order determines sort position in participant dashboard
- Inactive credit types won't assign codes during check-in
- Instructions are shared by all codes of this type

**Example Credit Types:**
1. Cursor Pro Credits - 50 credits
2. Anthropic API Credits - 25 credits  
3. ElevenLabs Voice AI - 6 month Scale tier
4. LeanMCP Pro - 1 week trial
5. Mobbin Pro - 3 month subscription
6. Vercel Deployment Credits - 5000 credits

#### 5.2 Code Import Process

**Purpose:** Bulk import redemption codes from sponsors

**Prerequisite:** Credit type must be created first

**CSV Format:**
```csv
code,redeem_url
ABC123XYZ,https://cursor.com/redeem
DEF456ABC,https://cursor.com/redeem
GHI789DEF,https://cursor.com/redeem
```

**Admin Workflow:**
1. Receive code CSV from sponsor
2. Navigate to Credit Management
3. Select credit type (e.g., "Cursor")
4. Click "Import Codes"
5. Upload CSV file
6. Review preview: "Will import X codes for [Credit Type]"
7. Confirm import
8. System validates and imports codes

**Validation Rules:**
- CSV must have exactly 2 columns: `code`, `redeem_url`
- Code values must be unique within credit type
- Redeem URL must be valid format
- Max 10,000 codes per import

**Import Result:**
- Success: "1,000 codes imported for Cursor"
- Partial success: "980 codes imported, 20 duplicates skipped"
- Failure: "Import failed: Invalid CSV format"

**Code Status After Import:**
- `status: unassigned`
- `assigned_to: NULL`
- Ready for assignment during check-in

#### 5.3 Code Pool Management

**Code Lifecycle:**
1. **Unassigned:** Imported but not assigned to participant
2. **Available:** Assigned to participant, not yet redeemed
3. **Redeemed:** Participant marked as redeemed (self-reported)

**Pool Exhaustion Handling:**
- System assigns codes first-come-first-serve
- When pool exhausts, subsequent participants don't receive that credit type
- No error shown to participant (only see what they got)
- Admin can monitor pool status (Phase 2 feature)

### 6. Food Check-in System

#### 6.1 Meal Sessions

**Defined Meal Types:**

| Meal Type | Date | Time | Location |
|-----------|------|------|----------|
| LUNCH_D1 | Dec 6 | 12:00 PM | Level 2 |
| DINNER_D1 | Dec 6 | 6:00 PM | Level 2 |
| BREAKFAST_D2 | Dec 7 | 9:00 AM | Level 2 |

**Business Rules:**
- Each participant can claim each meal type exactly once
- Must be checked in first (registration check-in required)
- VIPs can claim meals without receiving credits
- Same QR code used for all meal claims

#### 6.2 Food Check-in Flow

**Location:** Food stations at Level 2  
**Staff:** Ops volunteers with scanner devices

**Step-by-Step Process:**

**Ops Actions:**
1. Opens ops dashboard (food check-in mode)
2. Selects meal type from dropdown (LUNCH_D1 / DINNER_D1 / BREAKFAST_D2)
3. Scanner camera activates
4. Scans participant's QR code

**System Actions:**
1. Decodes QR code payload
2. Verifies signature
3. Looks up participant
4. Validates participant is checked in:
   - If NOT checked in: Show error "Not checked in yet"
5. Queries `food_checkins` table:
   ```sql
   SELECT * FROM food_checkins 
   WHERE participant_id = ? 
   AND meal_type = ?
   ```
6. If record exists: Show error "Already claimed [meal] at [time]"
7. If no record:
   - Insert food check-in record
   - Show success with participant name
   - Update real-time counter

**Success Display (Ops):**
```
✓ John Doe
Lunch claimed successfully
```

**If VIP:**
```
✓ Jane Sponsor 🌟 VIP
Lunch claimed successfully
```

**Error Display (Ops):**
```
⚠️ John Doe
Already claimed lunch at 12:15 PM
```

```
⚠️ Sarah Lee
Not checked in yet
Please check in at registration first
```

#### 6.3 Duplicate Prevention

**Primary Method:** Database uniqueness constraint

**Database Schema:**
```sql
CREATE TABLE food_checkins (
  id UUID PRIMARY KEY,
  participant_id UUID REFERENCES participants(id),
  meal_type ENUM('LUNCH_D1', 'DINNER_D1', 'BREAKFAST_D2'),
  checked_in_by UUID REFERENCES participants(id), -- ops user
  checked_in_at TIMESTAMP,
  UNIQUE(participant_id, meal_type) -- Prevents duplicates
);
```

**Concurrent Scan Protection:**
- Transaction isolation ensures atomic operations
- Row-level locking prevents race conditions
- If two ops scan simultaneously, second scan fails gracefully

**User Experience:**
- Ops sees clear error message
- Participant is informed (can dispute if error)
- All scans logged for audit trail

### 7. Dashboard Interfaces

#### 7.1 Participant Dashboard

**Access:** Mobile-first responsive design  
**URL:** `[platform]/dashboard`

**Key Sections:**

**A. Header**
- Welcome message: "Welcome, [Name]!"
- Check-in status badge: "✓ Checked in" or "⏰ Check-in opens Dec 6"
- Logout button

**B. QR Code Section**
```
┌─────────────────────────────────────┐
│ 🍽️ Your QR Code                     │
│                                     │
│     [Large QR Code - 300x300px]     │
│                                     │
│  Show this at:                      │
│  • Registration desk (check-in)     │
│  • Food stations (meals)            │
│                                     │
│  This QR never expires              │
└─────────────────────────────────────┘
```

**C. Credits Section (After Check-in)**
```
┌─────────────────────────────────────┐
│ 📦 Your Credits (6)                 │
│                                     │
│ Filter: [All] [Redeemed] [Pending] │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎯 Cursor Pro (50 credits)      │ │
│ │                                 │ │
│ │ Code: ABC123XYZ   [📋 Copy]     │ │
│ │ Redeem: cursor.com/redeem       │ │
│ │                                 │ │
│ │ [📖 View Instructions ▼]        │ │
│ │                                 │ │
│ │ ☐ Mark as Redeemed              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 Anthropic API (25 credits)   │ │
│ │ Code: XYZ789ABC   [📋 Copy]     │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [5 more credit cards...]            │
└─────────────────────────────────────┘
```

**D. Profile Section**
- Name (editable)
- Email (read-only, from Luma)
- Status (registered / checked in)

**Features:**
- Copy button for each code (clipboard API)
- Expandable instructions (show/hide)
- Toggle redeemed status (checkbox)
- Filter credits by redemption status
- Mobile-optimized (thumb-friendly tap targets)

**Before Check-in State:**
- QR code visible
- "Check-in opens..." message
- Credits section shows: "Your credits will appear after check-in"

#### 7.2 Ops Dashboard

**Access:** Mobile/tablet optimized  
**URL:** `[platform]/ops`

**Two Modes:**

**A. Check-in Mode (Registration Desk)**
```
┌─────────────────────────────────────┐
│ 📋 Registration Check-in            │
├─────────────────────────────────────┤
│                                     │
│   [Camera View - QR Scanner]        │
│                                     │
│   Point camera at participant's     │
│   QR code                           │
│                                     │
├─────────────────────────────────────┤
│ ✓ 347 participants checked in today │
├─────────────────────────────────────┤
│ Recent Check-ins:                   │
│ • John Doe - 10:34 AM ✓            │
│ • Sarah Lee - 10:32 AM ✓           │
│ • Mike Chen - 10:30 AM ✓           │
│ • Alex Wong - 10:28 AM ✓           │
│ • Lisa Tan - 10:25 AM ✓            │
└─────────────────────────────────────┘
```

**B. Food Check-in Mode**
```
┌─────────────────────────────────────┐
│ 🍽️ Food Check-in                    │
├─────────────────────────────────────┤
│ Select Meal:                        │
│ ( ) Lunch - Dec 6, 12:00 PM         │
│ (•) Dinner - Dec 6, 6:00 PM         │
│ ( ) Breakfast - Dec 7, 9:00 AM      │
│                                     │
│   [Camera View - QR Scanner]        │
│                                     │
├─────────────────────────────────────┤
│ ✓ 234 claimed dinner so far         │
├─────────────────────────────────────┤
│ Recent Scans:                       │
│ • John Doe ✓ Dinner - 6:45 PM      │
│ • Sarah Lee ✓ Dinner - 6:43 PM     │
│ • Mike Chen ⚠️ Already claimed      │
│ • Alex Wong ✓ Dinner - 6:40 PM     │
└─────────────────────────────────────┘
```

**Features:**
- Mode toggle (check-in / food)
- Large scan result display (success/error)
- Real-time counters
- Recent activity feed (last 10 scans)
- VIP badge display when scanning VIPs
- Audio/haptic feedback on successful scan
- Error messages persist for 5 seconds

**Scanner Behavior:**
- Auto-focus camera on QR codes
- Continuous scanning (ready for next scan immediately)
- Flash/torch toggle for low light
- Manual entry option (if camera fails - Phase 2)

#### 7.3 Admin Dashboard

**Access:** Desktop-optimized (mobile responsive)  
**URL:** `[platform]/admin`

**Main Sections:**

**A. Overview Dashboard**
```
┌─────────────────────────────────────────────────────┐
│ Cursor x Anthropic MY Hackathon                     │
│ Admin Dashboard                                     │
├─────────────────────────────────────────────────────┤
│ Quick Stats:                                        │
│                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │ 847 / 1000  │ │ 645 / 847   │ │ 234 / 847   │   │
│ │ Checked In  │ │ Lunch Claims│ │ Dinner Claims│  │
│ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Recent Activity:                            │   │
│ │ • 10:45 AM - 23 participants checked in     │   │
│ │ • 10:30 AM - Cursor codes imported (1000)   │   │
│ │ • 10:15 AM - VIP added: Jane Sponsor        │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**B. Participant Management Tab**
```
┌─────────────────────────────────────────────────────┐
│ Participants                                        │
├─────────────────────────────────────────────────────┤
│ [Import Participants] [Export CSV]                  │
│                                                     │
│ Tabs: [Regular Participants] [VIP List]            │
│                                                     │
│ Search: [____________] 🔍                           │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ Name       │ Email        │ Status  │ Actions │ │
│ ├────────────────────────────────────────────────┤ │
│ │ John Doe   │ john@...     │ ✓ In    │ View    │ │
│ │ Sarah Lee  │ sarah@...    │ ✓ In    │ View    │ │
│ │ Mike Chen  │ mike@...     │ Reg     │ Check In│ │
│ │ ...        │ ...          │ ...     │ ...     │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ Showing 1-50 of 1,000                               │
│ [< Prev] [Next >]                                   │
└─────────────────────────────────────────────────────┘
```

**C. Credit Management Tab**
```
┌─────────────────────────────────────────────────────┐
│ Credit Management                                   │
├─────────────────────────────────────────────────────┤
│ [Create Credit Type]                                │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ Credit Type    │ Total │ Assigned │ Actions   │ │
│ ├────────────────────────────────────────────────┤ │
│ │ Cursor Pro     │ 1000  │ 347      │ Import... │ │
│ │ Anthropic API  │ 1000  │ 347      │ Import... │ │
│ │ ElevenLabs     │ 1000  │ 347      │ Import... │ │
│ │ LeanMCP Pro    │ 800   │ 347      │ Import... │ │
│ │ Mobbin Pro     │ 1000  │ 347      │ Import... │ │
│ │ Vercel Credits │ 1000  │ 347      │ Import... │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Create Credit Type Form:**
```
┌─────────────────────────────────────┐
│ Create Credit Type                  │
├─────────────────────────────────────┤
│ Name (internal):                    │
│ [cursor_____________]               │
│                                     │
│ Display Name:                       │
│ [Cursor Pro Credits - 50 credits__] │
│                                     │
│ Email Instructions:                 │
│ [────────────────────────────────]  │
│ [Login to cursor.com, go to     ]  │
│ [Settings > Billing, paste code ]  │
│ [────────────────────────────────]  │
│                                     │
│ Web Instructions (HTML/Markdown):   │
│ [────────────────────────────────]  │
│ [<h3>How to Redeem</h3>         ]  │
│ [<ol><li>Go to cursor.com</li>  ]  │
│ [────────────────────────────────]  │
│                                     │
│ Display Order: [1___]               │
│                                     │
│ Icon URL (optional):                │
│ [https://cdn.../cursor-icon.png___] │
│                                     │
│ ☑ Active                            │
│                                     │
│ [Cancel] [Create Credit Type]       │
└─────────────────────────────────────┘
```

**Import Codes Interface:**
```
┌─────────────────────────────────────┐
│ Import Codes for: Cursor Pro        │
├─────────────────────────────────────┤
│ CSV Format: code, redeem_url        │
│                                     │
│ Expected columns: 2                 │
│ Max rows: 10,000                    │
│                                     │
│ [Choose File] cursor_codes.csv      │
│                                     │
│ [Upload]                            │
│                                     │
│ After upload:                       │
│ ────────────────────────────────    │
│ Preview: Will import 1,000 codes    │
│                                     │
│ Sample rows:                        │
│ ABC123XYZ, cursor.com/redeem        │
│ DEF456ABC, cursor.com/redeem        │
│ GHI789DEF, cursor.com/redeem        │
│                                     │
│ [Cancel] [Confirm Import]           │
└─────────────────────────────────────┘
```

**D. VIP Management Tab**
```
┌─────────────────────────────────────────────────────┐
│ VIP Management                                      │
├─────────────────────────────────────────────────────┤
│ [Add VIP]                                           │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ Name          │ Email       │ Status │ Actions │ │
│ ├────────────────────────────────────────────────┤ │
│ │ 🌟 Jane Sponsor│ jane@...   │ ✓ In   │ View   │ │
│ │ 🌟 Bob Speaker │ bob@...    │ Reg    │Check In│ │
│ │ 🌟 Lisa Judge  │ lisa@...   │ Reg    │Check In│ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Add VIP Form:**
```
┌─────────────────────────────────────┐
│ Add VIP                             │
├─────────────────────────────────────┤
│ Name:                               │
│ [Jane Sponsor_________________]     │
│                                     │
│ Email:                              │
│ [jane@sponsor.com____________]      │
│                                     │
│ Note: VIP will receive QR code via  │
│ email after check-in. VIPs cannot   │
│ login to platform.                  │
│                                     │
│ [Cancel] [Add VIP]                  │
└─────────────────────────────────────┘
```

**VIP Check-in Action:**
- Admin clicks "Check In" button next to VIP name
- System updates status to checked_in
- System sends VIP email with QR code image
- No codes assigned (VIPs don't receive credits)

**Admin Features Summary:**
- Import participants from CSV
- Create and manage credit types
- Bulk import codes per credit type
- Add VIPs manually
- View all participants (search, filter, paginate)
- Manual check-in (backup if QR scan fails)
- View system statistics and activity logs
- Export participant data (Phase 2)

### 8. Email System
You can also access everything anytime at:
[Platform URL]

Need help? Visit the help desk at Level 2.

Happy hacking! 🚀
The Hackathon Team

**Email Features:**
- Personalized with participant name
- Dynamic credit list (only assigned credits)
- QR code embedded as inline image
- Clickable redemption URLs
- Platform URL for dashboard access
- Mobile-optimized HTML


#### 8.1 Email Service Provider

**Provider:** Resend  
**Why:** Reliable transactional email delivery, developer-friendly API, good deliverability

**Email Types:**

| Email Type | Trigger | Recipient | Priority |
|------------|---------|-----------|----------|
| Welcome Email | After participant import | All imported participants | Low |
| Magic Link | Login attempt | User requesting login | High |
| Check-in Confirmation | After registration check-in | Checked-in participant | High |
| VIP Check-in | VIP checked in by admin | VIP | High |

#### 8.2 Email Templates

All emails use HTML templates with:
- Mobile-responsive design
- Plain text fallback
- Consistent branding (hackathon colors/logo)
- Clear call-to-action buttons
- Footer with contact info

**Template Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 20px;">
    <!-- Header with logo -->
    <!-- Main content -->
    <!-- Footer -->
  </div>
</body>
</html>
```

#### 8.3 Email Delivery

**Delivery Requirements:**
- Send within 2 minutes of trigger event
- Handle bounces gracefully (log but don't retry VIP emails)
- Support embedded images (QR codes)
- Rate limiting: Max 100 emails per second

**Error Handling:**
- If email fails: Log error with participant ID
- Admin can view failed emails in dashboard (Phase 2)
- No automatic retry (admin can manually resend if needed)

**Tracking:**
- Track email sent status in database
- Log delivery failures
- No open/click tracking (privacy)

---

## 5. Phase 2: Future Features

These features are nice-to-have and can be implemented after the event or for future iterations.

### 5.1 Workshop Management

**Purpose:** Allow participants to register for workshops/talks during the event

**Features:**

**A. Admin Workshop Creation**
- Create workshop with: name, description, date, time slot, capacity, location
- Edit workshop details
- Delete/cancel workshops
- View registration list per workshop

**B. Workshop Registration (Participant)**
- Browse available workshops
- View workshop details (time, location, capacity, speaker)
- Register for workshop (first-come-first-serve)
- Cancel registration
- View "My Workshops" list

**C. Business Rules**
- Capacity enforcement (max participants per workshop)
- Time conflict detection (can't register for overlapping workshops)
- Registration deadline (e.g., 1 hour before workshop starts)
- Waitlist system (if capacity reached - future enhancement)

**D. Workshop Check-in**
- Separate QR scan mode for workshop check-in
- Track workshop attendance
- Analytics: show rate, no-show rate

**Example Workshops:**
- Cursor AI Coding Workshop (10:30 AM, Room A, Capacity: 50)
- Building with Anthropic Claude (2:00 PM, Room B, Capacity: 100)
- Deploying to Vercel (4:00 PM, Room A, Capacity: 50)

**Database Schema:**
```
workshops:
  - id, name, description
  - date, time_slot_start, time_slot_end
  - capacity, location
  - created_at, updated_at

workshop_registrations:
  - id, participant_id, workshop_id
  - registered_at, cancelled_at
  - status (registered/cancelled/attended)
```

### 5.2 Team Management

**Purpose:** Allow participants to form teams for hackathon projects

**Features:**

**A. Team Creation**
- Participant creates team with team name
- Creator becomes team captain
- Team has unique invite code

**B. Team Joining**
- Participants can join team via invite code
- Max 4 members per team
- Participants can only be in one team

**C. Team Management**
- Captain can remove members
- Members can leave team voluntarily
- Captain can transfer captaincy
- Team can be disbanded by captain

**D. Team Display**
- Team profile page (name, members, captain)
- Show team members in participant list
- Team badge in dashboard

**E. Integration with Judging (Future)**
- Export team list for judges
- Link project submissions to teams
- Track which teams submitted projects

**Business Rules:**
- Team size: 2-4 members
- One team per participant
- Team name must be unique
- Cannot join team after submission deadline

**Database Schema:**
```
teams:
  - id, name
  - captain_id (FK to participants)
  - created_at, updated_at

team_members:
  - id, team_id, participant_id
  - joined_at, left_at
  - status (active/left)
```

### 5.3 Analytics & Reporting

**Purpose:** Provide insights and data export for event organizers

**Features:**

**A. Dashboard Analytics**
- Check-in rate over time (line chart)
- Food claim rates per meal (bar chart)
- Code redemption rates per credit type (pie chart)
- Participant status breakdown (registered vs checked-in)

**B. Export Functionality**
- Export participant list (CSV)
- Export check-in log (CSV with timestamps)
- Export food check-in log (CSV)
- Export code assignment report (who got which codes)

**C. Real-time Monitoring**
- Live check-in counter (updates every 5 seconds)
- Live food claim counter per meal
- Alert if code pool running low (< 10% remaining)

**D. Audit Logs**
- Track all admin actions (who did what, when)
- Track all check-in events
- Track all code assignments
- Searchable log viewer

### 5.4 Enhanced Ops Features

**Purpose:** Improve ops volunteer experience

**Features:**

**A. Manual Participant Lookup**
- Search participant by name or email
- View participant details (status, check-in time, codes assigned)
- Manual check-in button (if QR scan fails)
- Manual food check-in button (if QR scan fails)

**B. Ops Activity Log**
- View own scan history
- Filter by date/time, scan type
- Export own activity log

**C. Offline Mode**
- Queue scans when offline
- Sync when connection restored
- Show offline indicator in UI

**D. Scanner Enhancements**
- Bulk scan mode (scan multiple people quickly)
- Flash/torch toggle for low light
- Zoom controls for camera
- Manual code entry (if camera fails)

### 5.5 Code Pool Management

**Purpose:** Better visibility into code availability

**Features:**

**A. Real-time Pool Status**
- Show remaining codes per credit type in admin dashboard
- Color-coded alerts:
  - Green: > 50% remaining
  - Yellow: 10-50% remaining
  - Red: < 10% remaining

**B. Mid-Event Code Import**
- Allow importing additional codes during event
- Useful if sponsor provides more codes mid-event
- Newly imported codes immediately available for assignment

**C. Code Usage Analytics**
- Track redemption rates per credit type
- Show which credits are most popular
- Export redemption report

**D. Manual Code Assignment**
- Admin can manually assign specific code to specific participant
- Useful for VIPs or special cases
- Bypass automatic assignment logic

### 5.6 Participant Experience Enhancements

**Purpose:** Improve participant dashboard features

**Features:**

**A. Profile Customization**
- Add profile photo
- Add bio/introduction
- Social media links
- Skills/interests tags

**B. Networking Features**
- Browse other participants (opt-in)
- Search by skills/interests
- Send connection requests
- Team matching suggestions

**C. Schedule/Agenda**
- View event schedule
- Add sessions to personal agenda
- Set reminders for sessions
- View venue map

**D. Notifications**
- Email notifications for important updates
- Dashboard notifications (bell icon)
- Push notifications (if PWA installed)

**E. Credit Tracking**
- Show redemption status with checkmarks
- Add notes per credit
- Set reminders to redeem before expiry
- Link to redemption tutorials

### 5.7 VIP Experience Improvements

**Purpose:** Better VIP handling and experience

**Features:**

**A. VIP Categories**
- Different VIP tiers (Sponsor, Judge, Speaker, etc.)
- Different permissions per tier
- Custom badges per tier

**B. VIP Dashboard Access (Optional)**
- Allow VIPs to login if desired
- View-only access to platform
- Access to special VIP content/resources

**C. VIP Check-in Automation**
- Auto-check-in VIPs at specified time
- Batch VIP check-in (select multiple, check in all)

### 5.8 Security & Privacy Enhancements

**Purpose:** Improve security and user privacy

**Features:**

**A. Two-Factor Authentication**
- Optional 2FA for admin accounts
- SMS or authenticator app

**B. Role-Based Access Control**
- Granular permissions per role
- Custom roles (e.g., "Read-only admin")
- Permission inheritance

**C. Data Privacy**
- GDPR compliance features
- Data export for participants (download my data)
- Data deletion requests
- Privacy policy acceptance

**D. Security Logging**
- Track failed login attempts
- IP-based rate limiting
- Suspicious activity alerts
- Admin notification for security events

### 5.9 Multi-Event Support

**Purpose:** Reuse platform for future hackathons

**Features:**

**A. Event Configuration**
- Create multiple events in one platform
- Per-event settings (dates, meal types, credit types)
- Event cloning (copy settings from previous event)

**B. Historical Data**
- Archive past events
- View past event statistics
- Compare event metrics

**C. Template System**
- Save email templates
- Save credit type templates
- Save workshop templates

### 5.10 Integration Enhancements

**Purpose:** Connect with other tools and services

**Features:**

**A. Luma Integration (if API available)**
- Real-time sync with Luma
- Automatic participant import
- Two-way sync of check-in status

**B. Slack Integration**
- Post check-in milestones to Slack (e.g., "500 checked in!")
- Alert for code pool running low
- Real-time activity feed

**C. Discord Integration**
- Participant verification via Discord
- Auto-assign roles based on check-in status
- Announcements to Discord channel

**D. Webhook System**
- Custom webhooks for external integrations
- Trigger webhooks on events (check-in, food claim, etc.)
- Webhook logs and retry logic

---

**End of Phase 1 & Phase 2 Features**

---

## 6. Detailed User Flows

This section documents step-by-step user journeys for each major interaction with the platform. Each flow includes participant actions, system responses, and UI state changes.

### 6.1 Pre-Event Setup Flow

**Description:** Complete workflow for admin to prepare the system before event day, including importing participants, creating credit types, importing codes, and adding VIPs.

**Key Steps:**
- Export participants from Luma
- Import participant CSV to platform
- System sends welcome emails
- Admin creates credit types for all sponsors
- Admin imports codes for each credit type
- Admin manually adds VIP guests
- Platform URL distributed via Luma and social media

**Success Criteria:** 1,000 participants imported, 6 credit types created, codes imported for all types, welcome emails sent

---

### 6.2 Participant First Login Flow

**Description:** Step-by-step process for participants to access the platform for the first time using magic link authentication and view their permanent QR code.

**Key Steps:**
- Participant receives welcome email with platform URL
- Participant enters email address
- System validates email against imported list
- System sends magic link via email
- Participant clicks link and gets logged in
- System generates permanent QR code on first login
- Dashboard displays QR code with "Check-in opens Dec 6" message

**Success Criteria:** Participant successfully logged in, QR code visible, session created

---

### 6.3 Event Day Registration Check-in Flow

**Description:** Complete flow for participants arriving at registration desk, showing QR code to ops, getting checked in, and receiving credits via email.

**Key Steps:**
- Participant arrives at registration desk
- Opens dashboard and shows QR code
- Ops scans QR code
- System validates QR and participant status
- System updates status to checked_in
- System assigns codes from pool (first-come-first-serve)
- System sends check-in confirmation email with all codes
- Dashboard updates to show credits list

**Success Criteria:** Check-in processed in < 30 seconds, codes assigned, email sent, dashboard updated

---

### 6.4 Food Check-in Flow

**Description:** Process for participants claiming meals at food stations throughout the event, with duplicate prevention for each meal type.

**Key Steps:**
- Participant goes to food station
- Shows QR code (from dashboard or email)
- Ops selects meal type (LUNCH_D1/DINNER_D1/BREAKFAST_D2)
- Ops scans QR code
- System validates participant is checked in
- System checks if meal already claimed
- System records food check-in or shows duplicate error
- Ops confirms success/error to participant

**Success Criteria:** Food claim processed quickly, no duplicates allowed, VIP badge shown when applicable

---

### 6.5 VIP Complete Flow

**Description:** End-to-end workflow for VIP guests from admin adding them, checking them in on event day, to using QR code at food stations.

**Key Steps:**
- Admin adds VIP manually (name + email)
- System generates permanent QR code
- On event day, VIP arrives at registration
- Admin manually checks in VIP
- System sends VIP email with QR code image
- VIP shows QR from email at food stations
- Ops scans and sees VIP badge
- VIP claims meals without receiving credits

**Success Criteria:** VIP can claim all meals, no platform login required, email QR works correctly

---

### 6.6 Credit Redemption Flow

**Description:** Participant workflow for viewing assigned credits in dashboard, copying codes, accessing redemption instructions, and marking codes as redeemed.

**Key Steps:**
- Participant logs into dashboard after check-in
- Views list of assigned credits (only what they received)
- Clicks on credit card to expand instructions
- Copies code using copy button
- Opens redemption URL in new tab
- Follows web instructions to redeem
- Returns to dashboard and marks credit as redeemed

**Success Criteria:** All codes displayed correctly, copy function works, instructions are clear, redemption status tracked

---

## 7. Data Models

This section defines the database schema for all entities in the system, including tables, columns, data types, relationships, and constraints.

### 7.1 Participant Table

**Description:** Core table storing all participant, VIP, ops, and admin user records with authentication and status information.

**Key Fields:** id, email, name, luma_id, role, participant_type, status, checked_in_at, qr_code_value

**Relationships:** One-to-many with codes (assigned codes), one-to-many with food_checkins

---

### 7.2 MagicLink Table

**Description:** Temporary table for magic link authentication tokens with expiration tracking.

**Key Fields:** id, email, token, expires_at, used_at, created_at

**Relationships:** None (lookup table only)

---

### 7.3 CreditType Table

**Description:** Defines categories of sponsor credits with display information and redemption instructions.

**Key Fields:** id, name, display_name, email_instructions, web_instructions, display_order, icon_url, is_active

**Relationships:** One-to-many with codes

---

### 7.4 Code Table

**Description:** Individual redemption codes provided by sponsors, tracking assignment and redemption status.

**Key Fields:** id, credit_type_id, code_value, redeem_url, assigned_to, assigned_at, redeemed_at, status

**Relationships:** Many-to-one with credit_types, many-to-one with participants (assigned_to)

---

### 7.5 FoodCheckin Table

**Description:** Records of meal claims by participants, preventing duplicate claims per meal type.

**Key Fields:** id, participant_id, meal_type, checked_in_by, checked_in_at

**Relationships:** Many-to-one with participants (both participant_id and checked_in_by)

**Constraints:** Unique constraint on (participant_id, meal_type)

---

### 7.6 Workshop Table (Phase 2)

**Description:** Workshop sessions available during the event with capacity and scheduling information.

**Key Fields:** id, name, description, date, time_slot_start, time_slot_end, capacity, location

**Relationships:** One-to-many with workshop_registrations

---

### 7.7 WorkshopRegistration Table (Phase 2)

**Description:** Tracks participant registrations for workshops with cancellation support.

**Key Fields:** id, participant_id, workshop_id, registered_at, cancelled_at, status

**Relationships:** Many-to-one with participants, many-to-one with workshops

---

### 7.8 Team Table (Phase 2)

**Description:** Hackathon teams formed by participants with captain designation.

**Key Fields:** id, name, captain_id, created_at, updated_at

**Relationships:** One-to-many with team_members, many-to-one with participants (captain)

---

### 7.9 TeamMember Table (Phase 2)

**Description:** Join table linking participants to teams with membership status.

**Key Fields:** id, team_id, participant_id, joined_at, left_at, status

**Relationships:** Many-to-one with teams, many-to-one with participants

---

## 8. UI/UX Specifications

This section provides detailed design specifications, wireframes, responsive behavior, accessibility requirements, and branding guidelines for all user interfaces.

### 8.1 Design System

**Description:** Core design tokens, color palette, typography, spacing system, and component library used throughout the platform.

**Topics Covered:**
- Primary/secondary colors
- Typography scale and font families
- Spacing/padding system (8px grid)
- Border radius and shadows
- Breakpoints for responsive design
- Component variants (buttons, cards, inputs)

---

### 8.2 Participant Dashboard Design

**Description:** Complete design specification for participant-facing dashboard including layout, components, interactions, and responsive behavior.

**Topics Covered:**
- Mobile-first layout (single column)
- QR code display (size, positioning, refresh indicator)
- Credit card component design
- Copy button interaction states
- Filter/sort controls
- Navigation structure
- Loading states and error handling

---

### 8.3 Ops Dashboard Design

**Description:** Scanner interface design optimized for mobile/tablet devices with large touch targets and clear scan feedback.

**Topics Covered:**
- Camera viewfinder design
- Scan result display (success/error)
- Mode toggle design (check-in vs food)
- Meal type selector
- Real-time counters
- Recent activity feed
- Offline state indicator

---

### 8.4 Admin Dashboard Design

**Description:** Desktop-optimized admin interface with data tables, forms, and management tools.

**Topics Covered:**
- Multi-column layout for desktop
- Data table design (sortable, searchable, paginated)
- Form layouts for imports and creation
- Modal/drawer patterns
- Statistics dashboard widgets
- Navigation sidebar
- Responsive behavior for tablet/mobile

---

### 8.5 Email Design Templates

**Description:** HTML email templates with mobile-responsive design and plain-text fallbacks.

**Topics Covered:**
- Email layout structure (600px max width)
- Header/footer design
- QR code embedding (inline images)
- Button/link styling
- Plain text version generation
- Dark mode considerations
- Email client compatibility

---

### 8.6 Accessibility Requirements

**Description:** WCAG 2.1 AA compliance requirements for all interfaces including keyboard navigation, screen reader support, and color contrast.

**Topics Covered:**
- Keyboard navigation patterns
- ARIA labels and roles
- Screen reader announcements
- Color contrast ratios (4.5:1 minimum)
- Focus indicators
- Error message accessibility
- Alternative text for images/QR codes

---

## 9. Technical Stack

This section documents all technology choices, architecture decisions, deployment strategy, and infrastructure requirements.

### 9.1 Frontend Architecture

**Description:** Frontend framework selection, state management, routing, and build configuration.

**Technologies:**
- Tanstack Start (React framework)
- Styling approach (Tailwind CSS)
- State management solution
- Routing configuration
- Build tools and optimization

---

### 9.2 Backend Architecture

**Description:** Backend platform, API design, database setup, and serverless functions.

**Technologies:**
- Convex (backend + real-time database)
- Hono (API framework)
- Better Auth (authentication)
- API endpoint structure
- Real-time subscriptions
- Error handling patterns

---

### 9.3 Database Design

**Description:** Database technology, schema design, indexing strategy, and data migration approach.

**Technologies:**
- Convex database (NoSQL/document-based)
- Index strategy for performance
- Data validation rules
- Migration/seeding approach
- Backup strategy

---

### 9.4 Authentication & Authorization

**Description:** Authentication flow implementation, session management, and role-based access control.

**Technologies:**
- Better Auth integration
- Magic link implementation
- Session storage (server-side)
- JWT/token management
- Role-based middleware
- Permission checking logic

---

### 9.5 QR Code Implementation

**Description:** QR code generation library, encoding strategy, signature algorithm, and scanning library.

**Technologies:**
- QR code generation (qrcode library)
- Payload encoding (JWT or custom)
- Signature algorithm (HMAC-SHA256)
- QR scanning (html5-qrcode)
- Camera access handling
- Offline QR support

---

### 9.6 Email Service Integration

**Description:** Email delivery service setup, template management, and delivery monitoring.

**Technologies:**
- Resend API integration
- HTML email templates
- Image embedding (QR codes)
- Delivery status tracking
- Bounce/failure handling
- Rate limiting

---

### 9.7 Deployment & Hosting

**Description:** Hosting platform, deployment pipeline, environment configuration, and domain setup.

**Topics Covered:**
- Hosting platform (Vercel/Netlify)
- CI/CD pipeline
- Environment variables
- Custom domain configuration
- SSL/TLS certificates
- CDN configuration

---

### 9.8 Monitoring & Logging

**Description:** Application monitoring, error tracking, performance monitoring, and log aggregation.

**Technologies:**
- Error tracking (Sentry or similar)
- Performance monitoring
- Log aggregation
- Uptime monitoring
- Alert configuration

---

## 10. Security Requirements

This section outlines security measures, authentication protocols, data protection, and compliance requirements.

### 10.1 Authentication Security

**Description:** Secure authentication implementation including magic link security, session management, and brute force protection.

**Topics Covered:**
- Magic link token generation (cryptographically secure random)
- Token expiration (1 hour)
- One-time use enforcement
- Rate limiting (5 requests per 15 min)
- Session duration (7 days)
- Secure session storage
- Logout functionality

---

### 10.2 QR Code Security

**Description:** QR code signature verification, replay attack prevention, and validation security.

**Topics Covered:**
- HMAC-SHA256 signature algorithm
- Secret key management
- Server-side validation only
- No timestamp validation (permanent QR)
- Session-based duplicate prevention
- Signature verification process

---

### 10.3 API Security

**Description:** API endpoint protection, input validation, SQL injection prevention, and XSS protection.

**Topics Covered:**
- Authentication middleware
- Role-based authorization
- Input sanitization
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF token implementation
- Rate limiting per endpoint

---

### 10.4 Data Protection

**Description:** Sensitive data handling, encryption at rest and in transit, PII protection, and GDPR considerations.

**Topics Covered:**
- HTTPS enforcement
- Database encryption at rest
- Password hashing (not applicable - magic links only)
- PII data handling (emails, names)
- Data retention policies
- Right to deletion
- Data export functionality

---

### 10.5 Admin Access Control

**Description:** Admin privilege management, audit logging, and multi-factor authentication options.

**Topics Covered:**
- Role-based access control (RBAC)
- Admin action audit logs
- IP whitelisting (optional)
- Two-factor authentication (Phase 2)
- Session timeout for admins
- Privilege escalation prevention

---

## 11. Success Criteria

This section defines measurable goals, performance benchmarks, and success metrics for the platform.

### 11.1 Performance Metrics

**Description:** Target performance benchmarks for page load times, API response times, and system reliability.

**Targets:**
- Page load time < 2 seconds (mobile 3G)
- API response time < 500ms (p95)
- QR scan to check-in < 30 seconds
- Email delivery < 2 minutes after trigger
- 99.9% uptime during event hours
- Support 1,000 concurrent users

---

### 11.2 User Experience Metrics

**Description:** Measurable goals for user satisfaction, ease of use, and error rates.

**Targets:**
- 95% successful check-ins (no failures)
- < 1% duplicate food claims (system should prevent all)
- < 5% failed QR scans (ops retry rate)
- Zero participants locked out (authentication failures)
- < 10 support tickets during event
- 90% participants access dashboard before event day

---

### 11.3 Business Metrics

**Description:** Event-level success criteria and key milestones.

**Targets:**
- 1,000 participants imported successfully
- 95% check-in rate (950+ participants checked in)
- All sponsor credits distributed (code assignment)
- 80%+ food claim rate per meal
- Zero security incidents
- Complete audit trail of all transactions

---

### 11.4 Technical Metrics

**Description:** System health indicators and technical performance goals.

**Targets:**
- Zero data loss
- < 0.1% email bounce rate
- Database query time < 100ms (p95)
- No race conditions in code assignment
- Real-time dashboard updates < 5 seconds
- Successful backup/restore capability

---

**End of Requirements Documentation**

---

## Appendices

### Appendix A: Glossary

**Terms and definitions used throughout this document**

*To be filled with key terms like: Luma, Magic Link, QR Code, Credit Type, Food Check-in, etc.*

---

### Appendix B: API Reference

**Complete API endpoint documentation**

*To be filled with API endpoint specifications, request/response formats, authentication requirements*

---

### Appendix C: Database Schema Diagrams

**Entity relationship diagrams and table structures**

*To be filled with visual ERD diagrams showing all table relationships*

---

### Appendix D: Testing Checklist

**Pre-launch testing requirements and scenarios**

*To be filled with test cases for all major flows, edge cases, and acceptance criteria*

---

### Appendix E: Deployment Checklist

**Step-by-step deployment and launch procedures**

*To be filled with deployment steps, environment setup, DNS configuration, pre-launch verification*

---
