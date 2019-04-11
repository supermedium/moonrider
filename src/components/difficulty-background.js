/**
 * Handle difficulty raycastability.
 * Needed since state component does not have a bind-toggle that works within a bind-for.
 */
AFRAME.registerComponent('difficulty-background', {
  schema: {
    enabled: {type: false}
  },

  update: function () {
    if (this.data.enabled) {
      this.el.setAttribute('raycastable', '');
    } else {
      this.el.removeAttribute('raycastable');
    }
  }
});
