/**
 * TextGeometry component for A-Frame.
 */
import { TextGeometry } from '../lib/TextGeometry.js';
import { FontLoader } from '../lib/FontLoader.js';

var debug = AFRAME.utils.debug;

var error = debug('aframe-text-component:error');

var fontLoader = new FontLoader();

AFRAME.registerComponent('text-geometry', {
  schema: {
    bevelEnabled: {default: false},
    bevelSize: {default: 8, min: 0},
    bevelThickness: {default: 12, min: 0},
    curveSegments: {default: 12, min: 0},
    font: {type: 'asset', default: 'https://rawgit.com/ngokevin/kframe/master/components/text-geometry/lib/helvetiker_regular.typeface.json'},
    height: {default: 0.05, min: 0},
    size: {default: 0.5, min: 0},
    style: {default: 'normal', oneOf: ['normal', 'italics']},
    weight: {default: 'normal', oneOf: ['normal', 'bold']},
    value: {default: ''}
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function (oldData) {
    const data = this.data;
    const el = this.el;

    if (!data.value) { return; }

    let mesh = el.getObject3D('mesh');
    if (!mesh) {
      mesh = new THREE.Mesh();
      el.setObject3D('mesh', mesh);
    }

    if (data.font.constructor === String) {
      // Load typeface.json font.
      fontLoader.load(data.font, function (response) {
        const textData = AFRAME.utils.clone(data);
        textData.font = response;
        mesh.geometry = new TextGeometry(data.value, textData);
        mesh.geometry.translate(-0.18, 0, -0.07);
      });
    } else if (data.font.constructor === Object) {
      // Set font if already have a typeface.json through setAttribute.
      mesh.geometry = new TextGeometry(data.value, data);
      mesh.geometry.translate(-0.18, 0, -0.07);
    } else {
      error('Must provide `font` (typeface.json) or `fontPath` (string) to text component.');
    }
  }
});
