/**
 * Calculate speed.
 */
AFRAME.registerComponent('hand-velocity', {
  schema: {
    enabled: {default: false}
  },

  init: function () {
    this.currentPos = new THREE.Vector3();
    this.direction = 0;
    this.lastSample = new THREE.Vector3();
    this.lastSampleTime = 0;
    this.speed = 0;
  },

  play: function () {
    this.rig = this.el.closest('#curveFollowRig');
  },

  tick: function (time) {
    if (!this.data.enabled) { return; }

    if ((time - this.lastSampleTime) < 50) { return; }

    // Calculate velocity (direction + speed), m/s.
    this.direction = this.currentPos
      .copy(this.el.object3D.position)
      .sub(this.lastSample)

    this.speed = this.direction.length() / ((time - this.lastSampleTime) / 1000);
    this.rig.object3D.localToWorld(this.direction);

    this.lastSample.copy(this.el.object3D.position);
    this.lastSampleTime = time;
  }
});
