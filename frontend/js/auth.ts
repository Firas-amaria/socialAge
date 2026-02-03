(() => {
  const env = window.__ENV || {};
  const apiBase = (env.API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

  const postJson = async (path, payload) => {
    const res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      const message = (data && (data.message || data.error)) || (typeof data === "string" ? data : res.statusText);
      throw new Error(message || "Request failed");
    }

    return data;
  };

  const setLoading = (form, isLoading) => {
    const button = form.querySelector("button[type='submit']");
    if (button) button.disabled = isLoading;
  };

  const setMessage = (form, message, isError = false) => {
    let messageEl = form.querySelector(".auth-message");
    if (!messageEl) {
      messageEl = document.createElement("p");
      messageEl.className = "auth-message";
      form.prepend(messageEl);
    }
    messageEl.textContent = message;
    messageEl.style.color = isError ? "#b00020" : "#1b5e20";
  };

  const saveSession = (payload) => {
    if (!payload) return;
    if (payload.token) window.localStorage.setItem("token", payload.token);
    if (payload.user) window.localStorage.setItem("user", JSON.stringify(payload.user));
  };

  const redirectByRole = (role) => {
    if (role === "Elderly") {
      window.location.href = "/elder-dashboard";
      return;
    }
    if (role === "SocialM") {
      window.location.href = "/manager-dashboard";
      return;
    }
    window.location.href = "/";
  };

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!email || !password) {
        setMessage(loginForm, "Email and password are required.", true);
        return;
      }

      try {
        setLoading(loginForm, true);
        const payload = await postJson("/users/login", { email, password });
        saveSession(payload);
        setMessage(loginForm, "Login successful. Redirecting...");
        redirectByRole(payload?.user?.role);
      } catch (err) {
        setMessage(loginForm, err.message || "Login failed.", true);
      } finally {
        setLoading(loginForm, false);
      }
    });
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!name || !email || !password) {
        setMessage(registerForm, "Name, email, and password are required.", true);
        return;
      }

      try {
        setLoading(registerForm, true);
        const payload = await postJson("/users/register", { name, email, password, role: "Elderly" });
        saveSession(payload);
        setMessage(registerForm, "Registration successful. Redirecting...");
        redirectByRole(payload?.user?.role || "Elderly");
      } catch (err) {
        setMessage(registerForm, err.message || "Registration failed.", true);
      } finally {
        setLoading(registerForm, false);
      }
    });
  }
})();
