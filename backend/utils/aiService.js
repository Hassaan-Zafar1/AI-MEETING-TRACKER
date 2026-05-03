require('dotenv').config();
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
let gemini = null;

if (process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini API initialized with key:', process.env.GEMINI_API_KEY.substring(0, 15) + '...');
} else {
  console.error('❌ GEMINI_API_KEY not found in .env file!');
}

// Simple in-memory cache for extraction results
const extractionCache = new Map();
let lastRequestTime = 0;

const getCacheKey = (rawNotes, meetingDate) => {
  return crypto.createHash('md5').update(rawNotes + meetingDate).digest('hex');
};

const extractionPrompt = (rawNotes, meetingDate) => `
You are an expert meeting analyst. Analyze the following meeting notes carefully.

Your task:
1. Write a concise 2-3 sentence summary of the meeting
2. Extract ALL action items mentioned or implied

For each action item, determine:
- description: what needs to be done (clear, actionable sentence)
- assigneeName: who is responsible (use exact name from notes, or "Unassigned")
- dueDate: deadline if mentioned (ISO format YYYY-MM-DD, or null if not mentioned)
- priority: "high" if urgent/critical/ASAP, "low" if minor, otherwise "medium"
- riskFlag: true if due date is within 48 hours of meeting date OR if no due date but seems urgent

Meeting Date: ${meetingDate}

Meeting Notes:
${rawNotes}

IMPORTANT: Return ONLY a valid JSON object with no markdown, no explanation, just the JSON:
{
  "summary": "...",
  "actionItems": [
    {
      "description": "...",
      "assigneeName": "...",
      "dueDate": "..." or null,
      "priority": "low|medium|high",
      "riskFlag": true|false
    }
  ]
}
`;

// Mock function for testing without a real API key
const mockExtractActionItems = (rawNotes, meetingDate) => {
  const summary = rawNotes.substring(0, 150) + '...';
  return {
    summary: `Meeting summary: ${summary}`,
    actionItems: [
      {
        description: 'Review meeting notes and identify next steps',
        assigneeName: 'Unassigned',
        dueDate: null,
        priority: 'medium',
        riskFlag: false,
      },
    ],
  };
};

// Apply request throttling to respect free tier rate limits
const throttleRequest = async () => {
  const delayMs = parseInt(process.env.GEMINI_REQUEST_DELAY_MS || '1500', 10);
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  
  if (timeSinceLastRequest < delayMs) {
    const waitTime = delayMs - timeSinceLastRequest;
    console.log(`⏳ Throttling: waiting ${waitTime}ms before next API call...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
};

// Extract using Gemini API
const extractWithGemini = async (rawNotes, meetingDate) => {
  try {
    if (!gemini) {
      throw new Error('Gemini API not initialized. Check GEMINI_API_KEY in .env');
    }

    // Check cache first
    const cacheKey = getCacheKey(rawNotes, meetingDate);
    if (extractionCache.has(cacheKey)) {
      console.log('💾 Using cached extraction result');
      return extractionCache.get(cacheKey);
    }

    // Apply throttling before API call
    await throttleRequest();

    console.log('📝 Calling Gemini API for extraction...');
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: extractionPrompt(rawNotes, meetingDate) }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.1,
      },
    });

    const content = response.response.text();
    console.log('✅ Gemini response received');

    // Parse JSON
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from Gemini response');
      }
    }

    console.log(`✅ Successfully extracted ${result.actionItems?.length || 0} action items`);
    
    // Cache the result
    extractionCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('❌ Gemini extraction error:', error.message);
    throw new Error('Failed to extract action items: ' + error.message);
  }
};

// Main extraction function
const extractActionItems = async (rawNotes, meetingDate) => {
  try {
    if (!gemini) {
      console.warn('⚠️ Gemini API not configured. Using mock data for testing.');
      return mockExtractActionItems(rawNotes, meetingDate);
    }

    return await extractWithGemini(rawNotes, meetingDate);
  } catch (error) {
    console.error('❌ Extraction error:', error.message);
    console.warn('⚠️ Falling back to mock extraction due to error');
    return mockExtractActionItems(rawNotes, meetingDate);
  }
};

module.exports = { extractActionItems };