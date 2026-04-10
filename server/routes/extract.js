// /home/cameron/mindmap/voice-mindmap/server/routes/extract.js

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_TRANSCRIPT_CHARS = parseInt(process.env.MAX_TRANSCRIPT_CHARS) || 50000;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const LOG_EXTRACTIONS = process.env.LOG_EXTRACTIONS !== 'false';

router.post('/extract', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Input validation
    const { transcript } = req.body;
    
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'transcript is required' });
    }
    
    const trimmedTranscript = transcript.trim();
    
    if (trimmedTranscript.length === 0) {
      return res.status(400).json({ error: 'transcript is required' });
    }
    
    if (trimmedTranscript.length > MAX_TRANSCRIPT_CHARS) {
      return res.status(400).json({ 
        error: `Transcript too long. Max ${MAX_TRANSCRIPT_CHARS.toLocaleString()} characters.`
      });
    }
    
    // Check API key
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_key_here') {
      return res.status(500).json({ 
        error: 'ANTHROPIC_API_KEY not configured. Copy server/.env.example to server/.env and add your key from https://console.anthropic.com'
      });
    }
    
    // Load prompt
    const promptPath = path.join(__dirname, '../prompts/extraction.txt');
    let promptTemplate;
    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8');
    } catch (err) {
      console.error('Failed to load prompt:', err.message);
      return res.status(500).json({ error: 'Failed to load extraction prompt' });
    }
    
    // Replace placeholder
    const filledPrompt = promptTemplate.replace('{{TRANSCRIPT}}', trimmedTranscript);
    
    // Call Claude API using native fetch (Node.js 18+)
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 2048,
          messages: [
            { role: 'user', content: filledPrompt }
          ]
        })
      });
    } catch (err) {
      console.error('Claude API fetch error:', err.message);
      return res.status(502).json({ error: 'Claude API unreachable' });
    }
    
    // Handle API errors
    if (!response.ok) {
      let errBody;
      try {
        errBody = await response.json();
      } catch {
        errBody = { error: { message: 'Unknown error' } };
      }
      console.error('Claude API error:', response.status, errBody);
      return res.status(502).json({ 
        error: 'Claude API error', 
        detail: errBody.error?.message 
      });
    }
    
    // Parse response
    let responseData;
    try {
      responseData = await response.json();
    } catch (err) {
      console.error('Failed to parse Claude response:', err.message);
      return res.status(502).json({ error: 'Failed to parse Claude response' });
    }
    
    // Extract and clean text
    const text = responseData.content?.[0]?.text || '';
    const cleanedText = text.replace(/```json|```/g, '').trim();
    
    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (err) {
      console.error('JSON parse error:', err.message);
      console.error('Raw response:', cleanedText.substring(0, 500));
      return res.status(422).json({ 
        error: 'Extraction failed to parse', 
        raw: cleanedText.substring(0, 500) 
      });
    }
    
    // Validate structure
    if (!parsed.nodes || !parsed.title) {
      return res.status(422).json({ 
        error: 'Invalid response structure: missing nodes or title' 
      });
    }
    
    // Filter and validate nodes
    const requiredFields = ['id', 'label', 'parentId', 'category', 'depth'];
    const validNodes = parsed.nodes.filter(node => {
      return requiredFields.every(field => {
        if (field === 'parentId') return node.parentId === null || typeof node.parentId === 'string';
        return node[field] !== undefined;
      });
    });
    
    // Safety cap
    const nodes = validNodes.length > 20 ? validNodes.slice(0, 20) : validNodes;
    
    const durationMs = Date.now() - startTime;
    
    // Logging
    if (LOG_EXTRACTIONS) {
      try {
        const logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        const logFile = path.join(logDir, 'extractions.jsonl');
        const logEntry = JSON.stringify({
          timestamp: new Date().toISOString(),
          transcriptLength: trimmedTranscript.length,
          nodeCount: nodes.length,
          title: parsed.title,
          durationMs
        }) + '\n';
        fs.appendFileSync(logFile, logEntry);
      } catch (logErr) {
        console.error('Logging failed:', logErr.message);
      }
    }
    
    // Send response
    res.json({
      title: parsed.title,
      nodes,
      meta: {
        nodeCount: nodes.length,
        transcriptLength: trimmedTranscript.length,
        model: CLAUDE_MODEL,
        durationMs
      }
    });
    
  } catch (err) {
    console.error('Extract endpoint error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Expand endpoint - add child nodes to existing node
router.post('/expand', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { nodeId, label, existingNodes } = req.body;
    
    if (!label || typeof label !== 'string') {
      return res.status(400).json({ error: 'label is required' });
    }
    
    if (!existingNodes || !Array.isArray(existingNodes)) {
      return res.status(400).json({ error: 'existingNodes array is required' });
    }
    
    // Find the parent node to get its depth
    const parentNode = existingNodes.find(n => n.id === nodeId);
    if (!parentNode) {
      return res.status(400).json({ error: 'Parent node not found' });
    }
    
    const parentDepth = parentNode.depth || 0;
    const newDepth = parentDepth + 1;
    
    if (newDepth > 3) {
      return res.status(400).json({ error: 'Cannot expand beyond depth 3' });
    }
    
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_key_here') {
      return res.status(500).json({ 
        error: 'ANTHROPIC_API_KEY not configured' 
      });
    }
    
    // Build prompt for expansion
    const expansionPrompt = `You are a knowledge architect. Expand on this topic to create 2-4 child nodes.

TOPIC TO EXPAND: "${label}"

RULES:
1. Create 2-4 child nodes that explore aspects of this topic
2. Each label must be a complete statement (5-12 words)
3. Maximum depth is 3 (this will be depth ${newDepth})
4. Assign one category per node from: insight, action, question, example, concept, warning, resource, outcome
5. Return ONLY valid JSON, no markdown fences

{
  "nodes": [
    {
      "id": "new1",
      "label": "first child concept as a complete statement",
      "parentId": "${nodeId}",
      "category": "concept",
      "depth": ${newDepth}
    }
  ]
}`;

    // Call Claude API
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 1024,
          messages: [{ role: 'user', content: expansionPrompt }]
        })
      });
    } catch (err) {
      return res.status(502).json({ error: 'Claude API unreachable' });
    }
    
    if (!response.ok) {
      let errBody;
      try {
        errBody = await response.json();
      } catch {
        errBody = { error: { message: 'Unknown error' } };
      }
      return res.status(502).json({ error: 'Claude API error', detail: errBody.error?.message });
    }
    
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      return res.status(502).json({ error: 'Failed to parse Claude response' });
    }
    
    const text = responseData.content?.[0]?.text || '';
    const cleanedText = text.replace(/```json|```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      return res.status(422).json({ error: 'Expansion failed to parse', raw: cleanedText.substring(0, 500) });
    }
    
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      return res.status(422).json({ error: 'Invalid response: missing nodes array' });
    }
    
    // Ensure parentId is set correctly and use expansion category
    const nodes = parsed.nodes.map((n, i) => ({
      ...n,
      parentId: nodeId,
      depth: newDepth,
      id: `${nodeId}_child${i + 1}`,
      category: 'expansion'  // Mark as AI-generated expansion nodes
    }));
    
    res.json({
      nodes,
      meta: {
        nodeCount: nodes.length,
        parentId: nodeId,
        durationMs: Date.now() - startTime
      }
    });
    
  } catch (err) {
    console.error('Expand endpoint error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export { router as extractRouter };
