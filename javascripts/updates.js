(function () {
  var scriptSrc = document.currentScript && document.currentScript.src;

  function fallbackFeedUrl() {
    var path = window.location.pathname;

    if (path.charAt(path.length - 1) !== "/") {
      path = path.replace(/[^/]*$/, "");
    }

    return window.location.protocol + "//" + window.location.host
      + path.replace(/\/[^/]+\/?$/, "/")
      + "feed_json_updated.json";
  }

  function getFeedUrl() {
    if (!scriptSrc) {
      return fallbackFeedUrl();
    }

    return scriptSrc.replace(/javascripts\/updates\.js(?:\?.*)?$/, "feed_json_updated.json");
  }

  function cacheBustUrl(url) {
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "v=" + Date.now();
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }

    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit", minute: "2-digit",
      hour12: false
    });
  }

  function itemDate(item) {
    return item.date_modified || item.date_published || item.date_created || "";
  }

  function trimLeadingTitle(text, title) {
    var normalizedTitle = (title || "").replace(/\s+/g, " ").trim();

    if (!normalizedTitle || text.indexOf(normalizedTitle) !== 0) {
      return text;
    }

    return text.slice(normalizedTitle.length).replace(/^[\s:：\-—]+/, "").trim();
  }

  function cleanSummaryText(text) {
    return text
      .replace(/!\[[^\]]*]\([^)]+\)/g, "")
      .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function itemSummary(item) {
    var source = item.content_html || item.summary || item.content_text || "";
    var text = source;
    var maxLength = 150;

    if (!source) {
      return "";
    }

    if (item.content_html) {
      var container = document.createElement("div");
      var heading = null;

      container.innerHTML = item.content_html;
      heading = container.querySelector("h1");

      if (heading && heading.parentNode) {
        heading.parentNode.removeChild(heading);
      }

      text = container.textContent || container.innerText || "";
    }

    text = cleanSummaryText(text);
    text = trimLeadingTitle(text, item.title);

    if (text.length <= maxLength) {
      return text;
    }

    return text.slice(0, maxLength).replace(/[，。,.、\s]+$/, "") + "...";
  }

  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function fetchJson(url) {
    if (typeof window.fetch === "function") {
      return window.fetch(url, {
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "Cache-Control": "no-cache"
        }
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("feed request failed");
          }

          return response.json();
        });
    }

    return new Promise(function (resolve, reject) {
      var request = new XMLHttpRequest();

      request.open("GET", url, true);
      request.setRequestHeader("Cache-Control", "no-cache");
      request.onreadystatechange = function () {
        if (request.readyState !== 4) {
          return;
        }

        if (request.status < 200 || request.status >= 300) {
          reject(new Error("feed request failed"));
          return;
        }

        try {
          resolve(JSON.parse(request.responseText));
        } catch (error) {
          reject(error);
        }
      };
      request.onerror = function () {
        reject(new Error("feed request failed"));
      };
      request.send();
    });
  }

  function isContentItem(item) {
    var url = item.url || item.id || "";
    var title = (item.title || "").trim();

    if (!url || !title) {
      return false;
    }

    return !/\/(?:updates|blog\/(?:archive|category|page))(?:\/|$)/.test(url);
  }

  function normalizeItems(items) {
    var seen = new Set();

    return items.filter(function (item) {
      var url = item.url || item.id || "";

      if (!isContentItem(item) || seen.has(url)) {
        return false;
      }

      seen.add(url);
      return true;
    });
  }

  function renderError(root) {
    root.innerHTML = '<p class="updates-status">Unable to load recent updates.</p>';
  }

  function createUpdateEntry(item) {
    var date = itemDate(item);
    var entry = document.createElement("li");
    var link = document.createElement("a");
    var summary = document.createElement("p");
    var time = document.createElement("time");

    link.href = item.url || item.id || "#";
    link.textContent = item.title || link.href;
    summary.className = "updates-summary";
    summary.textContent = itemSummary(item);
    time.dateTime = date;
    time.textContent = formatDate(date);

    entry.appendChild(link);

    if (summary.textContent) {
      entry.appendChild(summary);
    }

    if (date) {
      entry.appendChild(time);
    }

    return entry;
  }

  function renderUpdates(root, items) {
    var pageSize = parseInt(root.getAttribute("data-page-size") || root.getAttribute("data-count") || "20", 10);
    var step = isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
    var allItems = normalizeItems(items);
    var visibleCount = Math.min(step, allItems.length);

    if (!allItems.length) {
      root.innerHTML = '<p class="updates-status">No recent updates found.</p>';
      return;
    }

    var list = document.createElement("ol");
    var actions = document.createElement("div");
    var count = document.createElement("p");
    var more = document.createElement("button");

    list.className = "updates-list";
    actions.className = "updates-actions";
    count.className = "updates-count";
    more.className = "updates-more";
    more.type = "button";
    more.textContent = "Show more updates";

    function renderVisibleItems() {
      clearElement(list);

      allItems.slice(0, visibleCount).forEach(function (item) {
        list.appendChild(createUpdateEntry(item));
      });

      count.textContent = "Showing " + visibleCount + " of " + allItems.length + " updates";
      more.hidden = visibleCount >= allItems.length;
    }

    more.addEventListener("click", function () {
      visibleCount = Math.min(visibleCount + step, allItems.length);
      renderVisibleItems();
    });

    clearElement(root);
    actions.appendChild(count);
    actions.appendChild(more);
    root.appendChild(list);
    root.appendChild(actions);
    renderVisibleItems();
  }

  function initUpdates() {
    var root = document.querySelector("[data-updates-list]");

    if (!root) {
      return;
    }

    fetchJson(cacheBustUrl(getFeedUrl()))
      .then(function (feed) {
        renderUpdates(root, Array.isArray(feed.items) ? feed.items : []);
      })
      .catch(function () {
        renderError(root);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUpdates);
  } else {
    initUpdates();
  }
})();
