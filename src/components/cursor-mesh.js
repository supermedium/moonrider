/**
 * Cursor mesh to show at intersection point with respective hand.
 */
AFRAME.registerComponent('cursor-mesh', {
  schema: {
    active: {default: true},
    cursorEl: {type: 'selector'}
  },

  init: function () {
    this.scenePivotEl = document.getElementById('scenePivot');
  },

  update: function () {
    this.el.object3D.visible = this.data.active;
  },

  tick: function () {
    var cursor;
    var cursorEl = this.data.cursorEl;
    var el = this.el;
    var intersection;
    var intersectedEl;
    var scenePivotEl = this.scenePivotEl;

    if (!this.data.active) { return; }

    cursor = cursorEl.components.cursor;
    if (!cursor) { return; }

    // Look for valid intersection target.
    intersectedEl = cursorEl.components.cursor.intersectedEl;
    if (intersectedEl) {
      el.object3D.visible = true;
    } else {
      el.object3D.visible = false;
      return;
    }

    // Update cursor mesh.
    intersection = cursorEl.components.raycaster.getIntersection(intersectedEl);
    if (!intersection) { return; }

    el.object3D.position.copy(intersection.point);

    if (scenePivotEl) {
      el.object3D.rotation.copy(scenePivotEl.object3D.rotation);
    }
  }
});
