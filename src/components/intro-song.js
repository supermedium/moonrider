AFRAME.registerComponent('intro-song', {
  schema: {
    isPlaying: {default: true},
    isSearching: {default: false}
  },

  init: function () {
    this.analyserEl = document.getElementById('audioAnalyser');
    this.audio = document.getElementById('introSong');
    this.timeout = null;
  },

  update: function (oldData) {
    const audio = this.audio;

    if (!this.el.sceneEl.isPlaying) { return; }

    // Pause.
    if (oldData.isPlaying && !this.data.isPlaying) { audio.pause(); }

    if (!oldData.isSearching && this.data.isSearching) { return; }

    // Play.
    if (!oldData.isPlaying && this.data.isPlaying) {
      this.analyserEl.components.audioanalyser.resumeContext();
      this.analyserEl.setAttribute('audioanalyser', 'src', audio);
      this.fadeInAudio();
    }
  },

  pause: function () {
    this.audio.pause();
  },

  play: function () {
    if (this.data.isPlaying && !this.data.isSearching) {
      this.fadeInAudio();
    }
  },

  fadeInAudio: function () {
    if (AFRAME.utils.getUrlParameter('mute')) { return; }
    const context = this.analyserEl.components.audioanalyser.context;
    const gainNode = this.analyserEl.components.audioanalyser.gainNode;
    gainNode.gain.setValueAtTime(0, context.currentTime);
    // A pause() racing with a still-pending play() can lose: the element
    // may briefly start playing after the pause. Chain off the play promise
    // and re-check the bound state once it settles, so we end up paused if
    // the state flipped while play was in flight.
    this.audio.play().then(() => {
      if (!this.data.isPlaying) { this.audio.pause(); }
    }).catch(() => {});
    gainNode.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.5);
  }
});
