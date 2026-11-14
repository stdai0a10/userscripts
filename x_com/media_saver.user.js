// ==UserScript==
// @name        Media Saver
// @description Save media from tweets
// @version     0.1.2
// @license     MIT
// @homepage    https://github.com/stdai0a10
// @namespace   https://github.com/stdai0a10/userscripts/x_com
// @icon        https://icons.duckduckgo.com/ip2/x.com.ico
// @match       https://x.com/*
// @grant       GM_download
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// ==/UserScript==

/* jshint esversion: 11 */

(function () {
  'use strict';

  const P_URL_TWEET = /^https:\/\/(?:mobile\.|)x\.com\/(\w+)\/status\/(\d+)/;
  const P_URL_TWEET_MEDIA =
    /^https:\/\/(?:mobile\.|)x\.com\/(\w+)\/status\/(\d+)\/(\w+)\/(\d+)$/;
  const P_URL_MEDIA = /^(https?:\/\/.+)\?format=(\w+)&name=(\w+)$/;
  const P_URL_MEDIA_LEGACY = /^(https?:\/\/.+)\.(\w+)(?::(\w+)|)$/;
  const S_DIALOG = 'div.r-17gur6a[role="dialog"]';
  const S_DIALOG_MEDIA = '[role="dialog"] [data-testid="swipe-to-dismiss"]';
  const S_TWEET = '[data-testid="tweet"]:not(.r-1loqt21)';

  // ==========

  const download = window.GM_download; // eslint-disable-line
  const openInTab = window.GM_openInTab; // eslint-disable-line
  const registerMenuCommand = window.GM_registerMenuCommand; // eslint-disable-line

  const config = (key = null) => {
    const data = {
      enable_keyboard: true,
      name_format_animated_gif: '{user}-{id}-{index}-gif',
      name_format_photo: '{user}-{id}-{index}-photo',
      name_format_video: '{user}-{id}-{index}-video',
      zip: false
    };

    if (data[key] !== undefined) {
      return window.GM_getValue(key, data[key]);
    }

    for (const k in data) {
      data[k] = GM_getValue(k, data[k]);
    }

    return data;
  };

  const element = async (selectors, tries = 10, wait = 500) => {
    const node = document.querySelector(selectors);
    return node || !tries
      ? node
      : sleep(wait).then(() => element(selectors, tries - 1, wait));
  };

  const notice = (message) => alert(message);

  const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

  // ==========

  const openMedia = async () => {
    const media = [];

    const info = parseMediaInfoFromUrl();
    if (info) {
      if (info.type && info.index) {
        const data = await getDialogMediaData(info);
        if (data) {
          media.push(data);
        }
      } else {
        media.push(...(await getTweetMediaData(info)));
      }
    }

    if (media.length) {
      media.forEach((data) => {
        if (data.url) openInTab(data.url, { active: false });
      });
    } else {
      notice('No media found');
    }
  };

  const saveMedia = async () => {
    const media = [];

    const info = parseMediaInfoFromUrl();
    if (info) {
      if (info.type && info.index) {
        const data = await getDialogMediaData(info);
        if (data) {
          media.push(data);
        }
      } else {
        media.push(...(await getTweetMediaData(info)));
      }
    }

    if (media.length) {
      media.forEach((data) => {
        if (data.url) download(data.url, makeName(data));
      });
    } else {
      notice('No media found');
    }
  };

  const parseMediaInfoFromUrl = (url = null) => {
    url = url || location.href;

    const m = url.match(P_URL_TWEET_MEDIA) || url.match(P_URL_TWEET);
    if (!m) return null;

    const [_, user, id, t, i] = m; // eslint-disable-line
    const type = t ? t.toLowerCase() : null;
    const index = i ? parseInt(i) : null;
    return { user, id, index, type, url: null };
  };

  const getDialogMediaData = async (info) => {
    const dialog = await element(S_DIALOG);
    if (!dialog) return null;

    const media = getDialogMediaDataFromFiber(dialog);
    if (!media.length) {
      media.push(...getDialogMediaDataFromHtml(dialog));
    }

    const match = media.find(
      (m) => m.user === info.user && m.id === info.id && m.index === info.index
    );
    return match || null;
  };

  const getDialogMediaDataFromFiber = (dialog) => {
    const view = document.querySelector(S_DIALOG_MEDIA) ?? {};
    const fiber = Object.keys(view).find((k) => k.startsWith('__reactFiber$'));
    let data = view[fiber];
    while (data && !data.pendingProps?.mediaItems) {
      data = data.return;
    }
    const items = data?.pendingProps?.mediaItems || [];
    return items.filter((i) => i.expanded_url).map(convertFiberMediaItem);
  };

  const getDialogMediaDataFromHtml = (dialog) => {
    const info = parseMediaInfoFromUrl();
    return [...document.querySelectorAll(S_DIALOG_MEDIA)]
      .filter((item) => !item.querySelector('img[alt=placeholder]'))
      .map((item, index) => {
        const media = item.querySelector('img');
        const data = { ...info };
        data.url = media ? convertPhotoUrl(media.src) : null;
        data.index = index + 1;
        data.type = 'photo';
        return data;
      });
  };

  const getTweetMediaData = async (info) => {
    const tweet = await element(S_TWEET);
    const media = getTweetMediaDataFromFiber(tweet);

    if (!media.length) {
      media.push(...getTweetMediaDataFromHtml(tweet));
    }

    return media.filter((m) => m.id === info.id);
  };

  const getTweetMediaDataFromFiber = (tweet) => {
    tweet = tweet.querySelector('article') || tweet;
    const fiber = Object.keys(tweet).find((k) => k.startsWith('__reactFiber$'));
    let data = tweet[fiber];
    while (data && !data.pendingProps?.tweet) {
      data = data.return;
    }
    data = data?.pendingProps?.tweet || null;
    const items = data?.extended_entities?.media || data?.entities?.media || [];
    return items.map(convertFiberMediaItem);
  };

  const getTweetMediaDataFromHtml = (tweet) => {
    return [...tweet.querySelectorAll('a')]
      .map((a) => {
        const info = parseMediaInfoFromUrl(a.href);
        if (info) {
          if (info.type === 'photo') {
            const url = a.querySelector('img')?.src || null;
            info.url = url ? convertPhotoUrl(url) : null;
          }
        }
        return info;
      })
      .filter((i) => i);
  };

  const convertFiberMediaItem = (item) => {
    const info = parseMediaInfoFromUrl(`https://x.com${item.expanded_url}`);
    // type
    info.type = item.type;
    // url
    if (item.type === 'photo') {
      info.url = convertPhotoUrl(item.media_url_https);
    } else if (item.type === 'video' || item.type === 'animated_gif') {
      const video = [...item.video_info.variants].reduce((p, c) =>
        (p?.bitrate || 0) > (c?.bitrate || 0) ? p : c
      );
      info.url = video.url || null;
    }

    return info;
  };

  const convertPhotoUrl = (url) => {
    const m = url.match(P_URL_MEDIA) || url.match(P_URL_MEDIA_LEGACY);
    return m ? `${m[1]}?format=${m[2]}&name=orig` : '';
  };

  const makeName = (data) => {
    let name = config(`name_format_${data.type}`) || 'tweet {id}-{index}';

    for (const key in data) {
      name = name.replaceAll(`{${key}}`, data[key]);
    }

    if (data.type === 'photo') {
      const m =
        data.url.match(P_URL_MEDIA) || data.url.match(P_URL_MEDIA_LEGACY);
      return `${name}.${m[2]}`;
    } else if (data.type === 'animated_gif' || data.type === 'video') {
      return `${name}.mp4`;
    } else {
      return name;
    }
  };

  // ==========

  registerMenuCommand('Open Media in New Tab', openMedia);
  registerMenuCommand('Save Media', saveMedia);

  document.addEventListener('keydown', (e) => {
    let action = null;

    if (e.altKey && e.key === 'o') {
      action = openMedia;
    } else if (e.altKey && e.key === 's') {
      action = saveMedia;
    }

    if (action && config('enable_keyboard')) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(action, 0, e);
    }
  });
})();
