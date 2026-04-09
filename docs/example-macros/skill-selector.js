/**
 * Skill Selector
 *
 * Shows a dialog to select which skill to roll for the selected token.
 * Includes a modifier field for quick adjustments.
 */

const token = canvas.tokens.controlled[0];
if (!token) {
  ui.notifications.warn('Please select a token first');
  return;
}

// Build skill list
const skills = Object.entries(token.actor.system.skills)
  .map(([key, skill]) => ({
    key,
    label: skill.label || key,
    total: skill.total || 0,
    isBasic: skill.isBasic,
    trained: skill.trained
  }))
  .filter(s => s.isBasic || s.trained)  // Only show usable skills
  .sort((a, b) => a.label.localeCompare(b.label));

const skillOptions = skills
  .map(s => `<option value="${s.key}">${s.label} (${s.total})</option>`)
  .join('');

const content = `
  <div class="form-group">
    <label>Skill:</label>
    <select id="skill-select" name="skill" style="width: 100%;">${skillOptions}</select>
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
  window: { title: `Roll Skill - ${token.actor.name}` },
  content,
  buttons: [
    {
      label: 'Roll',
      action: 'roll',
      callback: (event, button, dialog) => {
        const skillKey = dialog.querySelector('#skill-select').value;
        const modifier = parseInt(dialog.querySelector('#modifier').value) || 0;
        return { skillKey, modifier };
      }
    },
    { label: 'Cancel', action: 'cancel' }
  ]
});

if (result && result !== 'cancel') {
  await game.deathwatch.rollSkill(token.actor.id, result.skillKey, {
    modifier: result.modifier
  });
}
