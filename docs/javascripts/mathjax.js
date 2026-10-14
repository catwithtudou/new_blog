window.MathJax = {
    tex: {
        inlineMath: [["\\(", "\\)"]],
        displayMath: [["\\[", "\\]"]],
        processEscapes: true,
        processEnvironments: true
    },
    options: {
        ignoreHtmlClass: ".*|",
        processHtmlClass: "arithmatex"
    }
};

// Instant navigation swaps pages without reloading, so check every page and
// fetch MathJax the first time a page with formulas shows up.
let mathjaxRequested = false;

document$.subscribe(() => {
    if (!document.querySelector(".arithmatex")) {
        return;
    }

    // MathJax replaces window.MathJax with its API once it has started up.
    if (MathJax.typesetPromise) {
        MathJax.startup.output.clearCache();
        MathJax.typesetClear();
        MathJax.texReset();
        MathJax.typesetPromise();
        return;
    }

    // MathJax typesets the current page on its own once loaded.
    if (!mathjaxRequested) {
        mathjaxRequested = true;
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
        script.async = true;
        document.head.appendChild(script);
    }
});
