(() => {
  'use strict';
  if (window.__scholarkAIHealthInstalled) return;
  window.__scholarkAIHealthInstalled = true;

  const AI = window.ScholarkAI;
  const A = window.ScholarkAIAlgorithms;
  const Agents = window.ScholarkAIAgents;
  const Practice = window.ScholarkAIPractice;
  if (!AI || !A || !Agents) return;

  const VERSION = '1.0.0';
  const errors = [];
  const MAX_ERRORS = 40;

  function legacySnapshot() {
    const out = {};
    try {
      Object.keys(localStorage).filter(k => /^(gs_|firebase:|firebaseLocalStorage)/i.test(k)).sort().forEach(k => {
        const value = localStorage.getItem(k) || '';
        out[k] = { length: value.length, hash: A.stableHash(value) };
      });
    } catch (_) {}
    return out;
  }

  function sameSnapshot(a, b) {
    const ak = Object.keys(a), bk = Object.keys(b);
    return ak.length === bk.length && ak.every(k => b[k] && b[k].length === a[k].length && b[k].hash === a[k].hash);
  }

  function recordError(kind, event) {
    const source = String(event?.filename || event?.reason?.stack || event?.error?.stack || event?.message || event?.reason || '');
    if (!/scholark-ai/i.test(source) && kind !== 'runtime-error') return;
    errors.push({
      kind,
      at: Date.now(),
      message: String(event?.message || event?.reason?.message || event?.error?.message || event?.reason || '').slice(0, 500),
      source: source.slice(0, 500)
    });
    while (errors.length > MAX_ERRORS) errors.shift();
    AI.telemetry?.record?.('health-error', errors[errors.length - 1]);
  }

  window.addEventListener('error', event => recordError('error', event));
  window.addEventListener('unhandledrejection', event => recordError('unhandledrejection', event));
  AI.on?.('runtime-error', event => recordError('runtime-error', { message: event.error?.message, error: event.error }));

  function check(name, fn) {
    try {
      const detail = fn();
      return { name, pass: detail === true || detail?.pass === true, detail: detail === true ? '' : detail?.detail || String(detail?.pass === true ? '' : detail || '') };
    } catch (error) {
      return { name, pass: false, detail: String(error?.message || error) };
    }
  }

  function moduleChecks() {
    return [
      ['algorithms', () => !!window.ScholarkAIAlgorithms],
      ['core', () => !!window.ScholarkAI],
      ['agents', () => !!window.ScholarkAIAgents],
      ['dashboard', () => !!window.ScholarkAIDashboard],
      ['bridge', () => !!window.ScholarkAIBridge],
      ['context', () => !!window.ScholarkAIContext],
      ['ui', () => !!window.ScholarkAIUI],
      ['practice', () => !!window.ScholarkAIPractice],
      ['practice-ui', () => !!window.ScholarkAIPracticeUI]
    ].map(([name, fn]) => check(`module:${name}`, fn));
  }

  function behavioralChecks() {
    const before = legacySnapshot();
    const probeKey = `health_probe_${Date.now()}`;
    const probeValue = { ok: true, at: Date.now() };
    const rows = [];

    rows.push(check('storage:ai-namespace', () => {
      AI.storage.write(probeKey, probeValue);
      const value = AI.storage.read(probeKey, null);
      AI.storage.remove(probeKey);
      return !!value?.ok;
    }));

    rows.push(check('routing:essay', () => A.routeIntent('Review my Common App essay').agent === 'essay'));
    rows.push(check('routing:sat', () => A.routeIntent('What is my SAT weakness?').agent === 'sat'));
    rows.push(check('routing:college', () => A.routeIntent('Compare these universities').agent === 'college'));
    rows.push(check('routing:planner', () => A.routeIntent('Plan what I should study today').agent === 'planner'));

    rows.push(check('essay:deterministic-stable', () => {
      const sample = 'The robotics cart stopped three inches before the line. I had assumed the sensor was broken, but the loose cable was my mistake. I rewired it, tested it again, and wrote down what changed. That small failure taught me to separate what I expected from what the data actually showed. Now, when a project goes wrong, I start by checking the evidence instead of defending my first guess. I still like building quickly, but I have learned that careful revision is part of building well.';
      const one = A.scoreEssayDeterministic(sample, '');
      const two = A.scoreEssayDeterministic(sample, '');
      return Number.isFinite(one.overall) && one.overall === two.overall;
    }));

    rows.push(check('models:manifest-complete', () => {
      const ids = ['high','standard','low'].map(k => AI.modelManifest?.[k]?.id).filter(Boolean);
      return ids.length === 3 && new Set(ids).size === 3;
    }));

    if (Practice) {
      rows.push(check('practice:objective-self-grade', () => {
        const item = Practice.makeQuestion('linear equations', 'mixed', 'health');
        return item.gradable && Practice.grade(item, item.answer).correct === true;
      }));
      rows.push(check('practice:open-ended-not-gradable', () => {
        const item = Practice.makeQuestion('photosynthesis', 'mixed', 'health');
        return item.gradable === false && Practice.grade(item, 'sample response').correct === null;
      }));
    }

    const after = legacySnapshot();
    rows.push(check('legacy-state:unchanged', () => sameSnapshot(before, after)));
    return rows;
  }

  function contextChecks() {
    const rows = [];
    rows.push(check('context:snapshot-readable', () => {
      const snapshot = window.ScholarkAIContext?.snapshot?.();
      return snapshot && typeof snapshot === 'object';
    }));
    rows.push(check('capability:detected', () => {
      const cap = AI.state?.capability || AI.detectDevice();
      return !!cap?.tier;
    }));
    rows.push(check('fallback:available', () => typeof Agents.tutor?.run === 'function' && typeof AI.generate === 'function'));
    return rows;
  }

  function run() {
    const startedAt = Date.now();
    const checks = [...moduleChecks(), ...behavioralChecks(), ...contextChecks()];
    const failed = checks.filter(x => !x.pass);
    const report = {
      version: VERSION,
      at: Date.now(),
      durationMs: Date.now() - startedAt,
      pass: failed.length === 0,
      checks,
      failed: failed.map(x => x.name),
      capturedErrors: errors.slice(),
      telemetry: AI.telemetry?.snapshot?.() || null
    };
    AI.storage.write('health_last_report', report);
    try { document.dispatchEvent(new CustomEvent('scholark:ai-health', { detail: report })); } catch (_) {}
    return report;
  }

  function readLast() { return AI.storage.read('health_last_report', null); }
  function capturedErrors() { return errors.slice(); }
  function clearErrors() { errors.length = 0; }

  window.ScholarkAIHealth = { version: VERSION, run, readLast, errors: capturedErrors, clearErrors, legacySnapshot };

  const schedule = () => {
    try {
      const report = run();
      if (!report.pass) console.warn('[Scholark AI] runtime health checks found issues', report.failed);
      else console.info('[Scholark AI] runtime health checks passed');
    } catch (error) {
      console.warn('[Scholark AI] runtime health check could not finish', error);
    }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(schedule, { timeout: 2200 });
  else setTimeout(schedule, 1200);
})();
