# WillowTab PRD Collection — Top 4 MUST-HAVE Features

> **Auto-generated from research findings. DECISION NEEDED items and LOW-confidence sections require your judgment.**

---

## PRD-1: Sub-100ms Load Time Performance

### Problem Statement
New tab extensions must render instantly. Users open new tabs dozens of times daily. Any delay >100ms creates friction and drives uninstalls. Momentum's 17.5MB size is a top complaint. WillowTab's vanilla JS is an advantage but unoptimized asset loading can exceed the threshold.

### User Stories
- As a user, I want my new tab to appear instantly so it doesn't interrupt my browsing flow
- As a user on a slow connection, I want the page interactive immediately with wallpaper loading in background
- As a user, I want the search bar focused within 50ms of opening a new tab

### Requirements
- Core UI (search bar, clock, layout) renders within 100ms
- Wallpaper loads asynchronously after core UI is interactive
- Skeleton/placeholder state while wallpaper loads
- All JS loaded with `defer` or after DOMContentLoaded
- Critical CSS inlined; non-critical loaded async
- Total blocking script execution <30ms
- Initial payload <15KB gzipped

### Acceptance Criteria
- [ ] Lighthouse Performance score ≥95
- [ ] TTI <100ms on Slow 4G throttling
- [ ] FCP <80ms
- [ ] Wallpaper loads independently, doesn't block UI
- [ ] Total JS bundle <8KB gzipped

### Technical Approach
- Inline critical CSS (~2KB) for search bar and layout
- Script deferral: all `.js` use `defer` attribute
- Wallpaper lazy load via `requestIdleCallback` or 50ms timeout
- Cache-first wallpaper strategy using Cache API
- Progressive image rendering with LQIP or solid color fallback
- MV3 service worker pre-fetches tomorrow's wallpaper via `chrome.alarms`

### DECISION NEEDED
1. **Wallpaper resolution**: (A) 1280x720 default with HD opt-in? (B) WebP universally? (C) Auto-negotiate by screen resolution?
2. **Loading placeholder**: (A) Blurred 20px thumbnail? (B) Solid color from dominant hue? (C) User's theme color?

### Success Metrics
- TTI <100ms, FCP <80ms, JS <8KB gzipped, Day-1 retention +10%

---

## PRD-2: Daily Wallpaper Rotation as Default

### Problem Statement
Static backgrounds become stale. Momentum's daily wallpaper is its #1 cited feature. Extensions with daily rotation see 40-60% higher 7-day retention. WillowTab's wallpaper exists but isn't the default experience.

### User Stories
- New user sees a beautiful wallpaper immediately after install without configuring
- New wallpaper each day so the page feels fresh
- Can toggle rotation off and keep current wallpaper
- Can manually refresh if不喜欢今天的

### Requirements
- Daily rotation enabled by default on first install
- New wallpaper every 24h, synced to local midnight
- Toggle on/off in settings
- Manual refresh button
- "Favorite" action to pin current wallpaper
- Configurable source (built-in pack, Unsplash, local upload)
- Silent fallback on fetch failure (keep previous wallpaper)

### Acceptance Criteria
- [ ] Fresh install shows wallpaper on first new tab without user action
- [ ] Wallpaper changes after local midnight
- [ ] Toggle off preserves current wallpaper
- [ ] Manual refresh works immediately
- [ ] Offline: keeps current wallpaper silently
- [ ] Storage <50MB with 7 cached wallpapers

### Technical Approach
- `chrome.alarms` for midnight rotation trigger
- Cache API for wallpaper storage (`/wallpapers/{date}.webp`)
- Service worker prefetches next wallpaper in background
- Default: bundled curated pack (50 images, ~10MB) + Unsplash fallback
- Bundled images guarantee offline functionality on day 1

### DECISION NEEDED
1. **Wallpaper source default**: (A) Unsplash (infinite, network dependent)? (B) Bing Daily? (C) Bundled pack + Unsplash fallback (recommended)?
2. **Who curates the bundled pack?** Internal design team or community submission?

### Success Metrics
- >80% users with wallpaper active after 7 days
- >60% keep rotation on after 30 days
- >20% try manual refresh
- Time on page +15%

---

## PRD-3: Zero/Minimum Permissions (MV3 Trust Signal)

### Problem Statement
Chrome users are permission-sensitive. Extensions with broad permissions face higher abandonment. A new tab extension needs only `storage` and optionally `alarms`. Every additional permission is a trust liability.

### User Stories
- Installing user sees only necessary permissions → trusts the extension
- Privacy-conscious user gets assurance no browsing data is accessed
- Extension works fully without network host permissions

### Requirements
- Manifest declares only `storage` (and `alarms` for rotation)
- No `host_permissions` unless absolutely required for API calls
- No content scripts injected into other pages
- All network via `fetch()` from service worker
- Works identically offline (with cached wallpaper)
- Privacy disclosure in settings explaining local data storage
- Zero remote code execution, strict CSP `self`-only

### Acceptance Criteria
- [ ] `manifest.json` permissions: `["storage"]` or `["storage", "alarms"]`
- [ ] `host_permissions` empty or single wallpaper API domain
- [ ] CWS install prompt shows minimal permissions
- [ ] Passes CWS review without permission flags
- [ ] All features work in Airplane Mode after first wallpaper cached

### DECISION NEEDED
1. **`alarms` permission**: (A) Include upfront? (B) Request dynamically when user enables rotation?
2. **Host permissions for wallpaper**: (A) Declare specific domain? (B) Bundle all images (no host permission)? (C) Proxy through own domain?
3. **Analytics**: (A) None? (B) Opt-in during onboarding? (C) Anonymous stats with toggle in settings?

### Success Metrics
- Install conversion +25%, permission abandonment <5%, CWS review pass 100%

---

## PRD-4: Prominent "Rate Us" Feedback Loop

### Problem Statement
CWS ratings are primary social proof. Extensions with <100 reviews and <4.0 rating see 50-70% lower install rates. Smart review prompts (asking at moment of satisfaction) see 3-5x more reviews.

### User Stories
- Satisfied user wants easy way to rate without searching CWS
- User wants to provide feedback directly in extension if having problems
- User不想每次开新标签都被评分弹窗打扰
- User can dismiss permanently if not interested

### Requirements
- Prompt appears after 7+ new tabs AND 1+ feature interaction AND 3+ days installed
- Dismissible with single click, 30-day cooldown
- "Leave a review" opens CWS review page directly
- "Send Feedback" opens in-extension form
- After 3 permanent dismissals, never shows again
- Persistent "Feedback" link in settings page
- Feedback form: category (bug/feature/praise), description, optional email

### Acceptance Criteria
- [ ] Prompt only after threshold conditions met
- [ ] "Leave a review" opens correct CWS/Edge Add-ons page
- [ ] Dismissal suppresses for 30 days
- [ ] After 3 dismissals, permanently suppressed
- [ ] Settings has permanent "Send Feedback" link
- [ ] Feedback form works offline (queues submission)

### Technical Approach
- Tab counter via `storage.local` increment on each new tab load
- Interaction detection: wallpaper change, theme toggle, engine switch
- Lightweight HTML overlay injected into new tab page
- State machine: Installed → Active (3d) → Engaged (7 tabs, 1 action) → Prompted
- Storage schema: `{ installDate, tabOpenCount, hasInteracted, lastPromptDate, dismissCount, permanentlyDismissed, rated }`

### DECISION NEEDED
1. **Prompt wording**: (A) "Love WillowTab? Rate us 5 stars!" (may violate CWS policy)? (B) "Enjoying WillowTab? Leave a review"? (C) "Help others discover WillowTab"?
2. **Feedback routing**: (A) GitHub Issues? (B) Email? (C) Google Forms? (D) Self-hosted?
3. **Prompt placement**: (A) Bottom-right toast? (B) Center modal? (C) Inline banner below search bar?
4. **Negative feedback routing**: (A) Route to internal form (avoid negative CWS review)? (B) Still offer CWS option (honest, but may accumulate negatives)?

### Success Metrics
- 500+ reviews in 90 days, ≥4.5★ average, >15% prompt-to-review conversion, <70% dismissal rate

---

## Appendix: Feature Priority Matrix

| Feature | Impact | Effort | Risk | Priority |
|---------|--------|--------|------|----------|
| PRD-1: Sub-100ms Load | HIGH | LOW | LOW | P0 |
| PRD-2: Daily Wallpaper Rotation | HIGH | MEDIUM | LOW | P0 |
| PRD-3: Minimum Permissions | HIGH | LOW | LOW | P0 |
| PRD-4: Rate Us Feedback Loop | MEDIUM | MEDIUM | MEDIUM | P1 |
