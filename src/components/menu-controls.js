var hoveredIndex;
var keyEventsRegistered = false;
var results = null;

const PER_PAGE = 6;

/**
 * Use menu with thumb.
 */
AFRAME.registerComponent('menu-controls', {
  schema: {
    enabled: {default: true},
    page: {default: 0},
    selectedChallengeId: {default: ''}
  },

  init: function () {
    const el = this.el;

    results = document.getElementById('searchResultList').children;

    this.goPrevResult = this.goPrevResult.bind(this);
    this.goNextResult = this.goNextResult.bind(this);
    this.select = this.select.bind(this);
    this.unselect = this.unselect.bind(this);

    el.addEventListener('thumbupstart', this.goPrevResult);
    el.addEventListener('thumbdownstart', this.goNextResult);
    el.addEventListener('thumbleftstart', this.unselect);
    el.addEventListener('thumbrightstart', this.select);

    // When raycaster becomes active again, cancel.
    el.addEventListener('mouseenter', evt => {
      if (!el.components.cursor.intersectedEl) { return; }
      if (el.components.cursor.intersectedEl.closest('#searchResultList')) {
        this.cancelMenuControls();
      }
    });

    if (AFRAME.utils.getUrlParameter('debug') && !keyEventsRegistered) {
      window.addEventListener('keydown', evt => {
        if (evt.keyCode === 37) { this.unselect(); }
        if (evt.keyCode === 38) { this.goPrevResult(); }
        if (evt.keyCode === 39) { this.select(); }
        if (evt.keyCode === 40) { this.goNextResult(); }
      });
      keyEventsRegistered = true;
    }
  },

  goPrevResult: function () {
    if (!this.data.enabled) { return; }

    if (hoveredIndex === undefined) {
      this.hoverResult(0);
      return;
    }
    if (hoveredIndex > 0) {
      if (results[hoveredIndex - 1].dataset.id === this.data.selectedChallengeId) {
        if (hoveredIndex - 2 < 0) {
          this.goPrevPage();
        } else {
          this.hoverResult(hoveredIndex - 2);
        }
      } else {
        this.hoverResult(hoveredIndex - 1);
      }
    } else {
      this.goPrevPage();
    }
  },

  goPrevPage: function () {
    this.hoverResult(PER_PAGE - 1);
    this.el.sceneEl.emit('searchprevpage', null, false);
  },

  goNextResult: function () {
    if (!this.data.enabled) { return; }

    if (hoveredIndex === undefined) {
      this.hoverResult(0);
      return;
    }
    if (hoveredIndex < PER_PAGE - 1) {
      if (results[hoveredIndex + 1].dataset.id === this.data.selectedChallengeId) {
        if (hoveredIndex + 2 > PER_PAGE - 1) {
          this.goNextPage();
        } else {
          this.hoverResult(hoveredIndex + 2);
        }
      } else {
        this.hoverResult(hoveredIndex + 1);
      }
    } else {
      this.goNextPage();
    }
  },

  goNextPage: function () {
    this.hoverResult(0);
    this.el.sceneEl.emit('searchnextpage', null, false);
  },

  select: function () {
    if (!this.data.enabled) { return; }
    if (hoveredIndex === undefined) { return; }
    this.el.sceneEl.emit('menuchallengeselect', results[hoveredIndex].dataset.id, false);
  },

  unselect: function () {
    if (!this.data.enabled) { return; }
    if (this.data.selectedChallengeId) {
      this.el.sceneEl.emit('menuchallengeunselect', null, false);
    }
  },

  hoverResult: function (i) {
    if (hoveredIndex !== undefined) {
      results[hoveredIndex].querySelector('.searchResultBackground')
                           .emit('mouseleave', null, false);
    }
    hoveredIndex = i;
    results[i].querySelector('.searchResultBackground')
              .emit('mouseenter', null, false);
  },

  cancelMenuControls: function () {
    if (hoveredIndex === undefined) { return; }
    results[hoveredIndex].querySelector('.searchResultBackground')
                         .emit('mouseleave', null, false);
    hoveredIndex = undefined;
  }
});
