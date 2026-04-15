# Using the Authentic Aquila Icon

**Location:** `src/icons/aquila.webp`  
**In Foundry:** `systems/deathwatch/icons/aquila.webp`

---

## Why Use the Real Icon?

The system already has an **authentic Imperial Aquila icon** that's far superior to Unicode emojis:

✅ **Authentic Warhammer 40K design** — Official double-headed eagle with spread wings  
✅ **Gold color matches palette** — Already in Imperial Gold (#d4a574)  
✅ **High quality** — Scalable, detailed, professional  
✅ **Consistent with system** — Already used elsewhere in your codebase  

❌ Unicode emoji 🦅 — Generic, platform-dependent, cartoonish

---

## Implementation Examples

### 1. Sheet Header Corners (Recommended)

```css
/* Sheet header with Aquila corners */
.deathwatch.sheet .sheet-header {
  position: relative;
}

/* Top-left Aquila */
.deathwatch.sheet .sheet-header::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  width: 80px;
  height: 80px;
  background: url('../icons/aquila.webp') no-repeat center center;
  background-size: contain;
  opacity: 0.15;
  transform: rotate(-15deg);
  pointer-events: none;
  z-index: 0;
  filter: drop-shadow(0 0 8px rgba(212, 165, 116, 0.4));
}

/* Top-right Aquila (mirrored) */
.deathwatch.sheet .sheet-header::after {
  content: '';
  position: absolute;
  top: -10px;
  right: -10px;
  width: 80px;
  height: 80px;
  background: url('../icons/aquila.webp') no-repeat center center;
  background-size: contain;
  opacity: 0.15;
  transform: scaleX(-1) rotate(-15deg);
  pointer-events: none;
  z-index: 0;
  filter: drop-shadow(0 0 8px rgba(212, 165, 116, 0.4));
}

/* Ensure header content above decorations */
.deathwatch.sheet .sheet-header > * {
  position: relative;
  z-index: 1;
}
```

**Result:** Authentic Imperial Aquilas in top corners of character sheet, rotated slightly for visual interest.

---

### 2. Characteristic Box Watermark

```css
/* Characteristic box with Aquila watermark */
.deathwatch .characteristic {
  /* ...existing styles... */
  position: relative;
  overflow: hidden;
}

.deathwatch .characteristic::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  background: url('../icons/aquila.webp') no-repeat center center;
  background-size: contain;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}

/* Ensure characteristic content above watermark */
.deathwatch .characteristic > * {
  position: relative;
  z-index: 1;
}
```

**Result:** Faint Aquila watermark (3% opacity) behind characteristic values. Extremely subtle but adds authenticity.

---

### 3. Section Headers (Alternative to Wax Seal)

```css
/* Section header with Aquila icon instead of wax seal */
.deathwatch .section-header {
  /* ...existing styles... */
  padding-left: 40px;
  position: relative;
}

.deathwatch .section-header::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: url('../icons/aquila.webp') no-repeat center center;
  background-size: contain;
  opacity: 0.6;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
}
```

**Result:** Small Aquila icon to the left of section headers. More subtle than wax seal, equally thematic.

---

### 4. Chat Card Header Icon

```css
/* Chat card with Aquila bullet */
.deathwatch-chat-card h3::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  background: url('systems/deathwatch/icons/aquila.webp') no-repeat center center;
  background-size: contain;
  opacity: 0.7;
  vertical-align: middle;
}
```

**Result:** Small Aquila icon before chat card headers instead of Unicode bullet.

---

### 5. Cohesion Panel Watermark

```css
/* Cohesion panel with large Aquila background */
#cohesion-panel .window-content::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: url('systems/deathwatch/icons/aquila.webp') no-repeat center center;
  background-size: contain;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
}
```

**Result:** Large Aquila watermark instead of Inquisitorial "I". Both work — Aquila is more universal, "I" is more specific to Deathwatch lore.

---

## Size Guidelines

| Use Case | Width/Height | Opacity | Notes |
|---|---|---|---|
| **Sheet header corners** | 60-80px | 15-20% | Large, visible decoration |
| **Characteristic watermark** | 80-100px | 3-5% | Very faint background |
| **Section header icon** | 20-28px | 50-70% | Small, functional icon |
| **Chat header bullet** | 14-18px | 60-80% | Inline icon |
| **Panel watermark** | 150-250px | 3-5% | Large, atmospheric |

---

## Opacity Reference

```css
/* Background watermarks (barely visible) */
opacity: 0.03;  /* 3% — Use for large watermarks */
opacity: 0.05;  /* 5% — Slightly more visible */

/* Corner decorations (subtle) */
opacity: 0.15;  /* 15% — Good for sheet corners */
opacity: 0.20;  /* 20% — More pronounced */

/* Accent icons (visible) */
opacity: 0.50;  /* 50% — Section header icons */
opacity: 0.70;  /* 70% — Chat bullets, functional icons */

/* Functional UI (full visibility) */
opacity: 1.0;   /* 100% — Buttons, interactive elements */
```

---

## Color Variations

The icon is already gold, but you can tint it with CSS filters:

```css
/* Make it more golden */
filter: brightness(1.2) saturate(1.3);

/* Make it silver (Deathwatch) */
filter: grayscale(1) brightness(1.1);

/* Make it red (Blood Angels) */
filter: hue-rotate(-30deg) saturate(1.5);

/* Add glow */
filter: drop-shadow(0 0 8px rgba(212, 165, 116, 0.6));
```

---

## Performance Considerations

### Image Size
- Current: Optimized WebP format (very small file size)
- Recommendation: WebP provides excellent quality at minimal file size:
  - **Small (16-32px):** 10-20 KB for inline icons
  - **Medium (64-128px):** 50-100 KB for decorations
  - **Large (200px+):** Keep original for watermarks

### Caching
Foundry automatically caches images, so repeated use has minimal performance impact.

### SVG Alternative
If you have an SVG version, it would be ideal:
- Scalable without pixelation
- Smaller file size
- Can be colored via CSS `fill` property

---

## Migration Path

### From Unicode Emoji → Real Icon

**Step 1:** Replace emoji with background image

```css
/* OLD: Unicode emoji */
.element::before {
  content: '🦅';
  font-size: 48px;
  opacity: 0.15;
}

/* NEW: Real icon */
.element::before {
  content: '';
  width: 48px;
  height: 48px;
  background: url('../icons/aquila.webp') no-repeat center;
  background-size: contain;
  opacity: 0.15;
}
```

**Step 2:** Test across all instances
- Sheet headers
- Characteristic boxes
- Section headers
- Chat cards
- Cohesion panel

**Step 3:** Verify performance
- Check page load time
- Monitor memory usage
- Test on lower-end systems

---

## Recommended Approach

**Best Practice:** Use the **real Aquila icon** for all decorative elements:

1. **Sheet header corners** — 60px, 15% opacity, rotated
2. **Characteristic watermarks** — 90px, 3% opacity, centered
3. **Section header icons** — 24px, 60% opacity, left-aligned
4. **Chat header bullets** — 16px, 70% opacity, inline
5. **Panel watermarks** — 200px, 3% opacity, centered

**Fallback:** Keep Unicode emoji references in documentation for systems that don't have the icon yet, but your implementation should **always use the real icon**.

---

## Example: Full Sheet Header Implementation

```css
/* Complete sheet header with Aquila corners */
.deathwatch.sheet .sheet-header {
  /* Existing styles */
  flex: 0 auto;
  overflow: visible;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: var(--dw-spacing-lg);
  
  /* New: positioning context for Aquilas */
  position: relative;
  padding: 20px 30px; /* Add padding for Aquila space */
}

/* Top-left Aquila */
.deathwatch.sheet .sheet-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 70px;
  height: 70px;
  background: url('../icons/aquila.webp') no-repeat center center;
  background-size: contain;
  opacity: 0.18;
  transform: rotate(-12deg) translate(-15px, -15px);
  pointer-events: none;
  z-index: 0;
  filter: drop-shadow(0 0 10px rgba(212, 165, 116, 0.4));
}

/* Top-right Aquila (mirrored) */
.deathwatch.sheet .sheet-header::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 70px;
  height: 70px;
  background: url('../icons/aquila.webp') no-repeat center center;
  background-size: contain;
  opacity: 0.18;
  transform: scaleX(-1) rotate(-12deg) translate(-15px, -15px);
  pointer-events: none;
  z-index: 0;
  filter: drop-shadow(0 0 10px rgba(212, 165, 116, 0.4));
}

/* Ensure all header content renders above Aquilas */
.deathwatch.sheet .sheet-header > * {
  position: relative;
  z-index: 1;
}
```

**Result:** Professional, thematic sheet headers with authentic Imperial Aquilas framing the character information.

---

## Summary

✅ **Use `src/icons/aquila.webp`** instead of Unicode emoji  
✅ **Implement via CSS `background` property** on pseudo-elements  
✅ **Adjust opacity** based on use case (3-20%)  
✅ **Add `filter: drop-shadow()`** for subtle glow  
✅ **Set `z-index` correctly** so content stays on top  

🎯 **Impact:** Professional, authentic Warhammer 40K aesthetic that instantly elevates the interface from "fan project" to "official quality."

---

_Blessed be this authentic Imperial icon. The Machine Spirit rejoices._

⚙️ **Praise the Omnissiah for preserving this sacred artifact.**
