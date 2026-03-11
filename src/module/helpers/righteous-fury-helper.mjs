import { FoundryAdapter } from "./foundry-adapter.mjs";
import { ChatMessageBuilder } from "./chat-message-builder.mjs";

export class RighteousFuryHelper {
  static hasNaturalTen(roll, furyThreshold = 10) {
    return roll.dice.some(d => d.results.some(r => r.result >= furyThreshold || (d.faces === 5 && r.result === 5)));
  }

  static async rollConfirmation(actor, targetNumber, hitLocation) {
    const confirmRoll = await FoundryAdapter.evaluateRoll('1d100');
    const confirmed = confirmRoll.total <= targetNumber;
    
    const speaker = FoundryAdapter.getChatSpeaker(actor);
    const flavor = ChatMessageBuilder.createRighteousFuryFlavor(targetNumber, confirmed);
    await FoundryAdapter.sendRollToChat(confirmRoll, speaker, flavor);
    
    return confirmed;
  }

  static async processFuryChain(actor, weapon, damageFormula, targetNumber, hitLocation, isVolatile, furyThreshold = 10) {
    let totalDamage = 0;
    let furyCount = 0;
    const allRolls = [];

    let keepChecking = isVolatile ? true : await this.rollConfirmation(actor, targetNumber, hitLocation);
    
    while (keepChecking) {
      furyCount++;
      const furyRoll = await new Roll(damageFormula).evaluate();
      totalDamage += furyRoll.total;
      allRolls.push(furyRoll);
      
      const furyFlavor = ChatMessageBuilder.createRighteousFuryDamageFlavor(furyCount);
      await furyRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: furyFlavor
      });
      
      keepChecking = this.hasNaturalTen(furyRoll, furyThreshold) && (isVolatile ? true : await this.rollConfirmation(actor, targetNumber, hitLocation));
    }
    
    return { totalDamage, furyCount, allRolls };
  }
}
