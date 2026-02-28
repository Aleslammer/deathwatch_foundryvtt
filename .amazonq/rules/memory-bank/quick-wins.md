# Quick Wins: Immediate Improvements

## 1. Extract XP Calculator (30 minutes)

### Create: `src/module/helpers/xp-calculator.mjs`
```javascript
export class XPCalculator {
  static STARTING_XP = 13000;
  static RANK_THRESHOLDS = [13000, 17000, 21000, 25000, 30000, 35000, 40000, 45000];

  static calculateRank(totalXP) {
    const xp = totalXP || this.STARTING_XP;
    for (let i = this.RANK_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= this.RANK_THRESHOLDS[i]) return i + 1;
    }
    return 1;
  }

  static calculateSpentXP(actor) {
    let spent = this.STARTING_XP;
    const chapterCosts = this._getChapterCosts(actor);
    
    spent += this._calculateCharacteristicAdvanceCosts(actor);
    spent += this._calculateTalentCosts(actor, chapterCosts.talents);
    spent += this._calculateSkillCosts(actor, chapterCosts.skills);
    
    return spent;
  }

  static _getChapterCosts(actor) {
    const chapter = actor.system.chapterId ? actor.items.get(actor.system.chapterId) : null;
    return {
      skills: chapter?.system.skillCosts || {},
      talents: chapter?.system.talentCosts || {}
    };
  }

  static _calculateCharacteristicAdvanceCosts(actor) {
    return actor.items
      .filter(i => i.type === 'characteristic-advance')
      .reduce((sum, i) => sum + (i.system.cost || 0), 0);
  }

  static _calculateTalentCosts(actor, chapterTalentCosts) {
    const talentCounts = {};
    let total = 0;
    
    for (const item of actor.items.filter(i => i.type === 'talent')) {
      const sourceId = this._getTalentSourceId(item);
      const cost = chapterTalentCosts[sourceId] ?? item.system.cost ?? 0;
      
      if (!talentCounts[item.name]) {
        talentCounts[item.name] = { 
          count: 0, 
          firstCost: cost, 
          subsequentCost: item.system.subsequentCost ?? 0,
          stackable: item.system.stackable 
        };
      }
      
      const talent = talentCounts[item.name];
      talent.count++;
      
      if (talent.count === 1) {
        total += cost;
      } else if (talent.stackable && talent.subsequentCost) {
        total += talent.subsequentCost;
      } else {
        total += cost;
      }
    }
    
    return total;
  }

  static _getTalentSourceId(item) {
    if (item.system.compendiumId) return item.system.compendiumId;
    if (item.flags?.core?.sourceId) {
      return item.flags.core.sourceId.split('.').pop();
    }
    if (item._stats?.compendiumSource) {
      return item._stats.compendiumSource.split('.').pop();
    }
    return item._id;
  }

  static _calculateSkillCosts(actor, chapterSkillCosts) {
    let total = 0;
    
    for (const [key, skill] of Object.entries(actor.system.skills || {})) {
      const costs = chapterSkillCosts[key] || {};
      const trainCost = costs.costTrain ?? skill.costTrain ?? 0;
      const masterCost = costs.costMaster ?? skill.costMaster ?? 0;
      const expertCost = costs.costExpert ?? skill.costExpert ?? 0;
      
      if (skill.trained) total += trainCost;
      if (skill.mastered) total += masterCost;
      if (skill.expert) total += expertCost;
    }
    
    return total;
  }
}
```

### Update: `src/module/documents/actor.mjs`
```javascript
import { XPCalculator } from "../helpers/xp-calculator.mjs";

_prepareCharacterData(actorData) {
  if (actorData.type !== 'character') return;
  
  const systemData = actorData.system;
  
  // Calculate rank and XP
  systemData.rank = XPCalculator.calculateRank(systemData.xp?.total || systemData.xp);
  const spentXP = XPCalculator.calculateSpentXP(this);
  
  if (typeof systemData.xp === 'object') {
    systemData.xp.spent = spentXP;
    systemData.xp.available = (systemData.xp.total || 13000) - spentXP;
  }
  
  // Rest of method...
}
```

### Create Test: `tests/xp-calculator.test.mjs`
```javascript
import { jest } from '@jest/globals';
import './setup.mjs';
import { XPCalculator } from '../src/module/helpers/xp-calculator.mjs';

describe('XPCalculator', () => {
  describe('calculateRank', () => {
    it('returns rank 1 for starting XP', () => {
      expect(XPCalculator.calculateRank(13000)).toBe(1);
    });
    
    it('returns rank 8 for max XP', () => {
      expect(XPCalculator.calculateRank(50000)).toBe(8);
    });
  });
  
  // More tests...
});
```

**Time**: 30 minutes  
**Impact**: Reduces actor.mjs by ~100 lines, improves testability  
**Risk**: Low (pure functions, easy to test)

---

## 2. Extract Modifier Collector (45 minutes)

### Create: `src/module/helpers/modifier-collector.mjs`
```javascript
import { debug } from "./debug.mjs";

export class ModifierCollector {
  static collectAllModifiers(actor) {
    const actorModifiers = actor.system.modifiers || [];
    const itemModifiers = this.collectItemModifiers(actor.items);
    return [...actorModifiers, ...itemModifiers];
  }

  static collectItemModifiers(items) {
    const modifiers = [];
    
    for (const item of items) {
      if (!item.system.equipped) continue;
      
      // Direct item modifiers
      if (item.system.modifiers) {
        for (const mod of item.system.modifiers) {
          if (mod.enabled !== false) {
            modifiers.push({ ...mod, source: item.name });
          }
        }
      }
      
      // Armor history modifiers
      if (item.type === 'armor' && Array.isArray(item.system.attachedHistories)) {
        modifiers.push(...this.collectArmorHistoryModifiers(item, items));
      }
    }
    
    return modifiers;
  }

  static collectArmorHistoryModifiers(armor, allItems) {
    const modifiers = [];
    
    for (const historyId of armor.system.attachedHistories) {
      const history = allItems.get(historyId);
      if (!history || !Array.isArray(history.system.modifiers)) continue;
      
      for (const mod of history.system.modifiers) {
        if (mod.enabled !== false) {
          modifiers.push({ 
            ...mod, 
            source: `${history.name} (${armor.name})` 
          });
        }
      }
    }
    
    return modifiers;
  }

  static applyCharacteristicModifiers(characteristics, modifiers) {
    for (const [key, characteristic] of Object.entries(characteristics)) {
      if (characteristic.base === undefined) {
        characteristic.base = characteristic.value;
      }
      
      let total = characteristic.base || 0;
      const appliedMods = [];
      
      for (const mod of modifiers) {
        if (mod.enabled !== false && 
            mod.effectType === 'characteristic' && 
            mod.valueAffected === key) {
          const modValue = parseInt(mod.modifier) || 0;
          total += modValue;
          appliedMods.push({ 
            name: mod.name, 
            value: modValue, 
            source: mod.source 
          });
        }
      }
      
      characteristic.value = total;
      characteristic.modifiers = appliedMods;
      characteristic.mod = Math.floor(total / 10);
    }
  }

  static applySkillModifiers(skills, modifiers) {
    for (const [key, skill] of Object.entries(skills)) {
      let total = 0;
      
      for (const mod of modifiers) {
        if (mod.enabled !== false && 
            mod.effectType === 'skill' && 
            mod.valueAffected === key) {
          total += parseInt(mod.modifier) || 0;
        }
      }
      
      skill.modifierTotal = total;
    }
  }

  static applyInitiativeModifiers(modifiers) {
    let total = 0;
    
    for (const mod of modifiers) {
      if (mod.enabled !== false && mod.effectType === 'initiative') {
        total += parseInt(mod.modifier) || 0;
      }
    }
    
    return total;
  }
}
```

### Update: `src/module/documents/actor.mjs`
```javascript
import { ModifierCollector } from "../helpers/modifier-collector.mjs";

_prepareCharacterData(actorData) {
  // ... XP calculation ...
  
  // Collect and apply modifiers
  const allModifiers = ModifierCollector.collectAllModifiers(this);
  ModifierCollector.applyCharacteristicModifiers(systemData.characteristics, allModifiers);
  
  if (systemData.skills) {
    ModifierCollector.applySkillModifiers(systemData.skills, allModifiers);
  }
  
  systemData.initiativeBonus = ModifierCollector.applyInitiativeModifiers(allModifiers);
}
```

**Time**: 45 minutes  
**Impact**: Reduces actor.mjs by ~150 lines, improves clarity  
**Risk**: Low (well-defined interface)

---

## 3. Add CSS Variables (15 minutes)

### Update: `src/styles/deathwatch.css`
Add at the top of the file:

```css
:root {
  /* Colors */
  --dw-color-primary: #007bff;
  --dw-color-primary-hover: #0056b3;
  --dw-color-secondary: #6c757d;
  --dw-color-secondary-hover: #545b62;
  --dw-color-success: green;
  --dw-color-danger: red;
  --dw-color-warning: #ffc107;
  
  /* Borders */
  --dw-color-border: #c9c7b8;
  --dw-color-border-light: #e9e9e9;
  --dw-color-border-dark: #eeede0;
  
  /* Backgrounds */
  --dw-color-bg-primary: #ffffff;
  --dw-color-bg-secondary: #f8f9fa;
  --dw-color-bg-tertiary: rgba(0, 0, 0, 0.05);
  --dw-color-bg-hover: #f8f9fa;
  
  /* Text */
  --dw-color-text-primary: #191813;
  --dw-color-text-secondary: #444;
  --dw-color-text-muted: #666;
  --dw-color-text-light: #495057;
  
  /* Spacing */
  --dw-spacing-xs: 2px;
  --dw-spacing-sm: 4px;
  --dw-spacing-md: 8px;
  --dw-spacing-lg: 16px;
  --dw-spacing-xl: 20px;
  
  /* Borders */
  --dw-border-width: 1px;
  --dw-border-width-thick: 2px;
  --dw-border-radius: 4px;
  --dw-border-radius-sm: 3px;
  
  /* Shadows */
  --dw-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --dw-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  /* Font sizes */
  --dw-font-size-xs: 11px;
  --dw-font-size-sm: 12px;
  --dw-font-size-md: 13px;
  --dw-font-size-lg: 14px;
  --dw-font-size-xl: 16px;
}
```

Then replace hardcoded values:
```css
/* Before */
.deathwatch .modifier-dialog {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 20px;
}

/* After */
.deathwatch .modifier-dialog {
  background: linear-gradient(135deg, var(--dw-color-bg-secondary) 0%, #e9ecef 100%);
  border: var(--dw-border-width) solid var(--dw-color-border);
  border-radius: var(--dw-border-radius);
  box-shadow: var(--dw-shadow-md);
  padding: var(--dw-spacing-xl);
}
```

**Time**: 15 minutes  
**Impact**: Easier theming, consistent styling  
**Risk**: Very low (CSS only)

---

## 4. Consolidate Roll Dialogs (60 minutes)

### Create: `src/module/helpers/roll-dialog-builder.mjs`
```javascript
import { DWConfig } from "./config.mjs";

export class RollDialogBuilder {
  static buildModifierDialog(targetValue, label) {
    let content = `
      <div class="modifier-dialog">
        <div class="form-group">
          <label for="difficulty-select">Difficulty:</label>
          <select id="difficulty-select" name="difficulty">
    `;
    
    for (const [key, difficulty] of Object.entries(DWConfig.TestDifficulties)) {
      const selected = key === 'challenging' ? 'selected' : '';
      const sign = difficulty.modifier >= 0 ? '+' : '';
      content += `<option value="${key}" ${selected}>${difficulty.label} (${sign}${difficulty.modifier})</option>`;
    }
    
    content += `
          </select>
        </div>
        <div class="form-group modifier-row">
          <label for="modifier">Misc:</label>
          <input type="text" id="modifier" name="modifier" value="" placeholder="e.g., +5, -10" />
        </div>
      </div>
    `;
    
    return content;
  }

  static attachModifierInputHandler(html) {
    const miscInput = html.find('#modifier');
    miscInput.on('input', function() {
      const value = this.value.replace(/[^0-9+\\-\\s]/g, '');
      if (this.value !== value) this.value = value;
    });
  }

  static parseModifiers(html) {
    const selectedDifficulty = html.find('#difficulty-select').val();
    const difficultyModifier = DWConfig.TestDifficulties[selectedDifficulty].modifier;
    const additionalModifierInput = html.find('#modifier').val().trim();
    
    let additionalModifier = 0;
    if (additionalModifierInput && additionalModifierInput.match(/^[-+]?\\d+$/)) {
      additionalModifier = parseInt(additionalModifierInput);
    }
    
    return {
      difficulty: selectedDifficulty,
      difficultyModifier,
      additionalModifier,
      difficultyLabel: DWConfig.TestDifficulties[selectedDifficulty].label
    };
  }

  static buildModifierParts(baseValue, label, modifiers) {
    const parts = [`${baseValue} ${label}`];
    
    if (modifiers.difficultyModifier !== 0) {
      const sign = modifiers.difficultyModifier >= 0 ? '+' : '';
      parts.push(`${sign}${modifiers.difficultyModifier} ${modifiers.difficultyLabel}`);
    }
    
    if (modifiers.additionalModifier !== 0) {
      const sign = modifiers.additionalModifier >= 0 ? '+' : '';
      parts.push(`${sign}${modifiers.additionalModifier} Misc`);
    }
    
    return parts;
  }

  static buildResultFlavor(label, target, roll, modifierParts) {
    const success = roll.total <= target;
    const degrees = Math.floor(Math.abs(target - roll.total) / 10);
    const resultText = success 
      ? `<span style="color: green;">SUCCESS! (${degrees} DoS)</span>` 
      : `FAILED! (${degrees} DoF)`;
    
    let flavor = `${label} - Target: ${target}<br><strong>${resultText}</strong>`;
    
    if (modifierParts.length > 0) {
      flavor += `<details style="margin-top:4px;">`;
      flavor += `<summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary>`;
      flavor += `<div style="font-size:0.85em;margin-top:4px;">${modifierParts.join('<br>')}</div>`;
      flavor += `</details>`;
    }
    
    return flavor;
  }
}
```

### Update: `src/module/sheets/actor-sheet.mjs`
```javascript
import { RollDialogBuilder } from "../helpers/roll-dialog-builder.mjs";

async _onCharacteristicRoll(dataset) {
  const rollData = this.actor.getRollData();
  const characteristicKey = dataset.characteristic;
  const label = `[Characteristic] ${dataset.label}`;
  const characteristic = this.actor.system.characteristics[characteristicKey];
  
  const content = RollDialogBuilder.buildModifierDialog(characteristic.value, dataset.label);
  
  return new Dialog({
    title: `Roll ${dataset.label}`,
    content: content,
    render: (html) => RollDialogBuilder.attachModifierInputHandler(html),
    buttons: {
      roll: {
        label: "Roll",
        class: "dialog-button roll",
        callback: async (html) => {
          const modifiers = RollDialogBuilder.parseModifiers(html);
          const target = characteristic.value + modifiers.difficultyModifier + modifiers.additionalModifier;
          
          const roll = new Roll('1d100', rollData);
          await roll.evaluate();
          
          const modifierParts = RollDialogBuilder.buildModifierParts(
            characteristic.value, 
            dataset.label, 
            modifiers
          );
          
          const flavor = RollDialogBuilder.buildResultFlavor(label, target, roll, modifierParts);
          
          roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: flavor,
            rollMode: game.settings.get('core', 'rollMode')
          });
        }
      },
      cancel: {
        label: "Cancel",
        class: "dialog-button cancel"
      }
    },
    default: "roll"
  }).render(true);
}

// Similar refactoring for _onSkillRoll
```

**Time**: 60 minutes  
**Impact**: Eliminates ~150 lines of duplicate code  
**Risk**: Medium (requires careful testing)

---

## Summary

| Task | Time | Lines Saved | Risk | Priority | Status |
|------|------|-------------|------|----------|--------|
| XP Calculator | 30 min | ~100 | Low | High | ✅ COMPLETE |
| Modifier Collector | 45 min | ~150 | Low | High | ⏳ Next |
| CSS Variables | 15 min | 0 | Very Low | Medium | ⏳ Pending |
| Roll Dialog Builder | 60 min | ~150 | Medium | High | ⏳ Pending |
| **Total** | **2.5 hours** | **~400 lines** | | | **25% Done** |

## Testing Checklist

After each change:
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run test:coverage` - coverage maintained or improved
- [ ] Manual test in Foundry - character sheet loads
- [ ] Manual test - XP calculation correct
- [ ] Manual test - Modifiers apply correctly
- [ ] Manual test - Roll dialogs work
- [ ] Check console for errors
- [ ] Verify no breaking changes

## Rollback Plan

Each change is isolated and can be rolled back independently:
1. Keep original code commented out initially
2. Test thoroughly before removing old code
3. Commit after each successful change
4. Use git to revert if issues arise
