/**
 *  Plurk twimg fix
 *  用於噗浪的 userscript。
 *  當瀏覽器設置了追蹤保護時，將導致至部分圖片（如：pbs.twimg.com/*）載入失敗。
 *  此 userscript 可偵測並載入那些失敗的圖片。
 */
// ==UserScript==
// @name         Plurk twimg fix
// @description  An userscript to load twitter images in plurk.com if web browser is in tracking protection mode
// @version      0.4.6
// @license      MIT
// @namespace    https://github.com/stdai0a10
// @match        https://www.plurk.com/*
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
   *  @param {HTMLImageElement} img
   */
  function imgChecker (img) {
    if (img.classList.contains('checked')) return;
    img.classList.add('checked');
    const src = img.dataset.src || img.src;
    const load = function () {
      img.style.display = 'none';
      const disp = document.createElement('div');
      disp.style.whiteSpace = 'nowrap';
      try {
        img.parentElement.insertBefore(disp, img).innerHTML = 'Loading...';
      } catch {}
      getDataUri(src).then(uri => {
        disp.remove();
        img.classList.add('data-uri');
        img.style.display = null;
        img.dataset.srcset = uri;
        img.srcset = uri;
        img.onclick = e => {
          e.preventDefault();
          window.sessionStorage
            .setItem(STORAGE_NAME, JSON.stringify([src, uri]));
        };
      }).catch(e => { disp.innerHTML = src; });
    };

    img.onload = () => {};
    img.onerror = load;
    if ((img.classList.contains('lazyloaded') || img.complete) &&
        (img.srcset || img.src) &&
        img.naturalWidth === 0) {
      console.debug(`IMG "${src}" completed but get error`);
      load();
    }
  }

  /* .c-post__body__signature iframe */
  if (location.hostname === 'gc.bahamut.com.tw') {
    document.querySelectorAll('img').forEach(i => imgChecker(i));
    return;
  }

  /* .c-post */
  const STORAGE_NAME = 'img_uri';
  const IMG_SELECTORS = [
    '.c-section .c-post__body .photoswipe-image img',
    '.c-section .c-post__body .url-image img',
    '.c-reply .photoswipe-image img', // reply
    '.cbox .cbox_txt .photoswipe-image img', // mobile
    '.cbox .cbox_txt .url-image img', // mobile
    '.cbox .cbox_msg2 a img' // mobile-reply
  ];
  document.querySelectorAll(IMG_SELECTORS.join()).forEach(i => imgChecker(i));

  /* .pswp */
  const pswp = document.querySelector('.pswp');
  if (pswp) {
    const pswpContainer = pswp.querySelector('.pswp__container');
    const pswpBar = pswp.querySelector('.pswp__top-bar');
    const pswpWatcher = new MutationObserver(records => records.forEach(r => {
      if (!r.target.classList.contains('pswp__item')) return;
      r.addedNodes.forEach(pswpWrap => {
        setTimeout(() => {
          const a = pswpWrap.querySelector('.pswp__error-msg a');
          if (!a) return;
          // insert
          (new Promise((resolve, reject) => {
            const data = JSON.parse(window.sessionStorage.getItem(STORAGE_NAME));
            if (data[0] === a.href) resolve(data[1]);
            else resolve(getDataUri(a.href));
          })).then(uri => {
            pswpWrap.innerHTML = '';
            pswpWrap.style.transform = 'scale(0)';
            const div = pswpWrap.appendChild(document.createElement('div'));
            const img = pswpWrap.appendChild(document.createElement('img'));
            div.classList.add('pswp__img', 'pswp__img--placeholder',
              'pswp__img--placeholder--blank');
            div.style.display = 'none';
            img.onload = () => {
              const [iw, ih] = [img.naturalWidth, img.naturalHeight];
              const vw = pswpWrap.offsetWidth;
              const vh = pswpWrap.offsetHeight - pswpBar.offsetHeight;
              const s = Math.min(vw / iw, vh / ih);
              const sw = s < 1 ? parseInt(iw * s) : iw;
              const sh = s < 1 ? parseInt(ih * s) : ih;
              div.style.width = img.style.width = `${sw}px`;
              div.style.height = img.style.height = `${sh}px`;
              const tx = (vw - sw) / 2;
              const ty = (vh - sh) / 2 + pswpBar.offsetHeight;
              pswpWrap.style.transform = `translate3d(${tx}px, ${ty}px, 0px)`;
            };
            img.classList.add('pswp__img');
            img.src = uri;
          });
        }, 200);
      });
    }));
    pswpWatcher.observe(pswpContainer, { childList: true, subtree: true });
  }

  /* #editor */
  const editorWatcher = new MutationObserver(records => records.forEach(r => {
    r.addedNodes.forEach(n => {
      if (n.tagName === 'IMG') imgChecker(n);
      else if (n.nodeType === 1) {
        n.querySelectorAll('img').forEach(i => imgChecker(i));
      }
    });
  }));
  const editor = document.getElementById('editor');
  if (editor) {
    editorWatcher.observe(editor.contentWindow.document,
      { childList: true, subtree: true });
  }

  /* .uploadimage-url, #desktopPreview, #mobilePreview */
  (new MutationObserver(records => records.forEach(r => {
    r.addedNodes.forEach(n => {
      if (n.tagName === 'DIALOG') {
        const u = n.querySelector('.uploadimage-url');
        if (u) editorWatcher.observe(u, { childList: true, subtree: true });

        const dp = n.querySelector('#desktopPreview');
        if (dp) {
          dp.onload = () => {
            dp.contentWindow.document.querySelectorAll('img')
              .forEach(img => imgChecker(img));
          };
        }
        const mp = n.querySelector('#mobilePreview');
        if (mp) {
          mp.onload = () => {
            mp.contentWindow.document.querySelectorAll('img')
              .forEach(img => imgChecker(img));
          };
        }
      }
    });
  }))).observe(document.body, { childList: true });
})();
