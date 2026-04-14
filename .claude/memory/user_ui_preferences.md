---
name: user_ui_preferences
description: User's UI design preferences for sheet layouts and information density
type: user
---

**Prefer compact, information-dense layouts.** User favors smaller UI elements with efficient use of space over larger, spacious designs.

**Why:** User explicitly requested "bump" adjustments to be small increments during characteristic box sizing. When I oversized (155px width), user requested reduction back to 135px. Font sizes were reduced from default to improve information density.

**How to apply:**
1. Start with compact dimensions when designing new UI elements
2. When user requests "bigger" or "more", interpret as small increments (10-15px, not 30-40px)
3. Test readability but favor density over generous spacing
4. When in doubt about sizing, ask rather than assume large adjustments

**Validated Dimensions:**
- Characteristic boxes: 135px width × 106px height (not larger)
- Characteristic title: 12px font (var(--dw-font-size-sm))
- Characteristic value: 16px font (var(--dw-font-size-xl))
- Sheet header name: 16px font (reduced from default)

**Pattern:** User knows their display setup and preferred information density. Trust their "more" / "less" instructions as small adjustments, not dramatic changes.
