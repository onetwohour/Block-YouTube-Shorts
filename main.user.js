// ==UserScript==
// @name         Block Youtube Shorts
// @name:ko      유튜브 쇼츠 차단
// @namespace    https://github.com/onetwohour/Block-YouTube-Shorts
// @version      1.3
// @description         Protect from brain breaker
// @description:ko      유튜브 Shorts를 차단하여 집중력을 지켜줍니다
// @description:en      Block YouTube Shorts to stay focused
// @description:ja      YouTube Shortsを非表示にして集中力を守ります
// @description:zh      屏蔽YouTube Shorts，保持专注
// @description:es      Bloquea YouTube Shorts para mantener la concentración
// @description:fr      Bloquez YouTube Shorts pour rester concentré
// @description:de      Blenden Sie YouTube Shorts aus, um fokussiert zu bleiben
// @description:pt      Bloqueie o YouTube Shorts para manter o foco
// @description:ru      Блокируйте YouTube Shorts, чтобы сохранять концентрацию
// @description:ar      احظر YouTube Shorts للحفاظ على تركيزك
// @match        *://*.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_getResourceText
// @run-at       document-start
// @resource     lang https://cdn.jsdelivr.net/gh/onetwohour/Block-YouTube-Shorts/lang.json
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/547991/Block%20Youtube%20Shorts.user.js
// @updateURL    https://update.greasyfork.org/scripts/547991/Block%20Youtube%20Shorts.meta.js
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

    let LANGS;
    try {
        LANGS = JSON.parse(GM_getResourceText('lang'));
    } catch (e) {
        LANGS = {
            en: {
                title: 'Shorts',
                home: '',
                subs: '',
                feeds: '',
                recommend: '',
                channel: '',
                search: '',
                redirect: '',
                scrollLock: '',
                sidebar: ''
            }
        };
    }

    function detectLang() {
        const saved = GM_getValue('userLang');
        if (saved && LANGS[saved]) return saved;
        const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
        return LANGS[nav] ? nav : 'en';
    }

    const UI_LABEL = LANGS[detectLang()];

    const config = {};
    for (const key in INIT_CONFIG) config[key] = GM_getValue(PREFIX + key, INIT_CONFIG[key]);

    const HOST = /^(?:www\.|m\.)?youtube\.com$/;

    const PATH = {
        home: /^\/?$/,
        subs: /^\/feed\/subscriptions\/?$/,
        feeds: /^\/(?:feed|gaming)(?:\/|$)/,
        watch: /^\/(?:watch|live|clip)(?:\/|$)/,
        shorts: /^\/shorts(?:\/|$)/,
        search: /^\/results\/?$/,
        channel: /^\/(?:@|c\/|user\/|channel\/)/
    };

    function isShortsPage() {
        return HOST.test(location.hostname) && PATH.shorts.test(location.pathname);
    }

    function currentScope() {
        if (!HOST.test(location.hostname)) return null;
        const p = location.pathname;
        if (PATH.shorts.test(p)) return 'shorts';
        if (PATH.home.test(p)) return 'home';
        if (PATH.subs.test(p)) return 'subs';
        if (PATH.feeds.test(p)) return 'feeds';
        if (PATH.search.test(p)) return 'search';
        if (PATH.watch.test(p)) return 'recommend';
        if (PATH.channel.test(p)) return 'channel';
        return null;
    }

    function shouldHideCSS() {
        const scope = currentScope();
        if (!scope || scope === 'shorts') return false;
        return !!config[scope];
    }

    const LOCKUP = 'ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2';

    const SHORTS_SELECTORS = [
        `ytd-rich-item-renderer:has(${LOCKUP})`,
        LOCKUP,
        'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
        'ytd-rich-shelf-renderer[is-shorts]',
        'ytd-reel-shelf-renderer',
        'ytd-shorts-shelf-renderer',
        `grid-shelf-view-model:has(${LOCKUP})`,
        'ytm-rich-section-renderer:has(ytm-shorts-lockup-view-model)'
    ];

    const SIDEBAR_SELECTORS = [
        'ytd-guide-entry-renderer:has(> a[href^="/shorts"])',
        'ytd-guide-entry-renderer:has(> a[title="Shorts"])',
        'ytd-mini-guide-entry-renderer:has(> a[href^="/shorts"])',
        'ytd-mini-guide-entry-renderer:has(> a[title="Shorts"])',
        'ytm-pivot-bar-item-renderer:has(> .pivot-bar-item-tab.pivot-shorts)'
    ];

    const NAV_BUTTONS = 'ytd-shorts #navigation-button-up,\nytd-shorts #navigation-button-down';

    function updateStyleSheet() {
        if (!document.head) return;

        const rules = [];
        if (config.sidebar) rules.push(`${SIDEBAR_SELECTORS.join(',\n')} { display: none !important; }`);
        if (shouldHideCSS()) rules.push(`${SHORTS_SELECTORS.join(',\n')} { display: none !important; }`);
        if (isShortsPage() && !config.redirect && config.scrollLock) {
            rules.push(`${NAV_BUTTONS} { display: none !important; }`);
        }

        const id = 'prn-css';
        let sheet = document.getElementById(id);
        if (!sheet) {
            sheet = document.createElement('style');
            sheet.id = id;
            document.head.appendChild(sheet);
        }
        const text = rules.join('\n');
        if (sheet.textContent !== text) sheet.textContent = text;
    }

    function replaceShortsLinks(root = document) {
        if (!config.redirect) return;
        root.querySelectorAll('a[href*="/shorts/"]:not([href$="/shorts/"]):not([data-prn-shorts-patched])').forEach(a => {
            const m = a.href.match(/\/shorts\/([^/?&#]+)/);
            if (!m) return;
            const watchUrl = '/watch?v=' + m[1];
            a.href = watchUrl;
            a.addEventListener('click', e => {
                e.preventDefault();
                location.assign(watchUrl);
            });
            a.dataset.prnShortsPatched = '1';
        });
    }

    const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);
    let keyBlocker = null;
    let wheelBlocker = null;
    let lockedReel = null;

    function isEditable(el) {
        if (!el || !el.tagName) return false;
        return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
    }

    function lockShortsKeys() {
        if (keyBlocker) return;
        keyBlocker = e => {
            const t = e.target;
            if (!t || !t.closest) return;
            if (isEditable(t) || !NAV_KEYS.has(e.key)) return;
            if (t.closest('#shorts-panel-container, #prn-btn-wrapper')) return;
            e.stopImmediatePropagation();
            e.preventDefault();
        };
        window.addEventListener('keydown', keyBlocker, {
            capture: true,
            passive: false
        });
    }

    function unlockShortsKeys() {
        if (!keyBlocker) return;
        window.removeEventListener('keydown', keyBlocker, {
            capture: true
        });
        keyBlocker = null;
    }

    function lockShortsWheel() {
        const reel = document.querySelector('#shorts-container');
        if (!reel || lockedReel === reel) return;
        unlockShortsWheel();
        wheelBlocker = e => e.preventDefault();
        reel.addEventListener('wheel', wheelBlocker, {
            passive: false
        });
        reel.addEventListener('touchmove', wheelBlocker, {
            passive: false
        });
        lockedReel = reel;
    }

    function unlockShortsWheel() {
        if (!lockedReel) return;
        lockedReel.removeEventListener('wheel', wheelBlocker);
        lockedReel.removeEventListener('touchmove', wheelBlocker);
        lockedReel = null;
        wheelBlocker = null;
    }

    function handlePage() {
        const isShorts = isShortsPage();

        if (isShorts && config.redirect) {
            const m = location.pathname.match(/^\/shorts\/([^/?#]+)/);
            if (m) {
                unlockShortsKeys();
                unlockShortsWheel();
                location.replace(`https://www.youtube.com/watch?v=${m[1]}`);
                return;
            }
        }

        if (isShorts && !config.redirect && config.scrollLock) {
            lockShortsKeys();
            lockShortsWheel();
        } else {
            unlockShortsKeys();
            unlockShortsWheel();
        }

        updateStyleSheet();
        replaceShortsLinks();
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', handlePage);
    } else handlePage();
    window.addEventListener('yt-navigate-finish', handlePage);
    window.addEventListener('yt-page-data-fetched', handlePage);

    const SVG_NS = 'http://www.w3.org/2000/svg';

    function svgEl(tag, attrs) {
        const el = document.createElementNS(SVG_NS, tag);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }

    function buildIcon() {
        const svg = svgEl('svg', {
            width: '24',
            height: '24',
            viewBox: '0 0 24 24',
            fill: 'none',
            focusable: 'false'
        });

        const mask = svgEl('mask', {
            id: 'prn-icon-cut',
            maskUnits: 'userSpaceOnUse',
            x: '0',
            y: '0',
            width: '24',
            height: '24'
        });
        mask.appendChild(svgEl('rect', {
            width: '24',
            height: '24',
            fill: '#fff'
        }));
        mask.appendChild(svgEl('line', {
            x1: '3.5',
            y1: '2.5',
            x2: '21.5',
            y2: '20.5',
            stroke: '#000',
            'stroke-width': '3.4',
            'stroke-linecap': 'round'
        }));
        const defs = svgEl('defs', {});
        defs.appendChild(mask);
        svg.appendChild(defs);

        svg.appendChild(svgEl('path', {
            d: 'M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-1.99 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.05 1.99-3.5-.07-1.42-.94-2.68-2.23-3.24z',
            fill: 'currentColor',
            mask: 'url(#prn-icon-cut)'
        }));
        svg.appendChild(svgEl('line', {
            x1: '4.2',
            y1: '3.2',
            x2: '20.8',
            y2: '19.8',
            stroke: 'currentColor',
            'stroke-width': '1.9',
            'stroke-linecap': 'round'
        }));

        return svg;
    }

    const PANEL_CSS = `
#prn-btn-wrapper, #prn-btn-wrapper * { box-sizing: border-box; }
#prn-btn-wrapper {
  --prn-bg: #fff;
  --prn-text: #0f0f0f;
  --prn-text-secondary: #606060;
  --prn-hover: rgba(0, 0, 0, .05);
  --prn-shadow: 0 4px 32px rgba(0, 0, 0, .2);
  --prn-track: rgba(0, 0, 0, .26);
  --prn-knob: #fafafa;
  --prn-track-on: rgba(6, 95, 212, .5);
  --prn-knob-on: #065fd4;
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 8px;
}
html[dark] #prn-btn-wrapper {
  --prn-bg: #282828;
  --prn-text: #f1f1f1;
  --prn-text-secondary: #aaa;
  --prn-hover: rgba(255, 255, 255, .1);
  --prn-shadow: 0 4px 32px rgba(0, 0, 0, .4);
  --prn-track: rgba(255, 255, 255, .3);
  --prn-knob: #909090;
  --prn-track-on: rgba(62, 166, 255, .5);
  --prn-knob-on: #3ea6ff;
}
#prn-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--prn-text);
  cursor: pointer;
}
#prn-btn:hover,
#prn-btn[aria-expanded="true"] { background: var(--prn-hover); }
#prn-btn:focus-visible { outline: 2px solid var(--prn-text); outline-offset: -2px; }
#prn-btn svg { display: block; }
#prn-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: none;
  min-width: 264px;
  max-width: 340px;
  max-height: min(70vh, 520px);
  overflow-y: auto;
  padding: 8px 0;
  border-radius: 12px;
  background: var(--prn-bg);
  box-shadow: var(--prn-shadow);
  color: var(--prn-text);
  font-family: "Roboto", "Arial", sans-serif;
  font-size: 15px;
  line-height: 22px;
  z-index: 2100;
}
#prn-dropdown .prn-title {
  padding: 6px 16px 10px;
  color: var(--prn-text-secondary);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .8px;
  text-transform: uppercase;
}
#prn-dropdown .prn-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 40px;
  padding: 6px 16px;
  cursor: pointer;
  user-select: none;
}
#prn-dropdown .prn-row:hover { background: var(--prn-hover); }
#prn-dropdown .prn-row:focus-visible { outline: 0; background: var(--prn-hover); }
#prn-dropdown .prn-switch {
  position: relative;
  flex: 0 0 auto;
  width: 36px;
  height: 14px;
  border-radius: 7px;
  background: var(--prn-track);
  transition: background .12s ease-in;
}
#prn-dropdown .prn-switch::after {
  content: "";
  position: absolute;
  top: -3px;
  left: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--prn-knob);
  box-shadow: 0 1px 3px rgba(0, 0, 0, .4);
  transition: transform .12s ease-in, background .12s ease-in;
}
#prn-dropdown .prn-row[aria-checked="true"] .prn-switch { background: var(--prn-track-on); }
#prn-dropdown .prn-row[aria-checked="true"] .prn-switch::after {
  transform: translateX(16px);
  background: var(--prn-knob-on);
}
`;

    function injectPanelStyle() {
        if (document.getElementById('prn-panel-css') || !document.head) return;
        const st = document.createElement('style');
        st.id = 'prn-panel-css';
        st.textContent = PANEL_CSS;
        document.head.appendChild(st);
    }

    function closePanel() {
        const dd = document.getElementById('prn-dropdown');
        const btn = document.getElementById('prn-btn');
        if (dd) dd.style.display = 'none';
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function openPanel(dd, btn) {
        dd.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
        dd.style.right = '0';
        dd.style.left = 'auto';
        if (dd.getBoundingClientRect().left < 8) {
            dd.style.right = 'auto';
            dd.style.left = '0';
        }
    }

    function mastheadSlot() {
        return document.querySelector('#end #buttons') ??
            document.querySelector('#end') ??
            document.querySelector('#header-bar > header > div');
    }

    function insertSettingsPanel() {
        if (location.pathname.startsWith('/select_site')) return;
        const slot = mastheadSlot();
        if (!slot || document.getElementById('prn-btn-wrapper')) return;

        injectPanelStyle();

        const wrap = document.createElement('div');
        wrap.id = 'prn-btn-wrapper';

        const btn = document.createElement('button');
        btn.id = 'prn-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', UI_LABEL['title'] || 'Shorts');
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.title = UI_LABEL['title'] || 'Shorts';
        btn.appendChild(buildIcon());

        const dd = document.createElement('div');
        dd.id = 'prn-dropdown';
        dd.setAttribute('role', 'menu');

        const title = document.createElement('div');
        title.className = 'prn-title';
        title.textContent = UI_LABEL['title'] || 'Shorts';
        dd.appendChild(title);

        for (const key in INIT_CONFIG) {
            const row = document.createElement('div');
            row.className = 'prn-row';
            row.tabIndex = 0;
            row.setAttribute('role', 'menuitemcheckbox');
            row.setAttribute('aria-checked', String(config[key]));

            const label = document.createElement('span');
            label.textContent = UI_LABEL[key] || key;

            const sw = document.createElement('span');
            sw.className = 'prn-switch';

            row.appendChild(label);
            row.appendChild(sw);

            const toggle = () => {
                config[key] = !config[key];
                GM_setValue(PREFIX + key, config[key]);
                row.setAttribute('aria-checked', String(config[key]));
                handlePage();
            };

            row.addEventListener('click', toggle);
            row.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle();
                }
            });

            dd.appendChild(row);
        }

        btn.addEventListener('click', e => {
            e.stopPropagation();
            if (dd.style.display === 'block') closePanel();
            else openPanel(dd, btn);
        });

        wrap.appendChild(btn);
        wrap.appendChild(dd);
        slot.prepend(wrap);
    }

    document.addEventListener('click', e => {
        const wrap = document.getElementById('prn-btn-wrapper');
        if (wrap && !wrap.contains(e.target)) closePanel();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closePanel();
    });

    let endObserver;

    function observeEnd() {
        const slot = mastheadSlot();
        if (!slot) return;
        insertSettingsPanel();

        if (endObserver) endObserver.disconnect();
        endObserver = new MutationObserver(() => {
            insertSettingsPanel();
        });
        endObserver.observe(slot, {
            childList: true,
            subtree: false
        });
    }

    const iv = setInterval(() => {
        if (mastheadSlot()) {
            observeEnd();
            clearInterval(iv);
        }
    }, 1500);

    let scanScheduled = false;

    function scheduleLinkScan() {
        if (scanScheduled || !config.redirect) return;
        scanScheduled = true;
        requestAnimationFrame(() => {
            scanScheduled = false;
            replaceShortsLinks();
        });
    }

    const shortsObserver = new MutationObserver(mutations => {
        if (!config.redirect) return;
        for (const m of mutations) {
            if (m.addedNodes.length) {
                scheduleLinkScan();
                return;
            }
        }
    });

    function waitBodyAndObserve() {
        if (document.body) {
            shortsObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            const bodyIv = setInterval(() => {
                if (document.body) {
                    shortsObserver.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                    clearInterval(bodyIv);
                }
            }, 1000);
        }
    }

    waitBodyAndObserve();

    window.addEventListener('yt-navigate-finish', () => setTimeout(observeEnd, 1000));
})();
