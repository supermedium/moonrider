/**
 * Emit events from query parameter to state to automatically set up state.
 */
AFRAME.registerComponent('debug-song-time', {
  dependencies: ['song'],

  init: function () {
    if (!AFRAME.utils.getUrlParameter('debug-song-time')) { return; }
    setInterval(() => {
      console.log(this.el.components.song.getCurrentTime());
    }, 250);
  }
});
