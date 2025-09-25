/**
 * Gemini LLM Client for Browser Autofill Assistant
 * 
 * Handles integration with Google's Gemini API for:
 * - Ambiguous field detection and mapping
 * - Question analysis and answer generation
 * - Form structure understanding
 * 
 * @author Browser Autofill Assistant Team
 * @version 1.0.0
 */

window.GeminiClient = (function() {
    'use strict';

    // API Configuration
    const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
    const MODEL_NAME = 'gemini-pro';
    const DEFAULT_API_KEY = 'AIzaSyBkmQ17R3Ycsko6BufGuHe-m02mfWsai-8'; // TODO: Move to secure storage
    
    // Rate limiting configuration
    const RATE_LIMIT = {
        requestsPerMinute: 60,
        requestsPerDay: 1500,
        requestQueue: [],
        lastRequestTime: 0,
        dailyUsage: 0,
        dailyResetTime: 0
    };

    // Cache configuration
    const CACHE = {
        fieldAnalysis: new Map(),
        questionAnalysis: new Map(),
        maxSize: 100,
        ttl: 24 * 60 * 60 * 1000 // 24 hours
    };

    /**
     * Analyze form fields using Gemini API
     * @param {Array} fields - Array of field objects to analyze
     * @param {Object} context - Additional context (ATS type, page info, etc.)
     * @returns {Promise<Array>} Enhanced field objects with LLM analysis
     */
    async function analyzeFields(fields, context = {}) {
        console.log('GeminiClient: Analyzing', fields.length, 'fields');
        
        try {
            // Check rate limits
            if (!canMakeRequest()) {
                console.warn('GeminiClient: Rate limit exceeded, using fallback analysis');
                return fallbackFieldAnalysis(fields);
            }
            
            // Check cache first
            const cacheKey = generateFieldCacheKey(fields, context);
            const cachedResult = CACHE.fieldAnalysis.get(cacheKey);
            if (cachedResult && !isCacheExpired(cachedResult)) {
                console.log('GeminiClient: Using cached field analysis');
                return cachedResult.data;
            }
            
            // Prepare the prompt
            const prompt = buildFieldAnalysisPrompt(fields, context);
            
            // Make API request
            const response = await makeGeminiRequest(prompt);
            const analysis = parseFieldAnalysisResponse(response, fields);
            
            // Cache the result
            CACHE.fieldAnalysis.set(cacheKey, {
                data: analysis,
                timestamp: Date.now()
            });
            
            // Clean up cache if needed
            cleanupCache(CACHE.fieldAnalysis);
            
            console.log('GeminiClient: Field analysis complete');
            return analysis;
            
        } catch (error) {
            console.error('GeminiClient: Field analysis error:', error);
            return fallbackFieldAnalysis(fields);
        }
    }

    /**
     * Analyze questions and generate appropriate responses
     * @param {string} questionText - The question to analyze
     * @param {Object} context - Context including profile, job info, etc.
     * @returns {Promise<Object>} Analysis result with suggested response
     */
    async function analyzeQuestion(questionText, context = {}) {
        console.log('GeminiClient: Analyzing question:', questionText.substring(0, 100) + '...');
        
        try {
            // Check rate limits
            if (!canMakeRequest()) {
                console.warn('GeminiClient: Rate limit exceeded, using template library');
                return fallbackQuestionAnalysis(questionText);
            }
            
            // Check cache first
            const cacheKey = generateQuestionCacheKey(questionText, context);
            const cachedResult = CACHE.questionAnalysis.get(cacheKey);
            if (cachedResult && !isCacheExpired(cachedResult)) {
                console.log('GeminiClient: Using cached question analysis');
                return cachedResult.data;
            }
            
            // Prepare the prompt
            const prompt = buildQuestionAnalysisPrompt(questionText, context);
            
            // Make API request
            const response = await makeGeminiRequest(prompt);
            const analysis = parseQuestionAnalysisResponse(response);
            
            // Cache the result
            CACHE.questionAnalysis.set(cacheKey, {
                data: analysis,
                timestamp: Date.now()
            });
            
            // Clean up cache if needed
            cleanupCache(CACHE.questionAnalysis);
            
            console.log('GeminiClient: Question analysis complete');
            return analysis;
            
        } catch (error) {
            console.error('GeminiClient: Question analysis error:', error);
            return fallbackQuestionAnalysis(questionText);
        }
    }

    /**
     * Build prompt for field analysis
     * @param {Array} fields - Fields to analyze
     * @param {Object} context - Additional context
     * @returns {string} Formatted prompt
     */
    function buildFieldAnalysisPrompt(fields, context) {
        const fieldsDescription = fields.map((field, index) => {
            return `Field ${index + 1}:
- Type: ${field.type}
- Name: ${field.name || 'N/A'}
- ID: ${field.id || 'N/A'}
- Placeholder: ${field.placeholder || 'N/A'}
- Label: ${field.label || 'N/A'}
- Required: ${field.required ? 'Yes' : 'No'}`;
        }).join('\n\n');
        
        return `You are an expert at analyzing web form fields for job application forms. Your task is to identify the purpose of each field based on the provided information.

Context:
- ATS Platform: ${context.atsType || 'Unknown'}
- Website: ${context.url || 'Unknown'}
- Company: ${context.company || 'Unknown'}

Form Fields to Analyze:
${fieldsDescription}

For each field, determine its most likely purpose from this list:
- firstName: First name input
- lastName: Last name input
- fullName: Full name (combined first and last)
- email: Email address
- phone: Phone number
- address: Street address
- city: City
- state: State/Province
- zipCode: ZIP/Postal code
- country: Country
- currentTitle: Current job title
- currentCompany: Current employer
- yearsExperience: Years of work experience
- desiredSalary: Salary expectations
- availableStartDate: Available start date
- resumeUpload: Resume/CV file upload
- coverLetterUpload: Cover letter file upload
- whyInterested: Why interested in position
- whyQualified: Why qualified for role
- careerGoals: Career goals/aspirations
- additionalInfo: Additional information/comments
- unknown: Cannot determine purpose

Respond with a JSON array where each object has:
{
  "fieldIndex": <field_number_starting_from_1>,
  "purpose": "<purpose_from_list_above>",
  "confidence": <confidence_score_0_to_1>,
  "reasoning": "<brief_explanation>"
}

Only respond with the JSON array, no additional text.`;
    }

    /**
     * Build prompt for question analysis
     * @param {string} questionText - Question to analyze
     * @param {Object} context - Additional context
     * @returns {string} Formatted prompt
     */
    function buildQuestionAnalysisPrompt(questionText, context) {
        const profileInfo = context.profile ? `
Profile Information:
- Name: ${context.profile.personalInfo?.firstName} ${context.profile.personalInfo?.lastName}
- Current Title: ${context.profile.workInfo?.currentTitle || 'N/A'}
- Current Company: ${context.profile.workInfo?.currentCompany || 'N/A'}
- Years Experience: ${context.profile.workInfo?.yearsExperience || 'N/A'}` : '';
        
        return `You are an expert at analyzing job application questions and generating personalized responses. Your task is to understand the question and suggest an appropriate response strategy.

Context:
- Position: ${context.position || 'Unknown'}
- Company: ${context.company || 'Unknown'}
- ATS Platform: ${context.atsType || 'Unknown'}
${profileInfo}

Question to Analyze:
"${questionText}"

Analyze this question and provide:
1. The category/type of question
2. Key points that should be addressed in the response
3. A suggested response structure
4. Any specific advice for this type of question

Respond with a JSON object:
{
  "category": "<question_category>",
  "questionType": "<specific_type>",
  "keyPoints": ["<point1>", "<point2>", ...],
  "responseStructure": {
    "opening": "<opening_approach>",
    "body": "<main_content_approach>",
    "closing": "<closing_approach>"
  },
  "advice": ["<advice1>", "<advice2>", ...],
  "suggestedLength": "<short|medium|long>",
  "confidence": <confidence_score_0_to_1>
}

Only respond with the JSON object, no additional text.`;
    }

    /**
     * Make request to Gemini API
     * @param {string} prompt - The prompt to send
     * @returns {Promise<Object>} API response
     */
    async function makeGeminiRequest(prompt) {
        const apiKey = await getApiKey();
        const url = `${API_BASE_URL}/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.1, // Low temperature for consistent, factual responses
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        
        // Update rate limiting
        updateRateLimit();
        
        return data;
    }

    /**
     * Parse field analysis response from Gemini
     * @param {Object} response - Gemini API response
     * @param {Array} originalFields - Original field objects
     * @returns {Array} Enhanced field objects
     */
    function parseFieldAnalysisResponse(response, originalFields) {
        try {
            const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) {
                throw new Error('No content in response');
            }
            
            // Extract JSON from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }
            
            const analysis = JSON.parse(jsonMatch[0]);
            
            // Apply analysis to original fields
            const enhancedFields = originalFields.map((field, index) => {
                const fieldAnalysis = analysis.find(a => a.fieldIndex === index + 1);
                
                if (fieldAnalysis) {
                    return {
                        ...field,
                        purpose: fieldAnalysis.purpose,
                        confidence: fieldAnalysis.confidence,
                        llmReasoning: fieldAnalysis.reasoning,
                        mappingMethod: 'llm'
                    };
                }
                
                return field;
            });
            
            return enhancedFields;
            
        } catch (error) {
            console.error('Error parsing field analysis response:', error);
            return originalFields; // Return original fields if parsing fails
        }
    }

    /**
     * Parse question analysis response from Gemini
     * @param {Object} response - Gemini API response
     * @returns {Object} Parsed analysis
     */
    function parseQuestionAnalysisResponse(response) {
        try {
            const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) {
                throw new Error('No content in response');
            }
            
            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON object found in response');
            }
            
            const analysis = JSON.parse(jsonMatch[0]);
            
            return {
                category: analysis.category,
                questionType: analysis.questionType,
                keyPoints: analysis.keyPoints || [],
                responseStructure: analysis.responseStructure || {},
                advice: analysis.advice || [],
                suggestedLength: analysis.suggestedLength || 'medium',
                confidence: analysis.confidence || 0.5,
                source: 'llm'
            };
            
        } catch (error) {
            console.error('Error parsing question analysis response:', error);
            return {
                category: 'unknown',
                questionType: 'unknown',
                keyPoints: [],
                responseStructure: {},
                advice: ['Unable to analyze question automatically'],
                suggestedLength: 'medium',
                confidence: 0,
                source: 'error'
            };
        }
    }

    /**
     * Get API key from storage or use default
     * @returns {Promise<string>} API key
     */
    async function getApiKey() {
        try {
            if (window.StorageUtils) {
                const settings = await window.StorageUtils.getSettings();
                return settings.geminiApiKey || DEFAULT_API_KEY;
            }
            return DEFAULT_API_KEY;
        } catch (error) {
            console.error('Error getting API key:', error);
            return DEFAULT_API_KEY;
        }
    }

    /**
     * Check if we can make a request within rate limits
     * @returns {boolean} True if request can be made
     */
    function canMakeRequest() {
        const now = Date.now();
        
        // Check daily reset
        if (now - RATE_LIMIT.dailyResetTime > 24 * 60 * 60 * 1000) {
            RATE_LIMIT.dailyUsage = 0;
            RATE_LIMIT.dailyResetTime = now;
        }
        
        // Check daily limit
        if (RATE_LIMIT.dailyUsage >= RATE_LIMIT.requestsPerDay) {
            return false;
        }
        
        // Check per-minute limit
        const timeSinceLastRequest = now - RATE_LIMIT.lastRequestTime;
        const minInterval = (60 * 1000) / RATE_LIMIT.requestsPerMinute; // ms between requests
        
        return timeSinceLastRequest >= minInterval;
    }

    /**
     * Update rate limiting counters
     */
    function updateRateLimit() {
        RATE_LIMIT.lastRequestTime = Date.now();
        RATE_LIMIT.dailyUsage++;
    }

    /**
     * Generate cache key for field analysis
     * @param {Array} fields - Fields array
     * @param {Object} context - Context object
     * @returns {string} Cache key
     */
    function generateFieldCacheKey(fields, context) {
        const fieldsHash = fields.map(f => `${f.type}-${f.name}-${f.id}-${f.label}`).join('|');
        const contextHash = `${context.atsType || ''}-${context.url || ''}`;
        return `fields-${btoa(fieldsHash + contextHash).substring(0, 32)}`;
    }

    /**
     * Generate cache key for question analysis
     * @param {string} questionText - Question text
     * @param {Object} context - Context object
     * @returns {string} Cache key
     */
    function generateQuestionCacheKey(questionText, context) {
        const questionHash = btoa(questionText).substring(0, 32);
        const contextHash = `${context.position || ''}-${context.company || ''}`;
        return `question-${questionHash}-${btoa(contextHash).substring(0, 16)}`;
    }

    /**
     * Check if cached result has expired
     * @param {Object} cachedResult - Cached result object
     * @returns {boolean} True if expired
     */
    function isCacheExpired(cachedResult) {
        return Date.now() - cachedResult.timestamp > CACHE.ttl;
    }

    /**
     * Clean up cache when it gets too large
     * @param {Map} cache - Cache map to clean
     */
    function cleanupCache(cache) {
        if (cache.size > CACHE.maxSize) {
            // Remove oldest entries
            const entries = Array.from(cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = entries.slice(0, cache.size - CACHE.maxSize);
            toRemove.forEach(([key]) => cache.delete(key));
        }
    }

    /**
     * Fallback field analysis when LLM is unavailable
     * @param {Array} fields - Fields to analyze
     * @returns {Array} Fields with basic analysis
     */
    function fallbackFieldAnalysis(fields) {
        console.log('GeminiClient: Using fallback field analysis');
        
        return fields.map(field => ({
            ...field,
            confidence: Math.max(field.confidence || 0, 0.3),
            mappingMethod: field.mappingMethod || 'fallback',
            llmReasoning: 'LLM analysis unavailable, using heuristic fallback'
        }));
    }

    /**
     * Fallback question analysis when LLM is unavailable
     * @param {string} questionText - Question to analyze
     * @returns {Object} Basic analysis
     */
    function fallbackQuestionAnalysis(questionText) {
        console.log('GeminiClient: Using fallback question analysis');
        
        // Try to use answer library for basic matching
        if (window.AnswerLibrary) {
            const template = window.AnswerLibrary.findMatchingTemplate(questionText);
            if (template) {
                return {
                    category: template.category || 'general',
                    questionType: template.key,
                    keyPoints: [`Matches template: ${template.key}`],
                    responseStructure: {
                        opening: 'Use template response',
                        body: 'Customize with personal details',
                        closing: 'Professional closing'
                    },
                    advice: ['Personalize the template response', 'Include specific examples'],
                    suggestedLength: 'medium',
                    confidence: template.matchConfidence || 0.5,
                    source: 'template_fallback'
                };
            }
        }
        
        return {
            category: 'unknown',
            questionType: 'unknown',
            keyPoints: ['Manual analysis required'],
            responseStructure: {},
            advice: ['Review question manually', 'Consider using a template'],
            suggestedLength: 'medium',
            confidence: 0,
            source: 'fallback'
        };
    }

    /**
     * Get current usage statistics
     * @returns {Object} Usage statistics
     */
    function getUsageStats() {
        return {
            dailyUsage: RATE_LIMIT.dailyUsage,
            dailyLimit: RATE_LIMIT.requestsPerDay,
            remainingToday: RATE_LIMIT.requestsPerDay - RATE_LIMIT.dailyUsage,
            cacheStats: {
                fieldAnalysisSize: CACHE.fieldAnalysis.size,
                questionAnalysisSize: CACHE.questionAnalysis.size,
                maxSize: CACHE.maxSize
            },
            lastRequestTime: RATE_LIMIT.lastRequestTime
        };
    }

    /**
     * Clear all caches
     */
    function clearCache() {
        CACHE.fieldAnalysis.clear();
        CACHE.questionAnalysis.clear();
        console.log('GeminiClient: Cache cleared');
    }

    // Public API
    return {
        // Main analysis functions
        analyzeFields,
        analyzeQuestion,
        
        // Utility functions
        getUsageStats,
        clearCache,
        canMakeRequest,
        
        // Configuration
        setApiKey: async (apiKey) => {
            if (window.StorageUtils) {
                const settings = await window.StorageUtils.getSettings();
                settings.geminiApiKey = apiKey;
                await window.StorageUtils.saveSettings(settings);
            }
        }
    };
})();

console.log('Gemini LLM Client loaded');