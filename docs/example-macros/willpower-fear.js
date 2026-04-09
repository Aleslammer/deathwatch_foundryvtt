/**
 * Fear Test (Willpower)
 *
 * Rolls a Willpower test to resist fear.
 * Difficulty scales based on fear rating.
 * Shows dialog with pre-filled difficulty.
 */

const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// ===== CUSTOMIZE FEAR RATING =====
const fearRating = 2;  // 1-4 (higher = more terrifying)
// =================================

// Map fear rating to difficulty
const fearDifficulties = {
  1: 'Challenging',   // Fear (1) - +0
  2: 'Hard',          // Fear (2) - -20
  3: 'Very Hard',     // Fear (3) - -30
  4: 'Hellish'        // Fear (4) - -60
};

const difficulty = fearDifficulties[fearRating] || 'Challenging';

// Check for fear-related talents
const hasFearless = token.actor.items.find(i => i.name === 'Fearless');
const hasResistFear = token.actor.items.find(i => i.name === 'Resistance (Fear)');

if (hasFearless) {
  ui.notifications.info(`${token.actor.name} is Fearless - auto-passes Fear tests`);
  return;
}

const modifier = hasResistFear ? 10 : 0;

ui.notifications.info(`Fear (${fearRating}) test for ${token.actor.name}`);

await game.deathwatch.rollCharacteristic(token.actor.id, 'wil', {
  modifier: modifier,
  difficulty: difficulty
});
