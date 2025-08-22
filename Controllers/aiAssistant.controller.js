import dotenv from 'dotenv';
import {GoogleGenAI} from '@google/genai';

dotenv.config();

const geminiAI = async (req, res) => {
  try {
    const {prompt} = req.body;

    if (!prompt) {
      return res.status(400).json({
        status: false,
        message: 'Prompt is required',
      });
    }

    // Initialize the Google GenAI with API key
    const genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Generate content using Gemini model
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    // Check if response exists
    if (!response || !response.text) {
      throw new Error('Invalid response from Gemini AI');
    }

    return res.json({
      status: true,
      data: {reply: response.text},
    });
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to process Gemini AI request',
      error: error.message || 'Unknown error occurred',
    });
  }
};

export {geminiAI};
