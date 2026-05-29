// ==UserScript==
// @name         Clear View
// @description  Clear View for Outlook Web
// @version      2025-08-24
// @license      MIT
// @homepage     https://github.com/stdai0a10
// @namespace    https://github.com/stdai0a10/userscripts/outlook
// @icon         https://icons.duckduckgo.com/ip2/live.com.ico
// @match        https://outlook.live.com/mail/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  const style = String.raw`
    #MainModule .LBktY > .GssDD { display: none !important }
    /* .yg0l0, .cbNn0, { font-weight: 900; background-color: var(--themeLighter);} */
    .DLvHz { background-color: var(--messageWebWarning) !important }
  `;

  GM_addStyle(style);
})();
