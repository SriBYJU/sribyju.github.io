(() => {
  'use strict';
  if (window.__scholarkAIUIPolishInstalled) return;
  window.__scholarkAIUIPolishInstalled = true;

  const VERSION = '1.0.0';

  function polish() {
    const welcome = document.querySelector('#sk-ai-dialog .sk-ai-welcome span');
    if (welcome) {
      welcome.textContent = 'Requests are routed to a specialist. Scholark starts with the strongest practical on-device model, automatically retries across local models when needed, and uses guided local tools only as a last resort.';
    }

    const progress = document.querySelector('#sk-ai-progress-text');
    if (progress && /checking this device/i.test(progress.textContent || '')) {
      progress.textContent = 'Selecting the best on-device model…';
    }

    document.querySelectorAll('#sk-ai-transcript .sk-ai-message small').forEach(meta => {
      if (/^guided fallback/i.test(meta.textContent || '')) {
        meta.textContent = 'Last-resort guided mode · no cloud AI';
      }
    });
  }

  const observer = new MutationObserver(polish);
  const attach = () => {
    polish();
    const dialog = document.querySelector('#sk-ai-dialog');
    if (dialog) observer.observe(dialog, { childList: true, subtree: true });
    else setTimeout(attach, 120);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
  else attach();

  window.ScholarkAIUIPolish = { version: VERSION, refresh: polish };
})();
