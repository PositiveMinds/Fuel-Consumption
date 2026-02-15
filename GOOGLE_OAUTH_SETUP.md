# Google OAuth Authentication Setup Guide

This guide will help you set up Google OAuth login for your Fleet Manager app using Google Apps Script as the backend.

## Overview

- **Frontend**: Login pages hosted on GitHub Pages
- **Backend**: Google Apps Script (free, no server needed)
- **Authentication**: Google OAuth 2.0
- **Storage**: User data stored in Google Sheets

## Part 1: Google Cloud Console Setup

### Step 1.1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **New Project**
4. Name: `Fleet Manager`
5. Click **Create**
6. Wait for the project to be created (takes ~1 minute)
7. Select the new project from the dropdown

### Step 1.2: Enable Required APIs

1. In the left sidebar, go to **APIs & Services > Library**
2. Search for **Google Sheets API**
3. Click on it and click **Enable**
4. Go back to Library
5. Search for **Google Drive API**
6. Click on it and click **Enable**

### Step 1.3: Create OAuth 2.0 Credentials

1. In the left sidebar, go to **APIs & Services > Credentials**
2. Click **Create Credentials** (blue button at top)
3. Select **OAuth client ID**
4. If prompted to configure consent screen:
   - Click **Configure Consent Screen**
   - Choose **External** for User Type
   - Fill in:
     - App name: `Fleet Manager`
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue** (skip optional scopes)
   - Review and click **Save and Continue**
5. Back to Credentials, click **Create Credentials > OAuth client ID**
6. Application type: **Web application**
7. Name: `Fleet Manager Web`
8. Under **Authorized JavaScript origins**, add:
   - `http://localhost:8000` (for testing)
   - `https://yourusername.github.io` (your GitHub Pages URL)
9. Under **Authorized redirect URIs**, add:
   - `http://localhost:8000/auth-callback.html`
   - `https://yourusername.github.io/auth-callback.html`
10. Click **Create**
11. Copy the **Client ID** (you'll need it)
12. Copy the **Client Secret** (you'll need it)

## Part 2: Google Apps Script Setup

### Step 2.1: Create the Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/)
2. Click **New Project**
3. Name it: `Fleet Manager Auth`

### Step 2.2: Add the Authentication Code

1. Delete the default code in `Code.gs`
2. Copy the entire contents of `AUTH_APPSCRIPT.gs` from your project
3. Paste it into the `Code.gs` file in Apps Script editor
4. **IMPORTANT:** Update the CONFIG at the top with your values:

```javascript
const CONFIG = {
  CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',        // From Step 1.3
  CLIENT_SECRET: 'YOUR_CLIENT_SECRET',                             // From Step 1.3
  REDIRECT_URI: 'https://yourusername.github.io/auth-callback.html',
  FRONTEND_URL: 'https://yourusername.github.io',
  USERS_SHEET_ID: 'YOUR_SHEET_ID',                                // Created in Step 2.3
  ADMIN_EMAIL: 'your-email@gmail.com'
};
```

### Step 2.3: Create Users Sheet

1. Create a new Google Sheet:
   - Go to [Google Sheets](https://sheets.google.com/)
   - Click **+ Blank spreadsheet**
   - Name it: `Fleet Manager Users`
   - Get the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

2. Set up the sheet structure:
   - Cell A1: `Email`
   - Cell B1: `Name`
   - Cell C1: `Last Login`
   - Right-click the sheet tab, rename to `Users`

3. In Apps Script CONFIG, set `USERS_SHEET_ID` to your Sheet ID

### Step 2.4: Deploy the Apps Script

1. In Apps Script editor, click **Deploy** (top right)
2. Click **New Deployment** (or the dropdown icon)
3. Type: Choose **Web app**
4. Execute as: Your Google account
5. Who has access: **Anyone**
6. Click **Deploy**
7. Copy the deployment URL (looks like: `https://script.google.com/macros/d/ABC123.../userweb`)
8. This is your `APPS_SCRIPT_URL`

## Part 3: Update Frontend Files

### Step 3.1: Update google-auth.js

1. Open `assets/js/google-auth.js`
2. Update `AUTH_CONFIG`:

```javascript
const AUTH_CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/userweb',
  // ... rest stays the same
};
```

Use the deployment URL from Step 2.4

### Step 3.2: Update Login Button in index.html

Add the login button to the navbar (in the Settings or a new button). Add this line to the navbar button group:

```html
<button class="btn btn-sm" style="background: var(--primary-color); color: white;" 
        onclick="handleLoginLogout()" id="authBtn" title="Login/Logout">
    <i class="fas fa-user"></i> <span id="authBtnText">Login</span>
</button>
```

### Step 3.3: Add JavaScript to handle login/logout

Add this to the bottom of `assets/js/app.js`:

```javascript
// Authentication handlers
function handleLoginLogout() {
  if (googleAuth.isTokenValid()) {
    // User is logged in
    Swal.fire({
      title: 'Logged in as',
      text: googleAuth.getUserEmail(),
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        googleAuth.logout();
        updateAuthUI();
        Swal.fire('Logged out', 'You have been logged out', 'success');
      }
    });
  } else {
    // User is not logged in
    window.location.href = 'login.html';
  }
}

function updateAuthUI() {
  const authBtn = document.getElementById('authBtn');
  if (!authBtn) return;

  if (googleAuth.isTokenValid()) {
    authBtn.innerHTML = '<i class="fas fa-user-check"></i> <span id="authBtnText">' + 
                       googleAuth.getUserEmail() + '</span>';
  } else {
    authBtn.innerHTML = '<i class="fas fa-user"></i> <span id="authBtnText">Login</span>';
  }
}

// Update UI on page load
window.addEventListener('load', updateAuthUI);
```

## Part 4: Testing

### Local Testing

1. Start a local server:
   ```bash
   python -m http.server 8000
   ```

2. Visit `http://localhost:8000/login.html`
3. Click **Sign in with Google**
4. Should redirect to Google login, then back to auth-callback.html

### GitHub Pages Testing

1. Push your changes to GitHub
2. Visit `https://yourusername.github.io/login.html`
3. Click **Sign in with Google**
4. Should work the same as local

## Troubleshooting

### "Invalid Client ID" Error
- Make sure CLIENT_ID and CLIENT_SECRET are correct in `AUTH_APPSCRIPT.gs`
- Check the exact format: `xxx.apps.googleusercontent.com`

### "Redirect URI mismatch" Error
- Make sure your redirect URIs in Google Cloud Console exactly match what you configured
- Don't forget the `/auth-callback.html` part

### "Access Denied" or CORS errors
- Make sure "Anyone" can access the Apps Script deployment
- Verify FRONTEND_URL in AUTH_APPSCRIPT.gs matches your domain

### Authorization code expired
- The code is only valid for ~10 minutes
- User needs to click the login button and go through the flow again

### Script not executing
- Check Apps Script execution logs: View > Execution logs
- Check browser console: F12 > Console
- Make sure the deployment URL is correct

## Security Notes

⚠️ **Important:**

1. **Never commit secrets** to GitHub:
   - Add `AUTH_APPSCRIPT.gs` to `.gitignore`
   - Or remove CLIENT_SECRET before committing
   - CLIENT_SECRET should only exist in Apps Script

2. **Apps Script deployment** should be "Anyone" can access (it handles auth)

3. **Users Sheet** should only be shared with people you trust (it's where logins are logged)

4. **For production**, consider:
   - Rate limiting on Apps Script
   - Adding email domain restrictions
   - Enabling 2FA on Google Cloud account

## Files Created

- `AUTH_APPSCRIPT.gs` - Apps Script backend
- `assets/js/google-auth.js` - Frontend auth module
- `login.html` - Login page
- `auth-callback.html` - OAuth callback handler
- `GOOGLE_OAUTH_SETUP.md` - This guide

## Next Steps

1. Complete Part 1 (Google Cloud)
2. Complete Part 2 (Apps Script)
3. Complete Part 3 (Update Frontend)
4. Test with Part 4 (Testing)
5. Push to GitHub Pages
6. Update your main README with login instructions

## Support

For issues:
- Check browser console (F12)
- Check Apps Script logs: View > Execution logs
- Verify all configuration values match exactly
- Test the OAuth flow independently from your app
