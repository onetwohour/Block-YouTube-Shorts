// ==UserScript==
// @name         Block Youtube Shorts
// @name:ko      유튜브 쇼츠 차단
// @namespace    https://github.com/onetwohour/Block-YouTube-Shorts
// @version      1.4
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
// @run-at       document-start
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

    const LANGS = {
        "ko": {
            "title": "🧹 Shorts 차단",
            "home": "홈 화면 Shorts 숨김",
            "subs": "구독 피드 Shorts 숨김",
            "feeds": "기타 피드 Shorts 숨김",
            "recommend": "영상 화면 우측 추천 Shorts 숨김",
            "channel": "채널 페이지 Shorts 숨김",
            "search": "검색 결과 Shorts 숨김",
            "redirect": "Shorts를 일반 동영상 화면으로 리디렉션",
            "scrollLock": "Shorts 페이지 스크롤 잠금",
            "sidebar": "사이드바 Shorts 메뉴 숨김"
        },
        "en": {
            "title": "🧹 Shorts Block",
            "home": "Hide Shorts on Home",
            "subs": "Hide Shorts in Subscriptions",
            "feeds": "Hide Shorts in Other Feeds",
            "recommend": "Hide Shorts in Recommendations",
            "channel": "Hide Shorts on Channel Page",
            "search": "Hide Shorts in Search",
            "redirect": "Redirect Shorts to Normal Videos",
            "scrollLock": "Lock Scroll on Shorts Page",
            "sidebar": "Hide Shorts in Sidebar"
        },
        "ja": {
            "title": "🧹 Shorts 非表示",
            "home": "ホーム画面のShortsを非表示",
            "subs": "登録フィードのShortsを非表示",
            "feeds": "その他のフィードのShortsを非表示",
            "recommend": "動画画面右側のShortsを非表示",
            "channel": "チャンネルページのShortsを非表示",
            "search": "検索結果のShortsを非表示",
            "redirect": "Shortsを通常動画へリダイレクト",
            "scrollLock": "Shortsページのスクロールをロック",
            "sidebar": "サイドバーのShortsメニューを非表示"
        },
        "zh": {
            "title": "🧹 Shorts 屏蔽",
            "home": "隐藏首页 Shorts",
            "subs": "在订阅中隐藏 Shorts",
            "feeds": "在其他订阅源隐藏 Shorts",
            "recommend": "隐藏视频右侧推荐 Shorts",
            "channel": "在频道页面隐藏 Shorts",
            "search": "在搜索结果中隐藏 Shorts",
            "redirect": "将 Shorts 重定向到普通视频",
            "scrollLock": "锁定 Shorts 页面滚动",
            "sidebar": "隐藏侧边栏 Shorts 菜单"
        },
        "es": {
            "title": "🧹 Bloquear Shorts",
            "home": "Ocultar Shorts en Inicio",
            "subs": "Ocultar Shorts en Suscripciones",
            "feeds": "Ocultar Shorts en Otros Feeds",
            "recommend": "Ocultar Shorts en Recomendaciones",
            "channel": "Ocultar Shorts en la Página del Canal",
            "search": "Ocultar Shorts en Búsqueda",
            "redirect": "Redirigir Shorts a Videos Normales",
            "scrollLock": "Bloquear Desplazamiento en la Página de Shorts",
            "sidebar": "Ocultar Shorts en la Barra Lateral"
        },
        "fr": {
            "title": "🧹 Blocage Shorts",
            "home": "Masquer les Shorts sur la page d’accueil",
            "subs": "Masquer les Shorts dans Abonnements",
            "feeds": "Masquer les Shorts dans les autres flux",
            "recommend": "Masquer les Shorts dans les recommandations",
            "channel": "Masquer les Shorts sur la page de chaîne",
            "search": "Masquer les Shorts dans les résultats de recherche",
            "redirect": "Rediriger les Shorts vers les vidéos classiques",
            "scrollLock": "Bloquer le défilement sur la page Shorts",
            "sidebar": "Masquer le menu Shorts dans la barre latérale"
        },
        "de": {
            "title": "🧹 Shorts Blocken",
            "home": "Shorts auf der Startseite ausblenden",
            "subs": "Shorts im Abofeed ausblenden",
            "feeds": "Shorts in anderen Feeds ausblenden",
            "recommend": "Shorts in Empfehlungen ausblenden",
            "channel": "Shorts auf der Kanalseite ausblenden",
            "search": "Shorts in der Suche ausblenden",
            "redirect": "Shorts zu normalen Videos umleiten",
            "scrollLock": "Scrollen auf der Shorts-Seite sperren",
            "sidebar": "Shorts-Menü in der Seitenleiste ausblenden"
        },
        "pt": {
            "title": "🧹 Bloquear Shorts",
            "home": "Ocultar Shorts na Página Inicial",
            "subs": "Ocultar Shorts em Inscrições",
            "feeds": "Ocultar Shorts em Outros Feeds",
            "recommend": "Ocultar Shorts em Recomendações",
            "channel": "Ocultar Shorts na Página do Canal",
            "search": "Ocultar Shorts na Pesquisa",
            "redirect": "Redirecionar Shorts para Vídeos Normais",
            "scrollLock": "Bloquear Rolagem na Página de Shorts",
            "sidebar": "Ocultar Shorts na Barra Lateral"
        },
        "ru": {
            "title": "🧹 Блокировка Shorts",
            "home": "Скрыть Shorts на главной странице",
            "subs": "Скрыть Shorts в подписках",
            "feeds": "Скрыть Shorts в других лентах",
            "recommend": "Скрыть Shorts в рекомендациях",
            "channel": "Скрыть Shorts на странице канала",
            "search": "Скрыть Shorts в поиске",
            "redirect": "Перенаправлять Shorts на обычные видео",
            "scrollLock": "Заблокировать прокрутку на странице Shorts",
            "sidebar": "Скрыть Shorts в боковой панели"
        },
        "ar": {
            "title": "🧹 حظر Shorts",
            "home": "إخفاء Shorts في الصفحة الرئيسية",
            "subs": "إخفاء Shorts في الاشتراكات",
            "feeds": "إخفاء Shorts في الخلاصات الأخرى",
            "recommend": "إخفاء Shorts في التوصيات",
            "channel": "إخفاء Shorts في صفحة القناة",
            "search": "إخفاء Shorts في نتائج البحث",
            "redirect": "إعادة توجيه Shorts إلى مقاطع الفيديو العادية",
            "scrollLock": "قفل التمرير في صفحة Shorts",
            "sidebar": "إخفاء قائمة Shorts في الشريط الجانبي"
        }
    };

    function readStored(key, fallback) {
        try {
            const value = GM_getValue(key, fallback);
            return value === undefined || value === null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    function readFlag(key) {
        const value = readStored(PREFIX + key, INIT_CONFIG[key]);
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return INIT_CONFIG[key];
    }

    function writeFlag(key, value) {
        try {
            GM_setValue(PREFIX + key, value);
        } catch (e) {
            console.warn('[Block Youtube Shorts] could not save settings; this change applies to the current session only.', e);
        }
    }

    function detectLang() {
        const saved = readStored('userLang', null);
        if (saved && LANGS[saved]) return saved;
        const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
        return LANGS[nav] ? nav : 'en';
    }

    const UI_LABEL = LANGS[detectLang()];

    const config = {};
    for (const key in INIT_CONFIG) config[key] = readFlag(key);

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

    const LOCKUP_TAGS = ['ytm-shorts-lockup-view-model', 'ytm-shorts-lockup-view-model-v2'];
    const LOCKUP = LOCKUP_TAGS.join(', ');

    const MARK_ATTR = 'data-prn-hide';

    const HIDE_GROUPS = {
        shorts: {
            selectors: [
                ...LOCKUP_TAGS,
                'ytd-rich-shelf-renderer[is-shorts]',
                'ytd-reel-shelf-renderer',
                'ytm-reel-shelf-renderer',
                'ytd-shorts-shelf-renderer'
            ],
            containers: [
                { container: 'ytd-rich-item-renderer', contains: LOCKUP },
                { container: 'grid-shelf-view-model', contains: LOCKUP },
                { container: 'ytm-rich-section-renderer', contains: 'ytm-shorts-lockup-view-model' },
                { container: 'ytd-rich-section-renderer', contains: 'ytd-rich-shelf-renderer[is-shorts]' }
            ]
        },
        sidebar: {
            selectors: [],
            containers: [
                { container: 'ytd-guide-entry-renderer', contains: 'a[href^="/shorts"], a[title="Shorts"]' },
                { container: 'ytd-mini-guide-entry-renderer', contains: 'a[href^="/shorts"], a[title="Shorts"]' },
                { container: 'ytm-pivot-bar-item-renderer', contains: '.pivot-bar-item-tab.pivot-shorts, .pivot-bar-item-tab.shorts' }
            ]
        }
    };

    const NAV_BUTTONS = ['ytd-shorts #navigation-button-up', 'ytd-shorts #navigation-button-down'];

    const HAS_SUPPORT = (() => {
        try {
            return typeof CSS !== 'undefined' && CSS.supports('selector(:has(*))');
        } catch (e) {
            return false;
        }
    })();

    function hideRule(selector) {
        return `${selector} { display: none !important; }`;
    }

    function pushHideRules(rules, kind) {
        const group = HIDE_GROUPS[kind];
        for (const selector of group.selectors) rules.push(hideRule(selector));
        if (!HAS_SUPPORT) {
            rules.push(hideRule(`[${MARK_ATTR}="${kind}"]`));
            return;
        }
        for (const rule of group.containers) rules.push(hideRule(`${rule.container}:has(${rule.contains})`));
    }

    function markContainers() {
        if (HAS_SUPPORT) return;
        const stale = new Set(document.querySelectorAll(`[${MARK_ATTR}]`));
        for (const kind in HIDE_GROUPS) {
            for (const rule of HIDE_GROUPS[kind].containers) {
                document.querySelectorAll(rule.contains).forEach(element => {
                    const box = element.closest(rule.container);
                    if (!box) return;
                    stale.delete(box);
                    if (box.getAttribute(MARK_ATTR) !== kind) box.setAttribute(MARK_ATTR, kind);
                });
            }
        }
        stale.forEach(box => box.removeAttribute(MARK_ATTR));
    }

    function updateStyleSheet() {
        if (!document.head) return;

        const rules = [];
        if (config.sidebar) pushHideRules(rules, 'sidebar');
        if (shouldHideCSS()) pushHideRules(rules, 'shorts');
        if (isShortsPage() && !config.redirect && config.scrollLock) {
            for (const selector of NAV_BUTTONS) rules.push(hideRule(selector));
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

    document.addEventListener('click', e => {
        if (!config.redirect || !e.target.closest) return;
        const link = e.target.closest('a[href*="/shorts/"]');
        const m = link && link.href.match(/\/shorts\/([^/?&#]+)/);
        if (!m) return;
        e.preventDefault();
        e.stopPropagation();
        location.assign('/watch?v=' + m[1]);
    }, true);

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
        markContainers();
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', handlePage);
    } else handlePage();

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
  pointer-events: auto;
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
#prn-btn-wrapper.prn-topbar #prn-btn { color: inherit; }
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

    function isRepeatClick(e) {
        return e.detail > 1;
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

        const gap = 8;
        const viewport = document.documentElement.clientWidth;
        const anchor = dd.parentElement.getBoundingClientRect();

        dd.style.width = 'max-content';
        dd.style.maxWidth = '';
        dd.style.right = 'auto';

        const cap = viewport - gap * 2;
        let width = dd.getBoundingClientRect().width;
        if (width > cap) {
            dd.style.maxWidth = cap + 'px';
            width = dd.getBoundingClientRect().width;
        }

        const rightAligned = anchor.right - width;
        const left = Math.min(Math.max(rightAligned, gap), Math.max(gap, viewport - gap - width));
        dd.style.left = (left - anchor.left) + 'px';
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
        if (slot.closest('#header-bar')) wrap.classList.add('prn-topbar');

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
                row.setAttribute('aria-checked', String(config[key]));
                writeFlag(key, config[key]);
                handlePage();
            };

            row.addEventListener('click', e => {
                if (isRepeatClick(e)) return;
                toggle();
            });
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
            if (isRepeatClick(e)) return;
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
    }, true);

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

    function scheduleScan() {
        if (scanScheduled) return;
        scanScheduled = true;
        requestAnimationFrame(() => {
            scanScheduled = false;
            markContainers();
        });
    }

    function observeBody() {
        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                if (m.addedNodes.length) {
                    scheduleScan();
                    return;
                }
            }
        });
        const start = () => observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        if (document.body) {
            start();
            return;
        }
        const poll = setInterval(() => {
            if (!document.body) return;
            start();
            clearInterval(poll);
        }, 1000);
    }

    if (!HAS_SUPPORT) observeBody();

    const NAV_HINTS = ['yt-navigate-finish', 'yt-page-data-fetched', 'state-navigateend', 'popstate'];
    let lastUrl = location.href;

    function onNavigate() {
        handlePage();
        if (location.href === lastUrl) return;
        lastUrl = location.href;
        closePanel();
        setTimeout(observeEnd, 1000);
    }

    for (const type of NAV_HINTS) window.addEventListener(type, onNavigate);
})();
