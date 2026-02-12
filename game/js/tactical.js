/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Tactical Combat Layer
 */

const Tactical = {
    // Current mission state
    missionData: null,
    map: null,
    playerUnits: [],
    enemyUnits: [],

    // Turn management
    turn: 1,
    phase: CONFIG.PHASE.PLAYER,

    // Selection state
    selectedUnit: null,
    actionMode: CONFIG.ACTION_MODE.NONE,

    // Results tracking
    missionResults: {
        kills: 0,
        fines: 0,
        casualties: 0,
        turns: 0,
        squad: [],
    },

    // Animation/update loop
    animationFrame: null,
    isProcessing: false,

    /**
     * Initialize tactical combat
     */
    async init(missionData) {
        this.missionData = missionData;
        this.map = missionData.map;
        this.playerUnits = missionData.playerUnits;
        this.enemyUnits = missionData.enemyUnits;
        this.turn = missionData.turn || 1;
        this.phase = CONFIG.PHASE.PLAYER;

        // Reset results
        this.missionResults = {
            kills: 0,
            fines: 0,
            casualties: 0,
            turns: 0,
            squad: this.playerUnits.map(u => ({
                id: u.id,
                name: u.name,
                icon: u.icon,
                isAlive: true,
                wasWounded: false,
                xpGained: 0,
                killsGained: 0,
            })),
        };

        // Initialize renderer
        Renderer.init('game-canvas');
        Renderer.setMapSize(this.map.width, this.map.height);
        Renderer.clear();

        // Set up event listeners
        this.setupEventListeners();

        // Initial visibility
        this.map.updateVisibility(this.playerUnits);

        // Select first unit
        if (this.playerUnits.length > 0) {
            this.selectUnit(this.playerUnits[0]);
        }

        // Update UI
        UI.clearCombatLog();
        UI.addCombatLog(`Mission Start: ${this.missionData.mission.typeData.name}`, 'info');
        UI.addCombatLog(`Objective: ${this.missionData.mission.objectives}`, 'info');
        this.updateUI();

        // Start render loop
        this.startRenderLoop();

        // Play turn start sound
        AudioSystem.playSound('turn_start');
    },

    /**
     * Start the render loop
     */
    startRenderLoop() {
        const render = () => {
            this.render();
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    },

    /**
     * Stop the render loop
     */
    stopRenderLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    },

    /**
     * Main render function
     */
    render() {
        Renderer.render({
            map: this.map,
            playerUnits: this.playerUnits,
            enemyUnits: this.enemyUnits,
            turn: this.turn,
            phase: this.phase,
        });
    },

    /**
     * Set up canvas event listeners
     */
    setupEventListeners() {
        const canvas = Renderer.canvas;

        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('click', (e) => this.handleClick(e));
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    },

    /**
     * Handle mouse movement
     */
    handleMouseMove(e) {
        const rect = Renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const tile = Renderer.screenToTile(x, y);

        if (!Utils.inBounds(tile.x, tile.y, this.map.width, this.map.height)) {
            Renderer.setHoveredTile(null);
            Renderer.setPathPreview([]);
            return;
        }

        Renderer.setHoveredTile(tile);

        // Update path preview for move mode
        if (this.actionMode === CONFIG.ACTION_MODE.MOVE && this.selectedUnit) {
            const path = Pathfinding.findPath(
                this.selectedUnit.x, this.selectedUnit.y,
                tile.x, tile.y,
                this.map,
                [...this.playerUnits, ...this.enemyUnits],
                this.selectedUnit.id
            );

            if (path && path.length > 1) {
                const cost = path.length - 1;
                if (cost <= this.selectedUnit.ap) {
                    Renderer.setPathPreview(path);
                } else {
                    Renderer.setPathPreview([]);
                }
            } else {
                Renderer.setPathPreview([]);
            }
        }

        // Show tooltip for units
        const unitAtTile = this.getUnitAtTile(tile.x, tile.y);
        if (unitAtTile && this.map.isVisible(tile.x, tile.y)) {
            const tooltipText = `${unitAtTile.name}\nHP: ${unitAtTile.hp}/${unitAtTile.maxHP}`;
            UI.showTooltip(e.clientX, e.clientY, tooltipText);
        } else {
            UI.hideTooltip();
        }
    },

    /**
     * Handle left click
     */
    async handleClick(e) {
        if (this.isProcessing || this.phase !== CONFIG.PHASE.PLAYER) return;

        const rect = Renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const tile = Renderer.screenToTile(x, y);

        if (!Utils.inBounds(tile.x, tile.y, this.map.width, this.map.height)) return;

        const unitAtTile = this.getUnitAtTile(tile.x, tile.y);

        // Handle based on action mode
        switch (this.actionMode) {
            case CONFIG.ACTION_MODE.MOVE:
                if (!this.selectedUnit) break;
                if (unitAtTile) {
                    // Clicked on a unit
                    if (unitAtTile.team === 'player') {
                        this.selectUnit(unitAtTile);
                    }
                } else {
                    // Try to move
                    await this.executeMove(tile.x, tile.y);
                }
                break;

            case CONFIG.ACTION_MODE.ATTACK:
                if (!this.selectedUnit) break;
                if (unitAtTile && unitAtTile.team === 'enemy') {
                    await this.executeAttack(unitAtTile);
                }
                break;

            case CONFIG.ACTION_MODE.SPECIAL:
                if (!this.selectedUnit) break;
                await this.executeSpecial(tile, unitAtTile);
                break;

            case CONFIG.ACTION_MODE.OVERWATCH:
                if (!this.selectedUnit) break;
                this.executeOverwatch();
                break;

            default:
                // No action mode - select unit
                if (unitAtTile && unitAtTile.team === 'player') {
                    this.selectUnit(unitAtTile);
                }
        }

        this.updateUI();
    },

    /**
     * Handle right click (cancel/deselect)
     */
    handleRightClick(e) {
        this.setActionMode(CONFIG.ACTION_MODE.NONE);
        Renderer.setMovementRange([]);
        Renderer.setAttackRange([]);
        Renderer.setPathPreview([]);
    },

    /**
     * Select a unit
     */
    selectUnit(unit) {
        this.selectedUnit = unit;
        Renderer.setSelectedUnit(unit);
        UI.updateUnitPanel(unit);

        AudioSystem.playSound('select');

        // Default to move mode if unit has AP
        if (unit.ap >= CONFIG.MOVE_COST) {
            this.setActionMode(CONFIG.ACTION_MODE.MOVE);
        } else {
            this.setActionMode(CONFIG.ACTION_MODE.NONE);
        }
    },

    /**
     * Cycle to next unit
     */
    cycleUnit() {
        const aliveUnits = this.playerUnits.filter(u => u.isAlive && u.ap > 0);
        if (aliveUnits.length === 0) return;

        const currentIndex = aliveUnits.findIndex(u => u.id === this.selectedUnit?.id);
        const nextIndex = (currentIndex + 1) % aliveUnits.length;

        this.selectUnit(aliveUnits[nextIndex]);
    },

    /**
     * Set action mode
     */
    setActionMode(mode) {
        this.actionMode = mode;
        UI.setActiveAction(mode);

        Renderer.setMovementRange([]);
        Renderer.setAttackRange([]);
        Renderer.setPathPreview([]);

        if (!this.selectedUnit) return;

        switch (mode) {
            case CONFIG.ACTION_MODE.MOVE:
                const moveRange = Pathfinding.getReachableTiles(
                    this.selectedUnit.x,
                    this.selectedUnit.y,
                    Math.floor(this.selectedUnit.ap / CONFIG.MOVE_COST),
                    this.map,
                    [...this.playerUnits, ...this.enemyUnits],
                    this.selectedUnit.id
                );
                Renderer.setMovementRange(moveRange);
                break;

            case CONFIG.ACTION_MODE.ATTACK:
                const attackRange = Pathfinding.getAttackableTiles(
                    this.selectedUnit.x,
                    this.selectedUnit.y,
                    this.selectedUnit.weapon.range,
                    this.map
                );
                Renderer.setAttackRange(attackRange);
                break;

            case CONFIG.ACTION_MODE.SPECIAL:
                if (this.selectedUnit.special && this.selectedUnit.special.range) {
                    const specialRange = Pathfinding.getAttackableTiles(
                        this.selectedUnit.x,
                        this.selectedUnit.y,
                        this.selectedUnit.special.range,
                        this.map
                    );
                    Renderer.setAttackRange(specialRange);
                }
                break;
        }
    },

    /**
     * Execute movement
     */
    async executeMove(targetX, targetY) {
        if (!this.selectedUnit) return;

        const path = Pathfinding.findPath(
            this.selectedUnit.x, this.selectedUnit.y,
            targetX, targetY,
            this.map,
            [...this.playerUnits, ...this.enemyUnits],
            this.selectedUnit.id
        );

        if (!path || path.length <= 1) return;

        const cost = path.length - 1;
        if (cost > this.selectedUnit.ap) {
            AudioSystem.playSound('error');
            UI.addCombatLog('Not enough AP to move there', 'warning');
            return;
        }

        this.isProcessing = true;

        const result = await Combat.moveUnit(
            this.selectedUnit,
            path,
            this.map,
            [...this.playerUnits, ...this.enemyUnits]
        );

        if (result.interrupted) {
            UI.addCombatLog(result.message, 'warning');
        }

        // Update visibility
        this.map.updateVisibility(this.playerUnits);

        // Check for overwatch casualties
        if (!this.selectedUnit.isAlive) {
            this.handleUnitDeath(this.selectedUnit);
            this.selectedUnit = null;
        }

        this.isProcessing = false;
        this.setActionMode(CONFIG.ACTION_MODE.MOVE);
        this.checkMissionEnd();
    },

    /**
     * Execute attack
     */
    async executeAttack(target) {
        if (!this.selectedUnit || !target) return;

        this.isProcessing = true;

        const result = await Combat.attack(
            this.selectedUnit,
            target,
            this.map,
            [...this.playerUnits, ...this.enemyUnits]
        );

        UI.addCombatLog(result.message, result.hit ? 'damage' : 'info');

        // Process effects
        for (const effect of result.effects) {
            if (effect.type === 'xp') {
                const squadMember = this.missionResults.squad.find(s => s.id === this.selectedUnit.id);
                if (squadMember) {
                    squadMember.xpGained += effect.amount;
                }
            }
            if (effect.type === 'fines') {
                this.missionResults.fines += effect.amount;
            }
        }

        if (result.killed) {
            this.handleUnitDeath(target);
            this.missionResults.kills++;
        }

        this.isProcessing = false;
        this.updateUI();
        this.setActionMode(CONFIG.ACTION_MODE.ATTACK);
        this.checkMissionEnd();
    },

    /**
     * Execute special ability
     */
    async executeSpecial(tile, target) {
        if (!this.selectedUnit) return;

        this.isProcessing = true;

        const result = await Combat.useSpecial(
            this.selectedUnit,
            target,
            this.map,
            [...this.playerUnits, ...this.enemyUnits]
        );

        UI.addCombatLog(result.message, result.success ? 'info' : 'warning');

        this.isProcessing = false;
        this.updateUI();
        this.setActionMode(CONFIG.ACTION_MODE.NONE);
    },

    /**
     * Execute overwatch
     */
    executeOverwatch() {
        if (!this.selectedUnit) return;

        const result = Combat.setOverwatch(this.selectedUnit);

        UI.addCombatLog(result.message, 'info');
        this.updateUI();
        this.setActionMode(CONFIG.ACTION_MODE.NONE);
    },

    /**
     * Handle unit death
     */
    handleUnitDeath(unit) {
        unit.isAlive = false;

        if (unit.team === 'player') {
            this.missionResults.casualties++;
            const squadMember = this.missionResults.squad.find(s => s.id === unit.id);
            if (squadMember) {
                squadMember.isAlive = false;
            }
            UI.addCombatLog(`${unit.name} has fallen!`, 'damage');
        } else {
            UI.addCombatLog(`${unit.name} neutralized!`, 'info');

            // Award kill to attacker if tracked
            if (this.selectedUnit) {
                const squadMember = this.missionResults.squad.find(s => s.id === this.selectedUnit.id);
                if (squadMember) {
                    squadMember.killsGained++;
                }
            }
        }
    },

    /**
     * End player turn
     */
    async endTurn() {
        if (this.phase !== CONFIG.PHASE.PLAYER || this.isProcessing) return;

        UI.addCombatLog('--- End of Turn ---', 'info');

        // Clear player overwatch (it lasted the enemy turn)
        // Actually overwatch stays until triggered, so don't clear here

        // Switch to enemy phase
        this.phase = CONFIG.PHASE.ENEMY;
        this.updateUI();

        // Process enemy turn
        await this.processEnemyTurn();

        // Advance turn counter
        this.turn++;
        this.missionResults.turns = this.turn;

        // Reset player units
        this.playerUnits.forEach(unit => {
            if (unit.isAlive) {
                UnitManager.resetUnitTurn(unit);
            }
        });

        // Back to player phase
        this.phase = CONFIG.PHASE.PLAYER;

        // Select first available unit
        const availableUnit = this.playerUnits.find(u => u.isAlive && u.ap > 0);
        if (availableUnit) {
            this.selectUnit(availableUnit);
        }

        AudioSystem.playSound('turn_start');
        UI.addCombatLog(`=== Turn ${this.turn} ===`, 'info');
        this.updateUI();

        this.checkMissionEnd();

        // Check turn limit
        if (this.turn >= CONFIG.MAX_TURNS_PER_MISSION) {
            this.endMission(false, 'Mission timed out!');
        }
    },

    /**
     * Process enemy turn
     */
    async processEnemyTurn() {
        this.isProcessing = true;

        const results = await AI.executeTurn(
            this.enemyUnits,
            this.playerUnits,
            this.map
        );

        for (const result of results) {
            if (result.message) {
                const type = result.action === 'attack' && result.result?.hit ? 'damage' : 'warning';
                UI.addCombatLog(result.message, type);
            }

            // Handle spawns from Encyclopedia
            if (result.result?.effects) {
                for (const effect of result.result.effects) {
                    if (effect.type === 'spawn' && effect.enemy) {
                        this.enemyUnits.push(effect.enemy);
                        UI.addCombatLog(`A ${effect.enemy.name} appears!`, 'warning');
                    }
                }
            }

            // Update visibility after enemy actions
            this.map.updateVisibility(this.playerUnits);
            this.render();

            await Utils.wait(CONFIG.AI_MOVE_DELAY);
        }

        // Check for player casualties
        this.playerUnits.forEach(unit => {
            if (!unit.isAlive) {
                const squadMember = this.missionResults.squad.find(s => s.id === unit.id);
                if (squadMember && squadMember.isAlive) {
                    squadMember.isAlive = false;
                    this.missionResults.casualties++;
                }
            }
        });

        this.isProcessing = false;
    },

    /**
     * Check if mission should end
     */
    checkMissionEnd() {
        // Check victory: all enemies dead
        const aliveEnemies = this.enemyUnits.filter(e => e.isAlive);
        if (aliveEnemies.length === 0) {
            this.endMission(true, 'All enemies neutralized!');
            return;
        }

        // Check defeat: all players dead
        const alivePlayers = this.playerUnits.filter(p => p.isAlive);
        if (alivePlayers.length === 0) {
            this.endMission(false, 'Squad wiped out!');
            return;
        }
    },

    /**
     * End the mission
     */
    endMission(victory, message) {
        this.stopRenderLoop();

        UI.addCombatLog(message, victory ? 'info' : 'damage');

        // Calculate results
        const results = {
            victory: victory,
            kills: this.missionResults.kills,
            fines: this.missionResults.fines,
            casualties: this.missionResults.casualties,
            turns: this.turn,
            squad: this.missionResults.squad.map(s => {
                const unit = this.playerUnits.find(u => u.id === s.id);
                return {
                    ...s,
                    wasWounded: unit && unit.isAlive && unit.hp < unit.maxHP * 0.5,
                    promoted: false, // Will be set by Strategic.completeMission
                };
            }),
        };

        // Give bonus XP to survivors
        if (victory) {
            const xpBonus = 30;
            results.squad.forEach(s => {
                if (s.isAlive) {
                    s.xpGained += xpBonus;
                }
            });
        }

        this.missionResults = results;

        // Show results
        UI.showResults(results);

        if (victory) {
            AudioSystem.playSound('victory');
        } else {
            AudioSystem.playSound('defeat');
        }
    },

    /**
     * Return to base after mission
     */
    returnToBase() {
        // Process results in strategic layer
        Strategic.completeMission(this.missionResults);

        // Reset tactical state
        this.cleanup();

        // Return to strategic view
        UI.showScreen('strategic-screen');
        Strategic.updateUI();
    },

    /**
     * Abort mission
     */
    abortMission() {
        this.endMission(false, 'Mission aborted!');
    },

    /**
     * Start mission (from briefing)
     */
    startMission() {
        const squad = Strategic.getDeployableSquad();

        if (squad.length === 0) {
            alert('No squad members available!');
            return;
        }

        // Create mission instance
        const missionInstance = MissionGenerator.createMissionInstance(
            Strategic.selectedMission,
            squad
        );

        // Show tactical screen
        UI.showScreen('tactical-screen');

        // Initialize tactical combat
        this.init(missionInstance);
    },

    /**
     * Get unit at tile position
     */
    getUnitAtTile(x, y) {
        const player = this.playerUnits.find(u => u.isAlive && u.x === x && u.y === y);
        if (player) return player;

        const enemy = this.enemyUnits.find(u => u.isAlive && u.x === x && u.y === y);
        if (enemy && (this.map.isVisible(x, y) || !enemy.isHidden)) {
            return enemy;
        }

        return null;
    },

    /**
     * Update UI
     */
    updateUI() {
        UI.updateTactical({
            turn: this.turn,
            phase: this.phase,
            playerUnits: this.playerUnits,
            enemyUnits: this.enemyUnits,
        });

        if (this.selectedUnit) {
            UI.updateUnitPanel(this.selectedUnit);
        }
    },

    /**
     * Clean up tactical state
     */
    cleanup() {
        this.stopRenderLoop();
        this.missionData = null;
        this.map = null;
        this.playerUnits = [];
        this.enemyUnits = [];
        this.selectedUnit = null;
        this.actionMode = CONFIG.ACTION_MODE.NONE;
        this.turn = 1;
        this.phase = CONFIG.PHASE.PLAYER;
        Renderer.clear();
    },
};

// Export
window.Tactical = Tactical;
