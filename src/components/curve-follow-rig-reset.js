/**
 * Reset curve follow rig pose back to beginning.
 */
AFRAME.registerComponent('curve-follow-rig-reset', {
  schema: {
    isVictory: {type: 'string'}
  },

  init: function () {
    const el = this.el;

    el.sceneEl.addEventListener('cleargame', () => {
      this.reset();
    });
  },

  update: function (oldData) {
    const data = this.data;
    const el = this.el;

    if (!oldData.isVictory && data.isVictory) { this.reset(); }
  },

  reset: function () {
    this.el.components['supercurve-follow'].curveProgress = 0;
    this.el.object3D.position.set(0, 0, 0);
    this.el.object3D.rotation.set(0, 0, 0);
  }
});
