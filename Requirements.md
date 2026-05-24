# CalorieTrack — Business Requirements Document
**Version:** 1.0  
**Date:** May 2026  
**Platform:** AWS Amplify (Web Application)

---

## Diagrams

### Diagram 1 — Roles and permissions
Shows what each role can do. The Admin role includes everything the Regular User can do, plus catalog management and user administration.

| Admin only | Both roles |
|---|---|
| Invite and deactivate users | Log meals for self |
| Add / edit / delete food items | Set own calorie goal |
| Set meal serving sizes | Share a day's log |
| Set calorie goal for any user | Import a shared log |
| Proxy log for any user | Proxy log for linked members |

### Diagram 2 — Core user flows

**Meal logging:** Login → select date & meal slot (or switch to linked member) → search food item → enter grams (quick pill or custom) → calories auto-calculated → entry saved → daily total and goal updated.

**Day sharing:** Tap "Share today" → choose method (in-app user search or copy link) → notification sent / link copied → recipient views shared log (login required) → import to own log on chosen date → adjust grams if needed (calories recalculate live) → saved as own entries.

### Diagram 3 — AWS Amplify architecture
Three layers managed via a single Amplify CLI deployment pipeline:
- **Browser** — React app on Amplify Hosting (S3 + CloudFront CDN)
- **Amplify backend** — Cognito (auth + invite flow), AppSync (GraphQL API), Lambda (share tokens + notifications)
- **AWS data layer** — Cognito User Pool (identities, roles, invite tokens), DynamoDB (all app data: logs, food items, notifications), S3 (share link metadata cache), SES (invite emails)

---

## 1. Product Overview

CalorieTrack is a web-based calorie logging application hosted on AWS Amplify. It allows users to track daily food intake across defined meal slots, with support for family/group proxy logging, day sharing, and progress tracking against a daily calorie goal. An admin role manages the food catalog, user accounts, and meal configuration.

---

## 2. Roles & Access

### 2.1 Role Definitions

| Role | Description |
|---|---|
| **Admin** | Manages food catalog, user accounts, and meal configuration. Can also use all regular user features. |
| **Regular User** | Logs meals for themselves and any linked members. Can share and import day logs. |

> **Note:** A single account can hold both roles simultaneously (e.g. a dietitian who manages the catalog and also logs their own meals).

### 2.2 User Onboarding
- **Admin-only invitations.** There is no self-registration. Only an Admin can create user accounts and send invitations.
- Invited users receive an email with a one-time setup link to set their password.
- Admin can assign the Admin role to any user at account creation or later.

---

## 3. Food Catalog Management (Admin)

### 3.1 Add / Edit / Delete Food Items
- Admin can create a food item with the following fields:
  - **Name** (required) — e.g. "Brown Rice"
  - **Calories per 100g** (required) — numeric
  - **Category** (optional) — e.g. Grains, Protein, Dairy, Vegetables, Fruits, Snacks, Beverages
- Admin can edit or soft-delete any food item.
- Deleted items remain on historical logs but are hidden from new entry search.

### 3.2 Food Search
- All users can search the food catalog by name when logging a meal.
- Search should support partial/fuzzy matching.

---

## 4. Meal Configuration (Admin)

### 4.1 Meal Slots
The system supports **5 fixed meal slots** per day:

| # | Meal Slot |
|---|---|
| 1 | Breakfast |
| 2 | Morning Snack |
| 3 | Lunch |
| 4 | Evening Snack |
| 5 | Dinner |

### 4.2 Predefined Serving Sizes
- For each meal slot, Admin can define one or more **predefined serving sizes** (in grams) to act as quick-select shortcuts when logging.
- Example: Breakfast → [30g, 60g, 100g, 150g]
- These are global defaults; they are not user-specific.
- Users can always override with a custom gram value.

---

## 5. Meal Logging (All Users)

### 5.1 Logging for Self
- A user selects a **date** (defaults to today) and a **meal slot**.
- Within a meal slot, the user can add **multiple food entries**. Each entry consists of:
  - Food item (searched from catalog)
  - Quantity in **grams** (via predefined serving size shortcut or custom input)
  - Calories are **auto-calculated**: `(calories_per_100g / 100) × grams`
- Users can edit or delete individual food entries at any time.

### 5.2 Daily Summary
- Each day view shows:
  - Per-meal calorie subtotals
  - Total calories consumed for the day
  - Daily calorie goal
  - Progress indicator (e.g. progress bar: consumed vs. goal)
  - Remaining calories (or overage if exceeded)

### 5.3 Daily Calorie Goal
- Each user sets their own daily calorie goal (in kcal).
- Admins can also set/override this goal for any user.
- Goal is persistent until the user changes it.

---

## 6. Proxy Logging (Linked Members)

### 6.1 Linking Members
- A user can **link other registered users** to their account as "members" (e.g. family members, clients).
- Linking requires mutual consent: the linked user receives a notification/invite and must accept.
- A user can have multiple linked members.

### 6.2 Logging on Behalf of a Member
- From their own login, a user can switch context to any of their linked members and log meals as if they were that user.
- All data is stored against the **member's** profile, not the proxy user's.
- A clear visual indicator is shown when the user is operating in "logging for: [Member Name]" mode.

### 6.3 Admin Proxy Logging
- Admins can log for **any** user in the system without needing a formal member link.
- However, admins have **no special visibility** into other users' logs — they can only view their own day log unless they are actively in proxy-logging mode for a specific user.

---

## 7. Day Sharing

### 7.1 What Gets Shared
- A user can share their **complete food log for a specific day** (all meal slots and entries).

### 7.2 Sharing Methods
Two mechanisms are supported:

| Method | Description |
|---|---|
| **Shareable Link** | Generates a unique URL. The recipient **must be logged in** to view or import — unauthenticated users are redirected to the login page. |
| **In-App Share** | The user searches for another registered user by name or email and shares directly with them. Recipient is notified via an **in-app bell notification**. |

### 7.3 Importing a Shared Day
- The recipient can **import** the shared day log into their own account on a chosen date.
- After import, the recipient can:
  - Change the gram quantity for any entry
  - Delete individual entries
  - Add new entries
- Calories are recalculated live as quantities change.
- Imported entries are fully independent of the original — changes do not affect the sharer's log.

### 7.4 Link Expiry
- Shareable links expire after **7 days** by default (Admin can configure this).
- The owner can also manually revoke a link at any time.

---

## 8. Reporting & History

### 8.1 Day-by-Day View
- Users can navigate backward/forward through dates to view past logs.
- Each day shows the full meal breakdown and calorie totals.

### 8.2 Weekly trend chart
- A 7-day bar or line chart showing daily calories consumed vs. goal for the current week.
- User can navigate to previous weeks.
- Bars/lines are colour-coded: within goal (green), over goal (red).
- Hovering or tapping a day jumps to that day's log.

### 8.3 Monthly summary chart
- A calendar-style or bar chart view of the full month.
- Each day shows total calories consumed; colour-coded against goal.
- Summary stats for the month: average daily intake, days within goal vs. over goal, best and worst day.
- User can navigate to previous months.

---

## 9. User Management (Admin)

| Action | Description |
|---|---|
| Create user | Admin enters name, email, and role; system sends invite email |
| Edit user | Admin can update name, role, or daily calorie goal |
| Deactivate user | Soft-delete; user cannot log in but data is preserved |
| View all users | Admin sees a list of all users with their roles and status |

---

## 10. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Hosting** | AWS Amplify (static hosting + serverless backend) for low cost |
| **Authentication** | AWS Cognito via Amplify Auth; email/password with invite flow |
| **Data** | AWS AppSync (GraphQL) + DynamoDB, or Amplify DataStore |
| **Sharing Links** | Unique tokens stored in DB; validated on access |
| **Mobile-Friendly** | Responsive UI; usable on phone browsers without a native app |
| **Scalability** | Serverless architecture scales to low user counts cost-effectively |

---

## 11. Out of Scope (v1)

- Macro tracking (protein, carbs, fat) — can be added later with minimal schema change
- Barcode scanning for food items
- Native iOS/Android apps
- Integration with external food databases (USDA, etc.)
- Water intake tracking
- Exercise / calorie burn tracking

---

## 12. Decisions Log

| # | Question | Decision |
|---|---|---|
| 1 | Should shared links require the viewer to be logged in, or truly public? | ✅ **Login required** — viewer must be a registered user to access shared day logs |
| 2 | Can a user unlink a member themselves, or does it require admin? | ✅ **Admin only** — only an Admin can unlink members |
| 3 | Notification mechanism for in-app sharing — email, in-app bell, or both? | ✅ **In-app bell only** — no email notifications |
| 4 | Should admins see all users' daily logs, or only their own? | ✅ **Own logs only** — admins have no special visibility into other users' data |
| 5 | Is there a limit on how many members a user can link? | ✅ **No limit** |
