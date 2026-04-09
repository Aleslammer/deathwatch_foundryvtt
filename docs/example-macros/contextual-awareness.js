/**
 * Contextual Awareness Test
 *
 * Rolls an Awareness test with modifiers pre-filled based on scene conditions.
 * Shows the dialog so the player can adjust if needed.
 *
 * Customize the conditions below for your scene.
 */

const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// ===== CUSTOMIZE THESE CONDITIONS =====
const isDark = false;           // Is the area poorly lit?
const isNoisy = false;          // Is there loud noise?
const hasAuspex = false;        // Does the character have Auspex?
const isSearching = false;      // Is the character actively searching?
// ======================================

// Calculate modifiers
let totalModifier = 0;
let difficulty = 'Challenging';

if (isDark) difficulty = 'Hard';        // -20 for darkness
if (isNoisy) totalModifier -= 10;       // -10 for noise
if (hasAuspex) totalModifier += 10;     // +10 for Auspex
if (isSearching) totalModifier += 20;   // +20 for active search

// Roll with pre-filled modifiers (dialog shows so player can adjust)
await game.deathwatch.rollSkill(token.actor.id, 'awareness', {
  modifier: totalModifier,
  difficulty: difficulty
});
