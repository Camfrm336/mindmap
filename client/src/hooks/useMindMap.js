// /home/cameron/mindmap/voice-mindmap/client/src/hooks/useMindMap.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchMindMaps, saveMindMap, deleteMindMap, isSupabaseConfigured } from '../lib/supabase.js';

const STORAGE_KEY = 'mindmapper_v1_history';
const MAX_HISTORY = 20;

// Initialize node positions to prevent D3 explosion
export function initNodePositions(nodes, width, height) {
  if (!nodes || nodes.length === 0) return nodes;
  
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Group by depth
  const byDepth = { 0: [], 1: [], 2: [], 3: [] };
  nodes.forEach(node => {
    if (byDepth[node.depth] !== undefined) {
      byDepth[node.depth].push(node);
    }
  });
  
  // Position root
  const root = byDepth[0][0];
  if (root) {
    root.x = centerX;
    root.y = centerY;
  }
  
  // Position depth 1 nodes on a circle
  const depth1 = byDepth[1];
  if (depth1.length > 0) {
    const radius1 = 200;
    depth1.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / depth1.length - Math.PI / 2;
      node.x = centerX + radius1 * Math.cos(angle);
      node.y = centerY + radius1 * Math.sin(angle);
    });
  }
  
  // Position depth 2 nodes near their parents
  const depth2 = byDepth[2];
  if (depth2.length > 0) {
    depth2.forEach((node, i) => {
      const parent = nodes.find(n => n.id === node.parentId);
      if (parent) {
        const offsetAngle = (i % 2 === 0 ? 1 : -1) * (0.3 + (i * 0.1));
        const dist = 80;
        node.x = parent.x + dist * Math.cos(offsetAngle);
        node.y = parent.y + dist * Math.sin(offsetAngle);
      } else {
        node.x = centerX + (Math.random() - 0.5) * 100;
        node.y = centerY + (Math.random() - 0.5) * 100;
      }
    });
  }
  
  // Position depth 3 nodes near their parents
  const depth3 = byDepth[3];
  if (depth3.length > 0) {
    depth3.forEach((node, i) => {
      const parent = nodes.find(n => n.id === node.parentId);
      if (parent) {
        const offsetAngle = (i % 2 === 0 ? 1 : -1) * 0.4;
        const dist = 60;
        node.x = parent.x + dist * Math.cos(offsetAngle);
        node.y = parent.y + dist * Math.sin(offsetAngle);
      } else {
        node.x = centerX + (Math.random() - 0.5) * 80;
        node.y = centerY + (Math.random() - 0.5) * 80;
      }
    });
  }
  
  return nodes;
}

export function useMindMap(user = null) {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMap, setCurrentMap] = useState(null);
  const [mapHistory, setMapHistory] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  
  const supabaseConfigured = isSupabaseConfigured();
  
  // Load history from localStorage or Supabase on mount
  useEffect(() => {
    const loadHistory = async () => {
      // If user is logged in, try to load from Supabase
      if (user && supabaseConfigured) {
        try {
          setIsSupabaseReady(true);
          const remoteMaps = await fetchMindMaps(user.id);
          if (remoteMaps && remoteMaps.length > 0) {
            const formattedMaps = remoteMaps.map(m => ({
              id: m.id,
              title: m.title,
              nodes: typeof m.nodes === 'string' ? JSON.parse(m.nodes) : m.nodes,
              createdAt: m.created_at,
              updatedAt: m.updated_at,
              synced: true
            }));
            setMapHistory(formattedMaps);
            return;
          }
        } catch (err) {
          console.error('Failed to load from Supabase:', err.message);
        }
      }
      
      // Fall back to localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setMapHistory(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to load history:', err.message);
      }
    };
    
    loadHistory();
  }, [user, supabaseConfigured]);
  
  // Save map to Supabase when user changes or map updates
  const syncMapToSupabase = useCallback(async (map) => {
    if (!user || !supabaseConfigured) return;
    
    try {
      const saved = await saveMindMap(user.id, map);
      if (saved) {
        // Update local history with the synced map
        setMapHistory(prev => {
          const existing = prev.findIndex(m => m.id === saved.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = {
              ...saved,
              nodes: typeof saved.nodes === 'string' ? JSON.parse(saved.nodes) : saved.nodes,
              synced: true
            };
            return updated;
          } else {
            return [{
              ...saved,
              nodes: typeof saved.nodes === 'string' ? JSON.parse(saved.nodes) : saved.nodes,
              synced: true
            }, ...prev];
          }
        });
      }
    } catch (err) {
      console.error('Failed to sync to Supabase:', err.message);
    }
  }, [user, supabaseConfigured]);
  
  // Save history to localStorage
  const saveHistory = useCallback((history) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save history:', err.message);
    }
  }, []);
  
  // Show toast message
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);
  
  // Handle extraction
  const handleExtract = useCallback(async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 500 && data.error?.includes('ANTHROPIC_API_KEY')) {
          setError(data.error);
        } else {
          setError(data.detail || data.error || 'Extraction failed');
        }
        return;
      }
      
      // Assign initial positions
      const canvasWidth = 800;
      const canvasHeight = 600;
      const positionedNodes = initNodePositions(data.nodes, canvasWidth, canvasHeight);
      
      const newMap = {
        title: data.title,
        nodes: positionedNodes,
        createdAt: new Date().toISOString()
      };
      
      setCurrentMap(newMap);
      setSelectedNodeId(null);
      
      // Update history
      const updatedHistory = [newMap, ...mapHistory].slice(0, MAX_HISTORY);
      setMapHistory(updatedHistory);
      saveHistory(updatedHistory);
      
      // Sync to Supabase if logged in
      if (user && supabaseConfigured) {
        syncMapToSupabase(newMap);
      }
      
      showToast('Mind map generated successfully', 'success');
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  }, [transcript, mapHistory, saveHistory, showToast]);
  
  // Handle node edit
  const handleNodeEdit = useCallback((nodeId, newLabel, newCategory) => {
    if (!currentMap) return;
    
    setCurrentMap(prev => {
      const updated = {
        ...prev,
        nodes: prev.nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, label: newLabel, category: newCategory || node.category };
          }
          return node;
        })
      };
      
      // Update history
      const historyIndex = mapHistory.findIndex(m => m.createdAt === currentMap.createdAt);
      if (historyIndex >= 0) {
        const newHistory = [...mapHistory];
        newHistory[historyIndex] = updated;
        setMapHistory(newHistory);
        saveHistory(newHistory);
        
        // Sync to Supabase if logged in
        if (user && supabaseConfigured && updated.id) {
          syncMapToSupabase(updated);
        }
      }
      
      return updated;
    });
  }, [currentMap, mapHistory, saveHistory, user, supabaseConfigured, syncMapToSupabase]);
  
  // Handle node delete (including descendants)
  const handleNodeDelete = useCallback((nodeId) => {
    if (!currentMap) return;
    
    // Find all descendant node IDs recursively
    const nodesToDelete = new Set([nodeId]);
    
    const findDescendants = (parentId) => {
      currentMap.nodes.forEach(node => {
        if (node.parentId === parentId) {
          nodesToDelete.add(node.id);
          findDescendants(node.id);
        }
      });
    };
    
    findDescendants(nodeId);
    
    const updated = {
      ...currentMap,
      nodes: currentMap.nodes.filter(node => !nodesToDelete.has(node.id))
    };
    
    setCurrentMap(updated);
    setSelectedNodeId(null);
    
    // Update history
    const historyIndex = mapHistory.findIndex(m => m.createdAt === currentMap.createdAt);
    if (historyIndex >= 0) {
      const newHistory = [...mapHistory];
      newHistory[historyIndex] = updated;
      setMapHistory(newHistory);
      saveHistory(newHistory);
      
      // Sync to Supabase if logged in
      if (user && supabaseConfigured && updated.id) {
        syncMapToSupabase(updated);
      }
    }
    
    showToast('Node deleted', 'info');
  }, [currentMap, mapHistory, saveHistory, showToast, user, supabaseConfigured, syncMapToSupabase]);
  
  // Handle select from history
  const handleSelectFromHistory = useCallback((map) => {
    setCurrentMap(map);
    setSelectedNodeId(null);
  }, []);
  
  // Clear history without confirmation (for use on sign out)
  const clearHistorySilently = useCallback(() => {
    setMapHistory([]);
    setCurrentMap(null);
    setSelectedNodeId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);
  
  // Handle clear history (with confirmation)
  const handleClearHistory = useCallback(async () => {
    if (window.confirm('Clear all history? This cannot be undone.')) {
      // Delete all maps from Supabase if logged in
      if (user && supabaseConfigured) {
        try {
          for (const map of mapHistory) {
            if (map.id) {
              await deleteMindMap(user.id, map.id);
            }
          }
        } catch (err) {
          console.error('Failed to delete from Supabase:', err.message);
        }
      }
      
      setMapHistory([]);
      setCurrentMap(null);
      setSelectedNodeId(null);
      localStorage.removeItem(STORAGE_KEY);
      showToast('History cleared', 'info');
    }
  }, [user, mapHistory, supabaseConfigured, showToast]);
  
  // Handle expand node - ask AI to add child nodes
  const handleExpandNode = useCallback(async (nodeId, label) => {
    if (!currentMap) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          label,
          existingNodes: currentMap.nodes
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.detail || data.error || 'Expansion failed');
        return;
      }
      
      // Add new nodes to current map
      const newNodes = data.nodes.map(n => {
        // Position new nodes near the parent
        const parent = currentMap.nodes.find(p => p.id === nodeId);
        const offset = (Math.random() - 0.5) * 80;
        return {
          ...n,
          x: parent ? parent.x + offset : 400,
          y: parent ? parent.y + 80 : 300
        };
      });
      
      const updated = {
        ...currentMap,
        nodes: [...currentMap.nodes, ...newNodes]
      };
      
      setCurrentMap(updated);
      
      // Update history
      const historyIndex = mapHistory.findIndex(m => m.createdAt === currentMap.createdAt);
      if (historyIndex >= 0) {
        const newHistory = [...mapHistory];
        newHistory[historyIndex] = updated;
        setMapHistory(newHistory);
        saveHistory(newHistory);
        
        // Sync to Supabase if logged in
        if (user && supabaseConfigured && updated.id) {
          syncMapToSupabase(updated);
        }
      }
      
      showToast(`Added ${newNodes.length} new nodes`, 'success');
    } catch (err) {
      setError(err.message || 'Failed to expand topic');
    } finally {
      setIsLoading(false);
    }
  }, [currentMap, mapHistory, saveHistory, showToast, user, supabaseConfigured, syncMapToSupabase]);
  
  return {
    transcript,
    setTranscript,
    isLoading,
    error,
    setError,
    currentMap,
    setCurrentMap,
    mapHistory,
    clearMapHistory: clearHistorySilently,
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
  };
}
