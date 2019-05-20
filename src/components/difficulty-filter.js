AFRAME.registerComponent('difficulty-filter', {
  events: {
    click: function (evt) {
      this.el.sceneEl.emit('difficultyfilter', evt.target.parentNode.dataset.difficultyFilter);
    }
  }
});
