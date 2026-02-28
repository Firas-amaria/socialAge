(() => {
  const info = document.getElementById("profileInfo");
  if (!info) return;

  const token = window.localStorage.getItem("token");
  if (!token) {
    info.innerHTML = `
      <p class="subtitle">You are not logged in.</p>
      <a class="btn btn-primary" href="/login">Go to Login</a>
    `;
    return;
  }

  const renderUser = (user) => {
    info.innerHTML = `
      <div class="info-grid">
        <div class="info-row">
          <p class="info-label">Name</p>
          <p class="info-value">${user.name || "Unknown"}</p>
        </div>
        <div class="info-row">
          <p class="info-label">Email</p>
          <p class="info-value">${user.email || "Unknown"}</p>
        </div>
        <div class="info-row">
          <p class="info-label">Role</p>
          <p class="info-value">${user.role || "Unknown"}</p>
        </div>
        <div class="info-row">
          <p class="info-label">User Id</p>
          <p class="info-value">${user._id || user.id || "Unknown"}</p>
        </div>
      </div>
      <div class="button-grid" style="margin-top: 16px;">
        <a class="primary-btn button-link" href="/manager-application">Become a Social Manager</a>
      </div>
    `;
  };

  const loadProfile = async () => {
    if (!window.api || typeof window.api.get !== "function") {
      info.innerHTML = `<p class="subtitle">API is not available.</p>`;
      return;
    }

    try {
      const user = await window.api.get("/users/me");
      if (user) {
        window.localStorage.setItem("user", JSON.stringify(user));
      }
      renderUser(user || {});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load profile.";
      if (message.toLowerCase().includes("auth")) {
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("user");
      }
      info.innerHTML = `
        <p class="subtitle">Could not load your profile: ${message}</p>
        <a class="btn btn-primary" href="/login">Go to Login</a>
      `;
    }
  };

  const raw = window.localStorage.getItem("user");
  if (!raw) {
    loadProfile();
    return;
  }

  try {
    const cached = JSON.parse(raw);
    renderUser(cached);
  } catch (_error) {
    info.innerHTML = `
      <p class="subtitle">We could not read your profile.</p>
      <a class="btn btn-primary" href="/login">Go to Login</a>
    `;
  }
  loadProfile();
})();
