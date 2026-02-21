export const DEBUG_FLAGS = {
  COMBAT: false,
  MODIFIERS: true,
  SHEETS: false
};

export function debug(context, ...args) {
  if (DEBUG_FLAGS[context]) {
    console.log(`[Deathwatch:${context}]`, ...args);
  }
}
