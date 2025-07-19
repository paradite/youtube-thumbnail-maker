import { TextElement } from '../elements/TextElement.js';
import { BackgroundRenderer } from '../utils/backgroundRenderer.js';

export class CanvasManager {
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
        
        this.backgroundRenderer = new BackgroundRenderer(this.canvas, this.ctx);
        
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
        this.backgroundRenderer.render(this.currentBackgroundPattern, this.currentBackgroundColor);
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