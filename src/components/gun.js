/**
 * Shooter. Entity that spawns bullets and handles bullet types.
 */
AFRAME.registerComponent('gun', {
  schema: {
    activeBulletType: {type: 'string', default: 'normal'},
    enabled: {default: false}
  },

  init: function () {
    this.bulletSystem = this.el.sceneEl.systems.bullet;
  },

  events: {
    triggerdown: function shoot (evt) {
      if (!this.data.enabled) { return; }
      this.bulletSystem.shoot(this.data.activeBulletType, this.el.object3D);
    }
  },

  tickBeatSystem: function (time, timeDelta) {
    this.bulletSystem.tickBeatSystem(time, timeDelta, this.data.activeBulletType);
  },

  checkCollision: function (beat) {
    return this.bulletSystem.checkCollision(beat, this.data.activeBulletType);
  }
});

/**
 * Bullet system for collision detection.
 */
AFRAME.registerSystem('bullet', {
  init: function () {
    // Bullet container object3D.
    const bulletContainer = document.createElement('a-entity');
    bulletContainer.id = 'bulletContainer';
    this.el.sceneEl.appendChild(bulletContainer);
    this.container = bulletContainer.object3D;

    this.pool = {};
  },

  /**
   * Register and initialize bullet type.
   */
  registerBullet: function (bulletComponent) {
    const model = bulletComponent.el.object3D;
    if (!model) { return; }
    const bulletData = bulletComponent.data;

    // Precompute bbox.
    const bbox = new THREE.Box3();
    const geometry = bulletComponent.el.getObject3D('mesh').geometry;
    geometry.computeBoundingBox();
    bbox.copy(geometry.boundingBox);

    // Initialize pool and bullets.
    this.pool[bulletData.name] = [];
    for (let i = 0; i < bulletData.poolSize; i++) {
      const bullet = model.clone();
      bullet.active = false;
      bullet.bbox = bbox;
      bullet.direction = new THREE.Vector3(0, 0, -1);
      bullet.maxTime = bulletData.maxTime * 1000;
      bullet.name = bulletData.name + i;
      bullet.speed = bulletData.speed;
      bullet.time = 0;
      bullet.type = bulletData.name;
      this.pool[bulletData.name].push(bullet);
    }
  },

  shoot: function (bulletName, gun) {
    let oldest = 0;
    let oldestTime = 0;
    const pool = this.pool[bulletName];

    if (pool === undefined) { return null; }

    // Find available bullet and initialize it.
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].visible === false) {
        return this.shootBullet(pool[i], gun);
      } else if (pool[i].time > oldestTime){
        oldest = i;
        oldestTime = pool[i].time;
      }
    }

    // All bullets are active, pool is full, grab oldest bullet.
    return this.shootBullet(pool[oldest], gun);
  },

  shootBullet: function (bullet, gun) {
    bullet.active = true;
    bullet.time = 0;
    gun.getWorldPosition(bullet.position);
    gun.getWorldDirection(bullet.direction);
    bullet.direction.multiplyScalar(-bullet.speed);
    this.container.add(bullet);
    return bullet;
  },

  tickBeatSystem: (function () {
    const bulletTranslation = new THREE.Vector3();

    return function (time, timeDelta, type) {
      for (let i = 0; i < this.container.children.length; i++) {
        const bullet = this.container.children[i];
        if (!bullet.active || bullet.type !== type) { continue; }

        // Move bullet.
        bullet.time += timeDelta;
        if (bullet.time >= bullet.maxTime) {
          this.returnToPool(bullet);
          continue;
        }
        bulletTranslation.copy(bullet.direction).multiplyScalar(timeDelta / 850);
        bullet.position.add(bulletTranslation);
      }
    };
  })(),

  checkCollision: (function () {
    const beatBox = new THREE.Box3();
    const bulletBox = new THREE.Box3();

    return function (beat, type) {
      // Beat bbox is precomputed once at init and now simply translated.
      beatBox.copy(beat.bbox).translate(beat.el.object3D.position);

      for (let i = 0; i < this.container.children.length; i++) {
        const bullet = this.container.children[i];
        if (!bullet.active || bullet.type !== type) { continue; }

        // Bullet bbox is precomputed once at init and now simply translated.
        bulletBox.copy(bullet.bbox).translate(bullet.position);

        if (target.bbox.intersectsBox(bulletBox)) {
          this.returnToPool(bullet);
          return true;
        }
      }
    };
  })(),

  returnToPool: function (bullet) {
    bullet.active = false;
  }
});

/**
 * Bullet template component
 */
AFRAME.registerComponent('bullet', {
  dependencies: ['material'],

  schema: {
    maxTime: {default: 4.0, type: 'float'},  // seconds.
    name: {default: 'normal', type: 'string'},
    poolSize: {default: 10, type: 'int', min: 0},
    speed: {default: 8.0, type: 'float'}  // meters / sec.
  },

  init: function () {
    const el = this.el;
    el.object3D.visible = false;
    el.addEventListener('object3dset', evt => {
      el.sceneEl.systems.bullet.registerBullet(this);
    });
  }
});
