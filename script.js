class ParametricCurveGallery {
    constructor() {
        this.gallery = document.getElementById('gallery');
        this.curves = [];
        this.animationId = null;
        this.startTime = null;
        this.lastFrameTime = null;
        this.resizeTimeout = null;

        this.steps = 420;
        this.paddingRatio = 0.12;

        this.positiveKeys = new Set(['amplitude', 'a', 'b', 'R', 'r', 'd', 'n', 'f1', 'f2', 'f3', 'f4', 'd1', 'd2', 'd3', 'd4']);
        this.angleKeys = new Set(['delta', 'p1', 'p2', 'p3', 'p4']);
        this.smallRangeKeys = new Set(['d1', 'd2', 'd3', 'd4']);
        this.arrayPositiveKeys = new Set(['freqs']);
        this.arrayAngleKeys = new Set(['phases']);

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

        const totalCells = 16 * 9;
        for (let i = 0; i < totalCells; i++) {
            this.createCurveCell();
        }
    }

    createCurveCell() {
        const cell = document.createElement('div');
        cell.className = 'curve-cell';

        const canvas = document.createElement('canvas');
        canvas.className = 'curve-canvas';

        const info = document.createElement('div');
        info.className = 'curve-info';

        cell.appendChild(canvas);
        cell.appendChild(info);
        this.gallery.appendChild(cell);

        const ctx = canvas.getContext('2d');
        const baseCurve = this.generateRandomCurve();
        const modifiers = this.createDynamicModifiers(baseCurve);

        const curve = {
            cell,
            canvas,
            ctx,
            info,
            baseCurve,
            modifiers,
            points: Array.from({ length: this.steps + 1 }, () => ({ x: 0, y: 0 })),
            baseHue: this.random(0, 360),
            hueSpeed: this.random(15, 35),
            lineWidthBase: this.random(0.6, 1.3),
            lineWidthVariation: this.random(0.15, 0.5),
            lineWidthSpeed: this.random(0.4, 1.4),
            lineWidthPhase: this.random(0, Math.PI * 2)
        };

        this.curves.push(curve);
        info.textContent = baseCurve.name;

        this.adjustCanvasSize(curve);
        requestAnimationFrame(() => this.adjustCanvasSize(curve));
    }

    adjustCanvasSize(curve) {
        const { canvas } = curve;
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(Math.floor(rect.width), 1);
        const height = Math.max(Math.floor(rect.height), 1);

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
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

    createDynamicModifiers(baseCurve) {
        const modifiers = {};

        for (const [key, value] of Object.entries(baseCurve)) {
            if (key === 'period' || key === 'name' || key === 'type') {
                continue;
            }

            if (typeof value === 'number') {
                modifiers[key] = this.createNumericModifier(value, key);
            } else if (Array.isArray(value)) {
                modifiers[key] = value.map(item => {
                    if (typeof item !== 'number') {
                        return null;
                    }

                    return this.createNumericModifier(item, key, {
                        positive: this.arrayPositiveKeys.has(key),
                        angle: this.arrayAngleKeys.has(key)
                    });
                });
            }
        }

        return modifiers;
    }

    createNumericModifier(value, key, options = {}) {
        const positive = options.positive ?? this.positiveKeys.has(key);
        const angle = options.angle ?? this.angleKeys.has(key);
        const smallRange = options.smallRange ?? this.smallRangeKeys.has(key);

        let amplitudeBase;
        if (angle) {
            amplitudeBase = Math.PI;
        } else if (smallRange) {
            amplitudeBase = Math.max(Math.abs(value) * 5, 0.02);
        } else {
            amplitudeBase = Math.max(Math.abs(value), 0.5);
        }

        return {
            base: value,
            amplitudeBase,
            intensity: this.random(0.15, 0.55),
            secondaryIntensity: this.random(0.05, 0.25),
            speed: this.random(0.18, 0.9),
            secondarySpeed: this.random(0.05, 0.35),
            phase: this.random(0, Math.PI * 2),
            secondaryPhase: this.random(0, Math.PI * 2),
            positive,
            minValue: positive ? Math.max(amplitudeBase * 0.05, Math.abs(value) * 0.35, 0.001) : null
        };
    }

    applyDynamicValue(modifier, time) {
        if (!modifier) {
            return null;
        }

        const primary = Math.sin(time * modifier.speed + modifier.phase) * modifier.intensity;
        const secondary = Math.sin(time * modifier.secondarySpeed + modifier.secondaryPhase) * modifier.secondaryIntensity;

        let value = modifier.base + modifier.amplitudeBase * (primary + secondary);

        if (modifier.positive) {
            value = Math.max(modifier.minValue, Math.abs(value));
        }

        return value;
    }

    getDynamicCurveParams(baseCurve, modifiers, time) {
        const params = {
            type: baseCurve.type,
            name: baseCurve.name,
            period: baseCurve.period
        };

        for (const [key, value] of Object.entries(baseCurve)) {
            if (key === 'type' || key === 'name' || key === 'period') {
                continue;
            }

            if (typeof value === 'number') {
                const modifier = modifiers[key];
                params[key] = modifier ? this.applyDynamicValue(modifier, time) : value;
            } else if (Array.isArray(value)) {
                const modifierList = modifiers[key];

                if (modifierList) {
                    params[key] = value.map((item, index) => {
                        const modifier = modifierList[index];
                        const dynamicValue = modifier ? this.applyDynamicValue(modifier, time) : item;
                        if (this.arrayPositiveKeys.has(key)) {
                            return Math.max(0.001, Math.abs(dynamicValue));
                        }
                        return dynamicValue;
                    });
                } else {
                    params[key] = value.slice();
                }
            } else {
                params[key] = value;
            }
        }

        return params;
    }

    getCurveRange(curve) {
        if (curve.type === 'polynomial') {
            return { min: -2, max: 2 };
        }

        const period = curve.period || Math.PI * 4;
        return { min: 0, max: period };
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
                    x: curve.amplitude * (Math.exp(-d1 * t) * Math.sin(t * f1 + p1) + Math.exp(-d2 * t) * Math.sin(t * f2 + p2)),
                    y: curve.amplitude * (Math.exp(-d3 * t) * Math.sin(t * f3 + p3) + Math.exp(-d4 * t) * Math.sin(t * f4 + p4))
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

    drawCurve(curve, _deltaSeconds, elapsedSeconds) {
        const { ctx, canvas, baseCurve, modifiers, points } = curve;
        if (!points || points.length === 0) {
            return;
        }

        const params = this.getDynamicCurveParams(baseCurve, modifiers, elapsedSeconds);

        const range = this.getCurveRange(params);
        const steps = points.length - 1;
        const stepSize = (range.max - range.min) / steps;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (let i = 0; i <= steps; i++) {
            const t = range.min + stepSize * i;
            const point = this.getParametricPoint(params, t);
            const target = points[i];
            target.x = point.x;
            target.y = point.y;

            if (point.x < minX) minX = point.x;
            if (point.x > maxX) maxX = point.x;
            if (point.y < minY) minY = point.y;
            if (point.y > maxY) maxY = point.y;
        }

        const width = maxX - minX || 1;
        const height = maxY - minY || 1;
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;

        const padding = Math.min(canvas.width, canvas.height) * this.paddingRatio;
        const drawableWidth = canvas.width - padding * 2;
        const drawableHeight = canvas.height - padding * 2;
        const maxDimension = Math.max(width, height, 1);
        const availableSpace = Math.max(1, Math.min(drawableWidth, drawableHeight));
        const scale = availableSpace / maxDimension;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const relativeX = (points[i].x - centerX) * scale;
            const relativeY = (points[i].y - centerY) * scale;
            if (i === 0) {
                ctx.moveTo(relativeX, relativeY);
            } else {
                ctx.lineTo(relativeX, relativeY);
            }
        }

        const hue = (curve.baseHue + elapsedSeconds * curve.hueSpeed) % 360;
        const lineWidth = Math.max(
            0.35,
            curve.lineWidthBase * (1 + curve.lineWidthVariation * Math.sin(elapsedSeconds * curve.lineWidthSpeed + curve.lineWidthPhase))
        );

        ctx.strokeStyle = `hsl(${Math.round(hue)}, 70%, 55%)`;
        ctx.lineWidth = lineWidth;
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
