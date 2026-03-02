(() => {
  const header = document.querySelector("header[data-elder-header]");
  if (!header) return;

  const token = window.localStorage.getItem("token");
  const isLoggedIn = Boolean(token);
  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const baseLinks = [
    { href: "/elder-dashboard", label: "Dashboard" },
    ...(isLoggedIn
      ? [
          { href: "/elder-my-gatherings", label: "My Gatherings" },
        ]
      : []),
  ];
  const navLinks = baseLinks
    .map(({ href, label }) => {
      const normalizedHref = href.replace(/\/+$/, "") || "/";
      const currentAttr = normalizedHref === currentPath ? ' aria-current="page"' : "";
      return `<a href="${href}"${currentAttr}>${label}</a>`;
    })
    .join("");

  header.innerHTML = `
    <nav class="elder-nav">
      <div class="elder-nav-left">
        <button type="button" class="sidebar-toggle elder-sidebar-toggle" data-elder-sidebar-toggle aria-label="Open menu" aria-expanded="false">☰</button>
        <div class="nav-links">
          ${navLinks}
        </div>
      </div>
      <div class="nav-actions">
        ${
          isLoggedIn
            ? `
          <button type="button" class="account-btn" aria-haspopup="menu" aria-expanded="false">
            <span class="account-icon" aria-hidden="true">👤</span>
            Account
          </button>
          <div class="account-menu" role="menu">
            <a role="menuitem" href="/elder-profile">Profile</a>
            <button type="button" class="logout-btn" role="menuitem">Log out</button>
          </div>
        `
            : `<a class="btn btn-primary nav-login" href="/login">Login</a>`
        }
      </div>
    </nav>
  `;

  const sidebarBackdrop = document.createElement("div");
  sidebarBackdrop.className = "elder-sidebar-backdrop";
  sidebarBackdrop.setAttribute("data-elder-sidebar-backdrop", "");
  const sidebar = document.createElement("aside");
  sidebar.className = "elder-sidebar-drawer";
  sidebar.setAttribute("aria-label", "Elder navigation");
  sidebar.innerHTML = `
    <div class="elder-sidebar-top">
      <button type="button" class="sidebar-close-btn" data-elder-sidebar-close aria-label="Close menu">×</button>
    </div>
    <nav class="manager-nav elder-sidebar-nav">
      ${navLinks}
    </nav>
  `;
  document.body.appendChild(sidebarBackdrop);
  document.body.appendChild(sidebar);

  const sidebarToggleBtn = header.querySelector("[data-elder-sidebar-toggle]");
  const sidebarCloseBtn = sidebar.querySelector("[data-elder-sidebar-close]");

  const closeSidebar = () => {
    document.body.classList.remove("elder-sidebar-open");
    if (sidebarToggleBtn) {
      sidebarToggleBtn.setAttribute("aria-expanded", "false");
      sidebarToggleBtn.setAttribute("aria-label", "Open menu");
    }
  };

  const openSidebar = () => {
    document.body.classList.add("elder-sidebar-open");
    if (sidebarToggleBtn) {
      sidebarToggleBtn.setAttribute("aria-expanded", "true");
      sidebarToggleBtn.setAttribute("aria-label", "Close menu");
    }
  };

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      if (document.body.classList.contains("elder-sidebar-open")) {
        closeSidebar();
        return;
      }
      openSidebar();
    });
  }
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener("click", closeSidebar);
  }
  sidebarBackdrop.addEventListener("click", closeSidebar);

  document.addEventListener("click", (event) => {
    if (
      document.body.classList.contains("elder-sidebar-open") &&
      event.target.closest(".elder-sidebar-drawer a")
    ) {
      closeSidebar();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeSidebar();
  });

  if (!isLoggedIn) return;

  const accountBtn = header.querySelector(".account-btn");
  const accountMenu = header.querySelector(".account-menu");
  const logoutBtn = header.querySelector(".logout-btn");

  const closeMenu = () => {
    accountMenu.classList.remove("is-open");
    accountBtn.setAttribute("aria-expanded", "false");
  };

  accountBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = accountMenu.classList.toggle("is-open");
    accountBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.addEventListener("click", (event) => {
    if (!accountMenu.contains(event.target) && event.target !== accountBtn) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      closeSidebar();
    }
  });

  logoutBtn.addEventListener("click", () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    window.location.href = "/login";
  });
})();
