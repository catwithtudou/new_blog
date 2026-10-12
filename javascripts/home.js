(function () {
  function startTyping() {
    var typedTextSpan = document.getElementById("typed-text");

    if (!typedTextSpan) {
      return;
    }

    var text = typedTextSpan.getAttribute("data-text") || "";
    var typingDelay = 200;
    var erasingDelay = 100;
    var newTextDelay = 2000;
    var charIndex = 0;
    var timerId;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function type() {
      if (charIndex < text.length) {
        typedTextSpan.textContent += text.charAt(charIndex);
        charIndex += 1;
        timerId = window.setTimeout(type, typingDelay);
        return;
      }

      timerId = window.setTimeout(erase, newTextDelay);
    }

    function erase() {
      if (charIndex > 0) {
        typedTextSpan.textContent = text.substring(0, charIndex - 1);
        charIndex -= 1;
        timerId = window.setTimeout(erase, erasingDelay);
        return;
      }

      timerId = window.setTimeout(type, typingDelay);
    }

    function resetAnimation() {
      window.clearTimeout(timerId);
      charIndex = 0;
      typedTextSpan.textContent = reducedMotion.matches ? text : "";

      if (!reducedMotion.matches) {
        timerId = window.setTimeout(type, newTextDelay + 250);
      }
    }

    reducedMotion.addEventListener("change", resetAnimation);
    resetAnimation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startTyping);
  } else {
    startTyping();
  }
})();
