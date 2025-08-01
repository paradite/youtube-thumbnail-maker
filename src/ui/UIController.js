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
        
        const paletteColors = document.querySelectorAll('.palette-color');
        paletteColors.forEach(colorElement => {
            colorElement.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                this.canvasManager.setBackgroundColor(color);
                bgColorInput.value = color;
                this.updateColorPalette(color);
            });
        });
        
        const patternButtons = document.querySelectorAll('.pattern-btn');
        patternButtons.forEach(button => {
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
        });
        
        const addImageBtn = document.getElementById('add-image');
        const imageUpload = document.getElementById('image-upload');
        
        addImageBtn.addEventListener('click', () => {
            imageUpload.click();
        });
        
        imageUpload.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                
                // Validate file type
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    alert('Please select a valid image file (JPG, PNG, or WebP)');
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
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        console.log('Image loaded:', img.width + 'x' + img.height);
                        this.canvasManager.addImageElement(img);
                        
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
        });
        
        this.setupTextControls();
        this.setupImageControls();
        this.setupKeyboardShortcuts();
    }
    
    setupTextControls() {
        const textContent = document.getElementById('text-content');
        const textFont = document.getElementById('text-font');
        const textSize = document.getElementById('text-size');
        const textSizeValue = document.getElementById('text-size-value');
        const textColor = document.getElementById('text-color');
        const textWeight = document.getElementById('text-weight');
        const textAlign = document.getElementById('text-align');
        const textRotation = document.getElementById('text-rotation');
        
        textContent.addEventListener('input', (e) => {
            this.canvasManager.updateSelectedElement({ text: e.target.value });
        });
        
        textFont.addEventListener('change', (e) => {
            this.canvasManager.updateSelectedElement({ font: e.target.value });
        });
        
        textSize.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            textSizeValue.textContent = size + 'px';
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
            
            // Normalize rotation to 0-360 range
            while (rotation < 0) rotation += 360;
            while (rotation >= 360) rotation -= 360;
            
            this.canvasManager.updateSelectedElement({ rotation: rotation });
        });
    }
    
    showTextControls() {
        const textControls = document.getElementById('text-controls');
        textControls.style.display = 'block';
    }
    
    hideTextControls() {
        const textControls = document.getElementById('text-controls');
        textControls.style.display = 'none';
    }
    
    updateTextControls() {
        const selectedElement = this.canvasManager.selectedElement;
        if (selectedElement && selectedElement.text !== undefined) {
            document.getElementById('text-content').value = selectedElement.text;
            document.getElementById('text-font').value = selectedElement.font;
            document.getElementById('text-size').value = selectedElement.size;
            document.getElementById('text-size-value').textContent = selectedElement.size + 'px';
            document.getElementById('text-color').value = selectedElement.color;
            document.getElementById('text-weight').value = selectedElement.weight;
            document.getElementById('text-align').value = selectedElement.align;
            document.getElementById('text-rotation').value = Math.round(selectedElement.rotation) || 0;
        }
    }
    
    handleSelectionChange(selectedElement) {
        const deleteBtn = document.getElementById('delete-element');
        
        if (selectedElement) {
            deleteBtn.disabled = false;
            
            if (selectedElement.text !== undefined) {
                this.showTextControls();
                this.updateTextControls();
                this.hideImageControls();
            } else {
                this.hideTextControls();
                this.showImageControls();
                this.updateImageControls();
            }
        } else {
            deleteBtn.disabled = true;
            this.hideTextControls();
            this.hideImageControls();
        }
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
        paletteColors.forEach(colorElement => {
            colorElement.classList.remove('selected');
            if (colorElement.getAttribute('data-color') === selectedColor) {
                colorElement.classList.add('selected');
            }
        });
    }
    
    updatePatternButtons(selectedPattern) {
        const patternButtons = document.querySelectorAll('.pattern-btn');
        patternButtons.forEach(button => {
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
            
            // Normalize rotation to 0-360 range
            while (rotation < 0) rotation += 360;
            while (rotation >= 360) rotation -= 360;
            
            this.canvasManager.updateSelectedElement({ rotation: rotation });
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
            document.getElementById('image-brightness-value').textContent = selectedElement.brightness + '%';
            
            // Update contrast control
            document.getElementById('image-contrast').value = selectedElement.contrast;
            document.getElementById('image-contrast-value').textContent = selectedElement.contrast + '%';
            
            // Update saturation control
            document.getElementById('image-saturation').value = selectedElement.saturation;
            document.getElementById('image-saturation-value').textContent = selectedElement.saturation + '%';
            
            // Update rotation control
            document.getElementById('image-rotation').value = Math.round(selectedElement.rotation) || 0;
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
        const cropWidth = parseInt(document.getElementById('crop-width').value) || selectedElement.originalWidth;
        const cropHeight = parseInt(document.getElementById('crop-height').value) || selectedElement.originalHeight;
        
        // Validate crop dimensions
        if (cropX < 0 || cropY < 0 || cropWidth <= 0 || cropHeight <= 0 ||
            cropX + cropWidth > selectedElement.originalWidth ||
            cropY + cropHeight > selectedElement.originalHeight) {
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
            segmentationThreshold: 0.7
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
            
            if (segmentation.data[i] === 1) { // Person pixel
                // Keep the original pixel
                resultImageData.data[pixelIndex] = imageData.data[pixelIndex];     // R
                resultImageData.data[pixelIndex + 1] = imageData.data[pixelIndex + 1]; // G
                resultImageData.data[pixelIndex + 2] = imageData.data[pixelIndex + 2]; // B
                resultImageData.data[pixelIndex + 3] = imageData.data[pixelIndex + 3]; // A
            } else { // Background pixel
                // Make transparent
                resultImageData.data[pixelIndex] = 0;     // R
                resultImageData.data[pixelIndex + 1] = 0; // G
                resultImageData.data[pixelIndex + 2] = 0; // B
                resultImageData.data[pixelIndex + 3] = 0; // A (transparent)
            }
        }
        
        // Put the result on the canvas
        resultCtx.putImageData(resultImageData, 0, 0);
        
        // Check if any person pixels were found
        const hasPersonPixels = segmentation.data.some(pixel => pixel === 1);
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
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard shortcuts when not focused on an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Delete or Backspace key to delete selected element
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                this.canvasManager.deleteSelectedElement();
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
                this.canvasManager.elements.forEach(element => {
                    element.selected = false;
                });
                this.canvasManager.redrawCanvas();
                if (this.canvasManager.onSelectionChange) {
                    this.canvasManager.onSelectionChange(null);
                }
            }
        });
    }
}