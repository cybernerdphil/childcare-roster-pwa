# Childcare Roster Companion — PWA Deployment Guide

**Version:** 2.1.0  
**Last Updated:** 2026-05-09  
**Status:** Production-Ready ✓

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Security Summary](#security-summary)
3. [Folder Structure](#folder-structure)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Deployment Options](#deployment-options)
   - [GitHub Pages](#github-pages)
   - [Netlify](#netlify)
   - [Firebase Hosting](#firebase-hosting)
   - [Self-Hosted Server](#self-hosted-server)
6. [Testing Installability](#testing-installability)
   - [Android](#android-testing)
   - [iOS](#ios-testing)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

---

## OVERVIEW

This PWA provides a **secure, offline-first form** for educators to submit weekly availability to childcare centres. The app:

- ✅ **Works offline** — all assets cached, no server required
- ✅ **Installable** on Android and iOS (as web app)
- ✅ **Secure** — input sanitization, no external dependencies, CSP headers
- ✅ **Private** — zero server tracking, all data stays on device
- ✅ **Push notifications** — Android only (iOS not supported by Web API)

### What Users Get

1. **On Android:**
   - Install via Chrome: Menu → "Install app" or "Add to Home Screen"
   - Full offline mode, push notifications, home screen icon
   - Appears in app drawer like native app

2. **On iOS:**
   - Install via Safari: Share → "Add to Home Screen"
   - Offline mode works, no push notifications (Apple limitation)
   - Home screen icon, fullscreen mode when launched from home

3. **On Desktop:**
   - Install via Chrome: Address bar → Install button or menu
   - Run as standalone app (no address bar)
   - All offline features

---

## SECURITY SUMMARY

### Input Sanitisation
- ✅ All user input validated in `js/sanitisation.js`
- ✅ Dangerous characters stripped: `< > { } ( ) [ ] ; : " ' ` $ \`
- ✅ Max-length limits enforced on all fields
- ✅ Email validation regex
- ✅ Time format validation (HH:MM)
- ✅ JSON payload validation before download

### Threat Surface Reduction
- ✅ No external CDN dependencies (fonts cached offline)
- ✅ No inline event handlers (`onclick=""` removed)
- ✅ No `eval()`, no `Function()`, no dynamic script injection
- ✅ Content Security Policy (CSP) meta tags included
- ✅ Strict MIME type checking
- ✅ Service Worker cannot be abused (safe activation, request validation)
- ✅ No uncontrolled `postMessage()` usage

### Secure Storage
- ✅ No sensitive data stored in localStorage
- ✅ Form data only exists in memory during session
- ✅ Downloaded JSON file contains no passwords or secrets

### Service Worker Security
- ✅ Versioned caches (`static-v1`, `font-v1`, `external-v1`)
- ✅ Only caches GET requests (safe, idempotent)
- ✅ POST/PUT/DELETE never cached
- ✅ Third-party domains whitelisted (`fonts.googleapis.com` only)
- ✅ Safe activation and cleanup (old cache versions deleted)
- ✅ Security comments explaining each decision

### Push Notification Security (Android only)
- ✅ Explicit permission request (never auto-subscribe)
- ✅ Clear user-facing explanation
- ✅ Graceful fallback for iOS
- ✅ No auto-subscription without consent

---

## FOLDER STRUCTURE

```
/                              # Root (public directory)
├── index.html                 # Updated PWA entry point
├── manifest.json              # Web App Manifest
├── service-worker.js          # Offline caching & push handler
├── css/
│   └── styles.css             # All styles (no external fonts in CSS)
├── js/
│   ├── app.js                 # Main application logic
│   ├── sanitisation.js        # Input sanitisation module
│   └── push-notifications.js  # Push notification handler (optional)
└── .htaccess                  # Apache headers (for HTTPS/CSP)

# Optional directories
/assets/
├── icons/
│   ├── icon-192x192.png       # Android home screen icon
│   ├── icon-512x512.png       # App drawer icon
│   └── icon-180x180.png       # iOS home screen icon
└── images/
    └── [any app images]

/data/
└── [any default data files]
```

**Note:** Icons are embedded as SVG data URIs in `manifest.json` for portability. To use PNG files instead:
1. Create `/assets/icons/` directory
2. Save 192x192, 512x512, 180x180 PNG files
3. Update `manifest.json` with file paths

---

## PRE-DEPLOYMENT CHECKLIST

### Before Deploying to Production

- [ ] **HTTPS enforced** — all traffic must be HTTPS
- [ ] **Manifest valid** — test at https://www.pwabuilder.com/
- [ ] **Service Worker active** — test in DevTools
- [ ] **Offline mode tested** — turn off network, app still works
- [ ] **Icons render** — check all sizes on different devices
- [ ] **Installable** — can install on Android and iOS
- [ ] **CSP headers set** — if using Apache/Nginx
- [ ] **Cache headers correct** — service worker version updated
- [ ] **Console clean** — no errors or warnings
- [ ] **Form submission tested** — JSON file downloads, email opens
- [ ] **Mobile layout tested** — responsive on 375px and up
- [ ] **Push notifications** — Android testing (if enabled)

### Security Audit

- [ ] No inline `onclick`, `onload` handlers
- [ ] No external script sources (except Google Fonts CSS)
- [ ] No `eval()` or `Function()` calls
- [ ] No localStorage sensitive data
- [ ] Form validation working
- [ ] Email sanitisation working
- [ ] Dangerous characters stripped
- [ ] No console errors

---

## DEPLOYMENT OPTIONS

### GITHUB PAGES (Free, Easy)

**Pros:** Free, simple, automatic HTTPS, no server required  
**Cons:** Read-only (can't accept POST requests), static only

#### Steps:

1. **Create repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial PWA deployment"
   git remote add origin https://github.com/USERNAME/childcare-roster
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repo Settings → Pages
   - Source: Deploy from branch
   - Branch: main
   - Directory: / (root)
   - Save

3. **HTTPS (automatic):**
   - GitHub Pages automatically provides HTTPS
   - Check "Enforce HTTPS" in settings

4. **Test:**
   ```
   https://USERNAME.github.io/childcare-roster/
   ```

5. **Custom domain (optional):**
   - Settings → Pages → Custom domain
   - Point DNS records to GitHub Pages IP
   - Example: `childcare.example.com`

---

### NETLIFY (Free, Recommended)

**Pros:** Free tier, automatic HTTPS, excellent PWA support, redirects  
**Cons:** Limited build minutes on free plan

#### Steps:

1. **Connect repository:**
   - Go to https://app.netlify.com
   - "New site from Git"
   - Choose GitHub, select repository
   - Authorize Netlify

2. **Configure build (optional):**
   - Build command: (leave blank — static files)
   - Publish directory: `.` (root)
   - Save and deploy

3. **HTTPS (automatic):**
   - Netlify provides free SSL/TLS certificate
   - Auto-renews

4. **Add headers (optional, for security):**
   - Create `netlify.toml` in root:

   ```toml
   [[headers]]
   for = "/*"
   [headers.values]
     X-Content-Type-Options = "nosniff"
     X-Frame-Options = "SAMEORIGIN"
     Referrer-Policy = "no-referrer"
     Cache-Control = "public, max-age=3600"

   [[headers]]
   for = "/service-worker.js"
   [headers.values]
     Cache-Control = "max-age=0, no-cache, no-store, must-revalidate"

   [[headers]]
   for = "/index.html"
   [headers.values]
     Cache-Control = "max-age=3600"
   ```

5. **Test:**
   ```
   https://[random-name].netlify.app
   ```

6. **Custom domain:**
   - Site settings → Domain → Custom domain
   - Update DNS records

---

### FIREBASE HOSTING (Fast, Reliable)

**Pros:** Fast CDN, automatic HTTPS, Firebase ecosystem  
**Cons:** Requires Google account, paid after free tier

#### Steps:

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Authenticate:**
   ```bash
   firebase login
   ```

3. **Initialize project:**
   ```bash
   firebase init hosting
   ```
   - Select: "Use an existing project" or "Create a new project"
   - Public directory: `.` (current directory)
   - Configure SPA: `No` (static site)
   - Overwrite index.html: `No`

4. **Deploy:**
   ```bash
   firebase deploy
   ```

5. **Test:**
   ```
   https://[project-id].web.app
   ```

6. **Custom domain:**
   - Firebase Console → Hosting → Custom domain
   - Configure DNS

---

### SELF-HOSTED SERVER (Apache/Nginx)

**Pros:** Full control, no dependencies on third parties  
**Cons:** Must manage HTTPS, server, backups

#### Apache (.htaccess)

Create `.htaccess` in root:

```apache
# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache headers
<IfModule mod_headers.c>
  # HTML - no cache
  <FilesMatch "\.html$">
    Header set Cache-Control "max-age=3600, must-revalidate"
  </FilesMatch>

  # Service Worker - no cache
  <FilesMatch "service-worker\.js$">
    Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
  </FilesMatch>

  # CSS, JS, images - long cache
  <FilesMatch "\.(js|css|gif|jpg|jpeg|png|svg)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # Fonts - cache 1 year
  <FilesMatch "\.(woff|woff2|ttf|otf|eot)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # Security headers
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "no-referrer"
</IfModule>

# HTTPS redirect
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# SPA routing (if needed)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Nginx

```nginx
server {
  listen 443 ssl http2;
  server_name example.com www.example.com;

  # HTTPS certificate
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # Security headers
  add_header X-Content-Type-Options "nosniff";
  add_header X-Frame-Options "SAMEORIGIN";
  add_header Referrer-Policy "no-referrer";
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

  # Compression
  gzip on;
  gzip_types text/plain text/css text/javascript
             application/javascript application/json;

  root /var/www/childcare-roster;

  # HTML - 1 hour cache
  location ~* \.html$ {
    add_header Cache-Control "public, max-age=3600, must-revalidate";
  }

  # Service Worker - no cache
  location = /service-worker.js {
    add_header Cache-Control "max-age=0, no-cache, no-store, must-revalidate";
  }

  # Assets - 1 year cache
  location ~* \.(js|css|svg|png|jpg|jpeg|gif|woff|woff2|ttf|otf)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }
}

# HTTP to HTTPS redirect
server {
  listen 80;
  server_name example.com www.example.com;
  return 301 https://$server_name$request_uri;
}
```

---

## TESTING INSTALLABILITY

### ANDROID TESTING

#### Prerequisites
- Android device or Android Studio emulator
- Chrome, Edge, or Firefox browser

#### Steps:

1. **Via Chrome:**
   - Open app URL in Chrome
   - Tap address bar "Install" button
   - Or: Menu (⋮) → "Install app"
   - Follow prompts
   - Icon appears on home screen / app drawer

2. **Via Command Line (Chrome DevTools):**
   ```bash
   # Open DevTools (F12 or Cmd+Option+I)
   # Application tab → Manifest
   # Should show: "App is installable"
   ```

3. **Test Offline:**
   - Install the app
   - Open app from home screen
   - Turn off WiFi and mobile data
   - Verify form still loads and works
   - Submit and download file

4. **Test Push Notifications (Android only):**
   ```javascript
   // Open DevTools Console and run:
   window.PUSH.requestPermission()
     .then(() => window.PUSH.registerForPush())
     .then(() => window.PUSH.sendTestNotification());
   ```

#### DevTools Checklist:
- [ ] Application → Manifest loads without errors
- [ ] Application → Service Workers shows "active"
- [ ] Application → Cache Storage shows all 3 caches
- [ ] Network tab → offline toggle works
- [ ] Console → no errors or warnings

---

### iOS TESTING

#### Prerequisites
- iPhone/iPad with iOS 13+
- Safari browser

#### Steps:

1. **Via Safari:**
   - Open app URL in Safari
   - Tap Share button (square with arrow)
   - Tap "Add to Home Screen"
   - Enter name (default is site title)
   - Tap "Add"
   - Icon appears on home screen

2. **Test Offline:**
   - Add to home screen
   - Tap home screen icon to launch
   - Turn off WiFi and cellular
   - Verify form works offline
   - Submit and check Downloads app

3. **iOS Limitations:**
   - ✗ Push notifications NOT available (Safari limitation)
   - ✗ No service worker in background
   - ✓ Offline mode works
   - ✓ Installs as web app with icon
   - ✓ No address bar in fullscreen mode

#### iOS Checklist:
- [ ] Adds to home screen without errors
- [ ] Launches in fullscreen (no Safari UI)
- [ ] Offline functionality works
- [ ] Form submission works
- [ ] File downloads to Files app

---

## POST-DEPLOYMENT

### Monitor Performance

1. **Service Worker Updates:**
   - Version in `service-worker.js` (increment `VERSION`)
   - Push new version to server
   - Users' SW automatically updates when they revisit

2. **Cache Strategy:**
   - Service Worker caches on first visit
   - Returns cached assets on offline
   - Updates cache on each visit (if available)

3. **Analytics (Optional):**
   - Add Google Analytics to track usage (if privacy-acceptable)
   - Track form submissions (without sensitive data)
   - Monitor error rates

### User Communication

1. **Install Instructions:**
   - Add instructions to your website
   - Example: "Install our app for offline access"

2. **Browser Support Matrix:**
   | Browser | Platform | Install | Offline | Push |
   |---------|----------|---------|---------|------|
   | Chrome | Android | ✓ | ✓ | ✓ |
   | Firefox | Android | ✓ | ✓ | ✓ |
   | Safari | iOS | ✓ | ✓ | ✗ |
   | Edge | Windows/Mac | ✓ | ✓ | ✓ |
   | Chrome | Windows/Mac | ✓ | ✓ | ✓ |

---

## TROUBLESHOOTING

### "App is not installable"

**Causes:**
- HTTPS not enabled
- Manifest.json missing or invalid
- Service Worker not registering
- Icons not found

**Solutions:**
1. Verify HTTPS in address bar (🔒)
2. Check manifest validity:
   ```bash
   curl https://yoursite.com/manifest.json | jq
   ```
3. Open DevTools → Application → Manifest
4. Check console for errors
5. Reload page (Ctrl+Shift+R hard refresh)

---

### Service Worker not updating

**Cause:** Browser cached old SW version

**Solution:**
1. Hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
2. DevTools → Application → Service Workers → Unregister
3. Close and reopen browser
4. Or: Change `VERSION` in `service-worker.js`

---

### Offline mode not working

**Cause:** Assets not cached

**Solutions:**
1. Check DevTools → Application → Cache Storage
2. Verify SW is active (Application → Service Workers)
3. Hard refresh to force precache
4. Check network errors in DevTools → Network tab
5. Ensure all PRECACHE_URLS paths are correct

---

### Form not submitting

**Cause:** Validation failing silently

**Solution:**
1. Open DevTools → Console
2. Check for errors
3. Verify form inputs:
   ```javascript
   // In console:
   document.getElementById('sc-name').value  // should show name
   document.getElementById('sc-email').value  // should show email
   ```

---

### Push notifications not working (Android)

**Cause:** Permission not granted, or VAPID key missing

**Solutions:**
1. Check browser permission settings
2. Clear site data and reset
3. For production push: add VAPID key to `registerForPush()`
4. Test with: `window.PUSH.sendTestNotification()`

---

## SECURITY HARDENING (Advanced)

### Content Security Policy (CSP)

Current CSP in `index.html`:
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self' https://fonts.googleapis.com;
object-src 'none';
base-uri 'self';
form-action 'none';
```

**Strictness Levels:**

- **Current (Recommended):** Allows inline CSS/JS (needed for this app)
- **Stricter:** Move CSS/JS to external files, remove 'unsafe-inline'
- **Strictest:** Add nonce-based inline scripts

### Subresource Integrity (SRI)

For external resources:
```html
<link 
  rel="stylesheet" 
  href="https://fonts.googleapis.com/..."
  integrity="sha384-XXXX..."
  crossorigin="anonymous"
>
```

### Headers via Web Server

**Apache (.htaccess):**
```apache
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "no-referrer"
Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
```

**Nginx:**
```nginx
add_header X-Content-Type-Options "nosniff";
add_header X-Frame-Options "SAMEORIGIN";
add_header Referrer-Policy "no-referrer";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

---

## COMPLIANCE CHECKLIST

### WCAG 2.1 Accessibility (Level A)
- [ ] Color contrast ≥ 4.5:1
- [ ] Keyboard navigation works
- [ ] Labels associated with inputs
- [ ] Form error messages clear

### GDPR Compliance (if users in EU)
- [ ] Privacy policy link included
- [ ] No tracking without consent
- [ ] Data stays on device (✓ this app)
- [ ] User can delete data (form resets)

### CCPA Compliance (if users in California)
- [ ] Clear data practices statement
- [ ] No sale of personal information
- [ ] Data security measures in place (✓ this app)

---

## SUPPORT & UPDATES

### Version Updates

1. **Increment version in:**
   - `manifest.json` → `"version": "2.1.0"`
   - `index.html` → version badge
   - `service-worker.js` → `const VERSION = '1'`

2. **Push to server**

3. **Users get update automatically:**
   - SW checks for updates on next visit
   - New version installed in background
   - Next page load uses new version

---

## CONTACT & FEEDBACK

For security issues, bugs, or feature requests:
- **Email:** p.vieyra@cybersecurityguy.org
- **Issue Tracker:** [Your GitHub Issues]

---

**END OF DEPLOYMENT GUIDE**
