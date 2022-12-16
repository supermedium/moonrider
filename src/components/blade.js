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

    this.bladeHandle = el.querySelector('.bladeHandleHelper').object3D;
    this.bladeTip = el.querySelector('.bladeTipHelper').object3D;

    this.rigEl = document.getElementById('curveFollowRig');
    this.strokeDirectionVector = new THREE.Vector3();
    this.strokeSpeed = 0;
    this.bladeBottomPosition = new THREE.Vector3();
    this.bladeTipPositions = [
      new THREE.Vector3(), // Oldest.
      new THREE.Vector3(),
      new THREE.Vector3() // Most recent.
    ];
    this.bladeWorldPositions = [
      new THREE.Vector3(), // Current frame tip.
      new THREE.Vector3(), // Current frame handle.
      new THREE.Vector3(), // Last frame tip.
      new THREE.Vector3(), // Last frame handle.
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
    const bladeTipPositions = this.bladeTipPositions;
    const bladeWorldPositions = this.bladeWorldPositions;
    const data = this.data;

    /*
    if (this.el.closest('#rightHand')) {
      this.createDebugCube(this.bladeHandle.getWorldPosition(new THREE.Vector3()), 0xFF0000)
      this.createDebugCube(this.blade.getWorldPosition(new THREE.Vector3()), 0x00FF00)
    }
    */

    // Previous frame.
    bladeWorldPositions[2].copy(bladeWorldPositions[0]);
    bladeWorldPositions[3].copy(bladeWorldPositions[1]);

    // Current frame.
    this.bladeTip.getWorldPosition(bladeWorldPositions[0]);
    this.bladeHandle.getWorldPosition(bladeWorldPositions[1]);
    bladeTipPositions[2].copy(bladeWorldPositions[0]);

    // Cover to rig to calculate stroke direction.
    this.rigEl.object3D.worldToLocal(bladeTipPositions[2]);

    // Distance covered but the blade tip in one frame.
    this.strokeDirectionVector.copy(bladeTipPositions[2]).sub(bladeTipPositions[0]);
    const distance = this.strokeDirectionVector.length();
    this.strokeSpeed = distance / (delta / 1000);

    this.strokeDirectionVector.z = 0;
    this.strokeDirectionVector.normalize();

    // Move down the queue. Calculate direction through several frames for less noise.
    const oldest = bladeTipPositions.shift();
    bladeTipPositions.push(oldest);
  },

  checkCollision: (function () {
    const bbox = new THREE.Box3();
    const bladeLocalPositions = [new THREE.Vector3(), new THREE.Vector3(),
      new THREE.Vector3(), new THREE.Vector3()];
    const bladeLocalTriangle = new THREE.Triangle();
    const LEFT = 'left';
    const RIGHT = 'right';

    return function (beat) {
      if (this.strokeSpeed < 1) { return false; }

      // Convert points to beat space.
      for (let i = 0; i < 3; i++) {
        bladeLocalPositions[i].copy(this.bladeWorldPositions[i]);
        beat.blockEl.object3D.worldToLocal(bladeLocalPositions[i]);
        bladeLocalPositions[i].multiplyScalar(1.75);
      }

      // Current frame triangle.
      bladeLocalTriangle.set(
        bladeLocalPositions[0],
        bladeLocalPositions[1],
        bladeLocalPositions[2]);

      // Increase hitbox for high beats.
      bbox.copy(beat.bbox);
      bbox.expandByScalar(0.02);
      if (beat.horizontalPosition === LEFT || beat.horizontalPosition === RIGHT) {
        bbox.expandByScalar(0.07);
      }

      if (bbox.intersectsTriangle(bladeLocalTriangle)) { return true; }

      // Previous frame triangle.
      // Only checked if the current frame triangle does not intersect.
      bladeLocalPositions[3].copy(this.bladeWorldPositions[3]);
      beat.blockEl.object3D.worldToLocal(bladeLocalPositions[3]);
      bladeLocalTriangle.set(bladeLocalPositions[2], bladeLocalPositions[3],
        bladeLocalPositions[0]);
      if (bbox.intersectsTriangle(bladeLocalTriangle)) { return true; }

      return false;
    };
  })(),

  createDebugCube: function (v, color) {
    const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: color, side: THREE.DoubleSide}));
    mesh.position.copy(v);
    this.el.sceneEl.object3D.add(mesh);
  }
});
