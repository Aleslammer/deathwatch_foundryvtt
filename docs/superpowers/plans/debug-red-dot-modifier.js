/**
 * Red Dot Laser Sight Modifier Debug Script
 *
 * Run this in Foundry's console (F12) to check if the Red Dot Sight
 * has the correct modifier structure with singleShotOnly flag.
 *
 * Instructions:
 * 1. Open Foundry VTT
 * 2. Press F12 to open console
 * 3. Copy/paste this entire script
 * 4. Press Enter
 */

(async function debugRedDotSight() {
  console.log("=== Red Dot Laser Sight Modifier Debug ===");

  // Find the Red Dot Sight in the compendium
  const pack = game.packs.get("deathwatch.weapon-upgrades");
  if (!pack) {
    console.error("❌ weapon-upgrades pack not found!");
    return;
  }

  const index = pack.index.find(i => i.name === "Red-Dot Laser Sight");
  if (!index) {
    console.error("❌ Red-Dot Laser Sight not found in pack index!");
    return;
  }

  const redDotSight = await pack.getDocument(index._id);
  console.log("✅ Found Red-Dot Laser Sight:", redDotSight.name);

  // Check the modifier structure
  console.log("\n--- System Data ---");
  console.log("singleShotOnly at upgrade level:", redDotSight.system.singleShotOnly);
  console.log("modifiers array:", redDotSight.system.modifiers);

  if (!redDotSight.system.modifiers || redDotSight.system.modifiers.length === 0) {
    console.error("❌ No modifiers found!");
    return;
  }

  const modifier = redDotSight.system.modifiers[0];
  console.log("\n--- First Modifier ---");
  console.log("name:", modifier.name);
  console.log("modifier:", modifier.modifier);
  console.log("effectType:", modifier.effectType);
  console.log("valueAffected:", modifier.valueAffected);
  console.log("enabled:", modifier.enabled);
  console.log("singleShotOnly:", modifier.singleShotOnly);

  if (modifier.singleShotOnly === true) {
    console.log("\n✅ CORRECT: singleShotOnly flag is on the modifier object");
  } else if (modifier.singleShotOnly === undefined && redDotSight.system.singleShotOnly === true) {
    console.log("\n❌ INCORRECT: singleShotOnly flag is only at upgrade level, not on modifier");
    console.log("   You need to rebuild and redeploy the packs!");
    console.log("   Run: npm run build:packs && npm run build:copy");
  } else {
    console.log("\n❌ UNEXPECTED: singleShotOnly not found anywhere");
  }

  // Test the collector with a mock weapon/actor
  console.log("\n--- Testing WeaponModifierCollector ---");

  const mockWeapon = {
    name: "Test Boltgun",
    system: {
      modifiers: [],
      attachedUpgrades: ["test-upgrade-id"],
      loadedAmmo: null
    }
  };

  const mockActor = {
    items: new Map([
      ["test-upgrade-id", redDotSight]
    ])
  };

  // Import the collector (if available in global scope)
  if (typeof game.deathwatch?.WeaponModifierCollector !== 'undefined') {
    const collector = game.deathwatch.WeaponModifierCollector;

    // Test single shot
    const singleShotMods = collector.collectWeaponModifiers(mockWeapon, mockActor, { isSingleShot: true, isAutoFire: false });
    console.log("Single shot context - characteristic modifiers:", singleShotMods.characteristic);
    console.log("Expected: 1 modifier, Actual:", singleShotMods.characteristic.length);

    // Test auto fire
    const autoFireMods = collector.collectWeaponModifiers(mockWeapon, mockActor, { isSingleShot: false, isAutoFire: true });
    console.log("Auto fire context - characteristic modifiers:", autoFireMods.characteristic);
    console.log("Expected: 0 modifiers, Actual:", autoFireMods.characteristic.length);
  } else {
    console.log("⚠️  WeaponModifierCollector not available in global scope, skipping live test");
  }

  console.log("\n=== Debug Complete ===");
})();
