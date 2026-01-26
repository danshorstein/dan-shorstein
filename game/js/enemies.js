/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Enemy (Book) Management System
 */

/**
 * Create a new enemy book unit
 */
function createEnemy(enemyType, x = 0, y = 0) {
    const typeData = ENEMY_TYPES[enemyType];
    if (!typeData) {
        console.error('Unknown enemy type:', enemyType);
        return null;
    }

    const enemy = {
        id: Utils.generateId(),
        name: typeData.name,
        type: enemyType,
        typeData: typeData,
        team: 'enemy',

        // Position
        x: x,
        y: y,

        // Current stats
        hp: typeData.stats.maxHP,
        maxHP: typeData.stats.maxHP,
        ap: typeData.stats.maxAP,
        maxAP: typeData.stats.maxAP,

        // Combat stats
        accuracy: typeData.stats.accuracy,
        dodge: typeData.stats.dodge,
        armor: typeData.stats.armor,
        sightRange: typeData.stats.sightRange,
        moveRange: typeData.stats.moveRange,

        // Weapon
        weapon: { ...typeData.weapon },

        // Special ability
        special: typeData.special ? { ...typeData.special } : null,
        specialCooldown: 0,

        // Value
        fineValue: typeData.fineValue,
        xpValue: typeData.xpValue,

        // Status
        status: CONFIG.STATUS.NONE,
        statusDuration: 0,

        // State flags
        hasActed: false,
        hasMoved: false,
        isOverwatching: false,
        isAlive: true,
        isHidden: false,
        wasRevealed: false,

        // Visual
        icon: typeData.icon,
        color: CONFIG.COLORS.ENEMY,

        // AI state
        aiState: 'idle',
        targetId: null,
        lastKnownPlayerPos: null,
    };

    return enemy;
}

/**
 * Create enemies for a mission based on threat level and mission type
 */
function createEnemySquad(threatLevel, missionType, mapWidth, mapHeight) {
    const enemies = [];

    // Determine enemy count and composition based on threat
    let enemyCount;
    let enemyTypes;
    let includeBoss = false;

    switch (threatLevel) {
        case 'low':
            enemyCount = Utils.randomInt(4, 6);
            enemyTypes = ['ROMANCE_NOVEL', 'COMIC_BOOK', 'ROMANCE_NOVEL'];
            break;
        case 'medium':
            enemyCount = Utils.randomInt(6, 8);
            enemyTypes = ['ROMANCE_NOVEL', 'HORROR_BOOK', 'COMIC_BOOK', 'TEXTBOOK', 'COOKBOOK'];
            break;
        case 'high':
            enemyCount = Utils.randomInt(8, 10);
            enemyTypes = ['HORROR_BOOK', 'TEXTBOOK', 'MYSTERY_NOVEL', 'SELF_HELP_BOOK', 'COOKBOOK'];
            break;
        case 'boss':
            enemyCount = Utils.randomInt(6, 8);
            enemyTypes = ['HORROR_BOOK', 'TEXTBOOK', 'MYSTERY_NOVEL'];
            includeBoss = true;
            break;
        default:
            enemyCount = 5;
            enemyTypes = ['ROMANCE_NOVEL', 'COMIC_BOOK'];
    }

    // Generate spawn positions (right side of map)
    const usedPositions = [];

    function getSpawnPosition() {
        let attempts = 0;
        while (attempts < 50) {
            const x = Utils.randomInt(Math.floor(mapWidth * 0.6), mapWidth - 2);
            const y = Utils.randomInt(2, mapHeight - 3);

            const key = `${x},${y}`;
            if (!usedPositions.includes(key)) {
                usedPositions.push(key);
                return { x, y };
            }
            attempts++;
        }
        // Fallback
        return { x: mapWidth - 2, y: Math.floor(mapHeight / 2) };
    }

    // Create enemies
    for (let i = 0; i < enemyCount; i++) {
        const type = Utils.randomChoice(enemyTypes);
        const pos = getSpawnPosition();
        const enemy = createEnemy(type, pos.x, pos.y);
        if (enemy) {
            enemies.push(enemy);
        }
    }

    // Add boss if needed
    if (includeBoss) {
        const bossPos = getSpawnPosition();
        const boss = createEnemy('ENCYCLOPEDIA', bossPos.x, bossPos.y);
        if (boss) {
            enemies.push(boss);
        }
    }

    return enemies;
}

/**
 * Reset enemy for new turn
 */
function resetEnemyTurn(enemy) {
    enemy.ap = enemy.maxAP;
    enemy.hasActed = false;
    enemy.hasMoved = false;

    // Process status effects
    if (enemy.statusDuration > 0) {
        enemy.statusDuration--;
        if (enemy.statusDuration <= 0) {
            enemy.status = CONFIG.STATUS.NONE;
        }
    }

    // Reduce special cooldown
    if (enemy.specialCooldown > 0) {
        enemy.specialCooldown--;
    }

    // Clear overwatch at start of their turn
    enemy.isOverwatching = false;
}

/**
 * Get effective stats for enemy (after status effects)
 */
function getEnemyEffectiveStats(enemy) {
    const stats = {
        accuracy: enemy.accuracy,
        dodge: enemy.dodge,
        damage: [...enemy.weapon.damage],
    };

    // Buffed status
    if (enemy.status === CONFIG.STATUS.BUFFED) {
        stats.accuracy += 10;
        stats.damage[0] += 1;
        stats.damage[1] += 1;
    }

    // Marked status (negative)
    if (enemy.status === CONFIG.STATUS.MARKED) {
        stats.dodge -= 20;
    }

    return stats;
}

/**
 * Check if enemy can use special ability
 */
function canUseSpecial(enemy) {
    if (!enemy.special) return false;
    if (enemy.specialCooldown > 0) return false;
    if (enemy.ap < (enemy.special.apCost || CONFIG.SPECIAL_COST)) return false;
    return true;
}

/**
 * Execute enemy special ability
 */
function executeEnemySpecial(enemy, target, allUnits, map) {
    const result = {
        success: false,
        message: '',
        effects: [],
    };

    if (!canUseSpecial(enemy)) {
        return result;
    }

    switch (enemy.type) {
        case 'ROMANCE_NOVEL':
            // Charm - chance to skip target's turn
            if (Utils.percentChance(enemy.special.chance)) {
                UnitManager.applyStatus(target, CONFIG.STATUS.CHARMED, 1);
                result.success = true;
                result.message = `${enemy.name} charms ${target.name}!`;
                result.effects.push({ type: 'charm', target: target.id });
            } else {
                result.message = `${target.name} resists the charm!`;
            }
            break;

        case 'HORROR_BOOK':
            // Terrify - reduce accuracy
            if (Utils.percentChance(enemy.special.chance)) {
                UnitManager.applyStatus(target, CONFIG.STATUS.FRIGHTENED, 2);
                result.success = true;
                result.message = `${enemy.name} terrifies ${target.name}!`;
                result.effects.push({ type: 'frighten', target: target.id });
            } else {
                result.message = `${target.name} stands firm!`;
            }
            break;

        case 'TEXTBOOK':
            // Bore - stun target
            if (Utils.percentChance(enemy.special.chance)) {
                UnitManager.applyStatus(target, CONFIG.STATUS.STUNNED, 1);
                result.success = true;
                result.message = `${enemy.name} bores ${target.name} into a stupor!`;
                result.effects.push({ type: 'stun', target: target.id });
            } else {
                result.message = `${target.name} stays focused!`;
            }
            break;

        case 'SELF_HELP_BOOK':
            // Motivate - heal nearby allies
            const nearbyAllies = allUnits.filter(u =>
                u.team === 'enemy' &&
                u.isAlive &&
                u.id !== enemy.id &&
                Utils.chebyshevDistance(enemy.x, enemy.y, u.x, u.y) <= enemy.special.range
            );

            nearbyAllies.forEach(ally => {
                const healAmount = UnitManager.healUnit(ally, 3);
                if (healAmount > 0) {
                    result.effects.push({ type: 'heal', target: ally.id, amount: healAmount });
                }
            });

            result.success = nearbyAllies.length > 0;
            result.message = result.success ?
                `${enemy.name} motivates nearby books!` :
                `${enemy.name} has no allies to motivate.`;
            break;

        case 'MYSTERY_NOVEL':
            // Cloak - become hidden
            enemy.isHidden = true;
            result.success = true;
            result.message = `${enemy.name} vanishes into the shadows!`;
            result.effects.push({ type: 'hide', target: enemy.id });
            break;

        case 'ENCYCLOPEDIA':
            // Summon Pages - spawn additional enemies
            const spawnCount = Utils.randomInt(1, 2);
            const spawnTypes = ['ROMANCE_NOVEL', 'COMIC_BOOK'];

            for (let i = 0; i < spawnCount; i++) {
                const adjacent = Utils.getAdjacentTiles(enemy.x, enemy.y);
                const validTiles = adjacent.filter(t => {
                    if (!Utils.inBounds(t.x, t.y, map.width, map.height)) return false;
                    const tile = map.getTile(t.x, t.y);
                    if (tile === CONFIG.TILES.WALL) return false;
                    const occupied = allUnits.some(u => u.isAlive && u.x === t.x && u.y === t.y);
                    return !occupied;
                });

                if (validTiles.length > 0) {
                    const spawnPos = Utils.randomChoice(validTiles);
                    const spawnType = Utils.randomChoice(spawnTypes);
                    const newEnemy = createEnemy(spawnType, spawnPos.x, spawnPos.y);
                    if (newEnemy) {
                        result.effects.push({ type: 'spawn', enemy: newEnemy });
                    }
                }
            }

            result.success = result.effects.length > 0;
            result.message = result.success ?
                `${enemy.name} summons loose pages to fight!` :
                `${enemy.name} tries to summon but there's no room!`;
            break;
    }

    // Set cooldown
    if (enemy.special.cooldown) {
        enemy.specialCooldown = enemy.special.cooldown;
    }

    return result;
}

/**
 * Get enemy threat description
 */
function getEnemyThreatDescription(enemy) {
    const typeData = ENEMY_TYPES[enemy.type];
    return typeData ? typeData.description : 'Unknown threat';
}

/**
 * Clone enemy for saving
 */
function cloneEnemy(enemy) {
    const clone = Utils.deepClone(enemy);
    delete clone.typeData; // Remove circular reference
    return clone;
}

/**
 * Restore enemy from save data
 */
function restoreEnemy(saveData) {
    const typeData = ENEMY_TYPES[saveData.type];
    return {
        ...saveData,
        typeData: typeData,
    };
}

/**
 * Get damage preview for an enemy attack
 */
function getEnemyDamagePreview(enemy) {
    return {
        min: enemy.weapon.damage[0],
        max: enemy.weapon.damage[1],
        type: enemy.weapon.name,
    };
}

// Export functions
window.EnemyManager = {
    createEnemy,
    createEnemySquad,
    resetEnemyTurn,
    getEnemyEffectiveStats,
    canUseSpecial,
    executeEnemySpecial,
    getEnemyThreatDescription,
    cloneEnemy,
    restoreEnemy,
    getEnemyDamagePreview,
};
