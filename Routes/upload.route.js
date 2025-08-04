import express from 'express';
import multer from 'multer';
import {getUserMedia, uploadFile} from '../Controllers/upload.controller.js';

const uploadRouter = express.Router();

const upload = multer({storage: multer.memoryStorage()});

uploadRouter.post('/upload', upload.single('file'), uploadFile);
uploadRouter.post('/get-media', getUserMedia);

export default uploadRouter;
