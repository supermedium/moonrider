AFRAME.registerComponent('text-truncate', {
  schema: {
    value: {type: 'string'},
    length: {type: 'int', default: 10}
  },

  update: function () {
    this.el.setAttribute('text', 'value', truncate(this.data.value, this.data.length));
  }
});

function truncate (str, length) {
  if (!str) { return ''; }
  if (str.length >= length) {
    return str.substring(0, length - 3) + '...';
  }
  return str;
}
