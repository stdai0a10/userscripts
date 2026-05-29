// ==UserScript==
// @name         Orderhistory Helper
// @description  Help to navigate to product pages from order history
// @version      2025-12-01
// @license      MIT
// @homepage     https://github.com/stdai0a10
// @namespace    https://github.com/stdai0a10/userscripts/asobistore
// @icon         https://icons.duckduckgo.com/ip2/asobistore.jp.ico
// @match        https://shop.asobistore.jp/mypage/orderhistory/detail/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const navigateToProductPage = (text) => {
    const href = `https://shop.asobistore.jp/products/detail/${text}`;
    console.debug(`Navigating to: ${href}`);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
  };
  const copyToClipboard = (text) => {
    console.debug(`Copied to clipboard: ${text}`);
    navigator.clipboard.writeText(text);
  };

  const cells = document.querySelectorAll('table.cart_table td');
  [...cells].forEach((cell) => {
    cell.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (cell.classList.contains('td04')) {
        if (cell.hasAttribute('nowrap')) {
          navigateToProductPage(cell.innerText.trim());
        } else {
          copyToClipboard(cell.innerText.trim());
        }
      } else if (cell.classList.contains('td03')) {
        copyToClipboard(cell.innerText.replace(/,/g, '').replace(/[^\d]/g, ''));
      }
    });
  });
})();
