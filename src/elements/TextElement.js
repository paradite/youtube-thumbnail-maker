export class TextElement {
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