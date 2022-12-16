const COLORS = require('../constants/colors');

AFRAME.registerComponent('stars', {
  schema: {
    color: {type: 'color', default: COLORS.initial.secondary},
    count: {default: 500},
    radius: {default: 300}
  },

  init: function () {
    const rand = () => (Math.random() - 0.5) * this.data.radius * 2.0;
    const geometry = new THREE.BufferGeometry();
    this.material = this.el.sceneEl.systems.materials.stars;
    const positions = [];
    for (let i = 0; i < this.data.count; i++) {
      positions.push(rand(), rand(), rand() * 4);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    const points = new THREE.Points(geometry, this.material);
    this.el.setObject3D('stars', points);
  },

  update: function () {
    this.material.color.setStyle(this.data.color);
  }
});
