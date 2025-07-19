import { CanvasManager } from "./src/canvas/CanvasManager.js";
import { UIController } from "./src/ui/UIController.js";

document.addEventListener("DOMContentLoaded", async () => {
  const canvasManager = new CanvasManager("thumbnail-canvas");
  const uiController = new UIController(canvasManager);

  // Initialize person segmentation models
  await initializePersonSegmentation();

  console.log("YouTube Thumbnail Maker initialized");
});

async function initializePersonSegmentation() {
  const statusElement = document.getElementById('model-status');
  
  try {
    // Update status to loading
    updateModelStatus('loading', 'Loading AI model...');
    
    // Wait for libraries to be available with timeout
    await waitForLibraries();
    
    console.log('Libraries loaded, now loading BodyPix model...');
    updateModelStatus('loading', 'Initializing AI model...');
    
    // Load BodyPix model (using MobileNetV1 for faster performance)
    window.bodyPixModel = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2
    });
    
    console.log('Person segmentation model loaded successfully');
    updateModelStatus('ready', 'AI model ready ✓');
    
    // Enable the extract person button
    const extractBtn = document.getElementById('extract-person');
    if (extractBtn) {
      extractBtn.disabled = false;
    }
    
  } catch (error) {
    console.error('Failed to load person segmentation model:', error);
    updateModelStatus('error', 'AI model failed to load');
    
    // Disable the extract person button
    const extractBtn = document.getElementById('extract-person');
    if (extractBtn) {
      extractBtn.disabled = true;
      extractBtn.textContent = 'Extract Person (Unavailable)';
    }
  }
}

function updateModelStatus(status, text) {
  const statusElement = document.getElementById('model-status');
  if (statusElement) {
    statusElement.textContent = text;
    statusElement.className = `model-status ${status}`;
  }
}

async function waitForLibraries() {
  const maxWaitTime = 10000; // 10 seconds
  const checkInterval = 100; // 100ms
  let waitTime = 0;
  
  return new Promise((resolve, reject) => {
    const checkLibraries = () => {
      if (typeof tf !== 'undefined' && typeof bodyPix !== 'undefined') {
        resolve();
        return;
      }
      
      waitTime += checkInterval;
      if (waitTime >= maxWaitTime) {
        reject(new Error('Libraries failed to load within timeout'));
        return;
      }
      
      setTimeout(checkLibraries, checkInterval);
    };
    
    checkLibraries();
  });
}
