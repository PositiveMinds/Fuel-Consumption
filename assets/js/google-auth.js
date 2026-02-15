/**
 * Google OAuth Authentication Module
 * Handles login/logout with Google using Apps Script backend
 */

const AUTH_CONFIG = {
  // Apps Script deployment URL
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyqLWsXX4Lc_N7FQx5xL2aWMukHk8hb-INC74Pf1w_ypHnubwYZ0eDKKT6q-hwO0nN_/exec',
  
  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'google_auth_access_token',
    REFRESH_TOKEN: 'google_auth_refresh_token',
    USER_INFO: 'google_auth_user_info',
    TOKEN_EXPIRES: 'google_auth_token_expires',
    IS_AUTHENTICATED: 'google_auth_authenticated'
  }
};

class GoogleAuth {
  constructor() {
    this.accessToken = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    this.userInfo = JSON.parse(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER_INFO) || 'null');
    this.isAuthenticated = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  }

  /**
   * Start the OAuth flow
   */
  async startLogin() {
    try {
      // Generate OAuth URL directly (no need to call Apps Script)
      const authUrl = this.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Login failed: ' + error.message);
    }
  }

  /**
   * Generate Google OAuth URL
   */
  getGoogleAuthUrl() {
    const clientId = encodeURIComponent('333263441804-uu487tnl7bisdlk1gmmetla51t95m4uf.apps.googleusercontent.com');
    const redirectUri = encodeURIComponent('https://positiveminds.github.io/Fuel-Consumption/auth-callback.html');
    const scope = encodeURIComponent('email profile');
    
    return 'https://accounts.google.com/o/oauth2/v2/auth?' +
      'client_id=' + clientId +
      '&redirect_uri=' + redirectUri +
      '&response_type=code' +
      '&scope=' + scope +
      '&access_type=offline' +
      '&prompt=consent';
  }

  /**
   * Handle OAuth callback with authorization code
   * Call this from auth-callback.html with the code from URL
   */
  async handleCallback(code) {
    try {
      if (!code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for tokens
      const response = await this.callAppsScript({
        action: 'exchangeCode',
        code: code
      });

      if (response.success && response.data) {
        // Store tokens
        const tokenData = response.data;
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken);
        if (tokenData.refreshToken) {
          localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);
        }
        
        // Calculate expiration time
        const expiresIn = tokenData.expiresIn || 3600;
        const expiresAt = Date.now() + (expiresIn * 1000);
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN_EXPIRES, expiresAt);

        this.accessToken = tokenData.accessToken;

        // Get user info
        const userResponse = await this.callAppsScript({
          action: 'getUser',
          accessToken: this.accessToken
        });

        if (userResponse.success && userResponse.data) {
          this.userInfo = userResponse.data;
          localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(this.userInfo));
          localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED, 'true');
          this.isAuthenticated = true;

          // Redirect to main app
          window.location.href = AUTH_CONFIG.FRONTEND_URL || '/';
          return true;
        } else {
          throw new Error(userResponse.message || 'Failed to get user info');
        }
      } else {
        throw new Error(response.message || 'Token exchange failed');
      }
    } catch (error) {
      console.error('Callback error:', error);
      this.showError('Authentication failed: ' + error.message);
      return false;
    }
  }

  /**
   * Check if user is authenticated and token is still valid
   */
  isTokenValid() {
    if (!this.isAuthenticated || !this.accessToken) {
      return false;
    }

    const expiresAt = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN_EXPIRES);
    if (expiresAt && Date.now() > parseInt(expiresAt)) {
      // Token expired
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await this.callAppsScript({
        action: 'logout',
        accessToken: this.accessToken
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear stored data
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN_EXPIRES);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED);

    this.accessToken = null;
    this.userInfo = null;
    this.isAuthenticated = false;
  }

  /**
   * Get current user info
   */
  getUserInfo() {
    return this.userInfo;
  }

  /**
   * Get current email
   */
  getUserEmail() {
    return this.userInfo?.email || null;
  }

  /**
   * Call Apps Script backend
   */
  async callAppsScript(payload) {
    try {
      // Convert payload to URL encoded form data to avoid CORS issues
      const params = new URLSearchParams();
      for (const key in payload) {
        params.append(key, JSON.stringify(payload[key]));
      }

      const response = await fetch(AUTH_CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        body: params
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return JSON.parse(await response.text());
    } catch (error) {
      console.error('Apps Script call error:', error);
      throw error;
    }
  }

  /**
   * Show error message to user
   */
  showError(message) {
    if (window.Swal) {
      Swal.fire('Error', message, 'error');
    } else {
      alert(message);
    }
  }
}

// Create global instance
const googleAuth = new GoogleAuth();
