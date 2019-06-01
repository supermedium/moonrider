const auxColor = new THREE.Color();

/**
 * Listen to stage-events to change curve color.
 */
AFRAME.registerComponent('supercurve-color', {
  init: function () {
    const el = this.el;

    el.sceneEl.addEventListener('curveevenstageeventcolor', evt => {
      if (!evt.detail || evt.detail === 'off') {
        this.setColor('color1', 'primary');
        return;
      }
      this.setColor('color1', evt.detail);
    });

    el.sceneEl.addEventListener('curveoddstageeventcolor', evt => {
      if (!evt.detail || evt.detail === 'off') {
        this.setColor('color2', 'secondary');
        return;
      }
      this.setColor('color2', evt.detail);
    });
  },

  setColor: function (uniform, colorId) {
    const colorVec = this.el.components.material.material.uniforms[uniform].value;
    const color = this.el.sceneEl.systems.materials.scheme[colorId];
    auxColor.set(color);
    colorVec.x = auxColor.r;
    colorVec.y = auxColor.g;
    colorVec.z = auxColor.b;
  }
});
