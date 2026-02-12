# PhishGuard AI - UI/UX Specification

## Design Philosophy

PhishGuard AI follows a **Security Operations Center (SOC)** design language, prioritizing:

1. **Clarity over beauty** - Information density for operators
2. **Speed over animation** - Fast, responsive interactions
3. **Contrast over subtlety** - High visibility in control rooms
4. **Function over form** - Every element serves a purpose

This is NOT a consumer app. This is a professional security tool.

---

## Color Palette

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Zinc 950** | `#09090b` | Primary background |
| **Zinc 900** | `#18181b` | Card/panel background |
| **Zinc 800** | `#27272a` | Borders, dividers |
| **Zinc 100** | `#f4f4f5` | Primary text |
| **Red 600** | `#dc2626` | Primary actions, branding |

### Status Colors

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| **Safe** | Green | `#22c55e` | Legitimate messages |
| **Suspicious** | Yellow | `#eab308` | Requires review |
| **Phishing** | Red | `#ef4444` | Confirmed threats |
| **Critical** | Dark Red | `#991b1b` | Highest priority |
| **Info** | Blue | `#3b82f6` | System information |

### Risk Level Colors

- **Low**: Green `#22c55e`
- **Medium**: Yellow `#eab308`
- **High**: Orange `#f97316`
- **Critical**: Red `#ef4444`

---

## Typography

### Font Stack
```css
font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

**Rationale**: System fonts ensure:
- Maximum readability
- Fast loading (no web fonts)
- Consistency across platforms

### Font Sizes

| Element | Size | Usage |
|---------|------|-------|
| **Display** | 30px | Page headers |
| **H1** | 24px | Section titles |
| **H2** | 20px | Card headers |
| **H3** | 18px | Subsections |
| **Body** | 16px | Default text |
| **Small** | 14px | Labels, metadata |
| **Tiny** | 12px | Captions, timestamps |

### Font Weights

- **Normal**: 400 (body text)
- **Medium**: 500 (labels, buttons)
- **Semibold**: 600 (headings, emphasis)

---

## Layout Structure

### Application Shell

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (256px)         │  Main Content (flex-1)   │
│                          │                           │
│  [Logo/Branding]         │  [Page Header]            │
│  [Online Status]         │                           │
│                          │  [Page Content]           │
│  Navigation Links:       │                           │
│  ► Threat Scan          │                           │
│    Scan History         │                           │
│    Analytics            │                           │
│    System               │                           │
│                          │                           │
│  [Version Info]          │                           │
└─────────────────────────────────────────────────────┘
```

**Sidebar Features**:
- **Fixed width**: 256px (never collapses)
- **Dark background**: Zinc-900
- **Always visible**: No hamburger menu
- **Online indicator**: Top of sidebar
- **Version info**: Bottom of sidebar

**Main Content**:
- **Flexible width**: Fills remaining space
- **Max width**: 1280px (centered)
- **Padding**: 32px on all sides
- **Scrollable**: Vertical overflow

---

## Screen 1: Threat Scan Console

### Layout Wireframe

```
┌────────────────────────────────────────────────────────┐
│  Threat Scan Console                                   │
│  Analyze messages for phishing indicators...           │
├─────────────────────────┬──────────────────────────────┤
│  INPUT SECTION          │  RESULTS SECTION             │
│  ┌─────────────────────┐│  ┌──────────────────────────┐│
│  │ Input Message       ││  │ [Empty State]            ││
│  │ [Email][SMS][Chat]  ││  │                          ││
│  ├─────────────────────┤│  │ OR                       ││
│  │                     ││  │                          ││
│  │ [Large Text Area]   ││  │ ┌────────────────────┐  ││
│  │ (300px height)      ││  │ │ THREAT VERDICT     │  ││
│  │                     ││  │ │ [Icon] PHISHING    │  ││
│  │ Paste email/SMS...  ││  │ │ Confidence: 87%    │  ││
│  │                     ││  │ └────────────────────┘  ││
│  │                     ││  │                          ││
│  │                     ││  │ Risk Level: HIGH         ││
│  └─────────────────────┘│  │                          ││
│  [Scan][Upload][Clear]  │  │ Detected Indicators:     ││
│                         │  │ ✓ Urgency Language       ││
│                         │  │ ✓ Suspicious URL         ││
│                         │  │ ✓ Credential Request     ││
│                         │  │                          ││
│                         │  │ [Actions]                ││
│                         │  │ [Mark Incident][Save]    ││
│                         │  └──────────────────────────┘│
└─────────────────────────┴──────────────────────────────┘
```

### Component Specifications

#### Input Section Card
- **Width**: 50% of container
- **Background**: Zinc-900
- **Border**: 1px Zinc-800
- **Padding**: 24px
- **Border radius**: 10px

#### Message Type Selector
```
[Email]   [SMS]   [Chat]
  ▲                      ← Active state (red)
```
- **Button group**: Horizontal
- **Active**: Red background, white text
- **Inactive**: Outline, zinc text

#### Text Area
- **Height**: 300px minimum
- **Font**: Monospace
- **Background**: Zinc-950
- **Border**: 1px Zinc-700
- **Resize**: Vertical only

#### Action Buttons
```
┌──────────────────────────────────┐
│  🛡 Scan for Threats             │ ← Primary (Red, full width)
└──────────────────────────────────┘
[📤]  [🗑]                           ← Icon buttons (outline)
```

#### Results Panel

**Empty State**:
```
    🛡
  (large icon, 20% opacity)
  
  No scan results yet
  Enter content and click "Scan for Threats"
```

**Verdict Display**:
```
┌─────────────────────────────────────┐
│  ⚠  PHISHING                        │
│  High-confidence threat detected.    │
│  Do not interact with this message.  │
└─────────────────────────────────────┘
```
- **Icons**: 32px size
- **Verdict text**: 20px, semibold
- **Explanation**: 14px, zinc-400
- **Background**: Status color at 10% opacity
- **Border**: Status color at 20% opacity

**Confidence Score**:
```
Detection Confidence              87%
[████████████████░░░░]
```
- **Progress bar**: 8px height
- **Foreground**: Status color
- **Background**: Zinc-800

**Risk Badge**:
```
┌──────────┐
│   HIGH   │
└──────────┘
```
- **Font**: 12px, uppercase, bold
- **Padding**: 4px 12px
- **Border**: None
- **Background**: Risk color

**Indicator List**:
```
┌────────────────────────────────┐
│ Urgency Language      DETECTED │ ← Red background
├────────────────────────────────┤
│ Impersonation                  │ ← Gray background
├────────────────────────────────┤
│ Suspicious URL        DETECTED │ ← Red background
└────────────────────────────────┘
```
- **Item height**: 48px
- **Detected**: Red background (5% opacity), red border (20%)
- **Not detected**: Gray, 50% opacity

---

## Screen 2: Scan History

### Layout Wireframe

```
┌────────────────────────────────────────────────────────┐
│  Offline Scan History                    [Export CSV]  │
│  Forensic audit log of all threat scans...             │
├────────────────────────────────────────────────────────┤
│  [Search...]  [Filter: Verdict ▼]  [Filter: Risk ▼]   │
├────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │ 142  │  │  23  │  │  11  │  │ 108  │              │
│  │Total │  │Phish │  │Susp  │  │Safe  │              │
│  └──────┘  └──────┘  └──────┘  └──────┘              │
├────────────────────────────────────────────────────────┤
│  DATA TABLE                                            │
│  ┌──────┬─────┬─────────┬────────┬──────┬────┬───────┐│
│  │Time  │Type │Preview  │Verdict │Risk  │Conf│Decision││
│  ├──────┼─────┼─────────┼────────┼──────┼────┼───────┤│
│  │14:32 │📧  │Dear...  │🔴Phish │High  │87% │Incident││
│  │13:15 │💬  │Hello... │🟢Safe  │Low   │92% │Pending ││
│  │12:03 │📧  │Urgent...│🔴Phish │Crit  │94% │Incident││
│  └──────┴─────┴─────────┴────────┴──────┴────┴───────┘│
└────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Filter Bar
- **Layout**: Grid (2fr 1fr 1fr)
- **Height**: 56px
- **Gap**: 16px
- **Background**: Zinc-900

#### Summary Cards
```
┌─────────────┐
│  142        │ ← 30px, semibold
│  Total Scans│ ← 12px, zinc-500
└─────────────┘
```
- **Width**: Flexible (1/4 each)
- **Padding**: 16px
- **Background**: Zinc-900

#### Data Table
- **Row height**: 56px
- **Header**: Zinc-800 background, zinc-400 text, 12px
- **Zebra striping**: None (hover only)
- **Hover**: Zinc-800 at 50% opacity
- **Border**: 1px Zinc-800 between rows

**Column Widths**:
- Time: 100px
- Type: 80px
- Preview: Flexible
- Verdict: 120px
- Risk: 100px
- Conf: 80px
- Decision: 120px
- Actions: 60px

---

## Screen 3: Threat Analytics

### Layout Wireframe

```
┌────────────────────────────────────────────────────────┐
│  Threat Analytics Dashboard                            │
│  Real-time security metrics and threat intelligence    │
├────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │ 23   │  │  3   │  │ 87%  │  │  2   │              │
│  │Scans │  │Phish │  │Safe  │  │Critical              │
│  │Today │  │Detect│  │      │  │Threats               │
│  └──────┘  └──────┘  └──────┘  └──────┘              │
├─────────────────────────┬──────────────────────────────┤
│  7-Day Threat Trend     │  Verdict Distribution       │
│  ┌─────────────────────┐│  ┌──────────────────────────┐│
│  │                     ││  │         ◐                ││
│  │   Line Chart        ││  │       ◐   ◑             ││
│  │   (250px height)    ││  │     ◐       ◑           ││
│  │                     ││  │   Pie Chart              ││
│  └─────────────────────┘│  └──────────────────────────┘│
├─────────────────────────┼──────────────────────────────┤
│  Top Detected Indicators│  Risk Level Distribution    │
│  ┌─────────────────────┐│  ┌──────────────────────────┐│
│  │                     ││  │                          ││
│  │   Bar Chart         ││  │   Bar Chart              ││
│  │   (Horizontal)      ││  │   (Vertical)             ││
│  │                     ││  │                          ││
│  └─────────────────────┘│  └──────────────────────────┘│
└─────────────────────────┴──────────────────────────────┘
```

### Component Specifications

#### Metric Cards
```
┌────────────────┐
│  ⚡ (icon)     │ ← 40px icon, colored background
│                │
│  23            │ ← 36px, semibold
│  Scans Today   │ ← 14px, zinc-500
└────────────────┘
```
- **Icon container**: 40px square, colored background (10% opacity)
- **Spacing**: 12px between icon and number
- **Padding**: 24px

#### Chart Containers
- **Background**: Zinc-900
- **Padding**: 24px
- **Border radius**: 10px
- **Header**: 14px, semibold, zinc-400, uppercase

#### Chart Styling (Recharts)
```javascript
<CartesianGrid 
  strokeDasharray="3 3" 
  stroke="#3f3f46"  // Zinc-700
/>
<XAxis 
  stroke="#71717a"  // Zinc-500
  style={{ fontSize: '12px' }}
/>
<Line 
  type="monotone"
  strokeWidth={2}
  dot={false}
/>
```

**Color Mapping**:
- Phishing: `#ef4444`
- Suspicious: `#eab308`
- Safe: `#22c55e`

---

## Screen 4: System Status

### Layout Wireframe

```
┌────────────────────────────────────────────────────────┐
│  System Status & Updates                               │
│  Monitor system health and manage updates              │
├────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐│
│  │  📡 System Online                      CONNECTED   ││
│  │  Connected to network. Updates available.          ││
│  └────────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────────┤
│  SYSTEM COMPONENTS                                      │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ 💻 AI Model      │  │ 💾 Local Database│           │
│  │ v2.3.1     ✓     │  │ IndexedDB v1  ✓  │           │
│  │ Operational      │  │ Operational       │           │
│  └──────────────────┘  └──────────────────┘           │
├─────────────────────────┬──────────────────────────────┤
│  AI Model Information   │  Local Storage              │
│  ┌─────────────────────┐│  ┌──────────────────────────┐│
│  │ Model Version: 2.3.1││  │ Database Type: IndexedDB ││
│  │ Rule Set: 4.1.0     ││  │ Total Scans: 142         ││
│  │ Total Features: 47  ││  │ Database Size: 23.4 KB   ││
│  │ Accuracy: 94.0%     ││  │ [Progress Bar]           ││
│  └─────────────────────┘│  └──────────────────────────┘│
├────────────────────────────────────────────────────────┤
│  SYSTEM UPDATES                                        │
│  [Check for Updates]  [Apply Secure Update]            │
└────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Connection Banner
```
┌──────────────────────────────────────────┐
│  📡  System Online        [CONNECTED]    │
│  Connected to network. Updates available.│
└──────────────────────────────────────────┘
```
- **Height**: 80px
- **Icon**: 48px
- **Badge**: 12px text, uppercase, green/yellow color
- **Background**: Status color at 10% opacity

#### Component Status Cards
```
┌─────────────────────┐
│  💻                 │ ← 40px icon
│  AI Model           │ ← 14px, semibold
│  v2.3.1             │ ← 12px, zinc-500
│  ✓                  │ ← 20px, green
│  Operational        │ ← 12px, green text, badge
└─────────────────────┘
```

#### Info Panels
- **Row layout**: Label (left) | Value (right)
- **Row height**: 40px
- **Border bottom**: 1px Zinc-800
- **Label**: 14px, zinc-400
- **Value**: 14px, zinc-100, semibold

---

## Interaction States

### Buttons

**Primary (Red)**:
```css
/* Default */
background: #dc2626;
color: white;

/* Hover */
background: #b91c1c;

/* Active */
background: #991b1b;

/* Disabled */
background: #3f3f46;
color: #71717a;
cursor: not-allowed;
```

**Outline**:
```css
/* Default */
background: transparent;
border: 1px solid #3f3f46;
color: #a1a1aa;

/* Hover */
background: #27272a;
color: #f4f4f5;
```

### Form Inputs

**Text Input/Textarea**:
```css
/* Default */
background: #09090b;
border: 1px solid #3f3f46;
color: #f4f4f5;

/* Focus */
border: 1px solid #dc2626;
outline: 2px solid rgba(220, 38, 38, 0.2);

/* Error */
border: 1px solid #ef4444;
```

### Navigation

**Active Link**:
```css
background: #dc2626;
color: white;
font-weight: 500;
```

**Inactive Link**:
```css
background: transparent;
color: #a1a1aa;

/* Hover */
background: #27272a;
color: #f4f4f5;
```

---

## Responsive Behavior

### Breakpoints

| Size | Width | Layout |
|------|-------|--------|
| **Desktop** | ≥1280px | Full layout, sidebar + content |
| **Tablet** | 768-1279px | Sidebar + content (compressed) |
| **Mobile** | <768px | Stacked layout (not primary target) |

**Note**: This application is designed for **desktop/tablet use in control rooms**. Mobile optimization is secondary.

### Responsive Adjustments

**Tablet (768-1279px)**:
- Sidebar: Remains visible (might compress to icons + labels)
- Charts: Stack vertically if needed
- Table: Horizontal scroll

**Mobile (<768px)**:
- Sidebar: Collapses to hamburger menu
- Grid layouts: Single column
- Tables: Card-based view

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Text on dark background: Minimum 7:1 (AAA)
- UI components: Minimum 3:1
- Status colors tested for deuteranopia/protanopia

**Keyboard Navigation**:
- All interactive elements focusable
- Tab order: logical, left-to-right, top-to-bottom
- Escape to close modals/dropdowns
- Enter to submit forms

**Screen Readers**:
- Semantic HTML (nav, main, article, aside)
- ARIA labels on icon buttons
- Status announcements with aria-live
- Table headers properly marked

**Focus Indicators**:
```css
*:focus-visible {
  outline: 2px solid #dc2626;
  outline-offset: 2px;
}
```

---

## Animation & Motion

### Principles

**Minimal Animation**:
- Only animate state changes
- Duration: 150-300ms (fast)
- Easing: ease-out (snappy)

**Allowed Animations**:
- Hover state transitions
- Loading spinners
- Toast notifications (slide-in)
- Progress bars (smooth fill)

**NO Animation**:
- Page transitions
- Chart rendering
- Table sorting
- Content loading

### Loading States

**Spinner**:
```
⟳ (rotating icon)
Duration: 1s linear infinite
```

**Skeleton Screens**: Not used (instant data from IndexedDB)

**Progress Bars**:
```
[████████░░░░░░░░]
Smooth transition: width 300ms ease-out
```

---

## Icon System (Lucide React)

### Icon Usage

| Context | Icon | Size |
|---------|------|------|
| **Page headers** | Shield, History, BarChart3 | 24px |
| **Buttons** | Scan, Save, Download | 16px |
| **Status** | CheckCircle, AlertTriangle, XCircle | 20px |
| **Navigation** | Shield, History, Settings | 20px |
| **Features** | AlertTriangle, Link, User | 16px |

### Icon Colors

- **Primary actions**: Current text color (inherits)
- **Status icons**: Match verdict (green/yellow/red)
- **Decorative**: Zinc-600 (subtle)

---

## Error States

### Error Display

```
┌──────────────────────────────────────┐
│  ⚠  Scan failed                      │
│  Unable to process message.           │
│  Please try again.                    │
│                                       │
│  [Try Again]  [Report Issue]          │
└──────────────────────────────────────┘
```

### Toast Notifications (Sonner)

**Success**:
```
✓ Scan saved to history
```

**Error**:
```
✗ Failed to export CSV
```

**Info**:
```
ℹ No updates available
```

- **Position**: Top-right
- **Duration**: 4 seconds
- **Theme**: Dark
- **Style**: Minimal, single-line

---

## Security UI Patterns

### High-Confidence Phishing Alert

```
┌───────────────────────────────────────┐
│ 🔴 CRITICAL THREAT DETECTED           │
│                                       │
│ This message contains multiple        │
│ phishing indicators. DO NOT:          │
│                                       │
│ • Click any links                     │
│ • Download attachments                │
│ • Reply with credentials              │
│                                       │
│ [Mark as Incident] [Report to Admin]  │
└───────────────────────────────────────┘
```

### Offline Mode Banner

```
┌───────────────────────────────────────┐
│ 📡 OFFLINE MODE                       │
│ Operating without network connection. │
│ All core features remain functional.  │
└───────────────────────────────────────┘
```

---

## Design Justifications

### Why Dark Mode by Default?

1. **Control room environments**: Reduces eye strain in low-light
2. **24/7 operation**: Easier on operators during night shifts
3. **Screen longevity**: OLED displays benefit from dark backgrounds
4. **Professional aesthetic**: Matches existing SOC tools

### Why Minimal Animation?

1. **Performance**: Faster on low-spec hardware
2. **Distraction-free**: Operators need to focus on data
3. **Accessibility**: Motion-sensitive users
4. **Battery life**: Important for mobile/field use

### Why High Contrast?

1. **Readability**: Critical in emergency situations
2. **Accessibility**: WCAG AAA compliance
3. **Projector compatibility**: Often used in control rooms
4. **Color blindness**: Red/green still distinguishable with text labels

### Why No Hamburger Menu?

1. **Efficiency**: One-click navigation always visible
2. **Spatial memory**: Operators learn layout quickly
3. **Desktop-first**: Target users have screen real estate
4. **No hidden features**: Everything discoverable

---

## Future UI Enhancements

### Phase 2 Features

1. **Dark/Light Theme Toggle**
   - Allow user preference
   - Respect system preference
   - Persist choice locally

2. **Customizable Dashboard**
   - Drag-and-drop widgets
   - Show/hide metrics
   - User-defined layouts

3. **Advanced Filters**
   - Date range picker
   - Multi-select filters
   - Saved filter presets

4. **Keyboard Shortcuts Panel**
   - Press `?` to show shortcuts
   - Customizable bindings
   - Vim-style navigation (optional)

5. **Bulk Operations**
   - Multi-select in table
   - Batch export
   - Batch delete

---

**Document Version**: 1.0.0  
**Last Updated**: February 12, 2026  
**Design System**: PhishGuard Security Console v1
