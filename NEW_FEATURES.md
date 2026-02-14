# Fleet Manager - New Features Documentation

## Overview
Added comprehensive multi-vehicle tracking, photo management, and advanced features to the Fleet Manager application.

## Features Implemented

### 1. Multi-Vehicle Management
- **Track multiple vehicles/generators separately**
  - Create vehicle profiles with specs (name, type, capacity, fuel type, license/serial)
  - Switch between vehicles easily
  - Vehicle-specific analytics and statistics
  
- **Files**: `assets/js/vehicles.js`
- **Database Store**: `vehicles` (IndexedDB)

**Usage**:
```javascript
// Create vehicle
await vehicleManager.createVehicle({
    name: 'Generator 1',
    type: 'generator',
    capacity: 100,
    fuelType: 'diesel',
    licenseOrSerial: 'GEN-001'
});

// Set active vehicle
await vehicleManager.setActiveVehicle(vehicleId);

// Get vehicle stats
const stats = await vehicleManager.getVehicleStats(vehicleId);
```

---

### 2. Photo Attachments (Google Drive)
- **Upload receipt and gauge photos to Google Drive**
  - Auto-organized in "Fleet Manager Photos" folder
  - Stores links in database for easy retrieval
  - Thumbnail preview in app
  
- **Files**: `assets/js/google-drive-sync.js`
- **Database Store**: `photos` (IndexedDB + Google Drive)

**Features**:
- Automatic folder creation in Google Drive
- Photo metadata stored locally (Drive file IDs, links)
- Full-size view and download options
- Delete synchronized photos
- 10MB file size limit

**Usage**:
```javascript
// Upload photo
const photoRecord = await googleDriveSync.uploadPhoto(file, entryId);

// Get photos for entry
const photos = await googleDriveSync.getPhotosByEntryId(entryId);

// Delete photo
await googleDriveSync.deletePhoto(photoId);
```

**Google Sheets Sync Config Update**:
- Added `https://www.googleapis.com/auth/drive.file` scope
- Enable Drive API in Google Cloud Console
- Photos sync automatically with fuel entries

---

### 3. Location Tracking (GPS)
- **Save GPS coordinates with fuel entries**
  - Automatic geolocation capture
  - Accuracy information stored
  - View location on Google Maps
  
- **Files**: `assets/js/features.js`
- **Database**: Stored in fuel entry `location` field

**Usage**:
```javascript
// Capture location
const location = await locationTracker.getLocationPermission();
await locationTracker.saveLocation(entryId, location);

// Get map link
const mapUrl = locationTracker.getMapLink(location);
```

---

### 4. Maintenance Reminders
- **Track vehicle maintenance tasks**
  - Set reminders by date or distance (kilometers)
  - Categorize: oil change, inspection, repair, service
  - Mark reminders as completed
  
- **Files**: `assets/js/features.js`
- **Database Store**: `maintenanceReminders` (IndexedDB)

**Usage**:
```javascript
// Create reminder
await maintenanceManager.createReminder(vehicleId, {
    title: 'Oil Change',
    dueDate: '2024-03-01',
    dueKilometers: 5000,
    category: 'oil-change',
    description: 'Change engine oil'
});

// Get reminders
const reminders = await maintenanceManager.getReminders(vehicleId);

// Mark complete
await maintenanceManager.markComplete(reminderId);
```

---

### 5. Fuel Price Tracking History
- **Record historical fuel prices**
  - Track price trends over time
  - Location and fuel type tracking
  - Calculate price averages
  
- **Files**: `assets/js/features.js`
- **Database Store**: `fuelPriceHistory` (IndexedDB)

**Usage**:
```javascript
// Record price
await fuelPriceManager.recordPrice({
    date: '2024-02-14',
    location: 'Shell Station',
    pricePerLiter: 50.50,
    fuelType: 'diesel'
});

// Get price history
const history = await fuelPriceManager.getPriceHistory('diesel', 30); // Last 30 days

// Get average price
const avg = await fuelPriceManager.getPriceAverage('diesel', 30);

// Get latest price
const latest = await fuelPriceManager.getLatestPrice('diesel');
```

---

### 6. QR Code Generation
- **Generate QR codes for entries and vehicles**
  - Encodes entry/vehicle data
  - Easy sharing and tracking
  - Download as PNG
  
- **Files**: `assets/js/features.js`
- **API**: Uses free qr-server.com API

**Usage**:
```javascript
// Generate entry QR
const qrUrl = await qrCodeManager.generateEntryQR(entryId);

// Generate vehicle QR
const qrUrl = await qrCodeManager.generateVehicleQR(vehicleId);
```

---

### 7. Custom Tags/Categories
- **Organize entries with custom tags**
  - Add tags to vehicles
  - Filter entries by tags
  - Extensible for future use
  
- **Database Store**: `tags` (IndexedDB)

**Usage**:
```javascript
// Add tag to vehicle
await vehicleManager.addTag(vehicleId, 'urgent-maintenance');

// Remove tag
await vehicleManager.removeTag(vehicleId, 'urgent-maintenance');
```

---

## Database Schema Updates

Updated `DB_VERSION` to 2. New stores added:

```javascript
STORES = {
    fuelHistory: 'fuelHistory',      // Updated with vehicleId index
    settings: 'settings',
    vehicles: 'vehicles',            // NEW
    photos: 'photos',                // NEW (metadata only)
    maintenanceReminders: 'maintenanceReminders', // NEW
    fuelPriceHistory: 'fuelPriceHistory',         // NEW
    tags: 'tags'                     // NEW
}
```

### Fuel History Schema
```javascript
{
    id: string,
    vehicleId: string,  // NEW
    date: string,
    liters: number,
    totalHours: number,
    distance: number,
    consumption: string,
    operator: string,
    equipment: string,
    startTime: string,
    endTime: string,
    period: string,
    site: string,
    timestamp: number,
    location: {         // NEW
        latitude: number,
        longitude: number,
        accuracy: number,
        timestamp: string
    }
}
```

### Vehicle Schema
```javascript
{
    id: string,
    name: string,
    type: string,
    capacity: number,
    fuelType: string,
    licenseOrSerial: string,
    year: string,
    notes: string,
    createdAt: string,
    tags: [string]
}
```

### Photo Schema
```javascript
{
    id: string,
    entryId: string,
    driveFileId: string,    // Google Drive file ID
    driveLink: string,      // View link
    downloadLink: string,   // Download link
    fileName: string,
    mimeType: string,
    uploadedAt: string,
    thumbnailUrl: string
}
```

### Maintenance Reminder Schema
```javascript
{
    id: string,
    vehicleId: string,
    title: string,
    description: string,
    dueDate: string,
    dueKilometers: number,
    status: string,  // pending, completed
    category: string,
    createdAt: string,
    completedAt: string  // When marked complete
}
```

### Fuel Price History Schema
```javascript
{
    id: string,
    date: string,
    location: string,
    pricePerLiter: number,
    fuelType: string,
    notes: string,
    recordedAt: string
}
```

---

## Files Added

1. **assets/js/vehicles.js** - Vehicle management (150 lines)
2. **assets/js/google-drive-sync.js** - Drive photo uploads (280 lines)
3. **assets/js/features.js** - Maintenance, pricing, QR, location (300 lines)
4. **assets/js/ui-features.js** - UI/Modal handlers (380 lines)
5. **NEW_FEATURES.md** - This documentation

---

## Integration Notes

### Google Sheets Sync
- Photo metadata is NOT synced to Sheets automatically
- Only Drive links are stored locally
- Photos remain in Google Drive for backup/accessibility

### Backward Compatibility
- All existing fuel entries remain functional
- New `vehicleId` field is optional for legacy entries
- Database migration happens automatically on upgrade

### Performance Considerations
- Photo uploads are async (non-blocking)
- Vehicle/reminder queries use IndexedDB indices
- Location services are on-demand only
- QR codes generated client-side (no server calls)

---

## Future Enhancements

- [ ] Mobile app native photo camera integration
- [ ] Photo batch upload
- [ ] Recurring maintenance reminders
- [ ] Fuel consumption predictions
- [ ] Expense tracking
- [ ] Multi-user support
- [ ] Cloud backup integration
- [ ] Advanced analytics dashboard

---

## API Configuration Required

### Google Cloud Console Setup

1. **Enable Google Drive API** in your project
2. **Add Drive scope** to oauth consent screen:
   - `https://www.googleapis.com/auth/drive.file`
3. **No additional credentials needed** - uses existing CLIENT_ID

The Drive API uses the same OAuth token as Sheets API.

---

## Testing Checklist

- [ ] Create new vehicle
- [ ] Switch between vehicles
- [ ] Upload photo to fuel entry
- [ ] Download photo from Drive
- [ ] Create maintenance reminder
- [ ] Record fuel price
- [ ] Generate entry QR code
- [ ] Capture location with entry
- [ ] Filter entries by vehicle
- [ ] Check vehicle analytics

---

## Support & Troubleshooting

**Photos not uploading?**
- Verify Google authentication token is valid
- Check Drive API is enabled in Google Cloud
- Verify file size is under 10MB

**Vehicles not showing?**
- Clear browser cache
- Check IndexedDB has correct stores (v2)
- Verify vehicles are created before adding entries

**Location not capturing?**
- Request geolocation permission
- Only works on HTTPS or localhost
- Check browser location settings

---

Last Updated: Feb 14, 2025
