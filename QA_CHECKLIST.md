# UG-CLINIC-FYP — Pre-Release QA & Testing Checklist

This comprehensive Quality Assurance (QA) document serves as the release readiness gate for the University of Ghana Student Clinic Web Application. All items must be validated and signed off prior to staging deployment and final release.

---

## Table of Contents
1. [Release Sign-off Criteria](#1-release-sign-off-criteria)
2. [Automated Code Quality & Build Checks](#2-automated-code-quality--build-checks)
3. [Authentication & Access Control Test Cases](#3-authentication--access-control-test-cases)
4. [Student Portal & Appointment Booking Flow](#4-student-portal--appointment-booking-flow)
5. [Staff Operations & Clinic Management Flow](#5-staff-operations--clinic-management-flow)
6. [Public Pages & Health Resources](#6-public-pages--health-resources)
7. [Security & Hardening Checklist](#7-security--hardening-checklist)
8. [Cross-Browser & Responsiveness Matrix](#8-cross-browser--responsiveness-matrix)
9. [Performance & Core Web Vitals](#9-performance--core-web-vitals)
10. [Accessibility (WCAG 2.1 AA)](#10-accessibility-wcag-21-aa)
11. [QA Execution Log](#11-qa-execution-log)

---

## 1. Release Sign-off Criteria

Before issuing a release candidate:
- [ ] 100% of TypeScript static analysis passes without errors (`npm run type-check`).
- [ ] Next.js production build (`npm run build`) generates clean static/dynamic pages with 0 warnings.
- [ ] All Critical & High severity test cases pass.
- [ ] Zero unhandled promise rejections or runtime console errors during standard user journeys.
- [ ] Database migrations execute cleanly from scratch (`prisma migrate reset` -> `prisma migrate dev` -> `prisma:seed`).
- [ ] Environment variable validation completes with all required secrets defined.

---

## 2. Automated Code Quality & Build Checks

| Check | Command | Target | Status |
|---|---|---|---|
| Frontend Type Check | `cd frontend && npm run type-check` | Zero compilation errors | ⬜ |
| Frontend Production Build | `cd frontend && npm run build` | All 25 routes render cleanly | ⬜ |
| Backend Linting | `cd backend && npm run lint` | ESLint passes without errors | ⬜ |
| Backend Unit / Integration Tests | `cd backend && npm run test` | 100% test suite pass rate | ⬜ |
| Database Seed Validation | `cd backend && npm run prisma:seed` | Seed users, services, time slots created | ⬜ |

---

## 3. Authentication & Access Control Test Cases

### 3.1 Student Authentication
- [ ] **TC-AUTH-01 (Registration):** Registering with valid student details (Student ID, UG email `@st.ug.edu.gh`, password) creates account and redirects appropriately.
- [ ] **TC-AUTH-02 (Password Policy):** Passwords under 8 characters or missing required complexity (uppercase, lowercase, number, special char) are rejected with clear error messages.
- [ ] **TC-AUTH-03 (Student Login):** Valid credentials authenticate and populate Zustand auth state + local storage.
- [ ] **TC-AUTH-04 (Invalid Login):** Incorrect password shows descriptive toast/error without leaking account existence unnecessarily.
- [ ] **TC-AUTH-05 (Account Lockout):** Exceeding configured failed login attempts locks account temporarily.
- [ ] **TC-AUTH-06 (Token Refresh):** Expired access token triggers silent refresh without interrupting active user workflows.
- [ ] **TC-AUTH-07 (Logout):** Logging out clears auth tokens, invalidates refresh token in Redis/DB, and redirects to `/login`.

### 3.2 Password Recovery & OTP
- [ ] **TC-AUTH-08 (Forgot Password Request):** Submitting registered student email sends recovery link/OTP.
- [ ] **TC-AUTH-09 (OTP Validation):** 6-digit OTP verification enforces rate-limiting and expiration timer (e.g., 5-minute validity window).
- [ ] **TC-AUTH-10 (Security Questions):** Answering predefined security questions correctly allows password reset.
- [ ] **TC-AUTH-11 (Backup Recovery Codes):** Single-use backup codes successfully authenticate user and become invalid after one use.

### 3.3 Staff Authentication & 2FA
- [ ] **TC-STAFF-01 (Portal Gate):** Navigating directly to `/staff/overview` while unauthenticated redirects to `/staff-portal-access`.
- [ ] **TC-STAFF-02 (2FA Challenge):** Entering valid staff credentials triggers mandatory 2-step verification code dispatch.
- [ ] **TC-STAFF-03 (2FA Completion):** Entering valid 6-digit 2FA token completes login and redirects to `/staff/overview`.
- [ ] **TC-STAFF-04 (Role Enforcement):** Student accounts attempting to log into staff portal are rejected with permission denial.

---

## 4. Student Portal & Appointment Booking Flow

### 4.1 Appointment Booking Wizard (`/demo-booking`)
- [ ] **TC-BOOK-01 (Service Selection):** User can pick from available clinical services (General Consultation, Dental, Eye Checkup, etc.).
- [ ] **TC-BOOK-02 (Date & Time Picker):** Interactive calendar displays available dates. Past dates and days without slots are disabled.
- [ ] **TC-BOOK-03 (Slot Concurrency):** Fully booked time slots show disabled state and cannot be selected.
- [ ] **TC-BOOK-04 (Doctor & Reason Form):** User can optionally specify reason for visit, symptoms, or doctor preference.
- [ ] **TC-BOOK-05 (Booking Confirmation):** Final confirmation screen generates appointment ID and summary.
- [ ] **TC-BOOK-06 (Print / Download Receipt):** Confirmation slip prints cleanly without web navigation headers (`@media print` rules verified).

### 4.2 Student Dashboard (`/dashboard`)
- [ ] **TC-DASH-01 (Upcoming Appointments):** Active appointments render with date, service badge, assigned doctor, and status badge.
- [ ] **TC-DASH-02 (Cancellation Flow):** Student can cancel a `CONFIRMED` or `PENDING` appointment; cancellation immediately updates dashboard state and frees the slot.
- [ ] **TC-DASH-03 (Reschedule Flow):** Reschedule button links directly to `/demo-booking?reschedule=<appointmentId>` with pre-filled context.
- [ ] **TC-DASH-04 (Inactivity Timeout):** Idle sessions display inactivity warning and log out automatically after timeout.

---

## 5. Staff Operations & Clinic Management Flow

### 5.1 Staff Overview (`/staff/overview`)
- [ ] **TC-OPS-01 (Live KPI Cards):** Total Appointments Today, Pending Confirmations, Available Doctors, and Total Patients render accurate counts.
- [ ] **TC-OPS-02 (Doctor Availability Toggle):** Logged-in doctor can toggle status between `🟢 Available (Free)` and `🔴 Busy`; updates reflect in real-time.
- [ ] **TC-OPS-03 (Auto-Assign):** Auto-assign button assigns pending appointments evenly among available doctors.

### 5.2 Appointments Management (`/staff/appointments`)
- [ ] **TC-OPS-04 (Filtering & Search):** Appointments list filterable by date range, doctor, service type, and status (`CONFIRMED`, `COMPLETED`, `CANCELLED`, etc.).
- [ ] **TC-OPS-05 (Manual Doctor Assignment):** Staff can reassign any appointment to an available doctor.
- [ ] **TC-OPS-06 (Status Transition):** Status transitions (e.g., `CONFIRMED` -> `IN_PROGRESS` -> `COMPLETED`) persist immediately and update audit trail.

### 5.3 Student Directory (`/staff/students`)
- [ ] **TC-OPS-07 (Student Lookup):** Searching by Student ID, full name, or email returns instantaneous matching student records.
- [ ] **TC-OPS-08 (Medical History View):** Clicking a student presents full consultation history and previous clinic visits.

### 5.4 Resource Management (`/staff/resources`)
- [ ] **TC-OPS-09 (Resource Upload):** Staff can upload PDF/doc health guidelines with title, category, and tags.
- [ ] **TC-OPS-10 (Resource Edit/Delete):** Uploaded resources can be edited or removed from public view.

---

## 6. Public Pages & Health Resources

- [ ] **TC-PUB-01 (Homepage):** Hero video (`/ug-video.mp4`) loads smoothly with fallback poster; CTA buttons navigate correctly.
- [ ] **TC-PUB-02 (About Page):** Milestones, clinic leadership, and campus achievements display cleanly with high-resolution imagery.
- [ ] **TC-PUB-03 (Services Page):** Clinic operating hours and service schedule display cleanly across desktop and mobile.
- [ ] **TC-PUB-04 (Health Resources):** Search input filters articles and guides by keyword or category tag.
- [ ] **TC-PUB-05 (Contact Form):** Submitting contact enquiry validates inputs and provides instant confirmation toast.
- [ ] **TC-PUB-06 (Legal Pages):** `/accessibility`, `/privacy`, and `/terms` render valid semantic content.

---

## 7. Security & Hardening Checklist

- [ ] **SEC-01 (JWT Verification):** Tokens verified using secure cryptographic secret (`HS256`/`RS256`); payload tampering is rejected with 401.
- [ ] **SEC-02 (SQL Injection):** All database operations utilize parameterized queries via Prisma ORM.
- [ ] **SEC-03 (Rate Limiting):** Brute-force attacks against `/api/v1/auth/login` trigger `429 Too Many Requests` after threshold.
- [ ] **SEC-04 (XSS Prevention):** HTML content sanitized; React escapes interpolated strings by default; DOMPurify used on rich text.
- [ ] **SEC-05 (CORS Configuration):** CORS headers strictly restricted to configured frontend domain (`CORS_ORIGIN`).
- [ ] **SEC-06 (Security Headers):** Helmet sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and Content Security Policy.
- [ ] **SEC-07 (Password Storage):** Passwords hashed using bcrypt with salt rounds >= 12.
- [ ] **SEC-08 (Sensitive Data Masking):** API responses omit `passwordHash`, `twoFactorSecret`, and sensitive token data.

---

## 8. Cross-Browser & Responsiveness Matrix

| Viewport / Browser | Chrome | Firefox | Safari | Edge | Mobile Safari (iOS) | Chrome (Android) |
|---|---|---|---|---|---|---|
| **Mobile (375px - 428px)** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Tablet (768px - 1024px)** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| **Desktop (1280px - 1920px)** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 9. Performance & Core Web Vitals

- [ ] **Largest Contentful Paint (LCP):** < 2.5 seconds on fast 4G connection.
- [ ] **Interaction to Next Paint (INP):** < 200 ms during UI interactions.
- [ ] **Cumulative Layout Shift (CLS):** < 0.1 on all public pages.
- [ ] **Image Optimization:** All campus imagery optimized via `next/image` with WebP/AVIF format delivery.
- [ ] **Bundle Size:** No individual route chunk exceeds 350 KB compressed.

---

## 10. Accessibility (WCAG 2.1 AA)

- [ ] **Keyboard Navigation:** All interactive elements (buttons, links, modal dialogues, dropdowns) are navigable using `Tab`, `Space`, and `Enter`.
- [ ] **Color Contrast:** Text-to-background contrast ratio meets or exceeds 4.5:1 for normal text and 3:1 for large text.
- [ ] **ARIA Labels:** Form inputs, iconography buttons, and modal dialogs have meaningful `aria-label` or `aria-describedby` attributes.
- [ ] **Focus Visible:** Clear outline/ring indicator rendered when navigating via keyboard.
- [ ] **Screen Reader Support:** Tested using NVDA / VoiceOver on key booking and authentication flows.

---

## 11. QA Execution Log

| Date | Tester / Role | Module Tested | Result (Pass / Fail) | Notes / Issues Logged |
|---|---|---|---|---|
| 2026-08-31 | QA Team | Static Type Checking | Pass | `tsc --noEmit` clean on Next.js 16 |
| 2026-08-31 | QA Team | Production Build | Pass | 25/25 routes compiled |
| | | | | |

---

*UG-CLINIC-FYP Quality Assurance & Release Engineering*
