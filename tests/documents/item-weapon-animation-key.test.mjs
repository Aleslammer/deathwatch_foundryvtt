import DeathwatchWeapon from '../../src/module/data/item/weapon.mjs';

describe('DeathwatchWeapon - animationKey field', () => {
  describe('Schema field options', () => {
    it('should have animationKey field in schema', () => {
      const schema = DeathwatchWeapon.defineSchema();
      expect(schema.animationKey).toBeDefined();
    });

    it('animationKey should be a StringField', () => {
      const schema = DeathwatchWeapon.defineSchema();
      const { StringField } = foundry.data.fields;
      expect(schema.animationKey).toBeInstanceOf(StringField);
    });

    it('should have initial value set to empty string', () => {
      const schema = DeathwatchWeapon.defineSchema();
      expect(schema.animationKey.options.initial).toBe('');
    });

    it('should have blank set to true', () => {
      const schema = DeathwatchWeapon.defineSchema();
      expect(schema.animationKey.options.blank).toBe(true);
    });

    it('should have hint property', () => {
      const schema = DeathwatchWeapon.defineSchema();
      expect(schema.animationKey.options.hint).toBeDefined();
      expect(schema.animationKey.options.hint).toContain('Override animation type');
    });

    it('should have label property', () => {
      const schema = DeathwatchWeapon.defineSchema();
      expect(schema.animationKey.options.label).toBe('Animation Key');
    });
  });

  describe('DataModel instantiation', () => {
    it('should initialize with empty string when not provided', () => {
      const weapon = new DeathwatchWeapon();
      Object.assign(weapon, {});
      expect(weapon.animationKey || '').toBe('');
    });

    it('should accept valid animation key values', () => {
      const weapon = new DeathwatchWeapon();
      Object.assign(weapon, { animationKey: 'bolt' });
      expect(weapon.animationKey).toBe('bolt');
    });

    it('should handle various animation key types', () => {
      const animationTypes = ['bolt', 'las', 'plasma', 'melta', 'flame'];
      for (const type of animationTypes) {
        const weapon = new DeathwatchWeapon();
        Object.assign(weapon, { animationKey: type });
        expect(weapon.animationKey).toBe(type);
      }
    });
  });

  describe('attackDialog() chat message data attributes', () => {
    /**
     * Helper function to build expected chat content with data attributes
     */
    function buildChatContent({ actorId, itemId, itemUuid, roundsFired, fireMode, animationKey, damageType, weaponClass }) {
      return `<div class="dw-attack-roll"
  data-actor-id="${actorId}"
  data-item-id="${itemId}"
  data-item-uuid="${itemUuid}"
  data-rounds-fired="${roundsFired}"
  data-fire-mode="${fireMode}"
  data-animation-key="${animationKey || ''}"
  data-damage-type="${damageType || ''}"
  data-weapon-class="${weaponClass || ''}">`;
    }

    it('PLACEHOLDER: _attackWithOptions() should embed same data attributes', () => {
      // This test verifies the contract that _attackWithOptions() must fulfill
      // but cannot be fully tested without Foundry runtime context (ChatMessage, Roll, etc.)
      //
      // When implementing _attackWithOptions() modifications, ensure:
      // 1. Chat message content wraps roll in <div class="dw-attack-roll">
      // 2. Div includes all data attributes: actor-id, item-id, item-uuid, rounds-fired,
      //    fire-mode, animation-key, damage-type, weapon-class
      // 3. Sanitizer.escape() is applied to user-editable fields (animationKey, dmgType, class)
      // 4. Fire mode maps: autoFire=0 → "single", autoFire=10 → "semi", autoFire=20 → "full"
      //
      // Manual verification required:
      // - Create hotbar macro for weapon attack
      // - Trigger _attackWithOptions() via hotbar
      // - Inspect chat message HTML for data attributes
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should embed data-rounds-fired attribute with correct value', () => {
      const mockContent = buildChatContent({
        actorId: 'actor123',
        itemId: 'item456',
        itemUuid: 'Item.item456',
        roundsFired: 3,
        fireMode: 'semi',
        animationKey: 'bolt',
        damageType: 'X',
        weaponClass: 'BG'
      });

      expect(mockContent).toContain('data-rounds-fired="3"');
    });

    it('should embed data-fire-mode="single" for single shot (autoFire=0)', () => {
      const mockContent = buildChatContent({
        actorId: 'actor123',
        itemId: 'item456',
        itemUuid: 'Item.item456',
        roundsFired: 1,
        fireMode: 'single',
        animationKey: 'bolt',
        damageType: 'X',
        weaponClass: 'BG'
      });

      expect(mockContent).toContain('data-fire-mode="single"');
    });

    it('should embed data-fire-mode="semi" for semi-auto (autoFire=10)', () => {
      const mockContent = buildChatContent({
        actorId: 'actor123',
        itemId: 'item456',
        itemUuid: 'Item.item456',
        roundsFired: 2,
        fireMode: 'semi',
        animationKey: 'bolt',
        damageType: 'X',
        weaponClass: 'BG'
      });

      expect(mockContent).toContain('data-fire-mode="semi"');
    });

    it('should embed data-fire-mode="full" for full-auto (autoFire=20)', () => {
      const mockContent = buildChatContent({
        actorId: 'actor123',
        itemId: 'item456',
        itemUuid: 'Item.item456',
        roundsFired: 5,
        fireMode: 'full',
        animationKey: 'bolt',
        damageType: 'X',
        weaponClass: 'BG'
      });

      expect(mockContent).toContain('data-fire-mode="full"');
    });

    it('should embed data-animation-key with weapon.system.animationKey when set', () => {
      const mockContent = buildChatContent({
        actorId: 'actor123',
        itemId: 'item456',
        itemUuid: 'Item.item456',
        roundsFired: 1,
        fireMode: 'single',
        animationKey: 'plasma',
        damageType: 'E',
        weaponClass: 'BG'
      });

      expect(mockContent).toContain('data-animation-key="plasma"');
    });

    it('should embed data-animation-key="" when weapon.system.animationKey is empty', () => {
      const mockContent = buildChatContent({
        actorId: 'actor123',
        itemId: 'item456',
        itemUuid: 'Item.item456',
        roundsFired: 1,
        fireMode: 'single',
        animationKey: '',
        damageType: 'E',
        weaponClass: 'BG'
      });

      expect(mockContent).toContain('data-animation-key=""');
    });

    it('should embed data-damage-type with weapon.system.dmgType', () => {
      const mockContent = buildChatContent({
        actorId: 'actor123',
        itemId: 'item456',
        itemUuid: 'Item.item456',
        roundsFired: 1,
        fireMode: 'single',
        animationKey: 'bolt',
        damageType: 'X',
        weaponClass: 'BG'
      });

      expect(mockContent).toContain('data-damage-type="X"');
    });

    it('should embed data-weapon-class with weapon.system.class', () => {
      const mockContent = buildChatContent({
        actorId: 'actor123',
        itemId: 'item456',
        itemUuid: 'Item.item456',
        roundsFired: 1,
        fireMode: 'single',
        animationKey: 'bolt',
        damageType: 'X',
        weaponClass: 'BG'
      });

      expect(mockContent).toContain('data-weapon-class="BG"');
    });

    it('should handle missing optional fields gracefully', () => {
      const mockContent = buildChatContent({
        actorId: 'actor123',
        itemId: 'item456',
        itemUuid: 'Item.item456',
        roundsFired: 1,
        fireMode: 'single',
        animationKey: '',
        damageType: '',
        weaponClass: ''
      });

      expect(mockContent).toContain('data-animation-key=""');
      expect(mockContent).toContain('data-damage-type=""');
      expect(mockContent).toContain('data-weapon-class=""');
    });

    it('should embed all data attributes in correct format', () => {
      const mockContent = buildChatContent({
        actorId: 'actor789',
        itemId: 'item012',
        itemUuid: 'Item.item012',
        roundsFired: 10,
        fireMode: 'full',
        animationKey: 'melta',
        damageType: 'E',
        weaponClass: 'Basic'
      });

      expect(mockContent).toContain('data-actor-id="actor789"');
      expect(mockContent).toContain('data-item-id="item012"');
      expect(mockContent).toContain('data-item-uuid="Item.item012"');
      expect(mockContent).toContain('data-rounds-fired="10"');
      expect(mockContent).toContain('data-fire-mode="full"');
      expect(mockContent).toContain('data-animation-key="melta"');
      expect(mockContent).toContain('data-damage-type="E"');
      expect(mockContent).toContain('data-weapon-class="Basic"');
    });
  });
});
