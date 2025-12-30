# Dashboard Enhancement Design Guidelines

## Design Approach
**System Selected:** Modern SaaS Dashboard (Linear + Notion fusion)
**Justification:** Appointment systems prioritize clarity, efficiency, and data visibility. Linear's refinement combined with Notion's accessibility creates the optimal balance for white-label dashboard applications.

**Core Principles:**
- Information hierarchy over decoration
- Instant visual feedback for all interactions
- Scannable data presentation
- Professional, neutral foundation for white-labeling

---

## Typography System

**Font Stack:** Inter (Google Fonts)
- Headers: 600-700 weight
- Body/Data: 400-500 weight
- Monospace data (times/IDs): JetBrains Mono

**Hierarchy:**
- Dashboard title: text-2xl font-semibold
- Card headers: text-lg font-semibold
- Data labels: text-sm font-medium uppercase tracking-wide
- Body text: text-base
- Metadata/timestamps: text-sm text-gray-500

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-6
- Card gaps: gap-6
- List item spacing: space-y-2
- Section margins: mb-8

**Grid Structure:**
- Dashboard container: max-w-7xl mx-auto px-6
- Stats cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Main content area: Two-column split (2/3 main + 1/3 sidebar on lg)

---

## Interactive States & Visual Feedback

**Booking List Items:**
- Default: border-l-4 border-transparent bg-white shadow-sm
- Hover: border-l-blue-500 bg-gray-50 shadow-md (transition-all duration-200)
- Active/Pressed: scale-[0.99] shadow-sm
- Selected: border-l-blue-600 bg-blue-50
- Cursor: cursor-pointer on all interactive items

**Dashboard Cards:**
- Default: bg-white border border-gray-200 rounded-lg
- Clickable cards hover: shadow-lg border-gray-300 transform translate-y-[-2px] (transition-all duration-200)
- Active state: translate-y-0 shadow-md
- Add subtle chevron icon (→) on right side for clickable cards

**Status Indicators:**
- Confirmed: bg-green-100 text-green-800 with pulse animation on new bookings
- Pending: bg-yellow-100 text-yellow-800
- Cancelled: bg-gray-100 text-gray-600
- All status badges: inline-flex items-center px-3 py-1 rounded-full text-xs font-medium

---

## Component Library

**Dashboard Stats Cards:**
- Icon + Metric + Label + Trend indicator
- Large metric (text-3xl font-bold)
- Icon in circle with background tint matching status
- Micro-trend graph or percentage change

**Booking List Component:**
- Compact rows with: Time | Patient Name | Service | Status | Action button
- Avatar/initials on left (w-10 h-10 rounded-full)
- Time in monospace font
- Quick action buttons (View, Reschedule) appear on hover
- Dividers between items (border-b border-gray-100)

**Action Buttons:**
- Primary CTA: Solid background with hover brightness increase
- Secondary: Border style with hover background fill
- Icon-only: p-2 rounded hover:bg-gray-100
- Floating Action Button (FAB): Fixed bottom-right for "New Booking"

**Data Tables:**
- Sticky header row (bg-gray-50 border-b-2)
- Alternating row backgrounds (even:bg-gray-50)
- Sortable columns with arrow indicators
- Row hover: bg-blue-50

**Calendar/Schedule View:**
- Time slots in grid format
- Booked slots: filled with opacity-90
- Available slots: border-dashed border-gray-300
- Hover on available: bg-gray-100 cursor-pointer

**Navigation Sidebar:**
- Active item: bg-gray-100 border-l-4 border-blue-600
- Hover: bg-gray-50
- Icons aligned left, labels right-aligned
- Badge counters on right for notifications

---

## Animations

**Micro-interactions Only:**
- Loading states: Skeleton screens with shimmer effect
- Success actions: Checkmark animation (scale + fade-in)
- Destructive actions: Shake animation before confirm dialog
- New notifications: Subtle bounce on badge counter
- All transitions: duration-200 ease-out

---

## Images Section

**No Hero Image Required** - This is a dashboard application.

**Avatar Placeholders:**
- Patient/user avatars throughout booking lists
- Use gradient backgrounds with initials if no photo
- Consistent size: w-10 h-10 in lists, w-16 h-16 in details

**Empty States:**
- Illustrations for "No appointments today" scenarios
- Use simple line art, centered with supporting text
- Place in center of empty dashboard sections

---

## Key Differentiators

- **Immediate Feedback:** Every click shows visual response within 200ms
- **Status Clarity:** Color-coded borders and badges throughout
- **Density Control:** Comfortable spacing that scales data visibility
- **Hover Revelations:** Secondary actions appear on item hover to reduce clutter
- **Persistent Context:** Sticky headers and fixed sidebar maintain orientation

This creates a professional, responsive dashboard that white-labels effortlessly while delivering superior interaction clarity.