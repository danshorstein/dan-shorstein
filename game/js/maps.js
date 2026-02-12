/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Map Generation and Management System
 */

/**
 * Map class for tactical combat
 */
class TacticalMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.explored = [];
        this.visible = [];
        this.spawnPoints = { player: [], enemy: [] };
        this.exitPoints = [];
        this.name = 'Unknown Location';
        this.description = '';

        // Initialize tile arrays
        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            this.explored[y] = [];
            this.visible[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = CONFIG.TILES.FLOOR;
                this.explored[y][x] = false;
                this.visible[y][x] = false;
            }
        }
    }

    /**
     * Get tile at position
     */
    getTile(x, y) {
        if (!Utils.inBounds(x, y, this.width, this.height)) {
            return CONFIG.TILES.WALL;
        }
        return this.tiles[y][x];
    }

    /**
     * Set tile at position
     */
    setTile(x, y, tileType) {
        if (Utils.inBounds(x, y, this.width, this.height)) {
            this.tiles[y][x] = tileType;
        }
    }

    /**
     * Check if tile is walkable
     */
    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        return tile !== CONFIG.TILES.WALL && tile !== CONFIG.TILES.WATER;
    }

    /**
     * Check if tile blocks sight
     */
    blocksSight(x, y) {
        const tile = this.getTile(x, y);
        return tile === CONFIG.TILES.WALL || tile === CONFIG.TILES.COVER_HIGH;
    }

    /**
     * Check if tile provides cover
     */
    providesCover(x, y) {
        const tile = this.getTile(x, y);
        return tile === CONFIG.TILES.COVER_LOW ||
               tile === CONFIG.TILES.COVER_HIGH ||
               tile === CONFIG.TILES.DESK;
    }

    /**
     * Get cover value at tile
     */
    getCoverValue(x, y) {
        const tile = this.getTile(x, y);
        switch (tile) {
            case CONFIG.TILES.COVER_LOW:
            case CONFIG.TILES.DESK:
                return 15;
            case CONFIG.TILES.COVER_HIGH:
                return 30;
            default:
                return 0;
        }
    }

    /**
     * Update visibility based on unit positions
     */
    updateVisibility(units) {
        // Reset visibility
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.visible[y][x] = false;
            }
        }

        // Calculate visibility from friendly units
        const friendlyUnits = units.filter(u => u.team === 'player' && u.isAlive);

        for (const unit of friendlyUnits) {
            const visibleTiles = UnitManager.getVisibleTiles(unit, this);
            for (const tile of visibleTiles) {
                this.visible[tile.y][tile.x] = true;
                this.explored[tile.y][tile.x] = true;
            }
        }
    }

    /**
     * Check if position is visible
     */
    isVisible(x, y) {
        if (!Utils.inBounds(x, y, this.width, this.height)) return false;
        return this.visible[y][x];
    }

    /**
     * Check if position was explored
     */
    isExplored(x, y) {
        if (!Utils.inBounds(x, y, this.width, this.height)) return false;
        return this.explored[y][x];
    }

    /**
     * Get spawn points for a team
     */
    getSpawnPoints(team) {
        return this.spawnPoints[team] || [];
    }

    /**
     * Clone map for saving
     */
    toSaveData() {
        return {
            width: this.width,
            height: this.height,
            tiles: Utils.deepClone(this.tiles),
            explored: Utils.deepClone(this.explored),
            name: this.name,
            description: this.description,
            spawnPoints: Utils.deepClone(this.spawnPoints),
            exitPoints: Utils.deepClone(this.exitPoints),
        };
    }

    /**
     * Restore map from save data
     */
    static fromSaveData(data) {
        const map = new TacticalMap(data.width, data.height);
        map.tiles = data.tiles;
        map.explored = data.explored;
        map.name = data.name;
        map.description = data.description;
        map.spawnPoints = data.spawnPoints;
        map.exitPoints = data.exitPoints;
        return map;
    }
}

/**
 * Map Generator
 */
const MapGenerator = {
    /**
     * Generate a map based on location type
     */
    generateMap(locationType, missionType) {
        const width = CONFIG.MAP_WIDTH;
        const height = CONFIG.MAP_HEIGHT;

        // Choose generation method based on location
        switch (locationType) {
            case 'reading_room':
                return this.generateReadingRoom(width, height);
            case 'children_section':
                return this.generateChildrenSection(width, height);
            case 'reference_wing':
                return this.generateReferenceWing(width, height);
            case 'archive':
                return this.generateArchive(width, height);
            case 'computer_lab':
                return this.generateComputerLab(width, height);
            case 'basement':
                return this.generateBasement(width, height);
            default:
                return this.generateReadingRoom(width, height);
        }
    },

    /**
     * Main Reading Room - open area with scattered tables
     */
    generateReadingRoom(width, height) {
        const map = new TacticalMap(width, height);
        map.name = 'Main Reading Room';
        map.description = 'The heart of the library - spacious with reading tables';

        // Border walls
        this.addBorderWalls(map);

        // Add reading tables (clusters of desks)
        const tableCount = Utils.randomInt(4, 6);
        for (let i = 0; i < tableCount; i++) {
            const tableX = Utils.randomInt(4, width - 6);
            const tableY = Utils.randomInt(4, height - 6);
            this.addTable(map, tableX, tableY);
        }

        // Add bookshelves along walls
        this.addWallBookshelves(map, 2);

        // Add some scattered low cover
        this.addRandomCover(map, 8, CONFIG.TILES.COVER_LOW);

        // Spawn points
        this.setSpawnPoints(map);

        return map;
    },

    /**
     * Children's Section - colorful with irregular layout
     */
    generateChildrenSection(width, height) {
        const map = new TacticalMap(width, height);
        map.name = "Children's Section";
        map.description = 'Colorful and chaotic - watch out for surprise attacks';

        this.addBorderWalls(map);

        // Add reading nooks (small enclosed areas)
        const nookCount = Utils.randomInt(3, 5);
        for (let i = 0; i < nookCount; i++) {
            const nookX = Utils.randomInt(3, width - 6);
            const nookY = Utils.randomInt(3, height - 6);
            this.addReadingNook(map, nookX, nookY);
        }

        // Add colorful (low) bookshelves scattered around
        this.addRandomCover(map, 12, CONFIG.TILES.COVER_LOW);

        // Add some bean bag chairs (desks for cover)
        this.addRandomCover(map, 6, CONFIG.TILES.DESK);

        this.setSpawnPoints(map);

        return map;
    },

    /**
     * Reference Wing - dense rows of bookshelves
     */
    generateReferenceWing(width, height) {
        const map = new TacticalMap(width, height);
        map.name = 'Reference Wing';
        map.description = 'Dense stacks with narrow corridors';

        this.addBorderWalls(map);

        // Add rows of tall bookshelves
        const rowSpacing = 4;
        for (let y = 3; y < height - 3; y += rowSpacing) {
            // Leave gaps for pathways
            for (let x = 4; x < width - 4; x++) {
                if (x % 6 !== 0) { // Leave periodic gaps
                    map.setTile(x, y, CONFIG.TILES.COVER_HIGH);
                }
            }
        }

        // Add some cross-shelves for variety
        this.addRandomCover(map, 4, CONFIG.TILES.COVER_LOW);

        // Add reference desks
        this.addRandomCover(map, 3, CONFIG.TILES.DESK);

        this.setSpawnPoints(map);

        return map;
    },

    /**
     * Periodicals Archive - narrow with file cabinets
     */
    generateArchive(width, height) {
        const map = new TacticalMap(width, height);
        map.name = 'Periodicals Archive';
        map.description = 'Dusty archives with filing cabinets';

        this.addBorderWalls(map);

        // Add filing cabinet rows (high cover)
        for (let y = 2; y < height - 2; y += 3) {
            for (let x = 3; x < width - 3; x += 5) {
                this.addFilingCabinet(map, x, y);
            }
        }

        // Add old desks
        this.addRandomCover(map, 5, CONFIG.TILES.DESK);

        // Add some low shelves
        this.addRandomCover(map, 4, CONFIG.TILES.COVER_LOW);

        this.setSpawnPoints(map);

        return map;
    },

    /**
     * Computer Lab - modern with computer desks
     */
    generateComputerLab(width, height) {
        const map = new TacticalMap(width, height);
        map.name = 'Computer Lab';
        map.description = 'Modern technology meets ancient books';

        this.addBorderWalls(map);

        // Add rows of computer desks
        for (let y = 3; y < height - 3; y += 4) {
            for (let x = 3; x < width - 3; x += 3) {
                map.setTile(x, y, CONFIG.TILES.DESK);
            }
        }

        // Add server racks (high cover) along back wall
        for (let x = width - 5; x < width - 2; x++) {
            for (let y = 3; y < height - 3; y += 2) {
                map.setTile(x, y, CONFIG.TILES.COVER_HIGH);
            }
        }

        // Add some printers (low cover)
        this.addRandomCover(map, 4, CONFIG.TILES.COVER_LOW);

        this.setSpawnPoints(map);

        return map;
    },

    /**
     * Basement Storage - maze-like with crates
     */
    generateBasement(width, height) {
        const map = new TacticalMap(width, height);
        map.name = 'Basement Storage';
        map.description = 'Dark and claustrophobic - perfect for ambushes';

        this.addBorderWalls(map);

        // Add maze-like walls
        this.addMazeWalls(map);

        // Add storage crates (mixed cover)
        this.addRandomCover(map, 10, CONFIG.TILES.COVER_LOW);
        this.addRandomCover(map, 6, CONFIG.TILES.COVER_HIGH);

        // Add old boxes (desks)
        this.addRandomCover(map, 5, CONFIG.TILES.DESK);

        this.setSpawnPoints(map);

        return map;
    },

    // Helper methods

    addBorderWalls(map) {
        for (let x = 0; x < map.width; x++) {
            map.setTile(x, 0, CONFIG.TILES.WALL);
            map.setTile(x, map.height - 1, CONFIG.TILES.WALL);
        }
        for (let y = 0; y < map.height; y++) {
            map.setTile(0, y, CONFIG.TILES.WALL);
            map.setTile(map.width - 1, y, CONFIG.TILES.WALL);
        }
    },

    addTable(map, x, y) {
        // 2x3 table made of desks
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 3; dx++) {
                if (Utils.inBounds(x + dx, y + dy, map.width, map.height)) {
                    map.setTile(x + dx, y + dy, CONFIG.TILES.DESK);
                }
            }
        }
    },

    addReadingNook(map, x, y) {
        // Small 3x3 enclosed area with one opening
        const opening = Utils.randomInt(0, 3);
        const walls = [
            { dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 },
            { dx: 0, dy: 1 },                   { dx: 2, dy: 1 },
            { dx: 0, dy: 2 }, { dx: 1, dy: 2 }, { dx: 2, dy: 2 },
        ];

        // Remove one wall section for opening
        walls.splice(opening * 2, 2);

        for (const wall of walls) {
            if (Utils.inBounds(x + wall.dx, y + wall.dy, map.width, map.height)) {
                map.setTile(x + wall.dx, y + wall.dy, CONFIG.TILES.COVER_LOW);
            }
        }
    },

    addFilingCabinet(map, x, y) {
        // 2x1 filing cabinet
        map.setTile(x, y, CONFIG.TILES.COVER_HIGH);
        if (Utils.inBounds(x + 1, y, map.width, map.height)) {
            map.setTile(x + 1, y, CONFIG.TILES.COVER_HIGH);
        }
    },

    addWallBookshelves(map, distance) {
        // Add bookshelves along walls
        for (let x = distance; x < map.width - distance; x += 3) {
            if (Utils.percentChance(60)) {
                map.setTile(x, distance, CONFIG.TILES.COVER_HIGH);
            }
            if (Utils.percentChance(60)) {
                map.setTile(x, map.height - distance - 1, CONFIG.TILES.COVER_HIGH);
            }
        }
    },

    addRandomCover(map, count, coverType) {
        let placed = 0;
        let attempts = 0;
        while (placed < count && attempts < 100) {
            const x = Utils.randomInt(2, map.width - 3);
            const y = Utils.randomInt(2, map.height - 3);

            if (map.getTile(x, y) === CONFIG.TILES.FLOOR) {
                map.setTile(x, y, coverType);
                placed++;
            }
            attempts++;
        }
    },

    addMazeWalls(map) {
        // Add some L-shaped wall sections
        const wallCount = Utils.randomInt(3, 5);
        for (let i = 0; i < wallCount; i++) {
            const x = Utils.randomInt(4, map.width - 6);
            const y = Utils.randomInt(4, map.height - 6);
            const horizontal = Utils.percentChance(50);
            const length = Utils.randomInt(2, 4);

            for (let j = 0; j < length; j++) {
                if (horizontal) {
                    if (Utils.inBounds(x + j, y, map.width, map.height)) {
                        map.setTile(x + j, y, CONFIG.TILES.WALL);
                    }
                } else {
                    if (Utils.inBounds(x, y + j, map.width, map.height)) {
                        map.setTile(x, y + j, CONFIG.TILES.WALL);
                    }
                }
            }
        }
    },

    setSpawnPoints(map) {
        // Player spawn points on left side
        map.spawnPoints.player = [];
        for (let y = 3; y < map.height - 3; y += 2) {
            for (let x = 2; x < 5; x++) {
                if (map.isWalkable(x, y)) {
                    map.spawnPoints.player.push({ x, y });
                }
            }
        }

        // Enemy spawn points on right side
        map.spawnPoints.enemy = [];
        for (let y = 3; y < map.height - 3; y += 2) {
            for (let x = map.width - 5; x < map.width - 2; x++) {
                if (map.isWalkable(x, y)) {
                    map.spawnPoints.enemy.push({ x, y });
                }
            }
        }

        // Exit points (for extraction missions)
        map.exitPoints = [
            { x: 1, y: Math.floor(map.height / 2) },
        ];
    },
};

/**
 * Mission Generator
 */
const MissionGenerator = {
    /**
     * Generate available missions for the current day
     */
    generateMissions(day, completedMissions) {
        const missions = [];
        const missionCount = Math.min(3, 1 + Math.floor(day / 3));

        // Available location types based on progression
        const locationTypes = ['reading_room', 'children_section'];
        if (day >= 3) locationTypes.push('reference_wing');
        if (day >= 5) locationTypes.push('archive');
        if (day >= 7) locationTypes.push('computer_lab');
        if (day >= 10) locationTypes.push('basement');

        // Available mission types
        const missionTypes = ['EXTERMINATION'];
        if (day >= 2) missionTypes.push('RETRIEVAL');
        if (day >= 4) missionTypes.push('RESCUE');
        if (day >= 6) missionTypes.push('DEFENSE');

        // Every 4 days, add a boss mission
        const shouldHaveBoss = day > 0 && day % 4 === 0;

        for (let i = 0; i < missionCount; i++) {
            const location = Utils.randomChoice(locationTypes);
            const locationData = this.getLocationData(location);

            let missionType, threat;

            if (shouldHaveBoss && i === 0) {
                missionType = 'BOSS';
                threat = 'boss';
            } else {
                missionType = Utils.randomChoice(missionTypes);
                threat = this.calculateThreat(day);
            }

            const typeData = MISSION_TYPES[missionType];

            const mission = {
                id: Utils.generateId(),
                type: missionType,
                typeData: typeData,
                locationType: location,
                location: locationData.name,
                description: typeData.description,
                objectives: typeData.objectiveText,
                threat: threat,
                day: day,
                urgent: Utils.percentChance(20) && day > 2,
                rewards: this.calculateRewards(threat, missionType),
                enemies: this.getExpectedEnemies(threat, missionType),
            };

            missions.push(mission);
        }

        return missions;
    },

    getLocationData(locationType) {
        const locations = {
            reading_room: { name: 'Main Reading Room', description: 'The heart of the library' },
            children_section: { name: "Children's Section", description: 'Colorful but dangerous' },
            reference_wing: { name: 'Reference Wing', description: 'Dense stacks of knowledge' },
            archive: { name: 'Periodicals Archive', description: 'Newspapers from ages past' },
            computer_lab: { name: 'Computer Lab', description: 'Where old meets new' },
            basement: { name: 'Basement Storage', description: 'Dark and full of surprises' },
        };
        return locations[locationType] || locations.reading_room;
    },

    calculateThreat(day) {
        if (day <= 2) return 'low';
        if (day <= 5) return Utils.randomChoice(['low', 'medium']);
        if (day <= 8) return Utils.randomChoice(['medium', 'high']);
        return Utils.randomChoice(['medium', 'high', 'high']);
    },

    calculateRewards(threat, missionType) {
        const baseFines = {
            low: Utils.randomInt(100, 200),
            medium: Utils.randomInt(200, 400),
            high: Utils.randomInt(400, 700),
            boss: Utils.randomInt(700, 1000),
        };

        const baseXP = {
            low: Utils.randomInt(30, 50),
            medium: Utils.randomInt(50, 80),
            high: Utils.randomInt(80, 120),
            boss: Utils.randomInt(120, 180),
        };

        return {
            fines: baseFines[threat],
            xp: baseXP[threat],
        };
    },

    getExpectedEnemies(threat, missionType) {
        const enemies = [];

        switch (threat) {
            case 'low':
                enemies.push('Romance Novels', 'Comic Books');
                break;
            case 'medium':
                enemies.push('Horror Books', 'Textbooks', 'Cookbooks');
                break;
            case 'high':
                enemies.push('Mystery Novels', 'Self-Help Books', 'Heavy Textbooks');
                break;
            case 'boss':
                enemies.push('Encyclopedia (Boss)', 'Various minions');
                break;
        }

        return enemies.join(', ');
    },

    /**
     * Create tactical mission data
     */
    createMissionInstance(mission, squad) {
        const map = MapGenerator.generateMap(mission.locationType, mission.type);
        const enemies = EnemyManager.createEnemySquad(
            mission.threat,
            mission.type,
            map.width,
            map.height
        );

        // Position player units at spawn points
        const playerSpawns = Utils.shuffle([...map.spawnPoints.player]);
        squad.forEach((unit, index) => {
            if (playerSpawns[index]) {
                unit.x = playerSpawns[index].x;
                unit.y = playerSpawns[index].y;
            } else {
                unit.x = 2 + index;
                unit.y = Math.floor(map.height / 2);
            }
            // Reset unit for mission
            unit.hp = unit.maxHP;
            unit.ap = unit.maxAP;
            unit.isAlive = true;
            unit.status = CONFIG.STATUS.NONE;
        });

        return {
            mission,
            map,
            playerUnits: squad,
            enemyUnits: enemies,
            turn: 1,
            phase: CONFIG.PHASE.PLAYER,
        };
    },
};

// Export
window.TacticalMap = TacticalMap;
window.MapGenerator = MapGenerator;
window.MissionGenerator = MissionGenerator;
