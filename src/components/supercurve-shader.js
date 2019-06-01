import COLORS from '../constants/colors';

AFRAME.registerShader('supercurve', {
  schema: {
    cameraPercent: {type: 'number', is: 'uniform'},
    color1: {type: 'color', is: 'uniform', default: COLORS.schemes.default.primary},
    color2: {type: 'color', is: 'uniform', default: COLORS.schemes.default.secondary},
    fogColor: {type: 'color', is: 'uniform', default: COLORS.schemes.default.primary},
    side: {default: 'double'},
    transparent: {default: true},
  },

  fragmentShader: require('./shaders/supercurve.frag.glsl'),

  vertexShader: require('./shaders/supercurve.vert.glsl'),

  update: function (data) {
    this.updateVariables(data, 'attribute');
    this.updateVariables(data, 'uniform');
    this.el.sceneEl.systems.materials.registerCurve(this.material);
  }
});
