// ==UserScript==
// @name         Block YouTube Shorts
// @namespace    https://github.com/onetwohour/Block-YouTube-Shorts
// @version      1.0.0
// @description  Protect from brain breaker
// @match        *://*.youtube.com/*
// @grant        none
// @run-at       document-start
// @require      https://raw.githubusercontent.com/onetwohour/Block-YouTube-Shorts/main/settings-ui.js
// ==/UserScript==

(function () {
  'use strict';

  const settings = window.ShortsBlockerSettings.getSettings();

  window._shortsBlockerState = {
    lastUrl: location.href,
    observing: false,
    observer: null,
    scrollObserver: null,
  };
  const state = window._shortsBlockerState;

  function isNotBlockingPage() {
    return !settings.enableBlocking;
  }

  function isShortsUrl(url) {
    return url.includes('/shorts/');
  }

  function injectCSSBlock() {
    const existing = document.getElementById('shorts-blocker-style');

    if (isNotBlockingPage()) {
      if (existing) existing.remove();
      return;
    }

    const css = `
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer:has(a[href*="/shorts/"]),
      ytd-shorts,
      ytd-shorts-shelf-renderer,
      ytd-reel-item-renderer,
      ytd-guide-entry-renderer:has(a[title*="Shorts"]),
      ytd-mini-guide-entry-renderer:has(path[d*="M10 14.65v-5.3L15 12l-5 2.65"]),
      [class*="reel"]:has(a[href*="/shorts/"]),
      a[href*="/shorts/"] {
        display: none !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
    `;
    let styleEl = existing;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'shorts-blocker-style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  }

  function redirectShorts() {
    if (isNotBlockingPage()) return;
    if (isShortsUrl(location.href) && !location.href.includes('blockerRedirected')) {
      const videoId = location.pathname.split('/shorts/')[1]?.split('/')[0]?.split('?')[0];
      if (videoId) {
        location.replace(`${location.origin}/watch?v=${videoId}&blockerRedirected=true`);
      }
    }
  }

  function isShortsElement(el) {
    return el.innerHTML.includes('/shorts/') || el.innerHTML.toLowerCase().includes('shorts');
  }

  function isRenderableVideoItem(el) {
    const visible = el.offsetHeight > 10 && getComputedStyle(el).visibility !== 'hidden';
    if (!visible) return false;
    if (el.querySelector('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')) return false;
    if (!el.querySelector('ytd-video-renderer, ytd-compact-video-renderer')) return false;
    return true;
  }

  function repackYouTubeGrid() {
    if (isNotBlockingPage()) return;
    const gridContainer = document.querySelector('ytd-rich-grid-renderer #contents');
    if (!gridContainer) return;

    const anchorCandidates = [...gridContainer.children].filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0 && isRenderableVideoItem(el);
    });

    const anchor = anchorCandidates.at(-1);
    if (!anchor) return;

    const anchorYBefore = anchor.getBoundingClientRect().top + window.scrollY;

    Array.from(gridContainer.children).forEach(el => {
      if (isShortsElement(el)) el.remove();
    });

    const anchorYAfter = anchor.getBoundingClientRect().top + window.scrollY;
    const delta = anchorYAfter - anchorYBefore;
    window.scrollBy(0, -delta);
  }

  function removeShortsDom() {
    if (isNotBlockingPage()) return;
    document.querySelectorAll('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer').forEach(el => {
      if (isShortsElement(el)) el.remove();
    });

    document.querySelectorAll('ytd-video-renderer, ytd-compact-video-renderer').forEach(el => {
      const links = el.querySelectorAll('a[href]');
      for (const link of links) {
        if (isShortsUrl(link.href)) {
          el.remove();
          break;
        }
      }
    });
  }

  function triggerYouTubeLazyLoad() {
    if (isNotBlockingPage()) return;
    const app = document.querySelector('ytd-app');
    if (app && app.updateComplete) {
      app.updateComplete.then(() => {
        const scroller = document.scrollingElement;
        scroller.scrollTop += 1;
        scroller.scrollTop -= 1;
      });
    }
  }

  function forcePolymerRender() {
    if (isNotBlockingPage()) return;
    const app = document.querySelector('ytd-app');
    if (app && typeof app.updateComplete === 'object' && app.updateComplete.then) {
      app.updateComplete.then(() => {
        const event = new Event('yt-visibility-refresh');
        window.dispatchEvent(event);
      });
    }
  }

  function blockShorts() {
    if (isNotBlockingPage()) return;
    redirectShorts();
    injectCSSBlock();
    removeShortsDom();
    repackYouTubeGrid();
    setTimeout(triggerYouTubeLazyLoad, 200);
    setTimeout(forcePolymerRender, 300);
    setTimeout(setupScrollRepackLoop, 300);
  }

  function setupScrollRepackLoop() {
    if (isNotBlockingPage()) return;
    const gridContainer = document.querySelector('ytd-rich-grid-renderer #contents');
    if (!gridContainer) return;

    state.scrollObserver = new MutationObserver(() => {
      repackYouTubeGrid();
    });

    state.scrollObserver.observe(gridContainer, {
      childList: true,
      subtree: false,
    });

    const sentinel = document.querySelector('ytd-continuation-item-renderer');
    if (sentinel) {
      const intersectionObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => {
            repackYouTubeGrid();
          }, 500);
        }
      });
      intersectionObserver.observe(sentinel);
    }
  }

  function setupObserver() {
    if (state.observer) state.observer.disconnect();

    const debouncedBlock = debounce(() => {
      blockShorts();
    }, 100);

    state.observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (
            node.nodeType === 1 &&
            (
              node.matches?.('ytd-reel-shelf-renderer, ytd-shorts, ytd-shorts-shelf-renderer, a[href*="/shorts/"]') ||
              node.innerHTML?.includes?.('Shorts')
            )
          ) {
            debouncedBlock();
            return;
          }
        }
      }
    });

    state.observer.observe(document.body, { childList: true, subtree: true });
    state.observing = true;
  }

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function onUrlChange() {
    injectCSSBlock();

    if (isNotBlockingPage() && state.observing) {
      state.observer?.disconnect?.();
      state.scrollObserver?.disconnect?.();
      state.observing = false;
    } else if (!isNotBlockingPage() && !state.observing) {
      setupObserver();
      blockShorts();
      state.observing = true;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.ShortsBlockerSettings.insertSettingsMenu();
    if (!isNotBlockingPage()) {
      onUrlChange();
    }
  });

  const urlWatcher = new MutationObserver(() => {
    if (location.href !== state.lastUrl) {
      state.lastUrl = location.href;
      setTimeout(onUrlChange, 300);
    }
  });

  urlWatcher.observe(document, { childList: true, subtree: true });
})();