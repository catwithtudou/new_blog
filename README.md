# My New Blog (The ideal blog)

> powered by [MkDocs](https://squidfunk.github.io/mkdocs-material/)


Expansion Todo:

- [x] Implement automatic mapping blog directory tree configuration about repo directory
- [x] code abbreviation
- [x] directory folding
- [x] Code Content Tab
- [x] the connection between blogs and topics
- [x] Migration of old blog posts
- [x] site analysis: Google Analytics
- [ ] site analysis: Baidu Tongji (optional)
- [x] Displays a dynamic list of document updates

## Homepage animation checks

After changing the homepage animation, run its standalone regression checks with Node.js 18 or later:

```bash
node --test scripts/home_animation.test.cjs
```

These checks cover reduced motion, background tabs, and the static title fallback. They do not run during MkDocs builds or publishing, and require no npm packages.
