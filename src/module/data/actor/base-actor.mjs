import DeathwatchDataModel from '../base-document.mjs';

const { fields } = foundry.data;

/**
 * Base DataModel for all Deathwatch actor types.
 * Provides shared wounds and fatigue schemas.
 * @extends {DeathwatchDataModel}
 */
export default class DeathwatchActorBase extends DeathwatchDataModel {
  static defineSchema() {
    const schema = super.defineSchema();

    schema.wounds = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      base: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      max: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });

    schema.fatigue = new fields.SchemaField({
      value: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      max: new fields.NumberField({ initial: 0, min: 0, integer: true })
    });

    return schema;
  }
}
