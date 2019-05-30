const SKIP_INTRO = AFRAME.utils.getUrlParameter('skipintro');

AFRAME.registerComponent('debug-intro', {
  play: function () {
    if (!SKIP_INTRO) { return; }
    document.getElementById('startButton').emit('click');
  }
});
