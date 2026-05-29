/**
 *  PTT Twimg Fix
 *  用於 PTT 的 userscript。
 *  當瀏覽器設置了追蹤保護時，將導致至部分圖片（如：pbs.twimg.com/*）載入失敗。
 *  此 userscript 可偵測並載入那些失敗的圖片。
 *
 *  ※ PTT2 沒測試
 */
// ==UserScript==
// @name         PTT Twimg Fix
// @description  An userscript to load twitter images in ptt.cc if web browser is in tracking protection mode
// @version      0.3.0a
// @license      MIT
// @namespace    https://github.com/stdai0a10
// @match        https://iamchucky.github.io/PttChrome/*
// @match        https://term.ptt.cc
// @match        https://term.ptt2.cc
// @match        https://www.ptt.cc/bbs/*
// @match        https://www.ptt.cc/man/*
// @compatible   chrome Tampermonkey
// @compatible   firefox Tampermonkey
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      pbs.twimg.com
// @connect      imgur.com
// ==/UserScript==

/* jshint esversion: 6 */

(function () {
  'use strict';

  /**
   *  @param {RequestInfo} resource
   *  @param {RequestInit} init
   *  @returns {Promise<Response>}
   */
  async function GM_fetch (resource, init = null) { // eslint-disable-line
    function getFullHref (resource) {
      if (resource instanceof URL) resource = resource.href;
      else if (resource instanceof Request) resource = resource.url;
      const a = document.createElement('a');
      a.setAttribute('href', resource);
      return a.href;
    }
    function parseHeaders (strHeaders) {
      const h = new Headers();
      strHeaders.trim().split('\r\n').forEach(line => {
        const i = line.indexOf(':');
        h.append(line.substr(0, i).trim(), line.substr(i + 1).trim());
      });
      return h;
    }
    init = init || {};
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: init.method ? init.method : 'GET',
        url: getFullHref(resource),
        headers: init.headers,
        data: init.body,
        binary: init.body instanceof Blob,
        responseType: init.responseType,
        onabort: e => reject(e),
        onerror: e => reject(e),
        ontimeout: e => reject(e),
        onload: function (resp) {
          resp.ok = parseInt(resp.status / 100) === 2;
          resp.redirected = resp.finalUrl !== getFullHref(resource);
          resp.headers = parseHeaders(resp.responseHeaders);
          //
          resp.arrayBuffer = async function () {
            if (resp.responseType === 'arrayBuffer' && resp.response) {
              return resp.response;
            }
            throw new SyntaxError();
          };
          resp.blob = async function () {
            if (resp.responseType === 'blob' && resp.response) {
              return resp.response;
            }
            const t = resp.headers.get('content-type') || '';
            if (t.startsWith('text/')) {
              return new Blob([resp.responseText], { type: t });
            }
            throw new SyntaxError();
          };
          resp.json = async function () {
            if (resp.responseType === 'json' && resp.response) {
              return resp.response;
            } else { return JSON.parse(resp.responseText); }
          };
          resp.text = async function () { return resp.responseText; };
          resolve(resp);
        }
      });
    });
  }

  /**
   *  @param {RequestInfo} url
   *  @returns {Promise<string>}
   */
  async function getDataUri (url) {
    return fetch(url)
      .then(resp => {
        if (!resp.ok) throw new Error(resp.status);
        return resp;
      })
      .catch(e => GM_fetch(url, { responseType: 'blob' }))
      .then(resp => {
        if (!resp.ok) throw new Error(resp.status);
        return resp.blob();
      })
      .then(blob => {
        return new Promise(function (resolve, reject) {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.readAsDataURL(blob);
        });
      });
  }

  /**
   *  @param {string} selectors
   *  @param {HTMLElement} target
   *  @param {number} timeout
   *  @returns {Promise<HTMLElement>}
   */
  function getElementAsync (selectors, target, timeout = 100) {
    return new Promise((resolve, reject) => {
      const i = setTimeout(function () {
        stop();
        const el = target.querySelector(selectors);
        if (el) resolve(el);
        else reject(Error(`get "${selectors}" timeout`));
      }, timeout);
      const mo = new MutationObserver(r => r.forEach(mu => {
        const el = mu.target.querySelector(selectors);
        if (el) { stop(); resolve(el); }
      }));
      mo.observe(target, { childList: true, subtree: true });
      function stop () { clearTimeout(i); mo.disconnect(); }
    });
  }

  /* =============== PttChrome =============== */
  const RE_IMG_URL = /^https?:\/\/.+\.(jpg|png|gif|bmp)/i;
  let picPrevWatcher = null;
  if (location.hostname === 'term.ptt.cc') {
    picPrevWatcher = new MutationObserver(records => records.forEach(r => {
      const picPreview = document.getElementById('picPreview');
      if (r.target.id === 'mainContainer') {
        r.removedNodes.forEach(n => {
          if (n.classList.contains('glyphicon')) {
            setTimeout(function () {
              if (!r.target.querySelector('img') && picPreview.dataset.hover) {
                picPreview.style.display = 'block';
              }
            }, 765);
          }
        });
      }
      r.addedNodes.forEach(a => {
        if (a.tagName === 'A' && a.href.match(RE_IMG_URL)) {
          a.addEventListener('mouseover', function (e) {
            if (picPreview.dataset.src !== a.href) picPreview.src = a.href;
            picPreview.dataset.hover = 1;
            picPreview.style.left = `${e.clientX + 20}px`;
            picPreview.style.top = '20px';
          });
          a.addEventListener('mouseleave', function (e) {
            picPreview.removeAttribute('data-hover');
            picPreview.style.display = null;
          });
          a.addEventListener('mousemove', function (e) {
            const h = Math.min(window.innerHeight * 0.8, // max-height: 80%
              picPreview.naturalHeight || window.innerHeight - 40);
            let t = e.clientY + h / 2;
            t = t > h + 20 ? t : h + 20;
            t = t < window.innerHeight - 20 ? t : window.innerHeight - 20;
            picPreview.style.left = `${e.clientX + 20}px`;
            picPreview.style.top = `${t - h}px`;
          });
        }
      });
    }));
  }

  function makePicPreview () {
    GM_addStyle([
      '#picPreview {',
      ' position: absolute;',
      ' max-height: 80%;',
      ' max-width: 90%;',
      ' display: none;',
      ' z-index: 3;',
      '}'
    ].join('\r\n'));
    const img = document.createElement('img');
    img.id = 'picPreview';
    return img;
  }

  getElementAsync('#mainContainer', document.body, 500).then(container => {
    const picPreview = document.getElementById('picPreview') ||
      container.parentElement.appendChild(makePicPreview());
    picPreview.addEventListener('load', function () {
      if (!this.src.startsWith('data:')) this.dataset.src = '';
    });
    picPreview.addEventListener('error', function () {
      this.dataset.src = this.src;
      getDataUri(this.src).then(uri => { this.src = uri; });
    });
    if (picPrevWatcher) {
      picPrevWatcher.observe(container, { childList: true, subtree: true });
    }
  }).catch(() => {});

  /* =============== Web BBS =============== */
  if (location.hostname === 'www.ptt.cc') {
    document.body.querySelectorAll('.richcontent img').forEach(img => {
      console.debug(img);
      img.addEventListener('error', function () {
        this.dataset.src = this.src;
        getDataUri(this.src).then(uri => { this.src = uri; });
      });
    });
  }
})();
