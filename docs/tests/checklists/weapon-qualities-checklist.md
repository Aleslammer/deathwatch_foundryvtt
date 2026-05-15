# Weapon Qualities Checklist

**Purpose:** Validate representative weapon quality implementations

**Test Type:** Quick validation (goal-oriented)

**Duration:** 15-20 minutes

**Prerequisites:** Test world or any active session with test characters and enemies

---

## Common Qualities

### Tearing
**Setup:** Equip character with weapon that has Tearing quality (e.g., Astartes Bolter, Chainsword)  
**Test:** Make attack, roll damage  
**Expected:** Any damage dice showing 1-3 are rerolled once

☐ Damage dice showing 1, 2, or 3 trigger reroll  
☐ Reroll occurs automatically (or via prompt)  
☐ Chat message shows original roll + reroll results  
☐ Final damage uses rerolled values  

---

### Accurate
**Setup:** Equip weapon with Accurate(X) quality, make aimed shot with DoS ≥ Accurate rating  
**Test:** Attack enemy, achieve 2+ DoS, apply damage  
**Expected:** Damage increased by min(DoS, Accurate rating)

☐ Aimed shot grants +10 to BS  
☐ Attack achieves 3+ DoS  
☐ Damage bonus applied: +min(3 DoS, 2 Accurate) = +2 damage  
☐ Chat message shows Accurate bonus breakdown  

---

### Reliable
**Setup:** Equip weapon with Reliable quality  
**Test:** Roll attack that would normally jam (natural 96+), check jam threshold  
**Expected:** Jam threshold increased (less likely to jam)

☐ Reliable weapon jams only on 00 (double zero) instead of 96+  
☐ Roll 97: No jam, attack proceeds  
☐ Roll 00: Jam occurs, weapon requires clearing  

---

### Unreliable
**Setup:** Equip weapon with Unreliable quality  
**Test:** Roll attack, check jam threshold  
**Expected:** Jam threshold decreased (more likely to jam)

☐ Unreliable weapon jams on 91+ instead of 96+  
☐ Roll 92: Jam occurs, weapon disabled  
☐ Chat message: "Weapon jammed! Requires unjam action."  

---

## Complex Qualities

### Blast(X)
**Setup:** Equip blast weapon (e.g., Frag Grenade with Blast 4), target area with multiple enemies  
**Test:** Throw grenade at cluster of 3 enemies  
**Expected:** All targets within blast radius take damage

☐ Grenade attack rolls BS test  
☐ If hit: Blast centered on target point  
☐ All enemies within 4m radius affected  
☐ Each target rolls 1d5 hits (or fixed based on system)  
☐ Damage applied to each target independently  
☐ Chat shows damage breakdown per target  

---

### Flame
**Setup:** Equip flame weapon (e.g., Astartes Flamer), position within range of enemy  
**Test:** Use flame attack (cone/template)  
**Expected:** Auto-hit within range, catch fire test required

☐ Flame attack auto-hits (no BS roll, or cone template)  
☐ Target makes Agility dodge test  
☐ If dodge fails: Damage applied + catch fire test (AG)  
☐ If catch fire test fails: "On Fire" status applied  
☐ Chat shows flame attack results and catch fire test  

---

### Storm
**Setup:** Equip weapon with Storm quality (e.g., Heavy Bolter)  
**Test:** Use Storm weapon to make Full Auto attack as Half Action  
**Expected:** Full Auto attack possible with Half Action instead of Full Action

☐ Storm weapon attack dialog shows "Half Action Full Auto" option  
☐ Select Half Action Full Auto  
☐ Attack generates multiple hits (DoS ÷ 2)  
☐ Character can take second Half Action same turn  

---

### Scatter
**Setup:** Equip weapon with Scatter quality (e.g., grenade launcher)  
**Test:** Make attack that misses (intentionally roll high)  
**Expected:** Weapon scatters, lands away from intended target

☐ Attack roll misses (exceeds BS threshold)  
☐ System prompts for scatter roll (2d10 or d10 for direction + distance)  
☐ Projectile lands at scatter location  
☐ Blast/damage applies at new location (if blast weapon)  
☐ Chat shows scatter direction and distance  

---

## Edge Case Qualities

### Melta
**Setup:** Equip Melta weapon (e.g., Meltagun), position at different ranges  
**Test:** Attack at half range vs full range  
**Expected:** Damage increases at half range or closer (2d10 instead of 1d10)

☐ Attack at 7m (half of 15m range): Damage = 2d10+12  
☐ Attack at 14m (near max range): Damage = 1d10+12  
☐ Chat shows Melta range bonus: "Within half range: +1d10 damage"  

---

### Vengeful(X)
**Setup:** Equip weapon with Vengeful quality, attack horde target  
**Test:** Apply damage to horde  
**Expected:** Bonus damage per magnitude point

☐ Attack horde with Vengeful weapon  
☐ Horde magnitude noted (e.g., 25)  
☐ Damage bonus: +X per magnitude point (where X = Vengeful rating)  
☐ Example: Vengeful(3) vs magnitude 25 = +3 damage per hit  
☐ Chat shows Vengeful bonus calculation  

---

### Razor Sharp
**Setup:** Equip weapon with Razor Sharp quality (e.g., certain blades)  
**Test:** Roll damage  
**Expected:** Penetration bonus applies

☐ Razor Sharp adds +2 Penetration (or system-specific amount)  
☐ Damage calculation shows increased Pen value  
☐ Armor reduction affected: Armor - (Base Pen + Razor Sharp)  

---

### Overheats
**Setup:** Equip weapon with Overheats quality (e.g., Plasma Gun)  
**Test:** Fire weapon, roll damage dice  
**Expected:** If damage dice show 9s, weapon overheats

☐ Damage roll includes two or more 9s  
☐ System triggers Overheats check  
☐ Character takes Energy damage (e.g., 1d10)  
☐ Chat message: "Weapon overheated! User takes [X] damage."  

---

### Force (Psychic)
**Setup:** Equip Force weapon (e.g., Force Sword), psyker character  
**Test:** Attack enemy, channel psychic energy  
**Expected:** Bonus damage based on Psy Rating

☐ Make melee attack with Force weapon  
☐ Option to channel psychic energy (may cost action or PR)  
☐ If channeled: Damage bonus = +PR to damage  
☐ Example: PR 4 = +4 damage  
☐ Chat shows Force weapon bonus  

---

## Validation Summary

After testing, verify:

☐ Tearing rerolls low damage dice (1-3)  
☐ Accurate adds DoS to damage (capped by rating)  
☐ Reliable increases jam threshold (harder to jam)  
☐ Unreliable decreases jam threshold (easier to jam)  
☐ Blast affects multiple targets in radius  
☐ Flame auto-hits, triggers catch fire tests  
☐ Storm allows Full Auto as Half Action  
☐ Scatter redirects missed attacks  
☐ Melta increases damage at half range  
☐ Vengeful adds magnitude-based damage vs hordes  
☐ Razor Sharp increases Penetration  
☐ Overheats triggers on high damage rolls (9s)  
☐ Force adds Psy Rating to damage when channeled  

---

_Weapon quality protocols verified, Tech-Priest. The Machine Spirit's arsenal is blessed._ ⚙️
