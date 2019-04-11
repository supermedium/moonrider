
AFRAME.registerComponent('tail', {
  schema: {
    width: {default: 1},
    height: {default: 0.1},
    segments: {default: 10, type: 'int'},
    target: {type: 'selector'},
  },
  init: function () {
    const data = this.data;
    var geometry = this.geometry = new THREE.PlaneBufferGeometry(data.width, data.height, data.segments, 1);
    geometry.removeAttribute('normal');
    geometry.translate(data.width / 2, 0, 0);
    var material = this.el.sceneEl.systems.materials.handStarTrail;
    var mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    this.el.setObject3D('mesh', mesh);
    this.positions = geometry.attributes['position'].array;
    this.numVerts = data.segments * 2 + 2;
    this.geometry = geometry;
    this.target = data.target.object3D;
    this.targetPos = new THREE.Vector3();
  },

  tick: function (time, delta) {
    var p;
    var s = this.numVerts / 2 * 3;
    var h = this.data.height / 2;

    for (var i = this.numVerts / 2 - 1; i > 0; i--) {
      p = i * 3;
      this.positions[p] = this.positions[p - 3];
      this.positions[p + 1] = this.positions[p - 2];
      this.positions[p + 2] = this.positions[p - 1];
      p += s;
      this.positions[p] = this.positions[p - 3];
      this.positions[p + 1] = this.positions[p - 2];
      this.positions[p + 2] = this.positions[p - 1];
    }
    // start of tail
    this.target.getWorldPosition(this.targetPos);
    this.positions[0] = this.targetPos.x;
    this.positions[1] = this.targetPos.y + h;
    this.positions[2] = this.targetPos.z - 0.1;
    this.positions[s + 0] = this.targetPos.x;
    this.positions[s + 1] = this.targetPos.y - h;
    this.positions[s + 2] = this.targetPos.z - 0.1;

    this.geometry.attributes.position.needsUpdate = true;
  }
});
