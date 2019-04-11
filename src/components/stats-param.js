AFRAME.registerComponent('stats-param', {
  init: function () {
    if (AFRAME.utils.getUrlParameter('stats') === 'true') {
      this.el.setAttribute('stats', '');
    }
  }
});
