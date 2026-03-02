(() => {
  const statusEl = document.getElementById("adminApplicationsStatus");
  const bodyEl = document.getElementById("adminApplicationsBody");
  const filterEl = document.getElementById("applicationStatusFilter");

  let allItems = [];

  const setStatus = (text, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("status--error", isError);
  };

  const normalizeStatus = (value) => {
    const s = (value || "").toLowerCase();
    return s === "denied" ? "rejected" : s;
  };

  const render = () => {
    if (!bodyEl) return;

    const selected = filterEl?.value || "all";
    const filtered =
      selected === "all" ? allItems : allItems.filter((item) => normalizeStatus(item?.status) === selected);

    if (!filtered.length) {
      bodyEl.innerHTML = `<tr><td colspan="5">No applications found.</td></tr>`;
      return;
    }

    bodyEl.innerHTML = filtered
      .map((item) => {
        const user = item?.userId || {};
        const submitted = item?.createdAt ? new Date(item.createdAt).toLocaleString() : "-";
        return `
          <tr>
            <td>${item?.fullName || user?.name || "-"}</td>
            <td>${user?.email || "-"}</td>
            <td>${normalizeStatus(item?.status) || "-"}</td>
            <td>${submitted}</td>
            <td>
              <a class="secondary-btn button-link" href="/admin-application-review?id=${encodeURIComponent(
                item?._id || ""
              )}">Review</a>
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
      const data = await window.api.get("/sm-applications");
      allItems = Array.isArray(data) ? data : [];
      render();
      setStatus(`Loaded ${allItems.length} applications.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load applications.", true);
    }
  };

  filterEl?.addEventListener("change", render);
  init();
})();
