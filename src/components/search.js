var algoliasearch = require('algoliasearch/lite');
var bindEvent = require('aframe-event-decorators').bindEvent;

var client = algoliasearch('QULTOY3ZWU', 'be07164192471df7e97e6fa70c1d041d');
var algolia = client.initIndex('beatsaver');

/**
 * Search (including the initial list of popular searches).
 * Attached to super-keyboard.
 */
AFRAME.registerComponent('search', {
  init: function () {
    this.eventDetail = {query: '', results: []};
    this.popularHits = null;
    this.queryObject = {hitsPerPage: 100, query: ''};

    // Populate popular.
    this.search('');

    // Less hits on normal searches.
    this.queryObject.hitsPerPage = 30;

    this.el.sceneEl.addEventListener('searchclear', () => { this.search(''); });
  },

  superkeyboardchange: bindEvent(function (evt) {
    if (evt.target !== this.el) { return; }
    this.search(evt.detail.value);
  }),

  search: function (query) {
    // Use cached for popular hits.
    if (!query && this.popularHits) {
      this.eventDetail.results = this.popularHits;
      this.eventDetail.query = '';
      this.el.sceneEl.emit('searchresults', this.eventDetail);
      return;
    }

    this.eventDetail.query = query;
    this.queryObject.query = query;
    algolia.search(this.queryObject, (err, content) => {
      // Cache popular hits.
      if (err) {
        this.el.sceneEl.emit('searcherror', null, false);
        console.error(err);
        return;
      }

      if (!query) { this.popularHits = content.hits; }
      this.eventDetail.results = content.hits;
      this.el.sceneEl.emit('searchresults', this.eventDetail);
    });
  }
});

/**
 * Select genre filter.
 */
AFRAME.registerComponent('search-genre', {
  init: function () {
    this.eventDetail = {isGenreSearch: true, genre: '', results: []};
    this.queryObject = {
      filters: '',
      hitsPerPage: 100
    };

    this.el.addEventListener('click', evt => {
      this.search(evt.target.closest('.genre').dataset.bindForKey);
    });
  },

  search: function (genre) {
    if (genre === 'Video Games') {
      this.queryObject.filters = `genre:"Video Game" OR genre:"Video Games"`;
    } else {
      this.queryObject.filters = `genre:"${genre}"`;
    }
    algolia.search(this.queryObject, (err, content) => {
      if (err) {
        this.el.sceneEl.emit('searcherror', null, false);
        console.error(err);
        return;
      }

      this.eventDetail.genre = genre;
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

  refreshLayout: function () {
    this.el.emit('layoutrefresh', null, false);
  },

  click: bindEvent(function (evt) {
    this.el.sceneEl.emit('menuchallengeselect',
                         evt.target.closest('.searchResult').dataset.id,
                         false);
  })
});
