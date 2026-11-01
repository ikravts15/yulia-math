const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/privacy.js'), 'utf8');

function browser(saved = null, blockedStorage = false) {
  const elements = new Map(), storage = new Map(), scripts = [], events = {}, calls = [];
  if (saved !== null) storage.set('privacyChoices.v1', saved);
  function element(id) {
    if (!elements.has(id)) elements.set(id, {hidden: true, events: {}, textContent: '',
      addEventListener(name, callback) { this.events[name] = callback; }, focus() {}, remove() {},
    });
    return elements.get(id);
  }
  const context = {
    Date, JSON, Number, location: {hostname: 'yulia-math.ru'},
    localStorage: {getItem: k => {if (blockedStorage) throw Error('blocked'); return storage.get(k) ?? null;},
      setItem: (k, v) => {if (blockedStorage) throw Error('blocked'); storage.set(k, v);}},
    document: {cookie: '', getElementById: element, querySelectorAll: () => [element('settings')],
      createElement: () => element('script'), head: {appendChild: s => scripts.push(s)}},
  };
  context.window = {addEventListener: (name, callback) => {events[name] = callback;}};
  vm.createContext(context); vm.runInContext(source, context);
  function load() { context.window.ym = (...args) => calls.push(args); scripts[0].onload(); }
  return {context, storage, elements, element, scripts, calls, events, load,
    api: context.window.sitePrivacy, click: id => element(id).events.click()};
}
const choice = analytics => JSON.stringify({analytics, version: '2026-11-02', decidedAt: new Date().toISOString()});

test('no analytics script or goals before explicit consent', () => {
  const b = browser(); b.api.configure(113329618); b.api.goal('lead');
  assert.equal(b.scripts.length, 0); assert.equal(b.calls.length, 0);
  assert.equal(b.element('cookieNotice').hidden, false);
});
test('reject works without loading analytics and persists across visits', () => {
  const b = browser(); b.api.configure(113329618); b.click('analyticsReject');
  assert.equal(b.scripts.length, 0); assert.equal(b.element('cookieNotice').hidden, true);
  const next = browser(b.storage.get('privacyChoices.v1')); next.api.configure(113329618);
  assert.equal(next.scripts.length, 0); assert.equal(next.element('cookieNotice').hidden, true);
});
test('accept initializes once, disables webvisor, then allows goals', () => {
  const b = browser(); b.api.configure(113329618); b.click('analyticsAccept');
  assert.equal(b.scripts.length, 1); b.load(); b.api.configure(113329618);
  assert.equal(b.calls.filter(c => c[1] === 'init').length, 1);
  assert.equal(b.calls[0][2].webvisor, false);
  b.api.goal('lead', {format:'test'}); assert.equal(b.calls.at(-1)[1], 'reachGoal');
});
test('revoking consent stops an active counter and blocks further goals', () => {
  const b = browser(choice(true)); b.api.configure(113329618); b.load();
  b.click('settings'); assert.equal(b.element('cookieNotice').hidden, false);
  b.click('analyticsReject'); assert.equal(b.calls.at(-1)[1], 'destruct');
  const count = b.calls.length; b.api.goal('lead'); assert.equal(b.calls.length, count);
});
test('revoking while the script loads prevents delayed initialization', () => {
  const b = browser(); b.api.configure(113329618); b.click('analyticsAccept');
  b.click('analyticsReject'); b.load(); assert.equal(b.calls.length, 0);
});
test('expired, invalid and corrupted choices never enable analytics', () => {
  for (const value of ['bad JSON', '{}', JSON.stringify({analytics:true, version:'2026-11-02',decidedAt:'2020-01-01'}),
    JSON.stringify({analytics:true,version:'old',decidedAt:new Date().toISOString()})]) {
    const b = browser(value); b.api.configure(113329618);
    assert.equal(b.scripts.length, 0); assert.equal(b.element('cookieNotice').hidden, false);
  }
});
test('blocked localStorage leaves controls functional for the current page', () => {
  const b = browser(null, true); b.api.configure(113329618); b.click('analyticsReject');
  assert.equal(b.scripts.length, 0); assert.equal(b.element('cookieNotice').hidden, true);
});
test('revocation in another tab stops this tab too', () => {
  const b = browser(choice(true)); b.api.configure(113329618); b.load();
  b.storage.set('privacyChoices.v1', choice(false)); b.events.storage({key:'privacyChoices.v1'});
  assert.equal(b.calls.at(-1)[1], 'destruct');
});
test('legal pages do not load analytics even when consent was previously given', () => {
  const b = browser(choice(true)); assert.equal(b.scripts.length, 0);
});

function form() {
  const main = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
  const elements = new Map(), requests = [], goals = [];
  function element(id) {
    if (!elements.has(id)) elements.set(id, {value:'',checked:false,hidden:true,disabled:false,
      events:{},addEventListener(name, cb){this.events[name] = cb;},focus(){this.focused=true;}});
    return elements.get(id);
  }
  element('#leadForm')._honey={value:''}; element('#leadName').value='Test'; element('#leadContact').value='@testuser';
  element('#leadFormat').value='Бесплатное пробное занятие';
  const context={Date,JSON,String,Error,URL,$:element,CONFIG:{leadEmail:'test@example.com'},
    lastQuizScore:5,leadSource:'сайт',goal:(...a)=>goals.push(a),confetti(){},location:{href:'https://yulia-math.ru/'},
    fetch:async (url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({success:true})};}};
  vm.createContext(context);
  vm.runInContext(main.slice(main.indexOf('/* ---------- форма заявки ---------- */'),main.indexOf('/* ---------- стена отзывов ---------- */')),context);
  return {element, requests, goals, submit:()=>element('#leadForm').events.submit({preventDefault(){}})};
}
test('filled form cannot send without a separate unchecked-by-default consent', async () => {
  const f=form(); await f.submit(); assert.equal(f.requests.length,0);
  assert.match(f.element('#leadError').textContent,/согласие/);
  assert.equal(f.element('#leadConsent').focused,true);
});
test('consented submission includes the version and time of the separate consent', async () => {
  const f=form(); f.element('#leadConsent').checked=true; await f.submit();
  assert.equal(f.requests.length,1);
  const payload=JSON.parse(f.requests[0].options.body);
  assert.equal(payload['Версия согласия'],'2026-11-02');
  assert.equal(payload['Текст согласия'],'https://yulia-math.ru/consent.html');
  assert.ok(Number.isFinite(Date.parse(payload['Время согласия (UTC)'])));
  assert.equal(f.element('#leadSuccess').hidden,false);
});
test('a repeated submit while sending cannot duplicate the request', async () => {
  const f=form(); f.element('#leadConsent').checked=true;
  await Promise.all([f.submit(),f.submit()]); assert.equal(f.requests.length,1);
});
