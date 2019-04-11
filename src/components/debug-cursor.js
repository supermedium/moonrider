/**
 * Log cursor events.
 */
AFRAME.registerComponent('debug-cursor', {
  init: function () {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    this.el.addEventListener('mouseenter', evt => {
      this.log('mouseenter', evt.detail.intersectedEl, 'green');
    });

    this.el.addEventListener('mouseleave', evt => {
      this.log('mouseleave', evt.detail.intersectedEl, 'red');
    });

    this.el.addEventListener('click', evt => {
      this.log('click', evt.detail.intersectedEl, 'blue');
    });
  },

  log: function (event, intersectedEl, color) {
    if (intersectedEl.id) {
      console.log(`%c[${event}] ${intersectedEl.id}`, `color: ${color}`);
    } else {
      console.log(`%c[${event}]`, `color: ${color}`);
      console.log(intersectedEl);
    }
  }
});
