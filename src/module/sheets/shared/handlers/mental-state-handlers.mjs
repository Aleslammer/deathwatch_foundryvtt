import { ErrorHandler } from '../../../helpers/error-handler.mjs';
import { Validation } from '../../../helpers/validation.mjs';
import { InsanityHelper } from '../../../helpers/insanity/insanity-helper.mjs';
import { CorruptionHelper } from '../../../helpers/corruption/corruption-helper.mjs';
import { ChatMessageBuilder } from '../../../helpers/ui/chat-message-builder.mjs';
import { FoundryAdapter } from '../../../helpers/foundry-adapter.mjs';
import { Sanitizer } from '../../../helpers/sanitizer.mjs';

/**
 * Handles Mental State tab interactions (corruption, insanity, battle traumas).
 * Includes GM adjustment dialogs, insanity tests, and trauma management.
 */
export class MentalStateHandlers {
  /**
   * Attach mental state handlers to sheet HTML.
   * @param {jQuery} html - Sheet HTML element
   * @param {Actor} actor - Actor document
   */
  static attach(html, actor) {
    console.log("MentalStateHandlers.attach called", {
      actor: actor.name,
      isGM: game.user.isGM,
      corruptionButtons: html.find('[data-action="adjustCorruption"]').length,
      historyButtons: html.find('[data-action="viewCorruptionHistory"]').length
    });

    this._attachGMAdjustmentHandlers(html, actor);
    this._attachInsanityTestHandler(html, actor);
    this._attachTraumaHandlers(html, actor);
    this._attachHistoryDialogHandlers(html, actor);
    this._attachCurseHandlers(html, actor);
  }

  /**
   * Attach GM adjustment button handlers.
   * @param {jQuery} html - Sheet HTML element
   * @param {Actor} actor - Actor document
   * @private
   */
  static _attachGMAdjustmentHandlers(html, actor) {
    // Corruption adjustment
    html.find('[data-action="adjustCorruption"]').click(ErrorHandler.wrap(async (ev) => {
      console.log("Adjust Corruption clicked", game.user.isGM);
      if (!game.user.isGM) {
        FoundryAdapter.showNotification('warn', 'Only the GM can adjust corruption.');
        return;
      }
      await this._showAdjustmentDialog(actor, 'corruption');
    }, 'Adjust Corruption'));

    // Insanity adjustment
    html.find('[data-action="adjustInsanity"]').click(ErrorHandler.wrap(async (ev) => {
      console.log("Adjust Insanity clicked", game.user.isGM);
      if (!game.user.isGM) {
        FoundryAdapter.showNotification('warn', 'Only the GM can adjust insanity.');
        return;
      }
      await this._showAdjustmentDialog(actor, 'insanity');
    }, 'Adjust Insanity'));
  }

  /**
   * Attach manual insanity test handler.
   * @param {jQuery} html - Sheet HTML element
   * @param {Actor} actor - Actor document
   * @private
   */
  static _attachInsanityTestHandler(html, actor) {
    html.find('[data-action="manualInsanityTest"]').click(ErrorHandler.wrap(async (ev) => {
      if (!game.user.isGM) {
        FoundryAdapter.showNotification('warn', 'Only the GM can trigger insanity tests.');
        return;
      }

      const threshold = Math.floor((actor.system.insanity || 0) / 10);
      await InsanityHelper.promptInsanityTest(actor, threshold);
    }, 'Manual Insanity Test'));
  }

  /**
   * Attach battle trauma handlers (show, edit, delete).
   * @param {jQuery} html - Sheet HTML element
   * @param {Actor} actor - Actor document
   * @private
   */
  static _attachTraumaHandlers(html, actor) {
    // Show trauma in chat
    html.find('[data-action="showTrauma"]').click(ErrorHandler.wrap(async (ev) => {
      const itemId = $(ev.currentTarget).data('itemId');
      const trauma = Validation.requireDocument(actor.items.get(itemId), 'Battle Trauma', 'Show in Chat');
      await ChatMessageBuilder.createItemCard(trauma, actor);
    }, 'Show Battle Trauma'));
  }

  /**
   * Attach history dialog handlers.
   * @param {jQuery} html - Sheet HTML element
   * @param {Actor} actor - Actor document
   * @private
   */
  static _attachHistoryDialogHandlers(html, actor) {
    // View Corruption History
    html.find('[data-action="viewCorruptionHistory"]').click(ErrorHandler.wrap(async (ev) => {
      console.log("View Corruption History clicked");
      await this._showCorruptionHistoryDialog(actor);
    }, 'View Corruption History'));

    // View Insanity History
    html.find('[data-action="viewInsanityHistory"]').click(ErrorHandler.wrap(async (ev) => {
      console.log("View Insanity History clicked");
      await this._showInsanityHistoryDialog(actor);
    }, 'View Insanity History'));
  }

  /**
   * Attach Primarch's Curse handlers.
   * @param {jQuery} html - Sheet HTML element
   * @param {Actor} actor - Actor document
   * @private
   */
  static _attachCurseHandlers(html, actor) {
    html.find('[data-action="viewCurse"]').click(ErrorHandler.wrap(async (ev) => {
      // Find the chapter item with the curse
      const chapterItem = actor.items.find(i => i.type === 'chapter' && i.system.hasCurse?.());
      if (chapterItem) {
        chapterItem.sheet.render(true);
      }
    }, 'View Primarch\'s Curse'));
  }

  /**
   * Show GM adjustment dialog for corruption or insanity.
   * @param {Actor} actor - Actor document
   * @param {string} type - "corruption" or "insanity"
   * @returns {Promise<void>}
   * @private
   */
  static async _showAdjustmentDialog(actor, type) {
    const actorName = Sanitizer.escape(actor.name);
    const currentValue = actor.system[type] || 0;
    const label = type === 'corruption' ? 'Corruption' : 'Insanity';

    const content = `
      <form class="gm-adjustment-dialog deathwatch-dialog">
        <div class="form-group">
          <p>Adjust <strong>${actorName}</strong>'s ${label}</p>
          <p>Current ${label}: <strong>${currentValue}</strong></p>
        </div>

        <div class="form-group">
          <label>Points to Add/Remove:</label>
          <input type="number" name="points" value="0" autofocus />
          <p class="hint">Positive to add, negative to remove</p>
        </div>

        <div class="form-group">
          <label>Reason:</label>
          <input type="text" name="reason" value="GM adjustment" />
        </div>

        <div class="form-group preview">
          <label>New Total:</label>
          <input type="number" name="preview" value="${currentValue}" readonly class="preview-field" />
        </div>
      </form>
    `;

    await FoundryAdapter.showDialog({
      title: `Adjust ${label}`,
      content,
      buttons: {
        apply: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Apply',
          callback: async (html) => {
            const points = parseInt(html.find('[name="points"]').val()) || 0;
            const reason = html.find('[name="reason"]').val() || 'GM adjustment';

            if (points === 0) {
              FoundryAdapter.showNotification('info', 'No points to adjust.');
              return;
            }

            if (type === 'corruption') {
              await CorruptionHelper.addCorruption(actor, points, reason);
            } else {
              await InsanityHelper.addInsanity(actor, points, reason);
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel'
        }
      },
      default: 'apply',
      render: (html) => {
        // Update preview dynamically
        html.find('[name="points"]').on('input', (event) => {
          const points = parseInt(event.target.value) || 0;
          const newTotal = Math.max(0, currentValue + points);
          html.find('.preview-field').val(newTotal);
        });
      }
    });
  }

  /**
   * Show corruption history dialog.
   * @param {Actor} actor - Actor document
   * @returns {Promise<void>}
   * @private
   */
  static async _showCorruptionHistoryDialog(actor) {
    const history = actor.system.corruptionHistory || [];
    const actorName = Sanitizer.escape(actor.name);

    let tableRows = '';
    let runningTotal = 0;

    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      runningTotal += entry.points;
      const date = new Date(entry.timestamp).toLocaleString();
      const source = Sanitizer.escape(entry.source);
      tableRows += `
        <tr>
          <td>${date}</td>
          <td class="points-cell">+${entry.points} CP</td>
          <td>${source}</td>
          <td>${runningTotal} CP</td>
          <td class="delete-cell">
            <button class="delete-history-btn" data-index="${i}" data-type="corruption" title="Delete Entry">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }

    const content = `
      <div class="history-dialog">
        <table class="history-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Points</th>
              <th>Source</th>
              <th>Total</th>
              <th style="width: 60px;">Delete</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="5" style="text-align: center;">No corruption history</td></tr>'}
          </tbody>
        </table>
        <div class="history-summary">
          Total Corruption: <strong>${actor.system.corruption || 0} CP</strong>
        </div>
      </div>
    `;

    await FoundryAdapter.showDialog({
      title: `Corruption History - ${actorName}`,
      content,
      buttons: {
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Close',
          callback: () => {}
        }
      },
      default: 'close',
      render: (html) => {
        // Attach delete button handlers
        html.find('.delete-history-btn').on('click', async (ev) => {
          const index = parseInt($(ev.currentTarget).data('index'));
          await this._deleteHistoryEntry(actor, 'corruption', index);
          // Refresh the dialog
          html.closest('.dialog').remove();
          await this._showCorruptionHistoryDialog(actor);
        });
      }
    });
  }

  /**
   * Show insanity history dialog.
   * @param {Actor} actor - Actor document
   * @returns {Promise<void>}
   * @private
   */
  static async _showInsanityHistoryDialog(actor) {
    const history = actor.system.insanityHistory || [];
    const actorName = Sanitizer.escape(actor.name);

    let tableRows = '';
    let runningTotal = 0;

    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      runningTotal += entry.points;
      const date = new Date(entry.timestamp).toLocaleString();
      const source = Sanitizer.escape(entry.source);
      const testRolled = entry.testRolled ? 'Yes' : 'No';
      const testResult = entry.testResult ? Sanitizer.escape(entry.testResult) : 'N/A';

      tableRows += `
        <tr>
          <td>${date}</td>
          <td class="points-cell">+${entry.points} IP</td>
          <td>${source}</td>
          <td>${runningTotal} IP</td>
          <td>${testRolled}</td>
          <td class="${entry.testResult?.includes('Success') ? 'test-success' : 'test-failure'}">${testResult}</td>
          <td class="delete-cell">
            <button class="delete-history-btn" data-index="${i}" data-type="insanity" title="Delete Entry">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }

    const content = `
      <div class="history-dialog">
        <table class="history-table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Points</th>
              <th>Source</th>
              <th>Total</th>
              <th>Test?</th>
              <th>Result</th>
              <th style="width: 60px;">Delete</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="7" style="text-align: center;">No insanity history</td></tr>'}
          </tbody>
        </table>
        <div class="history-summary">
          Total Insanity: <strong>${actor.system.insanity || 0} IP</strong>
        </div>
      </div>
    `;

    await FoundryAdapter.showDialog({
      title: `Insanity History - ${actorName}`,
      content,
      buttons: {
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Close',
          callback: () => {}
        }
      },
      default: 'close',
      render: (html) => {
        // Attach delete button handlers
        html.find('.delete-history-btn').on('click', async (ev) => {
          const index = parseInt($(ev.currentTarget).data('index'));
          await this._deleteHistoryEntry(actor, 'insanity', index);
          // Refresh the dialog
          html.closest('.dialog').remove();
          await this._showInsanityHistoryDialog(actor);
        });
      }
    });
  }

  /**
   * Delete a history entry from corruption or insanity history.
   * @param {Actor} actor - Actor document
   * @param {string} type - "corruption" or "insanity"
   * @param {number} index - Index of entry to delete
   * @returns {Promise<void>}
   * @private
   */
  static async _deleteHistoryEntry(actor, type, index) {
    const historyKey = type === 'corruption' ? 'corruptionHistory' : 'insanityHistory';
    const history = [...(actor.system[historyKey] || [])];

    if (index < 0 || index >= history.length) {
      FoundryAdapter.showNotification('error', 'Invalid history entry index.');
      return;
    }

    // Remove the entry
    const deletedEntry = history.splice(index, 1)[0];

    // Update the actor
    await FoundryAdapter.updateDocument(actor, {
      [`system.${historyKey}`]: history
    });

    FoundryAdapter.showNotification('info', `Deleted ${type} history entry from ${new Date(deletedEntry.timestamp).toLocaleString()}`);
  }
}
