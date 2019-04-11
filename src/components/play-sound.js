var SoundPool = require('../lib/soundpool');

AFRAME.registerSystem('play-sound', {
  init: function () {
    this.lastSoundPlayed = '';
    this.lastSoundPlayedTime = 0;
    this.pools = {};
  },

  createPool: function (sound, volume) {
    if (this.pools[sound]) { return; }
    this.pools[sound] = new SoundPool(sound, volume);
  },

  playSound: function (sound, volume) {
    if (!this.pools[sound]) {
      this.createPool(sound, volume);
    }
    this.pools[sound].play();

    this.lastSoundPlayed = sound;
    this.lastSoundTime = this.el.time;
  }
});

/**
 * Play sound on event.
 */
AFRAME.registerComponent('play-sound', {
  schema: {
    enabled: {default: true},
    event: {type: 'string'},
    sound: {type: 'string'},
    volume: {type: 'number', default: 1}
  },

  multiple: true,

  init: function () {
    this.el.addEventListener(this.data.event, evt => {
      if (!this.data.enabled) { return; }
      this.system.playSound(this.src, this.data.volume);
    });
  },

  update: function () {
    this.src = this.data.sound;
    if (this.data.sound.startsWith('#')) {
      this.src = document.querySelector(this.data.sound).getAttribute('src');
    }
  }
});
