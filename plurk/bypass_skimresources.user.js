// ==UserScript==
// @name         Plurk Bypass Skimresources
// @description  直接攔截 window.open，open，如果發現是導購網址，就還原成原始 URL
// @version      2026-03-21
// @license      MIT
// @icon         https://icons.duckduckgo.com/ip2/plurk.com.ico
// @match        https://www.plurk.com/*
// @exclude      https://www.plurk.com/_*
// @grant        none
// @run-at       document-start
// ==/UserScript==

/**
 * @reference https://www.plurk.com/p/3igkfyxm64
 */
(function () {
  'use strict';

  const originalOpen = window.open;

  window.open = function (url, target, features) {
    if (typeof url === 'string' && url.includes('l.plurk.com')) {
      const params = new URLSearchParams(url.split('?')[1]);
      const realUrl = params.get('url');
      if (realUrl) {
        return originalOpen(decodeURIComponent(realUrl), target, features);
      }
    }
    return originalOpen(url, target, features);
  };
})();
