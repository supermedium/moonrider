AFRAME.registerComponent('menu-selected-challenge-image', {
  schema: {
    coverURL: { type: 'string' }
  },

  update: function () {
    const el = this.el;
    el.setAttribute(
      'material', 'src',
      this.data.coverURL);
  }
});
