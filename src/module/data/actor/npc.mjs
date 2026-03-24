import DeathwatchActorBase from './base-actor.mjs';
import { ModifierCollector } from '../../helpers/modifier-collector.mjs';
import { SkillLoader } from '../../helpers/skill-loader.mjs';

const { fields } = foundry.data;

/**
 * NPC DataModel. Has characteristics, skills, wounds, and modifiers.
 * Simplified version of DeathwatchCharacter without biography, XP, psy rating, etc.
 * @extends {DeathwatchActorBase}
 */
export default class DeathwatchNPC extends DeathwatchActorBase {

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
      ws: DeathwatchNPC._characteristicFields(),
      bs: DeathwatchNPC._characteristicFields(),
      str: DeathwatchNPC._characteristicFields(),
      tg: DeathwatchNPC._characteristicFields(),
      ag: DeathwatchNPC._characteristicFields(),
      int: DeathwatchNPC._characteristicFields(),
      per: DeathwatchNPC._characteristicFields(),
      wil: DeathwatchNPC._characteristicFields(),
      fs: DeathwatchNPC._characteristicFields()
    });

    schema.skills = new fields.ObjectField({ initial: {} });
    schema.modifiers = new fields.ArrayField(new fields.ObjectField(), { initial: [] });
    schema.conditions = new fields.ObjectField({ initial: {} });
    schema.description = new fields.HTMLField({ initial: "" });

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
    this.naturalArmorValue = ModifierCollector.calculateNaturalArmor(allModifiers, actor.items);

    // Calculate movement from Agility Bonus
    const agBonus = this.characteristics?.ag?.mod || 0;
    if (!this.movement) this.movement = {};
    ModifierCollector.applyMovementModifiers(this.movement, agBonus, allModifiers);
  }
}
