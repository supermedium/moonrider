/**
 * Calculate punch bounding box and velocity.
 */
AFRAME.registerComponent('punch', {
  schema: {
    enabled: {default: false}
  },

  init: function () {
    this.currentPos = new THREE.Vector3();
    this.direction = 0;
    this.lastSample = new THREE.Vector3();
    this.lastSampleTime = 0;
    this.speed = 0;

    this.bbox = new THREE.Box3();
    this.bboxEl = this.el.querySelector('.punchBbox');
  },

  play: function () {
    this.rig = this.el.closest('#curveFollowRig');
  },

  tick: function (time, dt) {
    if (!this.data.enabled) { return; }

    // Calculate velocity (direction + speed), m/s.
    this.direction = this.currentPos
      .copy(this.el.object3D.position)
      .sub(this.lastSample)

    this.speed = this.direction.length() / ((time - this.lastSampleTime) / 1000);

    this.lastSample.copy(this.el.object3D.position);
    this.lastSampleTime = time;
  },

  tickBeatSystem: function () {
    // Bounding box.
    this.bbox.setFromObject(this.bboxEl.getObject3D('mesh'));
  },

  checkCollision: (function () {
    const box = new THREE.Box3();
    const expand = new THREE.Vector3(0, 0, 0.2);

    return function (beat) {
      box.copy(beat.bbox).translate(beat.el.object3D.position).expandByScalar(0.1).expandByVector(expand);
      return this.bbox.intersectsBox(box);
    };
  })()
});
