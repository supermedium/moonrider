AFRAME.registerComponent('song-progress-info', {
  dependencies: ['geometry', 'material'],

  schema: {
    enabled: {default: false}
  },

  init: function () {
    this.tick = AFRAME.utils.throttleTick(this.tick.bind(this), 1000);

    this.progress = this.el.getObject3D('mesh');
    this.progress.geometry.translate(0.285, 0, 0);
    this.el.sceneEl.addEventListener('cleargame', () => {
      this.progress.scale.x = 0.0001;
    });
  },

  update: function (oldData) {
    this.progress.scale.x = 0.0001;
  },

  updateInfo: function () {
    const source = this.el.sceneEl.components.song.source;
    if (!source || !source.buffer) { return; }

    const progress =
    this.el.sceneEl.components.song.getCurrentTime() /
    source.buffer.duration;

    if (!progress) { return; }
    this.progress.scale.x = progress;
  },

  tick: function () {
    if (!this.data.enabled) { return; }
    this.updateInfo();
  }
});
