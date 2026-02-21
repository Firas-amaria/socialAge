(() => {
  if (!window.managerAuth?.requireManager()) return;

  const params = new URLSearchParams(window.location.search);
  const gatheringId = params.get("id");
  const form = document.getElementById("editGatheringForm");
  const statusEl = document.getElementById("editStatus");
  const cancelBtn = document.getElementById("cancelGatheringBtn");

  if (!gatheringId || !form || !statusEl || !cancelBtn) {
    if (statusEl) statusEl.textContent = "Missing gathering id.";
    return;
  }

  const fields = {
    name: document.getElementById("name"),
    date: document.getElementById("date"),
    startTime: document.getElementById("startTime"),
    endTime: document.getElementById("endTime"),
    location: document.getElementById("location"),
    address: document.getElementById("address"),
    maxAttendees: document.getElementById("maxAttendees"),
    description: document.getElementById("description"),
    notes: document.getElementById("notes"),
    type: document.getElementById("type"),
    status: document.getElementById("status"),
  };

  const setForm = (data) => {
    fields.name.value = data.name || "";
    fields.date.value = data.date || "";
    fields.startTime.value = data.startTime || data.time || "";
    fields.endTime.value = data.endTime || "";
    fields.location.value = data.location || "";
    fields.address.value = data.address || "";
    fields.maxAttendees.value = data.maxAttendees || 30;
    fields.description.value = data.description || "";
    fields.notes.value = data.notes || "";
    fields.type.value = data.type || "free_for_all";
    fields.status.value = data.status || "active";
  };

  const buildPayload = () => ({
    name: fields.name.value.trim(),
    date: fields.date.value,
    startTime: fields.startTime.value,
    endTime: fields.endTime.value,
    location: fields.location.value.trim(),
    address: fields.address.value.trim(),
    maxAttendees: Number(fields.maxAttendees.value || 30),
    description: fields.description.value.trim(),
    notes: fields.notes.value.trim(),
    type: fields.type.value,
    status: fields.status.value,
  });

  const load = async () => {
    try {
      statusEl.textContent = "Loading gathering...";
      const data = await window.api.get(`/gatherings/${gatheringId}`);
      setForm(data);
      statusEl.textContent = "";
    } catch (error) {
      statusEl.textContent = `Could not load gathering: ${error.message}`;
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusEl.textContent = "Saving changes...";
    try {
      const payload = buildPayload();
      await window.api.patch(`/gatherings/${gatheringId}`, payload);
      statusEl.textContent = "Gathering updated successfully.";
    } catch (error) {
      statusEl.textContent = `Save failed: ${error.message}`;
    }
  });

  cancelBtn.addEventListener("click", async () => {
    if (!window.confirm("Cancel this gathering? Attendees will still see it as cancelled.")) {
      return;
    }
    statusEl.textContent = "Cancelling gathering...";
    try {
      await window.api.patch(`/gatherings/${gatheringId}/cancel`, {});
      fields.status.value = "cancelled";
      statusEl.textContent = "Gathering cancelled.";
    } catch (error) {
      statusEl.textContent = `Cancel failed: ${error.message}`;
    }
  });

  load();
})();
