import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use('/api/', limiter);

import decisionRoutes from './routes/decisions.js';
import googleRoutes from './routes/google.js';
import bot from './telegram.js'; // Initializes telegram
import { testGeminiConnection } from './gemini.js';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test/gemini', async (req, res) => {
  try {
    const result = await testGeminiConnection();
    res.json({ success: true, message: result.message || "Gemini connection successful." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Routes
app.use('/api/decisions', decisionRoutes);
app.use('/api/google', googleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
