import express from 'express';
import multer from 'multer';
import {uploadFile, getUserMedia} from '../Controllers/upload.controller.js';

const uploadRouter = express.Router();
const upload = multer();

// Upload route → handles multipart/form-data
uploadRouter.post('/upload', upload.single('file'), uploadFile);

// Get media route → handles JSON
uploadRouter.post('/get-media', express.json(), getUserMedia);

export default uploadRouter;
