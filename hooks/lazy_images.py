"""Defer off-screen images so long, image-heavy notes don't download every image on open."""

import re

# Matches the opening of an <img> tag that has no loading attribute yet. Markdown
# code blocks escape "<", so images shown as code are left alone.
_IMG_WITHOUT_LOADING = re.compile(r"<img(?![^>]*\bloading=)(?=[\s/>])")


def on_page_content(html, page, config, files):
    return _IMG_WITHOUT_LOADING.sub('<img loading="lazy"', html)
