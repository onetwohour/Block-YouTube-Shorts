// ==UserScript==
// @name         Block Youtube Shorts
// @namespace    https://github.com/onetwohour/Block-YouTube-Shorts
// @version      1.0.0
// @description  Protect from brain breaker
// @match        https://www.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
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

  const UI_LABEL = {
    home: '홈 화면 Shorts 숨김',
    subs: '구독 피드 Shorts 숨김',
    feeds: '기타 피드 Shorts 숨김',
    recommend: '영상 화면 우측 추천 Shorts 숨김',
    channel: '채널 페이지 Shorts 숨김',
    search: '검색 결과 Shorts 숨김',
    redirect: 'Shorts를 일반 동영상 화면으로 리디렉션',
    scrollLock: 'Shorts 페이지 스크롤 잠금',
    sidebar: '사이드바 Shorts 메뉴 숨김'
  };

  const config = {};
  for (const key in INIT_CONFIG) config[key] = GM_getValue(PREFIX + key, INIT_CONFIG[key]);

  const PATTERN = {
    home: /^https?:\/\/(?:www\.)?youtube\.com\/?$/,
    subs: /^https?:\/\/(?:www\.)?youtube\.com\/feed\/subscriptions\/?$/,
    feeds: /^https?:\/\/(?:www\.)?youtube\.com\/(?:feed|gaming)(?!\/subscriptions).*$/,
    watch: /^https?:\/\/(?:www\.)?youtube\.com\/watch.*$/,
    shorts: /^https?:\/\/(?:www\.)?youtube\.com\/shorts.*$/,
    channel: /^https?:\/\/(?:www\.)?youtube\.com\/(?!feed|watch|shorts|playlist|podcasts|gaming|results).+$/,
    search: /^https?:\/\/(?:www\.)?youtube\.com\/results.*$/
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
    const prev = document.getElementById(id);
    if (!shouldHideCSS()) {
      prev?.remove();
      return;
    }
    if (prev) return;

    const selectors = [
      'ytd-reel-shelf-renderer',
      'ytd-shorts',
      'ytd-shorts-shelf-renderer',
      'ytd-reel-item-renderer',
      'ytm-shorts-lockup-view-model-v2',
      'ytd-rich-section-renderer',
      '[is-shorts]',
      '[is-reel-item-style-avatar-circle]',
      'a[href*="/shorts/"]',
      'a[title="Shorts"]',
      '.yt-simple-endpoint[title="Shorts"]'
    ];
    if (config.sidebar) {
      selectors.push('.ytd-guide-entry-renderer:has(.yt-simple-endpoint[title="Shorts"])');
    }

    const st = document.createElement('style');
    st.id = id;
    st.textContent = selectors.join(',\n') + '{display:none!important;}';
    document.head.appendChild(st);
  }

  function cleanShortsElements() {
    if (config.sidebar) {
      document.querySelectorAll('.yt-simple-endpoint[title="Shorts"]')
        .forEach(el => el.closest('ytd-guide-entry-renderer')?.remove());
    }

    if (!shouldHideCSS()) return;

    document.querySelectorAll(`
      ytd-reel-shelf-renderer,
      ytd-shorts,
      ytd-shorts-shelf-renderer,
      ytd-reel-item-renderer,
      ytm-shorts-lockup-view-model-v2,
      ytd-video-renderer:has(a[href*="/shorts/"]),
      ytd-rich-item-renderer:has(a[href*="/shorts/"])
    `).forEach(el => el.remove());
  }

  function observeSidebarGuide() {
    const rootObs = new MutationObserver(() => {
      const sidebar = document.querySelector('ytd-guide-section-renderer');
      if (!sidebar) return;

      cleanShortsElements();

      new MutationObserver(cleanShortsElements)
        .observe(sidebar, { childList: true, subtree: true });

      rootObs.disconnect();
    });

    rootObs.observe(document.documentElement, { childList: true, subtree: true });
    if (document.querySelector('ytd-guide-section-renderer')) cleanShortsElements();
  }

  function removeExtraContinuationItems() {
    const process = selector => {
      const container = document.querySelector(selector);
      if (!container) return;
      const items = Array.from(container.querySelectorAll('ytd-continuation-item-renderer'));
      for (let i = 0; i < items.length - 1; i++) {
        items[i].remove();
      }
    };
    process('ytd-item-section-renderer#sections');
    process('#related');

    document.querySelectorAll('ytd-section-list-renderer, ytd-browse').forEach(feed => {
      const items = Array.from(feed.querySelectorAll('ytd-continuation-item-renderer'));
      for (let i = 0; i < items.length - 1; i++) {
        items[i].remove();
      }
    });
  }

  function observeContinuations() {
    const observer = new MutationObserver(removeExtraContinuationItems);
    observer.observe(document.body, { childList: true, subtree: true });
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
        observeSidebarGuide();
        return;
      }
    }

    if (isShorts && !config.redirect) {
      observeSidebarGuide();
      if (config.scrollLock) lockShortsScroll();
      else unlockShortsScroll();
      return;
    } else {
      unlockShortsScroll();
    }

    updateStyleSheet();
    observeSidebarGuide();
    cleanShortsElements();
    observeContinuations();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', handlePage);
  } else handlePage();
  window.addEventListener('yt-navigate-finish', handlePage);
  window.addEventListener('yt-page-data-fetched', handlePage);

  function insertSettingsPanel() {
    const end = document.querySelector('#end');
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
    btn.setAttribute('aria-label','Shorts 설정');

    const iconWrap = document.createElement('span');
    iconWrap.className = 'yt-spec-icon-shape';
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width','20'); svg.setAttribute('height','20');
    svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('fill','currentColor');
    const p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d','M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z');
    svg.appendChild(p); iconWrap.appendChild(svg);

    const txt = document.createElement('span');
    txt.textContent = 'Shorts';
    txt.className = 'yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap';
    txt.style.fontSize = '13px';

    btn.appendChild(iconWrap); btn.appendChild(txt);

    const dd = document.createElement('div');
    dd.id='prn-dropdown';
    Object.assign(dd.style,{
      position:'absolute',top:'calc(100% + 6px)',right:'0',
      minWidth:'240px',background:'rgba(30,30,30,0.96)',
      color:'#fff',borderRadius:'10px',padding:'14px',
      fontSize:'13px',fontFamily:'sans-serif',
      boxShadow:'0 4px 16px rgba(0,0,0,.4)',zIndex:'100000',
      display:'none'
    });

    const title = document.createElement('div');
    title.textContent='🧹 Shorts 차단 설정';
    title.style.fontWeight='600'; title.style.marginBottom='8px';
    dd.appendChild(title);

    for (const key in INIT_CONFIG) {
      const lbl = document.createElement('label');
      Object.assign(lbl.style,{display:'block',margin:'4px 0'});
      const inp = document.createElement('input');
      inp.type='checkbox'; inp.checked=config[key]; inp.dataset.k=key;
      inp.style.marginRight='6px';
      inp.addEventListener('change',e=>{
        const k=e.target.dataset.k; const val=e.target.checked;
        config[k]=val; GM_setValue(PREFIX+k,val);
      });
      lbl.appendChild(inp);
      lbl.appendChild(document.createTextNode(UI_LABEL[key] || key));
      dd.appendChild(lbl);
    }

    btn.addEventListener('click',e=>{
      e.stopPropagation();
      dd.style.display = dd.style.display==='none'?'block':'none';
    });
    document.addEventListener('click', (e) => {
      if (!dd.contains(e.target) && !btn.contains(e.target)) {
        dd.style.display = 'none';
      }
    });

    wrap.appendChild(btn); wrap.appendChild(dd);
    end.prepend(wrap);
  }

  const iv = setInterval(()=>{
    if(document.querySelector('#end')){ insertSettingsPanel(); clearInterval(iv);}
  },300);
  window.addEventListener('yt-navigate-finish',()=>setTimeout(insertSettingsPanel,500));
})();