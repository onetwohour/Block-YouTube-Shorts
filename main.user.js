// ==UserScript==
// @name         Block Youtube Shorts
// @namespace    https://github.com/onetwohour/Block-YouTube-Shorts
// @updateURL    https://github.com/onetwohour/Block-YouTube-Shorts/raw/refs/heads/main/main.user.js
// @downloadURL  https://github.com/onetwohour/Block-YouTube-Shorts/raw/refs/heads/main/main.user.js
// @version      1.0.0
// @description  Protect from brain breaker
// @match        *://*.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @require      https://github.com/onetwohour/Block-YouTube-Shorts/raw/refs/heads/main/lang.js
// ==/UserScript==

(() => {
  'use strict';

  const PREFIX = 'prn_';
  const INIT_CONFIG = {
    home: true,
    subs: true,
    feeds: true,
    recommend: true,
    channel: true,
    search: true,
    redirect: true,
    scrollLock: true,
    sidebar: true
  };

  function detectLang() {
    const saved = GM_getValue('userLang');
    if (saved && window.LANGS[saved]) return saved;
    const nav = (navigator.language || 'en').slice(0,2).toLowerCase();
    return window.LANGS[nav] ? nav : 'en';
  }
  const UI_LABEL = window.LANGS[detectLang()];

  const config = {};
  for (const key in INIT_CONFIG) config[key] = GM_getValue(PREFIX + key, INIT_CONFIG[key]);

const PATTERN = {
  home: /^https?:\/\/(?:www\.|m\.)?youtube\.com\/?$/,
  subs: /^https?:\/\/(?:www\.|m\.)?youtube\.com\/feed\/subscriptions\/?$/,
  feeds: /^https?:\/\/(?:www\.|m\.)?youtube\.com\/(?:feed|gaming)(?!\/subscriptions).*$/,
  watch: /^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch.*$/,
  shorts: /^https?:\/\/(?:www\.|m\.)?youtube\.com\/shorts.*$/,
  channel: /^https?:\/\/(?:www\.|m\.)?youtube\.com\/(?!feed|watch|shorts|playlist|podcasts|gaming|results).+$/,
  search: /^https?:\/\/(?:www\.|m\.)?youtube\.com\/results.*$/
};

  function shouldHideCSS() {
    const u = location.href;
    if (PATTERN.shorts.test(u)) return false;
    if (PATTERN.home.test(u)) return config.home;
    if (PATTERN.subs.test(u)) return config.subs;
    if (PATTERN.feeds.test(u)) return config.feeds;
    if (PATTERN.channel.test(u)) return config.channel;
    if (PATTERN.search.test(u)) return config.search;
    if (PATTERN.watch.test(u)) return config.recommend;
    return false;
  }

  function updateStyleSheet() {
    const id = 'prn-css';
    let prev = document.getElementById(id);
    let cssText = "";

    if (config.sidebar) {
      cssText += `.yt-simple-endpoint[title="Shorts"] { display: none !important; }\n`;
      cssText += `ytm-pivot-bar-item-renderer:has(> .pivot-bar-item-tab.pivot-shorts) { display: none !important; }\n`;
    } else {
      cssText += `.yt-simple-endpoint[title="Shorts"] { display: revert !important; }\n`;
      cssText += `ytm-pivot-bar-item-renderer:has(> .pivot-bar-item-tab.pivot-shorts) { display: revert !important; }\n`;
    }
    
    if (shouldHideCSS()) {
      const baseSelectors = [
        // PC
        'ytd-reel-shelf-renderer',
        'ytd-shorts',
        'ytd-shorts-shelf-renderer',
        'ytm-shorts-lockup-view-model-v2',
        !PATTERN.subs.test(location.href) ? 'ytd-rich-section-renderer.style-scope.ytd-rich-grid-renderer:has(ytd-rich-shelf-renderer[is-shorts])' : null,
        '[is-shorts]',
        // Mobile
        'ytm-rich-section-renderer:has(ytm-shorts-lockup-view-model)',
        'ytm-item-section-renderer:has(ytm-shorts-lockup-view-model)'
      ].filter(Boolean);
      cssText += `${baseSelectors.join(',\n')} { display: none !important; }\n`;
    }

    if (prev) {
      prev.textContent = cssText;
    } else {
      prev = document.createElement('style');
      prev.id = id;
      prev.textContent = cssText;
      document.head.appendChild(prev);
    }
  }

  function replaceShortsLinks(root = document) {
    if (!config.redirect) return;
    root.querySelectorAll('a[href*="/shorts/"]').forEach(a => {
      if (a.dataset.prnShortsPatched) return;
      const m = a.href.match(/\/shorts\/([^/?&#]+)/);
      if (m) {
        a.href = '/watch?v=' + m[1];
        a.addEventListener('click', e => {
          e.preventDefault();
          location.assign('/watch?v=' + m[1]);
        });
        a.dataset.prnShortsPatched = '1';
      }
    });
  }

  function lockShortsScroll() {
    if (document.getElementById('prn-scroll-lock')) return;
    const st = document.createElement('style');
    st.id = 'prn-scroll-lock';
    st.textContent = `html, body { overflow: hidden !important; height: 100% !important; }`;
    document.head.appendChild(st);

    const block = e => e.stopPropagation() || e.preventDefault();
    ['wheel', 'touchmove', 'keydown'].forEach(evt =>
      window.addEventListener(evt, block, { passive: false })
    );
    window.__prnBlock = block;
  }

  function unlockShortsScroll() {
    document.getElementById('prn-scroll-lock')?.remove();
    const block = window.__prnBlock;
    if (block) {
      ['wheel', 'touchmove', 'keydown'].forEach(evt =>
        window.removeEventListener(evt, block, { passive: false })
      );
      delete window.__prnBlock;
    }
  }

  function handlePage() {
    const u = location.href;
    const isShorts = PATTERN.shorts.test(u);

    if (isShorts && config.redirect) {
      const m = location.pathname.match(/^\/shorts\/([^/?#]+)/);
      if (m) {
        unlockShortsScroll();
        location.replace(`https://www.youtube.com/watch?v=${m[1]}`);
        return;
      }
    }

    if (isShorts && !config.redirect) {
      if (config.scrollLock) lockShortsScroll();
      else unlockShortsScroll();
      return;
    } else {
      unlockShortsScroll();
    }

    updateStyleSheet();
    replaceShortsLinks();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', handlePage);
  } else handlePage();
  window.addEventListener('yt-navigate-finish', handlePage);
  window.addEventListener('yt-page-data-fetched', handlePage);

  function insertSettingsPanel() {
    const end = document.querySelector('#end') ?? document.querySelector('#header-bar > header > div');
    if (!end || document.querySelector('#prn-btn-wrapper')) return;

    const wrap = document.createElement('div');
    wrap.id = 'prn-btn-wrapper';
    Object.assign(wrap.style, {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      marginRight: '8px',
      height: '40px'
    });

    const btn = document.createElement('button');
    btn.className =
      'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--overlay yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading';
    Object.assign(btn.style, {
      display: 'flex',
      alignItems: 'center',
      height: '36px',
      padding: '0 12px',
      gap: '8px'
    });
    btn.setAttribute('aria-label', 'Shorts Setting');

    const iconWrap = document.createElement('span');
    iconWrap.className = 'yt-spec-icon-shape';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20'); svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'currentColor');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z');
    svg.appendChild(p); iconWrap.appendChild(svg);

    const txt = document.createElement('span');
    txt.textContent = 'Shorts';
    txt.className = 'yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap';
    txt.style.fontSize = '13px';

    btn.appendChild(iconWrap); btn.appendChild(txt);

    const dd = document.createElement('div');
    dd.id = 'prn-dropdown';
    Object.assign(dd.style, {
      position: 'absolute', top: 'calc(100% + 6px)', right: '0',
      minWidth: '240px', background: 'rgba(30,30,30,0.96)',
      color: '#fff', borderRadius: '10px', padding: '14px',
      fontSize: '13px', fontFamily: 'sans-serif',
      boxShadow: '0 4px 16px rgba(0,0,0,.4)', zIndex: '100000',
      display: 'none'
    });

    const title = document.createElement('div');
    title.textContent = UI_LABEL['title'];
    title.style.fontWeight = '600'; title.style.marginBottom = '8px';
    dd.appendChild(title);

    for (const key in INIT_CONFIG) {
      const lbl = document.createElement('label');
      Object.assign(lbl.style, { display: 'block', margin: '4px 0' });
      const inp = document.createElement('input');
      inp.type = 'checkbox'; inp.checked = config[key]; inp.dataset.k = key;
      inp.style.marginRight = '6px';
      inp.addEventListener('change', e => {
        const k = e.target.dataset.k; const val = e.target.checked;
        config[k] = val; GM_setValue(PREFIX + k, val);
        updateStyleSheet();
        handlePage();
        if (k === "redirect") handlePage();
      });
      lbl.appendChild(inp);
      lbl.appendChild(document.createTextNode(UI_LABEL[key] || key));
      dd.appendChild(lbl);
    }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!dd.contains(e.target) && !btn.contains(e.target)) {
        dd.style.display = 'none';
      }
    });

    wrap.appendChild(btn); wrap.appendChild(dd);
    end.prepend(wrap);
  }

  let endObserver;
  function observeEnd() {
    const end = document.querySelector('#end') ?? document.querySelector('#header-bar > header > div');
    if (!end) return;
    insertSettingsPanel();

    if (endObserver) endObserver.disconnect();
    endObserver = new MutationObserver(() => {
      insertSettingsPanel();
    });
    endObserver.observe(end, { childList: true, subtree: false });
  }

  const iv = setInterval(() => {
    if (document.querySelector('#end') || document.querySelector('#header-bar > header > div')) {
      observeEnd();
      clearInterval(iv);
    }
  }, 300);

  const shortsObserver = new MutationObserver(mutations => {
    if (!config.redirect) return;
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) replaceShortsLinks(node);
      });
    });
  });

  function waitBodyAndObserve() {
    if (document.body) {
      shortsObserver.observe(document.body, { childList: true, subtree: true });
    } else {
      const iv = setInterval(() => {
        if (document.body) {
          shortsObserver.observe(document.body, { childList: true, subtree: true });
          clearInterval(iv);
        }
      }, 10);
    }
  }

  waitBodyAndObserve();

  window.addEventListener('yt-navigate-finish', () => setTimeout(observeEnd, 500));
})();
