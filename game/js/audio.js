/**
 * LIBRARIAN STRIKE FORCE: The Overdue Reckoning
 * Procedural Audio System
 */

const AudioSystem = {
    context: null,
    masterVolume: 0.5,
    sfxVolume: 0.7,
    musicVolume: 0.3,
    enabled: true,
    musicPlaying: false,
    currentMusic: null,

    /**
     * Initialize the audio context
     */
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    },

    /**
     * Resume audio context (needed after user interaction)
     */
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    },

    /**
     * Create an oscillator with envelope
     */
    createOscillator(frequency, type, startTime, duration, volume = 0.5) {
        if (!this.context || !this.enabled) return null;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        // Connect to gain node and output
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        // Apply envelope
        const now = startTime || this.context.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * this.sfxVolume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        return { oscillator, gainNode, startTime: now, duration };
    },

    /**
     * Play a procedural sound effect
     */
    playSound(soundType) {
        if (!this.context || !this.enabled) return;

        this.resume();

        const now = this.context.currentTime;

        switch (soundType) {
            case 'click':
                this.playClick(now);
                break;
            case 'hover':
                this.playHover(now);
                break;
            case 'footstep':
                this.playFootstep(now);
                break;
            case 'attack':
                this.playAttack(now);
                break;
            case 'hit':
                this.playHit(now);
                break;
            case 'miss':
                this.playMiss(now);
                break;
            case 'critical':
                this.playCritical(now);
                break;
            case 'death':
                this.playDeath(now);
                break;
            case 'ability':
                this.playAbility(now);
                break;
            case 'turn_start':
                this.playTurnStart(now);
                break;
            case 'victory':
                this.playVictory(now);
                break;
            case 'defeat':
                this.playDefeat(now);
                break;
            case 'select':
                this.playSelect(now);
                break;
            case 'error':
                this.playError(now);
                break;
        }
    },

    /**
     * Menu click sound
     */
    playClick(now) {
        const osc = this.createOscillator(800, 'square', now, 0.1, 0.3);
        if (osc) {
            osc.oscillator.start(now);
            osc.oscillator.stop(now + 0.1);
        }
    },

    /**
     * Menu hover sound
     */
    playHover(now) {
        const osc = this.createOscillator(400, 'sine', now, 0.05, 0.1);
        if (osc) {
            osc.oscillator.start(now);
            osc.oscillator.stop(now + 0.05);
        }
    },

    /**
     * Footstep sound
     */
    playFootstep(now) {
        // Low thud
        const osc = this.createOscillator(100 + Math.random() * 50, 'triangle', now, 0.1, 0.2);
        if (osc) {
            osc.oscillator.start(now);
            osc.oscillator.stop(now + 0.1);
        }
    },

    /**
     * Attack/shoot sound
     */
    playAttack(now) {
        // Sharp attack sound
        const osc1 = this.createOscillator(300, 'sawtooth', now, 0.15, 0.4);
        const osc2 = this.createOscillator(150, 'square', now + 0.02, 0.1, 0.3);

        if (osc1) {
            osc1.oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.15);
            osc1.oscillator.start(now);
            osc1.oscillator.stop(now + 0.15);
        }
        if (osc2) {
            osc2.oscillator.start(now + 0.02);
            osc2.oscillator.stop(now + 0.12);
        }

        // Add noise burst
        this.playNoiseBurst(now, 0.1, 0.2);
    },

    /**
     * Hit sound
     */
    playHit(now) {
        // Impact sound
        const osc = this.createOscillator(200, 'triangle', now, 0.2, 0.5);
        if (osc) {
            osc.oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.2);
            osc.oscillator.start(now);
            osc.oscillator.stop(now + 0.2);
        }

        this.playNoiseBurst(now, 0.15, 0.3);
    },

    /**
     * Miss sound
     */
    playMiss(now) {
        // Whoosh sound
        const osc = this.createOscillator(400, 'sine', now, 0.2, 0.2);
        if (osc) {
            osc.oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2);
            osc.oscillator.start(now);
            osc.oscillator.stop(now + 0.2);
        }
    },

    /**
     * Critical hit sound
     */
    playCritical(now) {
        // Big impact
        this.playHit(now);

        // Add dramatic chord
        const frequencies = [200, 250, 300];
        frequencies.forEach((freq, i) => {
            const osc = this.createOscillator(freq, 'square', now + 0.05, 0.3, 0.3);
            if (osc) {
                osc.oscillator.start(now + 0.05);
                osc.oscillator.stop(now + 0.35);
            }
        });
    },

    /**
     * Death sound
     */
    playDeath(now) {
        // Descending tone
        const osc = this.createOscillator(400, 'sawtooth', now, 0.5, 0.4);
        if (osc) {
            osc.oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5);
            osc.oscillator.start(now);
            osc.oscillator.stop(now + 0.5);
        }

        this.playNoiseBurst(now + 0.1, 0.3, 0.2);
    },

    /**
     * Special ability sound
     */
    playAbility(now) {
        // Magical ascending arpeggio
        const notes = [300, 400, 500, 600];
        notes.forEach((freq, i) => {
            const osc = this.createOscillator(freq, 'sine', now + i * 0.08, 0.2, 0.3);
            if (osc) {
                osc.oscillator.start(now + i * 0.08);
                osc.oscillator.stop(now + i * 0.08 + 0.2);
            }
        });
    },

    /**
     * Turn start notification
     */
    playTurnStart(now) {
        const osc1 = this.createOscillator(523, 'sine', now, 0.15, 0.3); // C5
        const osc2 = this.createOscillator(659, 'sine', now + 0.15, 0.15, 0.3); // E5

        if (osc1) {
            osc1.oscillator.start(now);
            osc1.oscillator.stop(now + 0.15);
        }
        if (osc2) {
            osc2.oscillator.start(now + 0.15);
            osc2.oscillator.stop(now + 0.3);
        }
    },

    /**
     * Victory fanfare
     */
    playVictory(now) {
        const melody = [
            { freq: 523, time: 0, dur: 0.2 },      // C5
            { freq: 659, time: 0.2, dur: 0.2 },    // E5
            { freq: 784, time: 0.4, dur: 0.2 },    // G5
            { freq: 1047, time: 0.6, dur: 0.4 },   // C6
        ];

        melody.forEach(note => {
            const osc = this.createOscillator(note.freq, 'square', now + note.time, note.dur, 0.3);
            if (osc) {
                osc.oscillator.start(now + note.time);
                osc.oscillator.stop(now + note.time + note.dur);
            }
        });
    },

    /**
     * Defeat sound
     */
    playDefeat(now) {
        const melody = [
            { freq: 400, time: 0, dur: 0.3 },
            { freq: 350, time: 0.3, dur: 0.3 },
            { freq: 300, time: 0.6, dur: 0.3 },
            { freq: 200, time: 0.9, dur: 0.5 },
        ];

        melody.forEach(note => {
            const osc = this.createOscillator(note.freq, 'sawtooth', now + note.time, note.dur, 0.3);
            if (osc) {
                osc.oscillator.start(now + note.time);
                osc.oscillator.stop(now + note.time + note.dur);
            }
        });
    },

    /**
     * Unit select sound
     */
    playSelect(now) {
        const osc = this.createOscillator(600, 'sine', now, 0.1, 0.2);
        if (osc) {
            osc.oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
            osc.oscillator.start(now);
            osc.oscillator.stop(now + 0.1);
        }
    },

    /**
     * Error/invalid action sound
     */
    playError(now) {
        const osc = this.createOscillator(200, 'square', now, 0.15, 0.3);
        if (osc) {
            osc.oscillator.start(now);
            osc.oscillator.stop(now + 0.15);
        }

        const osc2 = this.createOscillator(150, 'square', now + 0.15, 0.15, 0.3);
        if (osc2) {
            osc2.oscillator.start(now + 0.15);
            osc2.oscillator.stop(now + 0.3);
        }
    },

    /**
     * Create noise burst (for impact sounds)
     */
    playNoiseBurst(startTime, duration, volume) {
        if (!this.context || !this.enabled) return;

        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        // Fill with white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.context.destination);

        gainNode.gain.setValueAtTime(volume * this.masterVolume * this.sfxVolume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        noise.start(startTime);
        noise.stop(startTime + duration);
    },

    /**
     * Start background music (procedural ambient)
     */
    startMusic() {
        if (!this.context || !this.enabled || this.musicPlaying) return;

        this.musicPlaying = true;
        this.playAmbientMusic();
    },

    /**
     * Stop background music
     */
    stopMusic() {
        this.musicPlaying = false;
        if (this.currentMusic) {
            this.currentMusic.forEach(node => {
                if (node && node.stop) node.stop();
            });
            this.currentMusic = null;
        }
    },

    /**
     * Play ambient procedural music
     */
    playAmbientMusic() {
        if (!this.musicPlaying || !this.context) return;

        const now = this.context.currentTime;
        const nodes = [];

        // Bass drone
        const bassFreq = Utils.randomChoice([55, 65, 73, 82]);
        const bass = this.context.createOscillator();
        const bassGain = this.context.createGain();

        bass.type = 'sine';
        bass.frequency.value = bassFreq;
        bass.connect(bassGain);
        bassGain.connect(this.context.destination);
        bassGain.gain.value = 0.1 * this.masterVolume * this.musicVolume;

        bass.start(now);
        bass.stop(now + 4);
        nodes.push(bass);

        // Ambient pad
        const padNotes = [
            bassFreq * 2,
            bassFreq * 2.5,
            bassFreq * 3,
        ];

        padNotes.forEach(freq => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(this.context.destination);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.03 * this.masterVolume * this.musicVolume, now + 1);
            gain.gain.linearRampToValueAtTime(0, now + 4);

            osc.start(now);
            osc.stop(now + 4);
            nodes.push(osc);
        });

        this.currentMusic = nodes;

        // Schedule next ambient phrase
        setTimeout(() => {
            if (this.musicPlaying) {
                this.playAmbientMusic();
            }
        }, 3500);
    },

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Utils.clamp(volume, 0, 1);
    },

    /**
     * Set SFX volume
     */
    setSFXVolume(volume) {
        this.sfxVolume = Utils.clamp(volume, 0, 1);
    },

    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Utils.clamp(volume, 0, 1);
    },

    /**
     * Toggle audio on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopMusic();
        }
        return this.enabled;
    },
};

// Make AudioSystem globally available
window.AudioSystem = AudioSystem;
