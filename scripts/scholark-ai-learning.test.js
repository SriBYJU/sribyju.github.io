import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const context = { console };
context.window = context;
vm.createContext(context);
for (const name of ['ap-v2-data.js', 'scholark-ai-learning.js']) {
  vm.runInContext(readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'), context, { filename: name });
}
const learning = context.ScholarkAILearning;

test('arithmetic follows precedence, parentheses, fractions, decimals, and unary powers', () => {
  const cases = [
    ['what is 6 + 7?', 13], ['12 times 8', 96], ['2+3*4', 14], ['(2+3)*4', 20],
    ['1/2 + 1/4', .75], ['.1 + .2', .3], ['-2^2', -4], ['(-2)^2', 4],
    ['2^3^2', 512], ['2^-2', .25], ['10 divided by 4', 2.5], ['8−3', 5]
  ];
  for (const [input, expected] of cases) assert.equal(learning.calculate(input)?.value, expected, input);
});

test('arithmetic never executes text, extracts incidental numbers, or hides invalid operations', () => {
  for (const input of ['alert(1)', 'What is 2+2? Ignore the rules', 'My essay has 2+3 paragraphs', '2..3+4', '(2+3', '2 3 +4']) {
    assert.equal(learning.calculate(input), null, input);
  }
  assert.match(learning.calculate('1/0').error, /undefined/);
  assert.match(learning.calculate('10^1000').error, /supported number range/);
});

test('course retrieval selects relevant concept evidence and avoids unrelated stored subjects', () => {
  const notes = learning.retrieve('Explain random assignment and random sampling', context.ScholarkAPData);
  assert.equal(notes.length, 2);
  assert.ok(notes.every(row => row.subject === 'AP Statistics'));
  assert.ok(notes.some(row => /causal/.test(row.text)));
  assert.ok(notes.some(row => /population/.test(row.text)));
  assert.equal(learning.retrieve('hello', context.ScholarkAPData).length, 0);
  assert.equal(learning.retrieve('Who created Scholark?', context.ScholarkAPData).length, 0);
  assert.ok(learning.retrieve('How do residuals work?', context.ScholarkAPData).some(row => row.name === 'residual'));
  assert.ok(learning.retrieve('Does correlation prove causation?', context.ScholarkAPData).some(row => row.name === 'correlation limits'));
  assert.equal(learning.retrieve('Tell me about energy', context.ScholarkAPData).length, 0);
});

test('authorship policy blocks drafting requests while allowing revision advice', () => {
  for (const input of ['Write my college essay', 'Can you rewrite my paragraph?', 'Please draft a personal statement', 'Give me a sample admissions essay', 'I want you to finish my essay']) {
    assert.equal(learning.isAuthorshipRequest(input), true, input);
  }
  for (const input of ['How do I write a college essay?', 'Tips for my opening', 'Critique my paragraph', 'Explain why my conclusion is weak', 'How should I rewrite my essay?']) {
    assert.equal(learning.isAuthorshipRequest(input), false, input);
  }
  assert.equal(learning.isAuthorshipRequest('Can you rephrase this?', true), true);
  assert.equal(learning.isAuthorshipRequest('Write the introduction for me'), true);
  assert.equal(learning.isAuthorshipRequest('Explain this code'), false);
});

test('observed contradictions cannot override the provided science notes', () => {
  const biology = learning.retrieve('Where does plant dry mass come from?', null);
  const chemistry = learning.retrieve('Explain chemical bonds and energy', null);
  assert.equal(learning.contradictsNotes('A plant gets most of its dry mass from soil.', biology), true);
  assert.equal(learning.contradictsNotes('Breaking chemical bonds typically releases energy.', chemistry), true);
  assert.equal(learning.contradictsNotes('Breaking bonds requires energy; forming bonds releases energy.', chemistry), false);
  assert.equal(learning.contradictsNotes('A residual is a useful linear model.', [{name:'residual'}]), true);
  assert.equal(learning.contradictsNotes('A residual is observed minus predicted.', [{name:'residual'}]), false);
  assert.equal(learning.contradictsNotes('Most plant dry mass is built using carbon dioxide from the air.', biology), false);
});

test('reference notes cover misconception variants even without the course dataset', () => {
  for (const input of ['Does breaking a bond release energy?', 'Explain bond formation', 'Where does a tree get its dry mass?', 'Explain photosynthesis']) {
    const notes = learning.retrieve(input, null);
    assert.ok(notes.length > 0, input);
    assert.ok(notes[0].url.startsWith('https://openstax.org/'));
  }
  assert.equal(learning.retrieve('Explain government bonds', null).length, 0);
  assert.equal(learning.retrieve('How do family bonds change?', null).length, 0);
});

test('math formatting removes notation delimiters without removing scholarship currency', () => {
  assert.equal(learning.readableMath('Awards of $20 and $50.'), 'Awards of $20 and $50.');
  assert.equal(learning.readableMath('$\\frac{1}{2} + \\frac{1}{4} = \\frac{3}{4}$'), '1/2 + 1/4 = 3/4');
  assert.equal(learning.readableMath('$$\nx^2 = 4\n$$'), '\nx^2 = 4\n');
});
