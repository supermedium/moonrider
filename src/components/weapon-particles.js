const HIT_LEFT = 'hitLeft';
const HIT_RIGHT = 'hitRight';
const PUNCH_WALL_RAY = {direction: {x: 0, y: -0.25, z: -1}};
const BLADE_WALL_RAY = {direction: {x: 0, y: 1, z: -1}};

/**
 * Show particles when touched by weapon.
 */
AFRAME.registerComponent('weapon-particles', {
  schema: {
    enabled: {default: false},
    gameMode: {default: ''},
    hand: {type: 'string'}
  },

  init: function () {
    this.hiddenIntersection = {x: 999, y: 0, z: 0};
    this.intersectedEl = null;

    this.weaponEnter = this.weaponEnter.bind(this);
    this.weaponLeave = this.weaponLeave.bind(this);
  },

  update: function (oldData) {
    if (oldData.gameMode !== this.data.gameMode) {
      this.el.setAttribute(
        'raycaster__game',
        this.data.gameMode === 'punch' ? PUNCH_WALL_RAY : BLADE_WALL_RAY);
    }
  },

  pause: function () {
    this.el.removeEventListener('mouseenter', this.weaponEnter);
    this.el.removeEventListener('mouseleave', this.weaponLeave);
  },

  play: function () {
    this.el.addEventListener('mouseenter', this.weaponEnter);
    this.el.addEventListener('mouseleave', this.weaponLeave);
  },

  weaponEnter: function (evt) {
    if (!this.data.enabled) { return; }
    if (evt.target !== this.el) { return; }
    if (!evt.detail.intersectedEl.hasAttribute('data-weapon-particles')) { return; }
    this.intersectedEl = evt.detail.intersectedEl;
  },

  weaponLeave: function (evt) {
    if (evt.detail.target !== this.el) { return; }

    // Hide hit intersection texture.
    if (this.intersectedEl.components.wall || this.intersectedEl.id === 'floor') {
      const uniform = this.data.hand === RIGHT ? HIT_RIGHT : HIT_LEFT;
      const material = this.intersectedEl.getObject3D('mesh').material;
      material.uniforms[uniform].value = this.hiddenIntersection;
    }
    this.intersectedEl = null;
  },

  tick: function (time, delta) {
    if (!this.data.enabled || !this.intersectedEl) { return; }

    const raycaster = this.el.components.raycaster__game;
    const intersection = raycaster.getIntersection(this.intersectedEl);

    if (!intersection) { return; }

    // Update intersection material if necessary.
    if (this.intersectedEl.components.wall || this.intersectedEl.id === 'floor') {
      const uniform = this.data.hand === 'right' ? HIT_RIGHT : HIT_LEFT;
      const material = this.intersectedEl.getObject3D('mesh').material;
      material.uniforms[uniform].value = intersection.point;
    }

  }
});
