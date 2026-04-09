/**
 * Characteristic Selector
 *
 * Shows a dialog to select which characteristic to roll for the selected token.
 * Displays current characteristic values and includes a modifier field.
 */

const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// Build characteristic list
const chars = game.deathwatch.getCharacteristics();
const charOptions = Object.entries(chars)
  .map(([key, name]) => {
    const value = token.actor.system.characteristics[key].value;
    return `<option value="${key}">${name} (${value})</option>`;
  })
  .join('');

const content = `
  <div class="form-group">
    <label>Characteristic:</label>
    <select id="char-select" name="characteristic" style="width: 100%;">${charOptions}</select>
  </div>
  <div class="form-group">
    <label>Additional Modifier:</label>
    <input type="number" id="modifier" name="modifier" value="0" style="width: 100%;" />
  </div>
  <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
    The modifier dialog will show after you click Roll, where you can set difficulty.
  </p>
`;

const result = await foundry.applications.api.DialogV2.wait({
  window: { title: `Roll Characteristic - ${token.actor.name}` },
  content,
  buttons: [
    {
      label: 'Roll',
      action: 'roll',
      callback: (event, button, dialog) => {
        const charKey = dialog.querySelector('#char-select').value;
        const modifier = parseInt(dialog.querySelector('#modifier').value) || 0;
        return { charKey, modifier };
      }
    },
    { label: 'Cancel', action: 'cancel' }
  ]
});

if (result && result !== 'cancel') {
  await game.deathwatch.rollCharacteristic(token.actor.id, result.charKey, {
    modifier: result.modifier
  });
}
