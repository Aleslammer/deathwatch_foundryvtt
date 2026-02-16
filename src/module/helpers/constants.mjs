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
  CHARACTERISTIC_BONUS: 'characteristic-bonus'
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
