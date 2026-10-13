(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ScholarkAILearning = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // Compute explicit arithmetic locally. Never execute student input as code.
  function calculate(input = '') {
    const raw = String(input).trim().toLowerCase();
    const wantsSteps = /^(?:please\s+)?(?:explain|walk me through|show(?: me)? how to (?:calculate|solve))\b|\b(?:step[- ]by[- ]step|with (?:each|every|all) step checked|with steps)\b/.test(raw);
    const expression = raw
      .replace(/^(?:please\s+)?(?:explain|walk me through|show(?: me)? how to (?:calculate|solve))\s+/, '')
      .replace(/\s+(?:with (?:each|every|all) step checked|step[- ]by[- ]step|with steps)\s*[?.!]*$/, '')
      .replace(/^(?:what(?:'s| is)|calculate|compute|evaluate|solve)\s+/, '')
      .replace(/\s*(?:equals?|=)\s*\??$/, '')
      .replace(/[?]+$/, '').replace(/\bmultiplied by\b|\btimes\b|[×·]/g, '*')
      .replace(/\bdivided by\b|÷/g, '/').replace(/\bplus\b/g, '+')
      .replace(/\bminus\b|−/g, '-').trim();
    if (!/^[\d\s.()+*/^\-]+$/.test(expression) || !/[+*/^\-]/.test(expression) || expression.length > 180) return null;
    const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+*/^\-]/g) || [];
    if (tokens.join('') !== expression.replace(/\s/g, '')) return null;
    let index = 0, depth = 0;
    const take = token => tokens[index] === token && (++index, true);
    const primary = () => {
      if (++depth > 24) throw new Error('expression-too-deep');
      let value;
      if (take('(')) { value = sum(); if (!take(')')) throw new Error('invalid-expression'); }
      else { const token = tokens[index++]; if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token || '')) throw new Error('invalid-expression'); value = Number(token); }
      depth--;
      return value;
    };
    const power = () => { const value = primary(); return take('^') ? value ** unary() : value; };
    const unary = () => take('+') ? unary() : take('-') ? -unary() : power();
    const product = () => {
      let value = unary();
      while (tokens[index] === '*' || tokens[index] === '/') {
        const op = tokens[index++], right = unary();
        if (op === '/' && right === 0) throw new Error('division-by-zero');
        value = op === '*' ? value * right : value / right;
      }
      return value;
    };
    const sum = () => { let value = product(); while (tokens[index] === '+' || tokens[index] === '-') { const op = tokens[index++], right = product(); value = op === '+' ? value + right : value - right; } return value; };
    try {
      const value = sum();
      if (index !== tokens.length) return null;
      if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) return { expression, error: 'This expression exceeds the calculator’s supported number range.' };
      const result = { expression, value: Number(value.toPrecision(12)) };
      const fractions = expression.match(/^(-?\d+)\s*\/\s*(\d+)\s*([+-])\s*(-?\d+)\s*\/\s*(\d+)$/);
      if (fractions) {
        const [, leftN, leftD, operator, rightN, rightD] = fractions;
        const a = Number(leftN), b = Number(leftD), c = Number(rightN), d = Number(rightD);
        const gcd = (x, y) => y ? gcd(y, x % y) : x;
        const divisor = gcd(b, d), common = b / divisor * d;
        const left = a * (common / b), right = c * (common / d);
        const numerator = operator === '+' ? left + right : left - right;
        if (Number.isSafeInteger(common) && Number.isSafeInteger(numerator) && common <= 1e9) {
          const reduction = gcd(Math.abs(numerator), common);
          const exact = common / reduction === 1 ? String(numerator / reduction) : `${numerator / reduction}/${common / reduction}`;
          const unreduced = `${numerator}/${common}`;
          const approximation = Number(exact) === result.value ? '' : ` (about ${Number(result.value.toPrecision(6))})`;
          result.explanation = wantsSteps
            ? `Use a common denominator of ${common}. ${a}/${b} = ${left}/${common} and ${c}/${d} = ${right}/${common}. Then ${left}/${common} ${operator} ${right}/${common} = ${unreduced}${exact === unreduced ? '' : ` = ${exact}`}${approximation}.`
            : `${a}/${b} ${operator} ${c}/${d} = ${exact}${approximation}.`;
        }
      }
      return result;
    } catch (error) {
      return error.message === 'division-by-zero' ? { expression, error: 'Division by zero is undefined.' } : null;
    }
  }

  const normalize = text => String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  // Short, source-backed notes for common misconceptions. Keep these separate
  // from course progress: asking a science question must never imply enrollment.
  const referenceNotes = [
    { name: 'AP Computer Science Principles', subject: 'Computer Science', matches: /\bap\s*csp\b|\bcomputer science principles\b/i,
      text: 'AP CSP means AP Computer Science Principles, not chemistry. Its big ideas include creative development, data, algorithms and programming, computer systems and networks, and the impact of computing. One practice score describes performance on those questions; it does not establish mastery of an entire unit.',
      url: 'https://apstudents.collegeboard.org/courses/ap-computer-science-principles', sourceLabel: 'College Board AP Students' },
    { name:'residual', subject:'Statistics', matches:/\bresiduals?\b/i, text:'A residual is a number, not a model: observed value minus predicted value. A positive residual means the observation lies above the fitted line; a negative one lies below. Residual plots can contain patterns. A systematic curve suggests that a straight-line model may be unsuitable; calculating residuals does not remove that pattern.', url:'https://openstax.org/books/introductory-statistics-2e/pages/12-3-the-regression-equation', sourceLabel:'OpenStax Introductory Statistics 2e' },
    {
      name: 'Enzyme action', subject: 'Biology', matches: /\benzymes?\b/i,
      text: 'Enzymes are biological catalysts. They bind substrates at an active site and lower the activation-energy barrier, speeding up reactions without being consumed overall. They do not change the reaction’s net free-energy change or equilibrium. Temperature, pH, and inhibitors can affect their shape and activity.',
      accuracyReminder: 'The environment affects enzyme activity; enzymes do not work by changing the temperature or pH of the whole environment.',
      url: 'https://openstax.org/books/biology-2e/pages/6-5-enzymes', sourceLabel: 'OpenStax Biology 2e'
    },
    {
      name: 'Chemical bonds and energy', subject: 'Chemistry',
      matches: /\bbonds?\b.*\b(?:energy|break\w*|form\w*|releas\w*|absorb\w*|endothermic|exothermic)\b|\b(?:break\w*|form\w*)\b.*\bbonds?\b/i,
      text: 'Separating bonded atoms requires an input of energy. Forming bonds releases energy. A reaction releases energy overall when forming product bonds releases more energy than breaking reactant bonds requires. Estimate reaction enthalpy as energy needed to break bonds minus energy released by forming bonds.',
      accuracyReminder: 'Bond breaking by itself does not release energy; account for both breaking and formation.',
      url: 'https://openstax.org/books/chemistry-2e/pages/7-5-strengths-of-ionic-and-covalent-bonds',
      sourceLabel: 'OpenStax Chemistry 2e'
    },
    {
      name: 'Photosynthesis and plant mass', subject: 'Biology',
      matches: /\bphotosynth\w*\b|\b(?:plant|tree)s?\b.*\b(?:mass|soil|carbon|grow\w*)\b|\b(?:mass|carbon)\b.*\b(?:plant|tree)s?\b/i,
      text: 'Plants use light energy to build sugars from carbon dioxide and water during photosynthesis. Carbon from atmospheric carbon dioxide becomes part of their organic molecules and is a major source of plant dry mass. Soil supplies water and mineral nutrients; it is not the main source of the carbon in a growing tree.',
      accuracyReminder: 'Do not confuse the source of energy (light) with the source of carbon atoms (carbon dioxide).',
      url: 'https://openstax.org/books/biology-2e/pages/31-1-nutritional-requirements-of-plants',
      sourceLabel: 'OpenStax Biology 2e'
    }
  ];
  const stem = token => token.length > 4 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token;
  function retrieve(question, data, limit = 3) {
    const query = normalize(question), tokens = new Set(query.split(' ').map(stem));
    const frequency = new Map();
    for (const subject of data?.subjects || []) for (const unit of subject.units || []) for (const concept of unit.concepts || []) {
      for (const term of new Set(normalize(concept.name).split(' ').map(stem))) frequency.set(term, (frequency.get(term) || 0) + 1);
    }
    const matches = referenceNotes.filter(note => note.matches.test(question)).map(({ matches, ...note }) => ({ ...note, score: 10 }));
    for (const subject of data?.subjects || []) {
      for (const unit of subject.units || []) {
        for (const concept of unit.concepts || []) {
          const name = normalize(concept.name);
          const terms = name.split(' ').filter(term => !['the', 'of', 'and', 'a', 'an', 'in', 'by'].includes(term));
          const fullMatch = terms.length && terms.every(term => tokens.has(stem(term)));
          const distinctiveMatch = terms.some(term => term.length >= 5 && tokens.has(stem(term)) && frequency.get(stem(term)) <= 2);
          if (!fullMatch && !distinctiveMatch) continue;
          matches.push({ name: concept.name, subject: subject.name, unit: unit.name, text: concept.teach, sourceLabel: 'Official course overview',
            accuracyReminder: String(concept.trap || '').startsWith('Do not substitute a memorized keyword') ? undefined : concept.trap, url: subject.courseUrl, score: fullMatch ? terms.length + (query.includes(name) ? 2 : 0) : 1 });
        }
      }
    }
    const seen = new Set();
    const hasFullMatch = matches.some(row => row.score > 1);
    return matches.filter(row => !hasFullMatch || row.score > 1).sort((a, b) => b.score - a.score).filter(row => {
      const key = normalize(row.name);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0, limit);
  }

  async function contextFor(question) {
    try {
      if (!root.ScholarkAPData) await root.ScholarkFeatureLoader?.ensure('ai-data');
      return retrieve(question, root.ScholarkAPData);
    } catch (_) { return retrieve(question, null); }
  }

  function readableMath(value = '') {
    return String(value)
      .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
      .replace(/\$([^$\n]{1,160})\$/g, (whole, inside) => /\\|[=^{}]|\d\s*[+*/-]\s*\d/.test(inside) ? inside : whole)
      .replace(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g, (_, inline, block) => inline ?? block)
      .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2')
      .replace(/\\sqrt\s*\{([^{}]+)\}/g, '√($1)')
      .replace(/\\(?:text|boxed)\s*\{([^{}]+)\}/g, '$1')
      .replace(/\\quad\b/g, ' ').replace(/\\(?:cdot|times)\b/g, ' × ');
  }

  function contradictsNotes(answer, notes = []) {
    const text = String(answer).replace(/[*_]/g, '').toLowerCase();
    const names = new Set(notes.map(note => note.name));
    if (names.has('Photosynthesis and plant mass')) {
      if (/\b(?:most|majority|bulk)\b[^.!?\n]{0,80}\b(?:mass|carbon)\b[^.!?\n]{0,60}\b(?:from|through)\s+(?:the\s+)?soil\b/.test(text)) return true;
    }
    if (names.has('residual')) {
      if (/\bresiduals? (?:is|are) (?:a |an? useful )?(?:linear )?models?\b/.test(text)) return true;
      if (/\bleaving no systematic pattern\b|\bmaking them a useful linear model\b/.test(text)) return true;
    }
    if (names.has('Chemical bonds and energy')) {
      if (/\bbreak\w*\s+(?:chemical\s+)?bonds?\s+(?:(?:itself|alone|actually|generally|typically)\s+)*(?:releases?|produces?|gives off)\s+energy\b/.test(text)) return true;
      if (/\bform\w*\s+(?:chemical\s+)?bonds?\s+(?:requires?|absorbs?|uses?)\s+energy\b/.test(text)) return true;
      if (/\b(?:form\w*\s+(?:a\s+|the\s+)?(?:chemical\s+)?bonds?|bond formation)\b[^.!?\n]{0,45}\b(?:endothermic|requires? energy|absorbs? energy)\b/.test(text) && !/\b(?:not|never|incorrect|false)\b/.test(text)) return true;
      if (/\b(?:break\w*\s+(?:a\s+|the\s+)?(?:chemical\s+)?bonds?|bond breaking)\b[^.!?\n]{0,35}\bexothermic\b/.test(text) && !/\b(?:not|never|incorrect|false)\b/.test(text)) return true;
    }
    return false;
  }

  function shortWordingRequest(input = '') {
    const text = String(input).trim();
    if (!/\b(?:rewrite|rephrase|reword|polish|revise|edit|improve)\b/i.test(text)
      || !/\b(?:this|one|a single|the following|the first)\s+(?:sentence|phrase)\b/i.test(text)
      || /\b(?:all|every|entire|whole|full|paragraphs?)\b/i.test(text)) return null;
    const quoted = text.match(/[“"]([^”"]{1,500})[”"]|‘([^’]{1,500})’/);
    const excerpt = String(quoted?.[1] || quoted?.[2] || text.split(/[:：]/).slice(1).join(':')).trim();
    const words = excerpt.match(/\b[\w’'-]+\b/g) || [];
    return { excerpt: excerpt.length <= 240 && words.length >= 3 && words.length <= 35 && !/[\r\n]/.test(excerpt) ? excerpt : '' };
  }

  function isAuthorshipRequest(input = '', essayContext = false) {
    const q = String(input).trim().toLowerCase();
    if (shortWordingRequest(input)) return false;
    const writing = essayContext || /\b(?:essays?|paragraphs?|personal statement|application (?:response|essay)|supplement|opening|conclusion|introduction)\b/.test(q);
    if (!writing) return false;
    // Advice about a student's own revision is allowed; asking the assistant to
    // supply application prose is not. Keep this narrow so "how can I get you to
    // write my essay" cannot bypass the boundary through its opening words.
    if (/^(?:how (?:do|can|should) i (?:write|revise|edit|improve|rewrite|rephrase|reword|polish|structure|plan)|tips? (?:for|on)|advice (?:for|on))\b/.test(q)
      && !/\b(?:you|scholark|assistant|bot)\s+to\s+(?:write|draft|generate|compose|rewrite|rephrase|reword|polish|revise|edit|improve|create|finish|complete)\b/.test(q)) return false;
    if (/\b(?:how to|ways to)\s+(?:write|revise|edit|improve|rewrite|rephrase|reword|polish)\b/.test(q)
      && !/\b(?:you|scholark|assistant|bot)\s+to\s+(?:write|draft|generate|compose|rewrite|rephrase|reword|polish|revise|edit|improve|create|finish|complete)\b/.test(q)) return false;
    if (/\b(?:full|entire|whole|complete|finished|rewritten)\b/.test(q) && /\b(?:give|show|provide|want|need|have|send|produce|turn|convert)\b/.test(q)) return true;
    return /(?:^|\b(?:please|you|to|me))\s*(?:write|draft|generate|compose|rewrite|rephrase|reword|polish|revise|edit|improve|create|finish|complete)\b/.test(q)
      || /\b(?:give|show|provide)\s+(?:me\s+)?(?:an?\s+)?(?:sample|example|model|complete|full)\b/.test(q);
  }

  return { version: '1.0.0', calculate, retrieve, contextFor, isAuthorshipRequest, shortWordingRequest, readableMath, contradictsNotes };
});
