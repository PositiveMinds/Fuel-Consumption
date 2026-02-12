/**
 * IndexedDB Manager for Fleet Manager
 * Handles all database operations with fallback to localStorage
 */

const DB_NAME = 'FleetManagerDB';
const DB_VERSION = 1;
const STORES = {
    fuelHistory: 'fuelHistory',
    settings: 'settings'
};

class DatabaseManager {
    constructor() {
        this.db = null;
        this.useIndexedDB = true;
        this.initPromise = this.init();
    }

    async init() {
        if (!('indexedDB' in window)) {
            console.warn('IndexedDB not supported, using localStorage fallback');
            this.useIndexedDB = false;
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                this.useIndexedDB = false;
                resolve();
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create fuel history store
                if (!db.objectStoreNames.contains(STORES.fuelHistory)) {
                    const historyStore = db.createObjectStore(STORES.fuelHistory, { keyPath: 'id' });
                    historyStore.createIndex('date', 'date', { unique: false });
                    historyStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains(STORES.settings)) {
                    db.createObjectStore(STORES.settings, { keyPath: 'key' });
                }

                console.log('IndexedDB stores created');
            };
        });
    }

    // Settings operations
    async getSetting(key, defaultValue = null) {
        await this.initPromise;

        if (!this.useIndexedDB) {
            return localStorage.getItem(key) || defaultValue;
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([STORES.settings], 'readonly');
            const store = transaction.objectStore(STORES.settings);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };

            request.onerror = () => {
                resolve(defaultValue);
            };
        });
    }

    async setSetting(key, value) {
        await this.initPromise;

        if (!this.useIndexedDB) {
            localStorage.setItem(key, value);
            return;
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([STORES.settings], 'readwrite');
            const store = transaction.objectStore(STORES.settings);
            store.put({ key: key, value: value });

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = () => {
                console.error('Error setting:', key);
                resolve();
            };
        });
    }

    // Fuel history operations
    async addFuelEntry(record) {
        await this.initPromise;

        if (!this.useIndexedDB) {
            let history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
            history.unshift(record);
            localStorage.setItem('fuelHistory', JSON.stringify(history));
            return record.id;
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([STORES.fuelHistory], 'readwrite');
            const store = transaction.objectStore(STORES.fuelHistory);
            const request = store.add(record);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error adding entry:', request.error);
                resolve(null);
            };
        });
    }

    async getAllFuelEntries() {
        await this.initPromise;

        if (!this.useIndexedDB) {
            return JSON.parse(localStorage.getItem('fuelHistory') || '[]');
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([STORES.fuelHistory], 'readonly');
            const store = transaction.objectStore(STORES.fuelHistory);
            const request = store.getAll();

            request.onsuccess = () => {
                // Reverse to get newest first
                const results = request.result.reverse();
                resolve(results);
            };

            request.onerror = () => {
                console.error('Error getting entries:', request.error);
                resolve([]);
            };
        });
    }

    async getFuelEntryById(id) {
        await this.initPromise;

        if (!this.useIndexedDB) {
            const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
            return history.find(h => h.id === id) || null;
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([STORES.fuelHistory], 'readonly');
            const store = transaction.objectStore(STORES.fuelHistory);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                resolve(null);
            };
        });
    }

    async updateFuelEntry(id, updatedData) {
        await this.initPromise;

        if (!this.useIndexedDB) {
            let history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
            history = history.map(h => h.id === id ? { ...h, ...updatedData } : h);
            localStorage.setItem('fuelHistory', JSON.stringify(history));
            return updatedData;
        }

        const existing = await this.getFuelEntryById(id);
        const updated = { ...existing, ...updatedData };

        return new Promise((resolve) => {
            const transaction = this.db.transaction([STORES.fuelHistory], 'readwrite');
            const store = transaction.objectStore(STORES.fuelHistory);
            const request = store.put(updated);

            request.onsuccess = () => {
                resolve(updated);
            };

            request.onerror = () => {
                console.error('Error updating entry:', request.error);
                resolve(null);
            };
        });
    }

    async deleteFuelEntry(id) {
        await this.initPromise;

        if (!this.useIndexedDB) {
            let history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
            history = history.filter(h => h.id !== id);
            localStorage.setItem('fuelHistory', JSON.stringify(history));
            return true;
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([STORES.fuelHistory], 'readwrite');
            const store = transaction.objectStore(STORES.fuelHistory);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = () => {
                console.error('Error deleting entry:', request.error);
                resolve(false);
            };
        });
    }

    async clearAllFuelEntries() {
        await this.initPromise;

        if (!this.useIndexedDB) {
            localStorage.setItem('fuelHistory', '[]');
            return true;
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([STORES.fuelHistory], 'readwrite');
            const store = transaction.objectStore(STORES.fuelHistory);
            const request = store.clear();

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = () => {
                console.error('Error clearing entries:', request.error);
                resolve(false);
            };
        });
    }

    async getFuelEntriesByDateRange(startDate, endDate) {
        const allEntries = await this.getAllFuelEntries();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return allEntries.filter(entry => {
            const entryTime = new Date(entry.date).getTime();
            return entryTime >= start && entryTime <= end;
        });
    }

    async backup() {
        const entries = await this.getAllFuelEntries();
        const settings = {
            theme: await this.getSetting('theme'),
            notificationsEnabled: await this.getSetting('notificationsEnabled'),
            iosInstallDismissed: await this.getSetting('iosInstallDismissed')
        };

        return {
            version: DB_VERSION,
            timestamp: new Date().toISOString(),
            entries: entries,
            settings: settings
        };
    }

    async restore(backupData) {
        if (!backupData.entries || !Array.isArray(backupData.entries)) {
            console.error('Invalid backup data');
            return false;
        }

        try {
            // Clear existing data
            await this.clearAllFuelEntries();

            // Restore entries
            for (const entry of backupData.entries) {
                await this.addFuelEntry(entry);
            }

            // Restore settings
            if (backupData.settings) {
                if (backupData.settings.theme) {
                    await this.setSetting('theme', backupData.settings.theme);
                }
                if (backupData.settings.notificationsEnabled) {
                    await this.setSetting('notificationsEnabled', backupData.settings.notificationsEnabled);
                }
                if (backupData.settings.iosInstallDismissed) {
                    await this.setSetting('iosInstallDismissed', backupData.settings.iosInstallDismissed);
                }
            }

            console.log('Backup restored successfully');
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }

    async migrateFromLocalStorage() {
        // Migrate existing localStorage data to IndexedDB
        const fuelHistory = localStorage.getItem('fuelHistory');
        if (fuelHistory) {
            try {
                const entries = JSON.parse(fuelHistory);
                for (const entry of entries) {
                    await this.addFuelEntry(entry);
                }
                console.log('Migration from localStorage complete');
                return true;
            } catch (error) {
                console.error('Migration error:', error);
                return false;
            }
        }
        return true;
    }
}

// Create global database instance
const db = new DatabaseManager();

// Auto-migrate on load
window.addEventListener('load', () => {
    db.migrateFromLocalStorage();
});
