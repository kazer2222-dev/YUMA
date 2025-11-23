# YUMA Board & Backlog Feature - Complete Implementation Specification

## Overview
Implement a comprehensive Kanban board and backlog management system for the YUMA task management platform that supports agile workflows, sprint planning, customizable columns, swim lanes, WIP limits, and AI-powered task organization. The board should follow the established dark theme design system inspired by ClickUp with modern UI patterns and JIRA-like workflow capabilities.

## Design System Requirements

### Color Scheme (Dark Theme)
- **Background Colors**:
  - Main board background: `#1a1a1a`
  - Column background: `#242424`
  - Card background: `#2a2a2a`
  - Card hover: `#2f2f2f`
  - Drag preview: `#3b3b3b`
  - Drop zone active: `#1e3a5f` (blue tint)
  
- **Border Colors**:
  - Column borders: `#333333`
  - Card borders: `#404040`
  - Drag indicator: `#3b82f6` (blue)
  - WIP limit warning: `#f59e0b` (amber)
  - WIP limit exceeded: `#ef4444` (red)
  
- **Text Colors**:
  - Primary text: `#e5e5e5`
  - Secondary text: `#a3a3a3`
  - Disabled text: `#666666`
  - Card title: `#ffffff`
  - Metadata: `#94a3b8`

- **Status Colors** (Column Headers):
  - Backlog: `#64748b` (slate)
  - To Do: `#6366f1` (indigo)
  - In Progress: `#3b82f6` (blue)
  - In Review: `#8b5cf6` (purple)
  - Testing: `#f59e0b` (amber)
  - Done: `#22c55e` (green)
  - Blocked: `#ef4444` (red)
  - Custom: User-defined

- **Priority Colors**:
  - Urgent: `#dc2626` (red)
  - High: `#f97316` (orange)
  - Medium: `#eab308` (yellow)
  - Low: `#22c55e` (green)
  - None: `#64748b` (slate)

- **Task Type Colors**:
  - Bug: `#ef4444` (red)
  - Feature: `#3b82f6` (blue)
  - Improvement: `#8b5cf6` (purple)
  - Task: `#64748b` (slate)
  - Story: `#06b6d4` (cyan)
  - Epic: `#d946ef` (fuchsia)

### Typography
- **Headers**: Use default heading styles from globals.css
- **Card Titles**: Clear, bold titles
- **Task IDs**: Monospace font for identifiers
- **Metadata**: Smaller, muted text

## Core Board Structure

### Main Board Container
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Board Header (Board Name + View Controls + Filters + Actions + AI)      │
├─────────────────────────────────────────────────────────────────────────┤
│ Filters Bar (Active filters as chips)                                   │
├─────────┬───────────┬───────────┬───────────┬───────────┬──────────────┤
│         │           │           │           │           │              │
│ Backlog │  To Do    │In Progress│ In Review │  Testing  │    Done      │
│   (25)  │   (12)    │   (8)     │   (5)     │   (3)     │    (47)      │
│ ─────── │ ───────── │ ───────── │ ───────── │ ───────── │ ──────────── │
│ WIP: ∞  │  WIP: ∞   │  WIP: 5   │  WIP: 3   │  WIP: 2   │   WIP: ∞     │
│         │           │ [●●●●●○]  │ [●●●○○]   │ [●●○○○]   │              │
│         │           │           │           │           │              │
│ [Card]  │  [Card]   │  [Card]   │  [Card]   │  [Card]   │   [Card]     │
│         │           │           │           │           │              │
│ [Card]  │  [Card]   │  [Card]   │  [Card]   │  [Card]   │   [Card]     │
│         │           │           │           │           │              │
│ [Card]  │  [Card]   │  [Card]   │           │           │   [Card]     │
│         │           │           │           │           │              │
│   ...   │    ...    │    ...    │    ...    │    ...    │    ...       │
│         │           │           │           │           │              │
│[+ Add]  │  [+ Add]  │  [+ Add]  │  [+ Add]  │  [+ Add]  │   [+ Add]    │
│         │           │           │           │           │              │
└─────────┴───────────┴───────────┴───────────┴───────────┴──────────────┘
```

## 1. Board Header Component

### Layout (Left to Right)
```
[Board: Sprint 24 ▼] | [Board View] [Backlog View] [Timeline View] | [Group By: None▼] [🏊 Swim Lanes] [🔍 Filter] [⚙️ Settings] [📊 Reports] [➕ Create Task] [🤖 AI Organize]
```

### Elements
1. **Board Selector**:
   - Dropdown to switch between boards/sprints
   - Options: "Active Sprint", "Sprint 24", "Sprint 23", "Backlog", "All Tasks"
   - "+ Create New Board" option
   - "Manage Boards" option

2. **View Switcher** (Button Group):
   - Board View (Kanban cards)
   - Backlog View (List with prioritization)
   - Timeline View (Gantt-style)
   - Table View (Detailed list)

3. **Grouping Options**:
   - Group By: None, Assignee, Priority, Epic, Sprint, Custom Field
   - Creates swim lanes when active

4. **Action Buttons**:
   - Swim Lanes toggle (horizontal grouping)
   - Filter button (opens filter panel)
   - Settings button (board configuration)
   - Reports button (velocity, burndown charts)
   - Create Task button (primary CTA)
   - AI Organize button (AI-powered features)

5. **Board Actions Menu** (••• dropdown):
   - Start Sprint
   - Complete Sprint
   - Export Board
   - Archive Completed
   - Clear Board
   - Board Permissions
   - Integration Settings

## 2. Backlog View (Prioritization Mode)

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Backlog                                    [Start Sprint] [⚙️]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Sprint Planning                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ▼ Sprint 24 (0 / 30 points)                                 │  │
│  │ ┌────────────────────────────────────────────────────────┐  │  │
│  │ │ Drop tasks here to add to sprint                       │  │  │
│  │ │                                                         │  │  │
│  │ │ [Drag zone - empty state]                              │  │  │
│  │ │                                                         │  │  │
│  │ └────────────────────────────────────────────────────────┘  │  │
│  │ Capacity: 30 points | Duration: 2 weeks | Team: 5 people  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Backlog Items (147 tasks)              [Sort: Priority ▼] [Filter]│
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ☰ TASK-456  🔴  Fix critical login bug                      │  │
│  │    👤 Sarah | 💎 5 points | 📊 Bug | 🏷️ Auth, Security     │  │
│  │    [Start Sprint] [View] [•••]                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ☰ TASK-457  🟠  Implement user dashboard                    │  │
│  │    👤 Mike | 💎 8 points | 📊 Feature | 🏷️ Dashboard, UI   │  │
│  │    [Start Sprint] [View] [•••]                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ☰ TASK-458  🟡  Refactor API endpoints                      │  │
│  │    👤 Alex | 💎 3 points | 📊 Improvement | 🏷️ Backend     │  │
│  │    [Start Sprint] [View] [•••]                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ... (more backlog items)                                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ▼ Future Epics (Collapsed)                             [12] │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ▼ Icebox (Low Priority)                                 [45] │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [+ Create Task]                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Backlog Features
1. **Sprint Planning Zone**:
   - Collapsible sprint container
   - Drag tasks from backlog into sprint
   - Real-time point calculation
   - Capacity indicator (visual progress bar)
   - Team velocity reference
   - Sprint goal input field
   - Start/Cancel Sprint buttons

2. **Backlog List**:
   - Vertical list of all tasks
   - Drag handle (☰) for reordering
   - Quick actions per task
   - Inline editing capabilities
   - Bulk selection and actions

3. **Prioritization**:
   - Drag to reorder (changes priority)
   - Manual sorting (priority, date, points, etc.)
   - Visual priority indicators
   - Group by Epic/Theme
   - Collapsible sections

4. **Story Points**:
   - Display points per task
   - Sum of points in sprint
   - Velocity tracking
   - Point estimation tool

## 3. Board View (Kanban)

### Column Structure
Each column contains:

1. **Column Header**:
   ```
   ┌─────────────────────────┐
   │ In Progress      (8) ▼  │
   │ ─────────────────────── │
   │ WIP Limit: 5/5 [●●●●●] │
   │ [Collapse] [•••]        │
   └─────────────────────────┘
   ```
   - Column name (editable on click)
   - Task count badge
   - Collapse/expand toggle
   - WIP limit indicator
   - Visual progress (dots or bar)
   - Column menu (•••)

2. **Column Menu** (•••):
   - Edit Column Name
   - Set WIP Limit
   - Change Column Color
   - Set as "Done" Column
   - Add Column Before/After
   - Delete Column
   - Automation Rules

3. **WIP Limit Indicators**:
   - 🟢 Green: Under limit (good capacity)
   - 🟡 Amber: At limit (full capacity)
   - 🔴 Red: Over limit (overcapacity)
   - Visual dots or progress bar
   - Warning icon when exceeded

4. **Column Actions**:
   - Clear completed tasks
   - Archive all tasks
   - Move all to another column
   - Sort tasks in column

### Card Design

```
┌─────────────────────────────────────────┐
│ ▌TASK-456                        [⭐]  │ ← Priority color bar | ID | Star
│ Fix critical login bug                 │ ← Title
│                                        │
│ Users cannot login after password... │ ← Description preview (1 line)
│                                        │
│ 📊 Bug  🎯 High  💎 5 pts  🏷️ Auth   │ ← Type | Priority | Points | Tags
│                                        │
│ [Avatar] Sarah    📎 3   💬 12   ✓ 2/5│ ← Assignee | Attachments | Comments | Subtasks
│                                        │
│ Due: Jan 20 🔴                         │ ← Due date with urgency indicator
└─────────────────────────────────────────┘
```

### Card Components
1. **Priority Indicator**:
   - Vertical color bar on left edge (4px wide)
   - Color based on priority
   - Urgent/High priorities more prominent

2. **Task ID**:
   - Top-left corner
   - Click to copy
   - Hover shows full ID tooltip
   - Monospace font

3. **Star/Pin Icon**:
   - Top-right corner
   - Toggle to pin/favorite
   - Pinned tasks appear at top of column

4. **Title**:
   - Bold, clear text
   - Truncate with ellipsis if too long
   - Click to view details

5. **Description Preview**:
   - First line of description
   - Muted color
   - Truncated with ellipsis

6. **Metadata Row 1** (Icons):
   - Task type icon + label
   - Priority badge
   - Story points
   - Tags (max 2, then +N)

7. **Metadata Row 2** (Bottom):
   - Assignee avatar(s)
   - Attachment count
   - Comment count
   - Subtask progress (completed/total)

8. **Due Date**:
   - Display if set
   - Color-coded:
     - 🔴 Red: Overdue
     - 🟡 Amber: Due within 2 days
     - 🟢 Green: Due later
     - ⚪ Gray: No due date

9. **Card Badges/Overlays**:
   - 🚫 Blocked indicator (diagonal stripe)
   - ⏸️ On hold badge
   - 🤖 AI-generated badge
   - 🔗 Has dependencies icon
   - 📌 Pinned indicator

### Card Interactions

1. **Hover State**:
   - Subtle lift/shadow effect
   - Border highlight
   - Quick action buttons appear
   - Preview tooltip with more details

2. **Click**:
   - Single click: Select card (highlight)
   - Double click: Open detail modal
   - Click assignee: Filter by assignee
   - Click tag: Filter by tag

3. **Drag & Drop**:
   - Drag card to move between columns
   - Visual ghost element follows cursor
   - Drop zones highlight
   - Snap into position
   - Update status automatically
   - Trigger automations

4. **Multi-Select**:
   - Cmd/Ctrl+Click: Add to selection
   - Shift+Click: Range select
   - Drag multiple cards together
   - Bulk actions on selection

5. **Quick Actions** (Hover buttons):
   ```
   ┌─────────────────────────────────────┐
   │ [👁️] [✏️] [👤] [🗑️]          [•••]│
   └─────────────────────────────────────┘
     View Edit Assign Delete      More
   ```

## 4. Swim Lanes

### Horizontal Grouping
```
┌───────────────────────────────────────────────────────────────────┐
│ 🏊 Grouped by: Assignee                                     [✕]  │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ▼ Sarah Johnson (12 tasks)                                       │
│ ├── Backlog ──┬── To Do ──┬── In Progress ──┬── Done ──┐       │
│ │   [Card]     │  [Card]   │    [Card]       │  [Card]  │       │
│ │   [Card]     │           │    [Card]       │  [Card]  │       │
│ │              │           │                 │          │       │
│                                                                   │
│ ▼ Mike Chen (8 tasks)                                            │
│ ├── Backlog ──┬── To Do ──┬── In Progress ──┬── Done ──┐       │
│ │   [Card]     │  [Card]   │    [Card]       │  [Card]  │       │
│ │              │  [Card]   │                 │          │       │
│                                                                   │
│ ▼ Alex Kim (5 tasks)                                             │
│ ├── Backlog ──┬── To Do ──┬── In Progress ──┬── Done ──┐       │
│ │   [Card]     │           │    [Card]       │  [Card]  │       │
│ │              │           │    [Card]       │  [Card]  │       │
│                                                                   │
│ ▲ Unassigned (7 tasks)                                           │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Swim Lane Features
1. **Group By Options**:
   - Assignee (person)
   - Priority (Urgent, High, Medium, Low)
   - Epic/Project
   - Sprint
   - Task Type (Bug, Feature, etc.)
   - Custom Field

2. **Swim Lane Header**:
   - Collapse/expand toggle
   - Group name and count
   - Group avatar/icon
   - Quick filter to this group
   - Group-level actions

3. **Empty Swim Lanes**:
   - Option to show/hide empty lanes
   - "No tasks" message
   - Quick add button

4. **Swim Lane Actions**:
   - Collapse all / Expand all
   - Sort swim lanes (alpha, count, custom)
   - Pin swim lane to top
   - Hide swim lane

## 5. Task Detail Modal

### Full Task View
```
┌──────────────────────────────────────────────────────────────────┐
│ TASK-456  Fix critical login bug                         [✕]    │
│ [Edit] [Clone] [Delete] [Move] [Watch] [Share]    [•••]        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Tabs: [Details] [Activity] [Subtasks] [Links] [Time Tracking]  │
│                                                                  │
│ ╔═══════════════ Details Tab ═══════════════╗                  │
│ ║                                             ║                  │
│ ║ 📝 Description                              ║                  │
│ ║ ┌─────────────────────────────────────────┐ ║                  │
│ ║ │ Users are unable to login after         │ ║                  │
│ ║ │ resetting their password. Error occurs  │ ║                  │
│ ║ │ on the authentication endpoint...       │ ║                  │
│ ║ │                                          │ ║                  │
│ ║ │ [Rich text editor with formatting]      │ ║                  │
│ ║ └─────────────────────────────────────────┘ ║                  │
│ ║                                             ║                  │
│ ║ 📊 Status: [In Progress ▼]                 ║                  │
│ ║ 🎯 Priority: [High ▼]                      ║                  │
│ ║ 📋 Type: [Bug ▼]                           ║                  │
│ ║ 💎 Story Points: [5 ▼]                     ║                  │
│ ║                                             ║                  │
│ ║ 👤 Assignee                                 ║                  │
│ ║ [Avatar] Sarah Johnson [Change]            ║                  │
│ ║ [+ Add assignee]                           ║                  │
│ ║                                             ║                  │
│ ║ 📅 Dates                                    ║                  │
│ ║ Created: Jan 10, 2024                      ║                  │
│ ║ Due Date: [Jan 20, 2024] [Change]         ║                  │
│ ║ Start Date: Jan 15, 2024                   ║                  │
│ ║                                             ║                  │
│ ║ 🏷️ Labels                                   ║                  │
│ ║ [Auth] [Security] [Critical] [+ Add]       ║                  │
│ ║                                             ║                  │
│ ║ 🎯 Epic/Project                             ║                  │
│ ║ [User Authentication System ▼]             ║                  │
│ ║                                             ║                  │
│ ║ 🏃 Sprint                                   ║                  │
│ ║ [Sprint 24 ▼]                              ║                  │
│ ║                                             ║                  │
│ ║ 📎 Attachments (3)                          ║                  │
│ ║ ┌──────────┐ ┌──────────┐ ┌──────────┐   ║                  │
│ ║ │ 📄       │ │ 🖼️       │ │ 📊       │   ║                  │
│ ║ │ error.log│ │ screen.png│ │ data.xlsx│   ║                  │
│ ║ └──────────┘ └──────────┘ └──────────┘   ║                  │
│ ║ [+ Upload] or drag and drop                ║                  │
│ ║                                             ║                  │
│ ║ 🔗 Dependencies                             ║                  │
│ ║ Blocks:                                     ║                  │
│ ║ • TASK-457 - Implement user dashboard      ║                  │
│ ║ • TASK-458 - Deploy to production          ║                  │
│ ║ [+ Add blocker]                            ║                  │
│ ║                                             ║                  │
│ ║ Blocked By:                                 ║                  │
│ ║ • TASK-455 - Database migration ✓          ║                  │
│ ║ [+ Add dependency]                         ║                  │
│ ║                                             ║                  │
│ ║ 🤖 AI Insights                              ║                  │
│ ║ ┌─────────────────────────────────────────┐ ║                  │
│ ║ │ • Similar bug fixed in 2 days avg       │ ║                  │
│ ║ │ • Recommended assignee: Sarah (87%)     │ ║                  │
│ ║ │ • Suggested estimate: 5 points          │ ║                  │
│ ║ │ • Related tasks: TASK-123, TASK-234     │ ║                  │
│ ║ └─────────────────────────────────────────┘ ║                  │
│ ║                                             ║                  │
│ ║ 📊 Custom Fields                            ║                  │
│ ║ Environment: [Production ▼]                ║                  │
│ ║ Severity: [Critical ▼]                     ║                  │
│ ║ Browser: [Chrome, Firefox]                 ║                  │
│ ║                                             ║                  │
│ ╚═════════════════════════════════════════════╝                  │
│                                                                  │
│ 💬 Comments (12)                                                │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [Avatar] Sarah • 2 hours ago                               │ │
│ │ Found the issue - token expiration logic is broken...      │ │
│ │ [Reply] [Edit] [Delete] [React: 👍 3]                     │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [Add comment...________________________] [@] [📎] [Post]        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ Created by Mike Chen on Jan 10, 2024 • Updated 2 hours ago     │
└──────────────────────────────────────────────────────────────────┘
```

### Activity Tab
```
╔═══════════════ Activity Tab ═══════════════╗
║                                             ║
║ Timeline of all changes and events          ║
║                                             ║
║ Today                                       ║
║ • Sarah changed status to In Progress       ║
║   2 hours ago                               ║
║                                             ║
║ • Mike added comment                        ║
║   4 hours ago                               ║
║                                             ║
║ Yesterday                                   ║
║ • Sarah was assigned                        ║
║   Jan 14, 2024 at 3:30 PM                  ║
║                                             ║
║ • Priority changed from Medium to High      ║
║   Jan 14, 2024 at 10:15 AM                 ║
║                                             ║
║ • Mike created this task                    ║
║   Jan 10, 2024 at 9:00 AM                  ║
║                                             ║
║ [Show all activity]                         ║
║                                             ║
╚═════════════════════════════════════════════╝
```

### Subtasks Tab
```
╔═══════════════ Subtasks Tab ═══════════════╗
║                                             ║
║ Progress: 2/5 completed (40%)               ║
║ [████████░░░░░░░░░░] 40%                   ║
║                                             ║
║ ☑ Identify root cause                      ║
║   Sarah • Completed Jan 14                  ║
║                                             ║
║ ☑ Write unit tests                         ║
║   Sarah • Completed Jan 15                  ║
║                                             ║
║ ☐ Implement fix                            ║
║   Sarah • In Progress                       ║
║                                             ║
║ ☐ Code review                              ║
║   Unassigned                                ║
║                                             ║
║ ☐ Deploy to staging                        ║
║   Unassigned                                ║
║                                             ║
║ [+ Add subtask]                            ║
║                                             ║
╚═════════════════════════════════════════════╝
```

### Links Tab
```
╔═══════════════ Links Tab ═════════════════╗
║                                            ║
║ Related Tasks                              ║
║ • TASK-455 - Database migration ✓         ║
║ • TASK-457 - User dashboard                ║
║ • TASK-458 - Production deploy             ║
║                                            ║
║ Pull Requests                              ║
║ • PR #123 - Fix auth token expiration      ║
║   [Open] • 2 approvals • 0 conflicts       ║
║                                            ║
║ External Links                             ║
║ • 🔗 Bug report in customer portal         ║
║ • 🔗 Design spec in Figma                  ║
║                                            ║
║ [+ Add link]                               ║
║                                            ║
╚════════════════════════════════════════════╝
```

### Time Tracking Tab
```
╔═══════════════ Time Tracking ══════════════╗
║                                             ║
║ Estimated: 8 hours                          ║
║ Logged: 5h 30m                              ║
║ Remaining: 2h 30m                           ║
║                                             ║
║ [████████████░░░░] 69% complete            ║
║                                             ║
║ Time Entries                                ║
║ ┌─────────────────────────────────────────┐ ║
║ │ Jan 15 • Sarah Johnson                  │ ║
║ │ 3h 30m - Investigation and debugging    │ ║
║ │ [Edit] [Delete]                         │ ║
║ └─────────────────────────────────────────┘ ║
║                                             ║
║ ┌─────────────────────────────────────────┐ ║
║ │ Jan 16 • Sarah Johnson                  │ ║
║ │ 2h - Implementing fix                   │ ║
║ │ [Edit] [Delete]                         │ ║
║ └─────────────────────────────────────────┘ ║
║                                             ║
║ [+ Log time]                                ║
║                                             ║
║ Start Timer: [▶️ Start]                    ║
║                                             ║
╚═════════════════════════════════════════════╝
```

## 6. Quick Create Task

### Inline Creation (in column)
```
┌─────────────────────────────────────┐
│ [+ Add task]                        │
└─────────────────────────────────────┘
       ↓ Click expands to:
┌─────────────────────────────────────┐
│ Task title                          │
│ [____________________________]      │
│                                     │
│ [Assignee ▼] [Priority ▼] [Type ▼]│
│                                     │
│ [Cancel] [Create] [Create & Open]  │
└─────────────────────────────────────┘
```

### Quick Create Modal (+ button)
```
┌────────────────────────────────────────┐
│ Create Task                     [✕]   │
├────────────────────────────────────────┤
│                                        │
│ Task Title *                           │
│ [________________________________]     │
│                                        │
│ Description                            │
│ [________________________________]     │
│ [________________________________]     │
│                                        │
│ 📊 Type: [Task ▼]                     │
│ 🎯 Priority: [Medium ▼]               │
│ 📋 Status: [To Do ▼]                  │
│ 👤 Assignee: [Select...▼]             │
│ 💎 Story Points: [Select...▼]         │
│                                        │
│ 🏷️ Labels: [+ Add labels]             │
│                                        │
│ 🏃 Sprint: [Current Sprint ▼]         │
│ 📁 Epic: [Select epic...▼]            │
│                                        │
│ 🤖 AI Suggestions                      │
│ [ Auto-assign based on expertise ]     │
│ [ Estimate story points ]              │
│ [ Suggest related tasks ]              │
│                                        │
│ ──────────────────────────────────     │
│                                        │
│ [More Fields]    [Cancel] [Create]    │
│                                        │
└────────────────────────────────────────┘
```

## 7. Filter & Search Panel

### Filter Sidebar (Slide-out)
```
┌────────────────────────────────────────┐
│ Filters & Search             [✕]      │
├────────────────────────────────────────┤
│                                        │
│ 🔍 Search                              │
│ [Search tasks..._______________] 🔍   │
│                                        │
│ 💾 Saved Filters                       │
│ • My Tasks                             │
│ • High Priority Bugs                   │
│ • Current Sprint                       │
│ • Overdue Tasks                        │
│ [+ Save current filter]                │
│                                        │
│ 📊 Status                              │
│ ☑ To Do                               │
│ ☑ In Progress                         │
│ ☑ In Review                           │
│ ☐ Done                                │
│ ☐ Blocked                             │
│                                        │
│ 🎯 Priority                            │
│ ☑ All priorities                      │
│ ☐ Urgent only                         │
│ ☐ High and above                      │
│ ☐ Medium and below                    │
│                                        │
│ 📋 Type                                │
│ ☑ Bug                                 │
│ ☑ Feature                             │
│ ☑ Improvement                         │
│ ☑ Task                                │
│ ☐ Story                               │
│ ☐ Epic                                │
│                                        │
│ 👥 Assignee                            │
│ ☑ All                                 │
│ ☐ Assigned to me                      │
│ ☐ Unassigned                          │
│ ☐ Sarah Johnson                       │
│ ☐ Mike Chen                           │
│ ☐ Alex Kim                            │
│ [Select people...] ▼                  │
│                                        │
│ 📅 Due Date                            │
│ ☐ Overdue                             │
│ ☐ Due today                           │
│ ☐ Due this week                       │
│ ☐ Due this month                      │
│ ☐ No due date                         │
│ Custom range:                          │
│ From [Jan 1, 2024]                    │
│ To   [Jan 31, 2024]                   │
│                                        │
│ 🏃 Sprint                              │
│ ☑ Current Sprint                      │
│ ☐ Sprint 24                           │
│ ☐ Sprint 23                           │
│ ☐ Backlog                             │
│                                        │
│ 📁 Epic/Project                        │
│ ☐ User Authentication                 │
│ ☐ Dashboard Redesign                  │
│ ☐ Mobile App                          │
│ [Select epics...] ▼                   │
│                                        │
│ 🏷️ Labels                              │
│ [+ Add label filter]                   │
│                                        │
│ 💎 Story Points                        │
│ ○ All                                 │
│ ○ Estimated                           │
│ ○ Not estimated                       │
│ Range: [1] to [13]                    │
│                                        │
│ 📎 Has...                              │
│ ☐ Attachments                         │
│ ☐ Comments                            │
│ ☐ Subtasks                            │
│ ☐ Dependencies                        │
│ ☐ Due date                            │
│                                        │
│ 🤖 AI Filters                          │
│ ☐ AI-generated tasks                  │
│ ☐ At-risk tasks                       │
│ ☐ Stale tasks (no updates >7 days)   │
│                                        │
│ ──────────────────────────────────     │
│ Active Filters: 5                      │
│ [Clear All]           [Apply Filters]  │
│                                        │
└────────────────────────────────────────┘
```

## 8. Board Settings Panel

### Settings Categories
```
┌────────────────────────────────────────┐
│ Board Settings                  [✕]   │
├────────────────────────────────────────┤
│                                        │
│ 📋 General                             │
│ ├─ Board Name: [Sprint 24_____]       │
│ ├─ Description: [____________]         │
│ ├─ Owner: [Sarah Johnson ▼]           │
│ └─ Default view: [Board ▼]            │
│                                        │
│ 📊 Columns                             │
│ ┌──────────────────────────────────┐  │
│ │ ☰ Backlog          [Edit] [✕]   │  │
│ │ ☰ To Do            [Edit] [✕]   │  │
│ │ ☰ In Progress      [Edit] [✕]   │  │
│ │ ☰ In Review        [Edit] [✕]   │  │
│ │ ☰ Testing          [Edit] [✕]   │  │
│ │ ☰ Done ✓           [Edit] [✕]   │  │
│ └──────────────────────────────────┘  │
│ [+ Add Column]                         │
│                                        │
│ Column Settings (In Progress):         │
│ • WIP Limit: [5_]                     │
│ • Color: [🔵 Blue]                    │
│ • Position: [3] of 6                  │
│ • Mark as "Done": ☐                   │
│                                        │
│ 🎨 Appearance                          │
│ ├─ Card size: [Compact] [Standard]   │
│ │   [Detailed]                        │
│ ├─ Show card IDs: ☑                  │
│ ├─ Show avatars: ☑                   │
│ ├─ Show due dates: ☑                 │
│ ├─ Show story points: ☑              │
│ ├─ Card color: [Priority ▼]          │
│ │   (Priority, Type, Label, None)    │
│ └─ Compact mode: ☐                   │
│                                        │
│ 🏊 Swim Lanes                          │
│ ├─ Enable swim lanes: ☑              │
│ ├─ Default grouping: [None ▼]        │
│ ├─ Show empty lanes: ☐               │
│ └─ Collapse by default: ☐            │
│                                        │
│ 🚦 WIP Limits                          │
│ ├─ Enforce WIP limits: ☑             │
│ ├─ Warning threshold: 80%             │
│ ├─ Block when exceeded: ☐            │
│ └─ Show progress: ☑                  │
│                                        │
│ 🏃 Sprint Settings                     │
│ ├─ Sprint duration: [2 weeks ▼]      │
│ ├─ Team capacity: [30 points]        │
│ ├─ Auto-start next sprint: ☐         │
│ └─ Auto-archive done tasks: ☑        │
│                                        │
│ 💎 Story Points                        │
│ ├─ Point scale: [Fibonacci ▼]        │
│ │   (Fibonacci, T-shirt, Linear)     │
│ ├─ Values: 1,2,3,5,8,13,21           │
│ └─ Required for tasks: ☐             │
│                                        │
│ 🔔 Notifications                       │
│ ├─ Task assigned to me: ☑            │
│ ├─ Task mentioned: ☑                 │
│ ├─ Task blocked: ☑                   │
│ ├─ Sprint started/ended: ☑           │
│ ├─ WIP limit exceeded: ☑             │
│ └─ Daily summary: ☐                  │
│                                        │
│ 🤖 Automation                          │
│ ├─ Auto-assign based on skills: ☑    │
│ ├─ Auto-estimate points: ☐           │
│ ├─ Auto-transition: ☑                │
│ │   When all subtasks done →         │
│ │   Move to next column              │
│ └─ Auto-archive: After 30 days       │
│                                        │
│ 🔒 Permissions                         │
│ ├─ Who can edit: [Team ▼]            │
│ ├─ Who can view: [Organization ▼]    │
│ └─ Require approval: ☐               │
│                                        │
│ 🗑️ Danger Zone                         │
│ ├─ Archive board: [Archive]          │
│ ├─ Clear board: [Clear All]          │
│ └─ Delete board: [Delete]            │
│                                        │
└────────────────────────────────────────┘
```

## 9. Sprint Management

### Start Sprint Modal
```
┌────────────────────────────────────────┐
│ Start Sprint                    [✕]   │
├────────────────────────────────────────┤
│                                        │
│ Sprint Name *                          │
│ [Sprint 24_______________]            │
│                                        │
│ Sprint Goal                            │
│ [Complete user authentication___]     │
│ [and dashboard features_________]     │
│                                        │
│ 📅 Duration                            │
│ Start Date: [Jan 15, 2024]            │
│ Duration: [2 weeks ▼]                 │
│ End Date: Jan 29, 2024 (calculated)   │
│                                        │
│ 👥 Team                                │
│ [Avatar][Avatar][Avatar] +2           │
│ Capacity: 30 story points             │
│                                        │
│ 📊 Sprint Content                      │
│ Tasks: 12                              │
│ Total Points: 28                       │
│ Estimated Completion: 93%              │
│                                        │
│ ⚠️ Warnings                            │
│ • 2 tasks without estimates            │
│ • 1 task blocked by external dep      │
│                                        │
│ ──────────────────────────────────     │
│                                        │
│        [Cancel]        [Start Sprint]  │
│                                        │
└────────────────────────────────────────┘
```

### Complete Sprint Modal
```
┌────────────────────────────────────────┐
│ Complete Sprint 24              [✕]   │
├────────────────────────────────────────┤
│                                        │
│ Sprint Summary                         │
│ Started: Jan 15, 2024                  │
│ Ended: Jan 29, 2024 (on time)         │
│                                        │
│ 📊 Completion                          │
│ Completed: 10/12 tasks (83%)           │
│ Points: 24/28 (86%)                    │
│                                        │
│ Tasks Status:                          │
│ ┌──────────────────────────────────┐  │
│ │ ✓ Completed (10)                 │  │
│ │   [Will be archived]             │  │
│ │                                  │  │
│ │ ⏭️ Not Completed (2)             │  │
│ │   TASK-456 - Login bug           │  │
│ │   TASK-457 - User dashboard      │  │
│ │                                  │  │
│ │   Move to:                       │  │
│ │   (•) Next Sprint (Auto)         │  │
│ │   ( ) Backlog                    │  │
│ │   ( ) Specific Sprint [▼]        │  │
│ └──────────────────────────────────┘  │
│                                        │
│ 📈 Generate Report?                    │
│ ☑ Sprint velocity                     │
│ ☑ Burndown chart                      │
│ ☑ Task completion rate                │
│ ☑ Team performance                    │
│                                        │
│ 🔄 Next Sprint                         │
│ ☑ Auto-create Sprint 25               │
│ ☑ Move incomplete tasks               │
│                                        │
│ ──────────────────────────────────     │
│                                        │
│   [Cancel]              [Complete]     │
│                                        │
└────────────────────────────────────────┘
```

## 10. Automation Rules

### Automation Settings
```
┌────────────────────────────────────────┐
│ Board Automations               [✕]   │
├────────────────────────────────────────┤
│                                        │
│ Active Rules (5)                       │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ ✓ Auto-transition to Review      │  │
│ │                                  │  │
│ │ When: All subtasks completed     │  │
│ │ Then: Move to "In Review"        │  │
│ │                                  │  │
│ │ [Edit] [Disable] [Delete]        │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ ✓ Auto-assign to Sarah           │  │
│ │                                  │  │
│ │ When: Label = "Frontend"         │  │
│ │ Then: Assign to Sarah Johnson    │  │
│ │                                  │  │
│ │ [Edit] [Disable] [Delete]        │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ ✓ Set priority for bugs          │  │
│ │                                  │  │
│ │ When: Type = Bug                 │  │
│ │ Then: Set priority to High       │  │
│ │                                  │  │
│ │ [Edit] [Disable] [Delete]        │  │
│ └──────────────────────────────────┘  │
│                                        │
│ [+ Create Automation Rule]             │
│                                        │
│ 🤖 AI Suggested Rules                  │
│ • Auto-estimate story points          │
│ • Flag stale tasks (>7 days)          │
│ • Assign based on workload            │
│ [Enable All] [Review]                  │
│                                        │
└────────────────────────────────────────┘
```

### Create Automation Rule
```
┌────────────────────────────────────────┐
│ Create Automation Rule          [✕]   │
├────────────────────────────────────────┤
│                                        │
│ Rule Name *                            │
│ [Auto-assign backend tasks_______]    │
│                                        │
│ When (Trigger)                         │
│ [Label changed ▼]                     │
│ Equals: [Backend]                     │
│                                        │
│ [+ Add condition]                      │
│                                        │
│ Then (Action)                          │
│ [Assign to ▼]                         │
│ User: [Mike Chen ▼]                   │
│                                        │
│ [+ Add action]                         │
│                                        │
│ Available Triggers:                    │
│ • Task created                         │
│ • Status changed                       │
│ • Assignee changed                     │
│ • Label added/removed                  │
│ • Due date approaching                 │
│ • Task moved to column                 │
│ • Subtasks completed                   │
│ • Comment added                        │
│                                        │
│ Available Actions:                     │
│ • Change status                        │
│ • Assign to user                       │
│ • Set priority                         │
│ • Add label                            │
│ • Set due date                         │
│ • Move to column                       │
│ • Send notification                    │
│ • Create subtask                       │
│                                        │
│ ──────────────────────────────────     │
│                                        │
│        [Cancel]        [Create Rule]   │
│                                        │
└────────────────────────────────────────┘
```

## 11. Reports & Analytics

### Reports Dashboard
```
┌──────────────────────────────────────────────────────────┐
│ Board Analytics                                   [✕]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Period: [Sprint 24 ▼]  Compare to: [Sprint 23 ▼]       │
│                                                          │
│ 📊 Key Metrics                                          │
│ ┌────────────┬────────────┬────────────┬────────────┐  │
│ │ Velocity   │ Completion │ Lead Time  │ Cycle Time │  │
│ │    28      │    83%     │  3.2 days  │  2.1 days  │  │
│ │ (+4 pts)   │ (+8%)      │ (-0.5d)    │ (-0.3d)    │  │
│ └────────────┴────────────┴────────────┴────────────┘  │
│                                                          │
│ 📈 Burndown Chart                                        │
│ [Line chart showing ideal vs actual burndown]           │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 30│                                              │   │
│ │   │╲                                             │   │
│ │ 25│ ╲   Ideal                                   │   │
│ │   │  ╲─────                                      │   │
│ │ 20│   ╲    ╲                                     │   │
│ │   │    ╲    ╲─── Actual                         │   │
│ │ 15│     ╲     ╲                                  │   │
│ │   │      ╲      ╲                                │   │
│ │ 10│       ╲       ╲                              │   │
│ │   │        ╲        ╲                            │   │
│ │  5│         ╲         ╲                          │   │
│ │   │          ╲          ╲                        │   │
│ │  0└───────────────────────────────────────       │   │
│ │    Day1  Day3  Day5  Day7  Day9  Day11  Day14   │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ 📊 Cumulative Flow Diagram                               │
│ [Area chart showing work distribution over time]        │
│                                                          │
│ 👥 Team Performance                                      │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Sarah Johnson    [████████████] 12 tasks • 24 pts │  │
│ │ Mike Chen        [█████████] 9 tasks • 18 pts     │  │
│ │ Alex Kim         [███████] 7 tasks • 14 pts       │  │
│ │ Jane Doe         [█████] 5 tasks • 10 pts         │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ 🏷️ Task Breakdown                                       │
│ By Type:          By Priority:                          │
│ • Bug: 25%        • Urgent: 10%                         │
│ • Feature: 40%    • High: 35%                           │
│ • Improvement: 20%• Medium: 40%                         │
│ • Task: 15%       • Low: 15%                            │
│                                                          │
│ ⏱️ Time Metrics                                          │
│ Average Lead Time: 3.2 days                             │
│ Average Cycle Time: 2.1 days                            │
│ Average Age of WIP: 1.8 days                            │
│ Throughput: 10 tasks/week                               │
│                                                          │
│ 📅 Sprint Health                                         │
│ • Days remaining: 3                                     │
│ • Points remaining: 4                                   │
│ • Projected completion: 86%                             │
│ • Risk level: Low 🟢                                    │
│                                                          │
│ 🎯 Goals vs Actual                                       │
│ • Sprint goal: Complete auth & dashboard ✓              │
│ • Planned: 30 points | Actual: 28 points (93%)          │
│ • Planned: 15 tasks | Actual: 12 tasks (80%)            │
│                                                          │
│ 📤 Export Reports                                        │
│ [PDF] [Excel] [PowerPoint] [Email Report]               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Velocity Chart
```
┌──────────────────────────────────────────┐
│ Velocity Trend                           │
├──────────────────────────────────────────┤
│                                          │
│ 40│                                      │
│   │                                      │
│ 35│                        ▓▓            │
│   │                        ▓▓            │
│ 30│              ▓▓        ▓▓    ▓▓     │
│   │              ▓▓        ▓▓    ▓▓     │
│ 25│        ▓▓    ▓▓        ▓▓    ▓▓     │
│   │        ▓▓    ▓▓        ▓▓    ▓▓     │
│ 20│  ▓▓    ▓▓    ▓▓    ▓▓  ▓▓    ▓▓     │
│   │  ▓▓    ▓▓    ▓▓    ▓▓  ▓▓    ▓▓     │
│ 15│  ▓▓    ▓▓    ▓▓    ▓▓  ▓▓    ▓▓     │
│   │  ▓▓    ▓▓    ▓▓    ▓▓  ▓▓    ▓▓     │
│ 10│  ▓▓    ▓▓    ▓▓    ▓▓  ▓▓    ▓▓     │
│   │  ▓▓    ▓▓    ▓▓    ▓▓  ▓▓    ▓▓     │
│  5│  ▓▓    ▓▓    ▓▓    ▓▓  ▓▓    ▓▓     │
│   │  ▓▓    ▓▓    ▓▓    ▓▓  ▓▓    ▓▓     │
│  0└──────────────────────────────────    │
│    S19  S20  S21  S22  S23  S24        │
│                                          │
│ Average Velocity: 26.8 points            │
│ Trend: Increasing ↗                     │
│                                          │
└──────────────────────────────────────────┘
```

## 12. AI-Powered Features

### AI Board Assistant Panel
```
┌────────────────────────────────────────┐
│ AI Board Assistant 🤖           [✕]   │
├────────────────────────────────────────┤
│                                        │
│ 💬 Ask AI                              │
│ [How can I help organize your board?]  │
│ [Send]                                 │
│                                        │
│ Quick Actions:                         │
│ ┌──────────────────────────────────┐  │
│ │ 🎯 Auto-organize board            │  │
│ │ 📊 Analyze sprint health          │  │
│ │ ⚡ Suggest task assignments       │  │
│ │ 🔄 Balance workload               │  │
│ │ 📈 Predict sprint completion      │  │
│ │ 🏷️ Auto-tag and categorize       │  │
│ │ 💎 Estimate story points          │  │
│ └──────────────────────────────────┘  │
│                                        │
│ 💡 Smart Suggestions                   │
│ ────────────────────────────────       │
│ • TASK-456 is similar to TASK-123     │
│   which took 3 days. Estimate: 5 pts  │
│   [Apply] [Dismiss]                   │
│                                        │
│ • Sarah Johnson is overloaded (8      │
│   tasks). Reassign TASK-457 to Alex?  │
│   [Auto-reassign] [Ignore]            │
│                                        │
│ • 5 tasks in "In Progress" for >5     │
│   days. Move to "Blocked"?            │
│   [Review Tasks] [Dismiss]            │
│                                        │
│ • Sprint 24 trending 15% behind.      │
│   Reduce scope or extend deadline?    │
│   [Suggest Tasks] [Extend]            │
│                                        │
│ 📊 AI Insights                         │
│ ────────────────────────────────       │
│ • 78% probability of sprint success   │
│ • Estimated completion: Jan 30        │
│ • Recommended action: Remove 2 tasks  │
│   or add 1 developer                  │
│                                        │
│ • Tasks with label "Backend" take     │
│   40% longer than estimated           │
│ • Mike Chen is best for "API" tasks   │
│   (92% completion rate)               │
│                                        │
│ 🎯 Optimization Available              │
│ ────────────────────────────────       │
│ [Auto-organize Board]                  │
│ • Group similar tasks together        │
│ • Balance columns                     │
│ • Prioritize by impact                │
│ • Estimated time saved: 2 hours       │
│                                        │
│ [Smart Sprint Planning]                │
│ • Optimal task selection for Sprint   │
│ • Based on team velocity & capacity   │
│ • Accounts for dependencies           │
│ • Success probability: 85%            │
│                                        │
│ 🔮 Predictions                         │
│ ────────────────────────────────       │
│ • Sprint completion: Jan 30 (±2 days) │
│ • Velocity forecast: 28 points        │
│ • Risk of delay: Low (15%)            │
│ • Blocker probability: 2 tasks        │
│                                        │
└────────────────────────────────────────┘
```

### AI Task Estimation
```
┌────────────────────────────────────────┐
│ AI Story Point Estimation              │
├────────────────────────────────────────┤
│                                        │
│ Analyzing task: TASK-456               │
│ "Fix critical login bug"               │
│                                        │
│ Similar tasks in history:              │
│ • TASK-123 - Auth fix: 5 pts (3 days) │
│ • TASK-234 - Login issue: 3 pts (2d)  │
│ • TASK-345 - Security bug: 8 pts (5d) │
│                                        │
│ AI Recommendation: 5 story points      │
│ Confidence: 87%                        │
│                                        │
│ Reasoning:                             │
│ • Complexity: Medium-High              │
│ • Similar to TASK-123                 │
│ • Involves security review            │
│ • Typical resolution: 2-3 days        │
│                                        │
│ Suggested assignee: Sarah Johnson      │
│ (95% match based on skills)            │
│                                        │
│ [Apply Estimate] [Manual Entry] [✕]   │
│                                        │
└────────────────────────────────────────┘
```

## 13. Context Menu (Right-Click)

### Card Context Menu
```
┌──────────────────────────────┐
│ 👁️ Quick View                │
│ ✏️ Edit Details              │
│ 📋 Clone Task                │
│ ──────────────────────       │
│ 👤 Assign to...              │
│   → Sarah Johnson            │
│   → Mike Chen                │
│   → Alex Kim                 │
│   → Unassigned               │
│ ──────────────────────       │
│ 📊 Change Status             │
│   → To Do                    │
│   → In Progress              │
│   → In Review                │
│   → Done                     │
│ ──────────────────────       │
│ 🎯 Set Priority              │
│   → Urgent                   │
│   → High                     │
│   → Medium                   │
│   → Low                      │
│ ──────────────────────       │
│ 🏷️ Add Label                 │
│ 💎 Estimate Points           │
│ 📅 Set Due Date             │
│ 🔗 Add Dependency           │
│ ➕ Add Subtask               │
│ ──────────────────────       │
│ 📤 Export Task               │
│ 🔗 Copy Link                │
│ 📌 Pin to Top               │
│ ──────────────────────       │
│ 📦 Archive                   │
│ 🗑️ Delete                    │
└──────────────────────────────┘
```

### Column Context Menu
```
┌──────────────────────────────┐
│ ✏️ Edit Column Name          │
│ 🎨 Change Color              │
│ 📊 Set WIP Limit             │
│ ──────────────────────       │
│ ↑ Move Column Left           │
│ ↓ Move Column Right          │
│ ──────────────────────       │
│ ➕ Add Column Before          │
│ ➕ Add Column After           │
│ ──────────────────────       │
│ 🔄 Sort Tasks                │
│   → By Priority              │
│   → By Due Date              │
│   → By Assignee              │
│   → By Points                │
│ ──────────────────────       │
│ ☑️ Mark as "Done" Column     │
│ 🤖 Auto-transition Rules     │
│ ──────────────────────       │
│ 📤 Export Column             │
│ 🗑️ Clear Column              │
│ ❌ Delete Column             │
└──────────────────────────────┘
```

## 14. Keyboard Shortcuts

### Navigation
- `←/→` - Navigate between columns
- `↑/↓` - Navigate between cards
- `Tab` - Next card
- `Shift+Tab` - Previous card
- `Esc` - Deselect/Close modal
- `/` - Focus search

### Selection
- `Click` - Select card
- `Cmd/Ctrl+Click` - Multi-select
- `Shift+Click` - Range select
- `Cmd/Ctrl+A` - Select all in column
- `Esc` - Deselect all

### Actions
- `N` or `C` - Create new task
- `E` - Edit selected task
- `Enter` - Open task details
- `Delete` - Delete selected task
- `Cmd/Ctrl+D` - Duplicate task
- `Space` - Quick view

### Task Manipulation
- `1-9` - Move to column (1=first column, 2=second, etc.)
- `P` - Change priority
- `A` - Assign to me
- `Shift+A` - Assign to someone
- `L` - Add label
- `D` - Set due date
- `S` - Set story points

### Filters & Views
- `F` - Open filters
- `G` - Toggle grouping/swim lanes
- `V` - Switch view mode
- `Cmd/Ctrl+F` - Search tasks
- `R` - Refresh board

### Bulk Actions
- `Cmd/Ctrl+Shift+M` - Move selected tasks
- `Cmd/Ctrl+Shift+A` - Assign selected tasks
- `Cmd/Ctrl+Shift+L` - Label selected tasks
- `Cmd/Ctrl+Shift+D` - Delete selected tasks

### Other
- `?` - Show keyboard shortcuts help
- `Cmd/Ctrl+Z` - Undo
- `Cmd/Ctrl+Shift+Z` - Redo

## 15. Drag & Drop Interactions

### Card Dragging
1. **Visual Feedback**:
   - Card becomes semi-transparent (50% opacity)
   - Ghost element follows cursor
   - Original position shows placeholder
   - Drop zones highlight with blue border
   - Invalid zones show red overlay
   - Snap to grid within columns

2. **Drop Zones**:
   - Between cards (insert position)
   - Into columns (append to bottom)
   - Into swim lanes (specific group)
   - Scroll columns when dragging near edges

3. **Status Update**:
   - Auto-update status when moving columns
   - Show confirmation for important changes
   - Trigger automations on drop
   - Update assignee if column-specific

4. **Multi-Card Drag**:
   - Select multiple cards
   - Drag group together
   - Maintain relative order
   - Apply same status change to all

### Column Reordering
- Drag column header to reorder
- Visual gap shows drop position
- Smooth transition animation
- Save order preference

### Priority Reordering (Backlog)
- Drag cards up/down to change priority
- Visual ranking indicator
- Auto-save new order
- Affects sprint planning

## 16. Loading States & Animations

### Initial Load
- Skeleton cards (shimmer effect)
- Progressive loading (visible cards first)
- Column headers load first
- Smooth fade-in animation

### Card Actions
- Drag: Smooth ghost element
- Drop: Snap into place with ease-out
- Status change: Color transition (300ms)
- Delete: Fade out + collapse (400ms)
- Create: Fade in + expand (300ms)

### Column Actions
- Add column: Slide in from right
- Remove column: Slide out + collapse
- Reorder: Smooth position transition
- Collapse: Height animation (200ms)

### Interactions
- Hover: Subtle lift (2px) + shadow
- Click: Ripple effect
- Select: Border highlight + glow
- Success: Checkmark animation
- Error: Shake animation

## 17. Responsive Design

### Desktop (>1024px)
- Full multi-column board
- All features visible
- Side panels slide out
- Drag and drop enabled
- Keyboard shortcuts active

### Tablet (768px - 1024px)
- Scrollable columns
- Collapsible columns
- Touch-friendly cards
- Simplified quick actions
- Drawer-based filters

### Mobile (<768px)
- Single column view
- Swipe between columns
- Bottom sheet for details
- Simplified card design
- Floating action button
- Hamburger menu

### Mobile Board View
```
┌─────────────────────────┐
│ Sprint 24    [≡] [+]   │
├─────────────────────────┤
│ ◀ In Progress (8) ▶    │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ ▌TASK-456           │ │
│ │ Fix login bug       │ │
│ │                     │ │
│ │ 👤 Sarah  🎯 High   │ │
│ │ 💎 5 pts  📅 Jan 20 │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ ▌TASK-457           │ │
│ │ User dashboard      │ │
│ │                     │ │
│ │ 👤 Mike   🎯 Medium │ │
│ │ 💎 8 pts  📅 Jan 22 │ │
│ └─────────────────────┘ │
│                         │
│ ... (more cards)        │
│                         │
│ [+ Add Task]            │
│                         │
└─────────────────────────┘
         [○]  ← FAB
```

### Mobile Gestures
- Swipe left/right: Switch columns
- Swipe down: Refresh board
- Long press: Context menu
- Tap: Select card
- Double tap: Open details
- Pinch: Zoom (if applicable)

## 18. Accessibility (A11Y)

### Keyboard Navigation
- Full keyboard support (see shortcuts)
- Focus visible on all elements (2px blue outline)
- Logical tab order
- Arrow key navigation
- Skip links for main content

### Screen Readers
- ARIA labels on all controls
- ARIA-live regions for updates
- Semantic HTML structure
- Card status announcements
- Drag and drop announcements
- Column count announcements

### Visual Accessibility
- High contrast mode
- Minimum 4.5:1 contrast ratios
- No color-only information
- Pattern/icon + color for status
- Scalable text
- Focus indicators on all interactive elements

### Alternative Inputs
- Voice control compatible
- Switch control support
- Keyboard-only operation
- Mouse-free navigation

### Reduced Motion
- Respect prefers-reduced-motion
- Disable animations if requested
- Instant transitions as fallback
- Maintain visual feedback

## 19. Performance Optimization

### Rendering
- Virtual scrolling for long columns (>50 cards)
- Lazy load card details
- Render only visible columns
- Memoize card components
- Debounce search (300ms)
- Throttle drag events (16ms/60fps)

### Data Management
- Cache board state locally
- Optimistic UI updates
- Batch API requests
- WebSocket for real-time updates
- Incremental sync
- Pagination for large backlogs

### Bundle Size
- Code split by view
- Lazy load modal components
- Lazy load analytics/reports
- Tree-shake unused code
- Optimize images
- Compress assets

### Memory Management
- Clean up event listeners
- Release drag handlers
- Clear unused cache
- Limit history stack
- Garbage collection friendly

## 20. Data Structure Examples

### Task Object
```typescript
interface Task {
  id: string;
  taskId: string; // e.g., "TASK-456"
  title: string;
  description?: string;
  type: 'bug' | 'feature' | 'improvement' | 'task' | 'story' | 'epic';
  status: string; // Column ID
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none';
  
  // Estimation
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  
  // Assignment
  assignee?: string; // User ID
  assignees?: string[]; // Multiple assignees
  reporter: string; // User ID
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  
  // Organization
  labels: string[];
  tags: string[];
  epicId?: string;
  sprintId?: string;
  boardId: string;
  columnId: string;
  position: number; // Order in column
  
  // Hierarchy
  parentId?: string; // Parent task
  subtasks: string[]; // Child task IDs
  subtasksCompleted: number;
  subtasksTotal: number;
  
  // Dependencies
  blockedBy: string[]; // Task IDs
  blocking: string[]; // Task IDs
  relatedTasks: string[];
  
  // Engagement
  watchers: string[]; // User IDs
  attachments: Attachment[];
  comments: Comment[];
  commentCount: number;
  
  // Metadata
  customFields: Record<string, any>;
  isPinned: boolean;
  isArchived: boolean;
  
  // AI
  aiGenerated: boolean;
  aiScore?: number; // Relevance/priority score
  aiSuggestions?: AISuggestion[];
  
  // Audit
  createdBy: string;
  updatedBy: string;
  history: HistoryEntry[];
}

interface Column {
  id: string;
  name: string;
  position: number;
  color?: string;
  wipLimit?: number;
  isDone: boolean; // Marks as completed column
  boardId: string;
  automationRules: AutomationRule[];
}

interface Board {
  id: string;
  name: string;
  description?: string;
  type: 'kanban' | 'scrum';
  columns: Column[];
  owner: string;
  team: string[];
  spaceId: string;
  
  // Settings
  settings: BoardSettings;
  
  // Sprint (for Scrum boards)
  activeSprint?: string;
  sprints: Sprint[];
  
  // Stats
  taskCount: number;
  completedCount: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  duration: number; // weeks
  capacity: number; // story points
  boardId: string;
  
  // Tasks
  tasks: string[]; // Task IDs
  plannedPoints: number;
  completedPoints: number;
  
  // Status
  status: 'planning' | 'active' | 'completed';
  
  // Stats
  velocity?: number;
  completionRate?: number;
}

interface BoardSettings {
  cardSize: 'compact' | 'standard' | 'detailed';
  showCardIds: boolean;
  showAvatars: boolean;
  showDueDates: boolean;
  showStoryPoints: boolean;
  cardColorBy: 'priority' | 'type' | 'label' | 'none';
  enableSwimLanes: boolean;
  defaultGrouping: 'none' | 'assignee' | 'priority' | 'epic';
  enforceWipLimits: boolean;
  pointScale: 'fibonacci' | 'tshirt' | 'linear';
  automations: AutomationRule[];
}

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    event: string; // e.g., "status_changed"
    conditions: Condition[];
  };
  actions: Action[];
  boardId: string;
}
```

## 21. Testing Requirements

### Unit Tests
- Card component rendering
- Column component
- Drag and drop logic
- Filter logic
- Sprint calculations
- Story point estimations
- Automation rule execution

### Integration Tests
- Board CRUD operations
- Task movement between columns
- Sprint planning workflow
- Backlog prioritization
- Filter and search
- Automation triggers

### E2E Tests
- Complete task creation flow
- Drag card between columns
- Start and complete sprint
- Multi-select and bulk actions
- Filter combinations
- Mobile responsive behavior

### Performance Tests
- Load board with 500+ cards
- Drag performance
- Search performance
- Real-time updates
- Memory usage over time

## 22. Implementation Priority

### Phase 1 (MVP)
1. Basic board with 3-5 columns
2. Card display (compact view)
3. Create/edit/delete tasks
4. Drag and drop between columns
5. Basic task detail modal
6. Column management
7. Simple filters

### Phase 2 (Core Features)
1. Backlog view
2. Sprint planning
3. Story points
4. Priority ordering
5. Advanced filters
6. Quick create/edit
7. Card customization
8. WIP limits

### Phase 3 (Advanced)
1. Swim lanes
2. Automation rules
3. Reports and analytics
4. Burndown charts
5. Velocity tracking
6. AI features
7. Dependencies
8. Time tracking

### Phase 4 (Polish)
1. Animations and transitions
2. Keyboard shortcuts
3. Mobile optimization
4. Real-time collaboration
5. Advanced analytics
6. Integration features
7. Custom fields

## 23. Notes for Implementation

- Use React hooks for state management
- Use react-beautiful-dnd or dnd-kit for drag and drop
- Use Recharts for analytics visualizations
- Use Lucide React for all icons
- Follow the dark theme color palette strictly
- Implement virtual scrolling for columns with >50 cards
- Use CSS Grid for board layout
- Use Flexbox for card layout
- Debounce search and filter inputs (300ms)
- Throttle drag events (60fps)
- Implement optimistic UI updates
- Use WebSocket for real-time collaboration
- Cache board state in localStorage
- Add ARIA labels for accessibility
- Test keyboard navigation thoroughly
- Ensure 60fps animations
- Follow existing YUMA design patterns
- Make components reusable
- Use TypeScript for type safety
- Write tests for critical flows
- Document complex algorithms

---

This specification provides comprehensive guidance for implementing a production-ready Board & Backlog system that supports both Kanban and Scrum workflows, integrates seamlessly with the YUMA task management platform, and includes AI-powered features for intelligent task organization and sprint planning.
