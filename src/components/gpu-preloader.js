let i = 0;

/**
 * Preload textures to GPU that are not visible from the start..
 * three.js renderer by default will not upload textures from non-visible entities.
 */
AFRAME.registerComponent('gpu-preloader', {
  dependencies: ['materials'],

  play: function () {
    setTimeout(() => {
      this.preloadFromSelector('#mainLogo');
      this.preloadFromSelector('#prevArrow');
      this.preloadFromSelector('#stepback');
      this.preloadFromSelector('.difficultyBackground');
      this.preloadFromSelector('.genreIcon');
      this.preloadFromSelector('.merkababloom');
      this.preloadFromSelector('.searchResultBackground');
      this.preloadMaterialsComponentTextures();
      this.preloadKeyboard();
      this.preloadSlice();
      this.preloadEnvMap();
      this.preloadFXs();
    }, 1000);
  },

  // Standard material.map texture got from a dom selector
  preloadFromSelector: function (selector) {
    const el = document.querySelector(selector);
    this.preloadTexture(el.getObject3D('mesh').material.map);
  },

  // List of textures gathered in `materials` system
  preloadMaterialsComponentTextures: function () {
    const textures = this.el.systems.materials.textureList;
    for (var i = 0; i < textures.length; i++) {
      this.preloadTexture(textures[i]);
    }
  },

  preloadKeyboard: function () {
    const keyboard = document.getElementById('keyboard').components['super-keyboard'];
    this.preloadTexture(keyboard.kbImg.getObject3D('mesh').material.map);
    this.preloadTexture(keyboard.keyColorPlane.getObject3D('mesh').material.map);
  },

  preloadSlice: function () {
    const button = document.getElementById('searchPrevPage');
    this.preloadTexture(button.components.slice9.material.map);
  },

  preloadEnvMap: function () {
    const wall = document.querySelector('#wallContainer [wall]');
    this.preloadTexture(wall.components.material.material.uniforms.environment.value);
  },

  preloadFXs: function () {
    const cutfx = document.querySelector('#rigContainer [mixin~=blueBeatFX]');
    this.preloadTexture(cutfx.components.material.material.uniforms.src.value);

    const minefx = document.querySelector('#rigContainer [mixin~=mineFX]');
    this.preloadTexture(minefx.components.material.material.map);
  },

  preloadTexture: function (texture) {
    if (!texture || !texture.image) {
      console.warn('[gpu-preloader] Error preloading texture', texture);
      return;
    }
    if (!texture.image.complete) {
      console.warn('[gpu-preloader] Error preloading, image not loaded', texture);
      return;
    }
    this.el.renderer.setTexture2D(texture, i++ % 8);
  }
});
