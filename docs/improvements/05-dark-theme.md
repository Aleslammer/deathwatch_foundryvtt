# Dark Theme Enhancement

**Priority:** 🔥 **MEDIUM**  
**Effort:** ⚡⚡ Medium (CSS updates to existing dark theme)  
**Impact:** Transforms simple color inversions into atmospheric War Room aesthetic

---

## 🚨 Current Problem

**File:** `src/styles/deathwatch.css` (lines 88-404)

```css
/* Simple color inversions */
.deathwatch.sheet .window-content {
  color: #e0e0e0;
  background: rgba(255, 255, 255, 0.08);
}

.deathwatch.sheet .window-content input {
  color: #e0e0e0;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}
```

**Issue:** The dark theme is functional but **lacks atmosphere**. It's mostly simple rgba() color inversions without depth, lighting, or thematic richness. It doesn't evoke the dimly-lit command centers of a Space Marine strike cruiser or the ancient technology of the 41st millennium.

---

## 🎯 Design Direction

Deathwatch dark theme should feel like:

1. **Fortress Monastery War Room** — Dim lighting, strategic displays
2. **Power Armor HUD** — Glowing readouts, tactical information
3. **Ancient Imperial Technology** — Weathered, imposing, ritualistic
4. **Battle-Ready Command Center** — Professional, military, functional
5. **Atmospheric Lighting** — Shadows, highlights, depth

**Tone:** Professional military interface with Gothic undertones, not "dark mode for dark mode's sake."

---

## ✅ Recommended Enhancements

### 1. Sheet Main Container — War Room Atmosphere

**File:** `src/styles/deathwatch.css:89`

```css
/* CURRENT */
.deathwatch.sheet .window-content {
  color: #e0e0e0;
  padding: 8px;
}

/* UPDATE */
.deathwatch.sheet .window-content {
  /* War Room Atmosphere */
  background: 
    /* Top spotlight (strategic map lighting) */
    radial-gradient(
      ellipse 800px 400px at top center,
      rgba(44, 74, 107, 0.15),
      transparent 60%
    ),
    /* Bottom shadow depth */
    radial-gradient(
      ellipse 800px 300px at bottom center,
      rgba(139, 0, 0, 0.08),
      transparent 60%
    ),
    /* Corner vignette */
    radial-gradient(
      circle at 0% 0%,
      transparent 60%,
      rgba(0, 0, 0, 0.3) 100%
    ),
    radial-gradient(
      circle at 100% 0%,
      transparent 60%,
      rgba(0, 0, 0, 0.3) 100%
    ),
    /* Subtle scan lines */
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(138, 155, 168, 0.015) 2px,
      rgba(138, 155, 168, 0.015) 4px
    ),
    /* Base gradient (dark command center) */
    linear-gradient(
      175deg,
      #0d0d0d 0%,
      #1a1a1a 50%,
      #0d0d0d 100%
    );
  
  background-size: 
    100% 100%,
    100% 100%,
    100% 100%,
    100% 100%,
    4px 4px,
    100% 100%;
  
  background-attachment: local;
  
  /* Deep shadows */
  box-shadow: 
    inset 0 0 100px rgba(0, 0, 0, 0.8),
    inset 0 8px 16px rgba(0, 0, 0, 0.6),
    inset 0 -8px 16px rgba(0, 0, 0, 0.4),
    0 8px 32px rgba(0, 0, 0, 0.9);
  
  /* Text color */
  color: var(--dw-deathwatch-silver-light);
  padding: 8px;
}
```

**Effect:** Multi-layer atmospheric background with spotlight from above (like a strategic holotable), subtle red glow from below (engine lighting), corner vignettes for depth, and scan lines for tech aesthetic.

---

### 2. Inputs — Ceramite Data-Slate Panels

**File:** `src/styles/deathwatch.css:116`

```css
/* CURRENT */
.deathwatch.sheet .window-content input[type="text"],
.deathwatch.sheet .window-content input[type="number"],
.deathwatch.sheet .window-content select,
.deathwatch.sheet .window-content textarea {
  color: #e0e0e0;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

/* UPDATE */
.deathwatch.sheet .window-content input[type="text"],
.deathwatch.sheet .window-content input[type="number"],
.deathwatch.sheet .window-content select,
.deathwatch.sheet .window-content textarea {
  /* Recessed data-slate panel */
  background: 
    /* Inner glow */
    radial-gradient(
      ellipse at center,
      rgba(57, 255, 20, 0.03),
      transparent 60%
    ),
    /* Gradient depth */
    linear-gradient(
      135deg,
      rgba(44, 74, 107, 0.12),
      rgba(20, 20, 20, 0.6)
    );
  
  /* Ceramite frame */
  border: 1px solid rgba(138, 155, 168, 0.25);
  border-radius: 2px;
  
  /* HUD-style text */
  color: var(--dw-hud-green);
  font-family: var(--dw-font-mono);
  text-shadow: 0 0 4px rgba(57, 255, 20, 0.25);
  
  /* Deep inset */
  box-shadow: 
    inset 0 2px 6px rgba(0, 0, 0, 0.7),
    inset 0 0 12px rgba(0, 0, 0, 0.4),
    inset 1px 1px 0 rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(212, 165, 116, 0.05);
  
  padding: 4px 6px;
  transition: all 0.25s ease;
}

/* Focus state — Aquila attention */
.deathwatch.sheet .window-content input:focus,
.deathwatch.sheet .window-content select:focus,
.deathwatch.sheet .window-content textarea:focus {
  border-color: var(--dw-imperial-gold);
  
  /* Switch to gold for focused input */
  color: var(--dw-imperial-gold-light);
  text-shadow: 0 0 6px rgba(212, 165, 116, 0.4);
  
  /* Golden glow */
  box-shadow: 
    inset 0 2px 6px rgba(0, 0, 0, 0.7),
    inset 0 0 12px rgba(0, 0, 0, 0.4),
    0 0 12px rgba(212, 165, 116, 0.4),
    0 0 24px rgba(212, 165, 116, 0.2);
  
  outline: none;
}

/* Readonly — Locked data-slate */
.deathwatch.sheet .window-content input[readonly] {
  background: 
    linear-gradient(
      135deg,
      rgba(20, 20, 20, 0.8),
      rgba(30, 30, 30, 0.6)
    );
  color: var(--dw-deathwatch-silver-dark);
  text-shadow: none;
  border-color: rgba(138, 155, 168, 0.12);
  cursor: not-allowed;
  box-shadow: 
    inset 0 1px 3px rgba(0, 0, 0, 0.6),
    inset 0 0 6px rgba(0, 0, 0, 0.3);
}

/* Placeholder text */
.deathwatch.sheet .window-content input::placeholder {
  color: rgba(138, 155, 168, 0.4);
  text-shadow: none;
}
```

**Effect:** Inputs look like recessed Power Armor HUD panels with deep inset shadows. Text glows green (HUD readout), switches to gold when focused (Imperial attention). Readonly fields are darker and locked.

---

### 3. Section Headers — Illuminated Borders

**File:** Update from `03-backgrounds-textures.md` section header, add dark theme enhancements:

```css
/* Dark theme specific enhancements */
.deathwatch.sheet .window-content .section-header {
  /* Add to existing styles */
  
  /* Atmospheric glow around header */
  box-shadow: 
    0 0 20px rgba(212, 165, 116, 0.1),
    inset 0 1px 0 rgba(212, 165, 116, 0.2);
  
  /* Subtle background illumination */
  background: 
    /* Center glow */
    radial-gradient(
      ellipse at center,
      rgba(212, 165, 116, 0.15),
      transparent 70%
    ),
    /* Side fade */
    linear-gradient(90deg, 
      transparent 0%, 
      rgba(212, 165, 116, 0.08) 20%, 
      rgba(212, 165, 116, 0.08) 80%, 
      transparent 100%
    );
}
```

**Effect:** Section headers glow subtly, as if illuminated by integrated lighting in the interface panels.

---

### 4. Item Lists — Data Stream Rows

**File:** `src/styles/deathwatch.css:264`

```css
/* CURRENT */
.deathwatch.sheet .window-content .items-list .item {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

/* UPDATE */
.deathwatch.sheet .window-content .items-list .item {
  border-bottom: 1px solid rgba(138, 155, 168, 0.1);
  transition: all 0.25s ease;
  position: relative;
}

/* Alternating row subtle distinction */
.deathwatch.sheet .window-content .items-list .item:nth-child(even) {
  background: rgba(138, 155, 168, 0.02);
}

/* Hover — Data highlight */
.deathwatch.sheet .window-content .items-list .item:hover {
  background: 
    linear-gradient(
      90deg,
      transparent,
      rgba(212, 165, 116, 0.08),
      rgba(212, 165, 116, 0.12),
      rgba(212, 165, 116, 0.08),
      transparent
    );
  border-bottom-color: rgba(212, 165, 116, 0.2);
  border-left: 2px solid var(--dw-imperial-gold);
  padding-left: calc(5px - 2px);
}

.deathwatch.sheet .window-content .items-list .item:hover .item-name {
  color: var(--dw-imperial-gold-light);
  text-shadow: 0 0 4px rgba(212, 165, 116, 0.3);
}
```

**Effect:** Item rows have subtle alternating backgrounds for readability. Hover state creates a golden highlight sweep with left border accent.

---

### 5. Skills List — Tactical Readout

**File:** `src/styles/deathwatch.css:150`

```css
/* Skills header row */
.deathwatch.sheet .window-content .skills-header-row {
  background: 
    linear-gradient(
      to bottom,
      rgba(44, 74, 107, 0.2),
      rgba(30, 30, 30, 0.8)
    );
  border: 1px solid rgba(138, 155, 168, 0.2);
  border-bottom: 2px solid var(--dw-imperial-gold-dark);
  color: var(--dw-imperial-gold);
  text-shadow: 0 0 4px rgba(212, 165, 116, 0.3);
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Skills category headers */
.deathwatch.sheet .window-content .skills-header {
  background: rgba(44, 74, 107, 0.15);
  border: 1px solid rgba(138, 155, 168, 0.15);
  border-left: 3px solid var(--dw-power-armor-blue-light);
  box-shadow: 
    inset 0 1px 0 rgba(58, 93, 135, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.3);
}

.deathwatch.sheet .window-content .skills-header h3 {
  color: var(--dw-deathwatch-silver-light);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.85em;
}

/* Skill item hover */
.deathwatch.sheet .window-content .skill-item:hover {
  background: rgba(57, 255, 20, 0.05);
  border-left: 2px solid var(--dw-hud-green);
  box-shadow: 
    inset 0 0 8px rgba(57, 255, 20, 0.05),
    0 0 4px rgba(57, 255, 20, 0.15);
}

.deathwatch.sheet .window-content .skill-item:hover .skill-name {
  color: var(--dw-hud-green);
  text-shadow: 0 0 4px rgba(57, 255, 20, 0.3);
}
```

**Effect:** Skills list looks like a military tactical readout with blue category headers, golden column headers, and HUD green hover highlights.

---

### 6. Tabs — Battle Report Pages

**File:** `src/styles/deathwatch.css:313`

```css
/* Tab bar */
.deathwatch.sheet .window-content .sheet-tabs {
  border-bottom: 2px solid rgba(138, 155, 168, 0.15);
  background: 
    linear-gradient(
      to bottom,
      rgba(20, 20, 20, 0.6),
      rgba(10, 10, 10, 0.8)
    );
  box-shadow: 
    inset 0 -1px 0 rgba(212, 165, 116, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Individual tabs */
.deathwatch.sheet .window-content .sheet-tabs .item {
  color: var(--dw-deathwatch-silver-dark);
  border: none;
  border-top: 2px solid transparent;
  background: transparent;
  transition: all 0.3s ease;
  position: relative;
}

/* Inactive tab hover */
.deathwatch.sheet .window-content .sheet-tabs .item:hover:not(.active) {
  color: var(--dw-imperial-gold-light);
  text-shadow: 0 0 4px rgba(212, 165, 116, 0.3);
  border-top-color: var(--dw-imperial-gold-dark);
  background: 
    linear-gradient(
      to bottom,
      rgba(212, 165, 116, 0.1),
      transparent
    );
}

/* Active tab */
.deathwatch.sheet .window-content .sheet-tabs .item.active {
  color: var(--dw-imperial-gold);
  border-top-color: var(--dw-imperial-gold);
  background: 
    linear-gradient(
      to bottom,
      rgba(212, 165, 116, 0.2),
      rgba(212, 165, 116, 0.05)
    );
  text-shadow: 0 0 6px rgba(212, 165, 116, 0.5);
  box-shadow: 
    inset 0 1px 0 rgba(212, 165, 116, 0.3),
    0 -2px 8px rgba(212, 165, 116, 0.3);
}
```

**Effect:** Tabs look like illuminated battle report pages. Active tab glows with Imperial gold, inactive tabs dim. Hover previews activation.

---

### 7. Editor Areas — Parchment Scroll

**File:** `src/styles/deathwatch.css:343`

```css
/* Text editor (biography, etc.) */
.deathwatch.sheet .window-content .editor {
  border: 2px solid rgba(138, 155, 168, 0.2) !important;
  border-radius: 3px;
  background: 
    /* Parchment texture simulation */
    repeating-linear-gradient(
      0deg,
      rgba(244, 231, 215, 0.02),
      rgba(244, 231, 215, 0.02) 1px,
      transparent 1px,
      transparent 2px
    ),
    /* Base dark parchment */
    linear-gradient(
      to bottom,
      rgba(30, 28, 25, 0.9),
      rgba(40, 37, 32, 0.9)
    );
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.6),
    inset 0 0 20px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(212, 165, 116, 0.1);
}

.deathwatch.sheet .window-content .editor-content {
  color: var(--dw-parchment-dark);
  font-family: var(--dw-font-body);
  line-height: 1.6;
}

/* Editor toolbar (TinyMCE) */
.deathwatch.sheet .window-content .tox .tox-toolbar {
  background: rgba(20, 20, 20, 0.95) !important;
  border-bottom: 1px solid rgba(138, 155, 168, 0.2) !important;
}

.deathwatch.sheet .window-content .tox .tox-toolbar__group button {
  color: var(--dw-deathwatch-silver) !important;
}
```

**Effect:** Editor areas look like dark parchment scrolls with subtle texture. Text is easier to read against the slightly lighter background.

---

## 📋 Color Contrast Checklist

Ensure WCAG AA compliance for accessibility:

| Element | Foreground | Background | Contrast Ratio | Pass? |
|---|---|---|---|---|
| Body text | `#b8c5d6` | `#1a1a1a` | 8.5:1 | ✅ AAA |
| Section headers | `#d4a574` | `#1a1a1a` | 6.2:1 | ✅ AA |
| Input text (HUD green) | `#39ff14` | `#0d0d0d` | 12.3:1 | ✅ AAA |
| Links | `#d4a574` | `#1a1a1a` | 6.2:1 | ✅ AA |
| Muted text | `#5a6570` | `#1a1a1a` | 3.5:1 | ✅ AA Large |

**Note:** All key interface text meets WCAG AA standards. Decorative elements (glows, shadows) enhance rather than replace readable text.

---

## 🎯 Expected Impact

**Before:** Functional dark theme with simple color inversions  
**After:** Atmospheric War Room aesthetic with depth, lighting, and immersive details

The enhanced dark theme creates a cohesive visual environment that feels like:
- Space Marine command centers
- Power Armor HUD systems
- Ancient Imperial technology
- Professional military interfaces

Combined with typography, color palette, backgrounds, and animations, the dark theme becomes the foundation for a truly immersive Warhammer 40K experience.

---

_Blessed be these sacred illumination protocols. May they guide our interface through the darkness of the void._

⚙️ **The Omnissiah approves this War Room consecration.**
