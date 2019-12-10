const enabled = !!AFRAME.utils.getUrlParameter('headfist');

AFRAME.registerComponent('headfist', {
  schema: {
    hand: {type: 'string'},
    isPlaying: {default: false}
  },

  init: function () {
    console.log(`[headfist] ${enabled}`);
    if (!enabled) { return; }

    this.camera = document.getElementById('camera').getObject3D('camera');
    this.originalParent = this.el.object3D.parent;
  },

  update: function () {
    const el = this.el;

    if (!enabled) { return; }

    // Attach hands to head.
    if (this.data.isPlaying) {
      console.log(`[headfist] Attach.`);
      this.camera.add(el.object3D);

      this.el.object3D.rotation.set(0, 0, 0);
      this.el.object3D.position.set(
        this.data.hand === 'right' ? 0.15 : -0.15,
        -1.5,
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
    console.log(`[headfist] Detach.`);
    this.originalParent.add(el.object3D);
    if (el.components['tracked-controls-webvr']) {
      el.components['tracked-controls-webvr'].play();
    }
    if (el.components['tracked-controls-webxr']) {
      el.components['tracked-controls-webxr'].play();
    }
  }
});
