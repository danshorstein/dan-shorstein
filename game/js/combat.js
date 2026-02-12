/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Combat System
 */

const Combat = {
    /**
     * Execute an attack action
     */
    async attack(attacker, target, map, allUnits) {
        const result = {
            success: false,
            hit: false,
            critical: false,
            damage: 0,
            killed: false,
            message: '',
            effects: [],
        };

        // Check if attack is valid
        if (!UnitManager.canUnitAct(attacker, CONFIG.ATTACK_COST)) {
            result.message = `${attacker.name} cannot attack (not enough AP)`;
            return result;
        }

        // Check range
        const distance = Utils.chebyshevDistance(attacker.x, attacker.y, target.x, target.y);
        if (distance > attacker.weapon.range) {
            result.message = `${target.name} is out of range`;
            return result;
        }

        // Check line of sight
        if (!UnitManager.hasLineOfSight(attacker.x, attacker.y, target.x, target.y, map)) {
            result.message = `No line of sight to ${target.name}`;
            return result;
        }

        // Spend AP
        UnitManager.spendAP(attacker, CONFIG.ATTACK_COST);
        result.success = true;

        // Calculate hit chance
        const hitChance = UnitManager.getEffectiveAccuracy(attacker, target, map, allUnits);

        // Roll to hit
        const roll = Math.random() * 100;
        result.hit = roll < hitChance;

        // Play attack sound
        AudioSystem.playSound('attack');

        // Create attack animation
        const animation = Renderer.createAttackAnimation(
            attacker.x, attacker.y,
            target.x, target.y,
            result.hit,
            result.critical
        );
        Renderer.addAnimation(animation);

        await Utils.wait(300);

        if (result.hit) {
            // Check for critical hit
            const critRoll = Math.random() * 100;
            result.critical = critRoll < CONFIG.CRITICAL_CHANCE;

            // Calculate damage
            result.damage = UnitManager.calculateDamage(attacker, result.critical);

            // Apply damage
            const actualDamage = UnitManager.damageUnit(target, result.damage);

            if (result.critical) {
                AudioSystem.playSound('critical');
                result.message = `CRITICAL! ${attacker.name} hits ${target.name} for ${actualDamage} damage!`;
            } else {
                AudioSystem.playSound('hit');
                result.message = `${attacker.name} hits ${target.name} for ${actualDamage} damage!`;
            }

            // Check for kill
            if (target.hp <= 0) {
                result.killed = true;
                target.isAlive = false;
                result.message += ` ${target.name} is neutralized!`;

                // Award XP and fines for killing enemies
                if (attacker.team === 'player' && target.team === 'enemy') {
                    attacker.kills++;
                    result.effects.push({
                        type: 'xp',
                        target: attacker.id,
                        amount: target.xpValue || 20,
                    });
                    result.effects.push({
                        type: 'fines',
                        amount: target.fineValue || 25,
                    });
                }

                // Death animation
                AudioSystem.playSound('death');
                Renderer.addAnimation(Renderer.createDeathAnimation(target));
            }

            // Enemy special ability chance on hit
            if (target.team === 'enemy' && target.special && !result.killed) {
                if (Utils.percentChance(30)) {
                    const specialResult = EnemyManager.executeEnemySpecial(target, attacker, allUnits, map);
                    if (specialResult.success) {
                        result.effects.push(...specialResult.effects);
                        result.message += ` ${specialResult.message}`;
                    }
                }
            }
        } else {
            AudioSystem.playSound('miss');
            result.message = `${attacker.name} misses ${target.name}!`;
        }

        // Clear overwatch after attacking
        if (attacker.isOverwatching) {
            UnitManager.clearOverwatch(attacker);
        }

        attacker.hasActed = true;

        return result;
    },

    /**
     * Execute overwatch attack (reaction fire)
     */
    async overwatchAttack(attacker, target, map, allUnits) {
        // Overwatch has accuracy penalty
        const result = await this.attack(attacker, target, map, allUnits);

        // Clear overwatch after firing
        UnitManager.clearOverwatch(attacker);

        return result;
    },

    /**
     * Check if any unit has overwatch on a tile
     */
    checkOverwatch(targetUnit, newX, newY, allUnits, map) {
        const overwatchingUnits = allUnits.filter(u =>
            u.isAlive &&
            u.isOverwatching &&
            u.team !== targetUnit.team
        );

        for (const unit of overwatchingUnits) {
            // Check if target is in weapon range
            const distance = Utils.chebyshevDistance(unit.x, unit.y, newX, newY);
            if (distance > unit.weapon.range) continue;

            // Check line of sight
            if (!UnitManager.hasLineOfSight(unit.x, unit.y, newX, newY, map)) continue;

            return unit;
        }

        return null;
    },

    /**
     * Execute special ability
     */
    async useSpecial(unit, target, map, allUnits) {
        const result = {
            success: false,
            message: '',
            effects: [],
        };

        // Check if can use special
        if (!UnitManager.canUnitAct(unit, CONFIG.SPECIAL_COST)) {
            result.message = `${unit.name} cannot use special ability (not enough AP)`;
            return result;
        }

        if (unit.specialCooldown > 0) {
            result.message = `${unit.special.name} is on cooldown`;
            return result;
        }

        // Spend AP
        UnitManager.spendAP(unit, CONFIG.SPECIAL_COST);

        // Play ability sound
        AudioSystem.playSound('ability');

        // Execute based on unit class
        switch (unit.class) {
            case 'HEAD_LIBRARIAN':
                result.success = true;
                result.message = `${unit.name} uses Rally!`;

                // Restore AP to nearby allies
                const nearbyAllies = allUnits.filter(u =>
                    u.team === 'player' &&
                    u.isAlive &&
                    u.id !== unit.id &&
                    Utils.chebyshevDistance(unit.x, unit.y, u.x, u.y) <= unit.special.range
                );

                nearbyAllies.forEach(ally => {
                    ally.ap = Math.min(ally.maxAP, ally.ap + 2);
                    result.effects.push({
                        type: 'ap_restore',
                        target: ally.id,
                        amount: 2,
                    });
                });

                if (nearbyAllies.length > 0) {
                    result.message += ` ${nearbyAllies.length} allies restored 2 AP!`;
                } else {
                    result.message += ` No allies in range.`;
                }
                break;

            case 'ARCHIVIST':
                result.success = true;
                result.message = `${unit.name} prepares a Precision Shot!`;

                // Apply buff to self for next attack
                UnitManager.applyStatus(unit, CONFIG.STATUS.BUFFED, 1);
                result.effects.push({
                    type: 'buff',
                    target: unit.id,
                    buff: 'precision',
                });
                break;

            case 'CATALOGUER':
                // Mark an enemy
                if (!target || target.team !== 'enemy') {
                    result.message = 'Must target an enemy to Catalog';
                    UnitManager.spendAP(unit, -CONFIG.SPECIAL_COST); // Refund
                    return result;
                }

                const distance = Utils.chebyshevDistance(unit.x, unit.y, target.x, target.y);
                if (distance > unit.special.range) {
                    result.message = 'Target is out of range';
                    UnitManager.spendAP(unit, -CONFIG.SPECIAL_COST); // Refund
                    return result;
                }

                UnitManager.applyStatus(target, CONFIG.STATUS.MARKED, 3);
                result.success = true;
                result.message = `${unit.name} catalogs ${target.name}! (+20% hit chance)`;
                result.effects.push({
                    type: 'mark',
                    target: target.id,
                });
                break;

            case 'CONSERVATOR':
                // Heal an ally
                if (!target || target.team !== 'player') {
                    result.message = 'Must target an ally to Restore';
                    UnitManager.spendAP(unit, -CONFIG.SPECIAL_COST); // Refund
                    return result;
                }

                const healDistance = Utils.chebyshevDistance(unit.x, unit.y, target.x, target.y);
                if (healDistance > unit.special.range) {
                    result.message = 'Ally is out of range';
                    UnitManager.spendAP(unit, -CONFIG.SPECIAL_COST); // Refund
                    return result;
                }

                const healAmount = UnitManager.healUnit(target, 5);
                result.success = true;
                result.message = `${unit.name} restores ${target.name} for ${healAmount} HP!`;
                result.effects.push({
                    type: 'heal',
                    target: target.id,
                    amount: healAmount,
                });
                break;
        }

        // Set cooldown
        if (result.success && unit.special.cooldown) {
            unit.specialCooldown = unit.special.cooldown;
        }

        unit.hasActed = true;

        return result;
    },

    /**
     * Move a unit along a path
     */
    async moveUnit(unit, path, map, allUnits) {
        const result = {
            success: false,
            interrupted: false,
            interruptedBy: null,
            message: '',
        };

        if (!path || path.length === 0) {
            result.message = 'Invalid path';
            return result;
        }

        const moveCost = path.length - 1; // -1 because path includes start position

        if (!UnitManager.canUnitAct(unit, moveCost)) {
            result.message = `${unit.name} cannot move that far (not enough AP)`;
            return result;
        }

        result.success = true;

        // Create movement animation
        const animation = Renderer.createMoveAnimation(unit, path);
        Renderer.addAnimation(animation);

        // Move through path, checking for overwatch
        for (let i = 1; i < path.length; i++) {
            const tile = path[i];

            // Check for overwatch reactions
            const overwatcher = this.checkOverwatch(unit, tile.x, tile.y, allUnits, map);

            if (overwatcher) {
                result.interrupted = true;
                result.interruptedBy = overwatcher;

                // Execute overwatch attack
                const attackResult = await this.overwatchAttack(overwatcher, unit, map, allUnits);

                result.message = `${overwatcher.name} fires on ${unit.name}! ${attackResult.message}`;

                if (attackResult.killed) {
                    // Unit died during movement
                    return result;
                }

                // Continue movement after overwatch
            }

            // Update position
            unit.x = tile.x;
            unit.y = tile.y;

            // Play footstep sound occasionally
            if (i % 2 === 0) {
                AudioSystem.playSound('footstep');
            }

            await Utils.wait(80);
        }

        // Spend AP
        UnitManager.spendAP(unit, moveCost);
        unit.hasMoved = true;

        // Update fog of war
        map.updateVisibility(allUnits.filter(u => u.team === 'player' && u.isAlive));

        result.message = result.message || `${unit.name} moves to position`;

        return result;
    },

    /**
     * Set unit to overwatch mode
     */
    setOverwatch(unit) {
        const result = {
            success: false,
            message: '',
        };

        if (!UnitManager.canUnitAct(unit, CONFIG.OVERWATCH_COST)) {
            result.message = `${unit.name} cannot enter overwatch (not enough AP)`;
            return result;
        }

        UnitManager.spendAP(unit, CONFIG.OVERWATCH_COST);
        UnitManager.setOverwatch(unit);
        unit.hasActed = true;

        result.success = true;
        result.message = `${unit.name} enters overwatch mode`;

        AudioSystem.playSound('ability');

        return result;
    },

    /**
     * Get combat preview (hit chance, damage range)
     */
    getCombatPreview(attacker, target, map, allUnits) {
        const hitChance = UnitManager.getEffectiveAccuracy(attacker, target, map, allUnits);
        const minDamage = attacker.weapon.damage[0];
        const maxDamage = attacker.weapon.damage[1];

        const coverBonus = Utils.calculateCoverBonus(attacker, target, map);
        const isFlanked = Utils.isFlanked(attacker, target, map, allUnits);

        return {
            hitChance: Math.round(hitChance),
            minDamage,
            maxDamage,
            critChance: CONFIG.CRITICAL_CHANCE,
            coverBonus,
            isFlanked,
            targetHP: target.hp,
            targetMaxHP: target.maxHP,
            canKill: target.hp <= maxDamage,
        };
    },

    /**
     * Get ability preview for special abilities
     */
    getAbilityPreview(unit, target, map, allUnits) {
        const preview = {
            name: unit.special.name,
            description: unit.special.description,
            apCost: CONFIG.SPECIAL_COST,
            cooldown: unit.specialCooldown,
            range: unit.special.range || 0,
            canUse: unit.specialCooldown === 0 && unit.ap >= CONFIG.SPECIAL_COST,
        };

        if (target) {
            preview.targetName = target.name;
            preview.distance = Utils.chebyshevDistance(unit.x, unit.y, target.x, target.y);
            preview.inRange = preview.distance <= (unit.special.range || 0);
        }

        return preview;
    },
};

// Export
window.Combat = Combat;
