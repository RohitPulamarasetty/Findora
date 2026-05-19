# UI_UX_GUIDELINES.md — UI/UX Design System
# Findora: Campus Lost & Found Platform

**Version:** 1.0.0

---

## 1. Design Philosophy

Findora's visual identity is **clean, trustworthy, and human-centered**. It should feel like a premium utility app — not a social network, not a marketplace. The design conveys:

- **Clarity** — Users can immediately understand what they're looking at
- **Speed** — Every interaction feels instant
- **Trust** — Professional enough that students trust it with their belongings
- **Warmth** — Not sterile; it's still a community tool

---

## 2. Color System

### Base Palette

```css
:root {
  /* Brand */
  --color-brand-50:  #eff6ff;
  --color-brand-100: #dbeafe;
  --color-brand-500: #3b82f6;   /* Primary action */
  --color-brand-600: #2563eb;   /* Hover */
  --color-brand-700: #1d4ed8;   /* Active */
  --color-brand-900: #1e3a8a;

  /* Surface (Light Mode) */
  --color-bg:          #ffffff;
  --color-bg-subtle:   #f8fafc;
  --color-bg-muted:    #f1f5f9;
  --color-border:      #e2e8f0;
  --color-border-strong: #cbd5e1;

  /* Text (Light Mode) */
  --color-text-primary:   #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted:     #94a3b8;
  --color-text-inverted:  #ffffff;

  /* Semantic */
  --color-lost:       #ef4444;  /* Red — lost item */
  --color-found:      #22c55e;  /* Green — found item */
  --color-pending:    #f59e0b;  /* Amber — claim pending */
  --color-verified:   #3b82f6;  /* Blue — verified */
  --color-completed:  #10b981;  /* Emerald — completed */
  --color-closed:     #6b7280;  /* Gray — closed */
}

.dark {
  /* Surface (Dark Mode) */
  --color-bg:          #0f172a;
  --color-bg-subtle:   #1e293b;
  --color-bg-muted:    #334155;
  --color-border:      #334155;
  --color-border-strong: #475569;

  /* Text (Dark Mode) */
  --color-text-primary:   #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-text-muted:     #64748b;
}
```

### Color Usage Rules

| Element | Color Token |
|---------|-------------|
| Primary buttons | `brand-500` / `brand-600` on hover |
| Destructive actions | `red-500` |
| Success states | `green-500` |
| Warning states | `amber-500` |
| Page backgrounds | `bg` |
| Card backgrounds | `bg-subtle` |
| Input backgrounds | `bg` with `border` |
| Disabled elements | `bg-muted` + `text-muted` |

---

## 3. Typography

### Font Stack

```css
/* Display / Headings */
--font-display: 'Cal Sans', 'Plus Jakarta Sans', system-ui, sans-serif;

/* Body / UI */
--font-body: 'Plus Jakarta Sans', system-ui, sans-serif;

/* Monospace (code, IDs) */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Name | Size | Weight | Use |
|------|------|--------|-----|
| `display-xl` | 48px | 700 | Hero headings |
| `display-lg` | 36px | 700 | Page titles |
| `display-md` | 30px | 600 | Section headings |
| `heading-lg` | 24px | 600 | Card headings |
| `heading-md` | 20px | 600 | Sub-headings |
| `heading-sm` | 16px | 600 | Labels |
| `body-lg` | 16px | 400 | Primary body |
| `body-md` | 14px | 400 | Secondary body |
| `body-sm` | 13px | 400 | Captions, metadata |
| `label` | 12px | 500 | Form labels, tags |
| `mono` | 13px | 400 | IDs, codes |

---

## 4. Spacing System

Findora uses an **8pt grid system** (Tailwind's default spacing scale maps to this).

```
4px  → xs   (tight spacing, icons)
8px  → sm   (within components)
12px → md   (card padding inner)
16px → lg   (card padding, section gaps)
24px → xl   (section spacing)
32px → 2xl  (page sections)
48px → 3xl  (major page breaks)
64px → 4xl  (hero areas)
```

---

## 5. Component Specifications

### Buttons

```
Primary:
  bg: brand-500, text: white
  hover: brand-600
  active: brand-700
  border-radius: 8px
  padding: 10px 16px (md), 8px 12px (sm)
  font: body-md 500

Secondary:
  bg: transparent, border: border-strong
  hover: bg-muted
  text: text-primary

Ghost:
  bg: transparent, no border
  hover: bg-muted

Destructive:
  bg: red-500, text: white
  hover: red-600

Loading state:
  Show spinner, disable clicks, keep dimensions
```

### Cards

```
Background: bg-subtle
Border: 1px solid border
Border-radius: 12px
Padding: 16px
Shadow: sm (light), none (dark)
Hover: slight lift (translate-y: -1px, shadow-md)
Transition: 150ms ease
```

### Form Inputs

```
Background: bg
Border: 1px solid border-strong
Border-radius: 8px
Padding: 10px 12px
Focus: border-brand-500, ring: brand-500/20
Error: border-red-500, text-red-500 below
Disabled: bg-muted, text-muted, cursor-not-allowed
```

### Status Chips

```
lost:       bg-red-100,     text-red-700,     border-red-200
found:      bg-green-100,   text-green-700,   border-green-200
pending:    bg-amber-100,   text-amber-700,   border-amber-200
verified:   bg-blue-100,    text-blue-700,    border-blue-200
completed:  bg-emerald-100, text-emerald-700, border-emerald-200
closed:     bg-gray-100,    text-gray-600,    border-gray-200
border-radius: 9999px (full rounded)
padding: 2px 8px
font: label (12px, 500)
```

---

## 6. Navigation Design

### Mobile Bottom Navigation

```
Height: 64px + safe-area-inset-bottom
Background: bg (with blur: backdrop-filter: blur(12px))
Border-top: 1px solid border
Position: fixed, bottom: 0, left: 0, right: 0
z-index: 50

Items: 5 equally spaced
Active item: icon + label (brand-500)
Inactive: icon only (text-muted)
Center item (Report): elevated button, brand-500, circular
Unread badge: red dot on Messages icon
```

### Desktop Sidebar

```
Width: 240px
Position: fixed, left: 0, top: 0, bottom: 0
Background: bg-subtle
Border-right: 1px solid border
Padding: 24px 16px

Logo: top, 40px height
Nav items: full-width, icon + label, 40px height, 8px border-radius
Active: brand-500 bg tint, brand-500 text, brand-600 icon
Hover: bg-muted
```

---

## 7. Loading States

### Skeleton Screens

Use animated shimmer skeletons — **never spinners for page-level loading**.

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-muted) 25%,
    var(--color-bg-subtle) 50%,
    var(--color-bg-muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
```

### Loading Indicators

| Context | Loading Pattern |
|---------|----------------|
| Page initial load | Skeleton screen |
| Button action | Spinner in button + disabled |
| Image loading | Blur placeholder → fade in |
| Message sending | Greyed-out bubble with spinner |
| Infinite scroll | Bottom spinner when fetching |

---

## 8. Empty States

Every empty state must have:
1. An illustrative icon (Lucide or custom SVG)
2. A clear heading ("No lost items yet")
3. A helpful description
4. An optional CTA button

```typescript
// Example empty states
<EmptyState
  icon={SearchX}
  title="No items match your search"
  description="Try adjusting your filters or search terms."
  action={{ label: "Clear filters", onClick: resetFilters }}
/>

<EmptyState
  icon={MessageSquareDashed}
  title="No conversations yet"
  description="When you connect with someone about an item, your chat will appear here."
/>
```

---

## 9. Animation Guidelines

### Micro-interactions

```css
/* Standard transition for interactive elements */
transition: all 150ms ease;

/* Card hover lift */
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0,0,0,0.1);

/* Button press */
transform: scale(0.97);

/* Fade in (new items, messages) */
animation: fadeInUp 200ms ease;

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Page Transitions

- Route changes: fade transition (150ms)
- Modal open: scale-in from 95% + fade
- Sheet open: slide-up from bottom
- Toast notifications: slide-in from top-right

### Do & Don't

✅ **Do:** Animate entrance of new content (messages, items)
✅ **Do:** Subtle hover states on interactive elements
✅ **Do:** Smooth loading → content transitions

❌ **Don't:** Animate on every scroll event
❌ **Don't:** Long animations (>400ms) for frequent interactions
❌ **Don't:** Animated decorations that distract from content

---

## 10. Mobile UX Guidelines

### Touch Targets

- Minimum touch target: **44x44px** (per Apple HIG / Material)
- Buttons: at least 44px tall
- List items: at least 56px tall
- Bottom nav items: at least 64px tall including label

### Thumb Zones

- Primary actions in bottom 1/3 of screen (thumb reach)
- Bottom navigation in lowest zone
- Destructive actions in top zone (require reach/deliberate action)
- Modal actions at bottom of sheet

### Gestures

- Swipe left on conversation row to reveal delete/archive
- Swipe in image gallery
- Pull-to-refresh on item feed
- Long-press on message for reaction/copy (future)

---

## 11. Dark Mode Guidelines

- Use `dark:` Tailwind variants for all color overrides
- Test every screen in dark mode before shipping
- Don't invert images in dark mode
- Reduce shadow intensity in dark mode (shadows are less visible)
- Ensure brand color (blue) reads well on dark backgrounds (may need `brand-400`)

---

## 12. Accessibility Guidelines

- **Contrast ratios:** 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- **Focus rings:** Visible on all interactive elements (don't use `outline: none` without replacement)
- **Alt text:** All images have descriptive alt attributes
- **ARIA labels:** Icon-only buttons have `aria-label`
- **Error messages:** Linked to inputs via `aria-describedby`
- **Status announcements:** Use `role="status"` or `aria-live` for dynamic updates
- **Form labels:** All inputs have visible associated `<label>` elements
- **Keyboard navigation:** Full app navigable by keyboard (Tab, Enter, Escape, Arrow keys)
