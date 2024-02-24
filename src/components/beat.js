import { PUNCH_OFFSET, SWORD_OFFSET } from './beat-generator';
const COLORS = require('../constants/colors.js');

const auxObj3D = new THREE.Object3D();
const bbox = new THREE.Box3();
const otherBbox = new THREE.Box3();
const collisionZThreshold = -1.65;

const ANGLE_DOT_SUPER = 0.97; // ~15-degrees.
const ANGLE_DOT_MIN = 0.625; // ~50-degrees.
const WARMUP_TIME = 2000;
const WARMUP_ROTATION_CHANGE = 2 * Math.PI;

const elasticEasing = getElasticEasing(1.33, 0.5);

const DESTROYED_SPEED = 1.0;
const ONCE = { once: true };
const DESTROY_TIME = 1000;

// Play sound and explode at reach to test sync.
const SYNC_TEST = !!AFRAME.utils.getUrlParameter('synctest');
const syncTestObject3D = new THREE.Object3D();
const syncTestVector3 = new THREE.Vector3();

const MINE = 'mine';
const CLASSIC = 'classic';
const DOT = 'dot';
const PUNCH = 'punch';
const RIDE = 'ride';

const CUT_DIRECTION_VECTORS = {
  up: new THREE.Vector3(0, 1, 0),
  down: new THREE.Vector3(0, -1, 0),
  left: new THREE.Vector3(-1, 0, 0),
  right: new THREE.Vector3(1, 0, 0),
  upleft: new THREE.Vector3(-1, 1, 0).normalize(),
  upright: new THREE.Vector3(1, 1, 0).normalize(),
  downleft: new THREE.Vector3(-1, -1, 0).normalize(),
  downright: new THREE.Vector3(1, -1, 0).normalize()
};

const MODELS = {
  arrowblue: 'blueBeatObjTemplate',
  arrowred: 'redBeatObjTemplate',
  dotblue: 'dotBlueObjTemplate',
  dotred: 'dotRedObjTemplate',
  mine: 'mineObjTemplate'
};

const WEAPON_COLORS = { right: 'blue', left: 'red' };

const ROTATIONS = {
  right: 0,
  upright: 45,
  up: 90,
  upleft: 135,
  left: 180,
  downleft: 225,
  down: 270,
  downright: 315
};

const SIZES = {
  [CLASSIC]: 0.48,
  [PUNCH]: 0.35,
  [RIDE]: 0.4
};

AFRAME.registerComponent('beat-system', {
  schema: {
    gameMode: { default: 'classic', oneOf: ['classic', 'punch', 'ride'] },
    hasVR: { default: false },
    inVR: { default: false },
    isLoading: { default: false },
    isPlaying: { default: false }
  },

  init: function () {
    this.beats = [];
    this.beatsToCheck = [];
    this.blades = [];
    this.fists = [];
    this.weapons = null;

    this.bladeEls = this.el.sceneEl.querySelectorAll('a-entity[blade]');
    this.curveFollowRig = document.getElementById('curveFollowRig');
    this.punchEls = this.el.sceneEl.querySelectorAll('a-entity[punch]');
    this.curveEl = document.getElementById('curve');
    this.size = SIZES[this.data.gameMode];
    this.supercurveFollow = null;
  },

  play: function () {
    for (let i = 0; i < 2; i++) {
      this.blades.push(this.bladeEls[i].components.blade);
      this.fists.push(this.punchEls[i].components.punch);
    }

    this.supercurve = this.curveEl.components.supercurve;
    this.supercurveFollow = this.curveFollowRig.components['supercurve-follow'];
  },

  update: function (oldData) {
    this.size = SIZES[this.data.gameMode];

    if (oldData.isLoading && !this.data.isLoading) {
      this.updateBeatPositioning();
      this.weaponOffset = this.data.gameMode === CLASSIC ? SWORD_OFFSET * 1.15 : PUNCH_OFFSET;
      this.weaponOffset = this.weaponOffset / this.supercurve.curve.getLength();
    }

    if (oldData.gameMode !== this.data.gameMode) {
      this.weapons = this.data.gameMode === CLASSIC ? this.blades : this.fists;
    }
  },

  tick: function (t, dt) {
    if (!this.data.isPlaying || this.data.gameMode === RIDE) { return; }

    const beatsToCheck = this.beatsToCheck;
    const curve = this.supercurve.curve;
    const progress = this.supercurveFollow.songProgress;

    // Filter for beats that should be checked for collisions.
    beatsToCheck.length = 0;
    for (let i = 0; i < this.beats.length; i++) {
      const beat = this.beats[i];

      // Check beat is not already destroyed.
      if (beat.destroyed) { continue; }

      // Check if beat is close enough to be hit.
      const beatProgress = beat.songPosition - this.weaponOffset;
      if (progress < beatProgress) { continue; }

      // Check if beat should be filtered out due to not being in front.
      let inFront = true;
      for (let i = 0; i < beatsToCheck.length; i++) {
        if (beat.horizontalPosition === beatsToCheck[i].horizontalPosition &&
          beat.verticalPosition === beatsToCheck[i].verticalPosition &&
          beat.songPosition > beatsToCheck[i].songPosition) {
          inFront = false;
        }
        if (!inFront) { break; }
      }
      if (inFront) { beatsToCheck.push(beat); }
    }

    // Update bounding boxes and velocities.
    this.weapons[0].tickBeatSystem(t, dt);
    this.weapons[1].tickBeatSystem(t, dt);

    // No beats to check means to collision to check.
    if (!beatsToCheck.length) { return; }

    // Check hits.
    for (let i = 0; i < beatsToCheck.length; i++) {
      // If ?synctest=true, auto-explode beat and play sound to easily test sync.
      if ((SYNC_TEST || !this.data.hasVR) && beatsToCheck[i].data.type !== MINE) {
        beatsToCheck[i].autoHit(this.weapons[0].el);
        continue;
      }
      this.checkCollision(beatsToCheck[i], this.weapons[0], this.weapons[1]);
    }
  },

  checkCollision: function (beat, weapon1, weapon2) {
    // Mine.
    if (beat.data.type === MINE) {
      if (weapon1.checkCollision(beat)) {
        beat.onHit(weapon1.el);
        return;
      }
      if (weapon2.checkCollision(beat)) {
        beat.onHit(weapon2.el);
      }
      return;
    }

    // Successful hit, let the beat handle further processing.
    const correctWeapon = WEAPON_COLORS[weapon1.el.dataset.hand] === beat.data.color
      ? weapon1
      : weapon2;
    if (correctWeapon.checkCollision(beat)) {
      beat.onHit(correctWeapon.el);
      return;
    }

    // If not successful hit, check if mismatched hit.
    const wrongWeapon = correctWeapon === weapon1 ? weapon2 : weapon1;
    if (wrongWeapon.checkCollision(beat)) {
      // Minimum speed for wrong beat.
      if (this.data.gameMode === 'classic' && wrongWeapon.strokeSpeed < 15) {
        return;
      }

      if (this.data.gameMode === 'punch' && wrongWeapon.speed < 2) {
        return;
      }

      beat.onHit(wrongWeapon.el, true);
      beat.destroyBeat(wrongWeapon.el, false);
    }
  },

  horizontalPositions: {},

  verticalPositions: {},

  /**
   * Update positioning between blocks, vertically and horizontally depending on
   * game mode, and the height of the user.
   *
   * Adjustment revolves primary around SIZES, and the hMargin multiply factor.
   */
  updateBeatPositioning: (function () {
    // Have punches be higher.
    const BOTTOM_HEIGHTS = {
      [CLASSIC]: 0.95,
      [RIDE]: 0.95,
      [PUNCH]: 1.20
    };

    const BOTTOM_HEIGHT_MIN = 0.4;
    const REFERENCE_HEIGHT = 1.6;

    return function () {
      const gameMode = this.data.gameMode;
      const horizontalPositions = this.horizontalPositions;
      const verticalPositions = this.verticalPositions;

      const heightOffset = this.el.sceneEl.camera.el.object3D.position.y - REFERENCE_HEIGHT;
      const size = SIZES[gameMode];

      // Horizontal margin based on size of blocks so they don't overlap, which a smidge
      // of extra margin.
      // For punch mode, we want a wider horizontal spread in punch range, but not vertical.
      const hMargin = gameMode === CLASSIC ? size : size * 1.2;
      horizontalPositions.left = -1.5 * hMargin;
      horizontalPositions.middleleft = -0.5 * hMargin;
      horizontalPositions.middle = hMargin;
      horizontalPositions.middleright = 0.5 * hMargin;
      horizontalPositions.right = 1.5 * hMargin;

      // Vertical margin based on size of blocks so they don't overlap.
      // And then overall shifted up and down based on user height (camera Y).
      // But not too low to go underneath the ground.
      const bottomHeight = BOTTOM_HEIGHTS[gameMode];
      const vMargin = size;
      verticalPositions.bottom = Math.max(
        BOTTOM_HEIGHT_MIN,
        bottomHeight + heightOffset);
      verticalPositions.middle = Math.max(
        BOTTOM_HEIGHT_MIN + vMargin,
        bottomHeight + vMargin + heightOffset);
      verticalPositions.top = Math.max(
        BOTTOM_HEIGHT_MIN + vMargin * 2,
        bottomHeight + (vMargin * 2) + heightOffset);
    };
  })(),

  registerBeat: function (beatComponent) {
    this.beats.push(beatComponent);
  },

  unregisterBeat: function (beatComponent) {
    this.beats.splice(this.beats.indexOf(beatComponent), 1);
  }
});

/**
 * Bears, beats, Battlestar Galactica.
 * Create beat from pool, collision detection, movement, scoring.
 */
AFRAME.registerComponent('beat', {
  schema: {
    color: { default: 'red', oneOf: ['red', 'blue'] },
    debug: { default: false },
    type: { default: 'arrow', oneOf: ['arrow', DOT, MINE] }
  },

  init: function () {
    this.bbox = null;
    this.beatSystem = this.el.sceneEl.components['beat-system'];
    this.broken = null;
    this.brokenPoolName = undefined;
    this.destroyed = false;
    this.hitEventDetail = {};
    this.poolName = undefined;
    this.returnToPoolTimer = DESTROY_TIME;
    this.rotationAxis = new THREE.Vector3();
    this.superCutIdx = 0;
    this.startPositionZ = undefined;
    this.warmupTime = 0;
    this.weaponColors = { right: 'blue', left: 'red' };
    this.curveEl = document.getElementById('curve');
    this.curveFollowRig = document.getElementById('curveFollowRig');
    this.mineParticles = document.getElementById('mineParticles');
    this.rigContainer = document.getElementById('rigContainer');
    this.superCuts = document.querySelectorAll('.superCutFx');

    this.verticalPositions = this.beatSystem.verticalPositions;

    this.explodeEventDetail = {
      beatDirection: '',
      color: this.data.color,
      correctHit: false,
      direction: new THREE.Vector3(),
      gameMode: '',
      position: new THREE.Vector3(),
      rotation: new THREE.Euler()
    };

    this.blockEl = document.createElement('a-entity');
    this.blockEl.setAttribute('mixin', 'beatBlock');
    this.el.appendChild(this.blockEl);
    this.initMesh();

    if (this.data.type === MINE) {
      this.poolName = 'pool__beat-mine';
    } else {
      this.poolName = `pool__beat-${this.data.type}-${this.data.color}`;
    }
  },

  tick: function (time, timeDelta) {
    const el = this.el;
    const data = this.data;

    // Delay these events into next frame to spread out the workload.
    if (this.queueBeatHitEvent) {
      el.sceneEl.emit('beathit', this.queueBeatHitEvent, true);
      this.queueBeatHitEvent = null;
    } else if (this.queueBeatWrongEvent) {
      el.sceneEl.emit('beatwrong', null, true);
      this.queueBeatWrongEvent = null;
    }

    if (this.destroyed) {
      this.returnToPoolTimer -= timeDelta;
      if (this.returnToPoolTimer <= 0) { this.returnToPool(); }
      return;
    }

    // Warmup animation.
    if (this.warmupTime < WARMUP_TIME) {
      const progress = elasticEasing(this.warmupTime / WARMUP_TIME);
      el.object3D.rotation.y = this.rotationStart + (progress * this.rotationChange);
      el.object3D.position.y = this.positionStart + (progress * this.positionChange);
      this.warmupTime += timeDelta;
    }

    // Check if past the camera to return to pool.
    const returnDistance = this.data.type === 'mine' ? 0.25 : 1.25;
    if ((el.object3D.position.z - returnDistance) > this.curveFollowRig.object3D.position.z) {
      this.returnToPool();
      this.missHit();
    }
  },

  /**
   * Called when summoned by beat-generator.
   * Called after updatePosition.
   */
  onGenerate: function (songPosition, horizontalPosition, verticalPosition, cutDirection, heightOffset) {
    const data = this.data;
    const el = this.el;

    this.beatSystem.registerBeat(this);

    // Model is 0.29 size. We make it 1.0 so we can easily scale based on 1m size.
    const FACTOR = 1 / 0.29;
    const size = SIZES[this.beatSystem.data.gameMode] * FACTOR;
    this.blockEl.object3D.scale.set(size, size, size);

    cutDirection = cutDirection || 'down';
    this.cutDirection = cutDirection;
    this.horizontalPosition = horizontalPosition;
    this.verticalPosition = verticalPosition;
    this.songPosition = songPosition;

    if (!this.blockEl) {
      console.warn('Unable to generate beat. blockEl was undefined.');
      return;
    }

    this.blockEl.object3D.visible = true;
    this.destroyed = false;
    el.object3D.visible = true;

    this.warmupTime = 0;

    // Set position.
    const supercurve = this.curveEl.components.supercurve;
    supercurve.getPointAt(songPosition, el.object3D.position);
    supercurve.alignToCurve(songPosition, el.object3D);
    el.object3D.position.x += this.beatSystem.horizontalPositions[horizontalPosition];

    if (data.type !== DOT) {
      el.object3D.rotation.z = THREE.Math.degToRad(ROTATIONS[cutDirection]);
    }

    // Set up rotation warmup.
    this.rotationStart = el.object3D.rotation.y;
    this.rotationChange = WARMUP_ROTATION_CHANGE;
    if (Math.random > 0.5) { this.rotationChange *= -1; }

    // Set up position warmup.
    const offset = 0.5;
    el.object3D.position.y -= offset;
    this.positionStart = el.object3D.position.y;
    this.positionChange = this.verticalPositions[verticalPosition] + offset + heightOffset;
  },

  /**
   * Set geometry and maybe material.
   */
  initMesh: function () {
    const blockEl = this.blockEl;
    const el = this.el;
    const type = this.data.type;

    setObjModelFromTemplate(
      blockEl,
      MODELS[type !== 'mine' ? `${type}${this.data.color}` : type]);

    blockEl.setAttribute('materials', 'name', 'beat');
    const mesh = blockEl.getObject3D('mesh');
    mesh.geometry.computeBoundingBox();

    this.bbox = mesh.geometry.boundingBox;

    if (this.data.type === 'mine') {
      const expand = new THREE.Vector3();
      this.bbox.getSize(expand);
      expand.multiplyScalar(-0.25);
      this.bbox.expandByVector(expand);
    }
  },

  wrongHit: function () {
    this.destroyed = true;
    this.queueBeatWrongEvent = true;
  },

  missHit: function () {
    if (this.data.type === MINE) { return; }
    this.el.sceneEl.emit('beatmiss', null, true);
  },

  destroyBeat: function (weaponEl, correctHit) {
    const data = this.data;
    const explodeEventDetail = this.explodeEventDetail;
    const rig = this.rigContainer.object3D;

    this.blockEl.object3D.visible = false;

    this.destroyed = true;
    this.returnToPoolTimer = DESTROY_TIME;

    explodeEventDetail.beatDirection = this.cutDirection;
    explodeEventDetail.color = this.data.color;
    explodeEventDetail.correctHit = correctHit;
    explodeEventDetail.gameMode = this.beatSystem.data.gameMode;
    explodeEventDetail.position.copy(this.el.object3D.position);
    rig.worldToLocal(explodeEventDetail.position);

    let brokenPoolName;
    if (this.data.type === MINE) {
      brokenPoolName = 'pool__beat-broken-mine';
    } else {
      const mode = this.beatSystem.data.gameMode === CLASSIC ? 'beat' : PUNCH;
      brokenPoolName = `pool__${mode}-broken-${this.data.color}`;
      if (this.data.type === DOT) {
        brokenPoolName += '-dot';
      }
    }

    this.broken = this.el.sceneEl.components[brokenPoolName].requestEntity();
    if (this.broken) {
      this.broken.emit('explode', this.explodeEventDetail, false);
    }

    if (this.beatSystem.data.gameMode === CLASSIC && correctHit) {
      weaponEl.components.trail.pulse();
    }
  },

  /**
   * Check if need to return to pool.
   */
  returnToPool: function () {
    this.beatSystem.unregisterBeat(this);
    this.el.object3D.position.set(0, 0, -9999);
    this.el.object3D.visible = false;
    this.el.sceneEl.components[this.poolName].returnEntity(this.el);
  },

  onHit: function (weaponEl, wrongHit) {
    const data = this.data;

    // Haptics.
    try {
      weaponEl.components.haptics__beat.pulse();
    } catch (err) {
      console.log(err);
    }

    // Sound.
    this.el.parentNode.components['beat-hit-sound'].playSound(this.el, this.cutDirection);

    if (wrongHit) {
      this.wrongHit();
      return;
    }

    if (data.type === MINE) {
      this.destroyBeat(weaponEl, false);
      this.el.sceneEl.emit('minehit', null, true);
      return;
    }

    // Do blade-related checks.
    if (this.beatSystem.data.gameMode === CLASSIC) {
      let dot = 0;
      if (data.type === 'arrow') {
        const blade = weaponEl.components.blade;
        dot = blade.strokeDirectionVector.dot(CUT_DIRECTION_VECTORS[this.cutDirection]);
        if (dot < ANGLE_DOT_MIN) {
          this.destroyBeat(weaponEl, false);
          this.wrongHit();
          return;
        }
      }
      this.destroyBeat(weaponEl, true);
      this.calculateScoreBlade(weaponEl, dot);
      return;
    }

    // Do punch-related checks.
    if (this.beatSystem.data.gameMode === PUNCH) {
      this.destroyBeat(weaponEl, true);
      this.calculateScorePunch(weaponEl);
    }
  },

  /**
   * Emit score and show score effects.
   * Called by multiple modes (blade, punch).
   */
  score: function (score, percent) {
    const el = this.el;
    const hitEventDetail = this.hitEventDetail;

    score = Math.ceil(parseInt(score, 10) / 10) * 10;
    hitEventDetail.percent = percent;
    hitEventDetail.score = score;
    this.queueBeatHitEvent = hitEventDetail;

    // Super FX.
    if (percent >= 100) {
      this.superCuts[this.superCutIdx].components.supercutfx.createSuperCut(
        el.object3D, this.data.color);
      this.superCutIdx = (this.superCutIdx + 1) % this.superCuts.length;
    }
  },

  /**
   * Blade scoring.
   */
  calculateScoreBlade: function (bladeEl, angleDot) {
    const SUPER_SCORE_SPEED = 10;
    const speed = bladeEl.components.blade.strokeSpeed;
    const speedScore = (bladeEl.components.blade.strokeSpeed / SUPER_SCORE_SPEED) * 30;

    let score;
    if (speed <= SUPER_SCORE_SPEED) {
      score = Math.min(speedScore, 30);
    } else {
      score = remap(clamp(speed, 10, 25), 10, 25, 30, 50);
    }

    let percent = Math.min(speedScore, 30);

    // 70% score on direction.
    if (this.data.type === DOT) {
      score += 70;
      percent += 70;
    } else {
      score += angleDot * 70;
      if (angleDot > ANGLE_DOT_SUPER) {
        percent += 70;
      } else {
        percent += angleDot * 70;
      }
    }

    this.score(score, percent);
  },

  /**
   * A possible To Do would be to score based on punch velocity and direction.
   * More points scored if punching straight down the curve.
   */
  calculateScorePunch: function (punchEl) {
    const base = 60; // Get 60% of the score just by hitting the beat.

    const SUPER_SCORE_SPEED = 1.5;
    const speed = punchEl.components.punch.speed;
    const speedScore = (speed / SUPER_SCORE_SPEED) * 40;

    let score;
    if (speed <= SUPER_SCORE_SPEED) {
      score = base + Math.min(speedScore, 40);
    } else {
      score = base + remap(clamp(speed, 1.5, 6), 1.5, 6, 40, 70);
    }

    const percent = base + Math.min(speedScore, 40);
    this.score(score, percent);
  },

  /**
   * Play hit if SYNC_TEST or 2D viewer mode.
   */
  autoHit: function (weaponEl) {
    const el = this.el;
    this.destroyBeat(weaponEl, Math.random() < 0.9);
    el.parentNode.components['beat-hit-sound'].playSound(el, this.cutDirection);
    const hitEventDetail = this.hitEventDetail;
    hitEventDetail.percent = 100;
    hitEventDetail.score = 100;
    this.queueBeatHitEvent = hitEventDetail;
  }
});

/**
 * Load OBJ from already parsed and loaded OBJ template.
 */
const geometries = {};
function setObjModelFromTemplate (el, templateId) {
  // Load into cache.
  if (!geometries[templateId]) {
    const templateEl = document.getElementById(templateId);
    if (templateEl.getObject3D('mesh')) {
      // Set cache.
      geometries[templateId] = templateEl.getObject3D('mesh').children[0].geometry;
    } else {
      // Wait.
      templateEl.addEventListener('object3dset', evt => {
        if (evt.detail.type !== 'mesh') { return; }
        setObjModelFromTemplate(el, templateId);
      }, ONCE);
      return;
    }
  }

  // Set geometry.
  if (geometries[templateId]) {
    if (!el.getObject3D('mesh')) { el.setObject3D('mesh', new THREE.Mesh()); }
    el.getObject3D('mesh').geometry = geometries[templateId];
  }
}

function getElasticEasing (a, p) {
  return t => 1 - elastic(a, p)(1 - t);
}

function elastic (amplitude, period) {
  function minMax (val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  const a = minMax(amplitude || 1, 1, 10);
  const p = minMax(period || 0.5, .1, 2);
  return t => {
    return (t === 0 || t === 1)
      ? t
      : -a * Math.pow(2, 10 * (t - 1)) *
      Math.sin((((t - 1) - (p / (Math.PI * 2) *
        Math.asin(1 / a))) * (Math.PI * 2)) / p);
  };
}

function remap (value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function clamp (val, min, max) {
  return Math.min(Math.max(val, min), max);
}
