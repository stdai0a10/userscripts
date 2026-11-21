// ==UserScript==
// @name        Hide x1n2onr6
// @description Hide x1n2onr6
// @version     2026-09-04
// @license     MIT
// @homepage    https://github.com/stdai0a10
// @namespace   https://github.com/stdai0a10/userscripts/threads
// @icon        https://icons.duckduckgo.com/ip2/threads.com.ico
// @match       https://www.threads.com/*
// @grant       GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  window.GM_addStyle(String.raw`
    body > div.x1n2onr6.xzkaem6 > div.x9f619.x1n2onr6.x1ja2u2z > div.xg6iff7
    {
      display: none;
    }
  `);
})();
