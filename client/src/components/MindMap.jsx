// /home/cameron/mindmap/voice-mindmap/client/src/components/MindMap.jsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { getCategoryColor, getCategoryColorAlpha, CATEGORY_LABELS } from '../utils/colors.js';
import NodeEditor from './NodeEditor.jsx';

export default function MindMap({
  nodes: initialNodes,
  title,
  selectedNodeId,
  onSelectNode,
  onEditNode,
  onDeleteNode,
  onExpandNode
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [nodes, setNodes] = useState(initialNodes);
  const [links, setLinks] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [editingPosition, setEditingPosition] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type, node }
  const simulationRef = useRef(null);
  const draggedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  // Initialize nodes and links
  useEffect(() => {
    if (!initialNodes) return;
    
    const newNodes = initialNodes.map(n => ({ ...n }));
    const newLinks = newNodes
      .filter(n => n.parentId !== null)
      .map(n => ({
        source: n.parentId,
        target: n.id
      }));
    
    setNodes(newNodes);
    setLinks(newLinks);
  }, [initialNodes]);
  
  // D3 setup and simulation
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;
    
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // Create zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        svg.select('.zoom-container').attr('transform', event.transform);
        setZoom(event.transform.k);
      });
    
    svg.call(zoomBehavior);
    
    // Create container for zoom
    const container = svg.append('g').attr('class', 'zoom-container');
    
    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => {
          const sourceNode = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
          if (!sourceNode) return 200;
          if (sourceNode.depth === 0) return 280;
          if (sourceNode.depth === 1) return 200;
          return 140;
        })
        .strength(0.6))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(90))
      .force('x', d3.forceX(width / 2).strength(0.03))
      .force('y', d3.forceY(height / 2).strength(0.03));
    
    simulationRef.current = simulation;
    
    // Draw links
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.35)')
      .attr('stroke-width', d => {
        const sourceNode = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
        if (!sourceNode) return 2;
        if (sourceNode.depth === 0) return 3;
        if (sourceNode.depth === 1) return 2.5;
        return 2;
      })
      .attr('stroke-dasharray', d => {
        const sourceNode = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source);
        if (!sourceNode || sourceNode.depth >= 2) return '6 4';
        return 'none';
      })
      .attr('opacity', 0.9);
    
    // Draw nodes
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', d => `node node-${d.category}`)
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          draggedRef.current = false;
          dragStartRef.current = { x: event.x, y: event.y };
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          const dx = Math.abs(event.x - dragStartRef.current.x);
          const dy = Math.abs(event.y - dragStartRef.current.y);
          if (dx > 5 || dy > 5) {
            draggedRef.current = true;
          }
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));
    
    // Node backgrounds
    node.each(function(d) {
      const g = d3.select(this);
      const depth = d.depth || 0;
      
      // Calculate text wrapping first
      const words = d.label.split(' ');
      const lines = [];
      let currentLine = '';
      const maxChars = 22;
      
      words.forEach(word => {
        if ((currentLine + ' ' + word).trim().length <= maxChars) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      
      const lineCount = lines.length;
      const labelLength = Math.min(Math.max(d.label.length * 6.5, 140), 240);
      const textHeight = Math.max(lineCount, 1) * 16;
      const height = depth === 0 ? Math.max(52, textHeight + 20) : Math.max(40, textHeight + 20);
      
      if (depth === 0) {
        // Root node - pill shape, dynamic size based on text
        const rootWidth = Math.min(Math.max(d.label.length * 8, 180), 300);
        g.append('rect')
          .attr('class', 'node-bg')
          .attr('width', rootWidth)
          .attr('height', height)
          .attr('x', -rootWidth / 2)
          .attr('y', -height / 2)
          .attr('rx', height / 2)
          .attr('fill', getCategoryColor('concept'))
          .attr('opacity', 0)
          .transition()
          .duration(400)
          .attr('opacity', 1);
      } else if (depth === 1) {
        // Level 1 - category color with opacity
        g.append('rect')
          .attr('class', 'node-bg')
          .attr('width', labelLength)
          .attr('height', height)
          .attr('x', -labelLength / 2)
          .attr('y', -height / 2)
          .attr('rx', 8)
          .attr('fill', getCategoryColorAlpha(d.category, 0.2))
          .attr('stroke', getCategoryColor(d.category))
          .attr('stroke-width', 1.5)
          .attr('opacity', 0)
          .transition()
          .duration(400)
          .delay(depth === 1 ? 150 : 300)
          .attr('opacity', 1);
        
        // Category dot
        g.append('circle')
          .attr('class', 'category-dot')
          .attr('cx', labelLength / 2 - 12)
          .attr('cy', -height / 2 + 12)
          .attr('r', 4)
          .attr('fill', getCategoryColor(d.category))
          .attr('opacity', 0)
          .transition()
          .duration(400)
          .delay(depth === 1 ? 150 : 300)
          .attr('opacity', 1);
      } else {
        // Level 2+ - elevated background
        g.append('rect')
          .attr('class', 'node-bg')
          .attr('width', labelLength)
          .attr('height', height)
          .attr('x', -labelLength / 2)
          .attr('y', -height / 2)
          .attr('rx', 6)
          .attr('fill', '#2a2a30')
          .attr('stroke', 'rgba(255, 255, 255, 0.08)')
          .attr('stroke-width', 1)
          .attr('opacity', 0)
          .transition()
          .duration(400)
          .delay(depth === 2 ? 300 : 400)
          .attr('opacity', 1);
      }
      
      // Label text - use pre-calculated lines
      lines.forEach((line, i) => {
        g.append('text')
          .attr('class', 'node-label')
          .attr('x', 0)
          .attr('y', (i - (lines.length - 1) / 2) * 16)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#f4f4f5')
          .attr('font-family', 'DM Sans, sans-serif')
          .attr('font-size', depth === 0 ? '14px' : depth === 1 ? '13px' : '12px')
          .attr('font-weight', depth === 0 ? 600 : depth === 1 ? 500 : 400)
          .text(line)
          .attr('opacity', 0)
          .transition()
          .duration(400)
          .delay(depth === 0 ? 0 : depth === 1 ? 150 : 300)
          .attr('opacity', 1);
      });
    });
    
    // Selection glow
    const selectedGlow = node.filter(d => d.id === selectedNodeId)
      .append('circle')
      .attr('class', 'selection-glow')
      .attr('r', 35)
      .attr('fill', 'none')
      .attr('stroke', getCategoryColor('insight'))
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .attr('pointer-events', 'none');
    
    if (selectedNodeId) {
      selectedGlow.transition().duration(200).attr('opacity', 0.8);
    }
    
    // Double-click handler - opens editor
    node.on('dblclick', function(event, d) {
      event.stopPropagation();
      setEditingPosition({ x: d.x, y: d.y });
      setEditingNode(d);
    });
    
    // Right-click handler - opens context menu with boundary detection
    node.on('contextmenu', function(event, d) {
      event.preventDefault();
      event.stopPropagation();
      
      // Calculate menu position with boundary detection
      const menuWidth = 180;
      const menuHeight = 180;
      let x = event.clientX;
      let y = event.clientY;
      
      // Adjust if menu would go off right edge
      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10;
      }
      
      // Adjust if menu would go off bottom edge
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 10;
      }
      
      setContextMenu({
        x,
        y,
        node: d
      });
    });
    
    // Tick function
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });
    
    // Click on background to deselect
    svg.on('click', () => {
      onSelectNode(null);
      setContextMenu(null);
    });
    
    return () => {
      simulation.stop();
    };
  }, [nodes, links, selectedNodeId, onSelectNode]);
  
  // Update node colors when nodes change
  useEffect(() => {
    if (!svgRef.current) return;
    
    setTimeout(() => {
      d3.select(svgRef.current).selectAll('.nodes g').each(function(d) {
        const g = d3.select(this);
        const depth = d.depth;
        
        if (depth === 0) {
          // Root node - solid color
          g.select('.node-bg').attr('fill', getCategoryColor(d.category));
        } else {
          // Depth 1+ - category color with opacity + category border + dot
          g.select('.node-bg')
            .attr('fill', getCategoryColorAlpha(d.category, 0.2))
            .attr('stroke', getCategoryColor(d.category));
          g.select('.category-dot').attr('fill', getCategoryColor(d.category));
        }
      });
    }, 100);
  }, [nodes]);
  
  // Handle zoom
  const handleZoom = (direction) => {
    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom().scaleExtent([0.2, 3]);
    svg.transition().duration(300).call(zoomBehavior.scaleBy, direction === 'in' ? 1.3 : 0.7);
  };
  
  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom().scaleExtent([0.2, 3]);
    svg.transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity);
  };
  
  // Handle context menu actions
  const handleContextAction = (action) => {
    const node = contextMenu?.node;
    setContextMenu(null);
    
    if (!node) return;
    
    switch (action) {
      case 'edit':
        setEditingPosition({ x: node.x, y: node.y });
        setEditingNode(node);
        break;
      case 'expand': {
        // Check if node already has children (was already expanded)
        const hasChildren = nodes.some(n => n.parentId === node.id);
        if (node.depth >= 3 || hasChildren) return;
        setConfirmAction({ type: 'expand', node });
        break;
      }
      case 'delete':
        setConfirmAction({ type: 'delete', node });
        break;
      case 'copy':
        navigator.clipboard.writeText(node.label);
        break;
    }
  };
  
  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);
  
  // Get unique categories in map
  const categoriesInMap = [...new Set(nodes.map(n => n.category))].filter(Boolean);
  
  // Count links
  const linkCount = links.length;
  
  return (
    <div className="mindmap-container" ref={containerRef}>
      <div className="mindmap-title">{title}</div>
      <div className="mindmap-stats">
        {nodes.length} nodes · {linkCount} connections
      </div>
      
      <div className="mindmap-legend">
        {categoriesInMap.map(cat => (
          <span key={cat} className="legend-pill">
            <span className="legend-dot" style={{ backgroundColor: getCategoryColor(cat) }}></span>
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>
      
      <div className="zoom-controls">
        <button onClick={() => handleZoom('in')}>+</button>
        <button onClick={() => handleZoom('out')}>−</button>
        <button onClick={handleResetZoom}>⊙</button>
      </div>
      
      <svg ref={svgRef} className="mindmap-svg"></svg>
      
      {contextMenu && (
        <div 
          className="context-menu" 
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={() => handleContextAction('edit')}>Edit label</button>
          <button 
            onClick={() => handleContextAction('expand')}
            disabled={contextMenu.node?.depth >= 3 || nodes.some(n => n.parentId === contextMenu.node?.id)}
          >
            {contextMenu.node?.depth >= 3 ? 'Max depth reached' : nodes.some(n => n.parentId === contextMenu.node?.id) ? 'Already expanded' : 'Expand this topic'}
          </button>
          <button onClick={() => handleContextAction('delete')}>Delete node</button>
          <button onClick={() => handleContextAction('copy')}>Copy label</button>
        </div>
      )}
      
      {editingNode && editingPosition && (
        <NodeEditor
          node={editingNode}
          position={editingPosition}
          onSave={(updated) => {
            onEditNode(updated.id, updated.label, updated.category);
            setEditingNode(null);
          }}
          onCancel={() => setEditingNode(null)}
        />
      )}
      
      {confirmAction && (
        <div className="confirm-overlay" onClick={() => setConfirmAction(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmAction.type === 'expand' ? 'Expand Topic' : 'Delete Node'}</h3>
            <p>
              {confirmAction.type === 'expand' 
                ? `Ask AI to expand on "${confirmAction.node.label}"?`
                : `Delete "${confirmAction.node.label}" and all its children? This cannot be undone.`}
            </p>
            <div className="confirm-buttons">
              <button 
                className="confirm-cancel"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button 
                className="confirm-ok"
                onClick={() => {
                  if (confirmAction.type === 'expand') {
                    onExpandNode(confirmAction.node.id, confirmAction.node.label);
                  } else {
                    onDeleteNode(confirmAction.node.id);
                  }
                  setConfirmAction(null);
                }}
              >
                {confirmAction.type === 'expand' ? 'Expand' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
