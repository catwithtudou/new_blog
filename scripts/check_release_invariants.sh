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
