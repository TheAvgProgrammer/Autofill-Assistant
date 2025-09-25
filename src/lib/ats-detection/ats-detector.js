/**
 * ATS Detection Module for Browser Autofill Assistant
 * 
 * Detects Applicant Tracking Systems and their versions
 * Supports: Workday, Greenhouse, Lever, iCIMS, Taleo, BambooHR, Jobvite, SmartRecruiters
 * 
 * @author Browser Autofill Assistant Team
 * @version 1.0.0
 */

window.ATSDetector = (function() {
    'use strict';

    // ATS Detection Rules
    const ATS_RULES = {
        workday: {
            name: 'Workday',
            urlPatterns: [
                /workday\.com/i,
                /myworkdayjobs\.com/i
            ],
            domSelectors: [
                '[data-automation-id]',
                '.css-1q2dra3',  // Workday specific classes
                '[data-uxi-element-id]'
            ],
            scriptPatterns: [
                /workday/i,
                /wd-/i
            ],
            metaPatterns: [
                { name: 'generator', content: /workday/i },
                { name: 'application-name', content: /workday/i }
            ]
        },
        
        greenhouse: {
            name: 'Greenhouse',
            urlPatterns: [
                /greenhouse\.io/i,
                /boards\.greenhouse\.io/i
            ],
            domSelectors: [
                '#application_form',
                '.application-form',
                '[data-provides="greenhouse"]'
            ],
            scriptPatterns: [
                /greenhouse/i,
                /grnhse/i
            ],
            metaPatterns: [
                { name: 'generator', content: /greenhouse/i }
            ]
        },
        
        lever: {
            name: 'Lever',
            urlPatterns: [
                /lever\.co/i,
                /jobs\.lever\.co/i
            ],
            domSelectors: [
                '.application-form',
                '[data-qa="btn-apply"]',
                '.posting-apply-button'
            ],
            scriptPatterns: [
                /lever/i,
                /lvr/i
            ],
            metaPatterns: [
                { name: 'generator', content: /lever/i }
            ]
        },
        
        icims: {
            name: 'iCIMS',
            urlPatterns: [
                /icims\.com/i
            ],
            domSelectors: [
                '.iCIMS_InfoMsg',
                '.iCIMS_JobDetail',
                '[id*="icims"]'
            ],
            scriptPatterns: [
                /icims/i,
                /iCIMS/
            ],
            metaPatterns: [
                { name: 'generator', content: /icims/i }
            ]
        },
        
        taleo: {
            name: 'Taleo (Oracle)',
            urlPatterns: [
                /taleo\.net/i,
                /careersection/i
            ],
            domSelectors: [
                '.taleo-form',
                '[id*="taleo"]',
                '.ftlFormContainer'
            ],
            scriptPatterns: [
                /taleo/i,
                /oracle/i
            ],
            metaPatterns: [
                { name: 'generator', content: /taleo/i }
            ]
        },
        
        bamboohr: {
            name: 'BambooHR',
            urlPatterns: [
                /bamboohr\.com/i
            ],
            domSelectors: [
                '.bamboo-application',
                '[data-bamboo]',
                '.BambooHR'
            ],
            scriptPatterns: [
                /bamboohr/i,
                /bamboo/i
            ],
            metaPatterns: [
                { name: 'generator', content: /bamboohr/i }
            ]
        },
        
        jobvite: {
            name: 'Jobvite',
            urlPatterns: [
                /jobvite\.com/i
            ],
            domSelectors: [
                '.jv-form',
                '[data-jv]',
                '.jobvite-form'
            ],
            scriptPatterns: [
                /jobvite/i,
                /jv-/i
            ],
            metaPatterns: [
                { name: 'generator', content: /jobvite/i }
            ]
        },
        
        smartrecruiters: {
            name: 'SmartRecruiters',
            urlPatterns: [
                /smartrecruiters\.com/i
            ],
            domSelectors: [
                '.sr-form',
                '[data-sr]',
                '.smartrecruiters-form'
            ],
            scriptPatterns: [
                /smartrecruiters/i,
                /sr-/i
            ],
            metaPatterns: [
                { name: 'generator', content: /smartrecruiters/i }
            ]
        }
    };

    // Generic job site patterns
    const GENERIC_JOB_PATTERNS = [
        /jobs\./i,
        /careers\./i,
        /apply\./i,
        /hiring\./i,
        /employment\./i,
        /opportunities\./i
    ];

    /**
     * Main detection function
     * @param {string} url - Current page URL
     * @param {string} hostname - Current hostname
     * @param {Document} document - DOM document
     * @returns {string} Detected ATS type or 'unknown'
     */
    function detect(url, hostname, document = window.document) {
        console.log('ATSDetector: Starting detection for:', url);
        
        // Quick URL-based detection first
        const urlDetection = detectByURL(url, hostname);
        if (urlDetection !== 'unknown') {
            console.log('ATSDetector: URL-based detection:', urlDetection);
            return urlDetection;
        }
        
        // DOM-based detection
        const domDetection = detectByDOM(document);
        if (domDetection !== 'unknown') {
            console.log('ATSDetector: DOM-based detection:', domDetection);
            return domDetection;
        }
        
        // Script-based detection
        const scriptDetection = detectByScripts(document);
        if (scriptDetection !== 'unknown') {
            console.log('ATSDetector: Script-based detection:', scriptDetection);
            return scriptDetection;
        }
        
        // Meta tag detection
        const metaDetection = detectByMeta(document);
        if (metaDetection !== 'unknown') {
            console.log('ATSDetector: Meta-based detection:', metaDetection);
            return metaDetection;
        }
        
        // Check if it's a generic job site
        if (isGenericJobSite(url, hostname)) {
            console.log('ATSDetector: Generic job site detected');
            return 'generic';
        }
        
        console.log('ATSDetector: No ATS detected');
        return 'unknown';
    }

    /**
     * Detect ATS by URL patterns
     * @param {string} url - Page URL
     * @param {string} hostname - Hostname
     * @returns {string} ATS type or 'unknown'
     */
    function detectByURL(url, hostname) {
        for (const [atsType, rules] of Object.entries(ATS_RULES)) {
            for (const pattern of rules.urlPatterns) {
                if (pattern.test(url) || pattern.test(hostname)) {
                    return atsType;
                }
            }
        }
        return 'unknown';
    }

    /**
     * Detect ATS by DOM elements
     * @param {Document} document - DOM document
     * @returns {string} ATS type or 'unknown'
     */
    function detectByDOM(document) {
        for (const [atsType, rules] of Object.entries(ATS_RULES)) {
            for (const selector of rules.domSelectors) {
                try {
                    if (document.querySelector(selector)) {
                        return atsType;
                    }
                } catch (error) {
                    console.warn('ATSDetector: Invalid selector:', selector, error);
                }
            }
        }
        return 'unknown';
    }

    /**
     * Detect ATS by loaded scripts
     * @param {Document} document - DOM document
     * @returns {string} ATS type or 'unknown'
     */
    function detectByScripts(document) {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const scriptSources = scripts.map(script => script.src).join(' ');
        
        for (const [atsType, rules] of Object.entries(ATS_RULES)) {
            for (const pattern of rules.scriptPatterns) {
                if (pattern.test(scriptSources)) {
                    return atsType;
                }
            }
        }
        return 'unknown';
    }

    /**
     * Detect ATS by meta tags
     * @param {Document} document - DOM document
     * @returns {string} ATS type or 'unknown'
     */
    function detectByMeta(document) {
        const metaTags = Array.from(document.querySelectorAll('meta[name], meta[property]'));
        
        for (const [atsType, rules] of Object.entries(ATS_RULES)) {
            for (const metaRule of rules.metaPatterns) {
                const matchingTags = metaTags.filter(tag => {
                    const name = tag.getAttribute('name') || tag.getAttribute('property');
                    return name === metaRule.name;
                });
                
                for (const tag of matchingTags) {
                    const content = tag.getAttribute('content') || '';
                    if (metaRule.content.test(content)) {
                        return atsType;
                    }
                }
            }
        }
        return 'unknown';
    }

    /**
     * Check if site appears to be a generic job site
     * @param {string} url - Page URL
     * @param {string} hostname - Hostname
     * @returns {boolean} True if generic job site
     */
    function isGenericJobSite(url, hostname) {
        // Check URL patterns
        const urlMatches = GENERIC_JOB_PATTERNS.some(pattern => 
            pattern.test(url) || pattern.test(hostname)
        );
        
        if (urlMatches) return true;
        
        // Check for common job-related keywords in the page
        const pageText = document.body.textContent.toLowerCase();
        const jobKeywords = [
            'apply now',
            'job application',
            'submit application',
            'career opportunity',
            'job posting',
            'employment',
            'position',
            'vacancy'
        ];
        
        const hasJobKeywords = jobKeywords.some(keyword => 
            pageText.includes(keyword)
        );
        
        // Check for form fields that suggest job application
        const hasApplicationFields = document.querySelector(
            'input[name*="name"], input[name*="email"], input[name*="phone"], ' +
            'input[name*="resume"], input[name*="cover"], textarea[name*="experience"]'
        );
        
        return hasJobKeywords && hasApplicationFields;
    }

    /**
     * Get detailed ATS information
     * @param {string} atsType - Detected ATS type
     * @returns {Object} ATS information object
     */
    function getATSInfo(atsType) {
        if (!atsType || atsType === 'unknown') {
            return {
                type: 'unknown',
                name: 'Unknown ATS',
                confidence: 0,
                features: []
            };
        }
        
        if (atsType === 'generic') {
            return {
                type: 'generic',
                name: 'Generic Job Site',
                confidence: 0.5,
                features: ['basic_forms', 'file_upload']
            };
        }
        
        const atsRule = ATS_RULES[atsType];
        if (!atsRule) {
            return {
                type: atsType,
                name: atsType,
                confidence: 0,
                features: []
            };
        }
        
        return {
            type: atsType,
            name: atsRule.name,
            confidence: 0.9,
            features: getATSFeatures(atsType)
        };
    }

    /**
     * Get known features for an ATS
     * @param {string} atsType - ATS type
     * @returns {Array<string>} Feature list
     */
    function getATSFeatures(atsType) {
        const features = {
            workday: [
                'multi_step_forms',
                'dynamic_fields',
                'file_upload',
                'auto_save',
                'field_validation'
            ],
            greenhouse: [
                'single_page_forms',
                'file_upload',
                'basic_validation',
                'custom_questions'
            ],
            lever: [
                'simple_forms',
                'file_upload',
                'basic_fields',
                'custom_questions'
            ],
            icims: [
                'complex_forms',
                'multi_step',
                'extensive_validation',
                'file_upload'
            ],
            taleo: [
                'legacy_interface',
                'multi_step_forms',
                'complex_navigation',
                'file_upload'
            ],
            bamboohr: [
                'modern_interface',
                'single_page_forms',
                'file_upload'
            ],
            jobvite: [
                'social_integration',
                'modern_forms',
                'file_upload'
            ],
            smartrecruiters: [
                'modern_interface',
                'smart_forms',
                'file_upload',
                'auto_complete'
            ]
        };
        
        return features[atsType] || [];
    }

    /**
     * Detect ATS version (where applicable)
     * @param {string} atsType - ATS type
     * @param {Document} document - DOM document
     * @returns {string} Version information
     */
    function detectVersion(atsType, document = window.document) {
        // TODO: Implement version detection for major ATS platforms
        // This would look for version-specific markers in the DOM or scripts
        
        switch (atsType) {
            case 'workday':
                // Look for Workday version indicators
                const wdVersion = document.querySelector('[data-wd-version]');
                if (wdVersion) {
                    return wdVersion.getAttribute('data-wd-version');
                }
                break;
                
            case 'greenhouse':
                // Look for Greenhouse version indicators
                const ghVersion = document.querySelector('script[src*="greenhouse"]');
                if (ghVersion) {
                    const versionMatch = ghVersion.src.match(/v(\d+)/);
                    if (versionMatch) {
                        return versionMatch[1];
                    }
                }
                break;
                
            // Add version detection for other ATS platforms as needed
        }
        
        return 'unknown';
    }

    /**
     * Get confidence score for detection
     * @param {string} atsType - Detected ATS type
     * @param {string} url - Page URL
     * @param {Document} document - DOM document
     * @returns {number} Confidence score (0-1)
     */
    function getConfidenceScore(atsType, url, document = window.document) {
        if (atsType === 'unknown') return 0;
        if (atsType === 'generic') return 0.5;
        
        let score = 0;
        const rules = ATS_RULES[atsType];
        if (!rules) return 0;
        
        // URL match adds high confidence
        const urlMatch = rules.urlPatterns.some(pattern => pattern.test(url));
        if (urlMatch) score += 0.4;
        
        // DOM match adds medium confidence
        const domMatch = rules.domSelectors.some(selector => {
            try {
                return document.querySelector(selector);
            } catch {
                return false;
            }
        });
        if (domMatch) score += 0.3;
        
        // Script match adds medium confidence
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const scriptSources = scripts.map(script => script.src).join(' ');
        const scriptMatch = rules.scriptPatterns.some(pattern => pattern.test(scriptSources));
        if (scriptMatch) score += 0.2;
        
        // Meta match adds low confidence
        const metaTags = Array.from(document.querySelectorAll('meta[name], meta[property]'));
        const metaMatch = rules.metaPatterns.some(metaRule => {
            return metaTags.some(tag => {
                const name = tag.getAttribute('name') || tag.getAttribute('property');
                const content = tag.getAttribute('content') || '';
                return name === metaRule.name && metaRule.content.test(content);
            });
        });
        if (metaMatch) score += 0.1;
        
        return Math.min(score, 1);
    }

    /**
     * Perform comprehensive ATS analysis
     * @param {string} url - Page URL
     * @param {string} hostname - Hostname
     * @param {Document} document - DOM document
     * @returns {Object} Complete ATS analysis
     */
    function analyze(url, hostname, document = window.document) {
        const atsType = detect(url, hostname, document);
        const atsInfo = getATSInfo(atsType);
        const version = detectVersion(atsType, document);
        const confidence = getConfidenceScore(atsType, url, document);
        
        return {
            type: atsType,
            name: atsInfo.name,
            version: version,
            confidence: confidence,
            features: atsInfo.features,
            timestamp: Date.now(),
            url: url,
            hostname: hostname
        };
    }

    // Public API
    return {
        detect,
        getATSInfo,
        detectVersion,
        getConfidenceScore,
        analyze,
        
        // Utility functions
        isGenericJobSite,
        
        // Constants for external use
        ATS_TYPES: Object.keys(ATS_RULES),
        SUPPORTED_ATS: ATS_RULES
    };
})();

console.log('ATS Detector loaded');