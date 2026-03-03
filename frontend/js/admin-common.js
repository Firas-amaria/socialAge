(() => {
  const getStoredUser = () => {
    const raw = window.localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  };

  const isAdminRole = (role) => role === "Admin";

  const redirectByRole = (role) => {
    if (role === "Admin") {
      window.location.href = "/admin-dashboard";
      return;
    }
    if (role === "SocialM") {
      window.location.href = "/manager-dashboard";
      return;
    }
    window.location.href = "/elder-dashboard";
  };

  const requireAdmin = async () => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return null;
    }

    const localUser = getStoredUser();
    if (isAdminRole(localUser?.role)) {
      return localUser;
    }

    if (!window.api || typeof window.api.get !== "function") {
      window.location.href = "/login";
      return null;
    }

    try {
      const freshUser = await window.api.get("/users/me");
      if (freshUser) {
        window.localStorage.setItem("user", JSON.stringify(freshUser));
      }
      if (!isAdminRole(freshUser?.role)) {
        redirectByRole(freshUser?.role);
        return null;
      }
      return freshUser;
    } catch (_error) {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.location.href = "/login";
      return null;
    }
  };

  window.adminAuth = {
    getStoredUser,
    isAdminRole,
    requireAdmin,
    redirectByRole,
  };
})();
