// Push Notifications Management
async function initPushNotifications() {
  if (!("Notification" in window)) {
    console.log("Notifications not supported");
    return;
  }

  // Store notification preference
  const savedNotificationPref =
    (await db.getSetting("notificationsEnabled")) === "true";

  // Request permission if not already denied
  if (Notification.permission === "default" && savedNotificationPref) {
    Notification.requestPermission();
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    Swal.fire("Error", "Your browser does not support notifications", "error");
    return;
  }

  if (Notification.permission === "granted") {
    await db.setSetting("notificationsEnabled", "true");
    showTestNotification();
    Swal.fire("Success", "Notifications are enabled", "success");
    return;
  }

  if (Notification.permission === "denied") {
    Swal.fire("Error", "Notification permission was denied", "error");
    await db.setSetting("notificationsEnabled", "false");
    return;
  }

  Notification.requestPermission().then(async (permission) => {
    if (permission === "granted") {
      await db.setSetting("notificationsEnabled", "true");
      showTestNotification();
      Swal.fire("Success", "Notifications are now enabled!", "success");
    } else {
      await db.setSetting("notificationsEnabled", "false");
      Swal.fire("Info", "Notifications permission denied", "info");
    }
  });
}

function showTestNotification() {
  if (Notification.permission !== "granted") {
    Swal.fire("Error", "Notification permission not granted", "error");
    return;
  }

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      title: "Fleet Manager",
      options: {
        body: "Test notification - Everything is working!",
        icon: "assets/images/logo-192x192.png",
        badge: "assets/images/logo-144x144.png",
        tag: "test-notification",
        vibrate: [200, 100, 200],
      },
    });
  } else {
    // Fallback for browsers without service worker
    new Notification("Fleet Manager", {
      body: "Test notification - Everything is working!",
      icon: "assets/images/logo-192x192.png",
      badge: "assets/images/logo-144x144.png",
      vibrate: [200, 100, 200],
    });
  }
}

async function sendNotification(
  title,
  options = {},
  notificationType = "general",
) {
  if (Notification.permission !== "granted") {
    console.log("Notification permission not granted");
    return;
  }

  // Check if notifications are enabled globally
  const notificationsEnabled =
    (await db.getSetting("notificationsEnabled")) === "true";
  if (!notificationsEnabled) {
    return;
  }

  // Check if this specific notification type is enabled
  const typeSettingsMap = {
    "entry-added": "notifyNewEntry",
    "entry-edited": "notifyEditEntry",
    "entry-deleted": "notifyDeleteEntry",
    "daily-summary": "notifyDailySummary",
    general: "general",
  };

  const settingKey = typeSettingsMap[notificationType];
  if (settingKey && settingKey !== "general") {
    const typeEnabled = (await db.getSetting(settingKey)) === "true";
    if (!typeEnabled) {
      return;
    }
  }

  // Check quiet hours
  const quietHoursEnabled =
    (await db.getSetting("quietHoursEnabled")) === "true";
  if (quietHoursEnabled) {
    const quietStart = (await db.getSetting("quietHoursStart")) || "22:00";
    const quietEnd = (await db.getSetting("quietHoursEnd")) || "08:00";

    if (isInQuietHours(quietStart, quietEnd)) {
      console.log("Quiet hours active, suppressing notification");
      return;
    }
  }

  const defaultOptions = {
    icon: "assets/images/logo-192x192.png",
    badge: "assets/images/logo-144x144.png",
    tag: "fleet-manager-" + notificationType,
    vibrate: [200, 100, 200],
    ...options,
  };

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      title: title,
      options: defaultOptions,
    });
  } else {
    new Notification(title, defaultOptions);
  }
}

// Check if current time is within quiet hours
function isInQuietHours(startTime, endTime) {
  const now = new Date();
  const currentTime =
    now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const [currentHour, currentMin] = currentTime.split(":").map(Number);

  const startTotalMins = startHour * 60 + startMin;
  const endTotalMins = endHour * 60 + endMin;
  const currentTotalMins = currentHour * 60 + currentMin;

  // If quiet hours span midnight (e.g., 22:00 to 08:00)
  if (startTotalMins > endTotalMins) {
    return (
      currentTotalMins >= startTotalMins || currentTotalMins < endTotalMins
    );
  } else {
    return (
      currentTotalMins >= startTotalMins && currentTotalMins < endTotalMins
    );
  }
}

async function toggleNotifications() {
  const isEnabled = (await db.getSetting("notificationsEnabled")) === "true";

  if (isEnabled) {
    await db.setSetting("notificationsEnabled", "false");
    Swal.fire("Info", "Notifications disabled", "info");
  } else {
    requestNotificationPermission();
  }
}

// Load notification settings from database
async function loadNotificationSettings() {
  const notificationsEnabled =
    (await db.getSetting("notificationsEnabled")) === "true";
  const notifyNewEntry = (await db.getSetting("notifyNewEntry")) === "true";
  const notifyEditEntry = (await db.getSetting("notifyEditEntry")) === "true";
  const notifyDeleteEntry =
    (await db.getSetting("notifyDeleteEntry")) === "true";
  const notifyDailySummary =
    (await db.getSetting("notifyDailySummary")) === "true";
  const notificationSound =
    (await db.getSetting("notificationSound")) || "default";
  const notificationVibration =
    (await db.getSetting("notificationVibration")) !== "false";
  const quietHoursEnabled =
    (await db.getSetting("quietHoursEnabled")) === "true";
  const quietHoursStart = (await db.getSetting("quietHoursStart")) || "22:00";
  const quietHoursEnd = (await db.getSetting("quietHoursEnd")) || "08:00";

  document.getElementById("notificationsEnabledToggle").checked =
    notificationsEnabled;
  document.getElementById("notifyNewEntry").checked = notifyNewEntry;
  document.getElementById("notifyEditEntry").checked = notifyEditEntry;
  document.getElementById("notifyDeleteEntry").checked = notifyDeleteEntry;
  document.getElementById("notifyDailySummary").checked = notifyDailySummary;
  document.getElementById("notificationSound").value = notificationSound;
  document.getElementById("notificationVibration").checked =
    notificationVibration;
  document.getElementById("quietHoursEnabled").checked = quietHoursEnabled;
  document.getElementById("quietHoursStart").value = quietHoursStart;
  document.getElementById("quietHoursEnd").value = quietHoursEnd;

  toggleQuietHoursInputs();
}

// Save notification settings to database
async function saveNotificationSettings() {
  await db.setSetting(
    "notifyNewEntry",
    document.getElementById("notifyNewEntry").checked ? "true" : "false",
  );
  await db.setSetting(
    "notifyEditEntry",
    document.getElementById("notifyEditEntry").checked ? "true" : "false",
  );
  await db.setSetting(
    "notifyDeleteEntry",
    document.getElementById("notifyDeleteEntry").checked ? "true" : "false",
  );
  await db.setSetting(
    "notifyDailySummary",
    document.getElementById("notifyDailySummary").checked ? "true" : "false",
  );
  await db.setSetting(
    "notificationSound",
    document.getElementById("notificationSound").value,
  );
  await db.setSetting(
    "notificationVibration",
    document.getElementById("notificationVibration").checked ? "true" : "false",
  );
  await db.setSetting(
    "quietHoursEnabled",
    document.getElementById("quietHoursEnabled").checked ? "true" : "false",
  );
  await db.setSetting(
    "quietHoursStart",
    document.getElementById("quietHoursStart").value,
  );
  await db.setSetting(
    "quietHoursEnd",
    document.getElementById("quietHoursEnd").value,
  );
}

// Handle notifications toggle
function handleNotificationsToggle() {
  const isEnabled = document.getElementById(
    "notificationsEnabledToggle",
  ).checked;
  if (isEnabled) {
    requestNotificationPermission();
  } else {
    db.setSetting("notificationsEnabled", "false");
  }
}

// Toggle quiet hours inputs visibility
function toggleQuietHoursInputs() {
  const quietHoursEnabled =
    document.getElementById("quietHoursEnabled").checked;
  const quietHoursInputs = document.getElementById("quietHoursInputs");
  if (quietHoursInputs) {
    quietHoursInputs.style.display = quietHoursEnabled ? "block" : "none";
  }
}

// Test notification
function testNotification() {
  if (Notification.permission === "granted") {
    showTestNotification();
  } else {
    Swal.fire("Error", "Notification permission not granted", "error");
  }
}

// Splash Screen Management
function initSplashScreen() {
  const splashScreen = document.getElementById("splashScreen");

  // Hide splash screen after delay
  setTimeout(() => {
    if (splashScreen) {
      splashScreen.classList.remove("active");
      splashScreen.classList.add("hidden");
    }
  }, 3000); // 3 second total duration (0.8s animation + 2.2s delay + 0.5s fade)
}

// Mobile Native App Optimizations
function initMobileOptimizations() {
  // Prevent pinch zoom
  document.addEventListener("gesturestart", function (e) {
    e.preventDefault();
  });

  // Handle viewport on rotation
  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      // Reset scrolling on orientation change
      document.body.style.height = "auto";
      document.documentElement.style.height = "auto";
    }, 100);
  });

  // Allow body to scroll naturally on mobile
  document.body.style.height = "auto";
  document.documentElement.style.height = "auto";
}

// PWA Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Detect if running on GitHub Pages subdirectory or local
    const swUrl = window.location.pathname.includes("/Fuel-Consumption") 
      ? "/Fuel-Consumption/sw.js" 
      : "/sw.js";
    
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("Service Worker registered:", registration);
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}

// Install prompt handling for app installation
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("Install prompt is ready");
  // Auto-show install modal after 2 seconds
  setTimeout(() => {
    showInstallModal();
  }, 2000);
});

// Show install modal
function showInstallModal() {
  // Don't show if app is already installed
  if (localStorage.getItem("appInstalled") === "true") {
    return;
  }

  if (deferredPrompt) {
    Swal.fire({
      title: "Install Fleet Manager",
      html: `
                <div style="text-align: left; line-height: 1.8;">
                    <p>Install the Fleet Manager app to your home screen for quick access and offline functionality.</p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 0.9em;">
                        <p style="margin: 5px 0;"><strong>✓</strong> Quick access from home screen</p>
                        <p style="margin: 5px 0;"><strong>✓</strong> Work offline</p>
                        <p style="margin: 5px 0;"><strong>✓</strong> Full screen experience</p>
                    </div>
                </div>
            `,
      icon: "info",
      iconColor: "#F54927",
      showCancelButton: true,
      allowOutsideClick: false,
      allowEscapeKey: true,
      confirmButtonText: "Install Now",
      cancelButtonText: "Remind Later",
      confirmButtonColor: "#F54927",
      cancelButtonColor: "#6c757d",
      customClass: {
        popup: "install-modal-popup",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === "accepted") {
            console.log("App installed");
            Swal.fire("Success!", "App installed successfully!", "success");
            localStorage.setItem("appInstalled", "true");
          }
          deferredPrompt = null;
        });
      }
    });
  }
}

// Handle app installation
function installApp() {
  showInstallModal();
}

// Hide install button on app launch
window.addEventListener("appinstalled", () => {
  console.log("App was installed");
  const installBtn = document.getElementById("installBtn");
  if (installBtn) {
    installBtn.style.display = "none";
  }
  // Mark app as installed
  localStorage.setItem("appInstalled", "true");
});

// Detect iOS and show manual install instructions
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

async function showIOSInstallGuide() {
  if (isIOS() && !(await db.getSetting("iosInstallDismissed"))) {
    Swal.fire({
      title: "Install on iOS",
      html:
        '<p style="text-align: left;">To install this app on your iPhone/iPad:</p>' +
        '<ol style="text-align: left;">' +
        "<li>Tap the <strong>Share</strong> button (up arrow)</li>" +
        '<li>Scroll and tap <strong>"Add to Home Screen"</strong></li>' +
        "<li>Enter app name and tap <strong>Add</strong></li>" +
        "</ol>",
      icon: "info",
      confirmButtonText: "Got it",
      didClose: () => {
        db.setSetting("iosInstallDismissed", "true");
      },
    });
  }
}

// Show iOS guide on first load
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(showIOSInstallGuide, 2000);
});

// Theme Toggle
async function initTheme() {
  const savedTheme = (await db.getSetting("theme")) || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

async function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  await db.setSetting("theme", newTheme);
  updateThemeIcon(newTheme);
  updateSelect2Theme(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById("themeIcon");
  const mobileIcon = document.getElementById("themeIconMobile");
  const iconClass = theme === "light" ? "fas fa-moon" : "fas fa-sun";
  if (icon) icon.className = iconClass;
  if (mobileIcon) mobileIcon.className = iconClass;
}

// Initialize theme on page load
initTheme().catch((err) => console.log("Theme init error:", err));

// Get current theme colors
function getThemeColors() {
  const root = document.documentElement;
  const styles = getComputedStyle(root);

  return {
    bgPrimary: styles.getPropertyValue("--bg-primary").trim() || "#FEEBE7",
    bgSecondary: styles.getPropertyValue("--bg-secondary").trim() || "#FCC6BB",
    textPrimary: styles.getPropertyValue("--text-primary").trim() || "#440E03",
    textSecondary:
      styles.getPropertyValue("--text-secondary").trim() || "#701705",
    primaryColor:
      styles.getPropertyValue("--primary-color").trim() || "#F54927",
    borderColor: styles.getPropertyValue("--border-color").trim() || "#FAA18F",
    successColor:
      styles.getPropertyValue("--success-color").trim() || "#F87C63",
  };
}

// Select2 initialization
function initSelect2() {
  if (jQuery && jQuery.fn.select2) {
    jQuery("#operator").select2({
      width: "100%",
      containerCssClass: "form-select-container",
    });
    jQuery("#equipment").select2({
      width: "100%",
      containerCssClass: "form-select-container",
    });
    jQuery("#editEquipment").select2({
      width: "100%",
      containerCssClass: "form-select-container",
    });
  }
}

// Update Select2 styling based on theme
function updateSelect2Theme(theme) {
  if (jQuery && jQuery.fn.select2) {
    jQuery("#operator, #equipment, #editEquipment").each(function () {
      jQuery(this).select2("destroy").select2({
        width: "100%",
        containerCssClass: "form-select-container",
      });
    });
  }
}

// Initialize Select2 when DOM is ready
document.addEventListener("DOMContentLoaded", async function () {
  initSplashScreen();
  initMobileOptimizations();
  initPushNotifications();
  initSelect2();
  // Initialize datepickers with longer delay to ensure Air Datepicker loads
  setTimeout(() => {
    initFlatpickr();
    initEditFlatpickr();
    initFilterDatepickers();
  }, 500);

  // Load data from IndexedDB
  await displayHistory();
  await updateStats();
});

// Air Datepicker initialization
function initFlatpickr() {
  setTimeout(() => {
    try {
      const dateEl = document.getElementById("date");
      if (dateEl && typeof AirDatepicker !== "undefined") {
        // Remove existing instance
        if (dateEl.airdatepicker) {
          dateEl.airdatepicker.destroy();
        }
        // Create new instance with English language
        new AirDatepicker("#date", {
          dateFormat: "yyyy-MM-dd",
          autoClose: true,
          view: "days",
          locale: {
            days: [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ],
            daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
            months: [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
            monthsShort: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
            today: "Today",
            clear: "Clear",
            dateFormat: "yyyy-MM-dd",
            timeFormat: "HH:mm",
            firstDay: 0,
          },
          onOpen: function (instance) {
            // Auto-select today when picker opens
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            instance.selectDate(today);
          },
        });
      }
    } catch (e) {
      console.log("Air Datepicker init error:", e);
    }
  }, 100);
}

function initEditFlatpickr() {
  setTimeout(() => {
    try {
      const editDateEl = document.getElementById("editDate");
      if (editDateEl && typeof AirDatepicker !== "undefined") {
        // Remove existing instance
        if (editDateEl.airdatepicker) {
          editDateEl.airdatepicker.destroy();
        }
        // Create new instance with English language
        new AirDatepicker("#editDate", {
          dateFormat: "yyyy-MM-dd",
          autoClose: true,
          view: "days",
          locale: {
            days: [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ],
            daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
            months: [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
            monthsShort: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
            today: "Today",
            clear: "Clear",
            dateFormat: "yyyy-MM-dd",
            timeFormat: "HH:mm",
            firstDay: 0,
          },
          onOpen: function (instance) {
            // Auto-select today when picker opens
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            instance.selectDate(today);
          },
        });
      }
    } catch (e) {
      console.log("Air Datepicker edit init error:", e);
    }
  }, 100);
}

function initFilterDatepickers() {
  setTimeout(() => {
    try {
      const filterFromEl = document.getElementById("filterFromDate");
      const filterToEl = document.getElementById("filterToDate");

      if (typeof AirDatepicker !== "undefined") {
        // Initialize "From Date" picker
        if (filterFromEl) {
          if (filterFromEl.airdatepicker) {
            filterFromEl.airdatepicker.destroy();
          }
          new AirDatepicker("#filterFromDate", {
            dateFormat: "yyyy-MM-dd",
            autoClose: true,
            view: "days",
            locale: {
              days: [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ],
              daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
              daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
              months: [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
              monthsShort: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ],
              today: "Today",
              clear: "Clear",
              dateFormat: "yyyy-MM-dd",
              timeFormat: "HH:mm",
              firstDay: 0,
            },
          });
        }

        // Initialize "To Date" picker
        if (filterToEl) {
          if (filterToEl.airdatepicker) {
            filterToEl.airdatepicker.destroy();
          }
          new AirDatepicker("#filterToDate", {
            dateFormat: "yyyy-MM-dd",
            autoClose: true,
            view: "days",
            locale: {
              days: [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ],
              daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
              daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
              months: [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ],
              monthsShort: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ],
              today: "Today",
              clear: "Clear",
              dateFormat: "yyyy-MM-dd",
              timeFormat: "HH:mm",
              firstDay: 0,
            },
          });
        }
      }
    } catch (e) {
      console.log("Air Datepicker filter init error:", e);
    }
  }, 100);
}

// Export Panel Functions
function openExportPanel() {
  const exportPanel = document.getElementById("exportPanel");
  const exportOverlay = document.getElementById("exportOverlay");
  exportPanel.classList.add("active");
  exportOverlay.classList.add("active");
}

function closeExportPanel() {
  const exportPanel = document.getElementById("exportPanel");
  const exportOverlay = document.getElementById("exportOverlay");
  exportPanel.classList.remove("active");
  exportOverlay.classList.remove("active");
}

// Features Panel Functions
function openFeaturesPanel() {
  const featuresPanel = document.getElementById("featuresPanel");
  const featuresOverlay = document.getElementById("featuresOverlay");
  featuresPanel.classList.add("active");
  featuresOverlay.classList.add("active");
}

function closeFeaturesPanel() {
  const featuresPanel = document.getElementById("featuresPanel");
  const featuresOverlay = document.getElementById("featuresOverlay");
  featuresPanel.classList.remove("active");
  featuresOverlay.classList.remove("active");
}

// Entry Modal Photo & Location Helpers
let capturedLocation = null;

function captureLocationForEntry() {
  const btn = document.getElementById("captureLocationBtn");
  const status = document.getElementById("locationStatus");
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capturing...';
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      capturedLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check-circle"></i> Location Captured';
      btn.classList.add('btn-success');
      btn.classList.remove('btn-outline-primary');
      status.style.display = 'block';
    },
    (error) => {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-location-arrow"></i> Capture Location';
      Swal.fire('Error', `Location capture failed: ${error.message}`, 'error');
    }
  );
}

// Handle photo input change
document.addEventListener('DOMContentLoaded', () => {
  const photoInput = document.getElementById('photoInput');
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const files = e.target.files;
      const count = files.length;
      const preview = document.getElementById('photoPreview');
      const photoCount = document.getElementById('photoCount');
      const thumbnails = document.getElementById('photoThumbnails');
      
      console.log('Photo input changed, files:', count);
      
      if (count > 0) {
        photoCount.textContent = count;
        preview.style.display = 'block';
        thumbnails.innerHTML = '';
        
        // Create previews for each file
        Array.from(files).forEach((file, index) => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const container = document.createElement('div');
              container.style.position = 'relative';
              container.style.borderRadius = '6px';
              container.style.overflow = 'hidden';
              container.style.background = '#f5f5f5';
              container.style.border = '1px solid #ddd';
              container.style.cursor = 'pointer';
              
              const img = document.createElement('img');
              img.src = event.target.result;
              img.style.width = '100%';
              img.style.height = '80px';
              img.style.objectFit = 'cover';
              img.style.display = 'block';
              
              const removeBtn = document.createElement('button');
              removeBtn.type = 'button';
              removeBtn.innerHTML = '×';
              removeBtn.style.position = 'absolute';
              removeBtn.style.top = '2px';
              removeBtn.style.right = '2px';
              removeBtn.style.background = 'rgba(245, 73, 39, 0.9)';
              removeBtn.style.border = 'none';
              removeBtn.style.color = 'white';
              removeBtn.style.borderRadius = '50%';
              removeBtn.style.width = '24px';
              removeBtn.style.height = '24px';
              removeBtn.style.padding = '0';
              removeBtn.style.cursor = 'pointer';
              removeBtn.style.fontSize = '18px';
              removeBtn.style.lineHeight = '1';
              removeBtn.style.opacity = '0';
              removeBtn.style.transition = 'opacity 0.2s';
              removeBtn.style.display = 'flex';
              removeBtn.style.alignItems = 'center';
              removeBtn.style.justifyContent = 'center';
              
              removeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                removePhotoFromInput(index);
              };
              
              container.appendChild(img);
              container.appendChild(removeBtn);
              
              container.onmouseover = () => { removeBtn.style.opacity = '1'; };
              container.onmouseout = () => { removeBtn.style.opacity = '0'; };
              
              thumbnails.appendChild(container);
            };
            reader.readAsDataURL(file);
          }
        });
      } else {
        preview.style.display = 'none';
        thumbnails.innerHTML = '';
      }
    });
  }
});

// Remove photo from input
window.removePhotoFromInput = function(indexToRemove) {
  const photoInput = document.getElementById('photoInput');
  
  // Create new FileList manually
  const newFiles = [];
  Array.from(photoInput.files).forEach((file, i) => {
    if (i !== indexToRemove) {
      newFiles.push(file);
    }
  });
  
  // Use DataTransfer to set new files
  try {
    const dt = new DataTransfer();
    newFiles.forEach(file => dt.items.add(file));
    photoInput.files = dt.files;
  } catch (e) {
    console.warn('Cannot remove photo:', e);
  }
  
  // Refresh preview
  photoInput.dispatchEvent(new Event('change', { bubbles: true }));
};

function resetNewEntryForm() {
  // Reset form
  const form = document.getElementById('fuelForm');
  if (form) form.reset();
  
  // Reset location
  capturedLocation = null;
  const btn = document.getElementById('captureLocationBtn');
  const status = document.getElementById('locationStatus');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-location-arrow"></i> Capture Location';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-outline-primary');
  }
  if (status) status.style.display = 'none';
  
  // Reset photo input
  const photoInput = document.getElementById('photoInput');
  if (photoInput) photoInput.value = '';
  const preview = document.getElementById('photoPreview');
  if (preview) preview.style.display = 'none';
  
  // Hide results
  const resultBox = document.getElementById('resultBox');
  if (resultBox) resultBox.style.display = 'none';
}

const operatorSelect = document.getElementById("operator");
const customOperatorInput = document.getElementById("customOperator");
const equipmentSelect = document.getElementById("equipment");
const distanceGroup = document.getElementById("distanceGroup");
const distanceInput = document.getElementById("distance");

// Edit modal variables
const editEquipmentSelect = document.getElementById("editEquipment");
const editDistanceGroup = document.getElementById("editDistanceGroup");
const editDistanceInput = document.getElementById("editDistance");
let currentEditingId = null;

// FAB menu toggle
const fabButton = document.getElementById("fabButton");
const fabMenu = document.getElementById("fabMenu");
let fabMenuOpen = false;

function toggleFabMenu() {
  fabMenuOpen = !fabMenuOpen;
  if (fabMenuOpen) {
    fabMenu.classList.add("active");
    fabButton.style.transform = "rotate(45deg)";
  } else {
    fabMenu.classList.remove("active");
    fabButton.style.transform = "rotate(0)";
  }
}

// Close FAB menu when clicking outside
document.addEventListener("click", function (e) {
  if (!e.target.closest(".fab") && !e.target.closest(".fab-menu-card")) {
    fabMenuOpen = false;
    fabMenu.classList.remove("active");
    fabButton.style.transform = "rotate(0)";
  }
});

function openNewEntryModal() {
  // Reset form and hide results
  document.getElementById("fuelForm").reset();
  operatorSelect.value = "";
  equipmentSelect.value = "";

  // Reset Select2 fields
  if (typeof $ !== "undefined" && jQuery.fn.select2) {
    jQuery("#operator").val("").trigger("change");
    jQuery("#equipment").val("").trigger("change");
  }

  customOperatorInput.style.display = "none";
  distanceGroup.style.display = "none";
  document.getElementById("resultBox").style.display = "none";

  // Set current year automatically
  const currentYear = new Date().getFullYear();
  document.getElementById("year").value = currentYear;

  // Show modal
  const newEntryModal = new bootstrap.Modal(
    document.getElementById("newEntryModal"),
  );
  newEntryModal.show();

  // Reinitialize date pickers, time pickers, and Select2 after modal is shown
  setTimeout(() => {
    initTimepicker();
    initFlatpickr();
    initSelect2();
    // Reset distance field visibility
    handleEquipmentChange();
  }, 200);
}

// Initialize capitalization for form inputs
function initCapitalizeInputs() {
  const capitalizeInputs = document.querySelectorAll(".capitalize-input");
  capitalizeInputs.forEach((input) => {
    input.addEventListener("input", function () {
      this.value = this.value.toUpperCase();
    });
  });
}

// Call on page load
document.addEventListener("DOMContentLoaded", function () {
  initCapitalizeInputs();
});

function openNotificationSettings() {
  // Close FAB menu if open
  fabMenuOpen = false;
  fabMenu.classList.remove("active");
  fabButton.style.transform = "rotate(0)";

  // Load notification settings
  loadNotificationSettings();
  loadPushNotificationSettings();

  // Show modal
  const notificationModal = new bootstrap.Modal(
    document.getElementById("notificationSettingsModal"),
  );
  notificationModal.show();
}

async function showSummaryModal() {
  // Close FAB menu first
  fabMenuOpen = false;
  fabMenu.classList.remove("active");
  fabButton.style.transform = "rotate(0)";

  const history = await db.getAllFuelEntries();

  const totalRecords = history.length;
  const totalHours = history.reduce((sum, h) => sum + h.totalHours, 0);
  const totalLiters = history.reduce((sum, h) => sum + h.liters, 0);
  const avgConsumption =
    totalRecords > 0 ? (totalLiters / totalHours).toFixed(2) : 0;

  // Update modal
  document.getElementById("modalTotalRecords").textContent = totalRecords;
  document.getElementById("modalTotalHours").textContent =
    totalHours.toFixed(1);
  document.getElementById("modalTotalLiters").textContent =
    totalLiters.toFixed(1);
  document.getElementById("modalAvgConsumption").textContent = avgConsumption;

  // Show modal
  const summaryModal = new bootstrap.Modal(
    document.getElementById("summaryModal"),
  );
  summaryModal.show();
}

// Show/hide custom operator input
operatorSelect.addEventListener("change", function () {
  if (this.value === "other") {
    customOperatorInput.style.display = "block";
    customOperatorInput.focus();
  } else {
    customOperatorInput.style.display = "none";
  }
});

// Also listen to Select2 change event
if (jQuery) {
  jQuery("#operator").on("select2:select", function () {
    if (jQuery(this).val() === "other") {
      customOperatorInput.style.display = "block";
      customOperatorInput.focus();
    } else {
      customOperatorInput.style.display = "none";
    }
  });
}

// Show/hide distance field based on equipment type
// Handle equipment selection for distance field
function handleEquipmentChange() {
  const value = equipmentSelect.value;
  if (value === "Vehicle" || value === "Motorbike") {
    distanceGroup.style.display = "block";
    distanceInput.required = true;
  } else {
    distanceGroup.style.display = "none";
    distanceInput.required = false;
    distanceInput.value = "";
  }
}

equipmentSelect.addEventListener("change", handleEquipmentChange);

// Also handle Select2 change event
jQuery("#equipment").on("change", function () {
  handleEquipmentChange();
});

// Show/hide distance field in edit modal based on equipment type
editEquipmentSelect.addEventListener("change", function () {
  if (this.value === "Vehicle" || this.value === "Motorbike") {
    editDistanceGroup.style.display = "block";
    editDistanceInput.required = true;
  } else {
    editDistanceGroup.style.display = "none";
    editDistanceInput.required = false;
    editDistanceInput.value = "";
  }
});

async function calculateConsumption() {
  const site = document.getElementById("site").value;
  const quarter = document.getElementById("quarter").value;
  const year = document.getElementById("year").value;
  const date = document.getElementById("date").value;
  const station = document.getElementById("station").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;
  const liters = parseFloat(document.getElementById("liters").value);
  const distance = parseFloat(document.getElementById("distance").value) || 0;
  let operator = operatorSelect.value;
  let equipment = equipmentSelect.value;

  if (operator === "other") {
    operator = customOperatorInput.value.trim();
  }

  // Validation
  if (!site || site.trim() === "") {
    Swal.fire({
      icon: "warning",
      title: "Missing Site",
      text: "Please enter the site name",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  if (!quarter || quarter === "") {
    Swal.fire({
      icon: "warning",
      title: "Missing Quarter",
      text: "Please select a quarter",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  if (!year || year === "") {
    Swal.fire({
      icon: "warning",
      title: "Missing Year",
      text: "Please enter a year",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  if (!date) {
    Swal.fire({
      icon: "warning",
      title: "Missing Date",
      text: "Please select the date",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  if (!station || station.trim() === "") {
    Swal.fire({
      icon: "warning",
      title: "Missing Refueling Station",
      text: "Please enter the refueling station",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  if (!startTime || !endTime) {
    Swal.fire({
      icon: "warning",
      title: "Missing Time",
      text: "Please enter both start and end times",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  if (!operator || operator === "") {
    Swal.fire({
      icon: "warning",
      title: "Missing Operator",
      text: "Please select or enter an operator name",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  if (!equipment || equipment === "") {
    Swal.fire({
      icon: "warning",
      title: "Missing Equipment",
      text: "Please select equipment",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  if (isNaN(liters) || liters <= 0) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Liters",
      text: "Please enter a valid amount of liters (greater than 0)",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  // Parse times
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  // Handle case where end time is next day
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const totalMinutes = endMinutes - startMinutes;
  const totalHours = (totalMinutes / 60).toFixed(2);

  // Different calculations based on equipment type
  let consumption = "";
  let consumptionValue = 0;

  if (equipment === "Generator") {
    // Generator: Liters per Hour
    consumption = (liters / totalHours).toFixed(2) + " L/h";
    consumptionValue = parseFloat(consumption);
  } else if (equipment === "Vehicle" || equipment === "Motorbike") {
    // Vehicle/Motorbike: needs distance validation
    if (isNaN(distance) || distance <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Distance",
        text: "Please enter a valid distance covered",
        confirmButtonColor: "#2563eb",
      });
      return;
    }
    // L/100km and km/L
    const lPer100km = ((liters / distance) * 100).toFixed(2);
    const kmPerLiter = (distance / liters).toFixed(2);
    consumption = `${lPer100km} L/100km | ${kmPerLiter} km/L`;
    consumptionValue = parseFloat(lPer100km);
  }

  // Display results
  document.getElementById("displayOperator").textContent =
    `${operator} (${equipment})`;
  document.getElementById("displayStart").textContent = startTime;
  document.getElementById("displayEnd").textContent = endTime;
  document.getElementById("displayHours").textContent = totalHours + " hrs";
  if (distance > 0) {
    document.getElementById("displayLiters").textContent =
      `${liters} L (${distance} km)`;
  } else {
    document.getElementById("displayLiters").textContent = liters + " L";
  }
  document.getElementById("displayConsumption").textContent = consumption;
  document.getElementById("resultBox").style.display = "block";

  // Save to history
  const record = {
    id: Date.now(),
    site: site,
    quarter: quarter,
    year: year,
    period: `${year}-${quarter}`,
    date: date,
    station: station,
    operator: operator,
    equipment: equipment,
    startTime: startTime,
    endTime: endTime,
    totalHours: parseFloat(totalHours),
    distance: distance,
    liters: liters,
    consumption: consumption,
    consumptionValue: consumptionValue,
    timestamp: new Date().toLocaleString(),
    location: capturedLocation ? {
      latitude: capturedLocation.latitude,
      longitude: capturedLocation.longitude,
      accuracy: capturedLocation.accuracy,
      timestamp: new Date().toISOString()
    } : null
  };

  addToHistory(record);

  // Handle photo uploads if any selected
  const photoInput = document.getElementById("photoInput");
  if (photoInput && photoInput.files.length > 0) {
    Swal.fire({
      title: "Uploading photos...",
      didOpen: async () => {
        Swal.showLoading();
        try {
          for (let file of photoInput.files) {
            await handlePhotoUpload(file, record.id);
          }
          Swal.fire({
            icon: "success",
            title: "Entry & Photos Saved!",
            text: `${operator} - ${equipment}: ${consumption}`,
            confirmButtonColor: "#10b981",
            timer: 2000,
          });
        } catch (error) {
          Swal.fire({
            icon: "warning",
            title: "Entry Saved, Photos Failed",
            text: `Entry saved but photo upload failed: ${error.message}`,
            confirmButtonColor: "#F54927",
          });
        }
      }
    });
  } else {
    // Show success message
    Swal.fire({
      icon: "success",
      title: "Entry Saved!",
      text: `${operator} - ${equipment}: ${consumption}`,
      confirmButtonColor: "#10b981",
      timer: 2000,
    });
  }

  // Send notifications if enabled
  if (Notification.permission === "granted") {
    // Send in-app notification
    await sendNotification(
      "Fleet Manager",
      {
        body: `Fuel entry saved: ${operator} - ${equipment} - ${consumption}`,
        tag: "fuel-entry-saved",
      },
      "entry-added",
    );

    // Send push notification
    const entryData = {
      id: record.id,
      equipment: equipment,
      operator: operator,
      liters: liters,
      consumption: consumption,
    };
    await notifyEntryAdded(entryData);
  }

  // Reset form
  document.getElementById("fuelForm").reset();
  operatorSelect.value = "";
  equipmentSelect.value = "";
  customOperatorInput.style.display = "none";
  distanceGroup.style.display = "none";

  // Auto-fill year with current year after saving
  const currentYear = new Date().getFullYear();
  document.getElementById("year").value = currentYear;
}

async function addToHistory(record) {
  await db.addFuelEntry(record);
  await displayHistory();
  await updateStats();
}

// Pagination variables
let currentPage = 1;
const recordsPerPage = 5;

// Date filter variables
let dateFilterFromDate = null;
let dateFilterToDate = null;

async function applyDateFilter() {
  const fromDateInput = document.getElementById("filterFromDate").value;
  const toDateInput = document.getElementById("filterToDate").value;

  if (!fromDateInput || !toDateInput) {
    Swal.fire({
      icon: "warning",
      title: "Date Range Required",
      text: "Please enter both From Date and To Date",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  const fromDate = new Date(fromDateInput);
  const toDate = new Date(toDateInput);

  if (fromDate > toDate) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Date Range",
      text: "From Date must be earlier than To Date",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  dateFilterFromDate = fromDate;
  dateFilterToDate = toDate;
  currentPage = 1;
  await displayHistory();
}

async function clearDateFilter() {
  dateFilterFromDate = null;
  dateFilterToDate = null;
  document.getElementById("filterFromDate").value = "";
  document.getElementById("filterToDate").value = "";
  currentPage = 1;
  await displayHistory();
}

async function getFilteredHistory() {
  const history = await db.getAllFuelEntries();

  if (!dateFilterFromDate || !dateFilterToDate) {
    return history;
  }

  return history.filter((record) => {
    if (!record.date) return false;
    const recordDate = new Date(record.date);
    return recordDate >= dateFilterFromDate && recordDate <= dateFilterToDate;
  });
}

async function displayHistory() {
  const history = await getFilteredHistory();
  const tableContainer = document.getElementById("tableContainer");
  const historyCount = document.getElementById("historyCount");

  // Show total records and filtered count if applicable
  let countText =
    history.length + " record" + (history.length !== 1 ? "s" : "");
  if (dateFilterFromDate || dateFilterToDate) {
    const allEntries = await db.getAllFuelEntries();
    const totalRecords = allEntries.length;
    countText += ` (filtered from ${totalRecords})`;
  }
  historyCount.textContent = countText;

  if (history.length === 0) {
    tableContainer.innerHTML = `
              <div class="no-data">
                  <i class="fas fa-inbox"></i>
                  <p class="mt-2">
                      ${dateFilterFromDate && dateFilterToDate ? "No fuel entries found for the selected date range." : "No fuel entries yet. Add one to get started!"}
                  </p>
              </div>
          `;
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(history.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedHistory = history.slice(startIndex, endIndex);

  let html = `
         <table class="table">
             <thead>
                 <tr>
                     <th><i class="fas fa-map-marker-alt"></i> Site</th>
                     <th><i class="fas fa-calendar"></i> Period</th>
                     <th><i class="fas fa-calendar-day"></i> Date</th>
                     <th><i class="fas fa-gas-pump"></i> Station</th>
                     <th><i class="fas fa-user"></i> Operator</th>
                     <th><i class="fas fa-cog"></i> Equipment</th>
                     <th><i class="fas fa-clock"></i> Time Period</th>
                     <th><i class="fas fa-hourglass-half"></i> Hours</th>
                     <th><i class="fas fa-road"></i> Distance</th>
                     <th><i class="fas fa-droplet"></i> Liters</th>
                     <th><i class="fas fa-flame"></i> Consumption</th>
                     <th><i class="fas fa-tools"></i> Actions</th>
                 </tr>
             </thead>
             <tbody>
     `;

  paginatedHistory.forEach((record, index) => {
    const distanceDisplay =
      record.distance && record.distance > 0 ? `${record.distance} km` : "-";
    const periodDisplay = record.period || "-";
    const dateDisplay = record.date || "-";
    const stationDisplay = record.station || "-";
    html += `
             <tr>
                 <td data-label="Site"><strong>${record.site || "-"}</strong></td>
                 <td data-label="Period">${periodDisplay}</td>
                 <td data-label="Date">${dateDisplay}</td>
                 <td data-label="Station">${stationDisplay}</td>
                 <td data-label="Operator"><strong>${record.operator}</strong></td>
                 <td data-label="Equipment">${record.equipment}</td>
                 <td data-label="Time Period">${record.startTime} - ${record.endTime}</td>
                 <td data-label="Hours">${record.totalHours} h</td>
                 <td data-label="Distance">${distanceDisplay}</td>
                 <td data-label="Liters">${record.liters} L</td>
                 <td data-label="Consumption"><span class="badge badge-consumption">${record.consumption}</span></td>
                 <td data-label="Actions">
                     <button class="btn btn-sm btn-primary" onclick="editHistoryItem('${record.id}')" title="Edit">
                         <i class="fas fa-edit"></i>
                     </button>
                     <button class="btn btn-sm btn-danger" onclick="deleteHistoryItem('${record.id}')" title="Delete">
                         <i class="fas fa-trash-alt"></i>
                     </button>
                 </td>
             </tr>
         `;
  });

  // Calculate totals for all filtered data
  const totalHours = history.reduce(
    (sum, record) => sum + parseFloat(record.totalHours || 0),
    0,
  );
  const totalLiters = history.reduce(
    (sum, record) => sum + parseFloat(record.liters || 0),
    0,
  );
  const totalConsumption =
    totalHours > 0 ? (totalLiters / totalHours).toFixed(2) : "0.00";

  html += `
             </tbody>
         </table>
         <div class="table-totals">
             <div class="totals-row">
                 <span class="totals-label">Total Hours:</span>
                 <span class="totals-value">${totalHours.toFixed(2)} h</span>
             </div>
             <div class="totals-row">
                 <span class="totals-label">Total Liters:</span>
                 <span class="totals-value">${totalLiters.toFixed(2)} L</span>
             </div>
             <div class="totals-row">
                 <span class="totals-label">Total Consumption:</span>
                 <span class="totals-value">${totalConsumption} L/h</span>
             </div>
         </div>
     `;

  // Add pagination controls
  if (totalPages > 1) {
    html += `
             <div class="pagination-controls">
                 <button class="pagination-btn" onclick="goToPage(1)" ${currentPage === 1 ? "disabled" : ""}>
                     <i class="fas fa-chevron-left"></i> First
                 </button>
                 <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>
                     <i class="fas fa-chevron-left"></i> Prev
                 </button>
                 <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
                 <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>
                     Next <i class="fas fa-chevron-right"></i>
                 </button>
                 <button class="pagination-btn" onclick="goToPage(${totalPages})" ${currentPage === totalPages ? "disabled" : ""}>
                     Last <i class="fas fa-chevron-right"></i>
                 </button>
             </div>
         `;
  }

  tableContainer.innerHTML = html;
}

async function goToPage(pageNumber) {
  const history = await db.getAllFuelEntries();
  const totalPages = Math.ceil(history.length / recordsPerPage);

  if (pageNumber >= 1 && pageNumber <= totalPages) {
    currentPage = pageNumber;
    displayHistory();
  }
}

async function editHistoryItem(id) {
  const record = await db.getFuelEntryById(Number(id));

  if (!record) {
    Swal.fire("Error", "Record not found", "error");
    return;
  }

  // Store the ID for saving later
  currentEditingId = id;

  // Populate the edit form
  document.getElementById("editOperator").value = record.operator;
  document.getElementById("editEquipment").value = record.equipment;
  document.getElementById("editDate").value = record.date || "";
  document.getElementById("editStation").value = record.station || "";
  document.getElementById("editStartTime").value = record.startTime;
  document.getElementById("editEndTime").value = record.endTime;
  document.getElementById("editDistance").value = record.distance || "";
  document.getElementById("editLiters").value = record.liters;

  // Trigger distance field visibility
  editEquipmentSelect.dispatchEvent(new Event("change"));

  // Show the modal
  const editModal = new bootstrap.Modal(document.getElementById("editModal"));
  editModal.show();

  // Initialize Air Datepicker and Select2 after modal is shown
  setTimeout(() => {
    initEditFlatpickr();
    initSelect2();
  }, 200);
}

async function saveEditedRecord() {
  const operator = document.getElementById("editOperator").value.trim();
  const equipment = document.getElementById("editEquipment").value;
  const date = document.getElementById("editDate").value;
  const station = document.getElementById("editStation").value;
  const startTime = document.getElementById("editStartTime").value;
  const endTime = document.getElementById("editEndTime").value;
  const distance =
    parseFloat(document.getElementById("editDistance").value) || 0;
  const liters = parseFloat(document.getElementById("editLiters").value);

  // Validation
  if (!operator) {
    Swal.fire("Error", "Please enter operator name", "warning");
    return;
  }

  if (!startTime || !endTime) {
    Swal.fire("Error", "Please enter both start and end times", "warning");
    return;
  }

  if (isNaN(liters) || liters <= 0) {
    Swal.fire("Error", "Please enter valid liters amount", "warning");
    return;
  }

  if (
    (equipment === "Vehicle" || equipment === "Motorbike") &&
    (isNaN(distance) || distance <= 0)
  ) {
    Swal.fire("Error", "Please enter valid distance for vehicles", "warning");
    return;
  }

  // Calculate consumption
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  const totalMinutes = endMinutes - startMinutes;
  const totalHours = (totalMinutes / 60).toFixed(2);

  let consumption = "";
  let consumptionValue = 0;

  if (equipment === "Generator") {
    consumption = (liters / totalHours).toFixed(2) + " L/h";
    consumptionValue = parseFloat(consumption);
  } else {
    const lPer100km = ((liters / distance) * 100).toFixed(2);
    const kmPerLiter = (distance / liters).toFixed(2);
    consumption = `${lPer100km} L/100km | ${kmPerLiter} km/L`;
    consumptionValue = parseFloat(lPer100km);
  }

  // Update record in IndexedDB
  const existingRecord = await db.getFuelEntryById(currentEditingId);

  if (existingRecord) {
    const updatedData = {
      date: date,
      station: station,
      operator: operator,
      equipment: equipment,
      startTime: startTime,
      endTime: endTime,
      totalHours: parseFloat(totalHours),
      distance: distance,
      liters: liters,
      consumption: consumption,
      consumptionValue: consumptionValue,
    };

    await db.updateFuelEntry(currentEditingId, updatedData);
    displayHistory();
    updateStats();

    // Send edit notification
    if (Notification.permission === "granted") {
      const entryData = {
        id: currentEditingId,
        equipment: equipment,
        operator: operator,
        liters: liters,
        consumption: consumption,
      };
      await notifyEntryEdited(entryData);
    }

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();

    Swal.fire("Updated!", "Record has been updated successfully", "success");
    currentEditingId = null;
  }
}

function deleteHistoryItem(id) {
  Swal.fire({
    icon: "warning",
    title: "Delete Entry?",
    text: "This action cannot be undone",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it!",
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Get entry data before deleting for notification
      const entry = await db.getFuelEntryById(Number(id));

      await db.deleteFuelEntry(Number(id));
      displayHistory();
      updateStats();

      // Send delete notification
      if (Notification.permission === "granted" && entry) {
        await notifyEntryDeleted(entry);
      }

      Swal.fire("Deleted!", "Entry has been removed", "success");
    }
  });
}

function confirmClearHistory() {
  Swal.fire({
    icon: "error",
    title: "Clear All Data?",
    text: "This will delete all fuel consumption records permanently",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, clear everything!",
  }).then(async (result) => {
    if (result.isConfirmed) {
      await db.clearAllFuelEntries();
      displayHistory();
      updateStats();

      // Send notification
      if (Notification.permission === "granted") {
        await sendNotification(
          "Fleet Manager",
          {
            body: "All fuel entries have been cleared",
            tag: "data-cleared",
          },
          "entry-deleted",
        );
      }

      Swal.fire("Cleared!", "All data has been removed", "success");
    }
  });
}

async function updateStats() {
  const history = await db.getAllFuelEntries();

  const totalRecords = history.length;
  const totalHours = history.reduce((sum, h) => sum + h.totalHours, 0);
  const totalLiters = history.reduce((sum, h) => sum + h.liters, 0);
  const avgConsumption =
    totalRecords > 0 ? (totalLiters / totalHours).toFixed(2) : 0;

  // Update main stats (if elements exist)
  const el1 = document.getElementById("totalRecords");
  if (el1) el1.textContent = totalRecords;

  const el2 = document.getElementById("totalHours");
  if (el2) el2.textContent = totalHours.toFixed(1);

  const el3 = document.getElementById("totalLiters");
  if (el3) el3.textContent = totalLiters.toFixed(1);

  const el4 = document.getElementById("avgConsumption");
  if (el4) el4.textContent = avgConsumption;

  // Update sidebar (if elements exist)
  const el5 = document.getElementById("sidebarRecords");
  if (el5) el5.textContent = totalRecords;

  const el6 = document.getElementById("sidebarHours");
  if (el6) el6.textContent = totalHours.toFixed(1) + " h";

  const el7 = document.getElementById("sidebarLiters");
  if (el7) el7.textContent = totalLiters.toFixed(1) + " L";

  const el8 = document.getElementById("sidebarAvgRate");
  if (el8) el8.textContent = avgConsumption + " L/h";
}

async function showChart() {
  const history = await db.getAllFuelEntries();

  if (history.length === 0) {
    Swal.fire({
      icon: "info",
      title: "No Data",
      text: "Add fuel entries to view charts",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById("chartModal"));
  modal.show();

  setTimeout(() => {
    renderCharts(history);
  }, 200);
}

function renderCharts(history) {
  // Monthly Trend Chart
  const monthlyData = aggregateMonthlyData(history);
  const ctx0 = document.getElementById("monthlyTrendChart").getContext("2d");
  new Chart(ctx0, {
    type: "line",
    data: {
      labels: monthlyData.months,
      datasets: [
        {
          label: "Average Consumption (L/h)",
          data: monthlyData.avgConsumption,
          borderColor: "#FF6B6B",
          backgroundColor: "rgba(255, 107, 107, 0.2)",
          borderWidth: 4,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#FF6B6B",
          pointBorderColor: "#FFF",
          pointBorderWidth: 3,
          pointRadius: 7,
          pointHoverRadius: 9,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 14,
              weight: "bold",
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Month",
            color: "#333",
            font: {
              size: 12,
              weight: "bold",
            },
          },
          ticks: {
            font: {
              size: 11,
              weight: "bold",
            },
          },
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          title: {
            display: true,
            text: "Consumption (L/h)",
            color: "#FF6B6B",
            font: {
              size: 12,
              weight: "bold",
            },
          },
          ticks: {
            color: "#FF6B6B",
            font: {
              weight: "bold",
            },
          },
          beginAtZero: true,
        },
      },
    },
  });

  // Equipment Pie Chart
  const equipmentData = aggregateByEquipment(history);
  const ctx3 = document.getElementById("equipmentPieChart").getContext("2d");
  new Chart(ctx3, {
    type: "doughnut",
    data: {
      labels: equipmentData.labels,
      datasets: [
        {
          label: "Liters Used",
          data: equipmentData.liters,
          backgroundColor: [
            "#FF6B6B",
            "#4ECDC4",
            "#45B7D1",
            "#FFA07A",
            "#98D8C8",
            "#F7DC6F",
          ],
          borderColor: "#FFF",
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            font: {
              size: 12,
              weight: "bold",
            },
          },
        },
      },
    },
  });

  // Operator Horizontal Bar Chart
  const operatorData = aggregateByOperator(history);
  const ctx4 = document.getElementById("operatorBarChart").getContext("2d");
  new Chart(ctx4, {
    type: "bar",
    data: {
      labels: operatorData.labels,
      datasets: [
        {
          label: "Total Liters",
          data: operatorData.liters,
          backgroundColor: "#FF6B6B",
          borderRadius: 8,
          borderWidth: 0,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: {
              size: 12,
              weight: "bold",
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Liters",
            font: {
              weight: "bold",
            },
          },
          ticks: {
            font: {
              weight: "bold",
            },
          },
        },
        y: {
          ticks: {
            font: {
              size: 11,
              weight: "bold",
            },
          },
        },
      },
    },
  });

  // Consumption Chart
  const ctx1 = document.getElementById("consumptionChart").getContext("2d");
  new Chart(ctx1, {
    type: "line",
    data: {
      labels: history.map((h) => `${h.operator} (${h.equipment})`),
      datasets: [
        {
          label: "Consumption Rate",
          data: history.map((h) => h.consumptionValue),
          borderColor: "#FF1744",
          backgroundColor: "rgba(255, 23, 68, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#FF1744",
          pointBorderColor: "#FFF",
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  });

  // Liters Chart
  const ctx2 = document.getElementById("litersChart").getContext("2d");
  new Chart(ctx2, {
    type: "bar",
    data: {
      labels: history.map((h) => `${h.operator} (${h.equipment})`),
      datasets: [
        {
          label: "Liters Used",
          data: history.map((h) => h.liters),
          backgroundColor: [
            "#FF6B6B",
            "#4ECDC4",
            "#45B7D1",
            "#FFA07A",
            "#98D8C8",
            "#F7DC6F",
            "#BB8FCE",
            "#85C1E9",
          ],
          borderRadius: 8,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  });
}

function aggregateMonthlyData(history) {
  const monthlyMap = {};
  const monthOrder = {};

  history.forEach((record) => {
    let monthKey = "";
    let sortKey = "";

    if (record.date) {
      const dateObj = new Date(record.date);
      const month = dateObj.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      monthKey = month;
      sortKey = dateObj.getFullYear() * 12 + dateObj.getMonth();
    } else if (record.period) {
      monthKey = record.period;
      sortKey = record.period;
    } else {
      monthKey = "Unknown";
      sortKey = "Unknown";
    }

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        consumption: [],
        liters: [],
        sortKey: sortKey,
      };
    }

    monthlyMap[monthKey].consumption.push(record.consumptionValue);
    monthlyMap[monthKey].liters.push(record.liters);
  });

  // Sort months chronologically
  const months = Object.keys(monthlyMap).sort((a, b) => {
    const sortKeyA = monthlyMap[a].sortKey;
    const sortKeyB = monthlyMap[b].sortKey;
    if (typeof sortKeyA === "number" && typeof sortKeyB === "number") {
      return sortKeyA - sortKeyB;
    }
    return 0;
  });

  const avgConsumption = months.map((month) => {
    const consumptionValues = monthlyMap[month].consumption;
    const avg =
      consumptionValues.reduce((a, b) => a + b, 0) / consumptionValues.length;
    return parseFloat(avg.toFixed(2));
  });

  const totalLiters = months.map((month) => {
    return monthlyMap[month].liters.reduce((a, b) => a + b, 0);
  });

  return {
    months,
    avgConsumption,
    totalLiters,
  };
}

function aggregateByEquipment(history) {
  const equipmentMap = {};

  history.forEach((record) => {
    const equipment = record.equipment || "Unknown";
    if (!equipmentMap[equipment]) {
      equipmentMap[equipment] = 0;
    }
    equipmentMap[equipment] += record.liters;
  });

  const labels = Object.keys(equipmentMap);
  const liters = Object.values(equipmentMap).map((l) =>
    parseFloat(l.toFixed(2)),
  );

  return {
    labels,
    liters,
  };
}

function aggregateByOperator(history) {
  const operatorMap = {};

  history.forEach((record) => {
    const operator = record.operator || "Unknown";
    if (!operatorMap[operator]) {
      operatorMap[operator] = 0;
    }
    operatorMap[operator] += record.liters;
  });

  // Sort by liters descending
  const sorted = Object.entries(operatorMap).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map((item) => item[0]);
  const liters = sorted.map((item) => parseFloat(item[1].toFixed(2)));

  return {
    labels,
    liters,
  };
}

async function exportData() {
  const history = await db.getAllFuelEntries();

  if (history.length === 0) {
    Swal.fire({
      icon: "info",
      title: "No Data",
      text: "Add fuel entries before exporting",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  let csv =
    "Site,Period,Date,Operator,Equipment,Start Time,End Time,Hours,Distance (km),Liters,Consumption,Timestamp\n";

  history.forEach((record) => {
    const distance =
      record.distance && record.distance > 0 ? record.distance : "-";
    const periodDisplay = record.period
      ? new Date(record.period + "-01").toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "-";
    csv += `${record.site || "-"},${periodDisplay},${record.date || "-"},${record.operator},${record.equipment},${record.startTime},${record.endTime},${record.totalHours},${distance},${record.liters},${record.consumption},${record.timestamp}\n`;
  });

  const blob = new Blob([csv], {
    type: "text/csv",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fuel-consumption-report.csv";
  a.click();

  Swal.fire("Exported!", "Data has been exported to CSV", "success");
}

async function exportFilteredDataXLSX() {
  const filteredHistory = await getFilteredHistory();

  if (filteredHistory.length === 0) {
    Swal.fire({
      icon: "info",
      title: "No Data",
      text: "No entries found for the selected date range",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Fuel Consumption");

  // Set column widths
  worksheet.columns = [
    {
      width: 15,
    }, // Site
    {
      width: 18,
    }, // Period
    {
      width: 14,
    }, // Date
    {
      width: 16,
    }, // Operator
    {
      width: 14,
    }, // Equipment
    {
      width: 12,
    }, // Start Time
    {
      width: 12,
    }, // End Time
    {
      width: 10,
    }, // Hours
    {
      width: 14,
    }, // Distance
    {
      width: 10,
    }, // Liters
    {
      width: 20,
    }, // Consumption
    {
      width: 16,
    }, // Timestamp
  ];

  // Define styles
  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFF54927",
    },
  };
  const headerFont = {
    bold: true,
    color: {
      argb: "FFFFFFFF",
    },
    size: 12,
  };
  const headerAlignment = {
    horizontal: "center",
    vertical: "center",
    wrapText: true,
  };
  const headerBorder = {
    top: {
      style: "thin",
      color: {
        argb: "FF000000",
      },
    },
    bottom: {
      style: "thin",
      color: {
        argb: "FF000000",
      },
    },
    left: {
      style: "thin",
      color: {
        argb: "FF000000",
      },
    },
    right: {
      style: "thin",
      color: {
        argb: "FF000000",
      },
    },
  };

  const dataFont = {
    size: 10,
  };
  const dataAlignment = {
    horizontal: "left",
    vertical: "center",
    wrapText: true,
  };
  const dataBorder = {
    top: {
      style: "thin",
      color: {
        argb: "FFCCCCCC",
      },
    },
    bottom: {
      style: "thin",
      color: {
        argb: "FFCCCCCC",
      },
    },
    left: {
      style: "thin",
      color: {
        argb: "FFCCCCCC",
      },
    },
    right: {
      style: "thin",
      color: {
        argb: "FFCCCCCC",
      },
    },
  };

  const alternateFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFFEF5F5",
    },
  };

  // Add header row
  const headers = [
    "Site",
    "Period",
    "Date",
    "Operator",
    "Equipment",
    "Start Time",
    "End Time",
    "Hours",
    "Distance (km)",
    "Liters",
    "Consumption",
    "Timestamp",
  ];
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = headerAlignment;
    cell.border = headerBorder;
  });

  // Add data rows
  filteredHistory.forEach((record, index) => {
    const distance =
      record.distance && record.distance > 0 ? record.distance : "-";
    const periodDisplay = record.period
      ? new Date(record.period + "-01").toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "-";

    const dataRow = worksheet.addRow([
      record.site || "-",
      periodDisplay,
      record.date || "-",
      record.operator || "-",
      record.equipment || "-",
      record.startTime || "-",
      record.endTime || "-",
      record.totalHours || "-",
      distance,
      record.liters || "-",
      record.consumption || "-",
      record.timestamp || "-",
    ]);

    dataRow.eachCell((cell) => {
      cell.font = dataFont;
      cell.alignment = dataAlignment;
      cell.border = dataBorder;
      if (index % 2 === 0) {
        cell.fill = alternateFill;
      }
    });
  });

  // Calculate totals for filtered data
  const totalHours = filteredHistory.reduce(
    (sum, record) => sum + parseFloat(record.totalHours || 0),
    0,
  );
  const totalLiters = filteredHistory.reduce(
    (sum, record) => sum + parseFloat(record.liters || 0),
    0,
  );
  const avgConsumption =
    totalLiters > 0 && totalHours > 0
      ? (totalLiters / totalHours).toFixed(2)
      : "0.00";

  // Add totals row
  const totalsRow = worksheet.addRow([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "TOTALS:",
    `Hours: ${totalHours.toFixed(2)}`,
    totalLiters.toFixed(2),
    `Consumption: ${avgConsumption}`,
    "",
  ]);
  totalsRow.eachCell((cell, colNumber) => {
    cell.font = {
      bold: true,
      size: 10,
      color: {
        argb: "FFFFFFFF",
      },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF333333",
      },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "center",
    };
    cell.border = {
      top: {
        style: "medium",
        color: {
          argb: "FFF54927",
        },
      },
      bottom: {
        style: "medium",
        color: {
          argb: "FFF54927",
        },
      },
      left: {
        style: "thin",
        color: {
          argb: "FF333333",
        },
      },
      right: {
        style: "thin",
        color: {
          argb: "FF333333",
        },
      },
    };
  });

  // Add signature section
  worksheet.addRow([]);

  // Signature section row
  const signatureRow = worksheet.addRow([
    "PREPARED BY NAMES",
    "SIGN",
    "DATE",
    "",
    "REVIEWED BY NAMES",
    "SIGN",
    "DATE",
  ]);
  signatureRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      size: 10,
      color: {
        argb: "FFFFFFFF",
      },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFF54927",
      },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "center",
    };
    cell.border = {
      top: {
        style: "thin",
        color: {
          argb: "FFF54927",
        },
      },
      bottom: {
        style: "thin",
        color: {
          argb: "FFF54927",
        },
      },
      left: {
        style: "thin",
        color: {
          argb: "FFF54927",
        },
      },
      right: {
        style: "thin",
        color: {
          argb: "FFF54927",
        },
      },
    };
  });

  // Add empty signature lines
  const preparedRow = worksheet.addRow(["", "", "", "", "", "", ""]);
  preparedRow.eachCell((cell) => {
    cell.border = {
      bottom: {
        style: "thin",
        color: {
          argb: "FF000000",
        },
      },
    };
  });

  const preparedRow2 = worksheet.addRow(["", "", "", "", "", "", ""]);
  preparedRow2.eachCell((cell) => {
    cell.border = {
      bottom: {
        style: "thin",
        color: {
          argb: "FF000000",
        },
      },
    };
  });

  // Generate filename
  let filename = "fuel-consumption-report";
  if (dateFilterFromDate && dateFilterToDate) {
    const fromStr = dateFilterFromDate.toISOString().split("T")[0];
    const toStr = dateFilterToDate.toISOString().split("T")[0];
    filename = `fuel-consumption-report_${fromStr}_to_${toStr}`;
  }

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename + ".xlsx");

  Swal.fire(
    "Exported!",
    `${filteredHistory.length} record${filteredHistory.length !== 1 ? "s" : ""} exported to Excel`,
    "success",
  );
}

async function exportFilteredDataPDF() {
  const filteredHistory = await getFilteredHistory();

  if (filteredHistory.length === 0) {
    Swal.fire({
      icon: "info",
      title: "No Data",
      text: "No entries found for the selected date range",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  // Get theme colors
  const colors = getThemeColors();

  // Build table rows
  let tableRows = "";
  let totalHours = 0;
  let totalLiters = 0;

  filteredHistory.forEach((record, index) => {
    totalHours += parseFloat(record.totalHours || 0);
    totalLiters += parseFloat(record.liters || 0);
    const distance =
      record.distance && record.distance > 0 ? record.distance : "-";
    const periodDisplay = record.period
      ? new Date(record.period + "-01").toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "-";

    tableRows += `
             <tr>
                  <td>${index + 1}</td>
                  <td>${record.site || "-"}</td>
                  <td>${periodDisplay}</td>
                  <td style="white-space: nowrap;">${record.date || "-"}</td>
                  <td>${record.operator || "-"}</td>
                  <td>${record.equipment || "-"}</td>
                  <td>${record.startTime || "-"}</td>
                  <td>${record.endTime || "-"}</td>
                  <td>${record.totalHours || "0"}</td>
                  <td>${distance}</td>
                  <td>${record.liters || "0"}</td>
                  <td>${record.consumption || "-"}</td>
              </tr>
          `;
  });

  const avgConsumption =
    totalLiters > 0 && totalHours > 0
      ? (totalLiters / totalHours).toFixed(2)
      : "0.00";

  // Create PDF content with theme colors
  const pdfContent = `
         <div style="background: white; color: ${colors.textPrimary}; padding: 40px; font-family: Arial, sans-serif;">
             <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid ${colors.primaryColor}; padding-bottom: 20px;">
                 <h1 style="margin: 0; color: ${colors.primaryColor}; font-size: 28px;">⛽ FUEL CONSUMPTION REPORT</h1>
                 <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
                     ${dateFilterFromDate && dateFilterToDate ? `Period: ${dateFilterFromDate.toISOString().split("T")[0]} to ${dateFilterToDate.toISOString().split("T")[0]}` : ""}
                 </p>
             </div>

             <div style="display: flex; justify-content: space-around; margin-bottom: 30px; gap: 20px;">
                 <div style="flex: 1; background: rgba(245, 73, 39, 0.08); padding: 15px; border-radius: 8px; border-left: 4px solid ${colors.primaryColor};">
                     <div style="color: ${colors.textSecondary}; font-size: 12px; margin-bottom: 5px;">Total Records</div>
                     <div style="color: ${colors.primaryColor}; font-size: 24px; font-weight: bold;">${filteredHistory.length}</div>
                 </div>
                 <div style="flex: 1; background: rgba(245, 73, 39, 0.08); padding: 15px; border-radius: 8px; border-left: 4px solid ${colors.primaryColor};">
                     <div style="color: ${colors.textSecondary}; font-size: 12px; margin-bottom: 5px;">Total Hours</div>
                     <div style="color: ${colors.primaryColor}; font-size: 24px; font-weight: bold;">${totalHours.toFixed(2)}</div>
                 </div>
                 <div style="flex: 1; background: rgba(245, 73, 39, 0.08); padding: 15px; border-radius: 8px; border-left: 4px solid ${colors.primaryColor};">
                     <div style="color: ${colors.textSecondary}; font-size: 12px; margin-bottom: 5px;">Total Liters</div>
                     <div style="color: ${colors.primaryColor}; font-size: 24px; font-weight: bold;">${totalLiters.toFixed(2)}</div>
                 </div>
                 <div style="flex: 1; background: rgba(245, 73, 39, 0.08); padding: 15px; border-radius: 8px; border-left: 4px solid ${colors.primaryColor};">
                     <div style="color: ${colors.textSecondary}; font-size: 12px; margin-bottom: 5px;">Avg Consumption (L/h)</div>
                     <div style="color: ${colors.primaryColor}; font-size: 24px; font-weight: bold;">${avgConsumption}</div>
                 </div>
             </div>

             <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; color: ${colors.textPrimary};">
                 <thead>
                     <tr>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">No.</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">Site</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">Period</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px; white-space: nowrap;">Date</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">Operator</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">Equipment</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">Start</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">End</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">Hours</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">Distance</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">Liters</th>
                         <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 11px;">Consumption</th>
                     </tr>
                 </thead>
                 <tbody>
                     ${tableRows}
                     <tr style="font-weight: bold; background: ${colors.primaryColor}; color: white;">
                         <td colspan="8" style="padding: 12px; border: 1px solid ${colors.borderColor}; text-align: right;">TOTALS:</td>
                         <td style="padding: 12px; border: 1px solid ${colors.borderColor}; text-align: center;"><strong>Hours:</strong> ${totalHours.toFixed(2)}</td>
                         <td style="padding: 12px; border: 1px solid ${colors.borderColor}; text-align: center;">-</td>
                         <td style="padding: 12px; border: 1px solid ${colors.borderColor}; text-align: center;">${totalLiters.toFixed(2)}</td>
                         <td style="padding: 12px; border: 1px solid ${colors.borderColor}; text-align: center;"><strong>Consumption:</strong> ${avgConsumption}</td>
                     </tr>
                 </tbody>
             </table>

             <div style="margin-top: 50px; color: ${colors.textPrimary};">
                 <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                     <thead>
                         <tr>
                             <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 12px; width: 23%;">PREPARED BY NAMES</th>
                             <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 12px; width: 23%;">SIGN</th>
                             <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 12px; width: 23%;">DATE</th>
                             <th style="background: white; border: none;"></th>
                             <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 12px; width: 23%;">REVIEWED BY NAMES</th>
                             <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 12px; width: 23%;">SIGN</th>
                             <th style="background: ${colors.primaryColor}; color: white; padding: 12px; text-align: center; border: 1px solid ${colors.borderColor}; font-weight: bold; font-size: 12px; width: 23%;">DATE</th>
                         </tr>
                     </thead>
                     <tbody>
                         <tr>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                             <td style="background: white; border: none;"></td>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                         </tr>
                         <tr>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                             <td style="background: white; border: none;"></td>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                             <td style="padding: 30px; border: 1px solid ${colors.borderColor}; height: 50px;"></td>
                         </tr>
                     </tbody>
                 </table>
             </div>
         </div>
     `;

  // Insert into hidden container
  const pdfContainer = document.getElementById("pdfContent");
  pdfContainer.innerHTML = pdfContent;

  // Generate PDF
  const element = pdfContainer.firstElementChild;
  const opt = {
    margin: 10,
    filename:
      dateFilterFromDate && dateFilterToDate
        ? `fuel-consumption-report_${dateFilterFromDate.toISOString().split("T")[0]}_to_${dateFilterToDate.toISOString().split("T")[0]}.pdf`
        : "fuel-consumption-report.pdf",
    image: {
      type: "jpeg",
      quality: 0.98,
    },
    html2canvas: {
      scale: 2,
    },
    jsPDF: {
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    },
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      Swal.fire({
        icon: "success",
        title: "PDF Generated",
        text: `${filteredHistory.length} record${filteredHistory.length !== 1 ? "s" : ""} exported successfully!`,
      });
    });
}

// Custom Time Picker - User Friendly
function initTimepicker() {
  document
    .querySelectorAll(".timepicker:not(.timepicker-initialized)")
    .forEach((element) => {
      element.classList.add("timepicker-initialized");

      // Create wrapper
      const wrapper = document.createElement("div");
      wrapper.className = "timepicker-wrapper";
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);

      // Create picker container (hidden by default)
      const picker = document.createElement("div");
      picker.className = "timepicker-picker";
      picker.style.display = "none";

      // Generate hour and minute options
      let hourOptions = "";
      for (let i = 0; i < 24; i++) {
        hourOptions += `<option value="${String(i).padStart(2, "0")}">${String(i).padStart(2, "0")}</option>`;
      }

      let minuteOptions = "";
      for (let i = 0; i < 60; i++) {
        minuteOptions += `<option value="${String(i).padStart(2, "0")}">${String(i).padStart(2, "0")}</option>`;
      }

      picker.innerHTML = `
            <div class="time-display">
                <div class="time-value" id="timeDisplay">00:00</div>
            </div>
            <div class="time-selectors">
                <div class="time-group">
                    <label>Hour</label>
                    <select class="time-hour form-select" size="5">
                        ${hourOptions}
                    </select>
                </div>
                <div class="time-separator-label">:</div>
                <div class="time-group">
                    <label>Minute</label>
                    <select class="time-minute form-select" size="5">
                        ${minuteOptions}
                    </select>
                </div>
            </div>
            <div class="time-buttons">
                <button type="button" class="btn btn-sm btn-primary time-ok">Set Time</button>
                <button type="button" class="btn btn-sm btn-secondary time-cancel">Cancel</button>
            </div>
        `;
      wrapper.appendChild(picker);

      const hourSelect = picker.querySelector(".time-hour");
      const minuteSelect = picker.querySelector(".time-minute");
      const timeDisplay = picker.querySelector("#timeDisplay");

      // Update display when selects change
      const updateDisplay = () => {
        timeDisplay.textContent = `${hourSelect.value}:${minuteSelect.value}`;
      };

      hourSelect.addEventListener("change", updateDisplay);
      minuteSelect.addEventListener("change", updateDisplay);

      // Click handler for input
      element.addEventListener("click", () => {
        picker.style.display = "block";
        const [hour, minute] = (element.value || "00:00").split(":");
        hourSelect.value = String(parseInt(hour) || 0).padStart(2, "0");
        minuteSelect.value = String(parseInt(minute) || 0).padStart(2, "0");
        updateDisplay();
      });

      // OK button
      picker.querySelector(".time-ok").addEventListener("click", () => {
        element.value = `${hourSelect.value}:${minuteSelect.value}`;
        picker.style.display = "none";
        element.dispatchEvent(new Event("change"));
      });

      // Cancel button
      picker.querySelector(".time-cancel").addEventListener("click", () => {
        picker.style.display = "none";
      });

      // Close when clicking outside
      document.addEventListener("click", (e) => {
        if (!wrapper.contains(e.target)) {
          picker.style.display = "none";
        }
      });
    });
}

// Initialize Select2
function initSelect2() {
  if (typeof $ !== "undefined" && $.fn.select2) {
    try {
      const baseOptions = {
        width: "100%",
        allowClear: true,
        dropdownAutoWidth: true,
      };

      // Initialize operator select (in modal)
      if (jQuery("#operator").length) {
        jQuery("#operator").select2({
          ...baseOptions,
          dropdownParent: jQuery("#newEntryModal"),
        });
      }

      // Initialize equipment select (in modal)
      if (jQuery("#equipment").length) {
        jQuery("#equipment").select2({
          ...baseOptions,
          dropdownParent: jQuery("#newEntryModal"),
        });
      }

      // Initialize edit equipment select (in edit modal)
      if (jQuery("#editEquipment").length) {
        jQuery("#editEquipment").select2({
          ...baseOptions,
          dropdownParent: jQuery("#editModal"),
        });
      }
    } catch (e) {
      console.error("Select2 initialization error:", e);
    }
  } else {
    console.warn("jQuery or Select2 not loaded");
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  displayHistory();
  updateStats();

  // Initialize date pickers, time pickers and Select2 after a short delay to ensure all elements are ready
  setTimeout(() => {
    initTimepicker();
    initFlatpickr();
    initSelect2();
  }, 500);
});

// Allow Enter key to submit
document.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && e.target.closest("#fuelForm")) {
    calculateConsumption();
  }
});

// Generate Excel Report with Professional Formatting
async function generateExcelReport() {
  // Get history data
  const history = await db.getAllFuelEntries();

  // Validation
  if (history.length === 0) {
    Swal.fire({
      icon: "error",
      title: "No Data",
      text: "Please add fuel entries before generating a report",
    });
    return;
  }

  // Get site and period from the first entry
  const firstEntry = history[0];
  const site = firstEntry.site || "N/A";
  const period = firstEntry.period || "N/A";

  // Calculate totals
  const totalHours = history.reduce(
    (sum, record) => sum + parseFloat(record.totalHours || 0),
    0,
  );
  const totalLiters = history.reduce(
    (sum, record) => sum + parseFloat(record.liters || 0),
    0,
  );
  const avgConsumption =
    totalLiters > 0 && totalHours > 0
      ? (totalLiters / totalHours).toFixed(2)
      : "0.00";

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Fuel Report");

  // Set column widths
  worksheet.columns = [
    {
      width: 5,
    }, // No.
    {
      width: 20,
    }, // Operator
    {
      width: 15,
    }, // Equipment
    {
      width: 12,
    }, // Start Time
    {
      width: 12,
    }, // End Time
    {
      width: 10,
    }, // Hours
    {
      width: 10,
    }, // Liters
    {
      width: 18,
    }, // Consumption
  ];

  // Define styles
  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFF54927",
    },
  };
  const headerFont = {
    bold: true,
    color: {
      argb: "FFFFFFFF",
    },
    size: 11,
    name: "Calibri",
  };
  const headerAlignment = {
    horizontal: "center",
    vertical: "center",
    wrapText: true,
  };
  const headerBorder = {
    top: {
      style: "thin",
      color: {
        argb: "FFF54927",
      },
    },
    bottom: {
      style: "thin",
      color: {
        argb: "FFF54927",
      },
    },
    left: {
      style: "thin",
      color: {
        argb: "FFF54927",
      },
    },
    right: {
      style: "thin",
      color: {
        argb: "FFF54927",
      },
    },
  };

  const titleFont = {
    bold: true,
    size: 14,
    color: {
      argb: "FFF54927",
    },
    name: "Calibri",
  };
  const infoFont = {
    size: 10,
    color: {
      argb: "FF000000",
    },
    name: "Calibri",
  };
  const dataFont = {
    size: 10,
    color: {
      argb: "FF000000",
    },
    name: "Calibri",
  };
  const dataBorder = {
    top: {
      style: "thin",
      color: {
        argb: "FFE0E0E0",
      },
    },
    bottom: {
      style: "thin",
      color: {
        argb: "FFE0E0E0",
      },
    },
    left: {
      style: "thin",
      color: {
        argb: "FFE0E0E0",
      },
    },
    right: {
      style: "thin",
      color: {
        argb: "FFE0E0E0",
      },
    },
  };
  const dataFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFFAFAFA",
    },
  };
  const dataAlignment = {
    horizontal: "center",
    vertical: "center",
  };

  const totalsFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF333333",
    },
  };
  const totalsFont = {
    bold: true,
    size: 10,
    color: {
      argb: "FFFFFFFF",
    },
    name: "Calibri",
  };
  const totalsBorder = {
    top: {
      style: "medium",
      color: {
        argb: "FFF54927",
      },
    },
    bottom: {
      style: "medium",
      color: {
        argb: "FFF54927",
      },
    },
    left: {
      style: "medium",
      color: {
        argb: "FF333333",
      },
    },
    right: {
      style: "medium",
      color: {
        argb: "FF333333",
      },
    },
  };

  // Title row
  const titleRow = worksheet.addRow(["FUEL CONSUMPTION REPORT"]);
  titleRow.getCell(1).font = titleFont;
  titleRow.getCell(1).alignment = {
    horizontal: "left",
    vertical: "center",
  };

  // Info rows
  worksheet.addRow(["Site:", site]).getCell(1).font = infoFont;
  worksheet.addRow(["Period:", period]).getCell(1).font = infoFont;
  worksheet
    .addRow(["Generated:", new Date().toLocaleString()])
    .getCell(1).font = infoFont;
  worksheet.addRow([]);

  // Header row
  const headerRow = worksheet.addRow([
    "No.",
    "Operator",
    "Equipment",
    "Start Time",
    "End Time",
    "Hours",
    "Liters",
    "Consumption (L/h)",
  ]);
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = headerAlignment;
    cell.border = headerBorder;
  });

  // Data rows
  history.forEach((record, index) => {
    const dataRow = worksheet.addRow([
      index + 1,
      record.operator || "-",
      record.equipment || "-",
      record.startTime || "-",
      record.endTime || "-",
      record.totalHours || 0,
      record.liters || 0,
      record.consumption || 0,
    ]);
    dataRow.eachCell((cell) => {
      cell.font = dataFont;
      cell.alignment = dataAlignment;
      cell.border = dataBorder;
      cell.fill = dataFill;
    });
  });

  // Totals row
  const totalsRow = worksheet.addRow([
    "",
    "",
    "",
    "",
    "TOTALS:",
    totalHours.toFixed(2),
    totalLiters.toFixed(2),
    avgConsumption,
  ]);
  totalsRow.eachCell((cell) => {
    cell.fill = totalsFill;
    cell.font = totalsFont;
    cell.alignment = {
      horizontal: "center",
      vertical: "center",
    };
    cell.border = totalsBorder;
  });

  // Signature sections
  worksheet.addRow([]);

  // Signature section row
  const signatureRow = worksheet.addRow([
    "PREPARED BY NAMES",
    "SIGN",
    "DATE",
    "",
    "REVIEWED BY NAMES",
    "SIGN",
    "DATE",
  ]);
  signatureRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      size: 10,
      color: {
        argb: "FFFFFFFF",
      },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFF54927",
      },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "center",
    };
    cell.border = {
      top: {
        style: "thin",
        color: {
          argb: "FFF54927",
        },
      },
      bottom: {
        style: "thin",
        color: {
          argb: "FFF54927",
        },
      },
      left: {
        style: "thin",
        color: {
          argb: "FFF54927",
        },
      },
      right: {
        style: "thin",
        color: {
          argb: "FFF54927",
        },
      },
    };
  });

  // Add empty signature lines
  const preparedRow = worksheet.addRow(["", "", "", "", "", "", ""]);
  preparedRow.eachCell((cell) => {
    cell.border = {
      bottom: {
        style: "thin",
        color: {
          argb: "FF000000",
        },
      },
    };
  });

  const preparedRow2 = worksheet.addRow(["", "", "", "", "", "", ""]);
  preparedRow2.eachCell((cell) => {
    cell.border = {
      bottom: {
        style: "thin",
        color: {
          argb: "FF000000",
        },
      },
    };
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Fuel_Report_${site}_${period}.xlsx`);

  closeExportPanel();

  Swal.fire({
    icon: "success",
    title: "Excel Generated",
    text: "Your report has been downloaded successfully!",
  });
}

// Generate PDF Report
async function generatePDFReport() {
  // Get history data
  const history = await db.getAllFuelEntries();

  // Validation
  if (history.length === 0) {
    Swal.fire({
      icon: "error",
      title: "No Data",
      text: "Please add fuel entries before generating a report",
    });
    return;
  }

  // Get theme colors
  const colors = getThemeColors();

  // Get site and period from the first entry (they should be the same for all entries)
  const firstEntry = history[0];
  const site = firstEntry.site || "N/A";
  const period = firstEntry.period || "N/A";

  // Build table rows
  let tableRows = "";
  history.forEach((record, index) => {
    tableRows += `
            <tr>
                <td>${index + 1}</td>
                <td>${record.operator || "-"}</td>
                <td>${record.equipment || "-"}</td>
                <td>${record.startTime || "-"}</td>
                <td>${record.endTime || "-"}</td>
                <td>${record.totalHours || "0"}</td>
                <td>${record.liters || "0"}</td>
                <td>${record.consumption || "0"}</td>
            </tr>
        `;
  });

  // Calculate totals
  const totalHours = history.reduce(
    (sum, record) => sum + parseFloat(record.totalHours || 0),
    0,
  );
  const totalLiters = history.reduce(
    (sum, record) => sum + parseFloat(record.liters || 0),
    0,
  );
  const avgConsumption =
    totalLiters > 0 && totalHours > 0
      ? (totalLiters / totalHours).toFixed(2)
      : "0.00";

  // Create PDF content
  const pdfContent = `
        <div style="background: white; color: ${colors.textPrimary}; padding: 40px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid ${colors.primaryColor}; padding-bottom: 20px;">
                <h1 style="margin: 0; color: ${colors.primaryColor}; font-size: 28px;">⛽ FUEL CONSUMPTION REPORT</h1>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
                <div style="flex: 1;">
                    <strong style="color: ${colors.textPrimary};">Site:</strong>
                    <span style="color: ${colors.textSecondary};">${site}</span>
                </div>
                <div style="flex: 1;">
                    <strong style="color: ${colors.textPrimary};">Period:</strong>
                    <span style="color: ${colors.textSecondary};">${period}</span>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; color: ${colors.textPrimary};">
                <thead>
                    <tr>
                        <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">No.</th>
                        <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Operator</th>
                        <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Equipment</th>
                        <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Start Time</th>
                        <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">End Time</th>
                        <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Hours</th>
                        <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Liters</th>
                        <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Consumption (L/h)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                    <tr style="font-weight: bold; background: ${colors.primaryColor}; color: white;">
                        <td colspan="5" style="padding: 10px; border: 1px solid ${colors.borderColor}; text-align: right;">TOTALS:</td>
                        <td style="padding: 10px; border: 1px solid ${colors.borderColor};">${totalHours.toFixed(2)}</td>
                        <td style="padding: 10px; border: 1px solid ${colors.borderColor};">${totalLiters.toFixed(2)}</td>
                        <td style="padding: 10px; border: 1px solid ${colors.borderColor};">${avgConsumption}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 50px; display: flex; justify-content: space-between; color: #333;">
                <div style="flex: 1; text-align: center; padding: 0 20px;">
                    <strong style="font-weight: bold; display: block; font-size: 13px; margin-bottom: 10px;">PREPARED BY</strong>
                    
                    <div style="font-size: 12px; color: #555; margin-bottom: 25px;">
                        <span style="display: block; margin-bottom: 5px;">Name:</span>
                        <div style="border-bottom: 1px solid #333; height: 20px;"></div>
                    </div>
                    
                    <div style="font-size: 12px; color: #555; margin-bottom: 25px;">
                        <span style="display: block; margin-bottom: 5px;">Signature:</span>
                        <div style="border-bottom: 1px solid #333; height: 30px;"></div>
                    </div>
                    
                    <div style="font-size: 12px; color: #555;">
                        <span style="display: block; margin-bottom: 5px;">Date:</span>
                        <div style="border-bottom: 1px solid #333; height: 20px;"></div>
                    </div>
                </div>
                
                <div style="flex: 1; text-align: center; padding: 0 20px;">
                    <strong style="font-weight: bold; display: block; font-size: 13px; margin-bottom: 10px;">REVIEWED BY</strong>
                    
                    <div style="font-size: 12px; color: #555; margin-bottom: 25px;">
                        <span style="display: block; margin-bottom: 5px;">Name:</span>
                        <div style="border-bottom: 1px solid #333; height: 20px;"></div>
                    </div>
                    
                    <div style="font-size: 12px; color: #555; margin-bottom: 25px;">
                        <span style="display: block; margin-bottom: 5px;">Signature:</span>
                        <div style="border-bottom: 1px solid #333; height: 30px;"></div>
                    </div>
                    
                    <div style="font-size: 12px; color: #555;">
                        <span style="display: block; margin-bottom: 5px;">Date:</span>
                        <div style="border-bottom: 1px solid #333; height: 20px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Insert into hidden container
  const pdfContainer = document.getElementById("pdfContent");
  pdfContainer.innerHTML = pdfContent;

  // Generate PDF
  const element = pdfContainer.firstElementChild;
  const opt = {
    margin: 10,
    filename: `Fuel_Report_${site}_${period}.pdf`,
    image: {
      type: "jpeg",
      quality: 0.98,
    },
    html2canvas: {
      scale: 2,
    },
    jsPDF: {
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    },
  };

  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      closeExportPanel();
      Swal.fire({
        icon: "success",
        title: "PDF Generated",
        text: "Your report has been downloaded successfully!",
      });
    });
}

// Share PDF Report
async function sharePDFReport() {
  try {
    // Get history data
    const history = await db.getAllFuelEntries();

    // Validation
    if (history.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No Data",
        text: "Please add fuel entries before generating a report",
      });
      return;
    }

    // Get theme colors
    const colors = getThemeColors();

    // Get site and period from the first entry
    const firstEntry = history[0];
    const site = firstEntry.site || "N/A";
    const period = firstEntry.period || "N/A";

    // Build table rows
    let tableRows = "";
    history.forEach((record, index) => {
      tableRows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${record.operator || "-"}</td>
                    <td>${record.equipment || "-"}</td>
                    <td>${record.startTime || "-"}</td>
                    <td>${record.endTime || "-"}</td>
                    <td>${record.totalHours || "0"}</td>
                    <td>${record.liters || "0"}</td>
                    <td>${record.consumption || "0"}</td>
                </tr>
            `;
    });

    // Calculate totals
    const totalHours = history.reduce(
      (sum, record) => sum + parseFloat(record.totalHours || 0),
      0,
    );
    const totalLiters = history.reduce(
      (sum, record) => sum + parseFloat(record.liters || 0),
      0,
    );
    const avgConsumption =
      totalLiters > 0 && totalHours > 0
        ? (totalLiters / totalHours).toFixed(2)
        : "0.00";

    // Create PDF content
    const pdfContent = `
            <div style="background: white; color: ${colors.textPrimary}; padding: 40px; font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid ${colors.primaryColor}; padding-bottom: 20px;">
                    <h1 style="margin: 0; color: ${colors.primaryColor}; font-size: 28px;">⛽ FUEL CONSUMPTION REPORT</h1>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
                    <div style="flex: 1;">
                        <strong style="color: ${colors.textPrimary};">Site:</strong>
                        <span style="color: ${colors.textSecondary};">${site}</span>
                    </div>
                    <div style="flex: 1;">
                        <strong style="color: ${colors.textPrimary};">Period:</strong>
                        <span style="color: ${colors.textSecondary};">${period}</span>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; color: ${colors.textPrimary};">
                    <thead>
                        <tr>
                            <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">No.</th>
                            <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Operator</th>
                            <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Equipment</th>
                            <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Start Time</th>
                            <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">End Time</th>
                            <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Hours</th>
                            <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Liters</th>
                            <th style="background: ${colors.primaryColor}; color: white; padding: 10px; text-align: left; border: 1px solid ${colors.borderColor}; font-weight: bold;">Consumption (L/h)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                        <tr style="font-weight: bold; background: ${colors.primaryColor}; color: white;">
                            <td colspan="5" style="padding: 10px; border: 1px solid ${colors.borderColor}; text-align: right;">TOTALS:</td>
                            <td style="padding: 10px; border: 1px solid ${colors.borderColor};">${totalHours.toFixed(2)}</td>
                            <td style="padding: 10px; border: 1px solid ${colors.borderColor};">${totalLiters.toFixed(2)}</td>
                            <td style="padding: 10px; border: 1px solid ${colors.borderColor};">${avgConsumption}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

    // Insert into hidden container
    const pdfContainer = document.getElementById("pdfContent");
    pdfContainer.innerHTML = pdfContent;

    // Generate PDF
    const element = pdfContainer.firstElementChild;
    const filename = `Fuel_Report_${site}_${period}.pdf`;

    const opt = {
      margin: 10,
      filename: filename,
      image: {
        type: "jpeg",
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
      },
      jsPDF: {
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // Try to share using Web Share API
        if (navigator.share) {
          Swal.fire({
            icon: "info",
            title: "Share Report",
            text: "Your PDF has been generated. Please use your device's share function to send it.",
          });
        } else {
          closeExportPanel();
          Swal.fire({
            icon: "success",
            title: "PDF Generated",
            text: "Your report has been downloaded. You can now share it using your preferred method.",
          });
        }
      });
  } catch (error) {
    console.error("Error sharing PDF:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to generate PDF report. Please try again.",
    });
  }
}

// Share Excel Report
async function shareExcelReport() {
  try {
    // Get history data
    const history = await db.getAllFuelEntries();

    // Validation
    if (history.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No Data",
        text: "Please add fuel entries before generating a report",
      });
      return;
    }

    // Get site and period from the first entry
    const firstEntry = history[0];
    const site = firstEntry.site || "N/A";
    const period = firstEntry.period || "N/A";

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Fuel Report");

    // Add title
    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "FUEL CONSUMPTION REPORT";
    titleCell.font = {
      bold: true,
      size: 16,
      color: {
        argb: "FFFF6B6B",
      },
    };
    titleCell.alignment = {
      horizontal: "center",
      vertical: "center",
    };
    worksheet.getRow(1).height = 25;

    // Add site and period info
    worksheet.mergeCells("A3:D3");
    worksheet.getCell("A3").value = `Site: ${site}`;
    worksheet.getCell("A3").font = {
      bold: true,
    };

    worksheet.mergeCells("E3:H3");
    worksheet.getCell("E3").value = `Period: ${period}`;
    worksheet.getCell("E3").font = {
      bold: true,
    };

    // Add headers
    const headers = [
      "No.",
      "Operator",
      "Equipment",
      "Start Time",
      "End Time",
      "Hours",
      "Liters",
      "Consumption (L/h)",
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = {
      bold: true,
      color: {
        argb: "FFFFFFFF",
      },
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFFF6B6B",
      },
    };

    // Add data rows
    let totalHours = 0;
    let totalLiters = 0;

    history.forEach((record, index) => {
      worksheet.addRow([
        index + 1,
        record.operator || "-",
        record.equipment || "-",
        record.startTime || "-",
        record.endTime || "-",
        parseFloat(record.totalHours || 0),
        parseFloat(record.liters || 0),
        parseFloat(record.consumption || 0),
      ]);

      totalHours += parseFloat(record.totalHours || 0);
      totalLiters += parseFloat(record.liters || 0);
    });

    const avgConsumption =
      totalLiters > 0 && totalHours > 0
        ? (totalLiters / totalHours).toFixed(2)
        : "0.00";

    // Add totals row
    const totalsRow = worksheet.addRow([
      "",
      "",
      "",
      "",
      "TOTALS:",
      totalHours.toFixed(2),
      totalLiters.toFixed(2),
      avgConsumption,
    ]);
    totalsRow.font = {
      bold: true,
      color: {
        argb: "FFFFFFFF",
      },
    };
    totalsRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFFF6B6B",
      },
    };

    // Set column widths
    worksheet.columns = [
      {
        width: 8,
      },
      {
        width: 15,
      },
      {
        width: 15,
      },
      {
        width: 15,
      },
      {
        width: 15,
      },
      {
        width: 12,
      },
      {
        width: 12,
      },
      {
        width: 18,
      },
    ];

    // Generate and download Excel file
    const filename = `Fuel_Report_${site}_${period}.xlsx`;
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, filename);

      closeExportPanel();
      Swal.fire({
        icon: "success",
        title: "Excel Generated",
        text: "Your report has been downloaded. You can now share it using your preferred method.",
      });
    });
  } catch (error) {
    console.error("Error sharing Excel:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to generate Excel report. Please try again.",
    });
  }
}

// Backup Data Function
async function backupData() {
  try {
    const backupData = await db.backup();

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], {
      type: "application/json",
    });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `fuel-backup-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    closeExportPanel();
    Swal.fire({
      icon: "success",
      title: "Backup Created",
      text: "Your data backup has been downloaded successfully!",
    });
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "Backup Failed",
      text: "Error creating backup: " + e.message,
    });
  }
}

// Restore Data Function
function restoreData(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const backupData = JSON.parse(e.target.result);

        // Validate backup structure
        if (!backupData.entries && !backupData.fuelHistory) {
          throw new Error("Invalid backup file format");
        }

        // Confirm before restoring
        Swal.fire({
          title: "Restore Data?",
          text: "This will replace all current data with the backup. Are you sure?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#F54927",
          cancelButtonColor: "#6c757d",
          confirmButtonText: "Yes, Restore",
        }).then(async (result) => {
          if (result.isConfirmed) {
            // Restore data using db.restore()
            const success = await db.restore(backupData);
            if (success) {
              // Reset file input
              document.getElementById("backupInput").value = "";
              closeExportPanel();

              Swal.fire({
                icon: "success",
                title: "Data Restored",
                text: "Your data has been restored successfully!",
              }).then(() => {
                location.reload();
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Restore Failed",
                text: "Failed to restore backup data",
              });
            }
          }
        });
      } catch (parseError) {
        Swal.fire({
          icon: "error",
          title: "Invalid Backup",
          text: "The backup file is corrupted or invalid",
        });
      }
    };
    reader.readAsText(file);
  } catch (e) {
    Swal.fire({
      icon: "error",
      title: "Restore Failed",
      text: "Error restoring backup: " + e.message,
    });
  }
}

// Google Sheets Sync Functions
async function authenticateGoogleSheets() {
  try {
    Swal.fire({
      title: "Authenticating...",
      text: "Redirecting to Google Sign In",
      icon: "info",
      allowOutsideClick: false,
      didOpen: async () => {
        Swal.showLoading();
        const result = await googleSheetsSync.authenticateWithGoogle();

        if (result.success) {
          // Ensure Google Drive folder exists for photos
          try {
            await googleDriveSync.ensureFolder();
            console.log('Google Drive folder created/verified');
          } catch (error) {
            console.warn('Could not ensure Drive folder:', error);
          }

          Swal.fire({
            title: "Success!",
            text: `Authenticated as ${result.email}`,
            icon: "success",
          });

          // Show spreadsheet options
          setTimeout(() => {
            showGoogleSheetsOptions();
          }, 500);
        } else {
          Swal.fire({
            title: "Authentication Failed",
            text: result.error,
            icon: "error",
          });
        }
      },
    });
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error",
    });
  }
}

async function showGoogleSheetsOptions() {
  const { value: option } = await Swal.fire({
    title: "Google Sheets Setup",
    html: `
            <div style="text-align: left;">
                <p style="margin-bottom: 15px;">Would you like to create a new spreadsheet or use an existing one?</p>
            </div>
        `,
    icon: "question",
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Create New",
    denyButtonText: "Use Existing",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#F54927",
  });

  if (option === true) {
    await createNewGoogleSheet();
  } else if (option === false) {
    await selectExistingGoogleSheet();
  }
}

async function createNewGoogleSheet() {
  try {
    Swal.fire({
      title: "Creating Spreadsheet...",
      text: "Please wait",
      icon: "info",
      allowOutsideClick: false,
      didOpen: async () => {
        Swal.showLoading();
        try {
          const spreadsheetId = await googleSheetsSync.createSpreadsheet(
            "Fleet Manager Fuel Data",
          );

          Swal.fire({
            title: "✅ Spreadsheet Created Successfully!",
            html: `
                            <div style="text-align: left; margin: 20px 0;">
                                <p style="margin-bottom: 15px;">Your new Google Sheet has been created and connected.</p>
                                
                                <div style="background: #f0f4ff; border-left: 4px solid #0066cc; padding: 12px; border-radius: 4px; margin-bottom: 15px;">
                                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #0066cc; font-size: 0.9em;">
                                        <i class="fas fa-exclamation-circle"></i> SAVE YOUR SHEET ID
                                    </p>
                                    <p style="margin: 0; color: #003d99; font-size: 0.85em; line-height: 1.4;">
                                        Copy your Sheet ID below and save it in a safe location (password manager, notes app, or cloud storage). You'll need it if you want to reconnect or use this sheet on another device.
                                    </p>
                                </div>
                                
                                <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 15px; word-break: break-all;">
                                    <p style="margin: 0 0 5px 0; font-size: 0.8em; color: #666; font-weight: 600;">Sheet ID:</p>
                                    <p style="margin: 0; font-family: monospace; font-size: 0.9em; color: #333; font-weight: 500; padding: 8px; background: white; border-radius: 3px; border: 1px solid #ccc;">${spreadsheetId}</p>
                                </div>
                            </div>
                        `,
            icon: "success",
            confirmButtonColor: "#F54927",
            confirmButtonText: "Got it, I've saved the ID",
            showDenyButton: true,
            denyButtonText: "Copy ID to Clipboard",
            denyButtonColor: "#6c757d",
            didOpen: async () => {
              // Store the ID temporarily for copying
              window.lastCreatedSheetId = spreadsheetId;
            },
          }).then((result) => {
            if (result.isDenied) {
              // Copy to clipboard
              navigator.clipboard
                .writeText(spreadsheetId)
                .then(() => {
                  Swal.fire({
                    title: "Copied!",
                    text: "Sheet ID has been copied to your clipboard",
                    icon: "success",
                    timer: 2000,
                  });
                })
                .catch(() => {
                  // Fallback for older browsers
                  const textarea = document.createElement("textarea");
                  textarea.value = spreadsheetId;
                  document.body.appendChild(textarea);
                  textarea.select();
                  document.execCommand("copy");
                  document.body.removeChild(textarea);
                  Swal.fire({
                    title: "Copied!",
                    text: "Sheet ID has been copied to your clipboard",
                    icon: "success",
                    timer: 2000,
                  });
                });
            }
          });

          // Start auto sync
          googleSheetsSync.startAutoSync();
          updateSyncStatus();
        } catch (error) {
          Swal.fire({
            title: "Error",
            text: error.message,
            icon: "error",
          });
        }
      },
    });
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error",
    });
  }
}

async function selectExistingGoogleSheet() {
  const { value: spreadsheetId } = await Swal.fire({
    title: "Enter Spreadsheet ID",
    input: "text",
    inputLabel: "Google Sheet ID",
    inputPlaceholder: "Paste the Spreadsheet ID from the URL",
    showCancelButton: true,
    confirmButtonText: "Connect",
    confirmButtonColor: "#F54927",
    inputValidator: (value) => {
      if (!value) {
        return "Please enter a Spreadsheet ID";
      }
    },
  });

  if (spreadsheetId) {
    try {
      googleSheetsSync.spreadsheetId = spreadsheetId;
      await db.setSetting("googleSheetsSpreadsheetId", spreadsheetId);

      Swal.fire({
        title: "Connected!",
        text: "Your spreadsheet has been connected",
        icon: "success",
      });

      googleSheetsSync.startAutoSync();
      updateSyncStatus();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
      });
    }
  }
}

async function manualSyncGoogleSheets() {
  if (!googleSheetsSync.isAuthenticated || !googleSheetsSync.spreadsheetId) {
    Swal.fire({
      title: "Not Connected",
      text: "Please authenticate and connect a Google Sheet first",
      icon: "warning",
    });
    return;
  }

  try {
    Swal.fire({
      title: "Syncing...",
      text: "Synchronizing data with Google Sheets",
      icon: "info",
      allowOutsideClick: false,
      didOpen: async () => {
        Swal.showLoading();
        try {
          const result = await googleSheetsSync.bidirectionalSync();

          Swal.fire({
            title: "Sync Complete!",
            html: `
                            <div style="text-align: left; font-size: 0.95em;">
                                <p><strong>Pulled from Google Sheets:</strong></p>
                                <ul style="margin: 5px 0 15px 20px;">
                                    <li>New Entries: ${result.pulled.newEntries}</li>
                                    <li>Updated Entries: ${result.pulled.updatedEntries}</li>
                                </ul>
                                <p><strong>Pushed to Google Sheets:</strong></p>
                                <ul style="margin: 5px 0 0 20px;">
                                    <li>Synced Entries: ${result.pushed.synced}</li>
                                </ul>
                            </div>
                        `,
            icon: "success",
          });

          displayHistory();
          updateStats();
          updateSyncStatus();
        } catch (error) {
          Swal.fire({
            title: "Sync Error",
            text: error.message,
            icon: "error",
          });
        }
      },
    });
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error",
    });
  }
}

async function disconnectGoogleSheets() {
  const { isConfirmed } = await Swal.fire({
    title: "Disconnect Google Sheets?",
    text: "Your local data will remain intact",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    confirmButtonText: "Disconnect",
  });

  if (isConfirmed) {
    await googleSheetsSync.signOut();
    Swal.fire({
      title: "Disconnected",
      text: "Google Sheets connection removed",
      icon: "success",
    });
    updateSyncStatus();
  }
}

async function updateSyncStatus() {
  console.log("updateSyncStatus called");
  const statusElement = document.getElementById("googleSyncStatus");
  const connectBtn = document.getElementById("googleConnectBtn");
  const syncBtn = document.getElementById("googleSyncBtn");
  const pullBtn = document.getElementById("googlePullBtn");
  const pushBtn = document.getElementById("googlePushBtn");
  const disconnectBtn = document.getElementById("googleDisconnectBtn");
  const configSection = document.getElementById("googleConfigSection");

  console.log("Elements found:", {
    statusElement: !!statusElement,
    connectBtn: !!connectBtn,
    configSection: !!configSection,
  });

  if (!statusElement) {
    console.log("statusElement not found, returning");
    return;
  }

  console.log("Checking auth status:", {
    isAuthenticated: googleSheetsSync.isAuthenticated,
    spreadsheetId: googleSheetsSync.spreadsheetId,
  });

  if (googleSheetsSync.isAuthenticated && googleSheetsSync.spreadsheetId) {
    console.log("In authenticated branch");
    const lastSync = await googleSheetsSync.getLastSyncTime();
    const lastSyncText = lastSync
      ? `Last synced: ${lastSync.toLocaleString()}`
      : "Never synced";

    statusElement.innerHTML = `
            <div style="padding: 10px; background: #d4edda; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-weight: 600; color: #155724;">✓ Google Sheets Connected</p>
                <p style="margin: 0; font-size: 0.9em; color: #155724;">${lastSyncText}</p>
            </div>
        `;

    // Show sync buttons and disconnect
    if (connectBtn) connectBtn.style.display = "none";
    if (syncBtn) syncBtn.style.display = "block";
    if (pullBtn) pullBtn.style.display = "block";
    if (pushBtn) pushBtn.style.display = "block";
    if (disconnectBtn) disconnectBtn.style.display = "block";

    // Show configuration section
    if (configSection) {
      configSection.style.display = "block";
      console.log("Config section displayed");
      // Update config values
      const idElement = document.getElementById("googleSpreadsheetId");
      if (idElement) idElement.textContent = googleSheetsSync.spreadsheetId;

      const timeElement = document.getElementById("googleLastSyncTime");
      if (timeElement)
        timeElement.textContent = lastSync
          ? lastSync.toLocaleString()
          : "Never";

      const intervalElement = document.getElementById("googleSyncInterval");
      if (intervalElement)
        intervalElement.value = googleSheetsSync.syncInterval / 60 / 1000;

      // Show copy button
      const copyBtn = document.getElementById("copySheetIdBtn");
      console.log("Copy button element:", copyBtn);
      if (copyBtn) {
        copyBtn.style.display = "inline-block";
        console.log("Copy button displayed");
      }
    } else {
      console.log("Config section not found");
    }
  } else if (
    googleSheetsSync.spreadsheetId &&
    !googleSheetsSync.isAuthenticated
  ) {
    // Spreadsheet ID is stored but not authenticated (token expired)
    statusElement.innerHTML = `
            <div style="padding: 10px; background: #fff3cd; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; font-weight: 600; color: #856404;">⚠ Re-authentication Required</p>
                <p style="margin: 0; font-size: 0.9em; color: #856404;">Your session expired. Please sign in again to resume syncing with ${googleSheetsSync.spreadsheetId.substring(0, 20)}...</p>
            </div>
        `;

    // Show connect button to re-authenticate
    if (connectBtn) connectBtn.style.display = "block";
    if (syncBtn) syncBtn.style.display = "none";
    if (pullBtn) pullBtn.style.display = "none";
    if (pushBtn) pushBtn.style.display = "none";
    if (disconnectBtn) disconnectBtn.style.display = "none";

    // Show configuration section with stored spreadsheet ID
    if (configSection) {
      configSection.style.display = "block";
      document.getElementById("googleSpreadsheetId").textContent =
        googleSheetsSync.spreadsheetId;
      document.getElementById("googleLastSyncTime").textContent =
        "Not syncing (re-auth required)";
      document.getElementById("googleSyncInterval").value =
        googleSheetsSync.syncInterval / 60 / 1000;

      // Show copy button
      const copyBtn = document.getElementById("copySheetIdBtn");
      if (copyBtn) copyBtn.style.display = "block";
    }
  } else {
    statusElement.innerHTML = `
            <div style="padding: 10px; background: #f8d7da; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 0; font-weight: 600; color: #721c24;">Not Connected to Google Sheets</p>
            </div>
        `;

    // Show connect button, hide sync and disconnect
    if (connectBtn) connectBtn.style.display = "block";
    if (syncBtn) syncBtn.style.display = "none";
    if (pullBtn) pullBtn.style.display = "none";
    if (pushBtn) pushBtn.style.display = "none";
    if (disconnectBtn) disconnectBtn.style.display = "none";

    // Hide configuration section
    if (configSection) configSection.style.display = "none";
  }
}

// Google Sheets Configuration Functions
function updateGoogleSyncInterval() {
  const minutesInput = document.getElementById("googleSyncInterval");
  const minutes = parseInt(minutesInput.value);

  if (isNaN(minutes) || minutes < 1 || minutes > 120) {
    Swal.fire({
      title: "Invalid Input",
      text: "Please enter a value between 1 and 120 minutes",
      icon: "warning",
    });
    return;
  }

  googleSheetsSync.setSyncInterval(minutes);

  Swal.fire({
    title: "Success",
    text: `Sync interval updated to ${minutes} minutes`,
    icon: "success",
    timer: 2000,
  });
}

function toggleGoogleAutoSync() {
  const toggle = document.getElementById("googleAutoSyncToggle");
  const statusDetail = document.getElementById("googleSyncStatusDetail");

  if (toggle.checked) {
    googleSheetsSync.startAutoSync();
    statusDetail.textContent = "Auto-sync is enabled and running";
  } else {
    if (googleSheetsSync.tokenRefreshInterval) {
      clearInterval(googleSheetsSync.tokenRefreshInterval);
    }
    statusDetail.textContent = "Auto-sync is disabled";
  }
}

async function manualSyncGoogleSheets() {
  if (!googleSheetsSync.isAuthenticated || !googleSheetsSync.spreadsheetId) {
    Swal.fire({
      title: "Not Connected",
      text: "Please connect to Google Sheets first",
      icon: "warning",
    });
    return;
  }

  Swal.fire({
    title: "Syncing...",
    text: "Syncing data with Google Sheets",
    icon: "info",
    allowOutsideClick: false,
    didOpen: async () => {
      Swal.showLoading();
      try {
        const result = await googleSheetsSync.bidirectionalSync();

        const message = `
                    <p>Sync completed successfully!</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">
                        <strong>Pulled:</strong> ${result.pulled.newEntries} new, ${result.pulled.updatedEntries} updated<br>
                        <strong>Pushed:</strong> ${result.pushed.synced} entries
                    </p>
                `;

        Swal.fire({
          title: "Sync Complete",
          html: message,
          icon: "success",
        });

        // Refresh sync status
        updateSyncStatus();
      } catch (error) {
        Swal.fire({
          title: "Sync Failed",
          text: error.message,
          icon: "error",
        });
      }
    },
  });
}

async function pullFromGoogleSheets() {
  if (!googleSheetsSync.isAuthenticated || !googleSheetsSync.spreadsheetId) {
    Swal.fire({
      title: "Not Connected",
      text: "Please connect to Google Sheets first",
      icon: "warning",
    });
    return;
  }

  Swal.fire({
    title: "Pulling Data...",
    text: "Fetching latest data from Google Sheets",
    icon: "info",
    allowOutsideClick: false,
    didOpen: async () => {
      Swal.showLoading();
      try {
        const result = await googleSheetsSync.syncFromGoogleSheets();

        const message = `
                    <p>Data pulled successfully!</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">
                        <strong>New entries:</strong> ${result.newEntries}<br>
                        <strong>Updated entries:</strong> ${result.updatedEntries}
                    </p>
                `;

        Swal.fire({
          title: "Pull Complete",
          html: message,
          icon: "success",
        });

        // Refresh display
        displayHistory();
        updateSyncStatus();
      } catch (error) {
        Swal.fire({
          title: "Pull Failed",
          text: error.message,
          icon: "error",
        });
      }
    },
  });
}

async function pushToGoogleSheets() {
  if (!googleSheetsSync.isAuthenticated || !googleSheetsSync.spreadsheetId) {
    Swal.fire({
      title: "Not Connected",
      text: "Please connect to Google Sheets first",
      icon: "warning",
    });
    return;
  }

  Swal.fire({
    title: "Pushing Data...",
    text: "Uploading local changes to Google Sheets",
    icon: "info",
    allowOutsideClick: false,
    didOpen: async () => {
      Swal.showLoading();
      try {
        const result = await googleSheetsSync.syncToGoogleSheets();

        const message = `
                    <p>Data pushed successfully!</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">
                        <strong>Entries synced:</strong> ${result.synced}
                    </p>
                `;

        Swal.fire({
          title: "Push Complete",
          html: message,
          icon: "success",
        });

        // Refresh sync status
        updateSyncStatus();
      } catch (error) {
        Swal.fire({
          title: "Push Failed",
          text: error.message,
          icon: "error",
        });
      }
    },
  });
}

function copyGoogleSheetId() {
  const sheetIdElement = document.getElementById("googleSpreadsheetId");
  const sheetId = sheetIdElement.textContent;

  if (sheetId === "Not connected") {
    Swal.fire({
      title: "No Sheet Connected",
      text: "Please connect to a Google Sheet first",
      icon: "warning",
      timer: 2000,
    });
    return;
  }

  // Copy to clipboard
  navigator.clipboard
    .writeText(sheetId)
    .then(() => {
      Swal.fire({
        title: "Copied!",
        text: "Sheet ID copied to clipboard",
        icon: "success",
        timer: 1500,
      });
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = sheetId;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);

      Swal.fire({
        title: "Copied!",
        text: "Sheet ID copied to clipboard",
        icon: "success",
        timer: 1500,
      });
    });
}

// Initialize sync status on page load
window.addEventListener("load", () => {
  updateSyncStatus();
});
