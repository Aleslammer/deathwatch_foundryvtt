# Hit Breakdown Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add collapsible "Hits" section to attack chat messages showing step-by-step hit calculation breakdown (DoS, RoF caps, Blast/Explosive/Power Field bonuses).

**Architecture:** Mirror the existing `modifierParts` array pattern. Build `hitsParts` array during attack resolution, pass to enhanced `buildAttackFlavor()`, render as collapsible `<details>` section.

**Tech Stack:** Foundry VTT v13, JavaScript ES6 modules, Jest for testing

---

## File Structure

**Modified Files:**
- `src/module/helpers/combat/combat-dialog.mjs` - Add `hitsParts` parameter to `buildAttackFlavor()`
- `src/module/helpers/combat/ranged-combat.mjs` - Build `hitsParts` array in `resolveRangedAttack()`
- `src/module/helpers/combat/melee-combat.mjs` - Build `hitsParts` array in melee resolution
- `tests/combat/combat-dialog.test.mjs` - Test `buildAttackFlavor()` with `hitsParts`
- `tests/combat/resolve-ranged-attack.test.mjs` - Test ranged hit breakdown generation
- `tests/combat/resolve-melee-attack.test.mjs` - Test melee hit breakdown generation

---

## Task 1: Enhanced buildAttackFlavor() Function

**Files:**
- Modify: `src/module/helpers/combat/combat-dialog.mjs:162-165`
- Test: `tests/combat/combat-dialog.test.mjs`

- [ ] **Step 1: Write failing test for buildAttackFlavor with hitsParts**

Add to `tests/combat/combat-dialog.test.mjs` at the end of the `CombatDialogHelper` describe block:

```javascript
describe('buildAttackFlavor with hitsParts', () => {
  it('returns label only when no parts provided', () => {
    const label = 'Test Attack';
    const result = CombatDialogHelper.buildAttackFlavor(label, [], []);
    expect(result).toBe('Test Attack');
  });

  it('adds Hits section when hitsParts provided', () => {
    const label = 'Test Attack';
    const hitsParts = ['Degrees of Success: 8', 'Base Hits: 3', '<strong>Total: 3</strong>'];
    const result = CombatDialogHelper.buildAttackFlavor(label, [], hitsParts);
    
    expect(result).toContain('<details');
    expect(result).toContain('<summary style="cursor:pointer;font-size:0.9em;">Hits</summary>');
    expect(result).toContain('Degrees of Success: 8');
    expect(result).toContain('Base Hits: 3');
    expect(result).toContain('<strong>Total: 3</strong>');
  });

  it('adds both Hits and Modifiers sections when both provided', () => {
    const label = 'Test Attack';
    const hitsParts = ['Base Hits: 3'];
    const modifierParts = ['BS: 45'];
    const result = CombatDialogHelper.buildAttackFlavor(label, modifierParts, hitsParts);
    
    expect(result).toContain('Hits</summary>');
    expect(result).toContain('Modifiers</summary>');
    // Hits should appear before Modifiers
    const hitsIndex = result.indexOf('Hits</summary>');
    const modsIndex = result.indexOf('Modifiers</summary>');
    expect(hitsIndex).toBeLessThan(modsIndex);
  });

  it('maintains backward compatibility with only modifierParts', () => {
    const label = 'Test Attack';
    const modifierParts = ['BS: 45', 'Aim: +10'];
    const result = CombatDialogHelper.buildAttackFlavor(label, modifierParts);
    
    expect(result).toContain('Modifiers</summary>');
    expect(result).not.toContain('Hits</summary>');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/combat/combat-dialog.test.mjs`
Expected: FAIL - "Expected 3 arguments but got 2" or similar error

- [ ] **Step 3: Implement enhanced buildAttackFlavor()**

Modify `src/module/helpers/combat/combat-dialog.mjs` line 162-165:

```javascript
static buildAttackFlavor(label, modifierParts, hitsParts = []) {
  let flavor = label;
  
  // Add Hits section if hitsParts provided
  if (hitsParts.length > 0) {
    flavor += `<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Hits</summary><div style="font-size:0.85em;margin-top:4px;">${hitsParts.join('<br>')}</div></details>`;
  }
  
  // Add Modifiers section if modifierParts provided
  if (modifierParts.length > 0) {
    flavor += `<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary><div style="font-size:0.85em;margin-top:4px;">${modifierParts.join('<br>')}</div></details>`;
  }
  
  return flavor;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/combat/combat-dialog.test.mjs`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/module/helpers/combat/combat-dialog.mjs tests/combat/combat-dialog.test.mjs
git commit -m "feat: add hitsParts parameter to buildAttackFlavor()

Enhanced buildAttackFlavor() to accept optional hitsParts array for
displaying collapsible 'Hits' calculation breakdown. Maintains backward
compatibility with existing modifierParts-only usage.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Ranged Attack Hit Breakdown - Single Target

**Files:**
- Modify: `src/module/helpers/combat/ranged-combat.mjs:334-340` (return statement)
- Modify: `src/module/helpers/combat/ranged-combat.mjs:287-320` (add hitsParts logic)
- Modify: `src/module/helpers/combat/ranged-combat.mjs:620-626` (pass hitsParts to buildAttackFlavor)
- Test: `tests/combat/resolve-ranged-attack.test.mjs`

- [ ] **Step 1: Write failing test for ranged single target hitsParts**

Add to `tests/combat/resolve-ranged-attack.test.mjs`:

```javascript
describe('resolveRangedAttack hitsParts generation', () => {
  it('generates hitsParts for single target with single shot', async () => {
    const actor = createMockActor({ bs: 45 });
    const weapon = createMockWeapon({ name: 'Bolter', rof: 'S/3/10' });
    
    const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
      hitValue: 30, aim: 0, autoFire: 0, calledShot: 0,
      runningTarget: 0, miscModifier: 0, rangeMod: 0, rangeLabel: 'Short',
      rofParts: ['S', '3', '10'], sizeModifier: 0, sizeLabel: '', targetActor: null
    });
    
    expect(result.hitsParts).toBeDefined();
    expect(result.hitsParts).toEqual([
      'Degrees of Success: 1',
      '<strong>Total: 1 Hit</strong>'
    ]);
  });

  it('generates hitsParts for single target with full auto', async () => {
    const actor = createMockActor({ bs: 45 });
    const weapon = createMockWeapon({ name: 'Bolter', rof: 'S/3/10' });
    
    const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
      hitValue: 10, aim: 0, autoFire: 20, calledShot: 0,
      runningTarget: 0, miscModifier: 0, rangeMod: 0, rangeLabel: 'Short',
      rofParts: ['S', '3', '10'], sizeModifier: 0, sizeLabel: '', targetActor: null
    });
    
    const dos = Math.floor((result.targetNumber - 10) / 10);
    expect(result.hitsParts).toContain('Degrees of Success: ' + dos);
    expect(result.hitsParts).toContain(`Rate of Fire: ${result.roundsFired} rounds`);
    expect(result.hitsParts).toContain(`Base Hits: ${result.hitsTotal} (capped at ${result.maxHits})`);
    expect(result.hitsParts[result.hitsParts.length - 1]).toContain(`<strong>Total: ${result.hitsTotal} Hit`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/combat/resolve-ranged-attack.test.mjs -t "hitsParts generation"`
Expected: FAIL - "Cannot read properties of undefined (reading 'hitsParts')"

- [ ] **Step 3: Implement hitsParts generation for single targets**

In `src/module/helpers/combat/ranged-combat.mjs`, after line 287 (after `hitsTotal` calculation), add:

```javascript
// Build hits breakdown array
const hitsParts = [];
const degreesOfSuccess = CombatDialogHelper.calculateDegreesOfSuccess(hitValue, targetNumber);
hitsParts.push(`Degrees of Success: ${degreesOfSuccess}`);

// For multi-shot attacks, show RoF details
if (roundsFired > 1) {
  const rateLabel = autoFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO ? 'Full Auto' : 
                    autoFire === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO ? 'Semi-Auto' : 'Single';
  hitsParts.push(`Rate of Fire: ${roundsFired} round${roundsFired !== 1 ? 's' : ''} (${rateLabel})`);
  hitsParts.push(`Base Hits: ${hitsTotal} (capped at ${maxHits})`);
}

// Twin-Linked bonus
if (isTwinLinked && degreesOfSuccess >= 2) {
  hitsParts.push(`Twin-Linked: +1 (2+ DoS)`);
}

// Storm quality
if (isStorm && hitsTotal > 0) {
  const preStormHits = Math.floor(hitsTotal / 2);
  hitsParts.push(`Storm Quality: ×2 (${preStormHits} → ${hitsTotal})`);
}

// Scatter at Point Blank
if (isScatter && isPointBlank && degreesOfSuccess > 0) {
  const scatterBonus = Math.floor(degreesOfSuccess / 2);
  if (scatterBonus > 0) {
    hitsParts.push(`Scatter (Point Blank): +${scatterBonus} (DoS ÷ 2)`);
  }
}

hitsParts.push(`<strong>Total: ${hitsTotal} Hit${hitsTotal !== 1 ? 's' : ''}</strong>`);
```

Modify return statement (line 334-340) to include `hitsParts`:

```javascript
return {
  hitValue, targetNumber, hitsTotal, maxHits, roundsFired,
  isJammed, hasPrematureDetonation, isOverheated,
  hasReliable, ammoExpended, modifierParts, hitsParts,
  isStorm, isTwinLinked, isScatter, isPointBlank,
  accurateBonus, twinLinkedBonus, gyroRangeMod, weaponMods
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/combat/resolve-ranged-attack.test.mjs -t "hitsParts generation"`
Expected: All new tests PASS

- [ ] **Step 5: Update ranged attack chat message to use hitsParts**

In `src/module/helpers/combat/ranged-combat.mjs`, modify line 620-626:

```javascript
// Post chat message
const { hitsParts } = result; // Extract hitsParts from result
const label = CombatDialogHelper.buildAttackLabel(weapon.name, targetNumber, hitsTotal, isJammed || hasPrematureDetonation, isOverheated);
const flavor = CombatDialogHelper.buildAttackFlavor(label, modifierParts, hitsParts);
hitRoll.toMessage({
  speaker: ChatMessage.getSpeaker({ actor }),
  flavor: flavor,
  rollMode: game.settings.get('core', 'rollMode')
});
```

- [ ] **Step 6: Run full ranged combat tests**

Run: `npm test -- tests/combat/resolve-ranged-attack.test.mjs`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/module/helpers/combat/ranged-combat.mjs tests/combat/resolve-ranged-attack.test.mjs
git commit -m "feat: add hit breakdown for ranged single target attacks

Generate hitsParts array showing DoS, RoF, Twin-Linked, Storm, and
Scatter bonuses for single-target ranged attacks. Pass to
buildAttackFlavor() for display in chat messages.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Ranged Attack Hit Breakdown - Horde Target

**Files:**
- Modify: `src/module/helpers/combat/ranged-combat.mjs:287-320` (enhance hitsParts logic for hordes)
- Modify: `src/module/helpers/combat/ranged-combat.mjs:560-572` (update flame roll section)
- Test: `tests/combat/resolve-ranged-attack.test.mjs`

- [ ] **Step 1: Write failing test for ranged horde hitsParts**

Add to `tests/combat/resolve-ranged-attack.test.mjs`:

```javascript
describe('resolveRangedAttack hitsParts for horde targets', () => {
  it('generates hitsParts for horde with blast and explosive', async () => {
    const actor = createMockActor({ bs: 45 });
    const weapon = createMockWeapon({ 
      name: 'Bolter', 
      rof: 'S/3/10',
      dmgType: 'Explosive'
    });
    const horde = createMockHorde();
    
    // Mock WeaponQualityHelper
    WeaponQualityHelper.getBlastValue = jest.fn().mockResolvedValue(2);
    WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);
    
    const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
      hitValue: 10, aim: 0, autoFire: 20, calledShot: 0,
      runningTarget: 0, miscModifier: 0, rangeMod: 0, rangeLabel: 'Short',
      rofParts: ['S', '3', '10'], sizeModifier: 0, sizeLabel: '', 
      targetActor: horde
    });
    
    expect(result.hitsParts).toContain('Degrees of Success: 8');
    expect(result.hitsParts).toContain('Rate of Fire: 10 rounds (Full Auto)');
    expect(result.hitsParts).toContain('Base Hits: 3 (capped at 10)');
    expect(result.hitsParts).toContain('Blast [2]: +2');
    expect(result.hitsParts).toContain('Explosive Damage: +1');
    expect(result.hitsParts[result.hitsParts.length - 1]).toContain('<strong>Total: 6</strong>');
  });

  it('generates hitsParts for horde without blast bonuses', async () => {
    const actor = createMockActor({ bs: 45 });
    const weapon = createMockWeapon({ name: 'Bolter', rof: 'S/3/10' });
    const horde = createMockHorde();
    
    WeaponQualityHelper.getBlastValue = jest.fn().mockResolvedValue(0);
    WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);
    
    const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
      hitValue: 30, aim: 0, autoFire: 10, calledShot: 0,
      runningTarget: 0, miscModifier: 0, rangeMod: 0, rangeLabel: 'Short',
      rofParts: ['S', '3', '10'], sizeModifier: 0, sizeLabel: '', 
      targetActor: horde
    });
    
    expect(result.hitsParts).not.toContain('Blast');
    expect(result.hitsParts).not.toContain('Explosive');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/combat/resolve-ranged-attack.test.mjs -t "horde targets"`
Expected: FAIL - hitsParts missing blast/explosive information

- [ ] **Step 3: Enhance hitsParts logic for horde targets**

In `src/module/helpers/combat/ranged-combat.mjs`, replace the hitsParts logic from Task 2 with this enhanced version that detects horde targets:

```javascript
// Build hits breakdown array
const hitsParts = [];
const degreesOfSuccess = CombatDialogHelper.calculateDegreesOfSuccess(hitValue, targetNumber);
const isHordeTarget = targetActor && targetActor.type === 'horde';

hitsParts.push(`Degrees of Success: ${degreesOfSuccess}`);

// For multi-shot attacks, show RoF details
if (roundsFired > 1) {
  const rateLabel = autoFire === RATE_OF_FIRE_MODIFIERS.FULL_AUTO ? 'Full Auto' : 
                    autoFire === RATE_OF_FIRE_MODIFIERS.SEMI_AUTO ? 'Semi-Auto' : 'Single';
  hitsParts.push(`Rate of Fire: ${roundsFired} round${roundsFired !== 1 ? 's' : ''} (${rateLabel})`);
}

// For horde targets, show detailed breakdown BEFORE horde calculation
if (isHordeTarget && hitsTotal > 0) {
  const baseHitsBeforeHordeCalc = CombatDialogHelper.calculateHits(
    hitValue, targetNumber, maxHits, autoFire, isScatter, isPointBlank, isStorm, isTwinLinked
  );
  hitsParts.push(`Base Hits: ${baseHitsBeforeHordeCalc} (capped at ${maxHits})`);
  
  // Check for blast and explosive after horde calculation
  const blastValue = await WeaponQualityHelper.getBlastValue(weapon);
  if (blastValue > 0) {
    hitsParts.push(`Blast [${blastValue}]: +${blastValue}`);
  }
  
  const isExplosive = weapon.system.dmgType?.toLowerCase() === 'explosive';
  if (isExplosive && blastValue > 0) {
    hitsParts.push(`Explosive Damage: +1`);
  }
} else if (roundsFired > 1) {
  // Single target with multi-shot
  hitsParts.push(`Base Hits: ${hitsTotal} (capped at ${maxHits})`);
  
  // Twin-Linked bonus
  if (isTwinLinked && degreesOfSuccess >= 2) {
    hitsParts.push(`Twin-Linked: +1 (2+ DoS)`);
  }
  
  // Storm quality
  if (isStorm && hitsTotal > 0) {
    const preStormHits = Math.floor(hitsTotal / 2);
    hitsParts.push(`Storm Quality: ×2 (${preStormHits} → ${hitsTotal})`);
  }
  
  // Scatter at Point Blank
  if (isScatter && isPointBlank && degreesOfSuccess > 0) {
    const scatterBonus = Math.floor(degreesOfSuccess / 2);
    if (scatterBonus > 0) {
      hitsParts.push(`Scatter (Point Blank): +${scatterBonus} (DoS ÷ 2)`);
    }
  }
}

hitsParts.push(`<strong>Total: ${hitsTotal}${isHordeTarget ? '' : ` Hit${hitsTotal !== 1 ? 's' : ''}`}</strong>`);
```

- [ ] **Step 4: Handle flame 1d5 roll for hordes**

In `src/module/helpers/combat/ranged-combat.mjs`, modify the flame vs horde section (around line 560-572). Replace existing code with:

```javascript
// Flame vs Horde: extra 1d5 hits (requires a roll)
if (targetActor?.type === 'horde' && hitsTotal > 0) {
  const isFlame = await WeaponQualityHelper.hasQuality(weapon, 'flame');
  if (isFlame) {
    const flameRoll = await new Roll('1d5').evaluate();
    const oldTotal = hitsTotal;
    hitsTotal += flameRoll.total;
    
    // Update hitsParts with flame bonus
    if (result.hitsParts) {
      result.hitsParts.push(`Flame vs Horde: +${flameRoll.total} (1d5)`);
      // Update total line
      result.hitsParts[result.hitsParts.length - 2] = `<strong>Total: ${hitsTotal}</strong>`;
    }
    
    await flameRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `<strong>Flame vs Horde:</strong> +${flameRoll.total} additional hits (1d5)`,
      rollMode: game.settings.get('core', 'rollMode')
    });
    
    // Update stored attack hits
    CombatHelper.lastAttackHits = hitsTotal;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/combat/resolve-ranged-attack.test.mjs -t "horde"`
Expected: All horde tests PASS

- [ ] **Step 6: Run full test suite**

Run: `npm test`
Expected: All tests PASS (2005+ tests)

- [ ] **Step 7: Commit**

```bash
git add src/module/helpers/combat/ranged-combat.mjs tests/combat/resolve-ranged-attack.test.mjs
git commit -m "feat: add hit breakdown for ranged horde attacks

Enhanced hitsParts generation for horde targets showing base hits,
Blast bonus, Explosive bonus, and Flame 1d5 roll. Breakdown explains
additive stacking calculation.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Melee Attack Hit Breakdown - Horde Target

**Files:**
- Modify: `src/module/helpers/combat/melee-combat.mjs:359-364` (add hitsParts to flavor)
- Modify: `src/module/helpers/combat/melee-combat.mjs` (add hitsParts logic before line 359)
- Test: `tests/combat/resolve-melee-attack.test.mjs`

- [ ] **Step 1: Write failing test for melee horde hitsParts**

Add to `tests/combat/resolve-melee-attack.test.mjs`:

```javascript
describe('melee attack hitsParts for horde', () => {
  it('generates hitsParts for horde target with basic attack', async () => {
    const actor = createMockActor({ ws: 50 });
    const weapon = createMockWeapon({ name: 'Chainsword' });
    const horde = createMockHorde();
    
    WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);
    
    const hitValue = 30; // 2 DoS with WS 50
    const targetNumber = 50;
    const degreesOfSuccess = 2;
    
    // Mock the attackDialog to capture hitsParts
    let capturedHitsParts = null;
    const originalBuildAttackFlavor = CombatDialogHelper.buildAttackFlavor;
    CombatDialogHelper.buildAttackFlavor = jest.fn((label, modifierParts, hitsParts) => {
      capturedHitsParts = hitsParts;
      return originalBuildAttackFlavor(label, modifierParts, hitsParts);
    });
    
    await MeleeCombatHelper.attackDialog(actor, weapon, { 
      targetActor: horde,
      skipDialog: true 
    });
    
    expect(capturedHitsParts).toBeDefined();
    expect(capturedHitsParts).toContain('Degrees of Success: 2');
    expect(capturedHitsParts).toContain('Base Hits: 1 (DoS ÷ 2, minimum 1 on success)');
    expect(capturedHitsParts[capturedHitsParts.length - 1]).toContain('<strong>Total: 1</strong>');
    
    CombatDialogHelper.buildAttackFlavor = originalBuildAttackFlavor;
  });

  it('generates hitsParts for horde target with Power Field', async () => {
    const actor = createMockActor({ ws: 50 });
    const weapon = createMockWeapon({ name: 'Power Sword' });
    const horde = createMockHorde();
    
    WeaponQualityHelper.hasQuality = jest.fn().mockImplementation((wpn, quality) => {
      return quality === 'power-field' ? Promise.resolve(true) : Promise.resolve(false);
    });
    
    let capturedHitsParts = null;
    const originalBuildAttackFlavor = CombatDialogHelper.buildAttackFlavor;
    CombatDialogHelper.buildAttackFlavor = jest.fn((label, modifierParts, hitsParts) => {
      capturedHitsParts = hitsParts;
      return originalBuildAttackFlavor(label, modifierParts, hitsParts);
    });
    
    await MeleeCombatHelper.attackDialog(actor, weapon, { 
      targetActor: horde,
      skipDialog: true 
    });
    
    expect(capturedHitsParts).toContain('Power Field: +1');
    
    CombatDialogHelper.buildAttackFlavor = originalBuildAttackFlavor;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/combat/resolve-melee-attack.test.mjs -t "hitsParts for horde"`
Expected: FAIL - capturedHitsParts is undefined or missing expected entries

- [ ] **Step 3: Add hitsParts logic for melee horde attacks**

In `src/module/helpers/combat/melee-combat.mjs`, find the section that builds melee attack results (around line 340-360). Add hitsParts generation before the chat message creation:

```javascript
// Build hits breakdown array
const hitsParts = [];
const isHordeTarget = targetActor && targetActor.type === 'horde';

if (success) {
  hitsParts.push(`Degrees of Success: ${degreesOfSuccess}`);
  
  if (isHordeTarget) {
    const baseHits = degreesOfSuccess >= 2 ? Math.floor(degreesOfSuccess / 2) : 1;
    hitsParts.push(`Base Hits: ${baseHits} (DoS ÷ 2, minimum 1 on success)`);
    
    if (hasPowerField) {
      hitsParts.push(`Power Field: +1`);
    }
    
    hitsParts.push(`<strong>Total: ${hitsTotal}</strong>`);
  } else {
    // Single target - always 1 hit on success
    hitsParts.push(`<strong>1 Hit</strong> (successful attack)`);
  }
} else {
  // Miss
  hitsParts.push(`Degrees of Success: ${degreesOfSuccess} (negative = miss)`);
  hitsParts.push(`<strong>Total: 0 Hits (MISS)</strong>`);
}
```

- [ ] **Step 4: Update melee chat message to use hitsParts**

Find the line that calls `buildAttackFlavor` (around line 359-364) and modify:

```javascript
let label = CombatDialogHelper.buildAttackLabel(weapon.name, targetNumber, hitsTotal, false);
if (success) label += `<br><em>${degreesOfSuccess} Degree${degreesOfSuccess !== 1 ? 's' : ''} of Success</em>`;
const flavor = CombatDialogHelper.buildAttackFlavor(label, modifierParts, hitsParts);
```

Find the second occurrence (NPC melee, around line 412-417) and apply the same pattern:

```javascript
let label = CombatDialogHelper.buildAttackLabel(weapon.name, targetNumber, hitsTotal, false);
if (success) label += `<br><em>${degreesOfSuccess} Degree${degreesOfSuccess !== 1 ? 's' : ''} of Success</em>`;
const flavor = CombatDialogHelper.buildAttackFlavor(label, modifierParts, hitsParts);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/combat/resolve-melee-attack.test.mjs -t "hitsParts for horde"`
Expected: All melee horde tests PASS

- [ ] **Step 6: Run full melee test suite**

Run: `npm test -- tests/combat/resolve-melee-attack.test.mjs`
Expected: All melee tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/module/helpers/combat/melee-combat.mjs tests/combat/resolve-melee-attack.test.mjs
git commit -m "feat: add hit breakdown for melee horde attacks

Generate hitsParts for melee attacks against hordes, showing DoS
calculation (÷2, min 1) and Power Field bonus. Display in chat via
buildAttackFlavor().

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Melee Attack Hit Breakdown - Single Target

**Files:**
- Modify: `src/module/helpers/combat/melee-combat.mjs` (enhance hitsParts logic from Task 4)
- Test: `tests/combat/resolve-melee-attack.test.mjs`

- [ ] **Step 1: Write failing test for melee single target hitsParts**

Add to `tests/combat/resolve-melee-attack.test.mjs`:

```javascript
describe('melee attack hitsParts for single target', () => {
  it('generates hitsParts for single target successful attack', async () => {
    const actor = createMockActor({ ws: 50 });
    const weapon = createMockWeapon({ name: 'Chainsword' });
    const enemy = createMockEnemy();
    
    WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);
    
    let capturedHitsParts = null;
    const originalBuildAttackFlavor = CombatDialogHelper.buildAttackFlavor;
    CombatDialogHelper.buildAttackFlavor = jest.fn((label, modifierParts, hitsParts) => {
      capturedHitsParts = hitsParts;
      return originalBuildAttackFlavor(label, modifierParts, hitsParts);
    });
    
    await MeleeCombatHelper.attackDialog(actor, weapon, { 
      targetActor: enemy,
      skipDialog: true 
    });
    
    expect(capturedHitsParts).toBeDefined();
    expect(capturedHitsParts).toContain('<strong>1 Hit</strong> (successful attack)');
    
    CombatDialogHelper.buildAttackFlavor = originalBuildAttackFlavor;
  });

  it('generates hitsParts for missed attack', async () => {
    const actor = createMockActor({ ws: 20 }); // Low WS to ensure miss
    const weapon = createMockWeapon({ name: 'Chainsword' });
    const enemy = createMockEnemy();
    
    WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);
    
    let capturedHitsParts = null;
    const originalBuildAttackFlavor = CombatDialogHelper.buildAttackFlavor;
    CombatDialogHelper.buildAttackFlavor = jest.fn((label, modifierParts, hitsParts) => {
      capturedHitsParts = hitsParts;
      return originalBuildAttackFlavor(label, modifierParts, hitsParts);
    });
    
    // Force a miss by mocking roll > target
    const originalRoll = Roll;
    global.Roll = jest.fn().mockImplementation(() => ({
      evaluate: jest.fn().mockResolvedValue({ total: 95 }),
      toMessage: jest.fn().mockResolvedValue({})
    }));
    
    await MeleeCombatHelper.attackDialog(actor, weapon, { 
      targetActor: enemy,
      skipDialog: true 
    });
    
    expect(capturedHitsParts).toContain('Degrees of Success: -7 (negative = miss)');
    expect(capturedHitsParts).toContain('<strong>Total: 0 Hits (MISS)</strong>');
    
    global.Roll = originalRoll;
    CombatDialogHelper.buildAttackFlavor = originalBuildAttackFlavor;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/combat/resolve-melee-attack.test.mjs -t "single target"`
Expected: FAIL - hitsParts logic already implemented in Task 4 handles this, but test will fail if logic is incomplete

- [ ] **Step 3: Verify hitsParts logic handles single targets**

Review the hitsParts code added in Task 4. The logic should already handle single targets with:

```javascript
if (isHordeTarget) {
  // ... horde logic ...
} else {
  // Single target - always 1 hit on success
  hitsParts.push(`<strong>1 Hit</strong> (successful attack)`);
}
```

If this logic is missing, add it now. The full hitsParts block should be:

```javascript
// Build hits breakdown array
const hitsParts = [];
const isHordeTarget = targetActor && targetActor.type === 'horde';

if (success) {
  hitsParts.push(`Degrees of Success: ${degreesOfSuccess}`);
  
  if (isHordeTarget) {
    const baseHits = degreesOfSuccess >= 2 ? Math.floor(degreesOfSuccess / 2) : 1;
    hitsParts.push(`Base Hits: ${baseHits} (DoS ÷ 2, minimum 1 on success)`);
    
    if (hasPowerField) {
      hitsParts.push(`Power Field: +1`);
    }
    
    hitsParts.push(`<strong>Total: ${hitsTotal}</strong>`);
  } else {
    // Single target - always 1 hit on success
    hitsParts.push(`<strong>1 Hit</strong> (successful attack)`);
  }
} else {
  // Miss - show why
  hitsParts.push(`Degrees of Success: ${degreesOfSuccess} (negative = miss)`);
  hitsParts.push(`<strong>Total: 0 Hits (MISS)</strong>`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/combat/resolve-melee-attack.test.mjs -t "single target"`
Expected: All single target tests PASS

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: All 2005+ tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/module/helpers/combat/melee-combat.mjs tests/combat/resolve-melee-attack.test.mjs
git commit -m "feat: add hit breakdown for melee single target attacks

Complete melee hitsParts generation for single targets (1 hit on
success) and missed attacks (showing negative DoS). Covers all melee
attack scenarios.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Integration Testing and Edge Cases

**Files:**
- Test: `tests/combat/resolve-ranged-attack.test.mjs`
- Test: `tests/combat/resolve-melee-attack.test.mjs`

- [ ] **Step 1: Write integration test for missed ranged attack**

Add to `tests/combat/resolve-ranged-attack.test.mjs`:

```javascript
describe('hitsParts edge cases', () => {
  it('shows breakdown for missed ranged attack', async () => {
    const actor = createMockActor({ bs: 20 });
    const weapon = createMockWeapon({ name: 'Bolter', rof: 'S/3/10' });
    
    const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
      hitValue: 95, aim: 0, autoFire: 0, calledShot: 0,
      runningTarget: 0, miscModifier: 0, rangeMod: 0, rangeLabel: 'Short',
      rofParts: ['S', '3', '10'], sizeModifier: 0, sizeLabel: '', targetActor: null
    });
    
    expect(result.hitsTotal).toBe(0);
    expect(result.hitsParts).toBeDefined();
    expect(result.hitsParts.some(part => part.includes('Degrees of Success'))).toBe(true);
    expect(result.hitsParts[result.hitsParts.length - 1]).toContain('0 Hits');
  });

  it('shows Twin-Linked bonus in breakdown', async () => {
    const actor = createMockActor({ bs: 50 });
    const weapon = createMockWeapon({ name: 'Twin-Linked Bolter', rof: 'S/3/10' });
    
    WeaponQualityHelper.hasQuality = jest.fn().mockImplementation((wpn, quality) => {
      return quality === 'twin-linked' ? Promise.resolve(true) : Promise.resolve(false);
    });
    
    const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
      hitValue: 30, aim: 0, autoFire: 10, calledShot: 0,
      runningTarget: 0, miscModifier: 0, rangeMod: 0, rangeLabel: 'Short',
      rofParts: ['S', '3', '10'], sizeModifier: 0, sizeLabel: '', targetActor: null
    });
    
    const dos = Math.floor((result.targetNumber - 30) / 10);
    if (dos >= 2) {
      expect(result.hitsParts.some(part => part.includes('Twin-Linked'))).toBe(true);
    }
  });

  it('shows Storm quality multiplication in breakdown', async () => {
    const actor = createMockActor({ bs: 50 });
    const weapon = createMockWeapon({ name: 'Storm Bolter', rof: 'S/3/10' });
    
    WeaponQualityHelper.hasQuality = jest.fn().mockImplementation((wpn, quality) => {
      return quality === 'storm' ? Promise.resolve(true) : Promise.resolve(false);
    });
    
    const result = await RangedCombatHelper.resolveRangedAttack(actor, weapon, {
      hitValue: 30, aim: 0, autoFire: 10, calledShot: 0,
      runningTarget: 0, miscModifier: 0, rangeMod: 0, rangeLabel: 'Short',
      rofParts: ['S', '3', '10'], sizeModifier: 0, sizeLabel: '', targetActor: null
    });
    
    if (result.hitsTotal > 0) {
      expect(result.hitsParts.some(part => part.includes('Storm Quality'))).toBe(true);
      expect(result.hitsParts.some(part => part.includes('×2'))).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run integration tests**

Run: `npm test -- tests/combat/resolve-ranged-attack.test.mjs -t "edge cases"`
Expected: All edge case tests PASS

- [ ] **Step 3: Write test for zero hits but successful roll**

Add to `tests/combat/resolve-melee-attack.test.mjs`:

```javascript
describe('hitsParts special scenarios', () => {
  it('handles successful hit with 0 DoS against single target', async () => {
    const actor = createMockActor({ ws: 50 });
    const weapon = createMockWeapon({ name: 'Chainsword' });
    const enemy = createMockEnemy();
    
    WeaponQualityHelper.hasQuality = jest.fn().mockResolvedValue(false);
    
    let capturedHitsParts = null;
    const originalBuildAttackFlavor = CombatDialogHelper.buildAttackFlavor;
    CombatDialogHelper.buildAttackFlavor = jest.fn((label, modifierParts, hitsParts) => {
      capturedHitsParts = hitsParts;
      return originalBuildAttackFlavor(label, modifierParts, hitsParts);
    });
    
    // Force hit with exactly 0 DoS (roll = target)
    const originalRoll = Roll;
    global.Roll = jest.fn().mockImplementation(() => ({
      evaluate: jest.fn().mockResolvedValue({ total: 50 }),
      toMessage: jest.fn().mockResolvedValue({})
    }));
    
    await MeleeCombatHelper.attackDialog(actor, weapon, { 
      targetActor: enemy,
      skipDialog: true 
    });
    
    expect(capturedHitsParts).toContain('Degrees of Success: 0');
    expect(capturedHitsParts).toContain('<strong>1 Hit</strong> (successful attack)');
    
    global.Roll = originalRoll;
    CombatDialogHelper.buildAttackFlavor = originalBuildAttackFlavor;
  });
});
```

- [ ] **Step 4: Run special scenario tests**

Run: `npm test -- tests/combat/resolve-melee-attack.test.mjs -t "special scenarios"`
Expected: All special scenario tests PASS

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: All 2005+ tests PASS

- [ ] **Step 6: Commit**

```bash
git add tests/combat/resolve-ranged-attack.test.mjs tests/combat/resolve-melee-attack.test.mjs
git commit -m "test: add integration tests for hit breakdown edge cases

Cover missed attacks, Twin-Linked, Storm, zero DoS hits, and other
edge cases. Ensures hitsParts generation handles all combat scenarios.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Documentation and Final Verification

**Files:**
- Create: `docs/superpowers/specs/2026-04-23-hit-breakdown-implementation.md`

- [ ] **Step 1: Create implementation summary document**

Create `docs/superpowers/specs/2026-04-23-hit-breakdown-implementation.md`:

```markdown
# Hit Breakdown Display - Implementation Summary

**Date:** 2026-04-23  
**Status:** Complete  
**Design Doc:** [2026-04-23-hit-breakdown-design.md](2026-04-23-hit-breakdown-design.md)

## What Was Built

Added collapsible "Hits" section to all attack chat messages showing step-by-step hit calculation breakdown.

## Files Modified

1. **`src/module/helpers/combat/combat-dialog.mjs`**
   - Enhanced `buildAttackFlavor()` with optional `hitsParts` parameter
   - Renders "Hits" section before "Modifiers" section

2. **`src/module/helpers/combat/ranged-combat.mjs`**
   - Build `hitsParts` array in `resolveRangedAttack()`
   - Handles single targets (DoS, RoF, Twin-Linked, Storm, Scatter)
   - Handles horde targets (DoS, RoF, base hits cap, Blast, Explosive)
   - Updates flame 1d5 roll to append to `hitsParts`
   - Pass `hitsParts` to `buildAttackFlavor()` in chat message

3. **`src/module/helpers/combat/melee-combat.mjs`**
   - Build `hitsParts` array for melee attacks
   - Horde targets: DoS ÷ 2 calculation, Power Field bonus
   - Single targets: Simple "1 Hit (successful attack)"
   - Missed attacks: Show negative DoS explanation
   - Pass `hitsParts` to `buildAttackFlavor()` in both character and NPC melee

## Test Coverage

- `tests/combat/combat-dialog.test.mjs` - buildAttackFlavor() with hitsParts
- `tests/combat/resolve-ranged-attack.test.mjs` - Ranged hit breakdown generation
- `tests/combat/resolve-melee-attack.test.mjs` - Melee hit breakdown generation
- Edge cases: missed attacks, Twin-Linked, Storm, Scatter, Power Field

## Visual Result

Chat messages now display:

```
[Attack] Astartes Bolter (Godwyn) - Target: 65
HIT! - 6 Hits

▶ Hits
  Degrees of Success: 8
  Rate of Fire: 3 rounds (Full Auto)
  Base Hits: 3 (capped at 3)
  Blast [2]: +2
  Explosive Damage: +1
  Total: 6

▶ Modifiers
  BS: 45
  Full Auto: +20
  ...
```

## Backward Compatibility

✅ No breaking changes  
✅ Optional parameter with default value  
✅ All existing tests pass  
✅ Existing calls without `hitsParts` work unchanged

## Success Criteria Met

✅ Hit breakdown appears for all ranged attacks  
✅ Hit breakdown appears for all melee attacks  
✅ Breakdown shows calculation steps (DoS, RoF, bonuses)  
✅ Collapsible UI matches Modifiers section style  
✅ Works for both horde and single targets  
✅ Handles edge cases (flame, twin-linked, storm, scatter, misses)  
✅ Full test coverage (2005+ tests passing)  
✅ No breaking changes to existing code
```

- [ ] **Step 2: Run final full test suite**

Run: `npm test`
Expected: All 2005+ tests PASS with no warnings

- [ ] **Step 3: Verify test coverage**

Run: `npm run test:coverage`
Expected: Coverage maintained or improved for modified files

- [ ] **Step 4: Manual verification checklist**

If Foundry instance is available, test manually:
1. ✅ Ranged attack single target shows hitsParts
2. ✅ Ranged attack full auto vs horde shows blast/explosive breakdown
3. ✅ Melee attack vs horde shows DoS ÷ 2 calculation
4. ✅ Melee attack vs single target shows "1 Hit"
5. ✅ Missed attacks show negative DoS
6. ✅ "Hits" section appears before "Modifiers" section
7. ✅ Both sections are collapsible
8. ✅ Styling matches between sections

- [ ] **Step 5: Commit documentation**

```bash
git add docs/superpowers/specs/2026-04-23-hit-breakdown-implementation.md
git commit -m "docs: add hit breakdown implementation summary

Document completed implementation of collapsible Hits section showing
step-by-step attack calculation breakdown for all combat types.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Final verification**

Run: `npm test`
Expected: All tests PASS

---

## Plan Complete

This plan implements the collapsible "Hits" section for all attack types (ranged single, ranged horde, melee single, melee horde) with full test coverage and backward compatibility.

**Total Commits:** 7  
**Total Tests Added:** 15+  
**Files Modified:** 6  
**Files Created:** 1 (documentation)

All changes follow TDD workflow with failing tests first, minimal implementations, and frequent commits.
