(() => {
  const header = document.querySelector("header[data-manager-header]");
  if (!header) return;

  const token = window.localStorage.getItem("token");
  const isLoggedIn = Boolean(token);

  header.innerHTML = `
    <nav class="elder-nav">
      <div class="nav-links">
        <a href="/manager-dashboard">Dashboard</a>
        <a href="/manager-gatherings">My Gatherings</a>
        <a href="/manager-create-gathering">Create Gathering</a>
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
            <a role="menuitem" href="/manager-profile">Profile</a>
            <button type="button" class="logout-btn" role="menuitem">Log out</button>
          </div>
        `
            : `<a class="btn btn-primary nav-login" href="/login">Login</a>`
        }
      </div>
    </nav>
  `;

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
    if (event.key === "Escape") closeMenu();
  });

  logoutBtn.addEventListener("click", () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    window.location.href = "/login";
  });
})();
