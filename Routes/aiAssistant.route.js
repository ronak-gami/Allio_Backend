import express from 'express';
import {geminiAI} from '../Controllers/aiAssistant.controller.js';

const router = express.Router();

// router.post('/chat', aiAssistant);
router.post('/gemini', geminiAI);

export default router;
