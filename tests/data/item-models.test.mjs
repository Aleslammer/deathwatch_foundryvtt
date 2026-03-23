import { jest } from '@jest/globals';
import '../setup.mjs';
import DeathwatchDataModel from '../../src/module/data/base-document.mjs';
import DeathwatchItemBase from '../../src/module/data/item/base-item.mjs';
import DeathwatchGear from '../../src/module/data/item/gear.mjs';
import DeathwatchDemeanour from '../../src/module/data/item/demeanour.mjs';
import DeathwatchTrait from '../../src/module/data/item/trait.mjs';
import DeathwatchArmorHistory from '../../src/module/data/item/armor-history.mjs';
import DeathwatchWeaponQuality from '../../src/module/data/item/weapon-quality.mjs';
import DeathwatchCriticalEffect from '../../src/module/data/item/critical-effect.mjs';
import DeathwatchImplant from '../../src/module/data/item/implant.mjs';
import DeathwatchCybernetic from '../../src/module/data/item/cybernetic.mjs';
import DeathwatchTalent from '../../src/module/data/item/talent.mjs';
import DeathwatchAmmunition from '../../src/module/data/item/ammunition.mjs';
import DeathwatchWeaponUpgrade from '../../src/module/data/item/weapon-upgrade.mjs';
import DeathwatchPsychicPower from '../../src/module/data/item/psychic-power.mjs';
import DeathwatchSpecialAbility from '../../src/module/data/item/special-ability.mjs';
import DeathwatchArmor from '../../src/module/data/item/armor.mjs';
import DeathwatchChapter from '../../src/module/data/item/chapter.mjs';
import DeathwatchSpecialty from '../../src/module/data/item/specialty.mjs';
import DeathwatchWeapon from '../../src/module/data/item/weapon.mjs';
import DeathwatchActorBase from '../../src/module/data/actor/base-actor.mjs';
import DeathwatchCharacter from '../../src/module/data/actor/character.mjs';
import DeathwatchNPC from '../../src/module/data/actor/npc.mjs';
import DeathwatchEnemy from '../../src/module/data/actor/enemy.mjs';

describe('DeathwatchDataModel', () => {
  describe('defineSchema', () => {
    it('returns an empty schema', () => {
      const schema = DeathwatchDataModel.defineSchema();
      expect(schema).toEqual({});
    });
  });

  describe('equippedTemplate', () => {
    it('returns equipped BooleanField', () => {
      const template = DeathwatchDataModel.equippedTemplate();
      expect(template.equipped).toBeDefined();
      expect(template.equipped.options.initial).toBe(false);
    });
  });

  describe('requisitionTemplate', () => {
    it('returns req and renown fields', () => {
      const template = DeathwatchDataModel.requisitionTemplate();
      expect(template.req).toBeDefined();
      expect(template.req.options.initial).toBe(0);
      expect(template.renown).toBeDefined();
      expect(template.renown.options.initial).toBe("");
    });
  });

  describe('capacityTemplate', () => {
    it('returns capacity SchemaField with value and max', () => {
      const template = DeathwatchDataModel.capacityTemplate();
      expect(template.capacity).toBeDefined();
      expect(template.capacity.fields.value).toBeDefined();
      expect(template.capacity.fields.max).toBeDefined();
    });
  });

  describe('keyTemplate', () => {
    it('returns key StringField', () => {
      const template = DeathwatchDataModel.keyTemplate();
      expect(template.key).toBeDefined();
      expect(template.key.options.initial).toBe("");
    });
  });
});

describe('DeathwatchItemBase', () => {
  describe('defineSchema', () => {
    it('includes description, book, page, and modifiers', () => {
      const schema = DeathwatchItemBase.defineSchema();
      expect(schema.description).toBeDefined();
      expect(schema.book).toBeDefined();
      expect(schema.page).toBeDefined();
      expect(schema.modifiers).toBeDefined();
    });
  });
});

describe('DeathwatchGear', () => {
  describe('defineSchema', () => {
    it('includes all inherited and composed fields', () => {
      const schema = DeathwatchGear.defineSchema();

      // Inherited from DeathwatchItemBase
      expect(schema.description).toBeDefined();
      expect(schema.book).toBeDefined();
      expect(schema.page).toBeDefined();
      expect(schema.modifiers).toBeDefined();

      // Composed from equippedTemplate
      expect(schema.equipped).toBeDefined();

      // Composed from requisitionTemplate
      expect(schema.req).toBeDefined();
      expect(schema.renown).toBeDefined();

      // Type-specific
      expect(schema.shortDescription).toBeDefined();
      expect(schema.wt).toBeDefined();
    });

    it('does not include fields from unused templates', () => {
      const schema = DeathwatchGear.defineSchema();
      expect(schema.capacity).toBeUndefined();
      expect(schema.key).toBeUndefined();
    });
  });
});

describe('DeathwatchDemeanour', () => {
  it('includes base fields and chapter', () => {
    const schema = DeathwatchDemeanour.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.chapter).toBeDefined();
  });
});

describe('DeathwatchTrait', () => {
  it('includes only base fields', () => {
    const schema = DeathwatchTrait.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.book).toBeDefined();
    expect(schema.page).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.equipped).toBeUndefined();
  });
});

describe('DeathwatchArmorHistory', () => {
  it('includes only base fields', () => {
    const schema = DeathwatchArmorHistory.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.equipped).toBeUndefined();
  });
});

describe('DeathwatchWeaponQuality', () => {
  it('includes base fields, key, and value', () => {
    const schema = DeathwatchWeaponQuality.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.key).toBeDefined();
    expect(schema.value).toBeDefined();
  });
});

describe('DeathwatchCriticalEffect', () => {
  it('includes base fields, location, damageType, and effects', () => {
    const schema = DeathwatchCriticalEffect.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.location).toBeDefined();
    expect(schema.damageType).toBeDefined();
    expect(schema.effects).toBeDefined();
  });
});

describe('DeathwatchImplant', () => {
  it('includes base fields, equipped, requisition, and summary', () => {
    const schema = DeathwatchImplant.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.equipped).toBeDefined();
    expect(schema.req).toBeDefined();
    expect(schema.renown).toBeDefined();
    expect(schema.summary).toBeDefined();
  });
});

describe('DeathwatchCybernetic', () => {
  it('includes base fields, equipped, and requisition', () => {
    const schema = DeathwatchCybernetic.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.equipped).toBeDefined();
    expect(schema.req).toBeDefined();
    expect(schema.renown).toBeDefined();
  });

  it('does not include implant-specific fields', () => {
    const schema = DeathwatchCybernetic.defineSchema();
    expect(schema.summary).toBeUndefined();
  });
});

describe('DeathwatchAmmunition', () => {
  it('includes base fields, capacity, requisition, and quantity', () => {
    const schema = DeathwatchAmmunition.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.capacity).toBeDefined();
    expect(schema.capacity.fields.value).toBeDefined();
    expect(schema.capacity.fields.max).toBeDefined();
    expect(schema.req).toBeDefined();
    expect(schema.renown).toBeDefined();
    expect(schema.quantity).toBeDefined();
    expect(schema.quantity.options.initial).toBe(1);
  });

  it('does not include equipped template', () => {
    const schema = DeathwatchAmmunition.defineSchema();
    expect(schema.equipped).toBeUndefined();
  });
});

describe('DeathwatchWeaponUpgrade', () => {
  it('includes base fields, key, requisition, and singleShotOnly', () => {
    const schema = DeathwatchWeaponUpgrade.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.key).toBeDefined();
    expect(schema.req).toBeDefined();
    expect(schema.renown).toBeDefined();
    expect(schema.singleShotOnly).toBeDefined();
    expect(schema.singleShotOnly.options.initial).toBe(false);
  });
});

describe('DeathwatchPsychicPower', () => {
  it('includes base fields, key, and psychic power fields', () => {
    const schema = DeathwatchPsychicPower.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.key).toBeDefined();
    expect(schema.action).toBeDefined();
    expect(schema.opposed).toBeDefined();
    expect(schema.range).toBeDefined();
    expect(schema.sustained).toBeDefined();
    expect(schema.cost).toBeDefined();
    expect(schema.cost.options.initial).toBe(0);
    expect(schema.class).toBeDefined();
    expect(schema.chapterImg).toBeDefined();
  });
});

describe('DeathwatchSpecialAbility', () => {
  it('includes base fields, key, and specialty', () => {
    const schema = DeathwatchSpecialAbility.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.key).toBeDefined();
    expect(schema.specialty).toBeDefined();
    expect(schema.specialty.options.initial).toBe("");
  });
});

describe('DeathwatchArmor', () => {
  it('includes base fields, equipped, requisition, and 6 location fields', () => {
    const schema = DeathwatchArmor.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.equipped).toBeDefined();
    expect(schema.req).toBeDefined();
    expect(schema.renown).toBeDefined();
    expect(schema.body).toBeDefined();
    expect(schema.head).toBeDefined();
    expect(schema.left_arm).toBeDefined();
    expect(schema.right_arm).toBeDefined();
    expect(schema.left_leg).toBeDefined();
    expect(schema.right_leg).toBeDefined();
  });

  it('includes effects, armorEffects, and attachedHistories', () => {
    const schema = DeathwatchArmor.defineSchema();
    expect(schema.effects).toBeDefined();
    expect(schema.armorEffects).toBeDefined();
    expect(schema.attachedHistories).toBeDefined();
  });
});

describe('DeathwatchChapter', () => {
  it('includes base fields, skillCosts, and talentCosts', () => {
    const schema = DeathwatchChapter.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.skillCosts).toBeDefined();
    expect(schema.talentCosts).toBeDefined();
  });

  it('does not include equipped or requisition templates', () => {
    const schema = DeathwatchChapter.defineSchema();
    expect(schema.equipped).toBeUndefined();
    expect(schema.req).toBeUndefined();
  });
});

describe('DeathwatchSpecialty', () => {
  it('includes base fields and specialty-specific fields', () => {
    const schema = DeathwatchSpecialty.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.hasPsyRating).toBeDefined();
    expect(schema.hasPsyRating.options.initial).toBe(false);
    expect(schema.talentCosts).toBeDefined();
    expect(schema.skillCosts).toBeDefined();
    expect(schema.characteristicCosts).toBeDefined();
    expect(schema.rankCosts).toBeDefined();
  });
});

describe('DeathwatchWeapon', () => {
  it('includes base fields, equipped, capacity, requisition, and weapon fields', () => {
    const schema = DeathwatchWeapon.defineSchema();
    expect(schema.description).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.equipped).toBeDefined();
    expect(schema.clip).toBeDefined();
    expect(schema.req).toBeDefined();
    expect(schema.renown).toBeDefined();
    expect(schema.damage).toBeDefined();
    expect(schema.dmgType).toBeDefined();
    expect(schema.weaponType).toBeDefined();
    expect(schema.range).toBeDefined();
    expect(schema.rof).toBeDefined();
    expect(schema.dmg).toBeDefined();
    expect(schema.penetration).toBeDefined();
    expect(schema.class).toBeDefined();
    expect(schema.jammed).toBeDefined();
    expect(schema.loadedAmmo).toBeDefined();
    expect(schema.attachedQualities).toBeDefined();
    expect(schema.attachedUpgrades).toBeDefined();
    expect(schema.doublesStrengthBonus).toBeDefined();
    expect(schema.wt).toBeDefined();
  });
});

describe('DeathwatchActorBase', () => {
  it('includes wounds and fatigue schemas', () => {
    const schema = DeathwatchActorBase.defineSchema();
    expect(schema.wounds).toBeDefined();
    expect(schema.wounds.fields.value).toBeDefined();
    expect(schema.wounds.fields.base).toBeDefined();
    expect(schema.wounds.fields.max).toBeDefined();
    expect(schema.fatigue).toBeDefined();
    expect(schema.fatigue.fields.value).toBeDefined();
    expect(schema.fatigue.fields.max).toBeDefined();
  });
});

describe('DeathwatchCharacter', () => {
  it('includes all 9 characteristics', () => {
    const schema = DeathwatchCharacter.defineSchema();
    for (const key of ['ws', 'bs', 'str', 'tg', 'ag', 'int', 'per', 'wil', 'fs']) {
      expect(schema.characteristics.fields[key]).toBeDefined();
    }
  });

  it('includes biography, progression, and modifier fields', () => {
    const schema = DeathwatchCharacter.defineSchema();
    expect(schema.chapterId).toBeDefined();
    expect(schema.specialtyId).toBeDefined();
    expect(schema.rank).toBeDefined();
    expect(schema.xp).toBeDefined();
    expect(schema.fatePoints).toBeDefined();
    expect(schema.renown).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.psyRating).toBeDefined();
    expect(schema.skills).toBeDefined();
    expect(schema.conditions).toBeDefined();
  });

  it('includes wounds and fatigue from base', () => {
    const schema = DeathwatchCharacter.defineSchema();
    expect(schema.wounds).toBeDefined();
    expect(schema.fatigue).toBeDefined();
  });

  it('prepareDerivedData computes movement from agility', () => {
    const model = new DeathwatchCharacter();
    Object.assign(model, {
      characteristics: { ag: { base: 40, value: 40 } },
      modifiers: [],
      skills: {},
      xp: { total: 13000 }
    });
    const mockActor = { items: [], effects: undefined, system: model };
    model.parent = mockActor;
    model.prepareDerivedData();
    expect(model.movement.half).toBe(4);
    expect(model.movement.full).toBe(8);
  });
});

describe('DeathwatchNPC', () => {
  it('inherits wounds and fatigue from base', () => {
    const schema = DeathwatchNPC.defineSchema();
    expect(schema.wounds).toBeDefined();
    expect(schema.fatigue).toBeDefined();
  });

  it('includes characteristics, skills, modifiers, and conditions', () => {
    const schema = DeathwatchNPC.defineSchema();
    expect(schema.characteristics).toBeDefined();
    expect(schema.skills).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.conditions).toBeDefined();
    expect(schema.description).toBeDefined();
  });

  it('prepareDerivedData applies characteristic modifiers', () => {
    const npc = new DeathwatchNPC();
    npc.characteristics = {
      ws: { base: 40, value: 40 },
      bs: { base: 30, value: 30 },
      str: { base: 30, value: 30 },
      tg: { base: 30, value: 30 },
      ag: { base: 30, value: 30 },
      int: { base: 30, value: 30 },
      per: { base: 30, value: 30 },
      wil: { base: 30, value: 30 },
      fs: { base: 30, value: 30 }
    };
    npc.modifiers = [];
    npc.skills = {};
    npc.wounds = { value: 0, base: 10, max: 10 };
    npc.fatigue = { value: 0, max: 0 };
    npc.parent = { items: [], effects: undefined, system: npc };
    npc.prepareDerivedData();
    expect(npc.characteristics.ws.value).toBe(40);
    expect(npc.characteristics.ws.mod).toBe(4);
  });
});

describe('DeathwatchEnemy', () => {
  it('includes characteristics, skills, modifiers, psyRating, and description', () => {
    const schema = DeathwatchEnemy.defineSchema();
    expect(schema.characteristics).toBeDefined();
    expect(schema.skills).toBeDefined();
    expect(schema.modifiers).toBeDefined();
    expect(schema.conditions).toBeDefined();
    expect(schema.description).toBeDefined();
    expect(schema.psyRating).toBeDefined();
    expect(schema.wounds).toBeDefined();
    expect(schema.fatigue).toBeDefined();
  });

  it('does not include character-only fields', () => {
    const schema = DeathwatchEnemy.defineSchema();
    expect(schema.chapterId).toBeUndefined();
    expect(schema.specialtyId).toBeUndefined();
    expect(schema.rank).toBeUndefined();
    expect(schema.xp).toBeUndefined();
    expect(schema.fatePoints).toBeUndefined();
    expect(schema.renown).toBeUndefined();
    expect(schema.pastEvents).toBeUndefined();
  });

  it('prepareDerivedData applies modifiers and computes movement', () => {
    const enemy = new DeathwatchEnemy();
    enemy.characteristics = {
      ws: { base: 50, value: 50 },
      bs: { base: 30, value: 30 },
      str: { base: 30, value: 30 },
      tg: { base: 40, value: 40 },
      ag: { base: 35, value: 35 },
      int: { base: 20, value: 20 },
      per: { base: 30, value: 30 },
      wil: { base: 30, value: 30 },
      fs: { base: 10, value: 10 }
    };
    enemy.modifiers = [];
    enemy.skills = {};
    enemy.wounds = { value: 0, base: 20, max: 20 };
    enemy.fatigue = { value: 0, max: 0 };
    enemy.psyRating = { value: 0, base: 0 };
    enemy.parent = { items: [], effects: undefined, system: enemy };
    enemy.prepareDerivedData();
    expect(enemy.characteristics.ws.mod).toBe(5);
    expect(enemy.movement.half).toBe(3);
    expect(enemy.movement.full).toBe(6);
  });
});

describe('DeathwatchTalent', () => {
  describe('defineSchema', () => {
    it('includes base fields and talent-specific fields', () => {
      const schema = DeathwatchTalent.defineSchema();
      expect(schema.description).toBeDefined();
      expect(schema.book).toBeDefined();
      expect(schema.page).toBeDefined();
      expect(schema.modifiers).toBeDefined();
      expect(schema.prerequisite).toBeDefined();
      expect(schema.benefit).toBeDefined();
      expect(schema.cost).toBeDefined();
      expect(schema.stackable).toBeDefined();
      expect(schema.subsequentCost).toBeDefined();
      expect(schema.compendiumId).toBeDefined();
    });

    it('has correct default values', () => {
      const schema = DeathwatchTalent.defineSchema();
      expect(schema.cost.options.initial).toBe(-1);
      expect(schema.stackable.options.initial).toBe(false);
      expect(schema.subsequentCost.options.initial).toBe(0);
      expect(schema.compendiumId.options.initial).toBe("");
    });

    it('does not include equipped or requisition templates', () => {
      const schema = DeathwatchTalent.defineSchema();
      expect(schema.equipped).toBeUndefined();
      expect(schema.req).toBeUndefined();
    });
  });

  describe('prepareDerivedData', () => {
    it('auto-populates compendiumId for tal-prefixed IDs', () => {
      const talent = new DeathwatchTalent();
      talent.compendiumId = '';
      talent.cost = 500;
      talent.parent = { _id: 'tal00000000001', actor: null };

      talent.prepareDerivedData();

      expect(talent.compendiumId).toBe('tal00000000001');
      expect(talent.effectiveCost).toBe(500);
    });

    it('does not overwrite existing compendiumId', () => {
      const talent = new DeathwatchTalent();
      talent.compendiumId = 'existing-id';
      talent.cost = 500;
      talent.parent = { _id: 'tal00000000001', actor: null };

      talent.prepareDerivedData();

      expect(talent.compendiumId).toBe('existing-id');
    });

    it('does not set compendiumId for non-tal IDs', () => {
      const talent = new DeathwatchTalent();
      talent.compendiumId = '';
      talent.cost = 500;
      talent.parent = { _id: 'abc123', actor: null };

      talent.prepareDerivedData();

      expect(talent.compendiumId).toBe('');
    });

    it('sets effectiveCost to base cost when no actor', () => {
      const talent = new DeathwatchTalent();
      talent.cost = 800;
      talent.parent = { _id: 'tal00000000001', actor: null };

      talent.prepareDerivedData();

      expect(talent.effectiveCost).toBe(800);
    });

    it('sets effectiveCost to base cost when no chapter', () => {
      const talent = new DeathwatchTalent();
      talent.cost = 800;
      talent.compendiumId = 'tal00000000001';
      talent.parent = {
        _id: 'tal00000000001',
        actor: { system: { chapterId: null }, items: { get: jest.fn() } }
      };

      talent.prepareDerivedData();

      expect(talent.effectiveCost).toBe(800);
    });

    it('applies chapter cost override', () => {
      const talent = new DeathwatchTalent();
      talent.cost = 1000;
      talent.compendiumId = 'tal00000000001';
      talent.parent = {
        _id: 'tal00000000001',
        actor: {
          system: { chapterId: 'chapter1' },
          items: {
            get: jest.fn((id) => {
              if (id === 'chapter1') return {
                system: { talentCosts: { 'tal00000000001': 500 } }
              };
              return null;
            })
          }
        }
      };

      talent.prepareDerivedData();

      expect(talent.effectiveCost).toBe(500);
    });

    it('uses base cost when chapter has no override for this talent', () => {
      const talent = new DeathwatchTalent();
      talent.cost = 1000;
      talent.compendiumId = 'tal99999999999';
      talent.parent = {
        _id: 'tal99999999999',
        actor: {
          system: { chapterId: 'chapter1' },
          items: {
            get: jest.fn((id) => {
              if (id === 'chapter1') return {
                system: { talentCosts: { 'tal00000000001': 500 } }
              };
              return null;
            })
          }
        }
      };

      talent.prepareDerivedData();

      expect(talent.effectiveCost).toBe(1000);
    });

    it('handles null cost gracefully', () => {
      const talent = new DeathwatchTalent();
      talent.cost = null;
      talent.parent = { _id: 'abc123', actor: null };

      talent.prepareDerivedData();

      expect(talent.effectiveCost).toBe(0);
    });
  });
});
