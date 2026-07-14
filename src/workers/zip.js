var window = self;

import { unzip } from 'fflate';

// Fetch and unzip.
addEventListener('message', function (evt) {
  const difficulties = JSON.parse(evt.data.difficulties);
  const version = evt.data.version;
  const hash = evt.data.hash;

  fetch(evt.data.directDownload)
    .then(function (response) {
      return response.arrayBuffer();
    })
    .then(function (arrayBuffer) {
      const zipData = new Uint8Array(arrayBuffer);

      unzip(zipData, function (err, unzipped) {
        if (err) {
          return console.error(err);
        }

        // {audio: url, beats: { difficulty JSONs, info: { info JSON }}
        const data = {
          audio: undefined,
          beats: {},
          info: undefined
        };

        const beatFiles = {};

        // Process all entries
        for (const filename in unzipped) {
          const fileData = unzipped[filename];

          if (filename.endsWith('.egg') || filename.endsWith('.ogg')) {
            var blob = new Blob([fileData]);
            var url = URL.createObjectURL(blob);
            data.audio = url;
          } else if (filename.toLowerCase().endsWith('.dat')) {
            var string = new TextDecoder().decode(fileData);
            var value = JSON.parse(string);

            if (filename.toLowerCase() === 'info.dat') {
              data.info = value;
            } else {
              value._beatsPerMinute = evt.data.bpm;
              beatFiles[filename] = value;
            }
          }
        }

        if (data.audio === undefined || data.info === undefined) {
          console.error('Missing audio or info.dat');
          return;
        }

        for (const difficultyBeatmapSet of data.info._difficultyBeatmapSets) {
          const beatmapCharacteristicName = difficultyBeatmapSet._beatmapCharacteristicName;

          for (const difficultyBeatmap of difficultyBeatmapSet._difficultyBeatmaps) {
            const difficulty = difficultyBeatmap._difficulty;
            const beatmapFilename = difficultyBeatmap._beatmapFilename;
            if (beatFiles[beatmapFilename] === undefined) {
              continue;
            }

            const id = beatmapCharacteristicName + '-' + difficulty;
            if (data.beats[id] === undefined) {
              data.beats[id] = beatFiles[beatmapFilename];
            }
          }
        }

        postMessage({ message: 'load', data: data, version: version, hash: hash });
      });
    })
    .catch(function (err) {
      console.error('Failed to fetch zip:', err);
    });
});
