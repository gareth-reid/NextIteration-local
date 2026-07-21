/* ==========================================================================
   Next Iteration — AI for Locals
   Theme toggle, analytics event hooks, and contact-form handling.
   Progressive enhancement: the page is fully usable with JS disabled.
   ========================================================================== */
(function () {
  "use strict";

  /* ---- Contact details --------------------------------------------------- */
  /* The form posts to the Formspree endpoint in the <form action="…"> attribute. */
  var CONTACT_EMAIL = "info@next-iteration.com";

  /* ---- Analytics shim ----------------------------------------------------
     Fires a named event to whichever analytics provider is installed
     (GA4 / Plausible / Fathom) or logs it in dev. Wire your provider once
     and every hook below starts reporting automatically. */
  function track(eventName, props) {
    props = props || {};
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, props);
      }
      if (typeof window.plausible === "function") {
        window.plausible(eventName, { props: props });
      }
      if (typeof window.fathom === "object" && window.fathom && typeof window.fathom.trackEvent === "function") {
        window.fathom.trackEvent(eventName);
      }
      (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: eventName }, props));
    } catch (e) { /* never let analytics break the page */ }
  }
  window.aiLocalsTrack = track;

  /* ---- Theme toggle ------------------------------------------------------ */
  var STORAGE_KEY = "ni-theme";
  var root = document.documentElement;

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set === "dark" || set === "light") return set;
    return systemPrefersDark() ? "dark" : "light";
  }
  function applyTheme(mode) {
    root.setAttribute("data-theme", mode);
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      var isDark = mode === "dark";
      btn.setAttribute("aria-pressed", String(isDark));
      var icon = btn.querySelector(".icon");
      var label = btn.querySelector(".label");
      if (icon) icon.textContent = isDark ? "☀" : "☾";
      if (label) label.textContent = isDark ? "Light" : "Dark";
      btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    }
  }

  // Restore stored preference (if any) on load.
  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") applyTheme(stored);
    else applyTheme(currentTheme());
  } catch (e) { applyTheme(currentTheme()); }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      applyTheme(currentTheme());
      btn.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
        track("theme_toggle", { mode: next });
      });
    }

    /* ---- Page view ------------------------------------------------------- */
    track("ai_locals_page_view", { path: location.pathname });

    /* ---- Quick-link clicks ---------------------------------------------- */
    document.querySelectorAll("[data-quick-link]").forEach(function (a) {
      a.addEventListener("click", function () {
        track("ai_locals_quick_link_click", { target: a.getAttribute("href") });
      });
    });

    /* ---- Primary CTA clicks --------------------------------------------- */
    document.querySelectorAll("[data-cta='book-review']").forEach(function (a) {
      a.addEventListener("click", function () {
        track("book_free_ai_review_click", { location: a.getAttribute("data-cta-loc") || "unknown" });
      });
    });

    /* ---- Email link clicks ---------------------------------------------- */
    document.querySelectorAll("[data-email-link]").forEach(function (a) {
      a.addEventListener("click", function () { track("ai_locals_email_click"); });
    });

    /* ---- Interest select (business vs personal) ------------------------- */
    var interest = document.getElementById("interest");
    if (interest) {
      interest.addEventListener("change", function () {
        var v = interest.value;
        if (v === "personal") track("ai_locals_personal_interest", { value: v });
        else if (v) track("ai_locals_business_interest", { value: v });
      });
    }

    /* ---- Contact form ---------------------------------------------------
       Submits to Formspree via fetch so the visitor stays on the page and
       sees the confirmation message. If the request fails (offline, endpoint
       error), we fall back to opening a pre-filled email. Without JS, the
       form still works via its native action/method attributes. */
    var form = document.getElementById("contact-form");
    var status = document.getElementById("form-status");

    function setStatus(html, kind) {
      if (!status) return;
      status.innerHTML = html;
      status.className = "form-status show " + (kind || "ok");
      status.setAttribute("role", "status");
      status.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function mailtoFallback(data, name) {
      var lines = [
        "Name: " + name,
        "Email: " + (data.get("email") || "").toString().trim(),
        "Business name: " + ((data.get("business") || "").toString().trim() || "-"),
        "Location: " + ((data.get("location") || "").toString().trim() || "-"),
        "Interested in: " + ((data.get("interest") || "").toString().trim() || "-"),
        "Preferred contact: " + ((data.get("contact_method") || "").toString().trim() || "-"),
        "", "Message:", (data.get("message") || "").toString().trim()
      ];
      return "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent("AI for Locals enquiry — " + name) +
        "&body=" + encodeURIComponent(lines.join("\n"));
    }

    if (form) {
      var submitBtn = form.querySelector("[type='submit']");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = new FormData(form);
        var name = (data.get("name") || "").toString().trim();
        var email = (data.get("email") || "").toString().trim();
        var message = (data.get("message") || "").toString().trim();

        if (!name || !email || !message) {
          setStatus("Please add your name, email and a short message so I can get back to you.", "ok");
          return;
        }

        track("ai_locals_contact_submit", { interest: (data.get("interest") || "").toString() });
        if (submitBtn) { submitBtn.disabled = true; }
        setStatus("Sending your message…", "ok");

        fetch(form.action, {
          method: "POST",
          body: data,
          headers: { "Accept": "application/json" }
        }).then(function (res) {
          if (res.ok) {
            setStatus("Thanks — I’ve received your message. I’ll review what you’ve sent and get back to you personally.", "ok");
            form.reset();
          } else {
            return res.json().then(function (body) {
              var msg = (body && body.errors && body.errors.map(function (x) { return x.message; }).join(", ")) ||
                "Something went wrong sending the form.";
              throw new Error(msg);
            });
          }
        }).catch(function () {
          // Network/endpoint problem — offer the email fallback so nothing is lost.
          setStatus("I couldn’t send that automatically. You can email me directly at " +
            "<a data-email-link href=\"mailto:" + CONTACT_EMAIL + "\">" + CONTACT_EMAIL + "</a>" +
            " — I’ll open a pre-filled message for you now.", "ok");
          window.location.href = mailtoFallback(data, name);
        }).then(function () {
          if (submitBtn) { submitBtn.disabled = false; }
        });
      });
    }
  });
})();
