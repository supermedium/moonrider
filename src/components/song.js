const utils = require('../utils');

const GAME_OVER_LENGTH = 3.5;
const ONCE = {once: true};
const BASE_VOLUME = 0.5;

let skipDebug = AFRAME.utils.getUrlParameter('skip');
if (!!skipDebug) {
  skipDebug = parseInt(skipDebug) / 1000;
} else {
  skipDebug = 0;
}

/**
 * Active challenge song / audio.
 *
 * Order of song init in conjuction with beat-generator:
 *
 * 1. previewStartTime is playing
 * 2. songloadfinish
 * 3. beat-generator preloading
 * 4. preloaded beats generated
 * 5. beat-generator preloading finish
 * 6. startAudio / songStartTime is set
 * 7. beat-generator continues off song current time
 */
AFRAME.registerComponent('song', {
  schema: {
    audio: {type: 'string'}, // Blob URL.
    analyserEl: {type: 'selector', default: '#audioAnalyser'},
    challengeId: {default: ''},
    isBeatsPreloaded: {default: false},
    isGameOver: {default: false},
    isLoading: {default: false},
    isPlaying: {default: false},
    isVictory: {default: false}
  },

  init: function () {
    this.analyserSetter = {buffer: true};
    this.audioAnalyser = this.data.analyserEl.components.audioanalyser;
    this.context = this.audioAnalyser.context;
    this.isAudioPlaying = false;
    this.songStartTime = 0;

    this.onSongComplete = this.onSongComplete.bind(this);

    // Base volume.
    this.audioAnalyser.gainNode.gain.value = BASE_VOLUME;

    this.el.addEventListener('gamemenurestart', this.onRestart.bind(this));
    this.el.addEventListener('wallhitstart', this.onWallHitStart.bind(this));
    this.el.addEventListener('wallhitend', this.onWallHitEnd.bind(this));

    if (process.env.NODE_ENV !== 'production') {
      this.el.addEventListener('victoryfake', () => {
        this.source.onended = null;
        this.source.stop();
        this.source.disconnect();
        this.onSongComplete();
      });
    }
  },

  update: function (oldData) {
    const data = this.data;

    // Loading start while audio blob URL already set.
    if (!oldData.isLoading && data.isLoading && data.audio) {
      this.processAudio();
      return;
    }

    // Audio blob URL set while already loading.
    if (!oldData.audio && data.audio && data.isLoading) {
      this.processAudio();
      return;
    }

    // Game over, slow down audio, and then stop.
    if (!oldData.isGameOver && data.isGameOver) {
      this.onGameOver();
      return;
    }

    if (oldData.isGameOver && !data.isGameOver) {
      this.audioAnalyser.gainNode.value = BASE_VOLUME;
    }

    // On victory screen, play song in background.
    if (!oldData.isVictory && data.isVictory) {
      this.data.analyserEl.addEventListener('audioanalyserbuffersource', evt => {
        this.audioAnalyser.resumeContext();
        const gain = this.audioAnalyser.gainNode.gain;
        gain.cancelScheduledValues(0);
        gain.setValueAtTime(0.05, 0);
        this.source = evt.detail;
        this.source.start();
        this.el.emit('victory');
      }, ONCE);
      this.audioAnalyser.refreshSource();
      return;
    }

    // New challenge, play if we have loaded and were waiting for beats to preload.
    if (!oldData.isBeatsPreloaded && this.data.isBeatsPreloaded && this.source) {
      this.startAudio();
    }

    if (oldData.challengeId && !data.challengeId) {
      this.stopAudio();
      return;
    }

    // Pause / stop.
    if (oldData.isPlaying && !data.isPlaying) {
      this.audioAnalyser.suspendContext();
      this.isAudioPlaying = false;
    }

    // Resume.
    if (!oldData.isPlaying && data.isPlaying && this.source) {
      this.audioAnalyser.resumeContext();
      this.isAudioPlaying = true;
    }
  },

  processAudio: function () {
    this.el.sceneEl.emit('songprocessstart', null, false);
    this.getAudio().then(source => {
      this.el.sceneEl.emit('songprocessfinish', null, false);
    }).catch(console.error);
  },

  getAudio: function () {
    const data = this.data;

    if (this.source) { this.stopAudio(); }

    this.isAudioPlaying = false;
    return new Promise(resolve => {
      data.analyserEl.addEventListener('audioanalyserbuffersource', evt => {
        // Finished decoding.
        this.source = evt.detail;
        resolve(this.source);
      }, ONCE);
      this.analyserSetter.src = this.data.audio;
      data.analyserEl.setAttribute('audioanalyser', this.analyserSetter);
    });
  },

  stopAudio: function () {
    if (!this.source) {
      console.warn('[song] Tried to stopAudio, but not playing.');
      return;
    }
    this.source.onended = null;
    if (this.isAudioPlaying) { this.source.stop(); }
    this.source.disconnect();
    this.source = null;
    this.isAudioPlaying = false;
  },

  onSongComplete: function () {
    if (!this.data.isPlaying) { return; }
    this.el.emit('songcomplete');
  },

  onGameOver: function () {
    this.isAudioPlaying = false;

    // Playback rate.
    const playbackRate = this.source.playbackRate;
    playbackRate.setValueAtTime(playbackRate.value, this.context.currentTime);
    playbackRate.linearRampToValueAtTime(0, this.context.currentTime + GAME_OVER_LENGTH);

    // Gain.
    const gain = this.audioAnalyser.gainNode.gain;
    gain.setValueAtTime(gain.value, this.context.currentTime);
    gain.linearRampToValueAtTime(0, this.context.currentTime + GAME_OVER_LENGTH);

    setTimeout(() => {
      if (!this.data.isGameOver) { return; }
      this.stopAudio();
    }, 3500);
  },

  onRestart: function () {
    this.isAudioPlaying = false;

    // Restart, get new buffer source node and play.
    if (this.source) { this.source.disconnect(); }

    // Clear gain interpolation values from game over.
    const gain = this.audioAnalyser.gainNode.gain;
    gain.cancelScheduledValues(0);

    this.data.analyserEl.addEventListener('audioanalyserbuffersource', evt => {
      this.source = evt.detail;
      this.el.sceneEl.emit('songloadfinish', null, false);
    }, ONCE);
    this.audioAnalyser.refreshSource();
  },

  onWallHitStart: function () {
    const gain = this.audioAnalyser.gainNode.gain;
    gain.linearRampToValueAtTime(0.1, this.context.currentTime + 0.1);
  },

  onWallHitEnd: function () {
    const gain = this.audioAnalyser.gainNode.gain;
    gain.linearRampToValueAtTime(BASE_VOLUME, this.context.currentTime + 0.1);
  },

  startAudio: function () {
    const gain = this.audioAnalyser.gainNode.gain;
    gain.setValueAtTime(BASE_VOLUME, this.context.currentTime);
    this.songStartTime = this.context.currentTime;
    this.source.onended = this.onSongComplete;
    this.source.start(0, skipDebug || 0);
    this.isAudioPlaying = true;
  },

  getCurrentTime: function () {
    return this.context.currentTime - this.songStartTime;
  }
});
