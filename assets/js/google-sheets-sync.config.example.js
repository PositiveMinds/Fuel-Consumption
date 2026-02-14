/**
 * Google Sheets Sync Configuration
 * 
 * IMPORTANT: Copy this file to google-sheets-sync.config.js and add your actual credentials.
 * Never commit google-sheets-sync.config.js to version control!
 * 
 * How to get your credentials:
 * 1. Go to https://console.cloud.google.com/
 * 2. Go to APIs & Services > Credentials
 * 3. Copy your Client ID and API Key
 * 4. Paste them below in the config file
 */

const GOOGLE_CONFIG = {
    // Replace with your actual Client ID from Google Cloud Console
    CLIENT_ID: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
    
    // Replace with your actual API Key from Google Cloud Console
    API_KEY: 'YOUR_API_KEY_HERE',
    
    // These should not be changed
    SCOPES: ['https://www.googleapis.com/auth/spreadsheets'],
    DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
};
