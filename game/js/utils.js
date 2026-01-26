/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Utility Functions
 */

const Utils = {
    /**
     * Generate a random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Roll damage within a range [min, max]
     */
    rollDamage(damageRange) {
        return this.randomInt(damageRange[0], damageRange[1]);
    },

    /**
     * Check if a percentage chance succeeds
     */
    percentChance(percent) {
        return Math.random() * 100 < percent;
    },

    /**
     * Calculate distance between two points (Euclidean)
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    /**
     * Calculate Manhattan distance
     */
    manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    },

    /**
     * Calculate Chebyshev distance (diagonal movement allowed)
     */
    chebyshevDistance(x1, y1, x2, y2) {
        return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    },

    /**
     * Check if a point is within range
     */
    inRange(x1, y1, x2, y2, range) {
        return this.chebyshevDistance(x1, y1, x2, y2) <= range;
    },

    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * Generate a unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Generate a random librarian name
     */
    generateLibrarianName() {
        const firstName = FIRST_NAMES[this.randomInt(0, FIRST_NAMES.length - 1)];
        const lastName = LAST_NAMES[this.randomInt(0, LAST_NAMES.length - 1)];
        return `${firstName} ${lastName}`;
    },

    /**
     * Shuffle an array (Fisher-Yates)
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    /**
     * Pick random item from array
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Pick weighted random item
     */
    weightedChoice(items, weights) {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        return items[items.length - 1];
    },

    /**
     * Deep clone an object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Get line of sight tiles between two points (Bresenham's algorithm)
     */
    getLine(x1, y1, x2, y2) {
        const tiles = [];
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (true) {
            tiles.push({ x, y });

            if (x === x2 && y === y2) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        return tiles;
    },

    /**
     * Get tiles in a circle around a point
     */
    getCircleTiles(centerX, centerY, radius) {
        const tiles = [];
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (this.chebyshevDistance(centerX, centerY, x, y) <= radius) {
                    tiles.push({ x, y });
                }
            }
        }
        return tiles;
    },

    /**
     * Get adjacent tiles (8 directions)
     */
    getAdjacentTiles(x, y) {
        return [
            { x: x - 1, y: y - 1 },
            { x: x, y: y - 1 },
            { x: x + 1, y: y - 1 },
            { x: x - 1, y: y },
            { x: x + 1, y: y },
            { x: x - 1, y: y + 1 },
            { x: x, y: y + 1 },
            { x: x + 1, y: y + 1 },
        ];
    },

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * Wait for a specified time (for animations)
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Ease in out quad function for smooth animations
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    /**
     * Ease out quad function
     */
    easeOutQuad(t) {
        return t * (2 - t);
    },

    /**
     * Create animation frame loop
     */
    animate(duration, callback) {
        return new Promise(resolve => {
            const start = performance.now();

            function frame(time) {
                const elapsed = time - start;
                const progress = Math.min(elapsed / duration, 1);

                callback(progress);

                if (progress < 1) {
                    requestAnimationFrame(frame);
                } else {
                    resolve();
                }
            }

            requestAnimationFrame(frame);
        });
    },

    /**
     * Get direction from one point to another
     */
    getDirection(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        if (dx === 0 && dy < 0) return 'north';
        if (dx > 0 && dy < 0) return 'northeast';
        if (dx > 0 && dy === 0) return 'east';
        if (dx > 0 && dy > 0) return 'southeast';
        if (dx === 0 && dy > 0) return 'south';
        if (dx < 0 && dy > 0) return 'southwest';
        if (dx < 0 && dy === 0) return 'west';
        if (dx < 0 && dy < 0) return 'northwest';
        return 'none';
    },

    /**
     * Check if point is in bounds of map
     */
    inBounds(x, y, width, height) {
        return x >= 0 && x < width && y >= 0 && y < height;
    },

    /**
     * Get angle between two points in degrees
     */
    getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    },

    /**
     * Calculate cover bonus between attacker and target
     */
    calculateCoverBonus(attacker, target, map) {
        // Check for cover between attacker and target
        const direction = this.getDirection(attacker.x, attacker.y, target.x, target.y);

        // Check tiles adjacent to target for cover
        const coverTiles = this.getAdjacentTiles(target.x, target.y);
        let bestCover = 0;

        for (const tile of coverTiles) {
            if (!this.inBounds(tile.x, tile.y, map.width, map.height)) continue;

            const tileType = map.getTile(tile.x, tile.y);
            let coverValue = 0;

            if (tileType === CONFIG.TILES.COVER_LOW || tileType === CONFIG.TILES.DESK) {
                coverValue = 15; // Half cover
            } else if (tileType === CONFIG.TILES.COVER_HIGH || tileType === CONFIG.TILES.WALL) {
                coverValue = 30; // Full cover
            }

            // Cover only applies if it's between attacker and target
            if (coverValue > 0) {
                const attackerToTile = this.getDirection(attacker.x, attacker.y, tile.x, tile.y);
                const attackerToTarget = this.getDirection(attacker.x, attacker.y, target.x, target.y);

                // Simplified: cover applies if the cover tile is roughly in the same direction
                if (this.isSameGeneralDirection(attackerToTile, attackerToTarget)) {
                    bestCover = Math.max(bestCover, coverValue);
                }
            }
        }

        return bestCover;
    },

    /**
     * Check if two directions are similar
     */
    isSameGeneralDirection(dir1, dir2) {
        const directionGroups = {
            north: ['north', 'northeast', 'northwest'],
            south: ['south', 'southeast', 'southwest'],
            east: ['east', 'northeast', 'southeast'],
            west: ['west', 'northwest', 'southwest'],
        };

        for (const group of Object.values(directionGroups)) {
            if (group.includes(dir1) && group.includes(dir2)) {
                return true;
            }
        }
        return dir1 === dir2;
    },

    /**
     * Check if target is flanked (no cover from attacker's direction)
     */
    isFlanked(attacker, target, map, allUnits) {
        // Check if there's an ally on the opposite side
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;

        // Normalize direction
        const normDx = dx === 0 ? 0 : dx / Math.abs(dx);
        const normDy = dy === 0 ? 0 : dy / Math.abs(dy);

        // Check opposite side
        const oppositeX = target.x + normDx;
        const oppositeY = target.y + normDy;

        for (const unit of allUnits) {
            if (unit.team === attacker.team && unit !== attacker &&
                unit.x === oppositeX && unit.y === oppositeY && unit.hp > 0) {
                return true;
            }
        }

        return false;
    },

    /**
     * Local storage helpers
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save to storage:', e);
            return false;
        }
    },

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load from storage:', e);
            return null;
        }
    },

    clearStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Failed to clear storage:', e);
            return false;
        }
    },
};

// Make Utils globally available
window.Utils = Utils;
