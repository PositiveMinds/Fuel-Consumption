/**
 * Vehicle Management Module
 * Handles multi-vehicle tracking, profiles, and vehicle-specific analytics
 */

class VehicleManager {
    constructor() {
        this.vehicles = [];
        this.activeVehicleId = null;
    }

    async init() {
        this.vehicles = await this.getAllVehicles();
        const storedActiveId = await db.getSetting('activeVehicleId');
        if (storedActiveId && this.vehicles.find(v => v.id === storedActiveId)) {
            this.activeVehicleId = storedActiveId;
        } else if (this.vehicles.length > 0) {
            this.activeVehicleId = this.vehicles[0].id;
        }
    }

    async createVehicle(vehicleData) {
        const vehicle = {
            id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: vehicleData.name,
            type: vehicleData.type,
            capacity: vehicleData.capacity,
            fuelType: vehicleData.fuelType,
            licenseOrSerial: vehicleData.licenseOrSerial,
            year: vehicleData.year,
            notes: vehicleData.notes || '',
            createdAt: new Date().toISOString(),
            tags: vehicleData.tags || []
        };

        await db.initPromise;

        if (!db.useIndexedDB) {
            let vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
            vehicles.push(vehicle);
            localStorage.setItem('vehicles', JSON.stringify(vehicles));
        } else {
            const transaction = db.db.transaction([STORES.vehicles], 'readwrite');
            const store = transaction.objectStore(STORES.vehicles);
            store.add(vehicle);
        }

        this.vehicles.push(vehicle);
        return vehicle.id;
    }

    async updateVehicle(vehicleId, updates) {
        const vehicle = await this.getVehicleById(vehicleId);
        if (!vehicle) return null;

        const updated = { ...vehicle, ...updates };

        await db.initPromise;

        if (!db.useIndexedDB) {
            let vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
            vehicles = vehicles.map(v => v.id === vehicleId ? updated : v);
            localStorage.setItem('vehicles', JSON.stringify(vehicles));
        } else {
            const transaction = db.db.transaction([STORES.vehicles], 'readwrite');
            const store = transaction.objectStore(STORES.vehicles);
            store.put(updated);
        }

        const idx = this.vehicles.findIndex(v => v.id === vehicleId);
        if (idx >= 0) {
            this.vehicles[idx] = updated;
        }

        return updated;
    }

    async deleteVehicle(vehicleId) {
        await db.initPromise;

        if (!db.useIndexedDB) {
            let vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
            vehicles = vehicles.filter(v => v.id !== vehicleId);
            localStorage.setItem('vehicles', JSON.stringify(vehicles));
        } else {
            const transaction = db.db.transaction([STORES.vehicles], 'readwrite');
            const store = transaction.objectStore(STORES.vehicles);
            store.delete(vehicleId);
        }

        this.vehicles = this.vehicles.filter(v => v.id !== vehicleId);

        if (this.activeVehicleId === vehicleId) {
            this.activeVehicleId = this.vehicles.length > 0 ? this.vehicles[0].id : null;
            if (this.activeVehicleId) {
                await db.setSetting('activeVehicleId', this.activeVehicleId);
            }
        }

        return true;
    }

    async getVehicleById(vehicleId) {
        await db.initPromise;

        if (!db.useIndexedDB) {
            const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
            return vehicles.find(v => v.id === vehicleId) || null;
        }

        return new Promise((resolve) => {
            const transaction = db.db.transaction([STORES.vehicles], 'readonly');
            const store = transaction.objectStore(STORES.vehicles);
            const request = store.get(vehicleId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    }

    async getAllVehicles() {
        await db.initPromise;

        if (!db.useIndexedDB) {
            return JSON.parse(localStorage.getItem('vehicles') || '[]');
        }

        return new Promise((resolve) => {
            const transaction = db.db.transaction([STORES.vehicles], 'readonly');
            const store = transaction.objectStore(STORES.vehicles);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    }

    async getVehicleStats(vehicleId) {
        const entries = await db.getAllFuelEntries();
        const vehicleEntries = entries.filter(e => e.vehicleId === vehicleId);

        const stats = {
            totalEntries: vehicleEntries.length,
            totalHours: 0,
            totalLiters: 0,
            totalDistance: 0,
            averageConsumption: 0,
            lastEntry: null
        };

        vehicleEntries.forEach(entry => {
            stats.totalHours += parseFloat(entry.totalHours) || 0;
            stats.totalLiters += parseFloat(entry.liters) || 0;
            stats.totalDistance += parseFloat(entry.distance) || 0;
        });

        if (vehicleEntries.length > 0) {
            stats.lastEntry = vehicleEntries[0];
            stats.averageConsumption = stats.totalLiters > 0 
                ? (stats.totalDistance / stats.totalLiters).toFixed(2)
                : 0;
        }

        return stats;
    }

    async setActiveVehicle(vehicleId) {
        this.activeVehicleId = vehicleId;
        await db.setSetting('activeVehicleId', vehicleId);
    }

    getActiveVehicle() {
        return this.vehicles.find(v => v.id === this.activeVehicleId) || null;
    }
}

const vehicleManager = new VehicleManager();

window.addEventListener('load', () => {
    vehicleManager.init();
});
