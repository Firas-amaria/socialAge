(() => {
  const env = window.__ENV || {};
  const baseUrl = env.API_BASE_URL || "http://localhost:3000";

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

  const client = {
    baseUrl,
    isDemo: false,
    get: (path, opts) => request(path, { ...opts, method: "GET" }),
    getGatheringById: (id, opts) =>
      request(`/gatherings/${encodeURIComponent(id)}`, { ...opts, method: "GET" }),
    post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
    put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
    patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
    del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
    upload: (path, formData, opts) => request(path, { ...opts, method: "POST", body: formData, isForm: true }),
  };

  window.api = client;
})();
