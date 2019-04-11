AFRAME.registerShader('cutfxShader', {
  schema: {
    src: {type: 'map', is: 'uniform', default: '#cutfxImg'},
    color: {type: 'color', is: 'uniform', default: '#fff'},
    progress: {type: 'number', is: 'uniform'},
    transparent: {default: true},
    blending: {default: 'additive'},
    side: {default: 'double'},
    depthTest: {default: false},
    depthWrite: {default: false}
  },
  vertexShader: require('./shaders/cutfx.vert.glsl'),
  fragmentShader: require('./shaders/cutfx.frag.glsl')
});
