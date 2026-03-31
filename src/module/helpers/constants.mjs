// Characteristic Keys
export const CHARACTERISTICS = {
  WS: 'ws',
  BS: 'bs',
  STR: 'str',
  TG: 'tg',
  AG: 'ag',
  INT: 'int',
  PER: 'per',
  WIL: 'wil',
  FS: 'fs'
};

// Characteristic Labels
export const CHARACTERISTIC_LABELS = {
  [CHARACTERISTICS.WS]: 'Weapon Skill',
  [CHARACTERISTICS.BS]: 'Ballistic Skill',
  [CHARACTERISTICS.STR]: 'Strength',
  [CHARACTERISTICS.TG]: 'Toughness',
  [CHARACTERISTICS.AG]: 'Agility',
  [CHARACTERISTICS.INT]: 'Intelligence',
  [CHARACTERISTICS.PER]: 'Perception',
  [CHARACTERISTICS.WIL]: 'Willpower',
  [CHARACTERISTICS.FS]: 'Fellowship'
};

// Modifier Types
export const MODIFIER_TYPES = {
  UNTYPED: 'untyped',
  CIRCUMSTANCE: 'circumstance',
  EQUIPMENT: 'equipment',
  TRAIT: 'trait'
};

// Effect Types
export const EFFECT_TYPES = {
  CHARACTERISTIC: 'characteristic',
  CHARACTERISTIC_POST_MULTIPLIER: 'characteristic-post-multiplier',
  SKILL: 'skill',
  CHARACTERISTIC_BONUS: 'characteristic-bonus',
  INITIATIVE: 'initiative',
  WOUNDS: 'wounds',
  ARMOR: 'armor',
  PSY_RATING: 'psy-rating',
  MOVEMENT: 'movement',
  MOVEMENT_MULTIPLIER: 'movement-multiplier',
  MOVEMENT_RESTRICTION: 'movement-restriction',
  WEAPON_DAMAGE: 'weapon-damage',
  WEAPON_RANGE: 'weapon-range',
  WEAPON_WEIGHT: 'weapon-weight',
  WEAPON_ROF: 'weapon-rof',
  WEAPON_BLAST: 'weapon-blast',
  WEAPON_FELLING: 'weapon-felling',
  WEAPON_PENETRATION: 'weapon-penetration',
  WEAPON_PENETRATION_MODIFIER: 'weapon-penetration-modifier',
  RIGHTEOUS_FURY_THRESHOLD: 'righteous-fury-threshold',
  CHARACTERISTIC_DAMAGE: 'characteristic-damage',
  MAGNITUDE_BONUS_DAMAGE: 'magnitude-bonus-damage',
  PREMATURE_DETONATION: 'premature-detonation',
  IGNORES_NATURAL_ARMOUR: 'ignores-natural-armour',
  PSYCHIC_TEST: 'psychic-test',
  NO_PERILS: 'no-perils'
};

// Effect type labels for UI display
export const EFFECT_TYPE_LABELS = {
  [EFFECT_TYPES.CHARACTERISTIC]: 'Characteristic',
  [EFFECT_TYPES.CHARACTERISTIC_POST_MULTIPLIER]: 'Characteristic (Post-Multiplier)',
  [EFFECT_TYPES.SKILL]: 'Skill',
  [EFFECT_TYPES.CHARACTERISTIC_BONUS]: 'Characteristic Bonus',
  [EFFECT_TYPES.INITIATIVE]: 'Initiative',
  [EFFECT_TYPES.WOUNDS]: 'Wounds',
  [EFFECT_TYPES.ARMOR]: 'Armor',
  [EFFECT_TYPES.PSY_RATING]: 'Psy Rating',
  [EFFECT_TYPES.MOVEMENT]: 'Movement',
  [EFFECT_TYPES.MOVEMENT_MULTIPLIER]: 'Movement Multiplier',
  [EFFECT_TYPES.MOVEMENT_RESTRICTION]: 'Movement Restriction',
  [EFFECT_TYPES.WEAPON_DAMAGE]: 'Weapon Damage',
  [EFFECT_TYPES.WEAPON_RANGE]: 'Weapon Range',
  [EFFECT_TYPES.WEAPON_WEIGHT]: 'Weapon Weight',
  [EFFECT_TYPES.WEAPON_ROF]: 'Weapon Rate of Fire',
  [EFFECT_TYPES.WEAPON_BLAST]: 'Weapon Blast',
  [EFFECT_TYPES.WEAPON_FELLING]: 'Weapon Felling',
  [EFFECT_TYPES.WEAPON_PENETRATION]: 'Weapon Penetration',
  [EFFECT_TYPES.WEAPON_PENETRATION_MODIFIER]: 'Weapon Penetration Modifier',
  [EFFECT_TYPES.RIGHTEOUS_FURY_THRESHOLD]: 'Righteous Fury Threshold',
  [EFFECT_TYPES.CHARACTERISTIC_DAMAGE]: 'Characteristic Damage',
  [EFFECT_TYPES.MAGNITUDE_BONUS_DAMAGE]: 'Magnitude Bonus Damage',
  [EFFECT_TYPES.PREMATURE_DETONATION]: 'Premature Detonation',
  [EFFECT_TYPES.IGNORES_NATURAL_ARMOUR]: 'Ignores Natural Armour',
  [EFFECT_TYPES.PSYCHIC_TEST]: 'Psychic Test',
  [EFFECT_TYPES.NO_PERILS]: 'No Perils of the Warp'
};

// Combat Modifiers
export const AIM_MODIFIERS = {
  NONE: 0,
  HALF: 10,
  FULL: 20
};

export const RATE_OF_FIRE_MODIFIERS = {
  SINGLE: 0,
  SEMI_AUTO: 10,
  FULL_AUTO: 20
};

export const COMBAT_PENALTIES = {
  CALLED_SHOT: -20,
  RUNNING_TARGET: -20
};

export const MELEE_MODIFIERS = {
  ALL_OUT_ATTACK: 20,
  CHARGE: 10
};

// Hit Locations
export const HIT_LOCATIONS = [
  "Head", "Right Arm", "Left Arm", "Body", "Right Leg", "Left Leg"
];

// Range Modifiers
export const RANGE_MODIFIERS = {
  POINT_BLANK: 30,  // <= 2m
  SHORT: 10,         // < half weapon range
  NORMAL: 0,         // half to 2x weapon range
  LONG: -10,         // 2x to 3x weapon range
  EXTREME: -30       // >= 3x weapon range
};

// Size Hit Modifiers (applied to attacker when targeting creature of this size)
export const SIZE_HIT_MODIFIERS = {
  "Miniscule": -30,
  "Puny": -20,
  "Scrawny": -10,
  "Average": 0,
  "Hulking": 10,
  "Enormous": 20,
  "Massive": 30
};

// XP Constants
export const XP_CONSTANTS = {
  STARTING_XP: 12000,
  RANK_THRESHOLDS: [13000, 17000, 21000, 25000, 30000, 35000, 40000, 45000]
};

// Characteristic Constants
export const CHARACTERISTIC_CONSTANTS = {
  BONUS_DIVISOR: 10,
  MAX_VALUE: 100
};

// Roll Constants
export const ROLL_CONSTANTS = {
  D100_MAX: 100,
  D10_MAX: 10,
  DEGREES_DIVISOR: 10
};

// Enemy Classifications
export const ENEMY_CLASSIFICATIONS = {
  HUMAN: 'human',
  XENOS: 'xenos',
  CHAOS: 'chaos'
};

export const ENEMY_CLASSIFICATION_LABELS = {
  [ENEMY_CLASSIFICATIONS.HUMAN]: 'Human',
  [ENEMY_CLASSIFICATIONS.XENOS]: 'Xenos',
  [ENEMY_CLASSIFICATIONS.CHAOS]: 'Chaos'
};

// Psychic Power Levels
export const POWER_LEVELS = {
  FETTERED: 'fettered',
  UNFETTERED: 'unfettered',
  PUSH: 'push'
};

export const POWER_LEVEL_LABELS = {
  [POWER_LEVELS.FETTERED]: 'Fettered',
  [POWER_LEVELS.UNFETTERED]: 'Unfettered',
  [POWER_LEVELS.PUSH]: 'Push'
};
