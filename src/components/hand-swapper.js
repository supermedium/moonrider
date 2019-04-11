const events = [
  'triggerdown',
  'gripdown',
  'abuttondown',
  'bbuttondown',
  'xbuttondown',
  'ybuttondown',
  'trackpaddown'
];

/**
 * Swap left or right-handed mode.
 */
AFRAME.registerComponent('hand-swapper', {
  schema: {
    enabled: {default: false}
  },

  init: function () {
    this.swapHand = this.swapHand.bind(this);
    events.forEach(event => {
      this.el.addEventListener(event, this.swapHand);
    });
  },

  swapHand: function () {
    if (!this.data.enabled) { return; }

    // Handled via state.
    this.el.sceneEl.emit('activehandswap', null, false);
  }
});
