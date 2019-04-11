AFRAME.registerComponent('text-uppercase', {
  schema: {
    value: {type: 'string'}
  },

  update: function () {
    this.el.setAttribute('text', 'value', this.data.value.toUpperCase());
  }
});
