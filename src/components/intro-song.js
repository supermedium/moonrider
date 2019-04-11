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

    if (!oldData.isSearching && this.data.isSearching) { return; }

    // Play.
    if (!oldData.isPlaying && this.data.isPlaying) {
      this.analyserEl.components.audioanalyser.resumeContext();
      this.analyserEl.setAttribute('audioanalyser', 'src', audio);
      this.fadeInAudio();
    }

    // Pause.
    if (oldData.isPlaying && !this.data.isPlaying) { audio.pause(); }
  },

  pause: function () {
    this.audio.pause();
  },

  play: function () {
    this.fadeInAudio();
  },

  fadeInAudio: function () {
    if (AFRAME.utils.getUrlParameter('mute')) { return; }
    const context = this.analyserEl.components.audioanalyser.context;
    const gainNode = this.analyserEl.components.audioanalyser.gainNode;
    gainNode.gain.setValueAtTime(0, context.currentTime);
    this.audio.play();
    gainNode.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.5);
  }
});
