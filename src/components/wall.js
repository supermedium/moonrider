const HEIGHT = 2.5;
const CEILING_THICKNESS = 1.5;
const CEILING_HEIGHT = 1.3;
const CEILING_WIDTH = 4;

// Currently reversed left / right because curve is upside down / mirrored.
const HORIZONTAL_POSITIONS = {
  left: 0.75,
  middleleft: 0.25,
  middleright: -0.25,
  right: -0.75
};

/**
 * Wall to dodge.
 */
AFRAME.registerComponent('wall', {
  dependencies: ['material'],

  schema: {
    horizontalPosition: {default: 'middleleft',
                         oneOf: ['left', 'middleleft', 'middleright', 'right']},
    isCeiling: {default: false},
    length: {default: 1},
    songPosition: {type: 'number'},  // From 0 to 1.
    width: {type: 'number'}
  },

  init: function () {
    this.curveEl = document.getElementById('curve');
    this.curveFollowRig = document.getElementById('curveFollowRig');
    this.el.setObject3D('mesh', new THREE.Mesh());
    this.geometry = null;
    this.localPosition = new THREE.Vector3();
    this.tick = AFRAME.utils.throttleTick(this.tick.bind(this), 1000);
  },

  update: function () {
    const data = this.data;
    const el = this.el;

    if (!data.songPosition) { return; }
    this.setWallGeometry(data.isCeiling);
    el.getObject3D('mesh').material.uniforms.opacity.value = 0;
    el.object3D.position.y = -5;
    el.components.animation__fadein.beginAnimation();
    el.components.animation__scalein.beginAnimation();
  },

  /**
   * Curve wall along curve by mapping box geometry vertices along curve using.
   * supercurve.getPositionRelativeToTangent.
   */
  setWallGeometry: (function () {
    const modifiedVertexPos = new THREE.Vector3();
    const left = new THREE.Vector3();
    const right = new THREE.Vector3();

    return function (isCeiling) {
      const data = this.data;
      const supercurve = this.curveEl.components.supercurve;

      const lengthPercent = data.length / supercurve.length;
      const startPercent = data.songPosition;
      const endPercent = data.songPosition + lengthPercent;

      const height = isCeiling ? CEILING_THICKNESS : HEIGHT;
      const width = isCeiling ? CEILING_WIDTH : data.width;

      // Offset vectors to get the left / right vertex points to pass into curve helper.
      // Note that curve is upside down so the positions are reversed...normally, this would
      // read as `+ (width / 2) - 0.25`.
      const centerPosition = HORIZONTAL_POSITIONS[data.horizontalPosition] -
                             (width / 2) + 0.25;
      left.x = data.isCeiling
        ? - 1 * width / 2
        : centerPosition - (width / 2);
      right.x = data.isCeiling
        ? width / 2
        : centerPosition + (width / 2);

      // TODO: Reuse box.
      const geo = this.geometry = new THREE.BoxBufferGeometry(width, height, 1, 1, 1, 30);
      const positions = geo.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        // Add half length (which will always be 1 / 2) for the box geometry offset.
        // Converts box Z from [-0.5, 0.5] to [0, 1] providing a percent.
        const vertexPercent = positions[i + 2] + 0.5;
        supercurve.getPositionRelativeToTangent(
          startPercent + (vertexPercent * (endPercent - startPercent)),
          positions[i] < 0 ? left : right,
          modifiedVertexPos);

        positions[i] = modifiedVertexPos.x;
        positions[i + 1] += modifiedVertexPos.y + height / 2;
        positions[i + 2] = modifiedVertexPos.z;
      }

      this.el.getObject3D('mesh').geometry = this.geometry;
      this.el.getObject3D('mesh').position.y = isCeiling ? CEILING_HEIGHT : 0.1;
    };
  })(),

  play: function () {
    this.el.object3D.visible = true;
    this.el.setAttribute('data-weapon-particles', '');
    this.el.setAttribute('data-wall-active', '');
    this.el.setAttribute('raycastable-game', '');
  },

  tick: function (time, timeDelta) {
    const data = this.data;
    const curveProgress = this.curveFollowRig.components['supercurve-follow'].curveProgress;
    const songProgress = this.curveEl.components.supercurve.curveProgressToSongProgress(
      curveProgress);
    if (songProgress >= data.songPosition + 0.02) {
      this.returnToPool();
    }
  },

  returnToPool: function () {
    this.el.object3D.visible = false;
    this.el.removeAttribute('data-weapon-particles');
    this.el.removeAttribute('data-wall-active');
    this.el.removeAttribute('raycastable-game');
    if (this.el.isPlaying) {
      this.el.sceneEl.components.pool__wall.returnEntity(this.el);
    }
    if (this.geometry) { this.geometry.dispose(); }
  }
});
