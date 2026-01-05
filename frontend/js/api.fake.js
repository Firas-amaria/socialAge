(() => {
  const env = window.__ENV || {};
  const baseUrl = env.API_BASE_URL || "http://localhost:3001";

  const buildFakeUrl = (path) => {
    const cleanPath = String(path || "").split("?")[0].replace(/^\/+/, "");
    const fileName = cleanPath ? cleanPath : "seed";
    return `/fakeData/${fileName}.json`;
  };

  const fetchFakeJson = async (path) => {
    const fakeUrl = buildFakeUrl(path);
    const res = await fetch(fakeUrl, { cache: "no-store" });
    if (!res.ok) {
      return {
        ok: false,
        demo: true,
        path,
        method: "GET",
        message: `Missing fake data: ${fakeUrl}`,
      };
    }
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json().catch(() => null);
    }
    return res.text();
  };

  const demoRequest = async (path, options = {}) => {
    const { method = "GET", body } = options;
    const normalizedMethod = method.toUpperCase();
    const key = `${normalizedMethod} ${path}`;

    if (key === "POST /mail/upload") {
      return { message: "Demo: email upload accepted." };
    }

    if (normalizedMethod === "GET") {
      return fetchFakeJson(path);
    }

    return {
      ok: true,
      demo: true,
      path,
      method: normalizedMethod,
      body: body || null,
    };
  };

  window.fakeApi = {
    baseUrl,
    isDemo: true,
    get: (path, opts) => demoRequest(path, { ...opts, method: "GET" }),
    post: (path, body, opts) => demoRequest(path, { ...opts, method: "POST", body }),
    put: (path, body, opts) => demoRequest(path, { ...opts, method: "PUT", body }),
    patch: (path, body, opts) => demoRequest(path, { ...opts, method: "PATCH", body }),
    del: (path, opts) => demoRequest(path, { ...opts, method: "DELETE" }),
    upload: (path, formData, opts) => demoRequest(path, { ...opts, method: "POST", body: formData }),
  };
})();
