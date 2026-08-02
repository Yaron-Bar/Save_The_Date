const RSVP_CONFIG = {
  appsScriptUrl:
    "https://script.google.com/macros/s/AKfycbwkOJ580P6S7HyB56J4-j7eIp93TK_eLAIyy4HVD4icyXRaopYxDXotlsfZANqy_azg/exec",
  eventDate: "2026-08-28T12:00:00+03:00",
  eventEndDate: "2026-08-28T16:00:00+03:00",
  address: "Casa Event, רחוב הפלדה 4, נתניה",
};

const form = document.querySelector("#rsvp-form");
const statusEl = document.querySelector("#form-status");
const attendingEl = document.querySelector("#attending");
const guestsFieldEl = document.querySelector("#guests-field");
const guestsEl = document.querySelector("#guests");
const modalEl = document.querySelector("#thank-you-modal");

function setStatus(message, type = "normal") {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", type === "error");
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return /^0\d{8,9}$/.test(digits);
}

async function sendToSheet(payload) {
  if (!RSVP_CONFIG.appsScriptUrl) {
    return;
  }

  await fetch(RSVP_CONFIG.appsScriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
}

function updateGuestsVisibility() {
  const attending = attendingEl.value === "מגיע/ה";
  guestsFieldEl.classList.toggle("is-hidden", !attending);
  guestsEl.required = attending;

  if (!attending) {
    guestsEl.value = 1;
  } else if (Number(guestsEl.value) < 1) {
    guestsEl.value = 1;
  }
}

attendingEl.addEventListener("change", updateGuestsVisibility);
updateGuestsVisibility();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector("button[type='submit']");
  const name = cleanText(form.elements.name.value);
  const phone = cleanText(form.elements.phone.value);
  const attending = form.elements.attending.value;
  const message = cleanText(form.elements.message.value);
  const guests =
    attending === "מגיע/ה"
      ? Math.max(1, Number.parseInt(form.elements.guests.value, 10) || 1)
      : 0;

  if (!name) {
    setStatus("נא למלא שם מלא.", "error");
    form.elements.name.focus();
    return;
  }

  if (!isValidPhone(phone)) {
    setStatus("נא להזין מספר טלפון תקין.", "error");
    form.elements.phone.focus();
    return;
  }

  if (!attending) {
    setStatus("נא לבחור אם מגיעים או לא.", "error");
    form.elements.attending.focus();
    return;
  }

  if (attending === "מגיע/ה" && guests < 1) {
    setStatus("למי שמגיע, כמות האנשים צריכה להיות לפחות 1.", "error");
    form.elements.guests.focus();
    return;
  }

  const payload = {
    name,
    phone,
    attending,
    guests,
    message,
    submittedAt: new Date().toISOString(),
  };

  submitButton.disabled = true;
  setStatus("שולחים את האישור...");

  try {
    await sendToSheet(payload);
  } catch (error) {
    console.warn("Could not send RSVP to Google Sheets", error);
  } finally {
    setStatus("");
    submitButton.disabled = false;
    form.reset();
    updateGuestsVisibility();
    openModal();
  }
});

function openModal() {
  modalEl.hidden = false;
}

function closeModal() {
  modalEl.hidden = true;
}

document.querySelector("#close-modal-btn").addEventListener("click", closeModal);
modalEl.addEventListener("click", (event) => {
  if (event.target === modalEl) {
    closeModal();
  }
});

function initNavLinks() {
  const encodedAddress = encodeURIComponent(RSVP_CONFIG.address);
  document.querySelector("#waze-link").href = `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
  document.querySelector("#maps-link").href =
    `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
}

function toUtcStamp(isoString) {
  return new Date(isoString).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function initCalendarLinks() {
  const start = toUtcStamp(RSVP_CONFIG.eventDate);
  const end = toUtcStamp(RSVP_CONFIG.eventEndDate);
  const title = encodeURIComponent("החתונה של ירון ובר");
  const details = encodeURIComponent("מסיבת בריכה - לבוש קייצי ובגדי ים");
  const location = encodeURIComponent(RSVP_CONFIG.address);

  document.querySelector("#google-calendar-link").href =
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;

  document.querySelector("#apple-calendar-btn").addEventListener("click", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Yaron & Bar Wedding//RSVP//HE",
      "BEGIN:VEVENT",
      "UID:yaron-bar-wedding-2026@savethedate",
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      "SUMMARY:החתונה של ירון ובר",
      "LOCATION:Casa Event\\, רחוב הפלדה 4\\, נתניה",
      "DESCRIPTION:מסיבת בריכה - לבוש קייצי ובגדי ים",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yaron-bar-wedding.ics";
    link.click();
    URL.revokeObjectURL(url);
  });
}

function initCountdown() {
  const target = new Date(RSVP_CONFIG.eventDate).getTime();
  const daysEl = document.querySelector("#cd-days");
  const hoursEl = document.querySelector("#cd-hours");
  const minutesEl = document.querySelector("#cd-minutes");
  const secondsEl = document.querySelector("#cd-seconds");

  function pad(value) {
    return String(Math.max(0, value)).padStart(2, "0");
  }

  function tick() {
    const diff = target - Date.now();

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    daysEl.textContent = pad(Math.floor(totalSeconds / 86400));
    hoursEl.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
    minutesEl.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    secondsEl.textContent = pad(totalSeconds % 60);
  }

  tick();
  setInterval(tick, 1000);
}

initNavLinks();
initCalendarLinks();
initCountdown();
