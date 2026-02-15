(() => {
  const listEl = document.getElementById("managerGatheringsList");
  const statusEl = document.getElementById("gatheringsStatus");

  if (!listEl || !statusEl) return;

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

  const toDisplayDate = (date, time) => {
    if (!date) return "--";
    const source = `${date}T${time || "00:00"}`;
    const parsed = new Date(source);
    if (Number.isNaN(parsed.getTime())) return `${date} ${time || ""}`.trim();
    return parsed.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toSortValue = (gathering) => {
    const source = `${gathering?.date || ""}T${gathering?.time || "00:00"}`;
    const parsed = new Date(source).getTime();
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  };

  const formatAttendeeName = (attendee) => {
    if (!attendee) return "Unknown attendee";
    if (typeof attendee === "string") return "Registered attendee";
    return attendee.name || attendee.email || "Registered attendee";
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

  const renderEmpty = (message) => {
    listEl.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.appendChild(makeText("p", "empty-title", "No gatherings yet"));
    empty.appendChild(makeText("p", "subtitle", message));

    const link = document.createElement("a");
    link.className = "primary-btn button-link";
    link.href = "/manager-create-gathering";
    link.textContent = "Create your first gathering";
    empty.appendChild(link);

    listEl.appendChild(empty);
  };

  const updateGatheringStatus = async (gathering, nextStatus, button, badge) => {
    if (!window.api || typeof window.api.patch !== "function") {
      setStatus("API client is not available on this page.", "error");
      return;
    }

    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "Saving...";

    try {
      const updated = await window.api.patch(`/gatherings/${gathering._id}`, {
        status: nextStatus,
      });

      gathering.status = updated?.status || nextStatus;

      const isActive = gathering.status === "active";
      badge.textContent = isActive ? "Active" : "Inactive";
      badge.className = `gathering-card__badge ${
        isActive ? "gathering-card__badge--active" : "gathering-card__badge--inactive"
      }`;

      button.textContent = isActive ? "Mark inactive" : "Mark active";
      button.className = isActive ? "secondary-btn" : "primary-btn";

      setStatus(`Updated "${gathering.name}" to ${gathering.status}.`, "success");
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

    const grid = document.createElement("div");
    grid.className = "manager-gathering-grid";

    const cardWrap = document.createElement("div");
    cardWrap.className = "manager-gathering-card-wrap";
    if (typeof window.createGatheringCard === "function") {
      cardWrap.appendChild(window.createGatheringCard(gathering));
    } else {
      cardWrap.appendChild(
        makeText("p", "subtitle", "Card preview is unavailable on this page."),
      );
    }

    const side = document.createElement("div");
    side.className = "manager-gathering-details";

    const top = document.createElement("div");
    top.className = "manager-gathering-top";

    const countWrap = document.createElement("div");
    countWrap.appendChild(makeText("p", "eyebrow", "People Coming"));
    countWrap.appendChild(
      makeText(
        "p",
        "manager-gathering-count",
        String(getAttendees(gathering).length),
      ),
    );

    const badge = document.createElement("span");
    const isActive = gathering.status !== "inactive";
    badge.className = `gathering-card__badge ${
      isActive ? "gathering-card__badge--active" : "gathering-card__badge--inactive"
    }`;
    badge.textContent = isActive ? "Active" : "Inactive";

    top.appendChild(countWrap);
    top.appendChild(badge);

    side.appendChild(top);
    side.appendChild(makeMeta("When", toDisplayDate(gathering.date, gathering.time)));
    side.appendChild(makeMeta("Location", gathering.location || "--"));
    side.appendChild(
      makeMeta(
        "Created",
        gathering.createdAt
          ? new Date(gathering.createdAt).toLocaleDateString()
          : "--",
      ),
    );

    const attendeesLabel = makeText("p", "manager-gathering-subtitle", "Attendees");
    side.appendChild(attendeesLabel);

    const attendees = getAttendees(gathering);
    if (attendees.length === 0) {
      side.appendChild(makeText("p", "help", "No attendees yet."));
    } else {
      const list = document.createElement("ul");
      list.className = "manager-attendee-list";

      attendees.slice(0, 6).forEach((attendee) => {
        const li = document.createElement("li");
        li.textContent = formatAttendeeName(attendee);
        list.appendChild(li);
      });

      if (attendees.length > 6) {
        const li = document.createElement("li");
        li.textContent = `+${attendees.length - 6} more`;
        list.appendChild(li);
      }

      side.appendChild(list);
    }

    const actions = document.createElement("div");
    actions.className = "button-grid manager-gathering-actions";

    const toggleStatusBtn = document.createElement("button");
    toggleStatusBtn.type = "button";
    toggleStatusBtn.className = isActive ? "secondary-btn" : "primary-btn";
    toggleStatusBtn.textContent = isActive ? "Mark inactive" : "Mark active";
    toggleStatusBtn.addEventListener("click", () => {
      const nextStatus = gathering.status === "inactive" ? "active" : "inactive";
      updateGatheringStatus(gathering, nextStatus, toggleStatusBtn, badge);
    });

    actions.appendChild(toggleStatusBtn);
    side.appendChild(actions);

    grid.appendChild(cardWrap);
    grid.appendChild(side);
    item.appendChild(grid);

    return item;
  };

  const loadGatherings = async () => {
    if (!token || !currentUserId) {
      setStatus("Please log in as a manager to view your gatherings.", "error");
      renderEmpty("Sign in first, then create and manage gatherings here.");
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
        renderEmpty("Once you create a gathering, it will appear here.");
        return;
      }

      listEl.innerHTML = "";
      ownGatherings.forEach((gathering) => {
        listEl.appendChild(renderGathering(gathering));
      });

      const totalAttendees = ownGatherings.reduce(
        (sum, gathering) => sum + getAttendees(gathering).length,
        0,
      );
      setStatus(
        `Showing ${ownGatherings.length} gathering(s) with ${totalAttendees} total attendee(s).`,
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load gatherings.";
      setStatus(`Failed to load gatherings: ${message}`, "error");
      listEl.innerHTML = "";
    }
  };

  loadGatherings();
})();
