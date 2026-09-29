/* storage.js — LocalStorage with schema versioning, corruption recovery and
 * in-memory fallback (private mode / quota errors). */
(function () {
  "use strict";

  var KEY = "mgjy.save.v1";
  var SCHEMA = 1;

  function MemoryBackend() {
    var m = {};
    this.getItem = function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; };
    this.setItem = function (k, v) { m[k] = String(v); };
    this.removeItem = function (k) { delete m[k]; };
    this.__memory = true;
  }

  var ls = null;
  try {
    var probe = "__mgjy_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    ls = window.localStorage;
  } catch (e) {
    ls = new MemoryBackend();
  }

  function logWarn(msg) {
    try { console.warn("[storage] " + msg); } catch (_) { /* noop */ }
  }

  function load() {
    var raw = null;
    try {
      raw = ls.getItem(KEY);
    } catch (e) {
      logWarn("read failed: " + e.message);
      return null;
    }
    if (!raw) return null;
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      logWarn("save corrupted, quarantining");
      try { ls.setItem(KEY + ".corrupt." + Date.now(), raw); ls.removeItem(KEY); } catch (_) {}
      return null;
    }
    if (!data || typeof data !== "object" || data.schema !== SCHEMA) {
      logWarn("save schema mismatch, discarding");
      return null;
    }
    return data;
  }

  function save(data) {
    data.schema = SCHEMA;
    data.savedAt = new Date().toISOString();
    var raw;
    try {
      raw = JSON.stringify(data);
    } catch (e) {
      logWarn("serialize failed: " + e.message);
      return false;
    }
    try {
      ls.setItem(KEY, raw);
      return true;
    } catch (e) {
      // QuotaExceededError etc: drop the heaviest optional part and retry once
      logWarn("write failed (" + e.name + "), retrying without review");
      try {
        if (data.session) data.session.review = null;
        ls.setItem(KEY, JSON.stringify(data));
        return true;
      } catch (e2) {
        logWarn("write retry failed: " + e2.message);
        return false;
      }
    }
  }

  function clear() {
    try { ls.removeItem(KEY); } catch (e) { logWarn("clear failed: " + e.message); }
  }

  function isMemory() { return !!ls.__memory; }

  window.MGStorage = { load: load, save: save, clear: clear, isMemory: isMemory };
})();
