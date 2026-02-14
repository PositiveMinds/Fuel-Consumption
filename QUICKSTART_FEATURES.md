# Quick Start Guide - New Features

## 🚗 Multi-Vehicle Tracking

### Create a Vehicle
1. Open app in browser
2. Look for vehicle selector (will show "No Vehicle" or current vehicle name)
3. Click to open vehicle selector
4. Choose "+ Add New Vehicle"
5. Fill in details:
   - Name (e.g., "Generator 1")
   - Type (generator, truck, car, etc.)
   - Fuel Type (diesel, petrol, LPG)
   - Tank Capacity (in liters)
   - License/Serial Number
6. Click "OK" to create

### Switch Vehicles
1. Click vehicle selector button
2. Choose from list
3. All fuel entries now show only this vehicle's data

---

## 📸 Photo Attachments

### Prerequisites
1. Authenticate with Google first (existing feature)
2. Google Drive API must be enabled in your GCP project

### Upload Photo
1. Create or view fuel entry
2. Click photo upload button (in modal)
3. Select receipt or gauge image
4. Wait for upload to complete
5. Photo appears as thumbnail below entry

### View/Download Photo
1. Click thumbnail or eye icon
2. Opens in Google Drive viewer
3. Download or share from Drive

### Delete Photo
1. Click trash icon on photo thumbnail
2. Confirm deletion
3. Photo removed from Drive and local database

---

## 🛠️ Maintenance Reminders

### Create Reminder
1. Click "Maintenance Reminder" button
2. Fill in:
   - Title (e.g., "Oil Change")
   - Due Date
   - Category (oil-change, inspection, repair, service)
   - Description (optional)
3. Click "OK"
4. Reminder saved for current vehicle

### View Reminders
- Check vehicle management dashboard
- Filter by status (pending/completed)

### Mark Complete
- Click "Mark as Complete" on reminder
- Reminder moves to history

---

## 💰 Fuel Price Tracking

### Record Price
1. Click "Record Fuel Price" button
2. Fill in:
   - Date
   - Price per Liter
   - Fuel Type (diesel, petrol, LPG)
   - Location (optional)
3. Click "OK"

### View Price Trends
- Check price history graph (in analytics)
- Filter by fuel type and date range
- See average price over time

---

## 📍 Location Tracking

### Capture Location
1. When creating fuel entry
2. Click "Capture Location" button
3. Grant browser permission to access location
4. Location saved automatically

### View on Map
1. Click location icon in entry details
2. Opens in Google Maps
3. Pin shows exact coordinates

---

## QR Codes

### Generate QR for Entry
1. Click "QR Code" button in entry row
2. Modal shows QR code image
3. Click "Download" to save as PNG
4. QR encodes: entry ID, date, liters, consumption

### Generate QR for Vehicle
1. Go to vehicle management
2. Click "QR Code" button
3. Modal shows vehicle QR
4. Download for labeling/tracking

---

## 🏷️ Custom Tags

### Add Tags to Vehicle
1. Edit vehicle profile
2. Enter tags (comma-separated)
3. Save vehicle
4. Use tags for organization/grouping

---

## 📊 Vehicle Analytics

### View Stats
1. Select vehicle from dropdown
2. Dashboard shows vehicle-specific stats:
   - Total fuel used
   - Total hours
   - Total distance
   - Average consumption
   - Last entry date

### Filter by Vehicle
- All history/charts filtered to selected vehicle
- Export respects vehicle filter

---

## 🔧 Google Drive Setup (One-Time)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to "APIs & Services" → "APIs"
4. Search for "Google Drive API"
5. Click "Enable"
6. Go to "OAuth consent screen"
7. Add scope: `https://www.googleapis.com/auth/drive.file`
8. Save changes
9. Restart the app
10. Authenticate with Google - you'll now have Drive access

---

## ❌ Troubleshooting

### Photos Won't Upload
- [ ] Logged in with Google? (Try re-authenticating)
- [ ] Drive API enabled in GCP? (Check console)
- [ ] File under 10MB? (Compress if needed)
- [ ] Check browser console for error messages

### Location Not Capturing
- [ ] Using HTTPS? (Location requires secure context)
- [ ] Browser permissions? (Allow location access)
- [ ] GPS available? (Mobile devices work best)

### Vehicle Not Showing
- [ ] Created vehicle first? (Create one before adding entries)
- [ ] Selected correct vehicle? (Check dropdown)
- [ ] Browser cached old data? (Clear IndexedDB)

### QR Code Not Showing
- [ ] Entry has ID? (Save entry first)
- [ ] Internet connected? (QR API needs connection)
- [ ] Try refresh page

---

## 💡 Tips

- **Backup Photos**: All photos are in Google Drive (automatic backup)
- **Offline Support**: All features except Drive uploads work offline
- **Privacy**: Locations are stored locally, not synced anywhere
- **Export**: Maintenance/price data included in CSV exports
- **Tags**: Use for vehicle grouping (e.g., "critical", "backup", "testing")

---

## Feature Limits

| Feature | Limit | Notes |
|---------|-------|-------|
| Vehicles | Unlimited | No practical limit |
| Photos | 10MB each | Drive storage limits apply |
| Entries | Unlimited | IndexedDB: ~50MB local |
| Reminders | Unlimited | No practical limit |
| Price Records | Unlimited | Stored locally |

---

## Data Storage

All data stored locally in:
- **Browser IndexedDB**: Vehicles, entries, photos metadata, reminders, prices
- **Google Drive**: Photo files (auto-organized)
- **Google Sheets**: Synced entry data (optional)

Delete browser data = delete all local records (but Drive photos remain)

---

## Support

For issues or questions:
1. Check browser console (F12 → Console)
2. Review `NEW_FEATURES.md` for detailed API docs
3. Check `IMPLEMENTATION_SUMMARY.md` for architecture

---

**Version**: 2.0 with Multi-Vehicle & Advanced Features
**Last Updated**: Feb 14, 2025
