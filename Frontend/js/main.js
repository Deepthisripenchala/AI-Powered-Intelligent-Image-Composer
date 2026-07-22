// main.js - global variables & initialization
// NOTE: Variables are intentionally 'var' to make them global across other non-module JS files.

var IMAGE_SIZE = 512;

// DOM elements (these are global)
var bgImageElem = document.getElementById('bgImage');
var fgImageElem = document.getElementById('fgImage');
var blendedCanvas = document.getElementById('blendedCanvas');
var messageBox = document.getElementById('messageBox');

var blendModeSelect = document.getElementById('blendMode');
var opacitySlider = document.getElementById('opacitySlider');
var generateBtn = document.getElementById('generateBtn');
var autoAdjustBtn = document.getElementById('autoAdjustBtn');
var downloadBtn = document.getElementById('downloadBtn');

var loadingIndicator = document.getElementById('loadingIndicator');
var agentLoadingIndicator = document.getElementById('agentLoadingIndicator');

var autoRemoveBgCheckbox = document.getElementById('autoRemoveBg');
var toleranceSlider = document.getElementById('toleranceSlider');
var requestPngTransparency = document.getElementById('requestPngTransparency');

var fgRotation = document.getElementById('fgRotation');
var fgMirror = document.getElementById('fgMirror');
var fgBrightness = document.getElementById('fgBrightness');
var fgContrast = document.getElementById('fgContrast');
var fgSaturation = document.getElementById('fgSaturation');
var fgHue = document.getElementById('fgHue');
var fgSkewX = document.getElementById('fgSkewX');
var fgSkewY = document.getElementById('fgSkewY');

var bgPromptArea = document.getElementById('bgPrompt');
var fgPromptArea = document.getElementById('fgPrompt');
var agentPromptArea = document.getElementById('agentPrompt');
var fgX = document.getElementById('fgX');
var fgY = document.getElementById('fgY');
var fgScale = document.getElementById('fgScale');

var ctx = blendedCanvas.getContext('2d');

// State for current generated images (data URLs)
var currentBgDataUrl = null;
var currentFgDataUrl = null;

// Model names (change if you need)
var IMAGE_MODEL_NAME = 'imagen-3.0-generate-002';
// var AGENT_MODEL_NAME = 'gemini-2.5-flash-preview-05-20'; // Removed: Now defined in Python backend

// Initialize UI
window.addEventListener('load', function() {
  // Start with agent disabled until images are generated
  autoAdjustBtn.disabled = true;

  // Wire top-level buttons to functions defined in api.js / blending.js
  generateBtn.addEventListener('click', generateImages);
  autoAdjustBtn.addEventListener('click', autoAdjustForeground);
  downloadBtn.addEventListener('click', downloadImage);
});