export const DW_STATUS_EFFECTS = [
  {
    id: "stunned",
    name: "Stunned",
    img: "icons/svg/daze.svg",
    description: "Cannot take actions. Drops everything held. -4 to Agility."
  },
  {
    id: "prone",
    name: "Prone",
    img: "icons/svg/falling.svg",
    description: "Lying on the ground. -20 to WS tests. +20 to be hit by ranged attacks."
  },
  {
    id: "grappled",
    name: "Grappled",
    img: "icons/svg/net.svg",
    description: "Held by opponent. Cannot move. -20 to WS and BS tests."
  },
  {
    id: "pinned",
    name: "Pinned",
    img: "icons/svg/paralysis.svg",
    description: "Completely immobilized. Cannot take actions except to attempt to break free."
  },
  {
    id: "blinded",
    name: "Blinded",
    img: "icons/svg/blind.svg",
    description: "Cannot see. -30 to WS and BS tests. Automatically fails Awareness tests."
  },
  {
    id: "deafened",
    name: "Deafened",
    img: "icons/svg/deaf.svg",
    description: "Cannot hear. -20 to Awareness tests. May miss verbal commands."
  },
  {
    id: "unconscious",
    name: "Unconscious",
    img: "icons/svg/unconscious.svg",
    description: "Helpless and unaware. Cannot take actions. Automatically hit in melee."
  },
  {
    id: "dead",
    name: "Dead",
    img: "icons/svg/skull.svg",
    description: "Character has died. May only be restored through extraordinary means."
  }
];
