/**
 * User height based on median value during menu clicks.
 */
AFRAME.registerComponent('player-height', {
  init: function () {
    this.beatOffset = 0;
    this.heights = [];
    this.height = 0;
    this.el.sceneEl.addEventListener('menuchallengeselect', this.updateHeight.bind(this));
    this.el.sceneEl.addEventListener('playbuttonclick', this.updateHeight.bind(this));
  },

  pause: function () {
    this.heights.length = 0;
  },

  updateHeight: function () {
    const heights = this.heights;
    if (heights.length > 3) { heights.shift(); }
    heights.push(this.el.object3D.position.y);
    this.height = median(heights);

    // Adjust beat container height.
    const height = clamp(this.height, 1.6, 2.2);
    this.beatOffset = remap(height, 1.6, 2.2, 0, 0.2);
  }
});


function median (arr) {
  arr.sort(sort);
  const mid = arr.length / 2;
  return mid % 1 ? arr[mid - 0.5] : (arr[mid - 1] + arr[mid]) / 2;
}

function sort (a, b) {
  return a - b;
}

function remap (value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function clamp (val, min, max) {
  return Math.min(Math.max(val, min), max);
};
