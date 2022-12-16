/**
 * Active item.
 */
AFRAME.registerComponent('active-item', {
  dependencies: ['material'],

  schema: {
    active: {default: false},
    opacity: {default: 1.0}
  },

  init: function () {
    this.defaultOpacity = this.el.getAttribute('material').opacity;
    this.materialObj = {opacity: this.data.opacity};
  },

  update: function () {
    var el = this.el;

    if (this.data.active) {
      el.setAttribute('material', this.materialObj);
      el.object3D.visible = true;
    } else {
      el.setAttribute('material', 'opacity', this.defaultOpacity);
      if (el.components.animation__mouseleave) {
        setTimeout(() => {
          el.emit('mouseleave', null, false);});
      }
    }
  }
});

AFRAME.registerComponent('active-text-color', {
  dependencies: ['text'],

  schema: {
    active: {default: false},
    color: {default: '#333'}
  },

  init: function () {
    this.defaultColor = this.el.getAttribute('text').color;
  },

  update: function () {
    var el = this.el;
    if (this.data.active) {
      el.setAttribute('text', 'color', this.data.color);
    } else {
      el.setAttribute('text', 'color', this.defaultColor);
    }
  }
});
