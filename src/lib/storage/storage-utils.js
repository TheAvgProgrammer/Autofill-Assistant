/**
 * Storage Utilities for Browser Autofill Assistant
 * 
 * Provides unified interface for Chrome storage operations
 * Handles profiles, templates, settings, and application logs
 * 
 * @author Browser Autofill Assistant Team
 * @version 1.0.0
 */

window.StorageUtils = (function() {
    'use strict';

    // Storage keys
    const KEYS = {
        PROFILES: 'profiles',
        TEMPLATES: 'templates',
        SETTINGS: 'settings',
        APPLICATION_LOGS: 'applicationLogs',
        FIELD_MAPPINGS: 'fieldMappings'
    };

    /**
     * Get data from storage
     * @param {string|string[]} keys - Storage key(s) to retrieve
     * @returns {Promise<Object>} Retrieved data
     */
    async function get(keys) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                return await chrome.storage.local.get(keys);
            } else {
                // Fallback to localStorage for testing
                const result = {};
                const keyArray = Array.isArray(keys) ? keys : [keys];
                
                for (const key of keyArray) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        result[key] = JSON.parse(value);
                    }
                }
                
                return result;
            }
        } catch (error) {
            console.error('Storage get error:', error);
            throw error;
        }
    }

    /**
     * Set data in storage
     * @param {Object} items - Key-value pairs to store
     * @returns {Promise<void>}
     */
    async function set(items) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set(items);
            } else {
                // Fallback to localStorage for testing
                for (const [key, value] of Object.entries(items)) {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            }
        } catch (error) {
            console.error('Storage set error:', error);
            throw error;
        }
    }

    /**
     * Remove data from storage
     * @param {string|string[]} keys - Key(s) to remove
     * @returns {Promise<void>}
     */
    async function remove(keys) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.remove(keys);
            } else {
                // Fallback to localStorage for testing
                const keyArray = Array.isArray(keys) ? keys : [keys];
                for (const key of keyArray) {
                    localStorage.removeItem(key);
                }
            }
        } catch (error) {
            console.error('Storage remove error:', error);
            throw error;
        }
    }

    /**
     * Clear all storage data
     * @returns {Promise<void>}
     */
    async function clear() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.clear();
            } else {
                localStorage.clear();
            }
        } catch (error) {
            console.error('Storage clear error:', error);
            throw error;
        }
    }

    /**
     * Get user profile by ID
     * @param {string} profileId - Profile identifier
     * @returns {Promise<Object|null>} Profile data or null if not found
     */
    async function getProfile(profileId = 'default') {
        try {
            const { profiles = {} } = await get(KEYS.PROFILES);
            return profiles[profileId] || null;
        } catch (error) {
            console.error('Error getting profile:', error);
            return null;
        }
    }

    /**
     * Save user profile
     * @param {Object} profile - Profile data to save
     * @returns {Promise<boolean>} Success status
     */
    async function saveProfile(profile) {
        try {
            const { profiles = {} } = await get(KEYS.PROFILES);
            
            // Ensure profile has required fields
            if (!profile.id) {
                profile.id = 'default';
            }
            
            profile.lastModified = Date.now();
            if (!profile.created) {
                profile.created = Date.now();
            }
            
            profiles[profile.id] = profile;
            await set({ [KEYS.PROFILES]: profiles });
            
            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            return false;
        }
    }

    /**
     * Delete user profile
     * @param {string} profileId - Profile identifier
     * @returns {Promise<boolean>} Success status
     */
    async function deleteProfile(profileId) {
        try {
            const { profiles = {} } = await get(KEYS.PROFILES);
            
            if (profiles[profileId]) {
                delete profiles[profileId];
                await set({ [KEYS.PROFILES]: profiles });
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error deleting profile:', error);
            return false;
        }
    }

    /**
     * Get all profiles
     * @returns {Promise<Object>} All profiles
     */
    async function getAllProfiles() {
        try {
            const { profiles = {} } = await get(KEYS.PROFILES);
            return profiles;
        } catch (error) {
            console.error('Error getting all profiles:', error);
            return {};
        }
    }

    /**
     * Get answer templates
     * @returns {Promise<Object>} Answer templates
     */
    async function getTemplates() {
        try {
            const { templates = {} } = await get(KEYS.TEMPLATES);
            return templates;
        } catch (error) {
            console.error('Error getting templates:', error);
            return {};
        }
    }

    /**
     * Save answer template
     * @param {string} key - Template key
     * @param {string} value - Template value
     * @returns {Promise<boolean>} Success status
     */
    async function saveTemplate(key, value) {
        try {
            const { templates = {} } = await get(KEYS.TEMPLATES);
            templates[key] = value;
            await set({ [KEYS.TEMPLATES]: templates });
            return true;
        } catch (error) {
            console.error('Error saving template:', error);
            return false;
        }
    }

    /**
     * Delete answer template
     * @param {string} key - Template key
     * @returns {Promise<boolean>} Success status
     */
    async function deleteTemplate(key) {
        try {
            const { templates = {} } = await get(KEYS.TEMPLATES);
            
            if (templates[key]) {
                delete templates[key];
                await set({ [KEYS.TEMPLATES]: templates });
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error deleting template:', error);
            return false;
        }
    }

    /**
     * Get application settings
     * @returns {Promise<Object>} Settings object
     */
    async function getSettings() {
        try {
            const { settings = {} } = await get(KEYS.SETTINGS);
            
            // Provide default settings
            return {
                autoFillEnabled: true,
                screenshotEnabled: true,
                debugMode: false,
                fillDelay: 500,
                geminiApiKey: 'AIzaSyBkmQ17R3Ycsko6BufGuHe-m02mfWsai-8',
                ...settings
            };
        } catch (error) {
            console.error('Error getting settings:', error);
            return {
                autoFillEnabled: true,
                screenshotEnabled: true,
                debugMode: false,
                fillDelay: 500,
                geminiApiKey: 'AIzaSyBkmQ17R3Ycsko6BufGuHe-m02mfWsai-8'
            };
        }
    }

    /**
     * Save application settings
     * @param {Object} settings - Settings to save
     * @returns {Promise<boolean>} Success status
     */
    async function saveSettings(settings) {
        try {
            const currentSettings = await getSettings();
            const updatedSettings = {
                ...currentSettings,
                ...settings,
                lastUpdated: Date.now()
            };
            
            await set({ [KEYS.SETTINGS]: updatedSettings });
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    /**
     * Get application logs
     * @param {number} limit - Maximum number of logs to retrieve
     * @returns {Promise<Array>} Application logs
     */
    async function getApplicationLogs(limit = 50) {
        try {
            const { applicationLogs = [] } = await get(KEYS.APPLICATION_LOGS);
            
            // Sort by timestamp (newest first) and limit
            return applicationLogs
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting application logs:', error);
            return [];
        }
    }

    /**
     * Save application log entry
     * @param {Object} logEntry - Log entry to save
     * @returns {Promise<boolean>} Success status
     */
    async function saveApplicationLog(logEntry) {
        try {
            const { applicationLogs = [] } = await get(KEYS.APPLICATION_LOGS);
            
            // Add timestamp if not provided
            if (!logEntry.timestamp) {
                logEntry.timestamp = Date.now();
            }
            
            // Ensure unique ID
            if (!logEntry.id) {
                logEntry.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            }
            
            applicationLogs.push(logEntry);
            
            // Keep only last 100 entries to manage storage space
            if (applicationLogs.length > 100) {
                applicationLogs.splice(0, applicationLogs.length - 100);
            }
            
            await set({ [KEYS.APPLICATION_LOGS]: applicationLogs });
            return true;
        } catch (error) {
            console.error('Error saving application log:', error);
            return false;
        }
    }

    /**
     * Clear application logs
     * @returns {Promise<boolean>} Success status
     */
    async function clearApplicationLogs() {
        try {
            await set({ [KEYS.APPLICATION_LOGS]: [] });
            return true;
        } catch (error) {
            console.error('Error clearing application logs:', error);
            return false;
        }
    }

    /**
     * Get field mappings for ATS platforms
     * @param {string} atsType - ATS platform type
     * @returns {Promise<Object>} Field mappings
     */
    async function getFieldMappings(atsType) {
        try {
            const { fieldMappings = {} } = await get(KEYS.FIELD_MAPPINGS);
            return fieldMappings[atsType] || {};
        } catch (error) {
            console.error('Error getting field mappings:', error);
            return {};
        }
    }

    /**
     * Save field mappings for ATS platform
     * @param {string} atsType - ATS platform type
     * @param {Object} mappings - Field mappings
     * @returns {Promise<boolean>} Success status
     */
    async function saveFieldMappings(atsType, mappings) {
        try {
            const { fieldMappings = {} } = await get(KEYS.FIELD_MAPPINGS);
            fieldMappings[atsType] = mappings;
            await set({ [KEYS.FIELD_MAPPINGS]: fieldMappings });
            return true;
        } catch (error) {
            console.error('Error saving field mappings:', error);
            return false;
        }
    }

    /**
     * Export all data (for backup)
     * @returns {Promise<Object>} All stored data
     */
    async function exportData() {
        try {
            const allData = await get([
                KEYS.PROFILES,
                KEYS.TEMPLATES,
                KEYS.SETTINGS,
                KEYS.APPLICATION_LOGS,
                KEYS.FIELD_MAPPINGS
            ]);
            
            return {
                ...allData,
                exportTimestamp: Date.now(),
                version: '1.0.0'
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    /**
     * Import data (from backup)
     * @param {Object} data - Data to import
     * @param {boolean} merge - Whether to merge with existing data
     * @returns {Promise<boolean>} Success status
     */
    async function importData(data, merge = false) {
        try {
            if (merge) {
                // Merge with existing data
                const existingData = await get([
                    KEYS.PROFILES,
                    KEYS.TEMPLATES,
                    KEYS.SETTINGS,
                    KEYS.APPLICATION_LOGS,
                    KEYS.FIELD_MAPPINGS
                ]);
                
                const mergedData = {};
                
                for (const key of Object.keys(KEYS)) {
                    const storageKey = KEYS[key];
                    mergedData[storageKey] = {
                        ...existingData[storageKey],
                        ...data[storageKey]
                    };
                }
                
                await set(mergedData);
            } else {
                // Replace existing data
                await clear();
                await set(data);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {Promise<Object>} Storage usage stats
     */
    async function getStorageInfo() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const usage = await chrome.storage.local.getBytesInUse();
                const quota = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB default
                
                return {
                    used: usage,
                    quota: quota,
                    available: quota - usage,
                    percentUsed: (usage / quota) * 100
                };
            } else {
                // Approximate for localStorage
                let totalSize = 0;
                for (const key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        totalSize += localStorage[key].length;
                    }
                }
                
                return {
                    used: totalSize,
                    quota: 10485760, // 10MB typical localStorage limit
                    available: 10485760 - totalSize,
                    percentUsed: (totalSize / 10485760) * 100
                };
            }
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {
                used: 0,
                quota: 0,
                available: 0,
                percentUsed: 0
            };
        }
    }

    // Public API
    return {
        // Basic operations
        get,
        set,
        remove,
        clear,
        
        // Profile management
        getProfile,
        saveProfile,
        deleteProfile,
        getAllProfiles,
        
        // Template management
        getTemplates,
        saveTemplate,
        deleteTemplate,
        
        // Settings management
        getSettings,
        saveSettings,
        
        // Application logs
        getApplicationLogs,
        saveApplicationLog,
        clearApplicationLogs,
        
        // Field mappings
        getFieldMappings,
        saveFieldMappings,
        
        // Data management
        exportData,
        importData,
        getStorageInfo,
        
        // Constants
        KEYS
    };
})();

console.log('Storage utilities loaded');