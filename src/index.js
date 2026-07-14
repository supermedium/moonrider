function requireAll (req) { req.keys().forEach(req); }

console.time = () => {
};
console.timeEnd = () => {
};

require('aframe-aabb-collider-component');
require('aframe-atlas-uvs-component');
require('aframe-audioanalyser-component');
require('aframe-event-set-component');
require('aframe-geometry-merger-component');
require('aframe-haptics-component');
require('aframe-layout-component');
if (process.env.DEBUG_LOG) {
  require('aframe-log-component');
} else {
  AFRAME.log = () => void 0;
}
require('aframe-orbit-controls');
require('aframe-proxy-event-component');
require('aframe-render-order-component');
require('aframe-state-component');
THREE.PlaneBufferGeometry =  THREE.PlaneGeometry; // slice9 still uses PlaneBufferGeometry
require('aframe-slice9-component');
require('aframe-thumb-controls-component');

requireAll(require.context('./components/', true, /\.js$/));
requireAll(require.context('./state/', true, /\.js$/));

require('./index.css');

require('./scene.html');

if (module.hot) { module.hot.accept(); }

// Redirect to HTTPS in production.
if (window.location.protocol === 'http:' && !window.location.host.startsWith('localhost')) {
  window.location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
