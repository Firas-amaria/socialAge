const express = require("express");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3002;

app.use(
  express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".ts")) {
        res.type("application/javascript");
      }
    },
  }),
);

app.get("/js/env.js", (_req, res) => {
  const apiBase = process.env.API_BASE_URL || "http://localhost:3001";
  const payload = `window.__ENV = ${JSON.stringify({ API_BASE_URL: apiBase })};`;
  res.type("application/javascript").send(payload);
});

const routesPath = path.join(__dirname, "routes.json");
const routes = loadRoutes(routesPath);

Object.entries(routes).forEach(([route, pagePath]) => {
  app.get(route, (_req, res) => {
    res.sendFile(path.join(__dirname, pagePath));
  });
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Frontend running at ${url}`);
  openBrowser(url);
});

function openBrowser(url) {
  const command =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
      ? `start "" "${url}"`
      : `xdg-open "${url}"`;

  exec(command, (err) => {
    if (err) {
      console.warn("Could not open browser automatically:", err.message);
    }
  });
}

function loadRoutes(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (err) {
    console.warn("Could not load routes.json. Falling back to / only.");
  }

  return { "/": "pages/elder-dashboard.html" };
}
