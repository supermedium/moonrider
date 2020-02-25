var utils = require('../utils');

const PREVIEW_VOLUME = 0.5;

/**
 * Song previews.
 */
AFRAME.registerComponent('song-preview-system', {
  schema: {
    previewStartTime: {type: 'int'},
    selectedChallengeId: {type: 'string'}
  },

  init: function () {
    this.audio = document.createElement('audio');
    this.audio.volume = PREVIEW_VOLUME;
  },

  update: function (oldData) {
    const data = this.data;

    this.audio.pause();

    if (data.selectedChallengeId && oldData.selectedChallengeId !== data.selectedChallengeId) {
      this.audio.setAttribute('src', utils.getS3FileUrl(data.selectedChallengeId, 'song.ogg'));
      this.audio.currentTime = data.previewStartTime;
      this.audio.play();
    }
  },
});
