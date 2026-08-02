# Yaron & Bar Wedding RSVP Landing Page

Mobile-first Hebrew (RTL) wedding RSVP landing page: countdown timer, RSVP form, add-to-calendar (Google/Apple), Waze/Google Maps navigation, event timeline, and a thank-you confirmation modal. Form submissions are saved directly to a Google Sheet via Google Apps Script.

A digital gifts section (Bit/PayBox) is planned to be added closer to the event date.

## Files

- `index.html` - landing page markup
- `styles.css` - sunset pool-party styling
- `script.js` - countdown, form validation, calendar/nav links, Google Sheets POST, thank-you modal
- `google-apps-script.gs` - Apps Script endpoint that writes to Google Sheets
- `couple-latest.png` - couple illustration

## Google Sheets Setup

1. Create a Google Sheet.
2. Open **Extensions -> Apps Script**.
3. Paste the contents of `google-apps-script.gs`.
4. Replace `PASTE_SPREADSHEET_ID_HERE` with your Sheet ID (the long string in the sheet's URL).
5. Run `setupWeddingRsvpSheet` once (grant the requested permissions when prompted).
6. Deploy as **Web App**:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the Web App URL into `script.js`:
   ```js
   const RSVP_CONFIG = {
     appsScriptUrl: "YOUR_WEB_APP_URL",
     ...
   };
   ```

After setup, every submission is appended (or updated in place if the same phone number submits again) to the `Responses` sheet with these columns:

`Timestamp | Full Name | Phone Number | Attendance Status | Number of Guests | Gift Message | Created Date`

## Configuration

All event-specific values live at the top of `script.js` in `RSVP_CONFIG`:

- `eventDate` / `eventEndDate` - drives the countdown timer and calendar invites.
- `address` - used for the Waze / Google Maps buttons and the calendar location.

## Running locally

This is a static site with no build step. Open `index.html` directly in a browser, or serve the folder with any static file server (e.g. `npx serve .`).

## Deploying

The site is deployed via GitHub Pages from this repo. Push to the default branch and GitHub Pages will publish the updated files automatically.
