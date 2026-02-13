# Push Notification Settings Implementation

## Overview
A comprehensive notification settings system has been added to the Fleet Manager PWA, allowing users to customize their notification preferences.

## Features Implemented

### 1. Notification Settings Modal
- **Location**: Main navigation bar (Settings button)
- **UI Components**: Bootstrap modal with organized sections

### 2. Notification Control
- **Enable/Disable Toggle**: Master switch to enable/disable all notifications
- **Auto-disable Settings**: When notifications are disabled, all notification type toggles are automatically disabled

### 3. Notification Types (with toggles)
- **New Entry Added**: Receive notifications when a new fuel entry is created
- **Entry Edited**: Receive notifications when an existing entry is modified
- **Entry Deleted**: Receive notifications when an entry is deleted
- **Daily Summary**: Receive daily consumption summary notifications

### 4. Sound Control
- **Default**: Standard notification tone
- **Bell**: Traditional bell sound
- **Chime**: Pleasant chime sound
- **Alert**: High-priority alert tone
- **Silent**: No sound (vibration only if enabled)

### 5. Vibration Settings
- Toggle to enable/disable device vibration feedback
- Works on supported mobile devices

### 6. Quiet Hours Feature
- **Enable/Disable Toggle**: Enable quiet hours to suppress notifications during specified times
- **Start Time**: Set when quiet hours begin (default: 22:00)
- **End Time**: Set when quiet hours end (default: 07:00)
- **Supports Midnight Spans**: Correctly handles quiet hours that cross midnight (e.g., 22:00 to 07:00)

### 7. Test Notification
- **Test Button**: Send a test notification with current settings
- Verifies notification permission and respects settings
- Plays sound and vibration based on settings

## Technical Implementation

### Database Storage
All settings are persisted using the IndexedDB database:
- `notificationsEnabled`: Master toggle (true/false)
- `notifyNewEntry`: New entry notification toggle
- `notifyEditEntry`: Entry edit notification toggle
- `notifyDeleteEntry`: Entry delete notification toggle
- `notifyDailySummary`: Daily summary notification toggle
- `notificationSound`: Selected sound (default/bell/chime/alert/silent)
- `notificationVibration`: Vibration toggle (true/false)
- `quietHoursEnabled`: Quiet hours toggle (true/false)
- `quietHoursStart`: Quiet hours start time (HH:MM)
- `quietHoursEnd`: Quiet hours end time (HH:MM)

### Key Functions

#### openNotificationSettings()
Opens the notification settings modal and loads current settings.

#### loadNotificationSettings()
Loads all saved settings from the database and populates the UI.
- Disables notification type toggles if notifications are disabled
- Shows/hides quiet hours input fields based on enabled state

#### handleNotificationsToggle()
Manages the master notifications toggle:
- Requests notification permission if enabling
- Saves state to database
- Enables/disables all notification type toggles

#### saveNotificationSettings()
Persists all settings to the database after any change.

#### toggleQuietHoursInputs()
Shows/hides quiet hours time input fields based on the toggle state.

#### testNotification()
Sends a test notification respecting current settings:
- Checks notification permission
- Applies vibration settings
- Plays selected sound

#### playNotificationSound(soundType)
Generates notification sounds using Web Audio API:
- Uses oscillators and gain nodes for audio synthesis
- Supports multiple sound types with different frequencies and durations

#### isInQuietHours(startTime, endTime)
Checks if current time falls within quiet hours:
- Converts times to minutes for comparison
- Handles midnight-spanning quiet hours correctly

### Enhanced sendNotification() Function
Updated to respect all settings:
- Checks if notifications are enabled
- Verifies quiet hours
- Applies vibration settings
- Maintains backward compatibility

## UI/UX Details

### Layout
- Clear section headers with icons
- Organized into logical groups:
  1. Master notifications toggle
  2. Notification types
  3. Sound options
  4. Vibration settings
  5. Quiet hours configuration
  6. Test button

### Visual Feedback
- Toggles are disabled when notifications are disabled
- Quiet hours inputs are hidden/shown based on toggle state
- SweetAlert confirmations for permission requests and changes
- Success/error messages for all operations

### Mobile-Friendly
- Uses Bootstrap's form controls
- Responsive layout with proper spacing
- Works on all screen sizes

## Browser Support

- **Notifications API**: Required (modern browsers)
- **Web Audio API**: Required for sound playback (modern browsers)
- **IndexedDB**: Required for settings persistence
- **Vibration API**: Optional (works on supported mobile devices)

## User Experience Flow

1. User clicks "Settings" button in navbar
2. Modal opens with current settings loaded
3. User adjusts settings (toggles, dropdowns, time inputs)
4. Settings auto-save on change
5. User can test notification with "Send Test Notification" button
6. User closes modal - settings are persisted

## Future Enhancements

- Notification history/log
- Custom notification sounds upload
- Notification frequency limits
- Weekly quiet hours schedules
- Device-specific notification rules
- Notification templates customization
