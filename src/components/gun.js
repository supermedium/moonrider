/**
 * Shooter. Entity that spawns bullets and handles bullet types.
 */
AFRAME.registerComponent('gun', {
  schema: {
    activeBulletType: {type: 'string', default: 'normal'},
    bulletTypes: {type: 'array', default: ['normal']},
    cycle: {default: false},
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

  /**
   * Listen to `changebullet` action / event telling the gun to change bullet type.
   * Currently unused.
   */
  onChangeBullet: function (evt) {
    var data = this.data;
    var el = this.el;
    var idx;

    // Cycle to next bullet type.
    if (evt.detail === 'next') {
      idx = data.bulletTypes.indexOf(data.activeBulletType);
      if (idx === -1) { return; }
      idx = data.cycle
        ? (idx + 1) % data.bulletTypes.length
        : Math.min(data.bulletTypes.length - 1, idx + 1);
      data.activeBulletType = data.bulletTypes[idx];
      el.setAttribute('gun', 'activeBulletType', data.bulletTypes[idx]);
      return;
    }

    // Cycle to previous bullet type.
    if (evt.detail === 'prev') {
      idx = data.bulletTypes.indexOf(data.activeBulletType);
      if (idx === -1) { return; }
      idx = data.cycle
        ? (idx - 1) % data.bulletTypes.length
        : Math.max(0, idx - 1);
      data.activeBulletType = data.bulletTypes[idx];
      el.setAttribute('gun', 'activeBulletType', data.bulletTypes[idx]);
      return;
    }

    // Direct set bullet type.
    el.setAttribute('gun', 'activeBulletType', evt.detail);
  },

  tickBeatSystem: function () {

  },

  checkCollision: function (beat) {

  }
});

/**
 * Bullet system for collision detection.
 */
AFRAME.registerSystem('bullet', {
  init: function () {
    const bulletContainer = document.createElement('a-entity');
    bulletContainer.id = 'bulletContainer';
    this.el.sceneEl.appendChild(bulletContainer);

    this.container = bulletContainer.object3D;
    this.activeBullets = [];
    this.bulletPool = {};
  },

  /**
   * Register and initialize bullet type.
   */
  registerBullet: function (bulletComponent) {
    const model = bulletComponent.el.object3D;
    if (!model) { return; }
    const bulletData = bulletComponent.data;

    // Initialize pool and bullets.
    this.pool[bulletData.name] = [];
    for (let i = 0; i < bulletData.poolSize; i++) {
      const bullet = model.clone();
      bullet.damagePoints = bulletData.damagePoints;
      bullet.direction = new THREE.Vector3(0, 0, -1);
      bullet.maxTime = bulletData.maxTime * 1000;
      bullet.name = bulletData.name + i;
      bullet.speed = bulletData.speed;
      bullet.time = 0;
      bullet.active = false;
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

  tick: (function () {
    const bulletBox = new THREE.Box3();
    const bulletTranslation = new THREE.Vector3();
    const targetBox = new THREE.Box3();

    return function (time, delta) {
      let isHit;

      for (let i = 0; i < this.container.children.length; i++) {
        const bullet = this.container.children[i];
        if (!bullet.active) { continue; }
        bullet.time += delta;
        if (bullet.time >= bullet.maxTime) {
          this.killBullet(bullet);
          continue;
        }
        bulletTranslation.copy(bullet.direction).multiplyScalar(delta / 850);
        bullet.position.add(bulletTranslation);

        // Check collisions.
        bulletBox.setFromObject(bullet);
        for (let t = 0; t < this.targets.length; t++) {
          let target = this.targets[t];
          if (!target.getAttribute('target').active) { continue; }
          const targetObj = target.object3D;
          if (!targetObj.visible) { continue; }
          isHit = false;
          if (targetObj.boundingBox) {
            isHit = targetObj.boundingBox.intersectsBox(bulletBox);
          } else {
            targetBox.setFromObject(targetObj);
            isHit = targetBox.intersectsBox(bulletBox);
          }
          if (isHit) {
            bullet.active = false;
            target.components.target.onBulletHit(bullet);
            target.emit('hit', null);
            break;
          }
        }
      }
    };
  })()
});

/**
 * Bullet template component
 */
AFRAME.registerComponent('bullet', {
  dependencies: ['material'],

  schema: {
    damagePoints: {default: 1.0, type: 'float'},
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
