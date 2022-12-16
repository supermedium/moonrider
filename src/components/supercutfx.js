const auxColor = new THREE.Color();

AFRAME.registerComponent('supercutfx', {
  schema: {
    colorPrimary: {type: 'string'},
    colorSecondary: {type: 'string'}
  },

  init: function () {
    this.rigEl = document.getElementById('curveFollowRig');
    this.startTime = -1100; // Pause on first tick.
  },

  createSuperCut: function (beatObject3D, color) {
    const el = this.el;
    const mesh = this.el.getObject3D('mesh');

    mesh.material.transparent = true;
    this.rigEl.object3D.worldToLocal(el.object3D.position.copy(beatObject3D.position));
    el.object3D.position.z -= 0.25;
    el.object3D.visible = true;

    this.startTime = el.sceneEl.time;

    auxColor.set(color === 'red' ? this.data.colorPrimary : this.data.colorSecondary);
    const colorUniform = mesh.material.uniforms.color.value;
    colorUniform.x = auxColor.r;
    colorUniform.y = auxColor.g;
    colorUniform.z = auxColor.b;
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
