// Run independently of MkDocs: node --test scripts/home_animation.test.cjs
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const source = readFileSync(resolve(__dirname, "../docs/javascripts/home.js"), "utf8");
const title = "always the self-reflection";

function load({ reduced = false, hidden = false, homepage = true, loading = false } = {}) {
  const timers = new Map();
  const events = new Map();
  let nextId = 0;
  let preferenceChanged;
  const span = { textContent: title, getAttribute: () => title };
  const media = {
    matches: reduced,
    addEventListener(event, callback) {
      assert.equal(event, "change");
      preferenceChanged = callback;
    },
  };
  const document = {
    hidden,
    readyState: loading ? "loading" : "complete",
    getElementById: () => homepage ? span : null,
    addEventListener: (event, callback) => events.set(event, callback),
  };
  runInNewContext(source, {
    document,
    window: {
      matchMedia(query) {
        assert.equal(query, "(prefers-reduced-motion: reduce)");
        return media;
      },
      setTimeout(callback) {
        timers.set(++nextId, callback);
        return nextId;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  });
  return {
    span, timers,
    tick() {
      assert.equal(timers.size, 1, "only one animation timer should run");
      const [id, callback] = timers.entries().next().value;
      timers.delete(id);
      callback();
    },
    setReduced(value) {
      media.matches = value;
      preferenceChanged?.({ matches: value });
    },
    setHidden(value) {
      document.hidden = value;
      events.get("visibilitychange")?.();
    },
    ready() {
      document.readyState = "complete";
      events.get("DOMContentLoaded")?.();
    },
  };
}

test("reduced motion keeps the full title without animation timers", () => {
  const page = load({ reduced: true });
  assert.equal(page.span.textContent, title);
  assert.equal(page.timers.size, 0);
});

test("normal motion starts with the title and continues typing and erasing", () => {
  const page = load();
  assert.equal(page.span.textContent, title);
  const frames = new Set();
  for (let i = 0; i < title.length * 4 + 10; i++) {
    page.tick();
    frames.add(page.span.textContent);
    assert.ok(title.startsWith(page.span.textContent));
  }
  assert.ok(frames.has(""));
  assert.ok(frames.has("a"));
  assert.ok(frames.has(title));
});

test("changing motion preference stops immediately and resumes one timer", () => {
  const page = load();
  page.tick();
  page.setReduced(true);
  assert.equal(page.span.textContent, title);
  assert.equal(page.timers.size, 0);
  page.setReduced(false);
  page.setReduced(false);
  assert.equal(page.timers.size, 1);
  page.tick();
  assert.notEqual(page.span.textContent, title);
});

test("hidden tabs pause; resuming still respects reduced motion", () => {
  const page = load();
  page.tick();
  page.setHidden(true);
  assert.equal(page.span.textContent, title);
  assert.equal(page.timers.size, 0);
  page.setHidden(false);
  assert.equal(page.timers.size, 1);
  page.setHidden(true);
  page.setReduced(true);
  page.setHidden(false);
  assert.equal(page.timers.size, 0);
  assert.equal(page.span.textContent, title);
});

test("a page loaded in the background remains static", () => {
  const page = load({ hidden: true });
  assert.equal(page.span.textContent, title);
  assert.equal(page.timers.size, 0);
});

test("non-home pages do not start animation timers", () => {
  assert.equal(load({ homepage: false }).timers.size, 0);
});

test("initialization waits for the DOM while preserving the fallback title", () => {
  const page = load({ loading: true, reduced: true });
  assert.equal(page.span.textContent, title);
  assert.equal(page.timers.size, 0);
  page.ready();
  assert.equal(page.span.textContent, title);
  assert.equal(page.timers.size, 0);
});
