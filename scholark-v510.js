(() => {
  'use strict';
  if (window.__scholarkV510Installed) return;
  window.__scholarkV510Installed = true;

  const VERSION = '5.10.1';
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const touch = matchMedia('(pointer: coarse), (max-width: 760px)');

  const ORBIT_SELECTOR = '.sk6-orbit-scene,.sk6-orbit,.sk11-orbit-shell,.sk11-orbit-lines,.sk11-core,.sk11-orbit-dot,.sk13-orbit,.sk6-final-halo,.sk9-observatory,.sk9-orbit-line';

  function removeRejectedOrbitUI(root = document) {
    qa(ORBIT_SELECTOR, root).forEach(el => el.remove());
  }

  function installOrbitCleanup() {
    removeRejectedOrbitUI();
    const home = q('#page-home') || document.body;
    if (!home || home.dataset.sk510OrbitClean) return;
    home.dataset.sk510OrbitClean = '1';
    const mo = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.(ORBIT_SELECTOR)) node.remove();
          else removeRejectedOrbitUI(node);
        }
      }
    });
    mo.observe(home, {childList:true, subtree:true});
    addEventListener('pagehide', () => mo.disconnect(), {once:true});
  }

  /* On phones the desktop page was simply too expensive: several later enhancement layers,
     backdrop filters, clouds, campus lights and decorative scenes remained alive at once.
     Safari can terminate a tab under that memory/compositor pressure and show
     “A problem repeatedly occurred”. Keep the real tools and core cinematic intro, but prune
     desktop-only decoration once all enhancement layers have finished loading. */
  function installMobileLiteMode() {
    if (!touch.matches) return;
    document.body?.classList.add('scholark-mobile-lite');
    document.documentElement.dataset.scholarkMobile = 'lite';

    const removeHeavy = () => {
      removeRejectedOrbitUI();
      qa([
        '.sk12-continuity',
        '.sk13-flightdeck',
        '.sk10-closing-sky',
        '.sk10-close-desk',
        '.sk6-grain',
        '.sk6-float-field',
        '.sk6-book-stack',
        '.sk6-leaf'
      ].join(',')).forEach(el => el.remove());

      qa('.sk10-closing-content,.sk10-brand-lockup,.sk10-final-upgraded>.sk6-final-inner').forEach(el => {
        el.style.contentVisibility = 'visible';
        el.style.contain = 'none';
      });
    };

    /* V5.10 is loaded last, so one immediate prune normally catches everything. The two short
       follow-ups cover slow font/network timing without leaving a permanent MutationObserver. */
    removeHeavy();
    setTimeout(removeHeavy, 180);
    setTimeout(removeHeavy, 850);
  }

  /* Preserve position if iOS reloads the tab anyway. sessionStorage survives a normal WebKit
     process recreation, so a crash/reload no longer looks like ScholarK intentionally jumped up. */
  const SCROLL_KEY = 'scholark:v510:scroll';
  function saveScroll() {
    if (!touch.matches || (location.hash && location.hash !== '#home')) return;
    try {
      sessionStorage.setItem(SCROLL_KEY, JSON.stringify({
        y: Math.round(scrollY),
        t: Date.now(),
        p: location.pathname
      }));
    } catch {}
  }

  function restoreRecentScroll() {
    if (!touch.matches || (location.hash && location.hash !== '#home')) return;
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || 'null'); } catch {}
    if (!saved || saved.p !== location.pathname || saved.y < 180 || Date.now() - saved.t > 120000) return;

    let attempts = 0;
    const restore = () => {
      attempts++;
      const scroller = document.scrollingElement || document.documentElement;
      const maxY = Math.max(0, (scroller.scrollHeight || 0) - innerHeight);
      const y = Math.min(saved.y, maxY);
      if (y > 0 && Math.abs(scrollY - y) > 24) {
        try { window.scrollTo({top:y, behavior:'auto'}); } catch { window.scrollTo(0, y); }
      }
      if (attempts < 5 && Math.abs(scrollY - y) > 60) setTimeout(restore, 110);
    };
    requestAnimationFrame(() => requestAnimationFrame(restore));
  }

  function installScrollCheckpoint() {
    let lastSave = 0;
    addEventListener('scroll', () => {
      const now = performance.now();
      if (now - lastSave < 180) return;
      lastSave = now;
      saveScroll();
    }, {passive:true});
    addEventListener('pagehide', saveScroll, {passive:true});
    addEventListener('visibilitychange', () => { if (document.hidden) saveScroll(); }, {passive:true});
    addEventListener('pageshow', () => {
      removeRejectedOrbitUI();
      restoreRecentScroll();
    }, {passive:true});
  }

  /* Guard touch scrolling from accidental card activation without ever changing scroll position. */
  function installTouchClickGuard() {
    if (!touch.matches) return;
    let down = null;
    let moved = false;
    let suppressUntil = 0;
    const routed = el => el?.closest?.('.sk6-tool-card,.sk6-path-card,.sk10-close-card,.sk11-route-node,.sk11-open,.sk12-mini-actions button,.sk13-stop');

    addEventListener('pointerdown', e => {
      if (!routed(e.target)) return;
      down = {id:e.pointerId,x:e.clientX,y:e.clientY,sy:scrollY};
      moved = false;
    }, {capture:true, passive:true});

    addEventListener('pointermove', e => {
      if (!down || down.id !== e.pointerId) return;
      if (Math.hypot(e.clientX-down.x,e.clientY-down.y) > 10 || Math.abs(scrollY-down.sy) > 8) moved = true;
    }, {capture:true, passive:true});

    const end = e => {
      if (!down || down.id !== e.pointerId) return;
      if (moved || Math.abs(scrollY-down.sy) > 8) suppressUntil = performance.now() + 500;
      down = null;
    };
    addEventListener('pointerup', end, true);
    addEventListener('pointercancel', end, true);

    addEventListener('click', e => {
      if (!routed(e.target) || performance.now() > suppressUntil) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      suppressUntil = 0;
    }, true);
  }

  function boot() {
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'auto'; } catch {}
    document.documentElement.dataset.scholarkUi = VERSION;
    document.body?.classList.add('scholark-v510');
    installOrbitCleanup();
    installMobileLiteMode();
    installScrollCheckpoint();
    installTouchClickGuard();
    restoreRecentScroll();
    window.ScholarkV510 = {version:VERSION, removeRejectedOrbitUI, saveScroll, restoreRecentScroll};
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
