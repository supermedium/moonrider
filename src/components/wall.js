import {SIZES} from './beat';

const HEIGHT = 2.5;
const CEILING_THICKNESS = 1.5;
const CEILING_WIDTH = 4;

/**
 * Wall to dodge.
 */
AFRAME.registerComponent('wall', {
  dependencies: ['material'],

  init: function () {
    this.curveEl = document.getElementById('curve');
    this.curveFollowRig = document.getElementById('curveFollowRig');
    this.el.setObject3D('mesh', new THREE.Mesh());
    this.geometry = null;
    this.localPosition = new THREE.Vector3();
    this.songPosition = undefined;
    this.tick = AFRAME.utils.throttleTick(this.tick.bind(this), 1000);
  },

  play: function () {
    this.el.object3D.visible = true;
    this.el.setAttribute('data-weapon-particles', '');
    this.el.setAttribute('data-wall-active', '');
    this.el.setAttribute('raycastable-game', '');
  },

  tick: function (time, timeDelta) {
    const curveProgress = this.curveFollowRig.components['supercurve-follow'].curveProgress;
    const songProgress = this.curveEl.components.supercurve.curveProgressToSongProgress(
      curveProgress);
    if (songProgress >= this.songPosition + 0.08) { this.returnToPool(); }
  },

  onGenerate: function (songPosition, horizontalPosition, width, length, isCeiling) {
    const el = this.el;
    this.songPosition = songPosition;
    this.setWallGeometry(songPosition, horizontalPosition, width, length, isCeiling);
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

    return function (songPosition, horizontalPosition, width, length, isCeiling) {
      const beatSystem = this.el.sceneEl.components['beat-system'];
      const supercurve = this.curveEl.components.supercurve;

      const lengthPercent = length / supercurve.length;
      const startPercent = songPosition;
      const endPercent = songPosition + lengthPercent;

      const height = isCeiling ? CEILING_THICKNESS : HEIGHT;
      width = isCeiling ? CEILING_WIDTH : width;

      // Offset vectors to get the left / right vertex points to pass into curve helper.
      // Note that curve is upside down so the positions are reversed...normally, this would
      // read as `+ (width / 2) - 0.25`.
      const centerPosition = (-1 * beatSystem.horizontalPositions[horizontalPosition]) -
                             (width / 2) + 0.25;
      left.x = isCeiling
        ? - 1 * width / 2
        : centerPosition - (width / 2);
      right.x = isCeiling
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

      const ceilingHeight = beatSystem.verticalPositions.middle + beatSystem.size / 2;
      this.el.getObject3D('mesh').geometry = this.geometry;
      this.el.getObject3D('mesh').position.y = isCeiling ? ceilingHeight : 0.1;
    };
  })(),

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
