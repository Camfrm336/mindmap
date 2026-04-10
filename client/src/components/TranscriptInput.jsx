// /home/cameron/mindmap/voice-mindmap/client/src/components/TranscriptInput.jsx

import React from 'react';

const SAMPLE_TRANSCRIPT = `One of the most transformative ideas I've encountered in the productivity space is the concept of the second brain. The core insight is deceptively simple: your biological brain is optimized for generating ideas, not for storing them. Every time you try to remember something — a task, an idea, a piece of research — you're using cognitive resources that could be spent on actually thinking.

Tiago Forte popularized this idea through his Building a Second Brain course and book. His PARA framework gives you four buckets for everything: Projects, which are outcomes you're actively working toward with a deadline; Areas, which are ongoing spheres of responsibility like health or finances; Resources, which are topics you're interested in but not actively working on; and Archives, which is where inactive stuff goes.

The technology side of this has exploded. Tools like Obsidian, Notion, and Roam Research give you linked thinking — you can see connections between ideas across your entire knowledge base. The magic is in the links. When you're writing about one topic and you notice it connects to something you captured six months ago, that's when the second brain starts to feel genuinely intelligent.

The biggest mistake people make is turning their second brain into a read-later graveyard. The whole point is to make information actionable. Every note you capture should have a purpose — either it's directly tied to a project, or it's teaching you something that will eventually feed into one. Capture less, but process what you capture. That's the discipline that separates people who have a system from people who just have a folder full of unread articles.`;

export default function TranscriptInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  charCount,
  maxChars
}) {
  const getCharCountColor = () => {
    if (charCount < 40000) return 'var(--color-action)';
    if (charCount < 48000) return 'var(--color-question)';
    return 'var(--color-warning)';
  };
  
  return (
    <div className="transcript-input">
      <label className="input-label">Transcript</label>
      <textarea
        className="input-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your podcast transcript, meeting notes, lecture, or any spoken content here...

Tip: Use Ctrl+Enter to generate"
        rows={8}
        disabled={isLoading}
      />
      <div className="input-footer">
        <span 
          className="char-counter" 
          style={{ color: getCharCountColor() }}
        >
          {charCount.toLocaleString()} / {maxChars.toLocaleString()}
        </span>
        <button
          className="submit-button"
          onClick={onSubmit}
          disabled={isLoading || charCount === 0}
        >
          {isLoading ? (
            <>
              <svg className="spinner" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" fill="none" stroke="white" strokeWidth="2" strokeDasharray="40 20" />
              </svg>
              Extracting...
            </>
          ) : (
            <>Generate Map <span className="shortcut">⌘↵</span></>
          )}
        </button>
      </div>
      <button
        className="sample-button"
        onClick={() => onChange(SAMPLE_TRANSCRIPT)}
        disabled={isLoading}
      >
        Load sample transcript
      </button>
    </div>
  );
}
