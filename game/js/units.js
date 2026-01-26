/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Unit (Librarian) Management System
 */

/**
 * Create a new librarian unit
 */
function createLibrarian(classType, customName = null) {
    const classData = LIBRARIAN_CLASSES[classType];
    if (!classData) {
        console.error('Unknown librarian class:', classType);
        return null;
    }

    const librarian = {
        id: Utils.generateId(),
        name: customName || Utils.generateLibrarianName(),
        class: classType,
        classData: classData,
        team: 'player',

        // Position (set when deployed)
        x: 0,
        y: 0,

        // Current stats
        hp: classData.baseStats.maxHP,
        maxHP: classData.baseStats.maxHP,
        ap: classData.baseStats.maxAP,
        maxAP: classData.baseStats.maxAP,

        // Combat stats
        accuracy: classData.baseStats.accuracy,
        dodge: classData.baseStats.dodge,
        armor: classData.baseStats.armor,
        sightRange: classData.baseStats.sightRange,
        moveRange: classData.baseStats.moveRange,

        // Weapon
        weapon: { ...classData.weapon },

        // Special ability
        special: { ...classData.special },
        specialCooldown: 0,

        // Progression
        xp: 0,
        kills: 0,
        missionsCompleted: 0,
        rank: 0,

        // Status effects
        status: CONFIG.STATUS.NONE,
        statusDuration: 0,

        // State flags
        hasActed: false,
        hasMoved: false,
        isOverwatching: false,
        isAlive: true,
        isWounded: false,
        daysToHeal: 0,

        // Visual
        icon: classData.icon,
        color: CONFIG.COLORS.FRIENDLY,

        // Animation state
        animationState: 'idle',
        animationFrame: 0,
    };

    return librarian;
}

/**
 * Create starting squad for new game
 */
function createStartingSquad() {
    const squad = [
        createLibrarian('HEAD_LIBRARIAN', 'Margaret Dewey'),
        createLibrarian('ARCHIVIST', 'Chester Bookworth'),
        createLibrarian('CATALOGUER', 'Viola Stackman'),
        createLibrarian('CONSERVATOR', 'Harold Finesworth'),
    ];

    return squad;
}

/**
 * Get rank info for a unit
 */
function getUnitRank(unit) {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (unit.xp >= RANKS[i].xpRequired) {
            return { ...RANKS[i], level: i };
        }
    }
    return { ...RANKS[0], level: 0 };
}

/**
 * Check if unit can level up
 */
function checkLevelUp(unit) {
    const currentRank = getUnitRank(unit);
    const nextRank = RANKS[currentRank.level + 1];

    if (nextRank && unit.xp >= nextRank.xpRequired) {
        return nextRank;
    }
    return null;
}

/**
 * Apply level up bonuses
 */
function applyLevelUp(unit) {
    const newRank = checkLevelUp(unit);
    if (!newRank) return false;

    unit.rank = RANKS.indexOf(newRank);

    // Apply stat bonuses
    unit.maxHP = unit.classData.baseStats.maxHP + newRank.bonusHP;
    unit.accuracy = unit.classData.baseStats.accuracy + newRank.bonusAccuracy;

    // Heal to full on level up
    unit.hp = unit.maxHP;

    return true;
}

/**
 * Reset unit for new turn
 */
function resetUnitTurn(unit) {
    unit.ap = unit.maxAP;
    unit.hasActed = false;
    unit.hasMoved = false;

    // Process status effects
    if (unit.statusDuration > 0) {
        unit.statusDuration--;
        if (unit.statusDuration <= 0) {
            unit.status = CONFIG.STATUS.NONE;
        }
    }

    // Reduce special cooldown
    if (unit.specialCooldown > 0) {
        unit.specialCooldown--;
    }
}

/**
 * Check if unit can perform action
 */
function canUnitAct(unit, apCost) {
    if (!unit.isAlive || unit.hp <= 0) return false;
    if (unit.status === CONFIG.STATUS.STUNNED) return false;
    if (unit.ap < apCost) return false;
    return true;
}

/**
 * Spend AP for an action
 */
function spendAP(unit, amount) {
    unit.ap = Math.max(0, unit.ap - amount);
}

/**
 * Apply damage to a unit
 */
function damageUnit(unit, damage, ignoreArmor = false) {
    const actualDamage = ignoreArmor ? damage : Math.max(1, damage - unit.armor);
    unit.hp = Math.max(0, unit.hp - actualDamage);

    if (unit.hp <= 0) {
        unit.isAlive = false;
        unit.hp = 0;
    }

    return actualDamage;
}

/**
 * Heal a unit
 */
function healUnit(unit, amount) {
    const healAmount = Math.min(amount, unit.maxHP - unit.hp);
    unit.hp += healAmount;
    return healAmount;
}

/**
 * Apply status effect
 */
function applyStatus(unit, status, duration) {
    unit.status = status;
    unit.statusDuration = duration;
}

/**
 * Clear status effect
 */
function clearStatus(unit) {
    unit.status = CONFIG.STATUS.NONE;
    unit.statusDuration = 0;
}

/**
 * Set overwatch mode
 */
function setOverwatch(unit) {
    unit.isOverwatching = true;
    applyStatus(unit, CONFIG.STATUS.OVERWATCH, 1);
}

/**
 * Clear overwatch
 */
function clearOverwatch(unit) {
    unit.isOverwatching = false;
    if (unit.status === CONFIG.STATUS.OVERWATCH) {
        clearStatus(unit);
    }
}

/**
 * Get effective accuracy considering all modifiers
 */
function getEffectiveAccuracy(attacker, target, map, allUnits) {
    let accuracy = attacker.accuracy;

    // Weapon accuracy bonus
    if (attacker.weapon) {
        accuracy = attacker.weapon.accuracy || accuracy;
    }

    // Range penalty (further = less accurate)
    const distance = Utils.chebyshevDistance(attacker.x, attacker.y, target.x, target.y);
    const optimalRange = Math.floor((attacker.weapon?.range || 5) / 2);
    if (distance > optimalRange) {
        accuracy -= (distance - optimalRange) * 3;
    }

    // Cover penalty
    if (map) {
        const coverBonus = Utils.calculateCoverBonus(attacker, target, map);
        accuracy -= coverBonus;
    }

    // Flanking bonus
    if (allUnits && Utils.isFlanked(attacker, target, map, allUnits)) {
        accuracy += CONFIG.FLANKING_BONUS;
    }

    // Target marked bonus
    if (target.status === CONFIG.STATUS.MARKED) {
        accuracy += 20;
    }

    // Attacker frightened penalty
    if (attacker.status === CONFIG.STATUS.FRIGHTENED) {
        accuracy -= 20;
    }

    // Overwatch penalty
    if (attacker.isOverwatching) {
        accuracy -= CONFIG.OVERWATCH_PENALTY;
    }

    // Target dodge
    accuracy -= target.dodge;

    return Utils.clamp(accuracy, 5, 95);
}

/**
 * Calculate damage for an attack
 */
function calculateDamage(attacker, isCritical = false) {
    const baseDamage = Utils.rollDamage(attacker.weapon.damage);
    return isCritical ? Math.floor(baseDamage * CONFIG.CRITICAL_MULTIPLIER) : baseDamage;
}

/**
 * Get movement range tiles for a unit
 */
function getMovementRange(unit, map, allUnits) {
    const range = [];
    const maxMoves = Math.floor(unit.ap / CONFIG.MOVE_COST);

    for (let y = unit.y - maxMoves; y <= unit.y + maxMoves; y++) {
        for (let x = unit.x - maxMoves; x <= unit.x + maxMoves; x++) {
            if (!Utils.inBounds(x, y, map.width, map.height)) continue;
            if (x === unit.x && y === unit.y) continue;

            const distance = Utils.manhattanDistance(unit.x, unit.y, x, y);
            if (distance > maxMoves) continue;

            // Check if tile is walkable
            const tile = map.getTile(x, y);
            if (tile === CONFIG.TILES.WALL || tile === CONFIG.TILES.WATER) continue;

            // Check if tile is occupied
            const occupied = allUnits.some(u =>
                u.isAlive && u.x === x && u.y === y
            );
            if (occupied) continue;

            range.push({ x, y, cost: distance });
        }
    }

    return range;
}

/**
 * Get attack range tiles for a unit
 */
function getAttackRange(unit, map) {
    const range = [];
    const weaponRange = unit.weapon?.range || 5;

    for (let y = unit.y - weaponRange; y <= unit.y + weaponRange; y++) {
        for (let x = unit.x - weaponRange; x <= unit.x + weaponRange; x++) {
            if (!Utils.inBounds(x, y, map.width, map.height)) continue;
            if (x === unit.x && y === unit.y) continue;

            const distance = Utils.chebyshevDistance(unit.x, unit.y, x, y);
            if (distance > weaponRange) continue;

            // Check line of sight
            if (hasLineOfSight(unit.x, unit.y, x, y, map)) {
                range.push({ x, y, distance });
            }
        }
    }

    return range;
}

/**
 * Check line of sight between two points
 */
function hasLineOfSight(x1, y1, x2, y2, map) {
    const line = Utils.getLine(x1, y1, x2, y2);

    // Skip first and last tile (start and end positions)
    for (let i = 1; i < line.length - 1; i++) {
        const tile = map.getTile(line[i].x, line[i].y);
        if (tile === CONFIG.TILES.WALL || tile === CONFIG.TILES.COVER_HIGH) {
            return false;
        }
    }

    return true;
}

/**
 * Get visible tiles for a unit (for fog of war)
 */
function getVisibleTiles(unit, map) {
    const visible = [];
    const range = unit.sightRange;

    for (let y = unit.y - range; y <= unit.y + range; y++) {
        for (let x = unit.x - range; x <= unit.x + range; x++) {
            if (!Utils.inBounds(x, y, map.width, map.height)) continue;

            const distance = Utils.chebyshevDistance(unit.x, unit.y, x, y);
            if (distance > range) continue;

            if (hasLineOfSight(unit.x, unit.y, x, y, map)) {
                visible.push({ x, y });
            }
        }
    }

    return visible;
}

/**
 * Clone a unit for saving
 */
function cloneUnit(unit) {
    return Utils.deepClone(unit);
}

/**
 * Restore unit from save data
 */
function restoreUnit(saveData) {
    const classData = LIBRARIAN_CLASSES[saveData.class];
    return {
        ...saveData,
        classData: classData,
    };
}

// Export functions
window.UnitManager = {
    createLibrarian,
    createStartingSquad,
    getUnitRank,
    checkLevelUp,
    applyLevelUp,
    resetUnitTurn,
    canUnitAct,
    spendAP,
    damageUnit,
    healUnit,
    applyStatus,
    clearStatus,
    setOverwatch,
    clearOverwatch,
    getEffectiveAccuracy,
    calculateDamage,
    getMovementRange,
    getAttackRange,
    hasLineOfSight,
    getVisibleTiles,
    cloneUnit,
    restoreUnit,
};
