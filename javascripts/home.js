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

    typedTextSpan.textContent = "";

    function type() {
      if (charIndex < text.length) {
        typedTextSpan.textContent += text.charAt(charIndex);
        charIndex += 1;
        window.setTimeout(type, typingDelay);
        return;
      }

      window.setTimeout(erase, newTextDelay);
    }

    function erase() {
      if (charIndex > 0) {
        typedTextSpan.textContent = text.substring(0, charIndex - 1);
        charIndex -= 1;
        window.setTimeout(erase, erasingDelay);
        return;
      }

      window.setTimeout(type, typingDelay);
    }

    window.setTimeout(type, newTextDelay + 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startTyping);
  } else {
    startTyping();
  }
})();
