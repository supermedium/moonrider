AFRAME.registerComponent('hack', {
  play: function () {
    if (process.env.NODE_ENV !== 'production') { return; }
    const interval = setInterval(() => {
      if (!this.el.sceneEl.is('vr-mode')) {
        this.el.sceneEl.enterVR();
        clearInterval(interval);
      }
    }, 1000);
  }
});
