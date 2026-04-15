# Animations & Motion

**Priority:** 🔥🔥 **HIGH**  
**Effort:** ⚡⚡ Medium (CSS animations)  
**Impact:** Brings the interface to life with tactical HUD effects and responsive feedback

---

## 🚨 Current Problem

**File:** Multiple component CSS files

```css
/* Minimal animation */
.rollable:hover {
  text-shadow: 0 0 10px red;
}

/* Basic transitions */
transition: opacity 0.15s;
```

**Issue:** The interface is **almost entirely static**. There are no meaningful animations, micro-interactions, or motion design. Hover states use simple opacity changes. Nothing feels alive or responsive — it's a missed opportunity to create the feeling of a Power Armor HUD or tactical display.

---

## 🎯 Design Direction

Warhammer 40K Deathwatch animations should evoke:

1. **Power Armor HUD activation** — Elements powering up, scan lines, energy glow
2. **Tactical displays** — Data streaming, readout updates, targeting reticles
3. **Status indicators** — Critical alerts, warning pulses, system diagnostics
4. **Ancient technology** — Deliberate, weighty animations (not snappy modern UI)
5. **Strategic restraint** — High-impact moments, not scattered micro-interactions

**Philosophy:** One well-orchestrated effect > many scattered animations

---

## ✅ Recommended Implementations

### 1. Rollable Elements — Power Armor HUD Activation

**File:** `src/styles/base.css:6`

```css
/* CURRENT */
.rollable:hover,
.rollable:focus {
  color: #000;
  text-shadow: 0 0 10px red;
  cursor: pointer;
}

/* UPDATE */
.rollable {
  position: relative;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.rollable:hover,
.rollable:focus {
  color: var(--dw-hud-green);
  text-shadow: 
    0 0 8px var(--dw-hud-green),
    0 0 16px var(--dw-hud-green),
    0 0 24px rgba(57, 255, 20, 0.4);
  transform: scale(1.05);
}

/* Optional: Charging effect */
.rollable::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0%;
  height: 2px;
  background: var(--dw-hud-green);
  box-shadow: 0 0 4px var(--dw-hud-green);
  transition: width 0.3s ease;
}

.rollable:hover::after {
  width: 100%;
}
```

**Effect:** Rollable elements scale up, glow with HUD green energy, and show a charging bar underneath. Feels like activating a tactical display.

---

### 2. Characteristic Boxes — Servo-Skull Scan

**File:** `src/styles/components/characteristics.css:15`

```css
/* ADD after existing .characteristic styles */

.deathwatch .characteristic {
  /* ...existing styles... */
  transition: all 0.4s ease;
  overflow: hidden;
}

/* Scan line effect */
.deathwatch .characteristic::before {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(57, 255, 20, 0.2),
    rgba(57, 255, 20, 0.4),
    rgba(57, 255, 20, 0.2),
    transparent
  );
  transition: top 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 1;
}

.deathwatch .characteristic:hover::before {
  top: 100%;
}

/* Glow on hover */
.deathwatch .characteristic:hover {
  border-color: var(--dw-imperial-gold);
  box-shadow: 
    inset 2px 2px 4px rgba(0, 0, 0, 0.8),
    inset -2px -2px 4px rgba(255, 255, 255, 0.05),
    0 4px 8px rgba(0, 0, 0, 0.6),
    0 0 12px rgba(212, 165, 116, 0.4);
}

/* Characteristic total glow */
.deathwatch .characteristic-total {
  transition: all 0.3s ease;
}

.deathwatch .characteristic:hover .characteristic-total {
  color: var(--dw-imperial-gold-light);
  text-shadow: 
    0 0 6px rgba(212, 165, 116, 0.6),
    0 0 12px rgba(212, 165, 116, 0.3);
}
```

**Effect:** When hovering over a characteristic box, a HUD scan line sweeps down from top to bottom. The box glows with Imperial gold, and the total value brightens. Feels like a servo-skull performing a biometric scan.

---

### 3. Wounds/Fatigue — Critical Status Pulse

**File:** `src/styles/components/wounds.css`

Add critical state detection and pulsing animation:

```css
/* Critical wounds pulse (wounds ≤ 25%) */
.wounds-box.critical {
  animation: critical-pulse 2s infinite;
}

@keyframes critical-pulse {
  0%, 100% { 
    border-color: var(--dw-critical-damage);
    box-shadow: 
      0 0 8px rgba(220, 20, 60, 0.6),
      inset 0 0 12px rgba(220, 20, 60, 0.2);
  }
  50% { 
    border-color: var(--dw-critical-severe);
    box-shadow: 
      0 0 20px rgba(220, 20, 60, 0.9),
      0 0 40px rgba(220, 20, 60, 0.4),
      inset 0 0 20px rgba(220, 20, 60, 0.4);
  }
}

/* Exhausted pulse (fatigue ≥ TB) */
.fatigue-box.exhausted {
  animation: exhausted-pulse 2.5s infinite;
}

@keyframes exhausted-pulse {
  0%, 100% { 
    border-color: var(--dw-hud-amber);
    box-shadow: 
      0 0 8px rgba(255, 191, 0, 0.5),
      inset 0 0 8px rgba(255, 191, 0, 0.15);
  }
  50% { 
    border-color: var(--dw-hud-amber-bright);
    box-shadow: 
      0 0 16px rgba(255, 191, 0, 0.8),
      0 0 32px rgba(255, 191, 0, 0.3),
      inset 0 0 16px rgba(255, 191, 0, 0.3);
  }
}
```

**JavaScript Hook (add to actor sheet):**
```javascript
// Add/remove critical classes based on wounds/fatigue
const woundsPercent = actor.system.wounds.value / actor.system.wounds.max;
const fatiguePercent = actor.system.fatigue.value / actor.system.fatigue.max;

if (woundsPercent <= 0.25) {
  html.querySelector('.wounds-box')?.classList.add('critical');
} else {
  html.querySelector('.wounds-box')?.classList.remove('critical');
}

if (actor.system.fatigue.value >= actor.system.characteristics.toughness.bonus) {
  html.querySelector('.fatigue-box')?.classList.add('exhausted');
} else {
  html.querySelector('.fatigue-box')?.classList.remove('exhausted');
}
```

**Effect:** When a character is critically wounded (≤25% wounds) or exhausted (fatigue ≥ TB), the status box pulses with warning colors. Creates urgency and draws attention to dangerous conditions.

---

### 4. Section Headers — Scan Line Animation

**File:** `src/styles/components/items.css:25`

```css
/* ADD to existing .section-header */
.deathwatch .section-header {
  /* ...existing styles... */
  position: relative;
  overflow: hidden;
}

/* Animated scan line */
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
    rgba(212, 165, 116, 0.4),
    rgba(212, 165, 116, 0.6),
    rgba(212, 165, 116, 0.4),
    transparent
  );
  animation: section-scan 5s infinite;
  animation-delay: calc(var(--scan-delay, 0) * 1s);
  pointer-events: none;
  z-index: 1;
}

@keyframes section-scan {
  0% { 
    left: -25%; 
  }
  20% {
    left: 125%;
  }
  100% {
    left: 125%;
  }
}

/* Stagger scan animations */
.section-header:nth-of-type(1) { --scan-delay: 0; }
.section-header:nth-of-type(2) { --scan-delay: 1; }
.section-header:nth-of-type(3) { --scan-delay: 2; }
.section-header:nth-of-type(4) { --scan-delay: 3; }
```

**Effect:** A golden scan line sweeps across section headers at staggered intervals, creating a data-processing/tactical-display effect. Low-key animation that adds life without being distracting.

---

### 5. Item Hover — Data Highlight

**File:** `src/styles/components/items.css`

```css
/* Items list rows */
.deathwatch .items-list .item {
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

/* Hover background slide-in */
.deathwatch .items-list .item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(212, 165, 116, 0.08),
    rgba(212, 165, 116, 0.12)
  );
  transition: left 0.3s ease;
  z-index: 0;
}

.deathwatch .items-list .item:hover::before {
  left: 0;
}

.deathwatch .items-list .item:hover {
  border-left: 2px solid var(--dw-imperial-gold);
  padding-left: calc(5px - 2px); /* Compensate for border */
}

/* Item name glow on hover */
.deathwatch .items-list .item:hover .item-name {
  color: var(--dw-imperial-gold-light);
  text-shadow: 0 0 4px rgba(212, 165, 116, 0.4);
}

/* Ensure item content above background */
.deathwatch .items-list .item > * {
  position: relative;
  z-index: 1;
}
```

**Effect:** When hovering over an item, a golden highlight slides in from the left, and the item name glows. Feels like selecting a target in a tactical display.

---

### 6. Dialog Entrance — Modal Materialize

**File:** `src/styles/components/dialogs.css`

```css
/* Add to dialog wrapper */
.deathwatch .modifier-dialog {
  /* ...existing styles... */
  animation: dialog-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dialog-enter {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Button press effect */
.deathwatch .modifier-dialog .dialog-button {
  transition: all 0.15s ease;
  position: relative;
}

.deathwatch .modifier-dialog .dialog-button:active {
  transform: scale(0.95);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Roll button pulse on hover */
.deathwatch .modifier-dialog .dialog-button.roll:hover {
  animation: button-ready-pulse 1.5s infinite;
}

@keyframes button-ready-pulse {
  0%, 100% {
    box-shadow: 0 0 8px rgba(212, 165, 116, 0.4);
  }
  50% {
    box-shadow: 0 0 16px rgba(212, 165, 116, 0.6);
  }
}
```

**Effect:** Dialogs materialize with a slight scale-up and slide-down. Roll buttons pulse when ready. Press feedback makes buttons feel tactile.

---

### 7. Tab Activation — Data Stream Load

**File:** `src/styles/deathwatch.css` (tabs section)

```css
/* Tab items */
.deathwatch .sheet-tabs .item {
  /* ...existing styles... */
  position: relative;
  transition: all 0.3s ease;
}

/* Active tab: loading bar animation */
.deathwatch .sheet-tabs .item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--dw-imperial-gold),
    transparent
  );
  animation: tab-load 0.5s ease-out;
}

@keyframes tab-load {
  0% {
    transform: scaleX(0);
    opacity: 0;
  }
  100% {
    transform: scaleX(1);
    opacity: 1;
  }
}

/* Hover preview */
.deathwatch .sheet-tabs .item:hover:not(.active) {
  color: var(--dw-imperial-gold-light);
  text-shadow: 0 0 4px rgba(212, 165, 116, 0.3);
  border-bottom-color: var(--dw-imperial-gold-dark);
}
```

**Effect:** When switching tabs, the active indicator loads in with an expanding bar. Hover states preview activation with subtle glow.

---

### 8. Cohesion Value Update — Data Flash

**File:** `src/styles/components/cohesion.css`

```css
/* Cohesion value with transition */
.cohesion-panel-inner .cohesion-value {
  /* ...existing styles... */
  transition: all 0.3s ease;
}

/* Flash effect on change (triggered by JS) */
.cohesion-panel-inner .cohesion-value.flash-update {
  animation: value-flash 0.6s ease-out;
}

@keyframes value-flash {
  0% {
    color: var(--dw-imperial-gold-light);
    text-shadow: 
      0 0 12px var(--dw-imperial-gold),
      0 0 24px rgba(212, 165, 116, 0.6);
    transform: scale(1.15);
  }
  100% {
    color: var(--dw-imperial-gold);
    text-shadow: 0 0 8px rgba(212, 165, 116, 0.5);
    transform: scale(1);
  }
}

/* Mode indicator pulse on change */
.mode-indicator {
  /* ...existing styles... */
  transition: all 0.3s ease;
}

.mode-indicator.mode-change {
  animation: mode-pulse 0.5s ease-out;
}

@keyframes mode-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
    filter: brightness(1.5);
  }
}
```

**JavaScript Hook:**
```javascript
// Trigger flash when cohesion changes
const valueElement = document.querySelector('.cohesion-value');
valueElement.classList.add('flash-update');
setTimeout(() => valueElement.classList.remove('flash-update'), 600);
```

**Effect:** When cohesion value changes, the number flashes and scales up briefly. Mode indicators pulse when switching between Solo/Squad Mode.

---

## 🎨 Animation Timing Guide

### Easing Functions

```css
:root {
  /* Standard ease */
  --dw-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --dw-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --dw-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Bounce (for dramatic moments) */
  --dw-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Sharp (tactical, instant) */
  --dw-ease-sharp: cubic-bezier(0.4, 0, 0.6, 1);
}
```

### Duration Guidelines

| Interaction Type | Duration | Use Case |
|---|---|---|
| **Instant feedback** | 150ms | Button press, checkbox toggle |
| **Quick transition** | 250-300ms | Hover effects, color changes |
| **Standard animation** | 400-500ms | Scan lines, tab switches |
| **Deliberate effect** | 600-800ms | Dialog entrance, value flash |
| **Ambient loop** | 2-5s | Pulse effects, scan line sweeps |

**Philosophy:** Ancient technology should feel weighty and deliberate, not snappy like modern UI.

---

## 📋 Performance Considerations

### GPU-Accelerated Properties Only

**Use these (fast):**
- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (brightness, blur)

**Avoid these (slow):**
- `width`, `height`
- `top`, `left` (use `transform: translate` instead)
- `background-position` (use `transform` on pseudo-element instead)

### Animation Best Practices

```css
/* ✅ Good: GPU-accelerated */
.element {
  transform: translateX(100px);
  opacity: 0.5;
}

/* ❌ Bad: Forces layout recalculation */
.element {
  left: 100px;
  width: 200px;
}

/* Trigger GPU acceleration */
.animated-element {
  will-change: transform, opacity;
}
```

---

## 🎯 Expected Impact

**Before:** Static interface, no feedback, feels lifeless  
**After:** Responsive, alive, feels like interacting with Power Armor HUD systems

Strategic animation creates:
- **Tactile feedback** — Buttons feel pressable
- **System responsiveness** — Interface feels alive
- **Visual hierarchy** — Important moments (critical wounds) get attention
- **Thematic immersion** — Every interaction reinforces 40K aesthetic

---

_Blessed be these sacred motion protocols. May they animate our interface with the Machine Spirit's vigor._

⚙️ **The Omnissiah approves these kinetic rituals.**
