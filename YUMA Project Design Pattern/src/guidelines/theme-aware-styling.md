# Theme-Aware Styling Guide

## Overview
This document outlines best practices for creating theme-aware hover states and styling that work correctly in both light and dark modes.

## ⚠️ Critical Rules

### ❌ NEVER Do This
```tsx
// Fixed dark colors - will look black in light mode
className="hover:bg-[#1A1B20]"
className="hover:bg-black"
className="bg-gray-900"
```

### ✅ ALWAYS Do This
```tsx
// Theme-aware CSS variables - adapts to current theme
className="hover:bg-[var(--muted)]"
className="hover:bg-[var(--accent)]"
className="bg-[var(--card)]"
```

## CSS Variables Reference

### Background Colors
| Variable | Dark Mode | Light Mode | Usage |
|----------|-----------|------------|-------|
| `--background` | #0F1014 | #FFFFFF | Main background |
| `--card` | #11121A | #F8F9FA | Card backgrounds |
| `--muted` | #1E1F24 | #E9ECEF | **Hover states** |
| `--secondary` | #1A1B20 | #F1F3F5 | Secondary elements |
| `--input-background` | #1A1B20 | #F8F9FA | Input fields |
| `--sidebar` | #0C0D11 | #F8F9FA | Sidebar background |

### Text Colors
| Variable | Dark Mode | Light Mode |
|----------|-----------|------------|
| `--foreground` | #E4E5E7 | #1A1A1A |
| `--muted-foreground` | #7D8089 | #6C757D |

### Brand Colors (Same in Both Themes)
| Variable | Color |
|----------|-------|
| `--primary` | #4353FF |
| `--destructive` | #F44336 |

## Common Hover Patterns

### Cards
```tsx
// Standard card hover
<Card className="bg-[var(--card)] hover:bg-[var(--muted)] transition-colors" />

// Subtle card hover (nested cards)
<div className="bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-colors" />

// Shadow hover (theme-agnostic)
<Card className="hover:shadow-md transition-shadow" />
```

### Navigation Items
```tsx
// Navigation button
<button className={`
  ${isActive 
    ? "bg-[var(--primary)] text-white" 
    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
  }
`} />
```

### Task Cards / Interactive Items
```tsx
// Background hover
<div className="bg-[var(--background)] hover:bg-[var(--muted)] transition-colors cursor-pointer" />

// Border hover
<div className="border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors" />
```

### Buttons
```tsx
// Primary button
<Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90" />

// Outline button with themed hover
<Button 
  variant="outline" 
  className="border-[var(--ai-primary)] hover:bg-[var(--ai-primary)]/10" 
/>
```

## Advanced Patterns

### Opacity for Subtle Effects
```tsx
// 50% opacity for very subtle hover
className="hover:bg-[var(--muted)]/50"

// 90% opacity for buttons
className="hover:bg-[var(--primary)]/90"

// 10% opacity for colored backgrounds
className="hover:bg-[var(--ai-primary)]/10"
```

### Combining Multiple States
```tsx
<div className="
  bg-[var(--card)] 
  border-[var(--border)] 
  hover:bg-[var(--muted)] 
  hover:border-[var(--primary)]/50 
  transition-colors 
  cursor-pointer
" />
```

### Gradient Hovers
```tsx
// AI-themed gradient with opacity hover
<Button className="
  bg-gradient-to-r 
  from-[var(--ai-gradient-from)] 
  to-[var(--ai-gradient-to)] 
  hover:opacity-90 
  text-white
" />
```

## Transition Best Practices

### Standard Transition
```tsx
className="transition-colors" // Uses 150ms default
```

### Multiple Properties
```tsx
className="transition-all" // Color, transform, opacity, etc.
```

### Custom Duration
```tsx
className="transition-colors duration-200"
```

## Testing Checklist

When implementing hover states, test:

1. ✅ Dark mode hover (should lighten/highlight)
2. ✅ Light mode hover (should darken/highlight)
3. ✅ Contrast is visible in both modes
4. ✅ No fixed color values (#XXXXXX) used
5. ✅ Smooth transitions (150-250ms)
6. ✅ Cursor changes to pointer where appropriate

## Migration Guide

### Finding Issues
Search your codebase for:
- `hover:bg-[#` (fixed hex colors)
- `hover:bg-gray-` (Tailwind gray colors)
- `hover:bg-black` or `hover:bg-white`

### Fixing Issues
Replace fixed colors with CSS variables:

```tsx
// Before
className="hover:bg-[#1A1B20]"

// After
className="hover:bg-[var(--muted)]"
```

## Examples from YUMA

### Home Page Stats Cards
```tsx
<Card className="
  bg-[var(--card)] 
  border-[var(--border)] 
  p-4 
  hover:bg-[var(--muted)] 
  transition-colors 
  cursor-pointer
" />
```

### Recent Tasks List
```tsx
<div className="
  flex items-center gap-4 
  p-3 rounded-lg 
  bg-[var(--background)] 
  hover:bg-[var(--muted)] 
  transition-colors 
  cursor-pointer
" />
```

### AI Insights
```tsx
<div className="
  p-4 rounded-lg 
  border border-[var(--border)] 
  hover:bg-[var(--muted)]/50 
  transition-colors 
  cursor-pointer
" />
```

### Sidebar Navigation
```tsx
<button className={`
  w-full flex items-center gap-2 
  px-3 py-1.5 rounded 
  transition-colors 
  ${isActive
    ? "bg-[var(--primary)] text-white"
    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
  }
`} />
```

## Summary

**Key Principle**: Always use CSS variables (--var-name) instead of fixed color values to ensure your UI adapts correctly to theme changes.

**Most Common Hover State**: `hover:bg-[var(--muted)]`

This variable automatically:
- Lightens elements in dark mode (#1E1F24)
- Darkens elements in light mode (#E9ECEF)
- Provides appropriate contrast in both themes
