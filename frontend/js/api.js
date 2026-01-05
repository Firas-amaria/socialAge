(() => {
  const env = window.__ENV || {};
  const baseUrl = env.API_BASE_URL || "http://localhost:3001";
  const isDemo = String(env.DEMO || "").toLowerCase() === "true";

  const getToken = () => window.localStorage.getItem("token") || "";

  const buildHeaders = (isJson) => {
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (isJson) headers["Content-Type"] = "application/json";
    return headers;
  };

  const request = async (path, options = {}) => {
    const { method = "GET", body, isForm = false, customBase } = options;
    const url = `${(customBase || baseUrl).replace(/\/$/, "")}${path}`;
    const res = await fetch(url, {
      method,
      headers: buildHeaders(!isForm && body !== undefined),
      body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      const message = (data && data.message) || data || res.statusText;
      throw new Error(message);
    }
    return data;
  };

  const realClient = {
    baseUrl,
    isDemo: false,
    get: (path, opts) => request(path, { ...opts, method: "GET" }),
    post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
    put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
    patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
    del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
    upload: (path, formData, opts) => request(path, { ...opts, method: "POST", body: formData, isForm: true }),
  };

  const missingFakeApi = {
    baseUrl,
    isDemo: true,
    get: (path) =>
      Promise.resolve({ ok: false, demo: true, path, method: "GET", message: "fake API not loaded" }),
    post: (path, body) =>
      Promise.resolve({ ok: false, demo: true, path, method: "POST", body, message: "fake API not loaded" }),
    put: (path, body) =>
      Promise.resolve({ ok: false, demo: true, path, method: "PUT", body, message: "fake API not loaded" }),
    patch: (path, body) =>
      Promise.resolve({ ok: false, demo: true, path, method: "PATCH", body, message: "fake API not loaded" }),
    del: (path) =>
      Promise.resolve({ ok: false, demo: true, path, method: "DELETE", message: "fake API not loaded" }),
    upload: (path, formData) =>
      Promise.resolve({ ok: false, demo: true, path, method: "POST", body: formData, message: "fake API not loaded" }),
  };

  const client = isDemo ? window.fakeApi || missingFakeApi : realClient;

  window.api = client;

  if (isDemo && !window.fakeApi) {
    const script = document.createElement("script");
    script.src = "../js/api.fake.js";
    script.async = true;
    script.onload = () => {
      if (window.fakeApi) {
        window.api = window.fakeApi;
      }
    };
    document.head.appendChild(script);
  }
})();
