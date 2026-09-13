(() => {
  'use strict';
  if (window.__scholarkAIUIPolishInstalled) return;
  window.__scholarkAIUIPolishInstalled = true;

  const VERSION = '1.0.1';
  const WELCOME_COPY = 'Requests are routed to a specialist. Scholark starts with the strongest practical on-device model, automatically retries across local models when needed, and uses guided local tools only as a last resort.';
  let scheduled = false;

  function setTextIfChanged(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function polish() {
    const welcome = document.querySelector('#sk-ai-dialog .sk-ai-welcome span');
    setTextIfChanged(welcome, WELCOME_COPY);

    const progress = document.querySelector('#sk-ai-progress-text');
    if (progress && /checking this device/i.test(progress.textContent || '')) {
      setTextIfChanged(progress, 'Selecting the best on-device model…');
    }

    document.querySelectorAll('#sk-ai-transcript .sk-ai-message small').forEach(meta => {
      if (/^guided fallback/i.test(meta.textContent || '')) {
        setTextIfChanged(meta, 'Last-resort guided mode · no cloud AI');
      }
    });
  }

  function schedulePolish() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      polish();
    });
  }

  const observer = new MutationObserver(schedulePolish);
  const attach = () => {
    polish();
    const dialog = document.querySelector('#sk-ai-dialog');
    if (dialog) observer.observe(dialog, { childList: true, subtree: true, characterData: true });
    else setTimeout(attach, 120);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
  else attach();

  window.ScholarkAIUIPolish = { version: VERSION, refresh: polish };
})();
