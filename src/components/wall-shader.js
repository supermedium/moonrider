const COLORS = require('../constants/colors');

AFRAME.registerShader('wallShader', {
  schema: {
    environment: {type: 'map', is: 'uniform', default: '#envmapImg'},
    hitLeft: {type: 'vec3', is: 'uniform', default: {x: 0, y: 9000, z: 0}},
    hitRight: {type: 'vec3', is: 'uniform', default: {x: 0, y: 9000, z: 0}},
    iTime: {type: 'time', is: 'uniform'},
    opacity: {type: 'number', is: 'uniform'},
    wallColor: {type: 'color', is: 'uniform', default: COLORS.YELLOW}
  },

  vertexShader: require('./shaders/wall.vert.glsl'),

  fragmentShader: require('./shaders/wall.frag.glsl')
});
