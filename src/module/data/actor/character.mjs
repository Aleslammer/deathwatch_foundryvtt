import DeathwatchActorBase from './base-actor.mjs';
import { ModifierCollector } from '../../helpers/character/modifier-collector.mjs';
import { XPCalculator } from '../../helpers/character/xp-calculator.mjs';
import { SkillLoader } from '../../helpers/character/skill-loader.mjs';

const { fields } = foundry.data;

/**
 * Character DataModel for player characters and allied Space Marines.
 *
 * Manages full character data including:
 * - **Characteristics**: WS, BS, STR, TGH, AG, INT, PER, WIL, FS with bonuses and advances
 * - **Skills**: Full skill list with modifiers and computed totals
 * - **Wounds & Fatigue**: Max wounds (SB + 2×TB + advances), fatigue system
 * - **XP & Rank**: XP tracking, rank progression (Initiate → Battle-Brother → Veteran → etc.)
 * - **Chapter & Specialty**: Chapter benefits and Specialty abilities
 * - **Psy Rating**: For Librarians (psyker characters)
 * - **Movement**: Half/Full/Charge/Run movement rates from AG Bonus
 * - **Combat Mode**: Solo/Squad Mode tracking
 *
 * Computed properties (updated in prepareDerivedData):
 * - `characteristics.*.value`: Final characteristic values after modifiers
 * - `characteristics.*.mod`: Final characteristic bonus (value ÷ 10)
 * - `skills.*.total`: Final skill test target numbers
 * - `wounds.max`: Maximum wounds from SB + 2×TB + advances + modifiers
 * - `movement.half/full/charge/run`: Movement rates from AG Bonus
 * - `xp.spent/available`: XP spent on advances, XP available for spending
 * - `rank`: Character rank (1-8) based on total XP
 *
 * @extends {DeathwatchActorBase}
 * @example
 * // Access computed character data
 * const actor = game.actors.getName("Brother Corvus");
 * const bs = actor.system.characteristics.bs.value; // 50
 * const bsBonus = actor.system.characteristics.bs.mod; // 5
 * const maxWounds = actor.system.wounds.max; // 22
 */
export default class DeathwatchCharacter extends DeathwatchActorBase {

  /**
   * Schema for a single characteristic (value, bonus, damage, advances).
   */
  static _characteristicFields() {
    return new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      base: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      bonus: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      damage: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      advances: new fields.SchemaField({
        simple: new fields.BooleanField({ initial: false }),
        intermediate: new fields.BooleanField({ initial: false }),
        trained: new fields.BooleanField({ initial: false }),
        expert: new fields.BooleanField({ initial: false })
      })
    });
  }

  static defineSchema() {
    const schema = super.defineSchema();

    // Biography
    schema.chapterId = new fields.StringField({ initial: "", blank: true });
    schema.gender = new fields.StringField({ initial: "", blank: true });
    schema.age = new fields.StringField({ initial: "", blank: true });
    schema.complexion = new fields.StringField({ initial: "", blank: true });
    schema.hair = new fields.StringField({ initial: "", blank: true });
    schema.description = new fields.HTMLField({ initial: "" });
    schema.pastEvents = new fields.HTMLField({ initial: "" });
    schema.specialty = new fields.StringField({ initial: "", blank: true });
    schema.specialtyId = new fields.StringField({ initial: "", blank: true });

    // Progression
    schema.rank = new fields.NumberField({ initial: 1, min: 1, max: 8, integer: true });
    schema.xp = new fields.SchemaField({
      total: new fields.NumberField({ initial: 13000, min: 0, integer: true }),
      spent: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });
    schema.fatePoints = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      max: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });
    schema.renown = new fields.NumberField({ initial: 0, min: 0, integer: true });

    // Modifiers
    schema.modifiers = new fields.ArrayField(new fields.ObjectField(), { initial: [] });

    // Conditions
    schema.conditions = new fields.ObjectField({ initial: {} });

    // Combat Mode (Solo/Squad)
    schema.mode = new fields.StringField({ initial: "solo" });

    // Characteristics (all 9)
    schema.characteristics = new fields.SchemaField({
      ws: DeathwatchCharacter._characteristicFields(),
      bs: DeathwatchCharacter._characteristicFields(),
      str: DeathwatchCharacter._characteristicFields(),
      tg: DeathwatchCharacter._characteristicFields(),
      ag: DeathwatchCharacter._characteristicFields(),
      int: DeathwatchCharacter._characteristicFields(),
      per: DeathwatchCharacter._characteristicFields(),
      wil: DeathwatchCharacter._characteristicFields(),
      fs: DeathwatchCharacter._characteristicFields()
    });

    // Psy Rating
    schema.psyRating = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      base: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });

    // Skills (dynamic, loaded from skills.json at runtime)
    schema.skills = new fields.ObjectField({ initial: {} });

    // Legacy fields (kept for backward compatibility)
    schema.health = new fields.SchemaField({
      value: new fields.NumberField({ initial: 10, min: 0, integer: true }),
      max: new fields.NumberField({ initial: 10, min: 0, integer: true })
    });
    schema.power = new fields.SchemaField({
      value: new fields.NumberField({ initial: 5, min: 0, integer: true }),
      max: new fields.NumberField({ initial: 5, min: 0, integer: true })
    });
    schema.attributes = new fields.SchemaField({
      level: new fields.SchemaField({
        value: new fields.NumberField({ initial: 1, min: 1, integer: true })
      })
    });

    return schema;
  }

  /**
   * Characters can trigger Righteous Fury.
   * @returns {boolean}
   */
  canRighteousFury() {
    return true;
  }

  /**
   * Compute all character derived data.
   * Moved from actor.mjs _prepareCharacterData().
   */
  /**
   * Compute all character derived data.
   *
   * Called automatically by Foundry when actor data changes (characteristics,
   * items, effects, etc.). Recomputes all derived properties from base values
   * and modifiers.
   *
   * **Order of operations:**
   * 1. Load skills from JSON (if not already loaded)
   * 2. Calculate rank from total XP
   * 3. Calculate spent XP from item costs
   * 4. Convert items Map to Array (performance optimization)
   * 5. Collect modifiers from items/effects/chapter/specialty
   * 6. Apply modifiers to characteristics → compute final values and bonuses
   * 7. Apply modifiers to skills → compute final target numbers
   * 8. Apply modifiers to initiative, wounds, fatigue, armor, Psy Rating
   * 9. Apply force weapon modifiers (for Librarians)
   * 10. Calculate movement rates from AG Bonus
   *
   * **Performance note:** Items are converted from Map to Array once at the
   * start and passed to all modifier methods, eliminating redundant conversions.
   *
   * @override
   * @returns {void}
   * @example
   * // Manually trigger derived data recalculation (usually automatic)
   * actor.system.prepareDerivedData();
   */
  prepareDerivedData() {
    const actor = this.parent;

    if (!this.fatePoints) this.fatePoints = { value: 0, max: 0 };
    if (this.renown === undefined) this.renown = 0;

    // Load skills dynamically from JSON
    this.skills = SkillLoader.loadSkills(this.skills);

    // Calculate rank and XP
    this.rank = XPCalculator.calculateRank(this.xp?.total || this.xp);
    const spentXP = XPCalculator.calculateSpentXP(actor);

    if (typeof this.xp === 'object') {
      this.xp.spent = spentXP;
      this.xp.available = (this.xp.total || XPCalculator.STARTING_XP) - spentXP;
    }

    // Convert items Map to Array once (performance optimization)
    // If items has .get() method (Map or test mock), keep it as-is; otherwise convert to array
    const itemsArray = typeof actor.items.get === 'function'
      ? (actor.items instanceof Map ? Array.from(actor.items.values()) : actor.items)
      : Array.from(actor.items);

    // Collect and apply modifiers
    const allModifiers = ModifierCollector.collectAllModifiers(actor, itemsArray);
    ModifierCollector.applyCharacteristicModifiers(this.characteristics, allModifiers);

    if (this.skills) {
      ModifierCollector.applySkillModifiers(this.skills, allModifiers);
    }

    this.initiativeBonus = ModifierCollector.applyInitiativeModifiers(allModifiers);
    ModifierCollector.applyWoundModifiers(this.wounds, allModifiers);
    ModifierCollector.applyFatigueModifiers(this.fatigue, this.characteristics?.tg?.mod || 0);
    ModifierCollector.applyArmorModifiers(itemsArray, allModifiers);
    this.naturalArmorValue = ModifierCollector.calculateNaturalArmor(allModifiers, itemsArray);
    ModifierCollector.applyPsyRatingModifiers(this.psyRating, allModifiers);

    // Apply force weapon modifiers after psy rating is computed
    for (const item of itemsArray) {
      if (item.type === 'weapon') {
        item.system._applyOwnModifiers();
        item.system.applyForceWeaponModifiers();
      }
    }

    // Calculate movement from Agility Bonus
    const agBonus = this.characteristics?.ag?.mod || 0;
    if (!this.movement) this.movement = {};
    ModifierCollector.applyMovementModifiers(this.movement, agBonus, allModifiers);
  }
}
