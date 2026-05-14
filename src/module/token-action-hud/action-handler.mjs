/**
 * Token Action HUD - ActionHandler
 *
 * Builds action groups from actor items (weapons, skills, characteristics).
 * Does NOT execute rolls - that's RollHandler's job.
 *
 * Initialized via tokenActionHudCoreApiReady hook in init.mjs
 */

import {
  CHARACTERISTICS,
  CHARACTERISTIC_LABELS
} from "../helpers/constants/characteristic-constants.mjs";

export let ActionHandler = null;

/**
 * Initialize ActionHandler after TAH Core API is ready
 * @param {Object} coreModule - TAH Core module with API
 */
export function initializeActionHandler(coreModule) {
  ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
    /**
     * Build system-specific actions for requested groups
     * @param {Object} groupIds - Object with group IDs as keys
     */
    async buildSystemActions(groupIds) {
      console.log("[TAH ActionHandler] buildSystemActions called");
      console.log("[TAH ActionHandler] groupIds:", groupIds);
      console.log("[TAH ActionHandler] this.actors:", this.actors);
      console.log("[TAH ActionHandler] this.actor:", this.actor);

      // Get first actor from token (TAH Core sets this.actors)
      if (!this.actors || this.actors.length === 0) {
        console.log("[TAH ActionHandler] No actors available");
        return;
      }
      const actor = this.actors[0];
      console.log("[TAH ActionHandler] Using actor:", actor.name, actor.type);

      // Build actions for each requested group (TAH Core passes array of group IDs)
      if (groupIds.includes("ranged-weapons")) {
        console.log("[TAH ActionHandler] Building ranged weapons");
        this._buildRangedWeapons(actor);
      }
      if (groupIds.includes("melee-weapons")) {
        console.log("[TAH ActionHandler] Building melee weapons");
        this._buildMeleeWeapons(actor);
      }
      if (groupIds.includes("grenades")) {
        console.log("[TAH ActionHandler] Building grenades");
        this._buildGrenades(actor);
      }
      if (groupIds.includes("basic-skills")) {
        console.log("[TAH ActionHandler] Building basic skills");
        this._buildBasicSkills(actor);
      }
      if (groupIds.includes("advanced-skills")) {
        console.log("[TAH ActionHandler] Building advanced skills");
        this._buildAdvancedSkills(actor);
      }
      // Characteristics - check if any char group is requested
      const charGroups = [
        "char-ws",
        "char-bs",
        "char-s",
        "char-t",
        "char-ag",
        "char-int",
        "char-per",
        "char-wp",
        "char-fs"
      ];
      if (charGroups.some((id) => groupIds.includes(id))) {
        console.log("[TAH ActionHandler] Building characteristics");
        this._buildCharacteristics(actor);
      }

      console.log("[TAH ActionHandler] buildSystemActions complete");
    }

    // ========================================
    // Weapon Helpers
    // ========================================

    /**
     * Get equipped weapons of specified type
     * @param {Object} actor - The actor
     * @param {Function} filterFn - Function to filter weapon class
     * @returns {Array} Filtered weapons
     */
    _getWeapons(actor, filterFn) {
      return actor.items
        .filter((item) => item.type === "weapon")
        .filter((item) => item.system.equipped)
        .filter((item) => filterFn(item.system.class));
    }

    /**
     * Check if weapon is ranged (NOT melee, NOT thrown/grenade)
     * @param {string} weaponClass - Weapon class
     * @returns {boolean} True if ranged
     */
    _isRangedWeapon(weaponClass) {
      const lower = weaponClass.toLowerCase();
      return (
        !lower.includes("melee") &&
        !lower.includes("thrown") &&
        !lower.includes("grenade")
      );
    }

    /**
     * Check if weapon is melee
     * @param {string} weaponClass - Weapon class
     * @returns {boolean} True if melee
     */
    _isMeleeWeapon(weaponClass) {
      return weaponClass.toLowerCase().includes("melee");
    }

    /**
     * Check if weapon is grenade/thrown
     * @param {string} weaponClass - Weapon class
     * @returns {boolean} True if grenade/thrown
     */
    _isGrenadeWeapon(weaponClass) {
      const lower = weaponClass.toLowerCase();
      return lower.includes("thrown") || lower.includes("grenade");
    }

    // ========================================
    // Characteristic Helpers
    // ========================================

    /**
     * Get characteristic display name from key
     * @param {string} key - Characteristic key (ws, bs, str, etc.)
     * @returns {string} Display name
     */
    _getCharacteristicName(key) {
      return CHARACTERISTIC_LABELS[key] || key.toUpperCase();
    }

    // ========================================
    // Action Builders
    // ========================================

    /**
     * Build ranged weapon actions
     * @param {Object} actor - The actor
     */
    _buildRangedWeapons(actor) {
      const weapons = this._getWeapons(actor, (cls) =>
        this._isRangedWeapon(cls)
      );

      // Create nested subgroup for each weapon
      weapons.forEach((weapon) => {
        // Get loaded ammo info
        const loadedAmmo = weapon.system.loadedAmmo
          ? actor.items.get(weapon.system.loadedAmmo)
          : null;
        const currentAmmo = loadedAmmo?.system.capacity?.value || 0;
        const clipSize = weapon.system.clip || "";

        // Display format: "current/max" or just "max" if no ammo loaded
        const ammoDisplay = loadedAmmo
          ? `${currentAmmo}/${clipSize}`
          : clipSize;
        const ammoInfo = ammoDisplay ? ` (Ammo: ${ammoDisplay})` : "";

        // Add weapon subgroup
        this.groupHandler.addGroup(
          {
            id: `weapon-${weapon.id}`,
            name: weapon.name,
            type: "system-derived",
            img: weapon.img,
            info1: ammoDisplay ? { text: ammoDisplay } : null,
            tooltip: `${weapon.name}${ammoInfo}`
          },
          { id: "ranged-weapons" }
        );

        // Add attack and damage actions to weapon subgroup
        const actions = [
          {
            id: `${weapon.id}-attack`,
            name: "Attack",
            encodedValue: `weapon|${weapon.id}|attack`,
            icon1: '<i class="fas fa-crosshairs"></i>',
            info1: ammoDisplay ? { text: ammoDisplay } : null,
            tooltip: `${weapon.name} - Attack Roll${ammoInfo}`
          },
          {
            id: `${weapon.id}-damage`,
            name: "Damage",
            encodedValue: `weapon|${weapon.id}|damage`,
            icon1: '<i class="fas fa-burst"></i>',
            info1: ammoDisplay ? { text: ammoDisplay } : null,
            tooltip: `${weapon.name} - Damage Roll${ammoInfo}`
          }
        ];

        this.addActions(actions, {
          id: `weapon-${weapon.id}`,
          type: "system-derived"
        });
      });
    }

    /**
     * Build melee weapon actions
     * @param {Object} actor - The actor
     */
    _buildMeleeWeapons(actor) {
      const weapons = this._getWeapons(actor, (cls) =>
        this._isMeleeWeapon(cls)
      );

      weapons.forEach((weapon) => {
        // Add weapon subgroup
        this.groupHandler.addGroup(
          {
            id: `weapon-${weapon.id}`,
            name: weapon.name,
            type: "system-derived",
            img: weapon.img,
            tooltip: weapon.name
          },
          { id: "melee-weapons" }
        );

        // Add attack and damage actions
        const actions = [
          {
            id: `${weapon.id}-attack`,
            name: "Attack",
            encodedValue: `weapon|${weapon.id}|attack`,
            icon1: '<i class="fas fa-crosshairs"></i>',
            tooltip: `${weapon.name} - Attack Roll`
          },
          {
            id: `${weapon.id}-damage`,
            name: "Damage",
            encodedValue: `weapon|${weapon.id}|damage`,
            icon1: '<i class="fas fa-burst"></i>',
            tooltip: `${weapon.name} - Damage Roll`
          }
        ];

        this.addActions(actions, {
          id: `weapon-${weapon.id}`,
          type: "system-derived"
        });
      });
    }

    /**
     * Build grenade actions
     * @param {Object} actor - The actor
     */
    _buildGrenades(actor) {
      const weapons = this._getWeapons(actor, (cls) =>
        this._isGrenadeWeapon(cls)
      );

      weapons.forEach((weapon) => {
        // Get loaded ammo info
        const loadedAmmo = weapon.system.loadedAmmo
          ? actor.items.get(weapon.system.loadedAmmo)
          : null;
        const currentAmmo = loadedAmmo?.system.capacity?.value || 0;
        const clipSize = weapon.system.clip || "";

        // Display format: "current/max" or just "max" if no ammo loaded
        const ammoDisplay = loadedAmmo
          ? `${currentAmmo}/${clipSize}`
          : clipSize;
        const ammoInfo = ammoDisplay ? ` (Ammo: ${ammoDisplay})` : "";

        // Add weapon subgroup
        this.groupHandler.addGroup(
          {
            id: `weapon-${weapon.id}`,
            name: weapon.name,
            type: "system-derived",
            img: weapon.img,
            info1: ammoDisplay ? { text: ammoDisplay } : null,
            tooltip: `${weapon.name}${ammoInfo}`
          },
          { id: "grenades" }
        );

        // Add attack and damage actions
        const actions = [
          {
            id: `${weapon.id}-attack`,
            name: "Attack",
            encodedValue: `weapon|${weapon.id}|attack`,
            icon1: '<i class="fas fa-crosshairs"></i>',
            info1: ammoDisplay ? { text: ammoDisplay } : null,
            tooltip: `${weapon.name} - Attack Roll${ammoInfo}`
          },
          {
            id: `${weapon.id}-damage`,
            name: "Damage",
            encodedValue: `weapon|${weapon.id}|damage`,
            icon1: '<i class="fas fa-burst"></i>',
            info1: ammoDisplay ? { text: ammoDisplay } : null,
            tooltip: `${weapon.name} - Damage Roll${ammoInfo}`
          }
        ];

        this.addActions(actions, {
          id: `weapon-${weapon.id}`,
          type: "system-derived"
        });
      });
    }

    /**
     * Build basic skill actions
     * @param {Object} actor - The actor
     */
    _buildBasicSkills(actor) {
      console.log("[TAH ActionHandler] Building basic skills");
      console.log(
        "[TAH ActionHandler] actor.system.skills:",
        actor.system.skills
      );

      // Get selected skills from settings
      const selectedSkills =
        game.settings.get("deathwatch", "tahSkillList") || [];
      const selectedSet = new Set(selectedSkills);

      // Skills are in actor.system.skills as an object, not items
      const skillsObj = actor.system.skills || {};
      const skills = Object.entries(skillsObj)
        .filter(
          ([key, skill]) => skill.isBasic === true && selectedSet.has(key)
        )
        .map(([key, skill]) => {
          // Get label from config
          const label = game.deathwatch.config.Skills[key] || key;
          // Calculate total using system's skill helper
          const characteristic =
            actor.system.characteristics[skill.characteristic];
          const baseCharValue = characteristic ? characteristic.value : 0;
          const effectiveChar = skill.trained
            ? baseCharValue
            : Math.floor(baseCharValue / 2);
          const skillBonus = skill.expert ? 20 : skill.mastered ? 10 : 0;
          const total =
            effectiveChar +
            skillBonus +
            (skill.modifier || 0) +
            (skill.modifierTotal || 0);

          return { key, label, total };
        });

      console.log(
        "[TAH ActionHandler] Basic skills found:",
        skills.length,
        skills.map((s) => s.label)
      );

      const actions = skills.map((skill) => ({
        id: `skill-${skill.key}`,
        name: skill.label,
        encodedValue: `skill|${skill.key}`,
        icon1: '<i class="fas fa-brain"></i>',
        info1: { text: String(skill.total) },
        tooltip: `${skill.label}: ${skill.total}`
      }));

      this.addActions(actions, { id: "basic-skills" });
    }

    /**
     * Build advanced skill actions
     * @param {Object} actor - The actor
     */
    _buildAdvancedSkills(actor) {
      // Get selected skills from settings
      const selectedSkills =
        game.settings.get("deathwatch", "tahSkillList") || [];
      const selectedSet = new Set(selectedSkills);

      // Skills are in actor.system.skills as an object, not items
      const skillsObj = actor.system.skills || {};
      const skills = Object.entries(skillsObj)
        .filter(
          ([key, skill]) => skill.isBasic === false && selectedSet.has(key)
        )
        .map(([key, skill]) => {
          // Get label from config
          const label = game.deathwatch.config.Skills[key] || key;
          // Calculate total using system's skill helper
          const characteristic =
            actor.system.characteristics[skill.characteristic];
          const baseCharValue = characteristic ? characteristic.value : 0;
          const effectiveChar = skill.trained
            ? baseCharValue
            : Math.floor(baseCharValue / 2);
          const skillBonus = skill.expert ? 20 : skill.mastered ? 10 : 0;
          const total =
            effectiveChar +
            skillBonus +
            (skill.modifier || 0) +
            (skill.modifierTotal || 0);

          return { key, label, total };
        });

      const actions = skills.map((skill) => ({
        id: `skill-${skill.key}`,
        name: skill.label,
        encodedValue: `skill|${skill.key}`,
        icon1: '<i class="fas fa-brain"></i>',
        info1: { text: String(skill.total) },
        tooltip: `${skill.label}: ${skill.total} (Advanced)`
      }));

      this.addActions(actions, { id: "advanced-skills" });
    }

    /**
     * Build characteristic actions (all 9)
     * @param {Object} actor - The actor
     */
    _buildCharacteristics(actor) {
      // Use characteristic constants
      const charKeys = Object.values(CHARACTERISTICS);

      charKeys.forEach((key) => {
        const char = actor.system.characteristics[key];
        const actions = [
          {
            id: `characteristic-${key}`,
            name: CHARACTERISTIC_LABELS[key],
            encodedValue: `characteristic|${key}`,
            icon1: '<i class="fas fa-dice-d20"></i>',
            info1: { text: char?.value || "0" },
            tooltip: `${CHARACTERISTIC_LABELS[key]}: ${char?.value || 0} (Bonus: ${char?.bonus || 0})`
          }
        ];

        this.addActions(actions, { id: `char-${key}` });
      });
    }
  };
}
