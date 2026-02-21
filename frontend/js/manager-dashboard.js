(() => {
  if (!window.managerAuth?.requireManager()) return;

  const welcomeName = document.getElementById("welcomeName");
  const summaryCards = document.getElementById("summaryCards");
  const upcomingList = document.getElementById("upcomingList");
  const user = window.managerAuth.getStoredUser();
  if (welcomeName) {
    welcomeName.textContent = user?.name ? `Welcome ${user.name}` : "Welcome";
  }

  const formatTimeRange = (item) => {
    const start = item.startTime || item.time || "--:--";
    const end = item.endTime || "";
    return end ? `${start} - ${end}` : start;
  };

  const renderSummary = (summary) => {
    if (!summaryCards) return;
    const cards = [
      { label: "Total Gatherings", value: summary.total || 0 },
      { label: "Active", value: summary.active || 0 },
      { label: "Draft", value: summary.draft || 0 },
      { label: "Cancelled", value: summary.cancelled || 0 },
      { label: "Total Attendees", value: summary.attendees || 0 },
    ];

    summaryCards.innerHTML = cards
      .map(
        (card) => `
          <article class="metric-card">
            <p class="metric-card__label">${card.label}</p>
            <p class="metric-card__value">${card.value}</p>
          </article>
        `
      )
      .join("");
  };

  const renderUpcoming = (summary) => {
    if (!upcomingList) return;
    const items = summary.upcoming || [];
    if (!items.length) {
      upcomingList.innerHTML = `<p class="subtitle">No gatherings yet.</p>`;
      return;
    }

    upcomingList.innerHTML = items
      .map(
        (item) => `
        <article class="list-card">
          <div>
            <h3>${item.name}</h3>
            <p class="subtitle">${item.date} | ${formatTimeRange(item)} | ${item.location}</p>
          </div>
          <a class="secondary-btn button-link" href="/manager-edit-gathering?id=${item._id}">Edit</a>
        </article>
      `
      )
      .join("");
  };

  const load = async () => {
    try {
      const summary = await window.api.get("/gatherings/manager/summary");
      renderSummary(summary);
      renderUpcoming(summary);
    } catch (error) {
      if (summaryCards) {
        summaryCards.innerHTML = `<p class="status">Could not load summary: ${error.message}</p>`;
      }
      if (upcomingList) {
        upcomingList.innerHTML = "";
      }
    }
  };

  load();
})();
