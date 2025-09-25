/**
 * Answer Library for Browser Autofill Assistant
 * 
 * Manages templates and responses for recurring application questions
 * Provides intelligent matching and customization capabilities
 * 
 * @author Browser Autofill Assistant Team
 * @version 1.0.0
 */

window.AnswerLibrary = (function() {
    'use strict';

    // Default answer templates
    const DEFAULT_TEMPLATES = {
        whyInterested: {
            template: "I am interested in this position because of the opportunity to contribute to {company}'s mission while developing my skills in {field}. The role aligns perfectly with my career goals and passion for {industry}.",
            variables: ['company', 'field', 'industry'],
            category: 'motivation',
            usage: 0,
            lastModified: Date.now()
        },
        
        whyQualified: {
            template: "I am qualified for this role due to my {experience} years of experience in {field}, combined with my proven track record in {skills}. My background in {education} has prepared me to tackle the challenges this position presents.",
            variables: ['experience', 'field', 'skills', 'education'],
            category: 'qualifications',
            usage: 0,
            lastModified: Date.now()
        },
        
        careerGoals: {
            template: "My career goals include advancing my expertise in {field} while taking on increasing responsibilities in {area}. I aim to contribute to innovative projects and grow into a leadership role where I can mentor others and drive strategic initiatives.",
            variables: ['field', 'area'],
            category: 'goals',
            usage: 0,
            lastModified: Date.now()
        },
        
        greatestStrength: {
            template: "My greatest strength is my ability to {skill}, which has enabled me to {achievement}. This strength has been particularly valuable in {context} and has consistently helped me deliver results that exceed expectations.",
            variables: ['skill', 'achievement', 'context'],
            category: 'strengths',
            usage: 0,
            lastModified: Date.now()
        },
        
        greatestWeakness: {
            template: "An area I'm working to improve is {weakness}. I've been addressing this by {improvement_method} and have already seen progress in {specific_example}. I believe in continuous learning and actively seek feedback to grow professionally.",
            variables: ['weakness', 'improvement_method', 'specific_example'],
            category: 'weaknesses',
            usage: 0,
            lastModified: Date.now()
        },
        
        workStyle: {
            template: "I work best in environments that are {environment_type} and encourage {work_values}. I thrive when I can {preferred_activities} and collaborate with teams that share a commitment to {shared_values}.",
            variables: ['environment_type', 'work_values', 'preferred_activities', 'shared_values'],
            category: 'work_style',
            usage: 0,
            lastModified: Date.now()
        },
        
        teamwork: {
            template: "I approach teamwork by {approach}, ensuring that {team_value}. I believe in {collaboration_principle} and always strive to {contribution}. My experience has taught me that the best results come from {team_philosophy}.",
            variables: ['approach', 'team_value', 'collaboration_principle', 'contribution', 'team_philosophy'],
            category: 'teamwork',
            usage: 0,
            lastModified: Date.now()
        },
        
        leadership: {
            template: "My leadership style focuses on {leadership_style}, emphasizing {core_values}. I believe in {leadership_principle} and work to create an environment where {team_environment}. I've successfully {leadership_example}.",
            variables: ['leadership_style', 'core_values', 'leadership_principle', 'team_environment', 'leadership_example'],
            category: 'leadership',
            usage: 0,
            lastModified: Date.now()
        },
        
        challenges: {
            template: "When facing challenges, I {approach} and focus on {strategy}. I've learned that {learning} and believe in {problem_solving_philosophy}. A specific example of this approach was when {example}.",
            variables: ['approach', 'strategy', 'learning', 'problem_solving_philosophy', 'example'],
            category: 'problem_solving',
            usage: 0,
            lastModified: Date.now()
        },
        
        motivation: {
            template: "What motivates me most is {primary_motivation}. I find great satisfaction in {satisfaction_source} and am energized by {energy_source}. This motivation has driven me to {achievement} and continues to inspire my professional growth.",
            variables: ['primary_motivation', 'satisfaction_source', 'energy_source', 'achievement'],
            category: 'motivation',
            usage: 0,
            lastModified: Date.now()
        },
        
        coverLetter: {
            template: "Dear Hiring Manager,\n\nI am writing to express my strong interest in the {position} role at {company}. With {experience} years of experience in {field}, I am confident that my skills and passion make me an ideal candidate for this position.\n\n{body_paragraph}\n\nI am excited about the opportunity to contribute to {company}'s continued success and would welcome the chance to discuss how my background and enthusiasm can benefit your team.\n\nSincerely,\n{name}",
            variables: ['position', 'company', 'experience', 'field', 'body_paragraph', 'name'],
            category: 'cover_letter',
            usage: 0,
            lastModified: Date.now()
        }
    };

    // Question matching patterns
    const QUESTION_PATTERNS = {
        whyInterested: [
            /why.*interested.*position/i,
            /why.*want.*work.*here/i,
            /why.*apply.*job/i,
            /what.*attracts.*you.*role/i,
            /motivation.*applying/i,
            /why.*chose.*company/i
        ],
        
        whyQualified: [
            /why.*qualified/i,
            /what.*makes.*qualified/i,
            /why.*right.*candidate/i,
            /why.*should.*hire/i,
            /what.*qualifications/i,
            /relevant.*experience/i
        ],
        
        careerGoals: [
            /career.*goals/i,
            /professional.*goals/i,
            /where.*see.*yourself/i,
            /future.*plans/i,
            /career.*aspirations/i,
            /long.*term.*goals/i
        ],
        
        greatestStrength: [
            /greatest.*strength/i,
            /biggest.*strength/i,
            /key.*strength/i,
            /what.*strength/i,
            /top.*strength/i,
            /main.*strength/i
        ],
        
        greatestWeakness: [
            /greatest.*weakness/i,
            /biggest.*weakness/i,
            /area.*improvement/i,
            /what.*weakness/i,
            /areas.*develop/i,
            /growth.*areas/i
        ],
        
        workStyle: [
            /work.*style/i,
            /working.*style/i,
            /how.*work.*best/i,
            /preferred.*work.*environment/i,
            /ideal.*work.*environment/i
        ],
        
        teamwork: [
            /teamwork/i,
            /work.*team/i,
            /team.*player/i,
            /collaboration/i,
            /team.*environment/i,
            /work.*others/i
        ],
        
        leadership: [
            /leadership/i,
            /leadership.*style/i,
            /lead.*team/i,
            /management.*style/i,
            /leading.*others/i
        ],
        
        challenges: [
            /challenges/i,
            /difficult.*situation/i,
            /problem.*solving/i,
            /overcome.*obstacle/i,
            /handle.*pressure/i,
            /deal.*with.*conflict/i
        ],
        
        motivation: [
            /what.*motivates/i,
            /motivation/i,
            /what.*drives.*you/i,
            /what.*inspires/i,
            /passionate.*about/i
        ]
    };

    // Variable extraction patterns
    const VARIABLE_PATTERNS = {
        company: [
            /company.*name/i,
            /organization/i,
            /employer/i
        ],
        position: [
            /position.*title/i,
            /job.*title/i,
            /role/i
        ],
        field: [
            /field/i,
            /industry/i,
            /domain/i,
            /area.*expertise/i
        ]
    };

    /**
     * Find matching answer template for a question
     * @param {string} questionText - The question text to match
     * @returns {Object|null} Matching template or null
     */
    function findMatchingTemplate(questionText) {
        if (!questionText || typeof questionText !== 'string') {
            return null;
        }
        
        const normalizedQuestion = questionText.toLowerCase().trim();
        
        // Try exact pattern matching first
        for (const [templateKey, patterns] of Object.entries(QUESTION_PATTERNS)) {
            for (const pattern of patterns) {
                if (pattern.test(normalizedQuestion)) {
                    const template = getTemplate(templateKey);
                    if (template) {
                        console.log('AnswerLibrary: Found template match:', templateKey);
                        return {
                            key: templateKey,
                            ...template,
                            matchConfidence: 0.9
                        };
                    }
                }
            }
        }
        
        // Try fuzzy matching for partial matches
        const fuzzyMatch = findFuzzyMatch(normalizedQuestion);
        if (fuzzyMatch) {
            console.log('AnswerLibrary: Found fuzzy match:', fuzzyMatch.key);
            return fuzzyMatch;
        }
        
        console.log('AnswerLibrary: No template match found for:', questionText);
        return null;
    }

    /**
     * Find fuzzy matches using keyword similarity
     * @param {string} questionText - Normalized question text
     * @returns {Object|null} Best fuzzy match or null
     */
    function findFuzzyMatch(questionText) {
        const questionWords = questionText.split(/\s+/);
        let bestMatch = null;
        let bestScore = 0;
        
        for (const [templateKey, patterns] of Object.entries(QUESTION_PATTERNS)) {
            let score = 0;
            let totalWords = 0;
            
            // Extract keywords from patterns
            const patternKeywords = patterns.map(pattern => {
                // Extract words from regex pattern
                const patternStr = pattern.source.toLowerCase();
                return patternStr.match(/[a-z]+/g) || [];
            }).flat();
            
            // Calculate similarity score
            for (const word of questionWords) {
                if (word.length > 2) { // Skip short words
                    totalWords++;
                    if (patternKeywords.some(keyword => 
                        keyword.includes(word) || word.includes(keyword)
                    )) {
                        score++;
                    }
                }
            }
            
            const similarity = totalWords > 0 ? score / totalWords : 0;
            
            if (similarity > bestScore && similarity > 0.3) { // Minimum threshold
                bestScore = similarity;
                const template = getTemplate(templateKey);
                if (template) {
                    bestMatch = {
                        key: templateKey,
                        ...template,
                        matchConfidence: similarity * 0.7 // Lower confidence for fuzzy matches
                    };
                }
            }
        }
        
        return bestMatch;
    }

    /**
     * Get template by key
     * @param {string} key - Template key
     * @returns {Object|null} Template object or null
     */
    async function getTemplate(key) {
        try {
            // Try to get from storage first
            if (window.StorageUtils) {
                const { templates } = await window.StorageUtils.getTemplates();
                if (templates && templates[key]) {
                    return templates[key];
                }
            }
            
            // Fallback to default templates
            return DEFAULT_TEMPLATES[key] || null;
        } catch (error) {
            console.error('Error getting template:', error);
            return DEFAULT_TEMPLATES[key] || null;
        }
    }

    /**
     * Get all available templates
     * @returns {Object} All templates
     */
    async function getAllTemplates() {
        try {
            if (window.StorageUtils) {
                const { templates } = await window.StorageUtils.getTemplates();
                return { ...DEFAULT_TEMPLATES, ...templates };
            }
            return DEFAULT_TEMPLATES;
        } catch (error) {
            console.error('Error getting all templates:', error);
            return DEFAULT_TEMPLATES;
        }
    }

    /**
     * Save template to storage
     * @param {string} key - Template key
     * @param {Object} template - Template object
     * @returns {boolean} Success status
     */
    async function saveTemplate(key, template) {
        try {
            if (window.StorageUtils) {
                template.lastModified = Date.now();
                return await window.StorageUtils.saveTemplate(key, template);
            }
            
            // Fallback to localStorage
            const templates = JSON.parse(localStorage.getItem('templates') || '{}');
            templates[key] = template;
            localStorage.setItem('templates', JSON.stringify(templates));
            return true;
        } catch (error) {
            console.error('Error saving template:', error);
            return false;
        }
    }

    /**
     * Populate template with context variables
     * @param {Object} template - Template object
     * @param {Object} context - Context variables (profile, job info, etc.)
     * @returns {string} Populated template
     */
    function populateTemplate(template, context = {}) {
        if (!template || !template.template) {
            return '';
        }
        
        let result = template.template;
        
        // Extract context from various sources
        const fullContext = {
            ...context,
            ...extractContextFromPage(),
            ...extractContextFromProfile(context.profile)
        };
        
        // Replace template variables
        for (const variable of template.variables || []) {
            const placeholder = `{${variable}}`;
            const value = fullContext[variable] || `[${variable}]`;
            result = result.replace(new RegExp(placeholder, 'g'), value);
        }
        
        // Update usage statistics
        incrementTemplateUsage(template.key);
        
        return result;
    }

    /**
     * Extract context variables from current page
     * @returns {Object} Context variables
     */
    function extractContextFromPage() {
        const context = {};
        
        // Try to extract company name
        const companySelectors = [
            '.company-name',
            '.employer-name',
            '[data-automation-id="company"]',
            '.posting-company',
            'h1',
            'title'
        ];
        
        for (const selector of companySelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                context.company = element.textContent.trim();
                break;
            }
        }
        
        // Try to extract position title
        const positionSelectors = [
            '.job-title',
            '.position-title',
            '[data-automation-id="jobPostingHeader"]',
            '.posting-headline',
            'h1'
        ];
        
        for (const selector of positionSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                context.position = element.textContent.trim();
                break;
            }
        }
        
        // Extract from page title as fallback
        if (!context.company || !context.position) {
            const title = document.title;
            const titleParts = title.split(/[-|–]/).map(part => part.trim());
            
            if (titleParts.length >= 2) {
                if (!context.position) context.position = titleParts[0];
                if (!context.company) context.company = titleParts[1];
            }
        }
        
        return context;
    }

    /**
     * Extract context variables from user profile
     * @param {Object} profile - User profile
     * @returns {Object} Context variables
     */
    function extractContextFromProfile(profile) {
        if (!profile) return {};
        
        return {
            name: profile.personalInfo?.firstName && profile.personalInfo?.lastName 
                ? `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`
                : '',
            experience: profile.workInfo?.yearsExperience || '',
            field: profile.workInfo?.currentTitle || '',
            // Add more profile-based context as needed
        };
    }

    /**
     * Increment template usage counter
     * @param {string} key - Template key
     */
    async function incrementTemplateUsage(key) {
        try {
            const template = await getTemplate(key);
            if (template) {
                template.usage = (template.usage || 0) + 1;
                template.lastUsed = Date.now();
                await saveTemplate(key, template);
            }
        } catch (error) {
            console.error('Error incrementing template usage:', error);
        }
    }

    /**
     * Get template suggestions based on usage and context
     * @param {Object} context - Current context
     * @returns {Array} Suggested templates
     */
    async function getTemplateSuggestions(context = {}) {
        try {
            const allTemplates = await getAllTemplates();
            const suggestions = [];
            
            for (const [key, template] of Object.entries(allTemplates)) {
                const suggestion = {
                    key: key,
                    name: formatTemplateName(key),
                    template: template,
                    usage: template.usage || 0,
                    lastUsed: template.lastUsed || 0,
                    category: template.category || 'general'
                };
                
                suggestions.push(suggestion);
            }
            
            // Sort by usage and recency
            return suggestions.sort((a, b) => {
                const scoreA = (a.usage * 0.7) + (a.lastUsed > 0 ? Date.now() - a.lastUsed : 0) * 0.3;
                const scoreB = (b.usage * 0.7) + (b.lastUsed > 0 ? Date.now() - b.lastUsed : 0) * 0.3;
                return scoreB - scoreA;
            });
        } catch (error) {
            console.error('Error getting template suggestions:', error);
            return [];
        }
    }

    /**
     * Format template name for display
     * @param {string} key - Template key
     * @returns {string} Formatted name
     */
    function formatTemplateName(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Create new template from user input
     * @param {string} name - Template name
     * @param {string} content - Template content
     * @param {string} category - Template category
     * @returns {Object} New template object
     */
    function createTemplate(name, content, category = 'custom') {
        const key = name.toLowerCase().replace(/\s+/g, '_');
        
        // Extract variables from template content
        const variables = [];
        const variableMatches = content.match(/\{([^}]+)\}/g);
        if (variableMatches) {
            for (const match of variableMatches) {
                const variable = match.slice(1, -1); // Remove { }
                if (!variables.includes(variable)) {
                    variables.push(variable);
                }
            }
        }
        
        return {
            key: key,
            template: content,
            variables: variables,
            category: category,
            usage: 0,
            created: Date.now(),
            lastModified: Date.now()
        };
    }

    /**
     * Import templates from external source
     * @param {Object} templates - Templates to import
     * @param {boolean} overwrite - Whether to overwrite existing templates
     * @returns {Object} Import results
     */
    async function importTemplates(templates, overwrite = false) {
        const results = {
            imported: 0,
            skipped: 0,
            errors: 0,
            details: []
        };
        
        try {
            const existingTemplates = await getAllTemplates();
            
            for (const [key, template] of Object.entries(templates)) {
                try {
                    if (!overwrite && existingTemplates[key]) {
                        results.skipped++;
                        results.details.push({
                            key: key,
                            status: 'skipped',
                            reason: 'Template already exists'
                        });
                        continue;
                    }
                    
                    const success = await saveTemplate(key, template);
                    if (success) {
                        results.imported++;
                        results.details.push({
                            key: key,
                            status: 'imported',
                            reason: 'Successfully imported'
                        });
                    } else {
                        results.errors++;
                        results.details.push({
                            key: key,
                            status: 'error',
                            reason: 'Failed to save template'
                        });
                    }
                } catch (error) {
                    results.errors++;
                    results.details.push({
                        key: key,
                        status: 'error',
                        reason: error.message
                    });
                }
            }
        } catch (error) {
            console.error('Error importing templates:', error);
        }
        
        return results;
    }

    /**
     * Export templates for backup or sharing
     * @param {Array} templateKeys - Specific templates to export (optional)
     * @returns {Object} Exported templates
     */
    async function exportTemplates(templateKeys = null) {
        try {
            const allTemplates = await getAllTemplates();
            
            if (templateKeys) {
                const exportData = {};
                for (const key of templateKeys) {
                    if (allTemplates[key]) {
                        exportData[key] = allTemplates[key];
                    }
                }
                return exportData;
            }
            
            return allTemplates;
        } catch (error) {
            console.error('Error exporting templates:', error);
            return {};
        }
    }

    // Public API
    return {
        // Template matching
        findMatchingTemplate,
        
        // Template management
        getTemplate,
        getAllTemplates,
        saveTemplate,
        createTemplate,
        
        // Template population
        populateTemplate,
        
        // Suggestions and analytics
        getTemplateSuggestions,
        incrementTemplateUsage,
        
        // Import/Export
        importTemplates,
        exportTemplates,
        
        // Utilities
        formatTemplateName,
        extractContextFromPage,
        extractContextFromProfile,
        
        // Constants for external use
        DEFAULT_TEMPLATES,
        QUESTION_PATTERNS
    };
})();

console.log('Answer Library loaded');