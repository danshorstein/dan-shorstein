/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Strategic Layer Management
 */

const Strategic = {
    // Current game state
    gameState: null,

    // Selected items
    selectedMission: null,
    selectedUnit: null,

    /**
     * Initialize strategic layer
     */
    init(gameState) {
        this.gameState = gameState;
        this.selectedMission = null;
        this.selectedUnit = null;

        // Generate initial missions if none
        if (!this.gameState.missions || this.gameState.missions.length === 0) {
            this.gameState.missions = MissionGenerator.generateMissions(
                this.gameState.day,
                this.gameState.completedMissions
            );
        }

        // Generate initial intel
        if (!this.gameState.intel || this.gameState.intel.length === 0) {
            this.gameState.intel = [
                { day: 1, message: 'Reports of animated books sighted in the main reading room.' },
                { day: 1, message: 'Library Command has been established. Good luck, commander.' },
            ];
        }

        this.updateUI();
    },

    /**
     * Update the strategic UI
     */
    updateUI() {
        UI.updateStrategic(this.gameState);
    },

    /**
     * Select a mission
     */
    selectMission(mission) {
        this.selectedMission = mission;

        // Get available squad members
        const availableSquad = this.gameState.squad.filter(u =>
            u.isAlive && u.daysToHeal === 0
        );

        if (availableSquad.length === 0) {
            alert('No squad members available for deployment!');
            return;
        }

        // Update briefing screen
        UI.updateBriefing(mission, this.gameState.squad);

        // Draw mini-map preview
        this.drawBriefingMap(mission);

        // Show briefing
        UI.showScreen('briefing-screen');
    },

    /**
     * Draw mission map preview
     */
    drawBriefingMap(mission) {
        const canvas = UI.elements.briefingMapCanvas;
        const ctx = canvas.getContext('2d');

        // Generate preview map
        const map = MapGenerator.generateMap(mission.locationType, mission.type);

        const tileSize = Math.min(
            Math.floor(canvas.width / map.width),
            Math.floor(canvas.height / map.height)
        );

        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.getTile(x, y);
                let color;

                switch (tile) {
                    case CONFIG.TILES.WALL:
                        color = '#1a1a2e';
                        break;
                    case CONFIG.TILES.COVER_HIGH:
                    case CONFIG.TILES.COVER_LOW:
                        color = '#4a3a2a';
                        break;
                    case CONFIG.TILES.DESK:
                        color = '#5a4a3a';
                        break;
                    default:
                        color = '#2a2a4a';
                }

                ctx.fillStyle = color;
                ctx.fillRect(x * tileSize, y * tileSize, tileSize - 1, tileSize - 1);
            }
        }

        // Draw spawn zones
        ctx.fillStyle = 'rgba(74, 159, 255, 0.3)';
        map.spawnPoints.player.forEach(p => {
            ctx.fillRect(p.x * tileSize, p.y * tileSize, tileSize, tileSize);
        });

        ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
        map.spawnPoints.enemy.forEach(p => {
            ctx.fillRect(p.x * tileSize, p.y * tileSize, tileSize, tileSize);
        });
    },

    /**
     * Select a unit for details
     */
    selectUnit(unit) {
        this.selectedUnit = unit;
        this.showUnitDetails(unit);
    },

    /**
     * Show unit details panel
     */
    showUnitDetails(unit) {
        const rank = UnitManager.getUnitRank(unit);

        UI.elements.unitDetails.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 3rem;">${unit.icon}</div>
                <h4 style="color: var(--color-accent);">${unit.name}</h4>
                <p style="color: var(--color-text-dim);">${unit.classData.name}</p>
                <p style="color: var(--color-primary);">${rank.name}</p>
            </div>

            <div class="unit-stat">
                <span>HP</span>
                <span>${unit.hp}/${unit.maxHP}</span>
            </div>
            <div class="unit-stat">
                <span>Accuracy</span>
                <span>${unit.accuracy}%</span>
            </div>
            <div class="unit-stat">
                <span>Dodge</span>
                <span>${unit.dodge}%</span>
            </div>
            <div class="unit-stat">
                <span>Armor</span>
                <span>${unit.armor}</span>
            </div>
            <div class="unit-stat">
                <span>XP</span>
                <span>${unit.xp}</span>
            </div>
            <div class="unit-stat">
                <span>Kills</span>
                <span>${unit.kills}</span>
            </div>
            <div class="unit-stat">
                <span>Missions</span>
                <span>${unit.missionsCompleted}</span>
            </div>

            <h4 style="margin-top: 15px; color: var(--color-primary);">Weapon</h4>
            <p>${unit.weapon.name}</p>
            <p style="color: var(--color-text-dim);">Damage: ${unit.weapon.damage[0]}-${unit.weapon.damage[1]}</p>
            <p style="color: var(--color-text-dim);">Range: ${unit.weapon.range}</p>

            <h4 style="margin-top: 15px; color: var(--color-primary);">Special</h4>
            <p>${unit.special.name}</p>
            <p style="color: var(--color-text-dim);">${unit.special.description}</p>

            ${!unit.isAlive ? '<p style="color: var(--color-danger); margin-top: 15px;">DECEASED</p>' : ''}
            ${unit.daysToHeal > 0 ? `<p style="color: var(--color-warning); margin-top: 15px;">Wounded - ${unit.daysToHeal} days to heal</p>` : ''}
        `;
    },

    /**
     * Open squad management screen
     */
    openSquadManagement() {
        this.updateSquadManagement();
        UI.showScreen('squad-screen');
    },

    /**
     * Update squad management display
     */
    updateSquadManagement() {
        // Available librarians
        UI.elements.availableLibrarians.innerHTML = '';

        this.gameState.squad.forEach(unit => {
            const div = document.createElement('div');
            div.className = 'squad-member';
            if (!unit.isAlive) div.classList.add('dead');
            if (unit.daysToHeal > 0) div.classList.add('wounded');

            const rank = UnitManager.getUnitRank(unit);

            div.innerHTML = `
                <div class="squad-portrait">${unit.icon}</div>
                <div class="squad-info">
                    <div class="squad-name">${unit.name}</div>
                    <div class="squad-class">${unit.classData.name} - ${rank.name}</div>
                    ${!unit.isAlive ? '<div style="color: var(--color-danger);">DECEASED</div>' : ''}
                    ${unit.daysToHeal > 0 ? `<div style="color: var(--color-warning);">Healing: ${unit.daysToHeal}d</div>` : ''}
                </div>
            `;

            div.addEventListener('click', () => {
                this.selectUnit(unit);
            });

            UI.elements.availableLibrarians.appendChild(div);
        });

        // Active squad (for mission)
        UI.elements.activeSquad.innerHTML = '';

        const activeSquad = this.gameState.squad.filter(u => u.isAlive && u.daysToHeal === 0);
        activeSquad.slice(0, 4).forEach(unit => {
            const div = document.createElement('div');
            div.className = 'squad-member';
            div.innerHTML = `
                <div class="squad-portrait">${unit.icon}</div>
                <div class="squad-info">
                    <div class="squad-name">${unit.name}</div>
                    <div class="squad-class">${unit.classData.name}</div>
                </div>
            `;
            UI.elements.activeSquad.appendChild(div);
        });

        // Clear unit details if none selected
        if (!this.selectedUnit) {
            UI.elements.unitDetails.innerHTML = '<p style="color: var(--color-text-dim);">Select a librarian to view details</p>';
        } else {
            this.showUnitDetails(this.selectedUnit);
        }
    },

    /**
     * Advance to next day
     */
    advanceDay() {
        this.gameState.day++;

        // Heal wounded units
        this.gameState.squad.forEach(unit => {
            if (unit.daysToHeal > 0) {
                unit.daysToHeal--;
                if (unit.daysToHeal === 0) {
                    this.addIntel(`${unit.name} has fully recovered and is ready for duty.`);
                }
            }
        });

        // Generate new missions
        this.gameState.missions = MissionGenerator.generateMissions(
            this.gameState.day,
            this.gameState.completedMissions
        );

        // Random events
        this.processRandomEvents();

        // Check for game over (all squad dead)
        const aliveSquad = this.gameState.squad.filter(u => u.isAlive);
        if (aliveSquad.length === 0) {
            Game.gameOver('All your librarians have fallen. The books have won.');
            return;
        }

        // Check for victory
        if (this.gameState.completedMissions >= CONFIG.MISSIONS_FOR_VICTORY) {
            Game.victory();
            return;
        }

        this.updateUI();

        this.addIntel(`Day ${this.gameState.day}: New reports have come in.`);
    },

    /**
     * Process random events
     */
    processRandomEvents() {
        // Small chance of recruiting new librarian
        if (this.gameState.squad.filter(u => u.isAlive).length < 4 && Utils.percentChance(20)) {
            const classes = ['HEAD_LIBRARIAN', 'ARCHIVIST', 'CATALOGUER', 'CONSERVATOR'];
            const newClass = Utils.randomChoice(classes);
            const newLibrarian = UnitManager.createLibrarian(newClass);

            this.gameState.squad.push(newLibrarian);
            this.addIntel(`${newLibrarian.name}, a new ${newLibrarian.classData.name}, has joined your team!`);
        }

        // Random bonus fines
        if (Utils.percentChance(15)) {
            const bonus = Utils.randomInt(50, 150);
            this.gameState.fines += bonus;
            this.addIntel(`Late fee collection brought in an extra $${bonus}.`);
        }

        // Threat escalation messages
        if (this.gameState.day % 3 === 0) {
            const threats = [
                'Intelligence suggests book activity is increasing.',
                'Strange noises reported from the basement.',
                'A new shipment of books has arrived. Some seem... restless.',
                'The periodicals section smells of danger.',
                'Reference materials are organizing. This cannot be good.',
            ];
            this.addIntel(Utils.randomChoice(threats));
        }
    },

    /**
     * Add intel message
     */
    addIntel(message) {
        this.gameState.intel.unshift({
            day: this.gameState.day,
            message: message,
        });

        // Keep only recent intel
        if (this.gameState.intel.length > 10) {
            this.gameState.intel.pop();
        }
    },

    /**
     * Get mission-ready squad
     */
    getDeployableSquad() {
        return this.gameState.squad.filter(u =>
            u.isAlive && u.daysToHeal === 0
        ).slice(0, 4);
    },

    /**
     * Process mission completion
     */
    completeMission(results) {
        // Update game state
        this.gameState.fines += results.fines;
        this.gameState.booksReturned += results.kills;
        this.gameState.completedMissions++;

        // Update squad
        results.squad.forEach(unitResult => {
            const unit = this.gameState.squad.find(u => u.id === unitResult.id);
            if (!unit) return;

            unit.xp += unitResult.xpGained;
            unit.kills += unitResult.killsGained;
            unit.missionsCompleted++;

            if (!unitResult.isAlive) {
                unit.isAlive = false;
            } else if (unitResult.wasWounded) {
                unit.daysToHeal = Utils.randomInt(1, 3);
            }

            // Check for level up
            const newRank = UnitManager.checkLevelUp(unit);
            if (newRank) {
                UnitManager.applyLevelUp(unit);
                unitResult.promoted = true;
            }
        });

        // Remove completed mission
        this.gameState.missions = this.gameState.missions.filter(m =>
            m.id !== this.selectedMission.id
        );

        // Add intel
        if (results.victory) {
            this.addIntel(`Mission Success: ${this.selectedMission.typeData.name} at ${this.selectedMission.location}.`);
        } else {
            this.addIntel(`Mission Failed: ${this.selectedMission.typeData.name} at ${this.selectedMission.location}.`);
        }

        this.selectedMission = null;

        return results;
    },
};

// Export
window.Strategic = Strategic;
