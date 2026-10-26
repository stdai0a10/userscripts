// ==UserScript==
// @name        No Navigator Share
// @description Disable Web Share API
// @version     0.1.0
// @license     MIT
// @homepage    https://github.com/stdai0a10
// @namespace   https://github.com/stdai0a10/userscripts/x_com
// @icon        https://icons.duckduckgo.com/ip2/x.com.ico
// @match       *://x.com/*
// @match       *://mobile.x.com/*
// @run-at      document-start
// @noframes
// @grant       none
// ==/UserScript==

window.navigator.share = null;
