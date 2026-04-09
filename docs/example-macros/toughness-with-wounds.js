/**
 * Toughness Test with Wound Penalty
 *
 * Rolls a Toughness test with a penalty if the character is wounded.
 * Applies -10 modifier if below half health.
 *
 * Useful for:
 * - Resisting poison/disease
 * - Fatigue tests
 * - Environmental hazards
 */

const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// ===== CUSTOMIZE =====
const difficulty = 'Challenging';  // Base difficulty
const woundPenalty = -10;          // Penalty when wounded
// =====================

// Check if character is below half health
const wounds = token.actor.system.wounds;
const isWounded = wounds.value < (wounds.max / 2);

// Check for talents that help with Toughness tests
const hasIronJaw = token.actor.items.find(i => i.name === 'Iron Jaw');
const hasResistance = token.actor.items.find(i => i.name.includes('Resistance'));

// Calculate total modifier
let totalModifier = 0;
if (isWounded) totalModifier += woundPenalty;
if (hasIronJaw) totalModifier += 10;
if (hasResistance) totalModifier += 10;

// Roll with calculated modifiers (show dialog)
await game.deathwatch.rollCharacteristic(token.actor.id, 'tg', {
  modifier: totalModifier,
  difficulty: difficulty
});
