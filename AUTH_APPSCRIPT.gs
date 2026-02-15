// Google Apps Script for Fleet Manager Authentication
// Deploy as web app: New > Project > Deploy > New Deployment > Type: Web app
// Execute as: Your account | Allow access: Anyone

// Configuration - Update these values
const CONFIG = {
  // Get these from Google Cloud Console > Credentials > OAuth 2.0
  // ⚠️ IMPORTANT: Keep secrets ONLY in Google Apps Script, not in GitHub
  CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  CLIENT_SECRET: 'YOUR_CLIENT_SECRET',
  REDIRECT_URI: 'https://positiveminds.github.io/Fuel-Consumption/auth-callback.html',
  
  // Your app's frontend URL
  FRONTEND_URL: 'https://positiveminds.github.io/Fuel-Consumption',
  
  // Google Sheet to store authorized users
  // Share this sheet with yourself, get the ID from the URL
  USERS_SHEET_ID: '1augZ3DeQGYPpSv7Vwb4nAu_UBTsclMtxSDfJdMJn0Dg',
  
  // Your gmail for sending verification emails (optional)
  ADMIN_EMAIL: 'positiveminds256@gmail.com'
};

// Verify CORS by checking origin
function doOptions(e) {
  return HtmlService.createHtmlOutput('')
    .setHeader('Access-Control-Allow-Origin', CONFIG.FRONTEND_URL)
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

// Initialize auth - returns OAuth URL for user to click
function doPost(e) {
  const request = JSON.parse(e.postData.contents);
  const action = request.action;

  const response = {
    success: false,
    message: '',
    data: null
  };

  try {
    if (action === 'getAuthUrl') {
      response.data = getGoogleAuthUrl();
      response.success = true;
    } 
    else if (action === 'exchangeCode') {
      const code = request.code;
      const result = exchangeCodeForToken(code);
      response.data = result;
      response.success = true;
    }
    else if (action === 'getUser') {
      const accessToken = request.accessToken;
      const user = getUserInfo(accessToken);
      response.data = user;
      response.success = true;
    }
    else if (action === 'logout') {
      response.data = { message: 'Logged out' };
      response.success = true;
    }
    else {
      response.message = 'Unknown action: ' + action;
    }
  } catch (error) {
    response.message = error.toString();
  }

  return createCorsResponse(JSON.stringify(response));
}

// Generate Google OAuth URL
function getGoogleAuthUrl() {
  const scope = encodeURIComponent('email profile');
  const clientId = encodeURIComponent(CONFIG.CLIENT_ID);
  const redirectUri = encodeURIComponent(CONFIG.REDIRECT_URI);
  
  return 'https://accounts.google.com/o/oauth2/v2/auth?' +
    'client_id=' + clientId +
    '&redirect_uri=' + redirectUri +
    '&response_type=code' +
    '&scope=' + scope +
    '&access_type=offline' +
    '&prompt=consent';
}

// Exchange authorization code for access token
function exchangeCodeForToken(code) {
  const payload = {
    code: code,
    client_id: CONFIG.CLIENT_ID,
    client_secret: CONFIG.CLIENT_SECRET,
    redirect_uri: CONFIG.REDIRECT_URI,
    grant_type: 'authorization_code'
  };

  const options = {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', options);
  const result = JSON.parse(response.getContentText());

  if (result.error) {
    throw new Error('Token exchange failed: ' + result.error_description);
  }

  // Store token in cache (expires in 1 hour)
  const cacheService = CacheService.getUserCache();
  cacheService.put('accessToken_' + result.access_token.substring(0, 20), result.access_token, 3600);

  return {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    expiresIn: result.expires_in,
    tokenType: result.token_type
  };
}

// Get user information from Google
function getUserInfo(accessToken) {
  const options = {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v2/userinfo', options);
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Failed to get user info');
  }

  const userInfo = JSON.parse(response.getContentText());

  // Add user to authorized users sheet if not exists
  addAuthorizedUser(userInfo);

  return {
    id: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture
  };
}

// Store authorized user in Google Sheet
function addAuthorizedUser(userInfo) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.USERS_SHEET_ID).getSheetByName('Users');
    if (!sheet) return;

    const range = sheet.getRange('A2:B');
    const values = range.getValues();

    // Check if user already exists
    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === userInfo.email) {
        // Update last login
        sheet.getRange(i + 2, 3).setValue(new Date());
        return;
      }
    }

    // Add new user
    const nextRow = values.length + 2;
    sheet.getRange(nextRow, 1).setValue(userInfo.email);
    sheet.getRange(nextRow, 2).setValue(userInfo.name);
    sheet.getRange(nextRow, 3).setValue(new Date());
  } catch (error) {
    Logger.log('Error adding user: ' + error);
    // Silently fail - not critical
  }
}

// Create CORS response
function createCorsResponse(content) {
  return HtmlService.createHtmlOutput(content)
    .setHeader('Access-Control-Allow-Origin', CONFIG.FRONTEND_URL)
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Content-Type', 'application/json');
}

// Log function for debugging (view in Apps Script editor > Execution logs)
function testAuth() {
  Logger.log('Config loaded: ' + CONFIG.CLIENT_ID);
  Logger.log('Auth URL: ' + getGoogleAuthUrl());
}
