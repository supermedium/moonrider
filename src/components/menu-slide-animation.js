AFRAME.registerComponent('menu-slide-animation', {
  schema: {
    isSearching: {default: false},
    menuSelectedChallengeId: {type: 'string'}
  },

  init: function () {
    this.isLeft = false; // Means toleft.
  },

  update: function (oldData) {
    const data = this.data;

    if (this.isLeft) {
      // Unselect.
      if (oldData.menuSelectedChallengeId && !data.menuSelectedChallengeId &&
        !data.isSearching) { this.rightMenu(); }
      // Keyboard close.
      if (oldData.isSearching && !data.isSearching && !data.menuSelectedChallengeId) {
        this.rightMenu();
      }
      return;
    }

    if (!this.isLeft) {
      // Select.
      if (!oldData.menuSelectedChallengeId && data.menuSelectedChallengeId) { this.leftMenu(); }
      // Keyboard open.
      if (!oldData.isSearching && data.isSearching) { this.leftMenu(); }
    }
  },

  rightMenu: function () {
    if (!this.isLeft) { return; }
    this.el.components.animation__menuright.beginAnimation();
    this.isLeft = false;
  },

  leftMenu: function () {
    if (this.isLeft) { return; }
    this.el.components.animation__menuleft.beginAnimation();
    this.isLeft = true;
  }
});
