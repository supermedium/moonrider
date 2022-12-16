AFRAME.registerComponent('copy-texture', {
  dependencies: ['geometry', 'material'],

  schema: {
    from: {type: 'selector'}
  },

  init: function () {
    const data = this.data;

    data.from.addEventListener('materialtextureloaded', () => {
      this.copyTexture();});
    this.copyTexture();
  },

  copyTexture: function () {
    const el = this.el;
    const target = this.data.from;
    const material = el.getObject3D('mesh').material;

    if (!target.getObject3D('mesh')) { return; }

    material.map = target.getObject3D('mesh').material.map;

    if (!material.map) { return; }

    material.map.needsUpdate = true;
    material.needsUpdate = true;
  }
});
