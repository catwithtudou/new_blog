# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog powered by MkDocs Material. The site is organized into multiple content categories including programming languages (Golang, Rust), algorithms, OS, architecture, middleware, and personal blog posts. The site uses custom theming with a featured home page and includes a blog section with monthly reviews and technical content.

## Build and Development Commands

### Build the site
```bash
mkdocs build
```

### Serve locally for development
```bash
mkdocs serve
```

### Deploy to GitHub Pages
The site automatically deploys via GitHub Actions on push to main/master branch. Manual deployment:
```bash
mkdocs gh-deploy --force
```

### Publishing workflow (via push.sh)
The repository includes a `push.sh` script that handles the complete publish workflow:
```bash
./push.sh "commit message" [branch]
```
This script:
1. Stages all changes
2. Creates a commit with the provided message
3. Builds the site with `mkdocs build`
4. Creates a second commit with the build output (message appended with "(update the mkdocs build)")
5. Pushes to the specified branch (defaults to main)

## Architecture and Structure

### Content Organization
- **docs/**: Main content directory containing all markdown files
  - **blog/**: Blog section with posts organized by date
    - **posts/**: Individual blog posts (monthly reviews and technical content)
    - `index.md`, `me.md`, `tags.md`: Blog metadata and navigation
  - **language/**: Programming language notes (Golang, Rust)
  - **algorithms/**: Algorithm notes, LLM resources, books
  - **os/**: Operating systems content (MIT 6.S081 notes)
  - **architecture/**: Architecture-related content
  - **middleware/**, **network/**, **ds/**, **project/**, **common/**: Additional content categories
  - `index.md`: Homepage using custom `home.html` template

### Theme Customization
- **overrides/**: Custom MkDocs Material theme overrides
  - `home.html`: Custom homepage template with animated typing effect and hero image
  - **assets/**: Custom logos and images
  - **partials/**: Template partial overrides

### Configuration
- **mkdocs.yml**: Main configuration file defining:
  - Site metadata and repository links
  - Material theme configuration with light/dark mode
  - Navigation structure organized by category
  - Plugins: blog, tags, search, include_dir_to_nav, git-revision-date-localized
  - Extensive markdown extensions (pymdownx suite, tables, admonitions, etc.)
  - Google Analytics integration

### Deployment
- **.github/workflows/ci.yml**: GitHub Actions workflow that:
  - Triggers on push to main/master
  - Sets up Python 3.x environment
  - Installs required packages: mkdocs-material, mkdocs-git-revision-date-localized-plugin, mkdocs-include-dir-to-nav
  - Runs `mkdocs gh-deploy --force` to publish to GitHub Pages

### Key Plugins and Features
- **blog plugin**: Manages blog posts with categories, archives, and pagination
- **include_dir_to_nav**: Automatically generates navigation from directory structure
- **git-revision-date-localized**: Shows creation and modification dates (Asia/Shanghai timezone)
- **pymdownx extensions**: Enables code highlighting, tabs, admonitions, math support, emoji, and more
- **Custom home template**: Features animated typing text and hero image background

## Content Guidelines

### Blog Posts
- Located in `docs/blog/posts/`
- Use frontmatter with date and categories
- Include `<!-- more -->` tag to define excerpt
- Example structure:
```markdown
---
date: 2024-03-03
categories:
  - monthly review
---

# Title

Brief intro

<!-- more -->

Full content...
```

### Directory Structure
- Each major category (language, algorithms, os, etc.) has its own subdirectory
- README.md files serve as index pages for each section
- The `include_dir_to_nav` plugin automatically generates navigation from folder structure
- Use `inbox/` subdirectories for work-in-progress content

## Python Dependencies

Required packages (installed via pip):
- mkdocs-material
- mkdocs-git-revision-date-localized-plugin
- mkdocs-include-dir-to-nav

## Git Workflow

The main branch is `main`. The repository follows a straightforward workflow:
1. Make content changes in `docs/`
2. Optionally test locally with `mkdocs serve`
3. Use `./push.sh "message"` for publishing, or commit and push manually
4. GitHub Actions automatically builds and deploys to GitHub Pages

## Notes

- The site is published at: https://zhengyua.cn/new_blog/
- The blog uses custom CSS and JavaScript for the home page animation
- Navigation is automatically generated from the directory structure
- All markdown files support extensive formatting via pymdownx extensions including code tabs, admonitions, and math rendering
