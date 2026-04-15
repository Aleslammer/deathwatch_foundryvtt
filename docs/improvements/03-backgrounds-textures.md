# Backgrounds & Textures

**Priority:** 🔥🔥 **HIGH**  
**Effort:** ⚡⚡ Medium (CSS gradients + optional texture images)  
**Impact:** Adds depth, atmosphere, and visual richness to the interface

---

## 🚨 Current Problem

**File:** `src/styles/deathwatch.css` and component CSS files

```css
/* Flat, lifeless backgrounds */
background: rgba(0, 0, 0, 0.05);
background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
background: rgba(255, 255, 255, 0.08);
```

**Issue:** Backgrounds are flat, single-color, or simple two-stop gradients. There's **no texture, depth, or atmospheric quality**. The interface feels sterile and generic — not the battle-worn, ancient technology of the 41st millennium.

---

## 🎯 Design Direction

Warhammer 40K Deathwatch backgrounds should evoke:

1. **Battle-worn surfaces** — Scratches, wear, aged metal
2. **Parchment and scrolls** — Ancient records, High Gothic texts
3. **Power Armor ceramite** — Hard, industrial, riveted
4. **Atmospheric lighting** — Dim fortress monastery, flickering lights
5. **Subtle tech patterns** — Circuit traces, scan lines, data-stream static

---

## ✅ Recommended Implementations

### 1. Sheet Main Background — Fortress Monastery Command Center

**File:** `src/styles/deathwatch.css:89`

```css
/* CURRENT */
.deathwatch.sheet .window-content {
  color: #e0e0e0;
  padding: 8px;
}

/* UPDATE */
.deathwatch.sheet .window-content {
  color: var(--dw-deathwatch-silver-light);
  padding: 8px;
  
  /* Multi-layer atmospheric background */
  background: 
    /* Top spotlight effect */
    radial-gradient(
      ellipse at top center,
      rgba(44, 74, 107, 0.12),
      transparent 50%
    ),
    /* Bottom shadow depth */
    radial-gradient(
      ellipse at bottom center,
      rgba(139, 0, 0, 0.08),
      transparent 60%
    ),
    /* Subtle scan lines */
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(138, 155, 168, 0.02) 2px,
      rgba(138, 155, 168, 0.02) 4px
    ),
    /* Base gradient */
    linear-gradient(
      to bottom,
      #0d0d0d,
      #1a1a1a
    );
  
  background-size: 
    100% 100%,
    100% 100%,
    4px 4px,
    100% 100%;
  
  /* Atmospheric shadows */
  box-shadow: 
    inset 0 0 80px rgba(0, 0, 0, 0.7),
    inset 0 4px 12px rgba(0, 0, 0, 0.5),
    0 8px 32px rgba(0, 0, 0, 0.9);
}
```

**Effect:** Dark, atmospheric background with subtle scan lines and lighting effects. Feels like a dimly-lit command center aboard a Space Marine strike cruiser.

---

### 2. Section Headers — Imperial Aquila Pattern

**File:** `src/styles/components/items.css:25`

```css
/* CURRENT */
.deathwatch .section-header {
  margin: 15px 0 10px 0;
  padding: 0 0 8px 0;
  border-bottom: 3px solid;
  border-image: linear-gradient(to right, #8b4513, #d2691e, #8b4513) 1;
  font-size: 16px;
  font-weight: bold;
  color: #5a3a1a;
}

/* UPDATE */
.deathwatch .section-header {
  margin: 15px 0 10px 0;
  padding: 8px 12px;
  position: relative;
  overflow: hidden;
  
  /* Subtle background glow */
  background: 
    linear-gradient(90deg, 
      transparent 0%, 
      rgba(212, 165, 116, 0.12) 20%, 
      rgba(212, 165, 116, 0.12) 80%, 
      transparent 100%
    );
  
  /* Imperial gold border */
  border: none;
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(
    to right, 
    transparent 5%,
    var(--dw-imperial-gold-darkest), 
    var(--dw-imperial-gold), 
    var(--dw-imperial-gold-darkest),
    transparent 95%
  ) 1;
  
  /* Typography */
  font-family: var(--dw-font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--dw-imperial-gold);
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 
    0 0 8px rgba(212, 165, 116, 0.5),
    2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* Optional: Animated scan line effect */
.deathwatch .section-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: -25%;
  width: 25%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(212, 165, 116, 0.3),
    transparent
  );
  animation: section-scan 4s infinite;
  pointer-events: none;
}

@keyframes section-scan {
  0% { 
    left: -25%; 
  }
  100% { 
    left: 125%; 
  }
}
```

**Effect:** Section headers have atmospheric glow, Imperial gold gradient border, and optional animated scan line for tech aesthetic.

---

### 3. Chat Cards — Battle Report Parchment

**File:** `src/styles/components/chat.css:3`

```css
/* CURRENT */
.deathwatch-chat-card {
  padding: 8px;
  border-left: 3px solid #d4a574;
  background: rgba(0, 0, 0, 0.5);
}

/* UPDATE */
.deathwatch-chat-card {
  padding: 12px;
  position: relative;
  
  /* Layered parchment effect */
  background: 
    /* Vignette darkening at edges */
    radial-gradient(
      ellipse at center,
      transparent 40%,
      rgba(0, 0, 0, 0.2) 100%
    ),
    /* Subtle noise texture */
    repeating-linear-gradient(
      45deg,
      rgba(212, 165, 116, 0.02),
      rgba(212, 165, 116, 0.02) 1px,
      transparent 1px,
      transparent 2px
    ),
    /* Base gradient */
    linear-gradient(
      135deg,
      rgba(20, 15, 10, 0.95),
      rgba(30, 25, 20, 0.92)
    );
  
  background-blend-mode: multiply, normal, normal;
  
  /* Imperial gold accent border */
  border-left: 4px solid var(--dw-imperial-gold);
  border-radius: 2px;
  
  /* Depth shadows */
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.8),
    inset 0 1px 0 rgba(212, 165, 116, 0.15),
    inset -1px 0 0 rgba(212, 165, 116, 0.08);
}
```

**Effect:** Chat cards look like aged parchment reports with Imperial gold trim. Subtle texture and vignette add depth without being distracting.

---

### 4. Characteristic Boxes — Ceramite Armor Plates

**File:** `src/styles/components/characteristics.css:15`

```css
/* CURRENT */
.deathwatch .characteristics .characteristic {
  height: 94px;
  width: 105px;
  flex: 0 0 105px;
  margin: 0 var(--dw-spacing-xs) var(--dw-spacing-sm);
  text-align: center;
  border: var(--dw-border-width-thick) groove var(--dw-color-border-dark);
  border-radius: var(--dw-border-radius-sm);
}

/* UPDATE */
.deathwatch .characteristics .characteristic {
  height: 94px;
  width: 105px;
  flex: 0 0 105px;
  margin: 0 var(--dw-spacing-xs) var(--dw-spacing-sm);
  text-align: center;
  position: relative;
  
  /* Ceramite plate effect */
  background: 
    /* Rivets in corners */
    radial-gradient(
      circle at 8px 8px,
      rgba(138, 155, 168, 0.4) 2px,
      transparent 3px
    ),
    radial-gradient(
      circle at calc(100% - 8px) 8px,
      rgba(138, 155, 168, 0.4) 2px,
      transparent 3px
    ),
    radial-gradient(
      circle at 8px calc(100% - 8px),
      rgba(138, 155, 168, 0.4) 2px,
      transparent 3px
    ),
    radial-gradient(
      circle at calc(100% - 8px) calc(100% - 8px),
      rgba(138, 155, 168, 0.4) 2px,
      transparent 3px
    ),
    /* Subtle metallic gradient */
    linear-gradient(
      135deg,
      rgba(20, 20, 20, 0.95),
      rgba(30, 30, 30, 0.92)
    );
  
  background-size: 
    100% 100%,
    100% 100%,
    100% 100%,
    100% 100%,
    100% 100%;
  
  /* Metal plate border */
  border: 2px solid var(--dw-deathwatch-silver-dark);
  border-radius: 3px;
  
  /* Depth and lighting */
  box-shadow: 
    /* Inner shadow (recessed) */
    inset 2px 2px 4px rgba(0, 0, 0, 0.8),
    inset -1px -1px 3px rgba(255, 255, 255, 0.03),
    /* Outer shadow (depth) */
    0 4px 8px rgba(0, 0, 0, 0.6),
    /* Subtle highlight edge */
    0 -1px 0 rgba(138, 155, 168, 0.1);
}
```

**Effect:** Characteristic boxes look like Power Armor ceramite plates with rivets in the corners, metallic gradient, and depth shadows. Feels industrial and battle-ready.

---

### 5. Input Fields — Data-Slate Panels

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
  /* Data-slate background */
  background: 
    linear-gradient(
      135deg,
      rgba(44, 74, 107, 0.08),
      rgba(138, 155, 168, 0.12)
    );
  
  /* Ceramite border */
  border: 1px solid rgba(138, 155, 168, 0.3);
  border-radius: 2px;
  
  /* HUD-style text */
  color: var(--dw-hud-green);
  text-shadow: 0 0 4px rgba(57, 255, 20, 0.3);
  
  /* Inset depth */
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(212, 165, 116, 0.05);
  
  transition: all 0.2s ease;
}

.deathwatch.sheet .window-content input:focus,
.deathwatch.sheet .window-content select:focus,
.deathwatch.sheet .window-content textarea:focus {
  border-color: var(--dw-imperial-gold);
  color: var(--dw-imperial-gold-light);
  text-shadow: 0 0 6px rgba(212, 165, 116, 0.5);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 8px rgba(0, 0, 0, 0.3),
    0 0 12px rgba(212, 165, 116, 0.4);
  outline: none;
}

/* Readonly fields — dimmed data-slate */
.deathwatch.sheet .window-content input[readonly] {
  background: rgba(20, 20, 20, 0.6);
  color: var(--dw-deathwatch-silver-dark);
  text-shadow: none;
  border-color: rgba(138, 155, 168, 0.15);
}
```

**Effect:** Input fields look like Power Armor HUD data-slates with inset depth, HUD green text, and Imperial gold glow on focus.

---

### 6. Cohesion Panel — Tactical Display

**File:** `src/styles/components/cohesion.css:7`

```css
/* CURRENT */
#cohesion-panel .window-content {
  padding: 6px 10px;
  background: rgba(30, 30, 30, 0.95);
  color: #eee;
}

/* UPDATE */
#cohesion-panel .window-content {
  padding: 10px 12px;
  
  /* Tactical display background */
  background: 
    /* Corner scan effect */
    radial-gradient(
      circle at top left,
      rgba(212, 165, 116, 0.08),
      transparent 30%
    ),
    /* Grid pattern */
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 8px,
      rgba(138, 155, 168, 0.05) 8px,
      rgba(138, 155, 168, 0.05) 9px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 8px,
      rgba(138, 155, 168, 0.05) 8px,
      rgba(138, 155, 168, 0.05) 9px
    ),
    /* Base dark */
    linear-gradient(
      135deg,
      rgba(10, 10, 10, 0.98),
      rgba(20, 20, 20, 0.98)
    );
  
  background-size:
    100% 100%,
    8px 8px,
    8px 8px,
    100% 100%;
  
  /* Tactical display frame */
  border: 2px solid var(--dw-imperial-gold-dark);
  border-radius: 4px;
  
  /* Holographic glow */
  box-shadow: 
    inset 0 0 20px rgba(0, 0, 0, 0.8),
    inset 0 1px 0 rgba(212, 165, 116, 0.2),
    0 0 16px rgba(212, 165, 116, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.9);
  
  color: var(--dw-deathwatch-silver-light);
}
```

**Effect:** Cohesion panel looks like a tactical holographic display with grid pattern, corner glow, and Imperial gold frame.

---

## 📋 Optional: Texture Image Overlays

For maximum authenticity, you can add actual texture image overlays.

### Texture Sources

1. **Parchment texture** — Aged paper, subtle grain
2. **Metal scratches** — Battle damage, wear marks
3. **Noise grain** — Film grain, static interference

### Implementation Example

```css
/* Add texture overlay to sheets */
.deathwatch.sheet .window-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('../images/textures/noise-grain.webp');
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: overlay;
  z-index: 1;
}

/* Ensure content is above texture */
.deathwatch.sheet .window-content > * {
  position: relative;
  z-index: 2;
}
```

**Note:** Texture images should be:
- **Small file size** (<50KB) to avoid performance issues
- **Subtle** (low opacity) to avoid visual clutter
- **Seamlessly tileable** for repeating patterns
- **WebP format** for optimal compression

---

## 🎯 Expected Impact

**Before:** Flat, sterile backgrounds with no atmosphere  
**After:** Rich, layered surfaces with depth, texture, and thematic immersion

These background improvements, combined with typography and color palette updates, will make the interface feel like authentic 40K technology — ancient, battle-hardened, and imposing.

---

_Blessed be these sacred texture protocols. May they consecrate our interface surfaces._

⚙️ **The Machine Spirit approves these atmospheric enhancements.**
