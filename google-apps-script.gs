const CONFIG = {
  spreadsheetId: "PASTE_SPREADSHEET_ID_HERE",
  guestsSheetName: "Guests",
  responsesSheetName: "Responses",
};

const GUEST_HEADERS = ["name", "status", "guests", "lastSubmittedAt"];
const RESPONSE_HEADERS = ["timestamp", "name", "attending", "guests", "whatsappMessage"];

function setupWeddingRsvpSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const guests = getOrCreateSheet_(ss, CONFIG.guestsSheetName, GUEST_HEADERS);
  const responses = getOrCreateSheet_(ss, CONFIG.responsesSheetName, RESPONSE_HEADERS);

  guests.setFrozenRows(1);
  responses.setFrozenRows(1);
  guests.autoResizeColumns(1, GUEST_HEADERS.length);
  responses.autoResizeColumns(1, RESPONSE_HEADERS.length);
}

function doPost(e) {
  const payload = parsePayload_(e);
  const now = new Date();
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const guestsSheet = getOrCreateSheet_(ss, CONFIG.guestsSheetName, GUEST_HEADERS);
  const responsesSheet = getOrCreateSheet_(ss, CONFIG.responsesSheetName, RESPONSE_HEADERS);

  const name = cleanText_(payload.name);
  const attending = cleanText_(payload.attending);
  const guests = Number(payload.guests || 0);
  const whatsappMessage = cleanText_(payload.whatsappMessage);

  responsesSheet.appendRow([now, name, attending, guests, whatsappMessage]);
  updateGuestStatus_(guestsSheet, name, attending, guests, now);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    return e.parameter || {};
  }
}

function getOrCreateSheet_(ss, sheetName, headers) {
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = firstRow.some((value) => String(value).trim());

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function updateGuestStatus_(sheet, name, attending, guests, timestamp) {
  if (!name) {
    return;
  }

  const status = attending === "לא" ? "לא מגיע" : "מגיע";
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    sheet.appendRow([name, status, guests, timestamp]);
    return;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, GUEST_HEADERS.length).getValues();
  const normalizedName = normalizeName_(name);

  for (let index = 0; index < values.length; index += 1) {
    if (normalizeName_(values[index][0]) === normalizedName) {
      const row = index + 2;
      sheet.getRange(row, 2, 1, 3).setValues([[status, guests, timestamp]]);
      return;
    }
  }

  sheet.appendRow([name, status, guests, timestamp]);
}

function cleanText_(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeName_(value) {
  return cleanText_(value).toLowerCase();
}
