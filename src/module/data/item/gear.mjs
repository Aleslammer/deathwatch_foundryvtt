import DeathwatchItemBase from './base-item.mjs';

const { fields } = foundry.data;

/**
 * DataModel for gear items.
 * @extends {DeathwatchItemBase}
 */
export default class DeathwatchGear extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();

    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.equippedTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });

    schema.shortDescription = new fields.StringField({ initial: "", blank: true });
    schema.wt = new fields.NumberField({ initial: 0, min: 0 });

    return schema;
  }
}
