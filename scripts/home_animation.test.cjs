// Run with: node --test scripts/home_animation.test.cjs
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const read = (path) => readFileSync(resolve(__dirname, "..", path), "utf8");
const source = read("docs/javascripts/home.js");
const template = read("overrides/home.html");
const [, title, fallback] = template.match(/<span id="typed-text" data-text="([^"]*)">([^<]*)<\/span>/);

function load({ reduced = false, homepage = true, loading = false } = {}) {
  const timers = new Map();
  const events = new Map();
  let nextId = 0;
  let preferenceChanged;
  const span = { textContent: fallback, getAttribute: () => title };
  const media = {
    matches: reduced,
    addEventListener: (event, callback) => { preferenceChanged = callback; },
  };
  const document = {
    readyState: loading ? "loading" : "complete",
    getElementById: () => homepage ? span : null,
    addEventListener: (event, callback) => events.set(event, callback),
  };
  runInNewContext(source, {
    document,
    window: {
      matchMedia: () => media,
      setTimeout: (callback, delay) => {
        timers.set(++nextId, { callback, delay });
        return nextId;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  });
  return {
    span, timers,
    tick(expectedDelay) {
      assert.equal(timers.size, 1, "only one animation timer should run");
      const [id, { callback, delay }] = timers.entries().next().value;
      assert.equal(delay, expectedDelay);
      timers.delete(id);
      callback();
    },
    setReduced(value) {
      media.matches = value;
      preferenceChanged({ matches: value });
    },
    ready: () => events.get("DOMContentLoaded")(),
  };
}

test("template provides the full title without JavaScript", () => {
  assert.ok(title.length > 0);
  assert.equal(fallback, title);
});

test("normal motion preserves the original typing and erasing delays", () => {
  const page = load();
  assert.equal(page.span.textContent, "");
  page.tick(2250);
  assert.equal(page.span.textContent, title[0]);
  for (let i = 1; i < title.length; i++) page.tick(200);
  assert.equal(page.span.textContent, title);
  page.tick(200);
  page.tick(2000);
  assert.equal(page.span.textContent, title.slice(0, -1));
  for (let i = 1; i < title.length; i++) page.tick(100);
  assert.equal(page.span.textContent, "");
  page.tick(100);
  page.tick(200);
  assert.equal(page.span.textContent, title[0]);
});

test("reduced motion keeps the full title with no timer", () => {
  const page = load({ reduced: true });
  assert.equal(page.span.textContent, title);
  assert.equal(page.timers.size, 0);
});

test("motion preference changes stop immediately and restart one timer", () => {
  const page = load();
  page.tick(2250);
  page.setReduced(true);
  assert.equal(page.span.textContent, title);
  assert.equal(page.timers.size, 0);
  page.setReduced(false);
  page.setReduced(false);
  assert.equal(page.span.textContent, "");
  page.tick(2250);
  assert.equal(page.span.textContent, title[0]);
});

test("loading preserves the fallback until the DOM is ready", () => {
  const page = load({ loading: true, reduced: true });
  assert.equal(page.span.textContent, title);
  assert.equal(page.timers.size, 0);
  page.ready();
  assert.equal(page.span.textContent, title);
  assert.equal(page.timers.size, 0);
});

test("non-home pages do not start animation timers", () => {
  assert.equal(load({ homepage: false }).timers.size, 0);
});
