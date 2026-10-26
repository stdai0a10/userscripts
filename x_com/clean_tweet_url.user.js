// ==UserScript==
// @name        Clean Tweet URL
// @description Clean tweet URL
// @version     0.3.0
// @license     MIT
// @homepage    https://github.com/stdai0a10
// @namespace   https://github.com/stdai0a10/userscripts/x_com
// @icon        https://icons.duckduckgo.com/ip2/x.com.ico
// @match       *://x.com/*
// @match       *://mobile.x.com/*
// @match       *://twitter.com/*
// @match       *://mobile.twitter.com/*
// @match       *://fxtwitter.com/*
// @match       *://vxtwitter.com/*
// @match       *://fixupx.com/*
// @match       *://fixvx.com/*
// @match       *://foxvx.com/*
// @run-at      document-start
// @noframes
// @grant       none
// ==/UserScript==

/* jshint esversion: 11 */

(function () {
  'use strict';

  const tweet = window.location.pathname.match(/^\/(\w+|i\/web)\/status\/\d+/);
  const dirty =
    tweet &&
    (window.location.pathname !== tweet[0] ||
      window.location.search ||
      window.location.hash);

  if (dirty) {
    const url = `https://${window.location.host}${tweet[0]}`;
    if (window.history === undefined) window.location.replace(url);
    else window.history.replaceState(null, document.title, url);
  }
})();
