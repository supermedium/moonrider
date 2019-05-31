import COLORS from '../constants/colors';

AFRAME.registerShader('handStar', {
  schema: {
    colorPrimary: {type: 'color', is: 'uniform', default: COLORS.schemes.default.primary},
    colorSecondary: {type: 'color', is: 'uniform', default: COLORS.schemes.default.secondary},
    colorTertiary: {type: 'color', is: 'uniform', default: COLORS.schemes.default.tertiary},
    pulse: {type: 'number', is: 'uniform', default: 0},
    transparent: {default: true},
    side: {default: 'back'},
    depthTest: {default: false}
  },

  vertexShader: require('./shaders/handstar.vert.glsl'),
  fragmentShader: require('./shaders/handstar.frag.glsl')
});
