/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * A* Pathfinding System
 */

const Pathfinding = {
    /**
     * Find path between two points using A*
     */
    findPath(startX, startY, endX, endY, map, units, ignoredUnitId = null) {
        // Check if end point is valid
        if (!map.isWalkable(endX, endY)) {
            return null;
        }

        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startKey = `${startX},${startY}`;
        const endKey = `${endX},${endY}`;

        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startX, startY, endX, endY));
        openSet.push({ x: startX, y: startY, f: fScore.get(startKey) });

        while (openSet.length > 0) {
            // Get node with lowest f score
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            const currentKey = `${current.x},${current.y}`;

            // Reached goal
            if (current.x === endX && current.y === endY) {
                return this.reconstructPath(cameFrom, current);
            }

            closedSet.add(currentKey);

            // Check neighbors
            const neighbors = this.getNeighbors(current.x, current.y, map);

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;

                if (closedSet.has(neighborKey)) continue;

                // Check if blocked by unit (except ignored unit and destination)
                if (neighbor.x !== endX || neighbor.y !== endY) {
                    const blockedByUnit = units.some(u =>
                        u.isAlive &&
                        u.id !== ignoredUnitId &&
                        u.x === neighbor.x &&
                        u.y === neighbor.y
                    );
                    if (blockedByUnit) continue;
                }

                const tentativeG = gScore.get(currentKey) + neighbor.cost;

                if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    const f = tentativeG + this.heuristic(neighbor.x, neighbor.y, endX, endY);
                    fScore.set(neighborKey, f);

                    // Add to open set if not already there
                    const inOpen = openSet.some(n => n.x === neighbor.x && n.y === neighbor.y);
                    if (!inOpen) {
                        openSet.push({ x: neighbor.x, y: neighbor.y, f });
                    }
                }
            }
        }

        // No path found
        return null;
    },

    /**
     * Get valid neighbor tiles
     */
    getNeighbors(x, y, map) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1, cost: 1 },   // N
            { dx: 1, dy: -1, cost: 1.4 }, // NE
            { dx: 1, dy: 0, cost: 1 },    // E
            { dx: 1, dy: 1, cost: 1.4 },  // SE
            { dx: 0, dy: 1, cost: 1 },    // S
            { dx: -1, dy: 1, cost: 1.4 }, // SW
            { dx: -1, dy: 0, cost: 1 },   // W
            { dx: -1, dy: -1, cost: 1.4 },// NW
        ];

        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (!Utils.inBounds(nx, ny, map.width, map.height)) continue;
            if (!map.isWalkable(nx, ny)) continue;

            // For diagonal movement, check if we can actually move diagonally
            if (dir.dx !== 0 && dir.dy !== 0) {
                if (!map.isWalkable(x + dir.dx, y) || !map.isWalkable(x, y + dir.dy)) {
                    continue;
                }
            }

            neighbors.push({ x: nx, y: ny, cost: dir.cost });
        }

        return neighbors;
    },

    /**
     * Heuristic function (Chebyshev distance for 8-directional movement)
     */
    heuristic(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        return Math.max(dx, dy) + 0.4 * Math.min(dx, dy);
    },

    /**
     * Reconstruct path from cameFrom map
     */
    reconstructPath(cameFrom, current) {
        const path = [{ x: current.x, y: current.y }];
        let currentKey = `${current.x},${current.y}`;

        while (cameFrom.has(currentKey)) {
            const node = cameFrom.get(currentKey);
            path.unshift({ x: node.x, y: node.y });
            currentKey = `${node.x},${node.y}`;
        }

        return path;
    },

    /**
     * Get all reachable tiles within movement range
     */
    getReachableTiles(startX, startY, maxCost, map, units, ignoredUnitId = null) {
        const reachable = [];
        const visited = new Set();
        const queue = [{ x: startX, y: startY, cost: 0 }];

        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.cost > 0) {
                reachable.push({
                    x: current.x,
                    y: current.y,
                    cost: Math.ceil(current.cost),
                });
            }

            if (current.cost >= maxCost) continue;

            const neighbors = this.getNeighbors(current.x, current.y, map);

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                const newCost = current.cost + neighbor.cost;

                if (visited.has(neighborKey)) continue;
                if (newCost > maxCost) continue;

                // Check if blocked by unit
                const blockedByUnit = units.some(u =>
                    u.isAlive &&
                    u.id !== ignoredUnitId &&
                    u.x === neighbor.x &&
                    u.y === neighbor.y
                );
                if (blockedByUnit) continue;

                visited.add(neighborKey);
                queue.push({ x: neighbor.x, y: neighbor.y, cost: newCost });
            }
        }

        return reachable;
    },

    /**
     * Get tiles within attack range that have line of sight
     */
    getAttackableTiles(startX, startY, range, map) {
        const attackable = [];

        for (let y = startY - range; y <= startY + range; y++) {
            for (let x = startX - range; x <= startX + range; x++) {
                if (!Utils.inBounds(x, y, map.width, map.height)) continue;
                if (x === startX && y === startY) continue;

                const distance = Utils.chebyshevDistance(startX, startY, x, y);
                if (distance > range) continue;

                // Check line of sight
                if (UnitManager.hasLineOfSight(startX, startY, x, y, map)) {
                    attackable.push({ x, y, distance });
                }
            }
        }

        return attackable;
    },

    /**
     * Find closest tile to target that is reachable
     */
    findClosestReachable(startX, startY, targetX, targetY, maxCost, map, units, ignoredUnitId = null) {
        const reachable = this.getReachableTiles(startX, startY, maxCost, map, units, ignoredUnitId);

        if (reachable.length === 0) return null;

        // Sort by distance to target
        reachable.sort((a, b) => {
            const distA = Utils.chebyshevDistance(a.x, a.y, targetX, targetY);
            const distB = Utils.chebyshevDistance(b.x, b.y, targetX, targetY);
            return distA - distB;
        });

        return reachable[0];
    },

    /**
     * Find best position to attack from
     */
    findAttackPosition(attackerX, attackerY, targetX, targetY, attackRange, maxMoveCost, map, units, ignoredUnitId = null) {
        const reachable = this.getReachableTiles(attackerX, attackerY, maxMoveCost, map, units, ignoredUnitId);

        // Add current position as option
        reachable.unshift({ x: attackerX, y: attackerY, cost: 0 });

        // Filter positions that can attack target
        const validPositions = reachable.filter(pos => {
            const distance = Utils.chebyshevDistance(pos.x, pos.y, targetX, targetY);
            if (distance > attackRange || distance === 0) return false;
            return UnitManager.hasLineOfSight(pos.x, pos.y, targetX, targetY, map);
        });

        if (validPositions.length === 0) return null;

        // Sort by: prefer cover, then closer to target, then less movement
        validPositions.sort((a, b) => {
            // Prefer positions with cover
            const coverA = this.getAdjacentCover(a.x, a.y, map);
            const coverB = this.getAdjacentCover(b.x, b.y, map);
            if (coverA !== coverB) return coverB - coverA;

            // Prefer positions that don't require movement
            if (a.cost !== b.cost) return a.cost - b.cost;

            // Prefer optimal range
            const optimalRange = Math.floor(attackRange / 2);
            const distA = Math.abs(Utils.chebyshevDistance(a.x, a.y, targetX, targetY) - optimalRange);
            const distB = Math.abs(Utils.chebyshevDistance(b.x, b.y, targetX, targetY) - optimalRange);
            return distA - distB;
        });

        return validPositions[0];
    },

    /**
     * Get cover value of best adjacent cover
     */
    getAdjacentCover(x, y, map) {
        let bestCover = 0;
        const adjacent = Utils.getAdjacentTiles(x, y);

        for (const tile of adjacent) {
            if (!Utils.inBounds(tile.x, tile.y, map.width, map.height)) continue;
            const coverValue = map.getCoverValue(tile.x, tile.y);
            bestCover = Math.max(bestCover, coverValue);
        }

        return bestCover;
    },

    /**
     * Find flanking position
     */
    findFlankingPosition(attackerX, attackerY, targetX, targetY, allyX, allyY, maxMoveCost, attackRange, map, units, ignoredUnitId) {
        const reachable = this.getReachableTiles(attackerX, attackerY, maxMoveCost, map, units, ignoredUnitId);

        // Filter positions that flank the target
        const flankingPositions = reachable.filter(pos => {
            const distance = Utils.chebyshevDistance(pos.x, pos.y, targetX, targetY);
            if (distance > attackRange || distance === 0) return false;
            if (!UnitManager.hasLineOfSight(pos.x, pos.y, targetX, targetY, map)) return false;

            // Check if this position flanks (opposite side from ally)
            const allyDir = Utils.getDirection(targetX, targetY, allyX, allyY);
            const posDir = Utils.getDirection(targetX, targetY, pos.x, pos.y);

            return this.isOppositeDirection(allyDir, posDir);
        });

        if (flankingPositions.length === 0) return null;

        // Sort by least movement cost
        flankingPositions.sort((a, b) => a.cost - b.cost);

        return flankingPositions[0];
    },

    /**
     * Check if two directions are opposite
     */
    isOppositeDirection(dir1, dir2) {
        const opposites = {
            north: 'south',
            south: 'north',
            east: 'west',
            west: 'east',
            northeast: 'southwest',
            northwest: 'southeast',
            southeast: 'northwest',
            southwest: 'northeast',
        };

        return opposites[dir1] === dir2;
    },
};

// Export
window.Pathfinding = Pathfinding;
