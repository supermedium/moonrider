const MIN_TIME = 3000;
const MAX_TIME = 10000;
const SPAWN_DISTANCE = 20; // in seconds

/**
 * Tunnel management.
 */
AFRAME.registerComponent('tunnels', {
  dependencies: ['pool_tunnels'],

  schema: {
    isPlaying: {default: false},
    songDuration: {default: 0}
  },

  init: function () {
    this.addTunnel = this.addTunnel.bind(this);
    this.clearTunnels = this.clearTunnels.bind(this);
    this.curveEl = document.getElementById('curve');
    this.curveFollowRig = document.getElementById('curveFollowRig');
    this.timeout = 0;
    this.tunnels = [];

    this.tick = AFRAME.utils.throttleTick(this.tick.bind(this), 1000);

    this.el.addEventListener('cleargame', this.clearTunnels);
    this.el.addEventListener('gamemenuexit', this.clearTunnels);
    this.el.addEventListener('gamemenurestart', this.clearTunnels);
  },

  update: function (oldData) {
    if (!oldData.isPlaying && this.data.isPlaying) {
      this.requestTunnel();
    }
    if (oldData.isPlaying && !this.data.isPlaying && this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  },

  play: function () {
    this.pool = this.el.components.pool__tunnels;
  },

  requestTunnel: function () {
    this.timeout = setTimeout(
      this.addTunnel,
      Math.floor(MIN_TIME + Math.random() * MAX_TIME));
  },

  addTunnel: function () {
    const tunnel = this.pool.requestEntity();
    if (!tunnel) { return; }
    tunnel.setAttribute('render-order', 'tunnel');
    tunnel.object3D.visible = true;

    const supercurve = this.curveEl.components.supercurve;
    let songPosition = (this.el.components.song.getCurrentTime() + SPAWN_DISTANCE) /
    this.data.songDuration;
    if (songPosition > 1) { songPosition = 1;}
    supercurve.getPointAt(songPosition, tunnel.object3D.position);
    supercurve.alignToCurve(songPosition, tunnel.object3D);

    tunnel.play();
    this.tunnels.push(tunnel);
    this.requestTunnel();
  },

  clearTunnels: function () {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    for (let i = 0; i < this.tunnels.length; i++) {
      this.tunnels[i].object3D.visible = false;
      this.pool.returnEntity(this.tunnels[i]);
    }
    this.tunnels.length = 0;
  },

  tick: function (time, delta) {
    if (this.tunnels.length == 0) { return; }

    // Remove tunnels that went behind the player.
    for (let i = 0; i < this.tunnels.length; i++) {
      if (this.tunnels[i].object3D.position.z >
        this.curveFollowRig.object3D.position.z + 5) {
        const tunnel = this.tunnels.splice(i, 1)[0];
        tunnel.object3D.visible = false;
        this.pool.returnEntity(tunnel);
      } else {
        // They're z-ordered, the rest of tunnels are in front of the player.
        return;
      }
    }
  }
});
