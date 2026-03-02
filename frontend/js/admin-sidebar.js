(() => {
  const sidebar = document.querySelector("aside[data-admin-sidebar]");
  if (!sidebar) return;

  const links = [
    { href: "/admin-dashboard", label: "Dashboard" },
    { href: "/admin-applications", label: "Applications" },
    { href: "/admin-gatherings", label: "Gatherings" },
    { href: "/admin-users", label: "Users" },
    { href: "/admin-settings", label: "Settings" },
  ];

  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

  const navLinks = links
    .map(({ href, label }) => {
      const normalizedHref = href.replace(/\/+$/, "") || "/";
      const currentAttr = currentPath === normalizedHref ? ' aria-current="page"' : "";
      return `<a href="${href}"${currentAttr}>${label}</a>`;
    })
    .join("");

  sidebar.innerHTML = `
    <div class="manager-sidebar-top">
      <button type="button" class="sidebar-close-btn" aria-label="Close menu">×</button>
    </div>
    <nav class="manager-nav" aria-label="Admin navigation">
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
