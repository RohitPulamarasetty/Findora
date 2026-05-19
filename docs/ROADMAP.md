# ROADMAP.md — Product Roadmap
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## Phase 1: MVP — "Launch Ready" (Weeks 1–5)

**Goal:** A fully functional, production-grade platform for the IITM DS campus.

### Core Capabilities

| Feature | Priority | Status |
|---------|----------|--------|
| Google OAuth (domain-restricted) | P0 | Planned |
| Lost item reporting with images | P0 | Planned |
| Found item reporting with images | P0 | Planned |
| Item browse (feed + grid) | P0 | Planned |
| Full-text search + filters | P1 | Planned |
| Real-time 1:1 messaging | P0 | Planned |
| Item recovery workflow | P0 | Planned |
| Admin dashboard (full) | P0 | Planned |
| Mobile-first responsive UI | P0 | Planned |
| Dark/light mode | P2 | Planned |
| Cloudflare deployment + WAF | P0 | Planned |

**Success Criteria for Launch:**
- All P0 features complete and tested
- Recovery rate tracking active
- Admin can moderate all content
- 0 known P0 security issues

---

## Phase 2: Growth — "Community Adoption" (Weeks 6–10)

**Goal:** Increase adoption, reduce friction, drive word-of-mouth.

### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **In-app notifications** | Badge + notification panel for new messages, claim updates | P1 |
| **Push notifications** | Browser push for messages, claim alerts | P2 |
| **PWA support** | Installable on mobile home screen | P2 |
| **Item sharing** | Share item link externally (no auth required to view shared link) | P2 |
| **Rich media in chat** | Image sharing in messages | P2 |
| **Onboarding flow** | Guided first-use tour for new users | P1 |
| **Email digest** | Daily digest of new reports matching saved searches | P3 |
| **Keyboard shortcuts** | Power user shortcuts for desktop | P3 |

### Infrastructure Improvements

| Improvement | Description |
|-------------|-------------|
| Error tracking | Sentry integration for production error visibility |
| Performance monitoring | Core Web Vitals tracking |
| Analytics | User behavior analytics (privacy-respecting) |
| Image optimization | Auto-convert uploads to WebP, generate thumbnails |
| CDN optimization | Edge caching for item feeds |

---

## Phase 3: Intelligence — "Smart Recovery" (Weeks 11–16)

**Goal:** Use AI/ML to proactively match lost and found items.

### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **AI item matching** | Automatically suggest potential matches between lost/found items using embedding similarity | P1 |
| **Image similarity search** | Upload a photo of an item to find visually similar reports | P2 |
| **Smart notifications** | "We found a potential match for your item!" | P1 |
| **Natural language search** | "I lost something blue near the library" → semantic search | P2 |
| **Duplicate detection** | Alert when a new report looks very similar to an existing one | P2 |

### Technical Stack for Phase 3

- **Embeddings:** OpenAI `text-embedding-3-small` or Supabase `pgvector`
- **Vector search:** Supabase `pgvector` extension
- **Image analysis:** Google Vision API or CLIP model

---

## Phase 4: Scale — "Multi-Campus" (Months 4–6)

**Goal:** Expand beyond IITM DS to other institutions.

### Features

| Feature | Description |
|---------|-------------|
| **Multi-campus support** | Multiple institution instances with separate data, branding |
| **Campus admin** | Institution-level admins with campus-scoped access |
| **SSO support** | Support institution-provided SSO (SAML, custom OAuth) |
| **White-label** | Customizable branding per institution |
| **API for institutions** | Webhook events for integration with campus systems |
| **Usage analytics per campus** | Institution-specific dashboards |

### Business Model Considerations

- **Free tier:** Single campus, up to 500 users
- **Paid tier:** Multiple campuses, unlimited users, advanced features, SLA
- **Enterprise:** Custom deployment, SSO, dedicated support

---

## Phase 5: Platform — "Findora Network" (Month 6+)

**Goal:** Build a network effect and expand the product surface.

### Long-Term Vision

| Feature | Description |
|---------|-------------|
| **Public found items** | Items reported found visible to everyone (no auth) for maximum exposure |
| **Campus marketplace** | Expand to buying/selling campus items (lost/found → items) |
| **Lost pet reports** | Separate vertical for campus pets/animals |
| **Event mode** | Special mode for fests: higher limits, event-scoped visibility |
| **Native iOS/Android** | React Native or Expo app using same Supabase backend |
| **Campus partner integrations** | Integration with campus ERP, hostel management systems |

---

## Deprecation & Technical Debt Schedule

| Item | Timeline | Reason |
|------|----------|--------|
| Migrate FTS to pgvector semantic search | Phase 3 | Better search quality |
| Replace polling fallback with proper reconnection | Phase 2 | Reliability |
| Introduce message reactions | Phase 2 | UX improvement |
| Add database read replicas | Phase 4 | Scale |

---

## Feedback & Iteration Process

1. **Week 1 post-launch:** Collect user feedback via in-app form + direct interviews
2. **Monthly:** Review recovery rate metrics; adjust if < 60% match rate
3. **Quarterly:** Roadmap review; reprioritize based on user data + campus feedback
4. **Continuous:** Admin abuse/flag data informs moderation policy updates
