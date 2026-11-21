// ==UserScript==
// @name        Hide Extentions
// @description Hide extentions in Mobile View
// @version     0.1.0
// @license     MIT
// @namespace   stdai0a10.github.io/userscripts/threads
// @icon        https://static.cdninstagram.com/rsrc.php/yP/r/0Qa-AOmHi0c.ico
// @homepage    https://github.com/stdai0a10
// @match       https://www.threads.com/*
// @grant       GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  window.GM_addStyle(String.raw`
/* Hide "留友封" in mobile mode */
@media (max-width: 699px) {
  #hege-panel { display: none !important; }
  .hege-checkbox-container { display: none !important; }
}
/* Hide "Just Image & Video Downloader" in mobile mode */
@media (max-width: 699px) {
  .ig-download-btn { display: none !important; }
}
  `);
})();
