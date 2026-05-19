# API_SPEC.md — API Specification
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0
**Base URL:** `https://findora.app/api`
**Authentication:** Supabase JWT Bearer token (via cookie in SSR context)

---

## 1. API Design Principles

- All routes require authentication unless marked `[PUBLIC]`
- Request bodies validated with Zod schemas
- Consistent JSON response envelope
- HTTP status codes follow RFC 7231
- Rate limiting enforced at Cloudflare edge layer

### Response Envelope

**Success:**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 143
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "The requested item does not exist.",
    "status": 404
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid session |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `DOMAIN_RESTRICTED` | 403 | Email domain not allowed |
| `USER_BANNED` | 403 | Account is banned |
| `CONFLICT` | 409 | Duplicate submission |
| `SERVER_ERROR` | 500 | Internal server error |

---

## 2. Authentication Endpoints

These are handled by Supabase Auth directly. The Next.js app configures the OAuth callback route.

### `GET /auth/callback`

Supabase OAuth callback. Exchanges code for session.

**Query Params:**
- `code` — OAuth authorization code
- `next` — Redirect destination after login

**Response:** Redirect to `next` param or `/home`

---

## 3. Items API

### `GET /api/items`

Browse all items with optional filters.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `lost\|found\|all` | `all` | Item type |
| `status` | `active\|completed\|all` | `active` | Filter by lifecycle status |
| `category` | string | — | Filter by category enum |
| `q` | string | — | Full-text search query |
| `location` | string | — | Location keyword filter |
| `from` | date | — | Date occurred from (YYYY-MM-DD) |
| `to` | date | — | Date occurred to (YYYY-MM-DD) |
| `page` | integer | 1 | Page number |
| `per_page` | integer | 20 | Items per page (max 50) |
| `sort` | `newest\|oldest` | `newest` | Sort order |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "lost",
      "status": "lost",
      "title": "Black AirPods Pro",
      "description": "Lost during the tech fest...",
      "category": "electronics",
      "location": "Main Auditorium",
      "date_occurred": "2026-05-10",
      "created_at": "2026-05-10T14:23:00Z",
      "user": {
        "id": "uuid",
        "full_name": "Arjun Kumar",
        "avatar_url": "https://..."
      },
      "images": [
        {
          "id": "uuid",
          "public_url": "https://...",
          "display_order": 0
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 143
  }
}
```

---

### `POST /api/items`

Create a new item report.

**Request Body:**
```json
{
  "type": "lost",
  "title": "Black AirPods Pro",
  "description": "Lost during the tech fest near the main stage.",
  "category": "electronics",
  "location": "Main Auditorium",
  "date_occurred": "2026-05-10"
}
```

**Validation:**
- `type`: required, enum `lost|found`
- `title`: required, 5–100 chars
- `description`: required, 10–1000 chars
- `category`: required, valid category enum
- `location`: required, 2–200 chars
- `date_occurred`: required, must not be future date

**Rate Limit:** 3 items per hour per user

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "type": "lost",
    "status": "lost",
    ...
  }
}
```

---

### `GET /api/items/:id`

Get a single item by ID.

**Response `200`:** Full item object (same as above, with all images)

**Response `404`:** Item not found

---

### `PATCH /api/items/:id`

Update an item. Owner only. Allowed within 24 hours of creation.

**Request Body (partial):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "location": "Updated location"
}
```

**Response `200`:** Updated item object

**Response `403`:** Not owner, or edit window expired

---

### `DELETE /api/items/:id`

Delete an item. Owner or admin only.

**Response `204`:** No content

---

### `POST /api/items/:id/complete`

Mark item as received/completed. Owner only. Item must be in `claim_pending` or `verified` status.

**Response `200`:**
```json
{
  "data": {
    "item": { "id": "uuid", "status": "completed" },
    "conversation": { "id": "uuid", "is_locked": true }
  }
}
```

---

## 4. Image Upload API

### `POST /api/items/:id/images`

Upload images for an item. Owner only. Multipart form data.

**Request:** `multipart/form-data`
- `files[]` — Up to 5 image files

**Validation:**
- Max 5 files
- Max 5MB per file
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`
- Only the item owner can upload

**Response `201`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "public_url": "https://...",
      "file_name": "photo.jpg",
      "display_order": 0
    }
  ]
}
```

---

### `DELETE /api/items/:id/images/:imageId`

Delete a specific image. Owner or admin only.

**Response `204`:** No content

---

## 5. Conversations API

### `GET /api/conversations`

Get all conversations for the current user.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "item": {
        "id": "uuid",
        "title": "Black AirPods Pro",
        "status": "claim_pending",
        "images": [{ "public_url": "..." }]
      },
      "other_user": {
        "id": "uuid",
        "full_name": "Priya Sharma",
        "avatar_url": "..."
      },
      "is_locked": false,
      "last_message": {
        "content": "Hey, I think I found your item!",
        "created_at": "2026-05-17T10:30:00Z",
        "is_read": false
      },
      "unread_count": 2,
      "created_at": "2026-05-17T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/conversations`

Create a new conversation (connect owner with finder).

**Request Body:**
```json
{
  "item_id": "uuid",
  "finder_id": "uuid"
}
```

**Validation:**
- `item_id`: Item must exist and not already have a conversation
- `finder_id`: Must be the item poster if item is `found`; or current user initiating connection
- Cannot create conversation with yourself

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "item_id": "uuid",
    "owner_id": "uuid",
    "finder_id": "uuid",
    "is_locked": false,
    "created_at": "..."
  }
}
```

**Response `409`:** Conversation already exists for this item

---

### `GET /api/conversations/:id/messages`

Get messages for a conversation. Participants only.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `before` | timestamp | — | Cursor for older messages |
| `limit` | integer | 50 | Messages per page (max 100) |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "content": "Hey, I found your AirPods!",
      "status": "read",
      "is_system": false,
      "read_at": "2026-05-17T10:35:00Z",
      "created_at": "2026-05-17T10:30:00Z",
      "sender": {
        "full_name": "Priya Sharma",
        "avatar_url": "..."
      }
    }
  ],
  "meta": {
    "has_more": true,
    "next_cursor": "2026-05-17T10:29:00Z"
  }
}
```

---

### `POST /api/conversations/:id/messages`

Send a message. Participants only. Conversation must not be locked.

**Request Body:**
```json
{
  "content": "Where are you right now?"
}
```

**Validation:**
- `content`: 1–2000 chars
- Conversation must not be locked
- Profanity filter applied

**Response `201`:** Created message object

---

### `PATCH /api/conversations/:id/messages/:messageId/read`

Mark a message as read.

**Response `200`:** Updated message with `read_at` timestamp

---

## 6. Flags API

### `POST /api/flags`

Report an item or message as inappropriate.

**Request Body:**
```json
{
  "item_id": "uuid",
  "reason": "spam",
  "details": "This listing is clearly fake."
}
```

OR

```json
{
  "message_id": "uuid",
  "reason": "inappropriate"
}
```

**Response `201`:** Flag created

---

## 7. Admin API

All admin routes require `role = 'admin'`.

### `GET /api/admin/users`

List all users with filters.

**Query Params:** `q`, `role`, `is_banned`, `page`, `per_page`

**Response `200`:** Paginated user list with full profile data

---

### `PATCH /api/admin/users/:id/ban`

Ban a user.

**Request Body:**
```json
{
  "reason": "Repeated spam submissions"
}
```

**Response `200`:** Updated user

---

### `PATCH /api/admin/users/:id/unban`

Unban a user.

**Response `200`:** Updated user

---

### `DELETE /api/admin/items/:id`

Admin delete any item.

**Response `204`:** No content

---

### `GET /api/admin/flags`

List all unresolved flags.

**Response `200`:** Paginated flags with item/message context

---

### `PATCH /api/admin/flags/:id/resolve`

Resolve a flag (dismiss or action taken).

**Request Body:**
```json
{
  "action": "dismissed"
}
```

**Response `200`:** Resolved flag

---

### `POST /api/admin/banned-emails`

Add an email to the ban list.

**Request Body:**
```json
{
  "email": "spammer@ds.study.iitm.ac.in",
  "reason": "Repeated abuse"
}
```

**Response `201`:** Banned email record

---

### `GET /api/admin/analytics`

Platform analytics summary.

**Response `200`:**
```json
{
  "data": {
    "total_items": 342,
    "active_items": 87,
    "completed_items": 201,
    "total_users": 512,
    "active_users_7d": 143,
    "recovery_rate": 0.587,
    "avg_recovery_hours": 31.4,
    "items_by_category": { "electronics": 89, "keys": 45, ... },
    "items_per_day": [
      { "date": "2026-05-17", "lost": 4, "found": 3 }
    ]
  }
}
```
