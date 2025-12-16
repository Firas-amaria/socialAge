const form = document.getElementById("upload-form");
const statusEl = document.getElementById("upload-status");
const defaultBackendUrl = (window.api && window.api.baseUrl) || "http://localhost:3001";

const backendUrlInput = document.getElementById("backendUrl");
if (backendUrlInput && !backendUrlInput.value) {
  backendUrlInput.value = defaultBackendUrl;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const backendUrl = (form.backendUrl.value || defaultBackendUrl).trim().replace(/\/$/, "");
  const file = form.image.files[0];

  if (!backendUrl) {
    setStatus("Backend URL is required", true);
    return;
  }
  if (!file) {
    setStatus("Please choose an image", true);
    return;
  }

  const data = new FormData();
  data.append("image", file);

  setStatus("Sending...", false);

  try {
    const apiClient = window.api;
    if (!apiClient) {
      setStatus("API client not initialized", true);
      return;
    }
    await apiClient.upload("/mail/upload", data, { customBase: backendUrl });
    setStatus("Email sent successfully", false, true);
    form.reset();
  } catch (err) {
    setStatus(err.message || "Request failed", true);
  }
});

function setStatus(msg, isError, isSuccess = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("error", isError);
  statusEl.classList.toggle("success", isSuccess);
}
