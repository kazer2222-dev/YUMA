# Template Not Showing - Debug Guide

## Issue
Template "New" was created but doesn't appear in the task creation template selector.

## Debugging Steps

### 1. Check Browser Console
Open the browser console (F12) and look for:
- `[CreateTaskDialog] Fetching templates for space: <space-slug>`
- `[CreateTaskDialog] Templates response: {...}`
- `[CreateTaskDialog] Templates loaded: <count>`

### 2. Verify Space Slug
Make sure the template was created in the same space where you're trying to create a task:
- Template was created in which space?
- Are you creating a task in the same space?

### 3. Check API Response
Test the API directly:
```bash
# In browser console or via curl:
fetch('/api/spaces/<space-slug>/templates', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log(d))
```

### 4. Common Issues

**Issue 1: Wrong Space Slug**
- The template might be in a different space
- Check: Template manager shows which space you're in
- Verify: Task creation dialog is using the correct space slug

**Issue 2: API Not Returning Templates**
- Check if API returns `success: true`
- Check if `templates` array is populated
- Check browser console for API errors

**Issue 3: Template Not Saved**
- Verify the template was actually saved (check Templates Manager)
- Check if template appears in the Templates Manager list

**Issue 4: Space Slug Mismatch**
- In "global" mode, make sure space is selected before templates load
- In "board" mode, make sure `spaceSlug` prop is passed correctly

## Quick Fixes

1. **Refresh the dialog**: Close and reopen the Create Task dialog
2. **Check space**: Make sure you're in the same space where template was created
3. **Check console**: Look for any errors in browser console
4. **Verify API**: Test the templates API endpoint directly

## What Was Added

- Console logging to track template fetching
- Better UI feedback when no templates are available
- Debugging information to help diagnose the issue

---

**Next Steps**: Check the browser console when opening the Create Task dialog to see what's happening.


























