import DeathwatchItemBase from './base-item.mjs';

const fields = foundry.data.fields;

export default class DeathwatchTalent extends DeathwatchItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.prerequisite = new fields.StringField({ initial: "", blank: true });
    schema.benefit = new fields.StringField({ initial: "", blank: true });
    schema.cost = new fields.NumberField({ initial: -1, integer: true });
    schema.stackable = new fields.BooleanField({ initial: false });
    schema.subsequentCost = new fields.NumberField({ initial: 0, min: 0, integer: true });
    schema.compendiumId = new fields.StringField({ initial: "", blank: true });
    return schema;
  }

  prepareDerivedData() {
    if (!this.compendiumId && this.parent?._id?.startsWith('tal')) {
      this.compendiumId = this.parent._id;
    }

    const actor = this.parent?.actor;
    if (!actor) {
      this.effectiveCost = this.cost ?? 0;
      return;
    }

    const chapterId = actor.system.chapterId;
    if (!chapterId) {
      this.effectiveCost = this.cost ?? 0;
      return;
    }

    const chapter = actor.items.get(chapterId);
    if (!chapter?.system?.talentCosts) {
      this.effectiveCost = this.cost ?? 0;
      return;
    }

    const sourceId = this.compendiumId || this.parent._id;
    const chapterCost = chapter.system.talentCosts[sourceId];
    this.effectiveCost = chapterCost !== undefined ? chapterCost : (this.cost ?? 0);
  }
}
