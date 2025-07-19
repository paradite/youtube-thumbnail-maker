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
                console.log('Image selected:', e.target.files[0].name);
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
        
        this.setupTextControls();
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
        if (selectedElement && selectedElement.text !== undefined) {
            this.showTextControls();
            this.updateTextControls();
        } else {
            this.hideTextControls();
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
}