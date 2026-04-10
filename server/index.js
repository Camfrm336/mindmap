// /home/cameron/mindmap/voice-mindmap/server/index.js

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { extractRouter } from './routes/extract.js';

const app = express();
const PORT = process.env.PORT || 3001;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const LOG_EXTRACTIONS = process.env.LOG_EXTRACTIONS !== 'false';

// Middleware
app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    model: process.env.CLAUDE_MODEL 
  });
});

// Mount routes
app.use('/api', extractRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ 
    error: err.message, 
    code: err.code || 'UNKNOWN' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Using Claude model: ${CLAUDE_MODEL}`);
  console.log(`Extraction logging: ${LOG_EXTRACTIONS ? 'enabled' : 'disabled'}`);
});
