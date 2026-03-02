(() => {
  const header = document.querySelector("header[data-manager-header]");
  if (!header) return;

  const sidebar = document.querySelector(".manager-shell .manager-sidebar");
  const hasSidebar = Boolean(sidebar);

  const token = window.localStorage.getItem("token");
  const isLoggedIn = Boolean(token);

  header.innerHTML = `
    <nav class="manager-topbar">
      <div class="manager-topbar-left">
        ${
          hasSidebar
            ? `<button type="button" class="sidebar-toggle" data-sidebar-toggle aria-label="Open menu" aria-expanded="false">☰</button>`
            : ""
        }
      </div>
      <div class="manager-topbar-actions">
        ${
          isLoggedIn
            ? `
          <button type="button" class="account-btn" aria-haspopup="menu" aria-expanded="false">
            <span class="account-icon" aria-hidden="true">👤</span>
            Account
          </button>
          <div class="account-menu" role="menu">
            <a role="menuitem" href="/manager-profile">Profile</a>
            <button type="button" class="logout-btn" role="menuitem">Log out</button>
          </div>
        `
            : `<a class="btn btn-primary nav-login" href="/login">Login</a>`
        }
      </div>
    </nav>
  `;

  const sidebarToggleBtn = header.querySelector("[data-sidebar-toggle]");
  let sidebarBackdrop = null;

  const closeSidebar = () => {
    document.body.classList.remove("sidebar-open");
    if (sidebarToggleBtn) {
      sidebarToggleBtn.setAttribute("aria-expanded", "false");
      sidebarToggleBtn.setAttribute("aria-label", "Open menu");
    }
  };

  if (hasSidebar) {
    sidebarBackdrop = document.createElement("div");
    sidebarBackdrop.className = "sidebar-backdrop";
    sidebarBackdrop.setAttribute("data-sidebar-backdrop", "");
    document.body.appendChild(sidebarBackdrop);

    const toggleSidebar = () => {
      const opened = document.body.classList.toggle("sidebar-open");
      if (sidebarToggleBtn) {
        sidebarToggleBtn.setAttribute("aria-expanded", opened ? "true" : "false");
        sidebarToggleBtn.setAttribute("aria-label", opened ? "Close menu" : "Open menu");
      }
    };

    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener("click", toggleSidebar);
    }

    sidebarBackdrop.addEventListener("click", closeSidebar);

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeSidebar();
    });

    document.addEventListener("click", (event) => {
      if (
        document.body.classList.contains("sidebar-open") &&
        event.target.closest(".manager-sidebar a")
      ) {
        closeSidebar();
      }
    });
  }

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
