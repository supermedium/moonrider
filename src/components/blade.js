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

    this.bboxEl = this.el.querySelector('.bladeBbox');
    this.bladePosition = new THREE.Vector3();
    this.bladeTipPosition = new THREE.Vector3();
    this.bladeTipPreviousPosition = new THREE.Vector3();
    this.boundingBox = new THREE.Box3();
    this.rigEl = document.getElementById('curveFollowRig');
    this.strokeDirectionVector = new THREE.Vector3();
    this.strokeSpeed = 0;
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
    this.boundingBox.setFromObject(this.bboxEl.getObject3D('mesh'));
    this.updateVelocity(delta);
  },

  updateVelocity: function (delta) {
    const data = this.data;
    const rig = this.rigEl.object3D;

    // Tip of the blade position in world coordinates.
    this.bladeTipPosition.set(0, 0, -0.8);
    this.bladePosition.set(0, 0, 0);

    const bladeObj = this.el.object3D;
    bladeObj.localToWorld(this.bladeTipPosition);
    bladeObj.localToWorld(this.bladePosition);

    // Previous frame.
    this.bladeWorldPositions[2].copy(this.bladeWorldPositions[0]);
    this.bladeWorldPositions[3].copy(this.bladeWorldPositions[1]);

    // Current frame.
    this.bladeWorldPositions[0].copy(this.bladeTipPosition);
    this.bladeWorldPositions[1].copy(this.bladePosition);

    rig.worldToLocal(this.bladeTipPosition);
    rig.worldToLocal(this.bladePosition);

    // Distance covered but the blade tip in one frame.
    this.strokeDirectionVector.copy(this.bladeTipPosition).sub(this.bladeTipPreviousPosition);
    const distance = this.strokeDirectionVector.length();
    this.strokeDirectionVector.z = 0;
    this.strokeDirectionVector.normalize();
    this.strokeSpeed = distance / (delta / 1000);
    this.bladeTipPreviousPosition.copy(this.bladeTipPosition);
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
