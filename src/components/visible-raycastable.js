/**
 * Couple visibility and raycastability.
 */
AFRAME.registerComponent('visible-raycastable', {
  schema: {
    default: true
  },

  update: function () {
    this.el.object3D.visible = this.data;
    if (this.data) {
      this.el.setAttribute('raycastable', '');
    } else {
      this.el.removeAttribute('raycastable', '');
    }
  }
});
