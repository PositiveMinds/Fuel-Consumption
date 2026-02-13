# Push Notifications System

This Fleet Manager app includes a real push notification system that works entirely client-side using IndexDB, without requiring a server backend.

## Features

### Push Notifications
Real browser notifications that appear even when the app tab is not active:
- **Entry Added**: Notifies when a new fuel entry is saved
- **Entry Edited**: Notifies when an entry is modified
- **Entry Deleted**: Notifies when an entry is removed
- **Daily Summary**: Daily fuel consumption overview
- **High Priority**: Notifications that require user interaction

### In-App Notifications
Notifications displayed while using the app (legacy support)

### Notification Settings
Users can customize:
- **Enable/Disable**: Toggle push notifications on/off
- **Notification Types**: Choose which events trigger notifications
- **Vibration**: Enable/disable vibration feedback
- **Sound**: Choose notification sound (default, bell, chime, alert, silent)
- **Quiet Hours**: Set time periods when notifications are suppressed (e.g., 22:00 - 08:00)

## How It Works

### Browser Permissions
Push notifications require explicit browser permission. When a user enables notifications:
1. Browser requests notification permission
2. User approves or denies
3. System stores preference in IndexDB
4. Notifications are delivered via Service Worker

### Service Worker Integration
The Service Worker (`sw.js`) handles:
- Displaying notifications even when the app is closed
- Handling notification clicks
- Sending messages to the app when notifications are interacted with
- Push notification delivery (from browser push API)

### Data Storage
All notification preferences stored in IndexDB:
- `pushNotificationsEnabled`: Master toggle
- `notifyNewEntry`: Enable for new entries
- `notifyEditEntry`: Enable for edited entries
- `notifyDeleteEntry`: Enable for deleted entries
- `notifyDailySummary`: Enable for daily summaries
- `notificationVibration`: Vibration enabled
- `quietHoursEnabled`: Quiet hours toggle
- `quietHoursStart`: Start time (HH:MM)
- `quietHoursEnd`: End time (HH:MM)

## Usage

### For Users

#### Enable Push Notifications
1. Click **Notifications** button or gear icon
2. Toggle **"Enable Push Notifications"**
3. Approve browser permission when prompted
4. Choose which notification types you want
5. Customize sound, vibration, and quiet hours

#### Test Notifications
1. Open **Notifications Settings**
2. Click **"Test Push Notification"** button
3. You should see a browser notification

#### Disable Notifications
1. Go to **Notifications Settings**
2. Toggle **"Enable Push Notifications"** off
3. Or disable specific notification types

### For Developers

#### Sending Push Notifications Programmatically

```javascript
// Send a standard push notification
await sendPushNotification("Entry Added", {
    body: "Fuel entry saved successfully",
    tag: "fleet-manager-entry-added"
});

// Send a high-priority notification
await sendHighPriorityNotification("Alert", "Critical message");

// Send entry-specific notifications
const entry = { id: 1, equipment: "Generator", liters: 50 };
await notifyEntryAdded(entry);
```

#### Notification Functions

**`sendPushNotification(title, options)`**
- Sends a push notification with customizable options
- Respects notification settings and quiet hours
- Parameters:
  - `title`: Notification title
  - `options`: Object with `body`, `tag`, `data`, `requireInteraction`, `vibrate`

**`notifyEntryAdded(entry)`**
- Sends notification when entry is added
- Requires `notifyNewEntry` setting enabled

**`notifyEntryEdited(entry)`**
- Sends notification when entry is modified
- Requires `notifyEditEntry` setting enabled

**`notifyEntryDeleted(entry)`**
- Sends notification when entry is deleted
- Requires `notifyDeleteEntry` setting enabled

**`sendDailySummaryNotification()`**
- Sends daily summary of fuel entries
- Requires `notifyDailySummary` setting enabled

**`testPushNotification()`**
- Sends a test notification to verify system works

**`requestNotificationPermission()`**
- Requests browser notification permission from user

**`loadPushNotificationSettings()`**
- Loads stored notification settings into UI

**`savePushNotificationSettings()`**
- Saves notification settings to IndexDB

## Implementation Details

### Files Modified

**`index.html`**
- Added push notification script: `<script src="assets/js/push-notifications.js"></script>`
- Added UI controls in notification settings modal
- Added test button for push notifications

**`assets/js/push-notifications.js`** (NEW)
- Core push notification module
- Handles permission requests, subscription, and delivery
- Implements quiet hours logic
- Provides high-level notification APIs

**`assets/js/app.js`**
- Calls `notifyEntryAdded()` when entry is saved
- Calls `notifyEntryEdited()` when entry is updated
- Calls `notifyEntryDeleted()` when entry is removed
- Loads push notification settings in modal

**`sw.js`**
- Updated `notificationclick` handler to send messages to app
- Handles push notification delivery
- Routes notification actions to the correct client

### Notification Delivery Flow

```
User Action
    ↓
[App] Save/Edit/Delete Entry
    ↓
Check if notifications enabled + permission granted
    ↓
Check notification type enabled (New Entry, Edit, Delete, etc.)
    ↓
Check if not in quiet hours
    ↓
Build notification options
    ↓
Send to Service Worker via postMessage
    ↓
[Service Worker] Receives message
    ↓
Display notification to user
    ↓
User clicks notification
    ↓
Service Worker notificationclick handler
    ↓
Focus/Open app and send message to app
```

## Browser Compatibility

### Supported Browsers
- Chrome/Edge: Full support ✓
- Firefox: Full support ✓
- Safari (iOS): Limited support (requires app installation)
- Opera: Full support ✓

### Required APIs
- `Notification API`: For browser notifications
- `Service Worker API`: For background notifications
- `IndexedDB`: For storing preferences

## Troubleshooting

### Notifications Not Appearing
1. Check if notifications are enabled in browser settings
2. Check if app has notification permission (Settings → Site Settings → Notifications)
3. Check if notification type is enabled in app settings
4. Check if inside quiet hours
5. Try test notification to verify setup

### Permission Dialog Not Showing
1. Permission might already be denied - check browser settings
2. Clear browser data and reload
3. Try different browser
4. Check browser console for errors

### Notifications Showing Even in Quiet Hours
1. Verify quiet hours are enabled
2. Check start and end times are correct
3. Note: Quiet hours format is HH:MM (24-hour)
4. If quiet hours span midnight (e.g., 22:00-08:00), system handles correctly

### Service Worker Issues
1. Check Service Worker registration: Open DevTools → Application → Service Workers
2. Verify `/sw.js` is registered and active
3. Check Service Worker errors in console
4. Try "Unregister" and reload page

## Future Enhancements

Potential improvements for push notifications:
1. **Server Backend**: Enable true remote push notifications
2. **Scheduled Notifications**: Schedule notifications for specific times
3. **Sound Selection**: Custom notification sounds
4. **Notification History**: View past notifications
5. **Notification Logging**: Track all notifications sent
6. **Badge Counter**: Show unread notification count
7. **Smart Alerts**: Alert on high consumption/anomalies

## Security Considerations

- **No Server Required**: All data stays local in IndexDB
- **User Control**: Users explicitly grant notification permission
- **Quiet Hours**: Respects user preferences for notification times
- **No Tracking**: Notifications don't require external services
- **Privacy**: Notification data stays on device

## Files Reference

- `assets/js/push-notifications.js`: Main notification system
- `sw.js`: Service Worker with notification handling
- `assets/js/app.js`: Integration points for entry events
- `index.html`: UI and settings

---

**Version**: 1.0  
**Last Updated**: 2026-02-13
