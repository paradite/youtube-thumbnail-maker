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
    this.outlineWidth = options.outlineWidth || 0; // 0 means no outline
    this.outlineColor = options.outlineColor || '#ffffff';
    this.selected = false;
    this.id = Date.now() + Math.random();
    this.layer = options.layer || 0;
  }

  render(ctx) {
    ctx.save();
    ctx.font = `${this.weight} ${this.size}px ${this.font}`;
    ctx.fillStyle = this.color;
    ctx.textAlign = this.align;
    ctx.textBaseline = 'top';
    if (this.outlineWidth > 0) {
      ctx.lineWidth = this.outlineWidth;
      ctx.strokeStyle = this.outlineColor;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
    }

    if (this.rotation !== 0) {
      // Calculate the center point for rotation based on text alignment
      const metrics = ctx.measureText(this.text);
      const width = metrics.width;

      let centerX = this.x;
      if (this.align === 'center') {
        centerX = this.x;
      } else if (this.align === 'right') {
        centerX = this.x - width / 2;
      } else {
        // left
        centerX = this.x + width / 2;
      }

      const centerY = this.y + this.size / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate((this.rotation * Math.PI) / 180);

      // Reset text alignment to center for rotated text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (this.outlineWidth > 0) {
        ctx.strokeText(this.text, 0, 0);
      }
      ctx.fillText(this.text, 0, 0);
    } else {
      if (this.outlineWidth > 0) {
        ctx.strokeText(this.text, this.x, this.y);
      }
      ctx.fillText(this.text, this.x, this.y);
    }

    ctx.restore();

    if (this.selected) {
      this.renderSelection(ctx);
    }
  }

  renderSelection(ctx) {
    ctx.save();
    ctx.font = `${this.weight} ${this.size}px ${this.font}`;
    const metrics = ctx.measureText(this.text);
    const width = metrics.width;
    const height = this.size;
    ctx.restore();

    let startX = this.x;
    if (this.align === 'center') {
      startX = this.x - width / 2;
    } else if (this.align === 'right') {
      startX = this.x - width;
    }

    ctx.save();

    if (this.rotation !== 0) {
      // Use the same center calculation as in render method
      let centerX = this.x;
      if (this.align === 'center') {
        centerX = this.x;
      } else if (this.align === 'right') {
        centerX = this.x - width / 2;
      } else {
        // left
        centerX = this.x + width / 2;
      }

      const centerY = this.y + this.size / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate((this.rotation * Math.PI) / 180);

      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(-width / 2 - 5, -this.size / 2 - 5, width + 10, height + 10);
      ctx.setLineDash([]);

      this.renderResizeHandles(
        ctx,
        -width / 2 - 5,
        -this.size / 2 - 5,
        width + 10,
        height + 10
      );
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

    // Local handle positions (for drawing in transformed context)
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

    localHandles.push({ x: rotateHandleX, y: rotateHandleY, type: 'rotate' });

    // Store handles in global coordinates for hit testing
    if (this.rotation !== 0) {
      // For rotated elements, transform the local handle positions to global coordinates
      const metrics = ctx.measureText(this.text);
      const width = metrics.width;

      // Calculate the rotation center (same as in renderSelection)
      let centerX = this.x;
      if (this.align === 'center') {
        centerX = this.x;
      } else if (this.align === 'right') {
        centerX = this.x - width / 2;
      } else {
        // left
        centerX = this.x + width / 2;
      }
      const centerY = this.y + this.size / 2;

      // Transform handle positions from local transformed space to global space
      this.resizeHandles = localHandles.map((handle) => {
        // Handle center point in local transformed coordinates
        const localCenterX = handle.x + handleSize / 2;
        const localCenterY = handle.y + handleSize / 2;

        // Transform from local space to global space
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
      // For non-rotated elements, convert local coordinates to global coordinates
      this.resizeHandles = localHandles.map((handle) => ({
        x: handle.x,
        y: handle.y,
        type: handle.type,
      }));
    }
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
      return x >= startX && x <= startX + width && y >= this.y && y <= this.y + height;
    } else {
      // Compute the same rotation center used during render/renderSelection
      let centerX = this.x;
      if (this.align === 'center') {
        centerX = this.x;
      } else if (this.align === 'right') {
        centerX = this.x - width / 2;
      } else {
        // left
        centerX = this.x + width / 2;
      }
      const centerY = this.y + this.size / 2;

      const rotatedPoint = this.rotatePoint(x, y, centerX, centerY, -this.rotation);

      let rotatedStartX = this.x;
      if (this.align === 'center') {
        rotatedStartX = this.x - width / 2;
      } else if (this.align === 'right') {
        rotatedStartX = this.x - width;
      }

      return (
        rotatedPoint.x >= rotatedStartX &&
        rotatedPoint.x <= rotatedStartX + width &&
        rotatedPoint.y >= this.y &&
        rotatedPoint.y <= this.y + height
      );
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
    if (options.text !== undefined) this.text = options.text;
    if (options.font !== undefined) this.font = options.font;
    if (options.size !== undefined) this.size = options.size;
    if (options.color !== undefined) this.color = options.color;
    if (options.weight !== undefined) this.weight = options.weight;
    if (options.align !== undefined) this.align = options.align;
    if (options.rotation !== undefined) this.rotation = options.rotation;
    if (options.outlineWidth !== undefined) this.outlineWidth = options.outlineWidth;
    if (options.outlineColor !== undefined) this.outlineColor = options.outlineColor;
    if (options.layer !== undefined) this.layer = options.layer;
  }
}
