import { RollDialogBuilder } from '../../../helpers/ui/roll-dialog-builder.mjs';
import { ChatMessageBuilder } from '../../../helpers/ui/chat-message-builder.mjs';
import { CyberneticHelper } from '../../../helpers/cybernetic-helper.mjs';

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

    // Check for cybernetic replacements
    const replacements = CyberneticHelper.getCharacteristicReplacements(actor, dataset.characteristic);
    const hasReplacements = replacements.length > 0;

    let content = RollDialogBuilder.buildModifierDialog();

    // Add source selector if cybernetics available
    if (hasReplacements) {
      content = RollDialogBuilder.buildCharacteristicSourceSelector(
        characteristic.value,
        dataset.label,
        replacements
      ) + content;
    }

    return foundry.applications.api.DialogV2.wait({
      window: { title: `Roll ${dataset.label}` },
      content: content,
      render: (event, dialog) => RollDialogBuilder.attachModifierInputHandlerV2(dialog.element),
      buttons: [
        {
          label: "Roll", action: "roll",
          class: "dialog-button roll",
          callback: async (event, button, dialog) => {
            const modifiers = RollDialogBuilder.parseModifiersV2(dialog.element);

            // Get selected characteristic source
            let selectedValue = characteristic.value;
            let selectedLabel = dataset.label;
            if (hasReplacements) {
              const sourceSelect = dialog.element.querySelector('#characteristic-source');
              const selectedSource = sourceSelect.value;
              if (selectedSource !== 'natural') {
                const replacement = replacements.find(r => r.item.id === selectedSource);
                if (replacement) {
                  selectedValue = replacement.value;
                  selectedLabel = `${dataset.label} (${replacement.label})`;
                }
              }
            }

            const target = selectedValue + modifiers.difficultyModifier + modifiers.additionalModifier;

            const roll = new Roll('1d100', rollData);
            await roll.evaluate();

            const modifierParts = RollDialogBuilder.buildModifierParts(selectedValue, selectedLabel, modifiers);
            const flavor = RollDialogBuilder.buildResultFlavor(label, target, roll, modifierParts);

            ChatMessageBuilder.createRollMessage(roll, actor, flavor);
          }
        },
        { label: "Cancel", action: "cancel", class: "dialog-button cancel" }
      ]
    });
  }
}
