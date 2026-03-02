(() => {
  if (!window.managerAuth?.requireManager()) return;

  const DETAIL_ID_STORAGE_KEY = "managerSelectedGatheringId";
  const statusEl = document.getElementById("managerGatheringDetailStatus");
  const contentEl = document.getElementById("managerGatheringDetailContent");

  const getDetailGatheringId = () => {
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get("id");
    if (idFromQuery) {
      window.sessionStorage.setItem(DETAIL_ID_STORAGE_KEY, idFromQuery);
      if (window.location.pathname === "/manager-gathering-detail") {
        window.history.replaceState(null, "", "/manager-gathering-detail");
      }
      return idFromQuery;
    }
    return window.sessionStorage.getItem(DETAIL_ID_STORAGE_KEY) || "";
  };

  const gatheringId = getDetailGatheringId();

  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const setStatus = (message, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle("status--error", isError);
    statusEl.classList.toggle("status--success", !isError && message.toLowerCase().includes("loaded"));
  };

  const formatType = (value) => {
    if (!value) return "--";
    return value
      .toString()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const render = (gathering, attendeesPayload) => {
    if (!contentEl) return;
    const users = Array.isArray(attendeesPayload?.attendees) ? attendeesPayload.attendees : [];
    const guests = Array.isArray(attendeesPayload?.guestAttendees) ? attendeesPayload.guestAttendees : [];
    const total = users.length + guests.length;
    const maxAttendees = Number(gathering?.maxAttendees || attendeesPayload?.maxAttendees || 0);

    const rows = [
      ...users.map((user) => `
        <tr>
          <td>${esc(user?.name || "Unknown")}</td>
          <td>${esc(user?.email || "-")}</td>
          <td>No</td>
        </tr>
      `),
      ...guests.map((guest) => `
        <tr>
          <td>${esc(guest?.name || "Guest")}</td>
          <td>${esc(guest?.email || "-")}</td>
          <td>Yes</td>
        </tr>
      `),
    ].join("");

    const locationValue = gathering?.location
      ? `<a href="${esc(gathering.location)}" target="_blank" rel="noreferrer">${esc(gathering.location)}</a>`
      : "-";

    contentEl.innerHTML = `
      <article class="list-card">
        <h3>${esc(gathering?.name || "Gathering")}</h3>
        <p class="subtitle">Date: ${esc(gathering?.date || "-")}</p>
        <p class="subtitle">Time: ${esc(gathering?.startTime || "--:--")} - ${esc(gathering?.endTime || "--:--")}</p>
        <p class="subtitle">Type: ${esc(formatType(gathering?.type))}</p>
        <p class="subtitle">Status: ${esc(gathering?.status || "-")}</p>
        <p class="subtitle">Address: ${esc(gathering?.address || "-")}</p>
        <p class="subtitle">Map Link: ${locationValue}</p>
        <p class="subtitle">Description: ${esc(gathering?.description || "-")}</p>
        <p class="subtitle">Notes: ${esc(gathering?.notes || "-")}</p>
        <p class="subtitle">Attendees: ${total}${maxAttendees > 0 ? ` / ${maxAttendees}` : ""}</p>
      </article>
      <article class="list-card">
        <h3>Registered Attendees</h3>
        ${
          total === 0
            ? `<p class="subtitle">No attendees registered yet.</p>`
            : `
          <div class="table-wrap">
            <table class="simple-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Guest</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `
        }
      </article>
    `;
  };

  const init = async () => {
    if (!statusEl || !contentEl) return;
    if (!gatheringId) {
      setStatus("Missing gathering id.", true);
      return;
    }
    try {
      const [gathering, attendeesPayload] = await Promise.all([
        window.api.get(`/gatherings/${encodeURIComponent(gatheringId)}`),
        window.api.get(`/gatherings/${encodeURIComponent(gatheringId)}/attendees`),
      ]);
      render(gathering, attendeesPayload);
      setStatus("Gathering details loaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load gathering details.";
      setStatus(message, true);
      contentEl.innerHTML = "";
    }
  };

  init();
})();
