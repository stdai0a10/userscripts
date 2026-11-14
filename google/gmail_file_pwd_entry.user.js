// ==UserScript==
// @name        Gmail File Password Entry
// @description Enter file password
// @version     0.1.0
// @namespace   stdai0a10.github.io/userscripts/google
// @homepage    https://github.com/stdai0a10
// @icon        https://icons.duckduckgo.com/ip2/google.com.ico
// @match       https://mail.google.com/mail/*
// @noframes
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  const menu = {
    commands: {},
    register: (name, callback, options = null) => {
      options = options ?? {};
      const accessKey = name.match(/\[(\w+)\]/);
      if (accessKey) {
        name = name.replace(/\[(\w+)\]/, '$1');
        options.accessKey = accessKey[1].toLowerCase();
      }
      options.id = menu.commands[name] ?? name;
      options.id = window.GM_registerMenuCommand(name, callback, options);
      menu.commands[name] = options.id;
    },
    unregister: (name) => {
      const cmds = Object.keys(menu.commands);
      console.debug(cmds);
      const names = name === '*' ? cmds : cmds.includes(name) ? [name] : [];
      names.forEach((name) => {
        window.GM_unregisterMenuCommand(menu.commands[name] ?? null);
        delete menu.commands[name];
      });
    },
    clear: () => menu.unregister('*')
  };
  const style = (obj) =>
    Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ') + ';';

  //  **************************************************

  const edit = () => {
    const cancelEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const newButton = (name, type, value) => {
      const b = document.createElement('button');
      b.setAttribute('type', type);
      b.setAttribute('value', value);
      b.textContent = name;

      return b;
    };
    const newInputGroup = (name = '', value = '') => {
      const g = document.createElement('div');
      g.setAttribute('style', style({ 'margin-bottom': '0.5em' }));

      g.appendChild(document.createElement('label'));
      g.lastElementChild.textContent = 'Name:';
      g.appendChild(document.createElement('input'));
      g.lastElementChild.setAttribute('name', 'pwd[][name]');
      g.lastElementChild.value = name;
      g.appendChild(document.createElement('label'));
      g.lastElementChild.textContent = 'Password:';
      g.appendChild(document.createElement('input'));
      g.lastElementChild.setAttribute('name', 'pwd[][value]');
      g.lastElementChild.setAttribute('type', 'password');
      g.lastElementChild.value = value;
      g.appendChild(newButton('–', 'button', 'rm'));
      g.appendChild(newButton('↑', 'button', 'up'));
      g.appendChild(newButton('↓', 'button', 'down'));

      for (const el of g.children) {
        if (el.tagName === 'INPUT') {
          el.setAttribute('style', style({ 'margin-right': '0.5em' }));
        } else if (el.tagName === 'BUTTON') {
          el.setAttribute(
            'style',
            style({ 'margin-left': '1px', 'min-width': '2em' })
          );
          let onclick = null;
          if (el.value === 'rm') {
            onclick = (e) => g.remove();
          } else if (el.value === 'up') {
            onclick = (e) => {
              const p = g.previousElementSibling;
              if (p) g.parentElement.insertBefore(g, p);
            };
          } else if (el.value === 'down') {
            onclick = (e) => {
              const n = g.nextElementSibling;
              if (n) g.parentElement.insertBefore(n, g);
            };
          }
          el.onclick = (e) => {
            cancelEvent(e);
            onclick?.();
          };
        }
      }

      return g;
    };

    const box = document.body.appendChild(document.createElement('div'));
    const boxStyle = style({
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'background-color': 'rgba(0,0,0,0.5)',
      'z-index': 99999
    });
    box.setAttribute('style', boxStyle);

    const form = box.appendChild(document.createElement('form'));
    const formStyle = style({ padding: '1em', 'background-color': '#fff' });
    form.setAttribute('style', formStyle);
    form.onsubmit = (e) => {
      cancelEvent(e);

      if (e.submitter.value === 'submit') {
        const data = new FormData(form);
        const name = data.getAll('pwd[][name]');
        const value = data.getAll('pwd[][value]');
        const passwords = name
          .map((n, i) => ({ name: n, value: value[i] }))
          .filter((p) => p.name && p.value);
        console.debug('passwords', passwords);
        console.debug('window.GM_setValue', window.GM_setValue);
        window.GM_setValue('passwords', passwords);
      }

      box.remove();
      reload();
    };

    const pwdGroup = form.appendChild(document.createElement('div'));
    const groupStyle = style({
      height: '500px',
      'overflow-y': 'scroll',
      'margin-bottom': '1em'
    });
    pwdGroup.setAttribute('style', groupStyle);
    const passwords = window.GM_getValue('passwords', []);
    if (!passwords.length) pwdGroup.appendChild(newInputGroup());
    passwords.forEach((pwd) => {
      pwdGroup.appendChild(newInputGroup(pwd.name, pwd.value));
    });

    const btnGroup = form.appendChild(document.createElement('div'));
    const s = btnGroup.appendChild(newButton('submit', 'submit', 'submit'));
    s.setAttribute('style', style({ 'margin-left': '0.5em', float: 'right' }));
    const c = btnGroup.appendChild(newButton('cancel', 'submit', 'cancel'));
    c.setAttribute('style', style({ 'margin-left': '0.5em', float: 'right' }));
    const a = btnGroup.appendChild(newButton('+', 'button', '+'));
    a.setAttribute('style', style({ 'min-width': '3em' }));
    a.onclick = (e) => {
      cancelEvent(e);
      pwdGroup.appendChild(newInputGroup());
    };
  };

  const reload = () => {
    menu.clear();

    window.GM_getValue('passwords', []).forEach((p, i) => {
      const name = `([${i + 1}]) ${p.name}`;
      menu.register(name, () => enter(p.value));
    });

    menu.register('Edit passwords', edit);
  };

  const enter = (value) => {
    const i = document.querySelector('input[name="file-password"]');
    if (i) {
      i.focus();
      i.value = value;
    }
  };

  reload();
})();
