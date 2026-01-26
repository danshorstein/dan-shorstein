/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Main Game Controller
 */

const Game = {
    // Game state
    state: CONFIG.GAME_STATE.MAIN_MENU,

    // Global game data
    gameData: null,

    // Save key
    SAVE_KEY: 'librarian_save',

    /**
     * Initialize the game
     */
    async init() {
        console.log('=================================');
        console.log('LIBRARIAN STRIKE FORCE');
        console.log('The Overdue Reckoning');
        console.log('=================================');

        // Show loading screen
        UI.showLoading('Initializing library systems...');

        // Initialize systems
        await this.initSystems();

        // Check for save data
        this.checkSaveData();

        // Show main menu
        UI.showScreen('main-menu');

        console.log('Game initialized successfully');
    },

    /**
     * Initialize all game systems
     */
    async initSystems() {
        // Initialize UI
        UI.updateLoading(20, 'Cataloguing user interface...');
        UI.init();

        // Initialize audio
        UI.updateLoading(40, 'Tuning the silence...');
        AudioSystem.init();

        // Small delay to show loading
        await Utils.wait(200);

        UI.updateLoading(60, 'Organizing book returns...');
        await Utils.wait(200);

        UI.updateLoading(80, 'Sharpening librarian skills...');
        await Utils.wait(200);

        UI.updateLoading(100, 'Ready for action!');
        await Utils.wait(300);
    },

    /**
     * Check for existing save data
     */
    checkSaveData() {
        const saveData = Utils.loadFromStorage(this.SAVE_KEY);
        if (saveData) {
            UI.elements.btnContinue.disabled = false;
        } else {
            UI.elements.btnContinue.disabled = true;
        }
    },

    /**
     * Start a new game
     */
    newGame() {
        console.log('Starting new game...');

        // Resume audio context
        AudioSystem.resume();

        // Create new game data
        this.gameData = {
            day: 1,
            fines: CONFIG.STARTING_FINES,
            booksReturned: CONFIG.STARTING_BOOKS_RETURNED,
            squad: UnitManager.createStartingSquad(),
            missions: [],
            completedMissions: 0,
            intel: [],
            totalCasualties: 0,
        };

        // Initialize strategic layer
        Strategic.init(this.gameData);

        // Show strategic screen
        this.state = CONFIG.GAME_STATE.STRATEGIC;
        UI.showScreen('strategic-screen');

        // Start ambient music
        AudioSystem.startMusic();

        // Add welcome intel
        Strategic.addIntel('Welcome, Commander. The library is under attack from sentient overdue books.');
        Strategic.addIntel('Build your team. Plan your missions. Enforce silence.');
    },

    /**
     * Save the game
     */
    saveGame() {
        if (!this.gameData) {
            console.warn('No game data to save');
            return false;
        }

        const saveData = {
            version: '1.0',
            timestamp: Date.now(),
            state: this.state,
            gameData: {
                day: this.gameData.day,
                fines: this.gameData.fines,
                booksReturned: this.gameData.booksReturned,
                completedMissions: this.gameData.completedMissions,
                totalCasualties: this.gameData.totalCasualties,
                squad: this.gameData.squad.map(u => UnitManager.cloneUnit(u)),
                missions: Utils.deepClone(this.gameData.missions),
                intel: Utils.deepClone(this.gameData.intel),
            },
        };

        const success = Utils.saveToStorage(this.SAVE_KEY, saveData);

        if (success) {
            console.log('Game saved successfully');
            UI.addCombatLog('Game saved.', 'info');
            alert('Game saved!');
        } else {
            console.error('Failed to save game');
            alert('Failed to save game. Local storage may be full.');
        }

        return success;
    },

    /**
     * Load a saved game
     */
    loadGame() {
        const saveData = Utils.loadFromStorage(this.SAVE_KEY);

        if (!saveData) {
            console.warn('No save data found');
            alert('No saved game found!');
            return false;
        }

        console.log('Loading saved game...');

        // Resume audio context
        AudioSystem.resume();

        // Restore game data
        this.gameData = {
            day: saveData.gameData.day,
            fines: saveData.gameData.fines,
            booksReturned: saveData.gameData.booksReturned,
            completedMissions: saveData.gameData.completedMissions,
            totalCasualties: saveData.gameData.totalCasualties || 0,
            squad: saveData.gameData.squad.map(u => UnitManager.restoreUnit(u)),
            missions: saveData.gameData.missions,
            intel: saveData.gameData.intel,
        };

        // Initialize strategic layer
        Strategic.init(this.gameData);

        // Show strategic screen
        this.state = CONFIG.GAME_STATE.STRATEGIC;
        UI.showScreen('strategic-screen');

        // Start ambient music
        AudioSystem.startMusic();

        console.log('Game loaded successfully');
        return true;
    },

    /**
     * Handle game over
     */
    gameOver(message) {
        this.state = CONFIG.GAME_STATE.GAME_OVER;

        AudioSystem.stopMusic();

        const stats = {
            days: this.gameData.day,
            booksReturned: this.gameData.booksReturned,
            fines: this.gameData.fines,
            casualties: this.gameData.totalCasualties,
        };

        UI.showGameOver(stats, message);

        // Clear save data on game over
        Utils.clearStorage(this.SAVE_KEY);
    },

    /**
     * Handle victory
     */
    victory() {
        this.state = CONFIG.GAME_STATE.VICTORY;

        AudioSystem.stopMusic();

        const stats = {
            days: this.gameData.day,
            booksReturned: this.gameData.booksReturned,
            fines: this.gameData.fines,
            casualties: this.gameData.totalCasualties,
        };

        UI.showVictory(stats);

        // Clear save data on victory
        Utils.clearStorage(this.SAVE_KEY);
    },

    /**
     * Return to main menu
     */
    returnToMenu() {
        this.state = CONFIG.GAME_STATE.MAIN_MENU;

        AudioSystem.stopMusic();
        Tactical.cleanup();

        UI.showScreen('main-menu');
        this.checkSaveData();
    },
};

// Start the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

// Handle page visibility for audio
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        AudioSystem.stopMusic();
    } else if (Game.state !== CONFIG.GAME_STATE.MAIN_MENU) {
        AudioSystem.startMusic();
    }
});

// Export
window.Game = Game;
