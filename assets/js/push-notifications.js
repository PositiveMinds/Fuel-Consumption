// Real Push Notifications (Client-side IndexDB only)
// Shows browser notifications via Service Worker without requiring a server

// Initialize push notifications on load
async function initPushNotifications() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        console.log("Push notifications not supported in this browser");
        return;
    }

    // Check if notifications are enabled in settings
    const pushEnabled = (await db.getSetting("pushNotificationsEnabled")) === "true";
    if (pushEnabled && Notification.permission === "default") {
        await requestNotificationPermission();
    }
}

// Request browser notification permission
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        Swal.fire("Error", "Your browser does not support notifications", "error");
        return false;
    }

    if (Notification.permission === "granted") {
        await db.setSetting("pushNotificationsEnabled", "true");
        return true;
    }

    if (Notification.permission === "denied") {
        await db.setSetting("pushNotificationsEnabled", "false");
        Swal.fire("Error", "Notification permission was denied. Enable in browser settings", "error");
        return false;
    }

    // Request permission
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            await db.setSetting("pushNotificationsEnabled", "true");
            Swal.fire("Success", "Notifications enabled!", "success");
            return true;
        } else {
            await db.setSetting("pushNotificationsEnabled", "false");
            return false;
        }
    } catch (error) {
        console.error("Error requesting notification permission:", error);
        return false;
    }
}

// Send real push notification via Service Worker
async function sendPushNotification(title, options = {}) {
    // Check if notifications are enabled globally
    const pushEnabled = (await db.getSetting("pushNotificationsEnabled")) === "true";
    if (!pushEnabled || Notification.permission !== "granted") {
        return;
    }

    // Check quiet hours
    const quietHoursEnabled = (await db.getSetting("quietHoursEnabled")) === "true";
    if (quietHoursEnabled) {
        const quietStart = (await db.getSetting("quietHoursStart")) || "22:00";
        const quietEnd = (await db.getSetting("quietHoursEnd")) || "08:00";
        
        if (isInQuietHours(quietStart, quietEnd)) {
            console.log("Quiet hours active, suppressing notification");
            return;
        }
    }

    // Get vibration setting
    const vibrationEnabled = (await db.getSetting("notificationVibration")) !== "false";

    const notificationOptions = {
        icon: "assets/images/logo-192x192.png",
        badge: "assets/images/logo-144x144.png",
        tag: options.tag || "fleet-manager-notification",
        requireInteraction: options.requireInteraction || false,
        vibrate: vibrationEnabled ? ([200, 100, 200] || options.vibrate) : undefined,
        data: {
            dateOfArrival: Date.now(),
            ...options.data
        },
        ...options
    };

    // Send via Service Worker for background notifications
    try {
        const registration = await navigator.serviceWorker.ready;
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: "SHOW_NOTIFICATION",
                title: title,
                options: notificationOptions
            });
        }
    } catch (error) {
        console.error("Service Worker notification failed, using direct Notification API:", error);
        // Fallback to direct notification
        new Notification(title, notificationOptions);
    }
}

// Check if current time is within quiet hours
function isInQuietHours(startTime, endTime) {
    const now = new Date();
    const currentTime = now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");
    
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const [currentHour, currentMin] = currentTime.split(":").map(Number);

    const startTotalMins = startHour * 60 + startMin;
    const endTotalMins = endHour * 60 + endMin;
    const currentTotalMins = currentHour * 60 + currentMin;

    // If quiet hours span midnight (e.g., 22:00 to 08:00)
    if (startTotalMins > endTotalMins) {
        return currentTotalMins >= startTotalMins || currentTotalMins < endTotalMins;
    } else {
        return currentTotalMins >= startTotalMins && currentTotalMins < endTotalMins;
    }
}

// Send notification when entry is added
async function notifyEntryAdded(entry) {
    const typeEnabled = (await db.getSetting("notifyNewEntry")) === "true";
    if (!typeEnabled) return;

    await sendPushNotification("New Fuel Entry", {
        body: `${entry.equipment || "Equipment"} - ${entry.liters || 0}L on ${entry.date || new Date().toLocaleDateString()}`,
        tag: "fleet-manager-entry-added",
        data: {
            action: "entry-added",
            entryId: entry.id
        }
    });
}

// Send notification when entry is edited
async function notifyEntryEdited(entry) {
    const typeEnabled = (await db.getSetting("notifyEditEntry")) === "true";
    if (!typeEnabled) return;

    await sendPushNotification("Entry Updated", {
        body: `${entry.equipment || "Equipment"} - ${entry.liters || 0}L`,
        tag: "fleet-manager-entry-edited",
        data: {
            action: "entry-edited",
            entryId: entry.id
        }
    });
}

// Send notification when entry is deleted
async function notifyEntryDeleted(entry) {
    const typeEnabled = (await db.getSetting("notifyDeleteEntry")) === "true";
    if (!typeEnabled) return;

    await sendPushNotification("Entry Deleted", {
        body: `${entry.equipment || "Equipment"} entry has been removed`,
        tag: "fleet-manager-entry-deleted",
        data: {
            action: "entry-deleted",
            entryId: entry.id
        }
    });
}

// Send daily summary notification
async function sendDailySummaryNotification() {
    const typeEnabled = (await db.getSetting("notifyDailySummary")) === "true";
    if (!typeEnabled) return;

    try {
        const entries = await db.getAllEntries();
        if (entries.length === 0) return;

        // Calculate daily summary
        const today = new Date().toISOString().split('T')[0];
        const todaysEntries = entries.filter(e => e.date === today);
        
        if (todaysEntries.length === 0) return;

        const totalLiters = todaysEntries.reduce((sum, e) => sum + (parseFloat(e.liters) || 0), 0);
        const totalHours = todaysEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);

        await sendPushNotification("Daily Summary", {
            body: `${todaysEntries.length} entries, ${totalLiters.toFixed(1)}L used, ${totalHours.toFixed(1)}hrs`,
            tag: "fleet-manager-daily-summary",
            data: {
                action: "daily-summary",
                count: todaysEntries.length,
                totalLiters: totalLiters,
                totalHours: totalHours
            }
        });
    } catch (error) {
        console.error("Error sending daily summary notification:", error);
    }
}

// Send high priority notification
async function sendHighPriorityNotification(title, body) {
    if (Notification.permission !== "granted") return;

    await sendPushNotification(title, {
        body: body,
        tag: "fleet-manager-high-priority",
        requireInteraction: true,
        data: {
            priority: "high"
        }
    });
}

// Test push notification
async function testPushNotification() {
    if (Notification.permission !== "granted") {
        const granted = await requestNotificationPermission();
        if (!granted) {
            Swal.fire("Error", "Please enable notifications first", "error");
            return;
        }
    }

    await sendPushNotification("Fleet Manager - Test", {
        body: "This is a test notification. Your push notifications are working!",
        tag: "fleet-manager-test"
    });

    Swal.fire("Success", "Test notification sent!", "success");
}

// Toggle push notifications
async function togglePushNotifications() {
    const enabled = (await db.getSetting("pushNotificationsEnabled")) === "true";
    
    if (enabled) {
        await db.setSetting("pushNotificationsEnabled", "false");
        Swal.fire("Info", "Push notifications disabled", "info");
    } else {
        const granted = await requestNotificationPermission();
        if (granted) {
            Swal.fire("Success", "Push notifications enabled", "success");
        }
    }
}

// Load push notification settings into UI
async function loadPushNotificationSettings() {
    try {
        const pushEnabled = (await db.getSetting("pushNotificationsEnabled")) === "true";
        const notifyNewEntry = (await db.getSetting("notifyNewEntry")) === "true";
        const notifyEditEntry = (await db.getSetting("notifyEditEntry")) === "true";
        const notifyDeleteEntry = (await db.getSetting("notifyDeleteEntry")) === "true";
        const notifyDailySummary = (await db.getSetting("notifyDailySummary")) === "true";

        // Update UI elements if they exist
        const pushToggle = document.getElementById("pushNotificationsEnabledToggle");
        if (pushToggle) {
            pushToggle.checked = pushEnabled;
        }

        const newEntryToggle = document.getElementById("notifyNewEntry");
        if (newEntryToggle) {
            newEntryToggle.checked = notifyNewEntry;
        }

        const editToggle = document.getElementById("notifyEditEntry");
        if (editToggle) {
            editToggle.checked = notifyEditEntry;
        }

        const deleteToggle = document.getElementById("notifyDeleteEntry");
        if (deleteToggle) {
            deleteToggle.checked = notifyDeleteEntry;
        }

        const summaryToggle = document.getElementById("notifyDailySummary");
        if (summaryToggle) {
            summaryToggle.checked = notifyDailySummary;
        }
    } catch (error) {
        console.error("Error loading push notification settings:", error);
    }
}

// Save push notification settings
async function savePushNotificationSettings() {
    try {
        const pushToggle = document.getElementById("pushNotificationsEnabledToggle");
        if (pushToggle) {
            if (pushToggle.checked && Notification.permission !== "granted") {
                const granted = await requestNotificationPermission();
                if (!granted) {
                    pushToggle.checked = false;
                    return;
                }
            }
            await db.setSetting("pushNotificationsEnabled", pushToggle.checked ? "true" : "false");
        }

        const newEntryToggle = document.getElementById("notifyNewEntry");
        if (newEntryToggle) {
            await db.setSetting("notifyNewEntry", newEntryToggle.checked ? "true" : "false");
        }

        const editToggle = document.getElementById("notifyEditEntry");
        if (editToggle) {
            await db.setSetting("notifyEditEntry", editToggle.checked ? "true" : "false");
        }

        const deleteToggle = document.getElementById("notifyDeleteEntry");
        if (deleteToggle) {
            await db.setSetting("notifyDeleteEntry", deleteToggle.checked ? "true" : "false");
        }

        const summaryToggle = document.getElementById("notifyDailySummary");
        if (summaryToggle) {
            await db.setSetting("notifyDailySummary", summaryToggle.checked ? "true" : "false");
        }
    } catch (error) {
        console.error("Error saving push notification settings:", error);
    }
}

// Initialize on page load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPushNotifications);
} else {
    initPushNotifications();
}
