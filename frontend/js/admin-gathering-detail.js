(() => {
  const statusEl = document.getElementById("adminGatheringDetailStatus");
  const contentEl = document.getElementById("adminGatheringDetailContent");
  const cancelBtn = document.getElementById("adminCancelGatheringBtn");

  let gatheringId = "";
  let currentStatus = "";

  const setStatus = (text, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("status--error", isError);
  };

  const readId = () => new URLSearchParams(window.location.search).get("id") || "";

  const render = (g) => {
    if (!contentEl) return;
    const attendees = Array.isArray(g?.attendees) ? g.attendees : [];
    const guests = Array.isArray(g?.guestAttendees) ? g.guestAttendees : [];
    currentStatus = (g?.status || "").toLowerCase();

    contentEl.innerHTML = `
      <article class="list-card">
        <h3>${g?.name || "Gathering"}</h3>
        <p class="subtitle">Date: ${g?.date || "-"}</p>
        <p class="subtitle">Time: ${g?.startTime || "--:--"} - ${g?.endTime || "--:--"}</p>
        <p class="subtitle">Status: ${g?.status || "-"}</p>
        <p class="subtitle">Type: ${g?.type || "-"}</p>
        <p class="subtitle">Address: ${g?.address || "-"}</p>
        <p class="subtitle">Location URL: ${g?.location || "-"}</p>
        <p class="subtitle">Description: ${g?.description || "-"}</p>
      </article>
      <article class="list-card">
        <h3>Ownership & Capacity</h3>
        <p class="subtitle">Social Manager: ${g?.smId?.name || "-"} (${g?.smId?.email || "-"})</p>
        <p class="subtitle">Max attendees: ${Number(g?.maxAttendees || 0)}</p>
        <p class="subtitle">Registered users: ${attendees.length}</p>
        <p class="subtitle">Guest attendees: ${guests.length}</p>
      </article>
    `;

    if (cancelBtn) {
      cancelBtn.disabled = currentStatus === "cancelled";
      cancelBtn.textContent = currentStatus === "cancelled" ? "Already Cancelled" : "Cancel Gathering";
    }
  };

  const loadGathering = async () => {
    const gathering = await window.api.get(`/gatherings/${gatheringId}`);
    render(gathering);
    setStatus("Gathering loaded.");
  };

  const cancelGathering = async () => {
    if (!gatheringId || currentStatus === "cancelled") return;
    if (!window.confirm("Cancel this gathering?")) return;

    cancelBtn.disabled = true;
    try {
      await window.api.patch(`/gatherings/${gatheringId}/cancel`, {});
      setStatus("Gathering cancelled successfully.");
      await loadGathering();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to cancel gathering.", true);
      cancelBtn.disabled = false;
    }
  };

  const init = async () => {
    const user = await window.adminAuth?.requireAdmin?.();
    if (!user) return;

    gatheringId = readId();
    if (!gatheringId) {
      setStatus("Missing gathering id.", true);
      return;
    }

    try {
      await loadGathering();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load gathering.", true);
    }
  };

  cancelBtn?.addEventListener("click", cancelGathering);
  init();
})();
