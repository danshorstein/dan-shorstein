/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Game Configuration and Constants
 */

const CONFIG = {
    // Display settings
    TILE_SIZE: 32,
    MAP_WIDTH: 20,
    MAP_HEIGHT: 15,

    // Canvas dimensions (will be calculated)
    CANVAS_WIDTH: 640,
    CANVAS_HEIGHT: 480,

    // Game balance
    STARTING_FINES: 500,
    STARTING_BOOKS_RETURNED: 0,

    // Combat settings
    BASE_HIT_CHANCE: 70,
    COVER_BONUS: 30,
    FLANKING_BONUS: 20,
    OVERWATCH_PENALTY: 15,
    CRITICAL_CHANCE: 10,
    CRITICAL_MULTIPLIER: 1.5,

    // Movement costs
    MOVE_COST: 1,
    ATTACK_COST: 2,
    OVERWATCH_COST: 2,
    SPECIAL_COST: 3,

    // AI settings
    AI_MOVE_DELAY: 400,
    AI_ATTACK_DELAY: 600,

    // Animation settings
    ANIMATION_SPEED: 200,
    PROJECTILE_SPEED: 500,

    // Mission settings
    MAX_TURNS_PER_MISSION: 30,
    MISSIONS_FOR_VICTORY: 8,

    // Fog of war
    SIGHT_RANGE: 8,

    // Colors for rendering
    COLORS: {
        // Tiles
        FLOOR: '#2a2a4a',
        WALL: '#1a1a2e',
        COVER_LOW: '#3a3a5a',
        COVER_HIGH: '#2e2e4e',
        BOOKSHELF: '#4a3a2a',
        DESK: '#5a4a3a',
        DOOR: '#6a5a4a',
        EXIT: '#4a6a4a',

        // Grid
        GRID: '#3a3a5a',
        GRID_HOVER: '#5a5a8a',

        // Movement
        MOVE_RANGE: 'rgba(74, 159, 255, 0.3)',
        MOVE_PATH: 'rgba(74, 159, 255, 0.6)',

        // Attack
        ATTACK_RANGE: 'rgba(255, 68, 68, 0.3)',
        ATTACK_TARGET: 'rgba(255, 68, 68, 0.6)',

        // Units
        FRIENDLY: '#4a9fff',
        FRIENDLY_SELECTED: '#7bc8ff',
        ENEMY: '#ff4444',
        ENEMY_TARGETED: '#ff8888',

        // Status effects
        OVERWATCH: 'rgba(255, 215, 0, 0.5)',
        STUNNED: 'rgba(128, 128, 128, 0.5)',

        // FOW
        FOG: 'rgba(0, 0, 0, 0.7)',
        EXPLORED: 'rgba(0, 0, 0, 0.4)',

        // UI
        HP_HIGH: '#44ff44',
        HP_MED: '#ffaa00',
        HP_LOW: '#ff4444',
        AP_BAR: '#4a9fff',
    },

    // Tile types
    TILES: {
        FLOOR: 0,
        WALL: 1,
        COVER_LOW: 2,    // Half cover (bookshelves)
        COVER_HIGH: 3,   // Full cover (tall bookshelves)
        DESK: 4,         // Low cover, can be destroyed
        DOOR: 5,         // Can be opened/closed
        EXIT: 6,         // Mission exit point
        WATER: 7,        // Impassable
        STAIRS: 8,       // Connects floors
    },

    // Status effects
    STATUS: {
        NONE: 'none',
        OVERWATCH: 'overwatch',
        STUNNED: 'stunned',
        CHARMED: 'charmed',
        FRIGHTENED: 'frightened',
        MARKED: 'marked',
        BUFFED: 'buffed',
        SHIELDED: 'shielded',
    },

    // Game states
    GAME_STATE: {
        MAIN_MENU: 'main_menu',
        STRATEGIC: 'strategic',
        SQUAD_MANAGEMENT: 'squad_management',
        BRIEFING: 'briefing',
        TACTICAL: 'tactical',
        RESULTS: 'results',
        GAME_OVER: 'game_over',
        VICTORY: 'victory',
    },

    // Turn phases
    PHASE: {
        PLAYER: 'player',
        ENEMY: 'enemy',
        ENVIRONMENT: 'environment',
    },

    // Action modes
    ACTION_MODE: {
        NONE: 'none',
        MOVE: 'move',
        ATTACK: 'attack',
        OVERWATCH: 'overwatch',
        SPECIAL: 'special',
    },

    // Sound effects (procedurally generated)
    SOUNDS: {
        MENU_CLICK: 'click',
        MENU_HOVER: 'hover',
        MOVE: 'footstep',
        ATTACK: 'attack',
        HIT: 'hit',
        MISS: 'miss',
        CRITICAL: 'critical',
        DEATH: 'death',
        ABILITY: 'ability',
        TURN_START: 'turn_start',
        VICTORY: 'victory',
        DEFEAT: 'defeat',
    },

    // Keyboard bindings
    KEYS: {
        MOVE: '1',
        ATTACK: '2',
        OVERWATCH: '3',
        SPECIAL: '4',
        END_TURN: ' ',
        CANCEL: 'Escape',
        CYCLE_UNIT: 'Tab',
    },
};

// Librarian class definitions
const LIBRARIAN_CLASSES = {
    HEAD_LIBRARIAN: {
        id: 'head_librarian',
        name: 'Head Librarian',
        icon: '👩‍💼',
        description: 'Balanced fighter with leadership abilities',
        baseStats: {
            maxHP: 12,
            maxAP: 8,
            accuracy: 75,
            dodge: 10,
            armor: 1,
            sightRange: 7,
            moveRange: 5,
        },
        weapon: {
            name: 'Stamp of Authority',
            damage: [3, 5],
            range: 6,
            accuracy: 75,
        },
        special: {
            name: 'Rally',
            description: 'Restore 2 AP to all nearby allies',
            range: 4,
            cooldown: 3,
        },
    },
    ARCHIVIST: {
        id: 'archivist',
        name: 'Archivist',
        icon: '🧓',
        description: 'Long range specialist with high accuracy',
        baseStats: {
            maxHP: 8,
            maxAP: 6,
            accuracy: 85,
            dodge: 5,
            armor: 0,
            sightRange: 9,
            moveRange: 4,
        },
        weapon: {
            name: 'Magnifying Glare',
            damage: [4, 6],
            range: 10,
            accuracy: 85,
        },
        special: {
            name: 'Precision Shot',
            description: 'Next attack has +30% accuracy and ignores cover',
            cooldown: 2,
        },
    },
    CATALOGUER: {
        id: 'cataloguer',
        name: 'Cataloguer',
        icon: '🏃',
        description: 'Fast scout who can mark enemies',
        baseStats: {
            maxHP: 10,
            maxAP: 10,
            accuracy: 65,
            dodge: 25,
            armor: 0,
            sightRange: 8,
            moveRange: 7,
        },
        weapon: {
            name: 'Card Fling',
            damage: [2, 4],
            range: 5,
            accuracy: 65,
        },
        special: {
            name: 'Catalog',
            description: 'Mark an enemy, giving +20% hit chance to all attacks against them',
            range: 8,
            cooldown: 2,
        },
    },
    CONSERVATOR: {
        id: 'conservator',
        name: 'Conservator',
        icon: '💉',
        description: 'Support specialist who heals and buffs',
        baseStats: {
            maxHP: 10,
            maxAP: 8,
            accuracy: 60,
            dodge: 10,
            armor: 0,
            sightRange: 6,
            moveRange: 5,
        },
        weapon: {
            name: 'Binding Tape',
            damage: [2, 3],
            range: 4,
            accuracy: 60,
        },
        special: {
            name: 'Restore',
            description: 'Heal an ally for 5 HP',
            range: 5,
            cooldown: 2,
        },
    },
};

// Enemy book definitions
const ENEMY_TYPES = {
    ROMANCE_NOVEL: {
        id: 'romance_novel',
        name: 'Romance Novel',
        icon: '💕',
        description: 'Charms and confuses librarians',
        stats: {
            maxHP: 6,
            maxAP: 6,
            accuracy: 60,
            dodge: 15,
            armor: 0,
            sightRange: 6,
            moveRange: 5,
        },
        weapon: {
            name: 'Swoon',
            damage: [1, 3],
            range: 4,
        },
        special: {
            name: 'Charm',
            description: 'Has a chance to skip target\'s next turn',
            chance: 30,
        },
        fineValue: 25,
        xpValue: 20,
        threat: 'low',
    },
    HORROR_BOOK: {
        id: 'horror_book',
        name: 'Horror Book',
        icon: '👻',
        description: 'Causes fear and deals high damage',
        stats: {
            maxHP: 8,
            maxAP: 6,
            accuracy: 70,
            dodge: 10,
            armor: 0,
            sightRange: 7,
            moveRange: 4,
        },
        weapon: {
            name: 'Nightmare',
            damage: [3, 6],
            range: 5,
        },
        special: {
            name: 'Terrify',
            description: 'Can frighten targets, reducing their accuracy',
            chance: 25,
        },
        fineValue: 35,
        xpValue: 30,
        threat: 'medium',
    },
    TEXTBOOK: {
        id: 'textbook',
        name: 'Textbook',
        icon: '📚',
        description: 'Slow but heavily armored',
        stats: {
            maxHP: 15,
            maxAP: 4,
            accuracy: 55,
            dodge: 0,
            armor: 2,
            sightRange: 5,
            moveRange: 3,
        },
        weapon: {
            name: 'Knowledge Dump',
            damage: [4, 7],
            range: 3,
        },
        special: {
            name: 'Bore',
            description: 'Stuns target for one turn',
            chance: 20,
        },
        fineValue: 50,
        xpValue: 40,
        threat: 'medium',
    },
    COMIC_BOOK: {
        id: 'comic_book',
        name: 'Comic Book',
        icon: '💥',
        description: 'Fast and evasive',
        stats: {
            maxHP: 5,
            maxAP: 10,
            accuracy: 65,
            dodge: 35,
            armor: 0,
            sightRange: 7,
            moveRange: 7,
        },
        weapon: {
            name: 'POW!',
            damage: [2, 4],
            range: 4,
        },
        special: {
            name: 'Dodge Roll',
            description: 'Can move after attacking',
        },
        fineValue: 20,
        xpValue: 25,
        threat: 'low',
    },
    ENCYCLOPEDIA: {
        id: 'encyclopedia',
        name: 'Encyclopedia',
        icon: '📖',
        description: 'Boss enemy - extremely dangerous',
        stats: {
            maxHP: 25,
            maxAP: 8,
            accuracy: 75,
            dodge: 5,
            armor: 3,
            sightRange: 8,
            moveRange: 4,
        },
        weapon: {
            name: 'Infinite Knowledge',
            damage: [5, 9],
            range: 6,
        },
        special: {
            name: 'Summon Pages',
            description: 'Can spawn additional enemies',
            cooldown: 4,
        },
        fineValue: 150,
        xpValue: 100,
        threat: 'boss',
    },
    SELF_HELP_BOOK: {
        id: 'self_help_book',
        name: 'Self-Help Book',
        icon: '🌟',
        description: 'Heals and buffs other books',
        stats: {
            maxHP: 7,
            maxAP: 6,
            accuracy: 50,
            dodge: 10,
            armor: 0,
            sightRange: 6,
            moveRange: 5,
        },
        weapon: {
            name: 'Positive Affirmation',
            damage: [1, 2],
            range: 4,
        },
        special: {
            name: 'Motivate',
            description: 'Heals nearby allies for 3 HP',
            range: 4,
        },
        fineValue: 40,
        xpValue: 35,
        threat: 'medium',
    },
    MYSTERY_NOVEL: {
        id: 'mystery_novel',
        name: 'Mystery Novel',
        icon: '🔍',
        description: 'Can hide and ambush',
        stats: {
            maxHP: 7,
            maxAP: 8,
            accuracy: 75,
            dodge: 20,
            armor: 0,
            sightRange: 8,
            moveRange: 6,
        },
        weapon: {
            name: 'Plot Twist',
            damage: [3, 5],
            range: 5,
        },
        special: {
            name: 'Cloak',
            description: 'Becomes invisible until it attacks',
        },
        fineValue: 45,
        xpValue: 40,
        threat: 'medium',
    },
    COOKBOOK: {
        id: 'cookbook',
        name: 'Cookbook',
        icon: '🍳',
        description: 'Throws damaging recipes',
        stats: {
            maxHP: 8,
            maxAP: 6,
            accuracy: 70,
            dodge: 10,
            armor: 0,
            sightRange: 6,
            moveRange: 4,
        },
        weapon: {
            name: 'Hot Recipe',
            damage: [2, 5],
            range: 6,
        },
        special: {
            name: 'Area Splash',
            description: 'Attacks hit adjacent tiles too',
        },
        fineValue: 30,
        xpValue: 30,
        threat: 'medium',
    },
};

// Rank/level progression
const RANKS = [
    { name: 'Library Aide', xpRequired: 0, bonusHP: 0, bonusAccuracy: 0 },
    { name: 'Assistant Librarian', xpRequired: 50, bonusHP: 1, bonusAccuracy: 2 },
    { name: 'Librarian', xpRequired: 120, bonusHP: 2, bonusAccuracy: 4 },
    { name: 'Senior Librarian', xpRequired: 220, bonusHP: 3, bonusAccuracy: 6 },
    { name: 'Department Head', xpRequired: 350, bonusHP: 4, bonusAccuracy: 8 },
    { name: 'Chief Librarian', xpRequired: 500, bonusHP: 5, bonusAccuracy: 10 },
];

// Name generators for random librarians
const FIRST_NAMES = [
    'Margaret', 'Dorothy', 'Eleanor', 'Beatrice', 'Mildred', 'Gertrude',
    'Harold', 'Eugene', 'Bernard', 'Clarence', 'Herbert', 'Chester',
    'Agatha', 'Edith', 'Gladys', 'Mabel', 'Pearl', 'Viola',
    'Walter', 'Franklin', 'Norman', 'Milton', 'Vernon', 'Wilbur',
];

const LAST_NAMES = [
    'Bookworth', 'Stackman', 'Dewey', 'Shelfton', 'Cardwell', 'Indexer',
    'Quietson', 'Stampford', 'Margins', 'Dustcover', 'Bindley', 'Footnote',
    'Overdue', 'Finesworth', 'Catalogson', 'Archiver', 'Stacks', 'Volumes',
];

// Mission types
const MISSION_TYPES = {
    EXTERMINATION: {
        id: 'extermination',
        name: 'Pest Control',
        description: 'Eliminate all hostile books in the area',
        objectiveText: 'Neutralize all enemies',
    },
    RESCUE: {
        id: 'rescue',
        name: 'Staff Rescue',
        description: 'Rescue trapped library staff before the books get them',
        objectiveText: 'Rescue all staff members',
    },
    RETRIEVAL: {
        id: 'retrieval',
        name: 'Rare Book Recovery',
        description: 'Retrieve a valuable rare book and extract safely',
        objectiveText: 'Recover the target and extract',
    },
    DEFENSE: {
        id: 'defense',
        name: 'Hold the Line',
        description: 'Defend the returns desk from waves of attacking books',
        objectiveText: 'Survive all enemy waves',
    },
    BOSS: {
        id: 'boss',
        name: 'Encyclopedia Hunt',
        description: 'Track down and neutralize a dangerous Encyclopedia',
        objectiveText: 'Defeat the Encyclopedia',
    },
};

// Mission locations
const LOCATIONS = [
    { name: 'Main Reading Room', description: 'The heart of the library' },
    { name: 'Children\'s Section', description: 'Colorful but dangerous' },
    { name: 'Reference Wing', description: 'Dense stacks of knowledge' },
    { name: 'Periodicals Archive', description: 'Newspapers from ages past' },
    { name: 'Rare Books Vault', description: 'The most valuable collection' },
    { name: 'Computer Lab', description: 'Where old meets new' },
    { name: 'Staff Break Room', description: 'Even librarians need coffee' },
    { name: 'Basement Storage', description: 'Dark and full of surprises' },
];

// Export for use if modules are supported
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, LIBRARIAN_CLASSES, ENEMY_TYPES, RANKS, FIRST_NAMES, LAST_NAMES, MISSION_TYPES, LOCATIONS };
}
