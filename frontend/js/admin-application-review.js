(() => {
  const statusEl = document.getElementById("adminApplicationReviewStatus");
  const detailsEl = document.getElementById("adminApplicationDetails");
  const notesEl = document.getElementById("adminReviewNotes");
  const approveBtn = document.getElementById("adminApproveBtn");
  const rejectBtn = document.getElementById("adminRejectBtn");

  let applicationId = "";

  const setStatus = (text, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("status--error", isError);
  };

  const normalizeStatus = (value) => ((value || "").toLowerCase() === "denied" ? "rejected" : value || "");

  const readId = () => new URLSearchParams(window.location.search).get("id") || "";

  const fileMeta = (label, fileObj) => `
    <article class="list-card">
      <h3>${label}</h3>
      <p class="subtitle">Filename: ${fileObj?.filename || "-"}</p>
      <p class="subtitle">Type: ${fileObj?.mimetype || "-"}</p>
      <p class="subtitle">Size: ${typeof fileObj?.size === "number" ? `${fileObj.size} bytes` : "-"}</p>
    </article>
  `;

  const render = (item) => {
    if (!detailsEl) return;
    const user = item?.userId || {};
    const extraDocs = Array.isArray(item?.additionalDocuments) ? item.additionalDocuments : [];

    detailsEl.innerHTML = `
      <article class="list-card">
        <h3>Applicant</h3>
        <p class="subtitle">Name: ${item?.fullName || user?.name || "-"}</p>
        <p class="subtitle">Email: ${user?.email || "-"}</p>
        <p class="subtitle">User role: ${user?.role || "-"}</p>
        <p class="subtitle">Government ID number: ${item?.governmentIdNumber || "-"}</p>
        <p class="subtitle">References: ${item?.references || "-"}</p>
        <p class="subtitle">Status: ${normalizeStatus(item?.status) || "-"}</p>
      </article>
      ${fileMeta("Government ID Image", item?.governmentIdImage)}
      ${fileMeta("Employment Proof", item?.employmentProof)}
      ${
        extraDocs.length
          ? extraDocs
              .map((doc, index) => fileMeta(`Additional Document ${index + 1}`, doc))
              .join("")
          : '<article class="list-card"><h3>Additional Documents</h3><p class="subtitle">No additional documents.</p></article>'
      }
    `;
    notesEl.value = item?.adminNotes || "";
  };

  const submitStatus = async (status) => {
    if (!applicationId) return;
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    try {
      await window.api.patch(`/sm-applications/${applicationId}/status`, {
        status,
        adminNotes: notesEl.value || "",
      });
      setStatus(`Application ${status === "approved" ? "approved" : "rejected"} successfully.`);
      const refreshed = await window.api.get(`/sm-applications/${applicationId}`);
      render(refreshed);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update status.", true);
    } finally {
      approveBtn.disabled = false;
      rejectBtn.disabled = false;
    }
  };

  const init = async () => {
    const user = await window.adminAuth?.requireAdmin?.();
    if (!user) return;

    applicationId = readId();
    if (!applicationId) {
      setStatus("Missing application id.", true);
      return;
    }

    try {
      const item = await window.api.get(`/sm-applications/${applicationId}`);
      render(item);
      setStatus("Application loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load application.", true);
    }
  };

  approveBtn?.addEventListener("click", () => submitStatus("approved"));
  rejectBtn?.addEventListener("click", () => submitStatus("rejected"));

  init();
})();
