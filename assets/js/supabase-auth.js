/**
 * Supabase Authentication Module
 * Replaces Google Apps Script with Supabase backend
 */

// Import Supabase client
const SUPABASE_URL = 'https://ldrixdfpwsajnhhpcxmq.supabase.co';
const SUPABASE_ANON_KEY = '[REDACTED:jwt-token]';

// Create Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AUTH_CONFIG = {
  // Netlify Function URL (proxy to Google OAuth)
  AUTH_ENDPOINT: '/.netlify/functions/auth',
  
  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'google_auth_access_token',
    REFRESH_TOKEN: 'google_auth_refresh_token',
    USER_INFO: 'google_auth_user_info',
    TOKEN_EXPIRES: 'google_auth_token_expires',
    IS_AUTHENTICATED: 'google_auth_authenticated'
  }
};

class SupabaseAuth {
  constructor() {
    this.session = null;
    this.user = null;
    this.isAuthenticated = false;
    this.initialize();
  }

  async initialize() {
    try {
      // Get current session
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Auth initialization error:', error);
        return;
      }

      if (data.session) {
        this.session = data.session;
        this.user = data.session.user;
        this.isAuthenticated = true;
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED, 'true');
      } else {
        this.isAuthenticated = false;
        localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED);
      }
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  /**
   * Start Google OAuth login
   */
  async startLogin() {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-callback.html`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Redirect will happen automatically
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback() {
    try {
      // Get hash from URL
      const hash = window.location.hash;
      
      if (hash) {
        // Supabase will handle the hash automatically
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          throw new Error(error.message);
        }

        if (data.session) {
          this.session = data.session;
          this.user = data.session.user;
          this.isAuthenticated = true;

          // Store user info
          localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED, 'true');
          localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify({
            id: this.user.id,
            email: this.user.email,
            name: this.user.user_metadata?.full_name || this.user.email.split('@')[0],
            picture: this.user.user_metadata?.avatar_url || null
          }));

          // Create or update user profile
          await this.createOrUpdateProfile();

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Callback error:', error);
      throw error;
    }
  }

  /**
   * Create or update user profile
   */
  async createOrUpdateProfile() {
    try {
      if (!this.user) return;

      const { error } = await supabaseClient
        .from('profiles')
        .upsert({
          id: this.user.id,
          email: this.user.email,
          full_name: this.user.user_metadata?.full_name || this.user.email,
          avatar_url: this.user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Profile update error:', error);
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
    }
  }

  /**
   * Check if user is authenticated and session is valid
   */
  isTokenValid() {
    return this.isAuthenticated && this.session !== null;
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }

      // Clear local storage
      Object.values(AUTH_CONFIG.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      this.session = null;
      this.user = null;
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current user info
   */
  getUserInfo() {
    if (!this.user) return null;

    return {
      id: this.user.id,
      email: this.user.email,
      name: this.user.user_metadata?.full_name || this.user.email.split('@')[0],
      picture: this.user.user_metadata?.avatar_url || null
    };
  }

  /**
   * Get current user email
   */
  getUserEmail() {
    return this.user?.email || null;
  }

  /**
   * Get access token
   */
  getAccessToken() {
    return this.session?.access_token || null;
  }
}

// Create global instance
const supabaseAuth = new SupabaseAuth();

// Set up auth state listener
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    supabaseAuth.session = session;
    supabaseAuth.user = session.user;
    supabaseAuth.isAuthenticated = true;
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED, 'true');
  } else {
    supabaseAuth.session = null;
    supabaseAuth.user = null;
    supabaseAuth.isAuthenticated = false;
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED);
  }
});
