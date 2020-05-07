AFRAME.registerComponent('no-frustum-cull', {
  init: function () {
    this.el.object3D.frustumCulled = false;
  }
});
