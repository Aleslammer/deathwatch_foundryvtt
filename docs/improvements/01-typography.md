# Typography Improvements

**Priority:** 🔥🔥🔥 **CRITICAL**  
**Effort:** ⚡ Low (CSS only)  
**Impact:** Instantly transforms the interface from generic to distinctive

---

## 🚨 Current Problem

```css
/* src/styles/deathwatch.css:1 */
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");

/* src/styles/base.css:2 */
.window-app {
  font-family: "Roboto", sans-serif;
}
```

**Issue:** **Roboto is one of the most generic, overused fonts in web design.** It has zero thematic connection to Warhammer 40K and creates the exact "AI slop" aesthetic we need to avoid.

---

## 🎯 Design Direction

For a **Warhammer 40K: Deathwatch** system, typography should evoke:

1. **Imperial Gothic architecture** — Heavy, ornate, imposing
2. **Military tactical readouts** — Monospace, technical, HUD-like
3. **Ancient High Gothic texts** — Serif, classical, reverent
4. **Power Armor displays** — Digital, sharp, utilitarian

---

## ✅ Recommended Font Pairings

### Option 1: Gothic Military (RECOMMENDED)

```css
/* Display/Headers — Imperial Gothic */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&display=swap');

/* Body Text — Military HUD Readout */
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

/* Alternative Body — Refined Tech */
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600&display=swap');
```

**Why this works:**
- **Cinzel** — Serif font with Imperial Roman/Gothic feel (perfect for 40K)
- **Share Tech Mono** — Monospace font that looks like military HUD displays
- **Rajdhani** — Alternative body font if monospace feels too technical

---

### Option 2: Brutalist Imperial

```css
/* Display — Heavy Industrial */
@import url('https://fonts.googleapis.com/css2?family=Teko:wght@600;700&display=swap');

/* Body — Technical Readout */
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600&display=swap');
```

**Why this works:**
- **Teko** — Tall, condensed, militaristic headers
- **Orbitron** — Futuristic, geometric, tech-focused

---

### Option 3: Maximum Gothic

```css
/* Display — Classic Imperial */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');

/* Body — Refined Serif */
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&display=swap');
```

**Why this works:**
- **Playfair Display** — Elegant, classical, High Gothic
- **Crimson Pro** — Readable serif for body text, parchment feel

---

## 📝 Implementation

### Step 1: Update Font Imports

**File:** `src/styles/deathwatch.css`

```css
/* REMOVE */
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");

/* ADD — Gothic Military (Option 1) */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600&display=swap');
```

---

### Step 2: Update Base Typography

**File:** `src/styles/base.css`

```css
/* Global font — Military HUD */
.window-app {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 400;
  letter-spacing: 0.3px;
}

/* Deathwatch system specific */
.deathwatch {
  font-family: 'Rajdhani', sans-serif;
}

/* Headers — Imperial Gothic */
.deathwatch h1,
.deathwatch h2,
.deathwatch h3,
.deathwatch h4,
.deathwatch .section-header,
.deathwatch .box-title {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

/* Stats and numeric values — Monospace HUD */
.deathwatch .characteristic-total,
.deathwatch .skill-total,
.deathwatch .wounds-max,
.deathwatch .fatigue-max,
.deathwatch input[type="number"],
.deathwatch .item-stat {
  font-family: 'Share Tech Mono', monospace;
  font-weight: 400;
}

/* Item lists and descriptions */
.deathwatch .item-name h4,
.deathwatch .skill-name,
.deathwatch .talent-show,
.deathwatch .trait-show {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 500;
}

/* Chat messages — Military report */
.deathwatch-chat-card {
  font-family: 'Rajdhani', sans-serif;
}

.deathwatch-chat-card h3 {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}
```

---

### Step 3: Remove Roboto References

**Search and replace across all CSS files:**

```bash
# Find all Roboto references
grep -r "Roboto" src/styles/

# Files to check:
# - src/styles/deathwatch.css (line 1)
# - src/styles/base.css (line 3)
# - src/styles/components/sheets.css (line 3, 50)
# - src/styles/components/dialogs.css (line 8)
```

**Replace all instances:**
```css
/* REMOVE */
font-family: "Roboto", sans-serif;

/* REPLACE WITH */
font-family: 'Rajdhani', sans-serif;

/* OR for headers */
font-family: 'Cinzel', serif;
```

---

## 🎨 Typography Scale

Add these to `src/styles/variables.css` for consistency:

```css
:root {
  /* Font Families */
  --dw-font-display: 'Cinzel', serif;          /* Headers */
  --dw-font-body: 'Rajdhani', sans-serif;      /* Body text */
  --dw-font-mono: 'Share Tech Mono', monospace; /* Stats/numbers */
  
  /* Font Weights */
  --dw-font-weight-normal: 400;
  --dw-font-weight-medium: 500;
  --dw-font-weight-bold: 700;
  --dw-font-weight-black: 900;
  
  /* Letter Spacing */
  --dw-letter-spacing-tight: 0.3px;
  --dw-letter-spacing-normal: 0.5px;
  --dw-letter-spacing-wide: 1.2px;
  --dw-letter-spacing-wider: 2px;
  
  /* Updated font sizes (keep existing) */
  --dw-font-size-xs: 11px;
  --dw-font-size-sm: 12px;
  --dw-font-size-md: 13px;
  --dw-font-size-lg: 14px;
  --dw-font-size-xl: 16px;
  --dw-font-size-xxl: 20px;
  --dw-font-size-display: 24px;  /* NEW — for major headers */
}
```

---

## 🔍 Visual Comparison

### Before (Roboto)
- Generic, corporate, "Google Material Design"
- No personality or thematic connection
- Looks like every other web app

### After (Cinzel + Rajdhani + Share Tech Mono)
- **Headers:** Imperial, imposing, Gothic architecture
- **Body:** Technical, military, slightly futuristic
- **Stats:** HUD readout, Power Armor displays
- **Distinctive and memorable**

---

## 📋 Testing Checklist

After implementing, verify typography looks correct on:

- [ ] Character sheet headers (name, tabs, sections)
- [ ] Characteristic boxes (titles and values)
- [ ] Skills list (skill names and totals)
- [ ] Items list (weapon names, stats)
- [ ] Dialog boxes (titles and labels)
- [ ] Chat cards (headers and body)
- [ ] Cohesion panel
- [ ] Mental state tab
- [ ] Wounds/Fatigue displays

---

## ⚠️ Potential Issues

### 1. **Monospace Width**
Share Tech Mono may cause layout issues in tight spaces.

**Solution:** Use Rajdhani for most body text, reserve monospace for numeric displays only.

---

### 2. **Cinzel Readability at Small Sizes**
Cinzel is very ornate and may be hard to read below 14px.

**Solution:** Only use Cinzel for h1-h4 and `.section-header`. Use Rajdhani for smaller text.

---

### 3. **Font Loading Performance**
Loading 3 font families may increase page load time.

**Solution:** Use `&display=swap` in Google Fonts URL to prevent FOIT (Flash of Invisible Text).

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Rajdhani:wght@400;600&family=Share+Tech+Mono&display=swap');
```

---

## 🎯 Expected Impact

**Before:** Generic interface that could be any system  
**After:** Instantly recognizable as Warhammer 40K Deathwatch

Typography alone will make the biggest single improvement to the interface aesthetic. Combined with the color palette updates, this will transform the system from "AI slop" to distinctive, thematic, production-grade design.

---

_Blessed be these sacred font protocols. May they consecrate our interface with the Omnissiah's glory._

⚙️ **The Machine Spirit approves this typography sanctification.**
