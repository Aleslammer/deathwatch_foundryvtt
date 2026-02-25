# Talents Compendium

This directory contains talent definitions for the Deathwatch system.

## Structure

Each talent is defined in a separate JSON file with the following fields:

- **name**: The talent name
- **type**: Must be "talent"
- **img**: Icon path (default: "icons/svg/book.svg")
- **system**:
  - **prerequisite**: Required characteristic or skill (e.g., "INT 40", "AG 30")
  - **benefit**: Short summary of the talent's mechanical benefit
  - **book**: Source book reference
  - **page**: Page number in source book
  - **description**: Full HTML description of the talent's effects
  - **modifiers**: Array of modifier objects that can be applied to the character

## Example

```json
{
  "name": "Combat Formation",
  "type": "talent",
  "img": "systems/deathwatch/icons/talents/generic.webp",
  "system": {
    "prerequisite": "INT 40",
    "benefit": "Use Int Bonus for Initiative",
    "book": "",
    "page": "",
    "description": "<p>The character has directed his comrades to prepare for danger...</p>",
    "modifiers": []
  }
}
```

## Modifiers

Talents can include modifiers that automatically apply effects when the talent is added to a character. The modifiers array follows the same structure as other item modifiers in the system.

## Building

After adding or modifying talents, run:
```bash
npm run build:packs
```
