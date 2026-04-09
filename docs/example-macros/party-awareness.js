/**
 * Party Awareness Roll (GM Only)
 *
 * Rolls Awareness for all player characters automatically.
 * Useful for surprise/ambush situations.
 *
 * Customize the difficulty below.
 */

if (!game.user.isGM) {
  ui.notifications.error('Only the GM can use this macro');
  return;
}

// ===== CUSTOMIZE =====
const difficulty = 'Challenging';  // Change to 'Hard', 'Easy', etc.
const modifier = 0;                // Additional modifier if needed
// =====================

const playerActors = game.actors.filter(a =>
  a.type === 'character' && a.hasPlayerOwner
);

if (playerActors.length === 0) {
  ui.notifications.warn('No player characters found');
  return;
}

ui.notifications.info(`Rolling Awareness for ${playerActors.length} characters...`);

for (const actor of playerActors) {
  await game.deathwatch.rollSkill(actor.id, 'awareness', {
    difficulty,
    modifier,
    skipDialog: true
  });
}

ui.notifications.info('All Awareness rolls complete - check chat');
