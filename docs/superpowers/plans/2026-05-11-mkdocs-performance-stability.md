# MkDocs Performance Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the MkDocs blog deployment stricter and reduce unnecessary MathJax loading without changing URLs, navigation, search, or the MkDocs Material framework.

**Architecture:** Keep GitHub Actions as the single deploy path and add a small repository-owned validation script for release invariants. Use a minimal MkDocs Material template override to inject MathJax only when a page opts in with `math: true`.

**Tech Stack:** MkDocs 1.6.1, MkDocs Material 9.6.2, GitHub Actions, POSIX shell, Jinja template overrides.

---

## File Structure

- Create `scripts/check_release_invariants.sh`: validates tracked-file hygiene and workflow guardrails.
- Modify `.github/workflows/ci.yml`: adds concurrency, explicit strict validation, release invariant check, and named deployment step.
- Modify `push.sh`: optionally reuses the invariant script before push.
- Modify `mkdocs.yml`: removes global MathJax scripts from `extra_javascript` and excludes internal `docs/superpowers/` planning documents from the public MkDocs build.
- Create `overrides/main.html`: extends Material's `base.html` and conditionally injects MathJax scripts inside the `scripts` block.
- Modify Markdown pages that use math syntax: add `math: true` frontmatter only where formulas need MathJax.

## Task 1: Release Invariant Script And CI Gate

**Files:**
- Create: `scripts/check_release_invariants.sh`
- Modify: `.github/workflows/ci.yml`
- Modify: `push.sh`

- [ ] **Step 1: Write the failing release invariant script**

Create `scripts/check_release_invariants.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'release invariant failed: %s\n' "$1" >&2
  exit 1
}

if [ -n "$(git ls-files -- site 'site/**')" ]; then
  git ls-files -- site 'site/**' >&2
  fail "site/ contains tracked build output"
fi

if [ -n "$(git ls-files -- .DS_Store ':(glob)**/.DS_Store')" ]; then
  git ls-files -- .DS_Store ':(glob)**/.DS_Store' >&2
  fail ".DS_Store files are tracked"
fi

grep -q '^concurrency:' .github/workflows/ci.yml \
  || fail "GitHub Actions workflow is missing concurrency"

grep -q 'mkdocs build --strict --site-dir /tmp/new_blog_mkdocs_strict' .github/workflows/ci.yml \
  || fail "GitHub Actions workflow is missing strict temporary build"
```

- [ ] **Step 2: Run the release invariant script and verify it fails**

Run:

```bash
bash scripts/check_release_invariants.sh
```

Expected: FAIL with `GitHub Actions workflow is missing concurrency`.

- [ ] **Step 3: Update GitHub Actions workflow**

Replace `.github/workflows/ci.yml` with:

```yaml
name: ci

on:
  push:
    branches:
      - master
      - main

permissions:
  contents: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Configure Git Credentials
        run: |
          git config user.name "catwithtudou"
          git config user.email 949812478@qq.com
      - uses: actions/setup-python@v5
        with:
          python-version: 3.x
          cache: pip
          cache-dependency-path: requirements.txt
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Validate MkDocs build
        run: mkdocs build --strict --site-dir /tmp/new_blog_mkdocs_strict
      - name: Check release invariants
        run: bash scripts/check_release_invariants.sh
      - name: Deploy GitHub Pages
        run: mkdocs gh-deploy --force
```

- [ ] **Step 4: Update local push script**

In `push.sh`, after `mkdocs build --strict`, add:

```bash
bash scripts/check_release_invariants.sh
```

- [ ] **Step 5: Run release invariant script and verify it passes**

Run:

```bash
bash scripts/check_release_invariants.sh
```

Expected: PASS with exit code 0 and no output.

## Task 2: Conditional MathJax Loading

**Files:**
- Modify: `mkdocs.yml`
- Create: `overrides/main.html`
- Modify: formula Markdown pages under `docs/`

- [ ] **Step 1: Verify current MathJax behavior fails the target**

Run:

```bash
mkdocs build --site-dir /tmp/new_blog_mathjax_red
rg -n 'cdn.jsdelivr.net/npm/mathjax' /tmp/new_blog_mathjax_red/index.html
```

Expected: FAIL for the target behavior because the home page contains the MathJax CDN script even though it has no `math: true` metadata.

- [ ] **Step 2: Remove global MathJax scripts from MkDocs config**

In `mkdocs.yml`, change `extra_javascript` from:

```yaml
extra_javascript:
  - javascripts/home.js
  - javascripts/mathjax.js
  - https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js
```

to:

```yaml
extra_javascript:
  - javascripts/home.js
```

- [ ] **Step 3: Add minimal Material template override**

Create `overrides/main.html`:

```html
{% extends "base.html" %}

{% block scripts %}
{{ super() }}
{% if page.meta and page.meta.math %}
  <script src="{{ 'javascripts/mathjax.js' | url }}"></script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
{% endif %}
{% endblock %}
```

- [ ] **Step 4: Add `math: true` to formula pages**

Search formula candidates:

```bash
rg -l '\$\$|\\\(|\\\[|\$[^$`]+\$' docs --glob '*.md'
```

For pages where the matches are formulas, add YAML frontmatter:

```yaml
---
math: true
---
```

If a page already has frontmatter, add only `math: true` inside the existing block. Do not add `math: true` for shell prompts, Makefile variables, currency values, or other non-formula dollar signs.

- [ ] **Step 5: Verify conditional loading**

Run:

```bash
mkdocs build --site-dir /tmp/new_blog_mathjax_green
! rg -n 'cdn.jsdelivr.net/npm/mathjax' /tmp/new_blog_mathjax_green/index.html
rg -n 'cdn.jsdelivr.net/npm/mathjax' /tmp/new_blog_mathjax_green/algorithms/machine_learning/20220226__白话机器学习的数学_阅读笔记/index.html
```

Expected: home page has no MathJax CDN script; the machine learning math page includes it.

## Task 3: Full Verification And Commit

**Files:**
- Validate all modified files.

- [ ] **Step 1: Run strict build**

Run:

```bash
mkdocs build --strict --site-dir /tmp/new_blog_mkdocs_strict
```

Expected: PASS with no warnings or errors.

- [ ] **Step 2: Run normal build**

Run:

```bash
mkdocs build --site-dir /tmp/new_blog_mkdocs_site
```

Expected: PASS.

- [ ] **Step 3: Run release invariant script**

Run:

```bash
bash scripts/check_release_invariants.sh
```

Expected: PASS with exit code 0 and no output.

- [ ] **Step 4: Check tracked build and macOS files**

Run:

```bash
git ls-files -- site 'site/**'
git ls-files -- .DS_Store ':(glob)**/.DS_Store'
```

Expected: both commands print no files.

- [ ] **Step 5: Check diff quality**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; status only shows intended source, workflow, script, template, and plan changes.

- [ ] **Step 6: Commit implementation**

Run:

```bash
git add .github/workflows/ci.yml push.sh mkdocs.yml overrides/main.html scripts/check_release_invariants.sh docs/superpowers/plans/2026-05-11-mkdocs-performance-stability.md docs
git commit -m "chore: harden mkdocs release checks"
```
