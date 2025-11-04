# Log Filtering Tool - Design Guidelines

## Design Approach

**Selected Framework:** Material Design (adapted for developer tools)
**Rationale:** Data-heavy, utility-focused application requiring clear hierarchy, efficient information display, and professional aesthetics for technical users.

## Core Design Principles

1. **Clarity Over Decoration** - Every element serves a functional purpose
2. **Efficient Information Density** - Maximize useful content visibility while maintaining readability
3. **Scannable Hierarchy** - Clear visual distinction between sections and states
4. **Professional Minimalism** - Clean, technical aesthetic without unnecessary embellishment

---

## Typography System

**Font Families:**
- **UI Text:** Inter or Roboto (via Google Fonts CDN)
- **Code/Logs:** JetBrains Mono or Fira Code (monospace for log display)

**Hierarchy:**
- **Page Title:** text-3xl font-bold (32px)
- **Section Headers:** text-xl font-semibold (20px)
- **Card Titles:** text-lg font-medium (18px)
- **Body Text:** text-base (16px)
- **Supporting Text:** text-sm (14px)
- **Labels/Captions:** text-xs font-medium uppercase tracking-wide (12px)
- **Log Text:** text-sm font-mono (14px monospace)

---

## Layout System

**Spacing Primitives:** Use Tailwind units: **2, 4, 6, 8, 12, 16**
- Micro spacing: `gap-2`, `p-2`, `m-2` (8px)
- Standard spacing: `gap-4`, `p-4`, `m-4` (16px) 
- Section spacing: `gap-6`, `p-6`, `m-6` (24px)
- Large gaps: `gap-8`, `p-8`, `m-8` (32px)
- Major sections: `py-12`, `my-12` (48px)
- Page margins: `p-16` (64px)

**Container Strategy:**
- Main container: `max-w-screen-2xl mx-auto px-6`
- Content sections: Full-width with internal constraints
- Cards/panels: Contained width with appropriate padding

**Grid System:**
- Configuration panel: 5-column grid (one per toggle) on desktop, stack on mobile
- Split view: 50/50 layout on desktop (`grid-cols-2`), stack on mobile
- Statistics dashboard: 4-column grid for metrics (`grid-cols-4` → `grid-cols-2` → `grid-cols-1`)

---

## Component Library

### A. File Upload Zone
**Specification:**
- Large drop area: min-h-64 with dashed border (border-2 border-dashed)
- Center-aligned content with icon, text, and browse button
- Icon: Upload cloud icon (96px size)
- Primary text: "Drop your log file here" (text-lg)
- Secondary text: "or click to browse" (text-sm)
- Accepted formats indicator: ".txt, .log files" (text-xs)
- Hover state: Enhanced border visibility
- Active drop state: Visual feedback with scale transform

### B. Configuration Panel
**Specification:**
- Card-based container with border and shadow-sm
- Header: "Filter Configuration" (text-lg font-semibold) with p-6
- Toggle grid: 5 columns on desktop, 2 on tablet, 1 on mobile
- Each toggle item:
  - Icon (24px) indicating feature type
  - Label (text-sm font-medium)
  - Helper text (text-xs explaining feature)
  - Switch component (Material Design style)
- Spacing: gap-6 between items
- Padding: p-6

### C. Split-View Log Display
**Specification:**
- Two-panel layout with resizable divider
- Panel headers:
  - "Original Logs" and "Filtered Logs" (text-base font-semibold)
  - Line count badge (rounded-full px-3 py-1 text-xs)
- Log container:
  - Background with subtle pattern/texture
  - Monospace font (JetBrains Mono)
  - Line numbers in gutter (text-xs)
  - Syntax highlighting:
    - ERROR/Exception: Bold treatment
    - WARNING/WARN: Medium weight
    - HTTP requests: Distinct styling
    - DEBUG: Standard weight
  - max-h-screen with overflow-y-auto
  - Padding: p-4
  - Line height: leading-relaxed for readability

### D. Statistics Dashboard
**Specification:**
- Grid layout: 4 metric cards
- Each card:
  - Icon indicator (32px)
  - Large number display (text-4xl font-bold)
  - Label (text-sm)
  - Trend indicator if applicable
  - Border with shadow-sm
  - Padding: p-6
- Metrics to display:
  - Original line count
  - Filtered line count
  - Reduction percentage (with visual indicator)
  - Processing time

### E. Action Bar
**Specification:**
- Fixed/sticky positioning at top or bottom of log view
- Flex layout with space-between
- Left side: Search input with icon (w-64)
- Right side: Button group
  - "Copy Filtered" button with clipboard icon
  - "Download Filtered" button with download icon
  - "Reset" button (ghost variant)
- Padding: p-4
- Backdrop blur effect (backdrop-blur-sm)

### F. Search & Filter Controls
**Specification:**
- Search input:
  - Icon prefix (magnifying glass)
  - Placeholder: "Search in logs..."
  - Clear button when active
  - w-full max-w-md
- Filter dropdowns:
  - Log level filter (ERROR, WARNING, DEBUG, HTTP, ALL)
  - Multi-select with checkboxes
  - Dropdown: py-2 px-4

### G. Buttons
**Primary Button:**
- Padding: px-6 py-3
- Text: text-base font-medium
- Border radius: rounded-lg
- Icon support: 20px icons with gap-2
- States: hover, active, disabled

**Secondary/Ghost Button:**
- Padding: px-4 py-2
- Border: border-2
- Transparent background
- Same states as primary

### H. Navigation Header
**Specification:**
- Container: full-width with border-bottom
- Inner container: max-w-screen-2xl mx-auto px-6 py-4
- Layout: Flex justify-between
- Left: Logo/title "Appium Log Filter" (text-xl font-bold)
- Right: Dark mode toggle (moon/sun icon button)
- Height: h-16

### I. Progress Indicator
**Specification:**
- Linear progress bar during processing
- Indeterminate animation or percentage-based
- Position: below header or within upload zone
- Height: h-1
- Smooth transitions

### J. Empty States
**Specification:**
- Center-aligned content
- Icon: 128px size, muted
- Heading: "No logs loaded" (text-xl)
- Description: "Upload a log file to begin" (text-sm)
- CTA button: "Upload File"

---

## Interaction Patterns

### File Upload Flow
1. Default state: Dashed border with upload prompt
2. Drag over: Border solid, subtle scale effect
3. Processing: Progress indicator appears, upload zone disabled
4. Success: Transition to split-view with fade-in animation (duration-300)
5. Error: Error message in toast notification

### Configuration Changes
- Toggle switches update immediately
- Visual feedback on toggle state change
- Re-filter logs automatically with debounce (300ms)
- Loading indicator in affected panel during re-processing

### Log Navigation
- Smooth scroll behavior
- Scroll-to-top button appears after scrolling down 200px
- Search highlights matching text with jump-to controls
- Keyboard shortcuts: Cmd/Ctrl+F for search

---

## Responsive Behavior

**Desktop (lg: 1024px+):**
- Split-view side-by-side
- 5-column configuration grid
- 4-column statistics grid
- Full feature set visible

**Tablet (md: 768px - 1023px):**
- Split-view maintained with narrower panels
- 3-column configuration grid
- 2-column statistics grid
- Condensed spacing

**Mobile (< 768px):**
- Stacked layout (original logs → statistics → config → filtered logs)
- Single column for all grids
- Tab navigation for original/filtered view switching
- Simplified header (hamburger menu)
- Touch-optimized button sizes (min-h-12)

---

## Dark Mode Specifications

**Implementation:**
- System preference detection on load
- Manual toggle in header
- Smooth transition between modes (transition-colors duration-200)
- Persist user preference in localStorage

**Adjustments for Dark Mode:**
- Increase contrast for log text
- Soften borders and shadows
- Adjust syntax highlighting for better visibility
- Invert background patterns appropriately

---

## Accessibility

- All interactive elements: min-h-11 for touch targets
- Form labels: Associated with inputs via for/id
- Icon buttons: aria-label attributes
- Skip to main content link
- Keyboard navigation: Clear focus indicators (ring-2)
- ARIA live regions for dynamic updates (processing status)
- Color contrast ratio: Minimum 4.5:1 for text
- Focus trap in modal dialogs if present

---

## Performance Considerations

- Virtual scrolling for logs exceeding 10,000 lines
- Debounced search input (300ms)
- Lazy load syntax highlighting for off-screen content
- Memoize filtered results to prevent re-computation
- Web Worker for log processing to keep UI responsive

---

## Icons

**Icon Library:** Heroicons (via CDN)
**Usage:**
- Upload: cloud-arrow-up
- Download: arrow-down-tray
- Copy: clipboard-document
- Search: magnifying-glass
- Filter: funnel
- Error: exclamation-triangle
- Warning: exclamation-circle
- Info: information-circle
- Settings: cog-6-tooth
- Moon/Sun: moon/sun (dark mode toggle)
- Checkmark: check
- Close: x-mark

**Icon Sizes:**
- Small: 16px (inline with text)
- Medium: 24px (buttons, toggles)
- Large: 32px (statistics)
- Extra Large: 96px (empty states, upload zone)

---

## Visual Hierarchy Implementation

**Elevation System:**
- Level 0: Base page (no shadow)
- Level 1: Cards, panels (shadow-sm)
- Level 2: Dropdowns, tooltips (shadow-md)
- Level 3: Modals, dialogs (shadow-lg)
- Level 4: Active drag elements (shadow-xl)

**Border Strategy:**
- Hairline borders: border (1px)
- Emphasis borders: border-2 (2px)
- Border radius: Consistent rounded-lg (8px) except buttons which use rounded-lg

**Whitespace Application:**
- Dense sections (logs, tables): p-2 to p-4
- Standard sections (cards): p-6
- Generous sections (hero/headers): p-8 to p-12
- Between major sections: gap-12