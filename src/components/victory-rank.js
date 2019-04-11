/**
 * Rank color.
 */
AFRAME.registerComponent('victory-rank', {
  schema: {
    rank: {type: 'string'}
  },

  update: function () {
    const rank = this.data.rank;
    if (!rank) { return; }

    const normalObj = {sphericalEnvMap: '', roughness: 0.8, metalness: 0.4};
    const shineObj = {sphericalEnvMap: '#envmapImg', roughness: 0.2, metalness: 0.6};

    this.el.setAttribute('text-geometry', 'value', rank);
    switch (rank[0]) {
      case 'S': {
        this.el.setAttribute('material', Object.assign({color: '#F0e077'}, shineObj));
        break;
      }
      case 'A': {
        this.el.setAttribute('material', Object.assign({color: '#6FF9EA'}, shineObj));
        break;
      }
      case 'B': {
        this.el.setAttribute('material', Object.assign({color: '#F8d'}, shineObj));
        break;
      }
      case 'C': {
        this.el.setAttribute('material', Object.assign({color: '#F971C3'}, normalObj));
        break;
      }
      case 'D': {
        this.el.setAttribute('material', Object.assign({color: '#1E6269'}, normalObj));
        break;
      }
      case 'E': {
        this.el.setAttribute('material', Object.assign({color: '#e3170a'}, normalObj));
        break;
      }
    }
  }
});
