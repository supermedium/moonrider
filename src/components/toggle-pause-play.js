AFRAME.registerComponent('toggle-pause-play', {
  schema: {
    isPlaying: { default: false }
  },

  update: function () {
    const action = this.data.isPlaying ? 'pause' : 'play';
    parent.postMessage(JSON.stringify({ verify: 'game-action', action}), '*');
  }
});
