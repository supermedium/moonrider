AFRAME.registerComponent('menu-playlist', {
  init: function () {
    this.eventDetail = {id: '', title: ''};

    this.el.addEventListener('click', evt => {
      const item = evt.target.closest('.playlist');
      this.eventDetail.id = item.dataset.playlist;
      this.eventDetail.title = item.dataset.title;
      this.el.sceneEl.emit('playlistselect', this.eventDetail);
    });
  }
});
