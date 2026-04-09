/**
 * Servo-Arm Strength Test
 *
 * Rolls a Strength test using servo-arm if equipped, otherwise natural strength.
 * Great for macros where you want to automatically use cybernetic strength.
 */

const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// Check if actor has equipped servo-arm or other strength cybernetic
const hasStrengthCybernetic = token.actor.items.find(i =>
  i.type === 'cybernetic' &&
  i.system.replacesCharacteristic === 'str' &&
  i.system.equipped
);

if (hasStrengthCybernetic) {
  ui.notifications.info(`Using ${hasStrengthCybernetic.name} for Strength test`);
}

await game.deathwatch.rollCharacteristic(token.actor.id, 'str', {
  useCybernetic: hasStrengthCybernetic ? true : false,
  skipDialog: true
});
