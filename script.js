const CURVE_METADATA = {
    lissajous: {
        title: 'Lissajous Figures',
        discoverer: 'Jules Antoine Lissajous · Paris, 1850s',
        description: 'Interlocking sine waves revealing frequency ratios through luminous knots.'
    },
    spirograph: {
        title: 'Epicycloid Spirograph',
        discoverer: 'Denis D. Spence · 19th century Britain',
        description: 'Rolling circles trace ornate loops reminiscent of the classic toy.'
    },
    lame: {
        title: 'Lamé Curve',
        discoverer: 'Gabriel Lamé · France, 1818',
        description: 'Superellipse stretching circles into softly squared silhouettes.'
    },
    polynomial: {
        title: 'Polynomial Flow',
        discoverer: 'Inspired by Brook Taylor · England, 1715',
        description: 'Power series distortions bending angles into swirling petals.'
    },
    trigSum: {
        title: 'Trigonometric Sum',
        discoverer: 'Joseph Fourier · France, 1822',
        description: 'Stacked harmonics weaving smooth interference tapestries.'
    },
    harmonograph: {
        title: 'Harmonograph',
        discoverer: 'Kelvin & Tisley · Victorian Britain',
        description: 'Pendulum echoes fading into hypnotic intertwined curves.'
    },
    rose: {
        title: 'Rhodoid (Rose) Curve',
        discoverer: 'Guillaume de l’Hôpital · France, 1720',
        description: 'Polar petals blooming from a single sine-driven rhythm.'
    },
    epitrochoid: {
        title: 'Epitrochoid',
        discoverer: 'Albrecht Dürer · Nuremberg, 1525',
        description: 'Orbiting rollers carve jewel-like bracelets of light.'
    },
    butterfly: {
        title: 'Butterfly Curve',
        discoverer: 'Temple H. Fay · USA, 1989',
        description: 'Exponentially fluttering wings shimmering with fractal echoes.'
    },
    cardioid: {
        title: 'Cardioid Variants',
        discoverer: 'Étienne Pascal & Jacob Bernoulli · 17th century',
        description: 'Heart-like epicycloids pulsing with harmonic ripples.'
    },
    hypotrochoid: {
        title: 'Hypotrochoid',
        discoverer: 'Ptolemy & Arabic astronomers · Antiquity',
        description: 'Inner rolling circles sculpt intricate starry filigrees.'
    },
    cycloid: {
        title: 'Cycloidal Families',
        discoverer: 'Galileo Galilei · Florence, 1630s',
        description: 'Rolling wheels and trochoids sweeping luminous arches.'
    }
};

class ParametricCurveGallery {
    constructor() {
        this.gallery = document.getElementById('gallery');
        this.curves = [];
        this.animationId = null;
        this.startTime = null;
        this.lastFrameTime = null;
        this.resizeTimeout = null;
        this.currentElapsed = 0;

        this.steps = 420;
        this.paddingRatio = 0.12;

        this.positiveKeys = new Set(['amplitude', 'a', 'b', 'R', 'r', 'd', 'n', 'f1', 'f2', 'f3', 'f4', 'd1', 'd2', 'd3', 'd4', 'k', 'waveFrequency', 'waveAmplitude']);
        this.angleKeys = new Set(['delta', 'p1', 'p2', 'p3', 'p4', 'phase', 'wavePhase']);
        this.smallRangeKeys = new Set(['d1', 'd2', 'd3', 'd4']);
        this.arrayPositiveKeys = new Set(['freqs']);
        this.arrayAngleKeys = new Set(['phases']);

        this.pointer = { x: 0, y: 0, active: false };
        this.tooltip = this.createTooltipElement();

        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerOut = this.handlePointerOut.bind(this);

        document.addEventListener('pointermove', this.handlePointerMove);
        document.addEventListener('pointerleave', this.handlePointerOut);
        document.addEventListener('pointercancel', this.handlePointerOut);
        window.addEventListener('blur', this.handlePointerOut);

        this.init();
    }

    init() {
        this.createCurves();
        this.startAnimation();
    }

    createTooltipElement() {
        const tooltip = document.createElement('div');
        tooltip.className = 'curve-tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    positionTooltip(x, y) {
        if (!this.tooltip) {
            return;
        }
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    handlePointerMove(event) {
        this.pointer.x = event.clientX;
        this.pointer.y = event.clientY;
        this.pointer.active = true;

        if (this.tooltip && this.tooltip.classList.contains('visible')) {
            this.positionTooltip(event.clientX, event.clientY);
        }
    }

    handlePointerOut() {
        this.pointer.active = false;
        if (this.tooltip) {
            this.tooltip.classList.remove('visible');
        }
        this.curves.forEach(curve => {
            curve.cell.classList.remove('is-holding');
            if (curve.hold && curve.hold.active) {
                this.handlePointerUp(curve);
            }
        });
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
            lineWidthPhase: this.random(0, Math.PI * 2),
            effects: [],
            hold: { active: false, start: 0, intensity: 0, x: 0, y: 0 },
            tooltipHtml: '',
            lastDoubleClickTime: 0
        };

        this.curves.push(curve);
        this.updateCurveInfo(curve);

        cell.addEventListener('click', event => this.handleClick(event, curve));
        cell.addEventListener('dblclick', event => this.handleDoubleClick(event, curve));
        cell.addEventListener('pointerdown', event => this.handlePointerDown(event, curve));
        cell.addEventListener('pointerup', () => this.handlePointerUp(curve));
        cell.addEventListener('pointerleave', () => {
            this.handlePointerUp(curve);
            this.handleTooltipLeave();
        });
        cell.addEventListener('pointerenter', event => this.handleTooltipEnter(event, curve));
        cell.addEventListener('pointermove', event => this.handleTooltipMove(event));

        this.adjustCanvasSize(curve);
        requestAnimationFrame(() => this.adjustCanvasSize(curve));
    }

    buildTooltipContent(baseCurve) {
        const meta = CURVE_METADATA[baseCurve.type] || {};
        const title = meta.title || baseCurve.name || 'Parametric Curve';
        const discoverer = meta.discoverer ? `<em>${meta.discoverer}</em>` : '';
        const description = meta.description ? `<span>${meta.description}</span>` : '';
        return `<strong>${title}</strong>${discoverer}${description}`;
    }

    updateCurveInfo(curve) {
        const { baseCurve } = curve;
        const meta = CURVE_METADATA[baseCurve.type] || {};
        const title = meta.title || baseCurve.name || 'Parametric Curve';
        const discoverer = meta.discoverer ? `<em>${meta.discoverer}</em>` : '';
        const description = meta.description ? `<span>${meta.description}</span>` : '';

        curve.info.innerHTML = `<strong>${title}</strong>${discoverer}${description}`;
        curve.tooltipHtml = this.buildTooltipContent(baseCurve);
        const ariaPieces = [title];
        if (meta.discoverer) {
            ariaPieces.push(meta.discoverer);
        }
        if (meta.description) {
            ariaPieces.push(meta.description);
        }
        curve.cell.setAttribute('aria-label', ariaPieces.join('. '));
    }

    handleTooltipEnter(event, curve) {
        if (!this.tooltip) {
            return;
        }
        this.tooltip.innerHTML = curve.tooltipHtml;
        this.tooltip.classList.add('visible');
        this.positionTooltip(event.clientX, event.clientY);
    }

    handleTooltipMove(event) {
        if (!this.tooltip) {
            return;
        }
        if (this.tooltip.classList.contains('visible')) {
            this.positionTooltip(event.clientX, event.clientY);
        }
    }

    handleTooltipLeave() {
        if (this.tooltip) {
            this.tooltip.classList.remove('visible');
        }
    }

    handleClick(event, curve) {
        const elapsed = this.currentElapsed || 0;
        if (elapsed - curve.lastDoubleClickTime < 0.3) {
            return;
        }

        const rect = curve.canvas.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;

        const hue = (curve.baseHue + elapsed * curve.hueSpeed) % 360;
        const effect = {
            type: 'ripple',
            start: elapsed,
            duration: 1.4,
            x: relativeX,
            y: relativeY,
            hue,
            minRadius: rect.width * 0.05,
            maxRadius: rect.width * 0.6,
            strength: 0.9,
            lineWidthBoost: 1.6
        };

        curve.effects.push(effect);
        if (curve.effects.length > 24) {
            curve.effects.splice(0, curve.effects.length - 24);
        }
    }

    handleDoubleClick(event, curve) {
        event.preventDefault();
        const elapsed = this.currentElapsed || 0;
        curve.lastDoubleClickTime = elapsed;

        const baseCurve = this.generateRandomCurve();
        curve.baseCurve = baseCurve;
        curve.modifiers = this.createDynamicModifiers(baseCurve);
        curve.baseHue = this.random(0, 360);
        curve.hueSpeed = this.random(18, 36);
        this.updateCurveInfo(curve);
        if (this.tooltip && this.tooltip.classList.contains('visible')) {
            this.tooltip.innerHTML = curve.tooltipHtml;
        }

        const rect = curve.canvas.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;

        const effect = {
            type: 'burst',
            start: elapsed,
            duration: 1.1,
            x: relativeX,
            y: relativeY,
            hue: curve.baseHue,
            maxRadius: Math.max(rect.width, rect.height) * 0.6,
            strength: 0.85,
            count: 14,
            rotation: this.random(0, Math.PI * 2),
            spin: this.random(1.2, 3.5),
            lineWidthBoost: 1.3,
            spokes: Array.from({ length: 14 }, () => this.random(0.65, 1.1))
        };

        curve.effects.push(effect);
        if (curve.effects.length > 24) {
            curve.effects.splice(0, curve.effects.length - 24);
        }
    }

    handlePointerDown(event, curve) {
        event.preventDefault();
        const rect = curve.canvas.getBoundingClientRect();
        curve.hold.active = true;
        curve.hold.start = this.currentElapsed || 0;
        curve.hold.x = (event.clientX - rect.left) / rect.width;
        curve.hold.y = (event.clientY - rect.top) / rect.height;
        curve.cell.classList.add('is-holding');
    }

    handlePointerUp(curve) {
        if (!curve.hold.active) {
            curve.cell.classList.remove('is-holding');
            return;
        }

        const elapsed = this.currentElapsed || 0;
        const holdDuration = Math.max(0, elapsed - curve.hold.start);
        curve.hold.active = false;
        curve.cell.classList.remove('is-holding');

        if (holdDuration > 0.25) {
            const magnitude = Math.min(1.6, holdDuration);
            const effect = {
                type: 'burst',
                start: elapsed,
                duration: 0.9 + magnitude * 0.3,
                x: curve.hold.x,
                y: curve.hold.y,
                hue: (curve.baseHue + holdDuration * 120) % 360,
                maxRadius: Math.max(curve.canvas.width, curve.canvas.height) * (0.35 + magnitude * 0.25),
                strength: 0.6 + magnitude * 0.25,
                count: 10 + Math.round(magnitude * 10),
                rotation: this.random(0, Math.PI * 2),
                spin: this.random(0.8, 2.4),
                lineWidthBoost: 1 + magnitude * 0.5,
                spokes: Array.from({ length: 10 + Math.round(magnitude * 10) }, () => this.random(0.5, 1.2))
            };
            curve.effects.push(effect);
            if (curve.effects.length > 24) {
                curve.effects.splice(0, curve.effects.length - 24);
            }
        }
    }

    adjustCanvasSize(curve) {
        const { canvas, ctx } = curve;
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(Math.floor(rect.width), 1);
        const height = Math.max(Math.floor(rect.height), 1);

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
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
                    name: 'Cardioid Variants',
                    a: this.random(20, 50),
                    b: this.random(10, 40),
                    k: this.random(0.6, 3.2),
                    phase: this.random(0, Math.PI * 2),
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
                    name: 'Cycloidal Family',
                    r: this.random(10, 30),
                    d: this.random(6, 40),
                    waveAmplitude: this.random(5, 22),
                    waveFrequency: this.random(0.5, 3.5),
                    wavePhase: this.random(0, Math.PI * 2),
                    verticalShift: this.random(-20, 20),
                    amplitude: 1,
                    period: Math.PI * 6
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
                const waveComponent = curve.b * Math.sin(curve.k * t + curve.phase);
                const cardR = curve.a * (1 - Math.cos(t)) + waveComponent;
                const twist = (curve.b * 0.35) * Math.sin((curve.k + 0.5) * t + curve.phase / 2);
                return {
                    x: cardR * Math.cos(t) - twist * Math.sin(t),
                    y: cardR * Math.sin(t) + twist * Math.cos(t)
                };

            case 'hypotrochoid':
                const hypoRatio = (curve.R - curve.r) / curve.r;
                return {
                    x: (curve.R - curve.r) * Math.cos(t) + curve.d * Math.cos(hypoRatio * t),
                    y: (curve.R - curve.r) * Math.sin(t) - curve.d * Math.sin(hypoRatio * t)
                };

            case 'cycloid':
                const baseX = curve.r * (t - Math.sin(t));
                const baseY = curve.r * (1 - Math.cos(t));
                const trochoidX = (curve.r + curve.d) * t - curve.d * Math.sin(t);
                const trochoidY = (curve.r + curve.d) - curve.d * Math.cos(t);
                const wave = curve.waveAmplitude * Math.sin(curve.waveFrequency * t + curve.wavePhase);
                return {
                    x: (baseX + trochoidX) * 0.5 + wave,
                    y: (baseY + trochoidY) * 0.5 + curve.verticalShift + wave * 0.4
                };

            default:
                return { x: 0, y: 0 };
        }
    }

    drawCurve(curve, deltaSeconds, elapsedSeconds) {
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

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        if (curve.hold) {
            if (curve.hold.active) {
                const holdElapsed = Math.max(0, elapsedSeconds - curve.hold.start);
                curve.hold.intensity = Math.min(1, holdElapsed / 1.1);
            } else {
                curve.hold.intensity = Math.max(0, curve.hold.intensity - deltaSeconds * 2.2);
            }
        }
        const holdIntensity = curve.hold ? curve.hold.intensity : 0;

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
            (curve.lineWidthBase + holdIntensity * 0.9) * (1 + curve.lineWidthVariation * Math.sin(elapsedSeconds * curve.lineWidthSpeed + curve.lineWidthPhase))
        );

        const saturation = Math.min(100, 70 + holdIntensity * 24);
        const lightness = Math.min(75, 54 + holdIntensity * 18);

        ctx.strokeStyle = `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowBlur = 6 + holdIntensity * 18;
        ctx.shadowColor = `hsla(${Math.round(hue)}, 100%, ${Math.min(80, 60 + holdIntensity * 20)}%, ${0.18 + holdIntensity * 0.32})`;
        ctx.stroke();

        this.renderEffects(ctx, curve, elapsedSeconds);
        this.renderPointerGlow(ctx, curve, hue);

        ctx.restore();
    }

    renderEffects(ctx, curve, elapsedSeconds) {
        if (!curve.effects || curve.effects.length === 0) {
            return;
        }

        const { canvas } = curve;
        const width = canvas.width;
        const height = canvas.height;
        const nextEffects = [];

        for (const effect of curve.effects) {
            const progress = (elapsedSeconds - effect.start) / effect.duration;
            if (!Number.isFinite(progress)) {
                continue;
            }

            if (progress >= 1) {
                continue;
            }

            const clamped = Math.max(0, Math.min(1, progress));
            ctx.save();
            ctx.lineCap = 'round';
            ctx.globalCompositeOperation = 'lighter';

            if (effect.type === 'ripple') {
                const eased = 1 - Math.pow(1 - clamped, 3);
                const radius = effect.minRadius + (effect.maxRadius - effect.minRadius) * eased;
                const alpha = (1 - eased) * effect.strength;
                const x = effect.x * width - width / 2;
                const y = effect.y * height - height / 2;
                ctx.strokeStyle = `hsla(${Math.round(effect.hue)}, 100%, 70%, ${alpha})`;
                ctx.lineWidth = 0.6 + (effect.lineWidthBoost || 1.2) * (1 - eased);
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (effect.type === 'burst') {
                const eased = 1 - Math.pow(1 - clamped, 2);
                const alpha = (1 - clamped) * effect.strength;
                const x = effect.x * width - width / 2;
                const y = effect.y * height - height / 2;
                const count = effect.count || 12;
                const radius = effect.maxRadius * eased;
                const spokes = effect.spokes || Array.from({ length: count }, () => 1);
                for (let i = 0; i < count; i++) {
                    const spokeScale = spokes[i % spokes.length];
                    const spokeLength = radius * spokeScale;
                    const angle = effect.rotation + (Math.PI * 2 * i) / count + (effect.spin || 0) * clamped;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * spokeLength, y + Math.sin(angle) * spokeLength);
                    ctx.strokeStyle = `hsla(${Math.round((effect.hue + i * 12) % 360)}, 90%, 65%, ${alpha})`;
                    ctx.lineWidth = 0.4 + (effect.lineWidthBoost || 1) * (1 - clamped);
                    ctx.stroke();
                }
            }

            ctx.restore();
            nextEffects.push(effect);
        }

        curve.effects = nextEffects;
    }

    renderPointerGlow(ctx, curve, hue) {
        if (!this.pointer.active) {
            return;
        }

        const rect = curve.canvas.getBoundingClientRect();
        if (
            this.pointer.x < rect.left ||
            this.pointer.x > rect.right ||
            this.pointer.y < rect.top ||
            this.pointer.y > rect.bottom
        ) {
            return;
        }

        const width = curve.canvas.width;
        const height = curve.canvas.height;
        const localX = this.pointer.x - rect.left;
        const localY = this.pointer.y - rect.top;
        const centerX = localX - width / 2;
        const centerY = localY - height / 2;
        const maxRadius = Math.max(width, height) * 0.65;

        const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            Math.max(12, maxRadius * 0.08),
            centerX,
            centerY,
            maxRadius
        );
        gradient.addColorStop(0, `hsla(${Math.round(hue)}, 100%, 75%, 0.7)`);
        gradient.addColorStop(0.45, `hsla(${Math.round(hue)}, 90%, 45%, 0.26)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.restore();
    }

    animate(currentTime) {
        if (this.startTime === null) {
            this.startTime = currentTime;
            this.lastFrameTime = currentTime;
        }

        const deltaSeconds = (currentTime - this.lastFrameTime) / 1000;
        const elapsedSeconds = (currentTime - this.startTime) / 1000;
        this.currentElapsed = elapsedSeconds;

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
