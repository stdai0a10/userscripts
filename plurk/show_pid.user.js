// ==UserScript==
// @name         Show PID
// @description  Show PID on URL
// @version      0.1.0a
// @license      MIT
// @homepage     https://github.com/stdai0a10
// @namespace    https://github.com/stdai0a10/userscripts/plurk
// @icon         https://icons.duckduckgo.com/ip2/plurk.com.ico
// @match        https://www.plurk.com/p/*
// @exclude      https://www.plurk.com/m/p/*
// @grant        none
// ==/UserScript==

/* jshint esversion: 11 */

(function () {
  'use strict';

  const pid = location.pathname.match(/^(\/m)?\/p\/(?<pid>[\w]+)/)?.groups.pid;

  if (pid) {
    const url = new URL(location.href);
    url.searchParams.set('pid', parseInt(pid, 36));
    window.history.replaceState(null, document.title, url);
  }
})();
