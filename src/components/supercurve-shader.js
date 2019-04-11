import COLORS from '../constants/colors';

AFRAME.registerShader('supercurve', {
  schema: {
    cameraPercent: {type: 'number', is: 'uniform'},
    color1: {type: 'color', is: 'uniform', default: COLORS.RED},
    color2: {type: 'color', is: 'uniform', default: COLORS.BLUE},
    fogColor: {type: 'color', is: 'uniform', default: COLORS.RED},
    side: {default: 'double'},
    transparent: {default: true},
  },
  fragmentShader: require('./shaders/supercurve.frag.glsl'),
  vertexShader: require('./shaders/supercurve.vert.glsl')
});
