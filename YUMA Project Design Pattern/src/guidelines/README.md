# YUMA Design System - Universal Elements

This directory contains the AI-optimized design system for YUMA, a task management platform with integrated AI features.

## 📁 File Structure

### Core Design Tokens
- **`design-tokens.json`** - Colors, typography, spacing, shadows, and layout measurements
- **`typography-rules.json`** - Font definitions, element mappings, and usage rules
- **`component-patterns.json`** - Reusable component specifications
- **`layout-structure.json`** - Application layout and responsive behavior
- **`interaction-states.json`** - Hover, active, focus, and animation patterns
- **`theme-switching.json`** - Light/dark mode switching system and specifications
- **`mobile-responsive.json`** - Mobile-friendly responsive design specifications
- **`theme-aware-styling.md`** - Best practices for theme-aware hover states and styling

## 🎨 Quick Reference

### Colors (Dark Mode)
```
Background Primary: #0F1014
Card Background: #11121A
Text Primary: #E4E5E7
Text Secondary: #7D8089
Brand Primary: #4353FF
```

### Colors (Light Mode)
```
Background Primary: #FFFFFF
Card Background: #F8F9FA
Text Primary: #1A1A1A
Text Secondary: #6C757D
Brand Primary: #4353FF
```

### Typography
```
Font: Inter (400, 500, 700, 800)
Base Size: 14px
Scale: xs(12px) sm(14px) base(16px) lg(18px) xl(20px) 2xl(24px) 3xl(30px)
```

### Spacing
```
1: 4px   2: 8px   3: 12px   4: 16px   6: 24px
8: 32px  9: 36px  10: 40px  12: 48px  14: 56px
```

### Layout
```
Sidebar Width: 256px
Header Height: 56px
View Nav Height: 48px
Content Padding: 24px
```

## 🔧 Usage for AI

When building components:

1. **Read design tokens first**: `design-tokens.json`
2. **Check component patterns**: `component-patterns.json`
3. **Follow typography rules**: `typography-rules.json`
4. **Respect interaction states**: `interaction-states.json`
5. **Use layout structure**: `layout-structure.json`

## 📐 Implementation Rules

### Typography
- Use semantic HTML elements (h1, h2, h3, h4, p, label)
- Never override font-size, font-weight, or line-height with Tailwind
- Use h4 for all content titles (tasks, milestones, insights)
- Use p for body text and descriptions

### Colors
- Always use CSS variables: `var(--background)`, `var(--foreground)`
- Use design tokens for consistency
- Feature-specific colors for icons and accents

### Components
- Follow component patterns exactly
- Use provided spacing values
- Apply interaction states consistently
- Maintain responsive behavior

## 🎯 Design Principles

1. **Ultra-Dark Foundation** - Deep backgrounds (#0F1014) for reduced eye strain
2. **Vibrant Accents** - Bold colors for visual wayfinding
3. **Clear Hierarchy** - Consistent sizing and spacing
4. **AI-First** - Seamless AI feature integration

## 📝 File Locations

```
/components/ui/*              - Shadcn components
/components/clickup-*.tsx     - Main UI components
/components/home-page.tsx     - Dashboard
/styles/globals.css           - CSS variables and base styles
```

## 🔄 Version

**Current Version**: 2.2  
**Features**: Dark & Light Mode + Mobile Responsive  
**Status**: Production Ready

## 🌓 Theme Switching

The system now supports both light and dark modes:
- **Toggle Location**: Header (next to Create Task button)
- **Icons**: Sun (dark mode) / Moon (light mode)
- **Persistence**: Saved to localStorage
- **Default**: Dark mode
- **Hook**: `useTheme()` from `./components/theme-provider`

### ⚠️ Important: Theme-Aware Styling
- **NEVER** use fixed colors like `hover:bg-[#1A1B20]`
- **ALWAYS** use CSS variables like `hover:bg-[var(--muted)]`
- See `theme-aware-styling.md` for complete guide
- Most common hover state: `hover:bg-[var(--muted)]`

## 📱 Mobile Responsive

Fully responsive design with mobile-first approach:
- **Breakpoints**: sm(640px), md(768px), lg(1024px)
- **Sidebar**: Sheet drawer on mobile, fixed on desktop (>= 1024px)
- **Header**: Hamburger menu, adaptive buttons, hidden search on mobile
- **View Tabs**: Horizontal scroll with icon-only on mobile
- **Touch Targets**: Minimum 36px for comfortable interaction
- **See**: `mobile-responsive.json` for complete specifications

---

**For detailed specifications, refer to individual JSON files in this directory.**
