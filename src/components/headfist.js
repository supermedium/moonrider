const enabled = !!AFRAME.utils.getUrlParameter('headfist');

AFRAME.registerComponent('headfist', {
  schema: {
    hand: {type: 'string'},
    isPlaying: {default: false}
  },

  init: function () {
    if (!enabled) { return; }

    this.el.object3D.position.set(
      this.data.hand === 'right' ? 0.15 : -0.15,
      0.1,
      -0.2
    );

    this.camera = document.getElementById('camera').getObject3D('camera');
    this.originalParent = this.el.object3D.parent;
  },

  update: function () {
    const el = this.el;

    if (!enabled) { return; }

    // Attach hands to head.
    if (this.data.isPlaying) {
      this.camera.add(el.object3D);
      el.components['tracked-controls'].pause();
      if (el.components['tracked-controls-webvr']) {
        el.components['tracked-controls-webvr'].pause();
      }
      if (el.components['tracked-controls-webxr']) {
        el.components['tracked-controls-webxr'].pause();
      }
      return;
    }

    // Add hands back.
    this.originalParent.add(el.object3D);
    if (el.components['tracked-controls-webvr']) {
      el.components['tracked-controls-webvr'].play();
    }
    if (el.components['tracked-controls-webxr']) {
      el.components['tracked-controls-webxr'].play();
    }
  }
});
