// ==UserScript==
// @name         Highlight Visited Artworks
// @namespace    localhost
// @version      2026-04-16
// @description  Modify CSS for visited artworks
// @match        https://www.pixiv.net/*
// @icon         https://icons.duckduckgo.com/ip2/pixiv.net.ico
// @noframes
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

/* jshint esversion: 11 */

(function () {
  'use strict';

  const registerMenuCommand = function (cmd, callback) {
    if (typeof registerMenuCommand.commands === 'undefined') {
      registerMenuCommand.commands = {};
    }

    const id = registerMenuCommand.commands[cmd] ?? null;
    if (id !== null) {
      GM_unregisterMenuCommand(id);
      delete registerMenuCommand.commands[cmd];
    }

    if (callback !== null) {
      const options = { id: cmd, autoClose: false };
      registerMenuCommand.commands[cmd] = GM_registerMenuCommand(
        cmd,
        callback,
        options
      );
    }

    console.debug(`registerMenuCommand('${cmd}', f)`);
    console.debug(registerMenuCommand.commands);
  };

  const toggleArtworksVisited = function () {
    if (!toggleArtworksVisited.css) {
      toggleArtworksVisited.css = GM_addStyle(String.raw`
        /* thumbnail */
        #__next .__top_side_menu_body section ul li:not(:has(label)) a[data-gtm-user-id]::after,
        #__next .__top_side_menu_body [data-ga4-label="works_content"] [data-ga4-entity-id] a[data-gtm-user-id]::after
        {
          content: "";
          position: absolute;
          display: block;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid rgb(255, 64, 96);
          border-radius: 8px;
        }
        #__next .__top_side_menu_body section ul li:not(:has(label)) a[data-gtm-user-id]:visited::after,
        #__next .__top_side_menu_body [data-ga4-label="works_content"] [data-ga4-entity-id] a[data-gtm-user-id]:visited::after
        { border-color: var(--charcoal-background1) }
        /* text */
        #__next .__top_side_menu_body section ul li:not(:has(label)) a[href^="/artworks"]:not(:has(*)),
        #__next .__top_side_menu_body [data-ga4-label="works_content"] [data-ga4-entity-id] a[href^="/artworks"]:not(:has(*))
        { text-decoration: underline }
        #__next .__top_side_menu_body section ul li:not(:has(label)) a:not(:has(*)):visited,
        #__next .__top_side_menu_body [data-ga4-label="works_content"] [data-ga4-entity-id] a:not(:has(*)):visited
        { text-decoration-color: var(--charcoal-background1) }
        /* Premium */
        #__next .__top_side_menu_body section aside ul li:not(:has(label)) a[data-gtm-user-id]::after { border-radius: 4px }
        #__next .__top_side_menu_body section a[aria-label~=Premium] { display: none !important }
      `);
    } else {
      toggleArtworksVisited.css.remove();
      toggleArtworksVisited.css = null;
    }
    console.debug('Toggle Visited', toggleArtworksVisited.css);
  };

  const observe = (() => {
    const observe = new MutationObserver((rs) =>
      rs.forEach((record) => {
        record.addedNodes.forEach((node) => {
          Object.getOwnPropertyNames(observe.handleAdded).forEach(
            (selectors) => {
              (node.querySelectorAll
                ? [node, ...node.querySelectorAll(selectors)]
                : [node]
              ).forEach((selected) => {
                if (
                  selected.matches &&
                  selected.matches(selectors) &&
                  observe.handleAdded[selectors]
                ) {
                  observe.handleAdded[selectors](selected);
                }
              });
            }
          );
        });
        record.removedNodes.forEach((node) => {
          Object.getOwnPropertyNames(observe.handleRemoved).forEach(
            (selectors) => {
              if (
                node.matches &&
                node.matches(selectors) &&
                observe.handleRemoved[selectors]
              ) {
                observe.handleRemoved[selectors](node);
              }
            }
          );
        });
      })
    );
    observe.handleAdded = {};
    observe.handleRemoved = {};
    observe.observe(document.body, { subtree: true, childList: true });

    return observe;
  })();

  toggleArtworksVisited();
  registerMenuCommand('Switch Visited View', (e) => toggleArtworksVisited());

  observe.handleAdded['section.icUpwV'] = (node) => {
    GM_addStyle(String.raw`
    .gDyRGW { display:none !important }
    .kcjYGd { mask: initial !important }
    `);
    delete observe.handleAdded['section.icUpwV'];
  };
})();
