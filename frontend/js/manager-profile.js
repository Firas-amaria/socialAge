(() => {
  if (!window.managerAuth?.requireManager()) return;

  const info = document.getElementById("profileInfo");
  const applicationSnapshot = document.getElementById("applicationSnapshot");
  if (!info || !applicationSnapshot) return;

  const formatDateTime = (value) => {
    if (!value) return "--";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "--";
    return parsed.toLocaleString();
  };

  const setUserView = (user) => {
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
      </div>
    `;
  };

  const loadUser = async () => {
    const user = await window.api.get("/users/me");
    setUserView(user);
    window.localStorage.setItem("user", JSON.stringify(user));
  };

  const loadApplicationSnapshot = async () => {
    try {
      const app = await window.api.get("/sm-applications/me/latest");
      const status = app.status === "denied" ? "rejected" : app.status;
      const badgeType = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";
      const appliedAt = app.createdAt;
      const acceptedAt =
        app.approvedAt || (status === "approved" ? app.updatedAt : null);

      applicationSnapshot.innerHTML = `
        <p><span class="badge badge--${badgeType}">${status}</span></p>
        <div class="info-grid" style="margin-top: 10px;">
          <div class="info-row">
            <p class="info-label">Applied On</p>
            <p class="info-value">${formatDateTime(appliedAt)}</p>
          </div>
          <div class="info-row">
            <p class="info-label">Accepted On</p>
            <p class="info-value">${status === "approved" ? formatDateTime(acceptedAt) : "--"}</p>
          </div>
          <div class="info-row">
            <p class="info-label">Admin Notes</p>
            <p class="info-value">${app.adminNotes || "No notes yet."}</p>
          </div>
        </div>
      `;
    } catch (_error) {
      applicationSnapshot.innerHTML = `<p class="subtitle">No manager application found.</p>`;
    }
  };

  loadUser().catch((error) => {
    info.innerHTML = `<p class="subtitle">Could not load profile: ${error.message}</p>`;
  });
  loadApplicationSnapshot();
})();
