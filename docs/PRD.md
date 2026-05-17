# PRD.md — Product Requirements Document
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0
**Status:** Draft
**Last Updated:** 2026-05-17
**Owner:** Findora Core Team

---

## 1. Overview

### 1.1 Product Summary

Findora is a production-grade, mobile-first web application designed to digitize and streamline the Lost & Found process on college campuses, student fests, and large gatherings. It replaces fragmented WhatsApp groups, physical notice boards, and verbal word-of-mouth with a secure, centralized, and real-time platform.

### 1.2 Problem Statement

Campus lost-and-found processes today are:
- **Disorganized** — No central system; items posted across multiple WhatsApp groups, Instagram stories, and notice boards.
- **Insecure** — No identity verification; anyone can claim anything.
- **Slow** — Item recovery takes days or never happens.
- **Untrackable** — No lifecycle management; cases never close cleanly.

### 1.3 Solution

Findora provides:
- A verified, domain-restricted platform (only `@ds.study.iitm.ac.in` users)
- Structured item reporting with rich metadata
- Secure in-app messaging for coordination
- A full item lifecycle from `LOST` → `COMPLETED`
- Admin moderation and analytics

### 1.4 Target Users

| User Type | Description |
|-----------|-------------|
| **Item Owner** | Student/user who lost an item and wants to recover it |
| **Item Finder** | Student/user who found an item and wants to return it |
| **Admin** | Platform operator with moderation and management access |

---

## 2. Goals & Success Metrics

### 2.1 Product Goals

- Reduce average item recovery time to under 48 hours
- Achieve 80%+ item resolution rate for matched lost/found pairs
- Build trust through identity verification and secure communication
- Establish Findora as the default campus lost-and-found tool

### 2.2 Key Metrics (KPIs)

| Metric | Target |
|--------|--------|
| Time to item recovery | < 48 hours |
| Report submission → match rate | > 60% |
| User registration → first report | < 5 minutes |
| Monthly active users | 500+ (campus-scale) |
| Admin response time to reports | < 2 hours |
| Chat message delivery latency | < 500ms |

---

## 3. User Stories

### 3.1 Authentication

- As a student, I want to sign in with my Google account so I don't have to remember a password.
- As a platform, I want to restrict access to `@ds.study.iitm.ac.in` emails only, so only verified campus members use the system.
- As a user, I want my session to persist across page refreshes without re-login.

### 3.2 Lost Item Reports

- As an item owner, I want to report a lost item with a title, description, category, location, date, and photos.
- As an item owner, I want to browse all found items to search for mine.
- As an item owner, I want to filter results by category, date, and location.
- As an item owner, I want to view a detailed page for any found item.

### 3.3 Found Item Reports

- As a finder, I want to report a found item with full details and photos.
- As a finder, I want to connect with the item's owner securely inside the platform.

### 3.4 Messaging

- As an owner or finder, I want to start a private in-app conversation to coordinate handover.
- As a user, I want to see real-time message delivery with read receipts.
- As a user, I want the chat to lock automatically after the item is recovered.

### 3.5 Item Recovery

- As an owner, I want to mark an item as "Received" to close the case.
- As a user, I want completed cases to be archived and inaccessible for new messages.

### 3.6 Admin

- As an admin, I want to view all users, reports, and chats.
- As an admin, I want to remove spam or abusive reports.
- As an admin, I want to ban users or email addresses.
- As an admin, I want to view platform analytics.

---

## 4. Functional Requirements

### 4.1 Authentication System

| ID | Requirement |
|----|-------------|
| AUTH-01 | Google OAuth 2.0 sign-in via Supabase Auth |
| AUTH-02 | Domain restriction: only `@ds.study.iitm.ac.in` allowed |
| AUTH-03 | Post-auth email domain validation hook |
| AUTH-04 | Session persistence with Supabase JWT |
| AUTH-05 | Protected routes: unauthenticated users redirected to `/login` |
| AUTH-06 | User profile auto-creation on first sign-in |
| AUTH-07 | Banned users blocked on login attempt |

### 4.2 Item Reporting

| ID | Requirement |
|----|-------------|
| ITEM-01 | Create lost item report with: title, description, category, location, date, images |
| ITEM-02 | Create found item report with same fields |
| ITEM-03 | Upload up to 5 images per report (max 5MB each, JPEG/PNG/WebP) |
| ITEM-04 | Images stored in Supabase Storage with CDN delivery |
| ITEM-05 | Item statuses: LOST, FOUND, CLAIM_PENDING, VERIFIED, COMPLETED, CLOSED |
| ITEM-06 | Items are editable by owner within 24 hours |
| ITEM-07 | Duplicate submission prevention (rate limit + content hash check) |

### 4.3 Search & Discovery

| ID | Requirement |
|----|-------------|
| SEARCH-01 | Full-text search on title and description |
| SEARCH-02 | Filter by: category, date range, location, status |
| SEARCH-03 | Sort by: newest, oldest, most recent activity |
| SEARCH-04 | Paginated results (20 items per page) |
| SEARCH-05 | Search debounce (300ms) |

### 4.4 Messaging System

| ID | Requirement |
|----|-------------|
| MSG-01 | Create conversation between owner and finder for a specific item |
| MSG-02 | Only authorized participants (owner + finder) can access a conversation |
| MSG-03 | Real-time message delivery via Supabase Realtime |
| MSG-04 | Read receipts and message states (sent, delivered, read) |
| MSG-05 | Typing indicators |
| MSG-06 | Messages locked/read-only after case COMPLETED |
| MSG-07 | Admin can view any conversation |

### 4.5 Recovery Workflow

| ID | Requirement |
|----|-------------|
| RECOVERY-01 | Owner can mark item as "Received" from item detail page or chat |
| RECOVERY-02 | Status transitions to COMPLETED |
| RECOVERY-03 | Item moves to "Completed Cases" archive |
| RECOVERY-04 | Chat becomes read-only |
| RECOVERY-05 | Both users notified of case closure |

### 4.6 Admin Dashboard

| ID | Requirement |
|----|-------------|
| ADMIN-01 | View all users with filter/search |
| ADMIN-02 | View all reports with filter/search |
| ADMIN-03 | Delete any report |
| ADMIN-04 | Ban/suspend any user |
| ADMIN-05 | Ban email addresses |
| ADMIN-06 | View all conversations |
| ADMIN-07 | View platform analytics (reports/day, recovery rate, active users) |
| ADMIN-08 | Manage abuse/spam flagged content |
| ADMIN-09 | Role-based access: only `role = 'admin'` in users table |

---

## 5. Non-Functional Requirements

### 5.1 Performance

- Page load time (LCP): < 2.5 seconds on 4G
- Time to Interactive (TTI): < 3.5 seconds
- Chat message delivery: < 500ms
- Image uploads: progress feedback, non-blocking UI

### 5.2 Security

- All API routes authenticated via Supabase JWT
- Row Level Security on all Supabase tables
- Cloudflare WAF + rate limiting
- File type and size validation on upload
- No sensitive data in client-side storage beyond Supabase session
- Profanity filtering on submitted text fields

### 5.3 Reliability

- Target uptime: 99.9% (Supabase SLA + Cloudflare Pages)
- Graceful degradation for Realtime disconnections
- Retry logic for failed API calls

### 5.4 Scalability

- Stateless Next.js deployment on Cloudflare Pages (edge)
- Database indexed for search performance
- Image CDN via Supabase Storage + Cloudflare CDN

### 5.5 Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigable
- Screen reader support (semantic HTML + ARIA)
- Color contrast ratios met

---

## 6. Constraints & Assumptions

- **Domain restriction** is non-negotiable; cannot be bypassed
- MVP targets a single campus; multi-campus support is a future roadmap item
- No native mobile app; progressive web app (PWA) capability is a stretch goal
- Supabase free tier may need upgrading at scale (plan accordingly)
- Admin is a single user initially; multi-admin is a future feature

---

## 7. Out of Scope (MVP)

- Push notifications (stretch goal)
- Multi-campus support
- Native iOS/Android app
- AI-powered item matching
- QR code generation for found items
- Payment/reward system
- Public-facing item listings (no auth required)

---

## 8. Timeline & Milestones

| Milestone | Description | Target |
|-----------|-------------|--------|
| M1 | Auth + DB Schema + Routing | Week 1 |
| M2 | Item CRUD + Image Upload | Week 2 |
| M3 | Search, Filter, Browse | Week 2 |
| M4 | Realtime Messaging | Week 3 |
| M5 | Recovery Workflow | Week 3 |
| M6 | Admin Dashboard | Week 4 |
| M7 | Security Hardening | Week 4 |
| M8 | QA + Deployment | Week 5 |

---

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Supabase Realtime instability | Low | High | Add reconnect logic + fallback polling |
| Image upload abuse | Medium | Medium | File validation + size limits + rate limiting |
| Domain restriction bypass | Low | High | Server-side validation in Supabase RLS + auth hook |
| Low adoption | Medium | High | Onboarding flow + campus promotion strategy |
| Admin abuse | Low | High | Audit log for all admin actions |
