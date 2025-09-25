/**
 * Popup JavaScript for Browser Autofill Assistant
 * 
 * Handles the extension popup interface and user interactions
 * Communicates with background script and content scripts
 * 
 * @author Browser Autofill Assistant Team
 * @version 1.0.0
 */

(function() {
    'use strict';

    // Global state
    let currentTab = null;
    let currentProfile = null;
    let detectedFields = [];
    let currentSettings = {};
    let templates = {};

    // DOM elements
    const elements = {};

    // Initialize popup when DOM is loaded
    document.addEventListener('DOMContentLoaded', initializePopup);

    /**
     * Initialize the popup interface
     */
    async function initializePopup() {
        console.log('Initializing popup interface');
        
        try {
            // Cache DOM elements
            cacheElements();
            
            // Set up event listeners
            setupEventListeners();
            
            // Load initial data
            await loadInitialData();
            
            // Update interface
            await updateInterface();
            
            // Start periodic updates
            startPeriodicUpdates();
            
            console.log('Popup initialization complete');
        } catch (error) {
            console.error('Error initializing popup:', error);
            showToast('Failed to initialize extension', 'error');
        }
    }

    /**
     * Cache frequently used DOM elements
     */
    function cacheElements() {
        // Navigation tabs
        elements.navTabs = document.querySelectorAll('.nav-tab');
        elements.tabContents = document.querySelectorAll('.tab-content');
        
        // Status elements
        elements.statusIndicator = document.getElementById('statusIndicator');
        elements.statusDot = elements.statusIndicator.querySelector('.status-dot');
        elements.statusText = elements.statusIndicator.querySelector('.status-text');
        
        // Page info elements
        elements.atsName = document.getElementById('atsName');
        elements.confidenceBadge = document.getElementById('confidenceBadge');
        elements.companyName = document.getElementById('companyName');
        elements.jobTitle = document.getElementById('jobTitle');
        
        // Action buttons
        elements.fillBtn = document.getElementById('fillBtn');
        elements.analyzeBtn = document.getElementById('analyzeBtn');
        elements.nextStepBtn = document.getElementById('nextStepBtn');
        elements.screenshotBtn = document.getElementById('screenshotBtn');
        
        // Field summary
        elements.fieldSummary = document.getElementById('fieldSummary');
        elements.fieldList = document.getElementById('fieldList');
        
        // Activity log
        elements.logEntries = document.getElementById('logEntries');
        
        // Profile form elements
        elements.profileForm = {
            firstName: document.getElementById('firstName'),
            lastName: document.getElementById('lastName'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            address: document.getElementById('address'),
            city: document.getElementById('city'),
            state: document.getElementById('state'),
            zipCode: document.getElementById('zipCode'),
            country: document.getElementById('country'),
            currentTitle: document.getElementById('currentTitle'),
            currentCompany: document.getElementById('currentCompany'),
            yearsExperience: document.getElementById('yearsExperience'),
            desiredSalary: document.getElementById('desiredSalary'),
            availableStartDate: document.getElementById('availableStartDate'),
            resumePath: document.getElementById('resumePath'),
            coverLetterPath: document.getElementById('coverLetterPath')
        };
        
        // Profile buttons
        elements.saveProfileBtn = document.getElementById('saveProfileBtn');
        elements.clearProfileBtn = document.getElementById('clearProfileBtn');
        
        // Template elements
        elements.templateList = document.getElementById('templateList');
        elements.templateEditor = document.getElementById('templateEditor');
        elements.addTemplateBtn = document.getElementById('addTemplateBtn');
        elements.closeEditorBtn = document.getElementById('closeEditorBtn');
        elements.saveTemplateBtn = document.getElementById('saveTemplateBtn');
        elements.deleteTemplateBtn = document.getElementById('deleteTemplateBtn');
        
        // Settings elements
        elements.settingsForm = {
            autoFillEnabled: document.getElementById('autoFillEnabled'),
            screenshotEnabled: document.getElementById('screenshotEnabled'),
            debugMode: document.getElementById('debugMode'),
            fillDelay: document.getElementById('fillDelay'),
            geminiApiKey: document.getElementById('geminiApiKey')
        };
        
        elements.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        elements.exportDataBtn = document.getElementById('exportDataBtn');
        elements.importDataBtn = document.getElementById('importDataBtn');
        elements.clearAllDataBtn = document.getElementById('clearAllDataBtn');
        
        // Usage stats
        elements.usageStats = document.getElementById('usageStats');
        elements.dailyUsage = document.getElementById('dailyUsage');
        elements.cacheHits = document.getElementById('cacheHits');
        
        // Storage info
        elements.storageInfo = document.getElementById('storageInfo');
        elements.storageUsed = document.getElementById('storageUsed');
        elements.storageText = document.getElementById('storageText');
        
        // Utility elements
        elements.loadingOverlay = document.getElementById('loadingOverlay');
        elements.toastContainer = document.getElementById('toastContainer');
        elements.importFileInput = document.getElementById('importFileInput');
    }

    /**
     * Set up event listeners for all interactive elements
     */
    function setupEventListeners() {
        // Navigation tabs
        elements.navTabs.forEach(tab => {
            tab.addEventListener('click', handleTabClick);
        });
        
        // Action buttons
        elements.fillBtn.addEventListener('click', handleFillForm);
        elements.analyzeBtn.addEventListener('click', handleAnalyzeFields);
        elements.nextStepBtn.addEventListener('click', handleNextStep);
        elements.screenshotBtn.addEventListener('click', handleScreenshot);
        
        // Profile form
        elements.saveProfileBtn.addEventListener('click', handleSaveProfile);
        elements.clearProfileBtn.addEventListener('click', handleClearProfile);
        
        // Profile form auto-save on change
        Object.values(elements.profileForm).forEach(input => {
            if (input) {
                input.addEventListener('input', debounce(handleProfileChange, 1000));
            }
        });
        
        // Template management
        elements.addTemplateBtn.addEventListener('click', handleAddTemplate);
        elements.closeEditorBtn.addEventListener('click', handleCloseEditor);
        elements.saveTemplateBtn.addEventListener('click', handleSaveTemplate);
        elements.deleteTemplateBtn.addEventListener('click', handleDeleteTemplate);
        
        // Settings
        elements.saveSettingsBtn.addEventListener('click', handleSaveSettings);
        elements.exportDataBtn.addEventListener('click', handleExportData);
        elements.importDataBtn.addEventListener('click', handleImportData);
        elements.clearAllDataBtn.addEventListener('click', handleClearAllData);
        elements.importFileInput.addEventListener('change', handleFileImport);
        
        // Settings auto-save
        Object.values(elements.settingsForm).forEach(input => {
            if (input) {
                input.addEventListener('change', debounce(handleSettingsChange, 500));
            }
        });
    }

    /**
     * Load initial data from storage and content script
     */
    async function loadInitialData() {
        showLoading(true);
        
        try {
            // Get current tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            currentTab = tabs[0];
            
            // Load profile data
            const profileResponse = await chrome.runtime.sendMessage({
                type: 'GET_PROFILE',
                profileId: 'default'
            });
            
            if (profileResponse.success) {
                currentProfile = profileResponse.profile;
                populateProfileForm(currentProfile);
            }
            
            // Load templates
            const templatesResponse = await chrome.runtime.sendMessage({
                type: 'GET_TEMPLATES'
            });
            
            if (templatesResponse.success) {
                templates = templatesResponse.templates;
                updateTemplateList();
            }
            
            // Load settings (assuming we have a storage utility)
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const { settings } = await chrome.storage.local.get(['settings']);
                if (settings) {
                    currentSettings = settings;
                    populateSettingsForm(settings);
                }
            }
            
            // Detect current page ATS
            await detectCurrentPageATS();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            showToast('Error loading extension data', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Update the interface based on current state
     */
    async function updateInterface() {
        try {
            await updatePageInfo();
            await updateUsageStats();
            await updateStorageInfo();
            updateActivityLog();
        } catch (error) {
            console.error('Error updating interface:', error);
        }
    }

    /**
     * Detect ATS on current page
     */
    async function detectCurrentPageATS() {
        if (!currentTab) return;
        
        try {
            // Send message to content script to detect ATS
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                type: 'DETECT_ATS'
            });
            
            if (response && response.atsType) {
                updateATSDisplay(response.atsType, response.confidence || 0.5);
            } else {
                // Fallback: analyze URL
                const atsType = analyzeURLForATS(currentTab.url);
                updateATSDisplay(atsType, 0.3);
            }
        } catch (error) {
            console.error('Error detecting ATS:', error);
            updateATSDisplay('unknown', 0);
        }
    }

    /**
     * Analyze URL for ATS indicators (fallback)
     */
    function analyzeURLForATS(url) {
        if (!url) return 'unknown';
        
        const hostname = new URL(url).hostname.toLowerCase();
        
        if (hostname.includes('workday.com') || hostname.includes('myworkdayjobs.com')) {
            return 'workday';
        } else if (hostname.includes('greenhouse.io')) {
            return 'greenhouse';
        } else if (hostname.includes('lever.co')) {
            return 'lever';
        } else if (hostname.includes('icims.com')) {
            return 'icims';
        } else if (hostname.includes('taleo.net')) {
            return 'taleo';
        } else if (hostname.includes('bamboohr.com')) {
            return 'bamboohr';
        } else if (hostname.includes('jobvite.com')) {
            return 'jobvite';
        } else if (hostname.includes('smartrecruiters.com')) {
            return 'smartrecruiters';
        } else if (url.includes('jobs.') || url.includes('careers.') || url.includes('apply.')) {
            return 'generic';
        }
        
        return 'unknown';
    }

    /**
     * Update ATS display in UI
     */
    function updateATSDisplay(atsType, confidence) {
        const atsNames = {
            workday: 'Workday',
            greenhouse: 'Greenhouse',
            lever: 'Lever',
            icims: 'iCIMS',
            taleo: 'Taleo',
            bamboohr: 'BambooHR',
            jobvite: 'Jobvite',
            smartrecruiters: 'SmartRecruiters',
            generic: 'Generic Job Site',
            unknown: 'Unknown'
        };
        
        elements.atsName.textContent = atsNames[atsType] || 'Unknown';
        
        // Update confidence badge
        const confidencePercent = Math.round(confidence * 100);
        elements.confidenceBadge.textContent = `${confidencePercent}%`;
        
        // Update badge color based on confidence
        elements.confidenceBadge.className = 'confidence-badge';
        if (confidence >= 0.8) {
            elements.confidenceBadge.classList.add('high');
        } else if (confidence >= 0.5) {
            elements.confidenceBadge.classList.add('medium');
        } else {
            elements.confidenceBadge.classList.add('low');
        }
        
        // Update status
        if (atsType !== 'unknown') {
            updateStatus('ready', 'ATS Detected');
        } else {
            updateStatus('warning', 'No ATS Detected');
        }
    }

    /**
     * Update page info display
     */
    async function updatePageInfo() {
        if (!currentTab) return;
        
        try {
            // Try to extract job info from page
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                type: 'GET_PAGE_INFO'
            });
            
            if (response && response.success) {
                elements.companyName.textContent = response.company || 'Unknown Company';
                elements.jobTitle.textContent = response.jobTitle || 'Unknown Position';
            } else {
                // Fallback to tab title
                const title = currentTab.title || 'Unknown Page';
                const parts = title.split(/[-|–]/);
                
                if (parts.length >= 2) {
                    elements.jobTitle.textContent = parts[0].trim();
                    elements.companyName.textContent = parts[1].trim();
                } else {
                    elements.jobTitle.textContent = title;
                    elements.companyName.textContent = new URL(currentTab.url).hostname;
                }
            }
        } catch (error) {
            console.error('Error updating page info:', error);
            elements.companyName.textContent = 'Unknown Company';
            elements.jobTitle.textContent = 'Unknown Position';
        }
    }

    /**
     * Update status indicator
     */
    function updateStatus(type, text) {
        elements.statusDot.className = `status-dot ${type}`;
        elements.statusText.textContent = text;
    }

    /**
     * Handle tab navigation
     */
    function handleTabClick(event) {
        const targetTab = event.target.dataset.tab;
        if (!targetTab) return;
        
        // Update active tab
        elements.navTabs.forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
        
        // Update active content
        elements.tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(targetTab + 'Tab').classList.add('active');
        
        // Load tab-specific data
        loadTabData(targetTab);
    }

    /**
     * Load data for specific tab
     */
    async function loadTabData(tabName) {
        switch (tabName) {
            case 'actions':
                await updateInterface();
                break;
            case 'profile':
                // Profile data already loaded
                break;
            case 'templates':
                await loadTemplates();
                break;
            case 'settings':
                await updateUsageStats();
                await updateStorageInfo();
                break;
        }
    }

    /**
     * Handle fill form action
     */
    async function handleFillForm() {
        if (!currentTab) {
            showToast('No active tab found', 'error');
            return;
        }
        
        showLoading(true);
        updateStatus('working', 'Filling Form...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'START_AUTOFILL',
                profileId: 'default'
            });
            
            if (response.success) {
                showToast('Form filling started', 'success');
                updateStatus('ready', 'Form Filled');
                logActivity('Form autofill initiated');
            } else {
                showToast('Failed to fill form: ' + (response.error || 'Unknown error'), 'error');
                updateStatus('error', 'Fill Failed');
            }
        } catch (error) {
            console.error('Error filling form:', error);
            showToast('Error filling form', 'error');
            updateStatus('error', 'Fill Failed');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Handle analyze fields action
     */
    async function handleAnalyzeFields() {
        if (!currentTab) {
            showToast('No active tab found', 'error');
            return;
        }
        
        showLoading(true);
        updateStatus('working', 'Analyzing...');
        
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                type: 'ANALYZE_FIELDS'
            });
            
            if (response && response.success) {
                detectedFields = response.fields || [];
                updateFieldSummary(detectedFields);
                showToast(`Found ${detectedFields.length} form fields`, 'success');
                updateStatus('ready', 'Analysis Complete');
                logActivity(`Analyzed ${detectedFields.length} form fields`);
            } else {
                showToast('Failed to analyze fields', 'error');
                updateStatus('error', 'Analysis Failed');
            }
        } catch (error) {
            console.error('Error analyzing fields:', error);
            showToast('Error analyzing fields', 'error');
            updateStatus('error', 'Analysis Failed');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Handle next step action
     */
    async function handleNextStep() {
        if (!currentTab) {
            showToast('No active tab found', 'error');
            return;
        }
        
        showLoading(true);
        updateStatus('working', 'Navigating...');
        
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, {
                type: 'NAVIGATE_NEXT'
            });
            
            if (response && response.success) {
                showToast('Navigated to next step', 'success');
                updateStatus('ready', 'Step Complete');
                logActivity('Navigated to next application step');
            } else {
                showToast('No next step found', 'warning');
                updateStatus('warning', 'No Next Step');
            }
        } catch (error) {
            console.error('Error navigating to next step:', error);
            showToast('Error navigating', 'error');
            updateStatus('error', 'Navigation Failed');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Handle screenshot action
     */
    async function handleScreenshot() {
        if (!currentTab) {
            showToast('No active tab found', 'error');
            return;
        }
        
        showLoading(true);
        updateStatus('working', 'Capturing...');
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CAPTURE_SCREENSHOT',
                data: {
                    url: currentTab.url,
                    title: currentTab.title
                }
            });
            
            if (response.success) {
                showToast('Screenshot captured', 'success');
                updateStatus('ready', 'Screenshot Saved');
                logActivity('Application screenshot captured');
            } else {
                showToast('Failed to capture screenshot', 'error');
                updateStatus('error', 'Screenshot Failed');
            }
        } catch (error) {
            console.error('Error capturing screenshot:', error);
            showToast('Error capturing screenshot', 'error');
            updateStatus('error', 'Screenshot Failed');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Update field summary display
     */
    function updateFieldSummary(fields) {
        if (!fields || fields.length === 0) {
            elements.fieldSummary.style.display = 'none';
            return;
        }
        
        elements.fieldSummary.style.display = 'block';
        elements.fieldList.innerHTML = '';
        
        fields.forEach(field => {
            const fieldItem = document.createElement('div');
            fieldItem.className = 'field-item';
            
            const fieldName = field.label || field.name || field.id || 'Unnamed Field';
            const fieldPurpose = field.purpose || 'unknown';
            const confidence = Math.round((field.confidence || 0) * 100);
            
            fieldItem.innerHTML = `
                <div class="field-info">
                    <div class="field-name">${fieldName}</div>
                    <div class="field-purpose">${fieldPurpose}</div>
                </div>
                <div class="field-confidence">${confidence}%</div>
            `;
            
            elements.fieldList.appendChild(fieldItem);
        });
    }

    /**
     * Populate profile form with data
     */
    function populateProfileForm(profile) {
        if (!profile) return;
        
        const { personalInfo = {}, workInfo = {}, documents = {} } = profile;
        
        // Personal information
        if (elements.profileForm.firstName) elements.profileForm.firstName.value = personalInfo.firstName || '';
        if (elements.profileForm.lastName) elements.profileForm.lastName.value = personalInfo.lastName || '';
        if (elements.profileForm.email) elements.profileForm.email.value = personalInfo.email || '';
        if (elements.profileForm.phone) elements.profileForm.phone.value = personalInfo.phone || '';
        if (elements.profileForm.address) elements.profileForm.address.value = personalInfo.address || '';
        if (elements.profileForm.city) elements.profileForm.city.value = personalInfo.city || '';
        if (elements.profileForm.state) elements.profileForm.state.value = personalInfo.state || '';
        if (elements.profileForm.zipCode) elements.profileForm.zipCode.value = personalInfo.zipCode || '';
        if (elements.profileForm.country) elements.profileForm.country.value = personalInfo.country || '';
        
        // Work information
        if (elements.profileForm.currentTitle) elements.profileForm.currentTitle.value = workInfo.currentTitle || '';
        if (elements.profileForm.currentCompany) elements.profileForm.currentCompany.value = workInfo.currentCompany || '';
        if (elements.profileForm.yearsExperience) elements.profileForm.yearsExperience.value = workInfo.yearsExperience || '';
        if (elements.profileForm.desiredSalary) elements.profileForm.desiredSalary.value = workInfo.desiredSalary || '';
        if (elements.profileForm.availableStartDate) elements.profileForm.availableStartDate.value = workInfo.availableStartDate || '';
        
        // Documents
        if (elements.profileForm.resumePath) elements.profileForm.resumePath.value = documents.resumePath || '';
        if (elements.profileForm.coverLetterPath) elements.profileForm.coverLetterPath.value = documents.coverLetterPath || '';
    }

    /**
     * Handle profile form changes (auto-save)
     */
    function handleProfileChange() {
        // Auto-save profile data
        handleSaveProfile(false); // false = don't show toast
    }

    /**
     * Handle save profile
     */
    async function handleSaveProfile(showNotification = true) {
        showLoading(true);
        
        try {
            const profileData = {
                id: 'default',
                name: 'Default Profile',
                personalInfo: {
                    firstName: elements.profileForm.firstName?.value || '',
                    lastName: elements.profileForm.lastName?.value || '',
                    email: elements.profileForm.email?.value || '',
                    phone: elements.profileForm.phone?.value || '',
                    address: elements.profileForm.address?.value || '',
                    city: elements.profileForm.city?.value || '',
                    state: elements.profileForm.state?.value || '',
                    zipCode: elements.profileForm.zipCode?.value || '',
                    country: elements.profileForm.country?.value || ''
                },
                workInfo: {
                    currentTitle: elements.profileForm.currentTitle?.value || '',
                    currentCompany: elements.profileForm.currentCompany?.value || '',
                    yearsExperience: elements.profileForm.yearsExperience?.value || '',
                    desiredSalary: elements.profileForm.desiredSalary?.value || '',
                    availableStartDate: elements.profileForm.availableStartDate?.value || ''
                },
                documents: {
                    resumePath: elements.profileForm.resumePath?.value || '',
                    coverLetterPath: elements.profileForm.coverLetterPath?.value || ''
                }
            };
            
            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_PROFILE',
                profile: profileData
            });
            
            if (response.success) {
                currentProfile = response.profile;
                if (showNotification) {
                    showToast('Profile saved successfully', 'success');
                    logActivity('Profile updated');
                }
            } else {
                showToast('Failed to save profile', 'error');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('Error saving profile', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Handle clear profile
     */
    function handleClearProfile() {
        if (confirm('Are you sure you want to clear all profile data?')) {
            Object.values(elements.profileForm).forEach(input => {
                if (input) input.value = '';
            });
            handleSaveProfile();
            logActivity('Profile cleared');
        }
    }

    /**
     * Load and update template list
     */
    async function loadTemplates() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_TEMPLATES'
            });
            
            if (response.success) {
                templates = response.templates;
                updateTemplateList();
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    /**
     * Update template list display
     */
    function updateTemplateList() {
        elements.templateList.innerHTML = '';
        
        Object.entries(templates).forEach(([key, template]) => {
            const templateItem = document.createElement('div');
            templateItem.className = 'template-item';
            templateItem.dataset.templateKey = key;
            
            const templateName = formatTemplateName(key);
            const preview = template.template ? template.template.substring(0, 100) + '...' : '';
            
            templateItem.innerHTML = `
                <div class="template-name">${templateName}</div>
                <div class="template-category">${template.category || 'general'}</div>
                <div class="template-preview">${preview}</div>
            `;
            
            templateItem.addEventListener('click', () => editTemplate(key, template));
            elements.templateList.appendChild(templateItem);
        });
    }

    /**
     * Format template name for display
     */
    function formatTemplateName(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Handle add new template
     */
    function handleAddTemplate() {
        editTemplate('', {
            template: '',
            category: 'custom',
            variables: []
        });
    }

    /**
     * Edit template in editor
     */
    function editTemplate(key, template) {
        elements.templateEditor.style.display = 'block';
        
        document.getElementById('editorTitle').textContent = key ? 'Edit Template' : 'Add Template';
        document.getElementById('templateKey').value = key;
        document.getElementById('templateCategory').value = template.category || 'custom';
        document.getElementById('templateContent').value = template.template || '';
        
        elements.deleteTemplateBtn.style.display = key ? 'inline-block' : 'none';
        
        // Scroll to editor
        elements.templateEditor.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Handle close template editor
     */
    function handleCloseEditor() {
        elements.templateEditor.style.display = 'none';
    }

    /**
     * Handle save template
     */
    async function handleSaveTemplate() {
        const key = document.getElementById('templateKey').value;
        const category = document.getElementById('templateCategory').value;
        const content = document.getElementById('templateContent').value;
        
        if (!key || !content) {
            showToast('Please fill in template name and content', 'warning');
            return;
        }
        
        showLoading(true);
        
        try {
            // Extract variables from template content
            const variables = [];
            const variableMatches = content.match(/\{([^}]+)\}/g);
            if (variableMatches) {
                for (const match of variableMatches) {
                    const variable = match.slice(1, -1);
                    if (!variables.includes(variable)) {
                        variables.push(variable);
                    }
                }
            }
            
            const templateData = {
                template: content,
                category: category,
                variables: variables,
                lastModified: Date.now()
            };
            
            const response = await chrome.runtime.sendMessage({
                type: 'SAVE_TEMPLATE',
                key: key,
                value: templateData
            });
            
            if (response.success) {
                templates[key] = templateData;
                updateTemplateList();
                handleCloseEditor();
                showToast('Template saved successfully', 'success');
                logActivity(`Template "${key}" saved`);
            } else {
                showToast('Failed to save template', 'error');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            showToast('Error saving template', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Handle delete template
     */
    async function handleDeleteTemplate() {
        const key = document.getElementById('templateKey').value;
        
        if (!key || !confirm(`Are you sure you want to delete the template "${key}"?`)) {
            return;
        }
        
        showLoading(true);
        
        try {
            // TODO: Implement delete template in background script
            delete templates[key];
            updateTemplateList();
            handleCloseEditor();
            showToast('Template deleted', 'success');
            logActivity(`Template "${key}" deleted`);
        } catch (error) {
            console.error('Error deleting template:', error);
            showToast('Error deleting template', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Populate settings form
     */
    function populateSettingsForm(settings) {
        if (elements.settingsForm.autoFillEnabled) elements.settingsForm.autoFillEnabled.checked = settings.autoFillEnabled !== false;
        if (elements.settingsForm.screenshotEnabled) elements.settingsForm.screenshotEnabled.checked = settings.screenshotEnabled !== false;
        if (elements.settingsForm.debugMode) elements.settingsForm.debugMode.checked = settings.debugMode === true;
        if (elements.settingsForm.fillDelay) elements.settingsForm.fillDelay.value = settings.fillDelay || 500;
        if (elements.settingsForm.geminiApiKey) elements.settingsForm.geminiApiKey.value = settings.geminiApiKey || '';
    }

    /**
     * Handle settings change (auto-save)
     */
    function handleSettingsChange() {
        handleSaveSettings(false); // false = don't show toast
    }

    /**
     * Handle save settings
     */
    async function handleSaveSettings(showNotification = true) {
        showLoading(true);
        
        try {
            const settingsData = {
                autoFillEnabled: elements.settingsForm.autoFillEnabled?.checked !== false,
                screenshotEnabled: elements.settingsForm.screenshotEnabled?.checked !== false,
                debugMode: elements.settingsForm.debugMode?.checked === true,
                fillDelay: parseInt(elements.settingsForm.fillDelay?.value) || 500,
                geminiApiKey: elements.settingsForm.geminiApiKey?.value || ''
            };
            
            await chrome.storage.local.set({ settings: settingsData });
            currentSettings = settingsData;
            
            if (showNotification) {
                showToast('Settings saved successfully', 'success');
                logActivity('Settings updated');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Error saving settings', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Handle export data
     */
    async function handleExportData() {
        showLoading(true);
        
        try {
            // Get all data from storage
            const data = await chrome.storage.local.get(null);
            
            // Create export object
            const exportData = {
                ...data,
                exportTimestamp: Date.now(),
                version: '1.0.0'
            };
            
            // Create and download file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `autofill-assistant-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            showToast('Data exported successfully', 'success');
            logActivity('Data exported');
        } catch (error) {
            console.error('Error exporting data:', error);
            showToast('Error exporting data', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Handle import data
     */
    function handleImportData() {
        elements.importFileInput.click();
    }

    /**
     * Handle file import
     */
    async function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        showLoading(true);
        
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            // Validate import data
            if (!importData.version) {
                throw new Error('Invalid export file format');
            }
            
            // Confirm import
            if (!confirm('This will replace all current data. Are you sure?')) {
                return;
            }
            
            // Import data
            await chrome.storage.local.clear();
            await chrome.storage.local.set(importData);
            
            // Reload interface
            await loadInitialData();
            await updateInterface();
            
            showToast('Data imported successfully', 'success');
            logActivity('Data imported from file');
        } catch (error) {
            console.error('Error importing data:', error);
            showToast('Error importing data: ' + error.message, 'error');
        } finally {
            showLoading(false);
            event.target.value = ''; // Clear file input
        }
    }

    /**
     * Handle clear all data
     */
    async function handleClearAllData() {
        if (!confirm('This will delete ALL extension data. Are you sure?')) {
            return;
        }
        
        if (!confirm('This action cannot be undone. Really delete all data?')) {
            return;
        }
        
        showLoading(true);
        
        try {
            await chrome.storage.local.clear();
            
            // Reset interface
            Object.values(elements.profileForm).forEach(input => {
                if (input) input.value = '';
            });
            
            templates = {};
            updateTemplateList();
            
            showToast('All data cleared', 'success');
            logActivity('All data cleared');
        } catch (error) {
            console.error('Error clearing data:', error);
            showToast('Error clearing data', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Update usage statistics
     */
    async function updateUsageStats() {
        // TODO: Get actual usage stats from LLM client
        elements.dailyUsage.textContent = `0 / 1500`;
        elements.cacheHits.textContent = `0`;
    }

    /**
     * Update storage information
     */
    async function updateStorageInfo() {
        try {
            const usage = await chrome.storage.local.getBytesInUse();
            const quota = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB
            
            const usedMB = (usage / 1024 / 1024).toFixed(2);
            const quotaMB = (quota / 1024 / 1024).toFixed(2);
            const percentage = (usage / quota) * 100;
            
            elements.storageUsed.style.width = `${percentage}%`;
            elements.storageText.textContent = `${usedMB} MB used of ${quotaMB} MB available`;
        } catch (error) {
            console.error('Error updating storage info:', error);
        }
    }

    /**
     * Log activity to activity log
     */
    function logActivity(message) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const time = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        logEntry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-text">${message}</span>
        `;
        
        elements.logEntries.insertBefore(logEntry, elements.logEntries.firstChild);
        
        // Keep only last 10 entries
        while (elements.logEntries.children.length > 10) {
            elements.logEntries.removeChild(elements.logEntries.lastChild);
        }
    }

    /**
     * Update activity log
     */
    function updateActivityLog() {
        // Initial log entry
        logActivity('Extension ready');
    }

    /**
     * Start periodic updates
     */
    function startPeriodicUpdates() {
        // Update page info every 30 seconds
        setInterval(updatePageInfo, 30000);
        
        // Update usage stats every 5 minutes
        setInterval(updateUsageStats, 300000);
    }

    /**
     * Show/hide loading overlay
     */
    function showLoading(show) {
        elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        elements.toastContainer.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }

    /**
     * Debounce function to limit frequent calls
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Log popup initialization
    console.log('Popup script loaded');
})();