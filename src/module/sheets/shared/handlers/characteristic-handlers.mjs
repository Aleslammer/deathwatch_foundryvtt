import { RollDialogBuilder } from '../../../helpers/ui/roll-dialog-builder.mjs';
import { ChatMessageBuilder } from '../../../helpers/ui/chat-message-builder.mjs';

/**
 * Handles characteristic roll events for actor sheets.
 */
export class CharacteristicHandlers {
  /**
   * Attach characteristic roll handlers to sheet HTML.
   * @param {jQuery} html - Sheet HTML element
   * @param {Actor} actor - Actor document
   */
  static attach(html, actor) {
    // Characteristic rolls are handled by the generic rollable handler
    // This is just a stub for future expansion if we need characteristic-specific handlers
  }

  /**
   * Handle characteristic roll with modifier dialog.
   * @param {Object} dataset - Dataset from clicked element
   * @param {Actor} actor - Actor document
   * @returns {Promise<void>}
   */
  static async handleRoll(dataset, actor) {
    const rollData = actor.getRollData();
    const characteristic = actor.system.characteristics[dataset.characteristic];
    const label = `[Characteristic] ${dataset.label}`;

    return foundry.applications.api.DialogV2.wait({
      window: { title: `Roll ${dataset.label}` },
      content: RollDialogBuilder.buildModifierDialog(),
      render: (event, dialog) => RollDialogBuilder.attachModifierInputHandlerV2(dialog.element),
      buttons: [
        {
          label: "Roll", action: "roll",
          class: "dialog-button roll",
          callback: async (event, button, dialog) => {
            const modifiers = RollDialogBuilder.parseModifiersV2(dialog.element);
            const target = characteristic.value + modifiers.difficultyModifier + modifiers.additionalModifier;

            const roll = new Roll('1d100', rollData);
            await roll.evaluate();

            const modifierParts = RollDialogBuilder.buildModifierParts(characteristic.value, dataset.label, modifiers);
            const flavor = RollDialogBuilder.buildResultFlavor(label, target, roll, modifierParts);

            ChatMessageBuilder.createRollMessage(roll, actor, flavor);
          }
        },
        { label: "Cancel", action: "cancel", class: "dialog-button cancel" }
      ]
    });
  }
}
