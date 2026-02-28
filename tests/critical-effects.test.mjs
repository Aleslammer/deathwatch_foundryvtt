import { jest } from '@jest/globals';
import './setup.mjs';
import { CriticalEffectsHelper } from '../src/module/helpers/critical-effects.mjs';

describe('CriticalEffectsHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.game.packs.clear();
  });

  describe('LOCATION_MAP', () => {
    it('maps locations correctly', () => {
      expect(CriticalEffectsHelper.LOCATION_MAP['Head']).toBe('head');
      expect(CriticalEffectsHelper.LOCATION_MAP['Body']).toBe('body');
      expect(CriticalEffectsHelper.LOCATION_MAP['Right Arm']).toBe('arm');
      expect(CriticalEffectsHelper.LOCATION_MAP['Left Arm']).toBe('arm');
      expect(CriticalEffectsHelper.LOCATION_MAP['Right Leg']).toBe('leg');
      expect(CriticalEffectsHelper.LOCATION_MAP['Left Leg']).toBe('leg');
    });
  });

  describe('applyCriticalEffect', () => {
    let mockActor, mockPack;

    beforeEach(() => {
      mockActor = {
        name: 'Test Marine',
        system: {
          wounds: { value: 15, max: 20 }
        },
        items: {
          filter: jest.fn(() => [])
        }
      };

      mockPack = {
        getIndex: jest.fn(),
        getDocument: jest.fn()
      };

      global.game.packs.set('deathwatch.critical-effects', mockPack);
    });

    it('warns if compendium not found', async () => {
      global.game.packs.clear();
      await CriticalEffectsHelper.applyCriticalEffect(mockActor, 'Head', 'Energy');
      expect(global.ui.notifications.warn).toHaveBeenCalledWith('Critical effects compendium not found!');
    });

    it('warns if no critical damage', async () => {
      mockActor.system.wounds.value = 10;
      await CriticalEffectsHelper.applyCriticalEffect(mockActor, 'Head', 'Energy');
      expect(global.ui.notifications.warn).toHaveBeenCalledWith('No critical damage to apply!');
    });

    it('calculates effect level correctly', async () => {
      mockActor.system.wounds.value = 25;
      mockPack.getIndex.mockResolvedValue([
        { _id: 'energy-head0005', name: 'Critical Effect' }
      ]);
      mockPack.getDocument.mockResolvedValue({
        _id: 'energy-head0005',
        system: { description: 'Test effect' },
        toObject: () => ({ _id: 'energy-head0005' })
      });

      await CriticalEffectsHelper.applyCriticalEffect(mockActor, 'Head', 'Energy');
      
      expect(global.ui.notifications.info).toHaveBeenCalledWith('Critical effect Level 5 added to Test Marine');
    });

    it('warns if effect already exists', async () => {
      mockActor.system.wounds.value = 25;
      mockActor.items.filter.mockReturnValue([
        { 
          type: 'critical-effect',
          _id: 'energy-head0005',
          flags: { core: { sourceId: 'deathwatch.critical-effects.energy-head0005' } }
        }
      ]);

      mockPack.getIndex.mockResolvedValue([
        { _id: 'energy-head0005' }
      ]);

      await CriticalEffectsHelper.applyCriticalEffect(mockActor, 'Head', 'Energy');
      expect(global.ui.notifications.warn).toHaveBeenCalledWith('Test Marine already has this critical effect!');
    });

    it('creates critical effect and chat message', async () => {
      mockActor.system.wounds.value = 25;
      mockPack.getIndex.mockResolvedValue([
        { _id: 'energy-head0005' }
      ]);
      mockPack.getDocument.mockResolvedValue({
        _id: 'energy-head0005',
        system: { description: 'Severe head trauma' },
        toObject: () => ({ _id: 'energy-head0005', system: { description: 'Severe head trauma' } })
      });

      await CriticalEffectsHelper.applyCriticalEffect(mockActor, 'Head', 'Energy');

      expect(global.Item.createDocuments).toHaveBeenCalledWith(
        [{ _id: 'energy-head0005', system: { description: 'Severe head trauma' } }],
        { parent: mockActor }
      );
      expect(global.ui.notifications.info).toHaveBeenCalledWith('Critical effect Level 5 added to Test Marine');
      expect(global.ChatMessage.create).toHaveBeenCalled();
    });

    it('handles "as above" descriptions', async () => {
      mockActor.system.wounds.value = 22;
      mockPack.getIndex.mockResolvedValue([
        { _id: 'energy-head0002' },
        { _id: 'energy-head0001' }
      ]);
      
      mockPack.getDocument.mockImplementation((id) => {
        if (id === 'energy-head0002') {
          return Promise.resolve({
            _id: 'energy-head0002',
            system: { description: 'As above, plus more damage' },
            toObject: () => ({ _id: 'energy-head0002' })
          });
        }
        return Promise.resolve({
          _id: 'energy-head0001',
          system: { description: 'Previous level effect' },
          toObject: () => ({ _id: 'energy-head0001' })
        });
      });

      await CriticalEffectsHelper.applyCriticalEffect(mockActor, 'Head', 'Energy');

      expect(mockPack.getDocument).toHaveBeenCalledWith('energy-head0001');
      expect(global.Item.createDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ _id: 'energy-head0001' }),
          expect.objectContaining({ _id: 'energy-head0002' })
        ]),
        { parent: mockActor }
      );
    });

    it('caps effect level at 10', async () => {
      mockActor.system.wounds.value = 120;
      mockPack.getIndex.mockResolvedValue([
        { _id: 'energy-head0010' }
      ]);
      mockPack.getDocument.mockResolvedValue({
        _id: 'energy-head0010',
        system: { description: 'Maximum damage' },
        toObject: () => ({ _id: 'energy-head0010' })
      });

      await CriticalEffectsHelper.applyCriticalEffect(mockActor, 'Head', 'Energy');

      expect(global.ui.notifications.info).toHaveBeenCalledWith('Critical effect Level 10 added to Test Marine');
    });

    it('warns if critical effect not found for level', async () => {
      mockActor.system.wounds.value = 25;
      mockPack.getIndex.mockResolvedValue([]);

      await CriticalEffectsHelper.applyCriticalEffect(mockActor, 'Head', 'Energy');

      expect(global.ui.notifications.warn).toHaveBeenCalledWith('Critical effect not found for level 5!');
    });
  });
});
