(() => {
  'use strict';
  if (window.__scholarkAIUIPolishInstalled) return;
  window.__scholarkAIUIPolishInstalled = true;

  const VERSION = '1.0.1';
  const WELCOME_COPY = 'Your first AI reply may take a few minutes while a model downloads to this device. Later replies use the cached model.';
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
      // Keep the runtime failure detail visible so guided help is never mistaken for a model reply.
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
