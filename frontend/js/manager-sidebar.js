(() => {
  const sidebar = document.querySelector("aside[data-manager-sidebar]");
  if (!sidebar) return;

  const links = [
    { href: "/manager-dashboard", label: "Manager Dashboard" },
    { href: "/manager-create-gathering", label: "Create New Gathering" },
    { href: "/manager-gatherings", label: "Manage My Gatherings" },
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
    <nav class="manager-nav" aria-label="Manager navigation">
      ${navLinks}
    </nav>
  `;
})();
