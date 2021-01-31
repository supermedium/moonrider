import COLORS from '../constants/colors';

/**
 * Trail effect via geometry.
 */
AFRAME.registerComponent('trail', {
  schema: {
    color: {default: 'primary'},
    colorScheme: {default: 'default'},
    enabled: {default: false},
    hand: {type: 'string'}
  },

  init: function () {
    const geometry = this.geometry = new THREE.BufferGeometry();
    const maxPoints = this.maxPoints = 12;
    const vertices = this.vertices = new Float32Array(36 * maxPoints);
    const colors = this.colors = new Float32Array(48 * maxPoints);

    this.bladeColor = {alpha: 1.0};
    this.rigContainer = document.getElementById('rigContainer');

    this.bladeEl = this.el.querySelector('.blade');

    this.layers = 0;
    this.bladeTrajectory = [
      {
        top: new THREE.Vector3(-0.5, 0, 0),
        center: new THREE.Vector3(0, 0, 0),
        bottom: new THREE.Vector3(0.5, 0, 0)
      },
      {
        top: new THREE.Vector3(-0.5, 0.5, 0),
        center: new THREE.Vector3(0, 0.5, 0),
        bottom: new THREE.Vector3(0.5, 0.5, 0)
      },
      {
        top: new THREE.Vector3(-0.5, 1.0, 0),
        center: new THREE.Vector3(0, 1.0, 0),
        bottom: new THREE.Vector3(0.5, 1.0, 0)
      }
    ];

    this.newSample = null;

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('vertexColor', new THREE.BufferAttribute(colors, 4).setUsage(THREE.DynamicDrawUsage));

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexColors: THREE.VertexColors,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: [
        'varying vec4 vColor;',
        'attribute vec4 vertexColor;',
        'void main() {',
        'vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);',
        'vColor = vertexColor;',
        'gl_Position = projectionMatrix * modelViewPosition;',
        '}'
      ].join(''),
      fragmentShader: [
        'varying vec4 vColor;',
        'uniform float pulse;',
        'void main() {',
        'gl_FragColor = vec4(vColor.xyz, vColor.a + pulse);',
        '}'
      ].join(''),
      uniforms: {
        pulse: {value: 0}
      }
    });

    const mesh = this.mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.vertices = vertices;
    this.rigContainer.setObject3D(`trail__${this.data.hand}`, mesh);
  },

  update: function (oldData) {
    this.mesh.visible = this.data.enabled;
    if (!oldData.enabled && this.data.enabled) {
      this.enabledTime = this.el.sceneEl.time;
    }

    // Update color scheme.
    if (oldData.colorScheme !== this.data.colorScheme) {
      const bladeColor = this.bladeColor =
        new THREE.Color(COLORS.schemes[this.data.colorScheme][this.data.color]);

      this.bladeColor.red = this.bladeColor.r;
      this.bladeColor.green = this.bladeColor.g;
      this.bladeColor.blue = this.bladeColor.b;
    }
  },

  tock: function (time, delta) {
    if (!this.data.enabled) { return; }
    // Delay before showing after enabled to prevent flash from old blade position.
    if (!this.mesh.visible && time > this.enabledTime + 250) { this.mesh.visible = true; }

    this.mesh.material.uniforms.pulse.value *= 0.9;
    this.sampleBladePosition();
  },

  pulse: function () {
    this.mesh.material.uniforms.pulse.value = 1;
  },

  addLayer: function (length) {
    const color = this.bladeColor;
    const colors = this.colors;
    const segments = this.segments;
    const vertices = this.vertices;

    let dx = 2 / segments;
    let startX = -1.0;

    if (this.layers >= this.maxLayers) { this.layers = 0; }

    const bottomLayer = this.layers * length;
    length = bottomLayer + length;
    const indexOffset = this.layers * segments * 18;
    const colorOffset = this.layers * segments * 24;

    for (let i = 0; i < segments; ++i) {
      vertices[indexOffset + 18 * i] = startX + i * dx;
      vertices[indexOffset + 18 * i + 1] = bottomLayer;
      vertices[indexOffset + 18 * i + 2] = 0.0;

      colors[colorOffset + 24 * i] = color.red;
      colors[colorOffset + 24 * i + 1] = color.green;
      colors[colorOffset + 24 * i + 2] = color.blue;
      colors[colorOffset + 24 * i + 3] = color.alpha;

      vertices[indexOffset + 18 * i + 3] = startX + i * dx;
      vertices[indexOffset + 18 * i + 4] = length;
      vertices[indexOffset + 18 * i + 5] = 0.0;

      colors[colorOffset + 24 * i + 4] = color.red;
      colors[colorOffset + 24 * i + 5] = color.green;
      colors[colorOffset + 24 * i + 6] = color.blue;
      colors[colorOffset + 24 * i + 7] = color.alpha;

      vertices[indexOffset + 18 * i + 6] = startX + i * dx + dx;
      vertices[indexOffset + 18 * i + 7] = length;
      vertices[indexOffset + 18 * i + 8] = 0.0;

      colors[colorOffset + 24 * i + 8] = color.red;
      colors[colorOffset + 24 * i + 9] = color.green;
      colors[colorOffset + 24 * i + 10] = color.blue;
      colors[colorOffset + 24 * i + 11] = color.alpha;

      vertices[indexOffset + 18 * i + 9] = startX + i * dx + dx;
      vertices[indexOffset + 18 * i + 10] = bottomLayer;
      vertices[indexOffset + 18 * i + 11] = 0.0;

      colors[colorOffset + 24 * i + 12] = color.red;
      colors[colorOffset + 24 * i + 13] = color.green;
      colors[colorOffset + 24 * i + 14] = color.blue;
      colors[colorOffset + 24 * i + 15] = color.alpha;

      vertices[indexOffset + 18 * i + 12] = startX + i * dx;
      vertices[indexOffset + 18 * i + 13] = bottomLayer;
      vertices[indexOffset + 18 * i + 14] = 0.0;

      colors[colorOffset + 24 * i + 16] = color.red;
      colors[colorOffset + 24 * i + 17] = color.green;
      colors[colorOffset + 24 * i + 18] = color.blue;
      colors[colorOffset + 24 * i + 19] = color.alpha;

      vertices[indexOffset + 18 * i + 15] = startX + i * dx + dx;
      vertices[indexOffset + 18 * i + 16] = length;
      vertices[indexOffset + 18 * i + 17] = 0.0;

      colors[colorOffset + 24 * i + 20] = color.red;
      colors[colorOffset + 24 * i + 21] = color.green;
      colors[colorOffset + 24 * i + 22] = color.blue;
      colors[colorOffset + 24 * i + 23] = color.alpha;
    }

    this.layers++;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.vertexColor.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
  },

  initGeometry: function () {
    const color = this.bladeColor;
    const colors = this.geometry.attributes.vertexColor.array;
    const vertices = this.geometry.attributes.position.array;
    const bladeTrajectory = this.bladeTrajectory;

    let alpha;
    let previousAlpha;
    let previousPoint;

    for (let i = 1; i < bladeTrajectory.length; i++) {
      if (i === 1) { previousAlpha = alpha; }
      alpha = 1.0 - ((bladeTrajectory.length - i) / bladeTrajectory.length);

      const currentPoint = bladeTrajectory[i];
      previousPoint = bladeTrajectory[i - 1];

      vertices[36 * i] = previousPoint.center.x;
      vertices[36 * i + 1] = previousPoint.center.y;
      vertices[36 * i + 2] = previousPoint.center.z;

      colors[48 * i] = color.red;
      colors[48 * i + 1] = color.green;
      colors[48 * i + 2] = color.blue;
      colors[48 * i + 3] = previousAlpha * 0.2;

      vertices[36 * i + 3] = currentPoint.top.x;
      vertices[36 * i + 4] = currentPoint.top.y;
      vertices[36 * i + 5] = currentPoint.top.z;

      colors[48 * i + 4] = color.red;
      colors[48 * i + 5] = color.green;
      colors[48 * i + 6] = color.blue;
      colors[48 * i + 7] = alpha;

      vertices[36 * i + 6] = previousPoint.top.x;
      vertices[36 * i + 7] = previousPoint.top.y;
      vertices[36 * i + 8] = previousPoint.top.z;

      colors[48 * i + 8] = color.red;
      colors[48 * i + 9] = color.green;
      colors[48 * i + 10] = color.blue;
      colors[48 * i + 11] = previousAlpha;

      vertices[36 * i + 9] = previousPoint.center.x;
      vertices[36 * i + 10] = previousPoint.center.y;
      vertices[36 * i + 11] = previousPoint.center.z;

      colors[48 * i + 12] = color.red;
      colors[48 * i + 13] = color.green;
      colors[48 * i + 14] = color.blue;
      colors[48 * i + 15] = previousAlpha * 0.2;

      vertices[36 * i + 12] = currentPoint.center.x;
      vertices[36 * i + 13] = currentPoint.center.y;
      vertices[36 * i + 14] = currentPoint.center.z;

      colors[48 * i + 16] = color.red;
      colors[48 * i + 17] = color.green;
      colors[48 * i + 18] = color.blue;
      colors[48 * i + 19] = alpha * 0.2;

      vertices[36 * i + 15] = currentPoint.top.x;
      vertices[36 * i + 16] = currentPoint.top.y;
      vertices[36 * i + 17] = currentPoint.top.z;

      colors[48 * i + 20] = color.red;
      colors[48 * i + 21] = color.green;
      colors[48 * i + 22] = color.blue;
      colors[48 * i + 23] = alpha;

      vertices[36 * i + 18] = previousPoint.bottom.x;
      vertices[36 * i + 19] = previousPoint.bottom.y;
      vertices[36 * i + 20] = previousPoint.bottom.z;

      colors[48 * i + 24] = color.red;
      colors[48 * i + 25] = color.green;
      colors[48 * i + 26] = color.blue;
      colors[48 * i + 27] = 0.0;

      vertices[36 * i + 21] = currentPoint.center.x;
      vertices[36 * i + 22] = currentPoint.center.y;
      vertices[36 * i + 23] = currentPoint.center.z;

      colors[48 * i + 28] = color.red;
      colors[48 * i + 29] = color.green;
      colors[48 * i + 30] = color.blue;
      colors[48 * i + 31] = alpha * 0.2;

      vertices[36 * i + 24] = previousPoint.center.x;
      vertices[36 * i + 25] = previousPoint.center.y;
      vertices[36 * i + 26] = previousPoint.center.z;

      colors[48 * i + 32] = color.red;
      colors[48 * i + 33] = color.green;
      colors[48 * i + 34] = color.blue;
      colors[48 * i + 35] = previousAlpha * 0.2;

      vertices[36 * i + 27] = previousPoint.bottom.x;
      vertices[36 * i + 28] = previousPoint.bottom.y;
      vertices[36 * i + 29] = previousPoint.bottom.z;

      colors[48 * i + 36] = color.red;
      colors[48 * i + 37] = color.green;
      colors[48 * i + 38] = color.blue;
      colors[48 * i + 39] = 0.0;

      vertices[36 * i + 30] = currentPoint.bottom.x;
      vertices[36 * i + 31] = currentPoint.bottom.y;
      vertices[36 * i + 32] = currentPoint.bottom.z;

      colors[48 * i + 40] = color.red;
      colors[48 * i + 41] = color.green;
      colors[48 * i + 42] = color.blue;
      colors[48 * i + 43] = 0.0;

      vertices[36 * i + 33] = currentPoint.center.x;
      vertices[36 * i + 34] = currentPoint.center.y;
      vertices[36 * i + 35] = currentPoint.center.z;

      colors[48 * i + 44] = color.red;
      colors[48 * i + 45] = color.green;
      colors[48 * i + 46] = color.blue;
      colors[48 * i + 47] = alpha * 0.2;

      previousAlpha = alpha;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.vertexColor.needsUpdate = true;
  },

  sampleBladePosition: function () {
    let sample;

    if (this.bladeTrajectory.length === this.maxPoints) {
      // Dump oldest point.
      sample = this.newSample = this.bladeTrajectory.shift();
      sample.top.set(0, -0.5, 0);
      sample.center.set(0, 0, 0);
      sample.bottom.set(0, 0.5, 0);
    } else {
      if (this.newSample) {
        this.newSample.top.set(0, -0.5, 0);
        this.newSample.center.set(0, 0, 0);
        this.newSample.bottom.set(0, 0.5, 0);
        sample = this.newSample;
      } else {
        sample = {
          top: new THREE.Vector3(0, -0.5, 0),
          center: new THREE.Vector3(0, 0, 0),
          bottom: new THREE.Vector3(0, 0.5, 0)
        };
      }
    }

    const bladeObject = this.bladeEl.object3D;
    bladeObject.localToWorld(sample.top);
    bladeObject.localToWorld(sample.center);
    bladeObject.localToWorld(sample.bottom);

    this.rigContainer.object3D.worldToLocal(sample.top);
    this.rigContainer.object3D.worldToLocal(sample.center);
    this.rigContainer.object3D.worldToLocal(sample.bottom);

    this.bladeTrajectory.push(sample);
    this.initGeometry();
  }
});
