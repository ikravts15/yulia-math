/* =========================================================
   НАСТРОЙКИ
   ========================================================= */
const CONFIG = {
  // Куда приходят заявки с формы (сервис formsubmit.co, бесплатно, без регистрации)
  leadEmail: "",                                     // ← e-mail Юлии
  // Контакты в разделе «Контакты» (пустое значение = строка скрыта)
  telegram: "",                                      // ← ник без @, например yulia_math
  max: "",                                           // ← ссылка на профиль в Max
  phone: "",                                         // ← телефон, например +7 (900) 000-00-00
  whatsapp: false,                                   // ← true, если на этом номере есть WhatsApp
  email: "",                                         // ← e-mail для показа на сайте
  reviews: "https://t.me/shiryaevarepetitorotzv",   // канал с отзывами
  metrika: 0,                                        // ← номер счётчика Яндекс.Метрики (0 = выключено)
};

/* ---------- Яндекс.Метрика ---------- */
(function (id) {
  if (!id) return;
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    k = e.createElement(t); a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  ym(id, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
})(CONFIG.metrika);

// Цели: cta_click, form_start, lead, contact_click, reviews_click, quiz_start, quiz_finish, share_result, challenge, ref_share, ref_copy
function goal(name, params) {
  try { if (CONFIG.metrika && window.ym) ym(CONFIG.metrika, "reachGoal", name, params); } catch (e) {}
}

/* Отзывы для «стены» — настоящие сообщения из Telegram */
const REVIEWS = [
  { n: "Викуша", r: "❤️ 2", t: "Юлияяя, спасибо Вам за этот год интенсивной подготовки. Когда мы с родителями решили, что я буду сдавать профиль, я была вообще не уверена, а в итоге я увидела заветные 70 баллов. Вы умеете объяснять сложные вещи простым языком, и главное — без воды." },
  { n: "vlerx", r: "🔥 1", t: "Учусь в медицинском колледже, собиралась сдавать экзамен по математике. В некоторых темах, таких как логарифмы, вообще не понимала. Ты мне сразу понравилась — такая добродушная, отзывчивая и забавная на занятиях. Я сдала на пятёрку! Спасибо тебе огромное 🙏" },
  { n: "Poliana", r: "❤️ 1", t: "Занятия хорошо объясняли. Домашнего задания было немного, оно было лёгкое и по материалу из урока. За пару месяцев подтянули знания. Благодаря урокам я смогла сдать ОГЭ на твёрдую 4." },
  { n: "Arisha", r: "👍 1", t: "Самый лучший репетитор в мире. Правда интересные уроки и подход. Я сменила много репетиторов, потому что не видела прогресса, а теперь вижу — вышла из двоек и троек на 4 и 5. Будет понятно даже пятилетнему ребёнку." },
  { n: "Мама ученика", r: "", t: "Юлия отлично объясняет материал и является профессионалом своего дела. Она полностью располагает к себе своей отзывчивостью и открытостью, благодаря этому занятия проходят легко и без напряжения. С уверенностью советую Юлию всем, кто ещё сомневается в выборе репетитора." },
  { n: "Варя", r: "🔥 1", t: "Мы начинали буквально с умножения и деления в столбик, два года я не училась и не знала НИЧЕГО, но вы взялись подготовить меня к ОГЭ 🥹 Я не просто сдала — а получила 4, как очень хотела. Вы просто чудесный преподаватель и человек!" },
  { n: "wkeiwii", r: "👍 1", t: "Спасибо вам большое за занятия, так как с вами мне было легко разобраться в любых темах и в дальнейшем запоминать многие моменты, также в плане человека вы очень понимающая и добрая)" },
  { n: "miln", r: "🔥 1", t: "Всё хорошо, мне всё очень понятно, и даже интересно, что для меня в новинку — я стала понимать математику, и мне она даже немного понравилась) Спасибо вам большое 💕" },
  { n: "Ученик", r: "🔥 1", t: "Всё отлично, с нуля подготовили на четвёрку, всё понятно объясняют, разжёвывают, пока не поймёшь. Мне понравилось 👍🏻" },
];

/* ---------- утилиты ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const siteUrl = () => location.origin + location.pathname;

function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2400);
}

async function share({ title, text, url }) {
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  // запасной вариант — Telegram share
  const tg = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  window.open(tg, "_blank", "noopener");
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("Ссылка скопирована ✨"); }
  catch { prompt("Скопируйте ссылку:", text); }
}

/* ---------- кнопки записи → раздел «Контакты» ---------- */
const params0 = new URLSearchParams(location.search);
const leadSource = params0.has("ref") ? "реферальная ссылка" : params0.has("challenge") ? "вызов от друга" : "сайт";
let lastQuizScore = null;
function goToForm({ format, message } = {}) {
  if (format) $("#leadFormat").value = format;
  if (message && !$("#leadMessage").value) $("#leadMessage").value = message;
  $("#contacts").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => { try { $("#leadName").focus({ preventScroll: true }); } catch (e) {} }, 700);
}
$$(".js-cta").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    goal("cta_click", { from: a.dataset.start || "btn" });
    goToForm({
      format: a.dataset.format,
      message: a.id === "quizCta" && lastQuizScore !== null ? `Прошёл(ла) тест на сайте: ${lastQuizScore} из 8. Хочу разобрать ошибки.` : "",
    });
  });
});

$$(".js-reviews").forEach(a => { a.addEventListener("click", () => goal("reviews_click")); a.href = CONFIG.reviews; a.target = "_blank"; a.rel = "noopener"; });
$("#year").textContent = new Date().getFullYear();

/* ---------- контакты ---------- */
(() => {
  const digits = CONFIG.phone.replace(/\D/g, "").replace(/^8/, "7");
  const map = {
    telegram: CONFIG.telegram && { href: "https://t.me/" + CONFIG.telegram.replace(/^@/, ""), text: "@" + CONFIG.telegram.replace(/^@/, "") },
    max: CONFIG.max && { href: CONFIG.max, text: "Max" },
    phone: CONFIG.phone && { href: "tel:+" + digits, text: CONFIG.phone },
    whatsapp: CONFIG.phone && CONFIG.whatsapp && { href: "https://wa.me/" + digits, text: "WhatsApp" },
    email: CONFIG.email && { href: "mailto:" + CONFIG.email, text: CONFIG.email },
  };
  $$("#contactList li").forEach(li => {
    const c = map[li.dataset.contact];
    if (!c) { li.hidden = true; return; }
    const a = li.querySelector("a");
    a.href = c.href; li.querySelector(".c-value").textContent = c.text;
    a.addEventListener("click", () => goal("contact_click", { type: li.dataset.contact }));
  });
  if (!$$("#contactList li").some(li => !li.hidden)) $("#contactList").hidden = true;
})();

/* ---------- форма заявки ---------- */
(() => {
  const form = $("#leadForm"), btn = $("#leadSubmit"), err = $("#leadError");
  let started = false;
  form.addEventListener("input", () => { if (!started) { started = true; goal("form_start"); } });
  const showError = t => { err.textContent = t; err.hidden = false; };

  form.addEventListener("submit", async e => {
    e.preventDefault();
    err.hidden = true;
    const name = $("#leadName").value.trim(), contact = $("#leadContact").value.trim();
    if (!name) { showError("Пожалуйста, укажите имя."); $("#leadName").focus(); return; }
    if (contact.replace(/\W/g, "").length < 5) { showError("Укажите телефон или ник в Telegram, чтобы я могла связаться."); $("#leadContact").focus(); return; }
    if (form._honey.value) return; // бот-спамер

    const data = {
      "Имя": name,
      "Контакт": contact,
      "Формат": $("#leadFormat").value,
      "Сообщение": $("#leadMessage").value.trim() || "—",
      "Результат теста": lastQuizScore !== null ? lastQuizScore + " из 8" : "не проходил(а)",
      "Источник": leadSource,
      _subject: "Новая заявка с сайта yulia-math.ru — " + name,
      _template: "table",
      _captcha: "false",
    };

    if (!CONFIG.leadEmail) { showError("Форма ещё не подключена. Напишите, пожалуйста, напрямую — контакты рядом с формой."); return; }
    btn.disabled = true; btn.textContent = "Отправляем…";
    try {
      const r = await fetch("https://formsubmit.co/ajax/" + CONFIG.leadEmail, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) === "false") throw new Error(j.message || r.status);
      goal("lead", { format: data["Формат"] });
      form.hidden = true; $("#leadSuccess").hidden = false;
      confetti();
    } catch (ex) {
      showError("Не получилось отправить заявку. Попробуйте ещё раз или напишите напрямую — контакты рядом с формой.");
    } finally {
      btn.disabled = false; btn.textContent = "Отправить заявку";
    }
  });
})();

/* ---------- стена отзывов ---------- */
(() => {
  const esc = t => t.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const card = r => `<figure class="tg"><figcaption>Переслано от: ${esc(r.n)}</figcaption><p>${esc(r.t)}</p>${r.r ? `<span class="tg-meta">${r.r}</span>` : ""}</figure>`;
  const half = Math.ceil(REVIEWS.length / 2);
  const rows = [REVIEWS.slice(0, half), REVIEWS.slice(half)];
  [$("#wallRow1"), $("#wallRow2")].forEach((row, i) => {
    const html = rows[i].map(card).join("");
    row.innerHTML = html + html; // дублируем для бесконечной прокрутки
    row.querySelectorAll(".tg").forEach((el, k) => { if (k >= rows[i].length) el.setAttribute("aria-hidden", "true"); });
  });
})();

/* ---------- плавающие формулы ---------- */
(() => {
  const bg = $("#formulaBg");
  const f = ["π", "∑", "√x", "x²", "∫", "∞", "a²+b²=c²", "sin α", "log₂", "Δ", "f(x)", "%", "÷", "≈", "y=kx+b"];
  const n = window.innerWidth < 640 ? 10 : 18;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.textContent = f[i % f.length];
    s.style.left = Math.random() * 100 + "vw";
    s.style.fontSize = 18 + Math.random() * 46 + "px";
    s.style.animationDuration = 22 + Math.random() * 30 + "s";
    s.style.animationDelay = -Math.random() * 50 + "s";
    bg.appendChild(s);
  }
})();

/* ---------- появление при скролле ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const sibs = $$(".reveal", e.target.parentElement);
    e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 6) * 70 + "ms";
    e.target.classList.add("in");
    io.unobserve(e.target);
    const c = e.target.querySelector("[data-count]");
    if (c) countUp(c);
  });
}, { threshold: .12 });
$$(".reveal").forEach(el => io.observe(el));

function countUp(el) {
  const end = +el.dataset.count; let cur = 0;
  const step = () => { cur++; el.textContent = cur; if (cur < end) setTimeout(step, 120); };
  step();
}

/* ---------- навигация и липкая кнопка ---------- */
const nav = $("#nav"), sticky = $(".sticky-cta");
addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", scrollY > 20);
  const nearEnd = innerHeight + scrollY > document.body.scrollHeight - 500;
  sticky.classList.toggle("show", scrollY > innerHeight * .8 && !nearEnd);
}, { passive: true });

/* ---------- 3D-наклон фото ---------- */
$$(".tilt").forEach(card => {
  card.addEventListener("pointermove", e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  });
  card.addEventListener("pointerleave", () => (card.style.transform = ""));
});

/* ---------- реферальная программа ---------- */
const refUrl = siteUrl() + "?ref=friend";
const refText = "Смотри, классный репетитор по математике 🧠 Первое занятие бесплатно, а по моей ссылке — скидка на первый абонемент:";
$("#refShare").addEventListener("click", () => goal("ref_share") || share({ title: "Репетитор по математике", text: refText, url: refUrl }));
$("#refCopy").addEventListener("click", () => { goal("ref_copy"); copy(refUrl); });

/* =========================================================
   КВИЗ «Проверь математику за 60 секунд»
   ========================================================= */
const QUESTIONS = [
  { q: "15% от 200 = ?", a: ["30", "15", "20", "35"], c: 0 },
  { q: "−3 · (−4) + 2 = ?", a: ["14", "−10", "10", "−14"], c: 0 },
  { q: "Решите: 3x − 7 = 11", a: ["x = 6", "x = 4", "x = 18", "x = 3"], c: 0 },
  { q: "√144 + √25 = ?", a: ["17", "13", "169", "√169"], c: 0 },
  { q: "Гипотенуза треугольника с катетами 6 и 8", a: ["10", "14", "12", "9"], c: 0 },
  { q: "2⁵ ÷ 2³ = ?", a: ["4", "2", "8", "16"], c: 0 },
  { q: "log₃ 81 = ?", a: ["4", "3", "27", "9"], c: 0 },
  { q: "sin 30° = ?", a: ["1/2", "√3/2", "1", "√2/2"], c: 0 },
];
const RESULTS = [
  { min: 8, title: "Гений математики 🏆", text: "Идеально! Тебе прямая дорога к 90+ на экзамене. Хочешь закрепить и выйти на максимум?" },
  { min: 6, title: "Очень сильно! 🔥", text: "Пара мелких ошибок — и ты на высоте. Разберём их вместе на пробном занятии?" },
  { min: 4, title: "Хорошая база 💪", text: "Основа есть, но есть и пробелы. Как раз то, с чем я работаю: найдём их и закроем по плану." },
  { min: 0, title: "Есть куда расти 🌱", text: "Это нормально! Результат зависит не от способностей, а от системы. Начнём с бесплатной диагностики?" },
];

const TOTAL_TIME = 60;
let order = [], qi = 0, score = 0, timeLeft = TOTAL_TIME, timerId = null, locked = false;

const screens = $$(".quiz-screen");
const show = name => screens.forEach(s => s.classList.toggle("active", s.dataset.screen === name));
const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);

// вызов от друга (?challenge=5)
const params = new URLSearchParams(location.search);
const challenge = params.get("challenge");
if (challenge !== null && /^[0-8]$/.test(challenge)) {
  $("#challengeScore").textContent = challenge;
  $("#challengeBanner").classList.remove("hidden");
  setTimeout(() => $("#quiz").scrollIntoView({ behavior: "smooth" }), 700);
}

const best = store.get("quizBest", null);
if (best !== null) $("#playedCounter").textContent = `Твой рекорд: ${best} из 8. Побьёшь?`;

function startQuiz() {
  goal("quiz_start");
  order = QUESTIONS.map(q => {
    const opts = shuffle(q.a.map((t, i) => ({ t, ok: i === q.c })));
    return { q: q.q, opts };
  });
  qi = 0; score = 0; timeLeft = TOTAL_TIME;
  $("#qTimer").textContent = timeLeft;
  $("#qTimer").classList.remove("danger");
  show("question");
  renderQuestion();
  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    $("#qTimer").textContent = timeLeft;
    if (timeLeft <= 10) $("#qTimer").classList.add("danger");
    if (timeLeft <= 0) finish();
  }, 1000);
}

function renderQuestion() {
  locked = false;
  const item = order[qi];
  $("#qNum").textContent = `${qi + 1} / ${order.length}`;
  $("#qProgress").style.width = (qi / order.length) * 100 + "%";
  $("#qText").textContent = item.q;
  const box = $("#qOptions");
  box.innerHTML = "";
  item.opts.forEach(o => {
    const b = document.createElement("button");
    b.textContent = o.t;
    b.addEventListener("click", () => answer(b, o.ok));
    box.appendChild(b);
  });
}

function answer(btn, ok) {
  if (locked) return;
  locked = true;
  if (ok) { score++; btn.classList.add("correct"); }
  else {
    btn.classList.add("wrong");
    const idx = order[qi].opts.findIndex(o => o.ok);
    $("#qOptions").children[idx].classList.add("correct");
  }
  if (navigator.vibrate) navigator.vibrate(ok ? 20 : [40, 40, 40]);
  setTimeout(() => { qi++; qi < order.length ? renderQuestion() : finish(); }, ok ? 450 : 900);
}

function finish() {
  goal("quiz_finish", { score });
  clearInterval(timerId);
  $("#qProgress").style.width = "100%";
  const r = RESULTS.find(r => score >= r.min);
  $("#rTitle").textContent = r.title;
  let text = r.text;
  if (challenge !== null && /^[0-8]$/.test(challenge)) {
    const c = +challenge;
    text = (score > c ? "Ты победил(а) друга! 🎉 " : score === c ? "Ничья! 🤝 " : "Друг пока впереди 😅 ") + text;
  }
  $("#rText").textContent = text;
  lastQuizScore = score;
  show("result");
  animateScore(score);
  const prev = store.get("quizBest", -1);
  if (score > prev) store.set("quizBest", score);
  if (score >= 6) confetti();
}

function animateScore(n) {
  let i = 0; const el = $("#rScore"); el.textContent = 0;
  const t = setInterval(() => { if (i >= n) return clearInterval(t); el.textContent = ++i; }, 110);
}

$("#quizStart").addEventListener("click", startQuiz);
$("#quizRetry").addEventListener("click", startQuiz);

$("#shareBtn").addEventListener("click", () => goal("share_result") || share({
  title: "Мой результат",
  text: `Я решил(а) ${score} из 8 задач по математике за 60 секунд 🧠 А ты сможешь?`,
  url: siteUrl() + "?challenge=" + score + "#quiz",
}));
$("#challengeBtn").addEventListener("click", () => {
  goal("challenge");
  const url = siteUrl() + "?challenge=" + score + "#quiz";
  share({ title: "Вызов!", text: `⚔️ Вызываю тебя на дуэль! У меня ${score}/8 по математике за минуту. Побьёшь?`, url });
});

/* ---------- конфетти ---------- */
function confetti() {
  const cv = $("#confetti"), ctx = cv.getContext("2d");
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ["#ff4f7b", "#ffd166", "#2f4a3a", "#a9bfa8", "#ffffff"];
  const parts = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2, y: innerHeight / 2,
    vx: (Math.random() - .5) * 18, vy: Math.random() * -18 - 4,
    s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .3,
    c: colors[(Math.random() * colors.length) | 0],
  }));
  let frames = 0;
  (function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.vy += .5; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    });
    if (++frames < 180) requestAnimationFrame(draw); else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}
