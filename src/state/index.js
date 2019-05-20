/* global localStorage */
var utils = require('../utils');

const challengeDataStore = {};
const NUM_LEADERBOARD_DISPLAY = 10;
const SEARCH_PER_PAGE = 6;
const SONG_NAME_TRUNCATE = 22;
const SONG_SUB_NAME_RESULT_TRUNCATE = 32;
const SONG_SUB_NAME_DETAIL_TRUNCATE = 45;

const DAMAGE_DECAY = 0.25;
const DAMAGE_MAX = 10;

const DEBUG_CHALLENGE = {
  author: 'Juancho Pancho',
  difficulty: 'Expert',
  id: '31',
  image: 'assets/img/molerat.jpg',
  songDuration: 100,
  songName: 'Friday',
  songLength: 100,
  songSubName: 'Rebecca Black'
};

const SKIP_INTRO = AFRAME.utils.getUrlParameter('skipintro') === 'true';

/**
 * State handler.
 *
 * 1. `handlers` is an object of events that when emitted to the scene will run the handler.
 *
 * 2. The handler function modifies the state.
 *
 * 3. Entities and components that are `bind`ed automatically update:
 *    `bind__<componentName>="<propertyName>: some.item.in.state"`
 */
AFRAME.registerState({
  nonBindedStateKeys: ['genres'],

  initialState: {
    activeHand: localStorage.getItem('hand') || 'right',
    challenge: {  // Actively playing challenge.
      audio: '',  // URL.
      author: '',
      difficulty: '',
      id: AFRAME.utils.getUrlParameter('challenge'),  // Will be empty string if not playing.
      image: '',
      isBeatsPreloaded: false,  // Whether we have passed the negative time.
      numBeats: undefined,
      songDuration: 0,
      songName: '',
      songNameShort: '',
      songSubName: ''
    },
    controllerType: '',
    damage: 0,
    difficultyFilter: 'All',
    difficultyFilterMenuOpen: false,
    gameMode: 'ride',
    genre: '',
    genres: require('../constants/genres'),
    genreMenuOpen: false,
    has6DOFVR: false,
    hasVR: AFRAME.utils.device.checkHeadsetConnected(),
    introActive: !SKIP_INTRO,  // Just started game, main menu not opened yet.
    inVR: false,
    isGameOver: false,  // Game over screen.
    isLoading: false,  // Entire song loading process after selected (ZIP + process).
    isMenuOpening: !SKIP_INTRO,
    isPaused: false,  // Playing, but paused. Not active during menu.
    isPlaying: false,  // Actively playing (slicing beats).
    isSearching: false,  // Whether search is open.
    isSongProcessing: false,
    isVictory: false,  // Victory screen.
    isZipFetching: false,
    leaderboard: [],
    leaderboardFetched: false,
    leaderboardQualified: false,
    leaderboardNames: '',
    leaderboardScores: '',
    menuActive: SKIP_INTRO, // Main menu active.
    menuDifficulties: [],  // List of strings of available difficulties for selected.
    menuSelectedChallenge: {  // Currently selected challenge in the main menu.
      author: '',
      difficulty: '',
      downloads: '',
      downloadsText: '',
      genre: '',
      id: '',
      index: -1,
      image: '',
      numBeats: undefined,
      songDuration: 0,
      songInfoText: '',
      songLength: undefined,
      songName: '',
      songSubName: '',
      version: ''
    },
    score: {
      accuracy: 100,  // Out of 100.
      accuracyInt: 100,  // Out of 100.
      active: false,
      beatsHit: 0,
      beatsMissed: 0,
      beatsText: '',
      combo: 0,
      maxCombo: 0,
      rank: '',  // Grade (S to F).
      score: 0
    },
    search: {
      active: true,
      page: 0,
      hasError: false,
      hasNext: false,
      hasPrev: false,
      query: '',
      results: [],
      songNameTexts: '',  // All names in search results merged together.
      songSubNameTexts: ''  // All sub names in search results merged together.
    },
    searchResultsPage: [],
    speed: 8
  },

  handlers: {
    /**
     * Swap left-handed or right-handed mode.
     */
    activehandswap: state => {
      state.activeHand = state.activeHand === 'right' ? 'left' : 'right';
      localStorage.setItem('activeHand', state.activeHand);
    },

    beathit: (state, payload) => {
      if (state.damage > DAMAGE_DECAY) {
        state.damage -= DAMAGE_DECAY;
      }
      state.score.beatsHit++;
      state.score.combo++;
      if (state.score.combo > state.score.maxCombo) {
        state.score.maxCombo = state.score.combo;
      }

      payload.score = isNaN(payload.score) ? 100 : payload.score;
      state.score.score += Math.floor(payload.score);
      updateScoreAccuracy(state);
    },

    beatmiss: state => {
      state.score.beatsMissed++;
      takeDamage(state);
      updateScoreAccuracy(state);
    },

    beatwrong: state => {
      state.score.beatsMissed++;
      takeDamage(state);
      updateScoreAccuracy(state);
    },

    beatloaderpreloadfinish: state => {
      if (state.menuActive) { return; }  // Cancelled.
      state.challenge.isBeatsPreloaded = true;
    },

    controllerconnected: (state, payload) => {
      state.controllerType = payload.name;
      state.has6DOFVR = [
        'oculus-quest-controls',
        'oculus-touch-controls',
        'vive-controls',
        'windows-motion-controls'
      ].indexOf(state.controllerType) !== -1;
    },

    /**
     * To work on game over page.
     *
     * ?debugstate=gameplay
     */
    debuggameplay: state => {
      resetScore(state);

      // Set challenge. `beat-generator` is listening.
      Object.assign(state.challenge, state.menuSelectedChallenge);

      // Reset menu.
      state.menuActive = false;
      state.menuSelectedChallenge.id = '';

      state.isSearching = false;
      state.isLoading = false;
    },

    /**
     * To work on game over page.
     *
     * ?debugstate=gameover
     */
    debuggameover: state => {
      state.isGameOver = true;
      state.menuActive = false;
    },

    /**
     * To work on victory page.
     *
     * ?debugstate=loading
     */
    debugloading: state => {
      DEBUG_CHALLENGE.id = '-1';
      Object.assign(state.menuSelectedChallenge, DEBUG_CHALLENGE);
      Object.assign(state.challenge, DEBUG_CHALLENGE);
      state.menuActive = false;
      state.isSongProcessing = true;
    },

    /**
     * To work on victory page.
     *
     * ?debugstate=victory
     */
    debugvictory: state => {
      Object.assign(state.menuSelectedChallenge, DEBUG_CHALLENGE);
      Object.assign(state.challenge, DEBUG_CHALLENGE);
      state.isVictory = true;
      state.leaderboardQualified = true;
      state.menuActive = false;
      state.score.accuracy = 74.99;
      state.score.beatsHit = 125;
      state.score.beatsMissed = 125;
      state.score.maxCombo = 123;
      state.score.rank = 'A';
      state.score.score = 9001;
      state.introActive = false;
      computeBeatsText(state);
    },

    difficultyfilter: (state, difficulty) => {
      state.difficultyFilter = difficulty;
      state.difficultyFilterMenuOpen = false;
      state.menuSelectedChallenge.id = '';
    },

    difficultyfiltermenuclose: state => {
      state.difficultyFilterMenuOpen = false;
    },

    difficultyfiltermenuopen: state => {
      state.difficultyFilterMenuOpen = true;
    },

    displayconnected: state => {
      state.gameMode = 'ride';
      state.hasVR = true;
    },

    gamemenuresume: state => {
      state.isPaused = false;
    },

    gamemenurestart: state => {
      resetScore(state);
      state.challenge.isBeatsPreloaded = false;
      state.isGameOver = false;
      state.isPaused = false;
      state.isLoading = true;
      state.isVictory = false;
      state.leaderboardQualified = false;
    },

    gamemenuexit: state => {
      resetScore(state);
      state.challenge.isBeatsPreloaded = false;
      state.isGameOver = false;
      state.isPaused = false;
      state.isVictory = false;
      state.menuActive = true;
      state.challenge.id = '';
      state.leaderboardQualified = false;
    },

    gamemode: (state, mode) => {
      state.gameMode = mode;
    },

    genreclear: state => {
      state.genre = '';
    },

    genremenuclose: state => {
      state.genreMenuOpen = false;
    },

    genremenuopen: state => {
      state.genreMenuOpen = true;
    },

    keyboardclose: state => {
      state.isSearching = false;
    },

    keyboardopen: state => {
      state.isSearching = true;
      state.menuSelectedChallenge.id = '';
    },

    /**
     * High scores.
     */
    leaderboard: (state, payload) => {
      state.leaderboard.length = 0;
      state.leaderboardFetched = true;
      state.leaderboardNames = '';
      state.leaderboardScores = '';
      for (let i = 0; i < payload.scores.length; i++) {
        let score = payload.scores[i];
        state.leaderboard.push(score);
        state.leaderboardNames += `${score.username} (${score.accuracy || 0}%)\n`;
        state.leaderboardScores += `${score.score}\n`;
      }
      state.leaderboardLoading = false;
    },

    leaderboardqualify: state => {
      state.leaderboardQualified = true;
    },

    /**
     * Insert new score into leaderboard locally.
     */
    leaderboardscoreadded: (state, payload) => {
      state.leaderboard.splice(payload.index, 0, payload.scoreData);
      state.leaderboardNames = '';
      state.leaderboardScores = '';
      for (let i = 0; i < state.leaderboard.length; i++) {
        let score = state.leaderboard[i];
        state.leaderboardNames += `${score.username} (${score.accuracy || 0}%)\n`;
        state.leaderboardScores += `${score.score}\n`;
      }
    },

    leaderboardsubmit: state => {
      state.leaderboardQualified = false;
    },

    /**
     * Song clicked from menu.
     */
    menuchallengeselect: (state, id) => {
      // Copy from challenge store populated from search results.
      let challenge = challengeDataStore[id];
      Object.assign(state.menuSelectedChallenge, challenge);
      state.menuSelectedChallenge.songName = truncate(challenge.songName, 24);

      // Populate difficulty options.
      state.menuDifficulties.length = 0;
      for (let i = 0; i < challenge.difficulties.length; i++) {
        state.menuDifficulties.unshift(challenge.difficulties[i]);
      }
      state.menuDifficulties.sort(difficultyComparator);

      // Default to easiest difficulty.
      state.menuSelectedChallenge.difficulty = state.menuDifficulties[0];

      state.menuSelectedChallenge.image = utils.getS3FileUrl(id, 'image.jpg');
      updateMenuSongInfo(state, challenge);

      // Reset audio if it was able to prefetched by zip-loader before.
      state.challenge.audio = '';

      computeMenuSelectedChallengeIndex(state);
      state.isSearching = false;

      // Clear leaderboard.
      clearLeaderboard(state);
      state.leaderboardLoading = true;
    },

    menuchallengeunselect: state => {
      state.menuSelectedChallenge.id = '';
      state.menuSelectedChallenge.difficulty = '';
      clearLeaderboard(state);
    },

    menudifficultyselect: (state, difficulty) => {
      state.menuSelectedChallenge.difficulty = difficulty;
      updateMenuSongInfo(state, state.menuSelectedChallenge);

      clearLeaderboard(state);
      state.leaderboardLoading = true;
    },

    menuopeningend: state => {
      state.isMenuOpening = false;
    },

    minehit: state => {
      takeDamage(state);
    },

    pausegame: state => {
      if (!state.isPlaying) { return; }
      state.isPaused = true;
    },

    /**
     * Start challenge.
     * Transfer staged challenge to the active challenge.
     */
    playbuttonclick: state => {
      resetScore(state);

      // Set challenge.
      Object.assign(state.challenge, state.menuSelectedChallenge);
      state.challenge.songNameShort = truncate(state.challenge.songName, 20);

      // Reset menu.
      state.menuActive = false;
      state.menuSelectedChallenge.id = '';
      state.menuSelectedChallenge.difficulty = '';

      state.isSearching = false;
      state.isLoading = true;
    },

    searcherror: (state, payload) => {
      state.search.hasError = true;
    },

    searchprevpage: state => {
      if (state.search.page === 0) { return; }
      state.search.page--;
      computeSearchPagination(state);
    },

    searchnextpage: state => {
      if (state.search.page > Math.floor(state.search.results.length / SEARCH_PER_PAGE)) {
        return;
      }
      state.search.page++;
      computeSearchPagination(state);
    },

    /**
     * Update search results. Will automatically render using `bind-for` (menu.html).
     */
    searchresults: (state, payload) => {
      var i;
      state.search.hasError = false;
      state.search.page = 0;
      state.search.query = payload.query;
      state.search.results = payload.results;
      for (i = 0; i < payload.results.length; i++) {
        let result = payload.results[i];
        result.songSubName = result.songSubName || 'Unknown Artist';
        result.shortSongName = truncate(result.songName, SONG_NAME_TRUNCATE).toUpperCase();
        result.shortSongSubName = truncate(result.songSubName, SONG_SUB_NAME_RESULT_TRUNCATE);
        challengeDataStore[result.id] = result;
      }
      computeSearchPagination(state);

      if (payload.isGenreSearch) {
        state.genreMenuOpen = false;
        state.genre = payload.genre;
        state.search.query = '';
        state.menuSelectedChallenge.id = '';
      } else {
        state.genre = '';
        computeMenuSelectedChallengeIndex(state);
      }
    },

    songcomplete: state => {
      // Move back to menu in Ride or Viewer Mode.
      if (state.gameMode === 'ride' || !state.inVR) {
        state.challenge.isBeatsPreloaded = false;
        state.isVictory = false;
        state.menuActive = true;
        state.challenge.id = '';
        return;
      }

      state.isVictory = true;

      state.score.score = isNaN(state.score.score) ? 0 : state.score.score;
      updateScoreAccuracy(state);

      const accuracy = parseFloat(state.score.accuracy);
      if (accuracy >= 90) {
        state.score.rank = 'S';
      } else if (accuracy >= 80) {
        state.score.rank = 'A';
      } else if (accuracy >= 60) {
        state.score.rank = 'B';
      } else if (accuracy >= 40) {
        state.score.rank = 'C';
      } else if (accuracy >= 30) {
        state.score.rank = 'D';
      } else {
        state.score.rank = 'F';
      }

      computeBeatsText(state);
    },

    songloadcancel: state => {
      state.challenge.isBeatsPreloaded = false;
      // Unset selected challenge.
      state.challenge.audio = '';
      state.challenge.id = '';
      state.challenge.version = '';
      state.menuSelectedChallenge.version = '';

      state.isZipFetching = false;
      state.isLoading = false;
      state.isSongProcessing = false;
      state.menuActive = true;
    },

    songprocessfinish: state => {
      state.isSongProcessing = false;
      state.isLoading = false;  // Done loading after final step!
    },

    songprocessstart: state => {
      state.isSongProcessing = true;
    },

    'enter-vr': state => {
      state.inVR = AFRAME.utils.device.checkHeadsetConnected();
      if (state.gameMode === 'viewer') {
        state.gameMode = 'ride';
      }
    },

    'exit-vr': state => {
      state.inVR = false;
    },

    startgame: state => {
      state.introActive = false;
      state.menuActive = true;
    },

    victoryfake: state => {
      state.score.accuracy = '74.99';
      state.score.rank = 'C';
    },

    wallhitstart: state => {
      takeDamage(state);
    },

    ziploaderend: (state, payload) => {
      state.challenge.audio = payload.audio;
      state.menuSelectedChallenge.version = '';
      state.isZipFetching = false;
    },

    ziploaderstart: state => {
      state.challenge.isBeatsPreloaded = false;
      state.isZipFetching = true;
    }
  },

  /**
   * Post-process the state after each action.
   */
  computeState: state => {
    state.isPlaying =
      !state.menuActive && !state.isLoading && !state.isPaused && !state.isVictory &&
      !state.isGameOver && !state.isZipFetching && !state.isSongProcessing &&
      !!state.challenge.id && !state.introActive;

    const anyMenuOpen = state.menuActive || state.isPaused || state.isVictory ||
                        state.isGameOver || state.isLoading || state.introActive;
    state.leftRaycasterActive = anyMenuOpen && state.activeHand === 'left' && state.inVR;
    state.rightRaycasterActive = anyMenuOpen && state.activeHand === 'right' && state.inVR;

    state.score.active =
      state.gameMode !== 'ride' &&
      state.inVR &&
      (state.isPlaying || state.isPaused);

    // Song is decoding if it is loading, but not fetching.
    if (state.isLoading) {
      state.loadingText = state.isZipFetching ? 'Loading...' : 'Wrapping up...';
    } else {
      state.loadingText = '';
    }
  }
});

function computeSearchPagination (state) {
  let numPages = Math.ceil(state.search.results.length / SEARCH_PER_PAGE);
  state.search.hasPrev = state.search.page > 0;
  state.search.hasNext = state.search.page < numPages - 1;

  state.search.songNameTexts = '';
  state.search.songSubNameTexts = '';

  state.searchResultsPage.length = 0;
  state.searchResultsPage.__dirty = true;
  for (let i = state.search.page * SEARCH_PER_PAGE;
       i < state.search.page * SEARCH_PER_PAGE + SEARCH_PER_PAGE; i++) {
    if (!state.search.results[i]) { break; }
    state.searchResultsPage.push(state.search.results[i]);

    state.search.songNameTexts +=
      truncate(state.search.results[i].songName, SONG_NAME_TRUNCATE).toUpperCase() + '\n';
    state.search.songSubNameTexts +=
      truncate(state.search.results[i].songSubName, SONG_SUB_NAME_RESULT_TRUNCATE) + '\n';
  }

  for (let i = 0; i < state.searchResultsPage.length; i++) {
    state.searchResultsPage[i].index = i;
  }

  computeMenuSelectedChallengeIndex(state);
}

function truncate (str, length) {
  if (!str) { return ''; }
  if (str.length >= length) {
    return str.substring(0, length - 3) + '...';
  }
  return str;
}

const DIFFICULTIES = ['Easy', 'Normal', 'Hard', 'Expert', 'ExpertPlus'];
function difficultyComparator (a, b) {
  const aIndex = DIFFICULTIES.indexOf(a);
  const bIndex = DIFFICULTIES.indexOf(b);
  if (aIndex < bIndex) { return -1; }
  if (aIndex > bIndex) { return 1; }
  return 0;
}

function takeDamage (state) {
  if (!state.isPlaying || !state.inVR) { return; }
  state.score.combo = 0;
  // No damage for now.
  // state.damage++;
  // if (AFRAME.utils.getUrlParameter('godmode')) { return; }
  // checkGameOver(state);
}

function checkGameOver (state) {
  if (state.damage >= DAMAGE_MAX) {
    state.damage = 0;
    state.isGameOver = true;
  }
}

function resetScore (state) {
  state.damage = 0;
  state.score.beatsHit = 0;
  state.score.beatsMissed = 0;
  state.score.combo = 0;
  state.score.maxCombo = 0;
  state.score.score = 0;
}

function computeMenuSelectedChallengeIndex (state) {
  state.menuSelectedChallenge.index = -1;
  for (let i = 0; i < state.searchResultsPage.length; i++) {
    if (state.searchResultsPage[i].id === state.menuSelectedChallenge.id) {
      state.menuSelectedChallenge.index = i;
      break;
    }
  }
}

function formatSongLength (songLength) {
  songLength /= 60;
  const minutes = `${Math.floor(songLength)}`;
  var seconds = Math.round((songLength - minutes) * 60);
  if (seconds < 10) seconds = '0' + seconds;
  return `${minutes}:${seconds}`;
}

function computeBeatsText (state) {
  state.score.beatsText =
    `${state.score.beatsHit} / ${state.score.beatsMissed + state.score.beatsHit} BEATS`;
}

function clearLeaderboard (state) {
  state.leaderboard.length = 0;
  state.leaderboard.__dirty = true;
  state.leaderboardNames = '';
  state.leaderboardScores = '';
  state.leaderboardFetched = false;
}

function updateMenuSongInfo (state, challenge) {
  state.menuSelectedChallenge.songInfoText = `By ${truncate(challenge.author, SONG_SUB_NAME_DETAIL_TRUNCATE)}\n${challenge.genre && challenge.genre !== 'Uncategorized' ? challenge.genre + '\n' : ''}${formatSongLength(challenge.songDuration)} / ${challenge.numBeats[state.menuSelectedChallenge.difficulty]} beats`;
}

function updateScoreAccuracy (state) {
  // Update live accuracy.
  const currentNumBeats = state.score.beatsHit + state.score.beatsMissed;
  state.score.accuracy = (state.score.score / (currentNumBeats * 100)) * 100;
  state.score.accuracy = state.score.accuracy.toFixed(2);
  state.score.accuracyInt = parseInt(state.score.accuracy);
}
