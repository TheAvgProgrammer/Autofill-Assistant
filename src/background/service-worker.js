/**
 * Background Service Worker for Browser Autofill Assistant
 * 
 * Responsibilities:
 * - Store and manage candidate profiles & Q/A templates
 * - Orchestrate multi-step form filling processes
 * - Log application artifacts and screenshots
 * - Coordinate between popup UI and content scripts
 * - Handle file upload operations
 * 
 * @author Browser Autofill Assistant Team
 * @version 1.0.0
 */

// Extension lifecycle management
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Browser Autofill Assistant installed:', details.reason);
    
    // Initialize default storage structure
    initializeStorage();
    
    // Set up context menu items
    setupContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Browser Autofill Assistant started');
});

/**
 * Initialize storage with default structure and sample data
 */
async function initializeStorage() {
    try {
        const existingData = await chrome.storage.local.get(['profiles', 'templates', 'settings']);
        
        // Initialize profiles if not exists
        if (!existingData.profiles) {
            await chrome.storage.local.set({
                profiles: {
                    default: {
                        id: 'default',
                        name: 'Default Profile',
                        personalInfo: {
                            firstName: '',
                            lastName: '',
                            email: '',
                            phone: '',
                            address: '',
                            city: '',
                            state: '',
                            zipCode: '',
                            country: ''
                        },
                        workInfo: {
                            currentTitle: '',
                            currentCompany: '',
                            yearsExperience: '',
                            desiredSalary: '',
                            availableStartDate: ''
                        },
                        documents: {
                            resumePath: '',
                            coverLetterPath: ''
                        },
                        created: Date.now(),
                        lastModified: Date.now()
                    }
                }
            });
        }
        
        // Initialize answer templates if not exists
        if (!existingData.templates) {
            await chrome.storage.local.set({
                templates: {
                    whyInterested: "I am interested in this position because...",
                    whyQualified: "I am qualified for this role due to my...",
                    careerGoals: "My career goals include...",
                    greatestStrength: "My greatest strength is...",
                    greatestWeakness: "An area I'm working to improve is...",
                    workStyle: "I work best in environments that...",
                    teamwork: "I approach teamwork by...",
                    leadership: "My leadership style focuses on...",
                    challenges: "When facing challenges, I...",
                    motivation: "What motivates me most is..."
                }
            });
        }
        
        // Initialize settings if not exists
        if (!existingData.settings) {
            await chrome.storage.local.set({
                settings: {
                    autoFillEnabled: true,
                    screenshotEnabled: true,
                    debugMode: false,
                    fillDelay: 500, // milliseconds between field fills
                    geminiApiKey: 'AIzaSyBkmQ17R3Ycsko6BufGuHe-m02mfWsai-8', // TODO: Move to secure storage
                    lastUpdated: Date.now()
                }
            });
        }
        
        console.log('Storage initialized successfully');
    } catch (error) {
        console.error('Failed to initialize storage:', error);
    }
}

/**
 * Set up context menu items for quick actions
 */
function setupContextMenus() {
    // TODO: Add context menu items for right-click actions
    chrome.contextMenus.create({
        id: 'autofill-form',
        title: 'Autofill Form Fields',
        contexts: ['page']
    });
    
    chrome.contextMenus.create({
        id: 'capture-screenshot',
        title: 'Capture Application Screenshot',
        contexts: ['page']
    });
}

// Message handling between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.type) {
        case 'GET_PROFILE':
            handleGetProfile(message.profileId, sendResponse);
            return true; // Keep channel open for async response
            
        case 'SAVE_PROFILE':
            handleSaveProfile(message.profile, sendResponse);
            return true;
            
        case 'GET_TEMPLATES':
            handleGetTemplates(sendResponse);
            return true;
            
        case 'SAVE_TEMPLATE':
            handleSaveTemplate(message.key, message.value, sendResponse);
            return true;
            
        case 'START_AUTOFILL':
            handleStartAutofill(sender.tab.id, message.profileId, sendResponse);
            return true;
            
        case 'CAPTURE_SCREENSHOT':
            handleCaptureScreenshot(sender.tab.id, message.data, sendResponse);
            return true;
            
        case 'LOG_APPLICATION':
            handleLogApplication(message.applicationData, sendResponse);
            return true;
            
        case 'UPLOAD_FILE':
            handleFileUpload(message.fileType, message.filePath, sendResponse);
            return true;
            
        default:
            console.warn('Unknown message type:', message.type);
            sendResponse({ success: false, error: 'Unknown message type' });
    }
});

/**
 * Retrieve candidate profile by ID
 */
async function handleGetProfile(profileId = 'default', sendResponse) {
    try {
        const { profiles } = await chrome.storage.local.get(['profiles']);
        const profile = profiles[profileId];
        
        if (profile) {
            sendResponse({ success: true, profile });
        } else {
            sendResponse({ success: false, error: 'Profile not found' });
        }
    } catch (error) {
        console.error('Error getting profile:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Save or update candidate profile
 */
async function handleSaveProfile(profile, sendResponse) {
    try {
        const { profiles } = await chrome.storage.local.get(['profiles']);
        
        profile.lastModified = Date.now();
        if (!profile.created) {
            profile.created = Date.now();
        }
        
        profiles[profile.id] = profile;
        await chrome.storage.local.set({ profiles });
        
        console.log('Profile saved:', profile.id);
        sendResponse({ success: true, profile });
    } catch (error) {
        console.error('Error saving profile:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Retrieve answer templates
 */
async function handleGetTemplates(sendResponse) {
    try {
        const { templates } = await chrome.storage.local.get(['templates']);
        sendResponse({ success: true, templates });
    } catch (error) {
        console.error('Error getting templates:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Save answer template
 */
async function handleSaveTemplate(key, value, sendResponse) {
    try {
        const { templates } = await chrome.storage.local.get(['templates']);
        templates[key] = value;
        await chrome.storage.local.set({ templates });
        
        console.log('Template saved:', key);
        sendResponse({ success: true });
    } catch (error) {
        console.error('Error saving template:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Orchestrate autofill process
 */
async function handleStartAutofill(tabId, profileId, sendResponse) {
    try {
        // Get the profile data
        const { profiles } = await chrome.storage.local.get(['profiles']);
        const profile = profiles[profileId || 'default'];
        
        if (!profile) {
            throw new Error('Profile not found');
        }
        
        // Send profile data to content script
        const result = await chrome.tabs.sendMessage(tabId, {
            type: 'START_AUTOFILL',
            profile: profile
        });
        
        console.log('Autofill initiated for tab:', tabId);
        sendResponse({ success: true, result });
        
    } catch (error) {
        console.error('Error starting autofill:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Capture screenshot and store application data
 */
async function handleCaptureScreenshot(tabId, applicationData, sendResponse) {
    try {
        // Capture screenshot
        const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        
        // Store application log with screenshot
        const logEntry = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            tabId: tabId,
            url: applicationData.url,
            atsType: applicationData.atsType,
            jobTitle: applicationData.jobTitle,
            company: applicationData.company,
            screenshot: screenshot,
            domHash: applicationData.domHash,
            formData: applicationData.formData
        };
        
        // Store in local storage
        const { applicationLogs = [] } = await chrome.storage.local.get(['applicationLogs']);
        applicationLogs.push(logEntry);
        
        // Keep only last 50 applications to manage storage
        if (applicationLogs.length > 50) {
            applicationLogs.splice(0, applicationLogs.length - 50);
        }
        
        await chrome.storage.local.set({ applicationLogs });
        
        console.log('Screenshot captured and application logged');
        sendResponse({ success: true, logId: logEntry.id });
        
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Log application submission data
 */
async function handleLogApplication(applicationData, sendResponse) {
    try {
        const logEntry = {
            ...applicationData,
            id: Date.now().toString(),
            timestamp: Date.now()
        };
        
        const { applicationLogs = [] } = await chrome.storage.local.get(['applicationLogs']);
        applicationLogs.push(logEntry);
        await chrome.storage.local.set({ applicationLogs });
        
        // TODO: Send to backend analytics service
        // await sendToBackend(logEntry);
        
        console.log('Application logged:', logEntry.id);
        sendResponse({ success: true, logId: logEntry.id });
        
    } catch (error) {
        console.error('Error logging application:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle file upload operations
 */
async function handleFileUpload(fileType, filePath, sendResponse) {
    try {
        // TODO: Implement file upload handling
        // This would coordinate with content script to handle file inputs
        console.log('File upload requested:', fileType, filePath);
        
        sendResponse({ 
            success: true, 
            message: 'File upload handling not yet implemented' 
        });
        
    } catch (error) {
        console.error('Error handling file upload:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * TODO: Send application data to backend analytics service
 */
async function sendToBackend(logEntry) {
    // Placeholder for backend integration
    console.log('TODO: Send to backend:', logEntry);
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'autofill-form':
            chrome.tabs.sendMessage(tab.id, { type: 'CONTEXT_AUTOFILL' });
            break;
            
        case 'capture-screenshot':
            handleCaptureScreenshot(tab.id, { url: tab.url }, () => {});
            break;
    }
});

// Tab update handler for ATS detection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Check if this is a potential ATS site
        const atsPatterns = [
            /workday\.com/,
            /greenhouse\.io/,
            /lever\.co/,
            /icims\.com/,
            /taleo\.net/,
            /myworkdayjobs\.com/,
            /bamboohr\.com/,
            /jobvite\.com/,
            /smartrecruiters\.com/,
            /jobs\./,
            /careers\./,
            /apply\./
        ];
        
        if (atsPatterns.some(pattern => pattern.test(tab.url))) {
            console.log('ATS site detected:', tab.url);
            // TODO: Badge notification or other indicator
        }
    }
});

console.log('Browser Autofill Assistant service worker loaded');