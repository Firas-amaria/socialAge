(() => {
  const statusEl = document.getElementById("adminSettingsStatus");
  const contentEl = document.getElementById("adminSettingsContent");

  const setStatus = (text, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("status--error", isError);
  };

  const init = async () => {
    const user = await window.adminAuth?.requireAdmin?.();
    if (!user) return;

    const apiBase = window.api?.baseUrl || "Not available";

    if (contentEl) {
      contentEl.innerHTML = `
        <article class="list-card">
          <h3>SMTP / Email Configuration</h3>
          <p class="subtitle">This build does not expose server env values in UI for security reasons.</p>
          <p class="subtitle">Required backend variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO.</p>
          <p class="subtitle">If email confirmations fail, verify backend .env configuration and SMTP credentials.</p>
        </article>
        <article class="list-card">
          <h3>Platform Configuration</h3>
          <p class="subtitle">Frontend API base URL: ${apiBase}</p>
          <p class="subtitle">Admin controls currently available:</p>
          <ul class="manager-attendee-list">
            <li>Application review and approval workflow</li>
            <li>Gathering overview and cancellation</li>
            <li>User listing, activation/deactivation, and removal</li>
          </ul>
        </article>
      `;
    }

    setStatus("Settings loaded.");
  };

  init();
})();
