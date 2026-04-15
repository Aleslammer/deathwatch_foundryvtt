# Color Palette Improvements

**Priority:** 🔥🔥🔥 **CRITICAL**  
**Effort:** ⚡⚡ Medium (CSS variables + component updates)  
**Impact:** Transforms the visual identity from Bootstrap generic to Imperial Deathwatch

---

## 🚨 Current Problem

**File:** `src/styles/variables.css`

```css
:root {
  /* Generic Bootstrap Colors */
  --dw-color-primary: #007bff;      /* Bootstrap blue */
  --dw-color-primary-hover: #0056b3;
  --dw-color-secondary: #6c757d;    /* Generic gray */
  --dw-color-success: green;        /* Generic green */
  --dw-color-danger: red;           /* Generic red */
  --dw-color-warning: #ffc107;      /* Bootstrap yellow */
}
```

**Issue:** These colors have **zero thematic connection** to Warhammer 40K. The primary blue (`#007bff`) is straight from Bootstrap's default palette — the definition of generic "AI slop" design.

---

## 🎯 Design Direction

### Warhammer 40K Deathwatch Color Language

**Deathwatch Chapter Colors:**
- **Primary:** Black armor with silver trim
- **Accent:** Red shoulder pad (previous chapter)
- **Imperial:** Gold Aquila and purity seals

**Visual References:**
- Space Marine power armor (black ceramite)
- Imperial architecture (gold, parchment, stone)
- Tactical HUD displays (green, amber)
- Xenos threat indicators (red, orange)
- Plasma weapons (cyan glow)

---

## ✅ Recommended Palette

### Imperial Deathwatch Palette

```css
:root {
  /* ========================================
     DEATHWATCH CHAPTER COLORS
     ======================================== */
  
  /* Black & Silver — Deathwatch armor */
  --dw-deathwatch-black: #0a0a0a;
  --dw-deathwatch-black-light: #1a1a1a;
  --dw-deathwatch-silver: #8a9ba8;
  --dw-deathwatch-silver-light: #b8c5d6;
  --dw-deathwatch-silver-dark: #5a6570;
  
  /* Imperial Gold — Aquila, trim, purity seals */
  --dw-imperial-gold: #d4a574;
  --dw-imperial-gold-light: #e8c9a0;
  --dw-imperial-gold-dark: #8b6914;
  --dw-imperial-gold-darkest: #5a4410;
  
  /* Chapter Red — Shoulder pad accent */
  --dw-chapter-red: #8b0000;
  --dw-chapter-red-light: #b30000;
  --dw-chapter-red-dark: #5a0000;
  
  /* ========================================
     PARCHMENT & PAPER
     ======================================== */
  
  --dw-parchment: #f4e7d7;
  --dw-parchment-dark: #d4c4a8;
  --dw-parchment-aged: #c4b498;
  --dw-parchment-shadow: #a49478;
  
  /* ========================================
     POWER ARMOR TECH
     ======================================== */
  
  /* Ceramite blue — Power field aura */
  --dw-power-armor-blue: #2c4a6b;
  --dw-power-armor-blue-light: #3a5d87;
  
  /* Plasma glow — Weapons, tech */
  --dw-plasma-glow: #4dd0e1;
  --dw-plasma-bright: #80deea;
  
  /* ========================================
     HUD & TACTICAL DISPLAYS
     ======================================== */
  
  /* HUD green — Tactical readouts */
  --dw-hud-green: #39ff14;
  --dw-hud-green-dim: #2acc10;
  
  /* HUD amber — Warning status */
  --dw-hud-amber: #ffbf00;
  --dw-hud-amber-bright: #ffd633;
  
  /* HUD cyan — Information */
  --dw-hud-cyan: #00ffff;
  
  /* ========================================
     THREAT & STATUS INDICATORS
     ======================================== */
  
  /* Xenos threat — Enemy detection */
  --dw-xenos-warning: #ff6b35;
  --dw-xenos-critical: #ff4500;
  
  /* Critical damage */
  --dw-critical-damage: #dc143c;
  --dw-critical-severe: #8b0000;
  
  /* Corruption — Chaos, mental state */
  --dw-corruption-purple: #8b008b;
  --dw-corruption-pink: #ff1493;
  
  /* Success indicators */
  --dw-success-green: #4ecca3;
  --dw-success-bright: #6effd4;
  
  /* ========================================
     FUNCTIONAL COLORS (Updated)
     ======================================== */
  
  /* Primary — Use Imperial Gold instead of Bootstrap blue */
  --dw-color-primary: var(--dw-imperial-gold);
  --dw-color-primary-hover: var(--dw-imperial-gold-dark);
  --dw-color-primary-light: var(--dw-imperial-gold-light);
  
  /* Secondary — Deathwatch silver */
  --dw-color-secondary: var(--dw-deathwatch-silver);
  --dw-color-secondary-hover: var(--dw-deathwatch-silver-light);
  --dw-color-secondary-dark: var(--dw-deathwatch-silver-dark);
  
  /* Success — HUD green */
  --dw-color-success: var(--dw-success-green);
  --dw-color-success-bright: var(--dw-success-bright);
  
  /* Danger — Critical damage red */
  --dw-color-danger: var(--dw-critical-damage);
  --dw-color-danger-dark: var(--dw-critical-severe);
  
  /* Warning — HUD amber */
  --dw-color-warning: var(--dw-hud-amber);
  --dw-color-warning-bright: var(--dw-hud-amber-bright);
  
  /* ========================================
     BORDERS (Updated)
     ======================================== */
  
  --dw-color-border: var(--dw-deathwatch-silver-dark);
  --dw-color-border-light: var(--dw-deathwatch-silver);
  --dw-color-border-dark: var(--dw-imperial-gold-dark);
  --dw-color-border-groove: var(--dw-deathwatch-silver-dark);
  
  /* ========================================
     BACKGROUNDS (Dark Theme Base)
     ======================================== */
  
  --dw-color-bg-primary: var(--dw-deathwatch-black);
  --dw-color-bg-secondary: var(--dw-deathwatch-black-light);
  --dw-color-bg-tertiary: rgba(138, 155, 168, 0.08);
  --dw-color-bg-hover: rgba(212, 165, 116, 0.1);
  
  /* ========================================
     TEXT (Dark Theme)
     ======================================== */
  
  --dw-color-text-primary: var(--dw-deathwatch-silver-light);
  --dw-color-text-secondary: var(--dw-deathwatch-silver);
  --dw-color-text-muted: var(--dw-deathwatch-silver-dark);
  --dw-color-text-accent: var(--dw-imperial-gold);
  --dw-color-text-bright: #ffffff;
  
  /* KEEP existing spacing, border radius, shadows, font sizes */
}
```

---

## 📝 Implementation Steps

### Step 1: Update Variables

**File:** `src/styles/variables.css`

Replace the entire color section with the palette above.

---

### Step 2: Update Component References

Many components reference the old generic colors. Update these:

#### A. Section Headers

**File:** `src/styles/components/items.css:29`

```css
/* CURRENT */
.deathwatch .section-header {
  border-image: linear-gradient(to right, #8b4513, #d2691e, #8b4513) 1;
  color: #5a3a1a;
}

/* UPDATE */
.deathwatch .section-header {
  border-image: linear-gradient(
    to right, 
    var(--dw-imperial-gold-dark), 
    var(--dw-imperial-gold), 
    var(--dw-imperial-gold-dark)
  ) 1;
  color: var(--dw-imperial-gold);
  text-shadow: 0 0 8px rgba(212, 165, 116, 0.4);
}
```

---

#### B. Characteristic Boxes

**File:** `src/styles/components/characteristics.css`

```css
/* Update primary color references */
.deathwatch .characteristic-total {
  color: var(--dw-imperial-gold);  /* Was: var(--dw-color-primary) */
  text-shadow: 0 0 4px rgba(212, 165, 116, 0.3);
}
```

---

#### C. Chat Cards

**File:** `src/styles/components/chat.css:5`

```css
.deathwatch-chat-card {
  border-left: 3px solid var(--dw-imperial-gold);
  background: rgba(10, 10, 10, 0.95);
}

.deathwatch-chat-card h3 {
  color: var(--dw-imperial-gold-light);
}

/* Success/Failure indicators */
.insanity-test-result .success {
  color: var(--dw-success-bright);
  background: rgba(78, 204, 163, 0.2);
  border-left: 3px solid var(--dw-success-green);
}

.insanity-test-result .failure {
  color: var(--dw-critical-damage);
  background: rgba(220, 20, 60, 0.2);
  border-left: 3px solid var(--dw-critical-damage);
}
```

---

#### D. Rollable Elements

**File:** `src/styles/base.css:7`

```css
.rollable:hover,
.rollable:focus {
  color: var(--dw-hud-green);  /* Was: #000 */
  text-shadow: 
    0 0 8px var(--dw-hud-green),
    0 0 16px var(--dw-hud-green);
  cursor: pointer;
}
```

---

#### E. Dialog Buttons

**File:** `src/styles/components/dialogs.css:131`

```css
.deathwatch .modifier-dialog .dialog-button.roll {
  background: var(--dw-imperial-gold);
  color: var(--dw-deathwatch-black);
  font-weight: 600;
}

.deathwatch .modifier-dialog .dialog-button.roll:hover {
  background: var(--dw-imperial-gold-light);
  box-shadow: 0 0 12px rgba(212, 165, 116, 0.6);
}

.deathwatch .modifier-dialog .dialog-button.cancel {
  background: var(--dw-deathwatch-silver-dark);
  color: var(--dw-deathwatch-silver-light);
}

.deathwatch .modifier-dialog .dialog-button.cancel:hover {
  background: var(--dw-deathwatch-silver);
}
```

---

#### F. Cohesion Panel

**File:** `src/styles/components/cohesion.css`

```css
#cohesion-panel .window-content {
  background: rgba(10, 10, 10, 0.97);
  color: var(--dw-deathwatch-silver-light);
  border: 2px solid var(--dw-imperial-gold-dark);
}

.cohesion-panel-inner .cohesion-value {
  color: var(--dw-imperial-gold);
  text-shadow: 0 0 8px rgba(212, 165, 116, 0.5);
}

.mode-indicator.solo {
  background: var(--dw-hud-green);
  box-shadow: 0 0 4px var(--dw-hud-green);
}

.mode-indicator.squad {
  background: var(--dw-power-armor-blue-light);
  box-shadow: 0 0 4px var(--dw-power-armor-blue-light);
}
```

---

#### G. Dark Theme Overrides

**File:** `src/styles/deathwatch.css` (lines 90-404)

Many hard-coded colors in the dark theme section. Update key ones:

```css
/* Links */
.deathwatch.sheet .window-content a {
  color: var(--dw-imperial-gold);
}

.deathwatch.sheet .window-content a:hover {
  color: var(--dw-imperial-gold-light);
  text-shadow: 0 0 4px rgba(212, 165, 116, 0.5);
}

/* Section headers */
.deathwatch.sheet .window-content .section-header {
  color: var(--dw-imperial-gold);
  border-image: linear-gradient(
    to right, 
    var(--dw-imperial-gold-darkest), 
    var(--dw-imperial-gold), 
    var(--dw-imperial-gold-darkest)
  ) 1;
}

/* Active tabs */
.deathwatch.sheet .window-content .sheet-tabs .item.active {
  color: var(--dw-imperial-gold);
  border-bottom-color: var(--dw-imperial-gold);
  text-shadow: 0 0 6px rgba(212, 165, 116, 0.6);
}

/* Squad badges */
.deathwatch.sheet .window-content .squad-badges .cost-badge {
  color: var(--dw-power-armor-blue-light);
}

.deathwatch.sheet .window-content .squad-badges .sustained-badge {
  color: var(--dw-hud-amber);
}
```

---

## 🎨 Color Usage Guide

### When to Use Each Color

| Color Variable | Use For |
|---|---|
| `--dw-imperial-gold` | Headers, links, primary actions, borders |
| `--dw-deathwatch-black` | Backgrounds, dark surfaces |
| `--dw-deathwatch-silver` | Text, borders, secondary elements |
| `--dw-hud-green` | Rollable hover states, tactical displays, success |
| `--dw-hud-amber` | Warnings, sustained abilities, caution |
| `--dw-critical-damage` | Critical wounds, severe failures, danger |
| `--dw-plasma-glow` | Tech effects, weapon glows, energy |
| `--dw-chapter-red` | Blood Angels, chapter-specific accents |
| `--dw-parchment` | Light mode backgrounds (if implemented) |

---

## 🔍 Visual Comparison

### Before
- **Primary:** `#007bff` (Bootstrap blue) — Generic, corporate, no personality
- **Success:** `green` — Vague, no specificity
- **Borders:** `#c9c7b8` (beige) — Dull, lifeless

### After
- **Primary:** `#d4a574` (Imperial gold) — Instantly recognizable as 40K
- **Success:** `#4ecca3` (HUD green) — Tactical display, Power Armor feel
- **Borders:** `#8a9ba8` (Deathwatch silver) — Ceramite armor plating

---

## 📋 Testing Checklist

After implementing, verify colors look correct:

- [ ] Section headers (gold gradient border)
- [ ] Rollable characteristics (HUD green glow on hover)
- [ ] Chat cards (gold accent border)
- [ ] Success/failure messages (green/red with appropriate shades)
- [ ] Dialog buttons (gold primary, silver cancel)
- [ ] Cohesion panel (gold value display)
- [ ] Mode indicators (green solo, blue squad)
- [ ] Active tabs (gold underline)
- [ ] Links (gold color, brighter on hover)

---

## ⚠️ Potential Issues

### 1. **Contrast in Light Mode**
The palette is optimized for dark theme. If light mode is used, some colors may need adjustment.

**Solution:** Add light mode overrides if needed (currently system is dark-only).

---

### 2. **Gold Readability on Dark Backgrounds**
Imperial gold may be hard to read on very dark backgrounds.

**Solution:** Add subtle text-shadow for depth:
```css
text-shadow: 0 0 4px rgba(212, 165, 116, 0.4);
```

---

### 3. **HUD Green Too Bright**
HUD green (`#39ff14`) is very bright and may be harsh.

**Solution:** Use sparingly for hover states only. Use dimmer variant for static elements.

---

## 🎯 Expected Impact

**Before:** Generic Bootstrap interface  
**After:** Unmistakably Warhammer 40K Deathwatch

Color palette updates, combined with typography changes, will create an immediate and dramatic visual transformation. The interface will feel Imperial, militaristic, and battle-ready.

---

_Blessed be these sacred color protocols. May the Imperial Gold illuminate our data-sanctums._

⚙️ **The Omnissiah consecrates this palette.**
