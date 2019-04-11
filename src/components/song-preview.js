var utils = require('../utils');

const PREVIEW_VOLUME = 0.5;

/**
 * Song preview when search result selected with smart logic for preloading.
 */
AFRAME.registerComponent('song-preview-system', {
  schema: {
    challengeId: {default: ''},
    debug: {default: false},
    isSearching: {default: false},
    isLoading: {default: false},  // Continue to play preview song during loading.
    selectedChallengeId: {type: 'string'}
  },

  init: function () {
    this.analyserEl = document.getElementById('audioAnalyser');
    this.audio = document.createElement('audio');  // Dummy.
    this.audioStore = {};
    this.preloadedAudioIds = [];
    this.preloadQueue = [];
  },

  update: function (oldData) {
    const data = this.data;

    // Play clicked.
    // But don't start playing it if it wasn't playing already.
    if (!oldData.challengeId && data.challengeId) {
      if (this.analyserEl.components.audioanalyser.volume === 0 ||
          this.audio.currentTime < 1) {
        this.stopSong();
      } else {
        // this.fadeDown();
      }
      return;
    }

    // Unselect.
    if (oldData.selectedChallengeId && !data.selectedChallengeId && !data.isSearching) {
      this.stopSong();
    }

    // Song finished loading.
    // Continue to play preview song during loading to keep entertained.
    if (oldData.isLoading && !data.isLoading) {
      this.stopSong();
      return;
    }

    // Selected challenge ID updated.
    if (data.selectedChallengeId && oldData.selectedChallengeId !== data.selectedChallengeId) {
      if (this.audio) { this.stopSong(); }

      // If not yet preloaded, pause the preload queue until this song is loaded.
      if (!this.preloadedAudioIds.includes(data.selectedChallengeId) &&
          data.selectedChallengeId !== this.currentLoadingId) {
        this.prioritizePreloadSong();
      }

      this.playSong(data.selectedChallengeId);
    }
  },

  log: function (str) {
    if (!this.data.debug) { return; }
    console.log(str);
  },

  /**
   * Song was selected so pause preload queue, prioritize its loading, and try to play ASAP.
   */
  prioritizePreloadSong: function () {
    const data = this.data;
    const preloadQueue = this.preloadQueue;

    this.log(`[song-preview] Prioritizing loading of ${data.selectedChallengeId}`);
    this.priorityLoadingChallengeId = data.selectedChallengeId;

    this.audioStore[data.selectedChallengeId].addEventListener('loadeddata', () => {
      this.log(`[song-preview] Finished load of priority ${data.selectedChallengeId}`);
      this.preloadedAudioIds.push(data.selectedChallengeId);
      this.priorityLoadingChallengeId = '';
      // Resume preloading queue.
      if (preloadQueue.length) {
        this.log(`[song-preview] Resuming queue with ${preloadQueue[0].challengeId}`);
        this.preloadMetadata(preloadQueue[0]);
      }
    });

    // Preload.
    this.audioStore[data.selectedChallengeId].src =
      utils.getS3FileUrl(data.selectedChallengeId, 'song.ogg');

    // Remove from preload queue.
    for (let i = 0; i < preloadQueue.length; i++) {
      if (preloadQueue[i].challengeId === data.selectedChallengeId) {
        preloadQueue.splice(i, 1);
        break;
      }
    }
  },

  /**
   * Create an audio element and queue to preload. If the queue is empty, preload it
   * immediately.
   */
  queuePreloadSong: function (challengeId, previewStartTime) {
    if (this.audioStore[challengeId]) { return; }

    const audio = document.createElement('audio');
    audio.crossOrigin = 'anonymous';
    audio.dataset.previewStartTime = previewStartTime;
    this.audioStore[challengeId] = audio;

    let src = utils.getS3FileUrl(challengeId, 'song.ogg');
    if (this.currentLoadingId) {
      // Audio currently loading, add to queue.
      this.preloadQueue.push({
        audio: audio,
        challengeId: challengeId,
        src: src
      });
    } else {
      // Empty queue, preload now.
      this.preloadMetadata({
        audio: audio,
        challengeId: challengeId,
        src: src
      });
    }
  },

  /**
   * Preload metadata of audio file for quick play.
   * Set `src` and `preload`.
   * A preload queue is set up so we only preload one at a time to not bog down
   * the network. If a song is selected to preview, we can bump it to the front of the
   * queue.
   */
  preloadMetadata: function (preloadItem) {
    const audio = preloadItem.audio;
    this.log(`[song-preview] Preloading song preview ${preloadItem.challengeId}`);

    audio.addEventListener('loadedmetadata', () => {
      // Song preloaded.
      this.log(`[song-preview] Finished preloading song preview ${preloadItem.challengeId}`);
      this.preloadedAudioIds.push(preloadItem.challengeId);
      this.currentLoadingId = '';

      // Move on to next song in queue if any.
      this.log(`[song-preview] ${this.preloadQueue.length} in queue`);
      if (this.preloadQueue.length && !this.priorityLoadingChallengeId) {
        this.preloadMetadata(this.preloadQueue.shift());
      }
    });

    audio.preload = 'metadata';
    audio.src = preloadItem.src;
    this.currentLoadingId = preloadItem.challengeId;
  },

  stopSong: function () {
    if (!this.audio) { return; }
    if (!this.audio.paused) { this.audio.pause(); }
  },

  playSong: function (challengeId) {
    if (!challengeId) { return; }

    this.audio = this.audioStore[challengeId];
    this.audio.load();
    this.audio.volume = PREVIEW_VOLUME;
    this.audio.currentTime = this.audio.dataset.previewStartTime;
    this.analyserEl.setAttribute('audioanalyser', 'src', this.audio);

    const audioanalyser = this.analyserEl.components.audioanalyser;
    audioanalyser.resumeContext();

    this.audio.play();
    // this.fadeIn();

    // Prefetch buffer for playing.
    if (audioanalyser.xhr) { audioanalyser.xhr.abort(); }
    audioanalyser.fetchAudioBuffer(utils.getS3FileUrl(challengeId, 'song.ogg'));
  },

  /**
   * Stop song from preloading.
   */
  clearSong: function (challengeId) {
    let audio = this.audioStore[challengeId];
    audio.preload = 'none';

    // Remove from queue if in there.
    let index;
    for (let i = 0; i < this.preloadQueue.length; i++) {
      if (this.preloadQueue[i].id === challengeId) {
        index = i;
        break;
      }
    }
    if (!index) { return; }
    this.preloadQueue.splice(index, 1);
  }
});

/**
 * Data component attached to search result for song preview system.
 */
AFRAME.registerComponent('song-preview', {
  schema: {
    challengeId: {type: 'string'},
    previewStartTime: {type: 'number'}
  },

  update: function (oldData) {
    if (oldData.challengeId && this.data.challengeId !== oldData.challengeId) {
      this.el.sceneEl.components['song-preview-system'].clearSong(oldData.challengeId);
    }

    this.el.sceneEl.components['song-preview-system'].queuePreloadSong(
      this.data.challengeId, this.data.previewStartTime
    );
  }
});
