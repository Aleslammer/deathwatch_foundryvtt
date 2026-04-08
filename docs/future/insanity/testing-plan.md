# Insanity and Corruption - Testing Plan

## Test Coverage Goals

- **Unit Tests**: 90%+ coverage for helper modules
- **Integration Tests**: All major system interactions
- **E2E Tests**: Critical user flows (gain CP/IP, trigger tests, character removal)
- **Performance Tests**: Sheet render times < 50ms overhead
- **Regression Tests**: Ensure no breaking changes to existing systems
- **RollTable Tests**: Verify Battle Trauma table structure and draws

---

## Unit Tests

### `tests/helpers/insanity-helper.test.mjs`

**Coverage**: Core insanity mechanics

```javascript
describe('InsanityHelper', () => {
  describe('getTrackLevel()', () => {
    test('returns 0 for 0-30 IP', () => {
      expect(InsanityHelper.getTrackLevel(0)).toBe(0);
      expect(InsanityHelper.getTrackLevel(15)).toBe(0);
      expect(InsanityHelper.getTrackLevel(30)).toBe(0);
    });
    
    test('returns 1 for 31-60 IP', () => {
      expect(InsanityHelper.getTrackLevel(31)).toBe(1);
      expect(InsanityHelper.getTrackLevel(45)).toBe(1);
      expect(InsanityHelper.getTrackLevel(60)).toBe(1);
    });
    
    test('returns 2 for 61-90 IP', () => {
      expect(InsanityHelper.getTrackLevel(61)).toBe(2);
      expect(InsanityHelper.getTrackLevel(75)).toBe(2);
      expect(InsanityHelper.getTrackLevel(90)).toBe(2);
    });
    
    test('returns 3 for 91-99 IP', () => {
      expect(InsanityHelper.getTrackLevel(91)).toBe(3);
      expect(InsanityHelper.getTrackLevel(95)).toBe(3);
      expect(InsanityHelper.getTrackLevel(99)).toBe(3);
    });
    
    test('returns 3 for 100+ IP (edge case)', () => {
      expect(InsanityHelper.getTrackLevel(100)).toBe(3);
      expect(InsanityHelper.getTrackLevel(150)).toBe(3);
    });
  });
  
  describe('getTraumaModifier()', () => {
    test('returns correct modifiers for each track level', () => {
      expect(InsanityHelper.getTraumaModifier(0)).toBe(0);
      expect(InsanityHelper.getTraumaModifier(31)).toBe(-10);
      expect(InsanityHelper.getTraumaModifier(61)).toBe(-20);
      expect(InsanityHelper.getTraumaModifier(91)).toBe(-30);
    });
  });
  
  describe('getCurseLevel()', () => {
    test('returns 0 for 0-30 IP', () => {
      expect(InsanityHelper.getCurseLevel(0)).toBe(0);
      expect(InsanityHelper.getCurseLevel(30)).toBe(0);
    });
    
    test('returns correct levels for each threshold', () => {
      expect(InsanityHelper.getCurseLevel(31)).toBe(1);
      expect(InsanityHelper.getCurseLevel(61)).toBe(2);
      expect(InsanityHelper.getCurseLevel(91)).toBe(3);
    });
    
    test('returns 0 for 100+ IP (character removed)', () => {
      expect(InsanityHelper.getCurseLevel(100)).toBe(0);
    });
  });
  
  describe('shouldTriggerInsanityTest()', () => {
    test('returns false if no 10-point boundary crossed', () => {
      const actor = { system: { insanity: 25, lastInsanityTestAt: 2 } };
      expect(InsanityHelper.shouldTriggerInsanityTest(actor, 3)).toBe(false);
    });
    
    test('returns true if 10-point boundary crossed', () => {
      const actor = { system: { insanity: 35, lastInsanityTestAt: 3 } };
      expect(InsanityHelper.shouldTriggerInsanityTest(actor, 4)).toBe(true);
    });
    
    test('returns false if test already done at this threshold', () => {
      const actor = { system: { insanity: 45, lastInsanityTestAt: 4 } };
      expect(InsanityHelper.shouldTriggerInsanityTest(actor, 4)).toBe(false);
    });
  });
  
  describe('addInsanity()', () => {
    let mockActor;
    
    beforeEach(() => {
      mockActor = createMockActor({
        type: 'character',
        system: {
          insanity: 25,
          insanityHistory: [],
          lastInsanityTestAt: 2
        }
      });
    });
    
    test('adds insanity points and creates history entry', async () => {
      await InsanityHelper.addInsanity(mockActor, 5, 'Test source');
      
      expect(mockActor.system.insanity).toBe(30);
      expect(mockActor.system.insanityHistory).toHaveLength(1);
      expect(mockActor.system.insanityHistory[0]).toMatchObject({
        points: 5,
        source: 'Test source',
        testRolled: false
      });
    });
    
    test('triggers insanity test when crossing 10-point boundary', async () => {
      const promptSpy = jest.spyOn(InsanityHelper, 'promptInsanityTest');
      
      await InsanityHelper.addInsanity(mockActor, 8, 'Test source');
      
      expect(promptSpy).toHaveBeenCalledWith(mockActor, 3);
    });
    
    test('does not trigger test if not crossing boundary', async () => {
      const promptSpy = jest.spyOn(InsanityHelper, 'promptInsanityTest');
      
      await InsanityHelper.addInsanity(mockActor, 2, 'Test source');
      
      expect(promptSpy).not.toHaveBeenCalled();
    });
    
    test('triggers character removal at 100+ IP', async () => {
      mockActor.system.insanity = 95;
      const removalSpy = jest.spyOn(InsanityHelper, 'handleCharacterRemoval');
      
      await InsanityHelper.addInsanity(mockActor, 10, 'Test source');
      
      expect(removalSpy).toHaveBeenCalledWith(mockActor, 'insanity');
    });
  });
  
  describe('rollInsanityTest()', () => {
    let mockActor;
    
    beforeEach(() => {
      mockActor = createMockActor({
        type: 'character',
        system: {
          insanity: 35,
          insanityHistory: [
            { points: 12, source: 'Test', testRolled: false, testResult: null }
          ],
          characteristics: { wp: { total: 54 } }
        }
      });
    });
    
    test('rolls test with modifiers and records result', async () => {
      mockRoll(42); // Success (42 <= 54)
      
      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 54,
        trackModifier: -10,
        situationalMod: 0,
        finalTarget: 44,
        threshold: 3
      });
      
      const lastHistory = mockActor.system.insanityHistory[0];
      expect(lastHistory.testRolled).toBe(true);
      expect(lastHistory.testResult).toContain('Success');
      expect(lastHistory.testModifiers).toEqual({
        base: 54,
        track: -10,
        situational: 0,
        total: 44
      });
    });
    
    test('applies situational modifiers correctly', async () => {
      mockRoll(60); // Would succeed vs 54, fails vs 44
      
      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 54,
        trackModifier: -10,
        situationalMod: 0,
        finalTarget: 44,
        threshold: 3
      });
      
      const lastHistory = mockActor.system.insanityHistory[0];
      expect(lastHistory.testResult).toContain('Failure');
    });
    
    test('triggers battle trauma on failure', async () => {
      mockRoll(90); // Failure
      
      const traumaSpy = jest.spyOn(InsanityHelper, 'rollBattleTrauma');
      
      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 54,
        trackModifier: -10,
        situationalMod: 0,
        finalTarget: 44,
        threshold: 3
      });
      
      expect(traumaSpy).toHaveBeenCalledWith(mockActor);
    });
    
    test('does not trigger trauma on success', async () => {
      mockRoll(30); // Success
      
      const traumaSpy = jest.spyOn(InsanityHelper, 'rollBattleTrauma');
      
      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 54,
        trackModifier: -10,
        situationalMod: 0,
        finalTarget: 44,
        threshold: 3
      });
      
      expect(traumaSpy).not.toHaveBeenCalled();
    });
    
    test('positive situational modifier increases target', async () => {
      mockRoll(62); // Would fail vs 44, succeeds vs 64
      
      await InsanityHelper.rollInsanityTest(mockActor, {
        wp: 54,
        trackModifier: -10,
        situationalMod: 20, // +20 for squad support
        finalTarget: 64,
        threshold: 3
      });
      
      const lastHistory = mockActor.system.insanityHistory[0];
      expect(lastHistory.testResult).toContain('Success');
      expect(lastHistory.testModifiers.situational).toBe(20);
    });
  });
  
  describe('rollBattleTrauma()', () => {
    let mockActor;
    let mockTable;
    let mockTraumas;
    
    beforeEach(() => {
      mockActor = createMockActor({
        type: 'character',
        items: []
      });
      
      // Mock trauma items
      mockTraumas = {
        'trauma1': { _id: 'trauma1', name: 'Battle Rage', type: 'battle-trauma', system: { key: 'battle-rage' } },
        'trauma2': { _id: 'trauma2', name: 'Ear of Emperor', type: 'battle-trauma', system: { key: 'ear-of-emperor' } },
        'trauma3': { _id: 'trauma3', name: 'Ancestral Spirits', type: 'battle-trauma', system: { key: 'ancestral-spirits' } }
      };
      
      // Mock RollTable
      mockTable = createMockRollTable('Battle Trauma Table', {
        formula: '1d10',
        results: [
          { range: [1, 2], documentCollection: 'deathwatch.battle-traumas', documentId: 'trauma1' },
          { range: [3, 4], documentCollection: 'deathwatch.battle-traumas', documentId: 'trauma2' },
          { range: [5, 6], documentCollection: 'deathwatch.battle-traumas', documentId: 'trauma3' }
        ]
      });
    });
    
    test('draws from RollTable and adds trauma', async () => {
      // Mock table.draw() to return result 3 (Ancestral Spirits)
      mockTable.draw = jest.fn().mockResolvedValue({
        results: [{
          documentCollection: 'deathwatch.battle-traumas',
          documentId: 'trauma3'
        }]
      });
      
      await InsanityHelper.rollBattleTrauma(mockActor);
      
      expect(mockTable.draw).toHaveBeenCalledWith({ displayChat: false });
      expect(mockActor.items).toHaveLength(1);
      expect(mockActor.items[0].system.key).toBe('ancestral-spirits');
    });
    
    test('rerolls if duplicate trauma (already have it)', async () => {
      // Actor already has Battle Rage
      mockActor.items.push({
        type: 'battle-trauma',
        system: { key: 'battle-rage' }
      });
      
      // First draw returns Battle Rage (duplicate), second returns Ear of Emperor
      let callCount = 0;
      mockTable.draw = jest.fn().mockImplementation(async () => {
        callCount++;
        const traumaId = callCount === 1 ? 'trauma1' : 'trauma2';
        return {
          results: [{
            documentCollection: 'deathwatch.battle-traumas',
            documentId: traumaId
          }]
        };
      });
      
      await InsanityHelper.rollBattleTrauma(mockActor);
      
      expect(mockTable.draw).toHaveBeenCalledTimes(2);
      expect(mockActor.items).toHaveLength(2);
      expect(mockActor.items[1].system.key).toBe('ear-of-emperor');
    });
    
    test('stops after max reroll attempts', async () => {
      // Fill actor with all traumas
      mockActor.items.push(
        { type: 'battle-trauma', system: { key: 'battle-rage' } },
        { type: 'battle-trauma', system: { key: 'ear-of-emperor' } },
        { type: 'battle-trauma', system: { key: 'ancestral-spirits' } }
      );
      
      // Always return trauma1 (which is already owned)
      mockTable.draw = jest.fn().mockResolvedValue({
        results: [{
          documentCollection: 'deathwatch.battle-traumas',
          documentId: 'trauma1'
        }]
      });
      
      await InsanityHelper.rollBattleTrauma(mockActor);
      
      // Should not add any more traumas
      expect(mockActor.items).toHaveLength(3);
      expect(mockTable.draw).toHaveBeenCalledTimes(BATTLE_TRAUMA.MAX_REROLL_ATTEMPTS);
    });
  });
});
```

### `tests/helpers/corruption-helper.test.mjs`

**Coverage**: Core corruption mechanics

```javascript
describe('CorruptionHelper', () => {
  describe('isPurityThresholdReached()', () => {
    test('returns false below threshold', () => {
      expect(CorruptionHelper.isPurityThresholdReached(0)).toBe(false);
      expect(CorruptionHelper.isPurityThresholdReached(99)).toBe(false);
    });
    
    test('returns true at or above threshold', () => {
      expect(CorruptionHelper.isPurityThresholdReached(100)).toBe(true);
      expect(CorruptionHelper.isPurityThresholdReached(150)).toBe(true);
    });
  });
  
  describe('getCorruptionLevel()', () => {
    test('returns descriptive level for CP ranges', () => {
      expect(CorruptionHelper.getCorruptionLevel(0)).toBe('pure');
      expect(CorruptionHelper.getCorruptionLevel(30)).toBe('pure');
      expect(CorruptionHelper.getCorruptionLevel(50)).toBe('minor-taint');
      expect(CorruptionHelper.getCorruptionLevel(70)).toBe('significant');
      expect(CorruptionHelper.getCorruptionLevel(90)).toBe('critical');
      expect(CorruptionHelper.getCorruptionLevel(100)).toBe('fallen');
    });
  });
  
  describe('addCorruption()', () => {
    let mockActor;
    
    beforeEach(() => {
      mockActor = createMockActor({
        type: 'character',
        system: {
          corruption: 50,
          corruptionHistory: []
        }
      });
    });
    
    test('adds corruption points and creates history entry', async () => {
      await CorruptionHelper.addCorruption(mockActor, 10, 'Test source');
      
      expect(mockActor.system.corruption).toBe(60);
      expect(mockActor.system.corruptionHistory).toHaveLength(1);
      expect(mockActor.system.corruptionHistory[0]).toMatchObject({
        points: 10,
        source: 'Test source'
      });
    });
    
    test('triggers character removal at 100+ CP', async () => {
      mockActor.system.corruption = 95;
      const removalSpy = jest.spyOn(CorruptionHelper, 'handleCharacterRemoval');
      
      await CorruptionHelper.addCorruption(mockActor, 10, 'Test source');
      
      expect(removalSpy).toHaveBeenCalledWith(mockActor, 'corruption');
    });
    
    test('posts chat message on corruption gain', async () => {
      const chatSpy = jest.spyOn(CorruptionHelper, 'postCorruptionMessage');
      
      await CorruptionHelper.addCorruption(mockActor, 5, 'Test source');
      
      expect(chatSpy).toHaveBeenCalledWith(mockActor, 5, 'Test source', 55);
    });
  });
  
  describe('getFellowshipPenalty()', () => {
    test('returns 0 for low corruption', () => {
      expect(CorruptionHelper.getFellowshipPenalty(0)).toBe(0);
      expect(CorruptionHelper.getFellowshipPenalty(49)).toBe(0);
    });
    
    test('returns -10 per 25 CP over 50', () => {
      expect(CorruptionHelper.getFellowshipPenalty(50)).toBe(0);
      expect(CorruptionHelper.getFellowshipPenalty(74)).toBe(-10);
      expect(CorruptionHelper.getFellowshipPenalty(75)).toBe(-10);
      expect(CorruptionHelper.getFellowshipPenalty(99)).toBe(-10);
      expect(CorruptionHelper.getFellowshipPenalty(100)).toBe(-20);
    });
  });
});
```

### `tests/data/battle-trauma.test.mjs`

**Coverage**: Battle Trauma DataModel

```javascript
describe('DeathwatchBattleTrauma', () => {
  test('has correct default values', () => {
    const trauma = new DeathwatchBattleTrauma();
    
    expect(trauma.triggerType).toBe('always');
    expect(trauma.effectType).toBe('modifier');
    expect(trauma.modifier).toBe(0);
    expect(trauma.canResist).toBe(false);
  });
  
  test('validates trigger type', () => {
    const trauma = new DeathwatchBattleTrauma({ triggerType: 'invalid' });
    
    expect(() => trauma.validate()).toThrow();
  });
  
  test('computes derived data correctly', () => {
    const trauma = new DeathwatchBattleTrauma({
      name: 'Battle Rage',
      triggerType: 'righteousFury'
    });
    
    trauma.prepareDerivedData();
    
    expect(trauma.img).toContain('battle-trauma');
  });
  
  describe('getModifiers()', () => {
    test('returns modifiers when effectType is "modifier"', () => {
      const trauma = new DeathwatchBattleTrauma({
        effectType: 'modifier',
        modifier: -10,
        modifierTarget: 'fellowship'
      });
      
      const modifiers = trauma.getModifiers();
      
      expect(modifiers).toHaveLength(1);
      expect(modifiers[0]).toMatchObject({
        value: -10,
        target: 'fellowship',
        type: 'battle-trauma'
      });
    });
    
    test('returns empty array for non-modifier effects', () => {
      const trauma = new DeathwatchBattleTrauma({
        effectType: 'behavior'
      });
      
      expect(trauma.getModifiers()).toHaveLength(0);
    });
  });
});
```

### `tests/data/chapter.test.mjs`

**Coverage**: Primarch's Curse functionality in Chapter DataModel

```javascript
describe('DeathwatchChapter - Primarch\'s Curse', () => {
  let chapter;
  
  beforeEach(() => {
    chapter = new DeathwatchChapter({
      name: 'Black Templars',
      key: 'black-templars',
      curseName: 'Burn the Witch',
      curseLevel1Name: 'Fear the Witch',
      curseLevel1Effect: 'modifier',
      curseLevel1Modifier: -20,
      curseLevel1Target: 'fellowship',
      curseLevel2Name: 'Hate the Witch',
      curseLevel2Effect: 'cohesionPenalty',
      curseLevel2CohesionPenalty: 1,
      curseLevel3Name: 'Kill the Witch',
      curseLevel3Effect: 'behavioralRequirement'
    });
  });
  
  describe('hasCurse()', () => {
    test('returns true if curse is defined', () => {
      expect(chapter.hasCurse()).toBe(true);
    });
    
    test('returns false if no curse name', () => {
      chapter.curseName = '';
      expect(chapter.hasCurse()).toBe(false);
    });
  });
  
  describe('getActiveCurseLevel()', () => {
    test('returns null for 0-30 IP', () => {
      expect(chapter.getActiveCurseLevel(0)).toBeNull();
      expect(chapter.getActiveCurseLevel(30)).toBeNull();
    });
    
    test('returns level 1 data for 31-60 IP', () => {
      const levelData = chapter.getActiveCurseLevel(45);
      
      expect(levelData.level).toBe(1);
      expect(levelData.name).toBe('Fear the Witch');
      expect(levelData.modifier).toBe(-20);
      expect(levelData.target).toBe('fellowship');
    });
    
    test('returns level 2 data for 61-90 IP', () => {
      const levelData = chapter.getActiveCurseLevel(75);
      
      expect(levelData.level).toBe(2);
      expect(levelData.name).toBe('Hate the Witch');
      expect(levelData.cohesionPenalty).toBe(1);
    });
    
    test('returns level 3 data for 91-99 IP', () => {
      const levelData = chapter.getActiveCurseLevel(95);
      
      expect(levelData.level).toBe(3);
      expect(levelData.name).toBe('Kill the Witch');
    });
  });
  
  test('chapter without curse returns null', () => {
    const noCurseChapter = new DeathwatchChapter({
      name: 'Ultramarines',
      key: 'ultramarines'
      // No curse fields defined
    });
    
    expect(noCurseChapter.hasCurse()).toBe(false);
    expect(noCurseChapter.getActiveCurseLevel(50)).toBeNull();
  });
});
```

---

## Integration Tests

### `tests/integration/insanity-system.test.mjs`

**Coverage**: Full insanity workflow

```javascript
describe('Insanity System Integration', () => {
  let actor;
  
  beforeEach(() => {
    actor = createTestActor('character', {
      characteristics: { wp: { value: 54 } },
      insanity: 0,
      lastInsanityTestAt: 0
    });
  });
  
  test('full workflow: gain IP, trigger test, gain trauma', async () => {
    // Gain 12 IP (crosses 10-point boundary)
    await InsanityHelper.addInsanity(actor, 12, 'Test source');
    
    expect(actor.system.insanity).toBe(12);
    
    // Insanity test should be triggered
    // (In real code, this would open a dialog; in tests, we call directly)
    mockRoll(75); // Roll 75 vs 54 = failure
    
    await InsanityHelper.rollInsanityTest(actor, {
      wp: 54,
      trackModifier: 0,
      situationalMod: 0,
      finalTarget: 54,
      threshold: 1
    });
    
    // Verify test was recorded
    const lastHistory = actor.system.insanityHistory[actor.system.insanityHistory.length - 1];
    expect(lastHistory.testRolled).toBe(true);
    expect(lastHistory.testResult).toContain('Failure');
    expect(lastHistory.testModifiers.total).toBe(54);
    
    // Battle trauma should be rolled
    mockRoll(3); // Roll 3 on d10
    
    const traumas = actor.items.filter(i => i.type === 'battle-trauma');
    expect(traumas).toHaveLength(1);
    expect(traumas[0].system.key).toBe('ear-of-emperor');
  });
  
  test('crossing multiple thresholds updates curse level', async () => {
    // Add Chapter with Primarch's Curse to actor
    const chapter = createTestItem('chapter', {
      key: 'black-templars',
      curseName: 'Burn the Witch',
      curseLevel1Name: 'Fear the Witch',
      curseLevel2Name: 'Hate the Witch',
      curseLevel3Name: 'Kill the Witch'
    });
    await actor.createEmbeddedDocuments('Item', [chapter]);
    
    // Gain 35 IP (crosses into level 1)
    await InsanityHelper.addInsanity(actor, 35, 'Test source');
    
    expect(actor.system.primarchsCurseLevel).toBe(1);
    
    // Gain 30 more IP (crosses into level 2)
    await InsanityHelper.addInsanity(actor, 30, 'Test source 2');
    
    expect(actor.system.primarchsCurseLevel).toBe(2);
  });
  
  test('character removal at 100 IP', async () => {
    actor.system.insanity = 95;
    
    const removalSpy = jest.spyOn(InsanityHelper, 'handleCharacterRemoval');
    
    await InsanityHelper.addInsanity(actor, 10, 'Final source');
    
    expect(removalSpy).toHaveBeenCalledWith(actor, 'insanity');
  });
});
```

### `tests/integration/corruption-system.test.mjs`

**Coverage**: Full corruption workflow

```javascript
describe('Corruption System Integration', () => {
  let actor;
  
  beforeEach(() => {
    actor = createTestActor('character', {
      corruption: 0
    });
  });
  
  test('accumulates corruption over time', async () => {
    await CorruptionHelper.addCorruption(actor, 10, 'Source 1');
    expect(actor.system.corruption).toBe(10);
    
    await CorruptionHelper.addCorruption(actor, 15, 'Source 2');
    expect(actor.system.corruption).toBe(25);
    
    await CorruptionHelper.addCorruption(actor, 30, 'Source 3');
    expect(actor.system.corruption).toBe(55);
  });
  
  test('history log tracks all gains', async () => {
    await CorruptionHelper.addCorruption(actor, 10, 'Source 1');
    await CorruptionHelper.addCorruption(actor, 5, 'Source 2');
    
    expect(actor.system.corruptionHistory).toHaveLength(2);
    expect(actor.system.corruptionHistory[0].points).toBe(10);
    expect(actor.system.corruptionHistory[1].points).toBe(5);
  });
  
  test('Fellowship penalty applies at high corruption', async () => {
    actor.system.corruption = 75;
    
    const penalty = CorruptionHelper.getFellowshipPenalty(actor.system.corruption);
    expect(penalty).toBe(-10);
    
    // Apply to Fellowship test
    const modifiers = ModifierCollector.collectCharacteristicModifiers(actor, 'fel');
    const corruptionMod = modifiers.find(m => m.source === 'High Corruption');
    
    expect(corruptionMod).toBeDefined();
    expect(corruptionMod.value).toBe(-10);
  });
});
```

### `tests/integration/modifier-integration.test.mjs`

**Coverage**: Integration with modifier system

```javascript
describe('Insanity/Corruption Modifier Integration', () => {
  let actor;
  
  beforeEach(() => {
    actor = createTestActor('character', {
      insanity: 65,
      corruption: 80
    });
  });
  
  test('collects Battle Trauma modifiers', async () => {
    // Add Battle Rage trauma
    const trauma = createTestItem('battle-trauma', {
      key: 'righteous-contempt',
      effectType: 'modifier',
      modifier: -10,
      modifierTarget: 'fellowship'
    });
    await actor.createEmbeddedDocuments('Item', [trauma]);
    
    const modifiers = ModifierCollector.collectCharacteristicModifiers(actor, 'fel');
    const traumaMod = modifiers.find(m => m.type === 'battle-trauma');
    
    expect(traumaMod).toBeDefined();
    expect(traumaMod.value).toBe(-10);
  });
  
  test('collects Primarch\'s Curse modifiers at active level', async () => {
    // Add chapter with curse at level 2 (actor has 65 IP)
    const chapter = createTestItem('chapter', {
      key: 'black-templars',
      curseName: 'Burn the Witch',
      curseLevel2Effect: 'modifier',
      curseLevel2Modifier: -20,
      curseLevel2Target: 'fellowship'
    });
    await actor.createEmbeddedDocuments('Item', [chapter]);
    
    const modifiers = ModifierCollector.collectCharacteristicModifiers(actor, 'fel');
    const curseMod = modifiers.find(m => m.type === 'primarchs-curse');
    
    expect(curseMod).toBeDefined();
    expect(curseMod.value).toBe(-20);
  });
  
  test('Primarch\'s Curse reduces cohesion', async () => {
    const chapter = createTestItem('chapter', {
      key: 'black-templars',
      curseName: 'Burn the Witch',
      curseLevel2CohesionPenalty: 1
    });
    await actor.createEmbeddedDocuments('Item', [chapter]);
    
    const cohesionPenalty = CohesionHelper.getCurseCohesionPenalty(actor);
    expect(cohesionPenalty).toBe(1);
  });
});
```

---

## RollTable Tests

### `tests/integration/battle-trauma-roll-table.test.mjs`

**Coverage**: Battle Trauma RollTable functionality

```javascript
describe('Battle Trauma RollTable', () => {
  let table;
  let traumasPack;
  
  beforeEach(async () => {
    const tablePack = game.packs.get("deathwatch.roll-tables");
    table = await tablePack.getDocument(
      tablePack.index.find(t => t.name === "Battle Trauma Table")?._id
    );
    
    traumasPack = game.packs.get("deathwatch.battle-traumas");
  });
  
  test('table exists in compendium', () => {
    expect(table).toBeDefined();
    expect(table.name).toBe("Battle Trauma Table");
  });
  
  test('has correct formula', () => {
    expect(table.formula).toBe("1d10");
  });
  
  test('has 5 results covering d10 range', () => {
    expect(table.results.size).toBe(5);
    
    const ranges = Array.from(table.results).map(r => r.range);
    expect(ranges).toContainEqual([1, 2]);
    expect(ranges).toContainEqual([3, 4]);
    expect(ranges).toContainEqual([5, 6]);
    expect(ranges).toContainEqual([7, 8]);
    expect(ranges).toContainEqual([9, 10]);
  });
  
  test('all results link to valid battle-trauma items', async () => {
    for (const result of table.results) {
      expect(result.type).toBe(2); // Document type
      expect(result.documentCollection).toBe("deathwatch.battle-traumas");
      
      // Verify item exists
      const item = await traumasPack.getDocument(result.documentId);
      expect(item).toBeDefined();
      expect(item.type).toBe("battle-trauma");
      expect(item.system.key).toBeDefined();
    }
  });
  
  test('can draw from table', async () => {
    const draw = await table.draw({ displayChat: false });
    
    expect(draw.results).toHaveLength(1);
    
    const result = draw.results[0];
    expect(result.documentCollection).toBe("deathwatch.battle-traumas");
    
    // Verify we can get the trauma item
    const trauma = await traumasPack.getDocument(result.documentId);
    expect(trauma.type).toBe("battle-trauma");
  });
  
  test('multiple draws produce different results (probabilistic)', async () => {
    const results = new Set();
    
    // Draw 10 times
    for (let i = 0; i < 10; i++) {
      const draw = await table.draw({ displayChat: false });
      results.add(draw.results[0].text);
    }
    
    // Should get at least 2 different traumas (very likely with 10 rolls)
    expect(results.size).toBeGreaterThanOrEqual(2);
  });
  
  test('replacement is enabled (allows duplicates)', () => {
    expect(table.replacement).toBe(true);
  });
  
  test('displayRoll is enabled', () => {
    expect(table.displayRoll).toBe(true);
  });
});
```

---

## E2E Tests

### `tests/e2e/insanity-workflow.test.mjs`

**Coverage**: Full user workflow from UI

```javascript
describe('Insanity Workflow (E2E)', () => {
  test('GM adds insanity, player rolls test, gains trauma', async () => {
    // 1. GM opens adjustment dialog
    const actor = game.actors.getName('Test Character');
    const dialog = await InsanityHelper.openAdjustmentDialog(actor);
    
    // 2. GM enters 15 IP
    dialog.find('[name="insanity"]').val(15);
    dialog.find('[name="reason"]').val('Daemon sighting');
    
    // 3. Submit dialog
    await dialog.submit();
    
    // 4. Verify IP added
    expect(actor.system.insanity).toBe(15);
    
    // 5. Verify insanity test dialog appears
    const testDialog = document.querySelector('.insanity-test-dialog');
    expect(testDialog).toBeTruthy();
    
    // 6. Player clicks "Roll Test Now"
    await testDialog.querySelector('[data-action="roll"]').click();
    
    // 7. Roll fails (mock roll result)
    mockRoll(75);
    
    // 8. Battle trauma dialog appears
    const traumaDialog = document.querySelector('.battle-trauma-dialog');
    expect(traumaDialog).toBeTruthy();
    
    // 9. Verify trauma added to character
    const traumas = actor.items.filter(i => i.type === 'battle-trauma');
    expect(traumas.length).toBeGreaterThan(0);
  });
});
```

---

## Performance Tests

### `tests/performance/sheet-render.test.mjs`

**Coverage**: Sheet render performance with insanity/corruption

```javascript
describe('Character Sheet Performance', () => {
  test('renders with insanity/corruption in < 50ms', async () => {
    const actor = createTestActor('character', {
      insanity: 75,
      corruption: 60,
      insanityHistory: generateMockHistory(50),
      corruptionHistory: generateMockHistory(50)
    });
    
    const start = performance.now();
    
    const sheet = new DeathwatchActorSheet(actor);
    await sheet.render(true);
    
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(50);
  });
  
  test('lazy loads history logs (not on initial render)', async () => {
    const actor = createTestActor('character', {
      insanityHistory: generateMockHistory(100)
    });
    
    const sheet = new DeathwatchActorSheet(actor);
    const sheetData = await sheet.getData();
    
    // History not included in initial render
    expect(sheetData.insanityHistory).toBeUndefined();
    
    // History loaded on demand
    const historyButton = sheet.element.find('[data-action="view-history"]');
    await historyButton.click();
    
    // Now history is loaded
    const historyDialog = document.querySelector('.history-dialog');
    expect(historyDialog).toBeTruthy();
  });
});
```

---

## Regression Tests

### `tests/regression/existing-systems.test.mjs`

**Coverage**: Ensure no breaking changes

```javascript
describe('Regression Tests', () => {
  test('all existing tests still pass', async () => {
    // Run full test suite
    const result = await runTests('tests/**/*.test.mjs');
    expect(result.failedTests).toHaveLength(0);
  });
  
  test('character sheet renders without insanity/corruption data', async () => {
    // Old character without new fields
    const actor = createTestActor('character', {
      // No insanity/corruption fields
    });
    
    const sheet = new DeathwatchActorSheet(actor);
    await expect(sheet.render(true)).resolves.not.toThrow();
  });
  
  test('existing combat mechanics unaffected', async () => {
    const attacker = createTestActor('character');
    const target = createTestActor('enemy');
    
    const result = await RangedCombat.performAttack(attacker, target, weapon);
    
    expect(result.hit).toBeDefined();
    expect(result.damage).toBeDefined();
  });
  
  test('existing psychic power system unaffected', async () => {
    const psyker = createTestActor('character', {
      characteristics: { wp: { value: 60 } },
      psyRating: 5
    });
    
    const result = await PsychicCombat.focusPowerTest(psyker, power, 'unfettered');
    
    expect(result.success).toBeDefined();
    expect(result.effectivePR).toBe(5);
  });
});
```

---

## Test Data Fixtures

### `tests/fixtures/battle-traumas.json`

```json
[
  {
    "_id": "trauma1",
    "name": "Battle Rage",
    "type": "battle-trauma",
    "system": {
      "key": "battle-rage",
      "triggerType": "righteousFury",
      "effectType": "behavior",
      "canResist": true,
      "resistDifficulty": "challenging"
    }
  },
  {
    "_id": "trauma2",
    "name": "Ear of the Emperor",
    "type": "battle-trauma",
    "system": {
      "key": "ear-of-emperor",
      "triggerType": "always",
      "effectType": "modifier",
      "modifier": -10,
      "modifierTarget": "awareness"
    }
  }
]
```

### `tests/fixtures/battle-trauma-roll-table.json`

```json
{
  "_id": "BattleTraumaTable001",
  "name": "Battle Trauma Table",
  "formula": "1d10",
  "replacement": true,
  "displayRoll": true,
  "results": [
    {
      "_id": "result001",
      "type": 2,
      "text": "Battle Rage",
      "documentCollection": "deathwatch.battle-traumas",
      "documentId": "trauma1",
      "weight": 2,
      "range": [1, 2]
    },
    {
      "_id": "result002",
      "type": 2,
      "text": "Ear of the Emperor",
      "documentCollection": "deathwatch.battle-traumas",
      "documentId": "trauma2",
      "weight": 2,
      "range": [3, 4]
    }
  ]
}
```

### `tests/fixtures/chapters-with-curses.json`

```json
[
  {
    "_id": "chapter1",
    "name": "Black Templars",
    "type": "chapter",
    "system": {
      "key": "black-templars",
      "curseName": "Burn the Witch",
      "curseDescription": "Black Templars are filled with righteous hatred for psykers...",
      "curseLevel1Name": "Fear the Witch",
      "curseLevel1Effect": "modifier",
      "curseLevel1Modifier": -20,
      "curseLevel1Target": "fellowship",
      "curseLevel2Name": "Hate the Witch",
      "curseLevel2Effect": "cohesionPenalty",
      "curseLevel2CohesionPenalty": 1,
      "curseLevel3Name": "Kill the Witch",
      "curseLevel3Effect": "behavioralRequirement"
    }
  }
]
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Insanity & Corruption System

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --testPathPattern="insanity|corruption"
      
      - name: Run integration tests
        run: npm test -- --testPathPattern="integration"
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Manual Testing Checklist

### Functionality

- [ ] Add corruption points via dialog
- [ ] Add insanity points via dialog
- [ ] View corruption history log
- [ ] View insanity history log
- [ ] Trigger insanity test at 10 IP
- [ ] Roll insanity test (success)
- [ ] Roll insanity test (failure)
- [ ] Gain battle trauma from failed test
- [ ] Battle trauma prevents duplicates (rerolls)
- [ ] Primarch's Curse activates at level 1 (31 IP)
- [ ] Primarch's Curse activates at level 2 (61 IP)
- [ ] Primarch's Curse activates at level 3 (91 IP)
- [ ] Character removal at 100 CP
- [ ] Character removal at 100 IP
- [ ] Battle Trauma modifiers apply to rolls
- [ ] Primarch's Curse modifiers apply to rolls
- [ ] Cohesion reduced by Primarch's Curse level 2+
- [ ] Fellowship penalty at high corruption (70+ CP)

### UI

- [ ] Corruption display shows correct CP/100
- [ ] Insanity display shows correct IP/100
- [ ] Progress bars update correctly
- [ ] Track level indicator updates
- [ ] Curse level indicator updates
- [ ] Battle traumas list displays
- [ ] Primarch's Curse display shows active level
- [ ] History dialogs open and display data
- [ ] Manual adjustment dialog works
- [ ] Insanity test dialog appears at correct time
- [ ] Chat messages post correctly
- [ ] Token status effects apply

### Edge Cases

- [ ] 0 CP/IP displays correctly
- [ ] 100+ CP/IP triggers removal
- [ ] Gaining CP/IP while already at 100+
- [ ] Removing CP/IP manually (negative adjustment)
- [ ] Character with no chapter (no curse)
- [ ] Character with all 5 battle traumas (max)
- [ ] Crossing multiple 10-point boundaries at once
- [ ] Insanity test with very high modifier (-30)

### Performance

- [ ] Sheet renders in < 50ms with 100+ history entries
- [ ] History dialog opens in < 200ms
- [ ] No lag when adding CP/IP
- [ ] No lag when rolling insanity tests
