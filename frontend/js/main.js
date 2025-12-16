document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("hello-btn");
  const status = document.getElementById("status");

  button.addEventListener("click", () => {
    status.textContent = "JS is wired up. Ready to build!";
  });
});
