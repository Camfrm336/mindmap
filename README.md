# MindMapper — Turn words into maps

A voice-to-mind-map web application that transforms transcripts into interactive, hierarchical visualizations using Claude AI.

## Live at https://voice-mindmap-client-production.up.railway.app/

## Prerequisites

- **Node.js 20+** — Run `node --version` to check
- **Anthropic API Key** — Get a free key at https://console.anthropic.com (Free tier includes $5 credit ≈ 1,600 extractions)
- **(Optional) Supabase** — For account sync across devices, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to client/.env (works without, defaults to localStorage only)

## Setup

```bash
# Clone and navigate
cd voice-mindmap

# Install all dependencies
npm run install:all

# Set up environment (server)
cd server
cp .env.example .env

# Add your Anthropic API key to server/.env
# ANTHROPIC_API_KEY=your_key_here

# Return to root and start
cd ..
npm run dev
```

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |

## How It Works

1. **Paste a transcript** — Paste any spoken content (podcast, meeting notes, lecture) into the text area
2. **Generate** — Click "Generate Map" or press Ctrl+Enter
3. **Extract** — Claude API extracts 8–15 hierarchical concepts from your transcript
4. **Visualize** — An interactive D3 force-directed mind map renders
5. **Interact** — Drag nodes, edit labels, change categories, export

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Generate mind map |
| `Ctrl+S` / `Cmd+S` | Export current map as JSON |
| `Ctrl+Shift+C` / `Cmd+Shift+C` | Clear transcript |
| `Escape` | Deselect node |
| `Enter` (in editor) | Save node edit |
| `Escape` (in editor) | Cancel node edit |

## Export Formats

- **PNG** — Rasterized image of the current view
- **SVG** — Scalable vector for editing in design tools
- **JSON** — Raw data for backup or programmatic use

## Iterating on Extraction

The extraction prompt lives in `server/prompts/extraction.txt`. To improve the quality of mind maps:

1. Edit `server/prompts/extraction.txt` with your desired prompt changes
2. Restart the server
3. Regenerate maps to see the effect

The prompt controls how Claude interprets and structures your transcript into nodes. Adjust the rules to get different output formats.

## Troubleshooting

- **"ANTHROPIC_API_KEY not configured"** — Ensure `server/.env` has your key and restart the server
- **"Claude API error" 401** — Your API key is invalid. Generate a new one at https://console.anthropic.com
- **"Extraction failed to parse"** — Rare. Retry; usually resolves on second attempt
- **CORS errors** — Ensure server runs on :3001 and vite.config.js proxy targets it
- **Empty map on render** — Check browser console for D3 errors; verify nodes have parentId fields

## Architecture

- **Frontend**: React 18 + Vite + D3.js (force-directed graph)
- **Backend**: Express.js + Node.js
- **Storage**: localStorage for mind maps + optional Supabase Auth
- **Auth**: Optional email/password via Supabase (works without, defaults to localStorage)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Zero paid services**: No Stripe, no external database, no OpenAI

## License

MIT
