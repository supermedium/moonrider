/**
 * Haptics when weapons collide.
 */
AFRAME.registerComponent('haptics-weapons', {
  init: function () {
    const el = this.el;

    this.isColliding = false;
    this.tick = AFRAME.utils.throttleTick(this.tick.bind(this), 100);

    el.setAttribute('haptics__weapon', {dur: 100, force: 0.075});

    el.addEventListener('mouseenter', evt => {
      if (!evt.detail || !evt.detail.intersectedEl) { return; }

      const intersectedEl = evt.detail.intersectedEl;
      if (!intersectedEl.classList.contains('blade') || intersectedEl === el) {
        this.isColliding = false;
        return;
      }

      this.isColliding = true;
      this.el.components.haptics__weapon.pulse();
    });

    el.addEventListener('mouseleave', evt => {
      this.isColliding = false;
    });
  },

  tick: function () {
    if (!this.isColliding) { return; }
    this.el.components.haptics__weapon.pulse();
  }
});
