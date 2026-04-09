/**
 * Quick Strength Test
 *
 * Rolls a Strength test for the selected token without showing the dialog.
 * If the character has a servo-arm, uses natural strength by default.
 * Click on a token, then run this macro to roll immediately.
 */

const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

await game.deathwatch.rollCharacteristic(token.actor.id, 'str', {
  skipDialog: true
});
