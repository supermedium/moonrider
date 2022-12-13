var utils = require('../utils');

const PREVIEW_VOLUME = 0.5;

/**
 * Song previews.
 */
AFRAME.registerComponent('song-preview-system', {
  schema: {
    previewStartTime: { type: 'int' },
    selectedChallengeId: { type: 'string' },
    hash: { type: 'string' }
  },

  init: function () {
    this.audio = document.createElement('audio');
    this.audio.volume = PREVIEW_VOLUME;

    function deepGet(obj, properties) {
      if (obj === undefined || obj === null) {
        return;
      }
      if (properties.length === 0) {
        return obj;
      }
      var foundSoFar = obj[properties[0]];
      var remainingProperties = properties.slice(1);
      return deepGet(foundSoFar, remainingProperties);
    }

    this.el.addEventListener('ziploaderend', evt => {
      const audioSrc = evt.detail.audio;
      this.audio.pause();

      const data = this.data;

      if (data.selectedChallengeId /* && oldData.selectedChallengeId !== data.selectedChallengeId */) {

        this.audio.setAttribute('src', audioSrc);
        this.audio.currentTime = deepGet(evt.detail, ['info', '_previewStartTime']) || data.previewStartTime || 12;
        this.audio.play();
      }
    });
  },

  update: function (oldData) {
    const data = this.data;
    if (!data.selectedChallengeId || oldData.selectedChallengeId !== data.selectedChallengeId) {
      this.audio.pause();
    }
  },
});
