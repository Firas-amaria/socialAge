(() => {
  const sidebar = document.querySelector("aside[data-manager-sidebar]");
  if (!sidebar) return;

  const links = [
    { href: "/manager-gatherings", label: "Manage My Gatherings" },
    { href: "/manager-past-gatherings", label: "Past Gatherings" },
    { href: "/manager-create-gathering", label: "Create New Gathering" },
  ];

  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

  const navLinks = links
    .map(({ href, label }) => {
      const normalizedHref = href.replace(/\/+$/, "") || "/";
      const currentAttr =
        currentPath === normalizedHref ? ' aria-current="page"' : "";
      return `<a href="${href}"${currentAttr}>${label}</a>`;
    })
    .join("");

  sidebar.innerHTML = `
    <div class="manager-sidebar-top">
      <button type="button" class="sidebar-close-btn" aria-label="Close menu">×</button>
    </div>
    <nav class="manager-nav" aria-label="Manager navigation">
      ${navLinks}
    </nav>
  `;

  const closeBtn = sidebar.querySelector(".sidebar-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.body.classList.remove("sidebar-open");
      const toggle = document.querySelector("[data-sidebar-toggle]");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
    });
  }
})();
