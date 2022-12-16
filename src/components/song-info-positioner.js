/**
 * Puts #songInfoContainer in specific y position depending on state
 */
AFRAME.registerComponent('song-info-positioner', {
  schema: {
    victory: {default: false}
  },

  update: function () {
    if (this.data.victory) {
      this.el.object3D.position.y = -1.2;
    } else {
      this.el.object3D.position.y = -1;
    }
  }
});
