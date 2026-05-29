/**
 *  隱藏 Google 搜尋結果中的 AI 摘要
 */
// ==UserScript==
// @name         No AI Summary
// @description  Hide AI Summary in search results
// @version      2025-09-01
// @license      MIT
// @homepage     https://github.com/stdai0a10
// @namespace    https://github.com/stdai0a10/userscripts/google
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.co
// @match        *://google.com/search?*
// @match        *://www.google.com/search?*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle(`
    #Odp5De { display: none !important;}
  `);
})();
