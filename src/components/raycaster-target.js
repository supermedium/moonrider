/**
 * Set raycast target as a child independnent from entity.
 * Useful for padding the raycast target of a mesh without changing the mesh.
 */
AFRAME.registerComponent('raycaster-target', {
  schema: {
    bindToggle: {default: ''},
    depth: {type: 'number'},
    height: {type: 'number'},
    position: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
    rotation: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
    useBoxTarget: {default: false},
    width: {type: 'number'}
  },

  init: (function () {
    var boxGeometry = {primitive: 'box'};
    var planeGeometry = {primitive: 'plane'};

    return function () {
      var data = this.data;
      var el = this.el;
      var geometry;
      var raycastTarget;

      raycastTarget = document.createElement('a-entity');
      raycastTarget.classList.add('raycasterTarget');

      if (data.bindToggle) {
        raycastTarget.setAttribute('bind-toggle__raycastable', data.bindToggle);
      } else {
        raycastTarget.setAttribute('data-raycastable', '');
      }

      if (data.useBoxTarget) {
        // 3D target.
        geometry = boxGeometry;
        geometry.depth = data.depth;
        geometry.height = data.height;
        geometry.width = data.width;
      } else {
        // 2D target.
        geometry = planeGeometry;
        geometry.height = data.height;
        geometry.width = data.width;
      }
      raycastTarget.setAttribute('geometry', geometry);

      raycastTarget.object3D.visible = false;
      raycastTarget.object3D.position.copy(data.position);
      raycastTarget.object3D.rotation.x = THREE.Math.degToRad(data.rotation.x);
      raycastTarget.object3D.rotation.y = THREE.Math.degToRad(data.rotation.y);
      raycastTarget.object3D.rotation.z = THREE.Math.degToRad(data.rotation.z);

      el.appendChild(raycastTarget);
    };
  })()
});
