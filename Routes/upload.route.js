import express from 'express';
import multer from 'multer';
import {uploadFile, getUserMedia} from '../Controllers/upload.controller.js';

const router = express.Router();
const upload = multer();

// Upload route → handles multipart/form-data
router.post('/upload', upload.single('file'), uploadFile);

// Get media route → handles JSON
router.post('/get-media', express.json(), getUserMedia);

export default router;
