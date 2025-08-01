import { TextElement } from '../elements/TextElement.js';
import { ImageElement } from '../elements/ImageElement.js';
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
                const handleType = element.isPointInResizeHandle(x, y);
                if (handleType) {
                    this.selectedElement = element;
                    if (handleType === 'rotate') {
                        this.isRotating = true;
                        this.initialRotation = element.rotation;
                        
                        // Different rotation center for text vs image
                        if (element.text !== undefined) {
                            this.rotationCenter = { x: element.x, y: element.y + element.size / 2 };
                        } else if (element.image) {
                            this.rotationCenter = { x: element.x + element.width / 2, y: element.y + element.height / 2 };
                        }
                        this.initialMousePos = { x, y };
                    } else {
                        this.isResizing = true;
                        this.resizeHandle = handleType;
                        
                        // Store initial size for both text and image elements
                        if (element.text !== undefined) {
                            this.initialSize = element.size;
                        } else if (element.image) {
                            this.initialWidth = element.width;
                            this.initialHeight = element.height;
                        }
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
            
            // Update UI controls when rotation changes
            if (this.onSelectionChange) {
                this.onSelectionChange(this.selectedElement);
            }
            
            this.redrawCanvas();
        } else if (this.isResizing && this.selectedElement) {
            this.canvas.style.cursor = 'nw-resize';
            const deltaX = x - this.initialMousePos.x;
            const deltaY = y - this.initialMousePos.y;
            
            if (this.selectedElement.text !== undefined) {
                // Text element resizing (existing logic)
                const scaleFactor = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 50;
                
                let newSize = this.initialSize;
                if (deltaX > 0 || deltaY > 0) {
                    newSize = Math.max(12, this.initialSize + scaleFactor * 20);
                } else {
                    newSize = Math.max(12, this.initialSize - scaleFactor * 20);
                }
                
                this.selectedElement.size = Math.round(newSize);
            } else if (this.selectedElement.image) {
                // Image element resizing
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const scaleFactor = deltaX > 0 || deltaY > 0 ? 1 + distance / 200 : 1 - distance / 200;
                
                const newWidth = Math.max(20, this.initialWidth * scaleFactor);
                const newHeight = Math.max(20, this.initialHeight * scaleFactor);
                
                this.selectedElement.width = Math.round(newWidth);
                this.selectedElement.height = Math.round(newHeight);
            }
            
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
                const handleType = element.isPointInResizeHandle(x, y);
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
    
    addImageElement(image, x = 100, y = 100) {
        // Scale image to fit within reasonable bounds while maintaining aspect ratio
        const maxWidth = this.canvas.width * 0.4; // Max 40% of canvas width
        const maxHeight = this.canvas.height * 0.4; // Max 40% of canvas height
        
        let width = image.width;
        let height = image.height;
        
        // Scale down if image is too large
        if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width *= scale;
            height *= scale;
        }
        
        const imageElement = new ImageElement(x, y, image, { width, height });
        this.elements.push(imageElement);
        this.selectedElement = imageElement;
        imageElement.selected = true;
        
        this.elements.forEach(element => {
            if (element !== imageElement) {
                element.selected = false;
            }
        });
        
        if (this.onSelectionChange) {
            this.onSelectionChange(imageElement);
        }
        
        this.redrawCanvas();
        this.saveToLocalStorage();
        return imageElement;
    }
    
    updateSelectedElement(options) {
        if (this.selectedElement && this.selectedElement.update) {
            this.selectedElement.update(options);
            this.redrawCanvas();
            this.saveToLocalStorage();
            
            // Update UI controls when specific properties change
            if (this.onSelectionChange && (options.size !== undefined || options.rotation !== undefined)) {
                this.onSelectionChange(this.selectedElement);
            }
        }
    }
    
    deleteSelectedElement() {
        if (this.selectedElement) {
            const index = this.elements.indexOf(this.selectedElement);
            if (index > -1) {
                this.elements.splice(index, 1);
                this.selectedElement = null;
                
                if (this.onSelectionChange) {
                    this.onSelectionChange(null);
                }
                
                this.redrawCanvas();
                this.saveToLocalStorage();
                return true;
            }
        }
        return false;
    }
    
    exportAsImage(format = 'image/jpeg', quality = 0.9) {
        return this.canvas.toDataURL(format, quality);
    }
    
    exportProject() {
        const projectData = {
            elements: this.elements.map(element => {
                const serialized = { ...element };
                delete serialized.selected;
                
                if (element.text !== undefined) {
                    serialized.type = 'text';
                } else if (element.image) {
                    serialized.type = 'image';
                    // Convert image to data URL for export
                    const canvas = document.createElement('canvas');
                    canvas.width = element.originalWidth;
                    canvas.height = element.originalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(element.image, 0, 0);
                    serialized.imageData = canvas.toDataURL();
                    delete serialized.image; // Remove the actual image object
                }
                
                return serialized;
            }),
            backgroundColor: this.currentBackgroundColor,
            backgroundPattern: this.currentBackgroundPattern,
            version: '1.0',
            timestamp: Date.now(),
            metadata: {
                appName: 'YouTube Thumbnail Maker',
                canvasWidth: this.canvas.width,
                canvasHeight: this.canvas.height
            }
        };
        
        return JSON.stringify(projectData, null, 2);
    }
    
    async importProject(jsonData) {
        try {
            const projectData = JSON.parse(jsonData);
            
            // Validate project data structure
            if (!projectData.version || !projectData.elements || !Array.isArray(projectData.elements)) {
                throw new Error('Invalid project file format');
            }
            
            // Clear current elements
            this.elements = [];
            this.selectedElement = null;
            
            // Load elements
            const loadPromises = projectData.elements.map(elementData => {
                return new Promise((resolve) => {
                    if (elementData.type === 'text') {
                        const { type, ...elementProps } = elementData;
                        const textElement = Object.assign(new TextElement(0, 0, ''), elementProps);
                        if (elementProps.rotation === undefined) {
                            textElement.rotation = 0;
                        }
                        this.elements.push(textElement);
                        resolve();
                    } else if (elementData.type === 'image' && elementData.imageData) {
                        const img = new Image();
                        img.onload = () => {
                            const { type, imageData, ...elementProps } = elementData;
                            const imageElement = Object.assign(new ImageElement(0, 0, img), elementProps);
                            imageElement.image = img;
                            if (elementProps.rotation === undefined) {
                                imageElement.rotation = 0;
                            }
                            this.elements.push(imageElement);
                            resolve();
                        };
                        img.onerror = () => {
                            console.error('Failed to load image from project');
                            resolve();
                        };
                        img.src = elementData.imageData;
                    } else {
                        resolve();
                    }
                });
            });
            
            await Promise.all(loadPromises);
            
            // Restore background settings
            if (projectData.backgroundColor) {
                this.currentBackgroundColor = projectData.backgroundColor;
            }
            
            if (projectData.backgroundPattern) {
                this.currentBackgroundPattern = projectData.backgroundPattern;
            }
            
            // Redraw canvas and update UI
            this.redrawCanvas();
            this.updateUIAfterLoad();
            
            // Save to localStorage after import
            this.saveToLocalStorage();
            
            console.log('Project imported successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to import project:', error);
            throw new Error('Failed to import project: ' + error.message);
        }
    }
    
    saveToLocalStorage() {
        const projectData = {
            elements: this.elements.map(element => {
                const serialized = { ...element };
                delete serialized.selected;
                
                if (element.text !== undefined) {
                    serialized.type = 'text';
                } else if (element.image) {
                    serialized.type = 'image';
                    // Convert image to data URL for storage
                    const canvas = document.createElement('canvas');
                    canvas.width = element.originalWidth;
                    canvas.height = element.originalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(element.image, 0, 0);
                    serialized.imageData = canvas.toDataURL();
                    delete serialized.image; // Remove the actual image object
                }
                
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
                
                const loadPromises = projectData.elements.map(elementData => {
                    return new Promise((resolve) => {
                        if (elementData.type === 'text') {
                            const { type, ...elementProps } = elementData;
                            const textElement = Object.assign(new TextElement(0, 0, ''), elementProps);
                            if (elementProps.rotation === undefined) {
                                textElement.rotation = 0;
                            }
                            this.elements.push(textElement);
                            resolve();
                        } else if (elementData.type === 'image' && elementData.imageData) {
                            const img = new Image();
                            img.onload = () => {
                                const { type, imageData, ...elementProps } = elementData;
                                const imageElement = Object.assign(new ImageElement(0, 0, img), elementProps);
                                imageElement.image = img;
                                if (elementProps.rotation === undefined) {
                                    imageElement.rotation = 0;
                                }
                                this.elements.push(imageElement);
                                resolve();
                            };
                            img.onerror = () => {
                                console.error('Failed to load saved image');
                                resolve();
                            };
                            img.src = elementData.imageData;
                        } else {
                            resolve();
                        }
                    });
                });
                
                Promise.all(loadPromises).then(() => {
                    if (projectData.backgroundColor) {
                        this.currentBackgroundColor = projectData.backgroundColor;
                    }
                    
                    if (projectData.backgroundPattern) {
                        this.currentBackgroundPattern = projectData.backgroundPattern;
                    }
                    
                    this.redrawCanvas();
                    this.updateUIAfterLoad();
                    console.log('Project loaded from localStorage');
                });
                
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