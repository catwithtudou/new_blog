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

grep -q 'mkdocs-rss-plugin==1.19.0' requirements.txt \
  || fail "requirements.txt is missing pinned mkdocs-rss-plugin"

grep -q 'mkdocs-document-dates==3.8.6' requirements.txt \
  || fail "requirements.txt is missing pinned mkdocs-document-dates"

grep -q '^[[:space:]]*- rss:' mkdocs.yml \
  || fail "mkdocs.yml is missing rss plugin"

grep -q '^[[:space:]]*- document-dates:' mkdocs.yml \
  || fail "mkdocs.yml is missing document-dates plugin"

grep -q 'feed_json_updated.json' mkdocs.yml \
  || fail "mkdocs.yml is missing updated JSON feed output"

grep -q 'length: 100' mkdocs.yml \
  || fail "rss updated feed does not expose enough entries for expansion"

grep -q 'match_path:' mkdocs.yml \
  || fail "mkdocs.yml is missing RSS page filtering"

grep -q 'recently-updated:' mkdocs.yml \
  || fail "document-dates recently updated module is not enabled"

grep -q 'limit: 100' mkdocs.yml \
  || fail "document-dates recent updates list does not expose enough entries"

grep -q 'blog/archive/\*' mkdocs.yml \
  || fail "document-dates recent updates list does not exclude blog archive pages"

grep -q 'updates.md' mkdocs.yml \
  || fail "updates page is missing from navigation"

grep -q 'javascripts/updates\.js?v=' mkdocs.yml \
  || fail "updates page JavaScript is missing asset cache busting"

grep -q '^[[:space:]]*- 🆕Recently Updated: updates\.md' mkdocs.yml \
  || fail "updates page is not a top-level navigation entry"

test -f docs/updates.md \
  || fail "docs/updates.md is missing"

grep -q '^# 🆕Recently Updated$' docs/updates.md \
  || fail "updates page title is missing emoji"

grep -q 'updates-note' docs/updates.md \
  || fail "updates page is missing update policy note"

grep -q 'updates-toolbar' docs/updates.md \
  || fail "updates feed links are not placed in the compact toolbar"

grep -q '^<!-- RECENTLY_UPDATED_DOCS -->$' docs/updates.md \
  || fail "updates page does not use document-dates recent updates placeholder"

grep -q 'data-document-dates-updates' docs/updates.md \
  || fail "updates page is missing document-dates enhancement root"

grep -q 'data-page-size="20"' docs/updates.md \
  || fail "updates page is missing expandable list page size"

if grep -q 'data-updates-list' docs/updates.md; then
  fail "updates page still uses the old client-side feed list root"
fi

test -f docs/javascripts/updates.js \
  || fail "updates page JavaScript is missing"

grep -q 'enhanceDocumentDatesUpdates' docs/javascripts/updates.js \
  || fail "updates page JavaScript is missing document-dates enhancement"

grep -q 'updates-more' docs/javascripts/updates.js \
  || fail "updates page JavaScript is missing show-more rendering"

grep -q 'formatMinuteDate' docs/javascripts/updates.js \
  || fail "updates page JavaScript is missing minute-level time formatting"

grep -q 'updates-card-hidden' docs/javascripts/updates.js \
  || fail "updates page JavaScript is missing hidden-card pagination"

grep -q 'layout-list-btn' docs/javascripts/updates.js \
  || fail "updates page JavaScript does not bind document-dates layout controls"

test -f docs/stylesheets/updates.css \
  || fail "updates page stylesheet is missing"

grep -q '^\.updates-document-dates' docs/stylesheets/updates.css \
  || fail "updates page stylesheet is missing document-dates card styles"

grep -q '^\.updates-note' docs/stylesheets/updates.css \
  || fail "updates page stylesheet is missing policy note styles"

grep -q '^\.updates-toolbar' docs/stylesheets/updates.css \
  || fail "updates page stylesheet is missing compact toolbar styles"

grep -q '^\.updates-more' docs/stylesheets/updates.css \
  || fail "updates page stylesheet is missing show-more styles"

grep -q '^\.updates-card-hidden' docs/stylesheets/updates.css \
  || fail "updates page stylesheet is missing hidden-card pagination styles"

grep -q 'Migration of old blog posts' README.md \
  && grep -q '\[x\] Migration of old blog posts' README.md \
  || fail "README old blog migration TODO is not marked complete"
