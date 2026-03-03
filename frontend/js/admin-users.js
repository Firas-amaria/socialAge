(() => {
  const statusEl = document.getElementById("adminUsersStatus");
  const bodyEl = document.getElementById("adminUsersBody");
  const searchEl = document.getElementById("adminUsersSearch");
  const roleFilterEl = document.getElementById("adminUsersRoleFilter");
  const activeFilterEl = document.getElementById("adminUsersActiveFilter");

  let users = [];
  let currentAdminId = "";

  const setStatus = (text, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("status--error", isError);
  };

  const loadUsers = async () => {
    const params = new URLSearchParams();
    const q = (searchEl?.value || "").trim();
    const role = roleFilterEl?.value || "";
    const active = activeFilterEl?.value || "";
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (active) params.set("active", active);
    const query = params.toString();
    const data = await window.api.get(`/users/admin/list${query ? `?${query}` : ""}`);
    users = Array.isArray(data) ? data : [];
  };

  const render = () => {
    if (!bodyEl) return;
    if (!users.length) {
      bodyEl.innerHTML = `<tr><td colspan="6">No users found.</td></tr>`;
      return;
    }

    bodyEl.innerHTML = users
      .map((u) => {
        const isSelf = (u?._id || "") === currentAdminId;
        return `
          <tr>
            <td>${u?.name || "-"}</td>
            <td>${u?.email || "-"}</td>
            <td>${u?.role || "-"}</td>
            <td>${u?.isActive === false ? "Inactive" : "Active"}</td>
            <td>${u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</td>
            <td>
              <div class="action-row">
                <button type="button" class="secondary-btn" data-action="toggle-active" data-id="${u?._id || ""}" ${
          isSelf ? "disabled" : ""
        }>
                  ${u?.isActive === false ? "Activate" : "Deactivate"}
                </button>
                <button type="button" class="secondary-btn" data-action="delete-user" data-id="${u?._id || ""}" ${
          isSelf ? "disabled" : ""
        }>
                  Remove
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  };

  const refresh = async () => {
    try {
      await loadUsers();
      render();
      setStatus(`Loaded ${users.length} users.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load users.", true);
    }
  };

  const onAction = async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.getAttribute("data-action");
    const userId = target.getAttribute("data-id");
    if (!action || !userId) return;

    const rowUser = users.find((u) => (u?._id || "") === userId);
    if (!rowUser) return;

    target.disabled = true;
    try {
      if (action === "toggle-active") {
        const nextActive = rowUser.isActive === false;
        await window.api.patch(`/users/admin/${encodeURIComponent(userId)}/status`, { isActive: nextActive });
      }

      if (action === "delete-user") {
        if (!window.confirm(`Remove user ${rowUser.email || rowUser.name || ""}?`)) {
          target.disabled = false;
          return;
        }
        await window.api.del(`/users/admin/${encodeURIComponent(userId)}`);
      }

      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Action failed.", true);
      target.disabled = false;
    }
  };

  const init = async () => {
    const adminUser = await window.adminAuth?.requireAdmin?.();
    if (!adminUser) return;
    currentAdminId = (adminUser?._id || adminUser?.id || "").toString();
    await refresh();
  };

  searchEl?.addEventListener("input", refresh);
  roleFilterEl?.addEventListener("change", refresh);
  activeFilterEl?.addEventListener("change", refresh);
  bodyEl?.addEventListener("click", onAction);

  init();
})();
