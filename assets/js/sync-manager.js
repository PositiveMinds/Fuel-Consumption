/**
 * Sync Manager - Handles periodic and manual sync operations
 * Controls Google Sheets synchronization from the UI
 */

/**
 * Update Google Sheets sync interval
 */
async function updateGoogleSyncInterval() {
    const intervalInput = document.getElementById('googleSyncInterval');
    const interval = parseInt(intervalInput.value);

    if (!interval || interval < 1 || interval > 120) {
        Swal.fire({
            icon: 'warning',
            title: 'Invalid Interval',
            text: 'Please enter a value between 1 and 120 minutes',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    try {
        if (!window.googleSheetsManager) {
            throw new Error('Google Sheets manager not initialized');
        }

        await window.googleSheetsManager.setSyncInterval(interval);
        
        Swal.fire({
            icon: 'success',
            title: 'Interval Updated',
            text: `Auto-sync interval set to ${interval} minutes`,
            confirmButtonColor: '#2563eb'
        });

        updateGoogleSyncStatus();
    } catch (error) {
        console.error('Error updating sync interval:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update sync interval: ' + error.message,
            confirmButtonColor: '#2563eb'
        });
    }
}

/**
 * Toggle auto-sync on/off
 */
async function toggleGoogleAutoSync() {
    const toggle = document.getElementById('googleAutoSyncToggle');
    
    try {
        if (!window.googleSheetsManager) {
            throw new Error('Google Sheets manager not initialized');
        }

        if (toggle.checked) {
            await window.googleSheetsManager.enableAutoSync();
            showNotification('Auto-sync enabled', 'success');
        } else {
            await window.googleSheetsManager.disableAutoSync();
            showNotification('Auto-sync disabled', 'info');
        }

        updateGoogleSyncStatus();
    } catch (error) {
        console.error('Error toggling auto-sync:', error);
        toggle.checked = !toggle.checked; // Revert toggle
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to toggle auto-sync: ' + error.message,
            confirmButtonColor: '#2563eb'
        });
    }
}

/**
 * Update Google Sheets sync status display
 */
async function updateGoogleSyncStatus() {
    try {
        if (!window.googleSheetsManager) return;

        const interval = window.googleSheetsManager.syncInterval / 60 / 1000;
        const isEnabled = await window.googleSheetsManager.isAutoSyncEnabled();
        const lastSync = await window.googleSheetsManager.getLastSyncTime();

        // Update toggle state
        const toggle = document.getElementById('googleAutoSyncToggle');
        if (toggle) {
            toggle.checked = isEnabled;
        }

        // Update interval input
        const intervalInput = document.getElementById('googleSyncInterval');
        if (intervalInput) {
            intervalInput.value = interval;
        }

        // Update status text
        const statusText = document.getElementById('googleSyncStatusDetail');
        if (statusText) {
            if (isEnabled) {
                statusText.textContent = `✓ Auto-sync enabled (every ${interval} minutes)`;
            } else {
                statusText.textContent = '✗ Auto-sync is disabled';
            }
        }

        // Update last sync time
        const lastSyncEl = document.getElementById('googleLastSyncTime');
        if (lastSyncEl && lastSync) {
            const timeStr = lastSync.toLocaleString();
            lastSyncEl.textContent = timeStr;
        }
    } catch (error) {
        console.error('Error updating sync status:', error);
    }
}

/**
 * Initialize sync manager on app load
 */
async function initializeSyncManager() {
    try {
        // Wait a moment for googleSheetsManager to be initialized
        let attempts = 0;
        while (!window.googleSheetsManager && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.googleSheetsManager) {
            console.warn('Google Sheets manager not initialized');
            return;
        }

        // Update sync status display
        await updateGoogleSyncStatus();

        // Listen for storage changes to update UI
        window.addEventListener('storage', () => {
            updateGoogleSyncStatus();
        });
    } catch (error) {
        console.error('Error initializing sync manager:', error);
    }
}

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSyncManager);
} else {
    initializeSyncManager();
}
