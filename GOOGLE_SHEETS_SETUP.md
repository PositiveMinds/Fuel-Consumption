# Google Sheets API Setup Guide

This guide will help you set up Google Sheets API integration for two-way sync between the Fleet Manager app and Google Sheets.

## Prerequisites

- Google Cloud Project
- Google Account
- Basic knowledge of Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown and select "New Project"
3. Enter project name: "Fleet Manager"
4. Click "Create"

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to APIs & Services > Library
2. Search for "Google Sheets API"
3. Click on "Google Sheets API" result
4. Click the "ENABLE" button

## Step 3: Create OAuth 2.0 Credentials

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - Fill in App Name: "Fleet Manager"
   - User support email: Your email
   - Developer contact: Your email
   - Click Save & Continue
   - Skip optional scopes
   - Click Save & Continue
   - Review and confirm

4. Back to Credentials:
   - Application type: "Web application"
   - Name: "Fleet Manager Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:8000` (for local development)
     - Your production URL (e.g., `https://yoursite.com`)
   - Authorized redirect URIs:
     - `http://localhost:8000` (for local development)
     - Your production URL (e.g., `https://yoursite.com`)
   - Click "Create"

5. Copy the Client ID from the popup

## Step 4: Create API Key

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "API Key"
3. Copy the API Key

## Step 5: Update Configuration

Edit `assets/js/google-sheets-sync.js` and update the GOOGLE_CONFIG:

```javascript
const GOOGLE_CONFIG = {
    CLIENT_ID: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
    API_KEY: 'YOUR_API_KEY_HERE',
    SCOPES: ['https://www.googleapis.com/auth/spreadsheets'],
    DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
};
```

Replace:
- `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` with your actual Client ID
- `YOUR_API_KEY_HERE` with your actual API Key

## Step 6: Add Sync UI to Settings

The sync functionality should be accessible from the Settings panel. Users can:

1. Authenticate with their Google Account
2. Create a new Google Sheet or select an existing one
3. Perform manual sync (push to Sheets or pull from Sheets)
4. Enable auto-sync (defaults to every 5 minutes)

## Step 7: Save Your Google Sheet ID (Important)

Once you've successfully connected to a Google Sheet, you should save the Sheet ID in a safe location. This ID is required if you need to reconnect to the same spreadsheet later.

### How to Copy Your Sheet ID:

1. Open the Fleet Manager app
2. Click the **Settings** button (⚙️ icon)
3. Scroll down to the **"Google Sheets Sync"** section
4. In the **"Sync Configuration"** box, you'll see:
   - **Connected Spreadsheet** label
   - Your Sheet ID displayed (a long alphanumeric string)
   - A **"Copy ID"** button
5. Click the **"Copy ID"** button
6. The Sheet ID will be copied to your clipboard

### Where to Save Your Sheet ID:

Store your Google Sheet ID in one or more safe locations:

- **Password Manager**: Store in your password manager (1Password, LastPass, Bitwarden, etc.)
- **Secure Note**: Save in a secure notes app (Apple Notes with encryption, OneNote, Evernote)
- **Cloud Storage**: Store in an encrypted file on Google Drive, OneDrive, or similar
- **Print**: Write it down on paper and store in a safe physical location
- **Email Draft**: Save to a draft email in your account (not sent)

### Why Keep Your Sheet ID Safe:

- **Reconnection**: If you clear app data, switch devices, or reinstall, you can use this ID to reconnect to the same spreadsheet
- **Quick Recovery**: You won't need to create a new spreadsheet or lose your sync connection
- **Multiple Devices**: If you use Fleet Manager on multiple devices, you can reconnect each one to the same sheet using this ID

### Important Security Notes:

- Never share your Sheet ID with untrusted parties
- The Sheet ID alone cannot grant access without Google authentication
- Your Google account credentials are required to actually access the spreadsheet
- Keep the ID private, similar to how you'd keep other account recovery information

## How Two-Way Sync Works

### Initial Setup:
1. User clicks "Connect Google Sheets" in Settings
2. Authenticates with their Google account
3. Creates a new spreadsheet or selects existing one
4. Initial sync imports all local data to Google Sheets

### Ongoing Sync:
1. **Pull from Google Sheets**: Fetches new/updated entries from the spreadsheet
2. **Push to Google Sheets**: Uploads local changes to the spreadsheet
3. **Conflict Resolution**: Latest timestamp wins (Google Sheets version overrides local if newer)

### Auto Sync:
- Runs every 5 minutes (configurable)
- Only syncs if authenticated and spreadsheet is selected
- Manual sync can be triggered anytime

## API Usage & Limits

Google Sheets API has these quotas:
- 500 requests per 100 seconds per user
- 10,000,000 reads per day
- 500,000 writes per day

The Fleet Manager sync is optimized to minimize requests.

## Testing Locally

For local testing with restricted API keys:

1. Use `http://localhost:8000` as your origin
2. Start a local server: `python -m http.server 8000`
3. Visit `http://localhost:8000`

## Troubleshooting

### "Invalid Client ID" Error
- Check that CLIENT_ID matches exactly (including `.apps.googleusercontent.com`)
- Ensure your domain is in Authorized JavaScript origins

### "Access Denied" Error
- Make sure Google Sheets API is enabled
- Check that the spreadsheet ID is correct
- Verify permissions on the Google Sheet

### No Sync Happening
- Check browser console for errors (F12)
- Verify authentication by checking if `googleSheetsAuthToken` is in localStorage
- Check Network tab to see API requests

## Security Notes

- Never commit your API credentials to version control
- For production, use environment variables
- Consider implementing server-side token refresh for security
- Regularly rotate API keys

## Support

For issues with Google Sheets API, refer to:
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
