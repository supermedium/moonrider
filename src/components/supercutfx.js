const COLORS = require('../constants/colors');

AFRAME.registerComponent('supercutfx', {
  init: function () {
    this.startTime = -1100; // pause on first tick
    this.colors = {
      red: new THREE.Color(COLORS.RED),
      blue: new THREE.Color(COLORS.BLUE)
    };
  },

  createSuperCut: function (position, color) {
    const col = this.colors[color];
    const mesh = this.el.getObject3D('mesh');
    this.el.object3D.position.copy(position);
    this.el.object3D.position.z = -1;
    this.el.object3D.visible = true;

    this.startTime = this.el.sceneEl.time;

    const colorUniform = mesh.material.uniforms.color.value;
    colorUniform.x = col.r;
    colorUniform.y = col.g;
    colorUniform.z = col.b;
    mesh.material.uniforms.startTime.value = this.startTime - 50;
    this.el.play();
  },

  tick: function (time) {
    if (time > this.startTime + 1000) {
      this.el.object3D.visible = false;
      this.el.pause();
    }
  }
});
