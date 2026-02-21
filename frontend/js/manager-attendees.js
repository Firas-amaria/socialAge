(() => {
  if (!window.managerAuth?.requireManager()) return;

  const params = new URLSearchParams(window.location.search);
  const gatheringId = params.get("id");
  const metaEl = document.getElementById("attendeesMeta");
  const listEl = document.getElementById("attendeesList");

  if (!gatheringId || !metaEl || !listEl) return;

  const load = async () => {
    try {
      const data = await window.api.get(`/gatherings/${gatheringId}/attendees`);
      const count = Array.isArray(data.attendees) ? data.attendees.length : 0;
      metaEl.textContent = `${data.name} | ${data.date} ${data.startTime || ""} | ${count}/${data.maxAttendees || "--"} attendees`;

      if (!count) {
        listEl.innerHTML = `<p class="subtitle">No attendees registered yet.</p>`;
        return;
      }

      listEl.innerHTML = `
        <div class="table-wrap">
          <table class="simple-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              ${data.attendees
                .map(
                  (attendee) => `
                    <tr>
                      <td>${attendee.name || "Unknown"}</td>
                      <td>${attendee.email || "-"}</td>
                      <td>${attendee.role || "-"}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      metaEl.textContent = "Could not load attendees.";
      listEl.innerHTML = `<p class="status">${error.message}</p>`;
    }
  };

  load();
})();
