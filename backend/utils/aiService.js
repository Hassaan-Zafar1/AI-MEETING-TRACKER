const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize clients based on available API keys
let openai = null;
let gemini = null;

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

if (process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

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

// Extract using Gemini API
const extractWithGemini = async (rawNotes, meetingDate) => {
  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const response = await model.generateContent(extractionPrompt(rawNotes, meetingDate));
    const content = response.response.text();
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error('Gemini extraction error:', error.message);
    throw new Error('Failed to extract action items using Gemini');
  }
};

// Extract using OpenAI API
const extractWithOpenAI = async (rawNotes, meetingDate) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a precise meeting analyst. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: extractionPrompt(rawNotes, meetingDate),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content);
    return result;
  } catch (error) {
    console.error('OpenAI extraction error:', error.message);
    throw new Error('Failed to extract action items using OpenAI');
  }
};

const extractActionItems = async (rawNotes, meetingDate) => {
  try {
    // Try Gemini first if available
    if (gemini) {
      console.log('Using Gemini API for extraction');
      return await extractWithGemini(rawNotes, meetingDate);
    }

    // Fall back to OpenAI if available
    if (openai) {
      console.log('Using OpenAI API for extraction');
      return await extractWithOpenAI(rawNotes, meetingDate);
    }

    // Use mock if no API keys configured
    console.warn('No API keys configured. Using mock extraction.');
    return mockExtractActionItems(rawNotes, meetingDate);
  } catch (error) {
    console.error('Extraction error:', error.message);
    // Fall back to mock on error
    console.warn('Falling back to mock extraction due to error');
    return mockExtractActionItems(rawNotes, meetingDate);
  }
};

module.exports = { extractActionItems };
