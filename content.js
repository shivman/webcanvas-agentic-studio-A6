import aiService from './ai-service';

// Global variables
let isInitialized = false;
let canvas = null;
let ctx = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let drawingModeActive = false;
let toolbarVisible = false;
let toolbarCollapsed = false;
let currentColor = '#f44336';
let currentTool = 'pen';
let currentSize = 5;
let drawingHistory = [];

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

function initializeDrawingTool() {
  if (isInitialized) return;
  
  canvas = document.createElement('canvas');
  canvas.id = 'web-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '2147483647';
  canvas.style.pointerEvents = 'none';
  canvas.style.display = 'none';
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  ctx = canvas.getContext('2d');
  // Configure default based on initial tool.
  if (currentTool === 'pen') {
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
  } else {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  ctx.lineWidth = currentSize;
  ctx.strokeStyle = currentColor;
  
  document.body.appendChild(canvas);
  
  createToolbar();
  
  document.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  
  isInitialized = true;
  console.log('Web Canvas: Initialized');
}

function handleKeyDown(e) {
  if (e.key.toLowerCase() === 'd' && e.altKey) {
    toggleDrawingMode();
    e.preventDefault();
  }
}

function toggleDrawingMode(force = null) {
  if (!isInitialized) initializeDrawingTool();
  
  drawingModeActive = force !== null ? force : !drawingModeActive;
  canvas.style.display = drawingModeActive ? 'block' : 'none';
  canvas.style.pointerEvents = drawingModeActive ? 'auto' : 'none';
  
  const toolbar = document.getElementById('web-canvas-toolbar');
  if (toolbar) toolbar.style.display = drawingModeActive ? 'block' : 'none';

  if (drawingModeActive) {
    canvas.addEventListener('mousedown', startDrawing);
    window.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
  } else {
    canvas.removeEventListener('mousedown', startDrawing);
    window.removeEventListener('mousemove', draw);
    window.removeEventListener('mouseup', stopDrawing);
  }
}

function startDrawing(e) {
  isDrawing = true;
  lastX = e.clientX;
  lastY = e.clientY;

  // Configure drawing behavior per tool
  ctx.strokeStyle = currentColor;
  ctx.lineWidth = currentSize;
  if (currentTool === 'pen') {
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
  } else {
    // Brush
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
}

function draw(e) {
  if (!isDrawing) return;

  const x = e.clientX;
  const y = e.clientY;

  ctx.strokeStyle = currentColor;

  let lineWidth = currentSize;
  if (currentTool === 'brush') {
    // Slightly vary stroke width based on cursor speed for a more "painterly" feel.
    const dx = x - lastX;
    const dy = y - lastY;
    const speed = Math.sqrt(dx * dx + dy * dy);
    // Faster movement => thinner line.
    const factor = Math.max(0.6, Math.min(1.4, 1 - speed / 200));
    lineWidth = currentSize * factor;
  }
  ctx.lineWidth = lineWidth;

  ctx.lineTo(x, y);
  ctx.stroke();
  lastX = x;
  lastY = y;
}

function stopDrawing() {
  isDrawing = false;
  ctx.closePath();
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function createToolbar() {
  const tb = document.createElement('div');
  tb.id = 'web-canvas-toolbar';
  tb.style.cssText = 'position:fixed; top:10px; right:10px; background:white; padding:12px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.2); z-index:2147483647; display:none; width: 280px;';

  // Small helper to mark active buttons.
  function setButtonActive(btn, active) {
    if (!btn) return;
    btn.style.backgroundColor = active ? '#e6f2ff' : '#f5f5f5';
    btn.style.border = active ? '1px solid #4285f4' : '1px solid #ddd';
  }

  // --- Tools (Pen / Brush)
  const toolsRow = document.createElement('div');
  toolsRow.style.display = 'flex';
  toolsRow.style.gap = '10px';
  toolsRow.style.marginBottom = '10px';

  const penBtn = document.createElement('button');
  penBtn.textContent = 'Pen';
  penBtn.dataset.tool = 'pen';
  penBtn.style.flex = '1';
  penBtn.style.padding = '10px 8px';
  penBtn.style.cursor = 'pointer';
  penBtn.style.backgroundColor = '#e6f2ff';
  penBtn.style.border = '1px solid #4285f4';
  penBtn.onclick = () => {
    currentTool = 'pen';
    setButtonActive(penBtn, true);
    setButtonActive(brushBtn, false);
    // Apply immediately if drawing already initialized.
    if (ctx) {
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
    }
  };

  const brushBtn = document.createElement('button');
  brushBtn.textContent = 'Brush';
  brushBtn.dataset.tool = 'brush';
  brushBtn.style.flex = '1';
  brushBtn.style.padding = '10px 8px';
  brushBtn.style.cursor = 'pointer';
  brushBtn.style.backgroundColor = '#f5f5f5';
  brushBtn.style.border = '1px solid #ddd';
  brushBtn.onclick = () => {
    currentTool = 'brush';
    setButtonActive(penBtn, false);
    setButtonActive(brushBtn, true);
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  toolsRow.appendChild(penBtn);
  toolsRow.appendChild(brushBtn);
  tb.appendChild(toolsRow);

  // --- Size
  const sizeRow = document.createElement('div');
  sizeRow.style.marginBottom = '10px';

  const sizeLabel = document.createElement('div');
  sizeLabel.textContent = 'Size';
  sizeLabel.style.fontWeight = '700';
  sizeLabel.style.marginBottom = '6px';
  tb.appendChild(sizeRow);
  sizeRow.appendChild(sizeLabel);

  const sizeControls = document.createElement('div');
  sizeControls.style.display = 'flex';
  sizeControls.style.alignItems = 'center';
  sizeControls.style.gap = '10px';

  const sizeSlider = document.createElement('input');
  sizeSlider.type = 'range';
  sizeSlider.min = '1';
  sizeSlider.max = '20';
  sizeSlider.value = String(currentSize);
  sizeSlider.style.flex = '1';

  const sizeDisplay = document.createElement('span');
  sizeDisplay.textContent = `${currentSize}px`;
  sizeDisplay.style.minWidth = '64px';
  sizeDisplay.style.textAlign = 'right';

  sizeSlider.oninput = () => {
    currentSize = parseInt(sizeSlider.value, 10);
    sizeDisplay.textContent = `${currentSize}px`;
    if (ctx) ctx.lineWidth = currentSize;
  };

  sizeControls.appendChild(sizeSlider);
  sizeControls.appendChild(sizeDisplay);
  sizeRow.appendChild(sizeControls);

  // --- Colors
  const colorsRow = document.createElement('div');
  colorsRow.style.marginBottom = '10px';

  const colorsLabel = document.createElement('div');
  colorsLabel.textContent = 'Colors';
  colorsLabel.style.fontWeight = '700';
  colorsLabel.style.marginBottom = '8px';
  colorsRow.appendChild(colorsLabel);

  const colorsGrid = document.createElement('div');
  colorsGrid.style.display = 'flex';
  colorsGrid.style.flexWrap = 'wrap';
  colorsGrid.style.gap = '10px';

  const colors = [
    { hex: '#f44336', name: 'Red' },
    { hex: '#2196f3', name: 'Blue' },
    { hex: '#4caf50', name: 'Green' },
    { hex: '#ff9800', name: 'Orange' },
    { hex: '#9c27b0', name: 'Purple' },
    { hex: '#ffeb3b', name: 'Yellow' },
    { hex: '#000000', name: 'Black' },
    { hex: '#ffffff', name: 'White' },
  ];

  const colorButtons = [];
  colors.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.color = c.hex;
    btn.title = c.name;
    btn.style.width = '34px';
    btn.style.height = '34px';
    btn.style.borderRadius = '50%';
    btn.style.cursor = 'pointer';
    btn.style.border = c.hex === '#ffffff' ? '1px solid #ddd' : 'none';
    btn.style.backgroundColor = c.hex;
    btn.style.padding = '0';
    btn.style.boxShadow = c.hex === currentColor ? '0 0 0 3px rgba(0,0,0,0.2)' : 'none';
    btn.onclick = () => {
      currentColor = c.hex;
      colorButtons.forEach(b => (b.style.boxShadow = (b.dataset.color === currentColor) ? '0 0 0 3px rgba(0,0,0,0.2)' : 'none'));
      if (ctx) ctx.strokeStyle = currentColor;
    };
    colorsGrid.appendChild(btn);
    colorButtons.push(btn);
  });

  colorsRow.appendChild(colorsGrid);
  tb.appendChild(colorsRow);

  // --- Actions (Clear / Close)
  const actionsRow = document.createElement('div');
  actionsRow.style.display = 'flex';
  actionsRow.style.gap = '10px';
  actionsRow.style.marginTop = '6px';

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear';
  clearBtn.style.flex = '1';
  clearBtn.style.padding = '10px 8px';
  clearBtn.style.cursor = 'pointer';
  clearBtn.style.backgroundColor = '#f5f5f5';
  clearBtn.style.border = '1px solid #ddd';
  clearBtn.onclick = clearCanvas;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.flex = '1';
  closeBtn.style.padding = '10px 8px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.backgroundColor = '#f5f5f5';
  closeBtn.style.border = '1px solid #ddd';
  closeBtn.onclick = () => toggleDrawingMode(false);

  actionsRow.appendChild(clearBtn);
  actionsRow.appendChild(closeBtn);
  tb.appendChild(actionsRow);

  document.body.appendChild(tb);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!isInitialized) initializeDrawingTool();

  if (request.action === 'activateDrawing') {
    toggleDrawingMode(true);
    sendResponse({ success: true });
    return;
  } 
  else if (request.action === 'deactivateDrawing') {
    toggleDrawingMode(false);
    sendResponse({ success: true });
    return;
  }
  else if (request.action === 'clearCanvas') {
    clearCanvas();
    sendResponse({ success: true });
    return;
  }
  else if (request.action === 'analyzeDrawing') {
    (async () => {
      try {
        const result = await aiService.analyzeDrawing(canvas);
        sendResponse({ result });
      } catch (e) {
        sendResponse({ error: e.message });
      }
    })();
    return true; // CRITICAL: Tells Chrome we will send response asynchronously
  }
  else if (request.action === 'getSuggestions') {
    (async () => {
      try {
        const result = await aiService.getSuggestions(canvas);
        sendResponse({ result });
      } catch (e) {
        sendResponse({ error: e.message });
      }
    })();
    return true;
  }
  else if (request.action === 'generatePrompt') {
    (async () => {
      try {
        const result = await aiService.generateDrawingPrompt();
        sendResponse({ result });
      } catch (e) {
        sendResponse({ error: e.message });
      }
    })();
    return true;
  }
});