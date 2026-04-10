// /home/cameron/mindmap/voice-mindmap/client/src/utils/export.js

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportPNG(svgElement, filename) {
  if (!svgElement) return;
  
  const rect = svgElement.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  
  // Clone SVG
  const clone = svgElement.cloneNode(true);
  
  // Inline styles
  const originalElements = svgElement.querySelectorAll('*');
  const clonedElements = clone.querySelectorAll('*');
  
  originalElements.forEach((el, i) => {
    const computedStyle = window.getComputedStyle(el);
    const clonedEl = clonedElements[i];
    if (clonedEl && clonedEl.tagName !== 'svg') {
      clonedEl.style.fill = computedStyle.fill || '';
      clonedEl.style.stroke = computedStyle.stroke || '';
      clonedEl.style.strokeWidth = computedStyle.strokeWidth || '';
      clonedEl.style.opacity = computedStyle.opacity || '';
      clonedEl.style.fontFamily = computedStyle.fontFamily || '';
      clonedEl.style.fontSize = computedStyle.fontSize || '';
      clonedEl.style.fontWeight = computedStyle.fontWeight || '';
    }
  });
  
  // Add background
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', '#0f0f11');
  clone.insertBefore(bgRect, clone.firstChild);
  
  // Serialize
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  
  // Create blob and image
  const blobSvg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blobSvg);
  
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.drawImage(img, 0, 0);
    
    canvas.toBlob((pngBlob) => {
      downloadBlob(pngBlob, filename + '.png');
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.src = url;
}

export function exportSVG(svgElement, filename) {
  if (!svgElement) return;
  
  // Clone SVG
  const clone = svgElement.cloneNode(true);
  
  // Inline styles
  const originalElements = svgElement.querySelectorAll('*');
  const clonedElements = clone.querySelectorAll('*');
  
  originalElements.forEach((el, i) => {
    const computedStyle = window.getComputedStyle(el);
    const clonedEl = clonedElements[i];
    if (clonedEl && clonedEl.tagName !== 'svg') {
      clonedEl.style.fill = computedStyle.fill || '';
      clonedEl.style.stroke = computedStyle.stroke || '';
      clonedEl.style.strokeWidth = computedStyle.strokeWidth || '';
      clonedEl.style.opacity = computedStyle.opacity || '';
      clonedEl.style.fontFamily = computedStyle.fontFamily || '';
      clonedEl.style.fontSize = computedStyle.fontSize || '';
      clonedEl.style.fontWeight = computedStyle.fontWeight || '';
    }
  });
  
  // Add background
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', '#0f0f11');
  clone.insertBefore(bgRect, clone.firstChild);
  
  // Serialize
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename + '.svg');
}

export function exportJSON(map, filename) {
  const data = JSON.stringify(map, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadBlob(blob, filename + '.json');
}
