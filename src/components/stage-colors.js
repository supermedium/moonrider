function $ (id) { return document.getElementById(id); };

const colorCodes = [
  'off',
  'secondary',
  'secondary',
  'secondaryBright',
  '',
  'primary',
  'primary',
  'primaryBright',
  'primaryBright'
];

AFRAME.registerComponent('stage-colors', {
  init: function () {
    this.el.addEventListener('cleargame', this.resetColors.bind(this));
  },

  setColor: function (target, code) {
    this.el.emit(`${target}color${colorCodes[code]}`, null, false);

    // New event style.
    this.el.emit(`${target}stageeventcolor`, colorCodes[code], false);
  },

  resetColors: function () {
    this.el.emit('bgcolorsecondary', null, false);
    this.el.emit('curveevenstageeventcolor', 'off', false);
    this.el.emit('curveoddstageeventcolor', 'off', false);
  }
});
