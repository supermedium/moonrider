/**
 * Emit events from query parameter to state to automatically set up state.
 */
AFRAME.registerComponent('debug-state', {
  play: function () {
    const flags = AFRAME.utils.getUrlParameter('debugstate').trim();
    if (!flags) { return; }

    setTimeout(() => {
      flags.split(',').forEach(flag => {
        this.el.sceneEl.emit(`debug${flag.trim()}`, null, false);
      });
    }, 500);
  }
});
