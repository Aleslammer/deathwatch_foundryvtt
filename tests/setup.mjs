import { jest } from '@jest/globals';

// Mock Foundry VTT globals
global.game = {
  packs: new Map(),
  i18n: {
    localize: (key) => key
  },
  user: {
    targets: {
      first: jest.fn(() => null)
    }
  }
};

global.canvas = {
  tokens: {
    controlled: []
  },
  grid: {
    measurePath: jest.fn(() => ({ distance: 0 }))
  }
};

global.ui = {
  notifications: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
};

global.ChatMessage = {
  getSpeaker: jest.fn(() => ({})),
  create: jest.fn()
};

global.Item = class Item {
  constructor(data) {
    Object.assign(this, data);
  }
  prepareData() {}
  static createDocuments = jest.fn();
  static implementation = {
    fromDropData: jest.fn()
  };
};

global.ItemSheet = class ItemSheet {
  constructor(item) {
    this.item = item;
    this.object = item;
  }
  static get defaultOptions() {
    return {
      classes: [],
      width: 400,
      height: 400
    };
  }
  getData() {
    return { item: this.item };
  }
  activateListeners() {}
  render() {}
};

global.Actor = class Actor {
  constructor(data) {
    Object.assign(this, data);
  }
  prepareData() {}
  getRollData() {
    return {};
  }
  async _preCreate(data, options, user) {}
};

global.ActorSheet = class ActorSheet {
  constructor(object, options = {}) {
    this.object = object;
    this.actor = object;
    this.options = options;
  }
  static get defaultOptions() {
    return {
      classes: [],
      width: 600,
      height: 600
    };
  }
  getData() {
    return { actor: this.actor };
  }
  activateListeners() {}
  render() {}
};

global.foundry = {
  utils: {
    randomID: () => 'test-id-' + Math.random().toString(36).substr(2, 9),
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    mergeObject: (original, other) => ({ ...original, ...other })
  },
  applications: {
    ux: {
      TextEditor: {
        implementation: {
          getDragEventData: jest.fn()
        }
      }
    }
  }
};

global.Handlebars = {
  registerHelper: jest.fn()
};

global.TextEditor = {
  enrichHTML: jest.fn((text) => text)
};

global.loadTemplates = jest.fn(async () => {});

global.Roll = jest.fn();

global.Dialog = class Dialog {
  constructor(config) {
    this.config = config;
  }
  render() {}
};

global.Combatant = class Combatant {
  constructor(data) {
    Object.assign(this, data);
  }
  getInitiativeRoll() {}
};

global.Combat = class Combat {
  constructor(data) {
    Object.assign(this, data);
    this.combatants = new Map();
  }
  rollInitiative() {}
  updateEmbeddedDocuments() {}
};
