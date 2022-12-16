import utils from '../utils';

var CANVAS_HEIGHT = 512; // Power-of-two.
var HEIGHT = 64;
var NUM_PER_PAGE = 6;
var WIDTH = 64;

// Apply height factor since the images don't reach the power-of-two height, need to stretch.
var HEIGHT_FACTOR = CANVAS_HEIGHT / (HEIGHT * NUM_PER_PAGE);
var IMAGE_HEIGHT_CANVAS = HEIGHT * HEIGHT_FACTOR;

/**
 * Create thumbnail atlas for all the thumbnail images together per page.
 */
AFRAME.registerComponent('search-thumbnail-atlas', {
  dependencies: ['geometry', 'material'],

  schema: {
    dummyUpdater: { type: 'string' }
  },

  init: function () {
    // Create canvas for texture atlas.
    const canvas = this.canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'thumbnailAtlasMap');
    canvas.height = CANVAS_HEIGHT; // Power-of-two.
    canvas.width = WIDTH;
    canvas.style.visibility = 'hidden';
    this.ctx = canvas.getContext('2d');
    this.clearCanvas();
    document.body.appendChild(canvas);

    // Alpha map for when search results don't contain max number of results.
    const alphaCanvas = this.alphaCanvas = document.createElement('canvas');
    alphaCanvas.setAttribute('id', 'thumbnailAlphaMap');
    alphaCanvas.height = CANVAS_HEIGHT;
    alphaCanvas.width = WIDTH;
    alphaCanvas.style.visibility = 'hidden';
    this.alphaCtx = alphaCanvas.getContext('2d');
    document.body.appendChild(alphaCanvas);

    this.el.components.material.material.alphaMap = new THREE.CanvasTexture(alphaCanvas);
    this.el.setAttribute('material', 'src', canvas);
    this.images = [];

    this.lastNumResults = NUM_PER_PAGE;
  },

  update: function () {
    var el = this.el;

    const results = el.sceneEl.systems.state.state.searchResultsPage;
    for (let i = 0; i < results.length; i++) {
      let img = this.images[i] = this.images[i] || document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.src = results[i].coverURL;
      if (img.complete) {
        this.draw(img, i);
      } else {
        img.onload = () => {
          this.draw(img, i);
        };
      }
    }

    // Update alpha map.
    if (results.length !== this.lastNumResults) { this.updateAlphaMap(results.length); }
    this.lastNumResults = results.length;
  },

  /**
   * Draw thumbnail on canvas at row i.
   */
  draw: function (img, i) {
    this.ctx.drawImage(
      img,
      0,
      i * IMAGE_HEIGHT_CANVAS,
      WIDTH,
      IMAGE_HEIGHT_CANVAS);
    this.el.getObject3D('mesh').material.map.needsUpdate = true;
  },

  clearCanvas: function () {
    const canvas = this.canvas;
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  },

  updateAlphaMap: function (numResults) {
    const canvas = this.alphaCanvas;
    const ctx = this.alphaCtx;
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(
      0,
      numResults * IMAGE_HEIGHT_CANVAS,
      canvas.width,
      canvas.height - numResults * IMAGE_HEIGHT_CANVAS);
    this.el.getObject3D('mesh').material.alphaMap.needsUpdate = true;
    this.el.getObject3D('mesh').material.needsUpdate = true;
  }
});
