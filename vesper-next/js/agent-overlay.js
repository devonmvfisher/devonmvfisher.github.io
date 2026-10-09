/**
 * Vesper Sky-call — offline-first companion + optional Live AI (Advanced).
 * Privacy: keys only in localStorage; fetch only to user URL (https/localhost);
 * chat uses textContent; errors never echo secrets.
 */
(function () {
  "use strict";

  const LS_BASE = "vesper.agentBaseUrl";
  const LS_KEY = "vesper.agentApiKey";
  const LS_MODEL = "vesper.agentModel";
  const LS_WEBHOOK = "vesper.agentWebhookUrl";
  const LS_TTS = "vesper.agentTts";
  const LS_GUIDE = "vesper.planetGuide";
  const LS_CINEMA = "vesper.cinemaMode";
  const LS_USE_LIVE = "vesper.agentUseLive";
  const LS_PRESET = "vesper.agentPreset";
  const LS_ADV = "vesper.agentAdvOpen";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const synth = window.speechSynthesis || null;

  const PRESETS = {
    xai: {
      label: "xAI Grok",
      base: "https://api.x.ai/v1",
      model: "grok-2-latest",
      hint: "xAI key from console.x.ai · OpenAI-compatible chat completions.",
    },
    openai: {
      label: "OpenAI",
      base: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      hint: "OpenAI key · base stays api.openai.com/v1.",
    },
    openrouter: {
      label: "OpenRouter",
      base: "https://openrouter.ai/api/v1",
      model: "x-ai/grok-beta",
      hint: "OpenRouter key · any listed model id.",
    },
    local: {
      label: "Local / Ollama",
      base: "http://127.0.0.1:11434/v1",
      model: "llama3.2",
      hint: "Ollama / LM Studio / vLLM — OpenAI-compatible /v1/chat/completions.",
    },
    legacy: {
      label: "Full webhook URL",
      base: "",
      model: "vesper-bridge",
      hint: "Full …/chat/completions URL. Key optional if bridge injects auth.",
    },
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- DOM (static shell; messages via textContent) ---------- */
  const fab = el("button", "", "");
  fab.id = "agent-fab";
  fab.type = "button";
  fab.title = "Ship computer — companion speaks here and on the suit";
  fab.setAttribute("aria-label", "Open ship computer");
  fab.setAttribute("aria-expanded", "false");
  fab.innerHTML =
    '<svg class="fab-glyph" viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle class="fab-core" cx="12" cy="12" r="3.2"/>' +
    '<path d="M12 3.5c2.2 2.4 3.2 4.6 3.2 8.5S14.2 18.1 12 20.5"/>' +
    '<path d="M12 3.5c-2.2 2.4-3.2 4.6-3.2 8.5S9.8 18.1 12 20.5"/>' +
    '<path d="M7.2 8.2c3.2-.9 6.4-.9 9.6 0"/>' +
    '<path d="M6.5 15.2c3.6.85 7.4.85 11 0"/>' +
    "</svg>";

  const overlay = el("div", "");
  overlay.id = "agent-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "Sky call");
  overlay.innerHTML = [
    '<div class="agent-head">',
    '  <div class="agent-title-block">',
    '    <h2>Call <span class="sub" id="agent-sub">Offline companion</span></h2>',
    '    <div class="agent-context" id="agent-context" aria-live="polite"></div>',
    "  </div>",
    '  <div class="agent-head-actions">',
    '    <button type="button" class="btn" id="btn-cinema" title="Cinema sheet — chat docks low, sky stays primary">Cinema</button>',
    '    <button type="button" class="btn" id="btn-agent-close" aria-label="Close">✕</button>',
    "  </div>",
    "</div>",
    '<div id="agent-log" aria-live="polite"></div>',
    '<div class="agent-chips hide-in-cinema" id="agent-chips" role="group" aria-label="Quick prompts"></div>',
    '<div id="agent-compose">',
    '  <div class="compose-row">',
    '    <textarea id="agent-input" rows="1" placeholder="Ask the sky…" enterkeyhint="send"></textarea>',
    '    <button type="button" class="btn-mic" id="btn-mic" title="Tap to talk" aria-label="Microphone">🎤</button>',
    '    <button type="button" class="btn-send" id="btn-send">Send</button>',
    "  </div>",
    '  <div class="agent-tools hide-in-cinema">',
    '    <label><input type="checkbox" id="chk-tts" /> Speak</label>',
    '    <label><input type="checkbox" id="chk-guide" /> Guide</label>',
    '    <button type="button" class="btn btn-adv" id="btn-adv" aria-expanded="false">Advanced</button>',
    '    <span class="agent-status" id="agent-status"></span>',
    "  </div>",
    '  <div id="ai-config" class="hide-in-cinema" hidden>',
    '    <p class="privacy-line">Keys stay on this device. Live AI sends your chat + sky context only to the URL you set.</p>',
    '    <label class="fld"><input type="checkbox" id="chk-live" /> Live AI (optional)</label>',
    '    <label class="fld" for="ai-preset">Provider</label>',
    '    <select id="ai-preset">',
    '      <option value="xai">xAI Grok</option>',
    '      <option value="openai">OpenAI</option>',
    '      <option value="openrouter">OpenRouter</option>',
    '      <option value="local">Local / Ollama</option>',
    '      <option value="legacy">Full webhook URL</option>',
    "    </select>",
    '    <label class="fld" for="ai-base">Base URL (https or localhost)</label>',
    '    <input id="ai-base" type="url" placeholder="https://api.x.ai/v1" autocomplete="off" spellcheck="false" />',
    '    <form id="ai-key-form" action="#">',
    '    <input type="text" name="username" autocomplete="username" value="Local configuration" hidden />',
    '    <label class="fld" for="ai-key">API key</label>',
    '    <input id="ai-key" type="password" placeholder="stored only here" autocomplete="new-password" spellcheck="false" />',
    '    </form>',
    '    <label class="fld" for="ai-model">Model</label>',
    '    <input id="ai-model" type="text" placeholder="grok-2-latest" autocomplete="off" spellcheck="false" />',
    '    <div class="key-actions">',
    '      <button type="button" class="btn" id="btn-clear-keys">Clear keys</button>',
    '      <button type="button" class="btn" id="btn-copy-privacy">Privacy blurb</button>',
    "    </div>",
    '    <p class="help" id="ai-help"></p>',
    "  </div>",
    "</div>",
  ].join("");

  overlay.querySelector("#ai-key-form").addEventListener("submit", event => event.preventDefault());
  const cinemaExit = el("button", "", "Exit cinema — back to flight");
  cinemaExit.id = "cinema-exit";
  cinemaExit.type = "button";
  cinemaExit.title = "Leave cinema sheet";

  const cinemaHint = el("div", "", "Cinema · sky primary · chat docked");
  cinemaHint.id = "cinema-hint";
  cinemaHint.setAttribute("aria-hidden", "true");

  const shipBox = el("aside", "");
  shipBox.id = "ship-computer";
  shipBox.hidden = true;
  shipBox.setAttribute("aria-label", "Ship computer");
  shipBox.innerHTML = [
    "<header><strong>Ship computer</strong>",
    '<button type="button" class="btn" id="ship-advanced">Advanced</button>',
    '<button type="button" class="btn" id="ship-close">✕</button></header>',
    '<div id="ship-log"></div>',
    '<div id="ship-ask"><input id="ship-input" type="text" placeholder="Ask from the ship…" enterkeyhint="send" />',
    '<button type="button" class="btn" id="ship-send">Send</button></div>',
  ].join("");
  document.body.appendChild(shipBox);
  const suit = el("div", "");
  suit.id = "suit-radio";
  suit.setAttribute("aria-live", "polite");
  document.body.appendChild(suit);
  document.body.appendChild(fab);
  document.body.appendChild(overlay);
  document.body.appendChild(cinemaExit);
  document.body.appendChild(cinemaHint);

  const log = $("#agent-log", overlay);
  const input = $("#agent-input", overlay);
  const btnSend = $("#btn-send", overlay);
  const btnMic = $("#btn-mic", overlay);
  const btnClose = $("#btn-agent-close", overlay);
  const btnCinema = $("#btn-cinema", overlay);
  const chkTts = $("#chk-tts", overlay);
  const chkLive = $("#chk-live", overlay);
  const chkGuide = $("#chk-guide", overlay);
  const aiConfig = $("#ai-config", overlay);
  const aiPreset = $("#ai-preset", overlay);
  const aiBase = $("#ai-base", overlay);
  const aiKey = $("#ai-key", overlay);
  const aiModel = $("#ai-model", overlay);
  const aiHelp = $("#ai-help", overlay);
  const statusEl = $("#agent-status", overlay);
  const ctxEl = $("#agent-context", overlay);
  const subEl = $("#agent-sub", overlay);
  const chipsEl = $("#agent-chips", overlay);
  const btnAdv = $("#btn-adv", overlay);
  const btnClearKeys = $("#btn-clear-keys", overlay);
  const btnCopyPrivacy = $("#btn-copy-privacy", overlay);

  function setStatus(t) {
    if (statusEl) statusEl.textContent = t || "";
  }
  function addMsg(role, text) {
    const m = el("div", "msg " + role, text == null ? "" : String(text));
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    mirrorComms(role, text);
    return m;
  }
  function mirrorComms(role, text) {
    const raw = text == null ? "" : String(text);
    const suit = document.getElementById("suit-radio");
    if (suit && role !== "user") {
      suit.textContent = "Suit · " + raw.slice(0, 200);
      suit.classList.add("show");
    }
    const slog = document.getElementById("ship-log");
    if (slog) {
      const line = document.createElement("p");
      line.textContent = (role === "user" ? "You · " : "Ship · ") + raw;
      slog.appendChild(line);
      while (slog.children.length > 28) slog.removeChild(slog.firstChild);
      slog.scrollTop = slog.scrollHeight;
    }
  }
  function clearLog() {
    while (log.firstChild) log.removeChild(log.firstChild);
  }

  /* ---------- Sky context ---------- */
  function sky() {
    return window.VesperSky || null;
  }
  function skyCtx() {
    const s = sky();
    if (!s) {
      return {
        mode: "float",
        gear: "CRUISE",
        gearId: "cruise",
        looking: null,
        walking: false,
        walkBody: null,
        near: null,
        clock: "cruise",
        straight: false,
        build: false,
        speed: 0,
        blurb: "",
      };
    }
    const gear = s.getGear ? s.getGear() : null;
    const looking = s.getLookingAt ? s.getLookingAt() : null;
    const walking = s.isWalking ? !!s.isWalking() : false;
    const walkBody = s.getWalkBody ? s.getWalkBody() : null;
    const near = s.getNearSurface ? s.getNearSurface() : null;
    const nameForBlurb = walking && walkBody ? walkBody : looking;
    return {
      mode: s.getMode ? s.getMode() : "float",
      gear: (gear && gear.label) || "CRUISE",
      gearId: (gear && gear.id) || "cruise",
      looking: looking || null,
      walking: walking,
      walkBody: walkBody || null,
      near: near || null,
      clock: s.getClockMode ? s.getClockMode() : "cruise",
      straight: s.getStraightMan ? !!s.getStraightMan() : false,
      build: s.getBuildMode ? !!s.getBuildMode() : false,
      speed: s.getSpeed ? s.getSpeed() : 0,
      blurb: nameForBlurb && s.getBlurb ? s.getBlurb(nameForBlurb) || "" : "",
    };
  }
  function syncContextStrip() {
    const c = skyCtx();
    let focus = "deep space";
    if (c.walking && c.walkBody) focus = "walking " + c.walkBody;
    else if (c.looking) focus = c.looking;
    else if (c.near) focus = "near " + c.near;
    const bits = [
      (c.mode || "float").toUpperCase(),
      c.gear,
      focus,
    ];
    if (c.straight) bits.push("Sol");
    if (c.build) bits.push("Build");
    if (ctxEl) ctxEl.textContent = bits.join(" · ");
    if (subEl) {
      subEl.textContent = chkLive.checked ? "Live AI on · keys on device" : "Offline companion";
    }
  }

  /* ---------- Persistence / privacy ---------- */
  function isAllowedEndpoint(urlStr) {
    try {
      const u = new URL(urlStr, location.href);
      if (u.protocol === "https:") return true;
      if (u.protocol === "http:" && (/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(u.hostname) || u.hostname === "0.0.0.0")) {
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
  function saveCfg() {
    try {
      localStorage.setItem(LS_BASE, (aiBase.value || "").trim());
      localStorage.setItem(LS_KEY, (aiKey.value || "").trim());
      localStorage.setItem(LS_MODEL, (aiModel.value || "").trim());
      localStorage.setItem(LS_USE_LIVE, chkLive.checked ? "1" : "0");
      localStorage.setItem(LS_TTS, chkTts.checked ? "1" : "0");
      localStorage.setItem(LS_GUIDE, chkGuide.checked ? "1" : "0");
      localStorage.setItem(LS_PRESET, aiPreset.value);
    } catch (_) {}
  }
  function clearKeys() {
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_WEBHOOK);
      localStorage.removeItem(LS_BASE);
      localStorage.removeItem(LS_MODEL);
      localStorage.removeItem(LS_USE_LIVE);
    } catch (_) {}
    aiKey.value = "";
    chkLive.checked = false;
    saveCfg();
    setStatus("Keys cleared");
    syncContextStrip();
  }
  function setAdvanced(open) {
    if (!aiConfig || !btnAdv) return;
    if (open) {
      aiConfig.hidden = false;
      aiConfig.classList.add("show");
    } else {
      aiConfig.hidden = true;
      aiConfig.classList.remove("show");
    }
    btnAdv.setAttribute("aria-expanded", open ? "true" : "false");
    btnAdv.classList.toggle("active", open);
    try {
      localStorage.setItem(LS_ADV, open ? "1" : "0");
    } catch (_) {}
  }

  try {
    const legacy = localStorage.getItem(LS_WEBHOOK) || "";
    aiBase.value = localStorage.getItem(LS_BASE) || legacy || PRESETS.xai.base;
    aiKey.value = localStorage.getItem(LS_KEY) || "";
    aiModel.value = localStorage.getItem(LS_MODEL) || PRESETS.xai.model;
    aiPreset.value = localStorage.getItem(LS_PRESET) || "xai";
    // Do NOT auto-enable Live from legacy webhook
    chkLive.checked = localStorage.getItem(LS_USE_LIVE) === "1";
    chkTts.checked = localStorage.getItem(LS_TTS) === "1";
    chkGuide.checked = localStorage.getItem(LS_GUIDE) === "1";
    const p = PRESETS[aiPreset.value];
    if (p && aiHelp) aiHelp.textContent = p.hint;
    setAdvanced(localStorage.getItem(LS_ADV) === "1");
    if (localStorage.getItem(LS_CINEMA) === "1") setCinema(true);
  } catch (_) {}

  /* ---------- Open / cinema ---------- */
  function setOpen(open) {
    if (open && window.VesperInput) window.VesperInput.releasePointer();
    overlay.classList.toggle("open", open);
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("sky-call-open", open);
    if (open) {
      syncContextStrip();
      setTimeout(() => input && input.focus(), 40);
    }
  }
  function setCinema(on) {
    document.body.classList.toggle("cinema-mode", !!on);
    try {
      localStorage.setItem(LS_CINEMA, on ? "1" : "0");
    } catch (_) {}
    const hudBtn = document.getElementById("btn-cinema-hud");
    if (hudBtn) {
      hudBtn.classList.toggle("active", !!on);
      hudBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (cinemaHint) cinemaHint.setAttribute("aria-hidden", on ? "false" : "true");
    if (on) {
      // Remember if the sheet was already open. Exit should not
      // leave a chat the person had not opened.
      setCinema._sheetWasOpen = overlay.classList.contains("open");
      setOpen(true);
      setAdvanced(false);
      setStatus("Cinema · sky above");
    } else {
      if (!setCinema._sheetWasOpen) setOpen(false);
      setCinema._sheetWasOpen = false;
      setStatus("");
    }
  }
  function setShipComputer(open, opts) {
    shipBox.hidden = !open;
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (open && !(opts && opts.quiet)) {
      const inp = document.getElementById("ship-input");
      if (inp) setTimeout(() => inp.focus(), 30);
    }
  }
  fab.addEventListener("click", () => setShipComputer(shipBox.hidden));
  document.getElementById("ship-close").addEventListener("click", () => setShipComputer(false));
  document.getElementById("ship-advanced").addEventListener("click", () => setOpen(true));
  btnClose.addEventListener("click", () => {
    setCinema(false);
    setOpen(false);
  });
  btnCinema.addEventListener("click", () => setCinema(!document.body.classList.contains("cinema-mode")));
  cinemaExit.addEventListener("click", () => setCinema(false));

  btnAdv.addEventListener("click", () => {
    const open = btnAdv.getAttribute("aria-expanded") !== "true";
    setAdvanced(open);
  });

  chkLive.addEventListener("change", () => {
    if (chkLive.checked) {
      const ok = window.confirm(
        "Live AI sends your messages and brief sky context (mode, look-at) to the URL you configure.\n\nAPI keys stay in this browser only.\n\nEnable Live AI?"
      );
      if (!ok) {
        chkLive.checked = false;
        return;
      }
      setAdvanced(true);
    }
    saveCfg();
    syncContextStrip();
  });
  chkTts.addEventListener("change", saveCfg);
  chkGuide.addEventListener("change", saveCfg);
  aiBase.addEventListener("change", saveCfg);
  aiKey.addEventListener("change", saveCfg);
  aiModel.addEventListener("change", saveCfg);
  aiPreset.addEventListener("change", () => {
    const p = PRESETS[aiPreset.value];
    if (p) {
      if (p.base) aiBase.value = p.base;
      if (p.model) aiModel.value = p.model;
      if (aiHelp) aiHelp.textContent = p.hint;
    }
    saveCfg();
  });
  btnClearKeys.addEventListener("click", () => {
    if (window.confirm("Clear API key and related Live settings from this browser?")) clearKeys();
  });
  btnCopyPrivacy.addEventListener("click", () => {
    const blurb =
      "Vesper sky-call: API keys stay on your device (localStorage). Offline companion needs no key. Live AI only talks to the base URL you paste (https or localhost).";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(blurb).then(
        () => setStatus("Privacy blurb copied"),
        () => addMsg("sys", blurb)
      );
    } else addMsg("sys", blurb);
  });

  /* ---------- Offline companion (context-aware) ---------- */
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function whereAmI(c) {
    if (c.walking && c.walkBody) {
      const b = c.blurb || c.walkBody;
      return (
        "You're soft-landed on " +
        c.walkBody +
        ". " +
        (c.blurb ? c.blurb + " " : "") +
        "Thrust up or boost to take off. Gear " +
        c.gear +
        " · " +
        c.mode.toUpperCase() +
        "."
      );
    }
    if (c.looking) {
      return (
        (c.blurb || "Looking at " + c.looking + ".") +
        " Mode " +
        c.mode.toUpperCase() +
        " · gear " +
        c.gear +
        (c.near ? " · skimming close." : ". Drag to keep them centered, or Travel to jump.")
      );
    }
    if (c.near) {
      return "Near " + c.near + " — soft skim active. Ease in; boost to leave.";
    }
    return (
      "Deep space right now · " +
      c.mode.toUpperCase() +
      " · " +
      c.gear +
      ". Pan until a world sits in the center, or say travel Europa / Saturn / Home."
    );
  }
  function tipFor(c) {
    if (c.walking) {
      return "On a surface: look around, then thrust up / ⚡ to leave. Sol (Y) hides fantasy layers for a clean science read.";
    }
    if (c.looking === "Saturn" || (c.looking && /ring/i.test(c.blurb || ""))) {
      return "Saturn tip: skim the ring band gently — soft plane drag, no hard wall. Try Titan after.";
    }
    if (c.looking === "Europa" || c.looking === "Enceladus") {
      return (c.looking || "Ice moon") + " tip: soft-land, walk a beat, then boost off. Ocean worlds read best up close.";
    }
    if (c.gearId === "dock") {
      return "DOCK is for inspection — fine thrust. Bump to CRUISE or BURN when you want distance.";
    }
    if (c.gearId === "transit") {
      return "TRANSIT is outer-system pace. Drop to CRUISE near a moon so you don't overshoot.";
    }
    if (c.mode === "float") {
      return "FLOAT idle starts a lazy-river drift after a few quiet seconds. Touch stick/WASD to take over; PILOT (2) for full manual.";
    }
    return pick([
      "Hold ⚡/Shift — boost ramps, it isn't binary. Gears set the band: DOCK → TRANSIT.",
      "Travel jumps to planets, moons, dwarfs. Try Vesta or Haumea, then soft-land.",
      "Sol / Y = Straight Man — vanilla scientific Sol; hides bots, artifacts, builds.",
      "Pause freezes ship + orbits. Clock ⏸ is orbits-only — you still fly.",
      "Build (B): tap places. Erase in the tray removes. Saved on this device only.",
    ]);
  }
  function matchTravel(t, s) {
    if (!s || !s.travelNames) return null;
    const names = s.travelNames();
    const lower = t.toLowerCase();
    // "travel X" / "go to X" / "jump to X" / "take me to X"
    let m = lower.match(/(?:travel|go\s*to|jump\s*to|take\s*me\s*to|fly\s*to|bring\s*me\s*to|head\s*to|warp\s*to|approach)\s+([a-z][a-z0-9\s\-']{1,48})/i);
    let want = m ? m[1].trim() : "";
    if (!want) {
      for (let i = 0; i < names.length; i++) {
        const n = names[i];
        if (n === "Home") continue;
        if (new RegExp("\\b" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(t)) {
          // only if phrased as a go/show request or short
          if (/(travel|go|jump|take|fly|show|visit|see|bring|head|warp|approach)\b/i.test(t) || t.trim().length < n.length + 8) {
            want = n;
            break;
          }
        }
      }
    }
    if (!want) return null;
    if (/^home$/i.test(want)) return "Home";
    // Whole name only. Prefixes sent Hearth to Earth and Hall to Halley.
    const hit = names.find((n) => n.toLowerCase() === want.toLowerCase());
    if (hit) return hit;
    // "go to starman" is not the catalog string Starman Roadster.
    // A word that belongs to one body is that body. Two Voyagers stay unnamed.
    try {
      const brain = window.VesperCompanionBrain;
      const resolved = brain && brain.resolveName && brain.resolveName(want || t);
      // Ambiguous Hall/Halley must not pick one. reply() will ask to name one.
      if (resolved && resolved.ambiguous) return null;
      if (resolved && resolved.name && !resolved.hypAbsent) return resolved.name;
    } catch (_) {}
    return null;
  }
  function offlineReply(userText) {
    const s = sky();
    const c = skyCtx();
    // Enrich wind if available
    try {
      const windEl = document.getElementById("wind-down");
      if (windEl) c.wind = parseInt(windEl.value, 10) / 100;
    } catch (_) {}
    const dest = matchTravel(userText, s);
    const brain = window.VesperCompanionBrain;
    if (brain && brain.reply) {
      return brain.reply(userText, c, {
        sky: s,
        radio: window.__vesperRadio,
        travelDest: dest || null,
        setCinema: setCinema,
        setAdvanced: setAdvanced,
        setHideControls: function (on) {
          if (window.VesperSky && window.VesperSky.setHideControls) {
            window.VesperSky.setHideControls(!!on);
          } else {
            document.body.classList.toggle("hide-controls", !!on);
            const r = document.getElementById("hud-restore");
            if (r) r.hidden = !on;
          }
        },
        startTour: function (sec) {
          if (window.VesperTours && window.VesperTours.start) return window.VesperTours.start(sec);
          return null;
        },
      });
    }
    // Fallback (brain missing): short contextual
    if (dest && s && s.travelTo) {
      s.travelTo(dest);
      return "Travel → " + dest + ".";
    }
    return whereAmI(c) + " " + tipFor(c);
  }

  function speak(text, forceGuide) {
    if (!forceGuide && !chkTts.checked) return;
    if (!synth) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1;
      synth.speak(u);
    } catch (_) {}
  }
  function showGuideToast(text) {
    if (window.VesperMessages) window.VesperMessages.show(text, 3200);
  }

  const narrated = Object.create(null);
  window.addEventListener("vesper:lookat", (ev) => {
    if (!chkGuide.checked) return;
    const name = ev.detail && ev.detail.name;
    const blurb = (ev.detail && ev.detail.blurb) || name;
    if (!name || narrated[name]) return;
    narrated[name] = true;
    showGuideToast(blurb);
    speak(blurb, true);
    syncContextStrip();
    // Do NOT spam chat log — toast + voice only
  });
  window.addEventListener("vesper:travel", () => {
    Object.keys(narrated).forEach((k) => delete narrated[k]);
    syncContextStrip();
  });
  window.addEventListener("vesper:ready", () => syncContextStrip());

  /* ---------- Live AI (optional, Advanced) ---------- */
  function endpointUrl() {
    const base = (aiBase.value || "").trim().replace(/\/$/, "");
    if (!base) return "";
    if (/chat\/completions\/?$/i.test(base)) return base;
    if (aiPreset.value === "legacy" || /\/v1\/.+/.test(base)) {
      if (/\/chat\/completions/i.test(base)) return base;
    }
    return base + "/chat/completions";
  }
  function safeErrorMessage(err) {
    let msg = (err && err.message) ? String(err.message) : "error";
    // Strip anything that looks like a key / bearer
    msg = msg.replace(/Bearer\s+\S+/gi, "Bearer ***");
    msg = msg.replace(/\b(sk|xai|or)-[a-zA-Z0-9_-]{8,}/g, "[redacted]");
    msg = msg.replace(/(api[_-]?key["']?\s*[:=]\s*)["']?[^"',\s]+/gi, "$1[redacted]");
    // Don't dump long JSON bodies into chat
    if (msg.length > 120) msg = msg.slice(0, 117) + "…";
    return msg;
  }
  function systemPrompt() {
    const c = skyCtx();
    return [
      "You are Vesper's brief calm sky guide inside a web planetarium.",
      "No medical or therapy claims. 2–4 short sentences.",
      "User flies free 6DOF. FLOAT=soft (+lazy-river idle); PILOT=manual high thrust.",
      "Gears: DOCK/CRUISE/BURN/TRANSIT. Soft-land & walk on rocks/worlds; Sol=science-only.",
      "Mode: " + c.mode + ". Gear: " + c.gear + ". Clock: " + c.clock + ".",
      c.walking && c.walkBody
        ? "User is walking on: " + c.walkBody + "."
        : c.looking
          ? "User is looking toward: " + c.looking + "."
          : "User is in deep space / not locked on a body.",
      c.blurb ? "Guide note: " + c.blurb : "",
      "Suggest FLOAT, PILOT, gears, Travel, wind down, Sol, or cinema when helpful.",
    ]
      .filter(Boolean)
      .join(" ");
  }
  async function callLiveModel(userText) {
    const url = endpointUrl();
    if (!url) throw new Error("No base URL");
    if (!isAllowedEndpoint(url)) {
      throw new Error("URL must be https:// or http://localhost");
    }
    const key = (aiKey.value || "").trim();
    const model = (aiModel.value || "").trim() || "gpt-4o-mini";
    const headers = { "Content-Type": "application/json" };
    if (key) headers.Authorization = "Bearer " + key;
    if (/openrouter\.ai/i.test(url)) {
      headers["HTTP-Referer"] = location.origin || "https://vesper.local";
      headers["X-Title"] = "Vesper Evening Planetarium";
    }
    const body = {
      model: model,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userText },
      ],
      max_tokens: 200,
      temperature: 0.7,
    };
    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Do not paste response body (may contain provider error details / echoes)
      throw new Error("HTTP " + res.status);
    }
    const data = await res.json();
    const content =
      (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
      data.reply ||
      data.message ||
      data.output ||
      null;
    if (!content) throw new Error("Unexpected response");
    return String(content).trim();
  }

  /* ---------- Chips ---------- */
  const CHIP_DEFS = [
    { label: "Where?", text: "where am i" },
    { label: "About", text: "tell me about this" },
    { label: "Station", text: "find observation station" },
    { label: "Belt tour", text: "start belt tour" },
    { label: "Hide HUD", text: "hide controls" },
    { label: "Calm", text: "wind down" },
    { label: "FLOAT", text: "float" },
    { label: "Tip", text: "tip" },
  ];
  CHIP_DEFS.forEach((c) => {
    const b = el("button", "chip-btn", c.label);
    b.type = "button";
    b.addEventListener("click", () => handleUserText(c.text));
    chipsEl.appendChild(b);
  });

  /* ---------- Handle send ---------- */
  let busy = false;
  async function handleUserText(raw) {
    const text = (raw || "").trim();
    if (!text || busy) return;
    busy = true;
    addMsg("user", text);
    input.value = "";
    syncContextStrip();
    saveCfg();

    // Offline intents always resolve instantly first when Live is off
    const wantLive = chkLive.checked && endpointUrl();
    if (!wantLive) {
      setStatus("Offline");
      const reply = offlineReply(text);
      addMsg("bot", reply);
      if (chkTts.checked) speak(reply);
      syncContextStrip();
      busy = false;
      return;
    }

    setStatus("Live…");
    let reply = null;
    let usedLive = false;
    try {
      reply = await callLiveModel(text);
      usedLive = true;
    } catch (err) {
      addMsg("sys", "Live failed (" + safeErrorMessage(err) + "). Offline instead.");
      reply = offlineReply(text);
    }
    addMsg("bot", reply);
    if (chkTts.checked) speak(reply);
    setStatus(usedLive ? "Live · " + ((aiModel.value || "model").slice(0, 24)) : "Offline");
    syncContextStrip();
    busy = false;
  }

  btnSend.addEventListener("click", () => handleUserText(input.value));
  const shipSend = document.getElementById("ship-send");
  const shipInput = document.getElementById("ship-input");
  if (shipSend && shipInput) {
    shipSend.addEventListener("click", () => handleUserText(shipInput.value));
    shipInput.addEventListener("keydown", (e) => {
      if (window.VesperInput.uiKey(e, "submit")) handleUserText(shipInput.value);
    });
  }
  let _lastNoted = "";
  function noteBody(name) {
    if (!name || name === _lastNoted) return;
    _lastNoted = name;
    const ill = (window.__vesperIllum && window.__vesperIllum[name]) || null;
    const sci = window.VesperScience && window.VesperScience.fact ? window.VesperScience.fact(name) : "";
    let line = name;
    if (ill && ill.kind === "moon") {
      const ph = ill.phase != null ? Math.round(ill.phase * 100) : null;
      line = name + " orbits " + (ill.parent || "its planet") +
        (ill.periodDays ? " · sidereal " + ill.periodDays + " d" : "") +
        (ill.lock ? " · rotation locked to that orbit (not 24 h)" : " · spin not locked to 24 h") +
        (ill.retro ? " · retrograde" : "") +
        (ph != null ? " · illuminated as seen from " + ill.parent + " ≈ " + ph + "%" : "");
    } else if (ill && ill.kind === "craft") {
      // No solar year. The fact or the blurb is the honest line.
      line = name;
      if (!sci) {
        const blurb = window.VesperSky && window.VesperSky.getBlurb && window.VesperSky.getBlurb(name);
        if (blurb) line = blurb;
      }
    } else if (ill) {
      // rotDays 1 is the fallback when the table has no period. It was
      // telling Eros and Halley they spin once a day. A display AU that
      // is not the almanac distance was also printing Sedna's year.
      let year = "";
      if (ill.periodDays) {
        let clash = false;
        try {
          const al = window.VesperScience && window.VesperScience.ALMANAC && window.VesperScience.ALMANAC[name];
          if (al && typeof al.a_au === "number" && al.a_au > 0) {
            const expect = 365.256 * Math.pow(al.a_au, 1.5);
            if (Math.abs(ill.periodDays - expect) / expect > 0.15) clash = true;
          }
        } catch (_) {}
        if (!clash) year = " · year ≈ " + Math.round(ill.periodDays) + " d";
      }
      let spin = "";
      if (ill.rotDays != null && ill.rotDays !== 1) {
        const back = ill.rotDays < 0;
        spin = " · rotation ≈ " + Math.abs(ill.rotDays) + " d" + (back ? " · retrograde" : "");
      }
      line = name + " orbits Sol" + year + spin;
    }
    if (sci) line += " — " + sci;
    addMsg("agent", line);
  }
  window.VesperComms = {
    noteBody: noteBody,
    say: (text) => addMsg("agent", text),
    setShipComputer: setShipComputer,
  };
  input.addEventListener("keydown", (e) => {
    if (window.VesperInput.uiKey(e, "submit") && !e.shiftKey) {
      e.preventDefault();
      handleUserText(input.value);
    }
  });

  /* ---------- Mic ---------- */
  let recognition = null;
  let listening = false;
  if (!SpeechRecognition) {
    btnMic.disabled = true;
    btnMic.title = "Mic unavailable — type instead";
  } else {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => {
      listening = true;
      btnMic.classList.add("listening");
      setStatus("Listening…");
    };
    recognition.onerror = (ev) => {
      listening = false;
      btnMic.classList.remove("listening");
      setStatus("Mic: " + (ev.error || "error"));
    };
    recognition.onend = () => {
      listening = false;
      btnMic.classList.remove("listening");
    };
    recognition.onresult = (ev) => {
      let interim = "";
      let finalText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (interim) input.value = interim;
      if (finalText) {
        input.value = finalText;
        handleUserText(finalText);
      }
    };
    btnMic.addEventListener("click", () => {
      if (listening) {
        try {
          recognition.stop();
        } catch (_) {}
        return;
      }
      try {
        recognition.start();
      } catch (_) {
        setStatus("Mic could not start");
      }
    });
  }

  // Welcome — one clean line
  addMsg(
    "bot",
    "Evening. Local companion online — mode, gear, look target, and a science almanac. Ask where am I, tell me about this world, travel Europa, start a belt tour, or hide controls. Live AI stays optional under Advanced."
  );
  syncContextStrip();
  setInterval(syncContextStrip, 2000);

  window.VesperAgent = {
    open: () => setOpen(true),
    close: () => {
      setCinema(false);
      setOpen(false);
    },
    cinema: setCinema,
    say: handleUserText,
    clearNarrationMemory: () => {
      Object.keys(narrated).forEach((k) => delete narrated[k]);
    },
    clearKeys,
  };
})();
