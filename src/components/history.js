/**
 * Update window title and history.
 */
AFRAME.registerComponent('history', {
  schema: {
    challengeId: {type: 'string'},
    songName: {type: 'string'},
    songSubName: {type: 'string'}
  },

  update: function () {
    const data = this.data;
    history.pushState(
      '',
      data.songName,
      updateQueryParam(window.location.href, 'challenge', data.challengeId)
    );
    document.title = `Super Saber - ${data.songName}`;
  }
});
