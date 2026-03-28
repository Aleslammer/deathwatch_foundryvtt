import { POWER_LEVELS, POWER_LEVEL_LABELS } from "../constants.mjs";
import { CombatDialogHelper } from "./combat-dialog.mjs";
import { ModifierCollector } from "../character/modifier-collector.mjs";
import { FoundryAdapter } from "../foundry-adapter.mjs";

/**
 * Helper class for psychic power Focus Power Tests.
 * Follows the same dialog → roll → chat pattern as RangedCombatHelper and MeleeCombatHelper.
 */
export class PsychicCombatHelper {
  /** Stored target number for Righteous Fury confirmation (Phase 4) */
  static lastFocusPowerTarget = null;

  /**
   * Calculate effective Psy Rating based on power level.
   * @param {number} basePR - Actor's computed Psy Rating
   * @param {string} powerLevel - POWER_LEVELS value
   * @returns {number}
   */
  static calculateEffectivePsyRating(basePR, powerLevel) {
    if (powerLevel === POWER_LEVELS.FETTERED) return Math.ceil(basePR / 2);
    if (powerLevel === POWER_LEVELS.PUSH) return basePR + 3;
    return basePR;
  }

  /**
   * Check if a d100 roll has doubles (both digits the same).
   * @param {number} roll - The d100 roll result (1-100)
   * @returns {boolean}
   */
  static isDoubles(roll) {
    const normalized = roll === 100 ? 0 : roll;
    const tens = Math.floor(normalized / 10);
    const units = normalized % 10;
    return tens === units;
  }

  /**
   * Determine psychic side effects based on roll and power level.
   * Push always causes Phenomena. Push + doubles also causes Fatigue.
   * @param {number} roll - The d100 roll result
   * @param {string} powerLevel - POWER_LEVELS value
   * @returns {{ phenomena: boolean, fatigue: boolean }}
   */
  static checkPsychicEffects(roll, powerLevel) {
    if (powerLevel === POWER_LEVELS.FETTERED) {
      return { phenomena: false, fatigue: false };
    }
    if (powerLevel === POWER_LEVELS.PUSH) {
      return { phenomena: true, fatigue: this.isDoubles(roll) };
    }
    // Unfettered
    return { phenomena: this.isDoubles(roll), fatigue: false };
  }

  /**
   * Filter collected modifiers for psychic-test and no-perils effect types.
   * @param {Array} allModifiers - From ModifierCollector.collectAllModifiers()
   * @returns {{ testBonus: number, noPerils: boolean, noPerilsSource: string, parts: Array }}
   */
  static collectPsychicModifiers(allModifiers) {
    let testBonus = 0;
    let noPerils = false;
    const parts = [];
    let noPerilsSource = "";

    for (const mod of allModifiers) {
      if (mod.enabled === false) continue;
      if (mod.effectType === "psychic-test") {
        const value = parseInt(mod.modifier) || 0;
        testBonus += value;
        parts.push({ name: mod.name || mod.source, value });
      }
      if (mod.effectType === "no-perils") {
        noPerils = true;
        noPerilsSource = mod.source || mod.name;
      }
    }

    return { testBonus, noPerils, noPerilsSource, parts };
  }

  /**
   * Build target number and modifier breakdown for chat display.
   * Target = WP + wpBonus + psychicTestBonus + misc, capped at 90.
   * @param {number} wp - Willpower value
   * @param {number} wpBonus - Chosen WP bonus (up to 5 × ePR)
   * @param {number} miscModifier - Misc modifier from dialog
   * @param {{ testBonus: number, parts: Array }} psychicModifiers - From collectPsychicModifiers
   * @returns {{ targetNumber: number, modifierParts: string[] }}
   */
  static buildFocusPowerModifiers(wp, wpBonus, miscModifier = 0, psychicModifiers = { testBonus: 0, parts: [] }) {
    const raw = wp + wpBonus + psychicModifiers.testBonus + miscModifier;
    const targetNumber = Math.min(raw, 90);

    const modifierParts = [];
    modifierParts.push(`${wp} Base Willpower`);
    if (wpBonus !== 0) modifierParts.push(`+${wpBonus} Psy Rating Bonus`);
    for (const part of psychicModifiers.parts) {
      if (part.value !== 0) modifierParts.push(`${part.value >= 0 ? "+" : ""}${part.value} ${part.name}`);
    }
    if (miscModifier !== 0) modifierParts.push(`${miscModifier >= 0 ? "+" : ""}${miscModifier} Misc`);
    if (raw > 90) modifierParts.push("(capped at 90)");

    return { targetNumber, modifierParts };
  }

  /**
   * Build the Focus Power chat label (header line).
   * @param {string} powerName
   * @param {number} targetNumber
   * @param {number} effectivePR
   * @param {string} powerLevel
   * @param {boolean} success
   * @param {number} dos - Degrees of success (0 if failed)
   * @param {number} roll - The d100 result
   * @returns {string} HTML label
   */
  static buildFocusPowerLabel(powerName, targetNumber, effectivePR, powerLevel, success, dos, roll) {
    const levelLabel = POWER_LEVEL_LABELS[powerLevel] || powerLevel;
    let resultText;
    if (roll >= 91) {
      resultText = '<strong style="color: red;">FAILED (Automatic failure: 91+)</strong>';
    } else if (success) {
      resultText = `<strong style="color: green;">SUCCESS</strong> (${dos} Degree${dos !== 1 ? "s" : ""} of Success)`;
    } else {
      const dof = Math.floor((roll - targetNumber) / 10);
      resultText = `<strong style="color: red;">FAILED</strong> (${dof} Degree${dof !== 1 ? "s" : ""} of Failure)`;
    }
    return `[Focus Power] ${powerName} — Target: ${targetNumber}<br>Effective Psy Rating: ${effectivePR} (${levelLabel})<br>${resultText}`;
  }

  /**
   * Build the full chat flavor with collapsible modifier breakdown.
   * Matches the <details> pattern from buildAttackFlavor in combat-dialog.mjs.
   * @param {string} label - From buildFocusPowerLabel
   * @param {string[]} modifierParts - From buildFocusPowerModifiers
   * @param {string} phenomenaLine - Phenomena/fatigue status lines (HTML)
   * @returns {string} HTML flavor
   */
  static buildFocusPowerFlavor(label, modifierParts, phenomenaLine = "") {
    let flavor = label;
    if (phenomenaLine) flavor += `<br>${phenomenaLine}`;
    if (modifierParts.length > 0) {
      flavor += `<details style="margin-top:4px;"><summary style="cursor:pointer;font-size:0.9em;">Modifiers</summary><div style="font-size:0.85em;margin-top:4px;">${modifierParts.join("<br>")}</div></details>`;
    }
    return flavor;
  }

  /**
   * Build the phenomena/fatigue status lines for chat.
   * @param {{ phenomena: boolean, fatigue: boolean }} effects
   * @param {string} powerLevel
   * @returns {string} HTML lines
   */
  static buildPhenomenaLine(effects, powerLevel) {
    const lines = [];
    if (effects.phenomena) {
      const reason = powerLevel === POWER_LEVELS.PUSH ? "Push!" : "Doubles rolled!";
      lines.push(`⚡ <strong>PSYCHIC PHENOMENA</strong> — ${reason}`);
    }
    if (effects.fatigue) {
      lines.push('💀 <strong>FATIGUE</strong> — Doubles on Push! (+1 Fatigue)');
    }
    return lines.join("<br>");
  }

  /**
   * Resolve an opposed Willpower test between psyker and target.
   * @param {number} psykerDoS - Psyker's degrees of success from Focus Power Test
   * @param {number} targetWP - Target's Willpower value
   * @param {number} targetRoll - Target's d100 roll result
   * @param {number} targetMiscMod - Target's misc modifier (optional)
   * @returns {{ targetSuccess: boolean, targetDoS: number, psykerWins: boolean, netDoS: number }}
   */
  static resolveOpposedTest(psykerDoS, targetWP, targetRoll, targetMiscMod = 0) {
    const targetNumber = targetWP + targetMiscMod;
    const targetSuccess = targetRoll <= targetNumber;
    const targetDoS = targetSuccess ? Math.floor((targetNumber - targetRoll) / 10) : 0;
    const psykerWins = psykerDoS > targetDoS;
    const netDoS = psykerDoS - targetDoS;
    return { targetSuccess, targetDoS, psykerWins, netDoS, targetNumber };
  }

  /**
   * Build the opposed test result chat message.
   * @param {string} targetName
   * @param {number} targetWP
   * @param {number} targetRoll
   * @param {{ targetSuccess: boolean, targetDoS: number, psykerWins: boolean, netDoS: number, targetNumber: number }} result
   * @param {string} powerName
   * @param {number} psykerDoS
   * @returns {string} HTML content
   */
  static buildOpposedResultMessage(targetName, targetWP, targetRoll, result, powerName, psykerDoS) {
    let msg = `<strong>⚔ Opposed Willpower Test — ${powerName}</strong>`;
    msg += `<br>Psyker: ${psykerDoS} Degree${psykerDoS !== 1 ? "s" : ""} of Success`;
    msg += `<br><strong>${targetName}</strong> WP ${result.targetNumber}: rolled ${targetRoll}`;
    if (result.targetSuccess) {
      msg += ` — <strong style="color: green;">SUCCESS</strong> (${result.targetDoS} DoS)`;
    } else {
      msg += ` — <strong style="color: red;">FAILED</strong> (0 DoS)`;
    }
    if (result.psykerWins) {
      msg += `<br><strong style="color: #9900cc;">POWER MANIFESTS</strong> (${result.netDoS} net DoS)`;
    } else {
      msg += `<br><strong style="color: green;">POWER RESISTED</strong> by ${targetName}`;
    }
    return msg;
  }

  /**
   * Look up a roll table by name from world tables or compendium.
   * @param {string} tableName
   * @returns {Promise<RollTable|null>}
   */
  /* istanbul ignore next */
  static async _getTable(tableName) {
    let table = game.tables?.getName(tableName);
    if (table) return table;

    const pack = game.packs?.get("deathwatch.tables");
    if (pack) {
      const index = await pack.getIndex();
      const entry = index.find(e => e.name === tableName);
      if (entry) return pack.getDocument(entry._id);
    }
    return null;
  }

  /**
   * Draw from the Psychic Phenomena table.
   * @returns {Promise<Object|null>} The draw result
   */
  /* istanbul ignore next */
  static async rollPhenomena() {
    const table = await this._getTable("Psychic Phenomena");
    if (!table) {
      FoundryAdapter.showNotification("warn", "Psychic Phenomena table not found.");
      return null;
    }
    return await table.draw();
  }

  /**
   * Draw from the Perils of the Warp table.
   * @returns {Promise<Object|null>} The draw result
   */
  /* istanbul ignore next */
  static async rollPerils() {
    const table = await this._getTable("Perils of the Warp");
    if (!table) {
      FoundryAdapter.showNotification("warn", "Perils of the Warp table not found.");
      return null;
    }
    return await table.draw();
  }

  /**
   * Handle Phenomena triggering, including Perils cascade.
   * @param {{ phenomena: boolean, fatigue: boolean }} effects
   * @param {boolean} noPerils - Whether Perils are suppressed
   * @param {string} noPerilsSource - Source name for suppression message
   * @param {Object} actor - Actor document (for fatigue update)
   */
  /* istanbul ignore next */
  static async handlePhenomenaAndFatigue(effects, noPerils, noPerilsSource, actor) {
    if (effects.phenomena) {
      const draw = await this.rollPhenomena();

      // Check for Perils cascade (Phenomena result 75+)
      if (draw?.results?.[0]) {
        const result = draw.results[0];
        const range = result.range;
        if (range && range[0] >= 75) {
          if (noPerils) {
            const speaker = FoundryAdapter.getChatSpeaker(actor);
            await FoundryAdapter.createChatMessage(
              `🛡 <strong>Perils of the Warp suppressed</strong> by ${noPerilsSource}`,
              speaker
            );
          } else {
            await this.rollPerils();
          }
        }
      }
    }

    if (effects.fatigue) {
      const currentFatigue = actor.system.fatigue?.value || 0;
      await FoundryAdapter.updateDocument(actor, {
        "system.fatigue.value": currentFatigue + 1
      });
    }
  }

  /**
   * Open the Focus Power dialog for a psychic power.
   * @param {Object} actor - Actor document
   * @param {Object} power - Psychic power item
   */
  /* istanbul ignore next */
  static async focusPowerDialog(actor, power) {
    const wp = actor.system.characteristics.wil?.value || 0;
    const basePR = actor.system.psyRating?.value || 0;

    if (basePR <= 0) {
      FoundryAdapter.showNotification("warn", "This actor has no Psy Rating.");
      return;
    }

    const allModifiers = ModifierCollector.collectAllModifiers(actor);
    const psychicMods = this.collectPsychicModifiers(allModifiers);

    const content = `
      <div style="text-align: center; margin-bottom: 10px;">
        <img src="${power.img}" alt="${power.name}" style="max-width: 100px; max-height: 100px; border: none;" />
      </div>
      <div style="display: flex; gap: 20px; margin-bottom: 8px; font-size: 0.9em;">
        <span><strong>Action:</strong> ${power.system.action || "—"}</span>
        <span><strong>Range:</strong> ${power.system.range || "—"}</span>
      </div>
      <div style="display: flex; gap: 20px; margin-bottom: 8px; font-size: 0.9em;">
        <span><strong>Opposed:</strong> ${power.system.opposed || "No"}</span>
        <span><strong>Sustained:</strong> ${power.system.sustained || "No"}</span>
      </div>
      <div class="form-group">
        <label>Power Level:</label>
        <select id="powerLevel" name="powerLevel">
          <option value="${POWER_LEVELS.FETTERED}">Fettered (PR ÷ 2, no Phenomena)</option>
          <option value="${POWER_LEVELS.UNFETTERED}" selected>Unfettered (Full PR, doubles risk)</option>
          <option value="${POWER_LEVELS.PUSH}">Push (+3 PR, auto Phenomena, Fatigue on doubles)</option>
        </select>
      </div>
      <div class="form-group" style="display: flex; gap: 20px; align-items: center;">
        <span><strong>Effective PR:</strong> <span id="effectivePR">${basePR}</span></span>
        <span><strong>WP Bonus:</strong> <input type="number" id="wpBonus" value="${5 * basePR}" min="0" max="${5 * basePR}" style="width: 50px;" /></span>
        <span style="font-size: 0.85em; color: #666;">(max +<span id="wpBonusMax">${5 * basePR}</span>)</span>
      </div>
      <div class="form-group">
        <label>Misc Modifier:</label>
        <input type="text" id="miscModifier" name="miscModifier" value="0" />
      </div>
    `;

    new Dialog({
      title: `Focus Power: ${power.name}`,
      content,
      render: (html) => {
        html.find("#miscModifier").on("input", function () {
          this.value = this.value.replace(/[^0-9+\-]/g, "");
        });
        html.find("#powerLevel").change(() => {
          const level = html.find("#powerLevel").val();
          const ePR = PsychicCombatHelper.calculateEffectivePsyRating(basePR, level);
          const maxBonus = 5 * ePR;
          html.find("#effectivePR").text(ePR);
          html.find("#wpBonus").attr("max", maxBonus).val(maxBonus);
          html.find("#wpBonusMax").text(maxBonus);
        });
      },
      buttons: {
        focus: {
          label: "Focus Power",
          callback: async (html) => {
            const powerLevel = html.find("#powerLevel").val();
            const miscModifier = parseInt(html.find("#miscModifier").val()) || 0;
            const effectivePR = this.calculateEffectivePsyRating(basePR, powerLevel);
            const maxWpBonus = 5 * effectivePR;
            const wpBonus = Math.min(Math.max(parseInt(html.find("#wpBonus").val()) || 0, 0), maxWpBonus);
            const { targetNumber, modifierParts } = this.buildFocusPowerModifiers(wp, wpBonus, miscModifier, psychicMods);

            this.lastFocusPowerTarget = targetNumber;

            const hitRoll = await FoundryAdapter.evaluateRoll("1d100");
            const roll = hitRoll.total;
            const autoFail = roll >= 91;
            const success = !autoFail && roll <= targetNumber;
            const dos = success ? CombatDialogHelper.calculateDegreesOfSuccess(roll, targetNumber) : 0;

            const effects = this.checkPsychicEffects(roll, powerLevel);
            const label = this.buildFocusPowerLabel(power.name, targetNumber, effectivePR, powerLevel, success, dos, roll);
            const phenomenaLine = this.buildPhenomenaLine(effects, powerLevel);
            const flavor = this.buildFocusPowerFlavor(label, modifierParts, phenomenaLine);

            const speaker = FoundryAdapter.getChatSpeaker(actor);
            await FoundryAdapter.sendRollToChat(hitRoll, speaker, flavor);

            // Add Oppose button for opposed powers when psyker succeeds
            if (success && power.system.opposed?.toLowerCase() === "yes") {
              const targetToken = game.user.targets?.first();
              const targetName = targetToken?.actor?.name || "Target";
              const targetId = targetToken?.actor?.id || "";
              const targetWP = targetToken?.actor?.system?.characteristics?.wil?.value || 0;
              const sceneId = targetToken?.document?.parent?.id || "";
              const tokenId = targetToken?.document?.id || "";
              const opposeContent = `<button class="psychic-oppose-btn" data-power-name="${power.name}" data-psyker-dos="${dos}" data-target-name="${targetName}" data-target-id="${targetId}" data-target-wp="${targetWP}" data-scene-id="${sceneId}" data-token-id="${tokenId}">⚔ Opposed Willpower Test: ${targetName} (WP ${targetWP})</button>`;
              await FoundryAdapter.createChatMessage(opposeContent, speaker);
            }

            await this.handlePhenomenaAndFatigue(effects, psychicMods.noPerils, psychicMods.noPerilsSource, actor);
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "focus"
    }).render(true);
  }
}
