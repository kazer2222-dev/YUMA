# YUMA Roadmap Feature - Complete Implementation Specification

## Overview
Implement a comprehensive roadmap component for the YUMA task management platform that provides strategic timeline visualization, project planning, milestone tracking, and dependency management. The roadmap should follow the established dark theme design system inspired by ClickUp with modern UI patterns and support AI-powered project planning features.

## Design System Requirements

### Color Scheme (Dark Theme)
- **Background Colors**:
  - Main roadmap background: `#1a1a1a`
  - Timeline track background: `#242424`
  - Timeline bar background: `#2a2a2a`
  - Hover state: `#2f2f2f`
  - Selected item: `#3b3b3b`
  - Today indicator: `#3b82f6` (blue accent)
  
- **Border Colors**:
  - Grid lines: `#333333`
  - Timeline borders: `#404040`
  - Dependency lines: `#666666`
  - Critical path: `#ef4444` (red)
  
- **Text Colors**:
  - Primary text: `#e5e5e5`
  - Secondary text: `#a3a3a3`
  - Disabled text: `#666666`
  - Timeline bar text: `#ffffff`

- **Status Colors**:
  - Not Started: `#64748b` (slate)
  - In Progress: `#3b82f6` (blue)
  - Completed: `#22c55e` (green)
  - At Risk: `#f59e0b` (amber)
  - Blocked: `#ef4444` (red)
  - On Hold: `#8b5cf6` (purple)

- **Priority Colors**:
  - Critical: `#dc2626` (red)
  - High: `#f97316` (orange)
  - Medium: `#eab308` (yellow)
  - Low: `#22c55e` (green)

- **Progress Colors**:
  - 0-25%: `#ef4444` (red)
  - 26-50%: `#f59e0b` (amber)
  - 51-75%: `#eab308` (yellow)
  - 76-100%: `#22c55e` (green)

### Typography
- **Headers**: Use default heading styles from globals.css
- **Timeline Labels**: Clear, readable labels for dates
- **Task Names**: Truncate with ellipsis on overflow
- **Progress Text**: Tabular numbers for alignment

## Core Roadmap Structure

### Main Roadmap Container
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Roadmap Header (View Controls + Filters + Actions + AI)                 │
├──────────────┬──────────────────────────────────────────────────────────┤
│              │                                                            │
│   Project    │              Timeline View Area                          │
│   Sidebar    │         (Horizontal Gantt-style Timeline)                │
│   (Groups)   │                                                            │
│              │                                                            │
├──────────────┴──────────────────────────────────────────────────────────┤
│                    Legend + Summary Statistics                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## 1. Roadmap Header Component

### Layout (Left to Right)
```
[Roadmap ▼] | [Today] [◄] [Q1 2024] [►] | [Quarters▼] [Months▼] [Weeks▼] [Days▼] | [Group By: Project▼] [🔍 Filter] [⚙️ Settings] [📊 Analytics] [➕ Add Item] [🤖 AI Planning]
```

### Elements
1. **Roadmap Selector**:
   - Dropdown to switch between different roadmaps
   - Options: "Company Roadmap", "Product Roadmap", "Engineering Roadmap", "Marketing Roadmap"
   - "+ Create New Roadmap" option

2. **Navigation Controls**:
   - "Today" button - jumps to current date
   - Previous period arrow
   - Current period label (clickable date range picker)
   - Next period arrow

3. **View Switcher** (Button Group):
   - Quarters View (high-level, 12-18 months)
   - Months View (mid-level, 6-12 months)
   - Weeks View (detailed, 3-6 months)
   - Days View (granular, 1-3 months)

4. **Grouping Options**:
   - Group By: None, Project, Team, Owner, Priority, Status, Custom Field
   - Collapsible groups
   - Group color coding

5. **Action Buttons**:
   - Filter button (opens filter panel)
   - Settings button (roadmap preferences)
   - Analytics button (roadmap metrics)
   - Add Item button (create task/milestone/project)
   - AI Planning button (AI-powered features)

6. **Active Filters Bar** (Below header when active):
   - Display active filters as removable chips
   - "Clear All Filters" button

## 2. Project Sidebar (Left Panel)

### Structure
```
┌─────────────────────────┐
│ [All Projects ▼]       │
├─────────────────────────┤
│ ▼ 🎨 Design System      │
│   ├─ Component Library  │
│   ├─ Design Tokens      │
│   └─ Documentation      │
│                         │
│ ▼ 🚀 Mobile App         │
│   ├─ iOS Development    │
│   ├─ Android Dev        │
│   └─ QA Testing         │
│                         │
│ ▼ 🌐 Website Redesign   │
│   ├─ UX Research        │
│   ├─ Visual Design      │
│   ├─ Frontend Dev       │
│   └─ Content Migration  │
│                         │
│ ▲ 📱 Marketing Campaign │
│                         │
│ [+ Add Project]         │
└─────────────────────────┘
```

### Features
1. **Hierarchical Structure**:
   - Projects (top-level, collapsible)
   - Sub-projects or Epics
   - Individual tasks (optional, can toggle)
   - Milestones shown with special icon

2. **Project Row Components**:
   - Expand/collapse arrow
   - Project icon/emoji
   - Project name (editable on click)
   - Progress indicator (percentage)
   - Status badge
   - Team avatar(s)
   - Quick actions menu (•••)

3. **Interactions**:
   - Click name to edit
   - Drag to reorder projects
   - Right-click for context menu
   - Hover shows additional info
   - Click progress for details

4. **Quick Actions Menu**:
   - Edit project details
   - Add sub-task
   - Add milestone
   - Duplicate project
   - Archive/Delete
   - Change color
   - View in Board/List

## 3. Timeline View Area (Main Canvas)

### Grid Structure
```
        Jan 2024          Feb 2024          Mar 2024
     W1 W2 W3 W4       W1 W2 W3 W4       W1 W2 W3 W4
┌────────────────────────────────────────────────────────┐
│ Design System                                          │
│ ├─ [════════════════]                                 │ ← Timeline bar
│ ├─ [══════════]                                       │
│ └─ [═════════════]                                    │
│                                                        │
│ Mobile App                                             │
│ ├─ [═══════════════════════]                         │
│ ├─    [════════════════════]                         │
│ └─         [════════════]                            │
│    ◆                                                  │ ← Milestone
│                                                        │
│ Website Redesign                                       │
│ ├─ [════]                                             │
│ ├─     [════════════]                                 │
│ ├─           [══════════════]                         │
│ └─                  [═════════]                       │
│    ↓─────────┐                                        │ ← Dependency
│              ↓                                         │
└────────────────────────────────────────────────────────┘
     │
     └─ Today indicator (vertical line)
```

### Timeline Components

1. **Time Scale Header**:
   - Top row: Major periods (Months/Quarters)
   - Bottom row: Minor periods (Weeks/Days)
   - Weekend highlighting (lighter shade)
   - Current period highlight
   - Fiscal calendar support (optional)

2. **Today Indicator**:
   - Vertical line spanning full height
   - Bright blue color (#3b82f6)
   - "Today" label at top
   - Always visible when in view
   - Auto-scroll to today on load

3. **Timeline Bars**:
   - Horizontal bars representing tasks/projects
   - Color-coded by status, priority, or project
   - Progress fill indicator (darker shade)
   - Rounded corners
   - Drop shadow on hover
   - Height: 24-32px depending on zoom level

4. **Timeline Bar Contents**:
   ```
   ┌─────────────────────────────────────┐
   │ ▌ Task Name  [●●●○○] 60%  👤      │
   └─────────────────────────────────────┘
    │    │         │       │     │
    │    │         │       │     └─ Assignee avatar
    │    │         │       └─ Progress percentage
    │    │         └─ Progress dots
    │    └─ Task name (truncated)
    └─ Status color bar (left edge)
   ```

5. **Milestones**:
   - Diamond shape (◆)
   - Positioned at specific date
   - Color-coded by status
   - Label above or below diamond
   - Hover shows details
   - Size: 16-24px

6. **Dependencies**:
   - Arrows connecting related items
   - Line style: Solid (hard dependency), Dashed (soft dependency)
   - Color: Gray (#666666), Red for critical path
   - Hover highlights entire dependency chain
   - Click to edit dependency

7. **Grid Lines**:
   - Vertical lines for time divisions
   - Subtle color (#333333)
   - Major divisions: Solid lines
   - Minor divisions: Dotted lines
   - Weekends: Slightly different background

## 4. Timeline Bar Interactions

### Hover State
- Entire bar highlights
- Shadow elevation increases
- Resize handles appear on edges
- Quick action buttons appear
- Tooltip with full details

### Click Interactions
- Single click: Select bar (highlight)
- Double click: Open detail modal
- Right click: Context menu
- Click assignee: Filter by assignee
- Click progress: Open progress editor

### Drag & Drop
1. **Move Timeline Bar**:
   - Drag entire bar to reschedule
   - Visual ghost element follows cursor
   - Valid drop zones highlight
   - Snap to time increments (days/weeks)
   - Show new dates in tooltip
   - Update dependencies automatically

2. **Resize Timeline Bar**:
   - Drag left edge: Change start date
   - Drag right edge: Change end date
   - Cursor changes to resize icon (⇄)
   - Snap to grid increments
   - Show duration in tooltip
   - Minimum duration: 1 day

3. **Multi-Select Drag**:
   - Cmd/Ctrl+Click to select multiple
   - Drag group together
   - Maintain relative timing
   - Shift selection by same amount

### Progress Editing
- Click progress indicator
- Inline slider appears (0-100%)
- Real-time progress bar update
- Auto-save on change
- Calculate from subtasks if applicable

## 5. Timeline Zoom Levels

### Quarters View
- Display: 12-18 months
- Time divisions: Quarters → Months
- Bar granularity: Weekly snapping
- Detail level: Project and milestone names only
- Best for: Strategic planning, executive view

### Months View
- Display: 6-12 months
- Time divisions: Months → Weeks
- Bar granularity: Daily snapping
- Detail level: Project, epic, and key tasks
- Best for: Release planning, sprint planning

### Weeks View
- Display: 3-6 months
- Time divisions: Months → Weeks → Days
- Bar granularity: Daily snapping
- Detail level: All tasks and subtasks
- Best for: Sprint execution, daily standups

### Days View
- Display: 1-3 months
- Time divisions: Weeks → Days
- Bar granularity: Hourly snapping (optional)
- Detail level: Task details, time estimates
- Best for: Resource planning, capacity planning

### Zoom Controls
- Zoom in: `Cmd/Ctrl + +` or mouse wheel up
- Zoom out: `Cmd/Ctrl + -` or mouse wheel down
- Zoom to fit: `Cmd/Ctrl + 0` (fit all items)
- Smooth zoom transitions (300ms ease)

## 6. Milestone Creation & Management

### Milestone Visual Design
```
        ◆ Launch Date
        │
        └─ Jan 31, 2024
```

### Creating Milestones
1. **From Timeline**:
   - Right-click date on timeline
   - Select "Add Milestone"
   - Or drag from sidebar

2. **From Add Button**:
   - Click "+ Add Item" button
   - Select "Milestone" type
   - Fill in details

### Milestone Details Modal
```
┌────────────────────────────────────────┐
│  Milestone Details              [✕]   │
├────────────────────────────────────────┤
│                                        │
│  Milestone Name *                      │
│  [V1.0 Product Launch_____________]   │
│                                        │
│  📅 Date *                             │
│  [January 31, 2024] [Select]          │
│                                        │
│  📝 Description                        │
│  [Major product release with...___]   │
│  [_________________________________]   │
│                                        │
│  🎨 Project/Epic                       │
│  [Product Development] ▼               │
│                                        │
│  🎯 Type                               │
│  (•) Deadline  ( ) Deliverable         │
│  ( ) Checkpoint  ( ) Release           │
│                                        │
│  👥 Owner                              │
│  [Select owner...] ▼                  │
│  [Avatar] Sarah Johnson               │
│                                        │
│  🎨 Color                              │
│  [●] [●] [●] [●] [●] [●]              │
│                                        │
│  🔗 Dependencies                       │
│  Blocks:                              │
│  • Product Testing (TASK-456)         │
│  • Marketing Launch (TASK-789)        │
│  [+ Add dependency]                    │
│                                        │
│  ✅ Completion Criteria                │
│  ☑ All P0 bugs resolved               │
│  ☑ Documentation complete              │
│  ☐ Performance benchmarks met         │
│  [+ Add criterion]                    │
│                                        │
│  🔔 Notifications                      │
│  ☑ Notify team 1 week before          │
│  ☑ Notify stakeholders 1 day before   │
│                                        │
├────────────────────────────────────────┤
│              [Delete]  [Cancel] [Save] │
└────────────────────────────────────────┘
```

### Milestone Status Indicators
- 🟢 Achieved (green)
- 🔵 On Track (blue)
- 🟡 At Risk (yellow)
- 🔴 Missed (red)
- ⚪ Not Started (gray)

## 7. Dependency Management

### Dependency Types
1. **Finish-to-Start (FS)**: Task B starts when Task A finishes
2. **Start-to-Start (SS)**: Task B starts when Task A starts
3. **Finish-to-Finish (FF)**: Task B finishes when Task A finishes
4. **Start-to-Finish (SF)**: Task B finishes when Task A starts (rare)

### Creating Dependencies
1. **Drag Method**:
   - Hover over timeline bar
   - Click and drag from dependency handle (small circle on edge)
   - Drag to target task
   - Release to create dependency
   - Arrow appears connecting tasks

2. **Modal Method**:
   - Open task details
   - Go to "Dependencies" section
   - Click "+ Add dependency"
   - Search/select task
   - Choose dependency type
   - Set lag time (optional)

### Visual Representation
```
Task A  [═══════════]
                    ↓
Task B              [═══════════]
        ↑
        └─ Dependency arrow
```

### Dependency States
- **Normal**: Gray arrow, dashed line
- **Critical Path**: Red arrow, solid line, thicker
- **Violated**: Red arrow with warning icon (end date conflict)
- **Optional**: Light gray, thin dashed line

### Dependency Panel (Side Panel)
```
┌────────────────────────────────────────┐
│  Dependencies               [✕]       │
├────────────────────────────────────────┤
│                                        │
│  🔍 [Search tasks...________]         │
│                                        │
│  Critical Path                         │
│  ┌──────────────────────────────────┐ │
│  │ UX Research                      │ │
│  │   ↓ 2 days lag                   │ │
│  │ Visual Design                    │ │
│  │   ↓                              │ │
│  │ Frontend Development             │ │
│  │   ↓                              │ │
│  │ Launch Milestone                 │ │
│  └──────────────────────────────────┘ │
│                                        │
│  All Dependencies (8)                  │
│  ┌──────────────────────────────────┐ │
│  │ FS  UX Research → Visual Design  │ │
│  │     No lag      [Edit] [Delete]  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ FS  Design → Frontend Dev        │ │
│  │     2 days lag  [Edit] [Delete]  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [+ Add Dependency]                    │
│                                        │
│  ⚠️ Conflicts (1)                      │
│  ┌──────────────────────────────────┐ │
│  │ Testing cannot start before      │ │
│  │ Development completes            │ │
│  │ [Resolve] [View]                 │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

### Auto-Scheduling
- When dependency date changes, cascade updates
- Warning modal if conflicts detected
- Option to: Auto-adjust, Keep dates, Review manually
- Show impact analysis (# tasks affected)

## 8. Task/Project Detail Modal

### Full Details View
```
┌──────────────────────────────────────────────────────────┐
│  Website Redesign Project                         [✕]   │
│  [Edit] [Duplicate] [Archive] [Delete]    [•••]        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Tabs: [Overview] [Timeline] [Tasks] [Team] [Files]    │
│                                                          │
│  ╔═══════════════ Overview Tab ═══════════════╗        │
│  ║                                              ║        │
│  ║  📊 Status: [In Progress ▼]                ║        │
│  ║  🎯 Priority: [High ▼]                      ║        │
│  ║  👤 Owner: [Avatar] Sarah Johnson [Change]  ║        │
│  ║  👥 Team: [Avatar][Avatar][Avatar] +3       ║        │
│  ║                                              ║        │
│  ║  📅 Timeline                                 ║        │
│  ║  Start Date:  Jan 1, 2024                   ║        │
│  ║  End Date:    Mar 31, 2024                  ║        │
│  ║  Duration:    90 days                       ║        │
│  ║  Elapsed:     45 days (50%)                 ║        │
│  ║                                              ║        │
│  ║  📈 Progress: 62%                            ║        │
│  ║  [██████████████████░░░░░░░░░░] 62%        ║        │
│  ║                                              ║        │
│  ║  Completed: 15/24 tasks                     ║        │
│  ║  Milestones: 2/4 reached                    ║        │
│  ║  At Risk Tasks: 2                           ║        │
│  ║  Blocked Tasks: 1                           ║        │
│  ║                                              ║        │
│  ║  📝 Description                              ║        │
│  ║  Complete overhaul of company website...    ║        │
│  ║                                              ║        │
│  ║  🎯 Goals                                    ║        │
│  ║  ✅ Improve page load time by 50%          ║        │
│  ║  ✅ Increase conversion by 25%             ║        │
│  ║  ⏳ Launch new design system                ║        │
│  ║  ⏳ Migrate 500+ pages                      ║        │
│  ║                                              ║        │
│  ║  🔗 Related Items                            ║        │
│  ║  • Design System Project                    ║        │
│  ║  • Q1 Marketing Campaign                    ║        │
│  ║                                              ║        │
│  ║  🏷️ Tags                                     ║        │
│  ║  [Website] [Q1] [High-Priority]            ║        │
│  ║                                              ║        │
│  ║  💬 Comments & Updates                       ║        │
│  ║  ┌──────────────────────────────────────┐  ║        │
│  ║  │ Sarah • 2 hours ago                  │  ║        │
│  ║  │ Design mockups approved by...        │  ║        │
│  ║  └──────────────────────────────────────┘  ║        │
│  ║  [Add comment..._______________] [Post]     ║        │
│  ║                                              ║        │
│  ╚══════════════════════════════════════════════╝        │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Created by John Doe on Dec 1, 2023                     │
│  Last updated by Sarah Johnson on Jan 15, 2024          │
└──────────────────────────────────────────────────────────┘
```

### Timeline Tab
- Embedded mini-roadmap showing just this project
- Gantt view of all sub-tasks
- Milestone indicators
- Dependency visualization
- Progress tracking

### Tasks Tab
- List or board view of all tasks
- Filter by status, assignee, priority
- Bulk actions (move, update status)
- Add new tasks inline
- Task completion checkboxes

### Team Tab
- All team members with roles
- Workload distribution chart
- Capacity planning
- Add/remove team members
- Permission management

### Files Tab
- All attachments and documents
- File preview
- Version history
- Upload new files
- Integration with cloud storage

## 9. Grouping & Filtering

### Group By Options
```
┌────────────────────────────────────────┐
│  Group By                              │
├────────────────────────────────────────┤
│  ( ) None (flat list)                  │
│  (•) Project                           │
│  ( ) Team                              │
│  ( ) Owner                             │
│  ( ) Status                            │
│  ( ) Priority                          │
│  ( ) Custom Field                      │
│                                        │
│  ☑ Show empty groups                  │
│  ☑ Collapse groups by default         │
│                                        │
│            [Apply]                     │
└────────────────────────────────────────┘
```

### Group Display
```
▼ In Progress (8 items) ━━━━━━━━━━━ 65% complete
  ├─ Website Redesign
  ├─ Mobile App
  └─ API Development

▼ Completed (5 items) ━━━━━━━━━━━ 100% complete
  ├─ Design System
  └─ Documentation

▲ Not Started (3 items)
```

### Filter Panel (Slide-out)
```
┌────────────────────────────────────────┐
│  Filters                        [✕]   │
├────────────────────────────────────────┤
│                                        │
│  🔍 Quick Search                       │
│  [Search items...____________]         │
│                                        │
│  📅 Date Range                         │
│  From: [Jan 1, 2024]                  │
│  To:   [Dec 31, 2024]                 │
│  Presets: [This Quarter] [This Year]  │
│                                        │
│  📊 Status                             │
│  ☑ Not Started                        │
│  ☑ In Progress                        │
│  ☑ Completed                          │
│  ☐ Blocked                            │
│  ☐ On Hold                            │
│                                        │
│  🎯 Priority                           │
│  ☑ All priorities                     │
│  ☐ Critical only                      │
│  ☐ High and above                     │
│  ☐ Medium and below                   │
│                                        │
│  👥 Team/Owner                         │
│  ☑ All teams                          │
│  ☐ Design Team                        │
│  ☐ Engineering Team                   │
│  ☐ Marketing Team                     │
│  [Select specific people...] ▼        │
│                                        │
│  🏷️ Tags                               │
│  [+ Add tag filter]                    │
│  Selected: [Q1] [Website]             │
│                                        │
│  📈 Progress                           │
│  ○ All                                │
│  ○ Behind schedule                    │
│  ○ On track                           │
│  ○ Ahead of schedule                  │
│                                        │
│  ⚠️ Health Status                      │
│  ☐ Show only at-risk items            │
│  ☐ Show only blocked items            │
│  ☐ Show items with dependencies       │
│                                        │
│  🎨 Item Type                          │
│  ☑ Projects                           │
│  ☑ Tasks                              │
│  ☑ Milestones                         │
│  ☐ Epics                              │
│                                        │
│  💾 Saved Filters                      │
│  ┌──────────────────────────────────┐ │
│  │ My Active Projects               │ │
│  │ At-Risk Items This Quarter       │ │
│  │ Engineering Tasks                │ │
│  └──────────────────────────────────┘ │
│  [+ Save current filters]             │
│                                        │
│  ──────────────────────────────────    │
│  [Clear All]           [Apply Filters] │
│                                        │
└────────────────────────────────────────┘
```

## 10. Progress Tracking & Health Indicators

### Progress Calculation Methods
1. **Manual**: User sets percentage directly
2. **Task-based**: Auto-calculate from completed subtasks
3. **Time-based**: Progress = (time elapsed / total duration)
4. **Milestone-based**: Progress = (milestones reached / total milestones)
5. **Custom formula**: User-defined calculation

### Health Indicators
```
🟢 On Track
   - Progress ≥ expected progress
   - No blockers
   - All dependencies met

🟡 At Risk
   - Progress < expected by 10-25%
   - 1-2 blockers present
   - Minor dependency issues

🔴 Off Track
   - Progress < expected by >25%
   - 3+ blockers
   - Critical path affected
   - Deadline likely to be missed

🔵 Ahead of Schedule
   - Progress > expected by >10%
   - Early completion likely
```

### Progress Visualization
```
Website Redesign  [████████████░░░░░] 60%  🟡
├─ UX Research    [████████████████] 100% 🟢
├─ Design         [████████████░░░░] 75%  🟢
├─ Development    [████░░░░░░░░░░░░] 25%  🔴
└─ Testing        [░░░░░░░░░░░░░░░░] 0%   ⚪

Expected progress: 70% (10% behind)
```

### Burndown/Burnup Charts
- Ideal progress line (straight diagonal)
- Actual progress line
- Projected completion date
- Scope changes indicated
- Toggle between burndown/burnup

## 11. Resource Management & Capacity Planning

### Resource Allocation View
```
┌────────────────────────────────────────────────────────┐
│  Team Capacity                              Week 3     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Sarah Johnson (Designer)                   120% 🔴   │
│  [██████████████████████] 48h / 40h capacity         │
│  ├─ Website Design (24h)                              │
│  ├─ Mobile App UI (16h)                               │
│  └─ Design System (8h)                                │
│                                                        │
│  Mike Chen (Developer)                      75% 🟢    │
│  [███████████████░░░░░░] 30h / 40h capacity          │
│  ├─ API Development (20h)                             │
│  └─ Code Review (10h)                                 │
│                                                        │
│  Alex Kim (Developer)                       95% 🟡    │
│  [███████████████████░░] 38h / 40h capacity          │
│  ├─ Frontend Development (24h)                        │
│  ├─ Bug Fixes (10h)                                   │
│  └─ Testing (4h)                                      │
│                                                        │
│  Team Total: 90% capacity (116h / 120h)               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Workload Balancing
- Visual indicators for over/under allocation
- Drag tasks between team members
- Suggested reallocation by AI
- Capacity forecast (next 4 weeks)
- Time off and holidays considered

### Capacity Settings
- Working hours per week (default: 40h)
- Time off calendar
- Public holidays
- Team availability
- Part-time schedules

## 12. Critical Path Analysis

### Critical Path View
```
Enable: ☑ Show Critical Path

[Critical tasks highlighted in red]
[Non-critical tasks in normal colors]
[Slack time shown for non-critical tasks]

Critical Path:
UX Research (10d) → Design (15d) → Frontend Dev (20d) → Testing (5d) → Launch
Total Duration: 50 days
No slack time available
```

### Critical Path Features
- Automatic calculation
- Highlight critical tasks in red
- Show total project duration
- Display slack/float time for non-critical tasks
- Warning when critical path changes
- Impact analysis for date changes

### What-If Analysis
```
┌────────────────────────────────────────┐
│  What-If Scenario                      │
├────────────────────────────────────────┤
│                                        │
│  What if "Frontend Development"        │
│  takes 5 days longer?                  │
│                                        │
│  Impact:                               │
│  • Project delayed by 5 days           │
│  • Launch date: Mar 20 → Mar 25       │
│  • 3 dependent tasks delayed           │
│  • 2 milestones at risk                │
│                                        │
│  Mitigation options:                   │
│  1. Add developer resource             │
│  2. Reduce scope of task               │
│  3. Parallel testing with dev          │
│                                        │
│      [Cancel]  [Apply Changes]         │
└────────────────────────────────────────┘
```

## 13. Baselines & Version Comparison

### Baseline Management
```
┌────────────────────────────────────────┐
│  Baselines                             │
├────────────────────────────────────────┤
│                                        │
│  Current Plan                          │
│  [Compared to: Original Plan ▼]       │
│                                        │
│  Saved Baselines:                      │
│  ┌──────────────────────────────────┐ │
│  │ ● Original Plan (Dec 1, 2023)    │ │
│  │   [View] [Compare] [Restore]     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ ○ Q1 Checkpoint (Jan 15, 2024)   │ │
│  │   [View] [Compare] [Restore]     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [+ Save Current as Baseline]          │
│                                        │
│  Variance Analysis:                    │
│  • Schedule variance: +5 days          │
│  • Scope variance: +3 tasks            │
│  • Completion: 62% (planned: 70%)     │
│                                        │
└────────────────────────────────────────┘
```

### Comparison View
- Show current vs baseline side-by-side
- Highlight changed tasks (moved, extended, removed)
- Show new tasks added
- Variance metrics
- Export variance report

## 14. AI-Powered Features

### AI Planning Assistant Panel
```
┌────────────────────────────────────────┐
│  AI Roadmap Assistant 🤖        [✕]   │
├────────────────────────────────────────┤
│                                        │
│  💬 Ask AI a Question                  │
│  [Type your question...________]       │
│  [Send]                                │
│                                        │
│  Quick Actions:                        │
│  ┌──────────────────────────────────┐ │
│  │ 🎯 Optimize Timeline              │ │
│  │ 📊 Analyze Project Health         │ │
│  │ ⚡ Suggest Resource Allocation    │ │
│  │ 🔄 Auto-Schedule Tasks            │ │
│  │ 📈 Forecast Completion Date       │ │
│  │ ⚠️ Identify Risks                 │ │
│  └──────────────────────────────────┘ │
│                                        │
│  💡 Smart Recommendations              │
│  ────────────────────────────────      │
│  • Critical path shows 5-day delay    │
│    Recommendation: Add 1 developer    │
│    to Frontend team                   │
│    [Apply] [Dismiss]                  │
│                                        │
│  • Sarah Johnson at 120% capacity     │
│    this week                          │
│    Suggestion: Reassign "Mobile UI"   │
│    to Alex Kim (75% capacity)         │
│    [Auto-reassign] [Ignore]           │
│                                        │
│  • 3 tasks lack assignees             │
│    AI can suggest best team members   │
│    based on skills and availability   │
│    [Show Suggestions] [Dismiss]       │
│                                        │
│  📊 Project Insights                   │
│  ────────────────────────────────      │
│  • Project is 10% behind schedule     │
│  • 78% probability of late delivery   │
│  • Recommended action: Reduce scope   │
│    or extend deadline by 1 week       │
│                                        │
│  • Similar projects took 15% longer   │
│    than initially estimated           │
│  • Peak risk period: Weeks 8-10       │
│                                        │
│  🎯 AI Optimizations Available         │
│  ────────────────────────────────      │
│  [Optimize Timeline]                   │
│  - Reorder tasks for efficiency       │
│  - Reduce critical path by 3 days     │
│  - Balance team workload              │
│                                        │
│  [Smart Scheduling]                    │
│  - Auto-assign start dates            │
│  - Respect dependencies               │
│  - Consider team availability         │
│                                        │
└────────────────────────────────────────┘
```

### AI Capabilities

1. **Timeline Optimization**:
   - Analyze task sequences
   - Suggest parallel work opportunities
   - Optimize for earliest completion
   - Balance resources
   - Minimize idle time

2. **Risk Prediction**:
   - Identify potential delays
   - Predict probability of on-time delivery
   - Suggest mitigation strategies
   - Historical data analysis
   - Pattern recognition

3. **Resource Optimization**:
   - Suggest task assignments
   - Balance workload across team
   - Identify over/under-allocation
   - Skill-based matching
   - Availability consideration

4. **Smart Scheduling**:
   - Auto-schedule task start dates
   - Respect dependencies and constraints
   - Optimize for team efficiency
   - Consider holidays and time-off
   - Batch similar tasks

5. **Predictive Analytics**:
   - Forecast completion dates
   - Estimate task duration based on history
   - Predict budget requirements
   - Compare to similar projects
   - Success probability scoring

6. **Natural Language Processing**:
   - "When will the website redesign be complete?"
   - "Who should work on the API development?"
   - "What's blocking the mobile app project?"
   - "Optimize the Q1 roadmap for fastest delivery"
   - "Create a 6-month product roadmap"

### AI Learning
- Learn from actual vs estimated duration
- Improve predictions over time
- Team velocity tracking
- Pattern recognition in delays
- Continuous improvement suggestions

## 15. Roadmap Settings Panel

### Settings Categories
```
┌────────────────────────────────────────┐
│  Roadmap Settings               [✕]   │
├────────────────────────────────────────┤
│                                        │
│  🎨 Appearance                         │
│  ├─ Theme: Dark / Light / Auto        │
│  ├─ Color coding: [Status ▼]          │
│  │   (Status, Priority, Project,      │
│  │    Team, Custom)                   │
│  ├─ Show weekend columns: ☑           │
│  ├─ Show today indicator: ☑           │
│  └─ Compact mode: ☐                   │
│                                        │
│  📅 Timeline                           │
│  ├─ Default view: [Months ▼]          │
│  ├─ Fiscal year start: [January ▼]   │
│  ├─ Week starts on: [Monday ▼]        │
│  ├─ Date format: [MM/DD/YYYY ▼]       │
│  └─ Working days: M T W T F           │
│                                        │
│  📏 Granularity                        │
│  ├─ Snap to grid: ☑                   │
│  ├─ Grid size: [1 day ▼]              │
│  ├─ Min task duration: [1 day ▼]      │
│  └─ Show sub-tasks: ☑                 │
│                                        │
│  🔗 Dependencies                       │
│  ├─ Show dependency lines: ☑          │
│  ├─ Highlight critical path: ☑        │
│  ├─ Auto-update dates: ☑              │
│  ├─ Warn on conflicts: ☑              │
│  └─ Allow circular deps: ☐            │
│                                        │
│  📊 Progress                           │
│  ├─ Calculation method: [Task-based▼] │
│  ├─ Show progress bars: ☑             │
│  ├─ Show percentage: ☑                │
│  └─ Update frequency: [Real-time ▼]   │
│                                        │
│  👥 Team & Resources                   │
│  ├─ Show avatars on timeline: ☑       │
│  ├─ Show capacity warnings: ☑         │
│  ├─ Default capacity: [40h/week]      │
│  └─ Track time off: ☑                 │
│                                        │
│  🔔 Notifications                      │
│  ├─ Notify on milestone: ☑            │
│  ├─ Notify on delay: ☑                │
│  ├─ Notify on dependency change: ☑    │
│  ├─ Daily summary: ☐                  │
│  └─ Weekly report: ☑                  │
│                                        │
│  🤖 AI Features                        │
│  ├─ Enable AI assistant: ☑            │
│  ├─ Auto-optimize: ☐                  │
│  ├─ Smart suggestions: ☑              │
│  ├─ Risk prediction: ☑                │
│  └─ Learning mode: ☑                  │
│                                        │
│  📤 Export & Sharing                   │
│  ├─ Default format: [PDF ▼]           │
│  ├─ Include details: ☑                │
│  ├─ Public link: [Generate]           │
│  └─ Auto-sync: ☐                      │
│                                        │
│  🔒 Permissions                        │
│  ├─ Who can edit: [Team members ▼]   │
│  ├─ Who can view: [Organization ▼]    │
│  └─ Require approval for: [Dates ▼]   │
│                                        │
└────────────────────────────────────────┘
```

## 16. Export & Sharing Options

### Export Modal
```
┌────────────────────────────────────────┐
│  Export Roadmap                 [✕]   │
├────────────────────────────────────────┤
│                                        │
│  📄 Format                             │
│  (•) PDF                               │
│  ( ) PNG/Image                         │
│  ( ) Excel/CSV                         │
│  ( ) PowerPoint                        │
│  ( ) JSON (API)                        │
│  ( ) iCal                              │
│                                        │
│  📅 Date Range                         │
│  ( ) Current view                      │
│  (•) Custom range                      │
│  From: [Jan 1, 2024]                  │
│  To:   [Dec 31, 2024]                 │
│                                        │
│  🎨 What to Include                    │
│  ☑ Timeline bars                      │
│  ☑ Milestones                         │
│  ☑ Dependencies                       │
│  ☑ Progress indicators                │
│  ☑ Team avatars                       │
│  ☑ Task details                       │
│  ☑ Comments                           │
│  ☐ Attachments                        │
│                                        │
│  📊 Level of Detail                    │
│  ( ) Summary (projects only)           │
│  (•) Standard (projects + key tasks)   │
│  ( ) Detailed (all tasks + subtasks)   │
│                                        │
│  🎨 Appearance                         │
│  Layout: [Landscape ▼]                │
│  Paper size: [A4 ▼]                   │
│  Color scheme: [Dark ▼]               │
│                                        │
│  ──────────────────────────────────    │
│              [Cancel]  [Export]        │
│                                        │
└────────────────────────────────────────┘
```

### Share Options
```
┌────────────────────────────────────────┐
│  Share Roadmap                  [✕]   │
├────────────────────────────────────────┤
│                                        │
│  🔗 Public Link                        │
│  [Generate shareable link]             │
│                                        │
│  Generated Link:                       │
│  https://yuma.app/roadmap/abc123      │
│  [Copy Link] [QR Code]                │
│                                        │
│  Options:                              │
│  ☑ View only (no editing)             │
│  ☑ Require password                   │
│  Password: [••••••••]                 │
│  ☐ Set expiration date                │
│                                        │
│  👥 Invite Team Members                │
│  [Enter email addresses...______]     │
│                                        │
│  Permission level:                     │
│  ( ) View only                         │
│  (•) Can comment                       │
│  ( ) Can edit                          │
│                                        │
│  Current viewers (5):                  │
│  • Sarah Johnson (Owner)               │
│  • Mike Chen (Editor)                  │
│  • Alex Kim (Editor)                   │
│  • [Avatar] Jane Doe (Viewer)         │
│  • [Avatar] Tom Smith (Viewer)        │
│                                        │
│  📧 Email Options                      │
│  ☑ Send email notification            │
│  ☑ Include roadmap preview            │
│  [ ] Add personal message             │
│                                        │
│  🔄 Sync to External                   │
│  [Connect Google Calendar]             │
│  [Connect Microsoft Project]           │
│  [Connect Jira]                        │
│                                        │
└────────────────────────────────────────┘
```

### Presentation Mode
- Full-screen timeline view
- Hide UI chrome (toolbars, sidebars)
- Larger fonts and elements
- Smooth zoom and pan
- Keyboard shortcuts for navigation
- Highlight specific items on demand
- Export presentation (PowerPoint/PDF)

## 17. Context Menu (Right-Click)

### Task/Project Context Menu
```
┌──────────────────────────────┐
│ ✏️ Edit Details              │
│ 📋 Duplicate                 │
│ 📊 View Full Details         │
│ ──────────────────────       │
│ 🎨 Change Color              │
│ 🏷️ Add Tags                  │
│ 👤 Reassign                  │
│ 📅 Reschedule               │
│ ⏱️ Change Duration           │
│ ──────────────────────       │
│ ➕ Add Subtask               │
│ ◆ Add Milestone             │
│ 🔗 Add Dependency           │
│ ──────────────────────       │
│ ✅ Mark Complete            │
│ ⏸️ Put On Hold              │
│ 🚫 Mark as Blocked          │
│ ──────────────────────       │
│ 📤 Export                    │
│ 🔗 Copy Link                │
│ ──────────────────────       │
│ 📦 Archive                   │
│ 🗑️ Delete                    │
└──────────────────────────────┘
```

### Timeline Canvas Context Menu
```
┌──────────────────────────────┐
│ ➕ Add Task Here             │
│ ◆ Add Milestone             │
│ ➕ Add Project               │
│ ──────────────────────       │
│ 📅 Go to Date...            │
│ 🏠 Go to Today              │
│ ──────────────────────       │
│ 🔍 Zoom In                  │
│ 🔍 Zoom Out                 │
│ 📏 Fit to View              │
│ ──────────────────────       │
│ 📤 Export View              │
│ 📸 Screenshot               │
└──────────────────────────────┘
```

## 18. Keyboard Shortcuts

### Navigation
- `←/→` - Scroll timeline left/right
- `↑/↓` - Scroll up/down project list
- `Home` - Go to start of timeline
- `End` - Go to end of timeline
- `T` - Jump to today
- `Cmd/Ctrl+F` - Find/search

### View Controls
- `Q` - Switch to Quarters view
- `M` - Switch to Months view
- `W` - Switch to Weeks view
- `D` - Switch to Days view
- `Cmd/Ctrl + +` - Zoom in
- `Cmd/Ctrl + -` - Zoom out
- `Cmd/Ctrl + 0` - Fit all items

### Selection & Editing
- `Tab` - Next item
- `Shift+Tab` - Previous item
- `Enter` - Edit selected item
- `Cmd/Ctrl+C` - Copy item
- `Cmd/Ctrl+V` - Paste item
- `Cmd/Ctrl+D` - Duplicate item
- `Delete` - Delete selected item
- `Cmd/Ctrl+Z` - Undo
- `Cmd/Ctrl+Shift+Z` - Redo

### Multi-Select
- `Cmd/Ctrl+Click` - Add/remove from selection
- `Shift+Click` - Select range
- `Cmd/Ctrl+A` - Select all visible
- `Esc` - Clear selection

### Quick Actions
- `N` or `C` - Create new item
- `E` - Edit selected
- `Space` - Toggle details panel
- `/` - Open command palette
- `?` - Show keyboard shortcuts

## 19. Analytics & Reporting

### Analytics Dashboard
```
┌──────────────────────────────────────────────────────────┐
│  Roadmap Analytics                               [✕]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Overview                      Period: [Q1 2024 ▼]  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Total Projects: 12      Completed: 5             │ │
│  │  Total Tasks: 156        In Progress: 89          │ │
│  │  Total Milestones: 24    Upcoming: 12             │ │
│  │  Team Members: 15        Average Utilization: 82% │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  📈 Progress Trends                                      │
│  [Line chart showing progress over time]                │
│  - Planned progress (ideal line)                        │
│  - Actual progress                                      │
│  - Projected completion                                 │
│                                                          │
│  ⚠️ Risk Analysis                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  On Track: 7 projects (58%)        🟢            │ │
│  │  At Risk: 3 projects (25%)         🟡            │ │
│  │  Off Track: 2 projects (17%)       🔴            │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  👥 Team Performance                                     │
│  [Bar chart of team member productivity]                │
│  - Tasks completed per person                           │
│  - Average task duration                                │
│  - Capacity utilization                                 │
│                                                          │
│  📅 Timeline Accuracy                                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Estimated vs Actual:                             │ │
│  │  • Tasks completed on time: 68%                   │ │
│  │  • Average delay: 2.3 days                        │ │
│  │  • Estimation accuracy: 72%                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  🎯 Milestone Tracking                                   │
│  [Milestone achievement chart]                          │
│  - Planned: 24 milestones                               │
│  - Achieved: 18 milestones (75%)                        │
│  - Upcoming: 6 milestones                               │
│                                                          │
│  📊 Project Health Distribution                          │
│  [Pie chart of project health statuses]                │
│                                                          │
│  📤 Export Reports                                       │
│  [Executive Summary] [Detailed Report] [Custom]         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Custom Reports
- Date range selection
- Filter by project, team, status
- Choose metrics to include
- Schedule automated reports
- Email distribution lists
- PDF/Excel export formats

## 20. Mobile Responsive Design

### Desktop (>1024px)
- Full timeline with sidebar
- All features accessible
- Multi-select and drag & drop
- Side panels slide out

### Tablet (768px - 1024px)
- Collapsible sidebar
- Touch-friendly timeline bars
- Side panels as overlays
- Simplified toolbar

### Mobile (<768px)
- Vertical timeline (list view)
- Bottom sheet for details
- Floating action button for add
- Swipe gestures for navigation
- Hamburger menu for filters/settings
- Card-based project view

### Mobile Gestures
- Swipe left/right: Navigate timeline
- Swipe down: Refresh
- Long press: Context menu
- Pinch: Zoom timeline
- Tap: View details
- Double tap: Edit

### Mobile Timeline View
```
┌─────────────────────────┐
│  Q1 2024        [≡] [+] │
├─────────────────────────┤
│                         │
│  ▼ Website Redesign     │
│  ┌─────────────────────┐│
│  │ [████████░░] 75%    ││
│  │ Jan 1 - Mar 31      ││
│  │ 👤 Sarah  🟡        ││
│  │ 15/20 tasks done    ││
│  └─────────────────────┘│
│                         │
│  ▼ Mobile App           │
│  ┌─────────────────────┐│
│  │ [█████░░░░░] 50%    ││
│  │ Feb 1 - Apr 30      ││
│  │ 👤👤 Team  🟢        ││
│  │ 8/16 tasks done     ││
│  └─────────────────────┘│
│                         │
│  ▼ Marketing Campaign   │
│  ┌─────────────────────┐│
│  │ [██░░░░░░░░] 20%    ││
│  │ Mar 1 - May 31      ││
│  │ 👤 Alex   ⚪         ││
│  │ 3/15 tasks done     ││
│  └─────────────────────┘│
│                         │
└─────────────────────────┘
```

## 21. Loading States & Animations

### Initial Load
- Skeleton timeline grid
- Shimmer animation on bars
- Progressive loading (visible area first)
- Loading indicator for data fetch

### Interactions
- Smooth scroll animations (300ms ease-out)
- Timeline bar drag: Ghost element + opacity
- Resize: Real-time length update
- Dependency creation: Animated line drawing
- Progress update: Animated fill transition
- Milestone achievement: Celebration animation

### State Changes
- Status change: Color transition (500ms)
- Completion: Checkmark animation
- Delay/risk: Pulsing warning indicator
- New item: Fade in + slide animation

## 22. Accessibility (A11Y)

### Keyboard Navigation
- Full keyboard support (see shortcuts)
- Focus indicators on all interactive elements (2px blue outline)
- Logical tab order
- Arrow key navigation in timeline

### Screen Readers
- ARIA labels on all controls
- ARIA-live regions for updates
- Semantic HTML structure
- Alt text for visual indicators
- Descriptive link/button text
- Table structure for timeline grid

### Visual Accessibility
- High contrast mode support
- Minimum 4.5:1 contrast ratios
- No color-only information
- Pattern fills in addition to colors
- Scalable text (respects zoom)
- Focus visible on all interactive elements

### Reduced Motion
- Respect prefers-reduced-motion
- Disable animations if requested
- Instant transitions as fallback
- Still convey state changes visually

## 23. Performance Optimization

### Rendering
- Virtual scrolling for large roadmaps
- Canvas rendering for timeline (not DOM)
- Render only visible timeline bars
- Lazy load project details
- Debounce search (300ms)
- Throttle scroll/resize handlers (100ms)

### Data Management
- Cache timeline data
- Prefetch adjacent time periods
- Optimistic UI updates
- Batch API requests
- WebSocket for real-time collaboration
- Incremental sync

### Bundle Size
- Code split by feature
- Lazy load AI features
- Lazy load analytics
- Tree-shake unused code
- Optimize images and assets
- Compress bundles

## 24. Collaboration Features

### Real-time Updates
- Live cursor positions
- Who's viewing indicator
- Live edits from other users
- Conflict resolution
- Change notifications

### Comments & Mentions
- Comment threads on any item
- @mention team members
- Reply to comments
- Resolve comment threads
- Comment notifications

### Activity Feed
```
┌────────────────────────────────────────┐
│  Recent Activity                [✕]   │
├────────────────────────────────────────┤
│                                        │
│  Today                                 │
│  • Sarah moved "UX Research"           │
│    2 hours ago                         │
│                                        │
│  • Mike completed "API Endpoint"       │
│    3 hours ago                         │
│                                        │
│  • Alex added milestone "Beta Launch"  │
│    5 hours ago                         │
│                                        │
│  Yesterday                             │
│  • System: Critical path changed       │
│    Warning: Project delayed by 2 days  │
│                                        │
│  • Sarah commented on "Design System"  │
│    "Let's discuss color tokens..."     │
│                                        │
│  [Load more...]                        │
│                                        │
└────────────────────────────────────────┘
```

### Version History
- Track all changes to roadmap
- View previous versions
- Compare versions
- Restore previous version
- Blame/attribution
- Change log export

## 25. Integration Points

### Task Management
- Sync with Tasks tab
- Task status affects roadmap
- Roadmap changes update tasks
- Two-way sync

### Calendar Integration
- Show roadmap items on calendar
- Calendar events on roadmap
- Sync milestones
- Resource scheduling

### External Tools
- Jira sync (epic/story mapping)
- GitHub (release planning)
- Google Calendar
- Microsoft Project
- Asana, Trello integrations

### API & Webhooks
- REST API for roadmap data
- Webhooks for changes
- Automation triggers
- Custom integrations

## 26. Data Structure Examples

### Roadmap Item Object
```typescript
interface RoadmapItem {
  id: string;
  type: 'project' | 'task' | 'milestone' | 'epic';
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date; // Not required for milestones
  duration?: number; // Days
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; // 0-100
  progressCalculation: 'manual' | 'task-based' | 'time-based' | 'milestone-based';
  health: 'on-track' | 'at-risk' | 'off-track' | 'ahead';
  
  // Hierarchy
  parentId?: string;
  children?: string[];
  order: number;
  
  // Team
  owner?: string; // User ID
  assignees: string[]; // User IDs
  team?: string; // Team ID
  
  // Dependencies
  dependencies: Dependency[];
  blocking: string[]; // Item IDs this item blocks
  blockedBy: string[]; // Item IDs blocking this item
  
  // Metadata
  tags: string[];
  customFields: Record<string, any>;
  color?: string;
  spaceId?: string;
  roadmapId: string;
  
  // Tracking
  estimatedHours?: number;
  actualHours?: number;
  completedSubtasks?: number;
  totalSubtasks?: number;
  milestonesReached?: number;
  totalMilestones?: number;
  
  // AI
  aiGenerated: boolean;
  riskScore?: number; // 0-100
  confidenceScore?: number; // 0-100
  
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

interface Dependency {
  id: string;
  fromId: string; // Item ID
  toId: string; // Item ID
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lag: number; // Days (can be negative for lead time)
  required: boolean; // Hard or soft dependency
}

interface Milestone {
  id: string;
  title: string;
  date: Date;
  type: 'deadline' | 'deliverable' | 'checkpoint' | 'release';
  status: 'achieved' | 'on-track' | 'at-risk' | 'missed' | 'not-started';
  owner?: string;
  projectId: string;
  dependencies: string[];
  completionCriteria: CompletionCriterion[];
  color?: string;
}

interface CompletionCriterion {
  id: string;
  description: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
}
```

## 27. Testing Requirements

### Unit Tests
- Date calculations
- Progress calculations
- Dependency resolution
- Critical path algorithm
- Filter logic
- Search functionality

### Integration Tests
- Drag and drop
- Timeline rendering
- Dependency creation
- Status updates
- Real-time sync
- AI feature integration

### E2E Tests
- Complete project creation flow
- Milestone tracking
- Dependency management
- Filter and search
- Export functionality
- Mobile responsive behavior

### Performance Tests
- Large roadmap rendering (1000+ items)
- Scroll performance
- Drag performance
- Real-time updates with multiple users
- Memory leaks

## 28. Implementation Priority

### Phase 1 (MVP)
1. Basic timeline grid (months view)
2. Project sidebar with hierarchy
3. Timeline bars (tasks/projects)
4. Create/edit/delete items
5. Drag to reschedule
6. Resize to change duration
7. Today indicator
8. Basic progress display

### Phase 2 (Core Features)
1. All view modes (quarters/weeks/days)
2. Milestones
3. Dependencies (visual + CRUD)
4. Status and priority
5. Grouping options
6. Filter panel
7. Detail modal
8. Progress tracking

### Phase 3 (Advanced)
1. Critical path analysis
2. Resource/capacity planning
3. Baselines & version comparison
4. Analytics dashboard
5. AI assistant
6. Settings panel
7. Export & sharing

### Phase 4 (Polish)
1. Animations and transitions
2. Keyboard shortcuts
3. Mobile optimization
4. Real-time collaboration
5. Activity feed
6. Advanced analytics
7. External integrations

## 29. Notes for Implementation

- Use React hooks for state management (useState, useEffect, useMemo)
- Use date-fns or day.js for date manipulation (not moment.js - it's deprecated)
- Use HTML5 Canvas or SVG for timeline rendering for performance
- Consider react-beautiful-dnd or dnd-kit for drag and drop
- Use Recharts for analytics charts
- Use Lucide React for all icons
- Follow the dark theme color palette strictly
- Implement virtual scrolling for large datasets
- Use CSS Grid for sidebar layout
- Use absolute positioning for timeline bars
- Implement proper loading and error states
- Add ARIA labels for accessibility
- Use React.memo for timeline bar components
- Debounce search and filter inputs
- Throttle scroll and resize handlers
- Implement optimistic UI updates
- Use WebSocket for real-time features
- Cache timeline data in localStorage
- Implement keyboard shortcuts with a keyboard event handler
- Test on multiple screen sizes
- Ensure smooth 60fps animations
- Follow existing YUMA design patterns and component structure
- Make components reusable and composable
- Use TypeScript interfaces for type safety
- Add comprehensive prop-types or TS types
- Write unit tests for critical functions
- Document complex algorithms (especially critical path)

---

This specification provides comprehensive guidance for implementing a production-ready roadmap feature that integrates seamlessly with the YUMA task management platform, supports advanced project planning workflows, and includes AI-powered features for intelligent project management.
