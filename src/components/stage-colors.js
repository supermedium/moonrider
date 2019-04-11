function $ (id) { return document.getElementById(id); };

AFRAME.registerComponent('stage-colors', {
  init: function () {
    this.colorCodes = ['off', 'blue', 'blue', 'bluefade', '', 'red', 'red', 'redfade','redfade'];
    this.el.addEventListener('cleargame', this.resetColors.bind(this));
  },

  setColor: function (target, code) {
    this.el.emit(`${target}color${this.colorCodes[code]}`, null, false);

    // New event style.
    this.el.emit(`${target}stageeventcolor`, this.colorCodes[code], false);
  },

  resetColors: function () {
    this.el.emit('bgcolorblue', null, false);
    this.el.emit('curveevenstageeventcolor', 'off', false);
    this.el.emit('curveoddstageeventcolor', 'off', false);
  }
});
