(() => {
  'use strict';
  if (window.__scholarkAICoreInstalled) return;
  window.__scholarkAICoreInstalled = true;

  const A = window.ScholarkAIAlgorithms;
  if (!A) {
    console.error('[Scholark AI] algorithms module missing; AI layer not installed.');
    return;
  }

  const VERSION = '1.0.1';
  const WEBLLM_VERSION = '0.2.82';
  const WEBLLM_IMPORT = `https://esm.sh/@mlc-ai/web-llm@${WEBLLM_VERSION}?bundle`;
  const STORAGE_PREFIX = 'scholark_ai_v1_';

  const MODEL_MANIFEST = Object.freeze({
    high: {
      id: 'Qwen3-1.7B-q4f16_1-MLC',
      family: 'Qwen3',
      purpose: 'High-capability local academic generation on stronger desktop devices',
      runtime: `WebLLM ${WEBLLM_VERSION}`,
      approximateFootprint: '~1.7 GB class',
      license: 'Apache-2.0 model family; verify bundled model card before future replacement',
      contextWindow: 3072,
      fallback: 'standard'
    },
    standard: {
      id: 'Qwen3-0.6B-q4f16_1-MLC',
      family: 'Qwen3',
      purpose: 'Balanced local academic generation',
      runtime: `WebLLM ${WEBLLM_VERSION}`,
      approximateFootprint: '~1 GB class',
      license: 'Apache-2.0 model family; verify bundled model card before future replacement',
      contextWindow: 3072,
      fallback: 'low'
    },
    low: {
      id: 'SmolLM2-360M-Instruct-q4f32_1-MLC',
      family: 'SmolLM2',
      purpose: 'Constrained WebGPU generation with shorter context/output',
      runtime: `WebLLM ${WEBLLM_VERSION}`,
      approximateFootprint: '~580 MB VRAM class',
      license: 'Apache-2.0 model family; verify bundled model card before future replacement',
      contextWindow: 2048,
      fallback: 'deterministic'
    }
  });

  const listeners = new Map();
  const state = {
    capability: null,
    runtime: 'not-loaded',
    modelTier: null,
    modelId: null,
    modelProgress: null,
    engine: null,
    webllm: null,
    loading: null,
    generating: false,
    generationAbort: false,
    lastFailure: null,
    fallbackCount: 0,
    generationCount: 0
  };

  function emit(type, detail = {}) {
    const event = { type, at: Date.now(), ...detail };
    (listeners.get(type) || []).forEach(fn => {
      try { fn(event); } catch (error) { console.warn('[Scholark AI] listener error', error); }
    });
    (listeners.get('*') || []).forEach(fn => {
      try { fn(event); } catch (error) { console.warn('[Scholark AI] listener error', error); }
    });
  }

  function on(type, fn) {
    if (typeof fn !== 'function') return () => {};
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
    return () => listeners.get(type)?.delete(fn);
  }

  function detectDevice() {
    const nav = navigator || {};
    const mobile = matchMedia?.('(pointer: coarse)')?.matches || /Android|iPhone|iPad|Mobile/i.test(nav.userAgent || '');
    const wasm = typeof WebAssembly === 'object';
    const signals = {
      webgpu: !!nav.gpu,
      wasm,
      deviceMemory: Number(nav.deviceMemory || 0),
      hardwareConcurrency: Number(nav.hardwareConcurrency || 0),
      mobile,
      saveData: !!nav.connection?.saveData,
      browser: nav.userAgent || ''
    };
    state.capability = { ...signals, ...A.detectCapability(signals) };
    emit('capability', state.capability);
    return state.capability;
  }

  function safeStore(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('[Scholark AI] local persistence unavailable', error);
      return false;
    }
  }

  function safeRead(key, fallback = null) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function safeRemove(key) {
    try { localStorage.removeItem(STORAGE_PREFIX + key); } catch (_) {}
  }

  function sessionKey(agent) {
    const uid = window.currentUser?.uid || window._gsUser?.uid || 'local';
    return `session_${uid}_${agent}`;
  }

  const Sessions = {
    get(agent) {
      const value = safeRead(sessionKey(agent), { messages: [], updatedAt: 0 });
      if (!value || !Array.isArray(value.messages)) return { messages: [], updatedAt: 0 };
      return { ...value, messages: A.trimContext(value.messages, 9000) };
    },
    append(agent, role, content) {
      const session = this.get(agent);
      session.messages.push({ role, content: String(content || '').slice(0, 12000) });
      session.messages = A.trimContext(session.messages, 9000);
      session.updatedAt = Date.now();
      safeStore(sessionKey(agent), session);
      return session;
    },
    clear(agent) { safeRemove(sessionKey(agent)); },
    clearAll() {
      try {
        Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX + 'session_')).forEach(k => localStorage.removeItem(k));
      } catch (_) {}
    }
  };

  function modelTierSequence(startTier) {
    const tier = startTier || state.capability?.modelTier || 'standard';
    if (tier === 'high') return ['high', 'standard', 'low'];
    if (tier === 'standard') return ['standard', 'low'];
    if (tier === 'low') return ['low'];
    return [];
  }

  async function importWebLLM() {
    if (state.webllm) return state.webllm;
    if (!navigator.gpu) throw new Error('webgpu-unavailable');
    state.runtime = 'loading-runtime';
    emit('runtime', { status: state.runtime });
    const module = await import(WEBLLM_IMPORT);
    if (!module || typeof module.CreateMLCEngine !== 'function') throw new Error('webllm-runtime-invalid');
    state.webllm = module;
    return module;
  }

  async function preflightRuntime() {
    const result = {
      at: Date.now(),
      webllmVersion: WEBLLM_VERSION,
      runtimeSource: WEBLLM_IMPORT,
      webgpu: !!navigator.gpu,
      runtimeImport: 'not-attempted',
      modelManifest: Object.values(MODEL_MANIFEST).map(({ id, family, contextWindow, fallback }) => ({ id, family, contextWindow, fallback }))
    };
    try {
      // Importing the bundle itself does not download model weights. This is safe to expose as a
      // diagnostics action and gives us a direct way to distinguish bundle/CDN failure from GPU or
      // model-loading failure.
      const module = await import(WEBLLM_IMPORT);
      result.runtimeImport = typeof module?.CreateMLCEngine === 'function' ? 'ok' : 'invalid';
      if (result.runtimeImport === 'ok') state.webllm = module;
    } catch (error) {
      result.runtimeImport = 'failed';
      result.error = normalizeError(error);
    }
    Telemetry.record('runtime-preflight', { runtimeImport: result.runtimeImport, webgpu: result.webgpu });
    return result;
  }

  async function loadModel(tier, options = {}) {
    const record = MODEL_MANIFEST[tier];
    if (!record) throw new Error(`unknown-model-tier:${tier}`);
    if (state.engine && state.modelId === record.id) return state.engine;
    if (state.loading) return state.loading;

    state.loading = (async () => {
      const webllm = await importWebLLM();
      const progress = report => {
        const normalized = {
          text: report?.text || 'Preparing local model',
          progress: Number.isFinite(report?.progress) ? report.progress : null,
          timeElapsed: report?.timeElapsed || null,
          tier,
          modelId: record.id
        };
        state.modelProgress = normalized;
        emit('model-progress', normalized);
        options.onProgress?.(normalized);
      };
      state.runtime = 'loading-model';
      state.modelTier = tier;
      state.modelId = record.id;
      emit('runtime', { status: state.runtime, tier, modelId: record.id });

      if (state.engine) {
        try { await state.engine.unload?.(); } catch (_) {}
        state.engine = null;
      }

      const engine = await webllm.CreateMLCEngine(record.id, {
        initProgressCallback: progress,
        logLevel: 'WARN'
      }, {
        context_window_size: record.contextWindow
      });
      state.engine = engine;
      state.runtime = 'ready';
      state.lastFailure = null;
      emit('runtime', { status: 'ready', tier, modelId: record.id });
      return engine;
    })().catch(error => {
      state.lastFailure = normalizeError(error);
      state.runtime = 'failed';
      emit('runtime-error', { error: state.lastFailure, tier, modelId: record.id });
      throw error;
    }).finally(() => { state.loading = null; });

    return state.loading;
  }

  function normalizeError(error) {
    return {
      name: error?.name || 'Error',
      message: String(error?.message || error || 'Unknown error').slice(0, 500),
      at: Date.now()
    };
  }

  function timeoutPromise(ms, label = 'operation-timeout') {
    return new Promise((_, reject) => setTimeout(() => reject(new Error(label)), ms));
  }

  async function completion(engine, messages, options = {}) {
    state.generating = true;
    state.generationAbort = false;
    emit('generation-start', { agent: options.agent || 'unknown' });
    try {
      const request = {
        messages,
        temperature: options.temperature ?? 0.2,
        top_p: options.topP ?? 0.9,
        max_tokens: options.maxTokens ?? 500,
        seed: Number.isFinite(options.seed) ? options.seed : 41721,
        stream: false
      };
      const result = await Promise.race([
        engine.chat.completions.create(request),
        timeoutPromise(options.timeoutMs || 90000, 'generation-timeout')
      ]);
      const text = result?.choices?.[0]?.message?.content;
      if (!text || typeof text !== 'string') throw new Error('empty-local-model-response');
      state.generationCount += 1;
      emit('generation-complete', { agent: options.agent || 'unknown', chars: text.length });
      return text;
    } finally {
      state.generating = false;
    }
  }

  async function generate(messages, options = {}) {
    const cap = state.capability || detectDevice();
    const safeMessages = normalizeMessages(messages);
    const fallback = typeof options.fallback === 'function' ? options.fallback : null;
    const failures = [];

    if (cap.generative) {
      for (const tier of modelTierSequence(options.modelTier || cap.modelTier)) {
        try {
          const engine = await loadModel(tier, options);
          const result = await completion(engine, safeMessages, {
            ...options,
            maxTokens: tier === 'low' ? Math.min(options.maxTokens || 500, 350) : options.maxTokens
          });
          return { mode: 'local-generative', tier, modelId: MODEL_MANIFEST[tier].id, text: result, failures };
        } catch (error) {
          const normalized = normalizeError(error);
          failures.push({ tier, ...normalized });
          try { await state.engine?.unload?.(); } catch (_) {}
          state.engine = null;
          state.modelId = null;
          state.modelTier = null;
        }
      }
    }

    state.fallbackCount += 1;
    emit('fallback', { agent: options.agent || 'unknown', failures, reason: cap.reason });
    if (fallback) {
      const value = await fallback({ failures, capability: cap });
      return { mode: 'deterministic-fallback', tier: null, modelId: null, value, failures };
    }
    return {
      mode: 'deterministic-fallback', tier: null, modelId: null,
      value: { message: 'Use Scholark’s guided tools and saved resources for this task.' }, failures
    };
  }

  function normalizeMessages(messages) {
    const list = Array.isArray(messages) ? messages : [];
    const out = [];
    for (const item of list) {
      if (!item || !['system', 'user', 'assistant'].includes(item.role)) continue;
      let content = String(item.content || '');
      if (item.role !== 'system') content = content.slice(0, 14000);
      else content = content.slice(0, 9000);
      out.push({ role: item.role, content });
    }
    if (!out.some(x => x.role === 'user')) throw new Error('missing-user-message');
    return out.slice(-20);
  }

  function extractJSONObject(text) {
    const source = String(text || '').trim();
    const candidates = [source];
    const fence = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) candidates.unshift(fence[1]);
    const first = source.indexOf('{');
    const last = source.lastIndexOf('}');
    if (first >= 0 && last > first) candidates.unshift(source.slice(first, last + 1));
    for (const candidate of candidates) {
      try { return JSON.parse(candidate); } catch (_) {}
    }
    return null;
  }

  async function generateStructured(messages, options = {}) {
    const fallback = options.fallback;
    const result = await generate(messages, { ...options, fallback });
    if (result.mode !== 'local-generative') return result;
    const parsed = extractJSONObject(result.text);
    const validation = typeof options.validate === 'function' ? options.validate(parsed) : { valid: !!parsed };
    if (parsed && validation?.valid !== false) return { ...result, value: parsed, parsed: true };

    try {
      const repairMessages = [
        { role: 'system', content: 'Return valid JSON only. Do not add markdown, commentary, or code fences.' },
        { role: 'user', content: `Repair this into valid JSON while preserving its meaning:\n${String(result.text).slice(0, 8000)}` }
      ];
      const repaired = await generate(repairMessages, { ...options, temperature: 0, maxTokens: Math.min(options.maxTokens || 500, 600), fallback: null });
      if (repaired.mode === 'local-generative') {
        const repairedValue = extractJSONObject(repaired.text);
        const repairedValidation = typeof options.validate === 'function' ? options.validate(repairedValue) : { valid: !!repairedValue };
        if (repairedValue && repairedValidation?.valid !== false) return { ...repaired, value: repairedValue, parsed: true, repaired: true };
      }
    } catch (_) {}

    state.fallbackCount += 1;
    emit('fallback', { agent: options.agent || 'unknown', reason: 'invalid-structured-output' });
    return {
      mode: 'deterministic-fallback',
      value: typeof fallback === 'function' ? await fallback({ reason: 'invalid-structured-output' }) : null,
      failures: [...(result.failures || []), { message: 'invalid-structured-output' }]
    };
  }

  function cancelGeneration() {
    state.generationAbort = true;
    try { state.engine?.interruptGenerate?.(); } catch (_) {}
    emit('generation-cancel', {});
  }

  async function unload() {
    try { await state.engine?.unload?.(); } catch (_) {}
    state.engine = null;
    state.modelId = null;
    state.modelTier = null;
    state.runtime = 'not-loaded';
    emit('runtime', { status: state.runtime });
  }

  const Telemetry = {
    snapshot() {
      return {
        version: VERSION,
        capability: state.capability ? { ...state.capability, browser: undefined } : null,
        runtime: state.runtime,
        modelTier: state.modelTier,
        modelId: state.modelId,
        fallbackCount: state.fallbackCount,
        generationCount: state.generationCount,
        lastFailure: state.lastFailure
      };
    },
    record(kind, data = {}) {
      const history = safeRead('diagnostics', []);
      const next = [...(Array.isArray(history) ? history : []), { kind, at: Date.now(), ...data }].slice(-100);
      safeStore('diagnostics', next);
    },
    read() { return safeRead('diagnostics', []); },
    clear() { safeRemove('diagnostics'); }
  };

  state.capability = detectDevice();

  window.ScholarkAI = {
    version: VERSION,
    webllmVersion: WEBLLM_VERSION,
    runtimeSource: WEBLLM_IMPORT,
    modelManifest: MODEL_MANIFEST,
    state,
    algorithms: A,
    detectDevice,
    on,
    generate,
    generateStructured,
    loadModel,
    preflightRuntime,
    cancelGeneration,
    unload,
    sessions: Sessions,
    telemetry: Telemetry,
    storage: { read: safeRead, write: safeStore, remove: safeRemove },
    extractJSONObject
  };

  console.info('[Scholark AI] local-first runtime ready', { version: VERSION, capability: state.capability.tier });
})();