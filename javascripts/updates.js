(function () {
  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatMinuteDate(value) {
    var date = new Date(value);

    if (!value || Number.isNaN(date.getTime())) {
      return value || "";
    }

    return date.getFullYear() + "年"
      + (date.getMonth() + 1) + "月"
      + date.getDate() + "日 "
      + pad(date.getHours()) + ":"
      + pad(date.getMinutes());
  }

  function readStoredLayout() {
    try {
      return window.localStorage.getItem("updates_document_dates_layout") || "grid";
    } catch (error) {
      return "grid";
    }
  }

  function writeStoredLayout(layout) {
    try {
      window.localStorage.setItem("updates_document_dates_layout", layout);
    } catch (error) {
      // localStorage can be unavailable in strict browser contexts.
    }
  }

  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function formatTimes(root) {
    root.querySelectorAll(".card-date").forEach(function (time) {
      var datetime = time.getAttribute("datetime");
      var formatted = formatMinuteDate(datetime);

      if (formatted) {
        time.textContent = formatted;
      }
    });
  }

  function enhanceTitleTooltips(root) {
    root.querySelectorAll(".card-title").forEach(function (title) {
      var text = title.textContent.replace(/\s+/g, " ").trim();
      var link = title.closest("a");

      if (!text) {
        return;
      }

      title.title = text;

      if (link) {
        link.title = text;
      }
    });
  }

  function bindLayoutControls(root, grid) {
    var switcher = root.querySelector(".article-layout-switcher");
    var listButton = switcher && switcher.querySelector(".layout-list-btn");
    var detailButton = switcher && switcher.querySelector(".layout-detail-btn");
    var gridButton = switcher && switcher.querySelector(".layout-grid-btn");

    if (!switcher || !listButton || !detailButton || !gridButton) {
      return;
    }

    function setLayout(layout) {
      grid.classList.toggle("is-list", layout === "list");
      grid.classList.toggle("is-detail", layout === "detail");
      listButton.classList.toggle("is-active", layout === "list");
      detailButton.classList.toggle("is-active", layout === "detail");
      gridButton.classList.toggle("is-active", layout === "grid");
      writeStoredLayout(layout);
    }

    listButton.type = "button";
    detailButton.type = "button";
    gridButton.type = "button";
    listButton.setAttribute("aria-label", "List view");
    detailButton.setAttribute("aria-label", "Detail view");
    gridButton.setAttribute("aria-label", "Grid view");

    listButton.addEventListener("click", function () {
      setLayout("list");
    });
    detailButton.addEventListener("click", function () {
      setLayout("detail");
    });
    gridButton.addEventListener("click", function () {
      setLayout("grid");
    });

    setLayout(readStoredLayout());
  }

  function paginateCards(root, grid) {
    var pageSize = parseInt(root.getAttribute("data-page-size") || "20", 10);
    var step = isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".article-card"));
    var visibleCount = Math.min(step, cards.length);
    var actions = document.createElement("div");
    var count = document.createElement("p");
    var more = document.createElement("button");

    if (!cards.length) {
      return;
    }

    actions.className = "updates-actions";
    count.className = "updates-count";
    more.className = "updates-more";
    more.type = "button";
    more.textContent = "Show more updates";

    function renderVisibleCards() {
      cards.forEach(function (card, index) {
        card.classList.toggle("updates-card-hidden", index >= visibleCount);
      });

      count.textContent = "Showing " + visibleCount + " of " + cards.length + " updates";
      more.hidden = visibleCount >= cards.length;
    }

    more.addEventListener("click", function () {
      visibleCount = Math.min(visibleCount + step, cards.length);
      renderVisibleCards();
    });

    clearElement(actions);
    actions.appendChild(count);
    actions.appendChild(more);
    root.appendChild(actions);
    renderVisibleCards();
  }

  function enhanceDocumentDatesUpdates(root) {
    var grid = root.querySelector(".article-grid");

    if (!grid || root.dataset.updatesEnhanced === "true") {
      return;
    }

    root.dataset.updatesEnhanced = "true";
    formatTimes(root);
    enhanceTitleTooltips(root);
    bindLayoutControls(root, grid);
    paginateCards(root, grid);
  }

  function initUpdates() {
    document.querySelectorAll("[data-document-dates-updates]").forEach(enhanceDocumentDatesUpdates);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUpdates);
  } else {
    initUpdates();
  }
})();
