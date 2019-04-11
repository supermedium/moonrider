AFRAME.registerSystem('check-vr', {
  init: function () {
    setTimeout(() => {
      if (AFRAME.utils.device.checkHeadsetConnected()) {
        this.el.emit('displayconnected');
      }
    }, 250);
  }
});
