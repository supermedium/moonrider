/**
 * Tell app to pause game if playing.
 */
AFRAME.registerComponent('pauser', {
  schema: {
    enabled: {default: true}
  },

  init: function () {
    this.pauseGame = this.pauseGame.bind(this);

    document.addEventListener('keydown', evt => {
      if (evt.keyCode === 27) { this.pauseGame(); }
    });

    this.el.sceneEl.addEventListener('controllerconnected', evt => {
      if (evt.detail.name === 'vive-controls') {
        this.el.addEventListener('menudown', this.pauseGame);
      } else {
        this.el.addEventListener('thumbstickdown', this.pauseGame);
        this.el.addEventListener('trackpaddown', this.pauseGame);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { this.pauseGame(); }
    });
  },

  pauseGame: function () {
    if (!this.data.enabled) { return; }
    this.el.sceneEl.emit('pausegame', null, false);
  }
});
