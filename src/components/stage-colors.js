function $ (id) { return document.getElementById(id); }

import COLORS from '../constants/colors';

// Stage animations have a consistent pattern so animations generated via loop.
const animatables = [
  {name: 'bgcolor', property: 'backglow.color'},
  {name: 'leftglow', property: 'leftsideglow.color'},
  {name: 'rightglow', property: 'rightsideglow.color'}
];

// {id: 'gameover', dur: 500, to: 'off'},
const animations = [
  {id: 'off', dur: 500, to: 'off'},
  {id: 'primary', dur: 5, to: 'primary'},
  {id: 'primarybright', dur: 500, from: 'tertiary', to: 'primarybright'},
  {id: 'secondary', dur: 5, to: 'secondary'},
  {id: 'secondarybright', dur: 500, from: 'tertiary', to: 'secondarybright'}
];

// Mapping of index to our stage event IDs.
const colorCodes = [
  'off',
  'secondary',
  'secondary',
  'secondarybright',
  '',
  'primary',
  'primary',
  'primarybright',
  'primarybright'
];

AFRAME.registerComponent('stage-colors', {
  schema: {
    colorScheme: {default: 'default'}
  },

  init: function () {
    this.el.addEventListener('cleargame', this.resetColors.bind(this));
    this.el.sceneEl.addEventListener('playbuttonclick', this.resetColors.bind(this));
    setAnimations(this.el.sceneEl, this.data.colorScheme);
  },

  update: function (oldData) {
    if (oldData.colorScheme &&
      this.data.colorScheme !== oldData.colorScheme) {
      updateAnimations(this.el.sceneEl, this.data.colorScheme);
    }
  },

  play: function () {
    this.el.emit('bgcolorsecondary', null, false);
  },

  setColor: function (target, code) {
    if (!colorCodes[code]) {
      code = 5;
    }

    if (target.startsWith('curve')) {
      // New event style.
      this.el.emit(`${target}stageeventcolor`, colorCodes[code].replace('bright', ''), false);
    } else {
      this.el.emit(`${target}color${colorCodes[code]}`, null, false);
    }
  },

  /**
   * Set synchronously, no animation for performance.
   */
  setColorInstant: function (target, code) {
    const materials = this.el.sceneEl.systems.materials;

    if (target === 'stars') {
      let color;
      if (code === 0) {
        color = COLORS.schemes[this.data.colorScheme].secondarybright;
      } else {
        color = COLORS.schemes[this.data.colorScheme].secondary;
      }
      set(materials.stars, 'color', color);
      return;
    }

    const color = COLORS.schemes[this.data.colorScheme][colorCodes[code]];
    if (target === 'moon') {
      set(materials.moon, 'tint', color);
    }
  },

  resetColors: function () {
    this.el.emit('bgcolorsecondary', null, false);
    this.el.emit('curveevenstageeventcolor', 'off', false);
    this.el.emit('curveoddstageeventcolor', 'off', false);
  }
});
/** * Set stage animations defined in the objects at top.
 */
function setAnimations (scene, scheme) {
  for (let i = 0; i < animatables.length; i++) {
    const animatable = animatables[i];
    for (let j = 0; j < animations.length; j++) {
      const animation = animations[j];

      scene.setAttribute(`animation__${animatable.name}${animation.id}`, {
        property: `systems.materials.${animatable.property}`,
        type: 'color',
        isRawProperty: true,
        easing: 'linear',
        dur: animation.dur,
        from: animation.from ? COLORS.schemes[scheme][animation.from] : '',
        startEvents: `${animatable.name}${animation.id}`,
        to: COLORS.schemes[scheme][animation.to]
      });
    }
  }
}

/**
 * Update `to` and `from ` of stage animations.
 */
function updateAnimations (scene, scheme) {
  for (let i = 0; i < animatables.length; i++) {
    const animatable = animatables[i];
    for (let j = 0; j < animations.length; j++) {
      const animation = animations[j];
      const attr = `animation__${animatable.name}${animation.id}`;
      if (animation.from) {
        scene.setAttribute(attr, 'from', COLORS.schemes[scheme][animation.from]);
      }
      scene.setAttribute(attr, 'to', COLORS.schemes[scheme][animation.to]);
    }
  }
}

const auxColor = new THREE.Color();
function set (mat, name, color) {
  auxColor.set(color);
  if (mat.uniforms) {
    mat.uniforms[name].value.x = auxColor.r;
    mat.uniforms[name].value.y = auxColor.g;
    mat.uniforms[name].value.z = auxColor.b;
  } else {
    mat[name].set(color);
  }
}
