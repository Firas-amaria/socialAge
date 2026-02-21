(() => {
  if (!window.managerAuth?.requireManager()) return;

  const form = document.getElementById("gatheringForm");
  if (!form) return;

  const fields = {
    name: document.getElementById("gatheringName"),
    date: document.getElementById("gatheringDate"),
    startTime: document.getElementById("gatheringTime"),
    endTime: document.getElementById("gatheringEndTime"),
    location: document.getElementById("gatheringLocation"),
    address: document.getElementById("gatheringAddress"),
    maxAttendees: document.getElementById("maxAttendees"),
    iconId: Array.from(document.querySelectorAll('input[name="iconId"]')),
    cardColor: Array.from(document.querySelectorAll('input[name="cardColor"]')),
    description: document.getElementById("description"),
    notes: document.getElementById("notes"),
    type: document.getElementById("type"),
    status: document.getElementById("status"),
  };

  const errors = {
    gatheringName: document.getElementById("gatheringNameError"),
    gatheringDate: document.getElementById("gatheringDateError"),
    gatheringTime: document.getElementById("gatheringTimeError"),
    gatheringEndTime: document.getElementById("gatheringEndTimeError"),
    gatheringLocation: document.getElementById("gatheringLocationError"),
    maxAttendees: document.getElementById("maxAttendeesError"),
    iconId: document.getElementById("iconIdError"),
    cardColor: document.getElementById("cardColorError"),
    description: document.getElementById("descriptionError"),
    type: document.getElementById("typeError"),
    status: document.getElementById("statusError"),
  };

  const previewContainer = document.getElementById("previewCard");
  const previewDebug = document.getElementById("previewDebug");
  const formStatus = document.getElementById("formStatus");
  const modal = document.getElementById("confirmModal");
  const confirmPreview = document.getElementById("confirmPreview");
  const confirmYesBtn = document.getElementById("confirmYesBtn");
  const modalCloseButtons = modal ? modal.querySelectorAll("[data-modal-close]") : [];

  let pendingPayload = null;
  let isSubmitting = false;

  const getRadioValue = (name) => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  };

  const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
  const isValidTime = (value) => /^\d{2}:\d{2}$/.test(value);
  const isValidHex = (value) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

  const normalizeColor = (value) => (isValidHex(value) ? value : "#d6dfe8");

  const setError = (fieldId, message) => {
    const errorEl = errors[fieldId];
    if (errorEl) errorEl.textContent = message;
    const inputEl = document.getElementById(fieldId);
    if (inputEl) inputEl.classList.toggle("invalid", Boolean(message));
    const groupEl = document.querySelector(`[data-field="${fieldId}"]`);
    if (groupEl) groupEl.classList.toggle("invalid", Boolean(message));
  };

  const clearErrors = () => {
    Object.keys(errors).forEach((field) => setError(field, ""));
  };

  const buildPayload = () => ({
    name: fields.name.value.trim(),
    date: fields.date.value.trim(),
    startTime: fields.startTime.value.trim(),
    endTime: fields.endTime.value.trim(),
    location: fields.location.value.trim(),
    address: fields.address.value.trim(),
    maxAttendees: Number(fields.maxAttendees.value || 30),
    iconId: getRadioValue("iconId"),
    cardColor: normalizeColor(getRadioValue("cardColor")),
    description: fields.description.value.trim(),
    notes: fields.notes.value.trim(),
    status: fields.status.value,
    type: fields.type.value,
  });

  const updatePreview = () => {
    if (!previewContainer || typeof window.createGatheringCard !== "function") return;
    const payload = buildPayload();
    previewContainer.innerHTML = "";
    previewContainer.appendChild(
      window.createGatheringCard({
        ...payload,
        time: payload.startTime,
      })
    );
    if (previewDebug) {
      previewDebug.textContent = `Preview status: ${payload.name || "--"} | ${payload.date || "--"} | ${payload.startTime || "--:--"}-${payload.endTime || "--:--"} | ${payload.location || "--"}`;
    }
  };

  const validateForm = () => {
    clearErrors();
    let valid = true;
    const payload = buildPayload();

    if (!payload.name) {
      setError("gatheringName", "Gathering name is required.");
      valid = false;
    }
    if (!payload.date || !isValidDate(payload.date)) {
      setError("gatheringDate", "Valid date is required.");
      valid = false;
    }
    if (!payload.startTime || !isValidTime(payload.startTime)) {
      setError("gatheringTime", "Valid start time is required.");
      valid = false;
    }
    if (!payload.endTime || !isValidTime(payload.endTime)) {
      setError("gatheringEndTime", "Valid end time is required.");
      valid = false;
    }
    if (payload.endTime && payload.startTime && payload.endTime <= payload.startTime) {
      setError("gatheringEndTime", "End time must be after start time.");
      valid = false;
    }
    if (!payload.location) {
      setError("gatheringLocation", "Location is required.");
      valid = false;
    }
    if (!payload.maxAttendees || payload.maxAttendees < 1) {
      setError("maxAttendees", "Max attendees must be at least 1.");
      valid = false;
    }
    if (!payload.iconId) {
      setError("iconId", "Please choose an icon.");
      valid = false;
    }
    if (!getRadioValue("cardColor")) {
      setError("cardColor", "Please choose a card color.");
      valid = false;
    }
    if (!payload.description) {
      setError("description", "Description is required.");
      valid = false;
    }
    if (!payload.type) {
      setError("type", "Please choose a type.");
      valid = false;
    }
    if (!payload.status) {
      setError("status", "Please choose a status.");
      valid = false;
    }
    return valid;
  };

  const openModal = (payload) => {
    if (!modal || !confirmPreview || typeof window.createGatheringCard !== "function") return;
    confirmPreview.innerHTML = "";
    confirmPreview.appendChild(
      window.createGatheringCard({
        ...payload,
        time: payload.startTime,
      })
    );
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

  const submitGathering = async (payload) => {
    if (isSubmitting) return;
    isSubmitting = true;
    if (confirmYesBtn) {
      confirmYesBtn.disabled = true;
      confirmYesBtn.textContent = "Creating...";
    }

    formStatus.textContent = "Sending gathering to server...";

    try {
      const created = await window.api.post("/gatherings", payload);
      formStatus.textContent = `Gathering "${created?.name || payload.name}" created successfully.`;
      form.reset();
      clearErrors();
      updatePreview();
    } catch (error) {
      formStatus.textContent = `Could not create gathering: ${error.message}`;
    } finally {
      isSubmitting = false;
      if (confirmYesBtn) {
        confirmYesBtn.disabled = false;
        confirmYesBtn.textContent = "Yes, create";
      }
    }
  };

  Object.values(fields).forEach((field) => {
    if (!field) return;
    if (Array.isArray(field)) {
      field.forEach((input) => {
        input.addEventListener("input", updatePreview);
        input.addEventListener("change", updatePreview);
      });
    } else {
      field.addEventListener("input", updatePreview);
      field.addEventListener("change", updatePreview);
    }
  });

  modalCloseButtons.forEach((btn) => btn.addEventListener("click", closeModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  if (confirmYesBtn) {
    confirmYesBtn.addEventListener("click", async () => {
      if (!pendingPayload) return;
      closeModal();
      await submitGathering(pendingPayload);
      pendingPayload = null;
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formStatus.textContent = "";
    if (!validateForm()) {
      formStatus.textContent = "Please complete all required fields.";
      return;
    }
    pendingPayload = buildPayload();
    openModal(pendingPayload);
  });

  updatePreview();
})();
