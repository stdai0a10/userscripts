// ==UserScript==
// @name        Mute Plurk
// @description Mute posts containing specified keywords
// @version     0.1.0b
// @license     MIT
// @homepage    https://github.com/stdai0a10
// @namespace   https://github.com/stdai0a10/userscripts/plurk
// @icon        https://icons.duckduckgo.com/ip2/plurk.com.ico
// @match       https://www.plurk.com/*
// @exclude     https://www.plurk.com/_*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// ==/UserScript==

/* jshint esversion: 11 */

(function () {
  'use strict';

  const GM_getValue = window.GM_getValue; // eslint-disable-line
  const GM_setValue = window.GM_setValue; // eslint-disable-line
  const GM_registerMenuCommand = window.GM_getValue; // eslint-disable-line
  const GLOBAL = window.GLOBAL; // eslint-disable-line

  const sleep = (t) => new Promise((resolve) => setTimeout(resolve, t));

  const getSettings = function () {
    const settings = {
      mute_anonymous: GM_getValue('mute_anonymous'),
      mute_porn: GM_getValue('mute_porn'),
      mute_kw: GM_getValue('mute_kw'),
      mute_keywords: GM_getValue('mute_keywords')
    };

    if (settings.mute_anonymous === undefined) {
      settings.mute_anonymous = false;
      GM_setValue('mute_anonymous', false);
    }
    if (settings.mute_porn === undefined) {
      settings.mute_porn = false;
      GM_setValue('mute_porn', false);
    }
    if (settings.mute_kw === undefined) {
      settings.mute_kw = false;
      GM_setValue('mute_kw', false);
    }
    if (settings.mute_keywords === undefined) {
      settings.mute_keywords = '';
      GM_setValue('mute_keywords', '');
    }

    console.debug('mute settings =', settings);
    return settings;
  };

  const setSettings = function (settings = {}) {
    console.debug(settings);
    for (const k in settings) {
      GM_setValue(k, settings[k]);
    }
  };

  const getMuteKeywords = function (settings = null) {
    settings = settings || getSettings();
    return (settings.mute_kw ? settings.mute_keywords : '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s);
  };

  const getPathname = function () {
    const pathname = window.location.pathname;
    return pathname.startsWith('/m/') ? pathname.substring(2) : pathname;
  };

  const findHolder = async function (selectors) {
    console.debug(`Try to find ${selectors} ...`);
    const holder = document.body.querySelector(selectors);
    return holder || sleep(1000).then(findHolder);
  };

  const handleSettingsHolder = async function (settingHolder) {
    const settingHtml = String.raw`
<div style="margin-top: 30px"></div>
<div class="mute form-msg-holder"></div>
<div class="mute form-holder auto-mobile">
  <form id="mute-timeline-form">
    <div class="form">
      <div class="form-table">
        <div class="form-item">
          <div class="desc">Mute the following plurks on my timeline:</div>
          <div class="form-control" style="padding-left: 8px">
            <div class="checkbox-holder">
              <input
                type="checkbox"
                id="mute_anonymous"
                name="mute_anonymous"
              />
              <label for="mute_anonymous">Anonymous plurks (whispers)</label>
            </div>
            <br />
            <div class="checkbox-holder">
              <input
                type="checkbox"
                id="mute_porn"
                name="mute_porn"
              />
              <label for="mute_porn">Adult plurks (R18/NC17/NSFW/Pornography)</label>
            </div>
            <br />
            <div class="checkbox-holder" style="display: block">
              <input type="checkbox" id="mute_kw" name="mute_kw" />
              <label for="mute_kw"
                >Plurks containing specified keywords (separated by a
                comma)</label
              >
              <div
                class="input-holder"
                style="
                  display: block;
                  width: auto;
                  max-width: 400px;
                  margin: 2px 0 0 22px;
                "
              >
                <input id="mute_keywords" type="text" name="mute_keywords" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="form">
      <div class="form-item">
        <div class="form-control">
          <div class="submit-holder">
            <input type="submit" value="Save changes" name="save" />
          </div>
        </div>
      </div>
    </div>
  </form>
</div>
    `;
    const successHtml = String.raw`<div class="noti-msg success">Settings has been updated<span class="close pif-cancel"></span></div>`;

    const isTimeline = () => getPathname() === '/settings/timeline';
    const injectSettings = () => {
      if (settingHolder.querySelector('#mute-timeline-form')) {
        return;
      }

      const settings = getSettings();

      settingHolder.insertAdjacentHTML('beforeend', settingHtml);
      const form = settingHolder.querySelector('#mute-timeline-form');
      form.querySelector('#mute_anonymous').checked = settings.mute_anonymous;
      form.querySelector('#mute_porn').checked = settings.mute_porn;
      form.querySelector('#mute_kw').checked = settings.mute_kw;
      form.querySelector('#mute_keywords').value = settings.mute_keywords;
      form.onsubmit = (e) => {
        e.preventDefault();

        const formdata = new FormData(form);
        setSettings({
          mute_anonymous: formdata.has('mute_anonymous'),
          mute_porn: formdata.has('mute_porn'),
          mute_kw: formdata.has('mute_kw'),
          mute_keywords: formdata.get('mute_keywords') || ''
        });

        const msgHolder = document.querySelector('.mute.form-msg-holder');
        const setMsg = (html) => {
          msgHolder.innerHTML = html;
        };
        setMsg(successHtml);
        msgHolder.querySelector('span').onclick = () => setMsg('');
      };
    };

    const observer = new MutationObserver((rs) => {
      console.debug(rs);
      if (isTimeline()) {
        observer.disconnect();
        injectSettings();
        observer.observe(settingHolder, { childList: true });
      }
    });
    observer.observe(settingHolder, { childList: true });

    if (isTimeline()) {
      injectSettings();
    }
  };

  const handleTimelineHolder = async function (timelineHolder) {
    const settings = getSettings();
    const keywords = getMuteKeywords(settings);
    const observer = new MutationObserver((records) => {
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (
            node.classList.contains('plurk') &&
            node.dataset.type === 'plurk'
          ) {
            handlePlurk(node);
          }
        })
      );
    });
    const handlePlurk = (plurk) => {
      if (!isMutedPlurk(plurk)) {
        const mute =
          (settings.mute_anonymous && isAnonymousPlurk(plurk)) ||
          (settings.mute_porn && isPornPlurk(plurk)) ||
          isPlurkContainAnyKeywords(plurk, keywords);
        if (mute) mutePlurk(plurk);
      }
    };

    const cnt = timelineHolder.querySelector('#timeline_cnt > .block_cnt');
    if (cnt) {
      observer.observe(cnt, { childList: true });

      sleep(1000).then(() => {
        const plurks = cnt.querySelectorAll('.plurk[data-type="plurk"]');
        plurks.forEach((plurk) => handlePlurk(plurk));
      });
    } else {
      console.warn('missing #timeline_cnt');
    }
  };

  const isAnonymousPlurk = (plurk) => plurk.dataset.uid === '99999';
  const isMutedPlurk = (plurk) => plurk.classList.contains('muted');
  const isPornPlurk = (plurk) => plurk.classList.contains('porn');
  const isReplurk = (plurk) => plurk.querySelector('a.name[data-uid]') > 1;

  const isPlurkContainAnyKeywords = function (plurk, keywords) {
    const holder = isReplurk(plurk)
      ? plurk.querySelector('.plurk_cnt .text_holder .text_holder')
      : plurk.querySelector('.plurk_cnt .text_holder');
    const text = holder?.innerText || '';
    return keywords.some((k) => text.includes(k));
  };

  const mutePlurk = async function (plurk, mute = true) {
    console.debug(`mute plurk-${plurk.dataset.pid}`);

    const muted = isMutedPlurk(plurk);

    if (mute !== muted) {
      const btn = plurk.querySelector('a.pif-volume.mute');
      if (btn) {
        btn.click();
      } else {
        mute ? plurk.classList.add('muted') : plurk.classList.remove('muted');

        const url = 'https://www.plurk.com/TimeLine/setMutePlurk';
        const headers = { 'Content-Type': 'application/json' };
        const body = JSON.stringify({
          plurk_id: plurk.dataset.pid,
          value: mute ? '2' : '0',
          form_token: GLOBAL.session_user.token
        });
        return fetch(url, { method: 'POST', headers, body });
      }
    }
  };

  const pathname = getPathname();
  if (pathname.startsWith('/settings/')) {
    findHolder('#setting-holder').then(handleSettingsHolder);
  } else if (!pathname.startsWith('/p/')) {
    findHolder('#timeline_holder').then(handleTimelineHolder);
  }
})();
