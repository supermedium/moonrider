AFRAME.registerComponent('pause', {
  schema: {
    isPaused: {default: false}
  },

  update: function () {
    if (this.data.isPaused && this.el.isPlaying) {
      this.el.pause();
    } else if (!this.data.isPaused && !this.el.isPlaying && this.el.sceneEl.isPlaying) {
      this.el.play();
    }
  }
});
