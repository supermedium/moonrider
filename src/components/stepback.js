AFRAME.registerComponent('stepback', {
  init: function () {
    this.message = document.getElementById('stepback');
    this.camera = document.getElementById('camera');
    this.lastTime = 0;
    this.limit = -(3.0 / 2 - 0.6);
    this.throttling = 300;
  },

  tick: function (time, delta) {
    if (time - this.lastTime < this.throttling) { return; }

    var camPos = this.camera.object3D.position;
    var msgPos = this.message.object3D.position;

    if (camPos.z < this.limit) {
      this.throttling = 10;
      this.message.object3D.visible = true;
      this.message.getObject3D('mesh').material.opacity = 1 - Math.abs(camPos.z - msgPos.z);
      msgPos.x = camPos.x;
      msgPos.y = camPos.y;
    }else {
      this.message.object3D.visible = false;
      this.throttling = 500;
    }

    this.lastTime = time;
  }
});
