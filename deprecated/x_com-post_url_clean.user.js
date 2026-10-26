// ==UserScript==
// @name         X post clean
// @namespace    localhost
// @version      2025-08-22
// @description  clean
// @author       You
// @match        https://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  const P =
    /^(?:|https?:\/\/)(?:|mobile\.)(?:x|twitter|fxtwitter|vxtwitter).com\/(\w+|i\/web)\/status\/(\d+)[^\d].+/;

  const url = new URL(location.href);
  const match = url.toString().match(P);
  if (match) {
    const href = `https://x.com/${match[1]}/status/${match[2]}`;
    if (href !== url.toString()) {
      location.replace(href);
    }
  }
})();
