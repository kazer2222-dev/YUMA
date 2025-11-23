# YUMA Calendar Feature - Complete Implementation Specification

## Overview

Implement a full-featured calendar component for the YUMA task management platform that supports multiple views, event management, task integration, and AI-powered scheduling features. The calendar should follow the established dark theme design system inspired by ClickUp with modern UI patterns.

## Design System Requirements

### Color Scheme (Dark Theme)

- **Background Colors**:
  - Main calendar background: `#1a1a1a`
  - Calendar cell background: `#242424`
  - Calendar cell hover: `#2a2a2a`
  - Selected date: `#2f2f2f`
  - Today highlight: `#3b82f6` (blue accent)
- **Border Colors**:
  - Grid lines: `#333333`
  - Event borders: Varies by priority/status
- **Text Colors**:
  - Primary text: `#e5e5e5`
  - Secondary text: `#a3a3a3`
  - Disabled text: `#666666`
  - Event text: `#ffffff`

- **Status Colors**:
  - To Do: `#94a3b8` (slate)
  - In Progress: `#3b82f6` (blue)
  - Completed: `#22c55e` (green)
  - Blocked: `#ef4444` (red)
  - On Hold: `#f59e0b` (amber)

- **Priority Colors**:
  - Urgent: `#dc2626` (red)
  - High: `#f97316` (orange)
  - Medium: `#eab308` (yellow)
  - Low: `#22c55e` (green)

### Typography

- **Headers**: Use default heading styles from globals.css
- **Body Text**: Use default body styles
- **Event Titles**: Slightly condensed for space efficiency
- **Time Labels**: Monospace or tabular numbers for alignment

## Core Calendar Structure

### Main Calendar Container

```
┌─────────────────────────────────────────────────────────┐
│ Calendar Header (Navigation + View Switcher + Actions)  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│                  Calendar View Area                       │
│            (Month/Week/Day/Agenda/Timeline)               │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                  Mini Calendar Sidebar                    │
│                  (Optional, toggleable)                   │
└─────────────────────────────────────────────────────────┘
```

## 1. Calendar Header Component

### Layout (Left to Right)

```
[Today Button] [◄ Prev] [Month Year] [Next ►] | [Month▼] [Week▼] [Day▼] [Agenda▼] [Timeline▼] | [🔍 Search] [⚙️ Settings] [➕ Create Event] [AI Assistant 🤖]
```

### Elements

1. **Navigation Controls**:
   - "Today" button - jumps to current date
   - Previous period arrow button
   - Current period label (clickable date picker)
   - Next period arrow button

2. **View Switcher** (Button Group):
   - Month View (default)
   - Week View
   - Day View
   - Agenda View (list)
   - Timeline View (horizontal gantt-style)

3. **Action Buttons**:
   - Search/Filter button (opens filter panel)
   - Settings button (calendar preferences)
   - Create Event button (primary CTA)
   - AI Assistant button (AI scheduling features)

4. **Filter Chips** (Below header when active):
   - Display active filters as removable chips
   - Filter by: Status, Priority, Assignee, Space, Tags
   - "Clear All" button when filters active

## 2. Month View

### Grid Structure

- 7 columns (Sun-Sat or Mon-Sun based on settings)
- 5-6 rows for weeks
- Fixed cell heights or auto-adjust based on events
- Day numbers in top-left of each cell
- Previous/next month dates shown in muted color

### Cell Components

Each calendar cell contains:

1. **Day Number** (top-left corner)
   - Current month: Full opacity
   - Other months: 40% opacity
   - Today: Blue circle background
   - Selected: Gray background

2. **Event Pills** (stacked vertically):
   - Show up to 3 events per cell
   - "+N more" indicator if overflow
   - Click to expand or show quick preview
   - Color-coded left border (status or priority)
   - Time + Title displayed
   - Truncate long titles with ellipsis

3. **Hover Effects**:
   - Entire cell highlights on hover
   - "+" button appears in top-right
   - Quick action tooltip

4. **Drag & Drop**:
   - Drag events between cells to reschedule
   - Drop zone highlights on drag over
   - Visual feedback during drag

### Event Pill Design

```
┌─────────────────────────────┐
│ ▌ 9:00 AM  Team Standup    │  ← Color bar | Time | Title
└─────────────────────────────┘
```

## 3. Week View

### Layout

```
         Mon    Tue    Wed    Thu    Fri    Sat    Sun
All Day  [─────────────────────────────────────────]
─────────────────────────────────────────────────────
8 AM     │      │      │      │      │      │      │
9 AM     │  [Event]   │      │      │      │      │
10 AM    │      │      │      │      │      │      │
...
```

### Components

1. **Time Column** (left side):
   - Hour markers (12h or 24h format)
   - 30-minute or 1-hour increments
   - Current time indicator line

2. **Day Columns**:
   - Header shows: Day name + Date
   - Highlight current day
   - All-day events row at top
   - Time-slotted events positioned by start/end time

3. **Event Blocks**:
   - Height based on duration
   - Width adapts if overlapping events
   - Show time + title
   - Color-coded background (with opacity)
   - Border color for status/priority

4. **Interactions**:
   - Click empty space to create event
   - Drag event to move
   - Resize handles (top/bottom) to adjust duration
   - Double-click to open detail modal

## 4. Day View

### Layout

Similar to week view but single column:

- Larger event blocks with more detail
- Hourly time slots
- Half-hour grid lines
- All-day events section at top
- More space for event details (description preview, assignees, attachments count)

### Additional Features

- Weather widget (optional, top-right)
- Daily summary (event count, time blocks)
- Focus time indicators (blocks without meetings)
- AI suggestions panel (best time for focused work)

## 5. Agenda View

### List Layout

Group events by date:

```
Today - January 15, 2024
  ┌─────────────────────────────────────────────┐
  │ ● 9:00 AM - 10:00 AM                        │
  │   Team Standup                              │
  │   👥 John, Sarah, Mike                      │
  │   📍 Conference Room A                      │
  └─────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────┐
  │ ● 2:00 PM - 3:30 PM                         │
  │   Product Review                            │
  │   👥 Design Team                            │
  │   🤖 AI-scheduled                           │
  └─────────────────────────────────────────────┘

Tomorrow - January 16, 2024
  ...
```

### Components

1. **Date Headers**:
   - Sticky headers when scrolling
   - Relative date labels (Today, Tomorrow, Next Monday)
   - Event count badge

2. **Event Cards**:
   - Time range
   - Event title
   - Status indicator (colored dot)
   - Priority flag (if urgent/high)
   - Assignees avatars
   - Location/meeting link
   - AI badge if AI-scheduled
   - Quick actions (Edit, Delete, Complete)

3. **Empty States**:
   - "No events scheduled" message
   - "Create Event" CTA
   - AI suggestion: "Would you like AI to suggest optimal meeting times?"

## 6. Timeline View (Horizontal Gantt)

### Layout

```
Task Name               Jan 15  Jan 16  Jan 17  Jan 18  Jan 19
────────────────────────────────────────────────────────────────
Website Redesign        [════════════════════════════]
  - Design Phase            [═══════]
  - Development                     [═══════════]
  - Testing                                   [════]

Mobile App              [═══════════]
  - Backend API         [═════]
  - Frontend UI              [═════]
```

### Features

- Horizontal time axis (days, weeks, or months)
- Hierarchical task/project structure
- Duration bars with progress indicators
- Dependencies shown with connecting lines
- Milestones marked with diamonds
- Drag to reschedule, resize to change duration
- Color-coded by project or status

## 7. Event Creation Modal

### Modal Structure

```
┌────────────────────────────────────────────────────┐
│  Create Event                              [✕]    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Event Title *                                     │
│  [________________________________]                │
│                                                    │
│  📅 Date & Time                                    │
│  Start: [Jan 15, 2024] [9:00 AM]                  │
│  End:   [Jan 15, 2024] [10:00 AM]                 │
│  □ All day event    □ Recurring                   │
│                                                    │
│  📝 Description                                    │
│  [________________________________]                │
│  [________________________________]                │
│                                                    │
│  👥 Attendees                                      │
│  [Search users...] [+]                            │
│  [Avatar] John Doe [✕]                            │
│  [Avatar] Sarah Smith [✕]                         │
│                                                    │
│  🏷️ Project/Space                                 │
│  [Select space...] ▼                              │
│                                                    │
│  🎯 Priority                                       │
│  ( ) Low  ( ) Medium  (•) High  ( ) Urgent        │
│                                                    │
│  📊 Status                                         │
│  [Scheduled] ▼                                    │
│                                                    │
│  🔔 Reminders                                      │
│  [15 minutes before] ▼  [+ Add reminder]          │
│                                                    │
│  🔗 Related Tasks                                  │
│  [Search tasks...] [+]                            │
│                                                    │
│  📎 Attachments                                    │
│  [Upload files] or drag and drop                  │
│                                                    │
│  🤖 AI Features                                    │
│  [ Suggest optimal time ]                         │
│  [ Auto-invite relevant people ]                  │
│  [ Generate agenda from description ]             │
│                                                    │
├────────────────────────────────────────────────────┤
│                    [Cancel]  [Create Event]        │
└────────────────────────────────────────────────────┘
```

### Form Fields

1. **Event Title** (required)
   - Text input
   - Auto-complete from recent events
   - Character limit indicator

2. **Date & Time**:
   - Start date picker + time picker
   - End date picker + time picker
   - All-day event toggle
   - Recurring event toggle (opens recurrence modal)
   - Time zone selector (if needed)

3. **Description**:
   - Rich text editor
   - Markdown support
   - @mention support
   - Link preview

4. **Attendees**:
   - Search/select from team members
   - External email input
   - Required/optional designation
   - Permissions (view/edit)

5. **Project/Space**:
   - Dropdown selector
   - Inherits space's color scheme
   - Access control based on space

6. **Priority Selector**:
   - Radio buttons or dropdown
   - Visual color indicators

7. **Status**:
   - Dropdown with predefined statuses
   - Custom status option

8. **Reminders**:
   - Multiple reminders allowed
   - Preset options (5min, 15min, 30min, 1hr, 1day)
   - Custom time option

9. **Related Tasks**:
   - Link to existing tasks
   - Creates two-way relationship
   - Shows task status inline

10. **Attachments**:
    - Drag & drop zone
    - File browser
    - Cloud storage integration
    - Preview thumbnails

11. **AI Features Section**:
    - "Suggest optimal time" - AI analyzes attendee availability
    - "Auto-invite relevant people" - AI suggests based on event type
    - "Generate agenda" - AI creates agenda from description
    - Each with loading state and results display

### Validation

- Required field indicators (\*)
- Real-time validation
- Error messages inline
- Conflict detection (overlapping events warning)
- Duration validation (end > start)

## 8. Event Detail Popover (Quick View)

### Trigger

- Click on event pill in any calendar view
- Opens as popover/tooltip near clicked element

### Content

```
┌───────────────────────────────────────┐
│ Team Standup Meeting         [✕]     │
│ ─────────────────────────────────     │
│ 📅 Mon, Jan 15 • 9:00 AM - 10:00 AM  │
│ 👥 John, Sarah, Mike (+2)            │
│ 📍 Conference Room A                  │
│ 🎯 Priority: High                     │
│ 📊 Status: Scheduled                  │
│                                       │
│ Quick review of sprint progress...    │
│                                       │
│ 🔗 Related: TASK-123, TASK-456       │
│                                       │
│ ────────────────────────────────      │
│ [Edit] [Delete] [Mark Complete]      │
│ [View Full Details]                   │
└───────────────────────────────────────┘
```

### Actions

- Edit button (opens edit modal)
- Delete button (with confirmation)
- Mark complete/cancel
- View full details (expands to full modal)
- Quick reschedule (drag or click)

## 9. Recurring Event Modal

### Recurrence Pattern Options

```
┌────────────────────────────────────────┐
│  Repeat Pattern                        │
│                                        │
│  (•) Daily                             │
│  ( ) Weekly                            │
│  ( ) Monthly                           │
│  ( ) Yearly                            │
│  ( ) Custom                            │
│                                        │
│  Repeat every [1] [days] ▼            │
│                                        │
│  📅 Ends                               │
│  ( ) Never                             │
│  ( ) On [Jan 30, 2024]                │
│  (•) After [10] occurrences           │
│                                        │
│  ─────────────────────────────         │
│  Weekly on:                            │
│  [M] [T] [W] [T] [F] [S] [S]          │
│                                        │
│  ─────────────────────────────         │
│  Preview:                              │
│  • Jan 15, 2024                        │
│  • Jan 16, 2024                        │
│  • Jan 17, 2024                        │
│  ...                                   │
│                                        │
│          [Cancel]  [Save]              │
└────────────────────────────────────────┘
```

### Features

- Preset patterns (daily, weekly, monthly, yearly)
- Custom pattern builder
- Day of week selector (for weekly)
- Day of month/week selector (for monthly)
- End condition options
- Preview of upcoming occurrences
- Exception dates (skip specific dates)

## 10. Event Edit Modal

Same structure as create modal but:

- Pre-filled with existing data
- "Save Changes" button instead of "Create"
- Additional "Delete Event" button (bottom-left)
- For recurring events: "Edit this event" vs "Edit series" option
- Show edit history (who changed what, when)
- Unsaved changes warning on close

## 11. Calendar Settings Panel (Slide-out)

### Settings Categories

```
┌────────────────────────────────────────┐
│  Calendar Settings            [✕]     │
├────────────────────────────────────────┤
│                                        │
│  🎨 Appearance                         │
│  ├─ Theme: Dark / Light / Auto        │
│  ├─ Start of week: [Monday] ▼         │
│  ├─ Time format: 12h / 24h            │
│  └─ Show week numbers: ☑️              │
│                                        │
│  📅 Default View                       │
│  ├─ Starting view: [Month] ▼          │
│  └─ Mini calendar: ☑️ Show            │
│                                        │
│  ⏰ Time & Date                        │
│  ├─ Work hours: [9:00 AM - 5:00 PM]  │
│  ├─ Work days: M T W T F              │
│  ├─ Time zone: [PST] ▼                │
│  └─ Date format: [MM/DD/YYYY] ▼       │
│                                        │
│  🔔 Notifications                      │
│  ├─ Default reminder: [15 min] ▼      │
│  ├─ Email notifications: ☑️            │
│  ├─ Push notifications: ☑️             │
│  └─ Daily agenda email: ☐             │
│                                        │
│  🎨 Event Colors                       │
│  ├─ Color by: [Status] ▼              │
│  │   Options: Status, Priority,       │
│  │   Project, Assignee                │
│  └─ Custom colors: [Manage]           │
│                                        │
│  🔄 Sync & Integration                 │
│  ├─ Google Calendar: [Connect]        │
│  ├─ Outlook: [Connect]                │
│  └─ iCal Export: [Generate Link]      │
│                                        │
│  🤖 AI Preferences                     │
│  ├─ Auto-scheduling: ☑️ Enabled        │
│  ├─ Smart suggestions: ☑️              │
│  ├─ Meeting optimization: ☑️           │
│  └─ Focus time blocks: ☑️              │
│                                        │
│  🗑️ Danger Zone                        │
│  └─ Clear all events: [Clear]         │
│                                        │
└────────────────────────────────────────┘
```

## 12. Filter & Search Panel (Slide-out)

### Filter Options

```
┌────────────────────────────────────────┐
│  Filters & Search             [✕]     │
├────────────────────────────────────────┤
│                                        │
│  🔍 Search                             │
│  [Search events, tasks...] 🔍         │
│                                        │
│  📊 Status                             │
│  ☑️ Scheduled                          │
│  ☑️ In Progress                        │
│  ☑️ Completed                          │
│  ☐ Cancelled                          │
│                                        │
│  🎯 Priority                           │
│  ☑️ All priorities                     │
│  ☐ Urgent only                        │
│  ☐ High only                          │
│  ☐ Medium or lower                    │
│                                        │
│  👥 Assignees                          │
│  ☑️ All                                │
│  ☐ Assigned to me                     │
│  ☐ Unassigned                         │
│  [Select people...] ▼                 │
│                                        │
│  🏷️ Projects/Spaces                   │
│  ☑️ All spaces                         │
│  ☑️ Project Alpha                      │
│  ☑️ Marketing Team                     │
│  ☐ Engineering                        │
│                                        │
│  🏷️ Tags                               │
│  [+ Add tag filter]                    │
│                                        │
│  📅 Date Range                         │
│  From: [Jan 1, 2024]                  │
│  To:   [Jan 31, 2024]                 │
│  Presets: [This Week] [This Month]    │
│                                        │
│  🤖 Event Type                         │
│  ☑️ Manual events                      │
│  ☑️ AI-scheduled                       │
│  ☑️ Recurring events                   │
│  ☐ All-day events                     │
│                                        │
│  ──────────────────────────────        │
│  [Clear All]        [Apply Filters]   │
│                                        │
└────────────────────────────────────────┘
```

### Search Features

- Real-time search as you type
- Search across: titles, descriptions, attendees, locations
- Recent searches dropdown
- Advanced search syntax support
- Keyboard shortcuts (Cmd/Ctrl+K)

## 13. AI Assistant Panel (Slide-out)

### AI Features

```
┌────────────────────────────────────────┐
│  AI Calendar Assistant 🤖     [✕]     │
├────────────────────────────────────────┤
│                                        │
│  💬 Ask AI                             │
│  [What can I help you with?]          │
│                                        │
│  Quick Actions:                        │
│  ┌─────────────────────────────────┐  │
│  │ 🎯 Find best time for meeting   │  │
│  │ 📊 Analyze my schedule          │  │
│  │ ⚡ Optimize my week             │  │
│  │ 🔄 Reschedule conflicts         │  │
│  └─────────────────────────────────┘  │
│                                        │
│  💡 Smart Suggestions                  │
│  ────────────────────────────          │
│  • You have 3 back-to-back meetings   │
│    tomorrow. Add buffer time?         │
│    [Yes] [No]                         │
│                                        │
│  • Your focus time is low this week.  │
│    Block 2 hours on Thursday?         │
│    [Schedule] [Dismiss]               │
│                                        │
│  • Meeting "Product Review" could be  │
│    30min shorter based on past data.  │
│    [Apply] [Ignore]                   │
│                                        │
│  📈 Schedule Analytics                 │
│  ────────────────────────────          │
│  • Meeting hours: 12h this week       │
│  • Focus time: 8h available           │
│  • Utilization: 78%                   │
│  • Peak productivity: 9AM-11AM        │
│                                        │
│  🎯 Recommendations                    │
│  ────────────────────────────          │
│  • Schedule important work during     │
│    9-11 AM when you're most focused   │
│  • Decline "Status Update" meeting -  │
│    async update would suffice         │
│  • Batch similar meetings together    │
│                                        │
└────────────────────────────────────────┘
```

### AI Capabilities

1. **Smart Scheduling**:
   - Find optimal meeting times
   - Consider attendee availability
   - Account for time zones
   - Respect work hours and preferences

2. **Conflict Resolution**:
   - Detect scheduling conflicts
   - Suggest alternatives
   - Auto-reschedule lower priority events

3. **Schedule Optimization**:
   - Identify inefficiencies
   - Suggest meeting consolidation
   - Recommend focus time blocks
   - Analyze meeting patterns

4. **Predictive Suggestions**:
   - Recurring meeting patterns
   - Attendee recommendations
   - Meeting duration estimates
   - Agenda generation

5. **Natural Language**:
   - "Schedule a team meeting next Tuesday afternoon"
   - "Find time to meet with Sarah this week"
   - "Block focus time every morning"

## 14. Mini Calendar Sidebar (Toggleable)

### Layout

```
┌────────────────────────┐
│    January 2024        │
│  S  M  T  W  T  F  S  │
│     1  2  3  4  5  6  │
│  7  8  9 [10] 11 12 13│  ← Today highlighted
│ 14 15 16 17 18 19 20  │
│ 21 22 23 24 25 26 27  │
│ 28 29 30 31           │
├────────────────────────┤
│  Upcoming Events       │
│  ○ 9:00 AM Team Standup│
│  ○ 2:00 PM Review      │
│                        │
│  Tomorrow              │
│  ○ 10:00 AM Planning   │
├────────────────────────┤
│  My Calendars          │
│  ☑️ Work               │
│  ☑️ Personal           │
│  ☐ Holidays            │
└────────────────────────┘
```

### Features

- Compact month view
- Date selection navigates main calendar
- Event count dots on dates
- Upcoming events preview
- Calendar visibility toggles
- Color legend

## 15. Event Context Menu (Right-click)

### Menu Options

```
┌──────────────────────────┐
│ ✏️ Edit Event            │
│ 📋 Duplicate             │
│ 🔄 Convert to Task       │
│ ─────────────────        │
│ 📅 Reschedule           │
│ ⏰ Change Duration       │
│ 👥 Manage Attendees      │
│ ─────────────────        │
│ 🎨 Change Color          │
│ 🔔 Edit Reminders        │
│ 🔗 Copy Link             │
│ ─────────────────        │
│ ✅ Mark Complete         │
│ ❌ Cancel Event          │
│ 🗑️ Delete                │
└──────────────────────────┘
```

## 16. Drag & Drop Interactions

### Event Dragging

- **Visual Feedback**:
  - Event becomes semi-transparent during drag
  - Ghost element follows cursor
  - Valid drop zones highlight
  - Invalid zones show red overlay
  - Snap to time increments (15/30 min)

- **Drop Actions**:
  - Drop on new date: Reschedule event
  - Drop on different time: Change start time
  - Drop on task: Convert event to task or link
  - Ctrl/Cmd+Drag: Duplicate event

- **Multi-Event Drag**:
  - Select multiple events (Shift+Click)
  - Drag group together
  - Maintain relative timing

### Event Resizing

- Resize handles on event top/bottom
- Cursor changes to resize icon
- Real-time duration display
- Snap to time increments
- Minimum duration enforcement (15 min)

## 17. Keyboard Shortcuts

### Navigation

- `←/→` - Previous/Next period
- `↑/↓` - Previous/Next week (in month view)
- `T` - Go to Today
- `M` - Switch to Month view
- `W` - Switch to Week view
- `D` - Switch to Day view
- `A` - Switch to Agenda view

### Actions

- `N` or `C` - Create new event
- `E` - Edit selected event
- `Delete` - Delete selected event
- `Cmd/Ctrl+C` - Copy event
- `Cmd/Ctrl+V` - Paste event
- `Cmd/Ctrl+Z` - Undo
- `Cmd/Ctrl+Shift+Z` - Redo

### Search & Filter

- `Cmd/Ctrl+K` - Open search
- `Cmd/Ctrl+F` - Open filters
- `Esc` - Close modal/panel
- `Enter` - Apply/Save

### Selection

- `Tab` - Navigate through events
- `Shift+Tab` - Navigate backward
- `Space` - Select/Deselect event
- `Cmd/Ctrl+A` - Select all visible events

## 18. Loading States & Skeletons

### Calendar Loading

- Skeleton grid for month view
- Shimmer animation on cells
- Progressive loading (current month first)
- Loading indicator for event fetching

### Event Creation Loading

- Disabled form during submission
- Spinner on create button
- Success animation on completion
- Error handling with retry option

### AI Features Loading

- "AI is thinking..." message
- Progress indicator for long operations
- Estimated time remaining
- Cancel option for long-running tasks

## 19. Empty States

### No Events

```
┌─────────────────────────────────┐
│         📅                      │
│                                 │
│     No events scheduled         │
│                                 │
│   Your calendar is clear!       │
│   Create an event to get started│
│                                 │
│     [+ Create Event]            │
│                                 │
│         or                      │
│                                 │
│   [🤖 Let AI suggest schedule]  │
│                                 │
└─────────────────────────────────┘
```

### No Search Results

```
┌─────────────────────────────────┐
│         🔍                      │
│                                 │
│   No events found               │
│                                 │
│   Try adjusting your filters    │
│   or search terms               │
│                                 │
│     [Clear Filters]             │
│                                 │
└─────────────────────────────────┘
```

## 20. Error States

### Event Creation Error

- Inline error messages
- Field validation errors (red border + message)
- Network error toast
- Conflict warnings (overlapping events)
- Permission errors

### Loading Error

- "Failed to load events" message
- Retry button
- Offline mode indicator
- Cached data display (if available)

## 21. Responsive Design

### Desktop (>1024px)

- Full calendar grid
- Side panels slide out
- Mini calendar sidebar visible
- All features accessible

### Tablet (768px - 1024px)

- Adjusted grid spacing
- Side panels overlay
- Mini calendar toggleable
- Touch-friendly event blocks

### Mobile (<768px)

- Default to Agenda view
- Swipe between days/weeks
- Bottom sheet modals
- Simplified event creation form
- Floating action button for create
- Hamburger menu for filters/settings

### Mobile Gestures

- Swipe left/right: Navigate periods
- Swipe down: Refresh
- Long press: Context menu
- Pinch: Zoom timeline (week/day views)
- Pull to create: Pull down on time slot to create event

## 22. Animations & Transitions

### Page Transitions

- Fade in/out for view switches (200ms)
- Slide animations for modals (300ms ease-out)
- Smooth scroll to today/selected date

### Event Interactions

- Scale up on hover (1.02)
- Shadow elevation on drag
- Smooth color transitions
- Pulse animation for reminders

### AI Features

- Typing indicator for AI responses
- Progress bar for analysis
- Success checkmark animation
- Confetti for achievements (optional)

## 23. Accessibility (A11Y)

### Keyboard Navigation

- Full keyboard support (see shortcuts)
- Focus indicators on all interactive elements
- Tab order follows logical flow
- Arrow key navigation in grids

### Screen Readers

- ARIA labels on all buttons and controls
- ARIA-live regions for dynamic content
- Semantic HTML structure
- Alt text for icons and visual elements
- Descriptive link text

### Visual Accessibility

- High contrast mode support
- Minimum 4.5:1 contrast ratios
- Focus indicators (2px blue outline)
- No color-only information
- Scalable text (respects browser zoom)

### Reduced Motion

- Respect prefers-reduced-motion
- Disable animations if requested
- Instant transitions instead of animated

## 24. Performance Optimization

### Rendering

- Virtual scrolling for large date ranges
- Lazy load events outside viewport
- Memoize event components
- Debounce search input (300ms)
- Throttle resize handlers (100ms)

### Data Management

- Cache calendar data (7 days forward/back)
- Prefetch adjacent months
- Optimistic UI updates
- Batch API requests
- WebSocket for real-time updates

### Bundle Size

- Code split by view (month/week/day)
- Lazy load AI features
- Tree-shake unused utilities
- Compress assets

## 25. Integration Points

### Task Management

- Link events to tasks
- Show task deadlines on calendar
- Convert events to tasks
- Task status affects event color

### Notifications

- Browser push notifications
- Email reminders
- In-app notification center
- Slack/Teams integration

### External Calendars

- Google Calendar sync
- Outlook sync
- iCal import/export
- CalDAV support

### Analytics

- Track event creation patterns
- Meeting duration analytics
- Attendance tracking
- Productivity metrics

## 26. Data Structure Examples

### Event Object

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  recurring: RecurrencePattern | null;
  status:
    | "scheduled"
    | "in-progress"
    | "completed"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  attendees: Attendee[];
  location?: string;
  meetingLink?: string;
  reminders: Reminder[];
  relatedTasks: string[];
  attachments: Attachment[];
  color?: string;
  spaceId?: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  aiGenerated: boolean;
}

interface RecurrencePattern {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
  occurrences?: number;
  exceptions?: Date[];
}

interface Attendee {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  required: boolean;
  status: "pending" | "accepted" | "declined" | "tentative";
}

interface Reminder {
  id: string;
  type: "notification" | "email";
  minutesBefore: number;
}
```

## 27. User Preferences Storage

```typescript
interface CalendarPreferences {
  defaultView: "month" | "week" | "day" | "agenda" | "timeline";
  startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat: "12h" | "24h";
  dateFormat: string;
  workHours: { start: string; end: string };
  workDays: number[];
  showWeekNumbers: boolean;
  showMiniCalendar: boolean;
  defaultReminder: number;
  colorBy: "status" | "priority" | "project" | "assignee";
  aiEnabled: boolean;
  autoScheduling: boolean;
}
```

## 28. Testing Requirements

### Unit Tests

- Event creation/editing logic
- Date calculations and formatting
- Recurrence pattern generation
- Filter and search logic
- Validation functions

### Integration Tests

- Calendar view switching
- Drag and drop functionality
- Event CRUD operations
- AI feature integration
- External calendar sync

### E2E Tests

- Complete event creation flow
- Multi-day event spanning
- Recurring event creation
- Filter and search scenarios
- Mobile responsive behavior

### Accessibility Tests

- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Focus management

## 29. Implementation Priority

### Phase 1 (MVP)

1. Month view with basic grid
2. Event creation modal
3. Event display (pills)
4. Basic event CRUD
5. Today navigation
6. Click to create event

### Phase 2 (Core Features)

1. Week view
2. Day view
3. Agenda view
4. Event detail popover
5. Drag and drop
6. Recurring events
7. Filter panel

### Phase 3 (Advanced)

1. Timeline view
2. AI assistant panel
3. Mini calendar sidebar
4. Advanced filters
5. Search functionality
6. Calendar settings
7. External calendar sync

### Phase 4 (Polish)

1. Animations and transitions
2. Keyboard shortcuts
3. Mobile optimization
4. Performance optimization
5. Accessibility improvements
6. Analytics integration

## 30. Notes for Implementation

- Use React hooks for state management
- Implement date logic with date-fns or day.js (not moment.js)
- Use React DnD or dnd-kit for drag and drop
- Use Recharts for any analytics visualizations
- Use Lucide React for all icons
- Follow the dark theme color palette strictly
- Ensure all AI features have fallback/mock behavior
- Make components reusable and composable
- Add prop-types or TypeScript interfaces
- Use CSS Grid for calendar layouts
- Use Flexbox for event positioning
- Implement proper loading and error states for all async operations
- Add proper ARIA labels and semantic HTML for accessibility
- Test on multiple screen sizes and devices
- Optimize for performance (virtual scrolling, memoization)
- Follow the existing YUMA design patterns and component structure

---

This specification should provide comprehensive guidance for implementing a full-featured calendar system that integrates seamlessly with the YUMA task management platform while supporting AI-powered features and modern collaboration workflows.