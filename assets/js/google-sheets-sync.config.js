// Google Sheets API Configuration
// Replace these with your actual Google Cloud Project credentials

const GOOGLE_CONFIG = {
    CLIENT_ID: '333263441804-ff50n6q2o23560u1tce009sq689tbfri.apps.googleusercontent.com',
    API_KEY: 'AIzaSyBFeYuQ8L4Pb7cdzFUEJsZPhsUjgklYxCU',
    SCOPES: ['https://www.googleapis.com/auth/spreadsheets'],
    DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
};

// Log to confirm config is loaded
console.log('Google Sheets configuration loaded');
