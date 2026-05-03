const OpenAI = require('openai');

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const extractActionItems = async (rawNotes, meetingDate) => {
  // This is the "prompt" we send to GPT-4
  // Be very specific about what format you want back
  const prompt = `
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

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // use gpt-4o for best results
      messages: [
        {
          role: 'system',
          content: 'You are a precise meeting analyst. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      // response_format forces GPT to always return valid JSON
      response_format: { type: 'json_object' },
      temperature: 0.1, // lower temperature = more consistent, less creative
    });

    // Extract the text content from the response
    const content = response.choices[0].message.content;
    
    // Parse the JSON string into a JavaScript object
    const result = JSON.parse(content);
    
    return result;
  } catch (error) {
    console.error('AI extraction error:', error);
    throw new Error('Failed to extract action items from notes');
  }
};

module.exports = { extractActionItems };