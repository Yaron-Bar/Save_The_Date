const CONFIG = {
  spreadsheetId: "PASTE_SPREADSHEET_ID_HERE",
  sheetName: "Responses",
};

const HEADERS = [
  "Timestamp",
  "Full Name",
  "Phone Number",
  "Attendance Status",
  "Number of Guests",
  "Gift Message",
  "Created Date",
];

function setupWeddingRsvpSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = getOrCreateSheet_(ss, CONFIG.sheetName, HEADERS);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}

function doPost(e) {
  const payload = parsePayload_(e);
  const now = new Date();
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = getOrCreateSheet_(ss, CONFIG.sheetName, HEADERS);

  const name = cleanText_(payload.name);
  const phone = cleanText_(payload.phone);
  const attending = cleanText_(payload.attending);
  const guests = Number(payload.guests || 0);
  const message = cleanText_(payload.message);
  const timestamp = payload.submittedAt ? new Date(payload.submittedAt) : now;

  upsertRow_(sheet, {
    timestamp,
    name,
    phone,
    attending,
    guests,
    message,
    createdDate: now,
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function upsertRow_(sheet, row) {
  const rowValues = [
    row.timestamp,
    row.name,
    row.phone,
    row.attending,
    row.guests,
    row.message,
    row.createdDate,
  ];

  const lastRow = sheet.getLastRow();

  if (lastRow >= 2) {
    const phones = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    const normalizedPhone = normalizePhone_(row.phone);

    for (let index = 0; index < phones.length; index += 1) {
      if (normalizedPhone && normalizePhone_(phones[index][0]) === normalizedPhone) {
        sheet.getRange(index + 2, 1, 1, HEADERS.length).setValues([rowValues]);
        return;
      }
    }
  }

  sheet.appendRow(rowValues);
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

function cleanText_(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizePhone_(value) {
  return String(value || "").replace(/\D/g, "");
}
