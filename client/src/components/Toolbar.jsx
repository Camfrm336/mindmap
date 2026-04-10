// /home/cameron/mindmap/voice-mindmap/client/src/components/Toolbar.jsx

import React, { useState } from 'react';

export default function Toolbar({ map, onExport }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(map?.title || '');
  const [showHelp, setShowHelp] = useState(false);
  
  const handleTitleClick = () => {
    setIsEditing(true);
  };
  
  const handleTitleBlur = () => {
    setIsEditing(false);
  };
  
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setTitle(map?.title || '');
      setIsEditing(false);
    }
  };
  
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        {isEditing ? (
          <input
            className="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
          />
        ) : (
          <span className="map-title" onClick={handleTitleClick}>
            {map?.title || 'Untitled Map'}
          </span>
        )}
      </div>
      <div className="toolbar-right">
        <button className="toolbar-button" onClick={() => setShowHelp(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Help
        </button>
        <button className="toolbar-button" onClick={() => onExport('png')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <rect x="7" y="7" width="3" height="3" />
            <line x1="14" y1="7" x2="14" y2="7.01" />
            <line x1="7" y1="14" x2="17" y2="14" />
          </svg>
          PNG
        </button>
        <button className="toolbar-button" onClick={() => onExport('svg')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
          SVG
        </button>
        <button className="toolbar-button" onClick={() => onExport('json')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
            <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
          </svg>
          JSON
        </button>
      </div>
      
      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <button className="help-close" onClick={() => setShowHelp(false)}>&times;</button>
            <h2>How to Use</h2>
            
            <section>
              <h3>Node Actions</h3>
              <p><strong>Double-click</strong> on any node to edit its label and category.</p>
              <p><strong>Right-click</strong> on any node to:</p>
              <ul>
                <li><strong>Edit label</strong> — Change the node text</li>
                <li><strong>Expand</strong> — Ask AI to add more subtopics (max 3 levels)</li>
                <li><strong>Delete</strong> — Remove the node and its children</li>
                <li><strong>Copy</strong> — Copy the node text to clipboard</li>
              </ul>
            </section>
            
            <section>
              <h3>Drag & Drop</h3>
              <p><strong>Left-click and drag</strong> to reposition nodes on the map. The layout will adjust automatically.</p>
            </section>
            
            <section>
              <h3>Keyboard Shortcuts</h3>
              <ul>
                <li><strong>Ctrl+Enter</strong> — Generate map from transcript</li>
                <li><strong>Ctrl+S</strong> — Export as JSON</li>
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
