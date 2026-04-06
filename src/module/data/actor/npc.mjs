import DeathwatchActorBase from './base-actor.mjs';
import { ModifierCollector } from '../../helpers/character/modifier-collector.mjs';
import { SkillLoader } from '../../helpers/character/skill-loader.mjs';

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

    // Apply weapon own modifiers after characteristics are computed
    for (const item of itemsArray) {
      if (item.type === 'weapon') {
        item.system._applyOwnModifiers();
      }
    }

    // Calculate movement from Agility Bonus
    const agBonus = this.characteristics?.ag?.mod || 0;
    if (!this.movement) this.movement = {};
    ModifierCollector.applyMovementModifiers(this.movement, agBonus, allModifiers);
  }
}
