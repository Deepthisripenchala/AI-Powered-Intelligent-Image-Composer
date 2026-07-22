// api.js - API calls and image generation logic
// IMPORTANT: Replace the placeholder with your Google Generative AI API key
const apiKey = "AIzaSyCzFC4fLcZDS-sp8f9bB0qZN26L9ZE_OyU";

// --- Configuration for Python Backend ---
const PYTHON_AGENT_URL = 'http://127.0.0.1:5000/api/auto-adjust';

/**
 * Small helper to show messages in the UI.
 * type: 'error' | 'success'
 */
function displayMessage(message, type = 'error') {
  messageBox.textContent = message;
  messageBox.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
  if (type === 'error') {
    messageBox.classList.add('bg-red-100', 'text-red-700');
  } else {
    messageBox.classList.add('bg-green-100', 'text-green-700');
  }
  loadingIndicator.classList.add('hidden');
  agentLoadingIndicator.classList.add('hidden');
  generateBtn.disabled = false;
  autoAdjustBtn.disabled = false;
}

/**
 * Exponential-backoff fetch with basic retry handling.
 */
async function exponentialBackoffFetch(url, options, maxRetries = 5) {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      // NOTE: We do not retry on 4xx/5xx errors, only on 429 (Too Many Requests) or network errors
      if (res.status !== 429) return res; 
    } catch (err) {
      // network error -> fall through to retry
    }
    await new Promise(r => setTimeout(r, delay));
    delay *= 2;
  }
  throw new Error(`Request to ${url} failed after ${maxRetries} retries.`);
}

/**
 * Call the Google generative language image model and return a data URL (base64).
 * Uses the v1beta `predict` endpoint and expects `predictions[0].bytesBase64Encoded`
 */
async function fetchImageBase64(prompt) {
  if (!apiKey || apiKey === "REPLACE_WITH_YOUR_API_KEY") {
    throw new Error("Please provide a valid API key in js/api.js (apiKey).");
  }

  // IMAGE_MODEL_NAME is defined in main.js
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL_NAME}:predict?key=${apiKey}`;
  const payload = {
    instances: [{ prompt: prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "1:1"
    }
  };

  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };

  const response = await exponentialBackoffFetch(apiUrl, opts);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  const result = await response.json();
  const base64Data = result?.predictions?.[0]?.bytesBase64Encoded;
  if (!base64Data) throw new Error("No image bytes returned by the API.");
  return `data:image/png;base64,${base64Data}`;
}

/**
 * Generate both background and foreground images using the prompts.
 */
async function generateImages() {
  const bgPrompt = bgPromptArea.value.trim();
  let fgPrompt = fgPromptArea.value.trim();

  if (!bgPrompt || !fgPrompt) {
    displayMessage("Please enter prompts for both background and foreground.", 'error');
    return;
  }

  // Add instruction for white background and optional transparency
  let bgRemovalInstruction = ", centered subject, studio quality, with a pure white background.";
  if (requestPngTransparency.checked) {
    bgRemovalInstruction += " with a transparent background in png";
  }
  fgPrompt = fgPrompt + bgRemovalInstruction;

  // UI state
  generateBtn.disabled = true;
  autoAdjustBtn.disabled = true;
  downloadBtn.disabled = true;
  loadingIndicator.classList.remove('hidden');
  messageBox.classList.add('hidden');

  try {
    const p = Promise.all([fetchImageBase64(bgPrompt), fetchImageBase64(fgPrompt)]);
    const imgs = await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout: API request took too long.")), 60000))]);

    // Assign images
    currentBgDataUrl = imgs[0];
    currentFgDataUrl = imgs[1];
    bgImageElem.src = currentBgDataUrl;
    fgImageElem.src = currentFgDataUrl;

    // Trigger blend
    doBlend();
    displayMessage("Images generated! Try Auto Adjust or tweak sliders.", 'success');

  } catch (err) {
    console.error("Image generation error:", err);
    if (err.message && err.message.includes("Timeout")) {
      displayMessage(err.message + " Try again later.");
    } else {
      displayMessage("Failed to generate images. " + err.message);
    }
    currentBgDataUrl = null;
    currentFgDataUrl = null;
    bgImageElem.src = "https://placehold.co/512x512/e0f2fe/0369a1?text=Generation+Failed";
    fgImageElem.src = "https://placehold.co/512x512/e0f2fe/0369a1?text=Generation+Failed";
  } finally {
    loadingIndicator.classList.add('hidden');
    autoAdjustBtn.disabled = (currentFgDataUrl === null);
    generateBtn.disabled = false;
  }
}

/**
 * Auto-adjust: CALLS THE PYTHON BACKEND to produce adjustment JSON.
 */
// ... (start of js/api.js file remains unchanged)

/**
 * Auto-adjust: CALLS THE PYTHON BACKEND to produce adjustment JSON.
 */
async function autoAdjustForeground() {
  if (!currentFgDataUrl || !currentBgDataUrl) {
    displayMessage("Please generate both background and foreground images first.", 'error');
    return;
  }
  const agentPrompt = agentPromptArea.value.trim();
  if (!agentPrompt) {
    displayMessage("Please describe how you want to adjust the foreground.", 'error');
    return;
  }

  autoAdjustBtn.disabled = true;
  generateBtn.disabled = true;
  agentLoadingIndicator.classList.remove('hidden');
  messageBox.classList.add('hidden');
  
  // Data to send to the Python backend (includes both images)
  const payload = {
    agentPrompt: agentPrompt,
    bgDataUrl: currentBgDataUrl, 
    fgDataUrl: currentFgDataUrl
  };

  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };

  try {
    // Call the Python Flask server endpoint
    const response = await exponentialBackoffFetch(PYTHON_AGENT_URL, opts);
    
    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({ error: 'Unknown backend error.' }));
      throw new Error(errorResult.error || `Backend HTTP Error ${response.status}`);
    }
    
    // The response is the clean JSON object from the Python server
    const adjustments = await response.json();

    // Apply geometric adjustments
    fgX.value = adjustments.xPos || fgX.value;
    document.getElementById('fgXValue').textContent = fgX.value;

    fgY.value = adjustments.yPos || fgY.value;
    document.getElementById('fgYValue').textContent = fgY.value;

    fgScale.value = adjustments.scaleFactor || fgScale.value;
    document.getElementById('fgScaleValue').textContent = fgScale.value;

    fgRotation.value = adjustments.rotationDegrees || fgRotation.value;
    document.getElementById('fgRotationValue').textContent = fgRotation.value;

    fgSkewX.value = adjustments.skewX || fgSkewX.value;
    document.getElementById('fgSkewXValue').textContent = fgSkewX.value;

    fgSkewY.value = adjustments.skewY || fgSkewY.value;
    document.getElementById('fgSkewYValue').textContent = fgSkewY.value;

    // Apply luminosity adjustments
    fgBrightness.value = adjustments.brightness || fgBrightness.value;
    document.getElementById('fgBrightnessValue').textContent = fgBrightness.value + '%';

    fgContrast.value = adjustments.contrast || fgContrast.value;
    document.getElementById('fgContrastValue').textContent = fgContrast.value + '%';

    // Apply NEW color adjustments (Hue and Saturation)
    fgSaturation.value = adjustments.saturation || fgSaturation.value;
    document.getElementById('fgSaturationValue').textContent = fgSaturation.value + '%';

    fgHue.value = adjustments.hue || fgHue.value;
    document.getElementById('fgHueValue').textContent = fgHue.value + '°';
    
    // Trigger re-blend
    doBlend();
    displayMessage("Agent applied adjustments via Python backend.", 'success');
  } catch (err) {
    console.error("Agent error:", err);
    displayMessage("Agent adjustment failed. " + err.message);
  } finally {
    agentLoadingIndicator.classList.add('hidden');
    autoAdjustBtn.disabled = false;
    generateBtn.disabled = false;
  }
}