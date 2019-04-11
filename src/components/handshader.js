AFRAME.registerShader('handStar', {
  schema: {
    pulse: {type: 'number', is: 'uniform', default: 0},
    transparent: {default: true},
    side: {default: 'back'},
    depthTest: {default: false}
  },
  vertexShader: require('./shaders/handstar.vert.glsl'),
  fragmentShader: require('./shaders/handstar.frag.glsl')
});
