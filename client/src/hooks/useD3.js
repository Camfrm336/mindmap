// /home/cameron/mindmap/voice-mindmap/client/src/hooks/useD3.js

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export function useD3(nodes, options = {}) {
  const simulationRef = useRef(null);
  
  const createSimulation = (nodeData, width, height) => {
    // Clean up existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }
    
    const simulation = d3.forceSimulation(nodeData)
      .force('link', d3.forceLink()
        .id(d => d.id)
        .distance(d => {
          if (d.source.depth === 0) return 160;
          if (d.source.depth === 1) return 120;
          return 90;
        })
        .strength(0.8))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(70))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));
    
    simulationRef.current = simulation;
    return simulation;
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);
  
  return {
    simulationRef,
    createSimulation
  };
}

export function restartSimulation(simulationRef, alpha = 0.1) {
  if (simulationRef.current) {
    simulationRef.current.alpha(alpha).restart();
  }
}
