# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a YouTube Thumbnail Maker - a vanilla JavaScript web application that creates custom thumbnails using HTML5 Canvas. The app allows users to add text and images, customize backgrounds, and export thumbnails in YouTube-compliant dimensions (1280x720px).

## Development Commands

Since this is a vanilla JavaScript project with no build system:

- **Development**: Open `index.html` directly in a browser or use a local server like `python -m http.server 8000`
- **Testing**: Manual testing in browser - no automated test framework
- **Linting**: No configured linter (vanilla JS project)

## Core Architecture

### Main Components

- **CanvasManager** (`src/canvas/CanvasManager.js`) - Core canvas rendering engine and element management

  - Handles mouse/touch interactions for drag-and-drop editing
  - Manages element selection, resize handles, and rotation
  - Provides localStorage persistence for project state
  - Coordinates background rendering and element layering

- **UIController** (`src/ui/UIController.js`) - UI event handling and DOM management

  - Connects HTML controls to canvas operations
  - Manages text/image control panel visibility
  - Handles file uploads and export functionality
  - Implements keyboard shortcuts (Delete, Escape)

- **TextElement** (`src/elements/TextElement.js`) - Text element implementation

  - Supports fonts, sizes, colors, alignment, and rotation
  - Renders selection handles and supports interactive editing
  - Handles coordinate transformations for rotated text

- **ImageElement** (`src/elements/ImageElement.js`) - Image element implementation
  - Image upload, scaling, rotation, and cropping functionality
  - Maintains aspect ratios and provides crop overlay visualization
  - Supports interactive resize and rotation handles

### Key Design Patterns

- **Module Pattern**: Uses ES6 modules with explicit imports/exports
- **Canvas Coordinate System**: All elements work in canvas coordinates (1280x720)
- **Event-Driven Architecture**: UI events trigger canvas updates through the manager
- **State Persistence**: Automatic localStorage save/load for project continuity

### File Structure

```
/
├── index.html          # Main HTML with canvas and UI controls
├── main.js            # Entry point - initializes managers
├── styles.css         # CSS styling for UI
├── src/
│   ├── canvas/
│   │   └── CanvasManager.js    # Core canvas and element management
│   ├── elements/
│   │   ├── TextElement.js      # Text element class
│   │   └── ImageElement.js     # Image element class
│   ├── ui/
│   │   └── UIController.js     # UI event handling
│   └── utils/
│       ├── backgroundRenderer.js  # Background patterns/colors
│       └── colorUtils.js          # Color utility functions
├── PRD.md             # Product requirements
├── PLAN.md            # Development plan and progress
└── BUG.md             # Known issues tracker
```

## Development Notes

### Canvas Interaction System

- Elements support drag-and-drop, resize handles, and rotation
- Click-to-select with visual feedback (red dashed border)
- Coordinate transformations handle rotated elements correctly
- Touch events supported for mobile devices

### Data Persistence

- Project state automatically saved to localStorage on changes
- Images converted to base64 data URLs for storage
- Full project restoration on page reload

### Export System

- Canvas.toDataURL() for JPG/PNG export
- Maintains YouTube thumbnail specifications (1280x720px)
- Quality settings available for JPG compression

### Known Issues

- Text element rotation: bounding box and rotation handle positioning needs adjustment (tracked in BUG.md)

## Adding New Features

### Adding New Element Types

1. Create new class in `src/elements/` extending base element pattern
2. Implement required methods: `render()`, `isPointInside()`, `update()`
3. Add to CanvasManager's element creation methods
4. Update UIController for specific controls
5. Handle serialization in `saveToLocalStorage()`

### Adding New Background Patterns

1. Extend BackgroundRenderer with new pattern type
2. Add pattern button to HTML toolbar
3. Update UIController pattern event handlers

## Reminders

- Assume the test server is running.
- Never start server on your own.
- Leave testing to the user.
