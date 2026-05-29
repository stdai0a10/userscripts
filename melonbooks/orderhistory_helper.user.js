// ==UserScript==
// @name         Orderhistory Helper
// @description  Help to copy product names from order history
// @version      2025-12-01
// @license      MIT
// @homepage     https://github.com/stdai0a10
// @namespace    https://github.com/stdai0a10/userscripts/melonbooks
// @icon         https://icons.duckduckgo.com/ip2/melonbooks.co.jp.ico
// @match        https://www.melonbooks.co.jp/mypage/history.php
// @match        https://www.melonbooks.co.jp/mypage/history_detail.php
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const copyToClipboard = (text) => {
    console.debug(`Copied to clipboard: ${text}`);
    navigator.clipboard.writeText(text);
  };

  const selectors = '.history-detail .history-detail__products table th';
  document.querySelectorAll(selectors).forEach((th) => {
    th.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const td = th.nextElementSibling;
      switch (th.innerText) {
        case '商品名':
          copyToClipboard(td.innerText.trim());
          break;
        case '商品番号':
        case 'サークル':
          copyToClipboard(td.querySelector('a').href);
          break;
        case '価格(税込)':
          copyToClipboard(td.innerText.replace(/,/g, '').replace(/[^\d]/g, ''));
          break;
      }
    });
  });
})();
