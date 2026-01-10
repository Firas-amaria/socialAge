const STORAGE_KEY = "sm_application";

const dashboardContent = document.getElementById("dashboardContent");
const approveButton = document.getElementById("approveButton");
const rejectButton = document.getElementById("rejectButton");
const clearButton = document.getElementById("clearButton");

const formatDate = (value) => {
  if (!value) {
    return "Unknown";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleString();
};

const getApplication = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const saveApplication = (application) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(application));
};

const getStatusLabel = (status) => {
  if (status === "approved") {
    return "Approved";
  }
  if (status === "rejected") {
    return "Rejected";
  }
  return "Pending";
};

const getStatusMessage = (status) => {
  if (status === "approved") {
    return "You are approved.";
  }
  if (status === "rejected") {
    return "Your application was rejected.";
  }
  return "Your application is being reviewed.";
};

const renderEmptyState = () => {
  dashboardContent.innerHTML = `
    <div class="empty-state">
      <p class="empty-title">No application found.</p>
      <p class="subtitle">Start a new application to become a Social Manager.</p>
      <div class="button-grid">
        <a class="primary-btn button-link" href="/manager-application">Apply to become a Social Manager</a>
        <a class="secondary-btn button-link" href="/">Back to Home</a>
      </div>
    </div>
  `;
};

const renderApplication = (application) => {
  const status = application.status || "pending";
  const badgeClass = `badge--${status === "approved" || status === "rejected" ? status : "pending"}`;
  const adminNotes = application.adminNotes?.trim() || "No notes yet.";

  const toolsMarkup =
    status === "approved"
      ? `
        <div class="button-grid">
          <a class="primary-btn button-link" href="/manager-gatherings">My Gatherings (Manage)</a>
          <a class="secondary-btn button-link" href="/manager-create-gathering">Create Gathering</a>
        </div>
      `
      : "";

  const reapplyMarkup =
    status === "rejected"
      ? `<button type="button" class="primary-btn" data-action="reapply">Re-apply</button>`
      : "";

  dashboardContent.innerHTML = `
    <div class="info-grid">
      <div class="info-row">
        <p class="info-label">Status</p>
        <div class="info-value"><span class="badge ${badgeClass}">${getStatusLabel(status)}</span></div>
      </div>
      <div class="info-row">
        <p class="info-label">Submitted</p>
        <p class="info-value">${formatDate(application.submittedAt)}</p>
      </div>
      <div class="info-row">
        <p class="info-label">Full Legal Name</p>
        <p class="info-value">${application.fullLegalName || "Unknown"}</p>
      </div>
      <div class="info-row">
        <p class="info-label">Reference Notes</p>
        <p class="info-value">${application.referenceText || "None provided."}</p>
      </div>
      <div class="info-row">
        <p class="info-label">ID Preview</p>
        <img class="id-preview" src="${application.idImageDataUrl || ""}" alt="Government ID preview">
      </div>
    </div>

    <div class="note-box">
      <h2 class="section-title">Admin Notes</h2>
      <p>${adminNotes}</p>
    </div>

    <div class="status-banner status-banner--${status}">
      <p>${getStatusMessage(status)}</p>
      ${reapplyMarkup}
    </div>

    ${toolsMarkup}
  `;
};

const render = () => {
  const application = getApplication();
  const hasApplication = Boolean(application);

  approveButton.disabled = !hasApplication;
  rejectButton.disabled = !hasApplication;

  if (!hasApplication) {
    renderEmptyState();
    return;
  }

  renderApplication(application);
};

approveButton.addEventListener("click", () => {
  const application = getApplication();
  if (!application) {
    return;
  }
  application.status = "approved";
  application.adminNotes = "Approved for demo.";
  saveApplication(application);
  render();
});

rejectButton.addEventListener("click", () => {
  const application = getApplication();
  if (!application) {
    return;
  }
  application.status = "rejected";
  application.adminNotes = "Rejected for demo.";
  saveApplication(application);
  render();
});

clearButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  render();
});

dashboardContent.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (target.dataset.action === "reapply") {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/manager-application";
  }
});

render();
