import { CombatHelper } from '../helpers/combat/combat.mjs';
import { FireHelper } from '../helpers/combat/fire-helper.mjs';

/**
 * GM macro for flame weapon attacks. Opens a dialog for damage/pen,
 * GM targets a token and clicks Burn. Applies damage, rolls catch fire
 * Agility test, and applies On Fire status if failed.
 */
export async function flameAttack() {
    const content = `
      <div class="form-group">
        <label>Damage:</label>
        <input type="text" id="flameDamage" placeholder="e.g., 1d10+4" />
      </div>
      <div class="form-group">
        <label>Penetration:</label>
        <input type="number" id="flamePen" value="0" />
      </div>
      <div class="form-group">
        <label>Damage Type:</label>
        <input type="text" id="flameDmgType" value="Energy" />
      </div>
      <div class="form-group">
        <label>Weapon Range (m):</label>
        <input type="number" id="flameRange" value="20" min="1" />
      </div>
    `;

    foundry.applications.api.DialogV2.wait({
        window: { title: '🔥 Flame Attack' },
        content,
        buttons: [
            {
                label: '🔥 Burn', action: 'burn',
                callback: async (event, button, dialog) => {
                    const el = dialog.element;
                    const damageFormula = el.querySelector('#flameDamage').value?.trim();
                    if (!damageFormula) {
                        ui.notifications.warn('Enter a damage formula.');
                        return;
                    }
                    const penetration = parseInt(el.querySelector('#flamePen').value) || 0;
                    const damageType = el.querySelector('#flameDmgType').value?.trim() || 'Energy';
                    const weaponRange = parseInt(el.querySelector('#flameRange').value) || 20;

                    const targetToken = game.user.targets.first();
                    if (!targetToken?.actor) {
                        ui.notifications.warn('Target a token before clicking Burn.');
                        return;
                    }
                    const targetActor = targetToken.actor;
                    const targetName = targetActor.name;
                    const isHorde = targetActor.type === 'horde';

                    if (isHorde) {
                        // Horde: ceil(range/4) + 1d5 hits, each rolled separately
                        const staticHits = Math.ceil(weaponRange / 4);
                        const flameRoll = await new Roll('1d5').evaluate();
                        const totalHits = staticHits + flameRoll.total;

                        await flameRoll.toMessage({
                            speaker: ChatMessage.getSpeaker(),
                            flavor: `<strong>🔥 Flame vs Horde: ${targetName}</strong><br>Hits: ${staticHits} (range ${weaponRange}/4) + ${flameRoll.total} (1d5) = <strong>${totalHits} hits</strong>`
                        });

                        const hordeHitResults = [];
                        for (let i = 0; i < totalHits; i++) {
                            const roll = await new Roll(damageFormula).evaluate();
                            hordeHitResults.push({ damage: roll.total, penetration, location: 'Body', damageType });
                        }
                        await targetActor.system.receiveBatchDamage(hordeHitResults);
                    } else {
                        // Individual target: Agility dodge test first
                        const ag = targetActor.system.characteristics?.ag?.value || 0;

                        const dodgeContent = `
                          <div style="margin-bottom: 8px;"><strong>🔥 Dodge Flame: ${targetName}</strong></div>
                          <div class="form-group">
                            <label>AG: ${ag}</label>
                          </div>
                          <div class="form-group">
                            <label>Misc Modifier:</label>
                            <input type="number" id="dodgeMod" value="0" style="width: 60px;" />
                          </div>
                        `;

                        foundry.applications.api.DialogV2.wait({
                            window: { title: `🔥 Dodge Flame: ${targetName}` },
                            content: dodgeContent,
                            buttons: [
                                {
                                    label: 'Roll Dodge', action: 'roll',
                                    callback: async (event, button, dodgeDialog) => {
                                        const dodgeMod = parseInt(dodgeDialog.element.querySelector('#dodgeMod').value) || 0;
                                        const dodgeRoll = await new Roll('1d100').evaluate();
                                        const dodgeResult = FireHelper.resolveDodgeFlameTest(ag, dodgeRoll.total, dodgeMod);
                                        const dodgeFlavor = FireHelper.buildDodgeFlameFlavor(targetName, ag, dodgeResult, dodgeMod);

                                        await dodgeRoll.toMessage({
                                            speaker: ChatMessage.getSpeaker({ actor: targetActor }),
                                            flavor: dodgeFlavor,
                                            rollMode: game.settings.get('core', 'rollMode')
                                        });

                                        if (!dodgeResult.success) {
                                            // Apply damage
                                            const damageRoll = await new Roll(damageFormula).evaluate();
                                            const damage = damageRoll.total;
                                            const locRoll = await new Roll('1d100').evaluate();
                                            const location = CombatHelper.determineHitLocation(locRoll.total);

                                            await CombatHelper.applyDamage(targetActor, {
                                                damage, penetration, location, damageType,
                                                felling: 0, isPrimitive: false, isRazorSharp: false,
                                                degreesOfSuccess: 0, isScatter: false, isLongOrExtremeRange: false,
                                                isShocking: false, isToxic: false, isMeltaRange: false
                                            });

                                            // Catch Fire test
                                            const catchFireRoll = await new Roll('1d100').evaluate();
                                            const catchResult = FireHelper.resolveCatchFireTest(ag, catchFireRoll.total);
                                            const catchFlavor = FireHelper.buildCatchFireFlavor(targetName, ag, catchResult);

                                            if (!catchResult.success) {
                                                await targetActor.setCondition('on-fire', true);
                                            }

                                            await catchFireRoll.toMessage({
                                                speaker: ChatMessage.getSpeaker({ actor: targetActor }),
                                                flavor: catchFlavor,
                                                rollMode: game.settings.get('core', 'rollMode')
                                            });
                                        }
                                    }
                                },
                                { label: 'Cancel', action: 'cancel' }
                            ]
                        });
                    }
                }
            },
            { label: 'Cancel', action: 'cancel' }
        ]
    });
}
