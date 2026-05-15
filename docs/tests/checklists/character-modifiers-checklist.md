# Character Modifiers Checklist

**Purpose:** Validate character modifier system, stacking, and display

**Test Type:** Quick validation

**Duration:** 12-15 minutes

**Prerequisites:** Test world with character, various items/talents

---

## Talent Modifiers

### Characteristic Bonus from Talent
**Setup:** Equip talent granting characteristic bonus (e.g., "Iron Discipline" +10 WP)  
**Test:** Check characteristic value  
**Expected:** Bonus applies to characteristic

☐ Open character sheet → Effects tab → Modifiers section  
☐ Talent modifier listed (e.g., "Iron Discipline: +10 WP")  
☐ Open Characteristics tab  
☐ WP value shows bonus: Base WP + 10  
☐ WP Bonus recalculated if needed  

---

### Skill Bonus from Talent
**Setup:** Equip talent granting skill bonus (e.g., "Heightened Senses" +10 Awareness)  
**Test:** Check skill value  
**Expected:** Bonus applies to skill

☐ Talent modifier listed in Modifiers section  
☐ Open Skills tab  
☐ Awareness shows: Base characteristic + advances + talent modifier  
☐ Hover over skill to see breakdown  

---

## Cybernetic Modifiers

### Always-Active Cybernetic
**Setup:** Equip cybernetic with characteristic modifier (e.g., "Bionic Leg" +5 AG)  
**Test:** Check characteristic  
**Expected:** Cybernetic modifier always active

☐ Drag cybernetic from compendium to character sheet  
☐ Cybernetic appears in Equipment → Cybernetics section  
☐ Modifier listed in Effects tab → Modifiers  
☐ AG value increases by +5  
☐ Modifier labeled with cybernetic name  

---

### Conditional Cybernetic
**Setup:** Cybernetic with conditional bonus (e.g., "Bionic Arm" +10 STR for lifting)  
**Test:** Check if conditional applies  
**Expected:** Modifier applies only in specific context

☐ Cybernetic equipped  
☐ Modifier listed with condition note  
☐ STR shows bonus when appropriate (e.g., during STR test for lifting)  
☐ No bonus applied to combat damage (if conditional)  

---

## Equipment Modifiers

### Armor Bonus
**Setup:** Equip armor with AP bonus (e.g., Power Armor grants 8 AP all locations)  
**Test:** Check armor values  
**Expected:** Armor applies to all hit locations

☐ Drag Power Armor to character sheet  
☐ Open Combat tab → Armor section  
☐ All locations show armor value: 8 AP (or 0 base + 8 armor)  
☐ Modifiers section lists: "Power Armor: +8 AP (All Locations)"  

---

### Weapon Upgrade Modifiers
**Setup:** Attach weapon upgrade to weapon (e.g., "Red Dot Sight" +10 BS)  
**Test:** Make attack with weapon  
**Expected:** Upgrade modifier applies to attack

☐ Open weapon item sheet  
☐ Drag upgrade to weapon (or select from upgrades section)  
☐ Upgrade listed on weapon  
☐ Make attack with weapon  
☐ Attack dialog shows: BS + 10 (Red Dot Sight)  
☐ Chat breakdown includes upgrade modifier  

---

## Modifier Stacking

### Multiple Sources Same Characteristic
**Setup:** Equip 2+ items granting bonuses to same characteristic (e.g., 2 talents with +5 STR each)  
**Test:** Check if modifiers stack  
**Expected:** Modifiers stack additively (per system rules)

☐ Equip "Talent A" (+5 STR)  
☐ Equip "Talent B" (+5 STR)  
☐ Open Characteristics tab  
☐ STR value shows: Base + 5 + 5 = +10 total  
☐ Modifiers section lists both sources  

---

### Typed vs. Untyped Modifiers
**Setup:** Mix typed modifiers (e.g., "Enhancement" vs "Natural")  
**Test:** Check stacking rules  
**Expected:** Depends on system rules (may or may not stack)

☐ Equip items with different modifier types  
☐ Check if system prevents stacking same-typed modifiers  
☐ Untyped modifiers typically stack  
☐ Typed modifiers may take highest only (check system-specific rules)  

---

## Modifier Display

### Effects Tab Display
**Setup:** Character with multiple modifiers  
**Test:** Open Effects tab  
**Expected:** All modifiers listed with sources

☐ Open character sheet → Effects tab  
☐ Modifiers section shows all active modifiers  
☐ Each modifier lists:  
  - Source (talent/item name)  
  - Effect type (characteristic, skill, armor, etc.)  
  - Value (e.g., +10)  
  - Target (e.g., "BS", "Awareness")  
☐ Modifiers can be toggled enabled/disabled if applicable  

---

## Unnatural Characteristic

### Unnatural Multiplier
**Setup:** Character with Unnatural Characteristic trait (e.g., "Unnatural Strength ×2")  
**Test:** Check characteristic bonus calculation  
**Expected:** Bonus is multiplied, not characteristic value

☐ Character has STR 40, Unnatural Strength ×2  
☐ Base STR Bonus: 4 (from 40)  
☐ **Effective STR Bonus: 4 ×2 = 8**  
☐ STR value remains 40 (not multiplied)  
☐ Bonus used for damage, tests, etc.: 8  
☐ Characteristic tab shows: "STR: 40 (Bonus: 8, Unnatural ×2)"  

---

## Movement Modifiers

### Movement Speed Adjustment
**Setup:** Equip item granting movement modifier (e.g., "Jump Pack" +2 to Charge)  
**Test:** Check movement values  
**Expected:** Movement distances updated

☐ Open Combat tab → Movement section  
☐ Half Move: Base value (AG Bonus)  
☐ Full Move: Base value ×2  
☐ Charge Move: Base value ×3 + modifier  
☐ Run Move: Base value ×6  
☐ With Jump Pack: Charge shows increased value  

---

### Movement Restriction
**Setup:** Apply status effect limiting movement (e.g., "Immobilized" sets max to Half)  
**Test:** Check movement restriction  
**Expected:** Cannot exceed restricted movement type

☐ Apply "Immobilized" condition (or similar)  
☐ Movement section shows restriction: "Max: Half Action Move"  
☐ Attempting Full/Charge/Run move blocked or warned  
☐ Chat message: "Movement restricted to Half Action"  

---

## Validation Summary

☐ Talent modifiers apply to characteristics and skills  
☐ Cybernetic modifiers always active (or conditional as specified)  
☐ Armor modifiers apply correct AP to locations  
☐ Weapon upgrade modifiers apply to attacks  
☐ Multiple modifiers stack additively (unless typed)  
☐ Effects tab displays all active modifiers with sources  
☐ Unnatural Characteristic multiplies bonus, not characteristic value  
☐ Movement modifiers adjust move distances  
☐ Movement restrictions limit max movement type  

---

_Character modifier protocols verified, Tech-Priest. The Marine's enhancements are blessed._ ⚙️
