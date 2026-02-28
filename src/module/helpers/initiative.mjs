export class InitiativeHelper {
  static async rollInitiativeDialog(combatant) {
    const actor = combatant.actor;
    const rollData = actor.getRollData();
    const defaultBonus = (rollData.agBonus || 0) + (rollData.initiativeBonus || 0);

    return new Promise((resolve) => {
      new Dialog({
        title: `Initiative: ${actor.name}`,
        content: `
          <form>
            <div class="form-group">
              <label>Roll Formula:</label>
              <input type="text" name="formula" value="1d10" />
            </div>
            <div class="form-group">
              <label>Bonus:</label>
              <input type="number" name="bonus" value="${defaultBonus}" />
            </div>
          </form>
        `,
        buttons: {
          roll: {
            label: "Roll",
            callback: (html) => {
              const formula = html.find('[name="formula"]').val();
              const bonus = parseInt(html.find('[name="bonus"]').val()) || 0;
              const fullFormula = bonus !== 0 ? `${formula} + ${bonus}` : formula;
              resolve(fullFormula);
            }
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "roll",
        close: () => resolve(null)
      }).render(true);
    });
  }
}
