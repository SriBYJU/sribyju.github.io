(() => {
  'use strict';
  if (window.__scholarkV510Installed) return;
  window.__scholarkV510Installed = true;

  const VERSION = '5.10.0';
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  const touch = matchMedia('(pointer: coarse), (max-width: 760px)');

  function removeRejectedOrbitUI(root = document) {
    qa('.sk6-orbit-scene,.sk6-orbit,.sk11-orbit-shell,.sk11-orbit-lines,.sk13-orbit,.sk6-final-halo,.sk9-observatory,.sk9-orbit-line', root)
      .forEach(el => el.remove());
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
          if (node.matches?.('.sk6-orbit-scene,.sk6-orbit,.sk11-orbit-shell,.sk11-orbit-lines,.sk13-orbit,.sk6-final-halo,.sk9-observatory,.sk9-orbit-line')) node.remove();
          else removeRejectedOrbitUI(node);
        }
      }
    });
    mo.observe(home, {childList:true, subtree:true});
    addEventListener('pagehide', () => mo.disconnect(), {once:true});
  }

  /* Safari can evict a large tab under memory pressure and recreate it. Keep a short-lived
     scroll checkpoint so an involuntary reload does not look like the page intentionally
     threw the user back to the top. */
  const SCROLL_KEY = 'scholark:v510:scroll';
  function saveScroll() {
    if (!touch.matches || location.hash && location.hash !== '#home') return;
    try {
      sessionStorage.setItem(SCROLL_KEY, JSON.stringify({y:Math.round(scrollY), t:Date.now(), p:location.pathname}));
    } catch {}
  }

  function restoreRecentScroll() {
    if (!touch.matches || location.hash && location.hash !== '#home') return;
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || 'null'); } catch {}
    if (!saved || saved.p !== location.pathname || saved.y < 180 || Date.now() - saved.t > 90000) return;

    let attempts = 0;
    const restore = () => {
      attempts++;
      const maxY = Math.max(0, (document.scrollingElement?.scrollHeight || document.documentElement.scrollHeight) - innerHeight);
      const y = Math.min(saved.y, maxY);
      if (y > 0) {
        try { window.scrollTo({top:y, behavior:'auto'}); } catch { window.scrollTo(0, y); }
      }
      if (attempts < 3 && Math.abs(scrollY - y) > 80) setTimeout(restore, 90);
    };
    requestAnimationFrame(() => requestAnimationFrame(restore));
  }

  function installScrollCheckpoint() {
    let timer = 0;
    addEventListener('scroll', () => {
      clearTimeout(timer);
      timer = setTimeout(saveScroll, 120);
    }, {passive:true});
    addEventListener('pagehide', saveScroll, {passive:true});
    addEventListener('pageshow', event => {
      removeRejectedOrbitUI();
      if (event.persisted) restoreRecentScroll();
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
    installScrollCheckpoint();
    installTouchClickGuard();
    restoreRecentScroll();
    window.ScholarkV510 = {version:VERSION, removeRejectedOrbitUI, saveScroll};
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
