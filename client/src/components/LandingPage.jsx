// /home/cameron/mindmap/voice-mindmap/client/src/components/LandingPage.jsx

import React from 'react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-header">
          <div className="logo-row landing-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="4" r="2" />
              <circle cx="20" cy="12" r="2" />
              <circle cx="12" cy="20" r="2" />
              <circle cx="4" cy="12" r="2" />
              <line x1="12" y1="7" x2="12" y2="9" />
              <line x1="15" y1="12" x2="18" y2="12" />
              <line x1="12" y1="15" x2="12" y2="18" />
              <line x1="6" y1="12" x2="9" y2="12" />
            </svg>
            <span className="wordmark">MindMapper</span>
          </div>
          <p className="tagline landing-tagline">Turn transcripts into visual thinking</p>
        </div>
        
        <div className="landing-hero">
          <h1>Transform Your Thoughts<br/>into Visual Mind Maps</h1>
          <p className="hero-subtitle">
            Paste any transcript, article, or notes and watch them transform into 
            organized, interactive mind maps. Powered by AI to extract insights 
            and connections automatically.
          </p>
          <button className="landing-button" onClick={onGetStarted}>
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        
        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3>AI-Powered</h3>
            <p>Automatically extracts key insights, actions, and concepts from any content</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h3>Cloud Sync</h3>
            <p>Save your mind maps to your account and access them from anywhere</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3>Export Anywhere</h3>
            <p>Export your maps as PNG, SVG, or JSON for presentations and reports</p>
          </div>
        </div>
        
        <div className="landing-footer">
          <p>© 2026 MindMapper</p>
        </div>
      </div>
    </div>
  );
}
