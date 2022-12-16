/**
 * Animate text number value.
 */
AFRAME.registerComponent('text-counter', {
  dependencies: ['text'],

  schema: {
    decimals: {default: 0},
    dur: {default: 2000, type: 'int'},
    enabled: {default: false},
    emit: {default: false},
    prefix: {default: ''},
    suffix: {default: ''},
    value: {default: 0.0, type: 'float'}
  },

  init: function () {
    this.currentValue = 0;
    this.hasCompleted = false;
    this.textValue = {value: ''};
  },

  update: function (oldData) {
    this.currentValue = 0;
    this.textValue.value = `${this.data.prefix}${this.decimals(0)}${this.data.suffix}`;
    this.el.setAttribute('text', this.textValue);
    this.hasCompleted = false;
  },

  tick: function (time, timeDelta) {
    if (!this.data.enabled || this.hasCompleted) { return; }

    this.currentValue += this.data.value * (timeDelta / this.data.dur);

    if (this.currentValue >= this.data.value) {
      this.currentValue = this.data.value;
      if (this.data.emit) { this.el.emit('textcounterdone', null, false); }
      this.hasCompleted = true;
    }

    this.textValue.value =
      `${this.data.prefix}${this.decimals(this.currentValue)}${this.data.suffix}`;
    this.el.setAttribute('text', this.textValue);
  },

  decimals: function (n) {
    var d = Math.pow(10, this.data.decimals);
    return (parseInt(n * d) / d).toFixed(this.data.decimals);
  }
});
