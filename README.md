# Fleet Manager - Fuel Consumption Tracker

A progressive web application (PWA) for tracking and managing fuel consumption efficiently across all devices. Fleet Manager provides real-time analytics, offline support, and push notifications for fleet monitoring.

## 📋 Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Core Functionality](#core-functionality)
- [User Interface](#user-interface)
- [Technology Stack](#technology-stack)
- [Data Management](#data-management)
- [Offline Support](#offline-support)
- [Notifications](#notifications)
- [Export & Reporting](#export--reporting)
- [Themes & Customization](#themes--customization)
- [Browser Compatibility](#browser-compatibility)
- [Architecture](#architecture)
- [Contributing](#contributing)

## ✨ Features

### Core Tracking
- **Fuel Entry Management**: Add, edit, and delete fuel consumption records
- **Real-time Analytics**: View total records, hours, liters, and average consumption
- **Date Range Filtering**: Filter entries by custom date ranges
- **Search & Sort**: Quickly find entries in the history table

### Data Export
- **PDF Reports**: Export entries with signature lines for manual signing
- **Excel Reports**: Generate formatted Excel spreadsheets (XLSX)
- **CSV Export**: Download data in CSV format
- **Filtered Exports**: Export only date-range filtered data

### Notifications
- **Push Notifications**: Browser-based notifications even when app is closed
- **In-App Notifications**: Real-time alerts while using the app
- **Customizable Types**: Control notifications for new entries, edits, deletions, and daily summaries
- **Quiet Hours**: Set time periods to disable notifications
- **Sound & Vibration**: Configurable notification feedback

### Mobile & PWA
- **Offline Support**: Full functionality without internet connection
- **Service Worker Caching**: Fast loading and offline operation
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Installable**: Install as a native app on mobile and desktop
- **Bottom Navigation**: Mobile-optimized navigation menu

### Analytics
- **Visual Charts**: Chart.js integration for consumption trends
- **Statistics Cards**: Quick overview of key metrics
- **Daily Summaries**: Aggregate data summaries
- **Performance Metrics**: Average consumption calculations

### Appearance
- **Dark/Light Theme**: Toggle between dark and light modes
- **Theme Persistence**: Selected theme is saved across sessions
- **Custom Branding**: Orange (#F54927) accent color throughout

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial load (works offline after)
- JavaScript enabled

### Installation

#### Option 1: Direct Access
1. Open `index.html` in your web browser
2. Click the "Install" button in the navbar to install as an app

#### Option 2: Local Server
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

## 🎯 Core Functionality

### Adding a Fuel Entry
1. Click the **"+ New Entry"** button in the navbar or bottom navigation
2. Fill in the form:
   - **Date**: When the fuel was added
   - **Hours**: Duration of operation
   - **Liters**: Amount of fuel consumed
   - **Site**: Location identifier
   - **Period**: Time period designation
   - **Notes**: Optional comments
3. Click "Save" to store the entry

### Editing an Entry
1. Locate the entry in the fuel history table
2. Click the edit icon (pencil) on the row
3. Modify the required fields
4. Click "Update" to save changes

### Deleting an Entry
1. Click the delete icon (trash) on the entry row
2. Confirm deletion in the popup dialog
3. Entry is permanently removed

### Filtering Data
1. Use the **Date Range Filter** section above the history table
2. Enter start date in "From Date" field
3. Enter end date in "To Date" field
4. Click **"Filter"** to apply filters
5. Click **"Reset"** to clear filters and show all entries

### Viewing Statistics
- **Total Records**: Count of all entries
- **Total Hours**: Sum of all operation hours
- **Total Liters**: Sum of all fuel consumed
- **Avg Consumption**: Average fuel consumption rate

## 🎨 User Interface

### Main Components

#### Navigation Bar
Located at the top of the application with quick access buttons:
- **Logo & Title**: Fleet Manager branding
- **Install Button**: Install app on device
- **Notifications Bell**: Access notification settings
- **+ New Entry**: Create new fuel entry
- **Settings**: Export and report options
- **Theme Toggle**: Switch between dark/light modes

#### Statistics Cards
Display key metrics:
- Total Records (list icon)
- Total Hours (clock icon)
- Total Liters (droplet icon)
- Average Consumption (flame icon)

#### Fuel Entry History Table
Shows all fuel entries with columns:
- Date
- Hours
- Liters
- Site
- Period
- Notes
- Actions (Edit, Delete)

#### FAB Menu (Floating Action Button)
Quick access to common actions:
- View Summary
- Export CSV
- View Chart
- Clear All Data

#### Bottom Navigation (Mobile)
Mobile-optimized navigation with icons:
- New Entry
- Notifications
- Settings
- Theme Toggle

### Modals & Panels

#### New/Edit Entry Modal
Form for creating or updating fuel entries with validation.

#### Notification Settings Modal
Comprehensive notification configuration:
- Enable/disable push notifications
- Enable/disable in-app notifications
- Notification type toggles
- Sound selection
- Vibration settings
- Quiet hours configuration

#### Export Panel
Slide-in panel with export options:
- PDF Report generation
- Excel Report generation
- Filtered data export

#### Summary Modal
Overview of consumption data with statistics.

#### Chart Modal
Visual representation of fuel consumption trends over time.

## 🛠️ Technology Stack

### Frontend Frameworks & Libraries
- **HTML5**: Semantic markup
- **CSS3**: Custom stylesheets with CSS variables for theming
- **Bootstrap 5**: Responsive UI framework
- **jQuery 3.6**: DOM manipulation and utilities

### Data Visualization
- **Chart.js 4.4**: Interactive charts and analytics

### Notifications
- **Service Worker API**: Background notifications
- **Push Notification API**: Browser push notifications

### Data Management
- **IndexedDB**: Primary offline database with localStorage fallback
- **localStorage**: Persistent settings storage

### File Export
- **html2pdf.js**: PDF generation from HTML
- **ExcelJS**: Excel spreadsheet creation
- **FileSaver.js**: File download functionality

### UI Components
- **SweetAlert2**: Beautiful modal dialogs
- **Font Awesome 6.4**: Icon library
- **Select2**: Enhanced dropdown selection
- **Air Datepicker**: Date input component

### PWA Support
- **Web Manifest**: App installation and metadata
- **Service Worker**: Offline support and caching

## 💾 Data Management

### Database Structure

#### IndexedDB Database
**Database Name**: `FleetManagerDB`
**Version**: 1

##### Object Stores

**fuelHistory Store**
Stores all fuel consumption records.
```javascript
{
  id: string (unique identifier),
  date: string (YYYY-MM-DD),
  hours: number,
  liters: number,
  site: string,
  period: string,
  notes: string,
  timestamp: number (milliseconds since epoch)
}
```

Indexes:
- `date`: Indexed for date-based queries
- `timestamp`: Indexed for temporal sorting

**settings Store**
Stores application settings and preferences.
```javascript
{
  key: string (setting name),
  value: string (setting value)
}
```

### Settings Stored
- `notificationsEnabled`: Global notification toggle
- `pushNotificationsEnabled`: Push notification toggle
- `notifyNewEntry`: Notify on new entry
- `notifyEditEntry`: Notify on entry edit
- `notifyDeleteEntry`: Notify on entry delete
- `notifyDailySummary`: Notify daily summary
- `notificationSound`: Selected notification sound
- `notificationVibration`: Vibration enabled/disabled
- `quietHoursEnabled`: Quiet hours toggle
- `quietHoursStart`: Quiet hours start time
- `quietHoursEnd`: Quiet hours end time
- `theme`: Selected theme (light/dark)

### Fallback Mechanism
If IndexedDB is not available, the app automatically falls back to localStorage with reduced capacity.

## 🔌 Offline Support

### Service Worker Caching Strategy
The service worker implements a **Cache-First** strategy:

1. **Installation**: Caches critical resources
2. **Fetch Events**: Serves from cache if available, falls back to network
3. **Background Sync**: Queues offline changes for sync when online
4. **Offline Fallback**: Shows cached index.html if offline

### Offline Capabilities
- ✅ View existing fuel entries
- ✅ Add new fuel entries (synced when online)
- ✅ Edit entries
- ✅ Delete entries
- ✅ Filter and search
- ✅ View charts and statistics
- ✅ Change theme and settings

### Cached Resources
- `/index.html`
- `/manifest.json`
- `/assets/css/styles.css`
- `/assets/js/app.js`
- `/assets/images/*` (logos and icons)

## 🔔 Notifications

### Notification Types

#### Push Notifications
Delivered by browser even when app is closed.
- Customizable title and body
- Icon and badge images
- Vibration patterns
- Tag-based grouping

#### In-App Notifications
Displayed while user is actively using the app.
- Toast-style notifications
- Configurable position and duration
- Different styles for success/error/info

### Notification Events
- **Entry Added**: When new fuel entry is created
- **Entry Edited**: When existing entry is modified
- **Entry Deleted**: When entry is removed
- **Daily Summary**: Daily consumption overview
- **Test Notifications**: Manual testing of notification system

### Quiet Hours
Prevents notifications during specified time periods:
- Set custom start and end times
- Respects user sleep schedules
- Can be temporarily or permanently disabled

### Sound Options
- Default
- Bell
- Chime
- Alert
- Silent

## 📊 Export & Reporting

### PDF Reports
- Generates professional PDF documents
- Includes all entry details
- Signature lines for manual approval
- Custom branding with Fleet Manager logo
- Table formatting with borders

### Excel Reports (XLSX)
- Formatted spreadsheet with multiple sheets
- Calculated totals and statistics
- Column formatting and styling
- Easy data analysis and pivot tables
- Compatible with Excel, Google Sheets, LibreOffice

### CSV Export
- Simple comma-separated values format
- Can be imported into any spreadsheet application
- Lightweight format for data transfer

### Filtered Exports
All export formats support filtered data based on:
- Date range selection
- Current filtered view

## 🎨 Themes & Customization

### Dark Mode
- Easy on the eyes in low-light environments
- Reduces blue light exposure
- Darker background with light text

### Light Mode
- Standard high-contrast display
- Suitable for bright environments
- White background with dark text

### Theme Persistence
Selected theme is automatically saved to settings and restored on app reload.

### CSS Variables
The app uses CSS variables for easy theming:
```css
--primary-color: #F54927 (Orange)
--text-primary: Color for main text
--text-secondary: Color for secondary text
--bg-color: Background color
--border-color: Border and divider color
```

## 🌐 Browser Compatibility

### Fully Supported
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Features by Browser
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | Limited | ✅ |
| Web Manifest | ✅ | ✅ | ✅ | ✅ |
| Offline Support | ✅ | ✅ | ✅ | ✅ |

### Mobile Support
- ✅ Android Chrome
- ✅ Android Firefox
- ✅ iOS Safari (some PWA limitations)
- ✅ iPad Safari

## 🏗️ Architecture

### Component Overview

```
Fleet Manager Application
├── Frontend (HTML/CSS/JavaScript)
│   ├── Navigation & UI Components
│   ├── Forms & Modals
│   └── Charts & Statistics
├── Business Logic (app.js)
│   ├── Entry Management
│   ├── Data Export
│   ├── Notifications
│   └── Theme Management
├── Data Layer (db.js)
│   ├── IndexedDB Operations
│   ├── LocalStorage Fallback
│   └── Data Queries
├── Push Notifications (push-notifications.js)
│   ├── Service Worker Integration
│   ├── Notification Dispatch
│   └── Event Handling
└── Service Worker (sw.js)
    ├── Cache Management
    ├── Offline Support
    └── Background Sync
```

### Data Flow

1. **User Input** → Form submission
2. **Validation** → Check required fields
3. **Storage** → Save to IndexedDB
4. **UI Update** → Refresh table and stats
5. **Notifications** → Send notification if enabled
6. **Background Sync** → Queue for sync if offline

### Key Functions

#### Data Operations
- `addFuelEntry()`: Create new entry
- `editFuelEntry()`: Update existing entry
- `deleteFuelEntry()`: Remove entry
- `getAllEntries()`: Retrieve all entries
- `getEntriesByDateRange()`: Filter by dates

#### Export Operations
- `generatePDFReport()`: Create PDF file
- `generateExcelReport()`: Create XLSX file
- `exportData()`: Export as CSV
- `exportFilteredDataPDF()`: PDF with filters
- `exportFilteredDataXLSX()`: XLSX with filters

#### Notification Operations
- `sendNotification()`: Send in-app notification
- `testNotification()`: Test in-app notification
- `testPushNotification()`: Test push notification
- `saveNotificationSettings()`: Persist settings
- `savePushNotificationSettings()`: Save push settings

#### UI Operations
- `openNewEntryModal()`: Show add entry form
- `openExportPanel()`: Show export options
- `openNotificationSettings()`: Show settings modal
- `toggleTheme()`: Switch light/dark mode
- `showChart()`: Display analytics chart

## 📝 File Structure

```
fuel/
├── index.html                 # Main application file
├── manifest.json              # PWA manifest
├── sw.js                      # Service Worker
├── browserconfig.xml          # Windows tile configuration
├── assets/
│   ├── js/
│   │   ├── app.js            # Main application logic
│   │   ├── db.js             # Database management
│   │   └── push-notifications.js  # Notification system
│   ├── css/
│   │   └── styles.css        # Custom styles and theming
│   ├── images/
│   │   ├── logo.png
│   │   ├── logo-144x144.png
│   │   ├── logo-192x192.png
│   │   ├── logo-256x256.png
│   │   └── logo-512x512.png
│   └── lib/                  # External libraries (CDN)
├── NOTIFICATION_SETTINGS.md  # Notification documentation
├── PUSH_NOTIFICATIONS.md     # Push notification setup guide
└── README.md                 # This file
```

## 🤝 Contributing

### Development Workflow
1. Make changes to relevant files
2. Test in multiple browsers
3. Verify offline functionality works
4. Check responsive design on mobile
5. Commit changes with descriptive messages

### Code Style
- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Follow existing naming conventions
- Keep functions focused and small

### Testing Checklist
- [ ] Add entry functionality
- [ ] Edit entry functionality
- [ ] Delete entry functionality
- [ ] Date filtering works
- [ ] Export to PDF
- [ ] Export to Excel
- [ ] Export to CSV
- [ ] Notifications send and display
- [ ] Theme toggle works
- [ ] Offline mode functionality
- [ ] Mobile responsive design
- [ ] Service Worker caching

## 📄 Additional Documentation

- [Notification Settings Guide](NOTIFICATION_SETTINGS.md) - Detailed notification configuration
- [Push Notifications Setup](PUSH_NOTIFICATIONS.md) - Push notification implementation guide

## 📧 Support

For issues, feature requests, or questions:
1. Check existing documentation
2. Review the code comments
3. Test in different browsers
4. Clear browser cache and offline storage if experiencing issues

## 📜 License

This project is maintained as part of the Fuel Consumption tracking system.

---

**Last Updated**: February 2026
**Version**: 1.0
**Status**: Production Ready
