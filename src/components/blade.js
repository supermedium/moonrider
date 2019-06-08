/**
 * Blade, swing, strokes.
 */
AFRAME.registerComponent('blade', {
  schema: {
    enabled: {default: false}
  },

  init: function () {
    const el = this.el;
    const data = this.data;

    this.bladeBottomPosition = new THREE.Vector3();
    this.rigEl = document.getElementById('curveFollowRig');
    this.strokeDirectionVector = new THREE.Vector3();
    this.strokeSpeed = 0;
    this.bladeTipPositions = [
      new THREE.Vector3(),  // Oldest.
      new THREE.Vector3(),
      new THREE.Vector3()  // Most recent.
    ];
    this.bladeWorldPositions = [
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ];

    this.bladeEl = this.el.querySelector('.blade');
  },

  update: function (oldData) {
    if (!oldData.enabled && this.data.enabled) {
      this.bladeEl.emit('drawblade');
    }
  },

  tickBeatSystem: function (time, delta) {
    if (!this.data.enabled) { return; }
    this.updateVelocity(delta);
  },

  updateVelocity: function (delta) {
    const bladeTipPosition = this.bladeTipPositions[2];
    const data = this.data;
    const rig = this.rigEl.object3D;

    // Tip of the blade position in world coordinates.
    bladeTipPosition.set(0, 0, -0.89);
    this.bladeBottomPosition.set(0, 0, 0.22);

    const bladeObj = this.el.object3D;
    bladeObj.localToWorld(bladeTipPosition);
    bladeObj.localToWorld(this.bladeBottomPosition);

    // Previous frame.
    this.bladeWorldPositions[2].copy(this.bladeWorldPositions[0]);
    this.bladeWorldPositions[3].copy(this.bladeWorldPositions[1]);

    // Current frame.
    this.bladeWorldPositions[0].copy(bladeTipPosition);
    this.bladeWorldPositions[1].copy(this.bladeBottomPosition);

    rig.worldToLocal(bladeTipPosition);
    rig.worldToLocal(this.bladeBottomPosition);

    // Distance covered but the blade tip in one frame.
    this.strokeDirectionVector.copy(bladeTipPosition).sub(this.bladeTipPositions[0]);
    this.strokeDirectionVector.z = 0;
    this.strokeDirectionVector.normalize();

    const distance = this.strokeDirectionVector.length();
    this.strokeSpeed = distance / (delta / 1000);

    // Move down the queue. Calculate direction through several frames for less noise.
    const oldest = this.bladeTipPositions.shift();
    this.bladeTipPositions.push(oldest);
  },

  checkCollision: (function () {
    const bladeLocalPositions = [new THREE.Vector3(), new THREE.Vector3(),
                                 new THREE.Vector3(), new THREE.Vector3()];
    const bladeLocalTriangle = new THREE.Triangle();

    return function (beat) {
      for (let i = 0; i < 3; i++) {
        bladeLocalPositions[i].copy(this.bladeWorldPositions[i]);
        beat.blockEl.object3D.worldToLocal(bladeLocalPositions[i]);
      }

      // Current frame triangle.
      bladeLocalTriangle.set(bladeLocalPositions[0], bladeLocalPositions[1],
                             bladeLocalPositions[2]);
      if (beat.bbox.intersectsTriangle(bladeLocalTriangle)) { return true; }

      // Previous frame triangle.
      // Only checked if the current frame triangle does not intersect.
      bladeLocalPositions[3].copy(this.bladeWorldPositions[3]);
      beat.blockEl.object3D.worldToLocal(bladeLocalPositions[3]);
      bladeLocalTriangle.set(bladeLocalPositions[2], bladeLocalPositions[3],
                             bladeLocalPositions[0]);
      if (beat.bbox.intersectsTriangle(bladeLocalTriangle)) { return true; }

      return false;
    };
  })()
});
