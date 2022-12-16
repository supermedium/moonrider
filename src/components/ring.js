AFRAME.registerShader('ring', {
  schema: {
    blur: {default: 0.01, is: 'uniform'},
    color: {type: 'color', is: 'uniform'},
    progress: {default: 0, is: 'uniform'},
    radiusInner: {default: 0.6, is: 'uniform'},
    radiusOuter: {default: 1, is: 'uniform'}
  },

  vertexShader: require('./shaders/ring.vert.glsl'),

  fragmentShader: require('./shaders/ring.frag.glsl')
});
