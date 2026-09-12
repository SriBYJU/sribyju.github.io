(() => {
  'use strict';
  if (window.__scholarkAIBridgeInstalled) return;
  window.__scholarkAIBridgeInstalled = true;

  const AI = window.ScholarkAI;
  const Agents = window.ScholarkAIAgents;
  const A = window.ScholarkAIAlgorithms;
  if (!AI || !Agents || !A) return;

  const VERSION = '1.0.0';
  const MAX_SEEN = 2500;
  let syncTimer = null;
  let syncing = false;

  function identity() {
    return window.currentUser?.uid || window._gsUser?.uid || 'guest';
  }

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function readLocal(key) {
    try { return safeParse(localStorage.getItem(key)); } catch (_) { return null; }
  }

  function bridgeKey(kind) {
    return `bridge_seen_${VERSION}_${kind}_${identity()}`;
  }

  function seenSet(kind) {
    const items = AI.storage.read(bridgeKey(kind), []);
    return new Set(Array.isArray(items) ? items : []);
  }

  function saveSeen(kind, set) {
    const list = [...set];
    AI.storage.write(bridgeKey(kind), list.slice(Math.max(0, list.length - MAX_SEEN)));
  }

  function fingerprint(kind, parts) {
    return `${kind}:${A.stableHash(parts.map(x => String(x ?? '')).join('|'))}`;
  }

  function normalizeSAT(row) {
    const skill = String(row.skill || row.domain || 'SAT: Uncategorized');
    return {
      skill,
      correct: !!row.correct,
      difficulty: Math.max(0, Math.min(1, Number(row.difficulty ?? 0.5) / (Number(row.difficulty) > 1 ? 3 : 1))),
      confidence: row.confidence === 'high' ? 0.9 : row.confidence === 'low' ? 0.3 : 0.55,
      hints: Number(row.hintsUsed || 0),
      attempts: 1,
      errorType: row.correct ? null : normalizeSATError(row.errorType),
      note: row.errorType || '',
      source: 'sat-prep',
      at: row.at || null
    };
  }

  function normalizeSATError(value) {
    const text = String(value || '').toLowerCase();
    if (/rush/.test(text)) return 'rushed';
    if (/calculation|arithmetic/.test(text)) return 'arithmetic';
    if (/setup|concept|misconception/.test(text)) return 'concept_gap';
    if (/evidence|distractor/.test(text)) return 'evidence';
    return 'unknown';
  }

  function readSATResponses() {
    const key = `gs_prep_v2_${window.currentUser?.uid || 'guest'}`;
    const state = readLocal(key);
    return Array.isArray(state?.responses) ? state.responses : [];
  }

  function syncSAT() {
    const rows = readSATResponses();
    if (!rows.length) return { ingested: 0, total: 0 };
    const seen = seenSet('sat');
    const fresh = [];
    for (const row of rows.slice(-1000)) {
      const id = fingerprint('sat', [row.questionId, row.at, row.selected, row.correct, row.sessionKind]);
      if (seen.has(id)) continue;
      seen.add(id);
      fresh.push(normalizeSAT(row));
    }
    if (fresh.length) Agents.sat.ingest(fresh);
    saveSeen('sat', seen);
    return { ingested: fresh.length, total: rows.length };
  }

  function apState() {
    if (window.ScholarkAP?.getState) {
      try { return window.ScholarkAP.getState(); } catch (_) {}
    }
    const cleanId = String(window.currentUser?.uid || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
    return readLocal(`gs_ap_v2_${cleanId}`);
  }

  function apSubjectMeta(id) {
    const data = window.ScholarkAPData;
    return data?.subjectMap?.[id] || data?.subjects?.find?.(s => s.id === id) || null;
  }

  function unitName(meta, index) {
    const unit = meta?.units?.[Number(index)];
    return unit?.name || unit?.title || unit?.label || `Unit ${Number(index) + 1}`;
  }

  function normalizeAP(subjectId, row) {
    const meta = apSubjectMeta(subjectId);
    const subjectName = meta?.name || meta?.short || subjectId || 'AP';
    return {
      skill: `${subjectName}: ${unitName(meta, row.unitIndex)}`,
      correct: !!row.correct,
      difficulty: 0.55,
      confidence: Number.isFinite(Number(row.confidence)) ? Math.max(0, Math.min(1, Number(row.confidence) / 3)) : 0.55,
      hints: 0,
      attempts: 1,
      errorType: row.correct ? null : 'concept_gap',
      note: row.correct ? '' : 'AP unit response missed',
      source: 'ap-study',
      at: row.at || null
    };
  }

  function syncAP() {
    const state = apState();
    const subjects = state?.subjects && typeof state.subjects === 'object' ? state.subjects : {};
    const seen = seenSet('ap');
    const fresh = [];
    let total = 0;
    Object.entries(subjects).forEach(([subjectId, subjectState]) => {
      const rows = Array.isArray(subjectState?.responses) ? subjectState.responses : [];
      total += rows.length;
      rows.slice(-1000).forEach(row => {
        const id = fingerprint('ap', [subjectId, row.questionId, row.unitIndex, row.at, row.answer, row.correct, row.kind]);
        if (seen.has(id)) return;
        seen.add(id);
        fresh.push(normalizeAP(subjectId, row));
      });
    });
    if (fresh.length) Agents.ap.ingest(fresh);
    saveSeen('ap', seen);
    return { ingested: fresh.length, total };
  }

  async function syncAll(reason = 'manual') {
    if (syncing) return { skipped: true };
    syncing = true;
    try {
      const sat = syncSAT();
      const ap = syncAP();
      const ingested = sat.ingested + ap.ingested;
      if (ingested) {
        const detail = { reason, ingested, sat, ap, at: Date.now() };
        document.dispatchEvent(new CustomEvent('scholark:mastery-updated', { detail }));
        AI.telemetry.record('mastery-sync', { source: 'prep-bridge', count: ingested });
      }
      return { reason, ingested, sat, ap };
    } finally {
      syncing = false;
    }
  }

  function schedule(reason = 'interaction') {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncAll(reason).catch(error => console.warn('[Scholark AI Bridge] sync failed', error)), 120);
  }

  function installPassiveHooks() {
    document.addEventListener('click', event => {
      const page = event.target?.closest?.('#page-prep,#page-ap');
      if (page) schedule(page.id);
    }, { passive: true, capture: false });

    document.addEventListener('keydown', event => {
      if (!event.target?.closest?.('#page-prep,#page-ap') && !document.querySelector('#page-prep.active,#page-ap.active')) return;
      if (/^[1-4abcd]$/i.test(event.key) || event.key === 'Enter' || event.key.startsWith('Arrow')) schedule('keyboard-practice');
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') schedule('visibility-change');
    });
    window.addEventListener('pagehide', () => { try { syncSAT(); syncAP(); } catch (_) {} }, { once: true });
    document.addEventListener('scholark:prep-loaded', () => schedule('prep-loaded'));
    document.addEventListener('scholark:ap-loaded', () => schedule('ap-loaded'));
  }

  installPassiveHooks();
  setTimeout(() => syncAll('initial').catch(() => {}), 900);

  window.ScholarkAIBridge = {
    version: VERSION,
    syncAll,
    syncSAT,
    syncAP,
    schedule,
    status() {
      return {
        identity: identity(),
        satResponses: readSATResponses().length,
        apSubjects: Object.keys(apState()?.subjects || {}).length,
        masterySkills: Object.keys(Agents.mastery.all()).length
      };
    }
  };
})();
