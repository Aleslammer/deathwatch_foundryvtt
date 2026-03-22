import DeathwatchItemBase from './base-item.mjs';

/**
 * DataModel for cybernetic items.
 * @extends {DeathwatchItemBase}
 */
export default class DeathwatchCybernetic extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    foundry.utils.mergeObject(schema, {
      ...DeathwatchItemBase.equippedTemplate(),
      ...DeathwatchItemBase.requisitionTemplate()
    });
    return schema;
  }
}
