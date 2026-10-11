// ==UserScript==
// @name        Missing Bookmarks Helper
// @description Show ID of missing artworks
// @version     0.1.3
// @license     MIT
// @homepage    https://github.com/stdai0a10
// @namespace   https://github.com/stdai0a10/userscripts/pixiv
// @match       https://www.pixiv.net/*
// @icon        https://icons.duckduckgo.com/ip2/pixiv.net.ico
// @noframes
// @grant       none
// ==/UserScript==

(function () {
  'use strict';

  const P_BOOKMARKS = /^\/users\/(\d+)\/bookmarks\/artworks(\/.+)?/;
  const P_ARTWORK = /^\/artworks\/(\d+)/;
  const S_ARTWORK_LIST = '#__next section div ul';

  const element = async (selectors, tries = 10, wait = 500) => {
    --tries;
    const node = document.querySelector(selectors);
    return node || !tries
      ? node
      : sleep(wait).then(() => element(selectors, tries, wait));
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handlePageChanged = () => {
    console.debug(`title = "${document.title}"`);

    artworkContainerObserver.disconnect();
    missingArtworksObserver.disconnect();

    const bookmarks = location.pathname.match(P_BOOKMARKS);
    if (bookmarks) {
      const tag = bookmarks[2] ? decodeURI(bookmarks[2]).slice(1) : '';
      console.debug(`bookmarks: ${tag}`);

      element(S_ARTWORK_LIST).then((container) => {
        if (container) {
          artworkContainerObserver.observe(container);
          missingArtworksObserver.observe(container, { childList: true });
          checkMissingArtworks(container);
        }
      });
    }
  };

  const checkMissingArtworks = async (container) => {
    container.querySelectorAll('li').forEach((artwork) => {
      if (!artwork.querySelector('a')) {
        const title = artwork.querySelector('span[to]');
        if (title) {
          const id = title.getAttribute('to').match(P_ARTWORK)?.[1];
          title.innerText = id || '-----';
        }
      }
    });
  };

  const missingArtworksObserver = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'childList' && record.addedNodes.length) {
        checkMissingArtworks(record.target);
      }
    }
  });

  const artworkContainerObserver = new IntersectionObserver(
    (entries) => (entries[0].intersectionRatio > 0 ? 1 : handlePageChanged()),
    { root: document.querySelector('html') }
  );

  element('head title', 0).then((title) => {
    const m = new MutationObserver(handlePageChanged);
    m.observe(title, { childList: true });
    handlePageChanged();
  });
})();
