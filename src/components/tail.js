/**
 * Hand star-trail for Ride Mode.
 */
AFRAME.registerComponent('tail', {
  schema: {
    height: {default: 0.1},
    segments: {default: 10, type: 'int'},
    target: {type: 'selector'},
    width: {default: 1}
  },

  init: function () {
    const data = this.data;

    const geometry = this.geometry = new THREE.PlaneBufferGeometry(
      data.width, data.height, data.segments, 1);
    geometry.deleteAttribute('normal');
    geometry.translate(data.width / 2, 0, 0);

    const material = this.el.sceneEl.systems.materials.handStarTrail;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    this.el.setObject3D('mesh', mesh);
    this.positions = geometry.attributes['position'].array;
    this.numVerts = data.segments * 2 + 2;
    this.geometry = geometry;
    this.target = data.target.object3D;
    this.targetPos = new THREE.Vector3();
  },

  tick: function (time, delta) {
    const positions = this.positions;
    const targetPos = this.targetPos;

    let p;
    let s = this.numVerts / 2 * 3;
    let h = this.data.height / 2;

    for (let i = this.numVerts / 2 - 1; i > 0; i--) {
      p = i * 3;
      positions[p] = positions[p - 3];
      positions[p + 1] = positions[p - 2];
      positions[p + 2] = positions[p - 1];
      p += s;
      positions[p] = positions[p - 3];
      positions[p + 1] = positions[p - 2];
      positions[p + 2] = positions[p - 1];
    }

    // Start of tail.
    this.target.getWorldPosition(targetPos);
    positions[0] = targetPos.x;
    positions[1] = targetPos.y + h;
    positions[2] = targetPos.z - 0.1;
    positions[s + 0] = targetPos.x;
    positions[s + 1] = targetPos.y - h;
    positions[s + 2] = targetPos.z - 0.1;

    this.geometry.attributes.position.needsUpdate = true;
  }
});
