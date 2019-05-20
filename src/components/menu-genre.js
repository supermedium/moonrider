AFRAME.registerComponent('menu-genre', {
  init: function () {
    this.el.addEventListener('click', evt => {
      this.el.sceneEl.emit('genreselect', evt.target.closest('.genre').dataset.bindForKey);
    });
  }
});
