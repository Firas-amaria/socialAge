(() => {
  const info = document.getElementById("profileInfo");
  if (!info) return;

  const raw = window.localStorage.getItem("user");
  if (!raw) {
    info.innerHTML = `
      <p class="subtitle">You are not logged in.</p>
      <a class="btn btn-primary" href="/login">Go to Login</a>
    `;
    return;
  }

  let user = null;
  try {
    user = JSON.parse(raw);
  } catch (error) {
    user = null;
  }

  if (!user) {
    info.innerHTML = `
      <p class="subtitle">We could not read your profile.</p>
      <a class="btn btn-primary" href="/login">Go to Login</a>
    `;
    return;
  }

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
})();
