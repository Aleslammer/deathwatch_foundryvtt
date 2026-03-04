export const DW_STATUS_EFFECTS = [
  {
    id: "stunned",
    name: "Stunned",
    img: "icons/svg/daze.svg",
    description: "Cannot take Actions or Reactions. +20 to be hit. Not helpless or unaware."
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
    description: "Auto-fail vision and BS tests. -30 to WS tests. -30 to tests relying on sight."
  },
  {
    id: "deafened",
    name: "Deafened",
    img: "icons/svg/deaf.svg",
    description: "Auto-fail hearing tests. Difficulty communicating."
  },
  {
    id: "unconscious",
    name: "Unconscious",
    img: "icons/svg/unconscious.svg",
    description: "Completely unaware. Cannot take actions. Treated as helpless target."
  },
  {
    id: "dead",
    name: "Dead",
    img: "icons/svg/skull.svg",
    description: "Character has died. May only be restored through extraordinary means."
  },
  {
    id: "blood-loss",
    name: "Blood Loss",
    img: "icons/svg/blood.svg",
    description: "10% chance of death each Round. Requires Difficult (-10) Medicae test to staunch."
  },
  {
    id: "on-fire",
    name: "On Fire",
    img: "icons/svg/fire.svg",
    description: "1d10 Energy Damage and 1 Fatigue per Round. Challenging (+0) WP or run/scream only."
  },
  {
    id: "suffocating",
    name: "Suffocating",
    img: "icons/svg/poison.svg",
    description: "Challenging (+0) TG test each Round or gain 1 Fatigue. 1d10 Damage/Round if unconscious."
  },
  {
    id: "vacuum",
    name: "Vacuum Exposure",
    img: "icons/svg/hazard.svg",
    description: "1d10+3 Explosive Damage/Round from depressurization. 1d10 Energy from cold."
  },
  {
    id: "lost-hand",
    name: "Lost Hand",
    img: "icons/svg/bones.svg",
    description: "-20 to tests using two hands. Cannot wield two-handed weapons. Shield can be strapped."
  },
  {
    id: "lost-arm",
    name: "Lost Arm",
    img: "icons/svg/bones.svg",
    description: "As Lost Hand, but cannot strap shield. Requires replacement or new character."
  },
  {
    id: "lost-eye",
    name: "Lost Eye",
    img: "icons/svg/eye.svg",
    description: "-10 BS permanently. -20 to sight-based tests. Losing both eyes causes Blinded."
  },
  {
    id: "lost-foot",
    name: "Lost Foot",
    img: "icons/svg/bones.svg",
    description: "Movement halved. -20 to movement Actions and mobility tests."
  },
  {
    id: "lost-leg",
    name: "Lost Leg",
    img: "icons/svg/bones.svg",
    description: "As Lost Foot, but cannot use Dodge Skill."
  },
  {
    id: "useless-limb",
    name: "Useless Limb",
    img: "icons/svg/paralysis.svg",
    description: "Limb in sling for 1d5+1 weeks. Risk of amputation if Challenging (+0) TG test fails."
  }
];
