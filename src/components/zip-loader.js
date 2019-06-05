AFRAME.registerComponent('zip-loader', {
  schema: {
    isLoading: {default: 'false'},
    version: {type: 'string'}  // e.g., 811-535.
  },

  init: function () {
    this.loadingIndicator = document.getElementById('zipLoaderIndicator');

    // Cache one ZIP at a time.
    this.cachedZip = null;
    this.cachedVersion = null;

    this.message = {};
    this.worker = new Worker('build/zip.js');
    this.worker.onmessage = this.onMessage.bind(this);
    this.worker.onerror = console.error;
  },

  update: function (oldData) {
    const data = this.data;

    // Abort previous ZIP request if new song selected.
    if (oldData.version && oldData.version !== data.version &&
        this.cachedVersion !== data.version) {
      this.message.abort = true;
      this.message.version = oldData.version;
      this.worker.postMessage(this.message);  // Start the worker.
    }

    if (data.version && oldData.version !== data.version) {
      this.fetchZip(data.version);
    }
  },

  fetchZip: function (version) {
    this.el.emit('ziploaderstart', null, false);
    if (this.cachedVersion === version) {
      this.el.emit('ziploaderend', this.cachedZip, false);
      return;
    }

    this.message.abort = false;
    this.message.version = version;
    this.worker.postMessage(this.message);  // Start the worker.
  },

  onMessage: function (evt) {
    switch (evt.data.message) {
      case 'progress': {
        this.loadingIndicator.object3D.visible = true;
        this.loadingIndicator.setAttribute('material', 'progress', evt.data.progress);
        break;
      }

      case 'load': {
        this.cachedVersion = evt.data.version;
        this.cachedZip = evt.data.data;

        // Check version still matches in case selected challenge changed.
        if (evt.data.version === this.data.version) {
          this.el.emit('ziploaderend', evt.data.data, false);
        }
        break;
      }
    }
  }
});

/**
 * Beatsaver JSON sometimes have weird characters in front of JSON in utf16le encoding.
 */
function jsonParseClean (str) {
  try {
    str = str.trim();
    str = str.replace(/\u0000/g, '').replace(/\u\d\d\d\d/g, '');
    str = str.replace('\b', ' ');
    if (str[0] !== '{') {
      str = str.substring(str.indexOf('{'), str.length);
    }

    // Remove Unicode escape sequences.
    // stringified = stringified.replace(/\\u..../g, ' ');
    return jsonParseLoop(str, 0);
  } catch (e) {
    // Should not reach here.
    console.log(e, str);
    return null;
  }
}

const errorRe1 = /column (\d+)/m;
const errorRe2 = /position (\d+)/m;

function jsonParseLoop (str, i) {
  try {
    return JSON.parse(str);
  } catch (e) {
    let match = e.toString().match(errorRe1);
    if (!match) { match = e.toString().match(errorRe2); }
    if (!match) { throw e; }
    const errorPos = parseInt(match[1]);
    str = str.replace(str[errorPos], 'x');
    str = str.replace(str[errorPos + 1], 'x');
    str = str.replace(str[errorPos + 2], 'x');
    return jsonParseLoop(str, i + 1);
  }
}
