/* global localStorage */
import COLORS from '../constants/colors';
const utils = require('../utils');
const convertBeatmap = require('../lib/convert-beatmap');

const challengeDataStore = {};
let HAS_LOGGED_VR = false;
const NUM_LEADERBOARD_DISPLAY = 10;
const SEARCH_PER_PAGE = 6;
const SONG_NAME_TRUNCATE = 22;
const SONG_SUB_NAME_RESULT_TRUNCATE = 32;
const SONG_SUB_NAME_DETAIL_TRUNCATE = 55;

const DAMAGE_DECAY = 0.25;
const DAMAGE_MAX = 10;

const difficultyMap = {
  "Easy": 'Easy',
  "Expert": 'Expert',
  "ExpertPlus": 'Expert+',
  "Hard": 'Hard',
  "Normal": 'Normal',
};

const badSongs = {};

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

const colorScheme = localStorage.getItem('colorScheme') || 'default';

let favorites = localStorage.getItem('favorites-v2');
if (favorites) {
  try {
    favorites = JSON.parse(favorites);
  } catch (e) {
    favorites = [];
  }
} else {
  favorites = [];
}

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
      beatmapCharacteristic: '',
      id: AFRAME.utils.getUrlParameter('challenge'),  // Will be empty string if not playing.
      image: '',
      isBeatsPreloaded: false,  // Whether we have passed the negative time.
      numBeats: undefined,
      songDuration: 0,
      songName: '',
      songNameShort: '',
      songSubName: '',
      metadata: {},
    },
    colorPrimary: COLORS.schemes[colorScheme].primary,
    colorScheme: colorScheme,
    colorSecondary: COLORS.schemes[colorScheme].secondary,
    colorSecondaryBright: COLORS.schemes[colorScheme].secondarybright,
    colorTertiary: COLORS.schemes[colorScheme].tertiary,
    controllerType: '',
    damage: 0,
    difficultyFilter: 'All',
    difficultyFilterMenuOpen: false,
    favorites: favorites,
    gameMode: 'classic',
    genre: '',
    genres: require('../constants/genres'),
    genreMenuOpen: false,
    has3DOFVR: false,
    has6DOFVR: false,
    hasSongLoadError: false,
    hasVR: AFRAME.utils.device.checkHeadsetConnected() ||
      AFRAME.utils.getUrlParameter('debugvr') === 'true',
    introActive: !SKIP_INTRO,  // Just started game, main menu not opened yet.
    inVR: AFRAME.utils.getUrlParameter('debugvr') === 'true',
    isIOS: AFRAME.utils.device.isIOS(),
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
    mainMenuActive: false,
    menuActive: SKIP_INTRO, // Main menu active.
    menuDifficulties: [],
    menuDifficultiesIds: [],
    menuSelectedChallenge: {  // Currently selected challenge in the main menu.
      author: '',
      difficulty: '',
      beatmapCharacteristic: '',
      downloads: '',
      downloadsText: '',
      genre: '',
      id: '',
      index: -1,
      image: '',
      isFavorited: false,
      numBeats: undefined,
      songDuration: 0,
      songInfoText: '',
      songLength: undefined,
      numBeats: undefined,
      songName: '',
      songSubName: '',
      version: '',
      metadata: {},
    },
    optionsMenuOpen: false,
    playlist: '',
    playlists: require('../constants/playlists'),
    playlistMenuOpen: false,
    playlistTitle: '',
    score: {
      accuracy: 100,  // Out of 100.
      accuracyScore: 0,  // Raw number.
      accuracyInt: 100,  // Out of 100.
      activePanel: false,
      beatsHit: 0,
      beatsMissed: 0,
      beatsText: '',
      combo: 0,
      finalAccuracy: 100,  // Out of 100.
      maxCombo: 0,
      rank: '',  // Grade (S to F).
      score: 0
    },
    search: {
      activePanel: true,
      page: 0,
      hasError: false,
      hasNext: false,
      hasPrev: false,
      query: '',
      queryText: '',
      results: [],
      songNameTexts: '',  // All names in search results merged together.
      songSubNameTexts: '',  // All sub names in search results merged together.
      // url and urlPage are used to load more results from the API when scrolling down
      url: '',
      urlPage: 0,
    },
    searchResultsPage: [],
    speed: 10
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
      state.score.accuracyScore += payload.percent;
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

    colorschemechange: (state, payload) => {
      state.colorScheme = payload;
      state.colorPrimary = COLORS.schemes[payload].primary;
      state.colorSecondary = COLORS.schemes[payload].secondary;
      state.colorSecondaryBright = COLORS.schemes[payload].secondarybright;
      state.colorTertiary = COLORS.schemes[payload].tertiary;
      localStorage.setItem('colorScheme', payload);
    },

    controllerconnected: (state, payload) => {
      state.controllerType = payload.name;
      state.has6DOFVR = [
        'oculus-quest-controls',
        'oculus-touch-controls',
        'vive-controls',
        'windows-motion-controls',
        'generic-tracked-controller-controls'
      ].indexOf(state.controllerType) !== -1;

      state.has3DOFVR = [
        'oculus-go-controls',
        'daydream-controls'
      ].indexOf(state.controllerType) !== -1;
    },

    debugbeatpositioning: state => {
      state.gameMode = 'classic';
      state.introActive = false;
      state.menuActive = false;
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
      state.hasVR = true;

      if (HAS_LOGGED_VR) { return; }
      try {
        if ('getVRDisplays' in navigator) {
          navigator.getVRDisplays().then(displays => {
            if (!displays.length) { return; }
            gtag('event', 'entervr', { event_label: displays[0].displayName });
            HAS_LOGGED_VR = true;
          });
        }
      } catch (e) { }
    },

    favoritetoggle: state => {
      const id = state.menuSelectedChallenge.id;
      const challenge = challengeDataStore[id];

      if (!challenge) { return; }

      if (state.menuSelectedChallenge.isFavorited) {
        // Unfavorite.
        state.menuSelectedChallenge.isFavorited = false;
        for (let i = 0; i < state.favorites.length; i++) {
          if (state.favorites[i].id === id) {
            state.favorites.splice(i, 1);
            localStorage.setItem('favorites-v2', JSON.stringify(state.favorites));
            return;
          }
        }
      } else {
        // Favorite.
        state.menuSelectedChallenge.isFavorited = true;
        if (state.favorites.filter(favorite => favorite.id === id).length) { return; }
        state.favorites.push(challenge)
        localStorage.setItem('favorites-v2', JSON.stringify(state.favorites));
      }
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
      state.menuSelectedChallenge.id = state.challenge.id;
      state.menuSelectedChallenge.difficulty = state.challenge.difficulty;
      state.menuSelectedChallenge.beatmapCharacteristic = state.challenge.beatmapCharacteristic;
      state.menuSelectedChallenge.difficultyId = state.challenge.difficultyId;
      state.challenge.id = '';
      state.leaderboardQualified = false;
    },

    gamemode: (state, mode) => {
      state.gameMode = mode;
    },

    genreclear: state => {
      state.genre = '';
      state.menuSelectedChallenge.id = '';
    },

    genreselect: (state, genre) => {
      state.genre = genre;
      state.genreMenuOpen = false;
      state.menuSelectedChallenge.id = '';
      state.playlist = '';
      state.search.query = '';
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
        state.leaderboardNames += `#${i + 1} ${truncate(score.username, 18)} (${Math.round(score.accuracy || 0)}%)\n`;
        state.leaderboardScores += `${score.score}\n`;
      }
      state.leaderboardLoading = false;
    },

    leaderboardqualify: state => {
      if (!state.has6DOFVR) { return; }
      state.leaderboardQualified = true;
    },

    /**
     * Insert new score into leaderboard locally.
     */
    leaderboardscoreadded: (state, payload) => {
      // Insert.
      for (let i = 0; i < state.leaderboard.length; i++) {
        if (payload.scoreData.score >= state.leaderboard[i].score ||
          i >= state.leaderboard.length - 1) {
          state.leaderboard.splice(i, 0, payload.scoreData);
          break;
        }
      }

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

    menuback: state => {
      state.difficultyFilterMenuOpen = false;
      state.genreMenuOpen = false;
      state.isSearching = false;
      state.optionsMenuOpen = false;
      state.playlistMenuOpen = false;
    },

    /**
     * Song clicked from menu.
     */
    menuchallengeselect: (state, id) => {
      // Copy from challenge store populated from search results.
      let challenge = challengeDataStore[id];
      if (!challenge) { return; }
      Object.assign(state.menuSelectedChallenge, challenge);
      state.menuSelectedChallenge.songName = truncate(challenge.metadata.songName, 24);

      // Populate difficulty options.
      state.menuDifficulties.length = 0;
      state.menuDifficultiesIds.length = 0;

      const characteristics = JSON.parse(challenge.metadata.characteristics);
      for (const characteristic of Object.keys(characteristics)) {

        if (['90Degree', '360Degree'].includes(characteristic)) continue;

        for (const difficulty of Object.keys(characteristics[characteristic])) {

          if (characteristics[characteristic][difficulty] === null) continue;

          let difficultyName = difficultyMap[difficulty];
          let renderName = difficultyName;

          if (characteristic !== 'Standard') {
            renderName = characteristic + '\n' + renderName;
          }
          state.menuDifficulties.unshift({
            'id': characteristic + '-' + difficulty,
            'filename': /* fileDifficultyMap[ */difficulty/* ] */ + characteristic,
            'difficultyName': difficultyName,
            'renderName': renderName,
            'beatmapCharacteristic': characteristic,
            'difficulty': difficulty,
          })

        }
      }
      
      state.menuDifficulties.sort(difficultyComparator);

      for (const d of state.menuDifficulties) {
        state.menuDifficultiesIds.push(d.id);
      }

      const selectedDifficulty = state.menuDifficulties[0];

      state.menuSelectedChallenge.difficulty = selectedDifficulty.difficulty;
      state.menuSelectedChallenge.beatmapCharacteristic = selectedDifficulty.beatmapCharacteristic;
      state.menuSelectedChallenge.difficultyId = selectedDifficulty.id;

      state.menuSelectedChallenge.image = state.menuSelectedChallenge.coverURL;
      updateMenuSongInfo(state, challenge);

      // Reset audio if it was able to prefetched by zip-loader before.
      state.challenge.audio = '';

      computeMenuSelectedChallengeIndex(state);
      state.isSearching = false;

      // Favorited.
      const isFavorited = !!state.favorites.filter(favorite => favorite.id === id).length;
      state.menuSelectedChallenge.isFavorited = isFavorited;

      // Clear leaderboard.
      clearLeaderboard(state);
      state.leaderboardLoading = true;

      state.hasSongLoadError = false;
      if (badSongs[id]) {
        state.hasSongLoadError = true;
      }
    },

    menuchallengeunselect: state => {
      state.menuSelectedChallenge.id = '';
      state.menuSelectedChallenge.difficultyId = '';
      state.menuSelectedChallenge.difficulty = '';
      state.menuSelectedChallenge.beatmapCharacteristic = '';
      clearLeaderboard(state);
    },

    menudifficultyselect: (state, difficultyId) => {
      let difficulty;
      for (const d of state.menuDifficulties) {
        if (d.id === difficultyId) {
          difficulty = d;
          break;
        }
      }
      state.menuSelectedChallenge.difficultyId = difficultyId;
      state.menuSelectedChallenge.difficulty = difficulty.difficulty;
      state.menuSelectedChallenge.beatmapCharacteristic = difficulty.beatmapCharacteristic;
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

    optionsmenuopen: state => {
      state.optionsMenuOpen = true;
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
      if (state.menuSelectedChallenge.id === '') { return; }
      if (badSongs[state.menuSelectedChallenge.id]) { return; }

      let source = 'frontpage';
      if (state.playlist) { source = 'playlist'; }
      if (state.search.query) { source = 'search'; }
      if (state.genre) { source = 'genre'; }
      gtag('event', 'songsource', { event_label: source });

      resetScore(state);

      // Set challenge.
      Object.assign(state.challenge, state.menuSelectedChallenge);

      gtag('event', 'difficulty', { event_label: state.challenge.difficulty });

      // Reset menu.
      state.menuActive = false;
      state.menuSelectedChallenge.id = '';
      state.menuSelectedChallenge.difficulty = '';
      state.menuSelectedChallenge.beatmapCharacteristic = '';

      state.isSearching = false;
      state.isLoading = true;
      state.loadingText = 'Loading...'

      gtag('event', 'colorscheme', { event_label: state.colorScheme });
    },

    playlistclear: (state, playlist) => {
      state.menuSelectedChallenge.id = '';
      state.playlist = '';
    },

    playlistselect: (state, playlist) => {
      state.genre = '';
      state.menuSelectedChallenge.id = '';
      state.playlist = playlist.id;
      state.playlistTitle = playlist.title;
      state.playlistMenuOpen = false;
      state.search.query = '';
    },

    playlistmenuclose: state => {
      state.playlistMenuOpen = false;
    },

    playlistmenuopen: state => {
      state.playlistMenuOpen = true;
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

      if (state.search.url === undefined) {
        return;
      }

      if ((state.search.page + 3) > Math.floor(state.search.results.length / SEARCH_PER_PAGE)) {

        state.search.urlPage = state.search.urlPage + 1;

        fetch(state.search.url.replaceAll('CURRENT_PAGE_INDEX', state.search.urlPage))
          .then(r => { return r.json() })
          .then(res => {
            var hits = (res['docs'] || res['maps']).map(convertBeatmap)

            state.search.results.push(...hits);

            for (i = 0; i < hits.length; i++) {
              let result = hits[i];
              challengeDataStore[result.id] = result;
            }            
          })
      }
    },

    /**
     * Update search results. Will automatically render using `bind-for` (menu.html).
     */
    searchresults: (state, payload) => {
      var i;
      state.search.hasError = false;
      state.search.page = 0;
      state.search.url = payload.url;
      state.search.urlPage = payload.urlPage;
      state.search.query = payload.query;
      state.search.queryText = truncate(payload.query, 10);
      state.search.results = payload.results;
      for (i = 0; i < payload.results.length; i++) {
        let result = payload.results[i];
        // result.songSubName = result.songSubName || 'Unknown Artist';
        // result.shortSongName = truncate(result.songName, SONG_NAME_TRUNCATE).toUpperCase();
        // result.shortSongSubName = truncate(result.songSubName, SONG_SUB_NAME_RESULT_TRUNCATE);
        challengeDataStore[result.id] = result;
      }
      computeSearchPagination(state);
      state.menuSelectedChallenge.id = '';  // Clear any selected on new results.
      if (state.isSearching) {
        state.genre = '';
        state.playlist = '';
      }
    },

    songcomplete: state => {
      gtag('event', 'songcomplete', { event_label: state.gameMode });

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
      state.score.finalAccuracy = state.score.accuracy;

      const accuracy = parseFloat(state.score.accuracy);
      if (accuracy >= 97) {
        state.score.rank = 'S';
      } else if (accuracy >= 90) {
        state.score.rank = 'A';
      } else if (accuracy >= 80) {
        state.score.rank = 'B';
      } else if (accuracy >= 70) {
        state.score.rank = 'C';
      } else if (accuracy >= 60) {
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

      state.isZipFetching = false;
      state.isLoading = false;
      state.isSongProcessing = false;
      state.menuActive = true;
    },

    songloaderror: state => {
      badSongs[state.menuSelectedChallenge.id || state.challenge.id] = true;

      state.hasSongLoadError = true;
      state.loadingText = 'Sorry! There was an error loading this song.\nPlease select another song.';

      state.challenge.id = '';
      state.challenge.isBeatsPreloaded = false;
      state.isSongProcessing = false;
      state.isZipFetching = false;
    },

    songprocessfinish: state => {
      state.isSongProcessing = false;
      state.isLoading = false;  // Done loading after final step!
    },

    songprocessstart: state => {
      state.isSongProcessing = true;
      state.loadingText = 'Wrapping up...';
    },

    'enter-vr': state => {
      state.inVR = AFRAME.utils.device.checkHeadsetConnected();
    },

    'exit-vr': state => {
      state.inVR = false;
      if (state.isPlaying) {
        state.isPaused = true;
      }
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
      state.hasSongLoadError = false;
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

    state.mainMenuActive =
      state.menuActive &&
      !state.genreMenuOpen &&
      !state.difficultyFilterMenuOpen &&
      !state.playlistMenuOpen &&
      !state.optionsMenuOpen &&
      !state.isSearching;

    state.score.active =
      state.gameMode !== 'ride' &&
      state.inVR &&
      (state.isPlaying || state.isPaused);
  }
});

function computeSearchPagination(state) {
  let numPages = Math.ceil(state.search.results.length / SEARCH_PER_PAGE);
  state.search.hasPrev = state.search.page > 0;
  state.search.hasNext = state.search.page < numPages - 1;

  state.search.songNameTexts = '';
  state.search.songSubNameTexts = '';

  state.searchResultsPage.length = 0;
  state.searchResultsPage.__dirty = true;
  for (let i = state.search.page * SEARCH_PER_PAGE;
    i < state.search.page * SEARCH_PER_PAGE + SEARCH_PER_PAGE; i++) {
    const result = state.search.results[i];
    if (!result) { break; }
    state.searchResultsPage.push(result);

    state.search.songNameTexts +=
      truncate(result.metadata.songName, SONG_NAME_TRUNCATE).toUpperCase() + '\n';
    state.search.songSubNameTexts +=
      truncate((result.metadata.songSubName || result.metadata.songAuthorName || 'Unknown Artist'),
        SONG_SUB_NAME_RESULT_TRUNCATE) + '\n';
  }

  for (let i = 0; i < state.searchResultsPage.length; i++) {
    state.searchResultsPage[i].index = i;
  }

  computeMenuSelectedChallengeIndex(state);
}

function truncate(str, length) {
  if (!str) { return ''; }
  if (str.length >= length) {
    return str.substring(0, length - 3) + '...';
  }
  return str;
}

const DIFFICULTIES = ['easy', 'normal', 'hard', 'expert', 'expertPlus'];
const CHARACTERISTICS = ['Standard'];
function difficultyComparator(a, b) {
  const aIndex = DIFFICULTIES.indexOf(a.difficulty);
  const bIndex = DIFFICULTIES.indexOf(b.difficulty);
  if (aIndex < bIndex) { return -1; }
  if (aIndex > bIndex) { return 1; }

  const aIndex2 = CHARACTERISTICS.indexOf(a.beatmapCharacteristic);
  const bIndex2 = CHARACTERISTICS.indexOf(b.beatmapCharacteristic);
  if (aIndex2 > bIndex2) { return -1; }
  if (aIndex2 < bIndex2) { return 1; }
  return 0;
}

function takeDamage(state) {
  if (!state.isPlaying || !state.inVR) { return; }
  state.score.combo = 0;
  // No damage for now.
  // state.damage++;
  // if (AFRAME.utils.getUrlParameter('godmode')) { return; }
  // checkGameOver(state);
}

function checkGameOver(state) {
  if (state.damage >= DAMAGE_MAX) {
    state.damage = 0;
    state.isGameOver = true;
  }
}

function resetScore(state) {
  state.damage = 0;
  state.score.accuracy = 100;
  state.score.accuracyInt = 100;
  state.score.accuracyScore = 0;
  state.score.beatsHit = 0;
  state.score.beatsMissed = 0;
  state.score.finalAccuracy = 100;
  state.score.combo = 0;
  state.score.maxCombo = 0;
  state.score.score = 0;
}

function computeMenuSelectedChallengeIndex(state) {
  state.menuSelectedChallenge.index = -1;
  for (let i = 0; i < state.searchResultsPage.length; i++) {
    if (state.searchResultsPage[i].id === state.menuSelectedChallenge.id) {
      state.menuSelectedChallenge.index = i;
      break;
    }
  }
}

function formatSongLength(songLength) {
  songLength /= 60;
  const minutes = `${Math.floor(songLength)}`;
  var seconds = Math.round((songLength - minutes) * 60);
  if (seconds < 10) seconds = '0' + seconds;
  return `${minutes}:${seconds}`;
}

function computeBeatsText(state) {
  state.score.beatsText =
    `${state.score.beatsHit} / ${state.score.beatsMissed + state.score.beatsHit} BEATS`;
}

function clearLeaderboard(state) {
  state.leaderboard.length = 0;
  state.leaderboard.__dirty = true;
  state.leaderboardNames = '';
  state.leaderboardScores = '';
  state.leaderboardFetched = false;
}

function updateMenuSongInfo(state, challenge) {
  let info = JSON.parse(challenge.metadata.characteristics)[state.menuSelectedChallenge.beatmapCharacteristic][state.menuSelectedChallenge.difficulty];

  state.menuSelectedChallenge.songInfoText = `Mapped by ${truncate(challenge.metadata.levelAuthorName, SONG_SUB_NAME_DETAIL_TRUNCATE)}\n${challenge.genre && challenge.genre !== 'Uncategorized' ? challenge.genre + '\n' : ''}${formatSongLength(challenge.metadata.duration)} / ${info.notes} notes\n${info.bombs} bombs | ${info.obstacles} obstacles\nNJS: ${info.njs}`;
}

function updateScoreAccuracy(state) {
  // Update live accuracy.
  const currentNumBeats = state.score.beatsHit + state.score.beatsMissed;
  state.score.accuracy = (state.score.accuracyScore / (currentNumBeats * 100)) * 100;
  state.score.accuracy = state.score.accuracy.toFixed(2);
  state.score.accuracyInt = parseInt(state.score.accuracy);
}
