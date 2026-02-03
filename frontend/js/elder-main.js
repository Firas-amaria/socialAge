document.addEventListener("DOMContentLoaded", () => {
  const events = [
    {
      title: "Weekly Coffee Meeting",
      date: "Feb 10",
      time: "10:00 - 11:30",
      location: "Community Center",
      description: "Friendly weekly coffee meeting.",
      img: "/images/elder/coffee.jpg",
    },
    {
      title: "Book Club",
      date: "Feb 12",
      time: "14:00 - 15:30",
      location: "Local Library",
      description: "Reading and discussing books together.",
      img: "/images/elder/bookclub.jpg",
    },
    {
      title: "Yoga for Seniors",
      date: "Feb 15",
      time: "09:00 - 10:00",
      location: "Wellness Room",
      description: "Gentle yoga adapted for seniors.",
      img: "/images/elder/yoga.jpg",
    },
    {
      title: "Art Workshop",
      date: "Feb 18",
      time: "11:00 - 13:00",
      location: "Art Studio",
      description: "Creative painting and art activities.",
      img: "/images/elder/art.jpg",
    },
  ];

  const storageKey = "elderMyGatherings";

  if (!localStorage.getItem(storageKey)) {
    localStorage.setItem(storageKey, JSON.stringify([]));
  }

  const dash = document.querySelector("#upcomingGatherings ul");
  if (dash) {
    dash.innerHTML = events
      .map(
        (event) => `
      <li>
        <a href="/elder-gathering?event=${encodeURIComponent(event.title)}">
          ${event.title} - ${event.date}
        </a>
      </li>
    `,
      )
      .join("");
  }

  const browse = document.querySelector("#browseContainer");
  if (browse) {
    browse.innerHTML =
      "<h2>Upcoming Gatherings</h2>" +
      events
        .map(
          (event) => `
        <div class="card">
          <div class="image-wrapper">
            <img src="${event.img}" class="event-img" alt="${event.title}">
          </div>
          <h3>${event.title}</h3>
          <p>Date: ${event.date}</p>
          <p>Time: ${event.time}</p>
          <a class="btn btn-primary" href="/elder-gathering?event=${encodeURIComponent(event.title)}">
            View Details
          </a>
        </div>
      `,
        )
        .join("");
  }

  const params = new URLSearchParams(window.location.search);
  const eventName = params.get("event");

  if (eventName) {
    const event = events.find((item) => item.title === eventName);
    if (event) {
      const image = document.getElementById("eventImage");
      if (image) image.src = event.img;
      const title = document.getElementById("eventTitle");
      if (title) title.innerText = event.title;
      const date = document.getElementById("eventDate");
      if (date) date.innerText = event.date;
      const time = document.getElementById("eventTime");
      if (time) time.innerText = event.time;
      const location = document.getElementById("eventLocation");
      if (location) location.innerText = event.location;
      const description = document.getElementById("eventDescription");
      if (description) description.innerText = event.description;
    }
  }

  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn && eventName) {
    registerBtn.addEventListener("click", () => {
      const list = JSON.parse(localStorage.getItem(storageKey) || "[]");
      list.push(eventName);
      localStorage.setItem(storageKey, JSON.stringify(list));
      window.location.href = "/elder-confirmation";
    });
  }

  const my = document.getElementById("myGatheringsList");
  if (my) {
    const list = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (list.length === 0) {
      my.innerHTML = "<p>No gatherings yet.</p>";
    } else {
      my.innerHTML =
        "<ul>" +
        list
          .map(
            (gathering, index) => `
          <li>
            ${gathering}
            <button class="btn btn-danger elder-unregister" data-index="${index}">
              Unregister
            </button>
          </li>
        `,
          )
          .join("") +
        "</ul>";

      my.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const btn = target.closest(".elder-unregister");
        if (!btn) return;
        const index = Number(btn.dataset.index);
        if (Number.isNaN(index)) return;
        const next = JSON.parse(localStorage.getItem(storageKey) || "[]");
        next.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(next));
        location.reload();
      });
    }
  }
});
