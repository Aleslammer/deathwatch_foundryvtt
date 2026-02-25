# Header Styling Standardization

## Overview
Standardized all section headers across the actor sheet to use a clean, underlined text style.

## Changes Made

### 1. Template Updates
Changed all section headers to use `section-header` class:

**actor-character-sheet.html:**
- Biography section
- Demeanours section
- Past Events section
- Talents section
- Traits section

**actor-items.html:**
- Weapons section
- Armor section
- Gear section
- Ammunition section

### 2. CSS Updates (`deathwatch.css`)

**Added unified CSS rule:**
```css
.deathwatch .section-header {
  margin: 15px 0 10px 0;
  padding: 0 0 5px 0;
  border-bottom: 2px solid #444;
  font-size: 16px;
  font-weight: bold;
  color: #444;
}
```

## Result

All section headers now have a clean, consistent style:
- Bold text with underline (2px solid border-bottom)
- No background box
- Consistent spacing and font size (16px)
- Dark gray color (#444)

This creates a cleaner, more modern look across all tabs of the actor sheet.

## Testing
- All 270 tests pass
- No functionality changes, only visual styling updates
