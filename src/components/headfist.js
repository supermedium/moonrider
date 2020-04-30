const enabled = !!AFRAME.utils.getUrlParameter('headfist');

AFRAME.registerComponent('headfist', {
  schema: {
    hand: {type: 'string'},
    isPlaying: {default: false}
  },

  init: function () {
    console.log(`[headfist] ${enabled}`);
    if (!enabled) { return; }
    this.camera = document.getElementById('camera').object3D;
    this.originalParent = this.el.object3D.parent;
  },

  update: function () {
    const el = this.el;

    if (!enabled || !this.camera) { return; }

    // Attach hands to head.
    if (this.data.isPlaying) {
      this.camera.add(el.object3D);

      el.object3D.rotation.set(-5, 0, 0);
      el.object3D.position.set(
        this.data.hand === 'right' ? 0.175 : -0.175,
        0.15,
        -0.2
      );

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
    if (el.object3D.parent !== this.originalParent) {
      console.log(`[headfist] Detach.`);
      this.originalParent.add(el.object3D);
      if (el.components['tracked-controls-webvr']) {
        el.components['tracked-controls-webvr'].play();
      }
      if (el.components['tracked-controls-webxr']) {
        el.components['tracked-controls-webxr'].play();
      }
    }
  }
});
