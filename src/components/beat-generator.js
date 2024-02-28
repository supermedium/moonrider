import utils from '../utils';

let skipDebug = AFRAME.utils.getUrlParameter('skip') || 0;
skipDebug = parseInt(skipDebug, 10);

const DEBUG_MINES = AFRAME.utils.getUrlParameter('debugmines');

// Beats arrive at sword stroke distance synced with the music.
export const BEAT_ANTICIPATION_TIME = 1.1;
export const BEAT_PRELOAD_TIME = 1.1;
export const PUNCH_OFFSET = 0.5;
export const SWORD_OFFSET = 1.5;

// How far out to load beats (ms).
const isMobile = AFRAME.utils.device.isMobile();
const BEAT_FORWARD_TIME = isMobile ? 2000 : 3500;
const WALL_FORWARD_TIME = isMobile ? 7500 : 10000;

/**
 * Load beat data (all the beats and such).
 */
AFRAME.registerComponent('beat-generator', {
  dependencies: ['stage-colors'],

  schema: {
    challengeId: { type: 'string' }, // If clicked play.
    gameMode: { type: 'string' }, // classic, punch, ride.
    difficulty: { type: 'string' },
    beatmapCharacteristic: { type: 'string' },
    has3DOFVR: { default: false },
    hasSongLoadError: { default: false },
    isPlaying: { default: false },
    isZipFetching: { default: false },
    menuSelectedChallengeId: { type: 'string' },
    songDuration: { type: 'number' }, // Seconds.
    speed: { type: 'number' }
  },

  orientationsHumanized: [
    'up',
    'down',
    'left',
    'right',
    'upleft',
    'upright',
    'downleft',
    'downright'
  ],

  horizontalPositions: [-0.75, -0.25, 0.25, 0.75],

  horizontalPositionsHumanized: {
    0: 'left',
    1: 'middleleft',
    2: 'middleright',
    3: 'right'
  },

  positionHumanized: {
    topLeft: { layer: 2, index: 0 },
    topCenterLeft: { layer: 2, index: 1 },
    topCenterRight: { layer: 2, index: 2 },
    topRight: { layer: 2, index: 3 },

    middleLeft: { layer: 1, index: 0 },
    middleCenterLeft: { layer: 1, index: 1 },
    middleCenterRight: { layer: 1, index: 2 },
    middleRight: { layer: 1, index: 3 },

    bottomLeft: { layer: 0, index: 0 },
    bottomCenterLeft: { layer: 0, index: 1 },
    bottomCenterRight: { layer: 0, index: 2 },
    bottomRight: { layer: 0, index: 3 }
  },

  verticalPositionsHumanized: {
    0: 'bottom',
    1: 'middle',
    2: 'top'
  },

  init: function () {
    this.audioAnalyserEl = document.getElementById('audioanalyser');
    this.beatContainer = document.getElementById('beatContainer');
    this.beats = null;
    this.beatData = null;
    this.beatDataProcessed = false;
    this.preloadTime = 0;
    this.songTime = undefined;
    this.bpm = undefined;
    this.curve = null;
    this.curveEl = document.getElementById('curve');
    this.curveFollowRigEl = document.getElementById('curveFollowRig');
    this.tube = document.getElementById('tube');
    this.index = { events: 0, notes: 0, obstacles: 0 };
    this.wallContainer = document.getElementById('wallContainer');

    this.leftStageLasers = document.getElementById('leftStageLasers');
    this.rightStageLasers = document.getElementById('rightStageLasers');
    this.stageColors = this.el.components['stage-colors'];

    this.el.addEventListener('cleargame', this.onClearGame.bind(this));
    this.el.addEventListener('gamemenurestart', this.onRestart.bind(this));

    this.el.addEventListener('ziploaderend', evt => {
      this.beats = evt.detail.beats;
      if (!this.data.challengeId || this.data.hasSongLoadError) { return; }
      this.beatData = this.beats[this.data.beatmapCharacteristic + '-' + this.data.difficulty];
      this.processBeats();
    });

  /*
    // For debugging: generate beats on key space press.
    document.addEventListener('keydown', ev => {
      if (ev.keyCode === 32) {
        this.generateBeat({
          _cutDirection: 1,
          _lineIndex: (Math.random()*3)|0,
          _lineLayer: 1,
          _time: Math.floor(this.el.components.song.getCurrentTime() * 1.4 + 3),
          _type: (Math.random() * 2) | 0
        })
      }
    })
  */
  },

  play: function () {
    this.playerHeight = document.querySelector('[player-height]').components['player-height'];
  },

  update: function (oldData) {
    const data = this.data;

    // Song selected and clicked play.
    if (oldData.challengeId !== data.challengeId && data.challengeId) {
      this.index.events = 0;
      this.index.notes = 0;
      this.index.obstacles = 0;

      // Process.
      if (!this.data.isZipFetching && this.beats && !this.data.hasSongLoadError) {
        this.beatData = this.beats[this.data.beatmapCharacteristic + '-' + this.data.difficulty];
        this.processBeats();
      }

      // Generate curve based on song duration.
      this.curveEl.components.supercurve.generateCurve(data.speed * data.songDuration);
      this.curve = this.curveEl.components.supercurve.curve;
    }
  },

  /**
   * Load the beat data into the game.
   */
  processBeats: function () {
    if (this.data.hasSongLoadError) { return; }
    // if there is version and first character is 3, convert to 2.xx
    if (this.beatData.version  && this.beatData.version.charAt(0) === '3') {
      this.beatData = convertBeatData_320_to_2xx(this.beatData);
    }
    // Reset variables used during playback.
    // Beats spawn ahead of the song and get to the user in sync with the music.
    this.songTime = 0;
    this.preloadTime = 0;
    this.beatData._events = this.beatData._events || [];
    this.beatData._obstacles = this.beatData._obstacles || [];
    this.beatData._notes = this.beatData._notes || [];
    this.beatData._events.sort(lessThan);
    this.beatData._obstacles.sort(lessThan);
    this.beatData._notes.sort(lessThan);
    this.bpm = this.beatData._beatsPerMinute;

    // Performance: Remove all obstacles if there are more than 256 (often used with Noodle Extensions)
    if (this.beatData._obstacles.length > 256) {
      this.beatData._obstacles = [];
    }

    // Some events have negative time stamp to initialize the stage.
    const events = this.beatData._events;
    if (events.length && events[0]._time < 0) {
      for (let i = 0; events[i]._time < 0; i++) {
        this.generateEvent(events[i]);
      }
    }

    this.beatDataProcessed = true;
    console.log('[beat-generator] Finished processing beat data.');
  },

  /**
   * Generate beats and stuff according to timestamp.
   */
  tick: function (time, delta) {
    if (!this.data.isPlaying || !this.data.challengeId || !this.beatData) { return; }

    let songTime;
    const song = this.el.components.song;
    if (this.preloadTime === undefined) {
      if (!song.isAudioPlaying) { return; }
      // Get current song time.
      songTime = song.getCurrentTime() * 1000 + skipDebug;
    } else {
      // Song is not playing and is preloading beats, use maintained beat time.
      songTime = this.preloadTime;
    }

    const bpm = this.beatData._beatsPerMinute;
    const msPerBeat = 1000 * 60 / this.beatData._beatsPerMinute;

    // Load in stuff scheduled between the last timestamp and current timestamp.
    // Beats.
    const notes = this.beatData._notes;
    for (let i = this.index.notes; i < notes.length; ++i) {
      if (songTime + BEAT_FORWARD_TIME > notes[i]._time * msPerBeat) {
        this.generateBeat(notes[i]);
        this.index.notes++;
      }
    }

    if (this.data.gameMode !== 'ride') {
      // Walls.
      const obstacles = this.beatData._obstacles;
      for (let i = this.index.obstacles; i < obstacles.length; ++i) {
        if (songTime + WALL_FORWARD_TIME >= obstacles[i]._time * msPerBeat) {
          this.generateWall(obstacles[i]);
          this.index.obstacles++;
        }
      }
    }

    // Stage events.
    const events = this.beatData._events;
    for (let i = this.index.events; i < events.length; ++i) {
      if (songTime >= events[i]._time * msPerBeat) {
        this.generateEvent(events[i]);
        this.index.events++;
      }
    }

    if (this.preloadTime === undefined) { return; }

    if (this.preloadTime >= BEAT_PRELOAD_TIME * 1000) {
      // Finished preload.
      this.el.sceneEl.emit('beatloaderpreloadfinish', null, false);
      this.preloadTime = undefined;
    } else {
      // Continue preload.
      this.preloadTime += delta;
    }
  },

  generateBeat: function (noteInfo, index) {
    const data = this.data;

    if (DEBUG_MINES) { noteInfo._type = 3; }

    let color;
    let type = noteInfo._cutDirection === 8 ? 'dot' : 'arrow';
    if (noteInfo._type === 0) {
      color = 'red';
    } else if (noteInfo._type === 1) {
      color = 'blue';
    } else {
      type = 'mine';
      color = undefined;
    }

    if (data.has3DOFVR &&
      data.gameMode !== 'viewer' &&
      data.gameMode !== 'ride' &&
      color === 'red') {
      return;
    }

    if (AFRAME.utils.getUrlParameter('dot') || data.gameMode === 'punch') { type = 'dot'; }

    const beatEl = this.requestBeat(type, color);
    if (!beatEl) { return; }

    // Entity was just created.
    if (!beatEl.components.beat && !beatEl.components.plume) {
      setTimeout(() => {
        this.setupBeat(beatEl, noteInfo);});
    } else {
      this.setupBeat(beatEl, noteInfo);
    }
  },

  setupBeat: function (beatEl, noteInfo) {
    const data = this.data;

    // Apply sword offset. Blocks arrive on beat in front of the user.
    const cutDirection = this.orientationsHumanized[noteInfo._cutDirection];
    const horizontalPosition = this.horizontalPositionsHumanized[noteInfo._lineIndex] || 'left';
    const verticalPosition = this.verticalPositionsHumanized[noteInfo._lineLayer] || 'middle';

    // Factor in sword offset and beat anticipation time (percentage).
    const weaponOffset = this.data.gameMode === 'classic' ? SWORD_OFFSET : PUNCH_OFFSET;
    const positionOffset =
    ((weaponOffset / data.speed) + BEAT_ANTICIPATION_TIME) /
    data.songDuration;

    // Song position is from 0 to 1 along the curve (percentage).
    const durationMs = data.songDuration * 1000;
    const msPerBeat = 1000 * 60 / this.beatData._beatsPerMinute;
    const songPosition = ((noteInfo._time * msPerBeat) / durationMs) + positionOffset;

    // Set render order (back to front so decreasing render order as index increases).
    const renderOrder = this.el.systems['render-order'].order.beats + 1 - songPosition;

    if (data.gameMode === 'ride') {
      beatEl.components.plume.onGenerate(songPosition, horizontalPosition, verticalPosition,
        this.playerHeight.beatOffset);
      beatEl.setAttribute('render-order', renderOrder);
    } else {
      beatEl.components.beat.onGenerate(songPosition, horizontalPosition, verticalPosition,
        cutDirection, this.playerHeight.beatOffset);
      beatEl.components.beat.blockEl.object3D.renderOrder = renderOrder;
    }
    beatEl.play();
  },

  generateWall: function (wallInfo) {
    const data = this.data;
    const wallEl = this.el.sceneEl.components.pool__wall.requestEntity();

    if (!wallEl) { return; }

    // Entity was just created.
    if (!wallEl.components.wall) {
      setTimeout(() => {
        this.setupWall(wallEl, wallInfo);});
    } else {
      this.setupWall(wallEl, wallInfo);
    }
  },

  setupWall: function (wallEl, wallInfo) {
    const data = this.data;

    if (data.has3DOFVR && data.gameMode !== 'viewer') { return; }

    const durationSeconds = 60 * (wallInfo._duration / this.bpm);
    const horizontalPosition = this.horizontalPositionsHumanized[wallInfo._lineIndex] || 'none';
    const isCeiling = wallInfo._type === 1;
    const length = durationSeconds * data.speed;
    const width = wallInfo._width / 2; // We want half the reported width.

    // Factor in beat anticipation time (percentage).
    const positionOffset = (BEAT_ANTICIPATION_TIME) / data.songDuration;

    // Song position is from 0 to 1 along the curve (percentage).
    const durationMs = data.songDuration * 1000;
    const msPerBeat = 1000 * 60 / this.beatData._beatsPerMinute;
    const songPosition = (wallInfo._time * msPerBeat) / durationMs + positionOffset;

    const lengthPercent = length / this.curveEl.components.supercurve.length;
    wallEl.components.wall.onGenerate(songPosition, horizontalPosition, width, length,
      isCeiling, songPosition + lengthPercent);
    wallEl.play();

    // Set render order (back to front so decreasing render order as index increases).
    // For walls, set as the back end of the wall.
    wallEl.object3D.renderOrder = this.el.systems['render-order'].order.beats + 1 -
      (songPosition + lengthPercent);
  },

  generateEvent: function (event) {
    switch (event._type) {
      case 0:
        this.stageColors.setColor('bg', event._value);
        this.stageColors.setColorInstant('moon', event._value);
        break;
      case 1:
        this.stageColors.setColorInstant('stars', event._value);
        break;
      case 2:
        this.stageColors.setColor('curveeven', event._value);
        break;
      case 3:
        this.stageColors.setColor('curveodd', event._value);
        break;
      case 4:
        this.stageColors.setColor('floor', event._value);
        break;
      case 8:
        this.tube.emit('pulse', null, false);
        break;
      case 9:
        this.tube.emit('pulse', null, false);
        break;
      case 12:
        this.stageColors.setColor('leftglow', event._value);
        break;
      case 13:
        this.stageColors.setColor('rightglow', event._value);
        break;
    }
  },

  requestBeat: function (type, color) {
    let beatPoolName = 'pool__beat-' + type;
    if (this.data.gameMode === 'ride') {
      beatPoolName = 'pool__plume-' + type;
    }
    if (type !== 'mine' && color) { beatPoolName += '-' + color; }
    const pool = this.el.sceneEl.components[beatPoolName];
    if (!pool) {
      console.warn('Pool ' + beatPoolName + ' unavailable');
      return;
    }
    return pool.requestEntity();
  },

  /**
   * Restart by returning all beats to pool.
   */
  onClearGame: function () {
    this.preloadTime = 0;
    this.index.events = 0;
    this.index.notes = 0;
    this.index.obstacles = 0;

    for (let i = 0; i < this.beatContainer.children.length; i++) {
      const child = this.beatContainer.children[i];
      child.object3D.position.set(0, 0, -9999);
      if (child.components.beat) { child.components.beat.returnToPool(); }
    }

    for (let i = 0; i < this.wallContainer.children.length; i++) {
      const child = this.wallContainer.children[i];
      child.object3D.position.set(0, -9999, 0);
      if (child.components.wall) { child.components.wall.returnToPool(); }
    }
  },

  /**
   * Regenerate.
   */
  onRestart: function () {
    const data = this.data;
    this.curveEl.components.supercurve.generateCurve(data.speed * data.songDuration);
    this.curve = this.curveEl.components.supercurve.curve;
  }
});

function lessThan(a, b) { return a._time - b._time; }

function convertBeatData_320_to_2xx(beatData) {
  const newBeatData = {
    _version: '3.2.2',
    _beatsPerMinute: beatData._beatsPerMinute,
    _events: [],
    _notes: [],
    _obstacles: []
  };
  // ignore bmpEvents
  // ingore rotationEvents
  // convert notes
  newBeatData._notes = beatData.colorNotes.map(note => {
    return {
      _time: note.b,
      _lineIndex: note.x,
      _lineLayer: note.y,
      _type: note.c, // 0 = red, 1 = blue 
      _cutDirection: note.d
    };
  });
  // convert bombs ( add to notes )
  for (const bomb of beatData.bombNotes) {
    newBeatData._notes.push({
      _time: bomb.b,
      _lineIndex: bomb.x,
      _lineLayer: bomb.y,
      _type: 3, // 3 = bomb 
    });
  }
  // sort notes by time ascending
  newBeatData._notes.sort((a, b) => a._time - b._time);
  // convert obstacles
  newBeatData._obstacles = beatData.obstacles.map(obstacle => {
    return {
      _time: obstacle.b,
      _lineIndex: obstacle.x,
      _lineLayer: obstacle.y,
      _type: obstacle._type,
      _duration: obstacle.d,
      _width: obstacle.w,
      _height: obstacle.h
    };
  });

  return newBeatData;
}