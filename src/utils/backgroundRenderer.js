import { darkenColor } from './colorUtils.js';

export class BackgroundRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    renderSolidBackground(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderGradientBackground(color) {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, darkenColor(color, 0.3));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderStripesBackground(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = darkenColor(color, 0.1);
        const stripeWidth = 40;
        
        for (let x = 0; x < this.canvas.width; x += stripeWidth * 2) {
            this.ctx.fillRect(x, 0, stripeWidth, this.canvas.height);
        }
    }

    renderDotsBackground(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = darkenColor(color, 0.2);
        const dotSize = 6;
        const spacing = 40;
        
        for (let x = spacing; x < this.canvas.width; x += spacing) {
            for (let y = spacing; y < this.canvas.height; y += spacing) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    render(pattern, color) {
        switch (pattern) {
            case 'solid':
                this.renderSolidBackground(color);
                break;
            case 'gradient':
                this.renderGradientBackground(color);
                break;
            case 'stripes':
                this.renderStripesBackground(color);
                break;
            case 'dots':
                this.renderDotsBackground(color);
                break;
            default:
                this.renderSolidBackground(color);
        }
    }
}