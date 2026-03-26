import { jest } from '@jest/globals';

// Mock Foundry VTT globals
global.game = {
  packs: new Map(),
  folders: [],
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
  abstract: {
    TypeDataModel: class TypeDataModel {
      static defineSchema() { return {}; }
      static migrateData(data) { return data; }
      prepareDerivedData() {}
    }
  },
  data: {
    fields: {
      StringField: class StringField { constructor(opts = {}) { this.options = opts; } },
      NumberField: class NumberField { constructor(opts = {}) { this.options = opts; } },
      BooleanField: class BooleanField { constructor(opts = {}) { this.options = opts; } },
      ArrayField: class ArrayField { constructor(element, opts = {}) { this.element = element; this.options = opts; } },
      ObjectField: class ObjectField { constructor(opts = {}) { this.options = opts; } },
      SchemaField: class SchemaField { constructor(fields, opts = {}) { this.fields = fields; this.options = opts; } },
      HTMLField: class HTMLField { constructor(opts = {}) { this.options = opts; } }
    }
  },
  utils: {
    randomID: () => 'test-id-' + Math.random().toString(36).substr(2, 9),
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    mergeObject: (original, other) => Object.assign(original, other)
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

global.Folder = class Folder {
  static create = jest.fn(async (data) => ({ id: 'folder-enemies', ...data }));
};

global.Combat = class Combat {
  constructor(data) {
    Object.assign(this, data);
    this.combatants = new Map();
  }
  rollInitiative() {}
  updateEmbeddedDocuments() {}
};


// ── Mock Factories ────────────────────────────────────────────────────────

/**
 * Create a mock actor with sensible defaults.
 * @param {Object} overrides - Properties to merge into the mock
 */
global.createMockActor = (overrides = {}) => {
  const base = {
    name: 'Test Actor',
    type: 'character',
    system: {
      characteristics: {
        ws: { value: 40, base: 40, mod: 4, advances: {} },
        bs: { value: 40, base: 40, mod: 4, advances: {} },
        str: { value: 40, base: 40, mod: 4, advances: {} },
        tg: { value: 40, base: 40, mod: 4, advances: {} },
        ag: { value: 40, base: 40, mod: 4, advances: {} },
        int: { value: 40, base: 40, mod: 4, advances: {} },
        per: { value: 40, base: 40, mod: 4, advances: {} },
        wil: { value: 40, base: 40, mod: 4, advances: {} },
        fs: { value: 40, base: 40, mod: 4, advances: {} }
      },
      wounds: { value: 0, base: 20, max: 20 },
      fatigue: { value: 0, max: 0 },
      modifiers: [],
      conditions: {},
      psyRating: { value: 0, base: 0 }
    },
    items: new Map(),
    update: jest.fn(),
    getActiveTokens: jest.fn(() => [])
  };
  return mergeDeep(base, overrides);
};

/**
 * Create a mock weapon with sensible defaults.
 * @param {Object} overrides - Properties to merge into the mock
 */
global.createMockWeapon = (overrides = {}) => {
  const base = {
    name: 'Test Weapon',
    type: 'weapon',
    img: '',
    system: {
      class: 'Basic',
      dmg: '1d10+5',
      dmgType: 'Impact',
      penetration: '4',
      range: '100',
      rof: 'S/3/-',
      clip: '28',
      reload: 'Full',
      equipped: true,
      jammed: false,
      loadedAmmo: null,
      attachedQualities: [],
      attachedUpgrades: [],
      modifiers: []
    }
  };
  return mergeDeep(base, overrides);
};

function mergeDeep(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && typeof source[key].mockImplementation !== 'function') {
      result[key] = mergeDeep(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
