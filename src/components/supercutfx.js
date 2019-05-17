const COLORS = require('../constants/colors');

AFRAME.registerComponent('supercutfx', {
  init: function () {
    this.colors = {
      red: new THREE.Color(COLORS.RED),
      blue: new THREE.Color(COLORS.BLUE)
    };
    this.position = new THREE.Vector3();
    this.rigEl = document.getElementById('curveFollowRig');
    this.startTime = -1100;  // Pause on first tick.
  },

  createSuperCut: function (beatObject3D, color) {
    const col = this.colors[color];
    const el = this.el;
    const mesh = this.el.getObject3D('mesh');

    mesh.material.transparent = true;
    this.rigEl.object3D.worldToLocal(el.object3D.position.copy(beatObject3D.position));
    el.object3D.position.z -= 0.25;
    el.object3D.visible = true;

    this.startTime = el.sceneEl.time;

    const colorUniform = mesh.material.uniforms.color.value;
    colorUniform.x = col.r;
    colorUniform.y = col.g;
    colorUniform.z = col.b;
    mesh.material.uniforms.startTime.value = this.startTime - 50;
    el.play();
  },

  tick: function (time) {
    if (time > this.startTime + 1000) {
      this.el.object3D.visible = false;
      this.el.pause();
    }
  }
});
