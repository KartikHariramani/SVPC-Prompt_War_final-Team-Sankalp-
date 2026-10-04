import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Ensure the API key is provided
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

const systemInstruction = `You are a decision blind-spot analysis engine.

Your job is NOT to make decisions for the user.

Analyze only the information provided by:
1. The user's decision
2. Their reasoning
3. Their answers
4. Their calendar context
5. Their activity data

Identify:
- blind spots
- assumptions
- missing information
- conflicts
- potential impacts
- reflection questions
- what-if scenarios

Never fabricate facts.
Never invent activities or calendar events.
Never claim certainty about future outcomes.
Clearly distinguish: USER FACT, OBSERVATION, ASSUMPTION, UNKNOWN.
If information is missing, say it is missing.

Return valid JSON matching the requested schema.
Your purpose is to improve the user's reasoning, not to choose for them.`;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    blindSpots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          whyItMatters: { type: "string" },
          questionToInvestigate: { type: "string" }
        },
        required: ["title", "description", "whyItMatters", "questionToInvestigate"]
      }
    },
    assumptions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          assumption: { type: "string" },
          evidence: { type: "string" },
          status: { type: "string", enum: ["Supported", "Needs Verification", "Potentially Conflicting", "Unknown"] }
        },
        required: ["assumption", "evidence", "status"]
      }
    },
    missingInformation: {
      type: "array",
      items: { type: "string" }
    },
    conflicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          userSays: { type: "string" },
          contextOrCalendar: { type: "string" },
          result: { type: "string" }
        },
        required: ["userSays", "contextOrCalendar", "result"]
      }
    },
    potentialImpacts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["Time", "Finance", "Career", "Education", "Family", "Lifestyle", "Goals", "Work"] },
          level: { type: "string", enum: ["Low", "Medium", "High", "Unknown"] },
          description: { type: "string" }
        },
        required: ["category", "level", "description"]
      }
    },
    reflectionQuestions: {
      type: "array",
      items: { type: "string" }
    },
    whatIfScenarios: {
      type: "array",
      items: {
        type: "object",
        properties: {
          scenario: { type: "string" },
          potentialOutcome: { type: "string" }
        },
        required: ["scenario", "potentialOutcome"]
      }
    }
  },
  required: ["blindSpots", "assumptions", "missingInformation", "conflicts", "potentialImpacts", "reflectionQuestions", "whatIfScenarios"]
};

// Helper to safely parse JSON and remove Markdown blocks
const parseGeminiJSON = (text) => {
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    console.error("Failed to parse Gemini JSON:", err, "Raw text:", text);
    throw new Error("GEMINI_RESPONSE_ERROR");
  }
};

const handleGeminiError = (error) => {
  console.error("Gemini Error:", error);
  if (!apiKey) {
    throw new Error("GEMINI_NOT_CONFIGURED");
  }
  if (error.message === "GEMINI_RESPONSE_ERROR") {
    throw error;
  }
  const msg = error.message || "";
  if (msg.includes("401") || msg.includes("API key")) {
    throw new Error("GEMINI_AUTH_ERROR");
  } else if (msg.includes("429") || msg.includes("503") || msg.includes("quota") || msg.includes("rate limit") || msg.includes("high demand")) {
    throw new Error("GEMINI_RATE_LIMIT");
  } else {
    throw new Error("GEMINI_REQUEST_ERROR");
  }
};

export const testGeminiConnection = async () => {
  try {
    const prompt = 'Say "Gemini connection successful." and return it as a JSON object with a single "message" property.';
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return parseGeminiJSON(response.text);
  } catch (error) {
    handleGeminiError(error);
  }
};

export const generateQuestions = async (decisionContext) => {
  try {
    const prompt = `You are helping a normal person think more clearly about an important decision.

Generate 2 to 3 follow-up questions based on the user's decision.

IMPORTANT:
- Questions must be in simple natural Hinglish.
- Use Roman English only.
- Do not use Devanagari.
- Mix simple Hindi and English naturally.
- Avoid difficult Hindi words.
- Avoid technical terminology.
- Keep each question short.
- Ask only one thing in each question.
- Questions must be directly related to the user's decision.
- Do not repeat information the user already provided.
- Do not tell the user what decision to make.
- Questions should help discover assumptions, missing information, conflicts, or possible impacts.
- Questions should feel like a helpful friend asking the user to think deeper.

Examples:
"Aapko sabse zyada kis baat ka doubt hai?"
"Aapne is decision ke liye kya assume kiya hai?"
"Agar ye plan expected way mein nahi chala, to sabse bada problem kya ho sakta hai?"

Decision Context:
${JSON.stringify(decisionContext, null, 2)}

Return valid JSON containing a "questions" array of objects with "id" and "question".`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return parseGeminiJSON(response.text);
  } catch (error) {
    handleGeminiError(error);
  }
};

export const analyzeDecision = async (fullContext) => {
  try {
    const prompt = `Analyze the following decision context and return the structured analysis.
    
    Context:
    ${JSON.stringify(fullContext, null, 2)}`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: JSON_SCHEMA
      }
    });
    
    const parsed = parseGeminiJSON(response.text);
    
    // Normalize missing arrays
    return {
      blindSpots: parsed.blindSpots || [],
      assumptions: parsed.assumptions || [],
      missingInformation: parsed.missingInformation || [],
      conflicts: parsed.conflicts || [],
      potentialImpacts: parsed.potentialImpacts || [],
      reflectionQuestions: parsed.reflectionQuestions || [],
      whatIfScenarios: parsed.whatIfScenarios || []
    };
  } catch (error) {
    handleGeminiError(error);
  }
};
