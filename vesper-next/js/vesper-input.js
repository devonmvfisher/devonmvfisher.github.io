/* Owned code-only input table. Pure core first, browser wiring at the end. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root.document) root.VesperInput = api.attach(root);
})(globalThis, function () {
  "use strict";
  const ALL = ["flight", "groundLearn", "groundLive", "roverLearn", "roverLive"];
  const GROUND = ALL.slice(1);
  const TABLE = [
    ["forward", "Forward", ["KeyW", "ArrowUp"], ALL],
    ["back", "Back", ["KeyS", "ArrowDown"], ALL],
    ["left", "Left", ["KeyA", "ArrowLeft"], ALL],
    ["right", "Right", ["KeyD", "ArrowRight"], ALL],
    ["up", "Up", ["KeyE", "Space"], ["flight"]],
    ["down", "Down", ["KeyQ", "KeyX"], ["flight"]],
    ["takeoff", "Take off", ["Space"], GROUND],
    ["rollLeft", "Roll left", ["KeyZ"], ["flight"]],
    ["rollRight", "Roll right", ["KeyC"], ["flight"]],
    ["boost", "Boost", ["ShiftLeft", "ShiftRight"], ALL],
    ["float", "Float feel", ["Digit1"], ALL],
    ["pilot", "Pilot feel", ["Digit2"], ALL],
    ["clockPause", "Pause orbits", ["Digit0"], ALL],
    ["clockReal", "Real orbits", ["Digit3"], ALL],
    ["clockCruise", "Cruise orbits", ["Digit4"], ALL],
    ["clockFast", "Fast orbits", ["Digit5"], ALL],
    ["clockCine", "Cinema orbits", ["Digit6"], ALL],
    ["gearDown", "Gear down", ["BracketLeft", "Comma"], ALL],
    ["gearUp", "Gear up", ["BracketRight", "Period"], ALL],
    ["help", "Help", ["KeyH", "Slash"], ALL],
    ["hideMenus", "Hide menus", ["KeyU"], ["flight", "groundLearn", "roverLearn"]],
    ["guilds", "Guilds", ["KeyU"], ["groundLive", "roverLive"]],
    ["home", "Home", ["KeyR"], ALL],
    ["build", "Build", ["KeyB"], ALL],
    ["sol", "Sol honesty", ["KeyY"], ALL],
    ["notebook", "Export notebook", ["KeyN"], ALL],
    ["inventory", "Inventory", ["KeyI"], ALL],
    ["journal", "Journal", ["KeyJ"], ALL],
    ["talk", "Talk or pick up", ["KeyE"], GROUND],
    ["rover", "Rover", ["KeyG"], GROUND],
    ["camera", "Camera", ["KeyV"], ALL],
    ["pause", "Pause ship and orbits", ["KeyP", "Pause"], ALL],
    ["codex", "Codex", ["KeyK"], ALL],
    ["equip", "Equip nearby Skytape", ["KeyF"], ALL],
    ["backPanel", "Close or back", ["Escape"], ALL]
  ];
  const PAD = Object.freeze({ axes: { move: [0, 1], look: [2, 3] },
    triggers: { down: 6, up: 7 }, held: { boost: 2, rollLeft: 4, rollRight: 5 },
    buttons: { landTalk: 0, backPanel: 1, camera: 3, hideMenus: 8, help: 9,
      travelPrevious: 12, travelNext: 13, gearDown: 14, gearUp: 15 } });
  const forbidden = code => /^(?:Control|Alt|Meta)(?:Left|Right)$/.test(code);
  const validCode = code => typeof code === "string" && /^(?:Key[A-Z]|Digit[0-9]|Arrow(?:Up|Down|Left|Right)|Space|Shift(?:Left|Right)|Bracket(?:Left|Right)|Comma|Period|Slash|Escape|Pause|Enter|Tab|Backspace|Delete|Home|End|PageUp|PageDown|Minus|Equal|Semicolon|Quote|Backquote|Backslash|CapsLock|F(?:[1-9]|1[0-2])|Numpad(?:[0-9]|Add|Subtract|Multiply|Divide|Decimal|Enter))$/.test(code);
  const modified = event => !!(event.ctrlKey || event.altKey || event.metaKey);
  const typing = target => !!(target && (/^(?:INPUT|TEXTAREA|SELECT)$/i.test(target.tagName || "") || target.isContentEditable));
  function applyDeadzone(x, y, dz) {
    const len = Math.hypot(x, y);
    if (len < dz || len === 0) return { x: 0, y: 0 };
    const scale = (len - dz) / (1 - dz);
    return { x: x / len * scale, y: y / len * scale };
  }
  function shapeStick(x, y, dz = 0.07) {
    x = Number.isFinite(x) ? x : 0; y = Number.isFinite(y) ? y : 0;
    let len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; len = 1; }
    const curved = len > 1e-6 ? Math.pow(len, 1.16) : 0;
    if (len > 1e-6) { x = x / len * curved; y = y / len * curved; }
    else { x = 0; y = 0; }
    return applyDeadzone(x, y, dz);
  }
  function create(storage, contextSource = () => "flight") {
    const defaults = () => Object.fromEntries(TABLE.map(row => [row[0], row[2].slice()]));
    let bindings = defaults(), settings = { sensitivity: 1, invertY: false };
    const down = new Set(), modifiers = new Set(), edges = new Set(), virtual = new Set();
    const eventActions = new WeakMap(), padPrevious = new Set(), padsKnown = new Set();
    let blocked = false, contextOverride = null;
    const context = () => contextOverride || contextSource();
    const rowFor = action => TABLE.find(row => row[0] === action);
    const active = action => { const row = rowFor(action); return row ? row[3].includes(context()) : true; };
    const overlaps = (a, b) => rowFor(a)[3].some(value => rowFor(b)[3].includes(value));
    function load() {
      try {
        const raw = storage && storage.getItem("vesper.keys.v1");
        if (!raw) return;
        const value = JSON.parse(raw);
        if (!value || value.schema !== 1 || !value.bindings || Object.keys(value.bindings).length !== TABLE.length) throw Error("invalid keys");
        for (const row of TABLE) {
          const codes = value.bindings[row[0]];
          if (!Array.isArray(codes) || codes.length > 8 || new Set(codes).size !== codes.length || codes.some(code => !validCode(code) || forbidden(code))) throw Error("invalid binding");
        }
        if (!value.settings || !Number.isFinite(value.settings.sensitivity) || value.settings.sensitivity < 0.1 || value.settings.sensitivity > 4 || typeof value.settings.invertY !== "boolean") throw Error("invalid settings");
        bindings = value.bindings; settings = value.settings;
        if (conflicts().length) throw Error("conflicting keys");
      } catch (_) { bindings = defaults(); settings = { sensitivity: 1, invertY: false }; }
    }
    function save() { try { if (storage) storage.setItem("vesper.keys.v1", JSON.stringify({ schema: 1, bindings, settings })); } catch (_) {} }
    function release() { down.clear(); edges.clear(); virtual.clear(); padPrevious.clear(); }
    function conflicts(action, code) {
      if (action) return TABLE.filter(row => row[0] !== action && overlaps(action, row[0]) && bindings[row[0]].includes(code)).map(row => row[0]);
      const result = [];
      for (let i = 0; i < TABLE.length; i++) for (let j = i + 1; j < TABLE.length; j++) {
        const a = TABLE[i][0], b = TABLE[j][0];
        if (overlaps(a, b)) for (const code of bindings[a]) if (bindings[b].includes(code)) result.push({ code, actions: [a, b] });
      }
      return result;
    }
    function held(action) {
      if (blocked || modifiers.size || !active(action)) return false;
      return virtual.has(action) || (bindings[action] || []).some(code => down.has(code));
    }
    function handle(event, isDown = true) {
      const code = event.code;
      if (forbidden(code)) {
        if (isDown) modifiers.add(code); else modifiers.delete(code);
        release(); blocked = modified(event) || modifiers.size > 0;
        return [];
      }
      blocked = modified(event) || modifiers.size > 0;
      if (blocked) { release(); return []; }
      if (!isDown) { down.delete(code); return []; }
      if (typing(event.target) || event.repeat || down.has(code)) return [];
      // Activating a focused button must not also fire vertical thrust.
      if ((code === "Space" || code === "Enter") && (event.target?.tagName === "BUTTON" || event.target?.closest?.("button"))) return [];
      const actions = TABLE.filter(row => active(row[0]) && bindings[row[0]].includes(code) && !(row[0] === "help" && code === "Slash" && !event.shiftKey)).map(row => row[0]);
      down.add(code);
      for (const action of actions) edges.add(action);
      eventActions.set(event, actions);
      return actions;
    }
    function list() { return TABLE.map(row => ({ action: row[0], label: row[1], codes: bindings[row[0]].slice(), contexts: row[3].slice() })); }
    function bind(action, code, take = false) {
      if (!rowFor(action) || !validCode(code) || forbidden(code)) return { ok: false, reason: "Ctrl, Alt and Meta belong to the browser; choose another key." };
      const clashes = conflicts(action, code);
      if (clashes.length && !take) return { ok: false, conflicts: clashes };
      if (take) for (const other of clashes) bindings[other] = bindings[other].filter(item => item !== code);
      if (!bindings[action].includes(code)) bindings[action].push(code);
      release(); save(); return { ok: true, conflicts: clashes };
    }
    function pollPads(pads) {
      const pad = Array.from(pads || []).find(item => item && item.connected !== false && item.mapping === "standard");
      const frame = { move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, vertical: 0, roll: 0, pressed: [], connected: false };
      for (const action of Object.keys(PAD.held)) virtual.delete(action);
      if (!pad) { padPrevious.clear(); padsKnown.clear(); return frame; }
      const identity = String(pad.index) + ":" + String(pad.id);
      frame.connected = !padsKnown.has(identity); padsKnown.add(identity);
      const value = index => Math.max(0, Math.min(1, Number(pad.buttons[index] && pad.buttons[index].value) || 0));
      frame.move = shapeStick(pad.axes[PAD.axes.move[0]], pad.axes[PAD.axes.move[1]]);
      frame.look = shapeStick(pad.axes[PAD.axes.look[0]], pad.axes[PAD.axes.look[1]]);
      frame.vertical = value(PAD.triggers.up) - value(PAD.triggers.down);
      frame.roll = value(PAD.held.rollLeft) - value(PAD.held.rollRight);
      const current = new Set();
      for (const [action, index] of Object.entries(PAD.held)) if (value(index) > 0.5) virtual.add(action);
      for (const [action, index] of Object.entries(PAD.buttons)) if (value(index) > 0.5) {
        current.add(action); if (!padPrevious.has(action)) frame.pressed.push(action);
      }
      padPrevious.clear(); for (const action of current) padPrevious.add(action);
      if (blocked || modifiers.size) { frame.move = frame.look = { x: 0, y: 0 }; frame.vertical = frame.roll = 0; frame.pressed = []; }
      return frame;
    }
    load();
    return { handle, held, pressed(action) { if (!active(action) || blocked || modifiers.size) return false; const yes = edges.has(action); edges.delete(action); return yes; },
      triggered: (action, event) => !blocked && !modifiers.size && (eventActions.get(event) || []).includes(action),
      uiKey: (event, action) => !modified(event) && event.code === ({ submit: "Enter", cancel: "Escape" }[action]),
      code: event => event.code, modified, typing, forbidden, bind, conflicts, list, pollPads, padMapping: PAD,
      unbind(action, code) { if (!bindings[action]) return false; bindings[action] = bindings[action].filter(item => item !== code); release(); save(); return true; },
      reset() { bindings = defaults(); settings = { sensitivity: 1, invertY: false }; release(); save(); },
      setContext(value) { contextOverride = value; release(); },
      release, blur() { release(); modifiers.clear(); blocked = false; }, setVirtual(action, on) { if (on) virtual.add(action); else virtual.delete(action); },
      anyHeld: () => TABLE.some(row => held(row[0])),
      settings: () => ({ ...settings }),
      setSettings(value) { if (Number.isFinite(value.sensitivity)) settings.sensitivity = Math.max(0.1, Math.min(4, value.sensitivity)); if (typeof value.invertY === "boolean") settings.invertY = value.invertY; save(); },
      movement() { return { forward: Number(held("forward")) - Number(held("back")), right: Number(held("right")) - Number(held("left")), up: Number(held("up")) - Number(held("down")) }; },
      helpLines: () => list().map(row => row.label + ": " + (row.codes.join(" / ") || "Unbound") + " (" + row.contexts.join(", ") + ")"),
      applyDeadzone, shapeStick };
  }
  function createLock(doc, canvas, look, message, settings) {
    let locked = doc.pointerLockElement === canvas, observer = null;
    function changed() {
      locked = doc.pointerLockElement === canvas;
      message("Click to fly - Esc for cursor");
      if (!locked && observer) { observer.disconnect(); observer = null; }
    }
    async function request() {
      if (locked) return true;
      try { await canvas.requestPointerLock({ unadjustedMovement: true }); return true; }
      catch (_) { try { await canvas.requestPointerLock(); return true; }
        catch (_) { message("Mouse capture is unavailable. Click the sky again, or drag to look."); return false; } }
    }
    function release() { if (doc.pointerLockElement === canvas) { try { doc.exitPointerLock(); } catch (_) {} } }
    function movement(event) {
      if (!locked) return false;
      const value = settings();
      look((Number(event.movementX) || 0) * value.sensitivity, (Number(event.movementY) || 0) * value.sensitivity * (value.invertY ? -1 : 1));
      return true;
    }
    return { request, release, panelOpened: release, changed, movement, locked: () => locked,
      watch(win, visiblePanel) {
        if (!locked || observer || !win.MutationObserver) return;
        observer = new win.MutationObserver(() => { if (visiblePanel()) release(); });
        observer.observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style", "hidden", "aria-hidden", "data-build"] });
      } };
  }
  function attach(win) {
    let storage; try { storage = win.localStorage; } catch (_) {}
    const doc = win.document;
    const input = create(storage, () => {
      const ground = win.VesperSky && win.VesperSky.isWalking && win.VesperSky.isWalking();
      if (!ground) return "flight";
      return (doc.body.dataset.drive === "1" ? "rover" : "ground") + (doc.body.dataset.product === "learn" ? "Learn" : "Live");
    });
    let capture = null, lock = null;
    const say = text => { if (win.VesperMessages) win.VesperMessages.show(text, 2600); };
    const panelVisible = () => Array.from(doc.querySelectorAll("#help-panel, #ship-computer, #ship-panel, #agent-overlay, #build-tray, #vesper-inv, #vesper-journal, #vesper-talk, #vesper-guilds, #vesper-codex, #vesper-missions")).some(panel => {
      const style = win.getComputedStyle(panel);
      return !panel.hidden && panel.getAttribute("aria-hidden") !== "true" && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0;
    });
    function renderHelp() {
      const box = doc.getElementById("key-bindings"); if (!box) return;
      box.replaceChildren();
      for (const row of input.list()) {
        const button = doc.createElement("button"); button.type = "button"; button.className = "key-binding";
        button.textContent = row.label + ": " + (row.codes.join(" / ") || "Unbound");
        button.title = row.contexts.join(", ");
        button.addEventListener("click", () => { capture = row.action; input.release(); status("Press a key for " + row.label + ". Escape cancels."); });
        box.appendChild(button);
      }
      const value = input.settings(), sensitivity = doc.getElementById("look-sensitivity"), invert = doc.getElementById("look-invert");
      if (sensitivity) sensitivity.value = value.sensitivity;
      if (invert) invert.checked = value.invertY;
    }
    function status(text) { const target = doc.getElementById("binding-status"); if (target) target.textContent = text; }
    win.addEventListener("keydown", event => {
      if (capture) {
        if (input.uiKey(event, "cancel")) { capture = null; status("Key change cancelled."); return; }
        if (input.modified(event) || input.forbidden(input.code(event))) { status("Ctrl, Alt and Meta belong to the browser; choose another key."); return; }
        event.preventDefault(); event.stopImmediatePropagation();
        let result = input.bind(capture, input.code(event));
        if (result.conflicts && result.conflicts.length) {
          status("This key is used by " + result.conflicts.join(", ") + ".");
          if (!win.confirm("This key is used by " + result.conflicts.join(", ") + ". Move it to this action?")) return;
          result = input.bind(capture, input.code(event), true);
        }
        if (result.ok) { const label = capture; for (const old of input.list().find(row => row.action === label).codes) if (old !== input.code(event)) input.unbind(label, old); capture = null; renderHelp(); status("Key saved for " + label + ". Reset restores the defaults."); }
        else status(result.reason || "Choose a supported keyboard key.");
        return;
      }
      input.handle(event);
    }, true);
    win.addEventListener("keyup", event => input.handle(event, false), true);
    win.addEventListener("blur", () => input.blur());
    doc.addEventListener("visibilitychange", () => { if (doc.hidden) input.blur(); });
    input.releasePointer = () => { if (lock) lock.release(); };
    input.pointerLocked = () => !!(lock && lock.locked());
    input.connectLook = (canvas, look) => {
      lock = createLock(doc, canvas, look, say, input.settings);
      canvas.addEventListener("click", event => { if (event.pointerType && event.pointerType !== "mouse") return; if (!panelVisible()) lock.request(); });
      doc.addEventListener("mousemove", event => lock.movement(event));
      doc.addEventListener("pointerlockchange", () => { lock.changed(); input.release(); if (panelVisible()) lock.release(); else lock.watch(win, panelVisible); });
      doc.addEventListener("pointerlockerror", () => say("Mouse capture is unavailable. Drag the sky to look."));
    };
    input.initHelp = () => {
      renderHelp();
      const reset = doc.getElementById("keys-reset"); if (reset) reset.addEventListener("click", () => { capture = null; input.reset(); renderHelp(); status("Default keys and mouse settings restored."); });
      const sensitivity = doc.getElementById("look-sensitivity"), invert = doc.getElementById("look-invert");
      if (sensitivity) sensitivity.addEventListener("input", () => { input.setSettings({ sensitivity: Number(sensitivity.value) }); status("Mouse sensitivity saved."); });
      if (invert) invert.addEventListener("change", () => { input.setSettings({ invertY: invert.checked }); status("Invert Y saved."); });
    };
    return input;
  }
  return { create, createLock, attach, applyDeadzone, shapeStick, table: TABLE, padMapping: PAD };
});
