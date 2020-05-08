const algoliasearch = require('algoliasearch/lite');
const debounce = require('lodash.debounce');

const client = algoliasearch('QULTOY3ZWU', 'be07164192471df7e97e6fa70c1d041d');
const algolia = client.initIndex('beatsaver');

const topSearch = require('../lib/search.json');

const filters = [];

/**
 * Search (including the initial list of popular searches).
 * Attached to super-keyboard.
 */
AFRAME.registerComponent('search', {
  schema: {
    difficultyFilter: {default: 'All'},
    genre: {default: ''},
    playlist: {default: ''},
    query: {default: ''}
  },

  init: function () {
    this.eventDetail = {query: '', results: topSearch};
    this.keyboardEl = document.getElementById('keyboard');
    this.popularHits = topSearch;
    shuffle(this.popularHits);
    this.queryObject = {hitsPerPage: 0, query: ''};
    this.el.sceneEl.addEventListener('searchclear', () => { this.search(''); });
  },

  update: function (oldData) {
    if (!this.popularHits) { return; }  // First load.

    this.search(this.data.query);

    // Clear keyboard.
    if (oldData.query && !this.data.query) {
      this.keyboardEl.components['super-keyboard'].data.value = '';
      this.keyboardEl.components['super-keyboard'].updateTextInput('');
    }

    this.debouncedSearch = debounce(this.search.bind(this), 1000);
  },

  play: function () {
    // Pre-populate top.
    this.el.sceneEl.emit('searchresults', this.eventDetail);

    // Populate popular.
    this.search('');
  },

  events: {
    superkeyboardchange: function (evt) {
      if (evt.target !== this.el) { return; }
      this.debouncedSearch(evt.detail.value);
    }
  },

  search: function (query) {
    // Use cached for popular hits.
    if (!query && this.data.difficultyFilter === 'All' && !this.data.genre &&
        !this.data.playlist && this.popularHits) {
      this.eventDetail.results = this.popularHits;
      this.eventDetail.query = '';
      this.el.sceneEl.emit('searchresults', this.eventDetail);
      return;
    }

    this.eventDetail.query = query;
    this.queryObject.query = query;
    this.queryObject.hitsPerPage = query ? 30 : 150;

    // Favorites.
    if (this.data.playlist === 'favorites') {
      this.eventDetail.results = JSON.parse(localStorage.getItem('favorites'));
      this.el.sceneEl.emit('searchresults', this.eventDetail);
      return;
    }

    if (this.data.difficultyFilter || this.data.genre || this.data.playlist) {
      filters.length = 0;

      // Difficulty filter.
      if (this.data.difficultyFilter && this.data.difficultyFilter !== 'All') {
        filters.push(`difficulties:"${this.data.difficultyFilter}"`);
      }

      // Genre filter.
      if (this.data.genre === 'Video Games') {
        filters.push(`genre:"Video Game" OR genre:"Video Games"`);
      } else if (this.data.genre) {
        filters.push(`genre:"${this.data.genre}"`);
      }

      // Playlist filter.
      if (this.data.playlist) {
        filters.push(`playlists:"${this.data.playlist}"`);
      }

      this.queryObject.filters = filters.join(' AND ');
    } else {
      delete this.queryObject.filters;
    }

    if (query && query.length < 3) { return; }

    algolia.search(this.queryObject, (err, content) => {
      if (err) {
        this.el.sceneEl.emit('searcherror', null, false);
        console.error(err);
        return;
      }

      this.eventDetail.results = content.hits;

      this.el.sceneEl.emit('searchresults', this.eventDetail);
    });
  }
});

/**
 * Click listener for search result.
 */
AFRAME.registerComponent('search-result-list', {
  init: function () {
    const obv = new MutationObserver(mutations => {
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].attributeName === 'data-index') {
          this.refreshLayout();
        }
      }
    });
    obv.observe(this.el, {attributes: true, childList: false, subtree: true});
  },

  events: {
    click: function (evt) {
      this.el.sceneEl.emit(
        'menuchallengeselect',
        evt.target.closest('.searchResult').dataset.id,
        false);
    }
  },

  refreshLayout: function () {
    this.el.emit('layoutrefresh', null, false);
  }
});

function shuffle (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
