/**
 * Score text fade in animation.
 */
AFRAME.registerComponent('score-texts', {
  schema: {
    isLoading: {default: false}
  },

  init: function () {
    this.textEls = this.el.querySelectorAll('[text]');

    for (let i = 0; i < this.textEls.length; i++) {
      this.textEls[i].setAttribute('animation__fadein', {
        autoplay: false,
        property: 'components.text.material.uniforms.opacity.value',
        delay: 250,
        dur: 750,
        easing: 'easeInOutCubic',
        from: 0,
        to: 1
      });
    }
  },

  update: function (oldData) {
    // Finished loading.
    if (oldData.isLoading && !this.data.isLoading) {
      for (let i = 0; i < this.textEls.length; i++) {
        this.textEls[i].components['animation__fadein'].beginAnimation();
      }
      this.el.sceneEl.emit('textglownormal', null, false);
    }

    // Started loading.
    if (!oldData.isLoading && this.data.isLoading) {
      for (let i = 0; i < this.textEls.length; i++) {
        this.textEls[i].components.text.material.uniforms.opacity.value = 0;
      }
      this.el.sceneEl.emit('textglowoff', null, false);
    }
  }
});
