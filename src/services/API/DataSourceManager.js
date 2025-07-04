/* global chrome */

const API_BASE_URL = 'http://127.0.0.1:8000/api';
// const API_BASE_URL = 'https://api.sabapplier.com/api';

// Get all shared data sources available to the user
export const getSharedDataSources = async (userEmail) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/shares/?email=${encodeURIComponent(userEmail)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Filter only accepted shares and extract sender info
        const acceptedShares = data.received_shares?.filter(share => share.status === 'accepted') || [];
        
        return acceptedShares.map(share => ({
            id: share.id,
            senderEmail: share.sender_email,
            senderName: share.sender_email.split('@')[0], // Extract name from email
            sharedAt: share.created_at,
            status: share.status
        }));
    } catch (error) {
        console.error('Error fetching shared data sources:', error);
        throw error;
    }
};

// Get shared data from a specific user
export const getSharedData = async (userEmail, senderEmail) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/share/get-data/?receiver_email=${encodeURIComponent(userEmail)}&sender_email=${encodeURIComponent(senderEmail)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.shared_data;
    } catch (error) {
        console.error('Error fetching shared data:', error);
        throw error;
    }
};

// Switch to shared data source
export const switchToSharedData = async (userEmail, senderEmail) => {
    try {
        const sharedData = await getSharedData(userEmail, senderEmail);
        
        // Store in chrome storage
        if (chrome?.storage?.local) {
            const activeDataSource = {
                source: 'shared',
                senderEmail: senderEmail,
                senderName: senderEmail.split('@')[0],
                data: sharedData,
                switchedAt: new Date().toISOString()
            };
            
            await new Promise((resolve, reject) => {
                chrome.storage.local.set({ 
                    'sabapplier_active_data_source': activeDataSource 
                }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });
        }
        
        return sharedData;
    } catch (error) {
        console.error('Error switching to shared data:', error);
        throw error;
    }
};

// Switch to own data
export const switchToOwnData = async () => {
    try {
        if (chrome?.storage?.local) {
            await new Promise((resolve, reject) => {
                chrome.storage.local.remove('sabapplier_active_data_source', () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error switching to own data:', error);
        throw error;
    }
};

// Get current active data source
export const getActiveDataSource = async () => {
    try {
        if (chrome?.storage?.local) {
            return new Promise((resolve, reject) => {
                chrome.storage.local.get(['sabapplier_active_data_source'], (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result.sabapplier_active_data_source || null);
                    }
                });
            });
        }
        return null;
    } catch (error) {
        console.error('Error getting active data source:', error);
        return null;
    }
};

export default {
    getSharedDataSources,
    getSharedData,
    switchToSharedData,
    switchToOwnData,
    getActiveDataSource
};
