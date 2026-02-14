(() => {
  const form = document.getElementById("gatheringForm");
  if (!form) {
    throw new Error("Gathering form not found.");
  }

  const fields = {
    name: document.getElementById("gatheringName"),
    date: document.getElementById("gatheringDate"),
    time: document.getElementById("gatheringTime"),
    location: document.getElementById("gatheringLocation"),
    iconId: Array.from(document.querySelectorAll('input[name="iconId"]')),
    cardColor: Array.from(document.querySelectorAll('input[name="cardColor"]')),
    description: document.getElementById("description"),
    type: document.getElementById("type"),
  };

  const errors = {
    gatheringName: document.getElementById("gatheringNameError"),
    gatheringDate: document.getElementById("gatheringDateError"),
    gatheringTime: document.getElementById("gatheringTimeError"),
    gatheringLocation: document.getElementById("gatheringLocationError"),
    iconId: document.getElementById("iconIdError"),
    cardColor: document.getElementById("cardColorError"),
    description: document.getElementById("descriptionError"),
    type: document.getElementById("typeError"),
  };

  const previewContainer = document.getElementById("previewCard");
  const previewDebug = document.getElementById("previewDebug");
  const formStatus = document.getElementById("formStatus");

  const modal = document.getElementById("confirmModal");
  const confirmPreview = document.getElementById("confirmPreview");
  const confirmYesBtn = document.getElementById("confirmYesBtn");
  const modalCloseButtons = modal
    ? modal.querySelectorAll("[data-modal-close]")
    : [];

  const setError = (fieldId, message) => {
    const errorEl = errors[fieldId];
    if (errorEl) {
      errorEl.textContent = message;
    }
    const inputEl = document.getElementById(fieldId);
    if (inputEl) {
      inputEl.classList.toggle("invalid", Boolean(message));
    }
    const groupEl = document.querySelector(`[data-field="${fieldId}"]`);
    if (groupEl) {
      groupEl.classList.toggle("invalid", Boolean(message));
    }
  };

  const clearErrors = () => {
    setError("gatheringName", "");
    setError("gatheringDate", "");
    setError("gatheringTime", "");
    setError("gatheringLocation", "");
    setError("iconId", "");
    setError("cardColor", "");
    setError("description", "");
    setError("type", "");
  };

  const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
  const isValidTime = (value) => /^\d{2}:\d{2}$/.test(value);
  const isValidHex = (value) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

  const normalizeColor = (value) => {
    const trimmed = (value || "").trim();
    return isValidHex(trimmed) ? trimmed : "#d6dfe8";
  };

  const getRadioValue = (name) => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  };

  const buildPayload = () => ({
    name: fields.name.value.trim(),
    date: fields.date.value.trim(),
    time: fields.time.value.trim(),
    location: fields.location.value.trim(),
    iconId: getRadioValue("iconId"),
    cardColor: normalizeColor(getRadioValue("cardColor")),
    description: fields.description.value.trim(),
    status: "active",
    type: fields.type.value,
  });

  const updatePreview = () => {
    if (!previewContainer) return;
    if (typeof window.createGatheringCard !== "function") {
      if (previewDebug) {
        previewDebug.textContent = "Preview error: card builder not loaded.";
      }
      console.warn("[Gathering Preview] createGatheringCard is not available.");
      return;
    }

    const payload = buildPayload();
    previewContainer.innerHTML = "";
    previewContainer.appendChild(window.createGatheringCard(payload));
    // dd/mm/yyyy, hh:mm format for preview debug

    const formatDate = (payload) => {
      const [year, month, day] = payload.date.split("-");
      return `${day}/${month}/${year}`;
    };
    if (previewDebug) {
      const summary = [
        payload.name || "--",
        payload.date ? formatDate(payload) : "--",
        payload.time || "--",
        payload.location || "--",
      ].join(" | ");
      previewDebug.textContent = `Preview status: ${summary}`;
    }
  };

  const validateForm = () => {
    clearErrors();
    let isValid = true;

    if (!fields.name.value.trim()) {
      setError("gatheringName", "Gathering name is required.");
      isValid = false;
    }

    if (!fields.date.value.trim()) {
      setError("gatheringDate", "Date is required.");
      isValid = false;
    } else if (!isValidDate(fields.date.value.trim())) {
      setError("gatheringDate", "Date must be in YYYY-MM-DD format.");
      isValid = false;
    }

    if (!fields.time.value.trim()) {
      setError("gatheringTime", "Time is required.");
      isValid = false;
    } else if (!isValidTime(fields.time.value.trim())) {
      setError("gatheringTime", "Time must be in HH:MM format.");
      isValid = false;
    }

    if (!fields.location.value.trim()) {
      setError("gatheringLocation", "Location is required.");
      isValid = false;
    }

    if (!getRadioValue("iconId")) {
      setError("iconId", "Please choose an icon.");
      isValid = false;
    }

    if (!getRadioValue("cardColor")) {
      setError("cardColor", "Please choose a card color.");
      isValid = false;
    }

    if (!fields.description.value.trim()) {
      setError("description", "Description is required.");
      isValid = false;
    }

    if (!fields.type.value) {
      setError("type", "Please choose a type.");
      isValid = false;
    }

    return isValid;
  };

  const openModal = (payload) => {
    if (
      !modal ||
      !confirmPreview ||
      typeof window.createGatheringCard !== "function"
    ) {
      return;
    }
    confirmPreview.innerHTML = "";
    confirmPreview.appendChild(window.createGatheringCard(payload));
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  Object.values(fields).forEach((field) => {
    if (!field) return;
    if (Array.isArray(field)) {
      field.forEach((input) => {
        input.addEventListener("input", updatePreview);
        input.addEventListener("change", updatePreview);
      });
      return;
    }
    field.addEventListener("input", updatePreview);
    field.addEventListener("change", updatePreview);
  });

  modalCloseButtons.forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  if (confirmYesBtn) {
    confirmYesBtn.addEventListener("click", () => {
      closeModal();
      formStatus.textContent = "Confirmed. API hookup coming next.";
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formStatus.textContent = "";

    if (!validateForm()) {
      formStatus.textContent = "Please complete all required fields.";
      return;
    }

    const payload = buildPayload();
    openModal(payload);
  });

  updatePreview();
  window.addEventListener("load", updatePreview);
})();
