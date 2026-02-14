/**
 * Additional Features Module
 * Handles maintenance reminders, fuel price tracking, tags, and QR codes
 */

// Maintenance Reminders
class MaintenanceManager {
    async createReminder(vehicleId, reminderData) {
        const reminder = {
            id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            vehicleId: vehicleId,
            title: reminderData.title,
            description: reminderData.description || '',
            dueDate: reminderData.dueDate,
            dueKilometers: reminderData.dueKilometers || null,
            status: 'pending', // pending, completed
            category: reminderData.category, // oil-change, inspection, repair, etc.
            createdAt: new Date().toISOString()
        };

        await db.initPromise;

        if (!db.useIndexedDB) {
            let reminders = JSON.parse(localStorage.getItem('maintenanceReminders') || '[]');
            reminders.push(reminder);
            localStorage.setItem('maintenanceReminders', JSON.stringify(reminders));
        } else {
            const transaction = db.db.transaction([STORES.maintenanceReminders], 'readwrite');
            const store = transaction.objectStore(STORES.maintenanceReminders);
            store.add(reminder);
        }

        return reminder.id;
    }

    async getReminders(vehicleId) {
        await db.initPromise;

        if (!db.useIndexedDB) {
            const reminders = JSON.parse(localStorage.getItem('maintenanceReminders') || '[]');
            return reminders.filter(r => r.vehicleId === vehicleId);
        }

        return new Promise((resolve) => {
            const transaction = db.db.transaction([STORES.maintenanceReminders], 'readonly');
            const store = transaction.objectStore(STORES.maintenanceReminders);
            const index = store.index('vehicleId');
            const request = index.getAll(vehicleId);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    }

    async markComplete(reminderId) {
        await db.initPromise;

        if (!db.useIndexedDB) {
            let reminders = JSON.parse(localStorage.getItem('maintenanceReminders') || '[]');
            const reminder = reminders.find(r => r.id === reminderId);
            if (reminder) {
                reminder.status = 'completed';
                reminder.completedAt = new Date().toISOString();
            }
            localStorage.setItem('maintenanceReminders', JSON.stringify(reminders));
        } else {
            const transaction = db.db.transaction([STORES.maintenanceReminders], 'readwrite');
            const store = transaction.objectStore(STORES.maintenanceReminders);
            const request = store.get(reminderId);
            
            request.onsuccess = () => {
                const reminder = request.result;
                if (reminder) {
                    reminder.status = 'completed';
                    reminder.completedAt = new Date().toISOString();
                    store.put(reminder);
                }
            };
        }
    }

    async deleteReminder(reminderId) {
        await db.initPromise;

        if (!db.useIndexedDB) {
            let reminders = JSON.parse(localStorage.getItem('maintenanceReminders') || '[]');
            reminders = reminders.filter(r => r.id !== reminderId);
            localStorage.setItem('maintenanceReminders', JSON.stringify(reminders));
        } else {
            const transaction = db.db.transaction([STORES.maintenanceReminders], 'readwrite');
            const store = transaction.objectStore(STORES.maintenanceReminders);
            store.delete(reminderId);
        }
    }
}

// Fuel Price Tracking
class FuelPriceManager {
    async recordPrice(priceData) {
        const priceRecord = {
            id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: priceData.date,
            location: priceData.location || '',
            pricePerLiter: parseFloat(priceData.pricePerLiter),
            fuelType: priceData.fuelType,
            notes: priceData.notes || '',
            recordedAt: new Date().toISOString()
        };

        await db.initPromise;

        if (!db.useIndexedDB) {
            let prices = JSON.parse(localStorage.getItem('fuelPriceHistory') || '[]');
            prices.unshift(priceRecord);
            localStorage.setItem('fuelPriceHistory', JSON.stringify(prices));
        } else {
            const transaction = db.db.transaction([STORES.fuelPriceHistory], 'readwrite');
            const store = transaction.objectStore(STORES.fuelPriceHistory);
            store.add(priceRecord);
        }

        return priceRecord.id;
    }

    async getPriceHistory(fuelType, days = 30) {
        await db.initPromise;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        if (!db.useIndexedDB) {
            let prices = JSON.parse(localStorage.getItem('fuelPriceHistory') || '[]');
            return prices.filter(p => p.fuelType === fuelType && new Date(p.date) >= cutoffDate);
        }

        return new Promise((resolve) => {
            const transaction = db.db.transaction([STORES.fuelPriceHistory], 'readonly');
            const store = transaction.objectStore(STORES.fuelPriceHistory);
            const request = store.getAll();
            
            request.onsuccess = () => {
                const allPrices = request.result || [];
                const filtered = allPrices.filter(p => 
                    p.fuelType === fuelType && new Date(p.date) >= cutoffDate
                );
                resolve(filtered);
            };
            request.onerror = () => resolve([]);
        });
    }

    async getLatestPrice(fuelType) {
        const prices = await this.getPriceHistory(fuelType, 365);
        return prices.length > 0 ? prices[0] : null;
    }

    async getPriceAverage(fuelType, days = 30) {
        const prices = await this.getPriceHistory(fuelType, days);
        if (prices.length === 0) return 0;

        const sum = prices.reduce((acc, p) => acc + p.pricePerLiter, 0);
        return (sum / prices.length).toFixed(2);
    }
}

// QR Code Generation
class QRCodeManager {
    async generateEntryQR(entryId) {
        const entry = await db.getFuelEntryById(entryId);
        if (!entry) return null;

        const entryData = {
            id: entry.id,
            date: entry.date,
            liters: entry.liters,
            hours: entry.totalHours,
            consumption: entry.consumption
        };

        const qrText = JSON.stringify(entryData);
        const encodedText = encodeURIComponent(qrText);
        
        // Using qr-server API (free, no key required)
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedText}`;
    }

    async generateVehicleQR(vehicleId) {
        const vehicle = await vehicleManager.getVehicleById(vehicleId);
        if (!vehicle) return null;

        const vehicleData = {
            vehicleId: vehicle.id,
            name: vehicle.name,
            type: vehicle.type,
            capacity: vehicle.capacity
        };

        const qrText = JSON.stringify(vehicleData);
        const encodedText = encodeURIComponent(qrText);
        
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedText}`;
    }
}

// Location Tracking
class LocationTracker {
    async saveLocation(entryId, location) {
        const entry = await db.getFuelEntryById(entryId);
        if (!entry) return false;

        const updated = {
            ...entry,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: new Date().toISOString()
            }
        };

        await db.updateFuelEntry(entryId, { location: updated.location });
        return true;
    }

    async getLocationPermission() {
        if (!navigator.geolocation) {
            throw new Error('Geolocation not supported');
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    reject(new Error(`Geolocation error: ${error.message}`));
                }
            );
        });
    }

    getMapLink(location) {
        return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    }
}

// Global instances
const maintenanceManager = new MaintenanceManager();
const fuelPriceManager = new FuelPriceManager();
const qrCodeManager = new QRCodeManager();
const locationTracker = new LocationTracker();
