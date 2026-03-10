/* ============================================
   CSMS Site Components
   Shared nav + footer — single source of truth
   ============================================ */

(function()
{
  const GITHUB = "https://github.com/NikolaiF90/AIDCharacterSheetandMechanicSystem";
  const AID    = "https://play.aidungeon.com";

  // Detect active page from URL
  const path    = window.location.pathname.split("/").pop() || "index.html";
  const page_id = path.replace(".html", "") || "index";

  // Nav links — [label, href, id]
  const NAV_LINKS =
  [
    ["Player Guide",  "player.html",           "player"],
    ["World Maker",   "worldmaker.html",        "worldmaker"],
    ["Modules",       "modules.html",           "modules"],
    ["Commands",      "commands.html",          "commands"],
    ["Changelog",     "changelog.html",         "changelog"],
  ];

  // Footer columns — [title, links[]]
  const FOOTER_COLS =
  [
    {
      title: "Guides",
      links:
      [
        ["Player Guide",      "player.html"],
        ["World Maker Guide", "worldmaker.html"],
        ["Modules",           "modules.html"],
        ["Commands",          "commands.html"],
        ["Changelog",         "changelog.html"],
      ]
    },
    {
      title: "Systems",
      links:
      [
        ["Ordinance",         "ordinance.html"],
        ["Inventory",         "inventory.html"],
        ["Ordinance Library", "ordinance-library.html"],
      ]
    },
    {
      title: "Community",
      links:
      [
        ["Glossary",          "glossary.html"],
        ["Milestones",        "milestones.html"],
      ]
    },
    {
      title: "Project",
      links:
      [
        ["GitHub",      GITHUB, true],
        ["AI Dungeon",  AID,    true],
      ]
    }
  ];

  function buildNav()
  {
    const links = NAV_LINKS.map(([label, href, id]) =>
    {
      const active = page_id === id ? `style="color: var(--gold)"` : "";
      return `<a href="${href}" ${active}>${label}</a>`;
    }).join("\n        ");

    return `
  <nav>
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">CSMS</a>
      <div class="nav-links">
        ${links}
        <a href="${GITHUB}" target="_blank" class="nav-cta">GitHub ↗</a>
      </div>
    </div>
  </nav>`;
  }

  function buildFooter()
  {
    const cols = FOOTER_COLS.map(col =>
    {
      const links = col.links.map(([label, href, external]) =>
      {
        const ext = external ? `target="_blank"` : "";
        return `<a href="${href}" ${ext}>${label}</a>`;
      }).join("\n            ");

      return `
          <div class="footer-col">
            <div class="footer-col-title">${col.title}</div>
            ${links}
          </div>`;
    }).join("");

    return `
  <footer>
    <div class="container">
      <div class="footer-inner">
        <div class="footer-left">
          <div class="footer-logo">CSMS</div>
          <p>Character Sheet &amp; Mechanics System<br>by <strong>PrinceF90</strong></p>
          <p class="footer-quote"><em>"The AI handles judgment. The script handles consistency."</em></p>
        </div>
        <div class="footer-links">${cols}
        </div>
      </div>
      <div class="footer-bottom">
        <p>Free and open source. Credit appreciated, not required.</p>
      </div>
    </div>
  </footer>`;
  }

  // Inject on DOM ready
  function inject()
  {
    // Nav — inject after <body> opens
    const navEl = document.createElement("div");
    navEl.innerHTML = buildNav();
    document.body.insertBefore(navEl.firstElementChild, document.body.firstChild);

    // Footer — inject at end of body
    const footerEl = document.createElement("div");
    footerEl.innerHTML = buildFooter();
    document.body.appendChild(footerEl.firstElementChild);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", inject);
  else
    inject();

})();
