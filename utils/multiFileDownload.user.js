// ==UserScript==
// @name         MultiFileDownload
// @description  Multi thread downloader
// @version      0.1.0
// @license      MIT
// @namespace    https://github.com/stdai0a10
// ==/UserScript==

/**
 * @callback ProgressEventListener
 * @param {ProgressEvent} event
 */

/**
 * @callback FetchFunction
 * @param {RequestInfo|URL} input
 * @param {RequestInit=} init
 * @returns {Promise<Response>}
 */

/**
 * @param {{href: string, download?: string}[]} anchors
 * @param {Object} options
 * @param {int=} options.tries
 * @param {boolean=} options.ignore_error
 * @param {int=} options.threads
 * @param {ProgressEventListener=} options.onprogress
 * @param {FetchFunction=} options.fetch
 * @returns {Promise<File[]>}
 */
async function multiFileDownload (anchors, options = {}) { // eslint-disable-line
  if (typeof anchors[Symbol.iterator] !== 'function') {
    anchors = [anchors];
  }
  anchors = [...anchors];

  const files = [];
  const total = anchors.length;
  const retryCounter = {};
  const tries = options.tries ?? 1;
  const throwError = !(options.ignore_error ?? false);
  const threads = Math.max(options.threads ?? 1, 1);
  const fetchFunction = options.fetch ?? fetch;
  const onprogress = (type) => {
    if (options.onprogress) {
      setTimeout(() => {
        options.onprogress(new ProgressEvent(type, {
          lengthComputable: true,
          loaded: files.length,
          total: total
        }));
      }, 0);
    }
  };

  onprogress('loadstart');

  const downloaders = [...Array(threads).keys()].map((id) => {
    const downloadQueue = async function () {
      if (!anchors.length) return;
      const a = anchors.shift();
      const url = new URL(a.href);
      let name = a.download?.toString() ?? '';
      name = name.length ? name : url.pathname.split(/[\\/]/).pop();
      if (!name.match(/(?:\.([^.]+))?$/)) {
        name += url.pathname.match(/(?:\.([^.]+))?$/)[1] ?? '';
      }
      console.debug(`Downloader#${id}: download "${name}" (${url})`);

      try {
        const resp = await fetchFunction(url, {
          headers: { 'cache-control': 'no-cache', referer: location.origin }
        });
        const blob = resp.status === 200 ? await resp.blob() : new Blob();
        if (!blob.size) throw new Error(`${resp.status} ${resp.statusText}`);
        files.push(new File([blob], name, { type: blob.type }));
        onprogress('progress');
      } catch (e) {
        console.debug(e);
        retryCounter[url] = (retryCounter[url] ?? tries) - 1;
        if (retryCounter[url] !== 0) {
          anchors.push(a);
        } else if (throwError) {
          throw new Error(`Download failed: ${name} (${url}`);
        }
      }
      return downloadQueue();
    };
    return downloadQueue();
  });

  return Promise.all(downloaders).then(() => {
    onprogress('load');
    onprogress('loadend');
    return files;
  }).catch((e) => {
    onprogress('error');
    onprogress('loadend');
    throw e;
  });
}
