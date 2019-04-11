/**
 * Laser beam.
 * Automatically set length on intersection.
 */
AFRAME.registerComponent('cursor-laser', {
  dependencies: ['geometry'],

  schema: {
    enabled: {default: true}
  },

  init: function () {
    const el = this.el;
    this.weaponEl = this.el.closest('.weapon');

    // Calculate size to position beam at tip of controller.
    const geometry = this.el.getAttribute('geometry');
    el.object3D.position.z = -1 * geometry.height / 2;
    this.originalSize = geometry.height;
    this.currentLength = geometry.height;
  },

  update: function () {
    this.el.object3D.visible = this.data.enabled;
  },

  tick: function () {
    const el = this.el;

    if (!this.data.enabled) { return; }

    const cursor = this.weaponEl.components.cursor;
    if (!cursor) { return; }

    // Toggle beam.
    const intersectedEl = cursor.intersectedEl;

    if (!intersectedEl) {
      // Retract the beam if not intersecting.
      el.object3D.position.z = -24.98;
      el.object3D.scale.x = 0.75;
      el.getObject3D('mesh').scale.y = 50;
      this.currentLength = 1;
      return;
    }

    // Set appropriate length of beam on intersection.
    const intersection = this.weaponEl.components.raycaster.intersections[0];
    if (!intersection) { return; }
    el.object3D.scale.x = 1;
    el.object3D.position.z = (-intersection.distance / 2);
    el.getObject3D('mesh').scale.y = this.currentLength = intersection.distance;
  }
});
