var hoveredIndex;
var keyEventsRegistered = false;
var results = null;

const PER_PAGE = 6;

/**
 * Use menu with thumb.
 */
AFRAME.registerComponent('menu-controls', {
  schema: {
    enabled: {default: true}
  },

  events: {
    thumbdownstart: function () {
      if (!this.data.enabled) { return; }
      this.el.sceneEl.emit('searchnextpage', null, false);
    },

    thumbleftstart: function () {
      if (!this.data.enabled) { return; }
      this.el.sceneEl.emit('menuchallengeunselect', null, false);
    },

    thumbupstart: function () {
      if (!this.data.enabled) { return; }
      this.el.sceneEl.emit('searchprevpage', null, false);
    }
  }
});
