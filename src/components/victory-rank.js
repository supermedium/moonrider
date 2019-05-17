const normalObj = {sphericalEnvMap: '', roughness: 0.8, metalness: 0.4};
const shineObj = {sphericalEnvMap: '#envmapImg', roughness: 0.2, metalness: 0.6};

/**
 * Rank color.
 */
AFRAME.registerComponent('victory-rank', {
  schema: {
    isVictory: {default: false},
    rank: {type: 'string'}
  },

  update: function (oldData) {
    const el = this.el;
    const rank = this.data.rank;

    if (oldData.isVictory && !this.data.isVictory) {
      this.el.object3D.scale.set(0.001, 0.001, 0.001);
    }

    if (!rank) { return; }

    el.setAttribute('text-geometry', 'value', rank);
    switch (rank[0]) {
      case 'S': {
        el.setAttribute('material', Object.assign({color: '#F0e077'}, shineObj));
        break;
      }
      case 'A': {
        el.setAttribute('material', Object.assign({color: '#6FF9EA'}, shineObj));
        break;
      }
      case 'B': {
        el.setAttribute('material', Object.assign({color: '#F8d'}, shineObj));
        break;
      }
      case 'C': {
        el.setAttribute('material', Object.assign({color: '#F971C3'}, normalObj));
        break;
      }
      case 'D': {
        el.setAttribute('material', Object.assign({color: '#1E6269'}, normalObj));
        break;
      }
      case 'F': {
        el.setAttribute('material', Object.assign({color: '#e3170a'}, normalObj));
        break;
      }
    }
  }
});
