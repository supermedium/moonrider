AFRAME.registerComponent('difficulty-filter', {
  events: {
    click: function (evt) {
      this.el.emit('difficultyfilter', evt.target.parentNode.dataset.difficultyFilter);
    }
  }
});
