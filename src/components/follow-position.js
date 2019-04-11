AFRAME.registerComponent('follow-position', {
  schema: {
    target: {type: 'selector'}
  },

  tick: function () {
    this.el.object3D.position.copy(this.data.target.object3D.position);
  }
});
