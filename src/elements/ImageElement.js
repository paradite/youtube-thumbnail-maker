export class ImageElement {
  constructor(x, y, image, options = {}) {
    this.x = x;
    this.y = y;
    this.image = image;
    // Prefer natural dimensions when available to support SVG and raster images reliably
    const natW = image.naturalWidth || image.width || 0;
    const natH = image.naturalHeight || image.height || 0;
    const fallbackW = natW || 300;
    const fallbackH = natH || 150;
    this.width = options.width || fallbackW;
    this.height = options.height || fallbackH;
    this.originalWidth = natW || fallbackW;
    this.originalHeight = natH || fallbackH;
    this.rotation = options.rotation || 0;
    this.selected = false;
    this.id = Date.now() + Math.random();
    this.layer = options.layer || 0;

    // Maintain aspect ratio by default
    this.aspectRatio = this.originalWidth / this.originalHeight;
    this.maintainAspectRatio = true;

    // Crop properties
    this.cropX = 0;
    this.cropY = 0;
    this.cropWidth = this.originalWidth;
    this.cropHeight = this.originalHeight;
    this.cropMode = false;

    // Image effects properties
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.brightness = options.brightness !== undefined ? options.brightness : 100;
    this.contrast = options.contrast !== undefined ? options.contrast : 100;
    this.saturation = options.saturation !== undefined ? options.saturation : 100;

    // Outline properties (0 width disables outline)
    this.outlineWidth = options.outlineWidth !== undefined ? options.outlineWidth : 0;
    this.outlineColor = options.outlineColor || '#ffffff';

    // Internal caches for outline rendering
    this._silhouetteCanvas = null;
    this._silhouetteKey = null;
    this._outlineCanvas = null;
    this._outlineKey = null;

  }

  render(ctx) {
    ctx.save();

    // First, optionally render outline behind the image
    if (this.outlineWidth > 0) {
      ctx.save();
      // Draw outline without image filters/opacity
      ctx.globalAlpha = 1.0;
      ctx.filter = 'none';

      if (this.rotation !== 0) {
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate((this.rotation * Math.PI) / 180);
        const outlineCanvas = this._getOutlineCanvas();
        // Outline canvas has padding of outlineWidth on all sides
        ctx.drawImage(
          outlineCanvas,
          -this.width / 2 - this.outlineWidth,
          -this.height / 2 - this.outlineWidth
        );
      } else {
        const outlineCanvas = this._getOutlineCanvas();
        ctx.drawImage(
          outlineCanvas,
          this.x - this.outlineWidth,
          this.y - this.outlineWidth
        );
      }
      ctx.restore();
    }

    // Now render the image itself with filters/opacity
    // Apply opacity
    ctx.globalAlpha = this.opacity;

    // Apply filters
    const filters = [];
    if (this.brightness !== 100) {
      filters.push(`brightness(${this.brightness}%)`);
    }
    if (this.contrast !== 100) {
      filters.push(`contrast(${this.contrast}%)`);
    }
    if (this.saturation !== 100) {
      filters.push(`saturate(${this.saturation}%)`);
    }

    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
    }

    if (this.rotation !== 0) {
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate((this.rotation * Math.PI) / 180);
      // Draw cropped image
      ctx.drawImage(
        this.image,
        this.cropX,
        this.cropY,
        this.cropWidth,
        this.cropHeight,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Draw cropped image
      ctx.drawImage(
        this.image,
        this.cropX,
        this.cropY,
        this.cropWidth,
        this.cropHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    ctx.restore();


    // Render standard selection handles unless in crop mode
    if (this.selected && !this.cropMode) {
      this.renderSelection(ctx);
    }

    // Render crop overlay if in crop mode
    if (this.cropMode && this.selected) {
      this.renderCropOverlay(ctx);
    }
  }

  renderSelection(ctx) {
    const width = this.width;
    const height = this.height;

    ctx.save();

    if (this.rotation !== 0) {
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate((this.rotation * Math.PI) / 180);

      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10);
      ctx.setLineDash([]);

      this.renderResizeHandles(
        ctx,
        -width / 2 - 5,
        -height / 2 - 5,
        width + 10,
        height + 10
      );
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

    // Local handle positions (for drawing in transformed context)
    const localHandles = [
      { x: x - handleSize / 2, y: y - handleSize / 2, type: 'nw' },
      { x: x + width - handleSize / 2, y: y - handleSize / 2, type: 'ne' },
      { x: x - handleSize / 2, y: y + height - handleSize / 2, type: 'sw' },
      {
        x: x + width - handleSize / 2,
        y: y + height - handleSize / 2,
        type: 'se',
      },
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
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

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

  isPointInside(x, y) {
    if (this.rotation === 0) {
      return (
        x >= this.x &&
        x <= this.x + this.width &&
        y >= this.y &&
        y <= this.y + this.height
      );
    } else {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      const rotatedPoint = this.rotatePoint(x, y, centerX, centerY, -this.rotation);

      return (
        rotatedPoint.x >= this.x &&
        rotatedPoint.x <= this.x + this.width &&
        rotatedPoint.y >= this.y &&
        rotatedPoint.y <= this.y + this.height
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

    // For both rotated and non-rotated elements, handles are now stored in global coordinates
    for (let handle of this.resizeHandles) {
      if (x >= handle.x && x <= handle.x + 8 && y >= handle.y && y <= handle.y + 8) {
        return handle.type;
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
      this._invalidateOutlineCaches();
    }
    if (options.height !== undefined) {
      this.height = options.height;
      if (this.maintainAspectRatio) {
        this.width = this.height * this.aspectRatio;
      }
      this._invalidateOutlineCaches();
    }
    if (options.rotation !== undefined) this.rotation = options.rotation;
    if (options.opacity !== undefined) this.opacity = options.opacity;
    if (options.brightness !== undefined) this.brightness = options.brightness;
    if (options.contrast !== undefined) this.contrast = options.contrast;
    if (options.saturation !== undefined) this.saturation = options.saturation;
    if (options.layer !== undefined) this.layer = options.layer;
    if (options.outlineWidth !== undefined) {
      this.outlineWidth = Math.max(0, options.outlineWidth);
      this._invalidateOutlineCaches();
    }
    if (options.outlineColor !== undefined) {
      this.outlineColor = options.outlineColor;
      this._invalidateOutlineCaches();
    }
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

  // Set crop area
  setCropArea(x, y, width, height) {
    this.cropX = Math.max(0, Math.min(x, this.originalWidth - 1));
    this.cropY = Math.max(0, Math.min(y, this.originalHeight - 1));
    this.cropWidth = Math.max(1, Math.min(width, this.originalWidth - this.cropX));
    this.cropHeight = Math.max(1, Math.min(height, this.originalHeight - this.cropY));

    // Update aspect ratio based on crop
    this.aspectRatio = this.cropWidth / this.cropHeight;

    // Adjust display dimensions to maintain aspect ratio
    if (this.maintainAspectRatio) {
      this.height = this.width / this.aspectRatio;
    }

    this._invalidateOutlineCaches();
  }

  // Reset crop to show full image
  resetCrop() {
    this.cropX = 0;
    this.cropY = 0;
    this.cropWidth = this.originalWidth;
    this.cropHeight = this.originalHeight;
    this.aspectRatio = this.originalWidth / this.originalHeight;
    this._invalidateOutlineCaches();
  }

  // Render crop overlay to show the crop area on original image
  renderCropOverlay(ctx) {
    if (this.rotation !== 0) return; // Skip crop overlay for rotated images for simplicity

    // Calculate the scale between displayed size and original size
    const scaleX = this.width / this.cropWidth;
    const scaleY = this.height / this.cropHeight;

    // Draw semi-transparent overlay for the entire original image bounds
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000000';

    // Calculate original image bounds in display coordinates
    const originalDisplayWidth = this.originalWidth * scaleX;
    const originalDisplayHeight = this.originalHeight * scaleY;
    const cropDisplayX = this.cropX * scaleX;
    const cropDisplayY = this.cropY * scaleY;

    // Adjust position to show where the full original image would be
    const offsetX = this.x - cropDisplayX;
    const offsetY = this.y - cropDisplayY;

    // Fill areas outside the crop
    // Top
    if (cropDisplayY > 0) {
      ctx.fillRect(offsetX, offsetY, originalDisplayWidth, cropDisplayY);
    }
    // Bottom
    if (cropDisplayY + this.height < originalDisplayHeight) {
      ctx.fillRect(
        offsetX,
        this.y + this.height,
        originalDisplayWidth,
        originalDisplayHeight - (cropDisplayY + this.height)
      );
    }
    // Left
    if (cropDisplayX > 0) {
      ctx.fillRect(offsetX, this.y, cropDisplayX, this.height);
    }
    // Right
    if (cropDisplayX + this.width < originalDisplayWidth) {
      ctx.fillRect(
        this.x + this.width,
        this.y,
        originalDisplayWidth - (cropDisplayX + this.width),
        this.height
      );
    }

    ctx.restore();

    // Draw crop boundary
    ctx.save();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.setLineDash([]);
    ctx.restore();

    // Draw crop handles and record their hit areas for interaction
    this.renderCropHandles(ctx);
  }

  renderCropHandles(ctx) {
    const handleSize = 8;
    const half = handleSize / 2;
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;

    const handles = [
      { x: x - half, y: y - half, type: 'nw' },
      { x: x + w / 2 - half, y: y - half, type: 'n' },
      { x: x + w - half, y: y - half, type: 'ne' },
      { x: x - half, y: y + h / 2 - half, type: 'w' },
      { x: x + w - half, y: y + h / 2 - half, type: 'e' },
      { x: x - half, y: y + h - half, type: 'sw' },
      { x: x + w / 2 - half, y: y + h - half, type: 's' },
      { x: x + w - half, y: y + h - half, type: 'se' },
    ];

    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    handles.forEach((h) => {
      ctx.fillRect(h.x, h.y, handleSize, handleSize);
      ctx.strokeRect(h.x, h.y, handleSize, handleSize);
    });
    ctx.restore();

    // Store for hit testing during crop mode (non-rotated only)
    this._cropHandles = handles.map((h) => ({ x: h.x, y: h.y, type: h.type, size: handleSize }));
  }

  // Return handle type if point hits a crop handle; otherwise null
  isPointInCropHandle(x, y) {
    if (!this.cropMode || this.rotation !== 0 || !this._cropHandles) return null;
    for (const h of this._cropHandles) {
      if (x >= h.x && x <= h.x + h.size && y >= h.y && y <= h.y + h.size) {
        return h.type;
      }
    }
    return null;
  }

  _invalidateOutlineCaches() {
    this._silhouetteCanvas = null;
    this._silhouetteKey = null;
    this._outlineCanvas = null;
    this._outlineKey = null;
  }

  _getSilhouetteCanvas() {
    // Build a tinted silhouette of the current displayed image (cropped & scaled)
    const w = Math.max(1, Math.round(this.width));
    const h = Math.max(1, Math.round(this.height));
    const key = [w, h, this.cropX, this.cropY, this.cropWidth, this.cropHeight, this.outlineColor].join(':');

    if (this._silhouetteCanvas && this._silhouetteKey === key) {
      return this._silhouetteCanvas;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Draw the cropped, scaled image
    ctx.drawImage(
      this.image,
      this.cropX,
      this.cropY,
      this.cropWidth,
      this.cropHeight,
      0,
      0,
      w,
      h
    );

    // Colorize to a solid silhouette using source-in
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = this.outlineColor;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    this._silhouetteCanvas = canvas;
    this._silhouetteKey = key;
    return canvas;
  }

  _getOutlineCanvas() {
    const radius = Math.max(0, Math.round(this.outlineWidth));
    if (radius === 0) {
      // No outline
      return this._getSilhouetteCanvas();
    }

    const w = Math.max(1, Math.round(this.width));
    const h = Math.max(1, Math.round(this.height));
    const key = [w, h, this.cropX, this.cropY, this.cropWidth, this.cropHeight, this.outlineColor, radius].join(':');

    if (this._outlineCanvas && this._outlineKey === key) {
      return this._outlineCanvas;
    }

    const silhouette = this._getSilhouetteCanvas();
    const outCanvas = document.createElement('canvas');
    outCanvas.width = w + 2 * radius;
    outCanvas.height = h + 2 * radius;
    const outCtx = outCanvas.getContext('2d');

    // Draw multiple offset silhouettes within a circle of "radius" to form the outline
    // Use putImageData or drawImage; drawImage is GPU-accelerated where available.
    for (let dy = -radius; dy <= radius; dy++) {
      const maxDx = Math.floor(Math.sqrt(radius * radius - dy * dy));
      for (let dx = -maxDx; dx <= maxDx; dx++) {
        outCtx.drawImage(silhouette, radius + dx, radius + dy);
      }
    }

    // Cut out the original silhouette to make a ring
    outCtx.globalCompositeOperation = 'destination-out';
    outCtx.drawImage(silhouette, radius, radius);
    outCtx.globalCompositeOperation = 'source-over';

    this._outlineCanvas = outCanvas;
    this._outlineKey = key;
    return outCanvas;
  }
}
