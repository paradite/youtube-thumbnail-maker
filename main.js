class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.elements = [];
        this.selectedElement = null;
        this.currentBackgroundColor = '#ffffff';
        this.currentBackgroundPattern = 'solid';
        
        this.init();
    }
    
    init() {
        this.clearCanvas();
        this.setupEventListeners();
    }
    
    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        console.log('Mouse down at:', x, y);
    }
    
    handleMouseMove(e) {
        if (this.selectedElement) {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
            
            console.log('Mouse move at:', x, y);
        }
    }
    
    handleMouseUp(e) {
        this.selectedElement = null;
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
        
        console.log('Touch start at:', x, y);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (this.selectedElement && e.touches[0]) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            console.log('Touch move at:', x, y);
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.selectedElement = null;
    }
    
    setBackgroundColor(color) {
        this.currentBackgroundColor = color;
        this.renderBackground();
        this.redraw();
    }
    
    setBackgroundPattern(pattern) {
        this.currentBackgroundPattern = pattern;
        this.renderBackground();
        this.redraw();
    }
    
    renderBackground() {
        switch (this.currentBackgroundPattern) {
            case 'solid':
                this.renderSolidBackground();
                break;
            case 'gradient':
                this.renderGradientBackground();
                break;
            case 'stripes':
                this.renderStripesBackground();
                break;
            case 'dots':
                this.renderDotsBackground();
                break;
            default:
                this.renderSolidBackground();
        }
    }
    
    renderSolidBackground() {
        this.ctx.fillStyle = this.currentBackgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderGradientBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, this.currentBackgroundColor);
        gradient.addColorStop(1, this.darkenColor(this.currentBackgroundColor, 0.3));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderStripesBackground() {
        this.ctx.fillStyle = this.currentBackgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = this.darkenColor(this.currentBackgroundColor, 0.1);
        const stripeWidth = 40;
        
        for (let x = 0; x < this.canvas.width; x += stripeWidth * 2) {
            this.ctx.fillRect(x, 0, stripeWidth, this.canvas.height);
        }
    }
    
    renderDotsBackground() {
        this.ctx.fillStyle = this.currentBackgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = this.darkenColor(this.currentBackgroundColor, 0.2);
        const dotSize = 6;
        const spacing = 40;
        
        for (let x = spacing; x < this.canvas.width; x += spacing) {
            for (let y = spacing; y < this.canvas.height; y += spacing) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - Math.round(255 * amount));
        const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - Math.round(255 * amount));
        const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - Math.round(255 * amount));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    redraw() {
        this.elements.forEach(element => {
            element.render(this.ctx);
        });
    }
    
    exportAsImage(format = 'image/jpeg', quality = 0.9) {
        return this.canvas.toDataURL(format, quality);
    }
}

class UIController {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
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
            console.log('Add text clicked');
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
}

document.addEventListener('DOMContentLoaded', () => {
    const canvasManager = new CanvasManager('thumbnail-canvas');
    const uiController = new UIController(canvasManager);
    
    console.log('YouTube Thumbnail Maker initialized');
});