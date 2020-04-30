const BASE_URL = 'https://previews.moonrider.xyz';

function getS3FileUrl (id, name) {
  return `${BASE_URL}/${id}-${name}?v=2`;
}
module.exports.getS3FileUrl = getS3FileUrl;

/**
 * Helper to visualize lines.
 */
console.line = (function () {
  var els = {};
  return function (vec1, vec2, name, color) {
    name = name || 'default';
    color = color || '#FFF';
    if (!els[name]) {
      els[name] = document.createElement('a-entity');
      els[name].setAttribute('line', 'color', color || '#FFF');
      els[name].setAttribute('id', name);
      AFRAME.scenes[0].appendChild(els[name]);
    }
    els[name].setAttribute('line', 'start', vec1.clone());
    els[name].setAttribute('line', 'end', vec2.clone());
  };
})();

/**
 * Helper to visualize vectors.
 */
console.vec3 = (function () {
  const els = {};
  const geo = {primitive: 'box', width: 0.05, height: 0.05, depth: 0.05};
  const mat = {shader: 'flat'};
  return function (vec3, name, color) {
    name = name || 'default';
    color = color || '#FFF';
    if (!els[name]) {
      els[name] = document.createElement('a-entity');
      mat.color = color || '#FFF';
      els[name].setAttribute('geometry', geo);
      els[name].setAttribute('material', mat);
      els[name].setAttribute('id', name);
      els[name].setAttribute('text', {align: 'center', value: name, side: 'double'});
      AFRAME.scenes[0].appendChild(els[name]);
    }
    els[name].object3D.position.copy(vec3);
 };
})();
