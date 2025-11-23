# YUMA Design System Specification v2.0
**AI-Optimized Design Documentation**

## Table of Contents
1. [System Overview](#system-overview)
2. [Design Tokens](#design-tokens)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Component Library](#component-library)
6. [Layout System](#layout-system)
7. [Interaction Patterns](#interaction-patterns)
8. [AI Integration Patterns](#ai-integration-patterns)

---

## System Overview

### Platform Identity
- **Name**: YUMA
- **Purpose**: Task management and collaboration platform with integrated AI features
- **Design Language**: ClickUp-inspired with dark theme
- **Primary Framework**: React + Tailwind CSS
- **Font**: Inter (400, 500, 700, 800)

### Design Philosophy
1. **Ultra-Dark Foundation**: Minimize eye strain with deep backgrounds
2. **Vibrant Accents**: Use bold, distinct colors for visual wayfinding
3. **Clear Hierarchy**: Consistent sizing and spacing for scannable interfaces
4. **AI-First**: Seamless integration of AI features throughout the platform

---

## Design Tokens

### Base Font Configuration
```json
{
  "font": {
    "family": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    "baseSize": "14px",
    "weights": {
      "normal": 400,
      "medium": 500,
      "bold": 700,
      "extrabold": 800
    },
    "rendering": {
      "smoothing": "antialiased",
      "osxSmoothing": "grayscale"
    }
  }
}
```

### Typography Scale
```json
{
  "typography": {
    "scale": {
      "xs": "0.75rem",    // 12px
      "sm": "0.875rem",   // 14px
      "base": "1rem",     // 16px
      "lg": "1.125rem",   // 18px
      "xl": "1.25rem",    // 20px
      "2xl": "1.5rem",    // 24px
      "3xl": "1.875rem"   // 30px
    }
  }
}
```

### Element Typography Mapping
```json
{
  "elements": {
    "h1": {
      "fontSize": "var(--text-2xl)",
      "fontWeight": 500,
      "lineHeight": 1.5
    },
    "h2": {
      "fontSize": "var(--text-xl)",
      "fontWeight": 500,
      "lineHeight": 1.5
    },
    "h3": {
      "fontSize": "var(--text-lg)",
      "fontWeight": 500,
      "lineHeight": 1.5
    },
    "h4": {
      "fontSize": "var(--text-base)",
      "fontWeight": 500,
      "lineHeight": 1.5
    },
    "p": {
      "fontSize": "var(--text-base)",
      "fontWeight": 400,
      "lineHeight": 1.5
    },
    "label": {
      "fontSize": "var(--text-base)",
      "fontWeight": 500,
      "lineHeight": 1.5
    },
    "button": {
      "fontSize": "var(--text-base)",
      "fontWeight": 500,
      "lineHeight": 1.5
    },
    "input": {
      "fontSize": "var(--text-base)",
      "fontWeight": 400,
      "lineHeight": 1.5
    }
  }
}
```

### Spacing System
```json
{
  "spacing": {
    "0": "0",
    "1": "0.25rem",   // 4px
    "2": "0.5rem",    // 8px
    "3": "0.75rem",   // 12px
    "4": "1rem",      // 16px
    "5": "1.25rem",   // 20px
    "6": "1.5rem",    // 24px
    "8": "2rem",      // 32px
    "9": "2.25rem",   // 36px
    "10": "2.5rem",   // 40px
    "12": "3rem",     // 48px
    "14": "3.5rem"    // 56px
  }
}
```

### Border Radius System
```json
{
  "borderRadius": {
    "base": "0.5rem",
    "sm": "0.25rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "full": "9999px"
  }
}
```

---

## Color System

### Core Palette (Dark Theme)
```json
{
  "core": {
    "background": {
      "primary": "#0F1014",
      "description": "Main application background - darkest",
      "usage": "Body, main content areas"
    },
    "card": {
      "primary": "#11121A",
      "description": "Card and surface background",
      "usage": "Task cards, panels, stat boxes"
    },
    "sidebar": {
      "primary": "#0C0D11",
      "description": "Sidebar background - darker than main",
      "usage": "Left navigation panel"
    },
    "secondary": {
      "primary": "#1A1B20",
      "description": "Secondary surfaces",
      "usage": "Hover states, input backgrounds"
    },
    "muted": {
      "primary": "#1E1F24",
      "description": "Muted backgrounds",
      "usage": "Borders, subtle surfaces"
    },
    "border": {
      "primary": "#1E1F24",
      "description": "Border color",
      "usage": "Dividers, component borders"
    }
  }
}
```

### Text Colors
```json
{
  "text": {
    "foreground": {
      "color": "#E4E5E7",
      "description": "Primary text color",
      "usage": "Headings, body text, labels"
    },
    "muted": {
      "color": "#7D8089",
      "description": "Secondary/muted text",
      "usage": "Descriptions, metadata, placeholders"
    }
  }
}
```

### Brand Colors
```json
{
  "brand": {
    "primary": {
      "color": "#4353FF",
      "name": "Vibrant Blue",
      "usage": "Primary actions, links, active states",
      "hover": "#3543EF",
      "active": "#2533DF"
    },
    "destructive": {
      "color": "#F44336",
      "name": "Red",
      "usage": "Errors, delete actions, urgent alerts",
      "hover": "#E53935",
      "active": "#D32F2F"
    }
  }
}
```

### AI Feature Colors
```json
{
  "ai": {
    "primary": "#4353FF",
    "secondary": "#6875FF",
    "gradient": {
      "from": "#4353FF",
      "to": "#6875FF"
    },
    "usage": "AI buttons, panels, sparkle icons"
  }
}
```

### Status System
```json
{
  "status": {
    "todo": {
      "color": "#7D8089",
      "name": "Gray",
      "label": "To Do"
    },
    "inProgress": {
      "color": "#4353FF",
      "name": "Blue",
      "label": "In Progress"
    },
    "done": {
      "color": "#10B981",
      "name": "Green",
      "label": "Done"
    },
    "blocked": {
      "color": "#F44336",
      "name": "Red",
      "label": "Blocked"
    }
  }
}
```

### Priority Levels
```json
{
  "priority": {
    "low": {
      "color": "#7D8089",
      "name": "Gray",
      "icon": "circle"
    },
    "medium": {
      "color": "#F59E0B",
      "name": "Amber",
      "icon": "alert-circle"
    },
    "high": {
      "color": "#FF9800",
      "name": "Orange",
      "icon": "alert-triangle"
    },
    "urgent": {
      "color": "#F44336",
      "name": "Red",
      "icon": "alert-octagon"
    }
  }
}
```

### Kanban Column Colors
```json
{
  "kanbanColumns": {
    "new": {
      "color": "#7D8089",
      "name": "New Tasks",
      "background": "rgba(125, 128, 137, 0.1)",
      "border": "rgba(125, 128, 137, 0.3)"
    },
    "backlog": {
      "color": "#F59E0B",
      "name": "Backlog",
      "background": "rgba(245, 158, 11, 0.1)",
      "border": "rgba(245, 158, 11, 0.3)"
    },
    "todo": {
      "color": "#4353FF",
      "name": "To Do",
      "background": "rgba(67, 83, 255, 0.1)",
      "border": "rgba(67, 83, 255, 0.3)"
    },
    "inProgress": {
      "color": "#8B5CF6",
      "name": "In Progress",
      "background": "rgba(139, 92, 246, 0.1)",
      "border": "rgba(139, 92, 246, 0.3)"
    },
    "review": {
      "color": "#10B981",
      "name": "Review",
      "background": "rgba(16, 185, 129, 0.1)",
      "border": "rgba(16, 185, 129, 0.3)"
    }
  }
}
```

### Feature Colors (Navigation & Views)
```json
{
  "navigation": {
    "sidebar": {
      "home": "#4353FF",
      "inbox": "#10B981",
      "tasks": "#8B5CF6",
      "documents": "#F59E0B",
      "goals": "#EC4899",
      "dashboards": "#06B6D4"
    },
    "views": {
      "overview": "#4353FF",
      "tasks": "#10B981",
      "board": "#8B5CF6",
      "roadmap": "#EC4899",
      "integrations": "#06B6D4",
      "reports": "#F59E0B",
      "backlog": "#7D8089",
      "sprints": "#FBBF24",
      "releases": "#14B8A6"
    }
  }
}
```

### Team Collaboration Colors
```json
{
  "collaboration": {
    "user1": "#EC4899",
    "user2": "#8B5CF6",
    "user3": "#06B6D4",
    "user4": "#10B981",
    "user5": "#F59E0B",
    "user6": "#EF4444"
  }
}
```

---

## Typography

### Implementation Guide

#### CSS Variables
```css
:root {
  /* Font Family */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  
  /* Base Size */
  --font-size: 14px;
  
  /* Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  
  /* Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
}
```

#### Usage Rules
```json
{
  "rules": [
    "Use h4 tags for all content titles (task names, milestone names)",
    "h4 uses medium weight (500) for consistent bold appearance",
    "Never override font-size, font-weight, or line-height with Tailwind unless explicitly requested",
    "Use semantic HTML elements (h1, h2, h3, h4, p, label) for proper typography",
    "Apply var(--text-*) only when inline styles are needed"
  ]
}
```

#### Content Type Mapping
```json
{
  "contentTypes": {
    "pageTitles": "h1",
    "sectionHeaders": "h2",
    "subsectionHeaders": "h3",
    "cardTitles": "h4",
    "taskNames": "h4",
    "milestoneNames": "h4",
    "insightTitles": "h4",
    "bodyText": "p",
    "formLabels": "label"
  }
}
```

---

## Component Library

### 1. Sidebar (ClickUpSidebar)

#### Specifications
```json
{
  "component": "ClickUpSidebar",
  "file": "/components/clickup-sidebar.tsx",
  "dimensions": {
    "width": "256px",
    "widthClass": "w-64",
    "height": "100vh",
    "backgroundColor": "#0C0D11",
    "borderRight": "1px solid #1E1F24"
  },
  "structure": {
    "header": {
      "height": "56px",
      "heightClass": "h-14",
      "padding": "px-4",
      "contains": ["logo", "brand-name"]
    },
    "navigation": {
      "items": [
        {
          "label": "Home",
          "icon": "Home",
          "iconColor": "#4353FF",
          "route": "/home"
        },
        {
          "label": "Inbox",
          "icon": "Inbox",
          "iconColor": "#10B981",
          "route": "/inbox"
        },
        {
          "label": "Tasks",
          "icon": "CheckSquare",
          "iconColor": "#8B5CF6",
          "route": "/tasks"
        },
        {
          "label": "Documents",
          "icon": "FileText",
          "iconColor": "#F59E0B",
          "route": "/documents"
        },
        {
          "label": "Goals",
          "icon": "Target",
          "iconColor": "#EC4899",
          "route": "/goals"
        },
        {
          "label": "Dashboards",
          "icon": "LayoutDashboard",
          "iconColor": "#06B6D4",
          "route": "/dashboards"
        }
      ]
    },
    "navItem": {
      "height": "auto",
      "padding": "py-2.5 px-4",
      "borderRadius": "rounded-lg",
      "gap": "gap-3",
      "iconSize": "w-5 h-5",
      "fontSize": "text-sm",
      "states": {
        "default": {
          "background": "transparent",
          "textColor": "#E4E5E7"
        },
        "hover": {
          "background": "#1A1B20"
        },
        "active": {
          "background": "#1A1B20",
          "borderLeft": "2px solid #4353FF"
        }
      }
    }
  }
}
```

### 2. Header (ClickUpHeader)

#### Specifications
```json
{
  "component": "ClickUpHeader",
  "file": "/components/clickup-header.tsx",
  "dimensions": {
    "height": "56px",
    "heightClass": "h-14",
    "backgroundColor": "#0F1014",
    "borderBottom": "1px solid #1E1F24",
    "padding": "px-6"
  },
  "structure": {
    "layout": "flex justify-between items-center",
    "sections": {
      "search": {
        "maxWidth": "672px",
        "maxWidthClass": "max-w-2xl",
        "inputHeight": "36px",
        "inputHeightClass": "h-9",
        "backgroundColor": "#1A1B20",
        "borderRadius": "rounded-lg",
        "iconSize": "w-4 h-4",
        "iconColor": "#7D8089",
        "paddingLeft": "pl-9",
        "placeholder": "Search tasks, projects, docs..."
      },
      "actions": {
        "gap": "gap-3",
        "items": [
          {
            "type": "button",
            "variant": "primary",
            "label": "New Task",
            "icon": "Plus",
            "iconSize": "w-4 h-4",
            "height": "h-9"
          },
          {
            "type": "icon-button",
            "icon": "Bell",
            "iconColor": "#4353FF",
            "iconSize": "w-4 h-4"
          },
          {
            "type": "avatar",
            "size": "h-8 w-8",
            "backgroundColor": "#4353FF",
            "textColor": "white"
          }
        ]
      }
    }
  }
}
```

### 3. View Navigation (ViewNavigation)

#### Specifications
```json
{
  "component": "ViewNavigation",
  "file": "/components/view-navigation.tsx",
  "dimensions": {
    "height": "48px",
    "heightClass": "h-12",
    "backgroundColor": "#0F1014",
    "borderBottom": "1px solid #1E1F24",
    "padding": "px-6"
  },
  "structure": {
    "layout": "flex justify-between items-center",
    "tabs": {
      "gap": "gap-1",
      "items": [
        {
          "label": "Overview",
          "icon": "LayoutGrid",
          "iconColor": "#4353FF"
        },
        {
          "label": "Tasks",
          "icon": "CheckSquare",
          "iconColor": "#10B981"
        },
        {
          "label": "Board",
          "icon": "Trello",
          "iconColor": "#8B5CF6"
        },
        {
          "label": "Roadmap",
          "icon": "Map",
          "iconColor": "#EC4899"
        }
      ]
    },
    "tabButton": {
      "padding": "px-3 py-1.5",
      "borderRadius": "rounded",
      "fontSize": "text-sm",
      "gap": "gap-2",
      "iconSize": "w-4 h-4",
      "states": {
        "inactive": {
          "background": "transparent",
          "textColor": "#7D8089",
          "iconColor": "feature-specific"
        },
        "hover": {
          "background": "#1E1F24",
          "textColor": "#E4E5E7"
        },
        "active": {
          "background": "#4353FF",
          "textColor": "white",
          "iconColor": "white"
        }
      }
    }
  }
}
```

### 4. Kanban Board (ClickUpKanbanBoard)

#### Specifications
```json
{
  "component": "ClickUpKanbanBoard",
  "file": "/components/clickup-kanban-board.tsx",
  "dimensions": {
    "padding": "p-6",
    "gap": "gap-4",
    "minHeight": "min-h-[calc(100vh-180px)]",
    "overflow": "overflow-x-auto"
  },
  "structure": {
    "layout": "flex",
    "column": {
      "width": "320px",
      "widthClass": "w-80",
      "flexShrink": "flex-shrink-0",
      "borderRadius": "rounded-lg",
      "padding": "p-3",
      "backgroundOpacity": "10% of column color",
      "boxShadow": "0 0 0 1px rgba(color, 0.3), 0 2px 8px rgba(color, 0.15)"
    },
    "columnHeader": {
      "margin": "-mx-3 -mt-3 mb-0",
      "padding": "px-3 py-2",
      "borderRadius": "rounded-t-lg",
      "backgroundOpacity": "20% of column color",
      "layout": "flex justify-between items-center"
    },
    "columnTitle": {
      "layout": "flex items-center gap-1",
      "fontSize": "text-sm",
      "colorDot": {
        "size": "w-2 h-2",
        "borderRadius": "rounded-full",
        "backgroundColor": "column color"
      },
      "count": {
        "fontSize": "text-xs",
        "color": "#7D8089"
      }
    },
    "tasksArea": {
      "spacing": "space-y-2",
      "emptyState": {
        "border": "border-2 border-dashed",
        "borderColor": "#1E1F24",
        "textColor": "#7D8089"
      }
    }
  }
}
```

### 5. Task Card (ClickUpTaskCard)

#### Specifications
```json
{
  "component": "ClickUpTaskCard",
  "file": "/components/clickup-task-card.tsx",
  "dimensions": {
    "backgroundColor": "#11121A",
    "borderRadius": "rounded-lg",
    "padding": "p-3",
    "cursor": "cursor-pointer",
    "transition": "transition-colors"
  },
  "structure": {
    "taskId": {
      "fontSize": "text-xs",
      "color": "#7D8089",
      "fontWeight": "font-medium"
    },
    "taskTitle": {
      "element": "h4",
      "fontSize": "text-sm",
      "marginTop": "mt-1"
    },
    "taskSubtitle": {
      "fontSize": "text-xs",
      "color": "#7D8089",
      "marginTop": "mt-1"
    },
    "taskFooter": {
      "marginTop": "mt-3",
      "layout": "flex justify-between items-center"
    },
    "dueDate": {
      "fontSize": "text-xs",
      "color": "#7D8089",
      "icon": "Calendar",
      "iconSize": "w-3 h-3",
      "gap": "gap-1"
    },
    "tags": {
      "layout": "flex gap-1",
      "tag": {
        "padding": "px-2 py-0.5",
        "borderRadius": "rounded",
        "fontSize": "text-xs",
        "background": "semi-transparent based on type"
      }
    },
    "states": {
      "hover": {
        "backgroundColor": "#1A1B20"
      }
    }
  }
}
```

### 6. Home Dashboard (HomePage)

#### Specifications
```json
{
  "component": "HomePage",
  "file": "/components/home-page.tsx",
  "structure": {
    "welcomeBanner": {
      "padding": "p-6",
      "borderRadius": "rounded-lg",
      "background": "linear-gradient(135deg, #4353FF 0%, #6875FF 100%)",
      "title": "h2",
      "subtitle": "p"
    },
    "statsGrid": {
      "layout": "grid grid-cols-4 gap-4",
      "card": {
        "padding": "p-6",
        "borderRadius": "rounded-lg",
        "backgroundColor": "#11121A",
        "icon": {
          "size": "w-10 h-10",
          "padding": "p-2",
          "borderRadius": "rounded-lg",
          "backgroundColor": "rgba(feature-color, 0.2)"
        },
        "value": {
          "element": "h2",
          "fontSize": "var(--text-3xl)",
          "fontWeight": "var(--font-weight-bold)",
          "marginBottom": "mb-1"
        },
        "label": {
          "element": "p",
          "color": "#7D8089"
        }
      }
    },
    "contentGrid": {
      "layout": "grid grid-cols-2 gap-4",
      "sections": [
        {
          "name": "recentTasks",
          "title": "Recent Tasks",
          "card": {
            "backgroundColor": "#11121A",
            "padding": "p-6",
            "borderRadius": "rounded-lg"
          }
        },
        {
          "name": "upcomingMilestones",
          "title": "Upcoming Milestones",
          "card": {
            "backgroundColor": "#11121A",
            "padding": "p-6",
            "borderRadius": "rounded-lg"
          }
        }
      ]
    },
    "aiInsights": {
      "backgroundColor": "#11121A",
      "padding": "p-6",
      "borderRadius": "rounded-lg",
      "accentColor": "#4353FF"
    }
  }
}
```

### 7. Button System

#### Specifications
```json
{
  "component": "Button",
  "file": "/components/ui/button.tsx",
  "variants": {
    "primary": {
      "backgroundColor": "#4353FF",
      "textColor": "white",
      "hover": {
        "opacity": 0.9
      },
      "active": {
        "opacity": 0.8
      }
    },
    "ghost": {
      "backgroundColor": "transparent",
      "textColor": "inherit",
      "hover": {
        "backgroundColor": "#1E1F24"
      }
    },
    "outline": {
      "backgroundColor": "transparent",
      "border": "1px solid #1E1F24",
      "textColor": "#E4E5E7",
      "hover": {
        "backgroundColor": "#1E1F24"
      }
    }
  },
  "sizes": {
    "sm": {
      "height": "h-8",
      "padding": "px-3"
    },
    "md": {
      "height": "h-9",
      "padding": "px-4"
    },
    "lg": {
      "height": "h-10",
      "padding": "px-6"
    }
  }
}
```

### 8. Input System

#### Specifications
```json
{
  "component": "Input",
  "file": "/components/ui/input.tsx",
  "specs": {
    "backgroundColor": "#1A1B20",
    "border": "1px solid #1E1F24",
    "borderRadius": "rounded-lg",
    "height": "h-9",
    "padding": "px-3",
    "textColor": "#E4E5E7",
    "placeholderColor": "#7D8089",
    "fontSize": "text-base",
    "fontWeight": 400,
    "states": {
      "focus": {
        "outline": "2px solid #4353FF",
        "outlineOffset": "2px"
      },
      "disabled": {
        "opacity": 0.5,
        "cursor": "not-allowed"
      }
    }
  }
}
```

---

## Layout System

### Main Application Layout
```json
{
  "layout": {
    "structure": "flex h-screen",
    "sections": {
      "sidebar": {
        "width": "256px",
        "class": "w-64",
        "height": "100vh",
        "position": "fixed",
        "zIndex": "z-50"
      },
      "mainContent": {
        "class": "flex-1 flex flex-col",
        "marginLeft": "ml-64",
        "structure": {
          "header": {
            "height": "56px",
            "class": "h-14",
            "position": "sticky top-0",
            "zIndex": "z-40"
          },
          "viewNavigation": {
            "height": "48px",
            "class": "h-12",
            "position": "sticky top-14",
            "zIndex": "z-30"
          },
          "contentArea": {
            "class": "flex-1 overflow-auto",
            "minHeight": "calc(100vh - 104px)"
          }
        }
      }
    },
    "fixedHeights": {
      "header": "56px",
      "viewNavigation": "48px",
      "total": "104px",
      "contentArea": "calc(100vh - 104px)"
    }
  }
}
```

### Responsive Breakpoints
```json
{
  "breakpoints": {
    "mobile": {
      "max": "640px",
      "behavior": {
        "sidebar": "Overlay/drawer",
        "header": "Responsive padding",
        "kanban": "Horizontal scroll"
      }
    },
    "tablet": {
      "min": "640px",
      "max": "1024px",
      "behavior": {
        "sidebar": "Collapsible",
        "header": "Full width",
        "kanban": "2-3 columns visible"
      }
    },
    "desktop": {
      "min": "1024px",
      "behavior": {
        "sidebar": "Always visible",
        "header": "Full width",
        "kanban": "4-5 columns visible"
      }
    }
  }
}
```

---

## Interaction Patterns

### State Management
```json
{
  "states": {
    "hover": {
      "transition": "all 150ms ease",
      "backgroundChange": "lighten by one step",
      "applies": ["buttons", "cards", "navigation-items"]
    },
    "active": {
      "background": "#4353FF",
      "textColor": "white",
      "border": "2px solid #4353FF (for sidebar)",
      "applies": ["navigation-items", "tabs", "toggles"]
    },
    "focus": {
      "outline": "2px solid #4353FF",
      "outlineOffset": "2px",
      "applies": ["inputs", "buttons", "links"]
    },
    "disabled": {
      "opacity": 0.5,
      "cursor": "not-allowed",
      "pointerEvents": "none"
    }
  }
}
```

### Animation Guidelines
```json
{
  "animations": {
    "duration": {
      "fast": "150ms",
      "normal": "250ms",
      "slow": "350ms"
    },
    "easing": {
      "default": "ease",
      "in": "ease-in",
      "out": "ease-out",
      "inOut": "ease-in-out"
    },
    "properties": ["background-color", "color", "opacity", "transform"]
  }
}
```

### Elevation System
```json
{
  "shadows": {
    "card": "0 1px 3px rgba(0, 0, 0, 0.1)",
    "kanbanColumn": "0 0 0 1px rgba(color, 0.3), 0 2px 8px rgba(color, 0.15)",
    "focus": "0 0 0 2px #4353FF",
    "elevated": "0 4px 12px rgba(0, 0, 0, 0.15)"
  }
}
```

---

## AI Integration Patterns

### AI Component Styling
```json
{
  "ai": {
    "button": {
      "background": "linear-gradient(to right, #4353FF, #6875FF)",
      "icon": "Sparkles",
      "iconColor": "white",
      "textColor": "white",
      "hover": {
        "opacity": 0.9
      }
    },
    "panel": {
      "backgroundColor": "#11121A",
      "borderLeft": "2px solid #4353FF",
      "accentColor": "#4353FF",
      "icon": {
        "background": "rgba(67, 83, 255, 0.2)",
        "color": "#4353FF"
      }
    },
    "badge": {
      "background": "rgba(67, 83, 255, 0.2)",
      "textColor": "#6875FF",
      "borderRadius": "rounded-full",
      "fontSize": "text-xs",
      "padding": "px-2 py-0.5"
    }
  }
}
```

### AI Icon Usage
```json
{
  "aiIcons": {
    "primary": "Sparkles",
    "secondary": "Wand2",
    "assistant": "Bot",
    "suggestion": "Lightbulb",
    "sizes": {
      "small": "w-3 h-3",
      "medium": "w-4 h-4",
      "large": "w-5 h-5"
    }
  }
}
```

---

## Implementation Guidelines

### CSS Variables Usage
```css
/* Always use CSS variables for colors */
.example {
  background-color: var(--background);
  color: var(--foreground);
  border-color: var(--border);
}

/* For dynamic colors, use inline styles */
<div style={{ backgroundColor: `${color}10` }} />
```

### Component Props Pattern
```typescript
// Pass colors and variants as props
interface ComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  icon?: React.ComponentType;
}
```

### Accessibility Requirements
```json
{
  "accessibility": {
    "colorContrast": {
      "text": "4.5:1 minimum",
      "largeText": "3:1 minimum",
      "uiComponents": "3:1 minimum"
    },
    "focusIndicators": {
      "required": true,
      "visible": "2px solid #4353FF",
      "offset": "2px"
    },
    "semanticHTML": {
      "required": true,
      "examples": ["nav", "main", "section", "article", "header"]
    },
    "ariaLabels": {
      "required": "for icon-only buttons and complex interactions",
      "examples": ["aria-label", "aria-labelledby", "aria-describedby"]
    }
  }
}
```

---

## File Structure Reference

```json
{
  "fileStructure": {
    "/App.tsx": "Main application layout and routing",
    "/components/clickup-sidebar.tsx": "Left navigation panel",
    "/components/clickup-header.tsx": "Top header with search and actions",
    "/components/view-navigation.tsx": "Horizontal view tabs",
    "/components/clickup-kanban-board.tsx": "Kanban board with columns",
    "/components/clickup-task-card.tsx": "Individual task cards",
    "/components/home-page.tsx": "Home dashboard with stats and insights",
    "/components/ui/*": "Shadcn UI component library",
    "/styles/globals.css": "All design tokens and CSS variables"
  }
}
```

---

## Version History

### v2.0 (Current)
- AI-optimized documentation structure
- Comprehensive JSON specifications
- Enhanced color system documentation
- Detailed component specifications
- Typography system with Inter font
- Updated card backgrounds to darker theme (#11121A)
- Larger statistics numbers (--text-3xl)

### v1.0
- Initial design system
- ClickUp-inspired dark theme
- Basic component library
- Core color palette

---

## Usage Instructions for AI

### When implementing components:
1. Reference the exact color values from the Color System section
2. Use the spacing values from the Spacing System
3. Follow the component specifications exactly
4. Apply the typography rules without overriding
5. Use the interaction patterns for consistent behavior

### When creating new features:
1. Check existing color mappings before creating new colors
2. Follow the naming conventions from this specification
3. Use the established component patterns
4. Maintain accessibility requirements
5. Update this documentation with new patterns

### When modifying styles:
1. Update CSS variables in /styles/globals.css
2. Maintain consistency with the design tokens
3. Test across all components
4. Document changes in this specification

---

**End of Specification**
