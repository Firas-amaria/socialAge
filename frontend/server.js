const express = require("express");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.static(path.join(__dirname)));

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
