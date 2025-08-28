import express from 'express';
import dotenv from 'dotenv';
import userRouter from './Routes/user.route.js';
import uploadRouter from './Routes/upload.route.js';
import qrcodeRouter from './Routes/generate.route.js';
import aiRouter from './Routes/aiAssistant.route.js';
import newsRouter from './Routes/news.route.js';
import cors from 'cors';

dotenv.config();
const app = express();

app.use(cors());

// Serve static files (for /.well-known/assetlinks.json)
app.use(
  express.static('public', {
    dotfiles: 'allow',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('assetlinks.json')) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    },
  }),
);

// Apply JSON parsing for non-file routes
app.use('/api/user', express.json(), userRouter);
app.use('/api/qrcode', express.json(), qrcodeRouter);
app.use('/api/ai', express.json(), aiRouter);

// Do NOT use express.json() for file upload route
app.use('/api', uploadRouter);

app.use('/api/news', express.json(), newsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
