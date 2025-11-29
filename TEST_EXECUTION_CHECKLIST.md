# Test Execution Checklist

## How to Use This Document

1. **Status Legend:**
   - ⬜ Not Started
   - 🔄 In Progress
   - ✅ Pass
   - ❌ Fail
   - ⚠️ Blocked
   - 🔍 Needs Review

2. **Priority:**
   - **P0:** Critical - Blocks release
   - **P1:** High - Major feature
   - **P2:** Medium - Nice to have
   - **P3:** Low - Enhancement

3. **Execution Notes:**
   - Add notes for each test case
   - Include screenshots for failures
   - Link to bug reports if issues found
   - Note browser/device used

---

## 1. Landing Page Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| LP-01 | Hero renders on desktop | P0 | ⬜ | | | | |
| LP-02 | Responsive layout tablets | P1 | ⬜ | | | | |
| LP-03 | CTA scroll tracking | P1 | ⬜ | | | | |
| LP-04 | SEO meta/security headers | P0 | ⬜ | | | | |
| LP-05 | Accessibility | P1 | ⬜ | | | | |
| LP-06 | Failover content | P2 | ⬜ | | | | |

**Test Environment:** `http://localhost:3000` or staging URL

**Pre-conditions:**
- Server is running
- Database is accessible
- No browser cache

**Notes Section:**
- LP-01: 
- LP-02: 
- LP-03: 
- LP-04: 
- LP-05: 
- LP-06: 

---

## 2. Sign In Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| SI-01 | Valid email/PIN authentication | P0 | ⬜ | | | | |
| SI-02 | Invalid PIN throttle | P0 | ⬜ | | | | |
| SI-03 | Google OAuth happy path | P0 | ⬜ | | | | |
| SI-04 | Session fixation protection | P1 | ⬜ | | | | |
| SI-05 | Remember me persistence | P2 | ⬜ | | | | |
| SI-06 | Performance budget | P2 | ⬜ | | | | |
| SI-07 | Remember Me = True: Log in, close browser, reopen — should still be logged in | P1 | ⬜ | | | | |
| SI-08 | Remember Me = False: Log in, close all tabs, reopen — should be logged out | P1 | ⬜ | | | | |
| SI-09 | Device switching: Log in with "Remember Me" from Device A, then Device B — Device A should be logged out | P1 | ⬜ | | | | |

**Test Accounts:**
- Email: `test-user@example.com`
- PIN: `123456` (dev mode) or check console
- Google: Use test Google account

**Pre-conditions:**
- Test user exists in database
- Email service configured (or using Ethereal)

**Notes Section:**
- SI-01: 
- SI-02: 
- SI-03: 
- SI-04: 
- SI-05: 
- SI-06: 
- SI-07: 
- SI-08: 
- SI-09: 

---

## 3. Sign Up Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| SU-01 | Email signup success | P0 | ⬜ | | | | |
| SU-02 | Weak password rejection | P1 | ⬜ | | | | |
| SU-03 | Google signup new account | P0 | ⬜ | | | | |
| SU-04 | Email verification link reuse | P2 | ⬜ | | | | |
| SU-05 | Welcome wizard resume | P2 | ⬜ | | | | |
| SU-06 | Signup rate limiting | P1 | ⬜ | | | | |

**Test Data:**
- New email: `newuser-{timestamp}@example.com`
- Invalid emails: `invalid`, `@example.com`, `test@`

**Notes Section:**
- SU-01: 
- SU-02: 
- SU-03: 
- SU-04: 
- SU-05: 
- SU-06: 

---

## 4. Home Page Dashboard Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| HP-01 | Widgets load | P0 | ⬜ | | | | |
| HP-02 | Personalization | P2 | ⬜ | | | | |
| HP-03 | Quick action shortcut | P1 | ⬜ | | | | |
| HP-04 | Notification badge updates | P1 | ⬜ | | | | |
| HP-05 | Unauthorized widget | P1 | ⬜ | | | | |
| HP-06 | Large data performance | P2 | ⬜ | | | | |

**Pre-conditions:**
- User is logged in
- User has at least one space
- User has some tasks/activities

**Notes Section:**
- HP-01: 
- HP-02: 
- HP-03: 
- HP-04: 
- HP-05: 
- HP-06: 

---

## 5. Sidebar Navigation Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| SB-01 | Default state | P0 | ⬜ | | | | |
| SB-02 | Collapse/expand persistence | P2 | ⬜ | | | | |
| SB-03 | Keyboard navigation | P1 | ⬜ | | | | |
| SB-04 | Permission filtering | P0 | ⬜ | | | | |
| SB-05 | Deep links | P2 | ⬜ | | | | |
| SB-06 | Resize stress | P2 | ⬜ | | | | |

**Test Roles:**
- Admin user
- Regular user
- Read-only user
- Guest user

**Notes Section:**
- SB-01: 
- SB-02: 
- SB-03: 
- SB-04: 
- SB-05: 
- SB-06: 

---

## 6. Header Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| HD-01 | Global search result | P0 | ⬜ | | | | |
| HD-02 | Notification dropdown | P1 | ⬜ | | | | |
| HD-03 | Quick-create permissions | P1 | ⬜ | | | | |
| HD-04 | Responsive collapse | P2 | ⬜ | | | | |
| HD-05 | CSRF token presence | P0 | ⬜ | | | | |
| HD-06 | Logout all sessions | P1 | ⬜ | | | | |

**Test Data:**
- Search terms: existing task names, non-existent terms
- Multiple browser sessions for HD-06

**Notes Section:**
- HD-01: 
- HD-02: 
- HD-03: 
- HD-04: 
- HD-05: 
- HD-06: 

---

## 7. Profile & Settings Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| PR-01 | Update profile info | P1 | ⬜ | | | | |
| PR-02 | Password change invalidates sessions | P0 | ⬜ | | | | |
| PR-03 | Enable MFA | P1 | ⬜ | | | | |
| PR-04 | Session management list | P2 | ⬜ | | | | |
| PR-05 | GDPR export | P2 | ⬜ | | | | |
| PR-06 | Accessibility | P1 | ⬜ | | | | |

**Test Scenarios:**
- Profile updates with valid/invalid data
- Multiple active sessions
- MFA setup and verification

**Notes Section:**
- PR-01: 
- PR-02: 
- PR-03: 
- PR-04: 
- PR-05: 
- PR-06: 

---

## 8. Space Overview Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| SO-01 | Metrics accuracy | P0 | ⬜ | | | | |
| SO-02 | Activity feed pagination | P2 | ⬜ | | | | |
| SO-03 | Member visibility by role | P0 | ⬜ | | | | |
| SO-04 | Audit log export | P2 | ⬜ | | | | |
| SO-05 | Performance large space | P2 | ⬜ | | | | |
| SO-06 | Offline state | P2 | ⬜ | | | | |

**Test Spaces:**
- Space with 10 tasks (normal)
- Space with 500+ tasks (performance)
- Space with 20+ members (visibility)

**Notes Section:**
- SO-01: 
- SO-02: 
- SO-03: 
- SO-04: 
- SO-05: 
- SO-06: 

---

## 9. Space Configuration Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| SC-01 | Template CRUD | P0 | ⬜ | | | | |
| SC-02 | Workflow stage editing | P0 | ⬜ | | | | |
| SC-03 | Role permission edit | P0 | ⬜ | | | | |
| SC-04 | Concurrent edit conflict | P2 | ⬜ | | | | |
| SC-05 | Import template security | P1 | ⬜ | | | | |
| SC-06 | Performance bulk task move | P2 | ⬜ | | | | |

**Test Templates:**
- Create test template
- Import/export templates
- Workflow with multiple stages

**Notes Section:**
- SC-01: 
- SC-02: 
- SC-03: 
- SC-04: 
- SC-05: 
- SC-06: 

---

## 10. Individual Tabs Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| TB-TASK-01 | Task tab filtering | P0 | ⬜ | | | | |
| TB-DOC-01 | Collaborative doc | P1 | ⬜ | | | | |
| TB-CAL-01 | Calendar timezone | P2 | ⬜ | | | | |
| TB-CHAT-01 | Chat encryption | P1 | ⬜ | | | | |
| TB-ANALYTICS-01 | Charts performance | P2 | ⬜ | | | | |
| TB-ACCESS-01 | Tab-level RBAC | P0 | ⬜ | | | | |

**Notes Section:**
- TB-TASK-01: 
- TB-DOC-01: 
- TB-CAL-01: 
- TB-CHAT-01: 
- TB-ANALYTICS-01: 
- TB-ACCESS-01: 

---

## 11. Task Creation & Management Tests

| ID | Test Case | Priority | Status | Notes | Browser | Date | Tester |
|----|-----------|----------|--------|-------|---------|------|--------|
| TC-01 | Basic task creation | P0 | ⬜ | | | | |
| TC-02 | Attachment upload limits | P1 | ⬜ | | | | |
| TC-03 | Automation trigger | P2 | ⬜ | | | | |
| TC-04 | Offline draft | P2 | ⬜ | | | | |
| TC-05 | Bulk task creation perf | P2 | ⬜ | | | | |
| TC-06 | Audit trail integrity | P1 | ⬜ | | | | |

**Test Files:**
- Small file: < 1MB
- Large file: > 100MB (should be rejected)
- Various file types: PDF, images, documents

**Notes Section:**
- TC-01: 
- TC-02: 
- TC-03: 
- TC-04: 
- TC-05: 
- TC-06: 

---

## Test Execution Summary

### Overall Progress

**Total Test Cases:** 69
**Completed:** 0
**In Progress:** 0
**Passed:** 0
**Failed:** 0
**Blocked:** 0

### By Priority

| Priority | Total | Passed | Failed | Blocked | % Complete |
|----------|-------|--------|--------|---------|------------|
| P0 (Critical) | 0 | 0 | 0 | 0 | 0% |
| P1 (High) | 0 | 0 | 0 | 0 | 0% |
| P2 (Medium) | 0 | 0 | 0 | 0 | 0% |
| P3 (Low) | 0 | 0 | 0 | 0 | 0% |

### By Module

| Module | Total | Passed | Failed | % Complete |
|--------|-------|--------|--------|------------|
| Landing Page | 6 | 0 | 0 | 0% |
| Sign In | 9 | 0 | 0 | 0% |
| Sign Up | 6 | 0 | 0 | 0% |
| Home Page | 6 | 0 | 0 | 0% |
| Sidebar | 6 | 0 | 0 | 0% |
| Header | 6 | 0 | 0 | 0% |
| Profile | 6 | 0 | 0 | 0% |
| Space Overview | 6 | 0 | 0 | 0% |
| Space Config | 6 | 0 | 0 | 0% |
| Tabs | 6 | 0 | 0 | 0% |
| Task Creation | 6 | 0 | 0 | 0% |

---

## Bug Tracking

### Critical Bugs Found

| Bug ID | Test Case | Description | Status | Assigned To |
|--------|-----------|-------------|--------|-------------|
| | | | | |

### High Priority Bugs

| Bug ID | Test Case | Description | Status | Assigned To |
|--------|-----------|-------------|--------|-------------|
| | | | | |

---

## Test Environment Information

**Test Date Range:** [Start Date] to [End Date]
**Testers:** [Names]
**Browsers Tested:** Chrome, Edge, Firefox, Safari
**Devices Tested:** Desktop, Tablet, Mobile
**Environment:** Local / Staging / Production

---

## Notes & Observations

### General Issues:
- 

### Performance Issues:
- 

### Usability Issues:
- 

### Security Concerns:
- 

---

**Last Updated:** [Date]
**Next Review:** [Date]




