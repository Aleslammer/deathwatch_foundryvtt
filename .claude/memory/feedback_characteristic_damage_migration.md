---
name: feedback_characteristic_damage_migration
description: Use system.modifiers array (not Active Effects) for characteristic penalties
type: feedback
---

**Use system.modifiers array for characteristic damage, not Foundry Active Effects.**

**Why:** User wants characteristic damage visible in the actor sheet's "Effects" tab under the "Modifiers" group. System modifiers (`actor.system.modifiers` array) display there; Foundry Active Effects (`actor.effects`) do not in this system's UI configuration.

**How to apply:**
When implementing characteristic penalties (damage, temporary debuffs, conditions):

```javascript
const modifiers = Array.isArray(actor.system.modifiers) ? [...actor.system.modifiers] : [];
modifiers.push({
  _id: foundry.utils.randomID(),
  name: 'Implosion Shell AG Damage',
  modifier: -5,  // Negative for penalty
  type: 'untyped',
  modifierType: 'constant',
  effectType: 'characteristic',
  valueAffected: 'ag',
  enabled: true,
  source: 'Characteristic Damage'
});
await actor.update({ 'system.modifiers': modifiers });
```

**Migration Pattern (April 2026):**
Characteristic damage migrated from dedicated `system.characteristics.*.damage` fields to system.modifiers array. This provides:
- User-visible tracking in Effects tab
- Source attribution (ammunition name, effect name)
- Editable via UI (can disable/remove)
- Consistent with other modifier effects

**What NOT to do:**
- ❌ Don't use Foundry Active Effects for this system (different UI presentation)
- ❌ Don't create new dedicated fields when modifiers array works
- ❌ Don't assume Active Effects === System Modifiers (they're separate systems)
