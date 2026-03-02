(() => {
  const statusEl = document.getElementById("adminDashboardStatus");
  const statsEl = document.getElementById("adminDashboardStats");
  const upcomingEl = document.getElementById("adminUpcomingList");

  const setStatus = (text, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("status--error", isError);
  };

  const metricCard = (label, value) => `
    <article class="metric-card">
      <p class="metric-card__label">${label}</p>
      <p class="metric-card__value">${value}</p>
    </article>
  `;

  const formatWhen = (g) => `${g?.date || "--"} ${g?.startTime || "--:--"}-${g?.endTime || "--:--"}`;

  const renderUpcoming = (items) => {
    if (!upcomingEl) return;
    if (!items.length) {
      upcomingEl.innerHTML = `<div class="list-card"><h3>Upcoming Gatherings</h3><p class="subtitle">No upcoming gatherings.</p></div>`;
      return;
    }

    const cards = items
      .map(
        (g) => `
      <article class="list-card">
        <h3>${g?.name || "Gathering"}</h3>
        <p class="subtitle">${formatWhen(g)}</p>
        <p class="subtitle">${g?.address || "-"}</p>
        <a class="secondary-btn button-link" href="/admin-gathering-detail?id=${encodeURIComponent(g?._id || "")}">Open</a>
      </article>
    `
      )
      .join("");

    upcomingEl.innerHTML = `<h3>Upcoming Gatherings</h3>${cards}`;
  };

  const init = async () => {
    const user = await window.adminAuth?.requireAdmin?.();
    if (!user) return;

    try {
      const [applications, summary] = await Promise.all([
        window.api.get("/sm-applications"),
        window.api.get("/gatherings/manager/summary"),
      ]);

      const appList = Array.isArray(applications) ? applications : [];
      const pendingCount = appList.filter((a) => (a?.status || "").toLowerCase() === "pending").length;
      const approvedCount = appList.filter((a) => (a?.status || "").toLowerCase() === "approved").length;
      const rejectedCount = appList.filter((a) => ["rejected", "denied"].includes((a?.status || "").toLowerCase())).length;
      const cancelledCount = Number(summary?.cancelled || 0);

      if (statsEl) {
        statsEl.innerHTML = [
          metricCard("Pending applications", pendingCount),
          metricCard("Approved applications", approvedCount),
          metricCard("Rejected applications", rejectedCount),
          metricCard("Upcoming gatherings", Array.isArray(summary?.upcoming) ? summary.upcoming.length : 0),
          metricCard("Flagged/Cancelled", cancelledCount),
          metricCard("Total attendees", Number(summary?.attendees || 0)),
        ].join("");
      }

      renderUpcoming(Array.isArray(summary?.upcoming) ? summary.upcoming : []);
      setStatus("Dashboard loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load dashboard.", true);
    }
  };

  init();
})();
