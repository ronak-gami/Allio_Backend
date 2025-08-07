import express from 'express';
import dotenv from 'dotenv';
import userRouter from './Routes/user.route.js';
import uploadRouter from './Routes/upload.route.js';
import qrcodeRouter from './Routes/generate.route.js';
import cors from 'cors';

dotenv.config();
const app = express();

app.use(cors());

// Apply JSON parsing for non-file routes
app.use('/api/user', express.json(), userRouter);
app.use('/api/qrcode', express.json(), qrcodeRouter);

// Do NOT use express.json() for file upload route
app.use('/api', uploadRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
