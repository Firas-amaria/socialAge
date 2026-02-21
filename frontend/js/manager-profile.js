(() => {
  if (!window.managerAuth?.requireLogin()) return;

  const info = document.getElementById("profileInfo");
  const form = document.getElementById("profileForm");
  const profileName = document.getElementById("profileName");
  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");
  const profileStatus = document.getElementById("profileStatus");
  const applicationSnapshot = document.getElementById("applicationSnapshot");

  if (!info || !form || !profileName || !currentPassword || !newPassword || !profileStatus || !applicationSnapshot) {
    return;
  }

  const setUserView = (user) => {
    info.innerHTML = `
      <div class="info-grid">
        <div class="info-row">
          <p class="info-label">Name</p>
          <p class="info-value">${user.name || "Unknown"}</p>
        </div>
        <div class="info-row">
          <p class="info-label">Email</p>
          <p class="info-value">${user.email || "Unknown"}</p>
        </div>
        <div class="info-row">
          <p class="info-label">Role</p>
          <p class="info-value">${user.role || "Unknown"}</p>
        </div>
      </div>
    `;
    profileName.value = user.name || "";
  };

  const loadUser = async () => {
    const user = await window.api.get("/users/me");
    setUserView(user);
    window.localStorage.setItem("user", JSON.stringify(user));
  };

  const loadApplicationSnapshot = async () => {
    try {
      const app = await window.api.get("/sm-applications/me/latest");
      const status = app.status === "denied" ? "rejected" : app.status;
      const badgeType = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";
      applicationSnapshot.innerHTML = `
        <p><span class="badge badge--${badgeType}">${status}</span></p>
        <p class="subtitle"><strong>Full Name:</strong> ${app.fullName || "-"}</p>
        <p class="subtitle"><strong>References:</strong> ${app.references || "-"}</p>
        <p class="subtitle"><strong>Admin Notes:</strong> ${app.adminNotes || "No notes yet."}</p>
      `;
    } catch (_error) {
      applicationSnapshot.innerHTML = `<p class="subtitle">No manager application found.</p>`;
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    profileStatus.textContent = "Saving profile...";
    try {
      const payload = {
        name: profileName.value.trim(),
      };
      if (newPassword.value) {
        payload.currentPassword = currentPassword.value;
        payload.newPassword = newPassword.value;
      }

      const result = await window.api.patch("/users/me", payload);
      if (result?.user) {
        window.localStorage.setItem("user", JSON.stringify(result.user));
      }
      currentPassword.value = "";
      newPassword.value = "";
      profileStatus.textContent = "Profile saved successfully.";
      await loadUser();
    } catch (error) {
      profileStatus.textContent = `Could not save profile: ${error.message}`;
    }
  });

  loadUser().catch((error) => {
    profileStatus.textContent = `Could not load profile: ${error.message}`;
  });
  loadApplicationSnapshot();
})();
