import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key found:", !!apiKey);
const ai = new GoogleGenAI({ apiKey });
console.log("AI initialized");
ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Say hello',
}).then(res => console.log(res.text)).catch(console.error);
