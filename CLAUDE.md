# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal blog and notes site (MkDocs Material, mostly Chinese content), published at https://zhengyua.cn/new_blog/. `AGENTS.md` holds the same guidance for Codex, so when you change one file, update the other too.

## Commands

Use the project venv and the Shanghai timezone. CI runs with `TZ=Asia/Shanghai`, and the RSS plugin's `default_timezone` uses the same zone. Under a different zone, feed dates come out with a different offset.

```bash
pip install -r requirements.txt                                     # versions are pinned
TZ=Asia/Shanghai .venv/bin/mkdocs serve --dev-addr 127.0.0.1:8000   # preview at http://127.0.0.1:8000/new_blog/
TZ=Asia/Shanghai .venv/bin/mkdocs build --strict                    # CI gate; any warning fails
bash scripts/check_release_invariants.sh                            # grep-based config/asset invariants
node --test scripts/home_animation.test.cjs                         # homepage typing-animation tests
```

A non-strict build may warn about missing Git dates for new, uncommitted pages. Those warnings go away once the pages are committed.

## Publishing

On a push to `main`, `.github/workflows/ci.yml` runs the animation tests, a strict build and the invariants script, then `mkdocs gh-deploy --force`. `site/` is build output. It is gitignored, and the invariants script fails if any file under it is tracked.

`./push.sh "msg" [branch]` does a build, runs the invariants script, `git add -A`, commits, runs a strict build and pushes. It waits for Enter on stdin and stages everything. Don't run it non-interactively. Stage specific files instead and check the staged set before committing.

`context/` holds local handoff notes and is gitignored. Never commit it or `git add -f` it, and keep it out of `docs/`.

## How the site fits together

- **Navigation**: the top-level tabs are listed under `nav` in `mkdocs.yml`, each pointing at a directory under `docs/`. `include_dir_to_nav` expands each directory automatically (sorted, file name as title), so new files show up in the nav without editing `mkdocs.yml`. A section's landing page is its `index.md` or `README.md` (`navigation.indexes`).
- **Blog**: posts live in `docs/blog/posts/` and are named `YYYYMMDD_slug.md`. Frontmatter has `date` and `categories`, with `tags` optional. `post_excerpt: required` means a post without `<!-- more -->` breaks the build.
- **`inbox/` directories** hold drafts and copies of posts. They are excluded from the RSS feeds and the Recently Updated page by patterns in `mkdocs.yml`. Inbox copies of published blog posts carry `search: {exclude: true}` frontmatter to keep duplicates out of search. Add the same frontmatter whenever you copy a post into an inbox.
- **Excluded docs**: `exclude_docs` keeps `docs/superpowers/` (design specs and plans) out of the build.
- **Math**: MathJax loads only on pages with `math: true` frontmatter (see `overrides/main.html` and `docs/javascripts/mathjax.js`).
- **Recently Updated** (`docs/updates.md`): the `document-dates` plugin renders the list into the `<!-- RECENTLY_UPDATED_DOCS -->` placeholder at build time. `docs/javascripts/updates.js` and `docs/stylesheets/updates.css` then add pagination, minute-level times and layout controls in the browser. The RSS and JSON feeds come from `mkdocs-rss-plugin`.
- **Release invariants**: `scripts/check_release_invariants.sh` checks for exact strings in `mkdocs.yml`, `docs/updates.md`, `updates.js`, `updates.css`, `requirements.txt`, `ci.yml` and `README.md`. If you rename or remove any of those strings, update the script in the same change.
- **Homepage**: `docs/index.md` uses `template: home.html` (`overrides/home.html`), with styles in `docs/stylesheets/home.css` and the typing animation in `docs/javascripts/home.js`, which respects `prefers-reduced-motion`. The animation test reads both `home.js` and the `typed-text` span in `home.html`, so keep the two in step.
- **Search clear fix**: `docs/javascripts/search.js` is a workaround for Material 9.6.2, which leaves stale results on screen after the search box is cleared. Check whether it is still needed after a theme upgrade.
- **Cache busting**: entries under `extra_javascript` and `extra_css` carry a `?v=YYYYMMDD` suffix. Bump it whenever you edit the file.

## Scope

Keep changes limited to what was asked. An unrequested redesign of the homepage and topic landing pages was rolled back (`2dfd0e3a`). Don't add featured posts or reading guides, and don't rearrange the homepage, layout or post content unless asked.
