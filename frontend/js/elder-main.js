(() => {
  const DETAIL_ICON_MAP = {
    games: "\uD83C\uDFB2",
    food: "\uD83C\uDF7D",
    coffee: "\u2615",
    art: "\uD83C\uDFA8",
    music: "\uD83C\uDFB5",
    outdoor: "\uD83C\uDF33",
    book: "\uD83D\uDCDA",
    fitness: "\uD83E\uDDD8",
  };

  const browseContainer = document.getElementById("browseContainer");
  const myGatheringsList = document.getElementById("myGatheringsList");
  const registerBtn = document.getElementById("registerBtn");
  const DETAIL_ID_STORAGE_KEY = "elderSelectedGatheringId";

  const getStoredUser = () => {
    const raw = window.localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  };

  const getCurrentUserId = () => {
    const user = getStoredUser();
    return (user?._id || user?.id || "").toString();
  };
  const isLoggedIn = () => Boolean(window.localStorage.getItem("token"));

  const getAttendees = (gathering) =>
    Array.isArray(gathering?.attendees) ? gathering.attendees : [];

  const attendeeMatchesUser = (attendee, userId) => {
    if (!attendee || !userId) return false;
    if (typeof attendee === "string") return attendee.toString() === userId;
    return (attendee._id || attendee.id || "").toString() === userId;
  };

  const isActiveGathering = (gathering) =>
    gathering?.status === "active" || !gathering?.status;
  const isFreeForAllType = (gathering) => {
    const type = cleanText(gathering?.type).toLowerCase().replace(/[\s-]+/g, "_");
    return type === "free_for_all";
  };

  const createActionLink = (href, text, className = "primary-btn") => {
    const link = document.createElement("a");
    link.href = href;
    link.className = className;
    link.textContent = text;
    return link;
  };

  const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

  const normalizeColor = (value, fallback = "#d6dfe8") => {
    const text = cleanText(value);
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text)) {
      return text;
    }
    return fallback;
  };

  const createBrowseCard = (gathering) => {
    const wrap = document.createElement("article");
    wrap.className = "elder-card-item";

    let card = null;
    if (typeof window.createGatheringCard === "function") {
      card = window.createGatheringCard(gathering);
      wrap.appendChild(card);
    }

    const actions = document.createElement("div");
    actions.className = "gathering-card__actions";
    const viewLink = createActionLink("/elder-gathering", "View", "ghost-btn gathering-card__btn");
    viewLink.addEventListener("click", () => {
      if (gathering?._id) {
        window.sessionStorage.setItem(DETAIL_ID_STORAGE_KEY, gathering._id);
      }
    });
    actions.appendChild(viewLink);
    if (card) {
      card.appendChild(actions);
    } else {
      wrap.appendChild(actions);
    }

    return wrap;
  };

  const renderBrowse = (gatherings) => {
    if (!browseContainer) return;
    browseContainer.innerHTML = "";

    const heading = document.createElement("h2");
    heading.textContent = "Upcoming Gatherings";
    browseContainer.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "elder-gatherings-grid";

    if (gatherings.length === 0) {
      const empty = document.createElement("p");
      empty.className = "subtitle";
      empty.textContent = "No active gatherings right now.";
      browseContainer.appendChild(empty);
      return;
    }

    gatherings.forEach((gathering) => {
      grid.appendChild(createBrowseCard(gathering));
    });
    browseContainer.appendChild(grid);
  };

  const renderMyGatherings = (gatherings) => {
    if (!myGatheringsList) return;
    myGatheringsList.innerHTML = "";

    const userId = getCurrentUserId();
    if (!userId) {
      myGatheringsList.innerHTML = `
        <p class="subtitle">Please log in to see your gatherings.</p>
        <a class="primary-btn button-link" href="/login">Go to Login</a>
      `;
      return;
    }

    const mine = gatherings.filter((gathering) =>
      getAttendees(gathering).some((attendee) => attendeeMatchesUser(attendee, userId)),
    );

    if (mine.length === 0) {
      myGatheringsList.innerHTML = "<p class=\"subtitle\">No gatherings yet.</p>";
      return;
    }

    const grid = document.createElement("div");
    grid.className = "elder-gatherings-grid";
    mine.forEach((gathering) => {
      grid.appendChild(createBrowseCard(gathering));
    });
    myGatheringsList.appendChild(grid);
  };

  const populateDetails = (gathering) => {
    const card = document.getElementById("eventCard");
    const top = document.getElementById("eventTop");
    const icon = document.getElementById("eventIcon");
    const title = document.getElementById("eventTitle");
    const date = document.getElementById("eventDate");
    const time = document.getElementById("eventTime");
    const location = document.getElementById("eventLocation");
    const description = document.getElementById("eventDescription");

    const cardColor = normalizeColor(gathering.cardColor);
    const iconId = cleanText(gathering.iconId);
    const iconText = DETAIL_ICON_MAP[iconId] || "?";

    if (card) {
      card.style.setProperty("--event-accent", cardColor);
    }
    if (top) {
      top.style.background = "";
      top.style.borderColor = "";
    }
    if (icon) {
      icon.textContent = iconText;
      icon.style.color = cardColor;
      icon.style.background = `${cardColor}22`;
    }
    if (registerBtn) {
      registerBtn.style.background = cardColor;
      registerBtn.style.borderColor = cardColor;
    }
    if (title) title.textContent = gathering.name || "--";
    if (date) date.textContent = gathering.date || "--";
    if (time) {
      time.textContent = `${gathering.startTime || "--:--"} - ${gathering.endTime || "--:--"}`;
    }
    if (location) location.textContent = gathering.address || gathering.location || "--";
    if (description) description.textContent = gathering.description || "No description provided.";
  };

  const loadGatherings = async () => {
    if (!window.api || typeof window.api.get !== "function") return [];
    const data = await window.api.get("/gatherings");
    const items = Array.isArray(data) ? data : [];
    const filteredByAccess = isLoggedIn()
      ? items
      : items.filter(isFreeForAllType);
    return filteredByAccess
      .filter(isActiveGathering)
      .sort((a, b) => {
        const aValue = new Date(`${a.date || ""}T${a.startTime || "00:00"}`).getTime();
        const bValue = new Date(`${b.date || ""}T${b.startTime || "00:00"}`).getTime();
        return (Number.isNaN(aValue) ? Number.MAX_SAFE_INTEGER : aValue) - (Number.isNaN(bValue) ? Number.MAX_SAFE_INTEGER : bValue);
      });
  };

  const getDetailGatheringId = () => {
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get("id");
    if (idFromQuery) {
      window.sessionStorage.setItem(DETAIL_ID_STORAGE_KEY, idFromQuery);
      if (window.location.pathname === "/elder-gathering") {
        window.history.replaceState(null, "", "/elder-gathering");
      }
      return idFromQuery;
    }
    return window.sessionStorage.getItem(DETAIL_ID_STORAGE_KEY) || "";
  };

  const loadDetails = async () => {
    const title = document.getElementById("eventTitle");
    const isDetailsPage = Boolean(title);
    const gatheringId = getDetailGatheringId();
    if (!gatheringId || !window.api) {
      if (isDetailsPage) {
        if (title) title.textContent = "Gathering not found";
        if (registerBtn) registerBtn.disabled = true;
      }
      return;
    }

    let gathering = null;
    try {
      if (typeof window.api.getGatheringById === "function") {
        gathering = await window.api.getGatheringById(gatheringId);
      } else if (typeof window.api.get === "function") {
        gathering = await window.api.get(`/gatherings/${gatheringId}`);
      }
    } catch (_error) {
      gathering = null;
    }

    if (!gathering) {
      if (title) title.textContent = "Gathering not found";
      if (registerBtn) registerBtn.disabled = true;
      return;
    }

    populateDetails(gathering);

    if (!registerBtn) return;
    registerBtn.addEventListener("click", async () => {
      const userId = getCurrentUserId();
      if (!userId) {
        window.location.href = "/login";
        return;
      }

      registerBtn.disabled = true;
      registerBtn.textContent = "Registering...";
      try {
        await window.api.post(`/gatherings/${gathering._id}/attendees`, {});
        window.location.href = "/elder-confirmation";
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not register.";
        registerBtn.disabled = false;
        registerBtn.textContent = message.includes("already") ? "Already Joined" : "Register";
      }
    });
  };

  const init = async () => {
    try {
      const shouldLoadLists = Boolean(browseContainer || myGatheringsList);
      if (shouldLoadLists) {
        const gatherings = await loadGatherings();
        renderBrowse(gatherings);
        renderMyGatherings(gatherings);
      }
      await loadDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load gatherings.";
      if (browseContainer) browseContainer.innerHTML = `<p class="subtitle">${message}</p>`;
      if (myGatheringsList) myGatheringsList.innerHTML = `<p class="subtitle">${message}</p>`;
      const title = document.getElementById("eventTitle");
      if (title && registerBtn) {
        title.textContent = "Could not load gathering details";
        registerBtn.disabled = true;
      }
    }
  };

  init();
})();
