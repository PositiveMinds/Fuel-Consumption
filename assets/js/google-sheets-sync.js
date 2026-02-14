/**
 * Google Sheets Sync Manager (using Google Identity Services)
 * Handles two-way sync between IndexedDB and Google Sheets
 * 
 * Configuration loaded from google-sheets-sync.config.js
 */

class GoogleSheetsSyncManager {
    constructor() {
        this.spreadsheetId = null;
        this.isAuthenticated = false;
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.lastSyncTime = null;
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
        this.tokenRefreshInterval = null;
        this.init();
    }

    async init() {
        // Load stored Google config
        const storedSpreadsheetId = await db.getSetting('googleSheetsSpreadsheetId');
        const storedAccessToken = await db.getSetting('googleSheetsAccessToken');
        const storedTokenExpiresAt = await db.getSetting('googleSheetsTokenExpiresAt');
        
        // Restore spreadsheet ID if available
        if (storedSpreadsheetId) {
            this.spreadsheetId = storedSpreadsheetId;
            console.log('Spreadsheet ID restored from storage:', this.spreadsheetId);
        }
        
        // Restore authentication if token is available
        if (storedAccessToken) {
            this.accessToken = storedAccessToken;
            this.tokenExpiresAt = storedTokenExpiresAt ? parseInt(storedTokenExpiresAt) : null;
            this.isAuthenticated = true;
            console.log('Access token restored from storage');
            
            // Set up token refresh if we have an expiration time
            if (this.tokenExpiresAt) {
                this.startTokenRefreshTimer();
            }
            
            // Start auto-sync on app load if both spreadsheet and token are available
            if (this.spreadsheetId) {
                this.startAutoSync();
            }
        }

        // Initialize Google Sign-In
        this.initializeGoogleSignIn();
    }

    initializeGoogleSignIn() {
        // Wait for Google library to load
        const checkGoogle = setInterval(() => {
            if (window.google && window.google.accounts) {
                clearInterval(checkGoogle);
                console.log('Google Sign-In library loaded');
                
                // Initialize the Google Sign-In client
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CONFIG.CLIENT_ID,
                    callback: (response) => this.handleSignInResponse(response)
                });
            }
        }, 100);
    }

    async authenticateWithGoogle() {
        try {
            console.log('Starting Google authentication...');
            
            // Check if credentials are configured
            if (!GOOGLE_CONFIG.CLIENT_ID || GOOGLE_CONFIG.CLIENT_ID.includes('YOUR_')) {
                throw new Error('Google Sheets API credentials not configured. Please update google-sheets-sync.config.js with your Client ID and API Key.');
            }

            console.log('Requesting access token...');
            
            // Request access token with implicit flow
            return new Promise((resolve, reject) => {
                // Use the new Google Sign-In flow
                window.google.accounts.id.renderButton(
                    document.createElement('div'),
                    { theme: 'outline', size: 'large', hidden: true }
                );

                // Use One Tap or OAuth consent screen
                window.google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CONFIG.CLIENT_ID,
                    scope: GOOGLE_CONFIG.SCOPES.join(' '),
                    callback: (response) => {
                        if (response.access_token) {
                            this.accessToken = response.access_token;
                            this.isAuthenticated = true;
                            
                            // Calculate token expiration (access tokens expire in ~3599 seconds)
                            this.tokenExpiresAt = Date.now() + ((response.expires_in || 3599) * 1000);
                            
                            // Store token and expiration
                            db.setSetting('googleSheetsAccessToken', this.accessToken).then(() => {
                                db.setSetting('googleSheetsTokenExpiresAt', this.tokenExpiresAt).then(() => {
                                    console.log('Access token saved, expires at', new Date(this.tokenExpiresAt));
                                    this.startTokenRefreshTimer();
                                    resolve({
                                        success: true,
                                        message: 'Authenticated with Google'
                                    });
                                });
                            });
                        } else if (response.error) {
                            reject(new Error(`Google authentication failed: ${response.error}`));
                        }
                    }
                }).requestAccessToken({ prompt: 'consent' });
            });
        } catch (error) {
            console.error('Google authentication error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    handleSignInResponse(response) {
        if (response.credential) {
            console.log('Sign in successful');
            // The JWT token is in response.credential
            // You can decode it to get user info
            this.accessToken = response.credential;
            this.isAuthenticated = true;
            db.setSetting('googleSheetsAccessToken', this.accessToken);
        }
    }

    startTokenRefreshTimer() {
        // Clear any existing interval
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
        }

        // Refresh token 5 minutes before it expires
        const timeUntilExpiry = this.tokenExpiresAt - Date.now();
        const refreshIn = Math.max(0, timeUntilExpiry - (5 * 60 * 1000)); // 5 minutes before expiry

        console.log(`Token refresh scheduled in ${refreshIn / 1000 / 60} minutes`);

        setTimeout(() => {
            this.refreshAccessToken();
        }, refreshIn);
    }

    async refreshAccessToken() {
        try {
            console.log('Refreshing access token...');
            
            // Request a new token silently
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CONFIG.CLIENT_ID,
                scope: GOOGLE_CONFIG.SCOPES.join(' '),
                callback: (response) => {
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        this.tokenExpiresAt = Date.now() + ((response.expires_in || 3599) * 1000);
                        
                        db.setSetting('googleSheetsAccessToken', this.accessToken);
                        db.setSetting('googleSheetsTokenExpiresAt', this.tokenExpiresAt);
                        
                        console.log('Access token refreshed');
                        this.startTokenRefreshTimer(); // Set up next refresh
                    }
                }
            });

            // Request token with prompt='none' for silent refresh
            tokenClient.requestAccessToken({ prompt: '' });
        } catch (error) {
            console.error('Token refresh failed:', error);
            // If refresh fails, require re-authentication
            this.isAuthenticated = false;
            this.accessToken = null;
        }
    }

    async signOut() {
        try {
            // Revoke token
            if (this.accessToken) {
                // Make a request to revoke the token
                const formData = new FormData();
                formData.append('token', this.accessToken);
                
                fetch('https://oauth2.googleapis.com/revoke', {
                    method: 'POST',
                    body: formData
                }).catch(() => {
                    // Silently fail if revoke doesn't work
                });
            }
            
            this.isAuthenticated = false;
            this.accessToken = null;
            await db.setSetting('googleSheetsAccessToken', null);
            await db.setSetting('googleSheetsSpreadsheetId', null);
            this.spreadsheetId = null;
            console.log('Signed out from Google');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    async createSpreadsheet(title = 'Fleet Manager Fuel Data') {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated with Google');
        }

        try {
            const spreadsheet = {
                properties: {
                    title: title
                },
                sheets: [
                    {
                        properties: {
                            sheetId: 0,
                            title: 'Fuel Entries'
                        }
                    }
                ]
            };

            const response = await this.makeGoogleSheetsRequest(
                'POST',
                'https://sheets.googleapis.com/v4/spreadsheets',
                spreadsheet
            );

            this.spreadsheetId = response.spreadsheetId;
            await db.setSetting('googleSheetsSpreadsheetId', this.spreadsheetId);
            
            // Initialize sheet headers
            await this.initializeSheetHeaders();
            
            return this.spreadsheetId;
        } catch (error) {
            console.error('Create spreadsheet error:', error);
            throw error;
        }
    }

    async initializeSheetHeaders() {
        const headers = [
            ['ID', 'Site', 'Period', 'Date', 'Station', 'Operator', 'Equipment', 'Start Time', 'End Time', 'Distance', 'Total Hours', 'Liters', 'Consumption', 'Timestamp', 'LastSynced']
        ];

        try {
            await this.makeGoogleSheetsRequest(
                'PUT',
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/'Fuel Entries'!A1:O1?valueInputOption=RAW`,
                { values: headers }
            );
        } catch (error) {
            console.error('Initialize headers error:', error);
            throw error;
        }
    }

    async syncToGoogleSheets() {
        if (!this.isAuthenticated || !this.spreadsheetId) {
            throw new Error('Not authenticated or no spreadsheet selected');
        }

        try {
            const entries = await db.getAllFuelEntries();
            const values = entries.map(entry => [
                entry.id,
                entry.site || '',
                entry.period || '',
                entry.date || '',
                entry.station || '',
                entry.operator || '',
                entry.equipment || '',
                entry.startTime || '',
                entry.endTime || '',
                entry.distance || '',
                entry.totalHours || '',
                entry.liters || '',
                entry.consumption || '',
                entry.timestamp || '',
                new Date().toISOString()
            ]);

            if (values.length === 0) {
                console.log('No entries to sync');
                return { success: true, synced: 0 };
            }

            // Clear existing data (except headers)
            await this.makeGoogleSheetsRequest(
                'POST',
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/'Fuel Entries'!A2:O:clear`
            );

            // Add all entries
            await this.makeGoogleSheetsRequest(
                'PUT',
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/'Fuel Entries'!A2?valueInputOption=RAW`,
                { values: values }
            );

            this.lastSyncTime = new Date();
            await db.setSetting('lastGoogleSheetsSyncTime', this.lastSyncTime.toISOString());
            
            return { success: true, synced: values.length };
        } catch (error) {
            console.error('Sync to Google Sheets error:', error);
            throw error;
        }
    }

    async syncFromGoogleSheets() {
        if (!this.isAuthenticated || !this.spreadsheetId) {
            throw new Error('Not authenticated or no spreadsheet selected');
        }

        try {
            const response = await this.makeGoogleSheetsRequest(
                'GET',
                `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/'Fuel Entries'!A2:O`
            );

            const rows = response.values || [];
            const headers = ['id', 'site', 'period', 'date', 'station', 'operator', 'equipment', 'startTime', 'endTime', 'distance', 'totalHours', 'liters', 'consumption', 'timestamp', 'lastSynced'];
            
            let newEntries = 0;
            let updatedEntries = 0;

            for (const row of rows) {
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = row[index] || null;
                });

                const existingEntry = await db.getFuelEntryById(Number(entry.id));

                if (!existingEntry) {
                    // New entry from Google Sheets
                    await db.addFuelEntry({
                        id: Number(entry.id),
                        site: entry.site,
                        period: entry.period,
                        date: entry.date,
                        station: entry.station,
                        operator: entry.operator,
                        equipment: entry.equipment,
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        distance: parseFloat(entry.distance) || 0,
                        totalHours: parseFloat(entry.totalHours) || 0,
                        liters: parseFloat(entry.liters) || 0,
                        consumption: entry.consumption,
                        timestamp: entry.timestamp || new Date().toISOString()
                    });
                    newEntries++;
                } else if (entry.lastSynced > existingEntry.timestamp) {
                    // Google Sheets version is newer
                    await db.updateFuelEntry(Number(entry.id), {
                        site: entry.site,
                        period: entry.period,
                        date: entry.date,
                        station: entry.station,
                        operator: entry.operator,
                        equipment: entry.equipment,
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        distance: parseFloat(entry.distance) || 0,
                        totalHours: parseFloat(entry.totalHours) || 0,
                        liters: parseFloat(entry.liters) || 0,
                        consumption: entry.consumption,
                        timestamp: new Date().toISOString()
                    });
                    updatedEntries++;
                }
            }

            this.lastSyncTime = new Date();
            await db.setSetting('lastGoogleSheetsSyncTime', this.lastSyncTime.toISOString());
            
            return { success: true, newEntries, updatedEntries };
        } catch (error) {
            console.error('Sync from Google Sheets error:', error);
            throw error;
        }
    }

    async bidirectionalSync() {
        try {
            // Check if there's any local data to sync
            const localEntries = await db.getAllFuelEntries();
            const lastSyncTime = await this.getLastSyncTime();
            
            // Check if there are unsync'd entries (newer than last sync)
            const hasNewData = localEntries.some(entry => {
                if (!lastSyncTime) return true; // First sync
                return new Date(entry.timestamp) > lastSyncTime;
            });

            if (!hasNewData && localEntries.length > 0) {
                console.log('No new data to sync, skipping sync');
                return {
                    success: true,
                    pulled: { newEntries: 0, updatedEntries: 0 },
                    pushed: { synced: 0 }
                };
            }

            // First sync from Google Sheets (pull remote changes)
            const pullResult = await this.syncFromGoogleSheets();
            
            // Then sync to Google Sheets (push local changes)
            const pushResult = await this.syncToGoogleSheets();
            
            return {
                success: true,
                pulled: { newEntries: pullResult.newEntries, updatedEntries: pullResult.updatedEntries },
                pushed: { synced: pushResult.synced }
            };
        } catch (error) {
            console.error('Bidirectional sync error:', error);
            throw error;
        }
    }

    startAutoSync() {
        if (this.isAuthenticated && this.spreadsheetId) {
            console.log(`Starting auto-sync every ${this.syncInterval / 1000 / 60} minutes`);
            
            // Do initial sync
            this.bidirectionalSync().catch(error => {
                console.error('Auto sync error:', error);
            });

            // Set up interval sync
            if (this.tokenRefreshInterval) {
                clearInterval(this.tokenRefreshInterval);
            }
            
            this.tokenRefreshInterval = setInterval(() => {
                if (this.isAuthenticated && this.spreadsheetId) {
                    console.log('Running scheduled auto-sync...');
                    this.bidirectionalSync().catch(error => {
                        console.error('Auto sync error:', error);
                    });
                }
            }, this.syncInterval);
        }
    }

    async getLastSyncTime() {
        const lastSync = await db.getSetting('lastGoogleSheetsSyncTime');
        return lastSync ? new Date(lastSync) : null;
    }

    async setSyncInterval(minutes) {
        this.syncInterval = minutes * 60 * 1000;
        // Restart auto sync with new interval
        this.startAutoSync();
    }

    /**
     * Make a request to Google Sheets API
     */
    async makeGoogleSheetsRequest(method, url, data = null) {
        if (!this.accessToken) {
            throw new Error('No access token. Please authenticate first.');
        }

        const options = {
            method: method,
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const error = await response.json();
                console.error('Google Sheets API error:', error);
                
                // If 401 (Unauthorized), clear token and require re-auth
                if (response.status === 401) {
                    this.isAuthenticated = false;
                    this.accessToken = null;
                    await db.setSetting('googleSheetsAccessToken', null);
                    throw new Error('Authentication expired. Please sign in again.');
                }
                
                throw new Error(error.error?.message || 'Google Sheets API error');
            }

            return await response.json();
        } catch (error) {
            console.error('Request to Google Sheets API failed:', error);
            throw error;
        }
    }
}

// Initialize Google Sheets Sync Manager
const googleSheetsSync = new GoogleSheetsSyncManager();
