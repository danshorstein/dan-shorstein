/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * UI Management System
 */

const UI = {
    // Active screen
    currentScreen: null,

    // DOM element references
    elements: {},

    // Tooltip
    tooltip: null,

    /**
     * Initialize UI system
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.tooltip = document.getElementById('tooltip');

        console.log('UI system initialized');
    },

    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        this.elements = {
            // Screens
            mainMenu: document.getElementById('main-menu'),
            tutorialScreen: document.getElementById('tutorial-screen'),
            creditsScreen: document.getElementById('credits-screen'),
            strategicScreen: document.getElementById('strategic-screen'),
            squadScreen: document.getElementById('squad-screen'),
            briefingScreen: document.getElementById('briefing-screen'),
            tacticalScreen: document.getElementById('tactical-screen'),
            tacticalMenu: document.getElementById('tactical-menu'),
            resultsScreen: document.getElementById('results-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            victoryScreen: document.getElementById('victory-screen'),
            loadingScreen: document.getElementById('loading-screen'),

            // Main menu buttons
            btnNewGame: document.getElementById('btn-new-game'),
            btnContinue: document.getElementById('btn-continue'),
            btnTutorial: document.getElementById('btn-tutorial'),
            btnCredits: document.getElementById('btn-credits'),
            btnBackTutorial: document.getElementById('btn-back-tutorial'),
            btnBackCredits: document.getElementById('btn-back-credits'),

            // Strategic screen
            booksReturned: document.getElementById('books-returned'),
            finesCollected: document.getElementById('fines-collected'),
            currentDay: document.getElementById('current-day'),
            squadRoster: document.getElementById('squad-roster'),
            missionList: document.getElementById('mission-list'),
            intelFeed: document.getElementById('intel-feed'),
            btnManageSquad: document.getElementById('btn-manage-squad'),
            btnNextDay: document.getElementById('btn-next-day'),
            btnSaveGame: document.getElementById('btn-save-game'),

            // Squad management
            availableLibrarians: document.getElementById('available-librarians'),
            unitDetails: document.getElementById('unit-details'),
            activeSquad: document.getElementById('active-squad'),
            btnBackStrategic: document.getElementById('btn-back-strategic'),

            // Briefing
            missionTitle: document.getElementById('mission-title'),
            missionDescription: document.getElementById('mission-description'),
            missionLocation: document.getElementById('mission-location'),
            missionThreat: document.getElementById('mission-threat'),
            missionObjectives: document.getElementById('mission-objectives'),
            missionEnemies: document.getElementById('mission-enemies'),
            deploymentRoster: document.getElementById('deployment-roster'),
            btnCancelMission: document.getElementById('btn-cancel-mission'),
            btnStartMission: document.getElementById('btn-start-mission'),
            briefingMapCanvas: document.getElementById('briefing-map-canvas'),

            // Tactical screen
            currentTurn: document.getElementById('current-turn'),
            phaseIndicator: document.getElementById('phase-indicator'),
            enemiesRemaining: document.getElementById('enemies-remaining'),
            squadRemaining: document.getElementById('squad-remaining'),
            btnEndTurn: document.getElementById('btn-end-turn'),
            btnTacticalMenu: document.getElementById('btn-tactical-menu'),
            gameCanvas: document.getElementById('game-canvas'),

            // Unit panel
            unitPanel: document.getElementById('unit-panel'),
            selectedPortrait: document.getElementById('selected-portrait'),
            selectedName: document.getElementById('selected-name'),
            selectedHP: document.getElementById('selected-hp'),
            selectedHPText: document.getElementById('selected-hp-text'),
            selectedAP: document.getElementById('selected-ap'),
            selectedAPText: document.getElementById('selected-ap-text'),
            unitActions: document.getElementById('unit-actions'),

            // Combat log
            combatLog: document.getElementById('combat-log'),

            // Tactical menu overlay
            btnResume: document.getElementById('btn-resume'),
            btnSaveTactical: document.getElementById('btn-save-tactical'),
            btnAbortMission: document.getElementById('btn-abort-mission'),

            // Results screen
            resultsTitle: document.getElementById('results-title'),
            resultKills: document.getElementById('result-kills'),
            resultFines: document.getElementById('result-fines'),
            resultCasualties: document.getElementById('result-casualties'),
            resultTurns: document.getElementById('result-turns'),
            resultsSquadList: document.getElementById('results-squad-list'),
            resultsPromotions: document.getElementById('results-promotions'),
            btnContinueResults: document.getElementById('btn-continue-results'),

            // Game over
            gameoverTitle: document.getElementById('gameover-title'),
            gameoverMessage: document.getElementById('gameover-message'),
            finalDays: document.getElementById('final-days'),
            finalBooks: document.getElementById('final-books'),
            finalFines: document.getElementById('final-fines'),
            finalCasualties: document.getElementById('final-casualties'),
            btnNewGameOver: document.getElementById('btn-new-game-over'),
            btnMainMenu: document.getElementById('btn-main-menu'),

            // Victory
            victoryDays: document.getElementById('victory-days'),
            victoryBooks: document.getElementById('victory-books'),
            victoryFines: document.getElementById('victory-fines'),
            victoryCasualties: document.getElementById('victory-casualties'),
            btnVictoryMenu: document.getElementById('btn-victory-menu'),

            // Loading
            loadingProgress: document.getElementById('loading-progress'),
            loadingText: document.getElementById('loading-text'),
        };
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Main menu
        this.elements.btnNewGame.addEventListener('click', () => {
            AudioSystem.playSound('click');
            Game.newGame();
        });

        this.elements.btnContinue.addEventListener('click', () => {
            AudioSystem.playSound('click');
            Game.loadGame();
        });

        this.elements.btnTutorial.addEventListener('click', () => {
            AudioSystem.playSound('click');
            this.showScreen('tutorial-screen');
        });

        this.elements.btnCredits.addEventListener('click', () => {
            AudioSystem.playSound('click');
            this.showScreen('credits-screen');
        });

        this.elements.btnBackTutorial.addEventListener('click', () => {
            AudioSystem.playSound('click');
            this.showScreen('main-menu');
        });

        this.elements.btnBackCredits.addEventListener('click', () => {
            AudioSystem.playSound('click');
            this.showScreen('main-menu');
        });

        // Strategic screen
        this.elements.btnManageSquad.addEventListener('click', () => {
            AudioSystem.playSound('click');
            Strategic.openSquadManagement();
        });

        this.elements.btnNextDay.addEventListener('click', () => {
            AudioSystem.playSound('click');
            Strategic.advanceDay();
        });

        this.elements.btnSaveGame.addEventListener('click', () => {
            AudioSystem.playSound('click');
            Game.saveGame();
        });

        // Squad management
        this.elements.btnBackStrategic.addEventListener('click', () => {
            AudioSystem.playSound('click');
            this.showScreen('strategic-screen');
        });

        // Briefing
        this.elements.btnCancelMission.addEventListener('click', () => {
            AudioSystem.playSound('click');
            this.showScreen('strategic-screen');
        });

        this.elements.btnStartMission.addEventListener('click', () => {
            AudioSystem.playSound('click');
            Tactical.startMission();
        });

        // Tactical
        this.elements.btnEndTurn.addEventListener('click', () => {
            AudioSystem.playSound('click');
            Tactical.endTurn();
        });

        this.elements.btnTacticalMenu.addEventListener('click', () => {
            AudioSystem.playSound('click');
            this.showTacticalMenu();
        });

        this.elements.btnResume.addEventListener('click', () => {
            AudioSystem.playSound('click');
            this.hideTacticalMenu();
        });

        this.elements.btnSaveTactical.addEventListener('click', () => {
            AudioSystem.playSound('click');
            Game.saveGame();
        });

        this.elements.btnAbortMission.addEventListener('click', () => {
            AudioSystem.playSound('click');
            if (confirm('Abort mission? All progress will be lost and squad members may be wounded.')) {
                Tactical.abortMission();
            }
        });

        // Results
        this.elements.btnContinueResults.addEventListener('click', () => {
            AudioSystem.playSound('click');
            Tactical.returnToBase();
        });

        // Game over
        this.elements.btnNewGameOver.addEventListener('click', () => {
            AudioSystem.playSound('click');
            Game.newGame();
        });

        this.elements.btnMainMenu.addEventListener('click', () => {
            AudioSystem.playSound('click');
            this.showScreen('main-menu');
        });

        // Victory
        this.elements.btnVictoryMenu.addEventListener('click', () => {
            AudioSystem.playSound('click');
            this.showScreen('main-menu');
        });

        // Ability buttons
        const abilityBtns = document.querySelectorAll('.ability-btn');
        abilityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                AudioSystem.playSound('click');
                const ability = btn.dataset.ability;
                Tactical.setActionMode(ability);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Hover sounds for buttons
        document.querySelectorAll('.menu-btn, .action-btn, .ability-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                AudioSystem.playSound('hover');
            });
        });
    },

    /**
     * Handle keyboard input
     */
    handleKeyPress(e) {
        if (this.currentScreen !== 'tactical-screen') return;

        switch (e.key) {
            case '1':
                Tactical.setActionMode('move');
                break;
            case '2':
                Tactical.setActionMode('attack');
                break;
            case '3':
                Tactical.setActionMode('overwatch');
                break;
            case '4':
                Tactical.setActionMode('special');
                break;
            case ' ':
                e.preventDefault();
                Tactical.endTurn();
                break;
            case 'Tab':
                e.preventDefault();
                Tactical.cycleUnit();
                break;
            case 'Escape':
                if (!this.elements.tacticalMenu.classList.contains('hidden')) {
                    this.hideTacticalMenu();
                } else {
                    this.showTacticalMenu();
                }
                break;
        }
    },

    /**
     * Show a screen
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        }
    },

    /**
     * Show loading screen
     */
    showLoading(text = 'Loading...') {
        this.showScreen('loading-screen');
        this.elements.loadingText.textContent = text;
        this.elements.loadingProgress.style.width = '0%';
    },

    /**
     * Update loading progress
     */
    updateLoading(percent, text = null) {
        this.elements.loadingProgress.style.width = `${percent}%`;
        if (text) {
            this.elements.loadingText.textContent = text;
        }
    },

    /**
     * Update strategic screen
     */
    updateStrategic(gameState) {
        this.elements.booksReturned.textContent = gameState.booksReturned;
        this.elements.finesCollected.textContent = Utils.formatNumber(gameState.fines);
        this.elements.currentDay.textContent = gameState.day;

        // Update squad roster
        this.updateSquadRoster(gameState.squad);

        // Update mission list
        this.updateMissionList(gameState.missions);

        // Update intel feed
        this.updateIntelFeed(gameState.intel);

        // Check continue button
        const hasSave = Utils.loadFromStorage('librarian_save');
        this.elements.btnContinue.disabled = !hasSave;
    },

    /**
     * Update squad roster display
     */
    updateSquadRoster(squad) {
        this.elements.squadRoster.innerHTML = '';

        squad.forEach(unit => {
            const div = document.createElement('div');
            div.className = 'squad-member';
            if (!unit.isAlive) div.classList.add('dead');
            if (unit.daysToHeal > 0) div.classList.add('wounded');

            div.innerHTML = `
                <div class="squad-portrait">${unit.icon}</div>
                <div class="squad-info">
                    <div class="squad-name">${unit.name}</div>
                    <div class="squad-class">${unit.classData.name}${unit.daysToHeal > 0 ? ` (${unit.daysToHeal} days to heal)` : ''}</div>
                </div>
            `;

            div.addEventListener('click', () => {
                Strategic.selectUnit(unit);
            });

            this.elements.squadRoster.appendChild(div);
        });
    },

    /**
     * Update mission list display
     */
    updateMissionList(missions) {
        this.elements.missionList.innerHTML = '';

        if (missions.length === 0) {
            this.elements.missionList.innerHTML = '<p style="color: var(--color-text-dim);">No missions available today. Advance to next day.</p>';
            return;
        }

        missions.forEach(mission => {
            const div = document.createElement('div');
            div.className = 'mission-card';
            if (mission.urgent) div.classList.add('urgent');

            div.innerHTML = `
                <div class="mission-name">${mission.typeData.name}</div>
                <div class="mission-location">${mission.location}</div>
                <span class="mission-threat ${mission.threat}">${mission.threat.toUpperCase()}</span>
                ${mission.urgent ? '<span style="color: var(--color-danger);"> URGENT</span>' : ''}
            `;

            div.addEventListener('click', () => {
                AudioSystem.playSound('click');
                Strategic.selectMission(mission);
            });

            this.elements.missionList.appendChild(div);
        });
    },

    /**
     * Update intel feed
     */
    updateIntelFeed(intel) {
        this.elements.intelFeed.innerHTML = '';

        intel.forEach(item => {
            const div = document.createElement('div');
            div.className = 'intel-item';
            div.innerHTML = `
                <div class="intel-time">Day ${item.day}</div>
                <div>${item.message}</div>
            `;
            this.elements.intelFeed.appendChild(div);
        });
    },

    /**
     * Update mission briefing
     */
    updateBriefing(mission, squad) {
        this.elements.missionTitle.textContent = mission.typeData.name;
        this.elements.missionDescription.textContent = mission.description;
        this.elements.missionLocation.textContent = mission.location;
        this.elements.missionThreat.textContent = mission.threat.toUpperCase();
        this.elements.missionThreat.className = `mission-threat ${mission.threat}`;
        this.elements.missionObjectives.textContent = mission.objectives;
        this.elements.missionEnemies.textContent = mission.enemies;

        // Update deployment roster
        this.elements.deploymentRoster.innerHTML = '';
        squad.filter(u => u.isAlive && u.daysToHeal === 0).forEach(unit => {
            const div = document.createElement('div');
            div.className = 'deployment-unit';
            div.innerHTML = `
                <span style="font-size: 1.5rem;">${unit.icon}</span>
                <span>${unit.name}</span>
            `;
            this.elements.deploymentRoster.appendChild(div);
        });
    },

    /**
     * Update tactical HUD
     */
    updateTactical(gameState) {
        this.elements.currentTurn.textContent = `TURN ${gameState.turn}`;

        if (gameState.phase === CONFIG.PHASE.PLAYER) {
            this.elements.phaseIndicator.textContent = 'YOUR TURN';
            this.elements.phaseIndicator.classList.remove('enemy-turn');
            this.elements.btnEndTurn.disabled = false;
        } else {
            this.elements.phaseIndicator.textContent = 'ENEMY TURN';
            this.elements.phaseIndicator.classList.add('enemy-turn');
            this.elements.btnEndTurn.disabled = true;
        }

        const aliveEnemies = gameState.enemyUnits.filter(e => e.isAlive).length;
        const aliveSquad = gameState.playerUnits.filter(u => u.isAlive).length;

        this.elements.enemiesRemaining.textContent = aliveEnemies;
        this.elements.squadRemaining.textContent = aliveSquad;
    },

    /**
     * Update selected unit panel
     */
    updateUnitPanel(unit) {
        if (!unit) {
            this.elements.selectedPortrait.textContent = '';
            this.elements.selectedName.textContent = 'No Unit Selected';
            this.elements.selectedHP.style.width = '0%';
            this.elements.selectedHPText.textContent = '0/0';
            this.elements.selectedAP.style.width = '0%';
            this.elements.selectedAPText.textContent = '0/0';

            // Disable ability buttons
            document.querySelectorAll('.ability-btn').forEach(btn => {
                btn.disabled = true;
                btn.classList.remove('active');
            });
            return;
        }

        this.elements.selectedPortrait.textContent = unit.icon;
        this.elements.selectedName.textContent = unit.name;

        const hpPercent = (unit.hp / unit.maxHP) * 100;
        this.elements.selectedHP.style.width = `${hpPercent}%`;
        this.elements.selectedHPText.textContent = `${unit.hp}/${unit.maxHP}`;

        const apPercent = (unit.ap / unit.maxAP) * 100;
        this.elements.selectedAP.style.width = `${apPercent}%`;
        this.elements.selectedAPText.textContent = `${unit.ap}/${unit.maxAP}`;

        // Update ability buttons
        const moveBtn = document.querySelector('[data-ability="move"]');
        const attackBtn = document.querySelector('[data-ability="attack"]');
        const overwatchBtn = document.querySelector('[data-ability="overwatch"]');
        const specialBtn = document.querySelector('[data-ability="special"]');

        moveBtn.disabled = unit.ap < CONFIG.MOVE_COST;
        attackBtn.disabled = unit.ap < CONFIG.ATTACK_COST;
        overwatchBtn.disabled = unit.ap < CONFIG.OVERWATCH_COST;
        specialBtn.disabled = unit.ap < CONFIG.SPECIAL_COST || unit.specialCooldown > 0;

        // Update special ability icon/tooltip
        if (unit.special) {
            specialBtn.title = `${unit.special.name} (${CONFIG.SPECIAL_COST} AP)${unit.specialCooldown > 0 ? ` - Cooldown: ${unit.specialCooldown}` : ''}`;
        }
    },

    /**
     * Set active action button
     */
    setActiveAction(action) {
        document.querySelectorAll('.ability-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.ability === action) {
                btn.classList.add('active');
            }
        });
    },

    /**
     * Add entry to combat log
     */
    addCombatLog(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;

        this.elements.combatLog.appendChild(entry);
        this.elements.combatLog.scrollTop = this.elements.combatLog.scrollHeight;
    },

    /**
     * Clear combat log
     */
    clearCombatLog() {
        this.elements.combatLog.innerHTML = '';
    },

    /**
     * Show tactical menu overlay
     */
    showTacticalMenu() {
        this.elements.tacticalMenu.classList.remove('hidden');
    },

    /**
     * Hide tactical menu overlay
     */
    hideTacticalMenu() {
        this.elements.tacticalMenu.classList.add('hidden');
    },

    /**
     * Show mission results
     */
    showResults(results) {
        this.elements.resultsTitle.textContent = results.victory ? 'MISSION COMPLETE' : 'MISSION FAILED';
        this.elements.resultsTitle.style.color = results.victory ? 'var(--color-success)' : 'var(--color-danger)';

        this.elements.resultKills.textContent = results.kills;
        this.elements.resultFines.textContent = `$${Utils.formatNumber(results.fines)}`;
        this.elements.resultCasualties.textContent = results.casualties;
        this.elements.resultTurns.textContent = results.turns;

        // Squad status
        this.elements.resultsSquadList.innerHTML = '';
        results.squad.forEach(unit => {
            const div = document.createElement('div');
            div.className = 'results-unit';
            if (!unit.isAlive) div.classList.add('dead');
            if (unit.promoted) div.classList.add('promoted');

            div.innerHTML = `${unit.icon} ${unit.name}${unit.promoted ? ' ⬆' : ''}`;
            this.elements.resultsSquadList.appendChild(div);
        });

        // Promotions
        const promoted = results.squad.filter(u => u.promoted);
        if (promoted.length > 0) {
            this.elements.resultsPromotions.innerHTML = '<h3>PROMOTIONS</h3>';
            promoted.forEach(unit => {
                const rank = UnitManager.getUnitRank(unit);
                const p = document.createElement('p');
                p.textContent = `${unit.name} promoted to ${rank.name}!`;
                this.elements.resultsPromotions.appendChild(p);
            });
        } else {
            this.elements.resultsPromotions.innerHTML = '';
        }

        this.showScreen('results-screen');
    },

    /**
     * Show game over screen
     */
    showGameOver(stats, message) {
        this.elements.gameoverTitle.textContent = 'CAMPAIGN OVER';
        this.elements.gameoverMessage.textContent = message;
        this.elements.finalDays.textContent = stats.days;
        this.elements.finalBooks.textContent = stats.booksReturned;
        this.elements.finalFines.textContent = Utils.formatNumber(stats.fines);
        this.elements.finalCasualties.textContent = stats.casualties;

        AudioSystem.playSound('defeat');
        this.showScreen('gameover-screen');
    },

    /**
     * Show victory screen
     */
    showVictory(stats) {
        this.elements.victoryDays.textContent = stats.days;
        this.elements.victoryBooks.textContent = stats.booksReturned;
        this.elements.victoryFines.textContent = Utils.formatNumber(stats.fines);
        this.elements.victoryCasualties.textContent = stats.casualties;

        AudioSystem.playSound('victory');
        this.showScreen('victory-screen');
    },

    /**
     * Show tooltip
     */
    showTooltip(x, y, text) {
        this.tooltip.textContent = text;
        this.tooltip.style.left = `${x + 10}px`;
        this.tooltip.style.top = `${y + 10}px`;
        this.tooltip.classList.remove('hidden');
    },

    /**
     * Hide tooltip
     */
    hideTooltip() {
        this.tooltip.classList.add('hidden');
    },
};

// Export
window.UI = UI;
