const RSVP_CONFIG = {
  whatsappNumber: "972504510855",
  appsScriptUrl: "",
};

const form = document.querySelector("#rsvp-form");
const statusEl = document.querySelector("#form-status");
const attendingEl = document.querySelector("#attending");
const guestsEl = document.querySelector("#guests");

function setStatus(message, type = "normal") {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", type === "error");
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function buildWhatsappUrl({ name, attending, guests }) {
  const message = `היי, אני מאשר/ת הגעה. שם: ${name}, מגיעים: ${attending}, כמות: ${guests}`;
  return `https://wa.me/${RSVP_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
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

attendingEl.addEventListener("change", () => {
  if (attendingEl.value === "לא") {
    guestsEl.value = 0;
  } else if (Number(guestsEl.value) < 1) {
    guestsEl.value = 1;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector("button");
  const name = cleanText(form.elements.name.value);
  const attending = form.elements.attending.value;
  const guests = Math.max(0, Number.parseInt(form.elements.guests.value, 10) || 0);

  if (!name) {
    setStatus("נא למלא שם מלא.", "error");
    form.elements.name.focus();
    return;
  }

  if (!attending) {
    setStatus("נא לבחור אם מגיעים או לא.", "error");
    form.elements.attending.focus();
    return;
  }

  if (attending === "כן" && guests < 1) {
    setStatus("למי שמגיע, כמות האנשים צריכה להיות לפחות 1.", "error");
    form.elements.guests.focus();
    return;
  }

  const payload = {
    name,
    attending,
    guests: attending === "לא" ? 0 : guests,
    submittedAt: new Date().toISOString(),
    whatsappMessage: `היי, אני מאשר/ת הגעה. שם: ${name}, מגיעים: ${attending}, כמות: ${
      attending === "לא" ? 0 : guests
    }`,
  };

  submitButton.disabled = true;
  setStatus("שומרים את האישור ופותחים WhatsApp...");

  try {
    await sendToSheet(payload);
  } catch (error) {
    console.warn("Could not send RSVP to Google Sheets", error);
  } finally {
    window.open(buildWhatsappUrl(payload), "_blank", "noopener,noreferrer");
    setStatus("WhatsApp נפתח עם ההודעה המוכנה. נתראה בשקיעה.");
    submitButton.disabled = false;
  }
});
