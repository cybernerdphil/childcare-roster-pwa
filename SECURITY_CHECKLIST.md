# SECURITY VALIDATION CHECKLIST

**PWA Version:** 2.1.0  
**Validation Date:** ____________________  
**Validated By:** ____________________  
**Status:** ☐ PASS  ☐ FAIL

---

## 1. INPUT SANITISATION

### 1.1 XSS (Cross-Site Scripting) Prevention

- [ ] **No inline event handlers** (onclick, onload, etc.)
  - Check: `grep -r "onclick=" index.html` → should be empty
  - Check: `grep -r "onload=" index.html` → should be empty
  - All event listeners attached via `addEventListener()` ✓

- [ ] **Form input sanitisation working**
  - Test: Type `<script>alert('xss')</script>` in name field
  - Expected: Dangerous chars stripped, no error
  - Actual: _______________________________

- [ ] **No innerHTML for user data**
  - Check: `grep -r "innerHTML" js/app.js`
  - Should only use `innerHTML` for static HTML
  - User data inserted via `textContent` or `createElement()` ✓

- [ ] **Special characters properly escaped**
  - Test: Enter `"<>&'"` in email field
  - Submit and check downloaded JSON
  - Expected: Characters either stripped or valid in JSON
  - Actual: _______________________________

### 1.2 Email Validation

- [ ] **Email regex matches RFC 5322 basic format**
  - Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` ✓
  - Test: `test@example.com` → ✓ passes
  - Test: `invalid.email` → ✗ fails
  - Test: `test@example` → ✗ fails

- [ ] **Email max length enforced (150 chars)**
  - Test: Paste 200-char email
  - Expected: Truncated to 150
  - Actual: _______________________________

### 1.3 Time Validation

- [ ] **Time format validation (HH:MM only)**
  - Pattern: `/^\d{2}:\d{2}$/` ✓
  - Test: `07:30` → ✓ passes
  - Test: `7:30` → ✗ fails (not padded)
  - Test: `25:00` → ✗ fails (invalid hour)

- [ ] **Time selects can't be manually edited**
  - Check: HTML uses `<select>` for times (not text input) ✓

### 1.4 Other Fields

- [ ] **Name: max 100 chars, sanitised**
  - Test: Enter 150 chars
  - Expected: Truncated and dangerous chars removed
  - Actual: _______________________________

- [ ] **Phone: max 20 chars, numbers+spaces+hyphens only**
  - Test: Enter `0400 000 000` → ✓ allowed
  - Test: Enter `0400<script>` → dangerous chars removed
  - Actual: _______________________________

- [ ] **Qualification: max 80 chars, sanitised**
  - Test: Type and verify sanitisation
  - Actual: _______________________________

### 1.5 Form Validation Errors

- [ ] **Required field validation works**
  - Leave name blank, try submit
  - Expected: Error shown, form not submitted
  - Actual: _______________________________

- [ ] **Email validation catches invalid emails**
  - Enter `notanemail`, try submit
  - Expected: Error shown
  - Actual: _______________________________

---

## 2. THREAT SURFACE REDUCTION

### 2.1 No External Script Dependencies

- [ ] **No external JavaScript loaded**
  - Check: No `<script src="https://...">` tags (except module scripts)
  - Google Fonts CSS is cached offline ✓
  - No jQuery, no Bootstrap.js, no other CDN scripts
  - Actual: _______________________________

- [ ] **No eval() or Function() calls**
  - Check: `grep -r "eval(" *.js *.html` → should be empty
  - Check: `grep -r "Function(" *.js *.html` → should be empty
  - Actual: _______________________________

- [ ] **No dynamic script injection**
  - Check: No `document.write()`
  - Check: No `createElement('script')` with external src
  - Actual: _______________________________

### 2.2 Content Security Policy (CSP)

- [ ] **CSP meta tag present and correct**
  - Check: `<meta http-equiv="Content-Security-Policy"...>`
  - Should include: `default-src 'self'`, `script-src 'self'`
  - Test in DevTools → Console, check for CSP violations
  - Actual violations: _______________________________

- [ ] **CSP doesn't allow unsafe remote sources**
  - Should NOT allow: `*.cdn.com`, `*.googleapis.com` scripts
  - Only `fonts.googleapis.com` allowed for CSS (not JS)
  - Actual: _______________________________

### 2.3 MIME Type Checking

- [ ] **X-Content-Type-Options header set**
  - Server should return: `X-Content-Type-Options: nosniff`
  - Test in DevTools → Network → Response Headers
  - Actual: _______________________________

- [ ] **Correct MIME types served**
  - `.js` → `application/javascript`
  - `.css` → `text/css`
  - `.json` → `application/json`
  - Test: Inspect Network tab response headers
  - Actual: _______________________________

### 2.4 Referrer Policy

- [ ] **Referrer-Policy header set**
  - Meta tag: `<meta name="referrer" content="no-referrer">`
  - Ensures user privacy when clicking links
  - Actual: _______________________________

---

## 3. SERVICE WORKER SECURITY

### 3.1 Versioned Caches

- [ ] **Cache versions in service-worker.js**
  - Should have: `const VERSION = '1'`
  - Cache names: `static-v1`, `font-v1`, `external-v1` ✓
  - Old caches automatically deleted on update
  - Test: Update VERSION to 2, reload
  - Old cache should be deleted
  - Actual: _______________________________

### 3.2 Request Validation

- [ ] **Only GET requests cached**
  - Check: `shouldCacheRequest()` rejects POST/PUT/DELETE
  - No form submission data cached ✓
  - No sensitive operations cached
  - Actual: _______________________________

- [ ] **Third-party domains whitelisted**
  - Only `fonts.googleapis.com` and `fonts.gstatic.com` allowed
  - Check: `EXTERNAL_WHITELIST` array in service-worker.js
  - Test: Try to load script from `evil.com` → should not cache
  - Actual: _______________________________

### 3.3 Safe Activation

- [ ] **Old cache versions deleted on activation**
  - Check: `activate` event deletes non-matching cache versions
  - No stale caches left behind
  - Actual: _______________________________

- [ ] **Service Worker claims clients immediately**
  - Check: `self.clients.claim()` in activate event ✓

### 3.4 Fetch Handler

- [ ] **Cache-first strategy for static assets**
  - HTML, CSS, JS served from cache first
  - Network fallback if cache miss
  - Offline fallback if network fails
  - Actual: _______________________________

- [ ] **Network-first for external resources**
  - Fonts fetched from network first
  - Cache fallback for offline
  - Prevents serving stale fonts indefinitely
  - Actual: _______________________________

---

## 4. SECURE STORAGE

### 4.1 No Sensitive Data in localStorage

- [ ] **Form data NOT persisted to localStorage**
  - Check: No `localStorage.setItem()` calls in app.js
  - Form data only exists in memory ✓
  - Data cleared when page closed
  - Actual: _______________________________

- [ ] **No passwords, tokens, or secrets stored**
  - Check: grep for `password`, `token`, `secret` → should not find
  - Only safe data (if any) can be localStorage
  - Actual: _______________________________

### 4.2 JSON Payload Validation

- [ ] **Downloaded JSON validated before save**
  - Check: `validateJSONStructure()` called before download
  - Payload checked against allowedKeys whitelist
  - No prototype pollution possible
  - Actual: _______________________________

---

## 5. OFFLINE FUNCTIONALITY

### 5.1 App Works Completely Offline

- [ ] **After installation, can use offline**
  - Procedure:
    1. Install app
    2. Open from home screen
    3. Turn off WiFi + cellular
    4. All form fields load
    5. Can select availability
    6. Can submit (downloads file, opens email)
  - Expected: All functionality works ✓
  - Actual: _______________________________

- [ ] **All CSS and JS assets cached**
  - Check: DevTools → Application → Cache Storage
  - Should see: static-v1, font-v1
  - All required files present
  - Actual files in cache: _______________________________

- [ ] **Fonts render offline**
  - Google Fonts CSS downloaded and cached
  - Font files (.woff2) downloaded and cached
  - No fallback font required
  - Actual: _______________________________

---

## 6. PUSH NOTIFICATIONS (Android only)

### 6.1 Permission Request

- [ ] **Permission requested explicitly (not auto-granted)**
  - Check: No auto-subscription code
  - User must click to enable (if implemented)
  - Clear explanation provided
  - Actual: _______________________________

- [ ] **iOS gracefully degraded**
  - Check: `isIOS()` returns true on iOS
  - Check: Push code skipped or disabled
  - No errors in console on iOS
  - Actual (iOS device): _______________________________

- [ ] **Permission state checked**
  - Test: Check `Notification.permission` in console
  - Should be: `'default'`, `'granted'`, or `'denied'`
  - Actual: _______________________________

### 6.2 Notification Display

- [ ] **Test notification can be sent**
  - Command: `window.PUSH.sendTestNotification()`
  - Expected: Notification appears on home screen
  - Actual (Android): _______________________________

- [ ] **Notification click handler works**
  - Click notification
  - Expected: App opens/focuses
  - Actual: _______________________________

---

## 7. SECURE TRANSMISSION

### 7.1 HTTPS Enforcement

- [ ] **HTTPS only (no HTTP)**
  - Address bar shows 🔒
  - No mixed content warnings
  - Check: DevTools → Security tab
  - Actual: _______________________________

- [ ] **HSTS header set (optional)**
  - Server should return: `Strict-Transport-Security: max-age=31536000`
  - Forces HTTPS for future visits
  - Test: DevTools → Network → Response Headers
  - Actual: _______________________________

### 7.2 Email Link Security

- [ ] **Email link uses mailto: with encoding**
  - Check: `window.location.href = 'mailto:...'`
  - Email address and body properly encoded
  - No injection possible via email params
  - Test: Submit and verify email opens correctly
  - Actual: _______________________________

### 7.3 File Download Security

- [ ] **Downloaded JSON file is valid**
  - Download file
  - Check: Valid JSON (no syntax errors)
  - Check: No malicious content
  - Check: File size reasonable (< 5KB)
  - Actual size: _______________________________

---

## 8. MANIFEST & INSTALLABILITY

### 8.1 Manifest Valid

- [ ] **manifest.json parses without errors**
  - Test: DevTools → Application → Manifest
  - Should show app name, icons, colors
  - No red X errors
  - Actual errors: _______________________________

- [ ] **All manifest fields present**
  - [ ] `name` - full app name
  - [ ] `short_name` - ≤12 chars
  - [ ] `description` - clear purpose
  - [ ] `start_url` - points to index.html
  - [ ] `display` - "standalone"
  - [ ] `orientation` - "portrait"
  - [ ] `theme_color` - valid hex color
  - [ ] `background_color` - valid hex color
  - [ ] `icons` - multiple sizes

### 8.2 Icons

- [ ] **Icons render correctly**
  - 192x192: shown on home screen (Android)
  - 512x512: shown in app drawer
  - 180x180: shown on iOS home screen
  - SVG data URIs work (or PNG files found)
  - Actual icons tested: _______________________________

- [ ] **Icon maskable support**
  - Check: `"purpose": "any maskable"` in manifest ✓
  - Android Adaptive Icons work
  - Icons don't get cropped on newer Android
  - Actual: _______________________________

---

## 9. RESPONSIVE DESIGN & ACCESSIBILITY

### 9.1 Mobile Responsive

- [ ] **App works on small screens (375px)**
  - Test on: iPhone 6/7/8 or 375px viewport
  - All form fields readable
  - No horizontal scroll
  - Buttons tappable (≥44px)
  - Actual: _______________________________

- [ ] **App works on large screens (1200px+)**
  - Test on: Desktop or 1920px viewport
  - Layout doesn't break
  - Content readable
  - Actual: _______________________________

### 9.2 Keyboard Navigation

- [ ] **Tab order correct**
  - Press Tab, focus moves through form logically
  - No focus traps
  - Can submit with keyboard (Enter on button)
  - Actual: _______________________________

- [ ] **Form labels associated with inputs**
  - Check: All `<input>` has `<label for="id">`
  - Click label highlights input
  - Screen readers can read labels
  - Actual: _______________________________

### 9.3 Color Contrast

- [ ] **Text contrast ≥ 4.5:1**
  - Test: Use WebAIM Contrast Checker
  - Check headings, body text, links
  - All pass ≥ 4.5:1 ratio
  - Actual contrast ratios: _______________________________

---

## 10. CONSOLE & ERRORS

### 10.1 No Console Errors

- [ ] **Open DevTools → Console**
  - Should be clean (no red X errors)
  - Warnings acceptable (yellow ⚠)
  - Check after page load
  - Actual errors: _______________________________

- [ ] **Service Worker logs appear**
  - Should see: `[SW] Service worker v1 loaded`
  - Should see: `✓ Sanitisation module loaded`
  - Should see: `✓ Application initialized`
  - Actual console output: _______________________________

### 10.2 No Network Errors

- [ ] **DevTools → Network tab clean**
  - No 404 Not Found errors
  - No blocked resources (CORS)
  - All assets download successfully
  - Status codes: 200 for assets
  - Actual errors: _______________________________

---

## 11. PERFORMANCE

### 11.1 Fast Load Time

- [ ] **Page loads in ≤ 2 seconds (first load)**
  - Test: DevTools → Lighthouse
  - Measure on slow 3G network
  - Actual load time: _______________________________

- [ ] **Offline load instant (< 500ms)**
  - Turn off network
  - Load app
  - Should appear immediately from cache
  - Actual load time: _______________________________

### 11.2 Lighthouse PWA Score

- [ ] **Lighthouse PWA audit passes**
  - Test: DevTools → Lighthouse → PWA
  - Should get 90+ score
  - Check: "App is installable"
  - Check: "Works offline"
  - Actual score: _______________________________

---

## 12. BROWSER COMPATIBILITY

### 12.1 Modern Browsers Support

- [ ] **Chrome/Edge 80+**
  - Install, offline, push notifications ✓
  - Tested: _______________________________

- [ ] **Firefox 78+**
  - Install, offline ✓
  - Push notifications (Android)
  - Tested: _______________________________

- [ ] **Safari 13+**
  - Install (iOS 13+), offline ✓
  - No push (iOS limitation)
  - Tested: _______________________________

---

## FINAL ASSESSMENT

### Overall Security Score

| Category | Pass/Fail | Notes |
|----------|-----------|-------|
| Input Sanitisation | ☐ ✓ ☐ ✗ | _______________ |
| Threat Surface | ☐ ✓ ☐ ✗ | _______________ |
| Service Worker | ☐ ✓ ☐ ✗ | _______________ |
| Storage | ☐ ✓ ☐ ✗ | _______________ |
| Offline Functionality | ☐ ✓ ☐ ✗ | _______________ |
| Push Notifications | ☐ ✓ ☐ ✗ | _______________ |
| HTTPS & Transmission | ☐ ✓ ☐ ✗ | _______________ |
| Manifest & Install | ☐ ✓ ☐ ✗ | _______________ |
| Responsive Design | ☐ ✓ ☐ ✗ | _______________ |
| Console & Errors | ☐ ✓ ☐ ✗ | _______________ |
| Performance | ☐ ✓ ☐ ✗ | _______________ |
| Browser Support | ☐ ✓ ☐ ✗ | _______________ |

### Deployment Approval

- **Validated By:** ____________________
- **Date:** ____________________
- **Status:** ☐ APPROVED FOR PRODUCTION ☐ NEEDS FIXES

### Issues Found

1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________
4. _________________________________________________________________
5. _________________________________________________________________

### Sign-Off

By signing below, I confirm that this PWA meets all security requirements and is ready for production deployment.

**Signature:** ____________________  
**Title:** ____________________  
**Date:** ____________________

---

**END OF SECURITY CHECKLIST**
