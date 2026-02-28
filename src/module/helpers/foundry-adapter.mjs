export class CanvasHelper {
  /* istanbul ignore next */
  static measureDistance(token1, token2) {
    return canvas.grid.measurePath([token1.center, token2.center]).distance;
  }
}

export class FoundryAdapter {
  /* istanbul ignore next */
  static async evaluateRoll(formula) {
    return await new Roll(formula).evaluate();
  }

  /* istanbul ignore next */
  static async sendRollToChat(roll, speaker, flavor) {
    return await roll.toMessage({ speaker, flavor });
  }

  /* istanbul ignore next */
  static async createChatMessage(content, speaker) {
    return await ChatMessage.create({ content, speaker });
  }

  /* istanbul ignore next */
  static getChatSpeaker(actor) {
    return ChatMessage.getSpeaker({ actor });
  }

  /* istanbul ignore next */
  static showNotification(type, message) {
    ui.notifications[type](message);
  }

  /* istanbul ignore next */
  static async updateDocument(document, data) {
    return await document.update(data);
  }
}
