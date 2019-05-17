AFRAME.registerComponent('plume', {
  schema: {
    color: {default: ''},
    cutDirection: {default: ''},
    horizontalPosition: {default: 'middleleft', oneOf: ['left', 'middleleft', 'middleright', 'right']},
    songPosition: {default: 0},
    type: {default: 'arrow', oneOf: ['arrow', 'dot', 'mine']},
    verticalPosition: {default: 'middle', oneOf: ['bottom', 'middle', 'top']}
  },

  horizontalPositions: {
    left: -0.95,
    middleleft: -0.6,
    middleright: 0.6,
    right: 0.95
  },

  verticalPositions: {
    bottom: 1.3,
    middle: 1.55,
    top: 1.7
  },

  init: function () {
    this.curveEl = document.getElementById('curve');
    this.curveFollowRig = document.getElementById('curveFollowRig');
    this.handsEls = this.el.sceneEl.querySelectorAll('.handStar');
    this.handPos = new THREE.Vector3();

    this.el.sceneEl.addEventListener('cleargame', this.returnToPool.bind(this));
  },

  update: function () {
    if (this.data.type === 'mine') {
      this.poolName = 'pool__plume-mine';
    } else {
      this.poolName = `pool__plume-${this.data.type}-${this.data.color}`;
    }
  },

  onGenerate: function () {
    const data = this.data;
    const el = this.el;
    // Set position.
    const supercurve = this.curveEl.components.supercurve;
    supercurve.getPointAt(data.songPosition, el.object3D.position);
    supercurve.alignToCurve(data.songPosition, el.object3D);
    el.object3D.position.x += this.horizontalPositions[data.horizontalPosition];
    el.object3D.position.y += this.verticalPositions[data.verticalPosition];
    el.object3D.rotation.z = Math.random() * Math.PI * 2;
  },

  tock: function () {
    if (this.el.object3D.position.z > this.curveFollowRig.object3D.position.z + 10) {
      this.returnToPool();
      return;
    }

    // Check collisions with hands.
    for (let i = 0; i < this.handsEls.length; i++) {
      const hand = this.handsEls[i];
      hand.object3D.getWorldPosition(this.handPos);
      if (this.handPos.distanceToSquared(this.el.object3D.position) < 0.2) {
        hand.emit('plumepulse');
      }
    }
  },

  returnToPool: function () {
    this.el.object3D.position.set(0, 0, -9999);
    this.el.object3D.visible = false;
    if (this.el.isPlaying) {
      this.el.sceneEl.components[this.poolName].returnEntity(this.el);
    }
  }
});
