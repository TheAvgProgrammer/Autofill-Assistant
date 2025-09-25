/**
 * Content Script for Browser Autofill Assistant
 * 
 * Responsibilities:
 * - Detect ATS platforms and form structures
 * - Read and analyze DOM fields
 * - Perform autofill operations with natural timing
 * - Navigate multi-step application processes
 * - Handle file upload prompts
 * - Capture screenshots and DOM hashes
 * 
 * @author Browser Autofill Assistant Team
 * @version 1.0.0
 */

// Global state management
let currentProfile = null;
let atsType = null;
let isAutofillActive = false;
let formFields = [];
let currentStep = 1;
let totalSteps = 1;

// Initialize content script when DOM is ready
(function initialize() {
    console.log('Browser Autofill Assistant content script loaded');
    
    // Detect ATS platform
    detectATSPlatform();
    
    // Set up mutation observer for dynamic content
    setupMutationObserver();
    
    // Add visual indicators and UI enhancements
    injectAutofillUI();
    
    // Listen for form changes and navigation
    setupFormListeners();
    
    console.log('Content script initialization complete');
})();

/**
 * Detect the current ATS platform based on URL and DOM elements
 */
function detectATSPlatform() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    
    // Use imported ATS detector
    if (window.ATSDetector) {
        atsType = window.ATSDetector.detect(url, hostname, document);
    } else {
        // Fallback detection
        atsType = fallbackATSDetection(url, hostname);
    }
    
    console.log('ATS platform detected:', atsType);
    
    // Store detection result
    sessionStorage.setItem('atsType', atsType);
    
    return atsType;
}

/**
 * Fallback ATS detection when detector module isn't available
 */
function fallbackATSDetection(url, hostname) {
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
 * Set up mutation observer to detect dynamic content changes
 */
function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
        let shouldReanalyze = false;
        
        for (const mutation of mutations) {
            // Check for added form fields
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes);
                const hasFormElements = addedNodes.some(node => 
                    node.nodeType === Node.ELEMENT_NODE && (
                        node.tagName === 'FORM' ||
                        node.querySelector && (
                            node.querySelector('input') ||
                            node.querySelector('select') ||
                            node.querySelector('textarea')
                        )
                    )
                );
                
                if (hasFormElements) {
                    shouldReanalyze = true;
                    break;
                }
            }
        }
        
        if (shouldReanalyze) {
            console.log('DOM changes detected, re-analyzing form fields');
            setTimeout(() => analyzeFormFields(), 1000);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Inject visual indicators and UI enhancements
 */
function injectAutofillUI() {
    // Create floating action button
    const fab = document.createElement('div');
    fab.id = 'autofill-fab';
    fab.innerHTML = '🤖';
    fab.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: #4285f4;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10000;
        font-size: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;
    
    fab.addEventListener('click', () => {
        showQuickActions();
    });
    
    fab.addEventListener('mouseenter', () => {
        fab.style.transform = 'scale(1.1)';
    });
    
    fab.addEventListener('mouseleave', () => {
        fab.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(fab);
}

/**
 * Show quick action menu
 */
function showQuickActions() {
    const existingMenu = document.getElementById('autofill-quick-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.id = 'autofill-quick-menu';
    menu.innerHTML = `
        <div style="background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); padding: 10px; min-width: 200px;">
            <div class="menu-item" data-action="analyze">🔍 Analyze Form</div>
            <div class="menu-item" data-action="autofill">✍️ Auto Fill</div>
            <div class="menu-item" data-action="screenshot">📸 Screenshot</div>
            <div class="menu-item" data-action="next-step">➡️ Next Step</div>
        </div>
    `;
    
    menu.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 10001;
    `;
    
    // Add menu item styles
    const style = document.createElement('style');
    style.textContent = `
        .menu-item {
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 4px;
            margin: 2px 0;
            transition: background 0.2s;
        }
        .menu-item:hover {
            background: #f0f0f0;
        }
    `;
    document.head.appendChild(style);
    
    // Add click handlers
    menu.addEventListener('click', (e) => {
        if (e.target.classList.contains('menu-item')) {
            const action = e.target.dataset.action;
            handleQuickAction(action);
            menu.remove();
        }
    });
    
    document.body.appendChild(menu);
    
    // Remove menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function removeMenu(e) {
            if (!menu.contains(e.target) && e.target.id !== 'autofill-fab') {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            }
        });
    }, 100);
}

/**
 * Handle quick action clicks
 */
function handleQuickAction(action) {
    switch (action) {
        case 'analyze':
            analyzeFormFields();
            break;
        case 'autofill':
            startAutofillProcess();
            break;
        case 'screenshot':
            captureApplicationScreenshot();
            break;
        case 'next-step':
            navigateToNextStep();
            break;
    }
}

/**
 * Set up form event listeners
 */
function setupFormListeners() {
    // Listen for form submissions
    document.addEventListener('submit', (e) => {
        console.log('Form submission detected');
        
        if (isAutofillActive) {
            captureSubmissionData(e.target);
        }
    });
    
    // Listen for file input changes
    document.addEventListener('change', (e) => {
        if (e.target.type === 'file') {
            console.log('File input detected:', e.target);
            handleFileInputDetection(e.target);
        }
    });
    
    // Listen for page navigation
    window.addEventListener('beforeunload', () => {
        if (isAutofillActive) {
            captureApplicationScreenshot();
        }
    });
}

/**
 * Analyze all form fields on the current page
 */
function analyzeFormFields() {
    console.log('Analyzing form fields...');
    
    formFields = [];
    
    // Find all forms
    const forms = document.querySelectorAll('form');
    
    forms.forEach((form, formIndex) => {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach((input, inputIndex) => {
            const fieldInfo = analyzeField(input, formIndex, inputIndex);
            if (fieldInfo) {
                formFields.push(fieldInfo);
            }
        });
    });
    
    // Also check for fields outside forms (common in SPAs)
    const standaloneInputs = document.querySelectorAll('input:not(form input), select:not(form select), textarea:not(form textarea)');
    standaloneInputs.forEach((input, index) => {
        const fieldInfo = analyzeField(input, -1, index);
        if (fieldInfo) {
            formFields.push(fieldInfo);
        }
    });
    
    console.log(`Found ${formFields.length} form fields:`, formFields);
    
    // Use field mapper if available
    if (window.FieldMapper) {
        formFields = window.FieldMapper.mapFields(formFields, atsType);
    }
    
    return formFields;
}

/**
 * Analyze individual form field
 */
function analyzeField(element, formIndex, inputIndex) {
    if (!element || !element.type) return null;
    
    // Skip hidden and disabled fields
    if (element.type === 'hidden' || element.disabled) return null;
    
    const fieldInfo = {
        element: element,
        formIndex: formIndex,
        inputIndex: inputIndex,
        type: element.type,
        name: element.name || '',
        id: element.id || '',
        placeholder: element.placeholder || '',
        label: '',
        required: element.required,
        value: element.value || '',
        options: []
    };
    
    // Get associated label
    fieldInfo.label = getFieldLabel(element);
    
    // Get select options
    if (element.tagName === 'SELECT') {
        fieldInfo.options = Array.from(element.options).map(opt => ({
            value: opt.value,
            text: opt.textContent
        }));
    }
    
    // Determine field purpose using heuristics
    fieldInfo.purpose = determineFieldPurpose(fieldInfo);
    
    return fieldInfo;
}

/**
 * Get the label associated with a form field
 */
function getFieldLabel(element) {
    // Try to find associated label
    let label = '';
    
    // Method 1: Label with 'for' attribute
    if (element.id) {
        const labelEl = document.querySelector(`label[for="${element.id}"]`);
        if (labelEl) {
            label = labelEl.textContent.trim();
        }
    }
    
    // Method 2: Closest label parent
    if (!label) {
        const parentLabel = element.closest('label');
        if (parentLabel) {
            label = parentLabel.textContent.replace(element.value || '', '').trim();
        }
    }
    
    // Method 3: Previous sibling label
    if (!label) {
        let sibling = element.previousElementSibling;
        while (sibling && !label) {
            if (sibling.tagName === 'LABEL' || sibling.textContent.trim()) {
                label = sibling.textContent.trim();
                break;
            }
            sibling = sibling.previousElementSibling;
        }
    }
    
    // Method 4: Closest div with text content
    if (!label) {
        const container = element.closest('div, td, span');
        if (container) {
            const textNodes = Array.from(container.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
                .map(node => node.textContent.trim());
            
            if (textNodes.length > 0) {
                label = textNodes[0];
            }
        }
    }
    
    return label;
}

/**
 * Determine the purpose of a form field using heuristics
 */
function determineFieldPurpose(fieldInfo) {
    const text = `${fieldInfo.name} ${fieldInfo.id} ${fieldInfo.placeholder} ${fieldInfo.label}`.toLowerCase();
    
    // Personal information patterns
    if (text.includes('first') && text.includes('name')) return 'firstName';
    if (text.includes('last') && text.includes('name')) return 'lastName';
    if (text.includes('full') && text.includes('name')) return 'fullName';
    if (text.includes('email')) return 'email';
    if (text.includes('phone')) return 'phone';
    if (text.includes('address') && !text.includes('email')) return 'address';
    if (text.includes('city')) return 'city';
    if (text.includes('state') || text.includes('province')) return 'state';
    if (text.includes('zip') || text.includes('postal')) return 'zipCode';
    if (text.includes('country')) return 'country';
    
    // Work information patterns
    if (text.includes('current') && (text.includes('title') || text.includes('position'))) return 'currentTitle';
    if (text.includes('current') && text.includes('company')) return 'currentCompany';
    if (text.includes('experience') && text.includes('year')) return 'yearsExperience';
    if (text.includes('salary')) return 'desiredSalary';
    if (text.includes('start') && text.includes('date')) return 'availableStartDate';
    
    // Common question patterns
    if (text.includes('why') && text.includes('interested')) return 'whyInterested';
    if (text.includes('why') && text.includes('qualified')) return 'whyQualified';
    if (text.includes('cover') && text.includes('letter')) return 'coverLetter';
    if (text.includes('additional') && text.includes('information')) return 'additionalInfo';
    
    // File upload patterns
    if (fieldInfo.type === 'file') {
        if (text.includes('resume') || text.includes('cv')) return 'resumeUpload';
        if (text.includes('cover') && text.includes('letter')) return 'coverLetterUpload';
        return 'fileUpload';
    }
    
    return 'unknown';
}

/**
 * Start the autofill process
 */
async function startAutofillProcess() {
    console.log('Starting autofill process...');
    
    try {
        // Get profile from background script
        const response = await chrome.runtime.sendMessage({
            type: 'GET_PROFILE',
            profileId: 'default'
        });
        
        if (response.success) {
            currentProfile = response.profile;
            isAutofillActive = true;
            
            // Analyze fields if not already done
            if (formFields.length === 0) {
                analyzeFormFields();
            }
            
            // Fill fields with delay
            await fillFormFields();
            
            console.log('Autofill process completed');
        } else {
            console.error('Failed to get profile:', response.error);
        }
    } catch (error) {
        console.error('Error in autofill process:', error);
    }
}

/**
 * Fill form fields with profile data
 */
async function fillFormFields() {
    if (!currentProfile || formFields.length === 0) {
        console.warn('No profile or form fields available');
        return;
    }
    
    console.log('Filling form fields...');
    
    for (const field of formFields) {
        try {
            const value = getValueForField(field);
            if (value) {
                await fillField(field, value);
                // Add natural delay between fields
                await sleep(300 + Math.random() * 200);
            }
        } catch (error) {
            console.error('Error filling field:', field.purpose, error);
        }
    }
}

/**
 * Get the appropriate value for a form field based on profile
 */
function getValueForField(field) {
    if (!currentProfile) return null;
    
    const { personalInfo, workInfo } = currentProfile;
    
    switch (field.purpose) {
        case 'firstName':
            return personalInfo.firstName;
        case 'lastName':
            return personalInfo.lastName;
        case 'fullName':
            return `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
        case 'email':
            return personalInfo.email;
        case 'phone':
            return personalInfo.phone;
        case 'address':
            return personalInfo.address;
        case 'city':
            return personalInfo.city;
        case 'state':
            return personalInfo.state;
        case 'zipCode':
            return personalInfo.zipCode;
        case 'country':
            return personalInfo.country;
        case 'currentTitle':
            return workInfo.currentTitle;
        case 'currentCompany':
            return workInfo.currentCompany;
        case 'yearsExperience':
            return workInfo.yearsExperience;
        case 'desiredSalary':
            return workInfo.desiredSalary;
        case 'availableStartDate':
            return workInfo.availableStartDate;
        default:
            return null;
    }
}

/**
 * Fill individual form field with natural interaction
 */
async function fillField(field, value) {
    const element = field.element;
    
    if (!element || !value) return;
    
    // Scroll into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(200);
    
    // Focus the element
    element.focus();
    await sleep(100);
    
    // Handle different field types
    switch (field.type) {
        case 'select-one':
        case 'select-multiple':
            selectOption(element, value);
            break;
            
        case 'checkbox':
        case 'radio':
            if (shouldSelectOption(field, value)) {
                element.checked = true;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
            break;
            
        default:
            // Text inputs and textareas
            await typeText(element, value);
            break;
    }
    
    // Add visual feedback
    highlightField(element);
}

/**
 * Type text with natural timing
 */
async function typeText(element, text) {
    // Clear existing value
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Type character by character for natural feel
    for (let i = 0; i < text.length; i++) {
        element.value += text[i];
        element.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(50 + Math.random() * 50);
    }
    
    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Select option from dropdown
 */
function selectOption(selectElement, value) {
    const options = Array.from(selectElement.options);
    
    // Try exact match first
    let option = options.find(opt => opt.value === value || opt.textContent.trim() === value);
    
    // Try partial match
    if (!option) {
        option = options.find(opt => 
            opt.textContent.toLowerCase().includes(value.toLowerCase()) ||
            value.toLowerCase().includes(opt.textContent.toLowerCase().trim())
        );
    }
    
    if (option) {
        selectElement.value = option.value;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

/**
 * Determine if a checkbox/radio option should be selected
 */
function shouldSelectOption(field, value) {
    // This is a placeholder - more sophisticated logic needed
    const text = `${field.label} ${field.name}`.toLowerCase();
    const val = value.toLowerCase();
    
    return text.includes(val) || val.includes('yes') || val.includes('true');
}

/**
 * Highlight field after filling
 */
function highlightField(element) {
    const originalBorder = element.style.border;
    element.style.border = '2px solid #4CAF50';
    element.style.transition = 'border 0.3s ease';
    
    setTimeout(() => {
        element.style.border = originalBorder;
    }, 1000);
}

/**
 * Navigate to next step in multi-step forms
 */
function navigateToNextStep() {
    console.log('Attempting to navigate to next step...');
    
    // Common next button selectors
    const nextSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Next")',
        'button:contains("Continue")',
        'button:contains("Submit")',
        '.next-button',
        '.continue-button',
        '#next-btn',
        '#continue-btn'
    ];
    
    for (const selector of nextSelectors) {
        const button = document.querySelector(selector);
        if (button && button.offsetParent !== null) { // Check if visible
            console.log('Found next button:', button);
            button.click();
            return true;
        }
    }
    
    console.warn('No next button found');
    return false;
}

/**
 * Handle file input detection
 */
function handleFileInputDetection(fileInput) {
    console.log('File input detected:', fileInput);
    
    const fieldInfo = analyzeField(fileInput, -1, -1);
    
    // Check if we have file paths in profile
    if (currentProfile && currentProfile.documents) {
        let filePath = null;
        
        if (fieldInfo.purpose === 'resumeUpload') {
            filePath = currentProfile.documents.resumePath;
        } else if (fieldInfo.purpose === 'coverLetterUpload') {
            filePath = currentProfile.documents.coverLetterPath;
        }
        
        if (filePath) {
            // TODO: Implement file selection
            console.log('Would upload file:', filePath);
            // This requires user interaction or additional permissions
        }
    }
    
    // Show file upload prompt
    showFileUploadPrompt(fileInput, fieldInfo.purpose);
}

/**
 * Show file upload prompt to user
 */
function showFileUploadPrompt(fileInput, purpose) {
    const prompt = document.createElement('div');
    prompt.innerHTML = `
        <div style="background: #fff; border: 2px solid #4285f4; border-radius: 8px; padding: 15px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10002; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <h3>File Upload Required</h3>
            <p>Please upload your ${purpose === 'resumeUpload' ? 'resume' : 'cover letter'}</p>
            <button onclick="this.parentElement.parentElement.remove()">Got it</button>
        </div>
    `;
    document.body.appendChild(prompt);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (prompt.parentElement) {
            prompt.remove();
        }
    }, 5000);
}

/**
 * Capture screenshot and application data
 */
async function captureApplicationScreenshot() {
    try {
        const applicationData = {
            url: window.location.href,
            atsType: atsType,
            jobTitle: extractJobTitle(),
            company: extractCompanyName(),
            domHash: generateDOMHash(),
            formData: formFields.map(field => ({
                purpose: field.purpose,
                value: field.element.value,
                filled: !!field.element.value
            }))
        };
        
        const response = await chrome.runtime.sendMessage({
            type: 'CAPTURE_SCREENSHOT',
            data: applicationData
        });
        
        if (response.success) {
            console.log('Screenshot captured:', response.logId);
            showNotification('Screenshot captured successfully!');
        }
    } catch (error) {
        console.error('Error capturing screenshot:', error);
    }
}

/**
 * Extract job title from page
 */
function extractJobTitle() {
    const titleSelectors = [
        'h1',
        '.job-title',
        '.position-title',
        '[data-automation-id="jobPostingHeader"]',
        '.posting-headline'
    ];
    
    for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            return element.textContent.trim();
        }
    }
    
    return document.title || 'Unknown Job';
}

/**
 * Extract company name from page
 */
function extractCompanyName() {
    const companySelectors = [
        '.company-name',
        '.employer-name',
        '[data-automation-id="company"]',
        '.posting-company'
    ];
    
    for (const selector of companySelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            return element.textContent.trim();
        }
    }
    
    return window.location.hostname || 'Unknown Company';
}

/**
 * Generate simple DOM hash for change detection
 */
function generateDOMHash() {
    const formHTML = Array.from(document.querySelectorAll('form'))
        .map(form => form.innerHTML)
        .join('');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < formHTML.length; i++) {
        const char = formHTML.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
}

/**
 * Capture form submission data
 */
function captureSubmissionData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    console.log('Form submission data captured:', data);
    
    // Send to background for logging
    chrome.runtime.sendMessage({
        type: 'LOG_APPLICATION',
        applicationData: {
            url: window.location.href,
            atsType: atsType,
            jobTitle: extractJobTitle(),
            company: extractCompanyName(),
            formData: data,
            timestamp: Date.now()
        }
    });
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10003;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Utility function for delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Message listener for background script communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    switch (message.type) {
        case 'START_AUTOFILL':
            currentProfile = message.profile;
            startAutofillProcess().then(() => {
                sendResponse({ success: true });
            }).catch(error => {
                sendResponse({ success: false, error: error.message });
            });
            return true;
            
        case 'ANALYZE_FIELDS':
            const fields = analyzeFormFields();
            sendResponse({ success: true, fields });
            break;
            
        case 'NAVIGATE_NEXT':
            const success = navigateToNextStep();
            sendResponse({ success });
            break;
            
        case 'CONTEXT_AUTOFILL':
            startAutofillProcess();
            break;
            
        default:
            sendResponse({ success: false, error: 'Unknown message type' });
    }
});

console.log('Content script ready');