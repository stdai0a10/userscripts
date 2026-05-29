// ==UserScript==
// @name         Plurk Image Downloader
// @name:zh-TW   噗浪圖片下載工具
// @description  Simple image download tool
// @description:zh-TW  簡易下載工具
// @version      0.1.0a
// @license      MIT
// @homepage     https://github.com/stdai0a10
// @namespace    https://github.com/stdai0a10/userscripts/plurk
// @icon         https://icons.duckduckgo.com/ip2/plurk.com.ico
// @match        https://www.plurk.com/*
// @exclude      https://www.plurk.com/_*
// @grant        GM_addStyle
// @grant        GM_download
// ==/UserScript==

/* jshint esversion: 11 */

(function () {
  'use strict';

  const GM_addStyle = window.GM_addStyle; // eslint-disable-line
  const GM_download = window.GM_download; // eslint-disable-line

  const dirname = (path) => {
    path = path.substring(0, 1) + path.substring(1).replace(/\/+$/gm, '');
    const i = path.lastIndexOf('/');
    return i ? path.substring(0, i) : '/';
  };
  const basename = (path) => {
    const i = path.lastIndexOf('/');
    return i < 0 ? path : path.substring(i + 1);
  };
  const splitext = (path) => {
    const b = basename(path);
    const i = b.lastIndexOf('.');
    path = dirname(path) + (i > 0 ? b.substring(0, i) : b);
    return i > 0 ? [path, b.substring(i)] : [path, ''];
  };

  const sleep = async (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

  const download = async (href, download = null) => {
    GM_download(href, download);
  };

  const checkEventIsOnElement = (e, elt, pseudoElt = null) => {
    const inRect = (rect) => e.y >= rect.top && e.x >= rect.left && e.y <= rect.bottom && e.x <= rect.right;
    const eltRect = elt.getBoundingClientRect();

    if (!inRect(eltRect)) {
      return false;
    } else if (!pseudoElt) {
      return true;
    }

    const style = window.getComputedStyle(e.target, '::after');
    const pseudoRect = {
      top: eltRect.top + parseFloat(style.top),
      left: eltRect.left + parseFloat(style.left),
      right: eltRect.left + parseFloat(style.left) + parseFloat(style.width),
      bottom: eltRect.top + parseFloat(style.top) + parseFloat(style.height),
      width: parseFloat(style.width),
      height: parseFloat(style.height)
    };

    return inRect(pseudoRect);
  };

  const styles = [];
  const callables = [];

  styles.push(String.raw`
    .pop-window-content .cbox_left .img-holder::after {
      content: "DL";
      display: block;
      color: white;
      background: DeepSkyBlue;
      position: absolute;
      top: 10px;
      right: 10px;
      border-radius: 5px;
      padding: 2px 6px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .pop-window-content .cbox_left .img-holder:hover::after {
      opacity: .33;
    }
  `);
  callables.push(() => {
    const querySelector = async (selectors, retry = 10) => {
      const node = document.querySelector(selectors);
      return node ?? sleep(100).then(() => querySelector(selectors, retry - 1));
    };

    querySelector('.pop-window-content .cbox_left').then((cboxLeft) => {
      cboxLeft.addEventListener('mousemove', (e) => {
        if (checkEventIsOnElement(e, e.target, '::after')) {
          // TODO: hover effect
        }
      });
      cboxLeft.addEventListener('click', (e) => {
        // if (window.getComputedStyle(e.target, '::after').content !== '"DL"') {
        //   return;
        // }
        if (!checkEventIsOnElement(e, e.target, '::after')) {
          return;
        }

        const curr = document.querySelector(
          '.pop-window-content .cbox_right a.ex_link.pictureservices.cbox-current-target'
        );
        const idx = Array.from(
          curr?.parentElement.querySelectorAll('a.ex_link.pictureservices') ??
            []
        ).indexOf(curr);
        let plurk = curr;
        while (plurk && !plurk.classList.contains('plurk')) {
          plurk = plurk.parentElement;
        }

        if (plurk) {
          const pid = plurk.dataset.pid;
          const rid = plurk.dataset.rid;
          const name =
            `plurk ${pid}` +
            (rid ? `-r${rid}` : '') +
            `-${idx + 1}` +
            splitext(curr.href)[1];
          download(curr.href, name);
        }
      });
    });
  });

  GM_addStyle(styles.join('\n'));
  callables.forEach((callable) => {
    setTimeout(() => callable(), 0);
  });
})();
