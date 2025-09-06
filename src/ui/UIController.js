export class UIController {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.canvasManager.onSelectionChange = this.handleSelectionChange.bind(this);
    this.canvasManager.onUIUpdate = this.updateUIFromLoadedData.bind(this);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const bgColorInput = document.getElementById('bg-color');
    bgColorInput.addEventListener('change', (e) => {
      this.canvasManager.setBackgroundColor(e.target.value);
      this.updateColorPalette(e.target.value);
    });

    // Add event listeners for background color palette
    this.addBackgroundColorPaletteListeners();

    const patternButtons = document.querySelectorAll('.pattern-btn');
    patternButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const pattern = e.target.getAttribute('data-pattern');
        this.canvasManager.setBackgroundPattern(pattern);
        this.updatePatternButtons(pattern);
      });
    });

    this.updatePatternButtons('solid');

    const addTextBtn = document.getElementById('add-text');
    addTextBtn.addEventListener('click', () => {
      this.canvasManager.addTextElement();
      this.updateLayersPanel();
    });

    const addImageBtn = document.getElementById('add-image');
    const imageUpload = document.getElementById('image-upload');

    addImageBtn.addEventListener('click', () => {
      imageUpload.click();
    });

    imageUpload.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        // Validate file type (add SVG)
        const validTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/svg+xml',
        ];
        const isSvg = file.type === 'image/svg+xml' || /\.svgz?$/i.test(file.name);
        if (!(validTypes.includes(file.type) || isSvg)) {
          alert('Please select a valid image file (JPG, PNG, WebP, or SVG)');
          return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          alert('Image file is too large. Please select a file smaller than 10MB.');
          return;
        }

        console.log('Processing image:', file.name);

        const reader = new FileReader();

        // For SVG, read as text and convert to a data URL to avoid MIME issues
        if (isSvg) {
          reader.onload = (event) => {
            try {
              const svgText = event.target.result;
              // Build data URL. Use base64 to preserve special characters safely.
              const base64 = btoa(unescape(encodeURIComponent(svgText)));
              const dataUrl = `data:image/svg+xml;base64,${base64}`;

              const img = new Image();
              img.onload = () => {
                console.log('SVG loaded:', img.naturalWidth + 'x' + img.naturalHeight);
                // Add as standard image element (SVG source supported by canvas)
                this.canvasManager.addImageElement(img);
                this.updateLayersPanel();
                imageUpload.value = '';
              };
              img.onerror = () => {
                alert('Failed to load the selected SVG. Please try a different file.');
                imageUpload.value = '';
              };
              img.src = dataUrl;
            } catch (err) {
              console.error('Failed parsing SVG:', err);
              alert('Failed to process the SVG file.');
              imageUpload.value = '';
            }
          };
          reader.onerror = () => {
            alert('Failed to read the selected SVG file. Please try again.');
            imageUpload.value = '';
          };
          reader.readAsText(file);
        } else {
          // Raster formats: use Data URL directly
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              console.log('Image loaded:', img.naturalWidth + 'x' + img.naturalHeight);
              this.canvasManager.addImageElement(img);
              this.updateLayersPanel();

              // Clear the file input so the same file can be selected again
              imageUpload.value = '';
            };
            img.onerror = () => {
              alert('Failed to load the selected image. Please try a different file.');
              imageUpload.value = '';
            };
            img.src = event.target.result;
          };
          reader.onerror = () => {
            alert('Failed to read the selected file. Please try again.');
            imageUpload.value = '';
          };
          reader.readAsDataURL(file);
        }
      }
    });

    // Shape buttons
    const addRectangleBtn = document.getElementById('add-rectangle');
    const addCircleBtn = document.getElementById('add-circle');
    const addTriangleBtn = document.getElementById('add-triangle');

    addRectangleBtn.addEventListener('click', () => {
      this.canvasManager.addShapeElement('rectangle');
      this.updateLayersPanel();
    });

    addCircleBtn.addEventListener('click', () => {
      this.canvasManager.addShapeElement('circle');
      this.updateLayersPanel();
    });

    addTriangleBtn.addEventListener('click', () => {
      this.canvasManager.addShapeElement('triangle');
      this.updateLayersPanel();
    });

    // Arrow buttons
    const addStraightArrowBtn = document.getElementById('add-straight-arrow');
    const addCurvedArrowBtn = document.getElementById('add-curved-arrow');

    addStraightArrowBtn.addEventListener('click', () => {
      this.canvasManager.addArrowElement('straight');
      this.updateLayersPanel();
    });

    addCurvedArrowBtn.addEventListener('click', () => {
      this.canvasManager.addArrowElement('curved');
      this.updateLayersPanel();
    });

    const exportJpgBtn = document.getElementById('export-jpg');
    exportJpgBtn.addEventListener('click', () => {
      this.downloadImage('jpeg');
    });

    const exportPngBtn = document.getElementById('export-png');
    exportPngBtn.addEventListener('click', () => {
      this.downloadImage('png');
    });

    const exportProjectBtn = document.getElementById('export-project');
    exportProjectBtn.addEventListener('click', () => {
      this.downloadProject();
    });

    const importProjectBtn = document.getElementById('import-project');
    const importProjectInput = document.getElementById('import-project-input');

    importProjectBtn.addEventListener('click', () => {
      importProjectInput.click();
    });

    importProjectInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.loadProject(e.target.files[0]);
      }
    });

    const deleteBtn = document.getElementById('delete-element');
    deleteBtn.addEventListener('click', () => {
      this.canvasManager.deleteSelectedElement();
      this.updateLayersPanel();
    });

    const duplicateBtn = document.getElementById('duplicate-element');
    duplicateBtn.addEventListener('click', () => {
      this.canvasManager.duplicateSelectedElement();
      this.updateLayersPanel();
    });

    const cycleElementsBtn = document.getElementById('cycle-elements');
    if (cycleElementsBtn) {
      // Ensure button is enabled
      cycleElementsBtn.disabled = false;

      cycleElementsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Cycle elements button clicked');
        console.log('Number of elements:', this.canvasManager.elements.length);

        if (this.canvasManager.elements.length === 0) {
          alert('No elements to cycle through. Please add some text or images first.');
          return;
        }

        const result = this.canvasManager.cycleToNextElement();
        console.log('Cycle result:', result);
      });
      console.log('Cycle elements button event listener attached successfully');
    } else {
      console.error('Cycle elements button not found!');
    }

    this.setupTextControls();
    this.setupImageControls();
    this.setupShapeControls();
    this.setupLayerControls();
    this.setupKeyboardShortcuts();
  }

  setupTextControls() {
    const textContent = document.getElementById('text-content');
    const textFont = document.getElementById('text-font');
    const textSize = document.getElementById('text-size');
    const textColor = document.getElementById('text-color');
    const textWeight = document.getElementById('text-weight');
    const textAlign = document.getElementById('text-align');
    const textRotation = document.getElementById('text-rotation');
    const textOutlineWidth = document.getElementById('text-outline-width');
    const textOutlineColor = document.getElementById('text-outline-color');

    textContent.addEventListener('input', (e) => {
      this.canvasManager.updateSelectedElement({ text: e.target.value });
    });

    textFont.addEventListener('change', (e) => {
      this.canvasManager.updateSelectedElement({ font: e.target.value });
    });

    textSize.addEventListener('input', (e) => {
      const size = parseInt(e.target.value);
      this.canvasManager.updateSelectedElement({ size: size });
    });

    textColor.addEventListener('change', (e) => {
      this.canvasManager.updateSelectedElement({ color: e.target.value });
    });

    textWeight.addEventListener('change', (e) => {
      this.canvasManager.updateSelectedElement({ weight: e.target.value });
    });

    textAlign.addEventListener('change', (e) => {
      this.canvasManager.updateSelectedElement({ align: e.target.value });
    });

    textRotation.addEventListener('input', (e) => {
      let rotation = parseInt(e.target.value) || 0;
      this.canvasManager.updateSelectedElement({ rotation: rotation });
    });

    textOutlineWidth.addEventListener('input', (e) => {
      const width = Math.max(0, parseInt(e.target.value) || 0);
      this.canvasManager.updateSelectedElement({ outlineWidth: width });
    });

    textOutlineColor.addEventListener('change', (e) => {
      this.canvasManager.updateSelectedElement({ outlineColor: e.target.value });
    });
  }

  createElementColorPalette(type = 'element') {
    const colorPalette = document.createElement('div');
    colorPalette.className =
      type === 'background' ? 'color-palette' : 'element-color-palette';

    const title = document.createElement('h4');
    title.textContent = 'Quick Colors';
    colorPalette.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'palette-grid';

    // Same colors as background palette
    const colors = [
      '#ff4444',
      '#ff6b35',
      '#ffb347',
      '#ffd700',
      '#00d4aa',
      '#00bfff',
      '#7b68ee',
      '#ff1493',
      '#32cd32',
      '#9932cc',
      '#1a1a1a',
      '#ffffff',
    ];

    colors.forEach((color) => {
      const colorElement = document.createElement('div');
      colorElement.className = 'palette-color';
      colorElement.setAttribute('data-color', color);
      colorElement.style.backgroundColor = color;
      grid.appendChild(colorElement);
    });

    colorPalette.appendChild(grid);
    return colorPalette;
  }

  addColorPaletteToControl(controlId) {
    const controlElement = document.getElementById(controlId);
    if (!controlElement) return;

    // Check if palette already exists
    if (controlElement.querySelector('.element-color-palette')) return;

    // Find the color input control group
    const colorInput = controlElement.querySelector('input[type="color"]');
    if (!colorInput) return;

    // Find the parent control group of the color input
    const colorControlGroup = colorInput.closest('.control-group');
    if (!colorControlGroup) return;

    // Create and insert the color palette after the color control group
    const colorPalette = this.createElementColorPalette();
    colorControlGroup.parentNode.insertBefore(
      colorPalette,
      colorControlGroup.nextSibling
    );

    // Add event listeners to the palette colors
    this.addColorPaletteListeners(colorPalette, colorInput, controlId);
  }

  addColorPaletteListeners(colorPalette, colorInput, controlId) {
    const paletteColors = colorPalette.querySelectorAll('.palette-color');
    paletteColors.forEach((colorElement) => {
      colorElement.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        if (color) {
          // Update the color input
          colorInput.value = color;

          // Update the selected element
          if (controlId === 'text-controls') {
            this.canvasManager.updateSelectedElement({ color: color });
          } else if (controlId === 'shape-controls') {
            this.canvasManager.updateSelectedElement({ color: color });
          } else if (controlId === 'arrow-controls') {
            this.canvasManager.updateSelectedElement({ color: color });
          }
        }
      });
    });
  }

  showTextControls() {
    const textControls = document.getElementById('text-controls');
    textControls.style.display = 'block';
    this.addColorPaletteToControl('text-controls');
  }

  hideTextControls() {
    const textControls = document.getElementById('text-controls');
    textControls.style.display = 'none';
    // Remove color palette when hiding
    const colorPalette = textControls.querySelector('.element-color-palette');
    if (colorPalette) {
      colorPalette.remove();
    }
  }

  updateTextControls() {
    const selectedElement = this.canvasManager.selectedElement;
    if (selectedElement && selectedElement.text !== undefined) {
      document.getElementById('text-content').value = selectedElement.text;
      document.getElementById('text-font').value = selectedElement.font;
      document.getElementById('text-size').value = selectedElement.size;
      document.getElementById('text-color').value = selectedElement.color;
      document.getElementById('text-weight').value = selectedElement.weight;
      document.getElementById('text-align').value = selectedElement.align;
      document.getElementById('text-rotation').value =
        Math.round(selectedElement.rotation) || 0;
      document.getElementById('text-outline-width').value = Math.round(
        selectedElement.outlineWidth || 0
      );
      document.getElementById('text-outline-color').value =
        selectedElement.outlineColor || '#ffffff';
    }
  }

  handleSelectionChange(selectedElement) {
    const deleteBtn = document.getElementById('delete-element');
    const duplicateBtn = document.getElementById('duplicate-element');

    if (selectedElement) {
      deleteBtn.disabled = false;
      duplicateBtn.disabled = false;
      this.showLayerControls();

      if (selectedElement.text !== undefined) {
        this.showTextControls();
        this.updateTextControls();
        this.hideImageControls();
        this.hideShapeControls();
        this.hideArrowControls();
      } else if (selectedElement.shapeType !== undefined) {
        this.showShapeControls();
        this.updateShapeControls();
        this.hideTextControls();
        this.hideImageControls();
        this.hideArrowControls();
      } else if (selectedElement.arrowType !== undefined) {
        this.showArrowControls();
        this.updateArrowControls();
        this.hideTextControls();
        this.hideImageControls();
        this.hideShapeControls();
      } else {
        this.hideTextControls();
        this.hideShapeControls();
        this.hideArrowControls();
        this.showImageControls();
        this.updateImageControls();
      }
    } else {
      deleteBtn.disabled = true;
      duplicateBtn.disabled = true;
      this.hideLayerControls();
      this.hideTextControls();
      this.hideImageControls();
      this.hideShapeControls();
      this.hideArrowControls();
    }

    this.updateLayersPanel();
  }

  downloadImage(format) {
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataURL = this.canvasManager.exportAsImage(mimeType);

    const link = document.createElement('a');
    link.download = `youtube-thumbnail.${format}`;
    link.href = dataURL;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadProject() {
    try {
      const projectJson = this.canvasManager.exportProject();
      const blob = new Blob([projectJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `youtube-thumbnail-project-${Date.now()}.json`;
      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('Failed to export project. Please try again.');
    }
  }

  async loadProject(file) {
    // Validate file type
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      alert('Please select a valid JSON project file.');
      return;
    }

    // Validate file size (max 50MB to be safe)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert('Project file is too large. Please select a file smaller than 50MB.');
      return;
    }

    try {
      const fileText = await file.text();
      await this.canvasManager.importProject(fileText);
      alert('Project imported successfully!');

      // Clear the file input so the same file can be selected again
      const importInput = document.getElementById('import-project-input');
      importInput.value = '';
    } catch (error) {
      console.error('Failed to import project:', error);
      alert('Failed to import project: ' + error.message);

      // Clear the file input
      const importInput = document.getElementById('import-project-input');
      importInput.value = '';
    }
  }

  updateColorPalette(selectedColor) {
    const paletteColors = document.querySelectorAll('.palette-color');
    paletteColors.forEach((colorElement) => {
      colorElement.classList.remove('selected');
      if (colorElement.getAttribute('data-color') === selectedColor) {
        colorElement.classList.add('selected');
      }
    });
  }

  updatePatternButtons(selectedPattern) {
    const patternButtons = document.querySelectorAll('.pattern-btn');
    patternButtons.forEach((button) => {
      button.classList.remove('active');
      if (button.getAttribute('data-pattern') === selectedPattern) {
        button.classList.add('active');
      }
    });
  }

  updateUIFromLoadedData() {
    const bgColorInput = document.getElementById('bg-color');
    bgColorInput.value = this.canvasManager.currentBackgroundColor;
    this.updateColorPalette(this.canvasManager.currentBackgroundColor);
    this.updatePatternButtons(this.canvasManager.currentBackgroundPattern);
  }

  setupImageControls() {
    const cropBtn = document.getElementById('crop-image');
    const applyCropBtn = document.getElementById('apply-crop');
    const cancelCropBtn = document.getElementById('cancel-crop');
    const extractPersonBtn = document.getElementById('extract-person');

    // Image effects controls
    const opacityInput = document.getElementById('image-opacity');
    const opacityValue = document.getElementById('image-opacity-value');
    const brightnessInput = document.getElementById('image-brightness');
    const brightnessValue = document.getElementById('image-brightness-value');
    const contrastInput = document.getElementById('image-contrast');
    const contrastValue = document.getElementById('image-contrast-value');
    const saturationInput = document.getElementById('image-saturation');
    const saturationValue = document.getElementById('image-saturation-value');
    const rotationInput = document.getElementById('image-rotation');

    cropBtn.addEventListener('click', () => {
      this.startCropping();
    });

    applyCropBtn.addEventListener('click', () => {
      this.applyCrop();
    });

    cancelCropBtn.addEventListener('click', () => {
      this.cancelCrop();
    });

    extractPersonBtn.addEventListener('click', () => {
      this.extractPerson();
    });

    // Opacity control
    opacityInput.addEventListener('input', (e) => {
      const opacity = parseInt(e.target.value) / 100;
      opacityValue.textContent = e.target.value + '%';
      this.canvasManager.updateSelectedElement({ opacity: opacity });
    });

    // Brightness control
    brightnessInput.addEventListener('input', (e) => {
      const brightness = parseInt(e.target.value);
      brightnessValue.textContent = brightness + '%';
      this.canvasManager.updateSelectedElement({ brightness: brightness });
    });

    // Contrast control
    contrastInput.addEventListener('input', (e) => {
      const contrast = parseInt(e.target.value);
      contrastValue.textContent = contrast + '%';
      this.canvasManager.updateSelectedElement({ contrast: contrast });
    });

    // Saturation control
    saturationInput.addEventListener('input', (e) => {
      const saturation = parseInt(e.target.value);
      saturationValue.textContent = saturation + '%';
      this.canvasManager.updateSelectedElement({ saturation: saturation });
    });

    // Rotation control
    rotationInput.addEventListener('input', (e) => {
      let rotation = parseInt(e.target.value) || 0;
      this.canvasManager.updateSelectedElement({ rotation: rotation });
    });

  }

  addBackgroundColorPaletteListeners() {
    const bgColorInput = document.getElementById('bg-color');
    if (!bgColorInput) return;

    // Find the background color palette
    const bgPalette = document.querySelector('.color-palette');
    if (!bgPalette) return;

    // Add event listeners to the background palette colors
    const paletteColors = bgPalette.querySelectorAll('.palette-color');
    paletteColors.forEach((colorElement) => {
      colorElement.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        if (color) {
          this.canvasManager.setBackgroundColor(color);
          bgColorInput.value = color;
          this.updateColorPalette(color);
        }
      });
    });
  }

  showImageControls() {
    const imageControls = document.getElementById('image-controls');
    imageControls.style.display = 'block';
  }

  hideImageControls() {
    const imageControls = document.getElementById('image-controls');
    imageControls.style.display = 'none';
  }

  updateImageControls() {
    const selectedElement = this.canvasManager.selectedElement;
    if (selectedElement && selectedElement.text === undefined) {
      // Update opacity control
      const opacityValue = Math.round(selectedElement.opacity * 100);
      document.getElementById('image-opacity').value = opacityValue;
      document.getElementById('image-opacity-value').textContent = opacityValue + '%';

      // Update brightness control
      document.getElementById('image-brightness').value = selectedElement.brightness;
      document.getElementById('image-brightness-value').textContent =
        selectedElement.brightness + '%';

      // Update contrast control
      document.getElementById('image-contrast').value = selectedElement.contrast;
      document.getElementById('image-contrast-value').textContent =
        selectedElement.contrast + '%';

      // Update saturation control
      document.getElementById('image-saturation').value = selectedElement.saturation;
      document.getElementById('image-saturation-value').textContent =
        selectedElement.saturation + '%';

      // Update rotation control
      document.getElementById('image-rotation').value =
        Math.round(selectedElement.rotation) || 0;

    }
  }

  startCropping() {
    const selectedElement = this.canvasManager.selectedElement;
    if (!selectedElement || selectedElement.text !== undefined) return;

    const cropControls = document.getElementById('crop-controls');
    cropControls.style.display = 'block';

    // Initialize crop area with current image dimensions
    document.getElementById('crop-x').value = 0;
    document.getElementById('crop-y').value = 0;
    document.getElementById('crop-width').value = selectedElement.originalWidth;
    document.getElementById('crop-height').value = selectedElement.originalHeight;

    // Enable crop mode
    selectedElement.cropMode = true;
    this.canvasManager.redrawCanvas();
  }

  applyCrop() {
    const selectedElement = this.canvasManager.selectedElement;
    if (!selectedElement || selectedElement.text !== undefined) return;

    const cropX = parseInt(document.getElementById('crop-x').value) || 0;
    const cropY = parseInt(document.getElementById('crop-y').value) || 0;
    const cropWidth =
      parseInt(document.getElementById('crop-width').value) ||
      selectedElement.originalWidth;
    const cropHeight =
      parseInt(document.getElementById('crop-height').value) ||
      selectedElement.originalHeight;

    // Validate crop dimensions
    if (
      cropX < 0 ||
      cropY < 0 ||
      cropWidth <= 0 ||
      cropHeight <= 0 ||
      cropX + cropWidth > selectedElement.originalWidth ||
      cropY + cropHeight > selectedElement.originalHeight
    ) {
      alert('Invalid crop dimensions. Please check your values.');
      return;
    }

    selectedElement.setCropArea(cropX, cropY, cropWidth, cropHeight);
    this.cancelCrop();
  }

  cancelCrop() {
    const selectedElement = this.canvasManager.selectedElement;
    if (selectedElement) {
      selectedElement.cropMode = false;
    }

    const cropControls = document.getElementById('crop-controls');
    cropControls.style.display = 'none';

    this.canvasManager.redrawCanvas();
  }

  async extractPerson() {
    const selectedElement = this.canvasManager.selectedElement;
    if (!selectedElement || selectedElement.text !== undefined) return;

    try {
      // Check if BodyPix model is loaded
      if (!window.bodyPixModel) {
        const statusElement = document.getElementById('model-status');
        const statusText = statusElement ? statusElement.textContent : '';

        if (statusText.includes('Loading') || statusText.includes('Initializing')) {
          alert('AI model is still loading. Please wait and try again in a few moments.');
        } else if (statusText.includes('failed') || statusText.includes('error')) {
          alert('AI model failed to load. Please refresh the page to try again.');
        } else {
          alert('Person segmentation model not loaded yet. Please wait and try again.');
        }
        return;
      }

      // Show loading message
      const button = document.getElementById('extract-person');
      const originalText = button.textContent;
      button.textContent = 'Processing...';
      button.disabled = true;

      // Perform person segmentation
      const maskedImage = await this.segmentPerson(selectedElement.image);

      if (maskedImage) {
        // Create new image element with the masked person
        const personElementX = selectedElement.x + 50;
        const personElementY = selectedElement.y + 50;
        this.canvasManager.addImageElement(maskedImage, personElementX, personElementY);
        this.updateLayersPanel();

        alert('Person extracted successfully with transparent background!');
      } else {
        alert('No person detected in the image.');
      }

      // Restore button
      button.textContent = originalText;
      button.disabled = false;
    } catch (error) {
      console.error('Person extraction error:', error);
      alert('Person extraction failed. Please try again.');

      // Restore button
      const button = document.getElementById('extract-person');
      button.textContent = 'Extract Person';
      button.disabled = false;
    }
  }

  async segmentPerson(image) {
    // Create a canvas to analyze the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    // Perform person segmentation
    const segmentation = await window.bodyPixModel.segmentPerson(canvas, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.7,
    });

    // Create a new canvas for the masked result
    const resultCanvas = document.createElement('canvas');
    const resultCtx = resultCanvas.getContext('2d');
    resultCanvas.width = image.width;
    resultCanvas.height = image.height;

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const resultImageData = resultCtx.createImageData(canvas.width, canvas.height);

    // Apply the mask - only keep pixels where person is detected
    for (let i = 0; i < segmentation.data.length; i++) {
      const pixelIndex = i * 4;

      if (segmentation.data[i] === 1) {
        // Person pixel
        // Keep the original pixel
        resultImageData.data[pixelIndex] = imageData.data[pixelIndex]; // R
        resultImageData.data[pixelIndex + 1] = imageData.data[pixelIndex + 1]; // G
        resultImageData.data[pixelIndex + 2] = imageData.data[pixelIndex + 2]; // B
        resultImageData.data[pixelIndex + 3] = imageData.data[pixelIndex + 3]; // A
      } else {
        // Background pixel
        // Make transparent
        resultImageData.data[pixelIndex] = 0; // R
        resultImageData.data[pixelIndex + 1] = 0; // G
        resultImageData.data[pixelIndex + 2] = 0; // B
        resultImageData.data[pixelIndex + 3] = 0; // A (transparent)
      }
    }

    // Put the result on the canvas
    resultCtx.putImageData(resultImageData, 0, 0);

    // Check if any person pixels were found
    const hasPersonPixels = segmentation.data.some((pixel) => pixel === 1);
    if (!hasPersonPixels) {
      return null;
    }

    // Convert canvas to image
    return new Promise((resolve) => {
      const personImage = new Image();
      personImage.onload = () => resolve(personImage);
      personImage.src = resultCanvas.toDataURL('image/png'); // PNG to preserve transparency
    });
  }

  setupShapeControls() {
    const shapeType = document.getElementById('shape-type');
    const shapeWidth = document.getElementById('shape-width');
    const shapeHeight = document.getElementById('shape-height');
    const shapeColor = document.getElementById('shape-color');
    const shapeOpacity = document.getElementById('shape-opacity');
    const shapeOpacityValue = document.getElementById('shape-opacity-value');
    const shapeStrokeWidth = document.getElementById('shape-stroke-width');
    const shapeRotation = document.getElementById('shape-rotation');

    shapeType.addEventListener('change', (e) => {
      this.canvasManager.updateSelectedElement({ shapeType: e.target.value });
    });

    shapeWidth.addEventListener('input', (e) => {
      const width = Math.max(10, parseInt(e.target.value) || 100);
      this.canvasManager.updateSelectedElement({ width: width });
    });

    shapeHeight.addEventListener('input', (e) => {
      const height = Math.max(10, parseInt(e.target.value) || 100);
      this.canvasManager.updateSelectedElement({ height: height });
    });

    shapeColor.addEventListener('change', (e) => {
      this.canvasManager.updateSelectedElement({ color: e.target.value });
    });

    shapeOpacity.addEventListener('input', (e) => {
      const opacity = parseInt(e.target.value) / 100;
      shapeOpacityValue.textContent = e.target.value + '%';
      this.canvasManager.updateSelectedElement({ opacity: opacity });
    });

    shapeStrokeWidth.addEventListener('input', (e) => {
      const strokeWidth = Math.max(0, parseInt(e.target.value) || 0);
      this.canvasManager.updateSelectedElement({ strokeWidth: strokeWidth });
    });

    shapeRotation.addEventListener('input', (e) => {
      let rotation = parseInt(e.target.value) || 0;
      this.canvasManager.updateSelectedElement({ rotation: rotation });
    });

    // Arrow controls
    const arrowType = document.getElementById('arrow-type');
    const arrowColor = document.getElementById('arrow-color');
    const arrowOpacity = document.getElementById('arrow-opacity');
    const arrowOpacityValue = document.getElementById('arrow-opacity-value');
    const arrowStrokeWidth = document.getElementById('arrow-stroke-width');
    const arrowHeadSize = document.getElementById('arrow-head-size');
    const arrowCurvature = document.getElementById('arrow-curvature');
    const arrowCurvatureValue = document.getElementById('arrow-curvature-value');

    arrowType.addEventListener('change', (e) => {
      const newType = e.target.value;
      this.canvasManager.updateSelectedElement({ arrowType: newType });
      this.updateArrowCurvatureVisibility(newType);
    });

    arrowColor.addEventListener('change', (e) => {
      this.canvasManager.updateSelectedElement({ color: e.target.value });
    });

    arrowOpacity.addEventListener('input', (e) => {
      const opacity = parseInt(e.target.value) / 100;
      arrowOpacityValue.textContent = e.target.value + '%';
      this.canvasManager.updateSelectedElement({ opacity: opacity });
    });

    arrowStrokeWidth.addEventListener('input', (e) => {
      const strokeWidth = Math.max(1, parseInt(e.target.value) || 1);
      this.canvasManager.updateSelectedElement({ strokeWidth: strokeWidth });
    });

    arrowHeadSize.addEventListener('input', (e) => {
      const headSize = Math.max(5, parseInt(e.target.value) || 5);
      this.canvasManager.updateSelectedElement({ arrowheadSize: headSize });
    });

    arrowCurvature.addEventListener('input', (e) => {
      const curvature = parseInt(e.target.value) / 100;
      const sign = curvature >= 0 ? '+' : '';
      arrowCurvatureValue.textContent = sign + e.target.value + '%';
      this.canvasManager.updateSelectedElement({ curvature: curvature });
    });
  }

  showShapeControls() {
    const shapeControls = document.getElementById('shape-controls');
    shapeControls.style.display = 'block';
    this.addColorPaletteToControl('shape-controls');
  }

  hideShapeControls() {
    const shapeControls = document.getElementById('shape-controls');
    shapeControls.style.display = 'none';
    // Remove color palette when hiding
    const colorPalette = shapeControls.querySelector('.element-color-palette');
    if (colorPalette) {
      colorPalette.remove();
    }
  }

  showArrowControls() {
    const arrowControls = document.getElementById('arrow-controls');
    arrowControls.style.display = 'block';
    this.addColorPaletteToControl('arrow-controls');
  }

  hideArrowControls() {
    const arrowControls = document.getElementById('arrow-controls');
    arrowControls.style.display = 'none';
    // Remove color palette when hiding
    const colorPalette = arrowControls.querySelector('.element-color-palette');
    if (colorPalette) {
      colorPalette.remove();
    }
  }

  updateArrowCurvatureVisibility(arrowType) {
    const curvatureGroup = document.getElementById('arrow-curvature-group');
    if (arrowType === 'curved') {
      curvatureGroup.style.display = 'block';
    } else {
      curvatureGroup.style.display = 'none';
    }
  }

  updateShapeControls() {
    const selectedElement = this.canvasManager.selectedElement;
    if (selectedElement && selectedElement.shapeType !== undefined) {
      document.getElementById('shape-type').value = selectedElement.shapeType;
      document.getElementById('shape-width').value = selectedElement.width;
      document.getElementById('shape-height').value = selectedElement.height;
      document.getElementById('shape-color').value = selectedElement.color;

      const opacityValue = Math.round(selectedElement.opacity * 100);
      document.getElementById('shape-opacity').value = opacityValue;
      document.getElementById('shape-opacity-value').textContent = opacityValue + '%';

      document.getElementById('shape-stroke-width').value = selectedElement.strokeWidth;
      document.getElementById('shape-rotation').value =
        Math.round(selectedElement.rotation) || 0;
    }
  }

  updateArrowControls() {
    const selectedElement = this.canvasManager.selectedElement;
    if (selectedElement && selectedElement.arrowType !== undefined) {
      document.getElementById('arrow-type').value = selectedElement.arrowType;
      document.getElementById('arrow-color').value = selectedElement.color;

      const opacityValue = Math.round(selectedElement.opacity * 100);
      document.getElementById('arrow-opacity').value = opacityValue;
      document.getElementById('arrow-opacity-value').textContent = opacityValue + '%';

      document.getElementById('arrow-stroke-width').value = selectedElement.strokeWidth;
      document.getElementById('arrow-head-size').value = selectedElement.arrowheadSize;

      const curvatureValue = Math.round(selectedElement.curvature * 100);
      const sign = curvatureValue >= 0 ? '+' : '';
      document.getElementById('arrow-curvature').value = curvatureValue;
      document.getElementById('arrow-curvature-value').textContent =
        sign + curvatureValue + '%';

      this.updateArrowCurvatureVisibility(selectedElement.arrowType);
    }
  }

  setupLayerControls() {
    const bringToFrontBtn = document.getElementById('bring-to-front');
    const bringForwardBtn = document.getElementById('bring-forward');
    const sendBackwardBtn = document.getElementById('send-backward');
    const sendToBackBtn = document.getElementById('send-to-back');

    if (bringToFrontBtn) {
      bringToFrontBtn.addEventListener('click', () => {
        this.canvasManager.bringToFront();
        this.updateLayersPanel();
      });
    }

    if (bringForwardBtn) {
      bringForwardBtn.addEventListener('click', () => {
        this.canvasManager.bringForward();
        this.updateLayersPanel();
      });
    }

    if (sendBackwardBtn) {
      sendBackwardBtn.addEventListener('click', () => {
        this.canvasManager.sendBackward();
        this.updateLayersPanel();
      });
    }

    if (sendToBackBtn) {
      sendToBackBtn.addEventListener('click', () => {
        this.canvasManager.sendToBack();
        this.updateLayersPanel();
      });
    }

    // Initial layer panel update
    this.updateLayersPanel();
  }

  showLayerControls() {
    const layerControls = document.getElementById('layer-controls');
    if (layerControls) {
      layerControls.style.display = 'block';
    }
  }

  hideLayerControls() {
    const layerControls = document.getElementById('layer-controls');
    if (layerControls) {
      layerControls.style.display = 'none';
    }
  }

  updateLayersPanel() {
    const layersList = document.querySelector('.layers-list');
    if (!layersList) return;

    // Clear existing items
    layersList.innerHTML = '';

    // Get elements ordered by layer (top to bottom)
    const orderedElements = this.canvasManager.getElementsOrderedByLayer().reverse();

    orderedElements.forEach((element) => {
      const layerItem = document.createElement('div');
      layerItem.className = 'layer-item';
      layerItem.dataset.elementId = element.id;

      if (element === this.canvasManager.selectedElement) {
        layerItem.classList.add('selected');
      }

      // Determine element type and info
      let elementType = 'Unknown';
      let elementInfo = '';

      if (element.text !== undefined) {
        elementType = 'Text';
        elementInfo =
          element.text.length > 15 ? element.text.substring(0, 15) + '...' : element.text;
      } else if (element.image) {
        elementType = 'Image';
        elementInfo = `${element.width}×${element.height}`;
      } else if (element.shapeType !== undefined) {
        elementType = 'Shape';
        elementInfo = element.shapeType;
      } else if (element.arrowType !== undefined) {
        elementType = 'Arrow';
        elementInfo = element.arrowType;
      }

      layerItem.innerHTML = `
        <div>
          <div class="layer-type">${elementType}</div>
          <div class="layer-info">${elementInfo}</div>
        </div>
        <div>Layer ${element.layer}</div>
      `;

      // Click to select element
      layerItem.addEventListener('click', () => {
        this.canvasManager.selectedElement = element;
        this.canvasManager.elements.forEach((el) => (el.selected = false));
        element.selected = true;
        this.canvasManager.redrawCanvas();
        if (this.canvasManager.onSelectionChange) {
          this.canvasManager.onSelectionChange(element);
        }
        this.updateLayersPanel();
      });

      layersList.appendChild(layerItem);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle keyboard shortcuts when not focused on an input
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Delete or Backspace key to delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.canvasManager.deleteSelectedElement();
        this.updateLayersPanel();
      }

      // Tab key to cycle through elements
      if (e.key === 'Tab') {
        e.preventDefault();
        this.canvasManager.cycleToNextElement();
        this.updateLayersPanel();
      }

      // Ctrl+D key to duplicate selected element
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (this.canvasManager.selectedElement) {
          this.canvasManager.duplicateSelectedElement();
          this.updateLayersPanel();
        }
      }

      // Escape key to deselect or cancel crop
      if (e.key === 'Escape') {
        // Cancel crop if in crop mode
        const selectedElement = this.canvasManager.selectedElement;
        if (selectedElement && selectedElement.cropMode) {
          this.cancelCrop();
          return;
        }

        this.canvasManager.selectedElement = null;
        this.canvasManager.elements.forEach((element) => {
          element.selected = false;
        });
        this.canvasManager.redrawCanvas();
        if (this.canvasManager.onSelectionChange) {
          this.canvasManager.onSelectionChange(null);
        }
        this.updateLayersPanel();
      }
    });
  }
}
