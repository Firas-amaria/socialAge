const form = document.getElementById("upload-form");
const statusEl = document.getElementById("upload-status");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const backendUrl = form.backendUrl.value.trim().replace(/\/$/, "");
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
    const res = await fetch(`${backendUrl}/mail/upload`, {
      method: "POST",
      body: data,
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(body.message || "Failed to send email", true);
      return;
    }

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
