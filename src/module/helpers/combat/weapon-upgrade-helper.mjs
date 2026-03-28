import { FoundryAdapter } from "../foundry-adapter.mjs";

export class WeaponUpgradeHelper {
  static async getUpgrades(weapon) {
    if (!weapon?.system?.attachedUpgrades) return [];
    
    const upgrades = [];
    for (const upgrade of weapon.system.attachedUpgrades) {
      const upgradeItem = weapon.parent?.items.get(upgrade.id);
      if (upgradeItem) {
        upgrades.push(upgradeItem);
      }
    }
    return upgrades;
  }

  static async hasUpgrade(weapon, upgradeKey) {
    const upgrades = await this.getUpgrades(weapon);
    return upgrades.some(u => u.system.key === upgradeKey);
  }

  static async getModifiers(weapon, isSingleShot = false, isAutoFire = false) {
    const upgrades = await this.getUpgrades(weapon);
    const modifiers = [];

    for (const upgrade of upgrades) {
      if (upgrade.system.singleShotOnly && !isSingleShot) continue;
      
      // Motion Predictor only works on semi-auto or full-auto
      if (upgrade.system.key === 'motion-predictor' && !isAutoFire) continue;
      
      if (upgrade.system.modifiers) {
        for (const mod of upgrade.system.modifiers) {
          modifiers.push({ ...mod, source: upgrade.name });
        }
      }
    }

    return modifiers;
  }
}
