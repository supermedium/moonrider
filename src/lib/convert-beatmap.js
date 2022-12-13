module.exports = function convertBeatmap(src) {

    if (src.converted) return src;

    src['version'] = src['versions'][0]['hash'];

    const coverImageCorsProxy = 'https://beatproxy.fly.dev/cdn-proxy/';

    src['directDownload'] = src['versions'][0]['downloadURL'];

    src['coverURL'] = coverImageCorsProxy + src['versions'][0]['coverURL'].split('/')[3];

    let diffs = src['versions'][0]['diffs'];

    src.metadata.characteristics = {};

    for (const item of diffs) {

        if (src.metadata.characteristics[item['characteristic']] === undefined) {
            src.metadata.characteristics[item['characteristic']] = {};
        }

        src.metadata.characteristics[item['characteristic']][item['difficulty']] = item;
    }
    src.metadata.characteristics = JSON.stringify(src.metadata.characteristics);

    src.converted = true;

    return src;
};
