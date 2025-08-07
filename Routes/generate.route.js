import express from 'express';
import {generateQRCode} from '../Controllers/generate.controller.js';

const qrcodeRouter = express.Router();

qrcodeRouter.post('/generate', generateQRCode);

export default qrcodeRouter;
