import COLORS from '../constants/colors';

const colors = {
  blue: new THREE.Color().set(COLORS.BLUE),
  red: new THREE.Color().set(COLORS.RED),
  bluefade: new THREE.Color().set(COLORS.BLUE2),
  redfade: new THREE.Color().set(COLORS.RED2)
};

/**
 * Listen to stage-events to change curve color.
 */
AFRAME.registerComponent('supercurve-color', {
  init: function () {
    const el = this.el;

    el.sceneEl.addEventListener('curveevenstageeventcolor', evt => {
      if (!evt.detail || evt.detail === 'off') {
        this.setColor('color1', 'red');
        return;
      }
      this.setColor('color1', evt.detail);
    });

    el.sceneEl.addEventListener('curveoddstageeventcolor', evt => {
      if (!evt.detail || evt.detail === 'off') {
        this.setColor('color2', 'blue');
        return;
      }
      this.setColor('color2', evt.detail);
    });
  },

  setColor: function (uniform, colorId) {
    const colorVec = this.el.components.material.material.uniforms[uniform].value;
    const color = colors[colorId];
    colorVec.x = color.r;
    colorVec.y = color.g;
    colorVec.z = color.b;
  }
});
