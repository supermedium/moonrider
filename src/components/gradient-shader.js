AFRAME.registerShader('gradientShader', {
  schema: {
    color1: {type: 'color', is: 'uniform'},
    color2: {type: 'color', is: 'uniform'}
  },

  vertexShader: require('./shaders/flat.vert.glsl'),

  fragmentShader: require('./shaders/gradient.frag.glsl')
});
