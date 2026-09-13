(() => {
  'use strict';
  if (window.__scholarkAIReliabilityInstalled) return;
  window.__scholarkAIReliabilityInstalled = true;

  const AI = window.ScholarkAI;
  const A = window.ScholarkAIAlgorithms;
  const Agents = window.ScholarkAIAgents;
  if (!AI || !A || !Agents) {
    console.error('[Scholark AI] reliability layer could not attach.');
    return;
  }

  const VERSION = '1.1.0';
  const baseDetectCapability = A.detectCapability.bind(A);
  const baseRouteIntent = A.routeIntent.bind(A);
  const baseGenerate = AI.generate.bind(AI);
  const baseUnload = AI.unload.bind(AI);
  const baseCancel = AI.cancelGeneration.bind(AI);
  const baseAsk = Agents.ask.bind(Agents);

  const RESCUE_MODEL = Object.freeze({
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    family: 'Llama 3.2',
    contextWindow: 3072,
    purpose: 'Independent local rescue model when the primary Qwen path is unavailable or produces a weak answer'
  });

  const PRODUCT_FACTS = Object.freeze({
    name: 'Scholark',
    creator: 'Shriyan Avadhanula',
    description: 'an independent, student-built, non-commercial educational project for college planning and academic support',
    pricing: 'Scholark’s core toolkit is free to use.',
    privacy: 'Scholark’s AI architecture prioritizes private on-device processing and local deterministic tools.',
    capabilities: [
      'GPA and academic planning',
      'SAT/ACT preparation and diagnostics',
      'AP study support',
      'college research and comparison',
      'essay feedback',
      'study planning',
      'scholarship guidance',
      'adaptive practice'
    ]
  });

  let rescueEngine = null;
  let rescueLoading = null;
  let rescueLastUsedAt = 0;

  function improvedCapability(signals = {}) {
    const deviceMemory = Number(signals.deviceMemory || 0);
    const cores = Number(signals.hardwareConcurrency || 0);
    const mobile = !!signals.mobile;
    const webgpu = !!signals.webgpu;
    const wasm = signals.wasm !== false;
    const saveData = !!signals.saveData;

    if (webgpu) {
      if (!mobile && !saveData && deviceMemory >= 8 && cores >= 8) {
        return { tier: 'high', generative: true, modelTier: 'high', reason: 'strong-webgpu' };
      }
      // Do not penalize a capable phone merely for having a coarse pointer. Modern mobile
      // Safari/Chrome devices can run the balanced model well enough to deserve it as the default.
      const definitelyConstrained = saveData || (deviceMemory > 0 && deviceMemory <= 3) || (cores > 0 && cores <= 4);
      if (!definitelyConstrained) {
        return { tier: 'standard', generative: true, modelTier: 'standard', reason: mobile ? 'mobile-webgpu' : 'webgpu' };
      }
      return { tier: 'low', generative: true, modelTier: 'low', reason: 'constrained-webgpu' };
    }
    if (wasm) return { tier: 'compatibility', generative: false, modelTier: null, reason: 'wasm-task-specific' };
    return { tier: 'compatibility', generative: false, modelTier: null, reason: 'deterministic-only' };
  }

  function isKnowledgeQuestion(input = '') {
    const q = String(input).toLowerCase().replace(/scholar\s*k/g, 'scholark');
    return /\bscholark\b/.test(q) && (
      /\bwho\s+(made|built|created|founded|owns|runs|started)\b/.test(q) ||
      /\bwho\s+is\s+(behind|the\s+(creator|founder|maker)\s+of)\b/.test(q) ||
      /\bwhat\s+is\s+scholark\b/.test(q) ||
      /\b(is|does)\s+scholark\s+(free|cost|charge)\b/.test(q) ||
      /\bwhat\s+(can|does)\s+scholark\b/.test(q) ||
      /\bscholark\s+(creator|founder|features|privacy|about)\b/.test(q)
    );
  }

  function improvedRouteIntent(input = '') {
    if (isKnowledgeQuestion(input)) {
      return {
        agent: 'knowledge',
        confidence: 10,
        scores: { tutor: 0, essay: 0, planner: 0, sat: 0, ap: 0, college: 0, scholarship: 0, knowledge: 10 }
      };
    }
    return baseRouteIntent(input);
  }

  function productAnswer(input = '') {
    const q = String(input).toLowerCase().replace(/scholar\s*k/g, 'scholark');
    if (/who\s+(made|built|created|founded|started)|who\s+is\s+(behind|the\s+(creator|founder|maker))|scholark\s+(creator|founder)/.test(q)) {
      return `Scholark was built by ${PRODUCT_FACTS.creator}. It is ${PRODUCT_FACTS.description}.`;
    }
    if (/(is|does)\s+scholark\s+(free|cost|charge)/.test(q)) {
      return `${PRODUCT_FACTS.pricing} It is designed as ${PRODUCT_FACTS.description}.`;
    }
    if (/what\s+(can|does)\s+scholark|scholark\s+features/.test(q)) {
      return `Scholark brings together ${PRODUCT_FACTS.capabilities.slice(0, -1).join(', ')}, and ${PRODUCT_FACTS.capabilities.at(-1)} in one student-built platform.`;
    }
    if (/privacy/.test(q)) return PRODUCT_FACTS.privacy;
    return `Scholark is ${PRODUCT_FACTS.description}, built by ${PRODUCT_FACTS.creator}. ${PRODUCT_FACTS.pricing}`;
  }

  function normalizeMessages(messages) {
    const list = Array.isArray(messages) ? messages : [];
    const out = [];
    for (const item of list) {
      if (!item || !['system', 'user', 'assistant'].includes(item.role)) continue;
      const max = item.role === 'system' ? 9000 : 14000;
      out.push({ role: item.role, content: String(item.content || '').slice(0, max) });
    }
    if (!out.some(row => row.role === 'user')) throw new Error('missing-user-message');
    return out.slice(-20);
  }

  function lastUserText(messages) {
    return [...messages].reverse().find(row => row.role === 'user')?.content || '';
  }

  function normalizeError(error) {
    return {
      name: error?.name || 'Error',
      message: String(error?.message || error || 'Unknown error').slice(0, 500),
      at: Date.now()
    };
  }

  function isMemoryFailure(error) {
    const s = String(error?.message || error || '').toLowerCase();
    return /out of memory|memory|device lost|gpudevicelost|vk_error_device_lost|allocation|buffer.*size/.test(s);
  }

  function isTransientFailure(error) {
    const s = String(error?.message || error || '').toLowerCase();
    return /timeout|network|fetch|empty-local-model-response|device lost|operation.*failed|abort/.test(s);
  }

  function isWeakAnswer(text, messages) {
    const value = String(text || '').trim();
    if (value.length < 24) return true;
    if (/break the task into three pieces|use the relevant scholark practice or course resource|compatibility-mode guidance is rule-based/i.test(value)) return true;
    const question = lastUserText(messages).toLowerCase();
    if (/^\s*who\b/.test(question) && /guided help|practice resource|solve one example/i.test(value)) return true;
    return false;
  }

  function sequenceFor(capability, requestedTier) {
    const tier = requestedTier || capability?.modelTier || 'standard';
    if (tier === 'high') return ['high', 'standard', 'rescue', 'low'];
    if (tier === 'standard') return ['standard', 'rescue', 'low'];
    if (tier === 'low') return capability?.saveData ? ['low', 'standard'] : ['standard', 'low', 'rescue'];
    return [];
  }

  function withTimeout(promise, ms, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label || 'generation-timeout')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  async function complete(engine, messages, options = {}) {
    AI.state.generating = true;
    try {
      const request = {
        messages,
        temperature: options.temperature ?? 0.18,
        top_p: options.topP ?? 0.9,
        max_tokens: options.maxTokens ?? 500,
        seed: Number.isFinite(options.seed) ? options.seed : 41721,
        stream: false,
        enable_thinking: options.enableThinking === true
      };
      const result = await withTimeout(
        engine.chat.completions.create(request),
        options.timeoutMs || 90000,
        'generation-timeout'
      );
      const text = result?.choices?.[0]?.message?.content;
      if (!text || typeof text !== 'string') throw new Error('empty-local-model-response');
      AI.state.generationCount = Number(AI.state.generationCount || 0) + 1;
      return text.trim();
    } finally {
      AI.state.generating = false;
    }
  }

  async function unloadRescue() {
    if (rescueEngine) {
      try { await rescueEngine.unload?.(); } catch (_) {}
    }
    rescueEngine = null;
    rescueLoading = null;
    if (AI.state.modelTier === 'rescue') {
      AI.state.modelTier = null;
      AI.state.modelId = null;
      AI.state.runtime = 'not-loaded';
    }
  }

  async function loadRescue(options = {}) {
    if (rescueEngine) return rescueEngine;
    if (rescueLoading) return rescueLoading;
    if (!navigator.gpu) throw new Error('webgpu-unavailable');

    rescueLoading = (async () => {
      await baseUnload();
      const webllm = AI.state.webllm || await import(AI.runtimeSource);
      if (!webllm || typeof webllm.CreateMLCEngine !== 'function') throw new Error('webllm-runtime-invalid');
      AI.state.webllm = webllm;
      AI.state.runtime = 'loading-model';
      AI.state.modelTier = 'rescue';
      AI.state.modelId = RESCUE_MODEL.id;
      const engine = await webllm.CreateMLCEngine(RESCUE_MODEL.id, {
        initProgressCallback: report => {
          options.onProgress?.({
            text: report?.text || 'Preparing backup on-device model',
            progress: Number.isFinite(report?.progress) ? report.progress : null,
            tier: 'rescue',
            modelId: RESCUE_MODEL.id
          });
        },
        logLevel: 'WARN'
      }, { context_window_size: RESCUE_MODEL.contextWindow });
      rescueEngine = engine;
      rescueLastUsedAt = Date.now();
      AI.state.runtime = 'ready';
      AI.state.lastFailure = null;
      return engine;
    })().catch(error => {
      AI.state.lastFailure = normalizeError(error);
      AI.state.runtime = 'failed';
      throw error;
    }).finally(() => { rescueLoading = null; });

    return rescueLoading;
  }

  async function runTier(tier, messages, options = {}) {
    if (tier === 'rescue') {
      const engine = await loadRescue(options);
      rescueLastUsedAt = Date.now();
      return complete(engine, messages, { ...options, maxTokens: Math.min(options.maxTokens || 500, 500) });
    }
    await unloadRescue();
    const engine = await AI.loadModel(tier, options);
    const maxTokens = tier === 'low' ? Math.min(options.maxTokens || 500, 350) : options.maxTokens;
    return complete(engine, messages, { ...options, maxTokens });
  }

  async function finalFallback(options, failures, capability, reason = 'all-local-models-unavailable') {
    AI.state.fallbackCount = Number(AI.state.fallbackCount || 0) + 1;
    AI.telemetry.record('final-fallback', { agent: options.agent || 'unknown', reason, failures: failures.length });
    const fallback = typeof options.fallback === 'function' ? options.fallback : null;
    if (fallback) {
      const value = await fallback({ failures, capability, reason });
      return { mode: 'deterministic-fallback', tier: null, modelId: null, value, failures, reason };
    }
    return {
      mode: 'deterministic-fallback', tier: null, modelId: null,
      value: { message: 'Use Scholark’s guided tools and saved resources for this task.' },
      failures, reason
    };
  }

  async function reliableGenerate(messages, options = {}) {
    const capability = AI.detectDevice();
    const safeMessages = normalizeMessages(messages);
    const failures = [];

    if (capability.generative) {
      const sequence = sequenceFor(capability, options.modelTier);
      for (let index = 0; index < sequence.length; index += 1) {
        const tier = sequence[index];
        const attempts = index === 0 ? 2 : 1;
        for (let attempt = 0; attempt < attempts; attempt += 1) {
          try {
            const text = await runTier(tier, safeMessages, {
              ...options,
              temperature: attempt ? Math.min(options.temperature ?? 0.18, 0.12) : options.temperature,
              maxTokens: attempt ? Math.min(options.maxTokens || 500, 420) : options.maxTokens
            });
            if (isWeakAnswer(text, safeMessages)) {
              failures.push({ tier, attempt, message: 'quality-gate-rejected-weak-response', at: Date.now() });
              AI.telemetry.record('quality-retry', { agent: options.agent || 'unknown', tier, reason: 'weak-response' });
              break;
            }
            AI.telemetry.record('generation-success', { agent: options.agent || 'unknown', tier, attempt, modelId: tier === 'rescue' ? RESCUE_MODEL.id : AI.state.modelId });
            return {
              mode: 'local-generative',
              tier,
              modelId: tier === 'rescue' ? RESCUE_MODEL.id : AI.state.modelId,
              text,
              failures,
              reliabilityStage: index === 0 && attempt === 0 ? 'primary' : (tier === 'rescue' ? 'alternate-model' : 'recovery')
            };
          } catch (error) {
            const normalized = normalizeError(error);
            failures.push({ tier, attempt, ...normalized });
            AI.state.lastFailure = normalized;
            if (tier === 'rescue') await unloadRescue();
            else await baseUnload();
            const memoryFailure = isMemoryFailure(error);
            if (memoryFailure || !isTransientFailure(error) || attempt + 1 >= attempts) break;
            await new Promise(resolve => setTimeout(resolve, 160));
          }
        }
      }
    }

    if (options.suppressFinalFallback) {
      return { mode: 'generation-unavailable', tier: null, modelId: null, failures, reason: capability.reason };
    }
    return finalFallback(options, failures, capability, capability.generative ? 'all-local-models-unavailable' : capability.reason);
  }

  async function reliableGenerateStructured(messages, options = {}) {
    const fallback = options.fallback;
    const first = await reliableGenerate(messages, { ...options, fallback: null, suppressFinalFallback: true });
    if (first.mode === 'local-generative') {
      const parsed = AI.extractJSONObject(first.text);
      const validation = typeof options.validate === 'function' ? options.validate(parsed) : { valid: !!parsed };
      if (parsed && validation?.valid !== false) return { ...first, value: parsed, parsed: true };

      const repairMessages = [
        { role: 'system', content: 'Return valid JSON only. Do not add markdown, commentary, or code fences.' },
        { role: 'user', content: `Repair this into valid JSON while preserving its meaning:\n${String(first.text).slice(0, 8000)}` }
      ];
      const repaired = await reliableGenerate(repairMessages, {
        ...options,
        temperature: 0,
        maxTokens: Math.min(options.maxTokens || 500, 600),
        fallback: null,
        suppressFinalFallback: true
      });
      if (repaired.mode === 'local-generative') {
        const value = AI.extractJSONObject(repaired.text);
        const repairedValidation = typeof options.validate === 'function' ? options.validate(value) : { valid: !!value };
        if (value && repairedValidation?.valid !== false) return { ...repaired, value, parsed: true, repaired: true };
      }
      const failures = [...(first.failures || []), ...(repaired.failures || []), { message: 'invalid-structured-output' }];
      return finalFallback({ ...options, fallback }, failures, AI.state.capability, 'invalid-structured-output');
    }
    return finalFallback({ ...options, fallback }, first.failures || [], AI.state.capability, first.reason || 'generation-unavailable');
  }

  async function reliableAsk(input, context = {}) {
    const route = A.routeIntent(input);
    if (route.agent === 'knowledge') {
      const answer = productAnswer(input);
      return {
        route,
        mode: 'local-generative',
        tier: 'grounded',
        modelId: null,
        generationKind: 'grounded-product-knowledge',
        answer,
        text: answer,
        failures: []
      };
    }
    return baseAsk(input, context);
  }

  A.detectCapability = improvedCapability;
  A.routeIntent = improvedRouteIntent;
  AI.generate = reliableGenerate;
  AI.generateStructured = reliableGenerateStructured;
  Agents.ask = reliableAsk;

  AI.cancelGeneration = function cancelReliableGeneration() {
    try { rescueEngine?.interruptGenerate?.(); } catch (_) {}
    return baseCancel();
  };

  AI.unload = async function unloadReliableModels() {
    await unloadRescue();
    return baseUnload();
  };

  // Recompute the capability after replacing the old mobile-is-always-low heuristic.
  AI.detectDevice();

  window.ScholarkAIReliability = {
    version: VERSION,
    rescueModel: RESCUE_MODEL,
    productFacts: PRODUCT_FACTS,
    sequenceFor,
    productAnswer,
    isWeakAnswer,
    unloadRescue,
    get rescueLastUsedAt() { return rescueLastUsedAt; }
  };

  console.info('[Scholark AI] reliability layer ready', {
    version: VERSION,
    tier: AI.state.capability?.tier,
    rescueModel: RESCUE_MODEL.id
  });
})();
