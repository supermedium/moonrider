AFRAME.registerSystem('check-vr', {
  init: function () {
    if (AFRAME.utils.device.isMobile()) {
      document.getElementById('vrButton').style.display = 'none';
    }

    setTimeout(() => {
      if (AFRAME.utils.device.checkHeadsetConnected()) {
        this.el.emit('displayconnected');
      }
    }, 250);
  }
});
