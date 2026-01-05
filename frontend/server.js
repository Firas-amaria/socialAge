const express = require("express");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3002;
const isDemo = String(process.env.DEMO || "").toLowerCase() === "true";

if (isDemo) {
  seedFakeData();
}

app.use(express.static(path.join(__dirname)));

app.get("/js/env.js", (_req, res) => {
  const apiBase = process.env.API_BASE_URL || "http://localhost:3001";
  const demoMode = process.env.DEMO || "false";
  const payload = `window.__ENV = ${JSON.stringify({ API_BASE_URL: apiBase, DEMO: demoMode })};`;
  res.type("application/javascript").send(payload);
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
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

function seedFakeData() {
  const fakeDataDir = path.join(__dirname, "fakeData");
  const seedPath = path.join(fakeDataDir, "seed.json");
  if (!fs.existsSync(fakeDataDir)) {
    fs.mkdirSync(fakeDataDir, { recursive: true });
  }
  if (!fs.existsSync(seedPath)) {
    const seed = {
      ok: true,
      demo: true,
      message: "Seeded fake data file.",
      items: [],
    };
    fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));
  }
}
