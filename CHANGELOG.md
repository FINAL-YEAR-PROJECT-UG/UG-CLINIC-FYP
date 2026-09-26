# Changelog

All notable changes to the **UG-CLINIC-FYP** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-31

### Initial Production Candidate Release

#### Added
- **Core Platform Architecture:**
  - Modern Next.js 16 (App Router) + React 19 + Tailwind CSS 4 frontend architecture.
  - Express.js + TypeScript REST API backend powered by Prisma 7 and PostgreSQL.
  - Redis 7 cache, session invalidation, and Bull queue integration.
  - Multi-container Docker Compose configuration for one-command local/staging deployment.

- **Authentication & Security:**
  - Student registration and login with student ID and email validation (`@st.ug.edu.gh`).
  - Refresh-token rotation and multi-session tracking with automatic timeout protection.
  - Password recovery via OTP (email/SMS), security question challenges, and backup recovery codes.
  - Dedicated Staff Portal access gateway (`/staff-portal-access`) with mandatory 2-Factor Authentication (2FA).
  - Rate limiting, slow-down mechanisms, and Helmet security headers on all API endpoints.

- **Appointment System:**
  - Multi-step interactive booking wizard (`/demo-booking`) supporting service selection, live date/time slot availability, doctor choice, and instant confirmation slip generation.
  - Appointment rescheduling and patient cancellation flow.
  - Print-optimised appointment receipt layout.

- **Staff & Clinical Operations:**
  - Executive KPI dashboard (`/staff/overview`) showing real-time appointment metrics, doctor availability, and clinic statistics.
  - Live doctor status switch (`AVAILABLE` / `BUSY`) with instant database synchronization.
  - Queue management dashboard (`/staff/appointments`) with status transitions, manual reassignments, and automated doctor assignment triggers.
  - Student medical records registry (`/staff/students`) with appointment history view.
  - Medical health resource manager (`/staff/resources`) with document upload, categorisation, and publishing tools.

- **Public Experience & Design:**
  - University of Ghana campus branding and styling with tailored gradient atmospheric backdrops.
  - Hero background video banner on public marketing pages.
  - Health Resources Library (`/resources`) with real-time text and category search.
  - Interactive Contact Directory (`/contact`) and campus emergency lookup.
  - Comprehensive legal and compliance pages (`/accessibility`, `/privacy`, `/terms`).

- **Quality Assurance & Documentation:**
  - Comprehensive pre-release QA checklist (`QA_CHECKLIST.md`).
  - Production-ready `README.md` with complete API tables, setup instructions, and architecture diagrams.
  - Postman API collections and environment templates in `/postman/`.

---

## [1.1.0] - 2026-09-25

### Enhanced Features & Security Improvements

#### Added
- **News & Announcements System:**
  - Complete news management system with category-based organization (announcement, health alert, event)
  - Priority levels (low, medium, high, urgent) for content classification
  - Staff-only publishing capabilities with author attribution
  - Pagination support for large news datasets
  - Public read access for published content

- **Enhanced Security Scanning:**
  - Automated security scanning for all resource uploads
  - Malicious content detection and automatic flagging
  - Security scan status tracking (CLEAN, MALICIOUS, SUSPICIOUS)
  - Re-scanning on content updates
  - Public article submission workflow with approval process

- **AI Operations Console:**
  - Natural language interface for clinic operations
  - Batch doctor status updates (e.g., "set 3 doctors available")
  - Time slot management commands (e.g., "block slots from 2pm")
  - Support for both numeric and word-based quantity parsing
  - Real-time command feedback and execution status

- **Advanced Analytics:**
  - Daily trend analysis for clinic usage patterns
  - Enhanced KPI dashboard with historical data
  - Visual trend tracking for appointment statistics
  - Comprehensive operational metrics display

- **Service Resolution System:**
  - Intelligent service ID resolution with multiple fallback strategies
  - Support for UUID, alias keys, and partial name matching
  - Auto-creation of missing services to prevent booking failures
  - Case-insensitive fuzzy matching for improved user experience

- **Enhanced API Endpoints:**
  - News management endpoints (`/api/v1/news`)
  - Public article submission endpoint (`/api/v1/resources/submit-article`)
  - Resource review workflow (`/api/v1/resources/:id/review`)
  - Batch doctor status updates (`/api/v1/staff/batch-update-doctor-statuses`)
  - Enhanced time slot management with session filtering

#### Changed
- Updated README.md with comprehensive recent enhancements
- Enhanced API documentation with new endpoints
- Improved security scanning integration across resource management
- Refined staff operations with AI-powered console interface

#### Documentation
- Added comprehensive backend controllers export with full source code
- Updated defense documentation with latest feature implementations
- Enhanced project documentation with security architecture details
- Expanded API reference with new news and enhanced resource endpoints

---

[1.0.0]: https://github.com/your-org/UG-CLINIC-FYP/releases/tag/v1.0.0
