AFRAME.registerComponent('gameover', {
  schema: {
    isGameOver: {default: false}
  },

  init: function () {
    this.beatContainer = document.getElementById('beatContainer');
    this.gameOverEls = document.querySelectorAll('[animation__gameover]');
  },

  update: function (oldData) {
    var data = this.data;
    if (!oldData.isGameOver && this.data.isGameOver) {
      this.triggerAnimations();
      this.countDown = 1;
    }
    if (oldData.isGameOver && !this.data.isGameOver) {
      this.reset();
    }
  },

  tick: function (time, delta) {
    if (!this.data.isGameOver) { return; }
    if (this.countDown >= 0) {
      this.beatContainer.object3D.position.z = -Math.pow(1 - this.countDown, 2) * 1.5;
      this.countDown -= delta / 1000;
    }
  },

  reset: function () {
    this.beatContainer.object3D.position.z = 0;
    this.el.sceneEl.setAttribute('stage-colors', 'color', 'blue');
  },

  triggerAnimations: function () {
    for (let i = 0; i < this.gameOverEls.length; i++) {
      this.gameOverEls[i].emit('gameover', null, false);
    }
    this.el.emit('textglowoff', null, false);
    this.el.emit('bgcolorgameover', null, false);
  }
});
