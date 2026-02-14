/**
 * UI Functions for Features
 * Photo upload, vehicle selection, maintenance reminders, etc.
 */

// Photo Upload Handler
async function handlePhotoUpload(file, entryId) {
    try {
        if (!file) return;

        // Check file size (limit 10MB)
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire('Error', 'File size exceeds 10MB limit', 'error');
            return;
        }

        // Check if authenticated with Google
        const token = await db.getSetting('googleSheetsAccessToken');
        if (!token) {
            Swal.fire('Error', 'Please authenticate with Google first', 'error');
            return;
        }

        const photoRecord = await googleDriveSync.uploadPhoto(file, entryId);
        Swal.fire('Success', 'Photo uploaded to Drive', 'success');
        
        // Refresh photos display
        await refreshPhotosDisplay(entryId);
    } catch (error) {
        console.error('Photo upload error:', error);
        Swal.fire('Error', 'Failed to upload photo', 'error');
    }
}

async function refreshPhotosDisplay(entryId) {
    const photos = await googleDriveSync.getPhotosByEntryId(entryId);
    const photoContainer = document.getElementById(`photos-${entryId}`);
    
    if (!photoContainer) return;

    if (photos.length === 0) {
        photoContainer.innerHTML = '<small class="text-muted">No photos attached</small>';
        return;
    }

    let html = '<div class="photos-grid">';
    for (const photo of photos) {
        html += `
            <div class="photo-item">
                <img src="${photo.thumbnailUrl}" alt="Photo" class="photo-thumbnail" style="max-width: 100px; margin: 5px; border-radius: 4px;">
                <button class="btn btn-sm btn-link" onclick="viewPhotoFullSize('${photo.driveLink}')" title="View Full">
                    <i class="fas fa-external-link-alt"></i>
                </button>
                <button class="btn btn-sm btn-link text-danger" onclick="deleteEntryPhoto('${photo.id}', '${entryId}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }
    html += '</div>';
    photoContainer.innerHTML = html;
}

function viewPhotoFullSize(driveLink) {
    window.open(driveLink, '_blank');
}

async function deleteEntryPhoto(photoId, entryId) {
    const confirmed = await Swal.fire({
        title: 'Delete Photo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete'
    });

    if (confirmed.isConfirmed) {
        await googleDriveSync.deletePhoto(photoId);
        await refreshPhotosDisplay(entryId);
        Swal.fire('Deleted', 'Photo removed', 'success');
    }
}

// Vehicle Selection
async function showVehicleSelector() {
    const vehicles = vehicleManager.vehicles;
    
    let options = {};
    vehicles.forEach(v => {
        options[v.id] = v.name;
    });
    options['new'] = '+ Add New Vehicle';

    const { value: selectedId } = await Swal.fire({
        title: 'Select Vehicle',
        input: 'select',
        inputOptions: options,
        inputValue: vehicleManager.activeVehicleId,
        showCancelButton: true
    });

    if (!selectedId) return;

    if (selectedId === 'new') {
        await showNewVehicleModal();
    } else {
        await vehicleManager.setActiveVehicle(selectedId);
        updateVehicleDisplay();
    }
}

async function showNewVehicleModal() {
    const { value: formValues } = await Swal.fire({
        title: 'Add New Vehicle',
        html: `
            <div class="mb-3 text-start">
                <label class="form-label">Vehicle Name</label>
                <input id="swal-vehicle-name" class="form-control" placeholder="e.g., Generator 1">
            </div>
            <div class="mb-3 text-start">
                <label class="form-label">Type</label>
                <select id="swal-vehicle-type" class="form-select">
                    <option value="generator">Generator</option>
                    <option value="truck">Truck</option>
                    <option value="car">Car</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="mb-3 text-start">
                <label class="form-label">Fuel Type</label>
                <select id="swal-vehicle-fuel" class="form-select">
                    <option value="diesel">Diesel</option>
                    <option value="petrol">Petrol</option>
                    <option value="lpg">LPG</option>
                </select>
            </div>
            <div class="mb-3 text-start">
                <label class="form-label">Tank Capacity (Liters)</label>
                <input id="swal-vehicle-capacity" class="form-control" type="number" placeholder="e.g., 100">
            </div>
            <div class="mb-3 text-start">
                <label class="form-label">License/Serial Number</label>
                <input id="swal-vehicle-serial" class="form-control" placeholder="e.g., ABC-1234">
            </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
            return {
                name: document.getElementById('swal-vehicle-name').value,
                type: document.getElementById('swal-vehicle-type').value,
                fuelType: document.getElementById('swal-vehicle-fuel').value,
                capacity: document.getElementById('swal-vehicle-capacity').value,
                licenseOrSerial: document.getElementById('swal-vehicle-serial').value
            };
        },
        showCancelButton: true
    });

    if (formValues && formValues.name) {
        const vehicleId = await vehicleManager.createVehicle(formValues);
        await vehicleManager.setActiveVehicle(vehicleId);
        updateVehicleDisplay();
        Swal.fire('Success', 'Vehicle added', 'success');
    }
}

function updateVehicleDisplay() {
    const vehicle = vehicleManager.getActiveVehicle();
    const vehicleBtn = document.getElementById('vehicleSelector');
    if (vehicleBtn && vehicle) {
        vehicleBtn.textContent = vehicle.name;
    }
}

// Maintenance Reminder
async function showMaintenanceReminder() {
    const vehicle = vehicleManager.getActiveVehicle();
    if (!vehicle) {
        Swal.fire('Error', 'Select a vehicle first', 'error');
        return;
    }

    const { value: formValues } = await Swal.fire({
        title: 'Add Maintenance Reminder',
        html: `
            <div class="mb-3 text-start">
                <label class="form-label">Title</label>
                <input id="swal-maintenance-title" class="form-control" placeholder="e.g., Oil Change">
            </div>
            <div class="mb-3 text-start">
                <label class="form-label">Due Date</label>
                <input id="swal-maintenance-date" class="form-control" type="date">
            </div>
            <div class="mb-3 text-start">
                <label class="form-label">Category</label>
                <select id="swal-maintenance-category" class="form-select">
                    <option value="oil-change">Oil Change</option>
                    <option value="inspection">Inspection</option>
                    <option value="repair">Repair</option>
                    <option value="service">Service</option>
                </select>
            </div>
            <div class="mb-3 text-start">
                <label class="form-label">Description</label>
                <textarea id="swal-maintenance-desc" class="form-control" rows="2"></textarea>
            </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
            return {
                title: document.getElementById('swal-maintenance-title').value,
                dueDate: document.getElementById('swal-maintenance-date').value,
                category: document.getElementById('swal-maintenance-category').value,
                description: document.getElementById('swal-maintenance-desc').value
            };
        },
        showCancelButton: true
    });

    if (formValues && formValues.title && formValues.dueDate) {
        await maintenanceManager.createReminder(vehicle.id, formValues);
        Swal.fire('Success', 'Reminder created', 'success');
    }
}

// Fuel Price Tracking
async function recordFuelPrice() {
    const { value: formValues } = await Swal.fire({
        title: 'Record Fuel Price',
        html: `
            <div class="mb-3 text-start">
                <label class="form-label">Date</label>
                <input id="swal-price-date" class="form-control" type="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="mb-3 text-start">
                <label class="form-label">Price per Liter</label>
                <input id="swal-price-value" class="form-control" type="number" step="0.01" placeholder="e.g., 50.50">
            </div>
            <div class="mb-3 text-start">
                <label class="form-label">Fuel Type</label>
                <select id="swal-price-fuel" class="form-select">
                    <option value="diesel">Diesel</option>
                    <option value="petrol">Petrol</option>
                    <option value="lpg">LPG</option>
                </select>
            </div>
            <div class="mb-3 text-start">
                <label class="form-label">Location</label>
                <input id="swal-price-location" class="form-control" placeholder="e.g., Shell Station">
            </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
            return {
                date: document.getElementById('swal-price-date').value,
                pricePerLiter: document.getElementById('swal-price-value').value,
                fuelType: document.getElementById('swal-price-fuel').value,
                location: document.getElementById('swal-price-location').value
            };
        },
        showCancelButton: true
    });

    if (formValues && formValues.pricePerLiter) {
        await fuelPriceManager.recordPrice(formValues);
        Swal.fire('Success', 'Price recorded', 'success');
    }
}

// Location Capture
async function captureLocation(entryId) {
    try {
        Swal.fire({
            title: 'Getting location...',
            didOpen: async () => {
                Swal.showLoading();
                try {
                    const location = await locationTracker.getLocationPermission();
                    await locationTracker.saveLocation(entryId, location);
                    Swal.fire('Success', 'Location saved', 'success');
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            }
        });
    } catch (error) {
        console.error('Location capture error:', error);
        Swal.fire('Error', 'Failed to capture location', 'error');
    }
}

// Generate QR Code
async function showEntryQRCode(entryId) {
    try {
        const qrUrl = await qrCodeManager.generateEntryQR(entryId);
        if (!qrUrl) {
            Swal.fire('Error', 'Failed to generate QR code', 'error');
            return;
        }

        Swal.fire({
            title: 'Entry QR Code',
            imageUrl: qrUrl,
            imageHeight: 300,
            html: `
                <a href="${qrUrl}" download="entry-qr.png" class="btn btn-sm btn-primary" style="margin-top: 10px;">
                    <i class="fas fa-download"></i> Download
                </a>
            `
        });
    } catch (error) {
        console.error('QR code error:', error);
        Swal.fire('Error', 'Failed to generate QR code', 'error');
    }
}
