import COLORS from '../constants/colors';

AFRAME.registerShader('panelShader', {
  schema: {
    activePanel: {type: 'number', is: 'uniform', default: 0},
    brightness: {type: 'number', is: 'uniform', default: 0.3},
    borderWidth: {type: 'number', is: 'uniform', default: 0.004},
    borderRadius: {type: 'number', is: 'uniform', default: 0.15},
    colorPrimary: {type: 'color', is: 'uniform', default: COLORS.initial.primary},
    colorSecondary: {type: 'color', is: 'uniform', default: COLORS.initial.secondary},
    midSection: {type: 'number', is: 'uniform', default: 0},
    opacity: {type: 'number', is: 'uniform', default: 1},
    ratio: {type: 'number', is: 'uniform', default: 0.5},
    transparent: {default: true}
  },

  vertexShader: require('./shaders/panel.vert.glsl'),

  fragmentShader: require('./shaders/panel.frag.glsl'),

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
    this.el.sceneEl.systems.materials.registerPanel(this.material);
  }
});
