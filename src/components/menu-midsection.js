AFRAME.registerComponent('menu-midsection', {
  schema: {
    active: {default: false},
    selectedChallenge: {default: ''}
  },

  update: function (oldData) {
    if (oldData.active && !this.data.active) {
      this.el.emit('hidedifficultysection', null, false);
    }

    if ((!oldData.active && this.data.active) ||
      (this.data.selectedChallenge &&
      oldData.selectedChallenge !== this.data.selectedChallenge)) {
      this.el.emit('showdifficultysection', null, false);
    }
  }
});
