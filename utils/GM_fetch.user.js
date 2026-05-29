// ==UserScript==
// @name         GM_fetch
// @description  GM_fetch
// @version      0.1.0b
// @license      MIT
// @namespace    https://github.com/stdai0a10
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/**
 *  @param {RequestInfo} input
 *  @param {RequestInit} init
 *  @returns {Promise<GM_Response>} extension of `Response`
 */
async function GM_fetch (input, init = null) { // eslint-disable-line
  class GM_Response extends Response { // eslint-disable-line camelcase
    constructor (body = null, init = null) {
      super(body, init);
      this._url = init && init.url ? init.url : super.url;
      this._redirected =
        init && init.redirected ? init.redirected : super.redirected;
      this._type = init && init.type ? init.type : super.type;
    }

    get url () { return this._url; }
    get redirected () { return this._redirected; }
    get type () { return this._type; }
  }

  function cvtHeaders (headers) {
    const h = {};
    for (const pair of headers.entries()) h[pair[0]] = pair[1];
    return h;
  }

  function parseHeaders (strHeaders) {
    const h = new Headers();
    strHeaders.trim().split('\r\n').forEach(line => {
      const i = line.indexOf(':');
      h.append(line.substr(0, i).trim(), line.substr(i + 1).trim());
    });
    return h;
  }

  const request = new Request(input, init);
  const data = ['head', 'get'].includes(request.method.toLowerCase())
    ? null
    : await request.blob();
  return new Promise(function (resolve, reject) {
    GM_xmlhttpRequest({
      method: request.method,
      url: request.url,
      headers: cvtHeaders(request.headers),
      data,
      binary: true,
      responseType: 'blob',
      onabort: () => reject(new DOMException('Aborted', 'AbortError')),
      onerror: (e) => reject(new TypeError(e?.statusText ?? 'fetch error')),
      ontimeout: () => reject(new TypeError('fetch timeout')),
      onload: function (resp) {
        const response = new GM_Response(resp.response, {
          status: resp.status,
          statusText: resp.statusText,
          headers: parseHeaders(resp.responseHeaders),
          url: resp.finalUrl,
          redirected: resp.finalUrl !== request.url.split('#')[0]
        });
        resolve(response);
      }
    });
  });
}
