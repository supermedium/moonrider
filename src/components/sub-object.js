/**
 * Pull a submesh out of a model file.
 */
AFRAME.registerComponent('sub-object', {
  schema: {
    from: {type: 'selector'},
    name: {type: 'string'}
  },

  init: function () {
    var el = this.el;
    var data = this.data;

    data.from.addEventListener('model-loaded', evt => {
      const model = evt.detail.model;
      const subset = model.getObjectByName(data.name);
      el.setObject3D('mesh', subset.clone());
      el.setAttribute('material', 'shader', 'flat');
      el.emit('subobjectloaded', null, false);
    });
  }
});
