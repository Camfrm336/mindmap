// /home/cameron/mindmap/voice-mindmap/client/src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';
import TranscriptInput from './components/TranscriptInput.jsx';
import MindMap from './components/MindMap.jsx';
import Toolbar from './components/Toolbar.jsx';
import Toast from './components/Toast.jsx';
import Auth from './components/Auth.jsx';
import LandingPage from './components/LandingPage.jsx';
import { useMindMap } from './hooks/useMindMap.js';
import { exportPNG, exportSVG, exportJSON } from './utils/export.js';
import { isSupabaseConfigured, signUp, signIn, signOut, onAuthStateChange, supabase } from './lib/supabase.js';
import './App.css';

function EmptyState() {
  return (
    <div className="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
      </svg>
      <h2>Paste a transcript to begin</h2>
      <p>Tip: Use Ctrl+Enter to generate</p>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  
  const {
    transcript,
    setTranscript,
    isLoading,
    error,
    setError,
    currentMap,
    setCurrentMap,
    mapHistory,
    clearMapHistory,
    selectedNodeId,
    setSelectedNodeId,
    toast,
    setToast,
    handleExtract,
    handleNodeEdit,
    handleNodeDelete,
    handleSelectFromHistory,
    handleClearHistory,
    handleExpandNode,
    isSupabaseReady
  } = useMindMap(user);

  // Check for Supabase configuration
  const supabaseConfigured = isSupabaseConfigured();

  // Handle auth state changes
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Handle auth submission
  const handleAuth = async (email, password, isSignUp) => {
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const result = await signUp(email, password);
        setShowAuth(false);
        setToast({ message: 'Check your email to confirm your account!', type: 'success' });
      } else {
        await signIn(email, password);
        setShowAuth(false);
        setToast({ message: 'Signed in successfully!', type: 'success' });
      }
    } catch (err) {
      console.error('Auth error:', err.message);
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle clear auth success
  const handleClearAuthSuccess = () => {
    setAuthSuccess('');
  };

  // Handle toggle auth visibility
  const handleToggleAuth = () => {
    setShowAuth(!showAuth);
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setCurrentMap(null);
      clearMapHistory();
      setToast({ message: 'Signed out successfully', type: 'info' });
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle getting started from landing page
  const handleGetStarted = () => {
    setShowLanding(false);
  };

  const [svgRef, setSvgRef] = useState(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape: deselect node
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }
      
      // Ctrl+Enter / Cmd+Enter: trigger extract
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (transcript.trim() && !isLoading) {
          handleExtract();
        }
      }
      
      // Ctrl+S / Cmd+S: export JSON
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentMap) {
          exportJSON(currentMap, currentMap.title || 'mindmap');
          setToast('Exported as JSON', 'success');
        }
      }
      
      // Ctrl+Shift+C / Cmd+Shift+C: clear transcript
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setTranscript('');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transcript, isLoading, currentMap, handleExtract, setTranscript, setSelectedNodeId, setToast]);

  // Export handler
  const handleExport = useCallback((format) => {
    const svgElement = document.querySelector('.mindmap-svg');
    if (!svgElement) return;
    
    const filename = currentMap?.title || 'mindmap';
    
    switch (format) {
      case 'png':
        exportPNG(svgElement, filename);
        setToast('Exported as PNG', 'success');
        break;
      case 'svg':
        exportSVG(svgElement, filename);
        setToast('Exported as SVG', 'success');
        break;
      case 'json':
        exportJSON(currentMap, filename);
        setToast('Exported as JSON', 'success');
        break;
    }
  }, [currentMap, setToast]);

  // Time ago helper
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Show landing page if user hasn't clicked Get Started
  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }
  
  return (
    <div className="app">
      <aside className="panel-left">
        <header className="app-header">
          <div className="logo-row">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
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
            {user && <span className="user-badge">✓</span>}
          </div>
          <p className="tagline">Turn transcripts into thinking</p>
        </header>
        
        {user ? (
          <>
            <div className="user-bar">
              <span className="user-email">{user.email}</span>
              <button className="sign-out-button" onClick={handleSignOut}>Sign Out</button>
            </div>
            <TranscriptInput
              value={transcript}
              onChange={setTranscript}
              onSubmit={handleExtract}
              isLoading={isLoading}
              charCount={transcript.length}
              maxChars={50000}
            />
            
            {error && (
              <div className="error-banner">{error}</div>
            )}
            
            <section className="history-section">
              <h3>Recent maps ({mapHistory.length})</h3>
              {mapHistory.map((map, index) => (
                <div
                  key={map.id || map.createdAt || index}
                  className="history-item"
                  onClick={() => handleSelectFromHistory(map)}
                >
                  <div className="history-title">{map.title}</div>
                  <div className="history-meta">
                    {map.nodes?.length || 0} nodes · {timeAgo(map.createdAt)}
                  </div>
                </div>
              ))}
              {mapHistory.length > 0 && (
                <button 
                  className="clear-history-button"
                  onClick={handleClearHistory}
                >
                  Clear history
                </button>
              )}
            </section>
          </>
        ) : (
          <div className="free-use-section">
            <div className="free-badge">Free to use</div>
            <p className="free-description">
              Create mind maps without an account. Your maps are saved locally in your browser.
            </p>
            <p className="free-description">
              <button className="auth-link-button" onClick={handleToggleAuth}>
                Sign in / Create account
              </button> to sync your maps across devices and access them anywhere.
            </p>
            <TranscriptInput
              value={transcript}
              onChange={setTranscript}
              onSubmit={handleExtract}
              isLoading={isLoading}
              charCount={transcript.length}
              maxChars={50000}
            />
            
            {error && (
              <div className="error-banner">{error}</div>
            )}
            
            <section className="history-section">
              <h3>Recent maps ({mapHistory.length})</h3>
              {mapHistory.map((map, index) => (
                <div
                  key={map.id || map.createdAt || index}
                  className="history-item"
                  onClick={() => handleSelectFromHistory(map)}
                >
                  <div className="history-title">{map.title}</div>
                  <div className="history-meta">
                    {map.nodes?.length || 0} nodes · {timeAgo(map.createdAt)}
                  </div>
                </div>
              ))}
              {mapHistory.length > 0 && (
                <button 
                  className="clear-history-button"
                  onClick={handleClearHistory}
                >
                  Clear history
                </button>
              )}
            </section>
          </div>
        )}
      </aside>
      
      <main className="panel-right">
        {!currentMap && <EmptyState />}
        {currentMap && (
          <>
            <Toolbar map={currentMap} onExport={handleExport} />
            <MindMap
              nodes={currentMap.nodes}
              title={currentMap.title}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onEditNode={handleNodeEdit}
              onDeleteNode={handleNodeDelete}
              onExpandNode={handleExpandNode}
            />
          </>
        )}
      </main>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {showAuth && (
        <div className="auth-overlay" onClick={handleToggleAuth}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <Auth 
              onAuth={handleAuth} 
              isLoading={authLoading} 
              error={authError} 
              successMessage={authSuccess}
              onClearSuccess={handleClearAuthSuccess}
              onClose={() => {
                if (!authLoading) {
                  handleToggleAuth();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
