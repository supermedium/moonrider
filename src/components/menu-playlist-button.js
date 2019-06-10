/**
 * Pulse playlist button on favorite.
 */
AFRAME.registerComponent('menu-playlist-button', {
  schema: {
    isFavorited: {default: false},
    selectedChallenge: {default: ''}
  },

  init: function () {
    const el = this.el;

    el.setAttribute('animation__scaleup', {
      property: 'scale',
      from: '1 1 1',
      to: '1.1 1.1 1.1',
      dur: 600,
      autoplay: false,
      easing: 'easeInOutElastic'
    });

    el.setAttribute('animation__scaledown', {
      property: 'scale',
      from: '1.1 1.1 1.1',
      to: '1 1 1',
      dur: 100,
      startEvents: 'animationcomplete__scaleup',
      easing: 'easeInOutCubic'
    });
  },

  update: function (oldData) {
    // Play animation when song is favorited.
    if (!oldData.isFavorited && this.data.isFavorited &
        oldData.selectedChallenge === this.data.selectedChallenge) {
      this.el.components['animation__scaleup'].beginAnimation();
    }
  }
});
