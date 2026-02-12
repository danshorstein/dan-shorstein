/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Enemy AI System
 */

const AI = {
    /**
     * Execute AI turn for all enemies
     */
    async executeTurn(enemies, players, map) {
        const results = [];

        // Sort enemies by priority (support units act first)
        const sortedEnemies = this.prioritizeEnemies(enemies);

        for (const enemy of sortedEnemies) {
            if (!enemy.isAlive) continue;

            // Reset for turn
            EnemyManager.resetEnemyTurn(enemy);

            // Skip if stunned
            if (enemy.status === CONFIG.STATUS.STUNNED) {
                results.push({
                    unit: enemy,
                    action: 'stunned',
                    message: `${enemy.name} is stunned and cannot act!`,
                });
                continue;
            }

            // Execute AI behavior
            const actions = await this.executeUnitAI(enemy, enemies, players, map);
            results.push(...actions);

            // Small delay between units
            await Utils.wait(CONFIG.AI_MOVE_DELAY);
        }

        return results;
    },

    /**
     * Prioritize enemies for turn order
     */
    prioritizeEnemies(enemies) {
        return enemies.filter(e => e.isAlive).sort((a, b) => {
            // Self-help books (healers) go first
            if (a.type === 'SELF_HELP_BOOK') return -1;
            if (b.type === 'SELF_HELP_BOOK') return 1;

            // Encyclopedias (bosses) go early
            if (a.type === 'ENCYCLOPEDIA') return -1;
            if (b.type === 'ENCYCLOPEDIA') return 1;

            // Mystery novels can setup ambushes
            if (a.type === 'MYSTERY_NOVEL') return -1;
            if (b.type === 'MYSTERY_NOVEL') return 1;

            return 0;
        });
    },

    /**
     * Execute AI for a single unit
     */
    async executeUnitAI(enemy, allEnemies, players, map) {
        const results = [];
        const allUnits = [...players, ...allEnemies];
        const visiblePlayers = this.getVisiblePlayers(enemy, players, map);

        // Determine behavior based on enemy type
        const behavior = this.determineBehavior(enemy, visiblePlayers, allEnemies);

        switch (behavior) {
            case 'aggressive':
                results.push(...await this.aggressiveBehavior(enemy, visiblePlayers, allUnits, map));
                break;
            case 'defensive':
                results.push(...await this.defensiveBehavior(enemy, visiblePlayers, allUnits, map));
                break;
            case 'support':
                results.push(...await this.supportBehavior(enemy, allEnemies, visiblePlayers, allUnits, map));
                break;
            case 'ambush':
                results.push(...await this.ambushBehavior(enemy, visiblePlayers, allUnits, map));
                break;
            case 'flee':
                results.push(...await this.fleeBehavior(enemy, visiblePlayers, allUnits, map));
                break;
            default:
                results.push(...await this.patrolBehavior(enemy, allUnits, map));
        }

        return results;
    },

    /**
     * Get visible players from enemy perspective
     */
    getVisiblePlayers(enemy, players, map) {
        return players.filter(p => {
            if (!p.isAlive) return false;

            const distance = Utils.chebyshevDistance(enemy.x, enemy.y, p.x, p.y);
            if (distance > enemy.sightRange) return false;

            return UnitManager.hasLineOfSight(enemy.x, enemy.y, p.x, p.y, map);
        });
    },

    /**
     * Determine AI behavior based on situation
     */
    determineBehavior(enemy, visiblePlayers, allEnemies) {
        // Support types always support
        if (enemy.type === 'SELF_HELP_BOOK') {
            const woundedAllies = allEnemies.filter(e =>
                e.isAlive && e.id !== enemy.id && e.hp < e.maxHP
            );
            if (woundedAllies.length > 0) return 'support';
        }

        // Mystery novels prefer ambush
        if (enemy.type === 'MYSTERY_NOVEL' && !enemy.wasRevealed) {
            return 'ambush';
        }

        // Low HP enemies may flee
        if (enemy.hp < enemy.maxHP * 0.3 && visiblePlayers.length > 0) {
            if (Utils.percentChance(40)) return 'flee';
        }

        // No visible players - patrol
        if (visiblePlayers.length === 0) {
            if (enemy.lastKnownPlayerPos) return 'aggressive'; // Hunt last known position
            return 'patrol';
        }

        // Textbooks are defensive
        if (enemy.type === 'TEXTBOOK') {
            return 'defensive';
        }

        // Comic books are aggressive
        if (enemy.type === 'COMIC_BOOK') {
            return 'aggressive';
        }

        // Default aggressive
        return 'aggressive';
    },

    /**
     * Aggressive behavior - close in and attack
     */
    async aggressiveBehavior(enemy, visiblePlayers, allUnits, map) {
        const results = [];

        // Find best target
        const target = this.selectTarget(enemy, visiblePlayers);
        if (!target) return results;

        // Store last known position
        enemy.lastKnownPlayerPos = { x: target.x, y: target.y };

        // Check if can attack from current position
        const canAttack = this.canAttackTarget(enemy, target, map);

        if (canAttack && enemy.ap >= CONFIG.ATTACK_COST) {
            // Attack!
            const attackResult = await Combat.attack(enemy, target, map, allUnits);
            results.push({
                unit: enemy,
                action: 'attack',
                target: target,
                result: attackResult,
                message: attackResult.message,
            });

            // Maybe attack again if has AP
            if (enemy.ap >= CONFIG.ATTACK_COST && this.canAttackTarget(enemy, target, map)) {
                await Utils.wait(CONFIG.AI_ATTACK_DELAY);
                const secondAttack = await Combat.attack(enemy, target, map, allUnits);
                results.push({
                    unit: enemy,
                    action: 'attack',
                    target: target,
                    result: secondAttack,
                    message: secondAttack.message,
                });
            }
        } else {
            // Need to move closer
            const attackPos = Pathfinding.findAttackPosition(
                enemy.x, enemy.y,
                target.x, target.y,
                enemy.weapon.range,
                Math.floor(enemy.ap / CONFIG.MOVE_COST),
                map, allUnits, enemy.id
            );

            if (attackPos && (attackPos.x !== enemy.x || attackPos.y !== enemy.y)) {
                const path = Pathfinding.findPath(
                    enemy.x, enemy.y,
                    attackPos.x, attackPos.y,
                    map, allUnits, enemy.id
                );

                if (path && path.length > 1) {
                    const moveResult = await Combat.moveUnit(enemy, path, map, allUnits);
                    results.push({
                        unit: enemy,
                        action: 'move',
                        result: moveResult,
                        message: `${enemy.name} advances!`,
                    });

                    // Try to attack after moving
                    if (enemy.ap >= CONFIG.ATTACK_COST && this.canAttackTarget(enemy, target, map)) {
                        await Utils.wait(CONFIG.AI_ATTACK_DELAY);
                        const attackResult = await Combat.attack(enemy, target, map, allUnits);
                        results.push({
                            unit: enemy,
                            action: 'attack',
                            target: target,
                            result: attackResult,
                            message: attackResult.message,
                        });
                    }
                }
            }
        }

        return results;
    },

    /**
     * Defensive behavior - find cover and attack
     */
    async defensiveBehavior(enemy, visiblePlayers, allUnits, map) {
        const results = [];

        const target = this.selectTarget(enemy, visiblePlayers);
        if (!target) return this.patrolBehavior(enemy, allUnits, map);

        enemy.lastKnownPlayerPos = { x: target.x, y: target.y };

        // Find position with cover
        const coverPos = this.findCoverPosition(enemy, target, allUnits, map);

        if (coverPos && (coverPos.x !== enemy.x || coverPos.y !== enemy.y)) {
            const path = Pathfinding.findPath(
                enemy.x, enemy.y,
                coverPos.x, coverPos.y,
                map, allUnits, enemy.id
            );

            if (path && path.length > 1) {
                const moveResult = await Combat.moveUnit(enemy, path, map, allUnits);
                results.push({
                    unit: enemy,
                    action: 'move',
                    result: moveResult,
                    message: `${enemy.name} takes cover!`,
                });
            }
        }

        // Attack if possible
        if (enemy.ap >= CONFIG.ATTACK_COST && this.canAttackTarget(enemy, target, map)) {
            await Utils.wait(CONFIG.AI_ATTACK_DELAY);
            const attackResult = await Combat.attack(enemy, target, map, allUnits);
            results.push({
                unit: enemy,
                action: 'attack',
                target: target,
                result: attackResult,
                message: attackResult.message,
            });
        }

        // Set overwatch if has AP
        if (enemy.ap >= CONFIG.OVERWATCH_COST) {
            const overwatchResult = Combat.setOverwatch(enemy);
            results.push({
                unit: enemy,
                action: 'overwatch',
                result: overwatchResult,
                message: `${enemy.name} sets up overwatch!`,
            });
        }

        return results;
    },

    /**
     * Support behavior - heal and buff allies
     */
    async supportBehavior(enemy, allEnemies, visiblePlayers, allUnits, map) {
        const results = [];

        // Find wounded allies
        const woundedAllies = allEnemies.filter(e =>
            e.isAlive &&
            e.id !== enemy.id &&
            e.hp < e.maxHP &&
            Utils.chebyshevDistance(enemy.x, enemy.y, e.x, e.y) <= enemy.special.range + enemy.moveRange
        );

        if (woundedAllies.length > 0 && EnemyManager.canUseSpecial(enemy)) {
            // Sort by HP percentage (heal most wounded first)
            woundedAllies.sort((a, b) => (a.hp / a.maxHP) - (b.hp / b.maxHP));

            const healTarget = woundedAllies[0];
            const distance = Utils.chebyshevDistance(enemy.x, enemy.y, healTarget.x, healTarget.y);

            // Move closer if needed
            if (distance > enemy.special.range) {
                const moveTarget = Pathfinding.findClosestReachable(
                    enemy.x, enemy.y,
                    healTarget.x, healTarget.y,
                    Math.floor(enemy.ap / CONFIG.MOVE_COST),
                    map, allUnits, enemy.id
                );

                if (moveTarget) {
                    const path = Pathfinding.findPath(
                        enemy.x, enemy.y,
                        moveTarget.x, moveTarget.y,
                        map, allUnits, enemy.id
                    );

                    if (path && path.length > 1) {
                        await Combat.moveUnit(enemy, path, map, allUnits);
                        results.push({
                            unit: enemy,
                            action: 'move',
                            message: `${enemy.name} moves to support allies!`,
                        });
                    }
                }
            }

            // Use healing ability
            if (EnemyManager.canUseSpecial(enemy)) {
                const specialResult = EnemyManager.executeEnemySpecial(enemy, healTarget, allUnits, map);
                results.push({
                    unit: enemy,
                    action: 'special',
                    result: specialResult,
                    message: specialResult.message,
                });
            }
        } else {
            // No one to heal, attack instead
            return this.defensiveBehavior(enemy, visiblePlayers, allUnits, map);
        }

        return results;
    },

    /**
     * Ambush behavior - hide and wait for opportunity
     */
    async ambushBehavior(enemy, visiblePlayers, allUnits, map) {
        const results = [];

        // Use cloak ability if available
        if (EnemyManager.canUseSpecial(enemy) && !enemy.isHidden) {
            const specialResult = EnemyManager.executeEnemySpecial(enemy, null, allUnits, map);
            results.push({
                unit: enemy,
                action: 'special',
                result: specialResult,
                message: specialResult.message,
            });
            return results;
        }

        // If hidden and enemy is close, ambush!
        if (enemy.isHidden && visiblePlayers.length > 0) {
            const closest = this.getClosestPlayer(enemy, visiblePlayers);
            const distance = Utils.chebyshevDistance(enemy.x, enemy.y, closest.x, closest.y);

            if (distance <= 3) {
                enemy.isHidden = false;
                enemy.wasRevealed = true;

                results.push({
                    unit: enemy,
                    action: 'reveal',
                    message: `${enemy.name} springs from hiding!`,
                });

                // Aggressive attack
                return [...results, ...await this.aggressiveBehavior(enemy, visiblePlayers, allUnits, map)];
            }
        }

        // Stay hidden and patient
        if (!enemy.isHidden) {
            // Find hiding spot
            return this.defensiveBehavior(enemy, visiblePlayers, allUnits, map);
        }

        return results;
    },

    /**
     * Flee behavior - run away
     */
    async fleeBehavior(enemy, visiblePlayers, allUnits, map) {
        const results = [];

        if (visiblePlayers.length === 0) return this.patrolBehavior(enemy, allUnits, map);

        // Find direction away from closest player
        const closest = this.getClosestPlayer(enemy, visiblePlayers);
        const dx = enemy.x - closest.x;
        const dy = enemy.y - closest.y;

        // Normalize and extend
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetX = Math.round(enemy.x + (dx / distance) * enemy.moveRange);
        const targetY = Math.round(enemy.y + (dy / distance) * enemy.moveRange);

        const reachable = Pathfinding.getReachableTiles(
            enemy.x, enemy.y,
            Math.floor(enemy.ap / CONFIG.MOVE_COST),
            map, allUnits, enemy.id
        );

        // Find tile furthest from player
        if (reachable.length > 0) {
            reachable.sort((a, b) => {
                const distA = Utils.chebyshevDistance(a.x, a.y, closest.x, closest.y);
                const distB = Utils.chebyshevDistance(b.x, b.y, closest.x, closest.y);
                return distB - distA;
            });

            const fleeTarget = reachable[0];
            const path = Pathfinding.findPath(
                enemy.x, enemy.y,
                fleeTarget.x, fleeTarget.y,
                map, allUnits, enemy.id
            );

            if (path && path.length > 1) {
                const moveResult = await Combat.moveUnit(enemy, path, map, allUnits);
                results.push({
                    unit: enemy,
                    action: 'move',
                    result: moveResult,
                    message: `${enemy.name} retreats!`,
                });
            }
        }

        return results;
    },

    /**
     * Patrol behavior - wander around
     */
    async patrolBehavior(enemy, allUnits, map) {
        const results = [];

        // Move toward last known player position if have one
        if (enemy.lastKnownPlayerPos) {
            const distance = Utils.chebyshevDistance(
                enemy.x, enemy.y,
                enemy.lastKnownPlayerPos.x, enemy.lastKnownPlayerPos.y
            );

            if (distance <= 2) {
                // Reached last known position, clear it
                enemy.lastKnownPlayerPos = null;
            } else {
                const moveTarget = Pathfinding.findClosestReachable(
                    enemy.x, enemy.y,
                    enemy.lastKnownPlayerPos.x, enemy.lastKnownPlayerPos.y,
                    Math.floor(enemy.ap / CONFIG.MOVE_COST),
                    map, allUnits, enemy.id
                );

                if (moveTarget) {
                    const path = Pathfinding.findPath(
                        enemy.x, enemy.y,
                        moveTarget.x, moveTarget.y,
                        map, allUnits, enemy.id
                    );

                    if (path && path.length > 1) {
                        await Combat.moveUnit(enemy, path, map, allUnits);
                        results.push({
                            unit: enemy,
                            action: 'move',
                            message: `${enemy.name} investigates...`,
                        });
                        return results;
                    }
                }
            }
        }

        // Random patrol movement
        const reachable = Pathfinding.getReachableTiles(
            enemy.x, enemy.y,
            Math.min(3, Math.floor(enemy.ap / CONFIG.MOVE_COST)),
            map, allUnits, enemy.id
        );

        if (reachable.length > 0) {
            const target = Utils.randomChoice(reachable);
            const path = Pathfinding.findPath(
                enemy.x, enemy.y,
                target.x, target.y,
                map, allUnits, enemy.id
            );

            if (path && path.length > 1) {
                await Combat.moveUnit(enemy, path, map, allUnits);
                results.push({
                    unit: enemy,
                    action: 'move',
                    message: `${enemy.name} patrols...`,
                });
            }
        }

        return results;
    },

    // Helper methods

    selectTarget(enemy, visiblePlayers) {
        if (visiblePlayers.length === 0) return null;

        // Prioritize: low HP > marked > closest
        const scored = visiblePlayers.map(p => {
            let score = 0;
            const distance = Utils.chebyshevDistance(enemy.x, enemy.y, p.x, p.y);

            // Prefer low HP targets
            score += (1 - p.hp / p.maxHP) * 50;

            // Prefer marked targets
            if (p.status === CONFIG.STATUS.MARKED) score += 30;

            // Prefer closer targets
            score += (10 - distance) * 5;

            return { player: p, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0].player;
    },

    getClosestPlayer(enemy, players) {
        return players.reduce((closest, p) => {
            const distP = Utils.chebyshevDistance(enemy.x, enemy.y, p.x, p.y);
            const distC = Utils.chebyshevDistance(enemy.x, enemy.y, closest.x, closest.y);
            return distP < distC ? p : closest;
        });
    },

    canAttackTarget(enemy, target, map) {
        const distance = Utils.chebyshevDistance(enemy.x, enemy.y, target.x, target.y);
        if (distance > enemy.weapon.range) return false;
        return UnitManager.hasLineOfSight(enemy.x, enemy.y, target.x, target.y, map);
    },

    findCoverPosition(enemy, target, allUnits, map) {
        const reachable = Pathfinding.getReachableTiles(
            enemy.x, enemy.y,
            Math.floor(enemy.ap / CONFIG.MOVE_COST),
            map, allUnits, enemy.id
        );

        // Score positions by cover value and attack viability
        const scored = reachable.map(pos => {
            const cover = Pathfinding.getAdjacentCover(pos.x, pos.y, map);
            const distance = Utils.chebyshevDistance(pos.x, pos.y, target.x, target.y);
            const canAttack = distance <= enemy.weapon.range &&
                UnitManager.hasLineOfSight(pos.x, pos.y, target.x, target.y, map);

            let score = cover * 2;
            if (canAttack) score += 30;
            score -= pos.cost * 2; // Prefer closer positions

            return { ...pos, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0] || null;
    },
};

// Export
window.AI = AI;
