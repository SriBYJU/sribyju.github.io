(() => {
  'use strict';
  if (window.__scholarkV58Installed) return;
  window.__scholarkV58Installed = true;

  const VERSION = '5.8.0';
  const q = (s, r = document) => r.querySelector(s);

  function ensureStyles() {
    if (q('link[href*="scholark-v58.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scholark-v58.css';
    document.head.appendChild(link);
  }

  const canResetTop = () => !location.hash || location.hash === '#home';
  const resetTop = () => {
    if (!canResetTop()) return;
    try { window.scrollTo(0, 0); } catch {}
    const scroller = document.scrollingElement || document.documentElement;
    if (scroller) scroller.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  function installInitialTopReset() {
    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    } catch {}

    resetTop();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resetTop, {once:true});
    }
    addEventListener('load', () => {
      resetTop();
      requestAnimationFrame(() => {
        resetTop();
        requestAnimationFrame(resetTop);
      });
      setTimeout(resetTop, 120);
    }, {once:true});
    addEventListener('pageshow', resetTop, {once:true});
  }

  function wrapHomeRouting() {
    const original = window.showPage;
    if (typeof original !== 'function' || original.__scholarkV58Wrapped) return false;

    function wrappedShowPage(page, ...args) {
      const result = original.call(this, page, ...args);
      if (page === 'home') {
        requestAnimationFrame(() => {
          resetTop();
          requestAnimationFrame(resetTop);
        });
      }
      return result;
    }
    wrappedShowPage.__scholarkV58Wrapped = true;
    wrappedShowPage.__scholarkV58Original = original;
    window.showPage = wrappedShowPage;
    return true;
  }

  function boot() {
    ensureStyles();
    const root = q('.sk6-experience');
    if (!root) return setTimeout(boot, 45);
    if (root.dataset.sk11Ready) return;
    root.dataset.sk11Ready = '1';
    document.body.classList.add('scholark-v58');
    document.documentElement.dataset.scholarkUi = VERSION;

    if (!wrapHomeRouting()) {
      let tries = 0;
      const waitForRouter = setInterval(() => {
        if (wrapHomeRouting() || tries++ > 80) clearInterval(waitForRouter);
      }, 50);
    }

    /* One final reset after all V5 cinematic layers have inserted their DOM so layout shifts
       cannot leave a fresh page load halfway down the document. */
    requestAnimationFrame(() => requestAnimationFrame(resetTop));

    window.ScholarkV58 = {version:VERSION, resetTop};
  }

  ensureStyles();
  installInitialTopReset();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
