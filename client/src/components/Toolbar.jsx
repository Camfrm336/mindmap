// /home/cameron/mindmap/voice-mindmap/client/src/components/Toolbar.jsx

import React, { useState } from 'react';

export default function Toolbar({ map, onExport }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(map?.title || '');
  
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
    </div>
  );
}
