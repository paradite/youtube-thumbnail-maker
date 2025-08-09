import { darkenColor, lightenColor, adjustColorOpacity } from './colorUtils.js';

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

    renderGeometricPattern(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = adjustColorOpacity(darkenColor(color, 0.1), 0.2);
        const size = 60;
        
        for (let x = 0; x < this.canvas.width; x += size) {
            for (let y = 0; y < this.canvas.height; y += size) {
                this.ctx.beginPath();
                this.ctx.moveTo(x + size / 2, y);
                this.ctx.lineTo(x + size, y + size / 2);
                this.ctx.lineTo(x + size / 2, y + size);
                this.ctx.lineTo(x, y + size / 2);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
    }

    renderHexagonPattern(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = adjustColorOpacity(darkenColor(color, 0.08), 0.3);
        const size = 40;
        const hexHeight = size * Math.sqrt(3);
        
        for (let x = 0; x < this.canvas.width; x += size * 1.5) {
            for (let y = 0; y < this.canvas.height; y += hexHeight) {
                const offsetY = (x / (size * 1.5)) % 2 === 1 ? hexHeight / 2 : 0;
                this.drawHexagon(x + size / 2, y + offsetY + hexHeight / 2, size / 2);
            }
        }
    }

    drawHexagon(centerX, centerY, radius) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    renderWavePattern(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = adjustColorOpacity(darkenColor(color, 0.15), 0.4);
        this.ctx.lineWidth = 3;
        
        const waveHeight = 30;
        const frequency = 0.01;
        const spacing = 80;
        
        for (let y = 0; y < this.canvas.height; y += spacing) {
            this.ctx.beginPath();
            for (let x = 0; x <= this.canvas.width; x += 2) {
                const waveY = y + Math.sin(x * frequency) * waveHeight;
                if (x === 0) {
                    this.ctx.moveTo(x, waveY);
                } else {
                    this.ctx.lineTo(x, waveY);
                }
            }
            this.ctx.stroke();
        }
    }

    renderCirclePattern(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = adjustColorOpacity(darkenColor(color, 0.12), 0.25);
        const spacing = 80;
        const radius = 20;
        
        for (let x = spacing; x < this.canvas.width; x += spacing) {
            for (let y = spacing; y < this.canvas.height; y += spacing) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
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
            case 'geometric':
                this.renderGeometricPattern(color);
                break;
            case 'hexagon':
                this.renderHexagonPattern(color);
                break;
            case 'waves':
                this.renderWavePattern(color);
                break;
            case 'circles':
                this.renderCirclePattern(color);
                break;
            default:
                this.renderSolidBackground(color);
        }
    }
}