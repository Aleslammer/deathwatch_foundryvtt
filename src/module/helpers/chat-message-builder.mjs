export class ChatMessageBuilder {
  static createItemCard(item, actor) {
    const speaker = ChatMessage.getSpeaker({ actor });
    const { title, content } = this._buildItemCardContent(item);
    
    return ChatMessage.create({
      speaker,
      content: `<div class="${item.type}-card">${title}${content}</div>`
    });
  }

  static _buildItemCardContent(item) {
    const book = item.system.book ? `<p style="font-size: 0.85em; color: #666; margin-top: 10px;"><em>${item.system.book}, p${item.system.page}</em></p>` : '';
    
    switch (item.type) {
      case 'armor-history':
        return {
          title: `<h3>${item.name}</h3>`,
          content: `${item.system.description}${book}`
        };
      
      case 'critical-effect':
        return {
          title: `<div style="display: flex; align-items: start; gap: 10px;">
            <img src="${item.img}" style="width: 36px; height: 36px; flex-shrink: 0;" />
            <div>
              <h3 style="font-size: 1em; margin: 0 0 5px 0;">${item.name}</h3>
              <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${item.system.location} | <strong>Type:</strong> ${item.system.damageType}</p>`,
          content: `${item.system.description}</div></div>`
        };
      
      case 'characteristic':
        return {
          title: `<h3>${item.name}</h3>`,
          content: `<p style="margin: 5px 0;"><strong>Chapter:</strong> ${item.system.chapter}</p>${item.system.description}${book}`
        };
      
      case 'talent':
        const prereq = item.system.prerequisite ? `<p style="margin: 5px 0;"><strong>Prerequisite:</strong> ${item.system.prerequisite}</p>` : '';
        const benefit = item.system.benefit ? `<p style="margin: 5px 0;"><strong>Benefit:</strong> ${item.system.benefit}</p>` : '';
        return {
          title: `<h3>${item.name}</h3>`,
          content: `${prereq}${benefit}${item.system.description}${book}`
        };
      
      case 'trait':
        return {
          title: `<h3>${item.name}</h3>`,
          content: `${item.system.description}${book}`
        };
      
      default:
        return {
          title: `<h3>${item.name}</h3>`,
          content: item.system.description || ''
        };
    }
  }

  static createRollMessage(roll, actor, flavor) {
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor,
      rollMode: game.settings.get('core', 'rollMode')
    });
  }

  static createDamageApplyButton(damage, penetration, location, targetId, damageType = 'Impact', isPrimitive = false, isRazorSharp = false, degreesOfSuccess = 0, isScatter = false, isLongOrExtremeRange = false, isShocking = false, isToxic = false, isMeltaRange = false, charDamageEffect = null) {
    const charDamageData = charDamageEffect ? ` data-char-damage-formula="${charDamageEffect.formula}" data-char-damage-char="${charDamageEffect.characteristic}" data-char-damage-name="${charDamageEffect.name}"` : '';
    return `<button class="apply-damage-btn" data-damage="${damage}" data-penetration="${penetration}" data-location="${location}" data-target-id="${targetId}" data-damage-type="${damageType}" data-is-primitive="${isPrimitive}" data-is-razor-sharp="${isRazorSharp}" data-degrees-of-success="${degreesOfSuccess}" data-is-scatter="${isScatter}" data-is-long-or-extreme-range="${isLongOrExtremeRange}" data-is-shocking="${isShocking}" data-is-toxic="${isToxic}" data-is-melta-range="${isMeltaRange}"${charDamageData}>Apply Damage</button>`;
  }

  static createDamageFlavor(weapon, hitNumber, totalHits, location, degreesOfSuccess, penetration, isMelee, strBonus, applyButton = '') {
    const hitInfo = totalHits > 1 ? ` (${hitNumber}/${totalHits})` : '';
    const dosInfo = hitNumber === 1 && degreesOfSuccess > 0 ? `<br><strong>DoS:</strong> ${degreesOfSuccess}` : '';
    const strInfo = isMelee && strBonus !== 0 && hitNumber === 1 ? `<br><em>Includes STR Bonus: ${strBonus}</em>` : '';
    const applyInfo = applyButton ? `<br>${applyButton}` : '';
    
    return `<strong style="font-size: 1.1em;">${weapon}${hitInfo}</strong><br><strong>Hit ${hitNumber}:</strong> ${location}${dosInfo}<br><strong>Penetration:</strong> ${penetration}${strInfo}${applyInfo}`;
  }

  static createRighteousFuryFlavor(targetNumber, confirmed) {
    return `<strong style="background: #8b4513; color: gold; padding: 2px 6px; border-radius: 3px;">⚡ RIGHTEOUS FURY CONFIRMATION ⚡</strong><br>Target: ${targetNumber} - ${confirmed ? '<strong style="color: green;">CONFIRMED!</strong>' : '<strong style="color: red;">Failed</strong>'}`;
  }

  static createRighteousFuryDamageFlavor(furyCount) {
    return `<strong style="background: #8b4513; color: gold; padding: 2px 6px; border-radius: 3px;">⚡ RIGHTEOUS FURY DAMAGE ${furyCount} ⚡</strong>`;
  }

  static createRighteousFurySummary(furyCount, location, totalDamage, applyButton = '') {
    const applyInfo = applyButton ? `<br>${applyButton}` : '';
    return `<strong style="background: #8b4513; color: gold; padding: 2px 6px; border-radius: 3px;">⚡ Righteous Fury x${furyCount} ⚡</strong><br><strong>Location:</strong> ${location}<br><strong>Total Damage: ${totalDamage}</strong>${applyInfo}`;
  }
}
