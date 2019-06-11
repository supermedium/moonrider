var window = self;

import ZipLoader from 'zip-loader';

const difficulties = [];

const xhrs = {};

// Fetch and unzip.
addEventListener('message', function (evt) {
  const version = evt.data.version;

  // Abort.
  if (evt.data.abort && xhrs[version]) {
    xhrs[version].abort();
    delete xhrs[version];
    return;
  }

  let loader;
  const [short] = version.split('-');
  if (process.env.STUB_ZIP) {
    loader = new ZipLoader(`/assets/test.zip`);
  } else {
    // Unzip.
    loader = new ZipLoader(`https://beatsaver.com/storage/songs/${short}/${version}.zip`);
  }

  loader.on('error', err => {
    postMessage({message: 'error'});
  });

  loader.on('progress', evt => {
    postMessage({message: 'progress', progress: evt.loaded / evt.total, version: version});
  });

  loader.on('load', () => {
    let imageBlob;
    let songBlob;

    const data = {audio: null, beats: {}};

    let info;
    Object.keys(loader.files).forEach(filename => {
      if (!filename.endsWith('info.json')) { return; }
      info = loader.extractAsJSON(filename);
    });

    // Get difficulties from info.json.
    difficulties.length = 0;
    for (let i = 0; i < info.difficultyLevels.length; i++) {
      difficulties.push(info.difficultyLevels[i].difficulty);
    }

    // Extract files needed (beats and image).
    Object.keys(loader.files).forEach(filename => {
      for (let i = 0; i < difficulties.length; i++) {
        let difficulty = difficulties[i];
        if (filename.endsWith(`${difficulty}.json`)) {
          data.beats[difficulty] = loader.extractAsJSON(filename);
        }
      }

      if (filename.endsWith('.ogg')) {
        data.audio = loader.extractAsBlobUrl(filename, 'audio/ogg');
      }
    });

    postMessage({message: 'load', data: data, version: version});
    delete xhrs[version];
  });

  loader.load();
  xhrs[version] = loader.xhr;
});
