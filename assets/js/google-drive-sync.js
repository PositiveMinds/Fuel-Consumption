/**
 * Google Drive Sync Manager
 * Handles photo uploads to Google Drive and stores metadata in IndexedDB
 */

class GoogleDriveSyncManager {
    constructor() {
        this.isAuthenticated = false;
        this.accessToken = null;
        this.folderId = null; // Fleet Manager folder in Drive
    }

    async init() {
        // Get stored folder ID and auth token from google-sheets-sync
        const storedFolderId = await db.getSetting('googleDriveFolderId');
        if (storedFolderId) {
            this.folderId = storedFolderId;
        }
    }

    async ensureFolder() {
        if (this.folderId) return this.folderId;

        try {
            const folderName = 'Fuel Consumption Photos'; // Change this to your desired folder name
            
            // Check if folder exists
            const response = await this.driveApiCall('GET', 
                `https://www.googleapis.com/drive/v3/files?q=name=%27${encodeURIComponent(folderName)}%27%20and%20trashed=false&spaces=drive&pageSize=1&fields=files(id,name)`
            );

            if (response.files && response.files.length > 0) {
                this.folderId = response.files[0].id;
            } else {
                // Create folder
                const createResponse = await this.driveApiCall('POST',
                    'https://www.googleapis.com/drive/v3/files?fields=id',
                    {
                        name: folderName,
                        mimeType: 'application/vnd.google-apps.folder'
                    }
                );
                this.folderId = createResponse.id;
            }

            // Save folder ID
            await db.setSetting('googleDriveFolderId', this.folderId);
            return this.folderId;
        } catch (error) {
            console.error('Error ensuring Drive folder:', error);
            throw error;
        }
    }

    async uploadPhoto(file, entryId) {
        try {
            // Get access token from google-sheets-sync
            const accessToken = await db.getSetting('googleSheetsAccessToken');
            if (!accessToken) {
                throw new Error('Not authenticated with Google');
            }

            // Ensure folder exists
            const folderId = await this.ensureFolder();

            // Upload file to Drive
            const formData = new FormData();
            
            // Add metadata
            const metadata = {
                name: `${entryId}_${Date.now()}_${file.name}`,
                mimeType: file.type,
                parents: [folderId]
            };
            
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', file);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink,mimeType,createdTime',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(`Drive upload failed: ${response.statusText}`);
            }

            const driveFile = await response.json();

            // Store photo metadata in IndexedDB
            const photoRecord = {
                id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                entryId: entryId,
                driveFileId: driveFile.id,
                driveLink: driveFile.webViewLink,
                downloadLink: driveFile.webContentLink,
                fileName: metadata.name,
                mimeType: driveFile.mimeType,
                uploadedAt: driveFile.createdTime,
                thumbnailUrl: await this.getThumbnailUrl(driveFile.id)
            };

            await this.addPhotoRecord(photoRecord);
            return photoRecord;
        } catch (error) {
            console.error('Error uploading photo to Drive:', error);
            throw error;
        }
    }

    async driveApiCall(method, url, data = null) {
        const accessToken = await db.getSetting('googleSheetsAccessToken');
        
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Drive API error: ${response.statusText}`);
        }

        return await response.json();
    }

    async getThumbnailUrl(fileId) {
        const accessToken = await db.getSetting('googleSheetsAccessToken');
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
    }

    async addPhotoRecord(photoRecord) {
        await db.initPromise;
        
        if (!db.useIndexedDB) {
            let photos = JSON.parse(localStorage.getItem('photos') || '[]');
            photos.push(photoRecord);
            localStorage.setItem('photos', JSON.stringify(photos));
            return photoRecord.id;
        }

        return new Promise((resolve) => {
            const transaction = db.db.transaction([STORES.photos], 'readwrite');
            const store = transaction.objectStore(STORES.photos);
            const request = store.add(photoRecord);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error adding photo:', request.error);
                resolve(null);
            };
        });
    }

    async getPhotosByEntryId(entryId) {
        await db.initPromise;

        if (!db.useIndexedDB) {
            const photos = JSON.parse(localStorage.getItem('photos') || '[]');
            return photos.filter(p => p.entryId === entryId);
        }

        return new Promise((resolve) => {
            const transaction = db.db.transaction([STORES.photos], 'readonly');
            const store = transaction.objectStore(STORES.photos);
            const index = store.index('entryId');
            const request = index.getAll(entryId);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                resolve([]);
            };
        });
    }

    async deletePhoto(photoId) {
        try {
            const photo = await this.getPhotoById(photoId);
            if (!photo) return false;

            // Delete from Drive
            const accessToken = await db.getSetting('googleSheetsAccessToken');
            await fetch(`https://www.googleapis.com/drive/v3/files/${photo.driveFileId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            // Delete from IndexedDB
            await db.initPromise;
            
            if (!db.useIndexedDB) {
                let photos = JSON.parse(localStorage.getItem('photos') || '[]');
                photos = photos.filter(p => p.id !== photoId);
                localStorage.setItem('photos', JSON.stringify(photos));
                return true;
            }

            return new Promise((resolve) => {
                const transaction = db.db.transaction([STORES.photos], 'readwrite');
                const store = transaction.objectStore(STORES.photos);
                const request = store.delete(photoId);

                request.onsuccess = () => {
                    resolve(true);
                };

                request.onerror = () => {
                    resolve(false);
                };
            });
        } catch (error) {
            console.error('Error deleting photo:', error);
            return false;
        }
    }

    async getPhotoById(photoId) {
        await db.initPromise;

        if (!db.useIndexedDB) {
            const photos = JSON.parse(localStorage.getItem('photos') || '[]');
            return photos.find(p => p.id === photoId) || null;
        }

        return new Promise((resolve) => {
            const transaction = db.db.transaction([STORES.photos], 'readonly');
            const store = transaction.objectStore(STORES.photos);
            const request = store.get(photoId);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                resolve(null);
            };
        });
    }
}

// Create global instance
const googleDriveSync = new GoogleDriveSyncManager();

// Initialize on load
window.addEventListener('load', () => {
    googleDriveSync.init();
});
