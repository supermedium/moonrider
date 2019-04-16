const DESTROY_TIME = 1000;
const MAX_VELOCITY = 0.01;

/**
 * Handles beat cut effects: fragments of beat and fx sprites
 */
AFRAME.registerComponent('beat-cut-fx', {
  schema: {
    color: {type:'string'},
    type: {oneOf: ['beat', 'dot', 'mine'], default: 'beat'}
  },

  init: function () {
    this.breaking = false;
    this.fx = null;
    this.fxpool = null;
    this.pieces = [];
    this.returnToPoolTimer = DESTROY_TIME;

    this.el.addEventListener('model-loaded', this.setupModel.bind(this));
    this.el.addEventListener('explode', this.explode.bind(this), false);
  },

  update: function () {
    const sceneEl = this.el.sceneEl;
    const color = this.data.color;
    if (this.data.type == 'beat'){
      this.material = sceneEl.systems.materials[color + 'BeatPieces'];
      this.pool = sceneEl.components[`pool__beat-broken-${color}`];
      this.poolBeatFx = sceneEl.components[`pool__beat-fx-${color}`];
      this.poolPunchFx = sceneEl.components[`pool__punch-fx-${color}`];
    } else if (this.data.type == 'dot'){
      this.material = sceneEl.systems.materials[color + 'BeatPieces'];
      this.pool = sceneEl.components[`pool__beat-broken-${color}-dot`];
      this.poolBeatFx = sceneEl.components[`pool__beat-fx-${color}`];
      this.poolPunchFx = sceneEl.components[`pool__punch-fx-${color}`];
    } else {
      this.material = sceneEl.systems.materials['minePieces'];
      this.pool = sceneEl.components['pool__beat-broken-mine'];
      this.poolBeatFx = sceneEl.components['pool__beat-fx-mine'];
      this.poolPunchFx = sceneEl.components['pool__punch-fx-mine'];
    }
  },

  setupModel: function (evt) {
    const model = evt.detail.model;
    this.pieces = model.children;
    for (let i = 0; i < this.pieces.length; i++) {
      let piece = this.pieces[i];
      piece.restPosition = piece.position.clone();
      piece.restRotation = piece.rotation.clone();
      piece.posVelocity = new THREE.Vector3();
      piece.rotVelocity = new THREE.Vector3();
      piece.material = this.material;
    }
  },

  auxVector: new THREE.Vector3(),

  explode: function (evt) {
    const position = evt.detail.position;
    const rotation = evt.detail.rotation;
    const beatRotation = evt.detail.beatRotation;
    const direction = evt.detail.direction;

    if (!position || !rotation || !direction) { return; }

    this.el.object3D.position.copy(position);
    if (this.data.type === 'beat') {
      direction.z *= 0.01;
      this.auxVector.copy(direction).multiplyScalar(-0.0025).clampLength(0, MAX_VELOCITY);
      for (let i = 0; i < this.pieces.length; i++) {
        let piece = this.pieces[i];
        piece.rotation.z = beatRotation;
        piece.posVelocity.copy(this.auxVector);
        piece.posVelocity.y += piece.position.y * 0.002;
        randomizeVector(piece.posVelocity, 0.001);
        randomizeVector(piece.rotVelocity, 0.003);
      }
    } else {
      for (let i = 0; i < this.pieces.length; i++) {
        let piece = this.pieces[i];
        piece.posVelocity.copy(piece.position).normalize().multiplyScalar(0.002);
        piece.posVelocity.z = -0.004;
        randomizeVector(piece.posVelocity, 0.001);
        randomizeVector(piece.rotVelocity, 0.01);
      }
    }

    if (this.fx === null) {
      this.fxpool = this[evt.detail.gameMode === 'classic' ? 'poolBeatFx' : 'poolPunchFx'];
      this.fx = this.fxpool.requestEntity();
    }
    if (this.fx) {
      this.fx.play();
      this.fx.object3D.position.copy(position);
      this.fx.object3D.rotation.copy(rotation);
      this.fx.getObject3D('mesh').rotation.x += Math.PI;
      this.fx.emit('explode');
    }

    this.returnToPoolTimer = DESTROY_TIME;
    this.breaking = true;
    this.el.play();
  },

  returnToPool: function () {
    for (let i = 0; i < this.pieces.length; i++) {
      let piece = this.pieces[i];
      piece.position.copy(piece.restPosition);
      piece.rotation.copy(piece.restRotation);
      piece.posVelocity.set(0.0, 0.0, 0.0);
      piece.rotVelocity.set(0.0, 0.0, 0.0);
      piece.scale.set(1.0, 1.0, 1.0);
    };

    if (this.fx) {
      this.fxpool.returnEntity(this.fx);
      this.fx = null;
    }

    this.pool.returnEntity(this.el);
    this.breaking = false;
  },

  tick: function (time, delta) {
    if (!this.breaking) { return; }

    this.returnToPoolTimer -= delta;
    if (this.returnToPoolTimer <= 0) {
      this.returnToPool();
      return;
    }

    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      piece.position.addScaledVector(piece.posVelocity, delta);
      piece.rotation.set(
        piece.rotation.x + piece.rotVelocity.x * delta,
        piece.rotation.y + piece.rotVelocity.y * delta,
        piece.rotation.z + piece.rotVelocity.z * delta);

      if (this.data.type !== 'mine') {
        if (this.returnToPoolTimer < DESTROY_TIME / 2) {
          piece.scale.multiplyScalar(0.94);
        }
        piece.posVelocity.multiplyScalar(0.97);
        // gravity
        piece.posVelocity.y -= 0.000003 * delta;
      } else {
        // Mines.
        piece.scale.multiplyScalar(0.94)
        piece.posVelocity.multiplyScalar(0.97);
      }
    }
  }
});

function randomizeVector (v, a){
  v.x += (Math.random() - 0.5) * a;
  v.y += (Math.random() - 0.5) * a;
  v.z += (Math.random() - 0.5) * a;
}
