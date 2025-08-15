import { darkenColor } from '../utils/colorUtils.js';

export class ArrowElement {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.x2 = x + 100; // End point X
    this.y2 = y + 50;  // End point Y
    this.arrowType = options.arrowType || 'straight'; // 'straight' or 'curved'
    this.color = options.color || '#000000';
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.strokeWidth = options.strokeWidth || 3;
    this.arrowheadSize = options.arrowheadSize || 15;
    this.curvature = options.curvature || 0.3; // -1 to 1, 0 = straight, positive = one side, negative = other side
    this.rotation = options.rotation || 0;
    this.selected = false;
    this.id = Date.now() + Math.random();
    this.layer = options.layer || 0;
    this.resizeHandles = [];
    
    // Calculate bounding box
    this.updateBounds();
  }

  updateBounds() {
    // Calculate bounding box that encompasses the entire arrow
    const minX = Math.min(this.x, this.x2) - this.arrowheadSize;
    const maxX = Math.max(this.x, this.x2) + this.arrowheadSize;
    const minY = Math.min(this.y, this.y2) - this.arrowheadSize;
    const maxY = Math.max(this.y, this.y2) + this.arrowheadSize;
    
    // For curved arrows, expand bounds to account for the curve
    if (this.arrowType === 'curved' && this.curvature !== 0) {
      const controlPoint = this.getControlPoint();
      const allX = [minX, maxX, controlPoint.x];
      const allY = [minY, maxY, controlPoint.y];
      this.boundingBox = {
        x: Math.min(...allX) - 10,
        y: Math.min(...allY) - 10,
        width: Math.max(...allX) - Math.min(...allX) + 20,
        height: Math.max(...allY) - Math.min(...allY) + 20
      };
    } else {
      this.boundingBox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
  }

  getControlPoint() {
    // Calculate control point for quadratic curve
    const midX = (this.x + this.x2) / 2;
    const midY = (this.y + this.y2) / 2;
    
    // Calculate perpendicular offset
    const dx = this.x2 - this.x;
    const dy = this.y2 - this.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return { x: midX, y: midY };
    
    const offset = length * Math.abs(this.curvature);
    const perpX = -dy / length;
    const perpY = dx / length;
    
    // Apply sign to determine which side of the line to curve
    const sign = this.curvature >= 0 ? 1 : -1;
    
    return {
      x: midX + perpX * offset * sign,
      y: midY + perpY * offset * sign
    };
  }

  render(ctx) {
    ctx.save();
    
    ctx.globalAlpha = this.opacity;
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = this.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this.arrowType === 'straight') {
      this.renderStraightArrow(ctx);
    } else {
      this.renderCurvedArrow(ctx);
    }

    ctx.restore();

    if (this.selected) {
      this.renderSelection(ctx);
    }
  }

  renderStraightArrow(ctx) {
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();

    // Draw arrowhead
    this.drawArrowhead(ctx, this.x2, this.y2, this.x, this.y);
  }

  renderCurvedArrow(ctx) {
    const controlPoint = this.getControlPoint();
    
    // Draw the curved line
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, this.x2, this.y2);
    ctx.stroke();

    // Calculate direction for arrowhead (tangent at end point)
    const t = 0.99; // Close to end point
    const prevX = (1 - t) * (1 - t) * this.x + 2 * (1 - t) * t * controlPoint.x + t * t * this.x2;
    const prevY = (1 - t) * (1 - t) * this.y + 2 * (1 - t) * t * controlPoint.y + t * t * this.y2;
    
    this.drawArrowhead(ctx, this.x2, this.y2, prevX, prevY);
  }

  drawArrowhead(ctx, tipX, tipY, fromX, fromY) {
    const angle = Math.atan2(tipY - fromY, tipX - fromX);
    const headlen = this.arrowheadSize;
    const headAngle = Math.PI / 6; // 30 degrees

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - headlen * Math.cos(angle - headAngle),
      tipY - headlen * Math.sin(angle - headAngle)
    );
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - headlen * Math.cos(angle + headAngle),
      tipY - headlen * Math.sin(angle + headAngle)
    );
    ctx.stroke();
  }

  renderSelection(ctx) {
    this.updateBounds();
    
    ctx.save();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      this.boundingBox.x - 5,
      this.boundingBox.y - 5,
      this.boundingBox.width + 10,
      this.boundingBox.height + 10
    );
    ctx.setLineDash([]);

    // Draw control points for arrow endpoints
    ctx.fillStyle = '#ff0000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    const handleSize = 8;
    
    // Start point handle
    ctx.fillRect(this.x - handleSize / 2, this.y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(this.x - handleSize / 2, this.y - handleSize / 2, handleSize, handleSize);
    
    // End point handle
    ctx.fillRect(this.x2 - handleSize / 2, this.y2 - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(this.x2 - handleSize / 2, this.y2 - handleSize / 2, handleSize, handleSize);

    // For curved arrows, show control point
    if (this.arrowType === 'curved') {
      const controlPoint = this.getControlPoint();
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(
        controlPoint.x - handleSize / 2,
        controlPoint.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeRect(
        controlPoint.x - handleSize / 2,
        controlPoint.y - handleSize / 2,
        handleSize,
        handleSize
      );
      
      // Draw lines to control point
      ctx.strokeStyle = '#00ff00';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(controlPoint.x, controlPoint.y);
      ctx.lineTo(this.x2, this.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Store handles for interaction
    this.resizeHandles = [
      { x: this.x - handleSize / 2, y: this.y - handleSize / 2, type: 'start' },
      { x: this.x2 - handleSize / 2, y: this.y2 - handleSize / 2, type: 'end' }
    ];

    if (this.arrowType === 'curved') {
      const controlPoint = this.getControlPoint();
      this.resizeHandles.push({
        x: controlPoint.x - handleSize / 2,
        y: controlPoint.y - handleSize / 2,
        type: 'control'
      });
    }

    ctx.restore();
  }

  isPointInside(x, y, ctx) {
    // Check if point is near the arrow path
    const tolerance = Math.max(this.strokeWidth + 5, 10);
    
    if (this.arrowType === 'straight') {
      return this.distanceToLine(x, y, this.x, this.y, this.x2, this.y2) <= tolerance;
    } else {
      // For curved arrows, check distance to curve (simplified)
      const controlPoint = this.getControlPoint();
      const segments = 20;
      
      for (let i = 0; i < segments; i++) {
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        
        const x1 = this.quadraticBezier(this.x, controlPoint.x, this.x2, t1);
        const y1 = this.quadraticBezier(this.y, controlPoint.y, this.y2, t1);
        const x2 = this.quadraticBezier(this.x, controlPoint.x, this.x2, t2);
        const y2 = this.quadraticBezier(this.y, controlPoint.y, this.y2, t2);
        
        if (this.distanceToLine(x, y, x1, y1, x2, y2) <= tolerance) {
          return true;
        }
      }
      return false;
    }
  }

  quadraticBezier(p0, p1, p2, t) {
    return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
  }

  distanceToLine(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B);
    }
    
    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));
    
    const xx = x1 + param * C;
    const yy = y1 + param * D;
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
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

  update(options) {
    if (options.x !== undefined) this.x = options.x;
    if (options.y !== undefined) this.y = options.y;
    if (options.x2 !== undefined) this.x2 = options.x2;
    if (options.y2 !== undefined) this.y2 = options.y2;
    if (options.arrowType !== undefined) this.arrowType = options.arrowType;
    if (options.color !== undefined) this.color = options.color;
    if (options.opacity !== undefined) this.opacity = options.opacity;
    if (options.strokeWidth !== undefined) this.strokeWidth = options.strokeWidth;
    if (options.arrowheadSize !== undefined) this.arrowheadSize = options.arrowheadSize;
    if (options.curvature !== undefined) this.curvature = options.curvature;
    if (options.rotation !== undefined) this.rotation = options.rotation;
    if (options.layer !== undefined) this.layer = options.layer;
    
    this.updateBounds();
  }
}