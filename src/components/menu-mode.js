const COLORS = require('../constants/colors.js');

const iconPositions = {
  classicvr: 0.87,
  punchvr: 0.15,
  ride2d: 0.87,
  ridevr: -0.6,
  viewer2d: 0.15
};

AFRAME.registerComponent('menu-mode', {
  init: function () {
    this.el.addEventListener('click', evt => {
      const item = evt.target.closest('[data-mode]');
      const mode = item.dataset.mode;
      const name = item.dataset.name;
      this.el.sceneEl.emit('gamemode', mode);
      this.setModeOption(name);
    });
  },

  play: function () {
    if (AFRAME.utils.device.checkHeadsetConnected()) {
      this.setModeOption('classicvr');
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
      title.setAttribute('text', 'color', selected ? COLORS.WHITE : COLORS.DARKBLUE);

      const instructions = modeEl.querySelector('.modeInstructions');
      instructions.setAttribute('text', 'color', selected ? COLORS.WHITE : COLORS.DARKRED);
    }
  }
});
