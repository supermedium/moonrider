var utils = require('../utils');

const PREVIEW_VOLUME = 0.5;

/**
 * Song previews.
 */
AFRAME.registerComponent('song-preview-system', {
  schema: {
    selectedChallengeId: { type: 'string' },
    selectedChallengeVersion: { type: 'string' }
  },

  init: function () {
    this.audio = document.createElement('audio');
    this.audio.volume = PREVIEW_VOLUME;
  },

  update: function (oldData) {
    const data = this.data;
    console.log('update-song', oldData, data);

    if (data.selectedChallengeId && oldData.selectedChallengeId !== data.selectedChallengeId) {
      this.audio.pause();
      this.audio.setAttribute('src', 'https://cdn.beatsaver.com/' + data.selectedChallengeVersion + '.mp3');
      this.audio.currentTime = 0;
      this.audio.play();
    } else if (!data.selectedChallengeId) {
      this.audio.pause();
    }
  }
});
