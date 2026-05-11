# MkDocs Performance And Stability Conservative Enhancement Design

Date: 2026-05-11

## Context

This blog is built with MkDocs Material and deployed by GitHub Actions to GitHub Pages. The previous optimization removed tracked `site/` output, pinned Python dependencies, fixed strict build warnings, compressed the largest local images, and kept `mkdocs build --strict` passing.

The current generated site is about 33 MB. The largest output groups are HTML, `search/search_index.json`, local images, Material source maps, a PDF, and Chinese search assets. For this round, the selected scope is conservative: improve access performance and deployment stability without changing the MkDocs framework, public URLs, navigation, theme, search behavior, or normal writing workflow.

## Goals

- Make the publish pipeline fail early when the MkDocs source is invalid.
- Keep the repository clean by preventing tracked generated files from returning.
- Reduce unnecessary JavaScript loading on pages that do not need math rendering.
- Preserve existing MkDocs Material features, including blog, tags, navigation, and search.
- Keep external link availability out of the push-time release gate.

## Non-Goals

- Do not replace MkDocs, MkDocs Material, or GitHub Pages deployment.
- Do not rename article slugs, categories, or existing URLs.
- Do not tune or replace the built-in search index in this round.
- Do not perform broad content cleanup, remote image migration, or article splitting.
- Do not redesign the homepage or article reading experience.
- Do not block deploys on external links, because external sites can be slow, unavailable, or return bot-specific errors.

## Design

### CI And Deployment Stability

The GitHub Actions workflow should remain the single deployment path for the source branch. It should keep the existing trigger on pushes to `main` and `master`, use `requirements.txt`, and continue deploying with `mkdocs gh-deploy --force`.

The workflow should add a deploy-level concurrency group based on workflow name and branch ref. `cancel-in-progress: true` should be enabled so that a newer push cancels an older in-flight deploy for the same branch.

The deployment job should install dependencies, run a strict build to a temporary directory, run repository hygiene checks, then deploy. The strict build should use an explicit temporary `--site-dir` so it does not create a local `site/` directory inside the repository during CI validation.

Repository hygiene checks should verify:

- No tracked files exist under `site/`.
- No tracked `.DS_Store` files exist anywhere in the repository.

These checks should inspect Git-tracked files only. Local ignored files should not fail the workflow.

### Local Publishing Workflow

`push.sh` should stay simple and compatible with the new source-only workflow. It should continue to run `mkdocs build --strict` before committing and pushing. It should not create a second build-output commit and should not stage generated `site/` files.

The script can reuse the same tracked-file hygiene checks as CI if the implementation stays small. If adding those checks makes the script harder to use, CI remains the authoritative gate.

### MathJax Loading

MathJax is currently configured as a global script through `extra_javascript`, so every page can load MathJax even when it has no formulas. This should be changed to opt-in page metadata:

```yaml
---
math: true
---
```

Only pages with `math: true` should include the local MathJax configuration script and the MathJax CDN script. Pages without this metadata should not contain the MathJax CDN URL in generated HTML.

Implementation should use MkDocs Material's template override mechanism rather than a separate JavaScript loader. The preferred shape is:

- Remove the MathJax entries from global `extra_javascript`.
- Add a small Material-compatible template override that checks `page.meta.math`.
- Inject `javascripts/mathjax.js` and the MathJax CDN script only when the page opts in.

This preserves existing Markdown authoring and keeps math support available where needed. The implementation should identify any existing pages that use math syntax and add `math: true` only to those pages.

### Internal Link Checking

Internal link validation should continue to rely on `mkdocs build --strict`. That keeps invalid internal references and MkDocs warnings as release blockers.

External links should not be checked on every push. A separate scheduled or manual external-link checker could be added later, but it is outside this conservative round.

### Search

The built-in Material search should remain unchanged. The generated `search_index.json` is large, but changing search indexing or language settings can affect Chinese search quality. This round should leave search behavior intact.

## Validation Plan

Run these checks locally after implementation:

```bash
mkdocs build --strict --site-dir /tmp/new_blog_mkdocs_strict
mkdocs build --site-dir /tmp/new_blog_mkdocs_site
git ls-files -- site 'site/**'
git ls-files -- .DS_Store ':(glob)**/.DS_Store'
```

The tracked-file commands should return no files.

For MathJax, inspect generated HTML:

- A normal page without `math: true` should not include `cdn.jsdelivr.net/npm/mathjax`.
- A page with `math: true` should include the MathJax configuration and CDN script.
- Any page that previously rendered formulas should still render formulas.

In CI, the required checks are:

- Dependency install from `requirements.txt`.
- Strict MkDocs build to a temporary site directory.
- Tracked `site/` hygiene check.
- Tracked `.DS_Store` hygiene check.
- Deployment only after the checks pass.

## Risks And Mitigations

- Conditional MathJax loading may miss a page with formulas if it lacks `math: true`. Mitigation: search Markdown for common math delimiters during implementation and add metadata only where needed.
- Template overrides can become brittle if they duplicate too much of the theme. Mitigation: override the smallest stable Material block needed for script injection.
- CI may run `mkdocs` twice: once for strict validation and once inside `mkdocs gh-deploy`. This is acceptable for this repository size and keeps deployment behavior conventional.
- GitHub Actions concurrency cancels older runs for the same branch. This is desired for push-based deployment because the latest commit should win.
