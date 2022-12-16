AFRAME.registerComponent('keyboard-raycastable', {
  dependencies: ['super-keyboard'],

  schema: {
    condition: {default: ''}
  },

  play: function () {
    this.el.components['super-keyboard'].kbImg.setAttribute('bind-toggle__raycastable',
      this.data.condition);
  }
});
