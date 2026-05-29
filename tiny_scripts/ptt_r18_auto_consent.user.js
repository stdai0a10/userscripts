/**
 *  Skip PTT Over18 Check
 *  用於 PTT Web BBS 的 userscript。
 *  跳過（自動同意）PTT 網頁內容分級警告。
 */
// ==UserScript==
// @name         Skip PTT Over18 Check
// @name:zh-tw   跳過 PTT 網頁內容分級警告
// @description  Skip (auto consent) over18 check in www.ptt.cc web bbs
// @description:zh-tw   跳過（自動同意）PTT 網頁內容分級警告
// @version      0.1.1
// @license      MIT
// @namespace    https://github.com/stdai0a10
// @match        https://www.ptt.cc/ask/over18?*
// @grant        none
// ==/UserScript==

(function () {
  const pttForm = document.getElementsByTagName('FORM')[0];
  const x = document.createElement('INPUT');
  x.setAttribute('type', 'hidden');
  x.name = 'yes';
  x.value = 'yes';
  pttForm.appendChild(x);
  pttForm.submit();
})();
