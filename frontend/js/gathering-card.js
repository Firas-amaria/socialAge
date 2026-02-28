const ICON_MAP = {
  games: "\uD83C\uDFB2",
  food: "\uD83C\uDF7D",
  coffee: "\u2615",
  art: "\uD83C\uDFA8",
  music: "\uD83C\uDFB5",
  outdoor: "\uD83C\uDF33",
  book: "\uD83D\uDCDA",
  fitness: "\uD83E\uDDD8",
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeColor = (value, fallback = "#d6dfe8") => {
  const text = typeof value === "string" ? value.trim() : "";
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text)) {
    return text;
  }
  return fallback;
};

const formatDateTime = (date, startTime, endTime) => {
  if (date && startTime) {
    const [year, month, day] = date.split("-");
    date = `${day}/${month}/${year}`;
    if (endTime) return `${date} at ${startTime} - ${endTime}`;
    return `${date} at ${startTime}`;
  }
  if (date) {
    return `${date} at --:--`;
  }
  return "";
};

const setText = (element, value, placeholder = "--") => {
  if (!element) return;
  if (value) {
    element.textContent = value;
    element.classList.remove("is-placeholder");
  } else {
    element.textContent = placeholder;
    element.classList.add("is-placeholder");
  }
};

const createGatheringCard = (data = {}) => {
  const name = cleanText(data.name);
  const date = cleanText(data.date);
  const startTime = cleanText(data.startTime);
  const endTime = cleanText(data.endTime);
  const location = cleanText(data.address) || cleanText(data.location);
  const iconId = cleanText(data.iconId);
  const cardColor = normalizeColor(data.cardColor);

  const icon = ICON_MAP[iconId] || "?";

  const wrapper = document.createElement("div");
  wrapper.className = "gathering-card";
  wrapper.style.borderLeft = `10px solid ${cardColor}`;

  const header = document.createElement("div");
  header.className = "gathering-card__header";

  const iconWrap = document.createElement("div");
  iconWrap.className = "gathering-card__icon";
  iconWrap.style.background = `${cardColor}22`;
  iconWrap.style.color = cardColor;
  iconWrap.textContent = icon;
  if (!iconId) {
    iconWrap.classList.add("gathering-card__icon--placeholder");
  }

  const divider = document.createElement("div");
  divider.className = "gathering-card__divider";
  divider.style.background = cardColor;

  const titleWrap = document.createElement("div");
  titleWrap.className = "gathering-card__title";

  const title = document.createElement("h3");
  setText(title, name);

  titleWrap.appendChild(title);

  header.appendChild(iconWrap);
  header.appendChild(divider);
  header.appendChild(titleWrap);

  const body = document.createElement("div");
  body.className = "gathering-card__body";

  const meta = document.createElement("div");
  meta.className = "gathering-card__meta";

  const when = document.createElement("div");
  when.className = "gathering-card__meta-row";
  const whenLabel = document.createElement("span");
  whenLabel.textContent = "When";
  const whenValue = document.createElement("strong");
  setText(whenValue, formatDateTime(date, startTime, endTime));
  when.appendChild(whenLabel);
  when.appendChild(whenValue);

  const where = document.createElement("div");
  where.className = "gathering-card__meta-row";
  const whereLabel = document.createElement("span");
  whereLabel.textContent = "Where";
  const whereValue = document.createElement("strong");
  setText(whereValue, location);
  where.appendChild(whereLabel);
  where.appendChild(whereValue);

  meta.appendChild(when);
  meta.appendChild(where);
  body.appendChild(meta);

  wrapper.appendChild(header);
  wrapper.appendChild(body);

  return wrapper;
};

window.createGatheringCard = createGatheringCard;
