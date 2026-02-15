// QR Code Share Functionality
// Allows users to share the Fleet Manager app via QR code

/**
 * Open the QR code share modal
 */
function openShareQRModal() {
    const modal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
    generateQRCode();
    modal.show();
}

/**
 * Generate QR code for the app URL using API
 */
function generateQRCode() {
    // Get the current app URL
    const appUrl = window.location.href;
    
    // Set the input field value
    document.getElementById('appUrlInput').value = appUrl;
    
    // Use QR Server API to generate QR code
    try {
        const encodedUrl = encodeURIComponent(appUrl);
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedUrl}&color=000000&bgcolor=FFFFFF`;
        
        const container = document.getElementById('qrCodeContainer');
        container.innerHTML = `<img src="${qrApiUrl}" alt="QR Code" style="border-radius: 8px; max-width: 256px;">`;
        
        // Store the API URL for download
        window.currentQRUrl = qrApiUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        document.getElementById('qrCodeContainer').innerHTML = 
            '<p style="color: var(--text-secondary);">Error generating QR code. Please try again.</p>';
    }
}

/**
 * Copy app URL to clipboard
 */
function copyAppUrl() {
    const urlInput = document.getElementById('appUrlInput');
    const url = urlInput.value;
    
    navigator.clipboard.writeText(url).then(() => {
        // Show success feedback
        const button = event.target.closest('button');
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.disabled = true;
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback: select text and copy
        urlInput.select();
        document.execCommand('copy');
        showNotification('Link copied to clipboard!', 'success');
    });
}

/**
 * Download QR code as image
 */
function downloadQRCode() {
    try {
        if (!window.currentQRUrl) {
            showNotification('QR code not found. Please try again.', 'error');
            return;
        }
        
        // Download the QR code image
        const link = document.createElement('a');
        link.href = window.currentQRUrl;
        link.download = `Fleet-Manager-QR-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('QR code downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading QR code:', error);
        showNotification('Failed to download QR code. Please try again.', 'error');
    }
}

/**
 * Share using native share API if available
 */
function shareAppNative() {
    const appUrl = window.location.href;
    const shareData = {
        title: 'Fleet Manager',
        text: 'Check out Fleet Manager - Fuel Consumption Tracker',
        url: appUrl
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(err => console.error('Share failed:', err));
    } else {
        showNotification('Share not supported on this device', 'info');
    }
}
