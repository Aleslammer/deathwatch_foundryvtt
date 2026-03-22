import DeathwatchItemBase from './base-item.mjs';

const { fields } = foundry.data;

/**
 * DataModel for special ability items.
 * @extends {DeathwatchItemBase}
 */
export default class DeathwatchSpecialAbility extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.keyTemplate()
    });
    schema.specialty = new fields.StringField({ initial: "", blank: true });
    return schema;
  }
}
