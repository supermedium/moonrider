const COLORS = require('../constants/colors.js');

const iconPositions = {
  classicvr: -0.6,
  punchvr: 0.87,
  ride2d: 0.87,
  ridevr: 0.15,
  viewer2d: 0.15
};

const modeMap = {
  classicvr: 'classic',
  punchvr: 'punch',
  ride2d: 'ride',
  ridevr: 'ride',
  viewer2d: 'viewer'
};

AFRAME.registerComponent('menu-mode', {
  schema: {
    colorScheme: {default: 'default'},
    hasVR: {default: false}
  },

  init: function () {
    this.el.addEventListener('click', evt => {
      const item = evt.target.closest('[data-mode]');
      const mode = item.dataset.mode;
      const name = item.dataset.name;
      this.el.sceneEl.emit('gamemode', mode, false);
      if (this.data.hasVR) {
        localStorage.setItem('gameMode', name);
      }
      this.setModeOption(name);
    });
  },

  update: function () {
    if (this.data.hasVR) {
      this.setModeOption(localStorage.getItem('gameMode') || 'punchvr');
      this.el.sceneEl.emit('gamemode', modeMap[localStorage.getItem('gameMode') || 'punchvr']);
    } else {
      this.setModeOption('ride2d');
    }
  },

  setModeOption: function (name) {
    const modeEls = this.el.querySelectorAll('.modeItem');
    document.getElementById('modeIcon').object3D.position.y = iconPositions[name];

    for (let i = 0; i < modeEls.length; i++) {
      const modeEl = modeEls[i];
      const selected = modeEl.dataset.name === name;

      modeEl.emit(selected ? 'select' : 'deselect', null, false);

      const background = modeEl.querySelector('.modeBackground');
      background.emit(selected ? 'select': 'deselect', null, false);
      background.setAttribute(
        'mixin',
        'modeBackgroundSelect' + (selected ? '' : ' modeBackgroundHover'));

      const thumb = modeEl.querySelector('.modeThumb');
      thumb.emit(selected ? 'select': 'deselect', null, false);

      const title = modeEl.querySelector('.modeTitle');
      title.setAttribute(
        'text', 'color',
        selected ? COLORS.WHITE : COLORS.schemes[this.data.colorScheme].secondary);

      const instructions = modeEl.querySelector('.modeInstructions');
      instructions.setAttribute(
        'text', 'color',
        selected ? COLORS.WHITE : COLORS.schemes[this.data.colorScheme].primary);
    }
  }
});
