import { TextElement } from '../elements/TextElement.js';
import { ImageElement } from '../elements/ImageElement.js';
import { ShapeElement } from '../elements/ShapeElement.js';
import { ArrowElement } from '../elements/ArrowElement.js';
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
    // Crop interaction state
    this.isCropping = false;
    this.cropHandle = null;
    this.cropInitial = null;
    this.onSelectionChange = null;
    this.onCropChange = null;
    this.nextLayer = 1;

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

    // If currently in image crop mode on the selected element, prioritize crop interactions
    const prevSelected = this.selectedElement;
    if (
      prevSelected &&
      prevSelected.image &&
      prevSelected.cropMode &&
      prevSelected.rotation === 0
    ) {
      const cropHandle = prevSelected.isPointInCropHandle
        ? prevSelected.isPointInCropHandle(x, y)
        : null;
      if (cropHandle) {
        // Start crop resize interaction
        this.isCropping = true;
        this.cropHandle = cropHandle;
        this.initialMousePos = { x, y };
        // Compute safe fixed scale at drag start
        const _sx = prevSelected.cropWidth
          ? prevSelected.width / Math.max(1, prevSelected.cropWidth)
          : prevSelected.width;
        const _sy = prevSelected.cropHeight
          ? prevSelected.height / Math.max(1, prevSelected.cropHeight)
          : prevSelected.height;
        const _safeScaleX = Number.isFinite(_sx) && _sx > 0 ? _sx : 1;
        const _safeScaleY = Number.isFinite(_sy) && _sy > 0 ? _sy : 1;

        this.cropInitial = {
          x: prevSelected.cropX,
          y: prevSelected.cropY,
          w: prevSelected.cropWidth,
          h: prevSelected.cropHeight,
          // Capture display rect to anchor opposite edges
          dispX: prevSelected.x,
          dispY: prevSelected.y,
          dispW: prevSelected.width,
          dispH: prevSelected.height,
          scaleX: _safeScaleX,
          scaleY: _safeScaleY,
        };
        return; // Do not alter selection/dragging state
      }
      // Inside the displayed crop area -> move/pan crop window instead of moving element
      if (prevSelected.isPointInside && prevSelected.isPointInside(x, y, this.ctx)) {
        this.isCropping = true;
        this.cropHandle = 'move';
        this.initialMousePos = { x, y };
        // Compute safe fixed scale at drag start
        const _sx2 = prevSelected.cropWidth
          ? prevSelected.width / Math.max(1, prevSelected.cropWidth)
          : prevSelected.width;
        const _sy2 = prevSelected.cropHeight
          ? prevSelected.height / Math.max(1, prevSelected.cropHeight)
          : prevSelected.height;
        const _safeScaleX2 = Number.isFinite(_sx2) && _sx2 > 0 ? _sx2 : 1;
        const _safeScaleY2 = Number.isFinite(_sy2) && _sy2 > 0 ? _sy2 : 1;

        this.cropInitial = {
          x: prevSelected.cropX,
          y: prevSelected.cropY,
          w: prevSelected.cropWidth,
          h: prevSelected.cropHeight,
          dispX: prevSelected.x,
          dispY: prevSelected.y,
          dispW: prevSelected.width,
          dispH: prevSelected.height,
          scaleX: _safeScaleX2,
          scaleY: _safeScaleY2,
        };
        return; // Prevent normal drag of element while cropping
      }
    }

    this.selectedElement = null;
    this.isResizing = false;
    this.resizeHandle = null;
    this.isRotating = false;

    // Sort elements by layer in reverse order for hit testing (top layers first)
    const sortedElements = [...this.elements].sort((a, b) => b.layer - a.layer);
    for (let i = 0; i < sortedElements.length; i++) {
      const element = sortedElements[i];

      if (element.selected && element.isPointInResizeHandle) {
        const handleType = element.isPointInResizeHandle(x, y);
        if (handleType) {
          this.selectedElement = element;
          if (handleType === 'rotate') {
            this.isRotating = true;
            this.initialRotation = element.rotation;

            // Different rotation center for text vs image vs shape vs arrow
            if (element.text !== undefined) {
              this.rotationCenter = {
                x: element.x,
                y: element.y + element.size / 2,
              };
            } else if (element.image || element.shapeType !== undefined) {
              this.rotationCenter = {
                x: element.x + element.width / 2,
                y: element.y + element.height / 2,
              };
            } else if (element.arrowType !== undefined) {
              this.rotationCenter = {
                x: (element.x + element.x2) / 2,
                y: (element.y + element.y2) / 2,
              };
            }
            this.initialMousePos = { x, y };
          } else {
            this.isResizing = true;
            this.resizeHandle = handleType;

            // Store initial size for text, image, shape and arrow elements
            if (element.text !== undefined) {
              this.initialSize = element.size;
            } else if (element.image || element.shapeType !== undefined) {
              this.initialWidth = element.width;
              this.initialHeight = element.height;
            } else if (element.arrowType !== undefined) {
              this.initialArrowStart = { x: element.x, y: element.y };
              this.initialArrowEnd = { x: element.x2, y: element.y2 };
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

    this.elements.forEach((element) => {
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

    // Active cropping interaction
    if (
      this.isCropping &&
      this.selectedElement &&
      this.selectedElement.image &&
      this.selectedElement.cropMode &&
      this.selectedElement.rotation === 0
    ) {
      const el = this.selectedElement;
      const deltaX = x - this.initialMousePos.x;
      const deltaY = y - this.initialMousePos.y;

      // Constants captured at drag start
      const ci = this.cropInitial;
      let scaleX = ci.scaleX;
      let scaleY = ci.scaleY;
      if (!Number.isFinite(scaleX) || scaleX <= 0) {
        const sxNow = el.width / Math.max(1, el.cropWidth || 1);
        scaleX = Number.isFinite(sxNow) && sxNow > 0 ? sxNow : 1;
      }
      if (!Number.isFinite(scaleY) || scaleY <= 0) {
        const syNow = el.height / Math.max(1, el.cropHeight || 1);
        scaleY = Number.isFinite(syNow) && syNow > 0 ? syNow : 1;
      }
      const origW = el.originalWidth;
      const origH = el.originalHeight;

      const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

      // Prepare new display rect starting from initial
      let dispX = ci.dispX;
      let dispY = ci.dispY;
      let dispW = ci.dispW;
      let dispH = ci.dispH;

      // Prepare new crop area starting from initial
      let cropX = ci.x;
      let cropY = ci.y;
      let cropW = ci.w;
      let cropH = ci.h;

      // Helpers for anchoring
      const right0 = ci.dispX + ci.dispW;
      const bottom0 = ci.dispY + ci.dispH;

      switch (this.cropHandle) {
        case 'move': {
          cropX = clamp(ci.x + deltaX / scaleX, 0, origW - ci.w);
          cropY = clamp(ci.y + deltaY / scaleY, 0, origH - ci.h);
          break;
        }
        case 'e': {
          dispW = Math.max(1, ci.dispW + deltaX);
          cropW = dispW / scaleX;
          cropW = clamp(cropW, 1, origW - ci.x);
          dispW = cropW * scaleX;
          dispX = ci.dispX;
          cropX = ci.x;
          break;
        }
        case 's': {
          dispH = Math.max(1, ci.dispH + deltaY);
          cropH = dispH / scaleY;
          cropH = clamp(cropH, 1, origH - ci.y);
          dispH = cropH * scaleY;
          dispY = ci.dispY;
          cropY = ci.y;
          break;
        }
        case 'w': {
          dispW = Math.max(1, ci.dispW - deltaX);
          cropW = dispW / scaleX;
          cropW = clamp(cropW, 1, ci.x + ci.w);
          dispW = cropW * scaleX;
          dispX = right0 - dispW;
          cropX = ci.x + ci.w - cropW;
          cropX = clamp(cropX, 0, origW - 1);
          break;
        }
        case 'n': {
          dispH = Math.max(1, ci.dispH - deltaY);
          cropH = dispH / scaleY;
          cropH = clamp(cropH, 1, ci.y + ci.h);
          dispH = cropH * scaleY;
          dispY = bottom0 - dispH;
          cropY = ci.y + ci.h - cropH;
          cropY = clamp(cropY, 0, origH - 1);
          break;
        }
        case 'ne': {
          dispW = Math.max(1, ci.dispW + deltaX);
          cropW = dispW / scaleX;
          cropW = clamp(cropW, 1, origW - ci.x);
          dispW = cropW * scaleX;
          dispX = ci.dispX;
          cropX = ci.x;

          dispH = Math.max(1, ci.dispH - deltaY);
          cropH = dispH / scaleY;
          cropH = clamp(cropH, 1, ci.y + ci.h);
          dispH = cropH * scaleY;
          dispY = bottom0 - dispH;
          cropY = ci.y + ci.h - cropH;
          cropY = clamp(cropY, 0, origH - 1);
          break;
        }
        case 'nw': {
          dispW = Math.max(1, ci.dispW - deltaX);
          cropW = dispW / scaleX;
          cropW = clamp(cropW, 1, ci.x + ci.w);
          dispW = cropW * scaleX;
          dispX = right0 - dispW;
          cropX = ci.x + ci.w - cropW;
          cropX = clamp(cropX, 0, origW - 1);

          dispH = Math.max(1, ci.dispH - deltaY);
          cropH = dispH / scaleY;
          cropH = clamp(cropH, 1, ci.y + ci.h);
          dispH = cropH * scaleY;
          dispY = bottom0 - dispH;
          cropY = ci.y + ci.h - cropH;
          cropY = clamp(cropY, 0, origH - 1);
          break;
        }
        case 'se': {
          dispW = Math.max(1, ci.dispW + deltaX);
          cropW = dispW / scaleX;
          cropW = clamp(cropW, 1, origW - ci.x);
          dispW = cropW * scaleX;
          dispX = ci.dispX;
          cropX = ci.x;

          dispH = Math.max(1, ci.dispH + deltaY);
          cropH = dispH / scaleY;
          cropH = clamp(cropH, 1, origH - ci.y);
          dispH = cropH * scaleY;
          dispY = ci.dispY;
          cropY = ci.y;
          break;
        }
        case 'sw': {
          dispW = Math.max(1, ci.dispW - deltaX);
          cropW = dispW / scaleX;
          cropW = clamp(cropW, 1, ci.x + ci.w);
          dispW = cropW * scaleX;
          dispX = right0 - dispW;
          cropX = ci.x + ci.w - cropW;
          cropX = clamp(cropX, 0, origW - 1);

          dispH = Math.max(1, ci.dispH + deltaY);
          cropH = dispH / scaleY;
          cropH = clamp(cropH, 1, origH - ci.y);
          dispH = cropH * scaleY;
          dispY = ci.dispY;
          cropY = ci.y;
          break;
        }
      }

      // Commit display rect and crop area keeping scale constant
      el.x = Math.round(dispX);
      el.y = Math.round(dispY);
      el.width = dispW;
      el.height = dispH;

      el.setCropArea(Math.round(cropX), Math.round(cropY), Math.round(cropW), Math.round(cropH));
      this.redrawCanvas();
      if (this.onCropChange) this.onCropChange(el);
      return;
    }
    if (this.isRotating && this.selectedElement) {
      this.canvas.style.cursor = 'grab';
      const centerX = this.rotationCenter.x;
      const centerY = this.rotationCenter.y;

      const initialAngle = Math.atan2(
        this.initialMousePos.y - centerY,
        this.initialMousePos.x - centerX
      );
      const currentAngle = Math.atan2(y - centerY, x - centerX);

      const deltaAngle = ((currentAngle - initialAngle) * 180) / Math.PI;
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
      } else if (
        this.selectedElement.image ||
        this.selectedElement.shapeType !== undefined
      ) {
        // Image and shape element resizing
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const scaleFactor =
          deltaX > 0 || deltaY > 0 ? 1 + distance / 200 : 1 - distance / 200;

        const newWidth = Math.max(20, this.initialWidth * scaleFactor);
        const newHeight = Math.max(20, this.initialHeight * scaleFactor);

        this.selectedElement.width = Math.round(newWidth);
        this.selectedElement.height = Math.round(newHeight);
      } else if (this.selectedElement.arrowType !== undefined) {
        // Arrow element resizing/moving handles
        if (this.resizeHandle === 'start') {
          this.selectedElement.x = x;
          this.selectedElement.y = y;
        } else if (this.resizeHandle === 'end') {
          this.selectedElement.x2 = x;
          this.selectedElement.y2 = y;
        } else if (
          this.resizeHandle === 'control' &&
          this.selectedElement.arrowType === 'curved'
        ) {
          // Adjust curvature based on control point movement
          const midX = (this.selectedElement.x + this.selectedElement.x2) / 2;
          const midY = (this.selectedElement.y + this.selectedElement.y2) / 2;
          const distance = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
          const arrowLength = Math.sqrt(
            (this.selectedElement.x2 - this.selectedElement.x) ** 2 +
              (this.selectedElement.y2 - this.selectedElement.y) ** 2
          );
          // Calculate signed distance based on which side of the line the control point is on
          const dx = this.selectedElement.x2 - this.selectedElement.x;
          const dy = this.selectedElement.y2 - this.selectedElement.y;
          const crossProduct =
            (x - this.selectedElement.x) * dy - (y - this.selectedElement.y) * dx;
          const signedDistance = crossProduct >= 0 ? distance : -distance;
          this.selectedElement.curvature = Math.max(
            -1,
            Math.min(1, signedDistance / arrowLength)
          );
        }
        this.selectedElement.updateBounds();
      }

      this.redrawCanvas();
    } else if (this.isDragging && this.selectedElement) {
      this.canvas.style.cursor = 'move';
      if (this.selectedElement.arrowType !== undefined) {
        // For arrows, move both start and end points
        const deltaX = x - this.dragOffset.x - this.selectedElement.x;
        const deltaY = y - this.dragOffset.y - this.selectedElement.y;
        this.selectedElement.x = x - this.dragOffset.x;
        this.selectedElement.y = y - this.dragOffset.y;
        this.selectedElement.x2 += deltaX;
        this.selectedElement.y2 += deltaY;
        this.selectedElement.updateBounds();
      } else {
        this.selectedElement.x = x - this.dragOffset.x;
        this.selectedElement.y = y - this.dragOffset.y;
      }
      this.redrawCanvas();
    } else {
      this.updateCursor(x, y);
    }
  }

  updateCursor(x, y) {
    let cursor = 'default';

    // Crop mode cursor updates for selected image elements
    if (
      this.selectedElement &&
      this.selectedElement.image &&
      this.selectedElement.cropMode &&
      this.selectedElement.rotation === 0
    ) {
      const el = this.selectedElement;
      let handle = el.isPointInCropHandle ? el.isPointInCropHandle(x, y) : null;
      if (handle) {
        // Map handle to appropriate cursor
        const map = {
          n: 'ns-resize',
          s: 'ns-resize',
          e: 'ew-resize',
          w: 'ew-resize',
          ne: 'nesw-resize',
          sw: 'nesw-resize',
          nw: 'nwse-resize',
          se: 'nwse-resize',
        };
        cursor = map[handle] || 'crosshair';
      } else if (el.isPointInside && el.isPointInside(x, y, this.ctx)) {
        cursor = 'move';
      }
      this.canvas.style.cursor = cursor;
      return;
    }

    // Sort elements by layer in reverse order for hit testing (top layers first)
    const sortedElements = [...this.elements].sort((a, b) => b.layer - a.layer);
    for (let i = 0; i < sortedElements.length; i++) {
      const element = sortedElements[i];

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
    if (this.isDragging || this.isResizing || this.isRotating || this.isCropping) {
      this.saveToLocalStorage();
    }
    this.isDragging = false;
    this.isResizing = false;
    this.isRotating = false;
    this.isCropping = false;
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
    this.backgroundRenderer.render(
      this.currentBackgroundPattern,
      this.currentBackgroundColor
    );
  }

  redraw() {
    // Sort elements by layer for proper rendering order
    const sortedElements = [...this.elements].sort((a, b) => a.layer - b.layer);
    sortedElements.forEach((element) => {
      element.render(this.ctx);
    });
  }

  redrawCanvas() {
    this.renderBackground();
    this.redraw();
  }

  addTextElement(text = 'Sample Text', x = 100, y = 100) {
    const textElement = new TextElement(x, y, text, { layer: this.nextLayer++ });
    this.elements.push(textElement);
    this.selectedElement = textElement;
    textElement.selected = true;

    this.elements.forEach((element) => {
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

  addImageElement(image, x = 100, y = 100, options = {}) {
    // Scale image to fit within reasonable bounds while maintaining aspect ratio
    const maxWidth = this.canvas.width * 0.4; // Max 40% of canvas width
    const maxHeight = this.canvas.height * 0.4; // Max 40% of canvas height

    // Prefer natural dimensions for reliability (SVG/raster)
    let width = options.width || image.naturalWidth || image.width || 300;
    let height = options.height || image.naturalHeight || image.height || 150;

    // Scale down if image is too large
    if (width > maxWidth || height > maxHeight) {
      const scale = Math.min(maxWidth / width, maxHeight / height);
      width *= scale;
      height *= scale;
    }

    const imageElement = new ImageElement(x, y, image, {
      width,
      height,
      layer: this.nextLayer++,
    });
    this.elements.push(imageElement);
    this.selectedElement = imageElement;
    imageElement.selected = true;

    this.elements.forEach((element) => {
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

  addShapeElement(shapeType = 'rectangle', x = 100, y = 100) {
    // Set shape color based on current background to create subtle contrast
    const shapeColor = this.currentBackgroundColor === '#ffffff' ? '#f0f0f0' : '#ffffff';

    const shapeElement = new ShapeElement(x, y, shapeType, {
      width: 100,
      height: 100,
      color: shapeColor,
      opacity: 0.3,
      layer: this.nextLayer++,
    });

    this.elements.push(shapeElement);
    this.selectedElement = shapeElement;
    shapeElement.selected = true;

    this.elements.forEach((element) => {
      if (element !== shapeElement) {
        element.selected = false;
      }
    });

    if (this.onSelectionChange) {
      this.onSelectionChange(shapeElement);
    }

    this.redrawCanvas();
    this.saveToLocalStorage();
    return shapeElement;
  }

  addArrowElement(arrowType = 'straight', x = 100, y = 100) {
    const arrowColor = this.currentBackgroundColor === '#ffffff' ? '#000000' : '#ffffff';

    const arrowElement = new ArrowElement(x, y, {
      arrowType: arrowType,
      color: arrowColor,
      opacity: 1.0,
      strokeWidth: 3,
      arrowheadSize: 15,
      curvature: arrowType === 'curved' ? 0.3 : 0.0,
      layer: this.nextLayer++,
    });

    this.elements.push(arrowElement);
    this.selectedElement = arrowElement;
    arrowElement.selected = true;

    this.elements.forEach((element) => {
      if (element !== arrowElement) {
        element.selected = false;
      }
    });

    if (this.onSelectionChange) {
      this.onSelectionChange(arrowElement);
    }

    this.redrawCanvas();
    this.saveToLocalStorage();
    return arrowElement;
  }

  updateSelectedElement(options) {
    if (this.selectedElement && this.selectedElement.update) {
      this.selectedElement.update(options);
      this.redrawCanvas();
      this.saveToLocalStorage();

      // Update UI controls when specific properties change
      if (
        this.onSelectionChange &&
        (options.size !== undefined || options.rotation !== undefined)
      ) {
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

  duplicateSelectedTextElement() {
    if (this.selectedElement && this.selectedElement.text !== undefined) {
      // Create a deep clone of the selected text element
      const originalElement = this.selectedElement;

      // Calculate offset position (place new text to the right of current text)
      const offsetX = 100; // Horizontal offset
      const offsetY = 20; // Slight vertical offset

      // Create new text element with all the same properties
      const duplicatedElement = new TextElement(
        originalElement.x + offsetX,
        originalElement.y + offsetY,
        originalElement.text,
        {
          font: originalElement.font,
          size: originalElement.size,
          color: originalElement.color,
          weight: originalElement.weight,
          align: originalElement.align,
          rotation: originalElement.rotation,
          outlineWidth: originalElement.outlineWidth,
          outlineColor: originalElement.outlineColor,
        }
      );

      // Add the duplicated element to the canvas
      this.elements.push(duplicatedElement);

      // Deselect the original element
      originalElement.selected = false;

      // Select the new duplicated element
      this.selectedElement = duplicatedElement;
      duplicatedElement.selected = true;

      // Trigger selection change callback to update UI controls
      if (this.onSelectionChange) {
        this.onSelectionChange(duplicatedElement);
      }

      this.redrawCanvas();
      this.saveToLocalStorage();
      return duplicatedElement;
    }
    return null;
  }

  duplicateSelectedElement() {
    if (!this.selectedElement) {
      return null;
    }

    const originalElement = this.selectedElement;
    let duplicatedElement = null;

    // Calculate consistent offset positioning for all element types
    const offsetX = 50; // Horizontal offset
    const offsetY = 30; // Vertical offset

    // Calculate new position with canvas boundary checks
    const newX = Math.min(originalElement.x + offsetX, this.canvas.width - 100);
    const newY = Math.min(originalElement.y + offsetY, this.canvas.height - 100);

    // Handle different element types
    if (originalElement.text !== undefined) {
      // Text Element
      duplicatedElement = new TextElement(newX, newY, originalElement.text, {
        font: originalElement.font,
        size: originalElement.size,
        color: originalElement.color,
        weight: originalElement.weight,
        align: originalElement.align,
        rotation: originalElement.rotation,
        outlineWidth: originalElement.outlineWidth,
        outlineColor: originalElement.outlineColor,
        layer: this.nextLayer++,
      });
    } else if (originalElement.image) {
      // Image Element
      duplicatedElement = new ImageElement(newX, newY, originalElement.image, {
        width: originalElement.width,
        height: originalElement.height,
        rotation: originalElement.rotation,
        opacity: originalElement.opacity,
        brightness: originalElement.brightness,
        contrast: originalElement.contrast,
        saturation: originalElement.saturation,
        outlineWidth: originalElement.outlineWidth,
        outlineColor: originalElement.outlineColor,
        layer: this.nextLayer++,
      });

      // Copy crop settings if they exist
      if (originalElement.cropX !== undefined) {
        duplicatedElement.setCropArea(
          originalElement.cropX,
          originalElement.cropY,
          originalElement.cropWidth,
          originalElement.cropHeight
        );
      }
    } else if (originalElement.shapeType !== undefined) {
      // Shape Element
      duplicatedElement = new ShapeElement(newX, newY, originalElement.shapeType, {
        width: originalElement.width,
        height: originalElement.height,
        color: originalElement.color,
        opacity: originalElement.opacity,
        strokeWidth: originalElement.strokeWidth,
        strokeColor: originalElement.strokeColor,
        rotation: originalElement.rotation,
        layer: this.nextLayer++,
      });
    } else if (originalElement.arrowType !== undefined) {
      // Arrow Element
      const deltaX = originalElement.x2 - originalElement.x;
      const deltaY = originalElement.y2 - originalElement.y;

      duplicatedElement = new ArrowElement(newX, newY, {
        arrowType: originalElement.arrowType,
        color: originalElement.color,
        opacity: originalElement.opacity,
        strokeWidth: originalElement.strokeWidth,
        arrowheadSize: originalElement.arrowheadSize,
        curvature: originalElement.curvature,
        rotation: originalElement.rotation,
        layer: this.nextLayer++,
      });

      // Set the end point to maintain the same arrow direction and length
      duplicatedElement.x2 = newX + deltaX;
      duplicatedElement.y2 = newY + deltaY;
      duplicatedElement.updateBounds();
    }

    if (duplicatedElement) {
      // Add the duplicated element to the canvas
      this.elements.push(duplicatedElement);

      // Deselect the original element
      originalElement.selected = false;

      // Select the new duplicated element
      this.selectedElement = duplicatedElement;
      duplicatedElement.selected = true;

      // Trigger selection change callback to update UI controls
      if (this.onSelectionChange) {
        this.onSelectionChange(duplicatedElement);
      }

      this.redrawCanvas();
      this.saveToLocalStorage();
      return duplicatedElement;
    }

    return null;
  }

  cycleToNextElement() {
    if (this.elements.length === 0) {
      return false;
    }

    let nextIndex = 0;

    // If there's a currently selected element, find the next one
    if (this.selectedElement) {
      const currentIndex = this.elements.indexOf(this.selectedElement);
      if (currentIndex !== -1) {
        nextIndex = (currentIndex + 1) % this.elements.length;
      }
    }

    // Deselect all elements
    this.elements.forEach((element) => {
      element.selected = false;
    });

    // Select the next element
    const nextElement = this.elements[nextIndex];
    nextElement.selected = true;
    this.selectedElement = nextElement;

    // Center the element in viewport if it's off-screen
    this.centerElementInViewport(nextElement);

    // Notify UI of selection change
    if (this.onSelectionChange) {
      this.onSelectionChange(nextElement);
    }

    this.redrawCanvas();
    return true;
  }

  centerElementInViewport(element) {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // Calculate element bounds
    let elementLeft, elementTop, elementRight, elementBottom;

    if (element.text !== undefined) {
      // Text element
      this.ctx.save();
      this.ctx.font = `${element.weight} ${element.size}px ${element.font}`;
      const metrics = this.ctx.measureText(element.text);
      const width = metrics.width;
      const height = element.size;
      this.ctx.restore();

      elementLeft = element.x;
      elementTop = element.y;
      elementRight = element.x + width;
      elementBottom = element.y + height;
    } else if (element.image) {
      // Image element
      elementLeft = element.x;
      elementTop = element.y;
      elementRight = element.x + element.width;
      elementBottom = element.y + element.height;
    } else if (element.shapeType !== undefined) {
      // Shape element
      elementLeft = element.x;
      elementTop = element.y;
      elementRight = element.x + element.width;
      elementBottom = element.y + element.height;
    } else if (element.arrowType !== undefined) {
      // Arrow element
      elementLeft = Math.min(element.x, element.x2);
      elementTop = Math.min(element.y, element.y2);
      elementRight = Math.max(element.x, element.x2);
      elementBottom = Math.max(element.y, element.y2);
    } else {
      return; // Unknown element type
    }

    // Check if element is off-screen or partially off-screen
    const isOffScreen =
      elementRight < 0 ||
      elementLeft > canvasWidth ||
      elementBottom < 0 ||
      elementTop > canvasHeight;

    const isPartiallyOffScreen =
      elementLeft < 0 ||
      elementRight > canvasWidth ||
      elementTop < 0 ||
      elementBottom > canvasHeight;

    // If element is completely or partially off-screen, center it
    if (isOffScreen || isPartiallyOffScreen) {
      const elementWidth = elementRight - elementLeft;
      const elementHeight = elementBottom - elementTop;

      // Calculate new position to center the element
      const newX = (canvasWidth - elementWidth) / 2;
      const newY = (canvasHeight - elementHeight) / 2;

      element.x = Math.max(0, newX);
      element.y = Math.max(0, newY);

      // Save the change
      this.saveToLocalStorage();
    }
  }

  exportAsImage(format = 'image/jpeg', quality = 0.9) {
    return this.canvas.toDataURL(format, quality);
  }

  exportProject() {
    const projectData = {
      elements: this.elements.map((element) => {
        const serialized = { ...element };
        delete serialized.selected;

        if (element.text !== undefined) {
          serialized.type = 'text';
        } else if (element.image) {
          serialized.type = 'image';
          // Convert image to data URL for export
          try {
            const canvas = document.createElement('canvas');
            canvas.width = element.originalWidth;
            canvas.height = element.originalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(element.image, 0, 0);
            serialized.imageData = canvas.toDataURL();
          } catch (err) {
            // If canvas is tainted (e.g., SVG with external refs), fallback to original source
            console.warn('Falling back to original image src for export:', err);
            serialized.imageData = element.image.src;
          }
          delete serialized.image; // Remove the actual image object
        } else if (element.shapeType !== undefined) {
          serialized.type = 'shape';
        } else if (element.arrowType !== undefined) {
          serialized.type = 'arrow';
          console.log('Saving arrow:', serialized);
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
        canvasHeight: this.canvas.height,
      },
    };

    return JSON.stringify(projectData, null, 2);
  }

  async importProject(jsonData) {
    try {
      const projectData = JSON.parse(jsonData);

      // Validate project data structure
      if (
        !projectData.version ||
        !projectData.elements ||
        !Array.isArray(projectData.elements)
      ) {
        throw new Error('Invalid project file format');
      }

      // Clear current elements
      this.elements = [];
      this.selectedElement = null;

      // Load elements
      const loadPromises = projectData.elements.map((elementData) => {
        return new Promise((resolve) => {
          if (elementData.type === 'text') {
            const { type, ...elementProps } = elementData;
            const textElement = Object.assign(new TextElement(0, 0, ''), elementProps);
            if (elementProps.rotation === undefined) {
              textElement.rotation = 0;
            }
            if (elementProps.layer === undefined) {
              textElement.layer = 0;
            }
            this.elements.push(textElement);
            resolve();
          } else if (elementData.type === 'image' && elementData.imageData) {
            const img = new Image();
            img.onload = () => {
              const { type, imageData, ...elementProps } = elementData;
              const imageElement = Object.assign(
                new ImageElement(0, 0, img),
                elementProps
              );
              imageElement.image = img;
              if (elementProps.rotation === undefined) {
                imageElement.rotation = 0;
              }
              if (elementProps.layer === undefined) {
                imageElement.layer = 0;
              }
              this.elements.push(imageElement);
              resolve();
            };
            img.onerror = () => {
              console.error('Failed to load image from project');
              resolve();
            };
            img.src = elementData.imageData;
          } else if (elementData.type === 'shape') {
            const { type, ...elementProps } = elementData;
            const shapeElement = Object.assign(
              new ShapeElement(0, 0, 'rectangle'),
              elementProps
            );
            if (elementProps.rotation === undefined) {
              shapeElement.rotation = 0;
            }
            if (elementProps.layer === undefined) {
              shapeElement.layer = 0;
            }
            this.elements.push(shapeElement);
            resolve();
          } else if (elementData.type === 'arrow') {
            console.log('Importing arrow:', elementData);
            const { type, ...elementProps } = elementData;
            const arrowElement = Object.assign(new ArrowElement(0, 0), elementProps);
            if (elementProps.rotation === undefined) {
              arrowElement.rotation = 0;
            }
            if (elementProps.layer === undefined) {
              arrowElement.layer = 0;
            }
            arrowElement.updateBounds(); // Recalculate bounds after loading
            console.log('Arrow imported successfully:', arrowElement);
            this.elements.push(arrowElement);
            resolve();
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

      // Update nextLayer to be one higher than the highest existing layer
      if (this.elements.length > 0) {
        const maxLayer = Math.max(...this.elements.map((el) => el.layer || 0));
        this.nextLayer = maxLayer + 1;
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
      elements: this.elements.map((element) => {
        const serialized = { ...element };
        delete serialized.selected;

        if (element.text !== undefined) {
          serialized.type = 'text';
        } else if (element.image) {
          serialized.type = 'image';
          // Convert image to data URL for storage
          try {
            const canvas = document.createElement('canvas');
            canvas.width = element.originalWidth;
            canvas.height = element.originalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(element.image, 0, 0);
            serialized.imageData = canvas.toDataURL();
          } catch (err) {
            console.warn('LocalStorage save fallback to image src:', err);
            serialized.imageData = element.image.src;
          }
          delete serialized.image; // Remove the actual image object
          // Remove transient/cached fields
          delete serialized._silhouetteCanvas;
          delete serialized._silhouetteKey;
          delete serialized._outlineCanvas;
          delete serialized._outlineKey;
        } else if (element.shapeType !== undefined) {
          serialized.type = 'shape';
        } else if (element.arrowType !== undefined) {
          serialized.type = 'arrow';
          console.log('Saving arrow:', serialized);
        }

        return serialized;
      }),
      backgroundColor: this.currentBackgroundColor,
      backgroundPattern: this.currentBackgroundPattern,
      version: '1.0',
      timestamp: Date.now(),
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

        const loadPromises = projectData.elements.map((elementData) => {
          return new Promise((resolve) => {
            if (elementData.type === 'text') {
              const { type, ...elementProps } = elementData;
              const textElement = Object.assign(new TextElement(0, 0, ''), elementProps);
              if (elementProps.rotation === undefined) {
                textElement.rotation = 0;
              }
              if (elementProps.layer === undefined) {
                textElement.layer = 0;
              }
              this.elements.push(textElement);
              resolve();
            } else if (elementData.type === 'image' && elementData.imageData) {
              const img = new Image();
              img.onload = () => {
                const { type, imageData, ...elementProps } = elementData;
                const imageElement = Object.assign(
                  new ImageElement(0, 0, img),
                  elementProps
                );
                imageElement.image = img;
                if (elementProps.rotation === undefined) {
                  imageElement.rotation = 0;
                }
                if (elementProps.layer === undefined) {
                  imageElement.layer = 0;
                }
                this.elements.push(imageElement);
                resolve();
              };
              img.onerror = () => {
                console.error('Failed to load saved image');
                resolve();
              };
              img.src = elementData.imageData;
            } else if (elementData.type === 'shape') {
              const { type, ...elementProps } = elementData;
              const shapeElement = Object.assign(
                new ShapeElement(0, 0, 'rectangle'),
                elementProps
              );
              if (elementProps.rotation === undefined) {
                shapeElement.rotation = 0;
              }
              if (elementProps.layer === undefined) {
                shapeElement.layer = 0;
              }
              this.elements.push(shapeElement);
              resolve();
            } else if (elementData.type === 'arrow') {
              console.log('Loading arrow from localStorage:', elementData);
              const { type, ...elementProps } = elementData;
              const arrowElement = Object.assign(new ArrowElement(0, 0), elementProps);
              if (elementProps.rotation === undefined) {
                arrowElement.rotation = 0;
              }
              if (elementProps.layer === undefined) {
                arrowElement.layer = 0;
              }
              arrowElement.updateBounds(); // Recalculate bounds after loading
              console.log('Arrow loaded successfully:', arrowElement);
              this.elements.push(arrowElement);
              resolve();
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

          // Update nextLayer to be one higher than the highest existing layer
          if (this.elements.length > 0) {
            const maxLayer = Math.max(...this.elements.map((el) => el.layer || 0));
            this.nextLayer = maxLayer + 1;
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

  // Layer management methods
  bringToFront(element) {
    if (!element) element = this.selectedElement;
    if (!element) return false;

    const maxLayer = Math.max(...this.elements.map((el) => el.layer));
    element.layer = maxLayer + 1;
    this.redrawCanvas();
    this.saveToLocalStorage();
    return true;
  }

  sendToBack(element) {
    if (!element) element = this.selectedElement;
    if (!element) return false;

    const minLayer = Math.min(...this.elements.map((el) => el.layer));
    element.layer = minLayer - 1;
    this.redrawCanvas();
    this.saveToLocalStorage();
    return true;
  }

  bringForward(element) {
    if (!element) element = this.selectedElement;
    if (!element) return false;

    const sortedLayers = [...this.elements].sort((a, b) => a.layer - b.layer);
    const currentIndex = sortedLayers.findIndex((el) => el.id === element.id);

    if (currentIndex < sortedLayers.length - 1) {
      const nextElement = sortedLayers[currentIndex + 1];
      const temp = element.layer;
      element.layer = nextElement.layer;
      nextElement.layer = temp;
      this.redrawCanvas();
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  sendBackward(element) {
    if (!element) element = this.selectedElement;
    if (!element) return false;

    const sortedLayers = [...this.elements].sort((a, b) => a.layer - b.layer);
    const currentIndex = sortedLayers.findIndex((el) => el.id === element.id);

    if (currentIndex > 0) {
      const prevElement = sortedLayers[currentIndex - 1];
      const temp = element.layer;
      element.layer = prevElement.layer;
      prevElement.layer = temp;
      this.redrawCanvas();
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  getElementsOrderedByLayer() {
    return [...this.elements].sort((a, b) => a.layer - b.layer);
  }

  setElementLayer(element, layer) {
    if (!element) element = this.selectedElement;
    if (!element) return false;

    element.layer = layer;
    this.redrawCanvas();
    this.saveToLocalStorage();
    return true;
  }
}
