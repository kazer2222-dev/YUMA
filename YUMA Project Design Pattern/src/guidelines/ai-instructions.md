# AI Implementation Instructions

## How to Use This Design System

### Step 1: Load Design Tokens
Read `/guidelines/design-tokens.json` first. This contains:
- All colors for both light and dark modes
- Typography scale and weights
- Spacing system
- Border radius values
- Layout measurements

Read `/guidelines/theme-switching.json` for:
- Theme switching implementation
- Light/dark mode color mappings
- Toggle button specifications

### Step 2: Understand Component Patterns
Read `/guidelines/component-patterns.json` for:
- Button variants and sizes
- Card styling
- Input fields
- Badges
- Avatars
- Navigation items
- Tabs

### Step 3: Apply Typography Rules
Read `/guidelines/typography-rules.json`:
- Use h1 for page titles
- Use h2 for section headers
- Use h3 for subsections
- Use h4 for card/task/milestone titles
- Use p for body text
- **Never override font properties with Tailwind**

### Step 4: Follow Layout Structure
Read `/guidelines/layout-structure.json` for:
- Application layout (sidebar + main content)
- Header and navigation specifications
- Responsive breakpoints
- Spacing and positioning

### Step 5: Apply Interaction States
Read `/guidelines/interaction-states.json` for:
- Hover effects
- Active states
- Focus indicators
- Disabled states
- Animation timings

## Quick Implementation Guide

### Creating a Button
```tsx
// Primary button
<button 
  style={{ 
    backgroundColor: '#4353FF',
    color: 'white',
    height: '2.25rem',
    padding: '0 1rem',
    borderRadius: '0.5rem'
  }}
  className="hover:opacity-90 transition-all duration-150"
>
  Click Me
</button>
```

### Creating a Card
```tsx
<div 
  style={{
    backgroundColor: '#11121A',
    borderRadius: '0.5rem',
    padding: '0.75rem'
  }}
  className="hover:bg-[#1A1B20] transition-all duration-150 cursor-pointer"
>
  <h4>Card Title</h4>
  <p className="text-[#7D8089]">Card description</p>
</div>
```

### Creating a Navigation Item
```tsx
<button
  style={{
    padding: '0.625rem 1rem',
    borderRadius: '0.5rem',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center'
  }}
  className="hover:bg-[#1A1B20] transition-all duration-150 w-full text-left"
>
  <HomeIcon style={{ width: '1.25rem', height: '1.25rem', color: '#4353FF' }} />
  <span>Home</span>
</button>
```

### Using Typography
```tsx
// Page title
<h1>Dashboard</h1>

// Section header
<h2>Recent Tasks</h2>

// Card title
<h4>Task Name</h4>

// Body text
<p>This is a description of the task.</p>

// Secondary text
<p className="text-[#7D8089]">Due date: Nov 5, 2025</p>
```

## Color Usage Examples

### Backgrounds
```tsx
// Main background
<div style={{ backgroundColor: '#0F1014' }}>

// Card background
<div style={{ backgroundColor: '#11121A' }}>

// Input background
<input style={{ backgroundColor: '#1A1B20' }} />
```

### Text Colors
```tsx
// Primary text
<span style={{ color: '#E4E5E7' }}>Primary Text</span>

// Secondary text
<span style={{ color: '#7D8089' }}>Secondary Text</span>
```

### Brand Colors
```tsx
// Primary button
<button style={{ backgroundColor: '#4353FF' }}>Primary</button>

// Status colors
<span style={{ color: '#10B981' }}>Done</span>
<span style={{ color: '#F59E0B' }}>Medium Priority</span>
```

## Layout Implementation

### Main Application Structure
```tsx
<div className="flex h-screen">
  {/* Sidebar - 256px wide */}
  <aside className="w-64" style={{ backgroundColor: '#0C0D11' }}>
    {/* Sidebar content */}
  </aside>
  
  {/* Main Content */}
  <div className="flex-1 flex flex-col ml-64">
    {/* Header - 56px tall */}
    <header className="h-14" style={{ backgroundColor: '#0F1014' }}>
      {/* Header content */}
    </header>
    
    {/* View Navigation - 48px tall */}
    <nav className="h-12" style={{ backgroundColor: '#0F1014' }}>
      {/* Navigation tabs */}
    </nav>
    
    {/* Content Area */}
    <main className="flex-1 overflow-auto" style={{ padding: '1.5rem' }}>
      {/* Page content */}
    </main>
  </div>
</div>
```

## Common Mistakes to Avoid

1. ❌ **Don't** use Tailwind font classes (text-xl, font-bold, etc.)
   ✅ **Do** use semantic HTML (h1, h2, h3, h4, p)

2. ❌ **Don't** create custom colors
   ✅ **Do** use colors from design-tokens.json

3. ❌ **Don't** use arbitrary spacing
   ✅ **Do** use spacing system (0.25rem, 0.5rem, 0.75rem, 1rem, etc.)

4. ❌ **Don't** skip hover/focus states
   ✅ **Do** apply interaction states from interaction-states.json

5. ❌ **Don't** hardcode dimensions
   ✅ **Do** use layout measurements from design-tokens.json

## Testing Checklist

- [ ] Colors match design-tokens.json
- [ ] Typography uses semantic HTML
- [ ] Spacing follows spacing system
- [ ] Hover states work correctly
- [ ] Focus indicators are visible
- [ ] Layout is responsive
- [ ] Component patterns are followed

## Theme Switching

### Using the Theme Hook
```tsx
import { useTheme } from "./components/theme-provider";

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### Theme Toggle Button
```tsx
import { ThemeToggle } from "./components/theme-toggle";

// Add to header or anywhere
<ThemeToggle />
```

### ⚠️ CRITICAL: Theme-Aware Styling

**NEVER use fixed colors - ALWAYS use CSS variables**

❌ **WRONG - Will break in light mode:**
```tsx
className="hover:bg-[#1A1B20]"  // Fixed dark color
className="hover:bg-black"       // Fixed color
className="bg-gray-900"          // Tailwind fixed color
```

✅ **CORRECT - Theme adapts automatically:**
```tsx
className="hover:bg-[var(--muted)]"           // Most common hover
className="hover:bg-[var(--muted)]/50"        // Subtle hover (50% opacity)
className="hover:bg-[var(--primary)]/90"      // Button hover (90% opacity)
className="bg-[var(--card)]"                  // Card background
className="text-[var(--foreground)]"          // Text color
className="border-[var(--border)]"            // Border color
```

### Common Theme Variables
- `--background` - Main background (dark: #0F1014, light: #FFFFFF)
- `--card` - Card background (dark: #11121A, light: #F8F9FA)
- `--muted` - **Hover states** (dark: #1E1F24, light: #E9ECEF)
- `--foreground` - Text color (dark: #E4E5E7, light: #1A1A1A)
- `--muted-foreground` - Secondary text (dark: #7D8089, light: #6C757D)
- `--primary` - Brand color (#4353FF in both themes)
- `--border` - Border color (dark: #1E1F24, light: #DEE2E6)

### Complete Styling Guide
See `/guidelines/theme-aware-styling.md` for comprehensive examples and patterns.

## Mobile Responsive Implementation

### Tailwind Breakpoints
- **sm**: 640px (small phones+)
- **md**: 768px (tablets)
- **lg**: 1024px (desktop)

### Common Responsive Patterns
```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:flex">Desktop Only</div>

// Show on mobile, hide on desktop
<div className="lg:hidden">Mobile Only</div>

// Responsive spacing
<div className="p-3 sm:p-6">Adaptive Padding</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  Grid Items
</div>

// Responsive button text
<Button>
  <Icon className="w-4 h-4 sm:mr-2" />
  <span className="hidden sm:inline">Button Text</span>
</Button>

// Horizontal scroll container
<div className="overflow-x-auto scrollbar-hide">
  <div className="flex gap-2">
    Scrollable Items
  </div>
</div>
```

## Reference Files

1. **design-tokens.json** - Core design values (now includes both themes)
2. **typography-rules.json** - Font and text rules
3. **component-patterns.json** - Reusable components
4. **layout-structure.json** - Application layout
5. **interaction-states.json** - Interactive behaviors
6. **theme-switching.json** - Light/dark mode system
7. **mobile-responsive.json** - Mobile responsive specifications

---

**Always start by reading these files before implementing any component.**
