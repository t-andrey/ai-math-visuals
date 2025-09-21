class ParametricCurveGallery {
    constructor() {
        this.gallery = document.getElementById('gallery');
        this.curves = [];
        this.animationId = null;
        this.init();
    }

    init() {
        this.createCurves();
        this.startAnimation();
    }

    createCurves() {
        // Calculate grid size to fit hundreds of curves
        const cellCount = Math.floor((window.innerWidth * window.innerHeight) / (150 * 150));
        const targetCount = Math.min(Math.max(cellCount, 100), 500); // Between 100-500 curves

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

        const curveData = this.generateRandomCurve();
        this.curves.push({
            canvas,
            ctx: canvas.getContext('2d'),
            info,
            ...curveData
        });

        info.textContent = curveData.name;
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
        const random = (min, max) => Math.random() * (max - min) + min;
        
        switch (type) {
            case 'lissajous':
                return {
                    type: 'lissajous',
                    name: 'Lissajous',
                    a: random(1, 5),
                    b: random(1, 5),
                    delta: random(0, Math.PI * 2),
                    amplitude: random(30, 70)
                };
                
            case 'spirograph':
                return {
                    type: 'spirograph',
                    name: 'Spirograph',
                    R: random(20, 40),
                    r: random(5, 15),
                    d: random(5, 20),
                    amplitude: 1
                };
                
            case 'lame':
                return {
                    type: 'lame',
                    name: 'Lamé Curve',
                    a: random(20, 50),
                    b: random(20, 50),
                    n: random(0.5, 3),
                    amplitude: 1
                };
                
            case 'polynomial':
                return {
                    type: 'polynomial',
                    name: 'Polynomial',
                    coeffs: Array.from({length: 4}, () => random(-2, 2)),
                    amplitude: random(20, 50)
                };
                
            case 'trigSum':
                return {
                    type: 'trigSum',
                    name: 'Trig Sum',
                    freqs: Array.from({length: 3}, () => random(1, 8)),
                    phases: Array.from({length: 3}, () => random(0, Math.PI * 2)),
                    amplitude: random(30, 60)
                };
                
            case 'harmonograph':
                return {
                    type: 'harmonograph',
                    name: 'Harmonograph',
                    f1: random(1, 4),
                    f2: random(1, 4),
                    f3: random(1, 4),
                    f4: random(1, 4),
                    p1: random(0, Math.PI * 2),
                    p2: random(0, Math.PI * 2),
                    p3: random(0, Math.PI * 2),
                    p4: random(0, Math.PI * 2),
                    d1: random(0.001, 0.01),
                    d2: random(0.001, 0.01),
                    d3: random(0.001, 0.01),
                    d4: random(0.001, 0.01),
                    amplitude: random(30, 60)
                };
                
            case 'rose':
                return {
                    type: 'rose',
                    name: 'Rose Curve',
                    n: random(2, 8),
                    d: Math.floor(random(1, 5)),
                    amplitude: random(30, 60)
                };
                
            case 'epitrochoid':
                return {
                    type: 'epitrochoid',
                    name: 'Epitrochoid',
                    R: random(20, 40),
                    r: random(5, 15),
                    d: random(10, 25),
                    amplitude: 1
                };
                
            case 'butterfly':
                return {
                    type: 'butterfly',
                    name: 'Butterfly',
                    amplitude: random(40, 70)
                };
                
            case 'cardioid':
                return {
                    type: 'cardioid',
                    name: 'Cardioid',
                    a: random(20, 50),
                    amplitude: 1
                };
                
            case 'hypotrochoid':
                return {
                    type: 'hypotrochoid',
                    name: 'Hypotrochoid',
                    R: random(30, 50),
                    r: random(5, 20),
                    d: random(5, 25),
                    amplitude: 1
                };
                
            case 'cycloid':
                return {
                    type: 'cycloid',
                    name: 'Cycloid',
                    r: random(10, 30),
                    amplitude: 1
                };
                
            default:
                return this.generateCurveParams('lissajous');
        }
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
                let x = 0, y = 0;
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
                let sumX = 0, sumY = 0;
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

    drawCurve(curve, time) {
        const { ctx, canvas } = curve;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Generate color based on time and curve parameters
        const hue = (time * 50 + curve.type.charCodeAt(0) * 10) % 360;
        const saturation = 70;
        const lightness = 50;
        
        ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        let firstPoint = true;
        
        const steps = 1000;
        const timeOffset = time * 0.01;
        
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * Math.PI * 4 + timeOffset;
            const point = this.getParametricPoint(curve, t);
            
            const x = centerX + point.x;
            const y = centerY + point.y;
            
            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }

    animate(time) {
        this.curves.forEach(curve => {
            this.drawCurve(curve, time);
        });
        
        this.animationId = requestAnimationFrame((newTime) => this.animate(newTime));
    }

    startAnimation() {
        this.animate(0);
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Initialize the gallery when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ParametricCurveGallery();
});

// Handle window resize
window.addEventListener('resize', () => {
    location.reload(); // Simple approach to handle resize
});