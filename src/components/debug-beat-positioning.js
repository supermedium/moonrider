const horizontalPositions = ['left', 'middleleft', 'middleright', 'right'];
const verticalPositions = ['bottom', 'middle', 'top'];

/**
 * Display all beat positions at once.
 */
AFRAME.registerComponent('debug-beat-positioning', {
  play: function () {
    let mode = AFRAME.utils.getUrlParameter('debugbeatpositioning');
    if (!mode) { return; }
    if (mode !== 'punch' && mode !== 'classic') { mode = 'classic'; }

    this.el.emit('debugbeatpositioning');

    setTimeout(() => {
      const generator = this.el.sceneEl.components['beat-generator'];
      generator.data.gameMode = mode;
      scene.components['beat-system'].data.gameMode = mode;
      scene.components['beat-system'].updateBeatPositioning();

      horizontalPositions.forEach(hPos => {
        verticalPositions.forEach(vPos => {
          let beatEl = generator.requestBeat(mode === 'punch' ? 'dot' : 'arrow', 'red');
          let dir = Math.random() < 0.5 ? 'left' : 'right';
          beatEl.components.beat.onGenerate(0.001, hPos, vPos, dir);
          beatEl.object3D.renderOrder = 9999;
          beatEl.play();

          beatEl = generator.requestBeat('dot', 'blue');
          dir = Math.random() < 0.5 ? 'down' : 'up';
          beatEl.components.beat.onGenerate(0.0015, hPos, vPos, dir);
          beatEl.object3D.renderOrder = 9999;
          beatEl.play();
        });
      });

      const wallEl = scene.components.pool__wall.requestEntity();
      wallEl.components.wall.onGenerate(0.0015, 'left', 4, 4, true);
      wallEl.play();

      document.getElementById('beatContainer').removeAttribute('bind__visible');
      document.getElementById('beatContainer').object3D.visible = true;
    }, 500);
  }
});
