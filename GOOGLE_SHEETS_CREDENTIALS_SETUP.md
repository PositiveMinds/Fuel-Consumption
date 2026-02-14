# Google Sheets API Credentials Setup

This guide will help you set up your Google Sheets API credentials for the Fleet Manager app.

## ⚠️ Important Security Notes

- **Never commit** `assets/js/google-sheets-sync.config.js` to GitHub
- It's already in `.gitignore` - credentials will NOT be pushed
- Keep your API Key and Client ID private
- The credentials file is only for local use and GitHub Pages

## Getting Your Credentials

### Step 1: Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project (Positive Minds project)

### Step 2: Enable Google Sheets API

1. Go to **APIs & Services > Library**
2. Search for "Google Sheets API"
3. Click on it and make sure it's **ENABLED**

### Step 3: Get Your Credentials

1. Go to **APIs & Services > Credentials**
2. Look for existing credentials:
   - **OAuth 2.0 Client ID** - Copy this (it ends with `.apps.googleusercontent.com`)
   - **API Key** - Copy this

### Step 4: Update Your Authorized Origins

1. In **APIs & Services > Credentials**
2. Click on your OAuth 2.0 Client ID to edit it
3. Add these **Authorized JavaScript origins**:
   ```
   https://positiveminds.github.io
   http://localhost:8000
   ```

4. Add these **Authorized redirect URIs**:
   ```
   https://positiveminds.github.io
   http://localhost:8000
   ```

5. Click **Save**

### Step 5: Configure Your Local Credentials

1. Open `assets/js/google-sheets-sync.config.js`
2. Replace `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` with your actual Client ID
3. Replace `YOUR_API_KEY_HERE` with your actual API Key
4. **Save the file** (it's in `.gitignore` so it won't be committed)

Example:
```javascript
const GOOGLE_CONFIG = {
    CLIENT_ID: 'abc123def456.apps.googleusercontent.com',
    API_KEY: 'AIzaSyD123456789abcdefghijklmnop',
    SCOPES: ['https://www.googleapis.com/auth/spreadsheets'],
    DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
};
```

## Testing Locally

1. Start a local server:
   ```bash
   python -m http.server 8000
   ```
   Or on Windows:
   ```bash
   py -m http.server 8000
   ```

2. Visit `http://localhost:8000`

3. Try the Google Sheets sync from Settings

## Testing on GitHub Pages

1. Push your changes (without `google-sheets-sync.config.js`)
2. The site will be at `https://positiveminds.github.io/Fuel-Consumption/`
3. The credentials won't be there, so you need to add them manually or use environment variables

## For Production / GitHub Pages

Since GitHub Pages can't store secrets, you have two options:

**Option A: Manual Setup (User adds their own credentials)**
- Provide users with instructions to add their credentials in browser DevTools Console:
  ```javascript
  GOOGLE_CONFIG.CLIENT_ID = 'their-client-id';
  GOOGLE_CONFIG.API_KEY = 'their-api-key';
  ```

**Option B: Server-Side (Recommended)**
- Use a backend server (like Firebase Functions or Node.js) to:
  - Handle OAuth authentication
  - Store and refresh tokens securely
  - Proxy API requests

## Files Structure

```
fuel/
├── .gitignore                                  (prevents committing secrets)
├── assets/js/
│   ├── google-sheets-sync.config.js           (YOUR CREDENTIALS - NOT COMMITTED)
│   ├── google-sheets-sync.config.example.js   (Template for reference)
│   ├── google-sheets-sync.js                  (Sync logic)
│   └── app.js
└── index.html
```

## Troubleshooting

**"GOOGLE_CONFIG is not defined"**
- Make sure `google-sheets-sync.config.js` is loaded before `google-sheets-sync.js` in index.html
- Check browser console (F12) for errors

**"Invalid Client ID"**
- Copy the entire Client ID including `.apps.googleusercontent.com`
- Check for extra spaces

**"API Key not valid"**
- Make sure you copied the full API Key
- Check that Google Sheets API is enabled in Cloud Console

## Need Help?

Refer to:
- [Google Sheets API Docs](https://developers.google.com/sheets/api/guides/concepts)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
