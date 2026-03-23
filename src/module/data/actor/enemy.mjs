import DeathwatchActorBase from './base-actor.mjs';
import { ModifierCollector } from '../../helpers/modifier-collector.mjs';
import { SkillLoader } from '../../helpers/skill-loader.mjs';

const { fields } = foundry.data;

/**
 * Enemy DataModel. Same as character but without chapters, specialties,
 * rank, XP, fate points, renown, special abilities, demeanours, past events.
 * @extends {DeathwatchActorBase}
 */
export default class DeathwatchEnemy extends DeathwatchActorBase {

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

    schema.characteristics = new fields.SchemaField({
      ws: DeathwatchEnemy._characteristicFields(),
      bs: DeathwatchEnemy._characteristicFields(),
      str: DeathwatchEnemy._characteristicFields(),
      tg: DeathwatchEnemy._characteristicFields(),
      ag: DeathwatchEnemy._characteristicFields(),
      int: DeathwatchEnemy._characteristicFields(),
      per: DeathwatchEnemy._characteristicFields(),
      wil: DeathwatchEnemy._characteristicFields(),
      fs: DeathwatchEnemy._characteristicFields()
    });

    schema.skills = new fields.ObjectField({ initial: {} });
    schema.modifiers = new fields.ArrayField(new fields.ObjectField(), { initial: [] });
    schema.conditions = new fields.ObjectField({ initial: {} });
    schema.description = new fields.HTMLField({ initial: "" });
    schema.gender = new fields.StringField({ initial: "", blank: true });
    schema.age = new fields.StringField({ initial: "", blank: true });
    schema.complexion = new fields.StringField({ initial: "", blank: true });
    schema.hair = new fields.StringField({ initial: "", blank: true });

    // Psy Rating
    schema.psyRating = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      base: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });

    return schema;
  }

  prepareDerivedData() {
    const actor = this.parent;

    // Load skills
    this.skills = SkillLoader.loadSkills(this.skills);

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
