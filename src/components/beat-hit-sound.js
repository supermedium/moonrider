const LAYER_BOTTOM = 'bottom';
const LAYER_MIDDLE = 'middle';
const LAYER_TOP = 'top';

const DIRECTIONS_TO_SOUNDS = {
  up: '',
  down: '',
  upleft: 'left',
  upright: 'right',
  downleft: 'left',
  downright: 'right',
  left: 'left',
  right: 'right'
};

/**
 * Beat hit sound using positional audio and audio buffer source.
 */
AFRAME.registerComponent('beat-hit-sound', {
  schema: {
    enabled: {default: false}
  },

  init: function () {
    this.currentBeatEl = null;
    this.currentCutDirection = '';
    this.processSound = this.processSound.bind(this);
    this.tick = AFRAME.utils.throttleTick(this.tick.bind(this), 500);
    this.volume = 0;

    // Sound pools.
    for (let i = 1; i <= 10; i++) {
      this.el.setAttribute(`sound__beathit${i}`, {
        poolSize: 8,
        positional: false,
        src: `#hitSound${i}`
      });
      this.el.setAttribute(`sound__beathit${i}left`, {
        poolSize: 8,
        positional: false,
        src: `#hitSound${i}left`
      });
      this.el.setAttribute(`sound__beathit${i}right`, {
        poolSize: 8,
        positional: false,
        src: `#hitSound${i}right`
      });
    }
  },

  play: function () {
    // Kick three.js loader...Don't know why sometimes doesn't load.
    for (let i = 1; i <= 10; i++) {
      if (!this.el.components[`sound__beathit${i}`].loaded) {
        this.el.setAttribute(`sound__beathit${i}`, 'src', '');
        this.el.setAttribute(`sound__beathit${i}`, 'src', `#hitSound${i}`);
      }
      if (!this.el.components[`sound__beathit${i}left`].loaded) {
        this.el.setAttribute(`sound__beathit${i}left`, 'src', '');
        this.el.setAttribute(`sound__beathit${i}left`, 'src', `#hitSound${i}left`);
      }
      if (!this.el.components[`sound__beathit${i}right`].loaded) {
        this.el.setAttribute(`sound__beathit${i}right`, 'src', '');
        this.el.setAttribute(`sound__beathit${i}right`, 'src', `#hitSound${i}right`);
      }
    }

    this.analyser =
      document.getElementById('audioAnalyser').components.audioanalyser.analyser;
    this.levels = new Uint8Array(this.analyser.frequencyBinCount);
  },

  playSound: function (beatEl, position, cutDirection) {
    const rand = 1 + Math.floor(Math.random() * 10);
    const dir = DIRECTIONS_TO_SOUNDS[cutDirection || 'up'];
    const soundPool = this.el.components[`sound__beathit${rand}${dir}`];
    soundPool.playSound(this.processSound);
  },

  /**
   * Set audio stuff before playing.
   */
  processSound: function (audio) {
    audio.setVolume(this.volume * this.volume);
  },

  tick: function () {
    if (!this.data.enabled) { return; }

    // Calculate volume of audio.
    this.analyser.getByteFrequencyData(this.levels);
    let sum = 0;
    for (let i = 0; i < this.levels.length; i++) {
      sum += this.levels[i];;
    }
    this.volume = sum / (this.levels.length * 256 - 1);
  }
});
