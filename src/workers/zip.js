var window = self;

var unzip = require('unzip-js')

const difficulties = [];

const xhrs = {};

// Fetch and unzip.
addEventListener('message', function (evt) {
  const difficulties = JSON.parse(evt.data.difficulties);
  const version = evt.data.version;
  const hash = evt.data.hash;

  const [short] = version.split('-');



  unzip(evt.data.directDownload, function (err, zipFile) {
    if (err) {
      return console.error(err)
    }

    zipFile.readEntries(function (err, entries) {
      if (err) {
        return console.error(err)
      }

      const data = {
        audio: undefined,
        beats: {}
      };

      const beatFiles = {};

      entries.forEach(function (entry) {

        const chunks = [];

        zipFile.readEntryData(entry, false, function (err, readStream) {
          if (err) {
            return console.error(err)
          }

          readStream.on('data', function (chunk) { chunks.push(chunk) })

          readStream.on('end', function () {

            if (entry.name.endsWith('.egg') || entry.name.endsWith('.ogg')) {
              var blob = new Blob(chunks, /* { type: 'application/octet-binary' } */);
              var url = URL.createObjectURL(blob);

              data.audio = url;
            } else {

              var filename = entry.name;
              if (!filename.toLowerCase().endsWith('.dat')) return;

              var string = Buffer.concat(chunks).toString('utf8')
              var value = JSON.parse(string);

              if (filename.toLowerCase() === 'info.dat') {
                data.info = value;
              } else {
                value._beatsPerMinute = evt.data.bpm;
                beatFiles[filename] = value;
              }
            }

            if (data.audio === undefined) {
              return;
            }
            if (data.info === undefined) {
              return;
            }

            for (const difficultyBeatmapSet of data.info._difficultyBeatmapSets) {
              const beatmapCharacteristicName = difficultyBeatmapSet._beatmapCharacteristicName;

              for (const difficultyBeatmap of difficultyBeatmapSet._difficultyBeatmaps) {
                const difficulty = difficultyBeatmap._difficulty;
                const beatmapFilename = difficultyBeatmap._beatmapFilename;
                if (beatFiles[beatmapFilename] === undefined) {
                  return;
                }

                const id = beatmapCharacteristicName + '-' + difficulty;
                if (data.beats[id] === undefined) {
                  data.beats[id] = beatFiles[beatmapFilename];
                }
              }
            }

            postMessage({ message: 'load', data: data, version: version, hash: hash });
          })
        })
      })
    })
  })
  return;



});

// data: {audio url, beats { difficulty JSONs },
