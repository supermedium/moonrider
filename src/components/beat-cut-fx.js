const DESTROY_TIME = 1000;
const MAX_VELOCITY = 0.01;

/**
 * Handles beat cut effects: fragments of beat and fx sprites.
 */
AFRAME.registerComponent('beat-cut-fx', {
  schema: {
    color: {type: 'string'},
    type: {oneOf: ['beat', 'dot', 'mine'], default: 'beat'}
  },

  init: function () {
    this.breaking = false;
    this.pool = null;
    this.fx = null;
    this.fxpool = null;
    this.pieces = [];
    this.returnToPoolTimer = DESTROY_TIME;
    this.goodCut = true;

    this.el.addEventListener('model-loaded', this.setupModel.bind(this));
    this.el.addEventListener('explode', this.explode.bind(this), false);
  },

  update: function () {
    const sceneEl = this.el.sceneEl;
    const color = this.data.color;

    if (this.data.type === 'beat') {
      this.material = sceneEl.systems.materials[color + 'BeatPieces'];
      this.poolBeat = sceneEl.components[`pool__beat-broken-${color}`];
      this.poolBeatFx = sceneEl.components[`pool__beat-fx-${color}`];
      this.poolPunchFx = sceneEl.components[`pool__punch-fx-${color}`];
    } else if (this.data.type === 'dot') {
      this.material = sceneEl.systems.materials[color + 'BeatPieces'];
      this.poolBeat = sceneEl.components[`pool__beat-broken-${color}-dot`];
      this.poolPunch = sceneEl.components[`pool__punch-broken-${color}-dot`];
      this.poolBeatFx = sceneEl.components[`pool__beat-fx-${color}`];
      this.poolPunchFx = sceneEl.components[`pool__punch-fx-${color}`];
    } else {
      this.material = sceneEl.systems.materials['minePieces'];
      this.poolBeat = sceneEl.components['pool__beat-broken-mine'];
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

  rotations: {
    right: 0,
    upright: 45,
    up: 90,
    upleft: 135,
    left: 180,
    downleft: 225,
    down: 270,
    downright: 315
  },

  separations: {
    right: new THREE.Vector2(0, 1),
    upright: new THREE.Vector2(-0.5, 0.5),
    up: new THREE.Vector2(-1, 0),
    upleft: new THREE.Vector2(-0.5, -0.5),
    left: new THREE.Vector2(0, -1),
    downleft: new THREE.Vector2(0.5, -0.5),
    down: new THREE.Vector2(1, 0),
    downright: new THREE.Vector2(0.5, 0.5)
  },

  explode: function (evt) {
    const beatDirection = evt.detail.beatDirection;
    const direction = evt.detail.direction;
    const gameMode = evt.detail.gameMode;
    const goodCut = this.goodCut = evt.detail.goodCut;
    const position = evt.detail.position;
    const rotation = evt.detail.rotation;

    if (!position || !rotation || !direction || this.data.color !== evt.detail.color) {
      return;
    }

    this.el.object3D.position.copy(position);

    if (gameMode === 'classic' && this.data.type !== 'mine') {
      const isDot = this.data.type === 'dot';
      if (isDot && beatDirection.length <= 5) {
        beatDirection = Math.abs(direction.x) > Math.abs(direction.y) ? 'right' : 'down';
      }
      // minimize direction.z
      direction.z *= 0.01;
      this.auxVector.copy(direction).multiplyScalar(-0.0025).clampLength(0, MAX_VELOCITY);
      for (let i = 0; i < this.pieces.length; i++) {
        let piece = this.pieces[i];
        piece.posVelocity.copy(this.auxVector);
        piece.rotation.z = THREE.Math.degToRad(this.rotations[beatDirection]);
        if (goodCut) {
          // dir is a hardcoded value, based on the position of meshes in .OBJ files :P
          let dir = i % 2 == 0 ? -0.001 : 0.001;
          piece.posVelocity.x += this.separations[beatDirection].x * dir;
          piece.posVelocity.y += this.separations[beatDirection].y * dir;
          if (!isDot || i < 2) {
            randomizeVector(piece.posVelocity, 0.002);
            randomizeVector(piece.rotVelocity, 0.004);
          } else {
            // in dot, copy velocity and rotation from the "glued" chunk
            piece.posVelocity.copy(this.pieces[i-2].posVelocity);
            piece.rotVelocity.copy(this.pieces[i-2].rotVelocity);
          }
        } else {
          piece.posVelocity.y += 0.002;
          piece.rotVelocity.z += 0.01;
        }
      }
    } else {
      for (let i = 0; i < this.pieces.length; i++) {
        let piece = this.pieces[i];
        if (goodCut) {
          piece.posVelocity.copy(piece.position).normalize().multiplyScalar(0.002);
          piece.posVelocity.z = -0.004;
          randomizeVector(piece.posVelocity, 0.001);
          randomizeVector(piece.rotVelocity, 0.01);
        } else {
          piece.posVelocity.y += 0.001;
          piece.posVelocity.z -= 0.001;
        }
      }
    }

    this.pool = this[gameMode === 'classic' ? 'poolBeat' : 'poolPunch'];

    if (this.fx === null) {
      this.fxpool = this[gameMode === 'classic' ? 'poolBeatFx' : 'poolPunchFx'];
      this.fx = this.fxpool.requestEntity();
    }
    if (this.fx) {
      this.fx.play();
      this.fx.object3D.position.copy(position);
      this.fx.object3D.rotation.copy(rotation);
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
        // Gravity.
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
