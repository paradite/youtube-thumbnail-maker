import { darkenColor, lightenColor } from '../utils/colorUtils.js';

export class ShapeElement {
  constructor(x, y, shapeType, options = {}) {
    this.x = x;
    this.y = y;
    this.shapeType = shapeType; // 'rectangle', 'circle', 'triangle'
    this.width = options.width || 100;
    this.height = options.height || 100;
    this.color = options.color || '#ffffff';
    this.opacity = options.opacity !== undefined ? options.opacity : 0.3;
    this.strokeWidth = options.strokeWidth || 2;
    this.strokeColor = options.strokeColor || darkenColor(this.color, 0.2);
    this.rotation = options.rotation || 0;
    this.selected = false;
    this.id = Date.now() + Math.random();
    this.layer = options.layer || 0;
    this.resizeHandles = [];
  }

  render(ctx) {
    ctx.save();
    
    // Set opacity and colors
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;

    // Apply rotation if needed
    if (this.rotation !== 0) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Draw the shape based on type
    switch (this.shapeType) {
      case 'rectangle':
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        break;
      
      case 'circle':
        const radius = Math.min(this.width, this.height) / 2;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
      
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }

    ctx.restore();

    if (this.selected) {
      this.renderSelection(ctx);
    }
  }

  renderSelection(ctx) {
    ctx.save();
    
    // Apply same rotation as the shape for selection outline
    if (this.rotation !== 0) {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((this.rotation * Math.PI) / 180);
      
      // Draw selection outline in rotated space
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(-this.width / 2 - 5, -this.height / 2 - 5, this.width + 10, this.height + 10);
      ctx.setLineDash([]);

      this.renderResizeHandles(ctx, -this.width / 2 - 5, -this.height / 2 - 5, this.width + 10, this.height + 10);
    } else {
      // Non-rotated selection
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
      ctx.setLineDash([]);

      this.renderResizeHandles(ctx, this.x - 5, this.y - 5, this.width + 10, this.height + 10);
    }

    ctx.restore();
  }

  renderResizeHandles(ctx, x, y, width, height) {
    const handleSize = 8;
    ctx.fillStyle = '#ff0000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    // Corner resize handles
    const localHandles = [
      { x: x - handleSize / 2, y: y - handleSize / 2, type: 'nw' },
      { x: x + width - handleSize / 2, y: y - handleSize / 2, type: 'ne' },
      { x: x - handleSize / 2, y: y + height - handleSize / 2, type: 'sw' },
      { x: x + width - handleSize / 2, y: y + height - handleSize / 2, type: 'se' },
    ];

    localHandles.forEach((handle) => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });

    // Rotation handle
    const rotateHandleX = x + width / 2 - handleSize / 2;
    const rotateHandleY = y - 20 - handleSize / 2;

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(rotateHandleX, rotateHandleY, handleSize, handleSize);
    ctx.strokeRect(rotateHandleX, rotateHandleY, handleSize, handleSize);

    // Connection line to rotation handle
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y - 15);
    ctx.stroke();

    localHandles.push({ x: rotateHandleX, y: rotateHandleY, type: 'rotate' });

    // Store handles for hit testing
    if (this.rotation !== 0) {
      // For rotated elements, transform local handle positions to global coordinates
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      this.resizeHandles = localHandles.map((handle) => {
        const localCenterX = handle.x + handleSize / 2;
        const localCenterY = handle.y + handleSize / 2;

        const globalPoint = this.rotatePoint(
          localCenterX,
          localCenterY,
          0,
          0,
          this.rotation
        );

        return {
          x: centerX + globalPoint.x - handleSize / 2,
          y: centerY + globalPoint.y - handleSize / 2,
          type: handle.type,
        };
      });
    } else {
      this.resizeHandles = localHandles.map((handle) => ({
        x: handle.x,
        y: handle.y,
        type: handle.type,
      }));
    }
  }

  isPointInside(x, y, ctx) {
    if (this.rotation === 0) {
      // Simple bounding box check for non-rotated shapes
      switch (this.shapeType) {
        case 'rectangle':
          return x >= this.x && x <= this.x + this.width && 
                 y >= this.y && y <= this.y + this.height;
        
        case 'circle':
          const centerX = this.x + this.width / 2;
          const centerY = this.y + this.height / 2;
          const radius = Math.min(this.width, this.height) / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          return distance <= radius;
        
        case 'triangle':
          // Use bounding box for simplicity
          return x >= this.x && x <= this.x + this.width && 
                 y >= this.y && y <= this.y + this.height;
        
        default:
          return false;
      }
    } else {
      // For rotated shapes, transform the point and check
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      const rotatedPoint = this.rotatePoint(x, y, centerX, centerY, -this.rotation);
      
      // Check against non-rotated bounds
      switch (this.shapeType) {
        case 'rectangle':
          return rotatedPoint.x >= this.x && rotatedPoint.x <= this.x + this.width && 
                 rotatedPoint.y >= this.y && rotatedPoint.y <= this.y + this.height;
        
        case 'circle':
          const radius = Math.min(this.width, this.height) / 2;
          const distance = Math.sqrt((rotatedPoint.x - centerX) ** 2 + (rotatedPoint.y - centerY) ** 2);
          return distance <= radius;
        
        case 'triangle':
          return rotatedPoint.x >= this.x && rotatedPoint.x <= this.x + this.width && 
                 rotatedPoint.y >= this.y && rotatedPoint.y <= this.y + this.height;
        
        default:
          return false;
      }
    }
  }

  rotatePoint(x, y, centerX, centerY, angleDegrees) {
    const angleRad = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const dx = x - centerX;
    const dy = y - centerY;

    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos,
    };
  }

  isPointInResizeHandle(x, y) {
    if (!this.selected || !this.resizeHandles) return null;

    for (let handle of this.resizeHandles) {
      if (x >= handle.x && x <= handle.x + 8 && y >= handle.y && y <= handle.y + 8) {
        return handle.type;
      }
    }

    return null;
  }

  update(options) {
    if (options.shapeType !== undefined) this.shapeType = options.shapeType;
    if (options.width !== undefined) this.width = options.width;
    if (options.height !== undefined) this.height = options.height;
    if (options.color !== undefined) {
      this.color = options.color;
      // Update stroke color to complement fill color
      this.strokeColor = darkenColor(this.color, 0.2);
    }
    if (options.opacity !== undefined) this.opacity = options.opacity;
    if (options.strokeWidth !== undefined) this.strokeWidth = options.strokeWidth;
    if (options.strokeColor !== undefined) this.strokeColor = options.strokeColor;
    if (options.rotation !== undefined) this.rotation = options.rotation;
    if (options.layer !== undefined) this.layer = options.layer;
  }
}