/* Optional analytics stays off until an explicit, separate choice. */
(() => {
  "use strict";
  const KEY = "privacyChoices.v1";
  const VERSION = "2026-11-02";
  const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const notice = document.getElementById("cookieNotice");
  const status = document.getElementById("cookieStatus");
  let counterId = 0, initialized = false, script = null, loaded = false;
  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      const age = Date.now() - Date.parse(value?.decidedAt);
      return value?.version === VERSION && typeof value.analytics === "boolean" &&
        age >= 0 && age < MAX_AGE ? value : null;
    } catch { return null; }
  }
  let choice = readChoice();
  function initialize() {
    if (!choice?.analytics || !counterId || initialized || !loaded) return;
    initialized = true;
    window.ym(counterId, "init", {
      clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false,
    });
  }
  function start() {
    if (!choice?.analytics || !counterId) return;
    if (loaded) { initialize(); return; }
    if (script) return;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = window.ym.l || Date.now();
    script = document.createElement("script");
    script.id = "metrika-consented";
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    script.onload = () => { loaded = true; initialize(); };
    script.onerror = () => { script.remove(); script = null; };
    document.head.appendChild(script);
  }
  function removeAnalyticsCookies() {
    const host = location.hostname;
    for (const entry of document.cookie.split(";")) {
      const name = entry.split("=")[0].trim();
      if (!name.startsWith("_ym_")) continue;
      const expired = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      document.cookie = expired;
      document.cookie = `${expired}; Domain=${host}`;
      document.cookie = `${expired}; Domain=.${host}`;
    }
  }
  function stop() {
    if (initialized && window.ym) window.ym(counterId, "destruct");
    initialized = false;
    removeAnalyticsCookies();
  }
  function apply() {
    choice?.analytics ? start() : stop();
    if (notice) notice.hidden = choice !== null;
    if (status) status.textContent = choice ? `Текущий выбор: аналитика ${choice.analytics ? "разрешена" : "отключена"}.` : "";
  }
  function choose(analytics) {
    choice = { analytics, version: VERSION, decidedAt: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch {}
    apply();
  }
  document.getElementById("analyticsAccept")?.addEventListener("click", () => choose(true));
  document.getElementById("analyticsReject")?.addEventListener("click", () => choose(false));
  document.querySelectorAll("[data-cookie-settings]").forEach(button => {
    button.addEventListener("click", () => {
      if (!notice) return;
      notice.hidden = false;
      document.getElementById("analyticsReject")?.focus();
    });
  });
  window.addEventListener("storage", event => {
    if (event.key !== KEY && event.key !== null) return;
    choice = readChoice();
    apply();
  });
  window.sitePrivacy = {
    configure(id) { counterId = Number(id) || 0; apply(); },
    goal(name, params) {
      if (choice?.analytics && initialized && window.ym) window.ym(counterId, "reachGoal", name, params);
    },
  };
  apply();
})();
