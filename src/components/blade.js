const SAMPLE_TIME = 40;

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
    this.lastSampleTime = 0;
    this.rigEl = document.getElementById('curveFollowRig');
    this.strokeDirectionVector = new THREE.Vector3();
    this.strokeSpeed = 0;

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
    this.calculateVelocity(time ,delta);
  },

  calculateVelocity: function (time, delta) {
    const data = this.data;
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

    // Distance covered but the blade tip in one frame.
    this.strokeDirectionVector.copy(this.bladeTipPosition).sub(this.bladeTipPreviousPosition);
    const distance = this.strokeDirectionVector.length();
    this.strokeDirectionVector.z = 0;
    this.strokeDirectionVector.normalize();
    this.strokeSpeed = distance / (delta / 1000);

    if (!this.lastSampleTime || time > (this.lastSampleTime + SAMPLE_TIME)) {
      this.bladeTipPreviousPosition.copy(this.bladeTipPosition);
    }
  }
});
