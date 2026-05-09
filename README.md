# Yaron & Bar Wedding RSVP Landing Page

Static Hebrew RTL wedding RSVP landing page with WhatsApp confirmation and optional Google Sheets storage through Google Apps Script.

## Files

- `index.html` - landing page markup
- `styles.css` - premium sunset pool party styling
- `script.js` - form validation, Google Sheets POST, WhatsApp redirect
- `google-apps-script.gs` - Apps Script endpoint for Google Sheets
- `assets/invitation.png` - invitation image used as background and couple crop

## Google Sheets Setup

1. Create a Google Sheet.
2. Add a `Guests` tab with this header row:
   `name | status | guests | lastSubmittedAt`
3. Add invited guests under `name`. Leave `status` empty or set it to `לא השיב`.
4. Open Extensions -> Apps Script.
5. Paste the contents of `google-apps-script.gs`.
6. Replace `PASTE_SPREADSHEET_ID_HERE` with your Sheet ID.
7. Run `setupWeddingRsvpSheets` once.
8. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone
9. Copy the Web App URL into `script.js`:
   `appsScriptUrl: "YOUR_WEB_APP_URL"`

After setup, every submission is appended to `Responses`, and matching rows in `Guests` are updated. Guests whose `status` remains empty or `לא השיב` are the nonresponders.
