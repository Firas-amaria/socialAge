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
  const currentGatheringsList = document.getElementById("currentGatheringsList");
  const pastGatheringsList = document.getElementById("pastGatheringsList");
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
  const isDashboardPath = () =>
    window.location.pathname === "/" || window.location.pathname === "/elder-dashboard";
  const isAdminRole = (role) => role === "Admin";
  const isManagerRole = (role) => role === "SocialM";

  const redirectManagerAwayFromElderDashboard = async () => {
    if (!isDashboardPath()) return false;

    const token = window.localStorage.getItem("token");
    if (!token) return false;

    const localUser = getStoredUser();
    if (isAdminRole(localUser?.role)) {
      window.location.href = "/admin-dashboard";
      return true;
    }
    if (isManagerRole(localUser?.role)) {
      window.location.href = "/manager-dashboard";
      return true;
    }

    if (!window.api || typeof window.api.get !== "function") return false;

    try {
      const freshUser = await window.api.get("/users/me");
      if (freshUser) {
        window.localStorage.setItem("user", JSON.stringify(freshUser));
      }
      if (isAdminRole(freshUser?.role)) {
        window.location.href = "/admin-dashboard";
        return true;
      }
      if (isManagerRole(freshUser?.role)) {
        window.location.href = "/manager-dashboard";
        return true;
      }
    } catch (_error) {
      // Ignore and continue as elder if profile refresh fails.
    }

    return false;
  };

  const getAttendees = (gathering) =>
    Array.isArray(gathering?.attendees) ? gathering.attendees : [];

  const attendeeMatchesUser = (attendee, userId) => {
    if (!attendee || !userId) return false;
    if (typeof attendee === "string") return attendee.toString() === userId;
    return (attendee._id || attendee.id || "").toString() === userId;
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
  const isFreeForAllType = (gathering) => {
    const type = cleanText(gathering?.type).toLowerCase().replace(/[\s-]+/g, "_");
    return type === "free_for_all";
  };
  const isCurrentUserRegistered = (gathering) => {
    if (!isLoggedIn()) return false;
    const userId = getCurrentUserId();
    if (!userId) return false;
    return getAttendees(gathering).some((attendee) => attendeeMatchesUser(attendee, userId));
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

  const openGuestRegistrationModal = (gatheringName) =>
    new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(0,0,0,0.45)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "10000";
      overlay.style.padding = "16px";

      const panel = document.createElement("div");
      panel.style.background = "#fff";
      panel.style.borderRadius = "12px";
      panel.style.padding = "16px";
      panel.style.width = "100%";
      panel.style.maxWidth = "420px";
      panel.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
      panel.innerHTML = `
        <h3 style="margin:0 0 8px 0;">Register for ${cleanText(gatheringName) || "this gathering"}</h3>
        <p class="subtitle" style="margin:0 0 12px 0;">Enter your name and email to register.</p>
        <label style="display:block;margin-bottom:8px;">
          <span style="display:block;font-size:14px;margin-bottom:4px;">Name</span>
          <input id="guestRegisterName" type="text" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;" />
        </label>
        <label style="display:block;margin-bottom:8px;">
          <span style="display:block;font-size:14px;margin-bottom:4px;">Email</span>
          <input id="guestRegisterEmail" type="email" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;" />
        </label>
        <p id="guestRegisterError" style="color:#b00020;min-height:20px;margin:0 0 10px 0;"></p>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button type="button" id="guestCancelBtn" class="secondary-btn">Cancel</button>
          <button type="button" id="guestSubmitBtn" class="primary-btn">Submit</button>
        </div>
      `;
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      const nameInput = panel.querySelector("#guestRegisterName");
      const emailInput = panel.querySelector("#guestRegisterEmail");
      const errorEl = panel.querySelector("#guestRegisterError");
      const cancelBtn = panel.querySelector("#guestCancelBtn");
      const submitBtn = panel.querySelector("#guestSubmitBtn");

      const cleanup = () => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      };

      cancelBtn.addEventListener("click", () => {
        cleanup();
        resolve(null);
      });

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          cleanup();
          resolve(null);
        }
      });

      submitBtn.addEventListener("click", () => {
        const guestName = cleanText(nameInput.value);
        const guestEmail = cleanText(emailInput.value).toLowerCase();
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);
        if (!guestName) {
          errorEl.textContent = "Please enter your name.";
          return;
        }
        if (!isEmail) {
          errorEl.textContent = "Please enter a valid email.";
          return;
        }
        cleanup();
        resolve({ guestName, guestEmail });
      });
    });

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
      empty.textContent = "No upcoming active gatherings right now.";
      browseContainer.appendChild(empty);
      return;
    }

    gatherings.forEach((gathering) => {
      grid.appendChild(createBrowseCard(gathering));
    });
    browseContainer.appendChild(grid);
  };

  const renderGatheringsGrid = (container, gatherings, emptyText) => {
    if (!container) return;
    container.innerHTML = "";
    if (gatherings.length === 0) {
      container.innerHTML = `<p class="subtitle">${emptyText}</p>`;
      return;
    }
    const grid = document.createElement("div");
    grid.className = "elder-gatherings-grid";
    gatherings.forEach((gathering) => {
      grid.appendChild(createBrowseCard(gathering));
    });
    container.appendChild(grid);
  };

  const getMyGatherings = (gatherings) => {
    const userId = getCurrentUserId();
    if (!userId) return null;
    return gatherings.filter((gathering) =>
      getAttendees(gathering).some((attendee) => attendeeMatchesUser(attendee, userId)),
    );
  };

  const renderMyGatherings = (gatherings) => {
    if (!myGatheringsList) return;
    const mine = getMyGatherings(gatherings);
    if (!mine) {
      myGatheringsList.innerHTML = `
        <p class="subtitle">Please log in to see your gatherings.</p>
        <a class="primary-btn button-link" href="/login">Go to Login</a>
      `;
      return;
    }
    renderGatheringsGrid(myGatheringsList, mine, "No upcoming gatherings yet.");
  };

  const renderCurrentGatherings = (gatherings) => {
    if (!currentGatheringsList) return;
    const mine = getMyGatherings(gatherings);
    if (!mine) {
      currentGatheringsList.innerHTML = `
        <p class="subtitle">Please log in to see your current gatherings.</p>
        <a class="primary-btn button-link" href="/login">Go to Login</a>
      `;
      return;
    }
    renderGatheringsGrid(
      currentGatheringsList,
      mine.filter(isCurrentGathering),
      "No current gatherings right now.",
    );
  };

  const renderPastGatherings = (gatherings) => {
    if (!pastGatheringsList) return;
    const pastItems = gatherings
      .filter(isPastGathering)
      .sort((a, b) => {
        const aValue = getGatheringEndTimestamp(a) ?? 0;
        const bValue = getGatheringEndTimestamp(b) ?? 0;
        return bValue - aValue;
      });
    renderGatheringsGrid(pastGatheringsList, pastItems, "No past gatherings available.");
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
      .sort((a, b) => {
        const aValue = getGatheringStartTimestamp(a);
        const bValue = getGatheringStartTimestamp(b);
        const normalizedA = aValue === null ? Number.MAX_SAFE_INTEGER : aValue;
        const normalizedB = bValue === null ? Number.MAX_SAFE_INTEGER : bValue;
        return normalizedA - normalizedB;
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
    if (isCurrentUserRegistered(gathering)) {
      registerBtn.disabled = true;
      registerBtn.textContent = "Registered";
      registerBtn.classList.add("is-registered");
      registerBtn.style.background = "#a4b5cb";
      registerBtn.style.borderColor = "#a4b5cb";
      return;
    }

    registerBtn.addEventListener("click", async () => {
      registerBtn.disabled = true;
      registerBtn.textContent = "Registering...";
      try {
        const emailStatusMessage = (result) => {
          const status = result?.registrationEmail;
          if (!status) return "Registration completed.";
          if (status.sent) return "Registration completed. Confirmation email sent.";
          if (status.reason === "already_registered") return "Registration successfully.";
          if (status.reason === "smtp_not_configured") return "Registration completed. Email not sent (SMTP not configured).";
          if (status.reason === "send_failed") return "Registration completed, but email sending failed.";
          return "Registration completed.";
        };

        if (isLoggedIn()) {
          const result = await window.api.post(`/gatherings/${gathering._id}/attendees`, {});
          window.alert(emailStatusMessage(result));
          window.location.href = "/elder-dashboard";
        } else {
          if (!isFreeForAllType(gathering)) {
            window.location.href = "/login";
            return;
          }
          const guestPayload = await openGuestRegistrationModal(gathering.name);
          if (!guestPayload) {
            registerBtn.disabled = false;
            registerBtn.textContent = "Register";
            return;
          }
          const result = await window.api.post(`/gatherings/${gathering._id}/attendees`, guestPayload);
          window.alert(emailStatusMessage(result));
          window.location.href = "/elder-dashboard";
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not register.";
        if (message.toLowerCase().includes("already")) {
          window.alert("Registration successfully.");
          window.location.href = "/elder-dashboard";
          return;
        }
        registerBtn.disabled = false;
        registerBtn.textContent = "Register";
      }
    });
  };

  const init = async () => {
    try {
      const redirected = await redirectManagerAwayFromElderDashboard();
      if (redirected) return;

      const shouldLoadLists = Boolean(browseContainer || myGatheringsList);
      const shouldLoadCurrent = Boolean(currentGatheringsList);
      const shouldLoadPast = Boolean(pastGatheringsList);
      if (shouldLoadLists || shouldLoadCurrent || shouldLoadPast) {
        const gatherings = await loadGatherings();
        const upcomingActive = gatherings.filter(isUpcomingGathering);
        renderBrowse(upcomingActive);
        renderMyGatherings(upcomingActive);
        renderCurrentGatherings(gatherings);
        renderPastGatherings(gatherings);
      }
      await loadDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load gatherings.";
      if (browseContainer) browseContainer.innerHTML = `<p class="subtitle">${message}</p>`;
      if (myGatheringsList) myGatheringsList.innerHTML = `<p class="subtitle">${message}</p>`;
      if (currentGatheringsList) currentGatheringsList.innerHTML = `<p class="subtitle">${message}</p>`;
      if (pastGatheringsList) pastGatheringsList.innerHTML = `<p class="subtitle">${message}</p>`;
      const title = document.getElementById("eventTitle");
      if (title && registerBtn) {
        title.textContent = "Could not load gathering details";
        registerBtn.disabled = true;
      }
    }
  };

  init();
})();
