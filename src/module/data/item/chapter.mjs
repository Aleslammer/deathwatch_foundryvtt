import DeathwatchItemBase from './base-item.mjs';

const { fields } = foundry.data;

/**
 * DataModel for chapter items.
 * @extends {DeathwatchItemBase}
 */
export default class DeathwatchChapter extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.skillCosts = new fields.ObjectField({ initial: {} });
    schema.talentCosts = new fields.ObjectField({ initial: {} });
    return schema;
  }
}
