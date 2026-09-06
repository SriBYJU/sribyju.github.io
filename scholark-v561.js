(() => {
  'use strict';
  if (window.__scholarkV561Installed) return;
  window.__scholarkV561Installed = true;

  const VERSION = '5.6.1';
  const q = (s, r = document) => r.querySelector(s);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function ensureStyles() {
    if (q('link[href*="scholark-v561.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scholark-v561.css?build=561';
    document.head.appendChild(link);
  }

  /* A redundant showPage('home') call should never reset an already-active homepage to the top.
     This also protects against third-party / legacy click handlers that redispatch the current route. */
  function installIdempotentRouting() {
    if (typeof window.showPage !== 'function' || window.showPage.__sk561) return;
    const original = window.showPage;
    const wrapped = function(name, ...args) {
      const active = document.querySelector('.page.active');
      const activeName = (active?.id || '').replace(/^page-/, '');
      if (activeName && activeName === name) return true;
      return original.call(this, name, ...args);
    };
    wrapped.__sk561 = true;
    wrapped.__sk3 = original.__sk3;
    window.showPage = wrapped;
  }

  /* Touch scrolls can end over a clickable card and some WebKit builds still synthesize a click.
     Track the gesture and swallow only the synthetic click when the pointer actually travelled. */
  function installGestureNavigationGuard() {
    let activePointer = null;
    let startX = 0, startY = 0, startScrollY = 0;
    let moved = false;
    let suppressUntil = 0;

    const isRoutedTarget = target => target?.closest?.(
      '.sk6-tool-card,.sk6-path-card,.sk8-stage-btn,.sk9-panel-cta,.sk9-control,.sk9-dots button'
    );

    document.addEventListener('pointerdown', e => {
      if (!isRoutedTarget(e.target)) return;
      activePointer = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startScrollY = scrollY;
      moved = false;
    }, true);

    document.addEventListener('pointermove', e => {
      if (activePointer !== e.pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 9 || Math.abs(scrollY - startScrollY) > 6) moved = true;
    }, { capture:true, passive:true });

    const finish = e => {
      if (activePointer !== e.pointerId) return;
      if (moved || Math.abs(scrollY - startScrollY) > 6) suppressUntil = performance.now() + 420;
      activePointer = null;
    };
    document.addEventListener('pointerup', finish, true);
    document.addEventListener('pointercancel', finish, true);

    document.addEventListener('click', e => {
      if (!isRoutedTarget(e.target)) return;
      if (performance.now() > suppressUntil) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      suppressUntil = 0;
    }, true);
  }

  /* Ensure late dynamic enhancements cannot change the scrollable geometry after the user starts
     moving through the page. The sections are already loaded by the deterministic bootstrap; this
     simply forces stable layout participation on browsers that cached older CSS. */
  function forceStableGeometry() {
    [
      '.sk6-journey-section','.sk6-fit-scene','.sk6-tools-section','.sk6-final','.sk9-observatory'
    ].forEach(sel => {
      const el = q(sel);
      if (!el) return;
      el.style.contentVisibility = 'visible';
      el.style.containIntrinsicSize = 'auto';
    });
    const story = q('.sk6-story');
    if (story) story.style.contain = 'style';
  }

  /* If another enhancement ever tries to mutate the homepage after the user has already scrolled,
     preserve the current visual anchor instead of letting WebKit snap to a new location. */
  function installLateMutationAnchorGuard() {
    const root = q('.sk6-experience');
    if (!root || root.dataset.sk561AnchorGuard) return;
    root.dataset.sk561AnchorGuard = '1';
    let queued = false;
    const observer = new MutationObserver(records => {
      if (scrollY < innerHeight * .65) return;
      const structural = records.some(r => [...r.addedNodes].some(n =>
        n.nodeType === 1 && n.matches?.('.sk9-observatory,.sk6-journey-section,.sk6-fit-scene,.sk6-tools-section,.sk6-final')
      ));
      if (!structural || queued) return;
      queued = true;
      const before = scrollY;
      requestAnimationFrame(() => {
        queued = false;
        const delta = scrollY - before;
        if (Math.abs(delta) > innerHeight * .55) scrollTo({ top: before, behavior:'auto' });
      });
    });
    observer.observe(root, { childList:true, subtree:true });
  }

  function boot() {
    ensureStyles();
    const root = q('.sk6-experience');
    if (!root) return setTimeout(boot, 40);
    if (root.dataset.sk561Ready) return;
    root.dataset.sk561Ready = '1';
    document.documentElement.dataset.scholarkUi = VERSION;
    document.body.classList.add('scholark-v561');

    installIdempotentRouting();
    installGestureNavigationGuard();
    forceStableGeometry();
    installLateMutationAnchorGuard();

    window.ScholarkV561 = {
      version: VERSION,
      refresh: forceStableGeometry,
      reducedMotion: reduceMotion.matches
    };
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
