/**
 * Trigger accuracy ring animation on victory screen.
 */
AFRAME.registerComponent('victory-accuracy-ring', {
  dependencies: ['geometry', 'material'],

  schema: {
    accuracy: {default: 0}
  },

  update: function () {
    this.el.getObject3D('mesh').material.uniforms.progress.value = 0;
    this.el.setAttribute('animation', 'to', this.data.accuracy / 100);
    this.el.components.animation.beginAnimation();
  }
});
