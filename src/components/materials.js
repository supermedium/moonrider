const COLORS = require('../constants/colors');

const auxColor = new THREE.Color();

AFRAME.registerSystem('materials', {
  schema: {},

  init: function () {
    this.curve = null;
    this.panelMaterials = [];

    const scheme = localStorage.getItem('colorScheme') || 'default';
    this.scheme = COLORS.schemes[scheme];

    // Collect references to textures for gpu-preloader.
    this.textureList = [];

    // Generated textures.
    this.beatsCanvas = document.createElement('canvas');
    this.beatsTexture = new THREE.CanvasTexture(this.beatsCanvas);
    this.generateBeatsTexture();
    this.textureList.push(this.beatsTexture);

    this.envmapCanvas = document.createElement('canvas');
    this.envmapTexture = new THREE.CanvasTexture(this.envmapCanvas);
    this.generateEnvmapTexture();
    this.textureList.push(this.envmapTexture);

    /*
    this.cutFxCanvas = document.createElement('canvas');
    this.cutFxTexture = new THREE.CanvasTexture(this.cutFxCanvas);
    this.generateCutFxTexture();
    this.textureList.push(this.cutFxTexture);
    */

    this.fistsCanvas = document.createElement('canvas');
    this.fistsTexture = new THREE.CanvasTexture(this.fistsCanvas);
    this.generateFistsTexture();
    this.textureList.push(this.fistsTexture);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.createMaterials();
      });
    } else {
      this.createMaterials();
    }
  },

  play: function () {
    this.setColorScheme();
  },

  tick: function (t, dt) {
    this.aurora.uniforms.time.value = t;
    if (this.home.animate) { this.home.uniforms.time.value = t; }
    this.leftFistWeapon.uniforms.time.value = t;
    this.leftWeapon.uniforms.time.value = t;
    this.rightFistWeapon.uniforms.time.value = t;
    this.rightWeapon.uniforms.time.value = t;
    this.rings.uniforms.time.value = t;
    this.tube.uniforms.time.value = t;
  },

  createMaterials: function () {
    const scheme = this.scheme;

    this.tunnel = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/tunnel.vert.glsl'),
      fragmentShader: require('./shaders/tunnel.frag.glsl'),
      uniforms: {
        fogColor: {value: new THREE.Color(scheme.primary)},
        color1: {value: new THREE.Color(scheme.primary)},
        color2: {value: new THREE.Color(scheme.secondary)},
        color3: {value: new THREE.Color(scheme.tertiary)},
        scale: {value: 1.0}
      },
      transparent: true
    });

    this.merkaba = new THREE.MeshBasicMaterial({
      color: new THREE.Color(scheme.primary)
    });

    this.backglow = new THREE.MeshBasicMaterial({
      transparent: true,
      map: new THREE.TextureLoader().load(document.getElementById('backGlowImg').src),
      color: new THREE.Color(scheme.primary)
    });
    this.textureList.push(this.backglow.map);

    this.aurora = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/aurora.vert.glsl'),
      fragmentShader: require('./shaders/aurora.frag.glsl'),
      uniforms: {
        colorPrimary: {value: new THREE.Color(scheme.primary)},
        colorSecondary: {value: new THREE.Color(scheme.secondary)},
        time: {value: 0}
      },
      transparent: true
    });

    this.rings = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/rings.vert.glsl'),
      fragmentShader: require('./shaders/rings.frag.glsl'),
      uniforms: {
        colorPrimary: {value: new THREE.Color(scheme.primary)},
        colorSecondary: {value: new THREE.Color(scheme.secondary)},
        colorTertiary: {value: new THREE.Color(scheme.tertiary)},
        time: {value: 0}
      },
      transparent: true,
      depthWrite: false
    });

    this.moon = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/moon.vert.glsl'),
      fragmentShader: require('./shaders/moon.frag.glsl'),
      uniforms: {
        map: {value: new THREE.TextureLoader().load(document.getElementById('moonImg').src)},
        tint: {value: new THREE.Color(scheme.secondarybright)}
      },
      transparent: true
    });
    this.textureList.push(this.moon.uniforms.map.value);

    this.home = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/home.vert.glsl'),
      fragmentShader: require('./shaders/home.frag.glsl'),
      uniforms: {
        color1: {value: new THREE.Color(scheme.primary)},
        color2: {value: new THREE.Color(scheme.secondary)},
        color3: {value: new THREE.Color(scheme.tertiary)},
        src: {value: new THREE.TextureLoader().load(document.getElementById('homeShadowImg').src)},
        time: {value: 0}
      },
      transparent: true
    });
    this.textureList.push(this.home.uniforms.src.value);

    const weaponTexture = new THREE.TextureLoader().load(
      document.getElementById('weaponImg').src);
    weaponTexture.wrapS = THREE.RepeatWrapping;
    weaponTexture.wrapT = THREE.RepeatWrapping;
    weaponTexture.repeat.set(2, 2);
    weaponTexture.magFilter =  THREE.NearestFilter;
    this.textureList.push(weaponTexture);

    this.rightWeapon = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/weapon.vert.glsl'),
      fragmentShader: require('./shaders/weapon.frag.glsl'),
      uniforms: {
        src: {value: weaponTexture},
        color: {value: new THREE.Color(scheme.secondary)},
        thickness: {value: 1.6},
        time: {value: 0}
      },
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    this.leftWeapon = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/weapon.vert.glsl'),
      fragmentShader: require('./shaders/weapon.frag.glsl'),
      uniforms: {
        src: {value: weaponTexture},
        color: {value: new THREE.Color(scheme.primary)},
        thickness: {value: 1.6},
        time: {value: 0}
      },
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    this.leftFistWeapon = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/flat.vert.glsl'),
      fragmentShader: require('./shaders/fistWeapon.frag.glsl'),
      uniforms: {
        src: {value: weaponTexture},
        color: {value: new THREE.Color(scheme.primary)},
        time: {value: 0}
      },
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    this.rightFistWeapon = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/flat.vert.glsl'),
      fragmentShader: require('./shaders/fistWeapon.frag.glsl'),
      uniforms: {
        src: {value: weaponTexture},
        color: {value: new THREE.Color(scheme.secondary)},
        time: {value: 0}
      },
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    const weaponHandleEnvTexture = new THREE.TextureLoader().load(
      document.getElementById('weaponImg').src);
    const weaponHandleTexture = new THREE.TextureLoader().load(
      document.getElementById('weaponHandleImg').src);
    weaponHandleEnvTexture.mapping = THREE.SphericalReflectionMapping;
    this.textureList.push(weaponHandleEnvTexture);
    this.textureList.push(weaponHandleTexture);

    this.leftWeaponHandle = new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.5,
      color: new THREE.Color(scheme.primary),
      map: weaponHandleTexture,
      envMap: weaponHandleEnvTexture
    });
    this.rightWeaponHandle = new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.5,
      color: new THREE.Color(scheme.secondary),
      map: weaponHandleTexture,
      envMap: weaponHandleEnvTexture
    });

    const fistEnvTexture = new THREE.TextureLoader().load(document.getElementById('weapon2Img').src);
    fistEnvTexture.mapping = THREE.SphericalReflectionMapping;
    this.leftFist = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.8,
      map: this.fistsTexture,
      envMap: fistEnvTexture,
      transparent: true
    });
    this.rightFist = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.8,
      map: this.fistsTexture,
      envMap: fistEnvTexture,
      transparent: true
    });

    this.beat = new THREE.MeshLambertMaterial({map: this.beatsTexture, transparent: true});
    this.blueBeatPieces = new THREE.MeshLambertMaterial({
      map: this.beatsTexture,
      color: scheme.secondary,
      emissive: scheme.secondary,
      emissiveIntensity: 0.2
    });
    this.redBeatPieces = new THREE.MeshLambertMaterial({
      map: this.beatsTexture,
      color: scheme.primary,
      emissive: scheme.primary,
      emissiveIntensity: 0.2
    });
    this.minePieces = new THREE.MeshLambertMaterial({
      color: scheme.tertiary,
      emissive: scheme.tertiary,
      emissiveIntensity: 0.2
    });

    const glowTexture = new THREE.TextureLoader().load(
      document.getElementById('backGlowImg').src);
    this.redBeatGlow = new THREE.MeshBasicMaterial({
      color: scheme.primary,
      map: glowTexture,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    this.blueBeatGlow = new THREE.MeshBasicMaterial({
      color: scheme.secondary,
      map: glowTexture,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    this.textureList.push(glowTexture);

    this.stars = new THREE.PointsMaterial({
      size: 1,
      map: new THREE.TextureLoader().load(document.getElementById('starImg').src),
      blending: THREE.AdditiveBlending,
      transparent: true,
      color: new THREE.Color(scheme.secondary)
    });
    this.textureList.push(this.stars.map);

    const sideglowTexture = new THREE.TextureLoader().load(
      document.getElementById('sideglowImg').src);
    this.textureList.push(sideglowTexture);
    this.leftsideglow = new THREE.MeshBasicMaterial({
      map: sideglowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      side: THREE.BackSide,
      color: new THREE.Color(COLORS.OFF)
    });

    this.rightsideglow = new THREE.MeshBasicMaterial({
      map: sideglowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      color: new THREE.Color(COLORS.OFF)
    });

    const plumeTexture = new THREE.TextureLoader().load(document.getElementById('plumeImg').src);
    plumeTexture.minFilter = THREE.LinearFilter;
    this.arrowBluePlume = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/plume.vert.glsl'),
      fragmentShader: require('./shaders/plume.frag.glsl'),
      uniforms : {
        color: {value: new THREE.Color(scheme.secondary)},
        src: {value: plumeTexture}
      },
      transparent: true,
      depthTest: false,
    });

    this.arrowRedPlume = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/plume.vert.glsl'),
      fragmentShader: require('./shaders/plume.frag.glsl'),
      uniforms : {
        color: {value: new THREE.Color(scheme.primary)},
        src: {value: plumeTexture}
      },
      transparent: true,
      depthTest: false,
    });

    this.dotBluePlume = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/plume.vert.glsl'),
      fragmentShader: require('./shaders/plume.frag.glsl'),
      uniforms : {
        color: {value: new THREE.Color(scheme.secondary)},
        src: {value: plumeTexture}
      },
      transparent: true,
      depthTest: false,
    });

    this.dotRedPlume = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/plume.vert.glsl'),
      fragmentShader: require('./shaders/plume.frag.glsl'),
      uniforms : {
        color: {value: new THREE.Color(scheme.primary)},
        src: {value: plumeTexture}
      },
      transparent: true,
      depthTest: false,
    });

    this.minePlume = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/plume.vert.glsl'),
      fragmentShader: require('./shaders/plume.frag.glsl'),
      uniforms: {
        color: {value: new THREE.Color(scheme.tertiary)},
        src: {value: plumeTexture}
      },
      transparent: true,
      depthTest: false,
    });

    const tubeTexture = new THREE.TextureLoader().load(document.getElementById('tubeImg').src);
    const tubeColorTexture = new THREE.TextureLoader().load(document.getElementById('tubeColorImg').src);
    tubeTexture.generateMipmaps = false;
    tubeTexture.minFilter = THREE.LinearFilter;
    tubeColorTexture.generateMipmaps = false;
    tubeColorTexture.minFilter = THREE.LinearFilter;
    this.tube = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/tube.vert.glsl'),
      fragmentShader: require('./shaders/tube.frag.glsl'),
      uniforms: {
        time: {value: 0},
        opacity: {value: 0},
        src: {value: tubeTexture},
        color: {value: tubeColorTexture}
      },
      transparent: true,
      depthTest: false,
      side: THREE.BackSide
    });

    const trailTexture = new THREE.TextureLoader().load(document.getElementById('handStarTrailImg').src);
    trailTexture.generateMipmaps = false;
    trailTexture.minFilter = THREE.LinearFilter;
    this.handStarTrail = new THREE.ShaderMaterial({
      vertexShader: require('./shaders/handstartrail.vert.glsl'),
      fragmentShader: require('./shaders/handstartrail.frag.glsl'),
      uniforms: {
        colorPrimary: {value: new THREE.Color(scheme.primary)},
        colorSecondary: {value: new THREE.Color(scheme.secondary)},
        colorTertiary: {value: new THREE.Color(scheme.tertiary)},
        pulse: {value: 0},
        src: {value: trailTexture}
      },
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
  },

  /**
   * Change color scheme as commanded by the optionsMenu.html
   * (materials-color-menu component).
   *
   * @param {string} color - ID or name of the color scheme.
   */
  setColorScheme: function (colorSchemeName) {
    const scene = this.el.sceneEl;
    const scheme = this.scheme = COLORS.schemes[colorSchemeName] || COLORS.schemes.default;

    set(this.arrowBluePlume, 'color', scheme.secondary);
    set(this.arrowRedPlume, 'color', scheme.primary);
    set(this.aurora, 'colorPrimary', scheme.primary);
    set(this.aurora, 'colorSecondary', scheme.secondary);
    set(this.backglow, 'color', scheme.primary);
    set(this.blueBeatGlow, 'color', scheme.secondary);
    set(this.blueBeatGlow, 'color', scheme.secondary);
    set(this.blueBeatPieces, 'color', scheme.secondary);
    set(this.blueBeatPieces, 'emissive', scheme.secondary);
    set(this.dotBluePlume, 'color', scheme.secondary);
    set(this.dotRedPlume, 'color', scheme.primary);
    set(this.handStarTrail, 'colorPrimary', scheme.primary);
    set(this.handStarTrail, 'colorSecondary', scheme.secondary);
    set(this.handStarTrail, 'colorTertiary', scheme.tertiary);
    set(this.home, 'color1', scheme.primary);
    set(this.home, 'color2', scheme.secondary);
    set(this.home, 'color3', scheme.tertiary);
    set(this.leftFist, 'color', scheme.primarybright);
    set(this.leftFistWeapon, 'color', scheme.primary);
    set(this.leftWeapon, 'color', scheme.primary);
    set(this.leftWeaponHandle, 'color', scheme.primary);
    set(this.merkaba, 'color', scheme.primary);
    set(this.minePieces, 'color', scheme.tertiary);
    set(this.minePieces, 'emissive', scheme.tertiary);
    set(this.minePlume, 'color', scheme.tertiary);
    set(this.moon, 'tint', scheme.secondarybright);
    set(this.redBeatGlow, 'color', scheme.primary);
    set(this.redBeatGlow, 'color', scheme.primary);
    set(this.redBeatPieces, 'color', scheme.primary);
    set(this.redBeatPieces, 'emissive', scheme.primary);
    set(this.rightFist, 'color', scheme.secondarybright);
    set(this.rightWeapon, 'color', scheme.secondary);
    set(this.rightFistWeapon, 'color', scheme.secondary);
    set(this.rightWeaponHandle, 'color', scheme.secondary);
    set(this.rings, 'colorPrimary', scheme.primary);
    set(this.rings, 'colorSecondary', scheme.secondary);
    set(this.rings, 'colorTertiary', scheme.tertiary);
    set(this.stars, 'color', scheme.secondary);
    set(this.tunnel, 'fogColor', scheme.primary);
    set(this.tunnel, 'color1', scheme.primary);
    set(this.tunnel, 'color2', scheme.secondary);
    set(this.tunnel, 'color3', scheme.tertiary);

    this.generateBeatsTexture();
    // this.generateCutFxTexture();
    this.generateEnvmapTexture();
    this.generateFistsTexture();

    document.querySelectorAll('a-entity[wall]').forEach(el => {
      set(el.getObject3D('mesh').material, 'colorTertiary', scheme.tertiary);
    });

    this.panelMaterials.forEach(material => {
      set(material, 'colorPrimary', scheme.primary);
      set(material, 'colorSecondary', scheme.secondary);
    });

    set(this.curve, 'fogColor', scheme.primary);
    set(this.curve, 'color1', scheme.primary);
    set(this.curve, 'color2', scheme.secondary);
  },

  generateBeatsTexture: function () {
    const scheme = this.scheme;
    const primary = new THREE.Color(scheme.primary);
    const secondary = new THREE.Color(scheme.secondary);
    const tertiary = new THREE.Color(scheme.tertiary);

    const canvas = this.beatsCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 32;

    canvasFill(ctx, tertiary.getStyle(), 0, 0, 128, 6);
    canvasFill(ctx, '#000', 128, 0, 128, 6);
    canvasFill(ctx, secondary.getStyle(), 256, 0, 128, 6);
    canvasFill(ctx, primary.getStyle(), 384, 0, 105, 6);
    canvasFill(ctx, '#FFF', 489, 0, 23, 6);

    canvasGradient(ctx, '#000000', secondary.getStyle(), 0, 6, 512, 4);
    canvasGradient(ctx, '#000', primary.getStyle(), 0, 10, 512, 5);
    canvasGradient(ctx, '#000', tertiary.getStyle(), 0, 15, 512, 4);

    canvasGradient(
      ctx,
      `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, 0)`,
      secondary.getStyle(), 0, 19, 512, 5);
    canvasGradient(
      ctx,
      `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0)`,
      primary.getStyle(), 0, 24, 512, 4);
    canvasGradient(
      ctx,
      `rgba(${tertiary.r}, ${tertiary.g}, ${tertiary.b}, 0)`,
      tertiary.getStyle(), 0, 28, 512, 4);

    const texture = this.beatsTexture;
    texture.generateMipmaps = false;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  },

  generateFistsTexture: function () {
    const scheme = this.scheme;
    const primary = new THREE.Color(scheme.primarybright);
    const secondary = new THREE.Color(scheme.secondarybright);

    const canvas = this.fistsCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = 8;
    canvas.height = 128;

    canvasGradient(
      ctx, primary.getStyle(),
      `rgba(${primary.r}, ${primary.g}, ${primary.b}, 0)`,
      0, 0, 4, 128);
    canvasGradient(
      ctx, secondary.getStyle(),
      `rgba(${secondary.r}, ${secondary.g}, ${secondary.b}, 0)`,
      4, 0, 4, 128);

    this.fistsTexture.needsUpdate = true;
    return this.fistsTexture;
  },

  generateEnvmapTexture: function () {
    const scheme = this.scheme;
    const primary = new THREE.Color(scheme.primary);
    const secondary = new THREE.Color(scheme.secondary);

    const img = document.getElementById('envmapTemplateImg');
    img.addEventListener('load', () => {
      const w = img.width;
      const h = img.height;

      const canvas = this.envmapCanvas;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const im = ctx.getImageData(0, 0, w, h);
      const imdata = im.data;

      let primaryWeight;
      let secondaryWeight;
      for (let i = 0; i < imdata.length; i += 4) {
        primaryWeight = imdata[i];
        secondaryWeight = imdata[i + 1];
        primaryWeight *= 1 - secondaryWeight / 255.0;

        imdata[i + 0] = Math.floor(
          primary.r * primaryWeight + secondary.r * secondaryWeight);
        imdata[i + 1] = Math.floor(
          primary.g * primaryWeight + secondary.g * secondaryWeight);
        imdata[i + 2] = Math.floor(
          primary.b * primaryWeight + secondary.b * secondaryWeight);
        imdata[i + 3] = 255;
      };

      ctx.putImageData(im, 0, 0);
      document.getElementById('envmapImg').src = canvas.toDataURL('image/png');
    });
  },

  /*
  generateCutFxTexture: function () {
    const scheme = this.scheme;
    const primary = new THREE.Color(scheme.primary);
    const secondary = new THREE.Color(scheme.secondary);

    const img = document.getElementById('cutFxTemplateImg');
    img.addEventListener('load', () => {
      const w = img.width;
      const h = img.height;

      const canvas = this.cutFxCanvas;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const im = ctx.getImageData(0, 0, w, h);
      const imdata = im.data;

      let primaryWeight;
      let secondaryWeight;
      for (let i = 0; i < imdata.length; i += 4) {
        primaryWeight = imdata[i];
        secondaryWeight = imdata[i + 1];
        primaryWeight *= 1 - secondaryWeight / 255.0;

        imdata[i + 0] = Math.floor(
          primary.r * primaryWeight + secondary.r * secondaryWeight);
        imdata[i + 1] = Math.floor(
          primary.g * primaryWeight + secondary.g * secondaryWeight);
        imdata[i + 2] = Math.floor(
          primary.b * primaryWeight + secondary.b * secondaryWeight);
        imdata[i + 3] = 255;
      };

      ctx.putImageData(im, 0, 0);
      document.getElementById('cutFxImg').src = canvas.toDataURL('image/png');
    });
  },
  */

  registerCurve: function (material) {
    this.curve = material;
  },

  registerPanel: function (material) {
    this.panelMaterials.push(material);
  }
});

AFRAME.registerComponent('materials', {
  schema: {
    animate: {default: true},
    name: {default: ''},
    recursive: {default: true}
  },

  update: function () {
    if (this.data.name === '') { return; }

    this.material = this.system[this.data.name];
    if (!this.material) {
      console.warn(`[materials] Unknown material: ${this.data.name}`);
      return;
    }

    let mesh = this.el.getObject3D('mesh');
    if (!mesh) {
      this.el.addEventListener('object3dset', evt => {
        if (evt.detail.type !== 'mesh') { return; }
        mesh = this.el.getObject3D('mesh');
        if (mesh) { this.applyMaterial(mesh); }
      });
    } else {
      this.applyMaterial(mesh);
    }

    this.material.animate = this.data.animate;
  },

  applyMaterial: function (obj) {
    if (obj.detail) { obj = obj.detail.model; }
    if (this.data.recursive) {
      obj.traverse(o => {
        if (o.type === 'Mesh') {
          o.material = this.material;
        }
      });
    } else {
      obj.material = this.material;
    }
  }
});

AFRAME.registerComponent('materials-color-menu', {
  play: function () {
    this.text = document.getElementById('colorName');
  },

  events: {
    mouseenter: function (evt) {
      this.text.setAttribute('text', 'value', evt.target.dataset.colorName);
    },

    mouseleave: function (evt) {
      this.text.setAttribute('text', 'value', '');
    },

    click: function (evt) {
      this.el.sceneEl.systems.materials.setColorScheme(evt.target.dataset.colorScheme);
      this.el.sceneEl.emit('colorschemechange', evt.target.dataset.colorScheme, false);
    }
  }
});

function set (mat, name, color) {
  auxColor.set(color);
  if (mat.uniforms) {
    mat.uniforms[name].value.x = auxColor.r;
    mat.uniforms[name].value.y = auxColor.g;
    mat.uniforms[name].value.z = auxColor.b;
  } else {
    mat[name].set(color);
  }
}

function canvasFill (ctx, col, x, y, width, height) {
  ctx.fillStyle = col;
  ctx.fillRect(x, y, width, height);
}

function canvasGradient (ctx, col1, col2, x, y, width, height) {
  let gradient;
  if (width > height) {
    gradient = ctx.createLinearGradient(0, 0, width, 0);
  } else {
    gradient = ctx.createLinearGradient(0, 0, 0, height);
  }
  gradient.addColorStop(0, col1);
  gradient.addColorStop(1, col2);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
}
