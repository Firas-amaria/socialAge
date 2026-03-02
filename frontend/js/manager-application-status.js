(() => {
  if (!window.managerAuth?.requireLogin()) return;

  const container = document.getElementById("statusContainer");
  const actions = document.getElementById("statusActions");
  const user = window.managerAuth.getStoredUser();

  if (!container || !actions) return;

  const renderRoleBanner = () => {
    if (!user) return "";
    if (window.managerAuth.isManagerRole(user.role)) {
      return `
        <div class="status-banner status-banner--approved">
          <p>You are already approved as a Social Manager.</p>
          <p>Role: <strong>${user.role}</strong></p>
        </div>
      `;
    }
    return "";
  };

  const renderApplication = (app) => {
    const status = app.status === "denied" ? "rejected" : app.status;
    const statusClass = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";
    const notes = app.adminNotes || "No admin notes yet.";
    return `
      ${renderRoleBanner()}
      <div class="status-banner status-banner--${statusClass}">
        <div>
          <p>Current Status</p>
          <span class="badge badge--${statusClass}">${status}</span>
        </div>
        <p><strong>Submitted:</strong> ${new Date(app.createdAt).toLocaleString()}</p>
        <p><strong>Full Name:</strong> ${app.fullName || "-"}</p>
        <p><strong>Reference Notes:</strong> ${app.references || "-"}</p>
        <p><strong>Admin Notes:</strong> ${notes}</p>
      </div>
    `;
  };

  const load = async () => {
    container.innerHTML = `<p class="subtitle">Loading your application status...</p>`;
    actions.innerHTML = "";
    try {
      const app = await window.api.get("/sm-applications/me/latest");
      container.innerHTML = renderApplication(app);

      if (!window.managerAuth.isManagerRole(user?.role) && (app.status === "rejected" || app.status === "denied")) {
        actions.innerHTML = `<a class="primary-btn button-link" href="/manager-application">Submit New Application</a>`;
      } else if (!window.managerAuth.isManagerRole(user?.role)) {
        actions.innerHTML = `<a class="secondary-btn button-link" href="/manager-application">Update Application</a>`;
      } else {
        actions.innerHTML = `<a class="primary-btn button-link" href="/manager-gatherings">Go to My Gatherings</a>`;
      }
    } catch (_error) {
      container.innerHTML = `
        ${renderRoleBanner()}
        <p class="subtitle">No submitted application found.</p>
      `;
      actions.innerHTML = `<a class="primary-btn button-link" href="/manager-application">Submit Application</a>`;
    }
  };

  load();
})();
