class ParametricCurveGallery {
    constructor() {
        this.gallery = document.getElementById('gallery');
        this.curves = [];
        this.animationId = null;
        this.startTime = null;
        this.lastFrameTime = null;
        this.resizeTimeout = null;
        this.init();
    }

    init() {
        this.createCurves();
        this.startAnimation();
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    createCurves() {
        this.gallery.innerHTML = '';
        this.curves = [];

        const cellArea = 150 * 150;
        const cellCount = Math.floor((window.innerWidth * window.innerHeight) / cellArea);
        const targetCount = Math.min(Math.max(cellCount, 80), 320);

        for (let i = 0; i < targetCount; i++) {
            this.createCurveCell();
        }
    }

    createCurveCell() {
        const cell = document.createElement('div');
        cell.className = 'curve-cell';

        const canvas = document.createElement('canvas');
        canvas.className = 'curve-canvas';
        canvas.width = 150;
        canvas.height = 150;

        const info = document.createElement('div');
        info.className = 'curve-info';

        cell.appendChild(canvas);
        cell.appendChild(info);
        this.gallery.appendChild(cell);

        const baseCurve = this.generateRandomCurve();
        const preparedCurve = this.prepareCurve(baseCurve);

        const curve = {
            canvas,
            ctx: canvas.getContext('2d'),
            info,
            ...baseCurve,
            ...preparedCurve
        };

        this.curves.push(curve);
        info.textContent = baseCurve.name;
    }

    generateRandomCurve() {
        const curveTypes = [
            'lissajous',
            'spirograph',
            'lame',
            'polynomial',
            'trigSum',
            'harmonograph',
            'rose',
            'epitrochoid',
            'butterfly',
            'cardioid',
            'hypotrochoid',
            'cycloid'
        ];

        const type = curveTypes[Math.floor(Math.random() * curveTypes.length)];
        return this.generateCurveParams(type);
    }

    generateCurveParams(type) {
        switch (type) {
            case 'lissajous':
                return {
                    type: 'lissajous',
                    name: 'Lissajous',
                    a: this.random(1, 5),
                    b: this.random(1, 5),
                    delta: this.random(0, Math.PI * 2),
                    amplitude: this.random(30, 70),
                    period: Math.PI * 2
                };

            case 'spirograph':
                return {
                    type: 'spirograph',
                    name: 'Spirograph',
                    R: this.random(20, 40),
                    r: this.random(5, 15),
                    d: this.random(5, 20),
                    amplitude: 1,
                    period: Math.PI * 4
                };

            case 'lame':
                return {
                    type: 'lame',
                    name: 'Lamé Curve',
                    a: this.random(20, 50),
                    b: this.random(20, 50),
                    n: this.random(0.5, 3),
                    amplitude: 1,
                    period: Math.PI * 2
                };

            case 'polynomial':
                return {
                    type: 'polynomial',
                    name: 'Polynomial',
                    coeffs: Array.from({ length: 4 }, () => this.random(-2, 2)),
                    amplitude: this.random(20, 50),
                    period: 4
                };

            case 'trigSum':
                return {
                    type: 'trigSum',
                    name: 'Trig Sum',
                    freqs: Array.from({ length: 3 }, () => this.random(1, 8)),
                    phases: Array.from({ length: 3 }, () => this.random(0, Math.PI * 2)),
                    amplitude: this.random(30, 60),
                    period: Math.PI * 2
                };

            case 'harmonograph':
                return {
                    type: 'harmonograph',
                    name: 'Harmonograph',
                    f1: this.random(1, 4),
                    f2: this.random(1, 4),
                    f3: this.random(1, 4),
                    f4: this.random(1, 4),
                    p1: this.random(0, Math.PI * 2),
                    p2: this.random(0, Math.PI * 2),
                    p3: this.random(0, Math.PI * 2),
                    p4: this.random(0, Math.PI * 2),
                    d1: this.random(0.001, 0.01),
                    d2: this.random(0.001, 0.01),
                    d3: this.random(0.001, 0.01),
                    d4: this.random(0.001, 0.01),
                    amplitude: this.random(30, 60),
                    period: Math.PI * 12
                };

            case 'rose':
                return {
                    type: 'rose',
                    name: 'Rose Curve',
                    n: this.random(2, 8),
                    d: Math.floor(this.random(1, 5)),
                    amplitude: this.random(30, 60),
                    period: Math.PI * 2
                };

            case 'epitrochoid':
                return {
                    type: 'epitrochoid',
                    name: 'Epitrochoid',
                    R: this.random(20, 40),
                    r: this.random(5, 15),
                    d: this.random(10, 25),
                    amplitude: 1,
                    period: Math.PI * 4
                };

            case 'butterfly':
                return {
                    type: 'butterfly',
                    name: 'Butterfly',
                    amplitude: this.random(40, 70),
                    period: Math.PI * 12
                };

            case 'cardioid':
                return {
                    type: 'cardioid',
                    name: 'Cardioid',
                    a: this.random(20, 50),
                    amplitude: 1,
                    period: Math.PI * 2
                };

            case 'hypotrochoid':
                return {
                    type: 'hypotrochoid',
                    name: 'Hypotrochoid',
                    R: this.random(30, 50),
                    r: this.random(5, 20),
                    d: this.random(5, 25),
                    amplitude: 1,
                    period: Math.PI * 4
                };

            case 'cycloid':
                return {
                    type: 'cycloid',
                    name: 'Cycloid',
                    r: this.random(10, 30),
                    amplitude: 1,
                    period: Math.PI * 4
                };

            default:
                return this.generateCurveParams('lissajous');
        }
    }

    getCurveRange(curve) {
        if (curve.type === 'polynomial') {
            return { min: -2, max: 2 };
        }

        const period = curve.period || Math.PI * 4;
        return { min: 0, max: period };
    }

    prepareCurve(curve) {
        const steps = 600;
        const range = this.getCurveRange(curve);
        const points = [];
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (let i = 0; i <= steps; i++) {
            const t = range.min + (i / steps) * (range.max - range.min);
            const point = this.getParametricPoint(curve, t);
            points.push(point);

            if (point.x < minX) minX = point.x;
            if (point.x > maxX) maxX = point.x;
            if (point.y < minY) minY = point.y;
            if (point.y > maxY) maxY = point.y;
        }

        const width = maxX - minX || 1;
        const height = maxY - minY || 1;
        const padding = 12;
        const drawableSize = 150 - padding * 2;
        const scale = drawableSize / Math.max(width, height, 1);
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;

        const normalizedPoints = points.map(point => ({
            x: (point.x - centerX) * scale,
            y: (point.y - centerY) * scale
        }));

        let rotationSpeed = this.random(-0.4, 0.4);
        if (Math.abs(rotationSpeed) < 0.05) {
            rotationSpeed = rotationSpeed < 0 ? -0.05 : 0.05;
        }

        return {
            points: normalizedPoints,
            rotation: this.random(0, Math.PI * 2),
            rotationSpeed,
            baseHue: this.random(0, 360),
            hueSpeed: this.random(8, 18),
            lineWidth: this.random(0.8, 1.6)
        };
    }

    getParametricPoint(curve, t) {
        const { type } = curve;

        switch (type) {
            case 'lissajous':
                return {
                    x: curve.amplitude * Math.sin(curve.a * t + curve.delta),
                    y: curve.amplitude * Math.sin(curve.b * t)
                };

            case 'spirograph':
                const { R, r, d } = curve;
                const ratio = (R - r) / r;
                return {
                    x: (R - r) * Math.cos(t) + d * Math.cos(ratio * t),
                    y: (R - r) * Math.sin(t) - d * Math.sin(ratio * t)
                };

            case 'lame':
                const cosT = Math.cos(t);
                const sinT = Math.sin(t);
                const cosPow = Math.pow(Math.abs(cosT), 2 / curve.n) * Math.sign(cosT);
                const sinPow = Math.pow(Math.abs(sinT), 2 / curve.n) * Math.sign(sinT);
                return {
                    x: curve.a * cosPow,
                    y: curve.b * sinPow
                };

            case 'polynomial':
                const { coeffs } = curve;
                let x = 0;
                let y = 0;
                for (let i = 0; i < coeffs.length; i++) {
                    x += coeffs[i] * Math.pow(t, i);
                    y += coeffs[i] * Math.pow(t, i + 1);
                }
                return {
                    x: curve.amplitude * Math.cos(x),
                    y: curve.amplitude * Math.sin(y)
                };

            case 'trigSum':
                const { freqs, phases } = curve;
                let sumX = 0;
                let sumY = 0;
                for (let i = 0; i < freqs.length; i++) {
                    sumX += Math.cos(freqs[i] * t + phases[i]);
                    sumY += Math.sin(freqs[i] * t + phases[i]);
                }
                return {
                    x: curve.amplitude * sumX / freqs.length,
                    y: curve.amplitude * sumY / freqs.length
                };

            case 'harmonograph':
                const { f1, f2, f3, f4, p1, p2, p3, p4, d1, d2, d3, d4 } = curve;
                return {
                    x: curve.amplitude * (Math.exp(-d1 * t) * Math.sin(t * f1 + p1) +
                                         Math.exp(-d2 * t) * Math.sin(t * f2 + p2)),
                    y: curve.amplitude * (Math.exp(-d3 * t) * Math.sin(t * f3 + p3) +
                                         Math.exp(-d4 * t) * Math.sin(t * f4 + p4))
                };

            case 'rose':
                const k = curve.n / curve.d;
                const rho = curve.amplitude * Math.cos(k * t);
                return {
                    x: rho * Math.cos(t),
                    y: rho * Math.sin(t)
                };

            case 'epitrochoid':
                const epiRatio = (curve.R + curve.r) / curve.r;
                return {
                    x: (curve.R + curve.r) * Math.cos(t) - curve.d * Math.cos(epiRatio * t),
                    y: (curve.R + curve.r) * Math.sin(t) - curve.d * Math.sin(epiRatio * t)
                };

            case 'butterfly':
                const butterflyR = curve.amplitude * (Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin(t / 12), 5));
                return {
                    x: butterflyR * Math.cos(t),
                    y: butterflyR * Math.sin(t)
                };

            case 'cardioid':
                const cardR = curve.a * (1 - Math.cos(t));
                return {
                    x: cardR * Math.cos(t),
                    y: cardR * Math.sin(t)
                };

            case 'hypotrochoid':
                const hypoRatio = (curve.R - curve.r) / curve.r;
                return {
                    x: (curve.R - curve.r) * Math.cos(t) + curve.d * Math.cos(hypoRatio * t),
                    y: (curve.R - curve.r) * Math.sin(t) - curve.d * Math.sin(hypoRatio * t)
                };

            case 'cycloid':
                return {
                    x: curve.r * (t - Math.sin(t)),
                    y: curve.r * (1 - Math.cos(t))
                };

            default:
                return { x: 0, y: 0 };
        }
    }

    drawCurve(curve, deltaSeconds, elapsedSeconds) {
        const { ctx, canvas, points } = curve;
        if (!points || points.length === 0) {
            return;
        }

        curve.rotation += curve.rotationSpeed * deltaSeconds;
        const hue = (curve.baseHue + elapsedSeconds * curve.hueSpeed) % 360;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(curve.rotation);

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            ctx.lineTo(point.x, point.y);
        }

        ctx.strokeStyle = `hsl(${hue}, 70%, 55%)`;
        ctx.lineWidth = curve.lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
    }

    animate(currentTime) {
        if (this.startTime === null) {
            this.startTime = currentTime;
            this.lastFrameTime = currentTime;
        }

        const deltaSeconds = (currentTime - this.lastFrameTime) / 1000;
        const elapsedSeconds = (currentTime - this.startTime) / 1000;

        this.curves.forEach(curve => {
            this.drawCurve(curve, deltaSeconds, elapsedSeconds);
        });

        this.lastFrameTime = currentTime;
        this.animationId = requestAnimationFrame(time => this.animate(time));
    }

    startAnimation() {
        this.stop();
        this.startTime = null;
        this.lastFrameTime = null;
        this.animationId = requestAnimationFrame(time => this.animate(time));
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    scheduleResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = setTimeout(() => {
            this.handleResize();
        }, 150);
    }

    handleResize() {
        this.stop();
        this.createCurves();
        this.startAnimation();
    }
}

// Initialize the gallery when the page loads
let galleryInstance = null;

const initializeGallery = () => {
    if (!galleryInstance) {
        galleryInstance = new ParametricCurveGallery();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGallery);
} else {
    initializeGallery();
}

window.addEventListener('resize', () => {
    if (galleryInstance) {
        galleryInstance.scheduleResize();
    }
});
