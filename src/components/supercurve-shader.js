import COLORS from '../constants/colors';

AFRAME.registerShader('supercurve', {
  schema: {
    cameraPercent: {type: 'number', is: 'uniform'},
    color1: {type: 'color', is: 'uniform', default: COLORS.initial.primary},
    color2: {type: 'color', is: 'uniform', default: COLORS.initial.secondary},
    fogColor: {type: 'color', is: 'uniform', default: COLORS.initial.primary},
    side: {default: 'double'},
    transparent: {default: true}
  },

  fragmentShader: require('./shaders/supercurve.frag.glsl'),

  vertexShader: require('./shaders/supercurve.vert.glsl'),

  update: function (data) {
    if (this.material && this.material.uniforms) {
      var dominated;
      for (var key in data) {
        dominated = this.schema[key];
        if (!dominated || dominated.is !== 'uniform') { continue; }
        if (dominated.type === 'color') {
          this.material.uniforms[key].value = new THREE.Color(data[key]);
        } else {
          this.material.uniforms[key].value = data[key];
        }
      }
    }
    this.el.sceneEl.systems.materials.registerCurve(this.material);
  }
});
