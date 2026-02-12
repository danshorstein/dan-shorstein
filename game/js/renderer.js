/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Canvas Renderer with Retro Graphics
 */

const Renderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    tileSize: CONFIG.TILE_SIZE,

    // Camera/viewport
    camera: { x: 0, y: 0 },
    mapWidth: 0,
    mapHeight: 0,

    // Animation state
    animations: [],
    particles: [],

    // Hover/selection state
    hoveredTile: null,
    selectedUnit: null,
    movementRange: [],
    attackRange: [],
    pathPreview: [],

    // Sprite cache (for performance)
    spriteCache: new Map(),

    /**
     * Initialize the renderer
     */
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return false;
        }

        this.ctx = this.canvas.getContext('2d');

        // Handle high DPI displays
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Disable image smoothing for crisp pixels
        this.ctx.imageSmoothingEnabled = false;

        // Pre-generate sprites
        this.generateSprites();

        console.log('Renderer initialized');
        return true;
    },

    /**
     * Resize canvas to fit container
     */
    resize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Account for the unit panel width
        const panelWidth = 250;
        this.width = rect.width - panelWidth;
        this.height = rect.height;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Recalculate tile size to fit map
        if (this.mapWidth > 0 && this.mapHeight > 0) {
            const tileW = Math.floor(this.width / this.mapWidth);
            const tileH = Math.floor(this.height / this.mapHeight);
            this.tileSize = Math.min(tileW, tileH, CONFIG.TILE_SIZE);
        }

        // Disable smoothing after resize
        this.ctx.imageSmoothingEnabled = false;
    },

    /**
     * Set map dimensions
     */
    setMapSize(width, height) {
        this.mapWidth = width;
        this.mapHeight = height;

        // Recalculate tile size
        const tileW = Math.floor(this.width / width);
        const tileH = Math.floor(this.height / height);
        this.tileSize = Math.min(tileW, tileH, CONFIG.TILE_SIZE);

        // Center camera
        this.camera.x = (this.width - width * this.tileSize) / 2;
        this.camera.y = (this.height - height * this.tileSize) / 2;
    },

    /**
     * Convert screen coordinates to tile coordinates
     */
    screenToTile(screenX, screenY) {
        const tileX = Math.floor((screenX - this.camera.x) / this.tileSize);
        const tileY = Math.floor((screenY - this.camera.y) / this.tileSize);
        return { x: tileX, y: tileY };
    },

    /**
     * Convert tile coordinates to screen coordinates
     */
    tileToScreen(tileX, tileY) {
        return {
            x: tileX * this.tileSize + this.camera.x,
            y: tileY * this.tileSize + this.camera.y,
        };
    },

    /**
     * Pre-generate sprite graphics
     */
    generateSprites() {
        // Generate tile sprites
        this.generateTileSprites();
        // Generate unit sprites will be done with icons
    },

    /**
     * Generate tile sprites
     */
    generateTileSprites() {
        const size = 32;

        // Floor tile
        this.spriteCache.set('floor', this.createTilePattern(size, CONFIG.COLORS.FLOOR, (ctx, s) => {
            // Add subtle grid pattern
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1;
            ctx.strokeRect(0.5, 0.5, s - 1, s - 1);
        }));

        // Wall tile
        this.spriteCache.set('wall', this.createTilePattern(size, CONFIG.COLORS.WALL, (ctx, s) => {
            // Brick pattern
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            for (let y = 0; y < s; y += 8) {
                const offset = (y % 16 === 0) ? 0 : 8;
                for (let x = offset; x < s; x += 16) {
                    ctx.fillRect(x, y, 14, 6);
                }
            }
        }));

        // Low cover (bookshelf)
        this.spriteCache.set('cover_low', this.createTilePattern(size, CONFIG.COLORS.BOOKSHELF, (ctx, s) => {
            // Book spines
            ctx.fillStyle = '#6a5a4a';
            for (let x = 2; x < s - 2; x += 6) {
                ctx.fillRect(x, 4, 4, s - 8);
            }
            ctx.strokeStyle = '#3a2a1a';
            ctx.lineWidth = 1;
            ctx.strokeRect(1, 1, s - 2, s - 2);
        }));

        // High cover (tall bookshelf)
        this.spriteCache.set('cover_high', this.createTilePattern(size, CONFIG.COLORS.COVER_HIGH, (ctx, s) => {
            // Dense books
            const colors = ['#8B4513', '#A0522D', '#D2691E', '#8B0000', '#006400'];
            for (let x = 2; x < s - 2; x += 4) {
                ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillRect(x, 2, 3, s - 4);
            }
            ctx.strokeStyle = '#1a1a2e';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, s, s);
        }));

        // Desk
        this.spriteCache.set('desk', this.createTilePattern(size, CONFIG.COLORS.DESK, (ctx, s) => {
            // Desk surface
            ctx.fillStyle = '#7a6a5a';
            ctx.fillRect(2, 2, s - 4, s - 4);
            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = 2;
            ctx.strokeRect(2, 2, s - 4, s - 4);
        }));

        // Exit
        this.spriteCache.set('exit', this.createTilePattern(size, '#2a4a2a', (ctx, s) => {
            // Arrow pattern
            ctx.fillStyle = '#44ff44';
            ctx.beginPath();
            ctx.moveTo(s / 2, 4);
            ctx.lineTo(s - 4, s / 2);
            ctx.lineTo(s / 2, s - 4);
            ctx.closePath();
            ctx.fill();
        }));
    },

    /**
     * Create a tile pattern/sprite
     */
    createTilePattern(size, baseColor, drawFunc) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base color
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, size, size);

        // Custom drawing
        if (drawFunc) {
            drawFunc(ctx, size);
        }

        return canvas;
    },

    /**
     * Main render loop
     */
    render(gameState) {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a12';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (!gameState || !gameState.map) return;

        // Render layers
        this.renderTiles(gameState.map);
        this.renderGrid(gameState.map);
        this.renderMovementRange();
        this.renderAttackRange();
        this.renderPathPreview();
        this.renderUnits(gameState.playerUnits, gameState.enemyUnits, gameState.map);
        this.renderFogOfWar(gameState.map);
        this.renderHoveredTile();
        this.renderAnimations();
        this.renderParticles();
    },

    /**
     * Render map tiles
     */
    renderTiles(map) {
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const screenPos = this.tileToScreen(x, y);
                const tile = map.getTile(x, y);

                // Only render explored or visible tiles
                if (!map.isExplored(x, y)) continue;

                this.renderTile(screenPos.x, screenPos.y, tile);
            }
        }
    },

    /**
     * Render a single tile
     */
    renderTile(x, y, tileType) {
        let spriteKey;

        switch (tileType) {
            case CONFIG.TILES.WALL:
                spriteKey = 'wall';
                break;
            case CONFIG.TILES.COVER_LOW:
                spriteKey = 'cover_low';
                break;
            case CONFIG.TILES.COVER_HIGH:
                spriteKey = 'cover_high';
                break;
            case CONFIG.TILES.DESK:
                spriteKey = 'desk';
                break;
            case CONFIG.TILES.EXIT:
                spriteKey = 'exit';
                break;
            default:
                spriteKey = 'floor';
        }

        const sprite = this.spriteCache.get(spriteKey);
        if (sprite) {
            this.ctx.drawImage(sprite, x, y, this.tileSize, this.tileSize);
        } else {
            // Fallback solid color
            this.ctx.fillStyle = CONFIG.COLORS.FLOOR;
            this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        }
    },

    /**
     * Render grid overlay
     */
    renderGrid(map) {
        this.ctx.strokeStyle = CONFIG.COLORS.GRID;
        this.ctx.lineWidth = 1;

        for (let y = 0; y <= map.height; y++) {
            const screenY = y * this.tileSize + this.camera.y;
            this.ctx.beginPath();
            this.ctx.moveTo(this.camera.x, screenY);
            this.ctx.lineTo(this.camera.x + map.width * this.tileSize, screenY);
            this.ctx.stroke();
        }

        for (let x = 0; x <= map.width; x++) {
            const screenX = x * this.tileSize + this.camera.x;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, this.camera.y);
            this.ctx.lineTo(screenX, this.camera.y + map.height * this.tileSize);
            this.ctx.stroke();
        }
    },

    /**
     * Render movement range highlight
     */
    renderMovementRange() {
        if (!this.movementRange || this.movementRange.length === 0) return;

        this.ctx.fillStyle = CONFIG.COLORS.MOVE_RANGE;

        for (const tile of this.movementRange) {
            const screenPos = this.tileToScreen(tile.x, tile.y);
            this.ctx.fillRect(screenPos.x, screenPos.y, this.tileSize, this.tileSize);
        }
    },

    /**
     * Render attack range highlight
     */
    renderAttackRange() {
        if (!this.attackRange || this.attackRange.length === 0) return;

        this.ctx.fillStyle = CONFIG.COLORS.ATTACK_RANGE;

        for (const tile of this.attackRange) {
            const screenPos = this.tileToScreen(tile.x, tile.y);
            this.ctx.fillRect(screenPos.x, screenPos.y, this.tileSize, this.tileSize);
        }
    },

    /**
     * Render path preview
     */
    renderPathPreview() {
        if (!this.pathPreview || this.pathPreview.length === 0) return;

        this.ctx.fillStyle = CONFIG.COLORS.MOVE_PATH;

        for (const tile of this.pathPreview) {
            const screenPos = this.tileToScreen(tile.x, tile.y);
            const padding = this.tileSize * 0.2;
            this.ctx.fillRect(
                screenPos.x + padding,
                screenPos.y + padding,
                this.tileSize - padding * 2,
                this.tileSize - padding * 2
            );
        }
    },

    /**
     * Render all units
     */
    renderUnits(playerUnits, enemyUnits, map) {
        const allUnits = [...playerUnits, ...enemyUnits];

        // Sort by Y position for proper overlap
        allUnits.sort((a, b) => a.y - b.y);

        for (const unit of allUnits) {
            if (!unit.isAlive) continue;

            // Check visibility for enemies
            if (unit.team === 'enemy' && !map.isVisible(unit.x, unit.y)) {
                // Don't render hidden enemies
                if (unit.isHidden) continue;
                // Render last known position dimmed
                if (!map.isExplored(unit.x, unit.y)) continue;
            }

            this.renderUnit(unit, map);
        }
    },

    /**
     * Render a single unit
     */
    renderUnit(unit, map) {
        const screenPos = this.tileToScreen(unit.x, unit.y);
        const isVisible = map.isVisible(unit.x, unit.y);
        const isSelected = this.selectedUnit && this.selectedUnit.id === unit.id;

        // Dim if not currently visible
        this.ctx.globalAlpha = isVisible ? 1 : 0.5;

        // Selection highlight
        if (isSelected) {
            this.ctx.strokeStyle = CONFIG.COLORS.FRIENDLY_SELECTED;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                screenPos.x + 2,
                screenPos.y + 2,
                this.tileSize - 4,
                this.tileSize - 4
            );
        }

        // Unit background circle
        const centerX = screenPos.x + this.tileSize / 2;
        const centerY = screenPos.y + this.tileSize / 2;
        const radius = this.tileSize * 0.4;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = unit.team === 'player' ? CONFIG.COLORS.FRIENDLY : CONFIG.COLORS.ENEMY;
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = unit.team === 'player' ? '#2a6fcf' : '#aa2222';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Unit icon
        this.ctx.font = `${this.tileSize * 0.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(unit.icon, centerX, centerY);

        // Health bar
        this.renderHealthBar(screenPos.x, screenPos.y + this.tileSize - 6, this.tileSize, 4, unit.hp, unit.maxHP);

        // Status effect indicator
        if (unit.status !== CONFIG.STATUS.NONE) {
            this.renderStatusIndicator(screenPos.x + this.tileSize - 8, screenPos.y, unit.status);
        }

        // Overwatch indicator
        if (unit.isOverwatching) {
            this.ctx.fillStyle = CONFIG.COLORS.OVERWATCH;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x + 8, screenPos.y + 8, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
    },

    /**
     * Render health bar
     */
    renderHealthBar(x, y, width, height, current, max) {
        const percentage = current / max;

        // Background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x + 2, y, width - 4, height);

        // Health fill
        let color;
        if (percentage > 0.6) color = CONFIG.COLORS.HP_HIGH;
        else if (percentage > 0.3) color = CONFIG.COLORS.HP_MED;
        else color = CONFIG.COLORS.HP_LOW;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + 2, y, (width - 4) * percentage, height);

        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 2, y, width - 4, height);
    },

    /**
     * Render status effect indicator
     */
    renderStatusIndicator(x, y, status) {
        let icon;
        let color;

        switch (status) {
            case CONFIG.STATUS.OVERWATCH:
                icon = '👁';
                color = '#ffd700';
                break;
            case CONFIG.STATUS.STUNNED:
                icon = '💫';
                color = '#888888';
                break;
            case CONFIG.STATUS.CHARMED:
                icon = '💕';
                color = '#ff69b4';
                break;
            case CONFIG.STATUS.FRIGHTENED:
                icon = '😨';
                color = '#8b008b';
                break;
            case CONFIG.STATUS.MARKED:
                icon = '🎯';
                color = '#ff4444';
                break;
            case CONFIG.STATUS.BUFFED:
                icon = '⬆';
                color = '#44ff44';
                break;
            default:
                return;
        }

        this.ctx.font = '12px Arial';
        this.ctx.fillText(icon, x, y + 10);
    },

    /**
     * Render fog of war
     */
    renderFogOfWar(map) {
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const screenPos = this.tileToScreen(x, y);

                if (!map.isExplored(x, y)) {
                    // Unexplored - complete darkness
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                    this.ctx.fillRect(screenPos.x, screenPos.y, this.tileSize, this.tileSize);
                } else if (!map.isVisible(x, y)) {
                    // Explored but not visible - dim
                    this.ctx.fillStyle = CONFIG.COLORS.EXPLORED;
                    this.ctx.fillRect(screenPos.x, screenPos.y, this.tileSize, this.tileSize);
                }
            }
        }
    },

    /**
     * Render hovered tile highlight
     */
    renderHoveredTile() {
        if (!this.hoveredTile) return;

        const screenPos = this.tileToScreen(this.hoveredTile.x, this.hoveredTile.y);

        this.ctx.strokeStyle = CONFIG.COLORS.GRID_HOVER;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            screenPos.x + 1,
            screenPos.y + 1,
            this.tileSize - 2,
            this.tileSize - 2
        );
    },

    /**
     * Render active animations
     */
    renderAnimations() {
        const now = performance.now();
        this.animations = this.animations.filter(anim => {
            const progress = (now - anim.startTime) / anim.duration;

            if (progress >= 1) {
                if (anim.onComplete) anim.onComplete();
                return false;
            }

            anim.render(this.ctx, progress, this);
            return true;
        });
    },

    /**
     * Render particles
     */
    renderParticles() {
        const now = performance.now();

        this.particles = this.particles.filter(particle => {
            const age = now - particle.startTime;
            if (age >= particle.lifetime) return false;

            const progress = age / particle.lifetime;
            const alpha = 1 - progress;

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity

            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            this.ctx.globalAlpha = 1;

            return true;
        });
    },

    /**
     * Add animation
     */
    addAnimation(animation) {
        animation.startTime = performance.now();
        this.animations.push(animation);
    },

    /**
     * Create attack animation
     */
    createAttackAnimation(fromX, fromY, toX, toY, hit, critical) {
        const from = this.tileToScreen(fromX, fromY);
        const to = this.tileToScreen(toX, toY);

        from.x += this.tileSize / 2;
        from.y += this.tileSize / 2;
        to.x += this.tileSize / 2;
        to.y += this.tileSize / 2;

        return {
            duration: 300,
            render: (ctx, progress, renderer) => {
                const x = Utils.lerp(from.x, to.x, Utils.easeOutQuad(progress));
                const y = Utils.lerp(from.y, to.y, Utils.easeOutQuad(progress));

                // Projectile trail
                ctx.strokeStyle = hit ? '#ff4444' : '#888888';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(x, y);
                ctx.stroke();

                // Projectile head
                ctx.fillStyle = hit ? (critical ? '#ffff00' : '#ff4444') : '#888888';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            },
            onComplete: () => {
                if (hit) {
                    this.createHitParticles(to.x, to.y, critical);
                }
            },
        };
    },

    /**
     * Create movement animation
     */
    createMoveAnimation(unit, path) {
        const startPos = this.tileToScreen(path[0].x, path[0].y);

        return {
            duration: path.length * 100,
            render: (ctx, progress, renderer) => {
                const pathProgress = progress * (path.length - 1);
                const currentIndex = Math.floor(pathProgress);
                const nextIndex = Math.min(currentIndex + 1, path.length - 1);
                const segmentProgress = pathProgress - currentIndex;

                const from = renderer.tileToScreen(path[currentIndex].x, path[currentIndex].y);
                const to = renderer.tileToScreen(path[nextIndex].x, path[nextIndex].y);

                // Trail effect
                ctx.strokeStyle = 'rgba(74, 159, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);

                ctx.beginPath();
                ctx.moveTo(startPos.x + renderer.tileSize / 2, startPos.y + renderer.tileSize / 2);
                for (let i = 0; i <= currentIndex; i++) {
                    const pos = renderer.tileToScreen(path[i].x, path[i].y);
                    ctx.lineTo(pos.x + renderer.tileSize / 2, pos.y + renderer.tileSize / 2);
                }
                ctx.stroke();
                ctx.setLineDash([]);

                // Update unit position for rendering
                unit.x = path[nextIndex].x;
                unit.y = path[nextIndex].y;
            },
            onComplete: () => {
                unit.x = path[path.length - 1].x;
                unit.y = path[path.length - 1].y;
            },
        };
    },

    /**
     * Create hit particles
     */
    createHitParticles(x, y, critical) {
        const count = critical ? 20 : 10;
        const colors = critical ?
            ['#ffff00', '#ff8800', '#ff4444'] :
            ['#ff4444', '#ff8888', '#ffaaaa'];

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 2,
                size: Math.random() * 4 + 2,
                color: Utils.randomChoice(colors),
                startTime: performance.now(),
                lifetime: 500 + Math.random() * 300,
            });
        }
    },

    /**
     * Create death animation
     */
    createDeathAnimation(unit) {
        const pos = this.tileToScreen(unit.x, unit.y);
        pos.x += this.tileSize / 2;
        pos.y += this.tileSize / 2;

        // Create lots of particles
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: pos.x,
                y: pos.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 3,
                size: Math.random() * 6 + 2,
                color: unit.team === 'player' ? '#4a9fff' : '#ff4444',
                startTime: performance.now(),
                lifetime: 800 + Math.random() * 400,
            });
        }

        return {
            duration: 500,
            render: (ctx, progress, renderer) => {
                const scale = 1 + progress * 0.5;
                const alpha = 1 - progress;

                ctx.globalAlpha = alpha;
                ctx.font = `${this.tileSize * 0.5 * scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(unit.icon, pos.x, pos.y - progress * 20);
                ctx.globalAlpha = 1;
            },
        };
    },

    /**
     * Clear all render state
     */
    clear() {
        this.hoveredTile = null;
        this.selectedUnit = null;
        this.movementRange = [];
        this.attackRange = [];
        this.pathPreview = [];
        this.animations = [];
        this.particles = [];
    },

    /**
     * Set movement range to display
     */
    setMovementRange(tiles) {
        this.movementRange = tiles || [];
    },

    /**
     * Set attack range to display
     */
    setAttackRange(tiles) {
        this.attackRange = tiles || [];
    },

    /**
     * Set path preview to display
     */
    setPathPreview(path) {
        this.pathPreview = path || [];
    },

    /**
     * Set selected unit
     */
    setSelectedUnit(unit) {
        this.selectedUnit = unit;
    },

    /**
     * Set hovered tile
     */
    setHoveredTile(tile) {
        this.hoveredTile = tile;
    },
};

// Export
window.Renderer = Renderer;
