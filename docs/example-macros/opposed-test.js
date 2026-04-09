/**
 * Opposed Test Helper
 *
 * Rolls the same skill for two selected tokens.
 * Useful for opposed Command, Deceive, Scrutiny, etc.
 *
 * 1. Select two tokens (shift+click)
 * 2. Run this macro
 * 3. Compare Degrees of Success in chat
 */

const tokens = canvas.tokens.controlled;
if (tokens.length !== 2) {
  ui.notifications.warn('Please select exactly 2 tokens (use shift+click)');
  return;
}

// ===== CUSTOMIZE =====
const skillName = 'command';       // Change to desired skill
const difficulty = 'Challenging';  // Difficulty for both tests
// =====================

ui.notifications.info(`Rolling ${skillName} for both actors...`);

// Roll for first token
await game.deathwatch.rollSkill(tokens[0].actor.id, skillName, {
  difficulty,
  skipDialog: true
});

// Small delay so rolls appear in order
await new Promise(resolve => setTimeout(resolve, 200));

// Roll for second token
await game.deathwatch.rollSkill(tokens[1].actor.id, skillName, {
  difficulty,
  skipDialog: true
});

ui.notifications.info('Compare Degrees of Success in chat - highest DoS wins!');
