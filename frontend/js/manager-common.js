(() => {
  const getStoredUser = () => {
    const rawUser = window.localStorage.getItem("user");
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser);
    } catch (_error) {
      return null;
    }
  };

  const isManagerRole = (role) => role === "SocialM" || role === "Admin";

  const requireLogin = () => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return false;
    }
    return true;
  };

  const requireManager = () => {
    if (!requireLogin()) return false;
    const user = getStoredUser();
    if (!user) {
      window.location.href = "/login";
      return false;
    }
    if (!isManagerRole(user.role)) {
      window.location.href = "/manager-application-status";
      return false;
    }
    return true;
  };

  window.managerAuth = {
    getStoredUser,
    isManagerRole,
    requireLogin,
    requireManager,
  };
})();
