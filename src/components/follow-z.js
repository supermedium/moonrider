AFRAME.registerComponent('follow-z', {
  schema: {
    offset: {type: 'vec3'},
    target: {type: 'selector'}
  },

  tick: function () {
    if (!this.data.target) { return; }
    this.el.object3D.position.copy(this.data.offset);
    this.el.object3D.position.z += this.data.target.object3D.position.z;
  }
});
