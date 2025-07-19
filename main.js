class TextElement {
    constructor(x, y, text, options = {}) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.font = options.font || 'Arial';
        this.size = options.size || 48;
        this.color = options.color || '#000000';
        this.weight = options.weight || 'normal';
        this.align = options.align || 'left';
        this.rotation = options.rotation || 0;
        this.selected = false;
        this.id = Date.now() + Math.random();
    }
    
    render(ctx) {
        ctx.save();
        ctx.font = `${this.weight} ${this.size}px ${this.font}`;
        ctx.fillStyle = this.color;
        ctx.textAlign = this.align;
        ctx.textBaseline = 'top';
        
        if (this.rotation !== 0) {
            ctx.translate(this.x, this.y + this.size / 2);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.fillText(this.text, 0, -this.size / 2);
        } else {
            ctx.fillText(this.text, this.x, this.y);
        }
        
        if (this.selected) {
            this.renderSelection(ctx);
        }
        
        ctx.restore();
    }
    
    renderSelection(ctx) {
        const metrics = ctx.measureText(this.text);
        const width = metrics.width;
        const height = this.size;
        
        let startX = this.x;
        if (this.align === 'center') {
            startX = this.x - width / 2;
        } else if (this.align === 'right') {
            startX = this.x - width;
        }
        
        ctx.save();
        
        if (this.rotation !== 0) {
            ctx.translate(this.x, this.y + this.size / 2);
            ctx.rotate(this.rotation * Math.PI / 180);
            
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(-width / 2 - 5, -this.size / 2 - 5, width + 10, height + 10);
            ctx.setLineDash([]);
            
            this.renderResizeHandles(ctx, -width / 2 - 5, -this.size / 2 - 5, width + 10, height + 10);
        } else {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(startX - 5, this.y - 5, width + 10, height + 10);
            ctx.setLineDash([]);
            
            this.renderResizeHandles(ctx, startX - 5, this.y - 5, width + 10, height + 10);
        }
        
        ctx.restore();
    }
    
    renderResizeHandles(ctx, x, y, width, height) {
        const handleSize = 8;
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        const handles = [
            { x: x - handleSize/2, y: y - handleSize/2, type: 'nw' },
            { x: x + width - handleSize/2, y: y - handleSize/2, type: 'ne' },
            { x: x - handleSize/2, y: y + height - handleSize/2, type: 'sw' },
            { x: x + width - handleSize/2, y: y + height - handleSize/2, type: 'se' }
        ];
        
        handles.forEach(handle => {
            ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
            ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });
        
        const rotateHandleX = x + width / 2 - handleSize / 2;
        const rotateHandleY = y - 20 - handleSize / 2;
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(rotateHandleX, rotateHandleY, handleSize, handleSize);
        ctx.strokeRect(rotateHandleX, rotateHandleY, handleSize, handleSize);
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width / 2, y - 15);
        ctx.stroke();
        
        handles.push({ x: rotateHandleX, y: rotateHandleY, type: 'rotate' });
        
        this.resizeHandles = handles;
    }
    
    isPointInside(x, y, ctx) {
        ctx.save();
        ctx.font = `${this.weight} ${this.size}px ${this.font}`;
        const metrics = ctx.measureText(this.text);
        const width = metrics.width;
        const height = this.size;
        
        let startX = this.x;
        if (this.align === 'center') {
            startX = this.x - width / 2;
        } else if (this.align === 'right') {
            startX = this.x - width;
        }
        
        ctx.restore();
        
        if (this.rotation === 0) {
            return x >= startX && x <= startX + width && 
                   y >= this.y && y <= this.y + height;
        } else {
            const centerX = this.x;
            const centerY = this.y + this.size / 2;
            
            const rotatedPoint = this.rotatePoint(x, y, centerX, centerY, -this.rotation);
            
            let rotatedStartX = this.x;
            if (this.align === 'center') {
                rotatedStartX = this.x - width / 2;
            } else if (this.align === 'right') {
                rotatedStartX = this.x - width;
            }
            
            return rotatedPoint.x >= rotatedStartX && rotatedPoint.x <= rotatedStartX + width && 
                   rotatedPoint.y >= this.y && rotatedPoint.y <= this.y + height;
        }
    }
    
    rotatePoint(x, y, centerX, centerY, angleDegrees) {
        const angleRad = angleDegrees * Math.PI / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        
        const dx = x - centerX;
        const dy = y - centerY;
        
        return {
            x: centerX + dx * cos - dy * sin,
            y: centerY + dx * sin + dy * cos
        };
    }
    
    isPointInResizeHandle(x, y, ctx) {
        if (!this.selected || !this.resizeHandles) return null;
        
        if (this.rotation !== 0) {
            const centerX = this.x;
            const centerY = this.y + this.size / 2;
            const rotatedPoint = this.rotatePoint(x, y, centerX, centerY, -this.rotation);
            
            for (let handle of this.resizeHandles) {
                if (rotatedPoint.x >= handle.x && rotatedPoint.x <= handle.x + 8 &&
                    rotatedPoint.y >= handle.y && rotatedPoint.y <= handle.y + 8) {
                    return handle.type;
                }
            }
        } else {
            for (let handle of this.resizeHandles) {
                if (x >= handle.x && x <= handle.x + 8 &&
                    y >= handle.y && y <= handle.y + 8) {
                    return handle.type;
                }
            }
        }
        
        return null;
    }
    
    update(options) {
        if (options.text !== undefined) this.text = options.text;
        if (options.font !== undefined) this.font = options.font;
        if (options.size !== undefined) this.size = options.size;
        if (options.color !== undefined) this.color = options.color;
        if (options.weight !== undefined) this.weight = options.weight;
        if (options.align !== undefined) this.align = options.align;
        if (options.rotation !== undefined) this.rotation = options.rotation;
    }
}

class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.elements = [];
        this.selectedElement = null;
        this.currentBackgroundColor = '#ffffff';
        this.currentBackgroundPattern = 'solid';
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.isResizing = false;
        this.resizeHandle = null;
        this.initialSize = 0;
        this.initialMousePos = { x: 0, y: 0 };
        this.isRotating = false;
        this.initialRotation = 0;
        this.rotationCenter = { x: 0, y: 0 };
        this.onSelectionChange = null;
        
        this.init();
    }
    
    init() {
        this.clearCanvas();
        this.setupEventListeners();
        this.loadFromLocalStorage();
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
        
        this.canvas.style.cursor = 'default';
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.selectedElement = null;
        this.isResizing = false;
        this.resizeHandle = null;
        this.isRotating = false;
        
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            
            if (element.selected && element.isPointInResizeHandle) {
                const handleType = element.isPointInResizeHandle(x, y, this.ctx);
                if (handleType) {
                    this.selectedElement = element;
                    if (handleType === 'rotate') {
                        this.isRotating = true;
                        this.initialRotation = element.rotation;
                        this.rotationCenter = { x: element.x, y: element.y + element.size / 2 };
                        this.initialMousePos = { x, y };
                    } else {
                        this.isResizing = true;
                        this.resizeHandle = handleType;
                        this.initialSize = element.size;
                        this.initialMousePos = { x, y };
                    }
                    break;
                }
            }
            
            if (element.isPointInside && element.isPointInside(x, y, this.ctx)) {
                this.selectedElement = element;
                element.selected = true;
                this.isDragging = true;
                this.dragOffset.x = x - element.x;
                this.dragOffset.y = y - element.y;
                break;
            }
        }
        
        this.elements.forEach(element => {
            if (element !== this.selectedElement) {
                element.selected = false;
            }
        });
        
        if (this.onSelectionChange) {
            this.onSelectionChange(this.selectedElement);
        }
        
        this.redrawCanvas();
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        if (this.isRotating && this.selectedElement) {
            this.canvas.style.cursor = 'grab';
            const centerX = this.rotationCenter.x;
            const centerY = this.rotationCenter.y;
            
            const initialAngle = Math.atan2(this.initialMousePos.y - centerY, this.initialMousePos.x - centerX);
            const currentAngle = Math.atan2(y - centerY, x - centerX);
            
            const deltaAngle = (currentAngle - initialAngle) * 180 / Math.PI;
            let newRotation = this.initialRotation + deltaAngle;
            
            while (newRotation < 0) newRotation += 360;
            while (newRotation >= 360) newRotation -= 360;
            
            this.selectedElement.rotation = newRotation;
            this.redrawCanvas();
        } else if (this.isResizing && this.selectedElement) {
            this.canvas.style.cursor = 'nw-resize';
            const deltaX = x - this.initialMousePos.x;
            const deltaY = y - this.initialMousePos.y;
            const scaleFactor = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 50;
            
            let newSize = this.initialSize;
            if (deltaX > 0 || deltaY > 0) {
                newSize = Math.max(12, this.initialSize + scaleFactor * 20);
            } else {
                newSize = Math.max(12, this.initialSize - scaleFactor * 20);
            }
            
            this.selectedElement.size = Math.round(newSize);
            this.redrawCanvas();
        } else if (this.isDragging && this.selectedElement) {
            this.canvas.style.cursor = 'move';
            this.selectedElement.x = x - this.dragOffset.x;
            this.selectedElement.y = y - this.dragOffset.y;
            this.redrawCanvas();
        } else {
            this.updateCursor(x, y);
        }
    }
    
    updateCursor(x, y) {
        let cursor = 'default';
        
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            
            if (element.selected && element.isPointInResizeHandle) {
                const handleType = element.isPointInResizeHandle(x, y, this.ctx);
                if (handleType) {
                    if (handleType === 'rotate') {
                        cursor = 'grab';
                    } else {
                        cursor = 'nw-resize';
                    }
                    break;
                }
            }
            
            if (element.isPointInside && element.isPointInside(x, y, this.ctx)) {
                cursor = 'move';
                break;
            }
        }
        
        this.canvas.style.cursor = cursor;
    }
    
    handleMouseUp(e) {
        if (this.isDragging || this.isResizing || this.isRotating) {
            this.saveToLocalStorage();
        }
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.resizeHandle = null;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        this.updateCursor(x, y);
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
        this.saveToLocalStorage();
    }
    
    setBackgroundPattern(pattern) {
        this.currentBackgroundPattern = pattern;
        this.renderBackground();
        this.redraw();
        this.saveToLocalStorage();
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
    
    redrawCanvas() {
        this.renderBackground();
        this.redraw();
    }
    
    addTextElement(text = 'Sample Text', x = 100, y = 100) {
        const textElement = new TextElement(x, y, text);
        this.elements.push(textElement);
        this.selectedElement = textElement;
        textElement.selected = true;
        
        this.elements.forEach(element => {
            if (element !== textElement) {
                element.selected = false;
            }
        });
        
        if (this.onSelectionChange) {
            this.onSelectionChange(textElement);
        }
        
        this.redrawCanvas();
        this.saveToLocalStorage();
        return textElement;
    }
    
    updateSelectedElement(options) {
        if (this.selectedElement && this.selectedElement.update) {
            this.selectedElement.update(options);
            this.redrawCanvas();
            this.saveToLocalStorage();
            
            if (this.onSelectionChange && options.size !== undefined) {
                this.onSelectionChange(this.selectedElement);
            }
        }
    }
    
    exportAsImage(format = 'image/jpeg', quality = 0.9) {
        return this.canvas.toDataURL(format, quality);
    }
    
    saveToLocalStorage() {
        const projectData = {
            elements: this.elements.map(element => {
                const serialized = { ...element };
                delete serialized.selected;
                serialized.type = 'text';
                return serialized;
            }),
            backgroundColor: this.currentBackgroundColor,
            backgroundPattern: this.currentBackgroundPattern,
            version: '1.0',
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('youtube-thumbnail-project', JSON.stringify(projectData));
            console.log('Project saved to localStorage');
        } catch (error) {
            console.error('Failed to save project to localStorage:', error);
        }
    }
    
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('youtube-thumbnail-project');
            if (!savedData) {
                console.log('No saved project found');
                return false;
            }
            
            const projectData = JSON.parse(savedData);
            
            if (projectData.version && projectData.elements) {
                this.elements = [];
                this.selectedElement = null;
                
                projectData.elements.forEach(elementData => {
                    if (elementData.type === 'text') {
                        const { type, ...elementProps } = elementData;
                        const textElement = Object.assign(new TextElement(0, 0, ''), elementProps);
                        if (elementProps.rotation === undefined) {
                            textElement.rotation = 0;
                        }
                        this.elements.push(textElement);
                    }
                });
                
                if (projectData.backgroundColor) {
                    this.currentBackgroundColor = projectData.backgroundColor;
                }
                
                if (projectData.backgroundPattern) {
                    this.currentBackgroundPattern = projectData.backgroundPattern;
                }
                
                this.redrawCanvas();
                this.updateUIAfterLoad();
                console.log('Project loaded from localStorage');
                return true;
            }
        } catch (error) {
            console.error('Failed to load project from localStorage:', error);
        }
        
        return false;
    }
    
    updateUIAfterLoad() {
        if (this.onUIUpdate) {
            this.onUIUpdate();
        }
    }
}

class UIController {
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

document.addEventListener('DOMContentLoaded', () => {
    const canvasManager = new CanvasManager('thumbnail-canvas');
    const uiController = new UIController(canvasManager);
    
    console.log('YouTube Thumbnail Maker initialized');
});