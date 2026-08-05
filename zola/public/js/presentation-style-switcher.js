/**
 * Tapestry presentation style/variant switcher.
 *
 * Scope (CONSTITUTION.md §2, amendment 2026-JUL-05-002): this is the third
 * sanctioned JS exception, opt-in via `extra.presentation_style_switcher`
 * (default false). It lets a visitor override the site's configured
 * `data-style`/`data-variant` attributes on <body> at runtime, without a
 * page reload — every scholarly + creative + natural + precision + collective variant's CSS custom properties are already
 * keyed off those attributes (_variants.scss), so flipping them is enough
 * to repaint colours, fonts, spacing, etc. live.
 *
 * Font loading: all scholarly + creative + natural + precision + collective variant fonts are self-hosted as WOFF2 files
 * under themes/tapestry/static/fonts/<style>/<variant>/ and declared via
 * @font-face in the main stylesheet (CONSTITUTION.md §4). No CDN stylesheet
 * injection is needed — when a visitor switches variant the browser already
 * has every font available from the @font-face declarations in style.css.
 *
 * Palette display: templates/shortcodes/presentation_palette.html renders a
 * static, build-time snapshot of the style/variant name and its light/dark
 * swatch colours. This script carries its own copy of the same token table
 * (mirroring _variants.scss and that shortcode's light/dark maps) so it can
 * rewrite that snapshot's text and colours live too, via the
 * `presentation-palette*`/`data-palette-*` hooks that shortcode renders.
 * This is a deliberate three-way duplication (SCSS, Tera shortcode, here) —
 * see the design discussion recorded wherever this feature was requested;
 * kept in sync by hand.
 *
 * No-JS / switcher-disabled degradation: if this script doesn't run (JS
 * disabled, or `presentation_style_switcher` is false so the control and
 * this script tag aren't even rendered), the site simply stays on its
 * build-time-configured `extra.presentation_style`/`extra.presentation_variant`
 * — nothing here is required for the site to render or function correctly.
 */
(function () {
  "use strict";

  // Namespaced by `data-storage-ns` (base.html: extra.site_id, falling back
  // to config.base_url) so two Tapestry sites sharing one browser origin
  // (e.g. two GitHub Pages project sites under the same username.github.io
  // host) don't clobber each other's stored style/variant choice.
  var STORAGE_KEY =
    "tapestry-presentation-style::" +
    (document.documentElement.getAttribute("data-storage-ns") || "");

  // Mirrors themes/tapestry/sass/css/_variants.scss's $variants map and
  // templates/shortcodes/presentation_palette.html's light/dark maps.
  // Structure: PALETTE[style][variant][mode][token] -> hex.
  var PALETTE = {
    scholarly: {
      "classic-ivy": {
        light: { bg_primary: "#faf6ec", text_heading: "#14212c", accent_primary: "#7a2231", accent_secondary: "#a8823f" },
        dark: { bg_primary: "#14191f", text_heading: "#f5efe0", accent_primary: "#e0a5ad", accent_secondary: "#d1ab6c" }
      },
      "nordic-minimalist": {
        light: { bg_primary: "#f7f8f7", text_heading: "#14171b", accent_primary: "#2f5f8f", accent_secondary: "#4b6b4b" },
        dark: { bg_primary: "#14171b", text_heading: "#f4f5f5", accent_primary: "#8fb4de", accent_secondary: "#9dc09d" }
      },
      "dark-academia": {
        light: { bg_primary: "#efe6d8", text_heading: "#201712", accent_primary: "#6e2c33", accent_secondary: "#33502f" },
        dark: { bg_primary: "#1b1512", text_heading: "#f4ead9", accent_primary: "#c98089", accent_secondary: "#86ab82" }
      },
      "scientific-journal": {
        light: { bg_primary: "#ffffff", text_heading: "#0d1117", accent_primary: "#1449a6", accent_secondary: "#0b6d64" },
        dark: { bg_primary: "#0d1117", text_heading: "#f4f8fb", accent_primary: "#79b1ff", accent_secondary: "#57d9c4" }
      },
      "contemporary-research-lab": {
        light: { bg_primary: "#fbfaf8", text_heading: "#1e1521", accent_primary: "#a8481f", accent_secondary: "#1f5c50" },
        dark: { bg_primary: "#1a1420", text_heading: "#faf7f5", accent_primary: "#e8916b", accent_secondary: "#6cb5a4" }
      }
    },
    creative: {
      "bauhaus-studio": {
        light: { bg_primary: "#ffffff", text_heading: "#000000", accent_primary: "#c81d25", accent_secondary: "#1b3a8a" },
        dark: { bg_primary: "#121212", text_heading: "#ffffff", accent_primary: "#ff6b6b", accent_secondary: "#6ea8fe" }
      },
      "editorial-zine": {
        light: { bg_primary: "#fdfdfb", text_heading: "#000000", accent_primary: "#c2006e", accent_secondary: "#3f7d20" },
        dark: { bg_primary: "#121212", text_heading: "#ffffff", accent_primary: "#ff5fa8", accent_secondary: "#9ee36b" }
      },
      "watercolor-atelier": {
        light: { bg_primary: "#fbf3f0", text_heading: "#2c1f28", accent_primary: "#a3475a", accent_secondary: "#3f6355" },
        dark: { bg_primary: "#241a20", text_heading: "#f9f0f3", accent_primary: "#e39aad", accent_secondary: "#8bbfa8" }
      },
      "neon-studio": {
        light: { bg_primary: "#f5f2fb", text_heading: "#17102a", accent_primary: "#b0158a", accent_secondary: "#0a7a86" },
        dark: { bg_primary: "#150f24", text_heading: "#ffffff", accent_primary: "#ff6fd8", accent_secondary: "#4de8f0" }
      },
      "collage-mixed-media": {
        light: { bg_primary: "#faf3e7", text_heading: "#201607", accent_primary: "#7d6118", accent_secondary: "#6b3f57" },
        dark: { bg_primary: "#201812", text_heading: "#fbf5e9", accent_primary: "#d9b24c", accent_secondary: "#c98fb0" }
      }
    },
    natural: {
      "celestial-observatory": {
        light: { bg_primary: "#f7f3e8", text_heading: "#10162b", accent_primary: "#7d621b", accent_secondary: "#2c4a7c" },
        dark: { bg_primary: "#0a0e1c", text_heading: "#ffffff", accent_primary: "#d9b968", accent_secondary: "#7fa8e0" }
      },
      "periodic-table-chemistry": {
        light: { bg_primary: "#f5f7f8", text_heading: "#0c161e", accent_primary: "#1a5ba8", accent_secondary: "#157a4f" },
        dark: { bg_primary: "#0c1319", text_heading: "#ffffff", accent_primary: "#6fa8e8", accent_secondary: "#4fd68f" }
      },
      "field-notebook": {
        light: { bg_primary: "#f3ecd9", text_heading: "#241a10", accent_primary: "#3f5c3a", accent_secondary: "#7a4a24" },
        dark: { bg_primary: "#1c2318", text_heading: "#f7f0dc", accent_primary: "#8fbf80", accent_secondary: "#d19a5f" }
      },
      "chalkboard-proof": {
        light: { bg_primary: "#f7f5ef", text_heading: "#16160f", accent_primary: "#2f5c46", accent_secondary: "#8a6d16" },
        dark: { bg_primary: "#1b2e22", text_heading: "#ffffff", accent_primary: "#e8d67a", accent_secondary: "#9fd8e0" }
      },
      "quantum-circuit": {
        light: { bg_primary: "#f5f3fb", text_heading: "#150f28", accent_primary: "#0a7a86", accent_secondary: "#a3157e" },
        dark: { bg_primary: "#120c24", text_heading: "#ffffff", accent_primary: "#4de8f0", accent_secondary: "#ef6fd8" }
      }
    },
    precision: {
      "blueprint-drafting": {
        light: { bg_primary: "#f5f7fa", text_heading: "#12293f", accent_primary: "#0f5fa8", accent_secondary: "#b8302a" },
        dark: { bg_primary: "#0b2e4a", text_heading: "#ffffff", accent_primary: "#6fc3e8", accent_secondary: "#e0846b" }
      },
      "surgical-precision": {
        light: { bg_primary: "#f7f9fa", text_heading: "#101416", accent_primary: "#0d6e6e", accent_secondary: "#b3123a" },
        dark: { bg_primary: "#12171a", text_heading: "#ffffff", accent_primary: "#4fc9c4", accent_secondary: "#ef6f8e" }
      },
      "aerospace-materials-lab": {
        light: { bg_primary: "#ece9e4", text_heading: "#141311", accent_primary: "#96490a", accent_secondary: "#2b4c6f" },
        dark: { bg_primary: "#17140f", text_heading: "#fbf7ee", accent_primary: "#e8a33d", accent_secondary: "#7fa8c9" }
      },
      "biomedical-diagnostics": {
        light: { bg_primary: "#f2f9f7", text_heading: "#0e1a1f", accent_primary: "#0d7d6e", accent_secondary: "#c1473a" },
        dark: { bg_primary: "#0c1917", text_heading: "#f5fffb", accent_primary: "#5fd6c0", accent_secondary: "#ef8672" }
      },
      "swiss-precision-instrument": {
        light: { bg_primary: "#ffffff", text_heading: "#000000", accent_primary: "#c8102e", accent_secondary: "#c8102e" },
        dark: { bg_primary: "#101010", text_heading: "#ffffff", accent_primary: "#ff3b52", accent_secondary: "#ff3b52" }
      }
    },
    collective: {
      "cartographers-atlas": {
        light: { bg_primary: "#e8edf0", text_heading: "#12191f", accent_primary: "#245c3f", accent_secondary: "#1f4e73" },
        dark: { bg_primary: "#101823", text_heading: "#f5f8fa", accent_primary: "#6fc99a", accent_secondary: "#6fa8d9" }
      },
      "ledger-index": {
        light: { bg_primary: "#f8f7f4", text_heading: "#0c140f", accent_primary: "#8a6817", accent_secondary: "#164d33" },
        dark: { bg_primary: "#0d1510", text_heading: "#f7f4e6", accent_primary: "#d9ab52", accent_secondary: "#6fbf94" }
      },
      "social-network-diagram": {
        light: { bg_primary: "#faf6f2", text_heading: "#181410", accent_primary: "#b8472e", accent_secondary: "#1f6b6b" },
        dark: { bg_primary: "#1c1815", text_heading: "#fbf7f2", accent_primary: "#e88a6c", accent_secondary: "#5fc9c4" }
      },
      "agora-classical-philosophy": {
        light: { bg_primary: "#f2efe9", text_heading: "#171614", accent_primary: "#a8432b", accent_secondary: "#3f6b5c" },
        dark: { bg_primary: "#1c1c1a", text_heading: "#faf7f0", accent_primary: "#d97a5f", accent_secondary: "#7fada0" }
      },
      "strata-geology": {
        light: { bg_primary: "#e6e0d5", text_heading: "#1c130b", accent_primary: "#9c4318", accent_secondary: "#57616b" },
        dark: { bg_primary: "#1f160f", text_heading: "#f7efdf", accent_primary: "#d98a56", accent_secondary: "#9aa3ab" }
      }
    }
  };

  function updatePaletteDisplay(style, variant) {
    var tokens = PALETTE[style] && PALETTE[style][variant];
    if (!tokens) {
      return;
    }

    var panels = document.querySelectorAll(".presentation-palette");
    for (var p = 0; p < panels.length; p++) {
      panels[p].setAttribute("data-palette-style", style);
      panels[p].setAttribute("data-palette-variant", variant);
    }

    var names = document.querySelectorAll(".presentation-palette-style-name");
    for (var s = 0; s < names.length; s++) {
      names[s].textContent = style;
    }

    var variantNames = document.querySelectorAll(".presentation-palette-variant-name");
    for (var v = 0; v < variantNames.length; v++) {
      variantNames[v].textContent = variant;
    }

    var swatches = document.querySelectorAll(".presentation-palette-swatch");
    for (var i = 0; i < swatches.length; i++) {
      var swatch = swatches[i];
      var mode = swatch.getAttribute("data-palette-mode");
      var token = swatch.getAttribute("data-palette-token");
      var hex = tokens[mode] && tokens[mode][token];
      if (!hex) {
        continue;
      }
      var colorBox = swatch.querySelector(".presentation-palette-swatch-color");
      var hexLabel = swatch.querySelector(".presentation-palette-swatch-hex");
      if (colorBox) {
        colorBox.style.background = hex;
      }
      if (hexLabel) {
        hexLabel.textContent = hex;
      }
    }
  }

  function updateActiveGroup(style) {
    var groups = document.querySelectorAll(".style-switcher-group");
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i];
      var isCurrent = group.getAttribute("data-style") === style;
      group.classList.toggle("style-switcher-group-current", isCurrent);
      group.open = isCurrent;
    }
  }

  function applyChoice(style, variant, persist) {
    document.body.setAttribute("data-style", style);
    document.body.setAttribute("data-variant", variant);
    updateCurrentOption(variant);
    updateActiveGroup(style);
    updatePaletteDisplay(style, variant);
    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ style: style, variant: variant }));
      } catch (e) {
        // Ignore storage failures; the choice still applies for this page view.
      }
    }
  }

  function updateCurrentOption(variant) {
    var options = document.querySelectorAll(".style-switcher-option");
    for (var i = 0; i < options.length; i++) {
      var isCurrent = options[i].getAttribute("data-variant") === variant;
      options[i].setAttribute("aria-current", isCurrent ? "true" : "false");
    }
  }

  function getStoredChoice() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      if (parsed && parsed.style && parsed.variant && PALETTE[parsed.style] && PALETTE[parsed.style][parsed.variant]) {
        return parsed;
      }
    } catch (e) {
      // Ignore storage/parse failures — fall through to build-time default.
    }
    return null;
  }

  function init() {
    var menu = document.querySelector(".style-switcher-menu");
    if (!menu) {
      return;
    }

    updateCurrentOption(document.body.getAttribute("data-variant"));
    updateActiveGroup(document.body.getAttribute("data-style"));

    var stored = getStoredChoice();
    if (stored) {
      applyChoice(stored.style, stored.variant, false);
    }

    menu.addEventListener("click", function (event) {
      var option = event.target.closest(".style-switcher-option");
      if (!option) {
        return;
      }
      applyChoice(option.getAttribute("data-style"), option.getAttribute("data-variant"), true);
      if (typeof menu.hidePopover === "function") {
        menu.hidePopover();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
