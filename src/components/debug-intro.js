//const SKIP_INTRO = AFRAME.utils.getUrlParameter('skipintro');
const SKIP_INTRO = true;
AFRAME.registerComponent('debug-intro', {
  play: function () {
    if (!SKIP_INTRO) { return; }
    document.getElementById('startButton').emit('click');
  }
});
