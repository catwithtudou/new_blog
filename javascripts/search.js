document.addEventListener("reset", function (event) {
  var query = event.target.querySelector('[data-md-component="search-query"]');
  if (!query) return;

  // Material 9.6.2 reads queries on keyup; wait for the native form reset first.
  window.setTimeout(function () {
    if (!event.defaultPrevented) {
      query.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    }
  }, 0);
});
