(() => {
  const statusEl = document.getElementById("adminGatheringsStatus");
  const bodyEl = document.getElementById("adminGatheringsBody");
  const searchEl = document.getElementById("adminGatheringsSearch");
  const filterEl = document.getElementById("adminGatheringsStatusFilter");

  let allItems = [];

  const setStatus = (text, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("status--error", isError);
  };

  const normalize = (value) => (value || "").toString().trim().toLowerCase();

  const render = () => {
    if (!bodyEl) return;
    const q = normalize(searchEl?.value);
    const selected = normalize(filterEl?.value || "all");

    const filtered = allItems.filter((item) => {
      const status = normalize(item?.status);
      const managerName = normalize(item?.smId?.name);
      const haystack = [item?.name, item?.address, managerName].map(normalize).join(" ");
      const statusMatch = selected === "all" || status === selected;
      const queryMatch = !q || haystack.includes(q);
      return statusMatch && queryMatch;
    });

    if (!filtered.length) {
      bodyEl.innerHTML = `<tr><td colspan="6">No gatherings found.</td></tr>`;
      return;
    }

    bodyEl.innerHTML = filtered
      .map((item) => {
        const attendeeCount =
          (Array.isArray(item?.attendees) ? item.attendees.length : 0) +
          (Array.isArray(item?.guestAttendees) ? item.guestAttendees.length : 0);
        return `
          <tr>
            <td>${item?.name || "-"}</td>
            <td>${item?.date || "-"} ${item?.startTime || "--:--"}</td>
            <td>${item?.status || "-"}</td>
            <td>${item?.smId?.name || "-"}</td>
            <td>${attendeeCount}</td>
            <td>
              <a class="secondary-btn button-link" href="/admin-gathering-detail?id=${encodeURIComponent(
                item?._id || ""
              )}">Open</a>
            </td>
          </tr>
        `;
      })
      .join("");
  };

  const init = async () => {
    const user = await window.adminAuth?.requireAdmin?.();
    if (!user) return;

    try {
      const data = await window.api.get("/gatherings");
      allItems = Array.isArray(data) ? data : [];
      render();
      setStatus(`Loaded ${allItems.length} gatherings.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load gatherings.", true);
    }
  };

  searchEl?.addEventListener("input", render);
  filterEl?.addEventListener("change", render);
  init();
})();
