(() => {
  const header = document.querySelector("header[data-elder-header]");
  if (!header) return;

  header.innerHTML = `
    <nav>
      <a href="/elder-dashboard">Dashboard</a>
      <a href="/elder-my-gatherings">My Gatherings</a>
    </nav>
  `;
})();
