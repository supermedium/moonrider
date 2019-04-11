/**
 * Blade, swing, strokes.
 */
AFRAME.registerComponent('blade', {
  schema: {
    enabled: {default: false},
    strokeMinSpeed: {default: 0.002},
    strokeMinDuration: {default: 40}
  },

  init: function () {
    const el = this.el;
    const data = this.data;

    this.accumulatedDelta = 0;
    this.accumulatedDistance = 0;
    this.bboxEl = this.el.querySelector('.bladeBbox');
    this.bladePosition = new THREE.Vector3();
    this.bladeTipPosition = new THREE.Vector3();
    this.bladeTipPreviousPosition = new THREE.Vector3();
    this.bladeVector = new THREE.Vector3();
    this.boundingBox = new THREE.Box3();
    this.deltaSamples = [];
    this.distanceSamples = [];
    this.projectedBladeVector = new THREE.Vector3();
    this.rigEl = document.getElementById('curveFollowRig');
    this.strokeDirectionVector = new THREE.Vector3();
    this.swinging = false;
    this.xPlaneNormal = new THREE.Vector3(0, 1, 0);
    this.xyPlaneNormal = new THREE.Vector3(1, 1, 0);
    this.yPlaneNormal = new THREE.Vector3(1, 0, 0);

    this.bladeEl = this.el.querySelector('.blade');
  },

  update: function (oldData) {
    if (!oldData.enabled && this.data.enabled) {
      this.bladeEl.emit('drawblade');
    }
  },

  tick: function (time, delta) {
    if (!this.data.enabled) { return; }
    this.boundingBox.setFromObject(this.bboxEl.getObject3D('mesh'));
    this.detectStroke(delta);
  },

  detectStroke: function (delta) {
    const data = this.data;
    const distanceSamples = this.distanceSamples;
    const rig = this.rigEl.object3D;

    // Tip of the blade position in world coordinates.
    this.bladeTipPosition.set(0, 0, -0.8);
    this.bladePosition.set(0, 0, 0);

    const bladeObj = this.el.object3D;
    bladeObj.parent.updateMatrixWorld();
    bladeObj.localToWorld(this.bladeTipPosition);
    bladeObj.localToWorld(this.bladePosition);
    rig.worldToLocal(this.bladeTipPosition);
    rig.worldToLocal(this.bladePosition);

    // Angles between blade and major planes.
    this.bladeVector.copy(this.bladeTipPosition).sub(this.bladePosition).normalize();
    const anglePlaneX = this.projectedBladeVector.copy(this.bladeTipPosition)
      .projectOnPlane(this.xPlaneNormal).angleTo(this.bladeVector);
    const anglePlaneY = this.projectedBladeVector.copy(this.bladeTipPosition)
      .projectOnPlane(this.yPlaneNormal).angleTo(this.bladeVector);
    const anglePlaneXY = this.projectedBladeVector.copy(this.bladeTipPosition)
      .projectOnPlane(this.xyPlaneNormal).angleTo(this.bladeVector);

    // Distance covered but the blade tip in one frame.
    const distance = this.bladeTipPreviousPosition.sub(this.bladeTipPosition).length();

    // Sample distance of the last 5 frames.
    if (this.distanceSamples.length === 5) {
      this.accumulatedDistance -= this.distanceSamples.shift();
      this.accumulatedDelta -= this.deltaSamples.shift();
    }
    this.distanceSamples.push(distance);
    this.accumulatedDistance += distance;

    this.deltaSamples.push(delta);
    this.accumulatedDelta += delta;

    // Filter out blade movements that are too slow. Too slow is considered wrong hit.
    if (this.accumulatedDistance / this.accumulatedDelta > this.data.strokeMinSpeed) {
      // This filters out unintentional swings.
      if (!this.swinging) {
        this.swinging = true;
        this.strokeDuration = 0;
      }
      this.updateStrokeDirection();
      this.strokeDuration += delta;
      const anglePlaneXIncreased = anglePlaneX > this.maxAnglePlaneX;
      const anglePlaneYIncreased = anglePlaneY > this.maxAnglePlaneY;
      const anglePlaneXYIncreased = anglePlaneXY > this.maxAnglePlaneXY;
      this.maxAnglePlaneX = anglePlaneXIncreased ? anglePlaneX : this.maxAnglePlaneX;
      this.maxAnglePlaneY = anglePlaneYIncreased ? anglePlaneY : this.maxAnglePlaneY;
      this.maxAnglePlaneXY = anglePlaneXYIncreased ? anglePlaneXY : this.maxAnglePlaneXY;
      if (!anglePlaneXIncreased && !anglePlaneYIncreased) { this.endStroke(); }
    } else {
      this.endStroke();
    }

    this.bladeTipPreviousPosition.copy(this.bladeTipPosition);
  },

  endStroke: function () {
    if (!this.swinging || this.strokeDuration < this.data.strokeMinDuration) { return; }

    this.el.emit('strokeend');
    this.swinging = false;
    // Stroke finishes. Reset swinging state.
    this.accumulatedDistance = 0;
    this.accumulatedDelta = 0;
    this.maxAnglePlaneX = 0;
    this.maxAnglePlaneY = 0;
    this.maxAnglePlaneXY = 0;
    for (let i = 0; i < this.distanceSamples.length; i++) { this.distanceSamples[i] = 0; }
    for (let i = 0; i < this.deltaSamples.length; i++) { this.deltaSamples[i] = 0; }
  },

  updateStrokeDirection: function () {
    const bladeTrajectory = this.el.components.trail.bladeTrajectory;
    this.strokeDirectionVector
      .copy(bladeTrajectory[0].center)
      .sub(bladeTrajectory[bladeTrajectory.length - 1].center);
  }
});
