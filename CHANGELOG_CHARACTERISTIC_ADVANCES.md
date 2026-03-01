# Characteristic Advances UI Update

## Changes Made

### 1. Removed Characteristic Advances Table
- Deleted the entire "Characteristic Advances" section from the actor sheet
- This table was previously used to track characteristic improvements as separate items

### 2. Added Checkbox Advances to Characteristic Boxes
- Added four checkboxes (S, I, T, E) directly on each characteristic box
- Each checkbox represents an advance level:
  - **S** = Simple (+5)
  - **I** = Intermediate (+5)
  - **T** = Trained (+5)
  - **E** = Expert (+5)
- Checkboxes appear below the characteristic value with tooltips

### 3. Updated Logic
- Modified `ModifierCollector.applyCharacteristicModifiers()` to apply advances before other modifiers
- Each checked advance adds +5 to the characteristic value
- Advances are applied from the `system.characteristics.{key}.advances` object

### 4. Data Structure
The characteristic advances are stored in `template.json`:
```json
"advances": { 
  "simple": false, 
  "intermediate": false, 
  "trained": false, 
  "expert": false 
}
```

## Benefits
- Simpler, more intuitive UI
- No need to create separate items for characteristic advances
- Direct visual feedback on the characteristic boxes
- Reduces clutter on the character sheet

## Testing
- All 375 tests pass
- Added specific tests for characteristic advances in `modifier-collector.test.mjs`
- Verified advances apply correctly (+5 per checkbox)
- Verified advances combine with other modifiers properly
