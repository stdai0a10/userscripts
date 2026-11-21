// ==UserScript==
// @name        Disable Spoiler
// @description Disable content spoiler
// @version     2026-06-04
// @license     MIT
// @homepage    https://github.com/stdai0a10
// @namespace   https://github.com/stdai0a10/userscripts/threads
// @icon        https://static.cdninstagram.com/rsrc.php/yP/r/0Qa-AOmHi0c.ico
// @match       https://www.threads.com/*
// @grant       GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  /* text */
  window.GM_addStyle(String.raw`
    [data-text-fragment="spoiler"] {
      background-color: var(--barcelona-secondary-text-loading);
    }
    [data-text-fragment="spoiler"] .xg01cxk:not(#\#):not(#\#):not(#\#) {
      opacity: 1 ! important;
    }
    canvas.x1hc1fzr:not(#\#):not(#\#):not(#\#) {
      opacity: 0 ! important;
    }
  `);

  /* img & video */
  window.GM_addStyle(String.raw`
    .x4zgh4k:not(#\#):not(#\#):not(#\#) {
      transform: scale(1) ! important;
    }
    .x1hedwgd:not(#\#):not(#\#):not(#\#) {
      -webkit-filter: none ! important;
      filter: none ! important;
    }
  `);
})();
