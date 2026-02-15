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
 * Generate QR code for the app URL
 */
function generateQRCode() {
    // Get the current app URL
    const appUrl = window.location.href;
    
    // Set the input field value
    document.getElementById('appUrlInput').value = appUrl;
    
    // Clear previous QR code
    const canvas = document.getElementById('qrCanvas');
    canvas.innerHTML = '';
    
    // Generate new QR code
    try {
        new QRCode({
            text: appUrl,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#FFFFFF',
            correctLevel: QRCode.CorrectLevel.H,
            canvas: canvas
        });
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
        // Get the canvas element
        const canvas = document.getElementById('qrCanvas');
        
        // If it's a container, get the canvas inside it
        let qrCanvas = canvas;
        if (!canvas.tagName || canvas.tagName !== 'CANVAS') {
            qrCanvas = canvas.querySelector('canvas');
        }
        
        if (!qrCanvas) {
            showNotification('QR code not found. Please try again.', 'error');
            return;
        }
        
        // Convert canvas to blob and download
        qrCanvas.toBlob(function(blob) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Fleet-Manager-QR-${new Date().getTime()}.png`;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            
            showNotification('QR code downloaded successfully!', 'success');
        });
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
