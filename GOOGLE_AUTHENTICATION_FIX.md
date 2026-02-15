# Google Authentication Fixes

## Issues Fixed

1. **GOOGLE_CONFIG not defined** - Created `google-sheets-sync.config.js` file with proper structure
2. **Invalid async/await usage** - Fixed `getThumbnailUrl()` in `google-drive-sync.js` to be async
3. **Service Worker 404 error** - Updated sw.js registration path to work with GitHub Pages subdirectories

## Setup Instructions

### 1. Configure Google API Credentials

Edit the file: `assets/js/google-sheets-sync.config.js`

Replace `YOUR_CLIENT_ID_HERE` and `YOUR_API_KEY_HERE` with your actual credentials:

```javascript
const GOOGLE_CONFIG = {
    CLIENT_ID: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com',
    API_KEY: 'YOUR_ACTUAL_API_KEY',
    SCOPES: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
    DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
};
```

### 2. Get Your Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable APIs:
   - Google Sheets API
   - Google Drive API
4. Go to **APIs & Services > Credentials**
5. Create an **OAuth 2.0 Client ID** (Web application)
   - Add authorized redirect URIs:
     - `http://localhost:3000` (for local testing)
     - `https://positiveminds.github.io/` (for production)
     - `https://positiveminds.github.io/Fuel-Consumption/` (if using subdirectory)
6. Copy the Client ID and paste it into the config file
7. Create an API Key and paste it as well

### 3. Files Modified

- ✅ Created `assets/js/google-sheets-sync.config.js` - Configuration file
- ✅ Updated `assets/js/google-sheets-sync.js` - Added GOOGLE_CONFIG guards
- ✅ Updated `assets/js/google-drive-sync.js` - Fixed async function
- ✅ Updated `assets/js/app.js` - Fixed Service Worker registration path

## Testing

After updating `google-sheets-sync.config.js` with valid credentials:

1. Refresh the page
2. Click Settings > Sync with Google Sheets
3. Click "Authenticate with Google"
4. Sign in with your Google account
5. Grant the necessary permissions

## Troubleshooting

If you still see errors:

1. **Check browser console** (F12) for specific error messages
2. **Ensure config file is loaded** - Look for "GOOGLE_CONFIG" in console
3. **Verify credentials format** - Client ID should end with `.apps.googleusercontent.com`
4. **Check redirect URIs** - The URL must be in your Google Cloud Console authorized list
