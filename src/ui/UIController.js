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
        
        cropBtn.addEventListener('click', () => {
            this.startCropping();
        });
        
        applyCropBtn.addEventListener('click', () => {
            this.applyCrop();
        });
        
        cancelCropBtn.addEventListener('click', () => {
            this.cancelCrop();
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