// /home/cameron/mindmap/voice-mindmap/client/src/components/NodeEditor.jsx

import React, { useState, useEffect, useRef } from 'react';
import { CATEGORY_COLORS, CATEGORY_LABELS, getCategoryColor } from '../utils/colors.js';

export default function NodeEditor({ node, position, onSave, onCancel }) {
  const [label, setLabel] = useState(node.label);
  const [category, setCategory] = useState(node.category);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(position);
  const textareaRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
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
  
  // Drag handlers
  const handleDragStart = (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setCurrentPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  // Clamp position to stay within viewport
  const editorWidth = 280;
  const editorHeight = 220;
  const clampedPosition = {
    x: Math.min(Math.max(currentPosition.x, 10), window.innerWidth - editorWidth - 10),
    y: Math.min(Math.max(currentPosition.y, 10), window.innerHeight - editorHeight - 10)
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
      <div 
        className="node-editor-header drag-handle"
        onMouseDown={handleDragStart}
      >
        Edit node
        <span className="drag-icon">✥</span>
      </div>
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
