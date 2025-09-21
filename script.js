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

        this.pointer = { x: 0, y: 0, active: false, intensity: 0 };
        this.pointerFalloff = 1.35;

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
        const formula = this.buildCurveFormula(baseCurve);
        const formulaBlock = formula ? `<code>${formula}</code>` : '';
        return `<strong>${title}</strong>${discoverer}${description}${formulaBlock}`;
    }

    formatNumber(value, baseDecimals = 2) {
        if (!Number.isFinite(value)) {
            return '0';
        }
        const abs = Math.abs(value);
        let decimals = baseDecimals;
        if (abs >= 1000) {
            decimals = 0;
        } else if (abs >= 100) {
            decimals = 1;
        } else if (abs < 1) {
            decimals = 3;
        }
        const fixed = value.toFixed(decimals);
        const parsed = Number.parseFloat(fixed);
        const normalized = Object.is(parsed, -0) ? 0 : parsed;
        return normalized.toString();
    }

    buildPolynomialString(coeffs, startPower = 0, variable = 't') {
        if (!Array.isArray(coeffs) || coeffs.length === 0) {
            return '0';
        }

        const pieces = [];
        coeffs.forEach((coeff, index) => {
            if (!Number.isFinite(coeff) || Math.abs(coeff) < 0.0005) {
                return;
            }
            const power = index + startPower;
            const absCoeff = this.formatNumber(Math.abs(coeff));
            let term;
            if (power === 0) {
                term = absCoeff;
            } else if (power === 1) {
                term = `${absCoeff}·${variable}`;
            } else {
                term = `${absCoeff}·${variable}^${power}`;
            }
            const sign = coeff >= 0 ? (pieces.length === 0 ? '' : ' + ') : (pieces.length === 0 ? '-' : ' - ');
            pieces.push(`${sign}${term}`);
        });

        if (pieces.length === 0) {
            return '0';
        }

        return pieces.join('');
    }

    buildCurveFormula(curve) {
        if (!curve || !curve.type) {
            return '';
        }

        switch (curve.type) {
            case 'lissajous':
                return `x(t) = ${this.formatNumber(curve.amplitude)}·sin(${this.formatNumber(curve.a)}t + ${this.formatNumber(curve.delta)})\n` +
                    `y(t) = ${this.formatNumber(curve.amplitude)}·sin(${this.formatNumber(curve.b)}t)`;
            case 'spirograph': {
                const diff = this.formatNumber(curve.R - curve.r);
                const ratio = this.formatNumber((curve.R - curve.r) / curve.r);
                return `x(t) = ${diff}·cos(t) + ${this.formatNumber(curve.d)}·cos(${ratio}t)\n` +
                    `y(t) = ${diff}·sin(t) - ${this.formatNumber(curve.d)}·sin(${ratio}t)`;
            }
            case 'lame':
                return `|x / ${this.formatNumber(curve.a)}|^${this.formatNumber(curve.n)} + |y / ${this.formatNumber(curve.b)}|^${this.formatNumber(curve.n)} = 1`;
            case 'polynomial': {
                const xPoly = this.buildPolynomialString(curve.coeffs, 0);
                const yPoly = this.buildPolynomialString(curve.coeffs, 1);
                return `x(t) = ${this.formatNumber(curve.amplitude)}·cos(${xPoly})\n` +
                    `y(t) = ${this.formatNumber(curve.amplitude)}·sin(${yPoly})`;
            }
            case 'trigSum': {
                const cosComponents = curve.freqs
                    .map((freq, index) => `cos(${this.formatNumber(freq)}t + ${this.formatNumber(curve.phases[index])})`)
                    .join(' + ');
                const sinComponents = curve.freqs
                    .map((freq, index) => `sin(${this.formatNumber(freq)}t + ${this.formatNumber(curve.phases[index])})`)
                    .join(' + ');
                const divisor = curve.freqs.length;
                return `x(t) = ${this.formatNumber(curve.amplitude)}·(${cosComponents}) / ${divisor}\n` +
                    `y(t) = ${this.formatNumber(curve.amplitude)}·(${sinComponents}) / ${divisor}`;
            }
            case 'harmonograph':
                return `x(t) = ${this.formatNumber(curve.amplitude)}·(e^{-${this.formatNumber(curve.d1)}t}·sin(${this.formatNumber(curve.f1)}t + ${this.formatNumber(curve.p1)}) + e^{-${this.formatNumber(curve.d2)}t}·sin(${this.formatNumber(curve.f2)}t + ${this.formatNumber(curve.p2)}))\n` +
                    `y(t) = ${this.formatNumber(curve.amplitude)}·(e^{-${this.formatNumber(curve.d3)}t}·sin(${this.formatNumber(curve.f3)}t + ${this.formatNumber(curve.p3)}) + e^{-${this.formatNumber(curve.d4)}t}·sin(${this.formatNumber(curve.f4)}t + ${this.formatNumber(curve.p4)}))`;
            case 'rose':
                return `r(θ) = ${this.formatNumber(curve.amplitude)}·cos(${this.formatNumber(curve.n / curve.d)}θ)`;
            case 'epitrochoid': {
                const sum = this.formatNumber(curve.R + curve.r);
                const ratio = this.formatNumber((curve.R + curve.r) / curve.r);
                return `x(t) = ${sum}·cos(t) - ${this.formatNumber(curve.d)}·cos(${ratio}t)\n` +
                    `y(t) = ${sum}·sin(t) - ${this.formatNumber(curve.d)}·sin(${ratio}t)`;
            }
            case 'butterfly':
                return `r(t) = ${this.formatNumber(curve.amplitude)}·(e^{cos(t)} - 2·cos(4t) + sin^5(t / 12))`;
            case 'cardioid':
                return `r(t) = ${this.formatNumber(curve.a)}·(1 - cos t) + ${this.formatNumber(curve.b)}·sin(${this.formatNumber(curve.k)}t + ${this.formatNumber(curve.phase)})`;
            case 'hypotrochoid': {
                const diff = this.formatNumber(curve.R - curve.r);
                const ratio = this.formatNumber((curve.R - curve.r) / curve.r);
                return `x(t) = ${diff}·cos(t) + ${this.formatNumber(curve.d)}·cos(${ratio}t)\n` +
                    `y(t) = ${diff}·sin(t) - ${this.formatNumber(curve.d)}·sin(${ratio}t)`;
            }
            case 'cycloid': {
                const waveAmplitude = this.formatNumber(curve.waveAmplitude);
                const waveFrequency = this.formatNumber(curve.waveFrequency);
                const wavePhase = this.formatNumber(curve.wavePhase);
                const waveY = this.formatNumber(curve.waveAmplitude * 0.4);
                return `x(t) = ½·[${this.formatNumber(curve.r)}·(t - sin t) + (${this.formatNumber(curve.r + curve.d)})·t - ${this.formatNumber(curve.d)}·sin t] + ${waveAmplitude}·sin(${waveFrequency}t + ${wavePhase})\n` +
                    `y(t) = ½·[${this.formatNumber(curve.r)}·(1 - cos t) + ${this.formatNumber(curve.r + curve.d)} - ${this.formatNumber(curve.d)}·cos t] + ${this.formatNumber(curve.verticalShift)} + ${waveY}·sin(${waveFrequency}t + ${wavePhase})`;
            }
            default:
                return '';
        }
    }

    calculatePointerInfluence(curve) {
        if (!this.pointer.active || !curve || !curve.canvas) {
            return 0;
        }

        const rect = curve.canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            return 0;
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = this.pointer.x - centerX;
        const dy = this.pointer.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influenceRadius = Math.max(rect.width, rect.height) * 2.4;
        if (influenceRadius <= 0) {
            return 0;
        }

        const normalized = Math.min(1, distance / influenceRadius);
        const falloff = Math.pow(1 - normalized, this.pointerFalloff);
        return Math.max(0, falloff);
    }

    applyAmbientCellEffects(curve, pointerIntensity, hue) {
        if (!curve || !curve.cell) {
            return;
        }

        if (pointerIntensity > 0.01) {
            const brightness = 1 + pointerIntensity * 0.75;
            const saturation = 1 + pointerIntensity * 0.65;
            curve.cell.style.filter = `brightness(${brightness.toFixed(3)}) saturate(${saturation.toFixed(3)})`;
            curve.cell.style.boxShadow = `0 0 ${12 + pointerIntensity * 38}px rgba(${Math.round(80 + pointerIntensity * 90)}, ${Math.round(110 + pointerIntensity * 100)}, ${Math.round(255)}, ${0.12 + pointerIntensity * 0.35})`;
            curve.cell.style.borderColor = `hsla(${Math.round(hue)}, 100%, ${Math.round(58 + pointerIntensity * 22)}%, ${0.25 + pointerIntensity * 0.35})`;
        } else {
            if (curve.cell.style.filter) {
                curve.cell.style.filter = '';
            }
            if (curve.cell.style.boxShadow) {
                curve.cell.style.boxShadow = '';
            }
            if (curve.cell.style.borderColor) {
                curve.cell.style.borderColor = '';
            }
        }
    }

    renderHoldAura(ctx, curve, hue, pointerIntensity, elapsedSeconds) {
        if (!curve || !curve.hold) {
            return;
        }

        const intensity = Math.max(curve.hold.intensity || 0, pointerIntensity * 0.35);
        if (intensity <= 0.01) {
            return;
        }

        const width = curve.canvas.width;
        const height = curve.canvas.height;
        const x = (curve.hold.x || 0.5) * width - width / 2;
        const y = (curve.hold.y || 0.5) * height - height / 2;
        const pulse = curve.hold.active ? (0.55 + 0.45 * Math.sin((elapsedSeconds - curve.hold.start) * 4)) : 0;
        const auraIntensity = Math.min(1, intensity + Math.max(0, pulse) * 0.35);
        const radius = Math.max(width, height) * (0.28 + auraIntensity * 0.55);
        const innerRadius = Math.max(10, radius * 0.18);

        const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, radius);
        gradient.addColorStop(0, `hsla(${Math.round(hue)}, 100%, ${Math.min(88, 78 + auraIntensity * 18)}%, ${0.25 + auraIntensity * 0.25})`);
        gradient.addColorStop(0.55, `hsla(${Math.round((hue + 18) % 360)}, 90%, ${Math.min(70, 58 + auraIntensity * 18)}%, ${0.22 + auraIntensity * 0.2})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.restore();
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
        const previousHoldIntensity = curve.hold && Number.isFinite(curve.hold.intensity) ? curve.hold.intensity : 0;
        const pointerIntensity = this.calculatePointerInfluence(curve);
        const fadeAlpha = Math.max(0.035, 0.08 - pointerIntensity * 0.03 - previousHoldIntensity * 0.02);
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
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
        const combinedEnergy = 1 + pointerIntensity * 0.85 + holdIntensity * 0.65;

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
        const lineOscillation = Math.sin(elapsedSeconds * curve.lineWidthSpeed + curve.lineWidthPhase);
        const lineWidth = Math.max(
            0.38,
            (curve.lineWidthBase + holdIntensity * 0.9 + pointerIntensity * 0.75) * (1 + curve.lineWidthVariation * lineOscillation) * combinedEnergy
        );

        const saturation = Math.min(100, 68 + holdIntensity * 24 + pointerIntensity * 32);
        const lightness = Math.min(82, 52 + holdIntensity * 18 + pointerIntensity * 26);

        ctx.strokeStyle = `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const shadowBlur = 8 + holdIntensity * 18 + pointerIntensity * 24;
        const shadowLightness = Math.min(85, 60 + holdIntensity * 20 + pointerIntensity * 22);
        const shadowAlpha = Math.min(0.75, 0.18 + holdIntensity * 0.32 + pointerIntensity * 0.27);
        ctx.shadowBlur = shadowBlur;
        ctx.shadowColor = `hsla(${Math.round(hue)}, 100%, ${Math.round(shadowLightness)}%, ${shadowAlpha})`;
        ctx.stroke();

        this.renderHoldAura(ctx, curve, hue, pointerIntensity, elapsedSeconds);
        this.renderEffects(ctx, curve, elapsedSeconds);
        this.renderPointerGlow(ctx, curve, hue, pointerIntensity);
        this.applyAmbientCellEffects(curve, Math.max(pointerIntensity, holdIntensity * 0.6), hue);

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
                ctx.strokeStyle = `hsla(${Math.round(effect.hue)}, 100%, 72%, ${Math.min(0.95, alpha + 0.25)})`;
                ctx.lineWidth = 0.8 + (effect.lineWidthBoost || 1.2) * (1 - eased) * 1.8;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();
                const glow = ctx.createRadialGradient(x, y, Math.max(8, radius * 0.18), x, y, radius);
                glow.addColorStop(0, `hsla(${Math.round(effect.hue)}, 100%, 82%, ${Math.min(0.6, alpha + 0.2)})`);
                glow.addColorStop(0.65, `hsla(${Math.round((effect.hue + 15) % 360)}, 95%, 60%, ${Math.max(0, alpha - 0.1)})`);
                glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = glow;
                ctx.fillRect(-width / 2, -height / 2, width, height);
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
                    ctx.strokeStyle = `hsla(${Math.round((effect.hue + i * 12) % 360)}, 95%, 70%, ${Math.min(0.9, alpha + 0.2)})`;
                    ctx.lineWidth = 0.55 + (effect.lineWidthBoost || 1) * (1 - clamped) * 1.4;
                    ctx.stroke();
                }
                const coreRadius = Math.max(6, radius * 0.22);
                const burstGlow = ctx.createRadialGradient(x, y, coreRadius * 0.5, x, y, coreRadius * 2.6);
                burstGlow.addColorStop(0, `hsla(${Math.round(effect.hue)}, 100%, 88%, ${Math.min(0.7, alpha + 0.25)})`);
                burstGlow.addColorStop(0.6, `hsla(${Math.round((effect.hue + 24) % 360)}, 95%, 62%, ${Math.max(0.1, alpha - 0.05)})`);
                burstGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = burstGlow;
                ctx.fillRect(-width / 2, -height / 2, width, height);
            }

            ctx.restore();
            nextEffects.push(effect);
        }

        curve.effects = nextEffects;
    }

    renderPointerGlow(ctx, curve, hue, pointerIntensity) {
        if (!this.pointer.active || pointerIntensity <= 0.01) {
            return;
        }

        const rect = curve.canvas.getBoundingClientRect();
        const width = curve.canvas.width;
        const height = curve.canvas.height;
        const localX = this.pointer.x - rect.left;
        const localY = this.pointer.y - rect.top;
        const centerX = localX - width / 2;
        const centerY = localY - height / 2;
        const maxRadius = Math.max(width, height) * (0.65 + pointerIntensity * 0.45);
        const innerRadius = Math.max(12, maxRadius * (0.08 + pointerIntensity * 0.12));

        const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            innerRadius,
            centerX,
            centerY,
            maxRadius
        );
        gradient.addColorStop(0, `hsla(${Math.round(hue)}, 100%, ${Math.min(90, 78 + pointerIntensity * 22)}%, ${0.5 + pointerIntensity * 0.35})`);
        gradient.addColorStop(0.42 + pointerIntensity * 0.12, `hsla(${Math.round(hue)}, 95%, ${Math.min(70, 54 + pointerIntensity * 26)}%, ${0.18 + pointerIntensity * 0.22})`);
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
