// Theme Toggle
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Initialize theme on page load
initTheme();

// Flatpickr initialization for date fields
function initFlatpickr() {
    // Initialize New Entry Modal Date Fields
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        if (startDateInput._flatpickr) {
            startDateInput._flatpickr.destroy();
        }
        flatpickr(startDateInput, {
            mode: 'single',
            dateFormat: 'Y-m-d',
            placeholder: 'Select start date'
        });
    }
    
    if (endDateInput) {
        if (endDateInput._flatpickr) {
            endDateInput._flatpickr.destroy();
        }
        flatpickr(endDateInput, {
            mode: 'single',
            dateFormat: 'Y-m-d',
            placeholder: 'Select end date'
        });
    }
}

// Flatpickr initialization for edit modal date fields
function initEditFlatpickr() {
    const editStartDateInput = document.getElementById('editStartDate');
    const editEndDateInput = document.getElementById('editEndDate');
    
    if (editStartDateInput) {
        if (editStartDateInput._flatpickr) {
            editStartDateInput._flatpickr.destroy();
        }
        flatpickr(editStartDateInput, {
            mode: 'single',
            dateFormat: 'Y-m-d',
            placeholder: 'Select start date'
        });
    }
    
    if (editEndDateInput) {
        if (editEndDateInput._flatpickr) {
            editEndDateInput._flatpickr.destroy();
        }
        flatpickr(editEndDateInput, {
            mode: 'single',
            dateFormat: 'Y-m-d',
            placeholder: 'Select end date'
        });
    }
}

// Export Panel Functions
function openExportPanel() {
    const exportPanel = document.getElementById('exportPanel');
    const exportOverlay = document.getElementById('exportOverlay');
    exportPanel.classList.add('active');
    exportOverlay.classList.add('active');
}

function closeExportPanel() {
    const exportPanel = document.getElementById('exportPanel');
    const exportOverlay = document.getElementById('exportOverlay');
    exportPanel.classList.remove('active');
    exportOverlay.classList.remove('active');
}

const operatorSelect = document.getElementById('operator');
const customOperatorInput = document.getElementById('customOperator');
const equipmentSelect = document.getElementById('equipment');
const distanceGroup = document.getElementById('distanceGroup');
const distanceInput = document.getElementById('distance');

// Edit modal variables
const editEquipmentSelect = document.getElementById('editEquipment');
const editDistanceGroup = document.getElementById('editDistanceGroup');
const editDistanceInput = document.getElementById('editDistance');
let currentEditingId = null;

// FAB menu toggle
const fabButton = document.getElementById('fabButton');
const fabMenu = document.getElementById('fabMenu');
let fabMenuOpen = false;

function toggleFabMenu() {
    fabMenuOpen = !fabMenuOpen;
    if (fabMenuOpen) {
        fabMenu.classList.add('active');
        fabButton.style.transform = 'rotate(45deg)';
    } else {
        fabMenu.classList.remove('active');
        fabButton.style.transform = 'rotate(0)';
    }
}

// Close FAB menu when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.fab') && !e.target.closest('.fab-menu')) {
        fabMenuOpen = false;
        fabMenu.classList.remove('active');
        fabButton.style.transform = 'rotate(0)';
    }
});

function openNewEntryModal() {
    // Reset form and hide results
    document.getElementById('fuelForm').reset();
    operatorSelect.value = '';
    equipmentSelect.value = '';
    
    // Reset Select2 fields
    if (typeof $ !== 'undefined' && jQuery.fn.select2) {
        jQuery('#operator').val('').trigger('change');
        jQuery('#equipment').val('').trigger('change');
    }
    
    customOperatorInput.style.display = 'none';
    distanceGroup.style.display = 'none';
    document.getElementById('resultBox').style.display = 'none';

    // Show modal
    const newEntryModal = new bootstrap.Modal(document.getElementById('newEntryModal'));
    newEntryModal.show();
    
    // Reinitialize date pickers and time pickers after modal is shown
    setTimeout(() => {
        initTimepicker();
        initFlatpickr();
    }, 200);
}

function showSummaryModal() {
    // Close FAB menu first
    fabMenuOpen = false;
    fabMenu.classList.remove('active');
    fabButton.style.transform = 'rotate(0)';

    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');

    const totalRecords = history.length;
    const totalHours = history.reduce((sum, h) => sum + h.totalHours, 0);
    const totalLiters = history.reduce((sum, h) => sum + h.liters, 0);
    const avgConsumption = totalRecords > 0 ? (totalLiters / totalHours).toFixed(2) : 0;

    // Update modal
    document.getElementById('modalTotalRecords').textContent = totalRecords;
    document.getElementById('modalTotalHours').textContent = totalHours.toFixed(1);
    document.getElementById('modalTotalLiters').textContent = totalLiters.toFixed(1);
    document.getElementById('modalAvgConsumption').textContent = avgConsumption;

    // Show modal
    const summaryModal = new bootstrap.Modal(document.getElementById('summaryModal'));
    summaryModal.show();
}

// Show/hide custom operator input
operatorSelect.addEventListener('change', function () {
    if (this.value === 'other') {
        customOperatorInput.style.display = 'block';
        customOperatorInput.focus();
    } else {
        customOperatorInput.style.display = 'none';
    }
});

// Also listen to Select2 change event
if (jQuery) {
    jQuery('#operator').on('select2:select', function() {
        if (jQuery(this).val() === 'other') {
            customOperatorInput.style.display = 'block';
            customOperatorInput.focus();
        } else {
            customOperatorInput.style.display = 'none';
        }
    });
}

// Show/hide distance field based on equipment type
equipmentSelect.addEventListener('change', function () {
    if (this.value === 'Vehicle' || this.value === 'Motorbike') {
        distanceGroup.style.display = 'block';
        distanceInput.required = true;
    } else {
        distanceGroup.style.display = 'none';
        distanceInput.required = false;
        distanceInput.value = '';
    }
});

// Show/hide distance field in edit modal based on equipment type
editEquipmentSelect.addEventListener('change', function () {
    if (this.value === 'Vehicle' || this.value === 'Motorbike') {
        editDistanceGroup.style.display = 'block';
        editDistanceInput.required = true;
    } else {
        editDistanceGroup.style.display = 'none';
        editDistanceInput.required = false;
        editDistanceInput.value = '';
    }
});

function calculateConsumption() {
     const site = document.getElementById('site').value;
     const period = document.getElementById('period').value;
     const startDate = document.getElementById('startDate').value;
     const endDate = document.getElementById('endDate').value;
     const startTime = document.getElementById('startTime').value;
     const endTime = document.getElementById('endTime').value;
     const liters = parseFloat(document.getElementById('liters').value);
     const distance = parseFloat(document.getElementById('distance').value) || 0;
     let operator = operatorSelect.value;
     let equipment = equipmentSelect.value;

     if (operator === 'other') {
         operator = customOperatorInput.value.trim();
     }

     // Validation
     if (!site || site.trim() === '') {
         Swal.fire({
             icon: 'warning',
             title: 'Missing Site',
             text: 'Please enter the site name',
             confirmButtonColor: '#2563eb'
         });
         return;
     }

     if (!period) {
         Swal.fire({
             icon: 'warning',
             title: 'Missing Period',
             text: 'Please select the month and year',
             confirmButtonColor: '#2563eb'
         });
         return;
     }

     if (!startDate) {
         Swal.fire({
             icon: 'warning',
             title: 'Missing Start Date',
             text: 'Please select the start date',
             confirmButtonColor: '#2563eb'
         });
         return;
     }

     if (!endDate) {
         Swal.fire({
             icon: 'warning',
             title: 'Missing End Date',
             text: 'Please select the end date',
             confirmButtonColor: '#2563eb'
         });
         return;
     }

    if (!startTime || !endTime) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Time',
            text: 'Please enter both start and end times',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    if (!operator || operator === '') {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Operator',
            text: 'Please select or enter an operator name',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    if (!equipment || equipment === '') {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Equipment',
            text: 'Please select equipment',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    if (isNaN(liters) || liters <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Invalid Liters',
            text: 'Please enter a valid amount of liters (greater than 0)',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle case where end time is next day
    if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
    }

    const totalMinutes = endMinutes - startMinutes;
    const totalHours = (totalMinutes / 60).toFixed(2);

    // Different calculations based on equipment type
    let consumption = '';
    let consumptionValue = 0;

    if (equipment === 'Generator') {
        // Generator: Liters per Hour
        consumption = (liters / totalHours).toFixed(2) + ' L/h';
        consumptionValue = parseFloat(consumption);
    } else if (equipment === 'Vehicle' || equipment === 'Motorbike') {
        // Vehicle/Motorbike: needs distance validation
        if (isNaN(distance) || distance <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Distance',
                text: 'Please enter a valid distance covered',
                confirmButtonColor: '#2563eb'
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
    document.getElementById('displayOperator').textContent = `${operator} (${equipment})`;
    document.getElementById('displayStart').textContent = startTime;
    document.getElementById('displayEnd').textContent = endTime;
    document.getElementById('displayHours').textContent = totalHours + ' hrs';
    if (distance > 0) {
        document.getElementById('displayLiters').textContent = `${liters} L (${distance} km)`;
    } else {
        document.getElementById('displayLiters').textContent = liters + ' L';
    }
    document.getElementById('displayConsumption').textContent = consumption;
    document.getElementById('resultBox').style.display = 'block';

    // Save to history
     const record = {
         id: Date.now(),
         site: site,
         period: period,
         startDate: startDate,
         endDate: endDate,
         operator: operator,
         equipment: equipment,
         startTime: startTime,
         endTime: endTime,
         totalHours: parseFloat(totalHours),
         distance: distance,
         liters: liters,
         consumption: consumption,
         consumptionValue: consumptionValue,
         timestamp: new Date().toLocaleString()
     };

    addToHistory(record);

    // Show success message
    Swal.fire({
        icon: 'success',
        title: 'Entry Saved!',
        text: `${operator} - ${equipment}: ${consumption}`,
        confirmButtonColor: '#10b981',
        timer: 2000
    });

    // Reset form
    document.getElementById('fuelForm').reset();
    operatorSelect.value = '';
    equipmentSelect.value = '';
    customOperatorInput.style.display = 'none';
    distanceGroup.style.display = 'none';
}

function addToHistory(record) {
    let history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
    history.unshift(record);
    localStorage.setItem('fuelHistory', JSON.stringify(history));
    displayHistory();
    updateStats();
}

function displayHistory() {
    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
    const tableContainer = document.getElementById('tableContainer');
    const historyCount = document.getElementById('historyCount');

    historyCount.textContent = history.length + ' record' + (history.length !== 1 ? 's' : '');

    if (history.length === 0) {
        tableContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p class="mt-2">No fuel entries yet. Add one to get started!</p>
            </div>
        `;
        return;
    }

    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th><i class="fas fa-map-marker-alt"></i> Site</th>
                    <th><i class="fas fa-calendar"></i> Period</th>
                    <th><i class="fas fa-calendar-day"></i> Date</th>
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

    history.forEach((record, index) => {
        const distanceDisplay = record.distance && record.distance > 0 ? `${record.distance} km` : '-';
        const periodDisplay = record.period ? new Date(record.period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '-';
        const dateDisplay = record.date ? new Date(record.date).toLocaleDateString('en-US') : '-';
        html += `
            <tr>
                <td data-label="Site"><strong>${record.site || '-'}</strong></td>
                <td data-label="Period">${periodDisplay}</td>
                <td data-label="Date">${dateDisplay}</td>
                <td data-label="Operator"><strong>${record.operator}</strong></td>
                <td data-label="Equipment">${record.equipment}</td>
                <td data-label="Time Period">${record.startTime} - ${record.endTime}</td>
                <td data-label="Hours">${record.totalHours} h</td>
                <td data-label="Distance">${distanceDisplay}</td>
                <td data-label="Liters">${record.liters} L</td>
                <td data-label="Consumption"><span class="badge badge-consumption">${record.consumption}</span></td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-primary" onclick="editHistoryItem(${record.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteHistoryItem(${record.id})" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = html;
}

function editHistoryItem(id) {
    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
    const record = history.find(h => h.id === id);

    if (!record) {
        Swal.fire('Error', 'Record not found', 'error');
        return;
    }

    // Store the ID for saving later
    currentEditingId = id;

    // Populate the edit form
     document.getElementById('editOperator').value = record.operator;
     document.getElementById('editEquipment').value = record.equipment;
     document.getElementById('editStartDate').value = record.startDate || '';
     document.getElementById('editEndDate').value = record.endDate || '';
     document.getElementById('editStartTime').value = record.startTime;
     document.getElementById('editEndTime').value = record.endTime;
     document.getElementById('editDistance').value = record.distance || '';
     document.getElementById('editLiters').value = record.liters;

     // Trigger distance field visibility
     editEquipmentSelect.dispatchEvent(new Event('change'));

     // Show the modal
     const editModal = new bootstrap.Modal(document.getElementById('editModal'));
     editModal.show();
     
     // Initialize flatpickr after modal is shown
     setTimeout(() => {
         initEditFlatpickr();
     }, 200);
}

function saveEditedRecord() {
     const operator = document.getElementById('editOperator').value.trim();
     const equipment = document.getElementById('editEquipment').value;
     const startDate = document.getElementById('editStartDate').value;
     const endDate = document.getElementById('editEndDate').value;
     const startTime = document.getElementById('editStartTime').value;
     const endTime = document.getElementById('editEndTime').value;
     const distance = parseFloat(document.getElementById('editDistance').value) || 0;
     const liters = parseFloat(document.getElementById('editLiters').value);

    // Validation
    if (!operator) {
        Swal.fire('Error', 'Please enter operator name', 'warning');
        return;
    }

    if (!startTime || !endTime) {
        Swal.fire('Error', 'Please enter both start and end times', 'warning');
        return;
    }

    if (isNaN(liters) || liters <= 0) {
        Swal.fire('Error', 'Please enter valid liters amount', 'warning');
        return;
    }

    if ((equipment === 'Vehicle' || equipment === 'Motorbike') && (isNaN(distance) || distance <= 0)) {
        Swal.fire('Error', 'Please enter valid distance for vehicles', 'warning');
        return;
    }

    // Calculate consumption
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
    }

    const totalMinutes = endMinutes - startMinutes;
    const totalHours = (totalMinutes / 60).toFixed(2);

    let consumption = '';
    let consumptionValue = 0;

    if (equipment === 'Generator') {
        consumption = (liters / totalHours).toFixed(2) + ' L/h';
        consumptionValue = parseFloat(consumption);
    } else {
        const lPer100km = ((liters / distance) * 100).toFixed(2);
        const kmPerLiter = (distance / liters).toFixed(2);
        consumption = `${lPer100km} L/100km | ${kmPerLiter} km/L`;
        consumptionValue = parseFloat(lPer100km);
    }

    // Update record in localStorage
    let history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
    const recordIndex = history.findIndex(h => h.id === currentEditingId);

    if (recordIndex !== -1) {
        history[recordIndex] = {
            id: currentEditingId,
            site: history[recordIndex].site,
            period: history[recordIndex].period,
            startDate: startDate,
            endDate: endDate,
            operator: operator,
            equipment: equipment,
            startTime: startTime,
            endTime: endTime,
            totalHours: parseFloat(totalHours),
            distance: distance,
            liters: liters,
            consumption: consumption,
            consumptionValue: consumptionValue,
            timestamp: history[recordIndex].timestamp
        };

        localStorage.setItem('fuelHistory', JSON.stringify(history));
        displayHistory();
        updateStats();

        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();

        Swal.fire('Updated!', 'Record has been updated successfully', 'success');
        currentEditingId = null;
    }
}

function deleteHistoryItem(id) {
    Swal.fire({
        icon: 'warning',
        title: 'Delete Entry?',
        text: 'This action cannot be undone',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            let history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
            history = history.filter(h => h.id !== id);
            localStorage.setItem('fuelHistory', JSON.stringify(history));
            displayHistory();
            updateStats();
            Swal.fire('Deleted!', 'Entry has been removed', 'success');
        }
    });
}

function confirmClearHistory() {
    Swal.fire({
        icon: 'error',
        title: 'Clear All Data?',
        text: 'This will delete all fuel consumption records permanently',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, clear everything!'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('fuelHistory');
            displayHistory();
            updateStats();
            Swal.fire('Cleared!', 'All data has been removed', 'success');
        }
    });
}

function updateStats() {
    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');

    const totalRecords = history.length;
    const totalHours = history.reduce((sum, h) => sum + h.totalHours, 0);
    const totalLiters = history.reduce((sum, h) => sum + h.liters, 0);
    const avgConsumption = totalRecords > 0 ? (totalLiters / totalHours).toFixed(2) : 0;

    // Update main stats (if elements exist)
    const el1 = document.getElementById('totalRecords');
    if (el1) el1.textContent = totalRecords;
    
    const el2 = document.getElementById('totalHours');
    if (el2) el2.textContent = totalHours.toFixed(1);
    
    const el3 = document.getElementById('totalLiters');
    if (el3) el3.textContent = totalLiters.toFixed(1);
    
    const el4 = document.getElementById('avgConsumption');
    if (el4) el4.textContent = avgConsumption;

    // Update sidebar (if elements exist)
    const el5 = document.getElementById('sidebarRecords');
    if (el5) el5.textContent = totalRecords;
    
    const el6 = document.getElementById('sidebarHours');
    if (el6) el6.textContent = totalHours.toFixed(1) + ' h';
    
    const el7 = document.getElementById('sidebarLiters');
    if (el7) el7.textContent = totalLiters.toFixed(1) + ' L';
    
    const el8 = document.getElementById('sidebarAvgRate');
    if (el8) el8.textContent = avgConsumption + ' L/h';
}

function showChart() {
    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');
    
    if (history.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'No Data',
            text: 'Add fuel entries to view charts',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    const modal = new bootstrap.Modal(document.getElementById('chartModal'));
    modal.show();

    setTimeout(() => {
        renderCharts(history);
    }, 200);
}

function renderCharts(history) {
    // Consumption Chart
    const ctx1 = document.getElementById('consumptionChart').getContext('2d');
    new Chart(ctx1, {
        type: 'line',
        data: {
            labels: history.map(h => `${h.operator} (${h.equipment})`),
            datasets: [{
                label: 'Consumption Rate',
                data: history.map(h => h.consumptionValue),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            }
        }
    });

    // Liters Chart
    const ctx2 = document.getElementById('litersChart').getContext('2d');
    new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: history.map(h => `${h.operator} (${h.equipment})`),
            datasets: [{
                label: 'Liters Used',
                data: history.map(h => h.liters),
                backgroundColor: '#2563eb',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            }
        }
    });
}

function exportData() {
    const history = JSON.parse(localStorage.getItem('fuelHistory') || '[]');

    if (history.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'No Data',
            text: 'Add fuel entries before exporting',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    let csv = 'Site,Period,Date,Operator,Equipment,Start Time,End Time,Hours,Distance (km),Liters,Consumption,Timestamp\n';

    history.forEach(record => {
        const distance = record.distance && record.distance > 0 ? record.distance : '-';
        const periodDisplay = record.period ? new Date(record.period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '-';
        csv += `${record.site || '-'},${periodDisplay},${record.date || '-'},${record.operator},${record.equipment},${record.startTime},${record.endTime},${record.totalHours},${distance},${record.liters},${record.consumption},${record.timestamp}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fuel-consumption-report.csv';
    a.click();

    Swal.fire('Exported!', 'Data has been exported to CSV', 'success');
}

// Custom Time Picker - User Friendly
function initTimepicker() {
    document.querySelectorAll('.timepicker:not(.timepicker-initialized)').forEach(element => {
        element.classList.add('timepicker-initialized');
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'timepicker-wrapper';
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
        
        // Create picker container (hidden by default)
        const picker = document.createElement('div');
        picker.className = 'timepicker-picker';
        picker.style.display = 'none';
        
        // Generate hour and minute options
        let hourOptions = '';
        for (let i = 0; i < 24; i++) {
            hourOptions += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
        }
        
        let minuteOptions = '';
        for (let i = 0; i < 60; i++) {
            minuteOptions += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
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
        
        const hourSelect = picker.querySelector('.time-hour');
        const minuteSelect = picker.querySelector('.time-minute');
        const timeDisplay = picker.querySelector('#timeDisplay');
        
        // Update display when selects change
        const updateDisplay = () => {
            timeDisplay.textContent = `${hourSelect.value}:${minuteSelect.value}`;
        };
        
        hourSelect.addEventListener('change', updateDisplay);
        minuteSelect.addEventListener('change', updateDisplay);
        
        // Click handler for input
        element.addEventListener('click', () => {
            picker.style.display = 'block';
            const [hour, minute] = (element.value || '00:00').split(':');
            hourSelect.value = String(parseInt(hour) || 0).padStart(2, '0');
            minuteSelect.value = String(parseInt(minute) || 0).padStart(2, '0');
            updateDisplay();
        });
        
        // OK button
        picker.querySelector('.time-ok').addEventListener('click', () => {
            element.value = `${hourSelect.value}:${minuteSelect.value}`;
            picker.style.display = 'none';
            element.dispatchEvent(new Event('change'));
        });
        
        // Cancel button
        picker.querySelector('.time-cancel').addEventListener('click', () => {
            picker.style.display = 'none';
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                picker.style.display = 'none';
            }
        });
    });
}

// Initialize Flatpickr date pickers
function initFlatpickr() {
    if (typeof flatpickr !== 'undefined') {
        try {
            // Function to dynamically position calendar to stay in viewport
            const onOpenFlatpickr = (selectedDates, dateStr, instance) => {
                const calendar = instance.calendarContainer;
                if (!calendar) return;
                
                // Position the calendar
                const rect = instance.input.getBoundingClientRect();
                const calendarHeight = 350; // Approximate height
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                
                // Position above if not enough space below
                if (spaceBelow < calendarHeight && spaceAbove > calendarHeight) {
                    calendar.style.top = 'auto';
                    calendar.style.bottom = (viewportHeight - rect.top) + 'px';
                } else {
                    calendar.style.top = rect.bottom + 'px';
                    calendar.style.bottom = 'auto';
                }
                
                // Center horizontally
                calendar.style.left = rect.left + 'px';
                calendar.style.right = 'auto';
            };
            
            // Destroy any existing instances first
            const dateInput = document.getElementById('date');
            const periodInput = document.getElementById('period');
            
            if (dateInput && dateInput._flatpickr) {
                dateInput._flatpickr.destroy();
            }
            if (periodInput && periodInput._flatpickr) {
                periodInput._flatpickr.destroy();
            }
            
            // Initialize date picker
            if (dateInput) {
                flatpickr(dateInput, {
                    mode: 'single',
                    dateFormat: 'Y-m-d',
                    allowInput: true,
                    appendTo: document.body,
                    position: 'auto',
                    static: false,
                    onOpen: onOpenFlatpickr
                });
            }
            
            // Initialize period (month) picker
            if (periodInput) {
                flatpickr(periodInput, {
                    mode: 'single',
                    dateFormat: 'Y-m',
                    allowInput: true,
                    appendTo: document.body,
                    position: 'auto',
                    static: false,
                    onOpen: onOpenFlatpickr
                });
            }
        } catch(e) {
            console.error('Flatpickr initialization error:', e);
        }
    } else {
        console.warn('Flatpickr not loaded');
    }
}

// Initialize Select2
function initSelect2() {
    if (typeof $ !== 'undefined' && $.fn.select2) {
        try {
            const baseOptions = {
                width: '100%',
                allowClear: true,
                dropdownAutoWidth: true
            };
            
            // Initialize operator select (in modal)
            if (jQuery('#operator').length) {
                jQuery('#operator').select2({
                    ...baseOptions,
                    dropdownParent: jQuery('#newEntryModal')
                });
            }
            
            // Initialize equipment select (in modal)
            if (jQuery('#equipment').length) {
                jQuery('#equipment').select2({
                    ...baseOptions,
                    dropdownParent: jQuery('#newEntryModal')
                });
            }
            
            // Initialize edit equipment select (in edit modal)
            if (jQuery('#editEquipment').length) {
                jQuery('#editEquipment').select2({
                    ...baseOptions,
                    dropdownParent: jQuery('#editModal')
                });
            }
        } catch(e) {
            console.error('Select2 initialization error:', e);
        }
    } else {
        console.warn('jQuery or Select2 not loaded');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
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
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && e.target.closest('#fuelForm')) {
        calculateConsumption();
    }
});

// Generate Excel Report with Professional Formatting
function generateExcelReport() {
    // Get history data
    const history = JSON.parse(localStorage.getItem('fuelEntries') || '[]');

    // Validation
    if (history.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'No Data',
            text: 'Please add fuel entries before generating a report'
        });
        return;
    }

    // Get site and period from the first entry
    const firstEntry = history[0];
    const site = firstEntry.site || 'N/A';
    const period = firstEntry.period || 'N/A';

    // Format period if it exists
    let formattedPeriod = period;
    if (period !== 'N/A' && period.includes('-')) {
        const [year, month] = period.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        formattedPeriod = `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    // Calculate totals
    const totalHours = history.reduce((sum, record) => sum + parseFloat(record.totalHours || 0), 0);
    const totalLiters = history.reduce((sum, record) => sum + parseFloat(record.liters || 0), 0);
    const avgConsumption = totalLiters > 0 && totalHours > 0 ? (totalLiters / totalHours).toFixed(2) : '0.00';

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data array
    const dataArray = [];
    
    // Title and info rows
    dataArray.push(['FUEL CONSUMPTION REPORT']);
    dataArray.push(['Site:', site]);
    dataArray.push(['Period:', formattedPeriod]);
    dataArray.push(['Generated:', new Date().toLocaleString()]);
    dataArray.push([]);
    
    // Headers
    dataArray.push(['No.', 'Operator', 'Equipment', 'Start Time', 'End Time', 'Hours', 'Liters', 'Consumption (L/h)']);
    
    // Data rows
    history.forEach((record, index) => {
        dataArray.push([
            index + 1,
            record.operator || '-',
            record.equipment || '-',
            record.startTime || '-',
            record.endTime || '-',
            record.totalHours || 0,
            record.liters || 0,
            record.consumption || 0
        ]);
    });
    
    // Totals row
    dataArray.push(['', '', '', '', 'TOTALS:', totalHours.toFixed(2), totalLiters.toFixed(2), avgConsumption]);
    
    // Signature rows
    dataArray.push([]);
    dataArray.push(['PREPARED BY']);
    dataArray.push(['Name:', '___________________________________']);
    dataArray.push(['Signature:', '___________________________________']);
    dataArray.push(['Date:', '___________________________________']);
    dataArray.push([]);
    dataArray.push(['REVIEWED BY']);
    dataArray.push(['Name:', '___________________________________']);
    dataArray.push(['Signature:', '___________________________________']);
    dataArray.push(['Date:', '___________________________________']);
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(dataArray);
    
    // Set column widths
    worksheet['!cols'] = [
        { wch: 5 },    // No.
        { wch: 20 },   // Operator
        { wch: 15 },   // Equipment
        { wch: 12 },   // Start Time
        { wch: 12 },   // End Time
        { wch: 10 },   // Hours
        { wch: 10 },   // Liters
        { wch: 18 }    // Consumption
    ];
    
    // Theme color definition
    const themeColor = 'F54927';
    const darkColor = '333333';
    const lightBg = 'FAFAFA';
    
    // Style cells with theme color
    const styleHeader = {
        font: { bold: true, color: 'FFFFFF', size: 11, name: 'Calibri' },
        fill: { fgColor: { rgb: themeColor } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: { 
            top: { style: 'thin', color: themeColor },
            bottom: { style: 'thin', color: themeColor },
            left: { style: 'thin', color: themeColor },
            right: { style: 'thin', color: themeColor }
        }
    };
    
    const styleTitle = {
        font: { bold: true, size: 14, color: themeColor, name: 'Calibri' },
        alignment: { horizontal: 'left', vertical: 'center' }
    };
    
    const styleInfo = {
        font: { size: 10, color: '000000', name: 'Calibri' },
        alignment: { horizontal: 'left', vertical: 'center' }
    };
    
    const styleData = {
        font: { size: 10, color: '000000', name: 'Calibri' },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { 
            top: { style: 'thin', color: 'E0E0E0' },
            bottom: { style: 'thin', color: 'E0E0E0' },
            left: { style: 'thin', color: 'E0E0E0' },
            right: { style: 'thin', color: 'E0E0E0' }
        },
        fill: { fgColor: { rgb: lightBg } }
    };
    
    const styleTotals = {
        font: { bold: true, size: 10, color: 'FFFFFF', name: 'Calibri' },
        fill: { fgColor: { rgb: darkColor } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { 
            top: { style: 'medium', color: themeColor },
            bottom: { style: 'medium', color: themeColor },
            left: { style: 'medium', color: darkColor },
            right: { style: 'medium', color: darkColor }
        }
    };
    
    // Apply styles to title (A1)
    worksheet['A1'].s = styleTitle;
    
    // Apply styles to info rows (A2:B4)
    for (let i = 2; i <= 4; i++) {
        if (worksheet[`A${i}`]) worksheet[`A${i}`].s = styleInfo;
        if (worksheet[`B${i}`]) worksheet[`B${i}`].s = styleInfo;
    }
    
    // Apply styles to header row (A6:H6)
    for (let col = 'A'; col <= 'H'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
        const cell = worksheet[`${col}6`];
        if (cell) cell.s = styleHeader;
    }
    
    // Apply styles to data rows
    const dataStartRow = 7;
    const dataEndRow = 6 + history.length;
    for (let i = dataStartRow; i <= dataEndRow; i++) {
        for (let col = 'A'; col <= 'H'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
            const cell = worksheet[`${col}${i}`];
            if (cell) cell.s = styleData;
        }
    }
    
    // Apply styles to totals row
    const totalsRow = dataEndRow + 1;
    for (let col = 'A'; col <= 'H'; col = String.fromCharCode(col.charCodeAt(0) + 1)) {
        const cell = worksheet[`${col}${totalsRow}`];
        if (cell) cell.s = styleTotals;
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fuel Report');
    
    // Generate file
    XLSX.writeFile(workbook, `Fuel_Report_${site}_${formattedPeriod}.xlsx`);
    
    closeExportPanel();
    
    Swal.fire({
        icon: 'success',
        title: 'Excel Generated',
        text: 'Your report has been downloaded successfully!'
    });
}

// Generate PDF Report
function generatePDFReport() {
    // Get history data
    const history = JSON.parse(localStorage.getItem('fuelEntries') || '[]');

    // Validation
    if (history.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'No Data',
            text: 'Please add fuel entries before generating a report'
        });
        return;
    }

    // Get site and period from the first entry (they should be the same for all entries)
    const firstEntry = history[0];
    const site = firstEntry.site || 'N/A';
    const period = firstEntry.period || 'N/A';

    // Format period if it exists
    let formattedPeriod = period;
    if (period !== 'N/A' && period.includes('-')) {
        const [year, month] = period.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        formattedPeriod = `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    // Build table rows
    let tableRows = '';
    history.forEach((record, index) => {
        tableRows += `
            <tr>
                <td>${index + 1}</td>
                <td>${record.operator || '-'}</td>
                <td>${record.equipment || '-'}</td>
                <td>${record.startTime || '-'}</td>
                <td>${record.endTime || '-'}</td>
                <td>${record.totalHours || '0'}</td>
                <td>${record.liters || '0'}</td>
                <td>${record.consumption || '0'}</td>
            </tr>
        `;
    });

    // Calculate totals
    const totalHours = history.reduce((sum, record) => sum + parseFloat(record.totalHours || 0), 0);
    const totalLiters = history.reduce((sum, record) => sum + parseFloat(record.liters || 0), 0);
    const avgConsumption = totalLiters > 0 && totalHours > 0 ? (totalLiters / totalHours).toFixed(2) : '0.00';

    // Create PDF content
    const pdfContent = `
        <div style="background: white; color: #333; padding: 40px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                <h1 style="margin: 0; color: #333; font-size: 24px;">⛽ FUEL CONSUMPTION REPORT</h1>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
                <div style="flex: 1;">
                    <strong style="color: #333;">Site:</strong>
                    <span style="color: #555;">${site}</span>
                </div>
                <div style="flex: 1;">
                    <strong style="color: #333;">Period:</strong>
                    <span style="color: #555;">${formattedPeriod}</span>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; color: #333;">
                <thead>
                    <tr>
                        <th style="background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">No.</th>
                        <th style="background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Operator</th>
                        <th style="background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Equipment</th>
                        <th style="background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Start Time</th>
                        <th style="background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">End Time</th>
                        <th style="background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Hours</th>
                        <th style="background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Liters</th>
                        <th style="background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Consumption (L/h)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                    <tr style="font-weight: bold; background: #f0f0f0;">
                        <td colspan="5" style="padding: 10px; border: 1px solid #ddd; text-align: right;">TOTALS:</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${totalHours.toFixed(2)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${totalLiters.toFixed(2)}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${avgConsumption}</td>
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
    const pdfContainer = document.getElementById('pdfContent');
    pdfContainer.innerHTML = pdfContent;

    // Generate PDF
    const element = pdfContainer.firstElementChild;
    const opt = {
        margin: 10,
        filename: `Fuel_Report_${site}_${formattedPeriod}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        closeExportPanel();
        Swal.fire({
            icon: 'success',
            title: 'PDF Generated',
            text: 'Your report has been downloaded successfully!'
        });
    });
}
