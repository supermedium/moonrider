require('../../vendor/Curve');
require('../../vendor/CatmullRomCurve3');

const EXTRA_LENGTH = 200;
const CURVE_SAMPLES = 350;
const CURVE_SECTION_LENGTH = 100;
const X_MAX_DEVIATION = 10;
const Y_MAX_DEVIATION = 10;
const WIDTH = 3;

const positionVec3 = new THREE.Vector3();
const normalVec3 = new THREE.Vector3();

/**
 * For some reason, the front face is the bottom.
 */
AFRAME.registerComponent('supercurve', {
  schema: {
    debug: {default: false}
  },

  init: function () {
    this.buffers = {};
    this.curve = null;
    this.fullLength = null;
    this.indexes = {};
    this.length = null;
    this.points = [];
  },

  play: function () {
    this.generateCurve(1500);
  },

  /**
   * Generate a comfortable curve that starts straight from the origin.
   * One point at a time, section length approximately defined by CURVE_SECTION_LENGTH
   * varying the X and Y at the MAX_DEVIATIONs.
   */
  generateCurve: function (length) {
    this.length = length;

    length += EXTRA_LENGTH; // Add extra length for anticipation time past song duration.
    this.fullLength = length;

    this.points.length = 0;
    this.points.push(new THREE.Vector3(0, 0, 0));
    this.points.push(new THREE.Vector3(0, 0, -1 * CURVE_SECTION_LENGTH));

    // Build curve one point at time, using curve section length to extend the Z,
    // approximately.
    let currentLength = CURVE_SECTION_LENGTH;
    let prevPoint;
    for (let i = 2; i <= Math.ceil(length / CURVE_SECTION_LENGTH) - 1; i++) {
      prevPoint = this.points[i - 1];
      currentLength += CURVE_SECTION_LENGTH;
      this.points.push(new THREE.Vector3(
        prevPoint.x + (Math.random() * X_MAX_DEVIATION * 2 - X_MAX_DEVIATION),
        prevPoint.y + (Math.random() * Y_MAX_DEVIATION * 2 - Y_MAX_DEVIATION),
        -1 * currentLength
      ));
    }

    // Calculate last point so that curve ends at exactly the right length.
    const almostCurve = new THREE.CatmullRomCurve3(this.points);
    const almostLength = almostCurve.getLength();
    const leftoverLength = length - almostLength;
    const lastTangent = almostCurve.getTangent(1, new THREE.Vector3());
    const lastPoint = this.points[this.points.length - 1].clone().add(
      lastTangent.multiplyScalar(leftoverLength));
    this.points.push(lastPoint);

    this.setCurve(this.points);
    this.el.emit('supercurvegenerate');
  },

  /**
   * Create BufferGeometry from curve from set of points.
   */
  setCurve: function (inPoints) {
    const buffers = this.buffers;
    const data = this.data;
    const el = this.el;
    const indexes = this.indexes;

    // Make curve.
    this.points = inPoints;
    const curve = this.curve = new THREE.CatmullRomCurve3(inPoints);

    // Get curve info
    const length = curve.getLength();
    const points = curve.getSpacedPoints(CURVE_SAMPLES);
    const segmentLength = length / CURVE_SAMPLES;

    // Make geometry.
    const geometry = new THREE.BufferGeometry();

    // Number of vertices is number of curve points with two triangles.
    // N + 2 for triangle strip. Times three for X / Y / Z of a vertex.
    const bufferSize = ((CURVE_SAMPLES * 2) + 2);

    // Buffers.
    buffers.position = new Float32Array(bufferSize * 3);
    buffers.normal = new Float32Array(bufferSize * 3);
    buffers.uvs = new Float32Array(bufferSize * 2);
    indexes.position = 0;
    indexes.normal = 0;
    indexes.uvs = 0;

    const leftOffset = new THREE.Vector3(-1 * WIDTH / 2, 0, -1 * segmentLength / 2);
    const rightOffset = new THREE.Vector3(WIDTH / 2, 0, -1 * segmentLength / 2);

    const halfSegmentLengthPercent = (segmentLength / 2) / length;

    // Add points, two tris at a time, by adding two vertices at a time to front of the curve.
    for (let i = 0; i < points.length; i++) {
      const percent = i / (points.length - 1);
      const point = points[i];

      // Check if point is origin because will mess up the normal calculation.
      if (points[i].x === 0 && points[i].y === 0 && points[i].z === 0) {
        points[i].set(0.001, 0, 0.001);
        normalVec3.y = -1 * Math.abs(normalVec3.y);
      } else {
        normalVec3.copy(positionVec3).cross(points[i]).normalize();
        // Normal is upside down for some reason.
        normalVec3.y = -1 * normalVec3.y;
      }

      // Front left.
      this.getPositionRelativeToTangent(percent, leftOffset, positionVec3);
      buffers.position[indexes.position++] = positionVec3.x;
      buffers.position[indexes.position++] = positionVec3.y;
      buffers.position[indexes.position++] = positionVec3.z;
      buffers.normal[indexes.normal++] = normalVec3.x;
      buffers.normal[indexes.normal++] = normalVec3.y;
      buffers.normal[indexes.normal++] = normalVec3.z;
      buffers.uvs[indexes.uvs++] = 0;
      buffers.uvs[indexes.uvs++] = percent;

      // Front right.
      this.getPositionRelativeToTangent(percent, rightOffset, positionVec3);
      buffers.position[indexes.position++] = positionVec3.x;
      buffers.position[indexes.position++] = positionVec3.y;
      buffers.position[indexes.position++] = positionVec3.z;
      buffers.normal[indexes.normal++] = normalVec3.x;
      buffers.normal[indexes.normal++] = normalVec3.y;
      buffers.normal[indexes.normal++] = normalVec3.z;
      buffers.uvs[indexes.uvs++] = 1;
      buffers.uvs[indexes.uvs++] = percent;

      if (this.data.debug) {
        const sphere = document.createElement('a-box');
        sphere.setAttribute('geometry', {width: 0.1, height: 0.1, depth: 0.1});
        sphere.setAttribute('material', {shader: 'flat', color: '#333'});
        sphere.object3D.position.copy(point);
        sphere.object3D.position.y += 0.1;
        el.appendChild(sphere);
      }
    }

    geometry.setAttribute('normal', new THREE.BufferAttribute(buffers.normal, 3));
    geometry.setAttribute('position', new THREE.BufferAttribute(buffers.position, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(buffers.uvs, 2));

    // Set mesh.
    if (el.getObject3D('mesh')) {
      el.getObject3D('mesh').geometry = THREE.BufferGeometryUtils.toTrianglesDrawMode(geometry, THREE.TriangleStripDrawMode);
    } else {
      const mesh = new THREE.Mesh(THREE.BufferGeometryUtils.toTrianglesDrawMode(geometry, THREE.TriangleStripDrawMode));
      el.setObject3D('mesh', mesh);
    }
  },

  /**
   * getPointAt that factors in extra length past the song duration.
   */
  getPointAt: function (percent, vec3) {
    percent = this.songProgressToCurveProgress(percent);
    this.curve.getPointAt(percent, vec3);
  },

  /**
   * getTangentAt that factors in extra length past the song duration.
   */
  getTangentAt: function (percent, vec3) {
    percent = this.songProgressToCurveProgress(percent);
    this.curve.getTangentAt(percent, vec3);
  },

  /**
   * Given a percent (from 0 to 1) along the curve, transform a position relative to the
   * point along the curve and along the tangent. Such that the negative Z-axis points
   * straight down the tangent.
   */
  getPositionRelativeToTangent: (function () {
    const helperObj3D = new THREE.Object3D();
    const helperPosition = new THREE.Vector3();
    const tangent = new THREE.Vector3();

    return function (percent, position, target, reverseLookAt) {
      const curve = this.curve;

      if (!helperObj3D.parent) { this.el.sceneEl.object3D.add(helperObj3D); }

      // Get point and tangent at percent.
      if (percent < 0) {
        // linearly extrapolate outside the bounds
        this.getPointAt(0, helperObj3D.position);
        this.getTangentAt(0, tangent);
        helperObj3D.position.addScaledVector(tangent, percent);
      } else if (percent > 1) {
        // linearly extrapolate outside the bounds
        this.getPointAt(1, helperObj3D.position);
        this.getTangentAt(1, tangent);
        helperObj3D.position.addScaledVector(tangent, percent);
      } else {
        this.getPointAt(percent, helperObj3D.position);
        this.getTangentAt(percent, tangent);
      }

      // Look down the curve.
      if (reverseLookAt) {
        helperObj3D.lookAt(helperPosition.copy(helperObj3D.position).sub(tangent));
      } else {
        helperObj3D.lookAt(helperPosition.copy(helperObj3D.position).add(tangent));
      }

      // Get offset point in the local space.
      helperObj3D.updateMatrixWorld();
      target.copy(position);
      helperObj3D.localToWorld(target);
      return target;
    };
  })(),

  /**
   * Align object3D to tangent at a certain spot on the curve.
   */
  alignToCurve: (function () {
    const curvePosition = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const lookAt = new THREE.Vector3(0, 0, -0.01);
    const lookAtTarget = new THREE.Vector3();

    return function (percent, object3D) {
      this.getPositionRelativeToTangent(percent, lookAt, lookAtTarget);
      object3D.lookAt(lookAtTarget);
      object3D.position.y += 0.01; // Z-fighting
    };
  })(),

  /**
   * Factor in extra length.
   */
  songProgressToCurveProgress: function (songProgress) {
    return (songProgress * this.length) / this.fullLength;
  },

  curveProgressToSongProgress: function (curveProgress) {
    return (curveProgress * this.fullLength) / this.length;
  }
});

/**
 * Follow along curve provided by supercurve component.
 */
AFRAME.registerComponent('supercurve-follow', {
  schema: {
    enabled: {default: false},
    speed: {type: 'number'},
    target: {type: 'selector'}
  },

  init: function () {
    this.curveProgress = 0;
    this.songProgress = 0;
  },

  update: function () {
    this.supercurve = this.data.target.components.supercurve;
  },

  tick: (function () {
    const lookAt = new THREE.Vector3(0, 0, 1);
    const lookAtTarget = new THREE.Vector3();

    return function (t, dt) {
      const data = this.data;
      const el = this.el;

      if (!data.enabled || !dt) { return; }

      if (this.curveProgress >= 1) { return; }

      const supercurve = this.supercurve;
      const curve = supercurve.curve;
      if (!curve) { return; }

      // Update progress based on speed.
      this.curveProgress = this.curveProgress || 0;
      const distanceTraveled = data.speed * (dt / 1000);
      this.curveProgress += distanceTraveled / this.supercurve.fullLength;

      this.data.target.components.material.material.uniforms.cameraPercent.value =
        this.curveProgress;

      if (this.curveProgress >= 1) {
        this.curveProgress = 1;
        this.data.target.components.material.material.uniforms.cameraPercent.value =
          this.curveProgress;
        return;
      }

      // Update lookAt down the tangent.
      curve.getPointAt(this.curveProgress, this.el.object3D.position);
      this.songProgress = supercurve.curveProgressToSongProgress(this.curveProgress);
      supercurve.alignToCurve(this.songProgress, this.el.object3D);
    };
  })()
});
