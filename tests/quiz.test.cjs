// Run: node --test tests/quiz.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function quiz() {
  const source = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
  const elements = new Map(), timeouts = new Map(), intervals = new Map(), goals = [], best = new Map();
  let id = 0;
  function element(key) {
    if (!elements.has(key)) elements.set(key, {
      style: {}, children: [], classList: {add() {}, remove() {}, toggle() {}},
      appendChild(child) { this.children.push(child); }, addEventListener() {},
      set innerHTML(value) { this.children = []; },
    });
    return elements.get(key);
  }
  const context = {
    Math, URLSearchParams, location: {search: ''}, navigator: {},
    document: {createElement: () => element(++id)}, $: element, $$: () => [],
    goal: (name, params) => goals.push({name, params}), confetti() {},
    store: {get: (key, fallback) => best.get(key) ?? fallback, set: (key, value) => best.set(key, value)},
    setTimeout: callback => { timeouts.set(++id, callback); return id; },
    clearTimeout: key => timeouts.delete(key),
    setInterval: callback => { intervals.set(++id, callback); return id; },
    clearInterval: key => intervals.delete(key),
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('const QUESTIONS ='), source.indexOf('$("#quizStart").addEventListener')), context);
  const run = code => vm.runInContext(code, context);
  return {
    run, goals, element, timeouts, intervals,
    tick() { intervals.get(run('timerId'))?.(); },
    pending() { const callback = timeouts.get(run('answerTimeout')); timeouts.delete(run('answerTimeout')); callback?.(); },
    finishes: () => goals.filter(g => g.name === 'quiz_finish'),
  };
}

test('last answer at the deadline finishes exactly once', () => {
  const q = quiz();
  q.run('startQuiz(); qi = 7; timeLeft = 1; answer($("button"), true)');
  const oldCallback = q.timeouts.get(q.run('answerTimeout'));
  q.tick();
  oldCallback(); // Even a callback already queued before clearTimeout must be harmless.
  q.run('finish()');
  assert.equal(q.finishes().length, 1);
  assert.equal(q.run('qi'), 7);
});

test('pending answer cannot skip the first question of a new attempt', () => {
  const q = quiz();
  q.run('startQuiz(); timeLeft = 1; answer($("button"), true)');
  const oldCallback = q.timeouts.get(q.run('answerTimeout'));
  q.tick();
  q.run('startQuiz()');
  oldCallback();
  assert.equal(q.run('qi'), 0);
  assert.equal(q.run('score'), 0);
  assert.equal(q.element('#qNum').textContent, '1 / 8');
});

test('answers after finish cannot change the score', () => {
  const q = quiz();
  q.run('startQuiz(); finish(); answer($("button"), true)');
  assert.equal(q.run('score'), 0);
  assert.equal(q.timeouts.size, 0);
});

test('eight correct answers finish normally and store the result', () => {
  const q = quiz();
  q.run('startQuiz()');
  for (let i = 0; i < 8; i++) {
    q.run('answer($("button"), true)');
    q.pending();
  }
  assert.equal(q.finishes().length, 1);
  assert.equal(q.run('lastQuizScore'), 8);
  assert.equal(q.run('store.get("quizBest", null)'), 8);
  assert.equal(q.run('quizActive'), false);
});

test('double clicks count only one answer', () => {
  const q = quiz();
  q.run('startQuiz(); answer($("button"), true); answer($("button"), true)');
  assert.equal(q.run('score'), 1);
  assert.equal(q.timeouts.size, 1);
});

test('restart cancels score animation from the previous result', () => {
  const q = quiz();
  q.run('startQuiz(); finish()');
  const oldAnimation = q.run('scoreTimer');
  assert.ok(q.intervals.has(oldAnimation));
  q.run('startQuiz()');
  assert.equal(q.intervals.has(oldAnimation), false);
});
