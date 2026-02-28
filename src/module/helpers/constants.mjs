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
  SKILL: 'skill',
  CHARACTERISTIC_BONUS: 'characteristic-bonus',
  INITIATIVE: 'initiative'
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

// Range Modifiers
export const RANGE_MODIFIERS = {
  POINT_BLANK: 20,  // <= 2m
  SHORT: 10,         // < half weapon range
  NORMAL: 0,         // half to 2x weapon range
  LONG: -10,         // 2x to 3x weapon range
  EXTREME: -20       // >= 3x weapon range
};

// XP Constants
export const XP_CONSTANTS = {
  STARTING_XP: 13000,
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
