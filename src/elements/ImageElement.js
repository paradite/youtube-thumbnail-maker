export class ImageElement {
    constructor(x, y, image, options = {}) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.width = options.width || image.width;
        this.height = options.height || image.height;
        this.originalWidth = image.width;
        this.originalHeight = image.height;
        this.rotation = options.rotation || 0;
        this.selected = false;
        this.id = Date.now() + Math.random();
        
        // Maintain aspect ratio by default
        this.aspectRatio = this.originalWidth / this.originalHeight;
        this.maintainAspectRatio = true;
    }
    
    render(ctx) {
        ctx.save();
        
        if (this.rotation !== 0) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
        
        if (this.selected) {
            this.renderSelection(ctx);
        }
        
        ctx.restore();
    }
    
    renderSelection(ctx) {
        const width = this.width;
        const height = this.height;
        
        ctx.save();
        
        if (this.rotation !== 0) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation * Math.PI / 180);
            
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10);
            ctx.setLineDash([]);
            
            this.renderResizeHandles(ctx, -width / 2 - 5, -height / 2 - 5, width + 10, height + 10);
        } else {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x - 5, this.y - 5, width + 10, height + 10);
            ctx.setLineDash([]);
            
            this.renderResizeHandles(ctx, this.x - 5, this.y - 5, width + 10, height + 10);
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
        
        // Rotation handle
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
    
    isPointInside(x, y) {
        if (this.rotation === 0) {
            return x >= this.x && x <= this.x + this.width && 
                   y >= this.y && y <= this.y + this.height;
        } else {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            const rotatedPoint = this.rotatePoint(x, y, centerX, centerY, -this.rotation);
            
            return rotatedPoint.x >= this.x && rotatedPoint.x <= this.x + this.width && 
                   rotatedPoint.y >= this.y && rotatedPoint.y <= this.y + this.height;
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
    
    isPointInResizeHandle(x, y) {
        if (!this.selected || !this.resizeHandles) return null;
        
        if (this.rotation !== 0) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
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
        if (options.x !== undefined) this.x = options.x;
        if (options.y !== undefined) this.y = options.y;
        if (options.width !== undefined) {
            this.width = options.width;
            if (this.maintainAspectRatio) {
                this.height = this.width / this.aspectRatio;
            }
        }
        if (options.height !== undefined) {
            this.height = options.height;
            if (this.maintainAspectRatio) {
                this.width = this.height * this.aspectRatio;
            }
        }
        if (options.rotation !== undefined) this.rotation = options.rotation;
    }
    
    // Scale the image while maintaining aspect ratio
    scale(factor) {
        this.width *= factor;
        this.height *= factor;
    }
    
    // Fit image to specific dimensions while maintaining aspect ratio
    fitToSize(maxWidth, maxHeight) {
        const scale = Math.min(maxWidth / this.width, maxHeight / this.height);
        this.scale(scale);
    }
}