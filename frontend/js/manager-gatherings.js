(() => {
  const DETAIL_ID_STORAGE_KEY = "managerSelectedGatheringId";
  const listEl = document.getElementById("managerGatheringsList");
  const upcomingListEl = document.getElementById("managerUpcomingGatheringsList");
  const currentListEl = document.getElementById("managerCurrentGatheringsList");
  const pastListEl = document.getElementById("managerPastGatheringsList");
  const statusEl = document.getElementById("gatheringsStatus");

  if (!statusEl || (!listEl && !upcomingListEl && !currentListEl && !pastListEl)) return;
  if (window.managerAuth?.requireManager && !window.managerAuth.requireManager()) return;

  const rawUser = window.localStorage.getItem("user");
  const token = window.localStorage.getItem("token");

  let currentUser = null;
  try {
    currentUser = rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    currentUser = null;
  }

  const currentUserId = currentUser?._id || currentUser?.id || "";

  const setStatus = (message, type = "info") => {
    statusEl.textContent = message;
    statusEl.classList.remove("status--error", "status--success");
    if (type === "error") {
      statusEl.classList.add("status--error");
    } else if (type === "success") {
      statusEl.classList.add("status--success");
    }
  };

  const normalizeId = (value) => (value || "").toString().trim();

  const getOwnerId = (gathering) => {
    const owner = gathering?.smId;
    if (!owner) return "";
    if (typeof owner === "string") return normalizeId(owner);
    return normalizeId(owner._id || owner.id);
  };

  const getAttendees = (gathering) =>
    Array.isArray(gathering?.attendees) ? gathering.attendees : [];
  const getGuestAttendees = (gathering) =>
    Array.isArray(gathering?.guestAttendees) ? gathering.guestAttendees : [];
  const getTotalAttendeeCount = (gathering) =>
    getAttendees(gathering).length + getGuestAttendees(gathering).length;
  const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

  const toDisplayDate = (date, startTime) => {
    if (!date) return "--";
    const source = `${date}T${startTime || "00:00"}`;
    const parsed = new Date(source);
    if (Number.isNaN(parsed.getTime())) return `${date} ${startTime || ""}`.trim();
    return parsed.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toSortValue = (gathering) => {
    const source = `${gathering?.date || ""}T${gathering?.startTime || "00:00"}`;
    const parsed = new Date(source).getTime();
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  };
  const getGatheringTimestamp = (gathering, timeValue) => {
    const dateText = cleanText(gathering?.date);
    const normalizedTime = cleanText(timeValue) || "00:00";
    const timestamp = new Date(`${dateText}T${normalizedTime}`).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  };
  const getGatheringStartTimestamp = (gathering) => {
    const startText = cleanText(gathering?.startTime) || "00:00";
    return getGatheringTimestamp(gathering, startText);
  };
  const getGatheringEndTimestamp = (gathering) => {
    const endText = cleanText(gathering?.endTime) || cleanText(gathering?.startTime) || "23:59";
    const timestamp = getGatheringTimestamp(gathering, endText);
    if (timestamp === null) return null;
    const startTimestamp = getGatheringStartTimestamp(gathering);
    if (startTimestamp !== null && timestamp < startTimestamp) {
      return timestamp + 24 * 60 * 60 * 1000;
    }
    return Number.isNaN(timestamp) ? null : timestamp;
  };
  const isActiveGathering = (gathering) => gathering?.status === "active";
  const isUpcomingGathering = (gathering) => {
    if (!isActiveGathering(gathering)) return false;
    const startTimestamp = getGatheringStartTimestamp(gathering);
    if (startTimestamp === null) return false;
    return startTimestamp > Date.now();
  };
  const isCurrentGathering = (gathering) => {
    if (!isActiveGathering(gathering)) return false;
    const now = Date.now();
    const startTimestamp = getGatheringStartTimestamp(gathering);
    const endTimestamp = getGatheringEndTimestamp(gathering);
    if (startTimestamp === null || endTimestamp === null) return false;
    return startTimestamp <= now && endTimestamp > now;
  };
  const isPastGathering = (gathering) => {
    if (!isActiveGathering(gathering)) return true;
    const endTimestamp = getGatheringEndTimestamp(gathering);
    if (endTimestamp === null) return false;
    return endTimestamp <= Date.now();
  };

  const formatType = (value) => {
    if (!value) return "--";
    return value
      .toString()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const makeText = (tag, className, value) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = value;
    return el;
  };

  const makeMeta = (label, value) => {
    const row = document.createElement("p");
    row.className = "manager-gathering-meta";

    const labelEl = document.createElement("strong");
    labelEl.textContent = `${label}: `;
    row.appendChild(labelEl);
    row.appendChild(document.createTextNode(value));
    return row;
  };

  const renderEmpty = (container, message, withCta = false) => {
    if (!container) return;
    container.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.appendChild(makeText("p", "empty-title", "No gatherings yet"));
    empty.appendChild(makeText("p", "subtitle", message));

    if (withCta) {
      const link = document.createElement("a");
      link.className = "primary-btn button-link";
      link.href = "/manager-create-gathering";
      link.textContent = "Create your first gathering";
      empty.appendChild(link);
    }

    container.appendChild(empty);
  };

  const updateGatheringStatus = async (gathering, nextStatus, button) => {
    if (!window.api || typeof window.api.patch !== "function") {
      setStatus("API client is not available on this page.", "error");
      return;
    }

    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Saving...";

    try {
      const updated = await window.api.patch(`/gatherings/${gathering._id}`, { status: nextStatus });
      gathering.status = updated?.status || nextStatus;
      setStatus(`Updated "${gathering.name}" to ${gathering.status}.`, "success");
      await loadGatherings();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not update gathering status.";
      setStatus(message, "error");
      button.textContent = previousText;
    } finally {
      button.disabled = false;
    }
  };

  const renderGathering = (gathering) => {
    const item = document.createElement("article");
    item.className = "card manager-gathering-item";

    const content = document.createElement("div");
    content.className = "manager-gathering-details";
    content.appendChild(makeText("h3", "manager-gathering-title", gathering.name || "--"));
    content.appendChild(
      makeMeta(
        "When",
        toDisplayDate(
          gathering.date,
          gathering.startTime,
        ),
      ),
    );
    content.appendChild(makeMeta("Where", gathering.address || "--"));
    content.appendChild(makeMeta("Type", formatType(gathering.type)));
    content.appendChild(
      makeText(
        "p",
        "manager-gathering-description",
        gathering.description || "No description provided.",
      ),
    );

    const top = document.createElement("div");
    top.className = "manager-gathering-top";

    const countWrap = document.createElement("div");
    countWrap.appendChild(makeText("p", "eyebrow", "People Coming"));
    countWrap.appendChild(
      makeText(
        "p",
        "manager-gathering-count",
        String(getTotalAttendeeCount(gathering)),
      ),
    );

    const badge = document.createElement("span");
    const isActive = gathering.status === "active";
    badge.className = `gathering-card__badge ${
      isActive ? "gathering-card__badge--active" : "gathering-card__badge--inactive"
    }`;
    badge.textContent = isActive ? "Active" : "Inactive";

    top.appendChild(countWrap);
    top.appendChild(badge);

    content.appendChild(top);
    content.appendChild(
      makeMeta(
        "Time",
        `${gathering.startTime || "--:--"} - ${gathering.endTime || "--:--"}`,
      ),
    );
    content.appendChild(makeMeta("Status", gathering.status || "--"));
    content.appendChild(
      makeMeta(
        "Created",
        gathering.createdAt
          ? new Date(gathering.createdAt).toLocaleDateString()
          : "--",
      ),
    );

    const actions = document.createElement("div");
    actions.className = "button-grid manager-gathering-actions";

    const detailsLink = document.createElement("a");
    detailsLink.className = "primary-btn button-link";
    detailsLink.href = "/manager-gathering-detail";
    detailsLink.textContent = "Details";
    detailsLink.addEventListener("click", (event) => {
      event.preventDefault();
      if (gathering?._id) {
        window.sessionStorage.setItem(DETAIL_ID_STORAGE_KEY, gathering._id);
      }
      window.location.href = "/manager-gathering-detail";
    });

    const toggleStatusBtn = document.createElement("button");
    toggleStatusBtn.type = "button";
    toggleStatusBtn.className = isActive ? "secondary-btn" : "primary-btn";
    toggleStatusBtn.textContent = isActive ? "Mark inactive" : "Mark active";
    toggleStatusBtn.addEventListener("click", () => {
      const nextStatus = gathering.status === "active" ? "inactive" : "active";
      updateGatheringStatus(gathering, nextStatus, toggleStatusBtn);
    });

    actions.appendChild(detailsLink);
    actions.appendChild(toggleStatusBtn);
    content.appendChild(actions);
    item.appendChild(content);

    return item;
  };

  const renderGatheringsTo = (container, gatherings, emptyMessage, sortDescending = false) => {
    if (!container) return;
    container.innerHTML = "";
    const ordered = [...gatherings].sort((a, b) => {
      if (sortDescending) return toSortValue(b) - toSortValue(a);
      return toSortValue(a) - toSortValue(b);
    });
    if (ordered.length === 0) {
      renderEmpty(container, emptyMessage);
      return;
    }
    ordered.forEach((gathering) => {
      container.appendChild(renderGathering(gathering));
    });
  };

  async function loadGatherings() {
    if (!token || !currentUserId) {
      setStatus("Please log in as a manager to view your gatherings.", "error");
      renderEmpty(listEl || upcomingListEl || currentListEl || pastListEl, "Sign in first, then create and manage gatherings here.");
      return;
    }

    if (!window.api || typeof window.api.get !== "function") {
      setStatus("API client is not available on this page.", "error");
      return;
    }

    try {
      setStatus("Loading your gatherings...");
      const allGatherings = await window.api.get("/gatherings");
      const items = Array.isArray(allGatherings) ? allGatherings : [];

      const ownGatherings = items
        .filter(
          (gathering) =>
            normalizeId(getOwnerId(gathering)) === normalizeId(currentUserId),
        )
        .sort((a, b) => toSortValue(a) - toSortValue(b));

      if (ownGatherings.length === 0) {
        setStatus("No gatherings found for your account yet.");
        if (listEl) {
          renderEmpty(listEl, "Once you create a gathering, it will appear here.", true);
        }
        renderGatheringsTo(upcomingListEl, [], "No upcoming gatherings right now.");
        renderGatheringsTo(currentListEl, [], "No current gatherings right now.");
        renderGatheringsTo(pastListEl, [], "No past gatherings available.");
        return;
      }

      const upcoming = ownGatherings.filter(isUpcomingGathering);
      const current = ownGatherings.filter(isCurrentGathering);
      const past = ownGatherings.filter(isPastGathering);

      if (listEl) {
        renderGatheringsTo(listEl, ownGatherings, "No gatherings available.");
      }
      renderGatheringsTo(upcomingListEl, upcoming, "No upcoming gatherings right now.");
      renderGatheringsTo(currentListEl, current, "No current gatherings right now.");
      renderGatheringsTo(pastListEl, past, "No past gatherings available.", true);

      const totalAttendees = ownGatherings.reduce(
        (sum, gathering) => sum + getTotalAttendeeCount(gathering),
        0,
      );
      if (pastListEl && !upcomingListEl && !currentListEl) {
        setStatus(
          `Showing ${past.length} past gathering(s) with ${totalAttendees} total attendee(s).`,
          "success",
        );
      } else if (upcomingListEl || currentListEl) {
        setStatus(
          `Showing ${upcoming.length} upcoming and ${current.length} current gathering(s).`,
          "success",
        );
      } else {
        setStatus(
          `Showing ${ownGatherings.length} gathering(s) with ${totalAttendees} total attendee(s).`,
          "success",
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load gatherings.";
      setStatus(`Failed to load gatherings: ${message}`, "error");
      if (listEl) listEl.innerHTML = "";
      if (upcomingListEl) upcomingListEl.innerHTML = "";
      if (currentListEl) currentListEl.innerHTML = "";
      if (pastListEl) pastListEl.innerHTML = "";
    }
  }

  loadGatherings();
})();
