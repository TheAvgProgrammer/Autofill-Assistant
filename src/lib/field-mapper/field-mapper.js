/**
 * Field Mapper for Browser Autofill Assistant
 * 
 * Maps form fields to profile data using:
 * 1. ATS-specific rules
 * 2. Heuristic analysis
 * 3. LLM fallback for ambiguous cases
 * 
 * @author Browser Autofill Assistant Team
 * @version 1.0.0
 */

window.FieldMapper = (function() {
    'use strict';

    // ATS-specific field mapping rules
    const ATS_FIELD_RULES = {
        workday: {
            firstName: [
                '[data-automation-id*="firstName"]',
                '[data-automation-id*="first_name"]',
                'input[name*="firstName"]',
                'input[name*="first_name"]'
            ],
            lastName: [
                '[data-automation-id*="lastName"]',
                '[data-automation-id*="last_name"]',
                'input[name*="lastName"]',
                'input[name*="last_name"]'
            ],
            email: [
                '[data-automation-id*="email"]',
                'input[name*="email"]',
                'input[type="email"]'
            ],
            phone: [
                '[data-automation-id*="phone"]',
                'input[name*="phone"]',
                'input[type="tel"]'
            ],
            address: [
                '[data-automation-id*="address"]',
                'input[name*="address"]'
            ],
            city: [
                '[data-automation-id*="city"]',
                'input[name*="city"]'
            ],
            state: [
                '[data-automation-id*="state"]',
                '[data-automation-id*="province"]',
                'select[name*="state"]',
                'select[name*="province"]'
            ],
            zipCode: [
                '[data-automation-id*="zip"]',
                '[data-automation-id*="postal"]',
                'input[name*="zip"]',
                'input[name*="postal"]'
            ],
            country: [
                '[data-automation-id*="country"]',
                'select[name*="country"]'
            ]
        },
        
        greenhouse: {
            firstName: [
                'input[name="job_application[first_name]"]',
                'input[name*="first_name"]',
                '#first_name'
            ],
            lastName: [
                'input[name="job_application[last_name]"]',
                'input[name*="last_name"]',
                '#last_name'
            ],
            email: [
                'input[name="job_application[email]"]',
                'input[name*="email"]',
                'input[type="email"]'
            ],
            phone: [
                'input[name="job_application[phone]"]',
                'input[name*="phone"]',
                'input[type="tel"]'
            ],
            resumeUpload: [
                'input[name="job_application[resume]"]',
                'input[type="file"][name*="resume"]'
            ],
            coverLetterUpload: [
                'input[name="job_application[cover_letter]"]',
                'input[type="file"][name*="cover"]'
            ]
        },
        
        lever: {
            firstName: [
                'input[name="name"]', // Lever often uses single name field
                'input[name*="first"]',
                '.application-question input[placeholder*="First"]'
            ],
            lastName: [
                'input[name*="last"]',
                '.application-question input[placeholder*="Last"]'
            ],
            email: [
                'input[name="email"]',
                'input[type="email"]'
            ],
            phone: [
                'input[name="phone"]',
                'input[type="tel"]'
            ],
            resumeUpload: [
                'input[name="resume"]',
                'input[type="file"]'
            ]
        },
        
        icims: {
            firstName: [
                'input[name*="firstName"]',
                'input[id*="firstName"]'
            ],
            lastName: [
                'input[name*="lastName"]',
                'input[id*="lastName"]'
            ],
            email: [
                'input[name*="email"]',
                'input[type="email"]'
            ],
            phone: [
                'input[name*="phone"]',
                'input[type="tel"]'
            ]
        },
        
        taleo: {
            firstName: [
                'input[name*="firstName"]',
                'input[name*="first_name"]'
            ],
            lastName: [
                'input[name*="lastName"]',
                'input[name*="last_name"]'
            ],
            email: [
                'input[name*="email"]'
            ],
            phone: [
                'input[name*="phone"]'
            ]
        }
    };

    // Heuristic patterns for field detection
    const HEURISTIC_PATTERNS = {
        firstName: {
            names: ['firstname', 'first_name', 'first-name', 'fname', 'forename', 'givenname'],
            ids: ['firstname', 'first_name', 'first-name', 'fname'],
            placeholders: ['first name', 'given name', 'forename'],
            labels: ['first name', 'given name', 'forename', 'prénom'],
            types: ['text']
        },
        
        lastName: {
            names: ['lastname', 'last_name', 'last-name', 'lname', 'surname', 'familyname'],
            ids: ['lastname', 'last_name', 'last-name', 'lname'],
            placeholders: ['last name', 'surname', 'family name'],
            labels: ['last name', 'surname', 'family name', 'nom de famille'],
            types: ['text']
        },
        
        fullName: {
            names: ['name', 'full_name', 'fullname', 'full-name', 'completename'],
            ids: ['name', 'full_name', 'fullname'],
            placeholders: ['full name', 'your name', 'name'],
            labels: ['full name', 'name', 'your name', 'nom complet'],
            types: ['text']
        },
        
        email: {
            names: ['email', 'email_address', 'email-address', 'emailaddress', 'mail'],
            ids: ['email', 'email_address', 'email-address'],
            placeholders: ['email', 'email address', 'your email', 'e-mail'],
            labels: ['email', 'email address', 'e-mail address'],
            types: ['email', 'text']
        },
        
        phone: {
            names: ['phone', 'phone_number', 'phone-number', 'phonenumber', 'telephone', 'mobile', 'cell'],
            ids: ['phone', 'phone_number', 'telephone'],
            placeholders: ['phone', 'phone number', 'telephone', 'mobile', 'cell phone'],
            labels: ['phone', 'phone number', 'telephone', 'mobile number'],
            types: ['tel', 'text']
        },
        
        address: {
            names: ['address', 'street_address', 'street-address', 'streetaddress', 'addr'],
            ids: ['address', 'street_address', 'street-address'],
            placeholders: ['address', 'street address', 'your address'],
            labels: ['address', 'street address', 'home address'],
            types: ['text']
        },
        
        city: {
            names: ['city', 'town', 'locality'],
            ids: ['city', 'town'],
            placeholders: ['city', 'town'],
            labels: ['city', 'town', 'locality'],
            types: ['text']
        },
        
        state: {
            names: ['state', 'province', 'region', 'state_province'],
            ids: ['state', 'province', 'region'],
            placeholders: ['state', 'province', 'region'],
            labels: ['state', 'province', 'state/province', 'region'],
            types: ['text', 'select-one']
        },
        
        zipCode: {
            names: ['zip', 'zipcode', 'zip_code', 'postal', 'postalcode', 'postal_code'],
            ids: ['zip', 'zipcode', 'postal'],
            placeholders: ['zip', 'zip code', 'postal code'],
            labels: ['zip code', 'postal code', 'zip'],
            types: ['text']
        },
        
        country: {
            names: ['country', 'nation'],
            ids: ['country'],
            placeholders: ['country'],
            labels: ['country', 'nation'],
            types: ['select-one', 'text']
        },
        
        currentTitle: {
            names: ['title', 'job_title', 'position', 'current_title', 'role'],
            ids: ['title', 'job_title', 'position'],
            placeholders: ['job title', 'current title', 'position', 'role'],
            labels: ['job title', 'current title', 'position', 'current position'],
            types: ['text']
        },
        
        currentCompany: {
            names: ['company', 'employer', 'current_company', 'organization'],
            ids: ['company', 'employer'],
            placeholders: ['company', 'employer', 'current company'],
            labels: ['company', 'employer', 'current employer', 'organization'],
            types: ['text']
        },
        
        yearsExperience: {
            names: ['experience', 'years_experience', 'experience_years'],
            ids: ['experience', 'years_experience'],
            placeholders: ['years of experience', 'experience'],
            labels: ['years of experience', 'experience', 'work experience'],
            types: ['number', 'text', 'select-one']
        },
        
        desiredSalary: {
            names: ['salary', 'desired_salary', 'expected_salary', 'compensation'],
            ids: ['salary', 'desired_salary'],
            placeholders: ['desired salary', 'expected salary', 'salary'],
            labels: ['desired salary', 'expected salary', 'salary expectations'],
            types: ['number', 'text']
        },
        
        availableStartDate: {
            names: ['start_date', 'available_date', 'availability'],
            ids: ['start_date', 'available_date'],
            placeholders: ['start date', 'available date', 'when can you start'],
            labels: ['start date', 'availability', 'when can you start'],
            types: ['date', 'text']
        },
        
        resumeUpload: {
            names: ['resume', 'cv', 'curriculum'],
            ids: ['resume', 'cv'],
            placeholders: [],
            labels: ['resume', 'cv', 'curriculum vitae'],
            types: ['file']
        },
        
        coverLetterUpload: {
            names: ['cover_letter', 'coverletter', 'cover'],
            ids: ['cover_letter', 'coverletter'],
            placeholders: [],
            labels: ['cover letter', 'covering letter'],
            types: ['file']
        }
    };

    // Common question patterns
    const QUESTION_PATTERNS = {
        whyInterested: [
            /why.*interested/i,
            /why.*want.*work/i,
            /why.*apply/i,
            /why.*company/i,
            /motivation.*position/i
        ],
        
        whyQualified: [
            /why.*qualified/i,
            /why.*right.*candidate/i,
            /what.*makes.*qualified/i,
            /relevant.*experience/i
        ],
        
        careerGoals: [
            /career.*goals/i,
            /professional.*goals/i,
            /future.*plans/i,
            /where.*see.*yourself/i
        ],
        
        greatestStrength: [
            /greatest.*strength/i,
            /biggest.*strength/i,
            /key.*strength/i,
            /what.*strength/i
        ],
        
        greatestWeakness: [
            /greatest.*weakness/i,
            /biggest.*weakness/i,
            /area.*improvement/i,
            /what.*weakness/i
        ]
    };

    /**
     * Map form fields using ATS-specific rules and heuristics
     * @param {Array} fields - Array of field objects
     * @param {string} atsType - Detected ATS type
     * @returns {Array} Mapped fields with enhanced purpose detection
     */
    function mapFields(fields, atsType = 'unknown') {
        console.log('FieldMapper: Mapping', fields.length, 'fields for ATS:', atsType);
        
        const mappedFields = fields.map(field => {
            // Try ATS-specific mapping first
            const atsMapping = mapFieldByATS(field, atsType);
            if (atsMapping !== 'unknown') {
                field.purpose = atsMapping;
                field.confidence = 0.9;
                field.mappingMethod = 'ats-specific';
                return field;
            }
            
            // Try heuristic mapping
            const heuristicMapping = mapFieldByHeuristics(field);
            if (heuristicMapping !== 'unknown') {
                field.purpose = heuristicMapping.purpose;
                field.confidence = heuristicMapping.confidence;
                field.mappingMethod = 'heuristic';
                return field;
            }
            
            // Try question pattern mapping
            const questionMapping = mapFieldByQuestionPatterns(field);
            if (questionMapping !== 'unknown') {
                field.purpose = questionMapping;
                field.confidence = 0.7;
                field.mappingMethod = 'question-pattern';
                return field;
            }
            
            // Mark as unknown but available for LLM analysis
            field.purpose = field.purpose || 'unknown';
            field.confidence = 0;
            field.mappingMethod = 'none';
            field.needsLLMAnalysis = true;
            
            return field;
        });
        
        // Group fields that need LLM analysis
        const llmFields = mappedFields.filter(field => field.needsLLMAnalysis);
        if (llmFields.length > 0) {
            console.log('FieldMapper: Scheduling', llmFields.length, 'fields for LLM analysis');
            // TODO: Implement batch LLM analysis
            scheduleLLMAnalysis(llmFields);
        }
        
        console.log('FieldMapper: Mapping complete. Results:', 
            mappedFields.reduce((acc, field) => {
                acc[field.purpose] = (acc[field.purpose] || 0) + 1;
                return acc;
            }, {})
        );
        
        return mappedFields;
    }

    /**
     * Map field using ATS-specific rules
     * @param {Object} field - Field object
     * @param {string} atsType - ATS type
     * @returns {string} Field purpose or 'unknown'
     */
    function mapFieldByATS(field, atsType) {
        const atsRules = ATS_FIELD_RULES[atsType];
        if (!atsRules) return 'unknown';
        
        for (const [purpose, selectors] of Object.entries(atsRules)) {
            for (const selector of selectors) {
                if (matchesSelector(field, selector)) {
                    return purpose;
                }
            }
        }
        
        return 'unknown';
    }

    /**
     * Check if field matches a CSS selector pattern
     * @param {Object} field - Field object
     * @param {string} selector - CSS selector
     * @returns {boolean} True if matches
     */
    function matchesSelector(field, selector) {
        try {
            // Direct element match
            if (field.element && field.element.matches(selector)) {
                return true;
            }
            
            // Check if selector would select this element
            const allMatching = document.querySelectorAll(selector);
            return Array.from(allMatching).includes(field.element);
        } catch (error) {
            // Fallback to attribute/property matching
            return matchesSelectorFallback(field, selector);
        }
    }

    /**
     * Fallback selector matching using string patterns
     * @param {Object} field - Field object
     * @param {string} selector - CSS selector
     * @returns {boolean} True if matches
     */
    function matchesSelectorFallback(field, selector) {
        // Extract attribute patterns from selector
        const nameMatch = selector.match(/\[name[*^$]?=["']([^"']+)["']\]/);
        if (nameMatch && field.name.includes(nameMatch[1])) {
            return true;
        }
        
        const idMatch = selector.match(/#([^[\s.]+)/);
        if (idMatch && field.id === idMatch[1]) {
            return true;
        }
        
        const dataMatch = selector.match(/\[data-automation-id[*^$]?=["']([^"']+)["']\]/);
        if (dataMatch) {
            const dataAttr = field.element?.getAttribute('data-automation-id');
            if (dataAttr && dataAttr.includes(dataMatch[1])) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Map field using heuristic patterns
     * @param {Object} field - Field object
     * @returns {Object} Mapping result with purpose and confidence
     */
    function mapFieldByHeuristics(field) {
        const fieldText = `${field.name} ${field.id} ${field.placeholder} ${field.label}`.toLowerCase();
        
        for (const [purpose, patterns] of Object.entries(HEURISTIC_PATTERNS)) {
            let score = 0;
            let maxScore = 0;
            
            // Check name matches
            maxScore += patterns.names.length;
            score += patterns.names.filter(name => 
                fieldText.includes(name.toLowerCase())
            ).length;
            
            // Check placeholder matches
            maxScore += patterns.placeholders.length;
            score += patterns.placeholders.filter(placeholder => 
                fieldText.includes(placeholder.toLowerCase())
            ).length;
            
            // Check label matches
            maxScore += patterns.labels.length;
            score += patterns.labels.filter(label => 
                fieldText.includes(label.toLowerCase())
            ).length;
            
            // Check type matches
            maxScore += patterns.types.length;
            if (patterns.types.includes(field.type)) {
                score += 1;
            }
            
            // Calculate confidence based on matches
            const confidence = maxScore > 0 ? score / maxScore : 0;
            
            if (confidence > 0.3) { // Threshold for heuristic matching
                return {
                    purpose: purpose,
                    confidence: Math.min(confidence, 0.8) // Cap heuristic confidence
                };
            }
        }
        
        return { purpose: 'unknown', confidence: 0 };
    }

    /**
     * Map field using question patterns
     * @param {Object} field - Field object
     * @returns {string} Field purpose or 'unknown'
     */
    function mapFieldByQuestionPatterns(field) {
        const questionText = `${field.label} ${field.placeholder}`.toLowerCase();
        
        for (const [purpose, patterns] of Object.entries(QUESTION_PATTERNS)) {
            for (const pattern of patterns) {
                if (pattern.test(questionText)) {
                    return purpose;
                }
            }
        }
        
        return 'unknown';
    }

    /**
     * Schedule LLM analysis for ambiguous fields
     * @param {Array} fields - Fields needing LLM analysis
     */
    function scheduleLLMAnalysis(fields) {
        // TODO: Implement actual LLM integration
        console.log('TODO: LLM analysis for fields:', fields.map(f => f.label || f.name));
        
        // For now, mark these fields for manual review
        fields.forEach(field => {
            field.needsManualReview = true;
        });
        
        // In the future, this would:
        // 1. Batch similar fields together
        // 2. Send context to Gemini API
        // 3. Parse response and update field purposes
        // 4. Cache results for similar fields
    }

    /**
     * Get field mapping suggestions for manual review
     * @param {Object} field - Field object
     * @returns {Array} Array of suggested purposes with confidence scores
     */
    function getSuggestions(field) {
        const suggestions = [];
        const fieldText = `${field.name} ${field.id} ${field.placeholder} ${field.label}`.toLowerCase();
        
        // Generate suggestions based on partial matches
        for (const [purpose, patterns] of Object.entries(HEURISTIC_PATTERNS)) {
            let score = 0;
            let reasons = [];
            
            // Check for partial name matches
            patterns.names.forEach(name => {
                if (fieldText.includes(name.toLowerCase())) {
                    score += 0.3;
                    reasons.push(`name contains "${name}"`);
                }
            });
            
            // Check for partial label matches
            patterns.labels.forEach(label => {
                if (fieldText.includes(label.toLowerCase())) {
                    score += 0.4;
                    reasons.push(`label contains "${label}"`);
                }
            });
            
            // Check type match
            if (patterns.types.includes(field.type)) {
                score += 0.2;
                reasons.push(`type is ${field.type}`);
            }
            
            if (score > 0.1) {
                suggestions.push({
                    purpose: purpose,
                    confidence: Math.min(score, 1),
                    reasons: reasons
                });
            }
        }
        
        // Sort by confidence
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Validate field mapping against profile data
     * @param {Array} mappedFields - Mapped field array
     * @param {Object} profile - User profile
     * @returns {Object} Validation results
     */
    function validateMapping(mappedFields, profile) {
        const validation = {
            valid: 0,
            invalid: 0,
            missing: 0,
            issues: []
        };
        
        mappedFields.forEach(field => {
            if (field.purpose === 'unknown') {
                validation.missing++;
                validation.issues.push({
                    field: field,
                    issue: 'unmapped',
                    message: 'Field purpose could not be determined'
                });
                return;
            }
            
            // Check if we have data for this field
            const hasData = getValueForField(field.purpose, profile) !== null;
            
            if (hasData) {
                validation.valid++;
            } else {
                validation.invalid++;
                validation.issues.push({
                    field: field,
                    issue: 'no-data',
                    message: `No profile data available for ${field.purpose}`
                });
            }
        });
        
        return validation;
    }

    /**
     * Get value from profile for a field purpose
     * @param {string} purpose - Field purpose
     * @param {Object} profile - User profile
     * @returns {string|null} Value or null if not found
     */
    function getValueForField(purpose, profile) {
        if (!profile) return null;
        
        const { personalInfo, workInfo, documents } = profile;
        
        switch (purpose) {
            case 'firstName': return personalInfo?.firstName;
            case 'lastName': return personalInfo?.lastName;
            case 'fullName': 
                return personalInfo?.firstName && personalInfo?.lastName 
                    ? `${personalInfo.firstName} ${personalInfo.lastName}` 
                    : null;
            case 'email': return personalInfo?.email;
            case 'phone': return personalInfo?.phone;
            case 'address': return personalInfo?.address;
            case 'city': return personalInfo?.city;
            case 'state': return personalInfo?.state;
            case 'zipCode': return personalInfo?.zipCode;
            case 'country': return personalInfo?.country;
            case 'currentTitle': return workInfo?.currentTitle;
            case 'currentCompany': return workInfo?.currentCompany;
            case 'yearsExperience': return workInfo?.yearsExperience;
            case 'desiredSalary': return workInfo?.desiredSalary;
            case 'availableStartDate': return workInfo?.availableStartDate;
            case 'resumeUpload': return documents?.resumePath;
            case 'coverLetterUpload': return documents?.coverLetterPath;
            default: return null;
        }
    }

    /**
     * Update field mapping rules based on user feedback
     * @param {string} atsType - ATS type
     * @param {Object} field - Field object
     * @param {string} correctPurpose - Correct field purpose
     */
    function updateMappingRules(atsType, field, correctPurpose) {
        // TODO: Implement machine learning feedback loop
        console.log('TODO: Update mapping rules', {
            atsType,
            field: {
                name: field.name,
                id: field.id,
                label: field.label
            },
            correctPurpose
        });
        
        // This would:
        // 1. Store the correction in a feedback database
        // 2. Update mapping rules based on patterns
        // 3. Improve future detection accuracy
    }

    // Public API
    return {
        mapFields,
        getSuggestions,
        validateMapping,
        updateMappingRules,
        getValueForField,
        
        // Direct mapping functions
        mapFieldByATS,
        mapFieldByHeuristics,
        mapFieldByQuestionPatterns,
        
        // Constants for external use
        ATS_FIELD_RULES,
        HEURISTIC_PATTERNS,
        QUESTION_PATTERNS
    };
})();

console.log('Field Mapper loaded');