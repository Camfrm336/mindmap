// /home/cameron/mindmap/voice-mindmap/client/src/utils/colors.js

export const CATEGORY_COLORS = {
  insight: '#7c6dfa',
  action: '#34d399',
  question: '#f59e0b',
  example: '#60a5fa',
  concept: '#a78bfa',
  warning: '#f87171',
  resource: '#2dd4bf',
  outcome: '#86efac',
  expansion: '#ec4899'  // Pink for AI-generated expansion nodes
};

export const CATEGORY_LABELS = {
  insight: 'Insight',
  action: 'Action',
  question: 'Question',
  example: 'Example',
  concept: 'Concept',
  warning: 'Warning',
  resource: 'Resource',
  outcome: 'Outcome',
  expansion: 'Expansion Points'
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || '#888888';
}

export function getCategoryColorAlpha(category, alpha) {
  const rgb = hexToRgb(getCategoryColor(category));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
