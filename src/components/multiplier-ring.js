const COMBO_PROGRESS_MAP = {
  0: 0,
  1: 0.5,
  2: 0,
  3: 0.25,
  4: 0.5,
  5: 0.75,
  6: 0,
  7: 0.125,
  8: 0.25,
  9: 0.375,
  10: 0.5,
  11: 0.625,
  12: 0.75,
  13: 0.875
};

/*
 * Combo needed total for multiplier level:
 *
 * 0 - 1x
 * 2 - 2x
 * 6 - 4x
 * 14 - 8x
 */
AFRAME.registerComponent('multiplier-ring', {
  dependencies: ['geometry', 'material'],

  schema: {
    combo: {default: 0},
    multiplier: {default: 1}
  },

  init: function () {
    this.animationSet = {from: undefined, to: undefined};
    this.progress = this.el.getObject3D('mesh').material.uniforms.progress;

    // Set up animation.
    this.el.setAttribute('animation', {
      property: 'components.material.material.uniforms.progress.value',
      dur: 100,
      autoplay: false
    });
  },

  update: function () {
    this.updateRing();
  },

  updateRing: function () {
    const data = this.data;
    const el = this.el;
    const progress = this.progress;

    if (data.multiplier === 8) {
      progress.value = 1;
      return;
    }

    const animationSet = this.animationSet;
    animationSet.from = progress.value;
    animationSet.to = COMBO_PROGRESS_MAP[data.combo];
    el.setAttribute('animation', animationSet);
    el.components.animation.beginAnimation();
  }
});
