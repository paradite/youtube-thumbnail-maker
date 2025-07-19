import { CanvasManager } from "./src/canvas/CanvasManager.js";
import { UIController } from "./src/ui/UIController.js";

document.addEventListener("DOMContentLoaded", () => {
  const canvasManager = new CanvasManager("thumbnail-canvas");
  const uiController = new UIController(canvasManager);

  console.log("YouTube Thumbnail Maker initialized");
});
