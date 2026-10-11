#!/usr/bin/env bash
set -euo pipefail

echo "Ready to execute script"

# Default git commit message.
msg="update: default by script"

# Default branch.
branch="main"

if [ -n "${1:-}" ]; then
  msg=$1
fi

if [ -n "${2:-}" ]; then
  branch=$2
fi

echo "git commit message:[$msg]"
echo "git branch:[$branch]"
echo "The site build output is ignored; GitHub Actions deploys the site after push."

read -r -p "Press Enter to build, commit, and push"

mkdocs_cmd="mkdocs"
if [ -x ".venv/bin/mkdocs" ]; then
  mkdocs_cmd=".venv/bin/mkdocs"
fi

echo "Pre-commit check: new, uncommitted pages may report missing Git dates; these will be checked again after commit."
# Keep the build timezone aligned with RSS date_from_meta.default_timezone.
TZ=Asia/Shanghai "$mkdocs_cmd" build
bash scripts/check_release_invariants.sh

git add -A
git status --short

if git diff --cached --quiet; then
  echo "No staged changes to commit"
else
  git commit -m "$msg"
fi

echo "Post-commit strict check: warnings must be resolved before pushing."
TZ=Asia/Shanghai "$mkdocs_cmd" build --strict
git push origin "$branch"
