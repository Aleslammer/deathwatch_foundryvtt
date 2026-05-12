/**
 * Deathwatch Ranged Weapon Animation
 *
 * Called by Automated Animations module to generate weapon-specific animations.
 *
 * Requirements:
 * - Sequencer module
 * - JB2A Free module (or Patreon)
 * - Automated Animations module
 *
 * Configuration in A-A:
 * - Global Recognition → Range → Name: * → Macro: "Deathwatch Ranged Weapon Animation"
 * - Set to "Macro with No Animation"
 */

// Validate required modules
if (!game.modules.get('sequencer')?.active) {
  console.warn('[Deathwatch A-A] Sequencer module not active');
  return;
}

if (!game.modules.get('jb2a_patreon')?.active && !game.modules.get('JB2A_DnD5e')?.active) {
  console.warn('[Deathwatch A-A] JB2A module not active');
  return;
}

// Extract A-A data from args[1]
const aaData = args[1];

if (!aaData) {
  console.warn('[Deathwatch A-A] No A-A data provided');
  return;
}

const sourceToken = aaData.sourceToken;
const allTargets = aaData.allTargets || [];
const item = aaData.item;

if (!sourceToken) {
  console.warn('[Deathwatch A-A] Missing sourceToken');
  return;
}

if (allTargets.length === 0) {
  console.log('[Deathwatch A-A] No targets, skipping animation');
  return;
}

if (!item) {
  console.warn('[Deathwatch A-A] Missing item');
  return;
}

// Get animation metadata from chat message (if available)
const workflow = args[0];
let roundsFired = 1;
let animationKey = '';

if (workflow?.content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(workflow.content, 'text/html');
  const attackDiv = doc.querySelector('.dw-attack-roll');
  
  if (attackDiv) {
    roundsFired = parseInt(attackDiv.dataset.roundsFired) || 1;
    animationKey = attackDiv.dataset.animationKey || '';
  }
}

// Classify weapon type (3-tier hierarchy)
const weaponType = classifyWeapon(item, animationKey);

// Get animation configuration
const animConfig = getAnimationConfig(weaponType);

// Play animation for first target
const targetToken = allTargets[0];
await playWeaponAnimation(sourceToken, targetToken, animConfig, roundsFired);

console.log(`[Deathwatch A-A] Played ${weaponType} animation (${roundsFired} rounds)`);

/**
 * Classify weapon type using 3-tier hierarchy.
 */
function classifyWeapon(item, animationKey) {
  // Priority 1: Explicit animationKey parameter
  if (animationKey && animationKey.trim() !== '') {
    return animationKey.toLowerCase();
  }

  // Priority 2: Name pattern matching
  const name = item.name.toLowerCase();
  
  if (name.includes('bolter') || name.includes('bolt pistol') || name.includes('bolt gun')) {
    return 'bolt';
  }
  
  if (name.includes('las') || name.includes('hellgun')) {
    return 'las';
  }
  
  if (name.includes('plasma')) {
    return 'plasma';
  }
  
  if (name.includes('melta') || name.includes('meltagun') || name.includes('multi-melta')) {
    return 'melta';
  }
  
  if (name.includes('flamer') || name.includes('heavy flamer')) {
    return 'flame';
  }

  // Priority 3: Damage type fallback
  const damageType = item.system?.dmgType?.toLowerCase() || '';
  
  if (damageType === 'explosive') {
    return 'bolt';
  }
  
  if (damageType === 'energy') {
    return 'las';
  }

  // Ultimate fallback
  return 'generic';
}

/**
 * Get animation configuration for weapon type.
 */
function getAnimationConfig(weaponType) {
  const configs = {
    bolt: { 
      file: 'jb2a.bullet.02.orange', 
      delay: 150
    },
    las: { 
      file: 'jb2a.lasershot.blue', 
      delay: 100
    },
    plasma: { 
      file: 'jb2a.energy_beam.normal.blue', 
      delay: 200
    },
    melta: { 
      file: 'jb2a.ray_of_frost.blue', 
      delay: 250
    },
    flame: { 
      file: 'jb2a.breath_weapons.fire.line.orange', 
      delay: 0
    },
    generic: { 
      file: 'jb2a.bullet.01.orange', 
      delay: 150
    }
  };

  return configs[weaponType] || configs.generic;
}

/**
 * Play weapon animation using Sequencer.
 */
async function playWeaponAnimation(sourceToken, targetToken, config, rounds) {
  try {
    new Sequence()
      .effect()
        .file(config.file)
        .atLocation(sourceToken)
        .stretchTo(targetToken)
        .repeats(rounds, config.delay)
      .play();
  } catch (error) {
    console.error('[Deathwatch A-A] Animation playback error:', error);
  }
}

