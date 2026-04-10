// /home/cameron/mindmap/voice-mindmap/client/src/components/NodeEditor.jsx

import React, { useState, useEffect, useRef } from 'react';
import { CATEGORY_COLORS, CATEGORY_LABELS, getCategoryColor } from '../utils/colors.js';

export default function NodeEditor({ node, position, onSave, onCancel }) {
  const [label, setLabel] = useState(node.label);
  const [category, setCategory] = useState(node.category);
  const textareaRef = useRef(null);
  
  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);
  
  // Handle click outside
  useEffect(() => {
    const handleMouseDown = (e) => {
      const editor = document.querySelector('.node-editor');
      if (editor && !editor.contains(e.target)) {
        onCancel();
      }
    };
    
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onCancel]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSave({ ...node, label, category });
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [label, category, node, onSave, onCancel]);
  
  // Clamp position to stay within viewport
  const clampedPosition = {
    x: Math.min(Math.max(position.x, 0), window.innerWidth - 300),
    y: Math.min(Math.max(position.y, 0), window.innerHeight - 250)
  };
  
  const categories = Object.keys(CATEGORY_COLORS);
  
  return (
    <div 
      className="node-editor"
      style={{
        left: clampedPosition.x,
        top: clampedPosition.y
      }}
    >
      <div className="node-editor-header">Edit node</div>
      <textarea
        ref={textareaRef}
        className="node-editor-textarea"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        rows={3}
      />
      <div className="node-editor-categories">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-pill ${category === cat ? 'active' : ''}`}
            style={{
              backgroundColor: category === cat ? `${getCategoryColor(cat)}30` : 'transparent',
              borderColor: category === cat ? getCategoryColor(cat) : 'var(--border)',
              color: category === cat ? getCategoryColor(cat) : 'var(--text-secondary)'
            }}
            onClick={() => setCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
      <div className="node-editor-footer">
        <button className="save-button" onClick={() => onSave({ ...node, label, category })}>
          Save
        </button>
        <button className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
