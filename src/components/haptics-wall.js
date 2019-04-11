/**
 * Listen to aabb-collider event for wall haptics.
 */
AFRAME.registerComponent('haptics-wall', {
  init: function () {
    const el = this.el;
    this.isHittingWall = false;
    el.setAttribute('haptics__wall', {dur: 50, force: 0.075});

    this.checkIfHittingWall = this.checkIfHittingWall.bind(this);
    el.addEventListener('mouseenter', this.checkIfHittingWall);
    el.addEventListener('mouseleave', this.checkIfHittingWall);

    this.tick = AFRAME.utils.throttleTick(this.tick.bind(this), 50);
  },

  /**
   * On raycaster event, check if we are still hitting a wall.
   */
  checkIfHittingWall: function () {
    const intersectedEls = this.el.components.raycaster__game.intersectedEls;
    this.isHittingWall = false;
    for (let i = 0; i < intersectedEls.length; i++) {
      if (intersectedEls[i].components.wall) {
        this.isHittingWall = true;
        return;
      }
    }
  },

  tick: function () {
    if (!this.isHittingWall) { return; }
    this.el.components.haptics__wall.pulse();
  }
});
