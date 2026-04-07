/**
 * Canvas helper for measuring distances and getting tokens.
 * Wraps Foundry canvas API for testability.
 */
export class CanvasHelper {
  /* istanbul ignore next */
  static measureDistance(token1, token2) {
    return canvas.grid.measurePath([token1.center, token2.center]).distance;
  }
}

/**
 * Foundry API adapter for testability and version migration.
 * All Foundry API calls should go through this adapter to enable:
 * 1. Unit testing without a running Foundry instance
 * 2. Centralized error handling
 * 3. Easy migration when Foundry APIs change
 * 4. Type safety through JSDoc
 */
export class FoundryAdapter {
  // ===== Rolls =====

  /**
   * Evaluate a dice roll formula.
   * @param {string} formula - Dice formula (e.g., "1d100", "2d10+5")
   * @returns {Promise<Roll>} Evaluated Roll object
   */
  /* istanbul ignore next */
  static async evaluateRoll(formula) {
    return await new Roll(formula).evaluate();
  }

  /**
   * Send a roll result to chat.
   * @param {Roll} roll - Evaluated Roll object
   * @param {Object} speaker - Chat speaker data
   * @param {string} flavor - Flavor text for the roll
   * @returns {Promise<ChatMessage>}
   */
  /* istanbul ignore next */
  static async sendRollToChat(roll, speaker, flavor) {
    return await roll.toMessage({ speaker, flavor });
  }

  // ===== Chat Messages =====

  /**
   * Create a chat message.
   * @param {string} content - HTML content for the message
   * @param {Object} speaker - Chat speaker data
   * @returns {Promise<ChatMessage>}
   */
  /* istanbul ignore next */
  static async createChatMessage(content, speaker) {
    return await ChatMessage.create({ content, speaker });
  }

  /**
   * Get chat speaker data for an actor.
   * @param {Actor} actor - Actor document
   * @returns {Object} Speaker data object
   */
  /* istanbul ignore next */
  static getChatSpeaker(actor) {
    return ChatMessage.getSpeaker({ actor });
  }

  // ===== Notifications =====

  /**
   * Show a UI notification to the user.
   * @param {string} type - Notification type: "info", "warn", "error"
   * @param {string} message - Notification message
   */
  /* istanbul ignore next */
  static showNotification(type, message) {
    ui.notifications[type](message);
  }

  // ===== Documents =====

  /**
   * Update a document with new data.
   * @param {Document} document - Document to update
   * @param {Object} data - Update data
   * @returns {Promise<Document>} Updated document
   */
  /* istanbul ignore next */
  static async updateDocument(document, data) {
    return await document.update(data);
  }

  /**
   * Create embedded documents (items, effects, etc.) on a parent document.
   * @param {Document} parent - Parent document (Actor, Item, etc.)
   * @param {string} type - Embedded document type (e.g., "Item", "ActiveEffect")
   * @param {Object[]} data - Array of document data objects
   * @returns {Promise<Document[]>} Created documents
   */
  /* istanbul ignore next */
  static async createEmbeddedDocuments(parent, type, data) {
    return await parent.createEmbeddedDocuments(type, data);
  }

  /**
   * Delete embedded documents by ID.
   * @param {Document} parent - Parent document
   * @param {string} type - Embedded document type
   * @param {string[]} ids - Array of document IDs to delete
   * @returns {Promise<Document[]>} Deleted documents
   */
  /* istanbul ignore next */
  static async deleteEmbeddedDocuments(parent, type, ids) {
    return await parent.deleteEmbeddedDocuments(type, ids);
  }

  /**
   * Delete a document.
   * @param {Document} document - Document to delete
   * @returns {Promise<Document>} Deleted document
   */
  /* istanbul ignore next */
  static async deleteDocument(document) {
    return await document.delete();
  }

  // ===== Settings =====

  /**
   * Get a world or client setting value.
   * @param {string} module - Module namespace (e.g., "deathwatch")
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  /* istanbul ignore next */
  static getSetting(module, key) {
    return game.settings.get(module, key);
  }

  /**
   * Set a world or client setting value.
   * @param {string} module - Module namespace
   * @param {string} key - Setting key
   * @param {*} value - New value
   * @returns {Promise<*>} Set value
   */
  /* istanbul ignore next */
  static async setSetting(module, key, value) {
    return await game.settings.set(module, key, value);
  }

  /**
   * Register a new setting.
   * @param {string} module - Module namespace
   * @param {string} key - Setting key
   * @param {Object} config - Setting configuration
   * @returns {void}
   */
  /* istanbul ignore next */
  static registerSetting(module, key, config) {
    game.settings.register(module, key, config);
  }

  // ===== Dialogs =====

  /**
   * Show a dialog and wait for user response.
   * @param {Object} config - Dialog configuration
   * @param {Object} config.window - Window options (title, etc.)
   * @param {string} config.content - HTML content
   * @param {Array<Object>} config.buttons - Button definitions
   * @param {Function} [config.render] - Render callback
   * @returns {Promise<*>} Button action result
   */
  /* istanbul ignore next */
  static async showDialog(config) {
    return await foundry.applications.api.DialogV2.wait(config);
  }

  /**
   * Show a confirmation dialog.
   * @param {Object} config - Dialog configuration
   * @param {Object} config.window - Window options (title, etc.)
   * @param {string} config.content - HTML content
   * @returns {Promise<boolean>} True if confirmed, false if cancelled
   */
  /* istanbul ignore next */
  static async showConfirmDialog(config) {
    return await foundry.applications.api.DialogV2.confirm(config);
  }

  /**
   * Show a prompt dialog for text input.
   * @param {Object} config - Dialog configuration
   * @param {Object} config.window - Window options (title, etc.)
   * @param {string} config.content - HTML content
   * @returns {Promise<string|null>} Input value or null if cancelled
   */
  /* istanbul ignore next */
  static async showPromptDialog(config) {
    return await foundry.applications.api.DialogV2.prompt(config);
  }

  // ===== Actors & Items =====

  /**
   * Get an actor by ID.
   * @param {string} id - Actor ID
   * @returns {Actor|undefined} Actor document or undefined
   */
  /* istanbul ignore next */
  static getActor(id) {
    return game.actors.get(id);
  }

  /**
   * Get an item by ID from the world collection.
   * @param {string} id - Item ID
   * @returns {Item|undefined} Item document or undefined
   */
  /* istanbul ignore next */
  static getItem(id) {
    return game.items?.get(id);
  }

  /**
   * Create a new actor.
   * @param {Object} data - Actor data
   * @param {Object} [options] - Creation options
   * @returns {Promise<Actor>} Created actor
   */
  /* istanbul ignore next */
  static async createActor(data, options) {
    return await Actor.create(data, options);
  }

  /**
   * Create a new item.
   * @param {Object} data - Item data
   * @param {Object} [options] - Creation options
   * @returns {Promise<Item>} Created item
   */
  /* istanbul ignore next */
  static async createItem(data, options) {
    return await Item.create(data, options);
  }

  // ===== User =====

  /**
   * Check if current user is a GM.
   * @returns {boolean} True if user is GM
   */
  /* istanbul ignore next */
  static isGM() {
    return game.user.isGM;
  }

  /**
   * Get the current user.
   * @returns {User} Current user document
   */
  /* istanbul ignore next */
  static getUser() {
    return game.user;
  }

  // ===== Socket =====

  /**
   * Register a socket event listener.
   * @param {string} eventName - Event name (e.g., "system.deathwatch")
   * @param {Function} callback - Event handler function
   * @returns {void}
   */
  /* istanbul ignore next */
  static onSocketMessage(eventName, callback) {
    game.socket.on(eventName, callback);
  }

  /**
   * Emit a socket event.
   * @param {string} eventName - Event name
   * @param {*} data - Data to send
   * @returns {void}
   */
  /* istanbul ignore next */
  static emitSocketMessage(eventName, data) {
    game.socket.emit(eventName, data);
  }
}
