// /home/cameron/mindmap/voice-mindmap/client/src/components/Toast.jsx

import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };
  
  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(52, 211, 153, 0.3)';
      case 'error':
        return 'rgba(248, 113, 113, 0.3)';
      default:
        return 'rgba(96, 165, 250, 0.3)';
    }
  };
  
  return (
    <div 
      className="toast"
      style={{ borderColor: getBorderColor() }}
    >
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        <div className="toast-title" style={{ 
          color: type === 'success' ? '#34d399' : type === 'error' ? '#f87171' : '#60a5fa' 
        }}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}
