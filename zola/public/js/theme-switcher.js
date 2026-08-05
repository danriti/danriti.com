/**
 * Tapestry theme switcher — light ⇄ dark only.
 *
 * Scope (CONSTITUTION.md §2): this is narrower than terminus's own
 * `js/theme-switcher.js`, which cycles through 13 independently named colour
 * schemes (`color_scheme`). Tapestry's switcher does exactly one thing: it
 * toggles between light mode and dark mode. Colour *identity* (which hues a
 * light/dark mode actually uses) is owned entirely by the selected
 * presentation style group/variant (`data-style` / `data-variant` attributes
 * on <body>, set in templates/base.html) — this script never touches those.
 *
 * Attribute contract for the SCSS/design-tokens task:
 *   - This script sets `data-color-mode="light"` or `data-color-mode="dark"`
 *     on the root <html> element.
 *   - CSS should therefore scope dark-mode token overrides under
 *     `html[data-color-mode="dark"] { ... }` (and light-mode overrides, if
 *     any are needed explicitly, under `html[data-color-mode="light"]`).
 *   - Preference order: localStorage["tapestry-color-mode::<namespace>"]
 *     (explicit user choice) > system `prefers-color-scheme` > "light". The
 *     namespace comes from the `data-storage-ns` attribute base.html sets on
 *     <html> (extra.site_id, falling back to config.base_url) so that two
 *     Tapestry sites sharing one browser origin (e.g. two GitHub Pages
 *     project sites under the same username.github.io host) don't clobber
 *     each other's stored preference.
 *   - No-JS graceful degradation: this attribute is simply absent if JS is
 *     disabled or fails to load. CSS MUST NOT rely on `data-color-mode`
 *     alone to establish the default appearance — the default/no-JS case is
 *     handled purely via the `prefers-color-scheme` media query in CSS, with
 *     `[data-color-mode="light"]` / `[data-color-mode="dark"]` selectors
 *     only needed to let a user's explicit choice *override* that media
 *     query's result.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var STORAGE_KEY = "tapestry-color-mode::" + (root.getAttribute("data-storage-ns") || "");

  function getSystemPreference() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function getStoredMode() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch (e) {
      // localStorage unavailable (e.g. privacy mode) — fall through.
    }
    return null;
  }

  function applyMode(mode) {
    root.setAttribute("data-color-mode", mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      // Ignore storage failures; the mode still applies for this page view.
    }
  }

  function currentMode() {
    return root.getAttribute("data-color-mode") || getStoredMode() || getSystemPreference();
  }

  function toggleMode() {
    var next = currentMode() === "dark" ? "light" : "dark";
    applyMode(next);
    updateToggleLabel(next);
  }

  function updateToggleLabel(mode) {
    var button = document.querySelector("[data-theme-toggle]");
    if (!button) {
      return;
    }
    var label = mode === "dark" ? "Switch to light mode" : "Switch to dark mode";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
  }

  function init() {
    // Apply stored preference (if any) immediately; otherwise leave the
    // attribute unset so CSS's `prefers-color-scheme` media query keeps
    // controlling the default appearance.
    var stored = getStoredMode();
    if (stored) {
      root.setAttribute("data-color-mode", stored);
    }

    var button = document.querySelector("[data-theme-toggle]");
    if (button) {
      button.addEventListener("click", toggleMode);
    }

    updateToggleLabel(currentMode());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
