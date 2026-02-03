const welcomeName = document.getElementById("welcomeName");
const rawUser = window.localStorage.getItem("user");

let name = "";
if (rawUser) {
  try {
    const user = JSON.parse(rawUser);
    name = user?.name || "";
  } catch (error) {
    name = "";
  }
}

welcomeName.textContent = name ? `Welcome ${name}` : "Welcome";
