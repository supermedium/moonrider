const SKIP_INTRO = AFRAME.utils.getUrlParameter('skipintro');

AFRAME.registerComponent('debug-intro', {
  play: function () {
    if (!SKIP_INTRO) { return; }
    document.getElementById('menuBackground').setAttribute('material', 'opacity', 1);
    document.getElementById('genreButton').setAttribute('material', 'opacity', 1);
    document.getElementById('searchButton').setAttribute('material', 'opacity', 1);
  }
});
