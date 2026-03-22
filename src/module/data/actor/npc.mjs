import DeathwatchActorBase from './base-actor.mjs';

/**
 * NPC DataModel. Minimal — inherits wounds/fatigue from base.
 * @extends {DeathwatchActorBase}
 */
export default class DeathwatchNPC extends DeathwatchActorBase {
  static defineSchema() {
    return super.defineSchema();
  }

  prepareDerivedData() {
    if (this.cr !== undefined) {
      this.xp = (this.cr * this.cr) * 100;
    }
  }
}
