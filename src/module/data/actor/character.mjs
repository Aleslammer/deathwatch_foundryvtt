import DeathwatchActorBase from './base-actor.mjs';
import { ModifierCollector } from '../../helpers/modifier-collector.mjs';
import { XPCalculator } from '../../helpers/xp-calculator.mjs';
import { SkillLoader } from '../../helpers/skill-loader.mjs';

const { fields } = foundry.data;

/**
 * Character DataModel. Full PC data with all derived data computation.
 * @extends {DeathwatchActorBase}
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

    // Collect and apply modifiers
    const allModifiers = ModifierCollector.collectAllModifiers(actor);
    ModifierCollector.applyCharacteristicModifiers(this.characteristics, allModifiers);

    if (this.skills) {
      ModifierCollector.applySkillModifiers(this.skills, allModifiers);
    }

    this.initiativeBonus = ModifierCollector.applyInitiativeModifiers(allModifiers);
    ModifierCollector.applyWoundModifiers(this.wounds, allModifiers);
    ModifierCollector.applyFatigueModifiers(this.fatigue, this.characteristics?.tg?.mod || 0);
    ModifierCollector.applyArmorModifiers(actor.items, allModifiers);
    this.naturalArmorValue = ModifierCollector.calculateNaturalArmor(allModifiers, actor.items);
    ModifierCollector.applyPsyRatingModifiers(this.psyRating, allModifiers);

    // Apply force weapon modifiers after psy rating is computed
    for (const item of actor.items) {
      if (item.type === 'weapon') {
        item.system.applyForceWeaponModifiers();
      }
    }

    // Calculate movement from Agility Bonus
    const agBonus = this.characteristics?.ag?.mod || 0;
    if (!this.movement) this.movement = {};
    ModifierCollector.applyMovementModifiers(this.movement, agBonus, allModifiers);
  }
}
