AFRAME.registerComponent('json-model', {
  schema: {
    debugBones: {default: false},
    debugNormals: {default: false},
    debugNormalsLength: {default: 0.2},
    enabled: {default: false},
    singleModel: {default: false},
    src: {type: 'asset'},
    texturePath: {type: 'asset', default: ''}
  },

  update: function (oldData) {
    this.loader = null;
    this.helpers = new THREE.Group();
    this.mixers = [];
    this.animationNames = [];
    this.skeletonHelper = null;

    const src = this.data.src;
    if (!src || src === oldData.src) { return; }
    console.log('loading');

    if (this.data.singleModel) {
      this.loader = new THREE.JSONLoader();
      this.loader.setTexturePath(this.data.texturePath);
      this.loader.load(src, this.onModelLoaded.bind(this));
    } else {
      this.loader = new THREE.ObjectLoader();
      this.loader.setCrossOrigin('');
      this.loader.load(src, this.onSceneLoaded.bind(this));
    }
  },

  tick: function (time, timeDelta) {
    if (!this.data.enabled) { return; }
    for (let i in this.mixers) {
      this.mixers[i].mixer.update(timeDelta / 1000);
    }
  },

  fixNormal: function (vector) {
    const t = vector.y;
    vector.y = -vector.z;
    vector.z = t;
  },

  onModelLoaded: function(geometry, materials) {
    this.helpers = new THREE.Group();
    console.log('modeloaded');

    const mesh = new THREE.SkinnedMesh(geometry, materials[0]);
    mesh.geometry.faces.forEach(face => {
      face.vertexNormals.forEach(vertex => {
        if (!vertex.hasOwnProperty('fixed')) {
          this.fixNormal(vertex);
          vertex.fixed = true;
        }
      });
    });

    if (mesh.geometry['animations'] !== undefined && mesh.geometry.animations.length > 0) {
      mesh.material.skinning = true;
      const mixer = {mixer: new THREE.AnimationMixer(mesh), clips: {}};
      for (let i in mesh.geometry.animations) {
        const anim = mesh.geometry.animations[i];
        const clip = mixer.mixer.clipAction(anim).stop();
        clip.setEffectiveWeight(1);
        mixer.clips[anim.name] = clip;
      }
      this.mixers.push(mixer);
    }

    this.addNormalHelpers(mesh);

    this.helpers.visible = this.data.debugNormals;
    this.el.setObject3D('helpers', this.helpers);

    this.skeletonHelper = new THREE.SkeletonHelper( mesh );
    this.skeletonHelper.material.linewidth = 2;
    this.el.setObject3D('skelhelper', this.skeletonHelper );
    this.skeletonHelper.visible = this.data.debugBones;

    this.el.setObject3D('mesh', mesh);
    this.el.emit('model-loaded', {format: 'json', model: mesh, src: this.data.src});
  },

  onSceneLoaded: function(group) {
    this.helpers = new THREE.Group();
    console.log('sceneloaded');

    if (group['animations'] !== undefined) {
      const mixer = {mixer: new THREE.AnimationMixer(group), clips: {}};
      for (let i in group.animations) {
        const anim = group.animations[i];
        const clip = mixer.mixer.clipAction(anim).stop();
        mixer.clips[anim.name] = clip;
      }
      this.mixers.push(mixer);
    }

    group.traverse(child => {
      if (!(child instanceof THREE.Mesh)) { return; }

      child.geometry.faces.forEach(face => {
        face.vertexNormals.forEach(vertex => {
          if (!vertex.hasOwnProperty('fixed')) {
            this.fixNormal(vertex);
            vertex.fixed = true;
          }
        });
      });

      this.addNormalHelpers(child);
    });

    this.helpers.visible = this.data.debugNormals;
    this.el.setObject3D('helpers', this.helpers);
    this.el.setObject3D('mesh', group);
    this.el.emit('model-loaded', {format: 'json', model: group, src: this.data.src});
  },

  addNormalHelpers: function (mesh) {
    const fnh = new THREE.FaceNormalsHelper(mesh, this.data.debugNormalsLength);
    this.helpers.add(fnh);
    const vnh = new THREE.VertexNormalsHelper(mesh, this.data.debugNormalsLength);
    this.helpers.add(vnh);

    mesh.geometry.normalsNeedUpdate = true;
    mesh.geometry.verticesNeedUpdate = true;
  },

  playAnimation: function (animationName, repeat) {
    for (let i in this.mixers) {
      let clip = this.mixers[i].clips[animationName];
      if (clip === undefined) continue;
      clip.stop().play();
      let repetitions = 0;
      if (repeat === true) {
        repetitions = Infinity;
      } else if (repeat == undefined) {
        repeat = false;
      } else if (typeof(repeat) == 'number') {
        if (repeat === 0) { repeat = false; }
        repetitions = repeat;
      } else {
        repeat = false;
      }
      clip.setLoop( repeat ? THREE.LoopRepeat : THREE.LoopOnce, repetitions );
    }
  },

  stopAnimation: function () {
    for (let i in this.mixers) {
      for (let j in this.mixers[i].clips) {
        this.mixers[i].clips[j].stop();
      }
    }
  }
});
