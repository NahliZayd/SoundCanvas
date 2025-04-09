class SoundCanvas {
    constructor() {
        this.audioContext = null;
        this.source = null;
        this.analyzer = null;
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.isPlaying = false;
        this.audioElement = new Audio();
        
        this.modes = ['flower', 'orbital', 'spectrum', 'nebula', 'waveform', 'kaleidoscope', 'constellation'];
        this.mode = 'flower'; 
        this.particles = [];
        this.colorSchemes = {
            cosmic: ['#2E0F5A', '#5A1CA8', '#7A31DD', '#9D5BF0', '#CDA2FB'], 
            sunset: ['#FF7E5F', '#FEB47B', '#FFD166', '#06D6A0', '#0B5563'], 
            neon: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#FF0000'], 
            forest: ['#1A4D2E', '#4F6F52', '#86A789', '#D2E3C8', '#F5EFE6'], 
            ocean: ['#003B46', '#07575B', '#66A5AD', '#C4DFE6', '#FFFFFF'], 
            fire: ['#FF2400', '#FF6600', '#FF8C00', '#FFA500', '#FFD700'], 
            monochrome: ['#EEEEEE', '#DDDDDD', '#BBBBBB', '#999999', '#777777'] 
        };
        this.currentColorScheme = 'cosmic';
        this.historyLength = 60; 
        this.bassHistory = Array(this.historyLength).fill(0);
        this.midHistory = Array(this.historyLength).fill(0);
        this.trebleHistory = Array(this.historyLength).fill(0);
        this.volumeHistory = Array(this.historyLength).fill(0); 

        this.initializeAudio();
        this.setupEventListeners();
        this.resizeCanvas();
        this.createInitialParticles(150); 
    }

    initializeAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyzer = this.audioContext.createAnalyser();
        
        this.analyzer.fftSize = 2048;
        
        this.analyzer.smoothingTimeConstant = 0.8;
    }

    setupEventListeners() {
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('audioInput').click();
        });

        document.getElementById('audioInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                
                if (this.isPlaying) {
                    this.pause(); 
                    this.source?.disconnect(); 
                    this.source = null;
                    
                    this.ctx.fillStyle = 'rgba(10, 5, 20, 1)'; 
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.audioElement.src = event.target.result;
                    
                     this.play();
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveArtwork());

        const modeSelector = document.getElementById('visualizationMode');
        if (modeSelector) {
            
            this.modes.forEach(modeName => {
                const option = document.createElement('option');
                option.value = modeName;
                option.textContent = modeName.charAt(0).toUpperCase() + modeName.slice(1);
                modeSelector.appendChild(option);
            });
            modeSelector.value = this.mode; 
            modeSelector.addEventListener('change', (e) => {
                this.mode = e.target.value;
                
                if (this.mode === 'nebula' || this.mode === 'constellation') {
                    this.createInitialParticles(150);
                }
            });
        }

        const colorSchemeSelector = document.getElementById('colorScheme');
        if (colorSchemeSelector) {
            
            Object.keys(this.colorSchemes).forEach(schemeName => {
                const option = document.createElement('option');
                option.value = schemeName;
                option.textContent = schemeName.charAt(0).toUpperCase() + schemeName.slice(1);
                colorSchemeSelector.appendChild(option);
            });
            colorSchemeSelector.value = this.currentColorScheme; 
            colorSchemeSelector.addEventListener('change', (e) => {
                this.currentColorScheme = e.target.value;
                
                this.particles.forEach(p => p.color = this.getRandomColor());
            });
        }

        
        this.canvas.addEventListener('click', () => {
            const currentIndex = this.modes.indexOf(this.mode);
            const nextIndex = (currentIndex + 1) % this.modes.length;
            this.mode = this.modes[nextIndex];
            if (modeSelector) {
                modeSelector.value = this.mode; 
            }
             
             if (this.mode === 'nebula' || this.mode === 'constellation') {
                this.createInitialParticles(150);
            }
        });

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    async play() {
        if (this.audioElement.src && !this.isPlaying) {
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            if (!this.source || this.source.mediaElement !== this.audioElement) {
                this.source = this.audioContext.createMediaElementSource(this.audioElement);
                this.source.connect(this.analyzer);
                
                this.analyzer.connect(this.audioContext.destination);
            }
            try {
                await this.audioElement.play();
                this.isPlaying = true;
                this.draw(); 
            } catch (err) {
                console.error("Erreur lors de la lecture audio:", err);
                this.isPlaying = false; 
            }
        } else if (!this.audioElement.src) {
            console.warn("Aucun fichier audio chargé.");
            
        }
    }

    pause() {
        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
            
             cancelAnimationFrame(this.animationFrameId);
        }
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        if(this.mode === 'nebula' || this.mode === 'constellation' || this.mode === 'flower'){
             this.createInitialParticles(150);
        }
    }

    createInitialParticles(count) {
        this.particles = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                id: i, 
                x: centerX + (Math.random() - 0.5) * this.canvas.width * 0.8, 
                y: centerY + (Math.random() - 0.5) * this.canvas.height * 0.8,
                originX: centerX, 
                originY: centerY,
                size: Math.random() * 3 + 1, 
                speedX: (Math.random() - 0.5) * 1, 
                speedY: (Math.random() - 0.5) * 1,
                color: this.getRandomColor(),
                life: 100 + Math.random() * 150, 
                initialLife: 100 + Math.random() * 150,
                angle: Math.random() * Math.PI * 2, 
                orbitRadius: Math.random() * 100 + 50 
            });
        }
    }

    getRandomColor(alpha = 1) {
        const colors = this.colorSchemes[this.currentColorScheme];
        const baseColor = colors[Math.floor(Math.random() * colors.length)];
        
        if (alpha < 1) {
            let r = 0, g = 0, b = 0;
            if (baseColor.length == 4) { 
                r = parseInt(baseColor[1] + baseColor[1], 16);
                g = parseInt(baseColor[2] + baseColor[2], 16);
                b = parseInt(baseColor[3] + baseColor[3], 16);
            } else if (baseColor.length == 7) { 
                r = parseInt(baseColor[1] + baseColor[2], 16);
                g = parseInt(baseColor[3] + baseColor[4], 16);
                b = parseInt(baseColor[5] + baseColor[6], 16);
            }
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return baseColor;
    }

    draw() {
        
        if (!this.isPlaying) {
            
             this.ctx.fillStyle = 'rgba(10, 5, 20, 0.1)'; 
             this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        
        const bufferLength = this.analyzer.frequencyBinCount;
        const frequencyData = new Uint8Array(bufferLength);
        this.analyzer.getByteFrequencyData(frequencyData);

        
        const timeData = new Uint8Array(bufferLength);
        this.analyzer.getByteTimeDomainData(timeData); 

        
        
        const bassEnd = Math.floor(bufferLength * 0.05); 
        const midEnd = Math.floor(bufferLength * 0.3); 
        const trebleEnd = Math.floor(bufferLength * 0.7); 

        const bassSum = frequencyData.slice(1, bassEnd).reduce((a, b) => a + b, 0) / (bassEnd - 1);
        const midSum = frequencyData.slice(bassEnd, midEnd).reduce((a, b) => a + b, 0) / (midEnd - bassEnd);
        const trebleSum = frequencyData.slice(midEnd, trebleEnd).reduce((a, b) => a + b, 0) / (trebleEnd - midEnd);
        const overallVolume = frequencyData.reduce((a, b) => a + b, 0) / bufferLength; 

        
        this.bassHistory.push(bassSum); this.bassHistory.shift();
        this.midHistory.push(midSum); this.midHistory.shift();
        this.trebleHistory.push(trebleSum); this.trebleHistory.shift();
        this.volumeHistory.push(overallVolume); this.volumeHistory.shift();

        
        let alpha = 0.1; 
        if (this.mode === 'nebula' || this.mode === 'constellation') alpha = 0.08; 
        if (this.mode === 'spectrum' || this.mode === 'waveform') alpha = 0.3; 
        if (this.mode === 'flower') alpha = 0.15;
        if (this.mode === 'kaleidoscope') alpha = 0.2;

        this.ctx.fillStyle = `rgba(10, 5, 20, ${alpha})`; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        
        switch(this.mode) {
            case 'flower':
                this.drawFlowerMode(bassSum, midSum, trebleSum);
                break;
            case 'orbital':
                this.drawOrbitalMode(frequencyData, bassSum);
                break;
            case 'spectrum':
                this.drawSpectrumMode(frequencyData);
                break;
            case 'nebula':
                this.drawNebulaMode(frequencyData, bassSum, midSum, trebleSum);
                break;
            case 'waveform': 
                this.drawWaveformMode(timeData, overallVolume);
                break;
            case 'kaleidoscope': 
                this.drawKaleidoscopeMode(frequencyData, bassSum, midSum, trebleSum);
                break;
            case 'constellation': 
                this.drawConstellationMode(frequencyData, bassSum, midSum, trebleSum);
                break;
        }

        
        requestAnimationFrame(() => this.draw());
    }

    

    drawFlowerMode(bass, mid, treble) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const time = this.audioContext.currentTime * 0.5;
        
        
        const bassSmooth = this.getSmoothedHistoryAverage(this.bassHistory);
        const midSmooth = this.getSmoothedHistoryAverage(this.midHistory);
        const trebleSmooth = this.getSmoothedHistoryAverage(this.trebleHistory);
        
        
        const baseNumPetals = 7; 
        const numPetals = baseNumPetals + Math.floor(midSmooth / 25);
        const angleStep = (Math.PI * 2) / numPetals;
        
        
        const baseRadius = Math.min(this.canvas.width, this.canvas.height) / 5.5;
        const bassImpact = bassSmooth * 0.8; 
        const midImpact = midSmooth * 0.5;
        const trebleImpact = trebleSmooth * 0.3;
        
        
        const secondaryPulse = Math.sin(time * 1.5) * (10 + bassSmooth * 0.1);
        const tertiaryWave = Math.cos(time * 0.7) * (5 + trebleSmooth * 0.05);
        
        
        this.ctx.shadowColor = this.colorSchemes[this.currentColorScheme][0];
        this.ctx.shadowBlur = 15 + bassSmooth * 0.2;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        
        const layers = 4; 
        for (let layer = layers - 1; layer >= 0; layer--) {
            this.ctx.beginPath();
            const layerFactor = 1 - layer * 0.15; 
            const layerTimeShift = time + layer * 0.8; 
            const layerPetalOffset = layer * 0.15; 
            
            
            let angle = -Math.PI / 2 + layerPetalOffset;
            let radius = this.calculateFlowerRadius(angle, layerTimeShift, baseRadius, bassImpact, midImpact, trebleImpact, numPetals) * layerFactor;
            let startX = centerX + Math.cos(angle) * radius;
            let startY = centerY + Math.sin(angle) * radius;
            this.ctx.moveTo(startX, startY);
            
            
            for (let i = 0; i <= numPetals; i++) {
                
                const petalVariation = Math.sin(i * 2.7 + time) * 0.15;
                
                
                const angle1 = angle + angleStep * 0.35;
                const radius1 = this.calculateFlowerRadius(angle1, layerTimeShift, baseRadius, 
                                bassImpact, midImpact, trebleImpact, numPetals) * 
                                layerFactor * (0.7 + petalVariation * 0.1); 
                const x1 = centerX + Math.cos(angle1) * radius1;
                const y1 = centerY + Math.sin(angle1) * radius1;
                
                
                const angle1b = angle + angleStep * 0.65; 
                const radius1b = this.calculateFlowerRadius(angle1b, layerTimeShift, baseRadius,
                                 bassImpact, midImpact, trebleImpact, numPetals) *
                                 layerFactor * (0.75 + petalVariation * 0.15);
                const x1b = centerX + Math.cos(angle1b) * radius1b;
                const y1b = centerY + Math.sin(angle1b) * radius1b;
                
                
                const angle2 = angle + angleStep;
                const radius2 = this.calculateFlowerRadius(angle2, layerTimeShift, baseRadius,
                                bassImpact, midImpact, trebleImpact, numPetals) * layerFactor;
                const x2 = centerX + Math.cos(angle2) * radius2;
                const y2 = centerY + Math.sin(angle2) * radius2;
                
                
                const cp1x = centerX + Math.cos(angle + angleStep * 0.25) * radius1 * (1.2 + petalVariation);
                const cp1y = centerY + Math.sin(angle + angleStep * 0.25) * radius1 * (1.2 + petalVariation);
                const cp2x = centerX + Math.cos(angle + angleStep * 0.75) * radius2 * (1.2 - petalVariation);
                const cp2y = centerY + Math.sin(angle + angleStep * 0.75) * radius2 * (1.2 - petalVariation);
                
                this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
                
                angle = angle2; 
            }
            
            
            const colors = this.colorSchemes[this.currentColorScheme];
            const gradientRadius = baseRadius * 3 * layerFactor;
            
            
            const gradOffsetX = Math.sin(time * 0.8) * (bassSmooth * 0.15);
            const gradOffsetY = Math.cos(time * 0.6) * (midSmooth * 0.1);
            
            const gradient = this.ctx.createRadialGradient(
                centerX + gradOffsetX, centerY + gradOffsetY, baseRadius * 0.1,
                centerX - gradOffsetX * 0.5, centerY - gradOffsetY * 0.5, gradientRadius
            );
            
            
            const baseColor = layer % 2 === 0 ? 0 : 1; 
            const petalHue = (time * 10) % 360; 
            
            gradient.addColorStop(0, this.adjustColorOpacity(colors[baseColor], 0.9 - layer * 0.15));
            gradient.addColorStop(0.4, this.adjustColorOpacity(colors[(baseColor + 1) % colors.length], 0.7 - layer * 0.1));
            gradient.addColorStop(0.7, this.adjustColorOpacity(colors[(baseColor + 2) % colors.length], 0.5 - layer * 0.05));
            gradient.addColorStop(1, this.adjustColorOpacity(colors[(baseColor + 3) % colors.length], 0.3 - layer * 0.05));
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            
            const glowIntensity = 0.3 + (trebleSmooth / 255) * 0.5;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.8, glowIntensity) - layer * 0.1})`;
            this.ctx.lineWidth = 2 - layer * 0.3;
            this.ctx.stroke();
        }
        
        
        this.ctx.shadowBlur = 0;
        
        
        const centerSize = 18 + bassImpact * 0.2 + Math.sin(time * 3.5) * 6;
        
        
        const glowSize = centerSize * (1.5 + Math.sin(time * 2) * 0.3);
        const centerGlow = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, glowSize
        );
        const primaryColor = this.colorSchemes[this.currentColorScheme][0];
        const secondaryColor = this.colorSchemes[this.currentColorScheme][1];
        
        centerGlow.addColorStop(0, this.adjustColorOpacity(primaryColor, 0.9));
        centerGlow.addColorStop(0.5, this.adjustColorOpacity(secondaryColor, 0.7));
        centerGlow.addColorStop(0.8, this.adjustColorOpacity(secondaryColor, 0.4));
        centerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
        this.ctx.fillStyle = centerGlow;
        this.ctx.fill();
        
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, centerSize, 0, Math.PI * 2);
        
        const innerGradient = this.ctx.createRadialGradient(
            centerX - centerSize * 0.3, centerY - centerSize * 0.3, centerSize * 0.1,
            centerX, centerY, centerSize
        );
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        innerGradient.addColorStop(0.5, this.adjustColorOpacity(primaryColor, 0.8));
        innerGradient.addColorStop(1, this.adjustColorOpacity(secondaryColor, 0.7));
        
        this.ctx.fillStyle = innerGradient;
        this.ctx.fill();
        
        
        if (bassSmooth > 100) {
            const stamenCount = 8 + Math.floor(midSmooth / 30);
            for (let i = 0; i < stamenCount; i++) {
                const stamenAngle = (i / stamenCount) * Math.PI * 2 + time * 0.2;
                const stamenLength = centerSize * 0.8 + Math.sin(time * 4 + i) * 3;
                const stamenWidth = 1 + (trebleSmooth / 255) * 2;
                
                const tipX = centerX + Math.cos(stamenAngle) * stamenLength;
                const tipY = centerY + Math.sin(stamenAngle) * stamenLength;
                
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(tipX, tipY);
                this.ctx.lineWidth = stamenWidth;
                this.ctx.strokeStyle = this.colorSchemes[this.currentColorScheme][4];
                this.ctx.stroke();
                
                
                this.ctx.beginPath();
                this.ctx.arc(tipX, tipY, stamenWidth * 2, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.fill();
            }
        }
        
        
        this.drawEnhancedFlowerParticles(bassSmooth, midSmooth, trebleSmooth, centerX, centerY);
    }
    
    calculateFlowerRadius(angle, time, baseRadius, bass, mid, treble, numPetals) {
        
        const mainShape = Math.sin(angle * numPetals) * mid * 0.6;
        const secondaryShape = Math.sin(angle * (numPetals/2 + 1) + time) * mid * 0.3;
        
        
        const bassPulse = bass * (0.4 + Math.sin(time * 1.5 + angle * 0.5) * 0.2);
        const slowPulse = Math.sin(time * 0.3) * baseRadius * 0.15;
        
        
        const trebleDetail = Math.cos(angle * numPetals * 2 + time * 4) * treble * 0.15;
        const microDetail = Math.sin(angle * numPetals * 4 + time * 7) * treble * 0.05;
        
        
        const asymmetry = Math.cos(angle + time * 0.2) * baseRadius * 0.08;
        
        return baseRadius + mainShape + secondaryShape + bassPulse + 
               slowPulse + trebleDetail + microDetail + asymmetry;
    }
    
    adjustColorOpacity(color, opacity) {
        
        if (color.startsWith('rgba')) {
            return color.replace(/[\d\.]+\)$/, `${opacity})`);
        }
        
        else if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        else if (color.startsWith('rgb(')) {
            return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
        }

        return `rgba(255, 255, 255, ${opacity})`;
    }
    
    drawEnhancedFlowerParticles(bassSmooth, midSmooth, trebleSmooth, centerX, centerY) {
        const particleCount = Math.min(this.particles.length / 2, 100); 
        const maxRadius = Math.min(this.canvas.width, this.canvas.height) / 2;
        const time = this.audioContext.currentTime;
        
        
        const bassIntensity = bassSmooth / 255;
        const particleSpeed = 0.5 + bassIntensity * 2;
        
        
        this.ctx.globalCompositeOperation = 'lighter';
        
        for (let i = 0; i < particleCount; i++) {
            const p = this.particles[i];
            
            
            
            const dx = centerX - p.x;
            const dy = centerY - p.y;
            const distFromCenter = Math.sqrt(dx * dx + dy * dy);
            
            
            const forceFactor = (bassIntensity > 0.7) ? -0.01 : 0.02;
            let forceX = 0; 
            let forceY = 0;

            
            if (distFromCenter > 0.01) { 
                 forceX = (dx / distFromCenter) * forceFactor;
                 forceY = (dy / distFromCenter) * forceFactor;
            }
            

            
            p.vx += forceX;
            p.vy += forceY;
            
            
            p.vx *= 0.98;
            p.vy *= 0.98;
            
            
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > particleSpeed) {
                p.vx = (p.vx / speed) * particleSpeed;
                p.vy = (p.vy / speed) * particleSpeed;
            }
            
            
            p.x += p.vx;
            p.y += p.vy;
            
            
            p.life -= 0.5 + bassIntensity;
            if (p.life <= 0 || distFromCenter > maxRadius || Math.random() < 0.001) {
                
                const spawnRadius = 20 + Math.random() * 40;
                const spawnAngle = Math.random() * Math.PI * 2;
                p.x = centerX + Math.cos(spawnAngle) * spawnRadius;
                p.y = centerY + Math.sin(spawnAngle) * spawnRadius;
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = (Math.random() - 0.5) * 2;
                p.life = p.initialLife = 50 + Math.random() * 100;
                p.size = 1 + Math.random() * 3;
                p.color = this.getRandomColor();
            }
            
            
            const lifeRatio = p.life / p.initialLife;
            const alpha = Math.max(0, lifeRatio * 0.7); 
            
            
            const sizeBoost = (trebleSmooth / 255) * 2;
            
            const baseSizeFactor = Math.max(0, 0.5 + lifeRatio * 0.5); 
            const boostFactor = Math.max(0, 1 + sizeBoost); 
            let size = p.size * boostFactor * baseSizeFactor;
            size = Math.max(0.1, size); 
            
            
            
            const trailLength = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 8;
            if (trailLength > 1) {
                const trailX = p.x - p.vx * trailLength;
                const trailY = p.y - p.vy * trailLength;
                
                const trailGradient = this.ctx.createLinearGradient(
                    p.x, p.y, trailX, trailY
                );
                trailGradient.addColorStop(0, this.adjustColorOpacity(p.color, alpha));
                trailGradient.addColorStop(1, 'rgba(255,255,255,0)');
                
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(trailX, trailY);
                this.ctx.lineWidth = size;
                this.ctx.strokeStyle = trailGradient;
                this.ctx.lineCap = 'round';
                this.ctx.stroke();
            }
            
            
            
            if (isFinite(p.x) && isFinite(p.y) && isFinite(size) && size > 0) {
                const glow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
                glow.addColorStop(0, 'rgba(255, 255, 255, ' + alpha + ')');
                glow.addColorStop(0.5, this.adjustColorOpacity(p.color, alpha * 0.8));
                glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                this.ctx.fillStyle = glow;
                this.ctx.fill();
            } else {
                 
                 
            }
        }
        
        
        this.ctx.globalCompositeOperation = 'source-over';
    }

  
    drawOrbitalMode(frequencyData, bassSum) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = this.audioContext.currentTime;

        const maxOrbitRadius = Math.min(centerX, centerY) * 0.8;
        const numOrbits = 5;

        
        const smoothedBass = this.getSmoothedHistoryAverage(this.bassHistory);
        const starBaseSize = 20;
        const starPulse = smoothedBass / 10;
        const starSize = starBaseSize + starPulse;
        const starGlow = starSize * 2 + smoothedBass / 5;

        
        const starGlowGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, starGlow);
        const colors = this.colorSchemes[this.currentColorScheme];
        starGlowGradient.addColorStop(0, colors[0] + 'FF'); 
        starGlowGradient.addColorStop(0.3, colors[1] + 'AA');
        starGlowGradient.addColorStop(0.7, colors[2] + '66');
        starGlowGradient.addColorStop(1, colors[3] + '00'); 

        this.ctx.fillStyle = starGlowGradient;
        this.ctx.fillRect(centerX - starGlow, centerY - starGlow, starGlow * 2, starGlow * 2); 

        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, starSize, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; 
        this.ctx.fill();


        
        const dataStep = Math.floor(frequencyData.length / 2 / numOrbits); 
        for (let i = 0; i < numOrbits; i++) {
            const orbitRadius = (maxOrbitRadius / numOrbits) * (i + 1) * (0.8 + Math.sin(time * 0.1 + i) * 0.1); 
            const freqIndex = Math.min(frequencyData.length -1, i * dataStep + 10); 
            const avgFreq = (frequencyData[freqIndex] + frequencyData[freqIndex + 1] + frequencyData[freqIndex + 2]) / 3; 
            const orbitThickness = 1 + avgFreq / 80; 

            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = this.getRandomColor(0.3 + avgFreq/300); 
            this.ctx.lineWidth = orbitThickness;
            this.ctx.stroke();

            
            const numPlanets = 2 + i;
            const planetBaseSize = 4;
            const planetPulse = avgFreq / 30; 
            const planetSize = planetBaseSize + planetPulse;
            const orbitSpeed = 0.1 + (numOrbits - i) * 0.05; 

            for (let j = 0; j < numPlanets; j++) {
                const angle = (j / numPlanets) * Math.PI * 2 + time * orbitSpeed + i * 0.5;
                const px = centerX + Math.cos(angle) * orbitRadius;
                const py = centerY + Math.sin(angle) * orbitRadius;

                
                this.ctx.beginPath();
                this.ctx.arc(px, py, planetSize, 0, Math.PI * 2);
                this.ctx.fillStyle = this.colorSchemes[this.currentColorScheme][(i + j) % colors.length];
                this.ctx.fill();

                
                if (planetSize > 7) {
                    const numMoons = Math.floor(planetSize / 4);
                    const moonBaseDistance = planetSize * 1.5;
                    const moonSpeed = orbitSpeed * 3;

                    for (let k = 0; k < numMoons; k++) {
                         const moonAngle = angle + time * moonSpeed * (k % 2 === 0 ? 1 : -1) + k * Math.PI / numMoons; 
                         const moonDistance = moonBaseDistance + k * 3 + Math.sin(time*2 + k)*2; 
                         const moonSize = Math.max(1, planetSize / 4 - k); 

                         const mx = px + Math.cos(moonAngle) * moonDistance;
                         const my = py + Math.sin(moonAngle) * moonDistance;

                         this.ctx.beginPath();
                         this.ctx.arc(mx, my, moonSize, 0, Math.PI * 2);
                         this.ctx.fillStyle = this.getRandomColor(0.7); 
                         this.ctx.fill();
                    }
                }
            }
        }
    }

    drawSpectrumMode(frequencyData) {
        const numBars = 256; 
        const barWidth = this.canvas.width / numBars;
        const centerY = this.canvas.height / 2;
        const dataStep = Math.floor(frequencyData.length / numBars); 
        const colors = this.colorSchemes[this.currentColorScheme];

        const smoothedVolume = this.getSmoothedHistoryAverage(this.volumeHistory);
        const heightMultiplier = (this.canvas.height / 2) / 200; 

        for (let i = 0; i < numBars; i++) {
            const dataIndex = Math.min(frequencyData.length - 1, i * dataStep);
            
            const barValue = (frequencyData[dataIndex] + (frequencyData[dataIndex+1] || 0)) / 2;
            const barHeight = barValue * heightMultiplier * (0.5 + smoothedVolume / 150); 

            const x = i * barWidth;

            
            const colorIndex = Math.floor((i / numBars) * colors.length);
            const barColor = colors[colorIndex % colors.length];

            
             const gradientTop = this.ctx.createLinearGradient(x, centerY - barHeight, x, centerY);
             gradientTop.addColorStop(0, barColor);
             gradientTop.addColorStop(1, this.getRandomColor(0.8)); 
            this.ctx.fillStyle = gradientTop;
            this.ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight);

            
            const mirrorHeight = barHeight * 0.6;
            const gradientBottom = this.ctx.createLinearGradient(x, centerY, x, centerY + mirrorHeight);
             gradientBottom.addColorStop(0, this.getRandomColor(0.6)); 
             gradientBottom.addColorStop(1, this.getRandomColor(0.1)); 
            this.ctx.fillStyle = gradientBottom;
            this.ctx.fillRect(x, centerY + 1, barWidth - 1, mirrorHeight); 

            
            if (barHeight > centerY * 0.7) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.6, barHeight / centerY - 0.5)})`;
                this.ctx.fillRect(x, centerY - barHeight - 3, barWidth - 1, 3); 
            }
        }

        
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(this.canvas.width, centerY);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
    }


    drawNebulaMode(frequencyData, bass, mid, treble) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = this.audioContext.currentTime;

        
        const overallIntensity = (bass + mid + treble) / 3 / 150; 

        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            
            const dxCenter = centerX - p.x;
            const dyCenter = centerY - p.y;
            const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
            const bassForce = (bass / 10000) * (distCenter < 200 ? -1 : 1) * (1 - distCenter / (this.canvas.width/2)); 
            p.speedX += dxCenter / distCenter * bassForce;
            p.speedY += dyCenter / distCenter * bassForce;

             
             const midForce = (mid / 8000);
             p.speedX += -dyCenter / distCenter * midForce * Math.sin(time + i * 0.1);
             p.speedY += dxCenter / distCenter * midForce * Math.sin(time + i * 0.1);

             
             p.speedX += (Math.random() - 0.5) * (treble / 200);
             p.speedY += (Math.random() - 0.5) * (treble / 200);

             
             p.speedX *= 0.97;
             p.speedY *= 0.97;

             
             p.x += p.speedX;
             p.y += p.speedY;


             
             const freqIndex = Math.min(frequencyData.length - 1, Math.floor(p.id * frequencyData.length / this.particles.length));
             const freqValue = frequencyData[freqIndex] / 255;
             const size = p.size * (1 + freqValue * 2 + overallIntensity);
             p.life -= 0.1 + overallIntensity * 0.5; 

             
             if (p.life <= 0 || p.x < -size || p.x > this.canvas.width + size || p.y < -size || p.y > this.canvas.height + size) {
                 this.resetParticle(p, centerX, centerY);
             }

             
             const alpha = Math.min(1, p.life / 50) * (0.3 + freqValue * 0.7); 
             
             const haloSize = size * 3;
             const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloSize);
             gradient.addColorStop(0, this.getRandomColor(alpha * 0.8)); 
             gradient.addColorStop(0.5, this.getRandomColor(alpha * 0.4));
             gradient.addColorStop(1, this.getRandomColor(0));
             this.ctx.fillStyle = gradient;
             this.ctx.fillRect(p.x - haloSize, p.y - haloSize, haloSize * 2, haloSize * 2);

             
             
             this.ctx.beginPath();
             this.ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
             this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
             this.ctx.fill();
             
        }

        
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.4, overallIntensity * 0.8)})`; 
        this.ctx.lineWidth = 0.5;
        const connectDistance = 80 + mid * 0.2; 

        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            for (let j = i + 1; j < this.particles.length; j++) {
                
                if (j % 5 !== 0) continue;

                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectDistance) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    
                    this.ctx.globalAlpha = (1 - distance / connectDistance) * 0.5;
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1.0; 
                }
            }
        }
    }

    drawWaveformMode(timeData, overallVolume) {
        const bufferLength = this.analyzer.frequencyBinCount; 
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const sliceWidth = this.canvas.width / bufferLength;

        
        const colors = this.colorSchemes[this.currentColorScheme];
        this.ctx.lineWidth = 2 + overallVolume / 30; 
        this.ctx.strokeStyle = colors[0]; 

        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY); 

        for (let i = 0; i < bufferLength; i++) {
            
            const v = timeData[i] / 128.0; 
            const y = (v - 1.0) * centerY * 0.8 + centerY; 

            const x = i * sliceWidth;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        
        this.ctx.lineTo(this.canvas.width, centerY); 
        this.ctx.stroke();

        
        this.ctx.lineWidth = (2 + overallVolume / 30) * 3; 
        this.ctx.strokeStyle = this.getRandomColor(0.3); 
        this.ctx.stroke(); 
    }

    drawKaleidoscopeMode(frequencyData, bass, mid, treble) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = this.audioContext.currentTime;
        const numSegments = 8; 
        const angleSlice = (Math.PI * 2) / numSegments;

        const smoothedBass = this.getSmoothedHistoryAverage(this.bassHistory);
        const smoothedMid = this.getSmoothedHistoryAverage(this.midHistory);
        const smoothedTreble = this.getSmoothedHistoryAverage(this.trebleHistory);

        for (let i = 0; i < numSegments; i++) {
            this.ctx.save(); 

            
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(i * angleSlice);

            
            if (i % 2 !== 0) {
                this.ctx.scale(1, -1); 
            }

            
            
            

            const maxRadius = Math.min(centerX, centerY) * 1.2; 
            const numShapes = 10; 
            const freqStep = Math.floor(frequencyData.length / numShapes / 2);

            for (let j = 0; j < numShapes; j++) {
                const freqIndex = Math.min(frequencyData.length - 1, j * freqStep);
                const freqValue = frequencyData[freqIndex] / 255; 
                const shapeRadius = freqValue * maxRadius * (0.5 + smoothedBass / 200);
                const startAngle = time * 0.5 + j * 0.1 + Math.sin(time + i) * 0.1; 
                const endAngle = startAngle + Math.PI / 4 + smoothedMid / 100; 
                const lineWidth = 1 + smoothedTreble / 50; 

                
                const color = this.colorSchemes[this.currentColorScheme][j % this.colorSchemes[this.currentColorScheme].length];

                
                this.ctx.beginPath();
                this.ctx.arc(0, 0, shapeRadius, startAngle, endAngle); 
                this.ctx.strokeStyle = this.getRandomColor(0.6 + freqValue * 0.4);
                this.ctx.lineWidth = lineWidth;
                this.ctx.stroke();

                
                if (j % 3 === 0) {
                     this.ctx.beginPath();
                     this.ctx.moveTo(0, 0);
                     const lineX = Math.cos(startAngle + Math.PI / 8) * shapeRadius * 1.2;
                     const lineY = Math.sin(startAngle + Math.PI / 8) * shapeRadius * 1.2;
                     this.ctx.lineTo(lineX, lineY);
                     this.ctx.strokeStyle = this.getRandomColor(0.4);
                     this.ctx.lineWidth = lineWidth * 0.5;
                     this.ctx.stroke();
                }
            }
            

            this.ctx.restore(); 
        }
    }


    drawConstellationMode(frequencyData, bass, mid, treble) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const time = this.audioContext.currentTime;
        const maxRadius = Math.min(centerX, centerY) * 0.9;
        const colors = this.colorSchemes[this.currentColorScheme];

        
        const stars = [];
        const peakThreshold = 80 + this.getSmoothedHistoryAverage(this.volumeHistory) / 3; 
        const minPeakDistance = 5; 
        let lastPeakIndex = -minPeakDistance;

        for (let i = 1; i < frequencyData.length / 2 - 1; i++) { 
            
            if (frequencyData[i] > peakThreshold &&
                frequencyData[i] > frequencyData[i-1] &&
                frequencyData[i] > frequencyData[i+1] &&
                i > lastPeakIndex + minPeakDistance)
            {
                const freqRatio = i / (frequencyData.length / 2); 
                const magnitude = frequencyData[i] / 255; 

                
                const angle = freqRatio * Math.PI * 4 + time * 0.05; 
                const radius = magnitude * maxRadius * (0.5 + this.getSmoothedHistoryAverage(this.bassHistory)/200); 

                
                const wobbleX = Math.sin(time * 2 + i) * 5;
                const wobbleY = Math.cos(time * 1.5 + i) * 5;

                stars.push({
                    x: centerX + Math.cos(angle) * radius + wobbleX,
                    y: centerY + Math.sin(angle) * radius + wobbleY,
                    size: 1 + magnitude * 5 + this.getSmoothedHistoryAverage(this.trebleHistory)/30, 
                    brightness: magnitude,
                    color: colors[i % colors.length] 
                });
                lastPeakIndex = i;
            }
        }

        
        stars.forEach(star => {
            
             const glowSize = star.size * 3;
             const gradient = this.ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize);
             gradient.addColorStop(0, star.color + 'AA'); 
             gradient.addColorStop(0.5, star.color + '66');
             gradient.addColorStop(1, star.color + '00');
             this.ctx.fillStyle = gradient;
             this.ctx.fillRect(star.x - glowSize, star.y - glowSize, glowSize * 2, glowSize * 2);

             
             this.ctx.beginPath();
             this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
             this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + star.brightness * 0.5})`; 
             this.ctx.fill();
        });

        
        const connectDistance = 100 + this.getSmoothedHistoryAverage(this.midHistory) * 0.5; 
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + this.getSmoothedHistoryAverage(this.volumeHistory) / 300})`; 
        this.ctx.lineWidth = 0.8;

        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                 
                 

                 const s1 = stars[i];
                 const s2 = stars[j];
                 const dx = s1.x - s2.x;
                 const dy = s1.y - s2.y;
                 const distance = Math.sqrt(dx * dx + dy * dy);

                 if (distance < connectDistance) {
                     this.ctx.beginPath();
                     this.ctx.moveTo(s1.x, s1.y);
                     this.ctx.lineTo(s2.x, s2.y);
                     
                     this.ctx.globalAlpha = (1 - distance / connectDistance) * 0.6;
                     this.ctx.stroke();
                     this.ctx.globalAlpha = 1.0; 
                 }
            }
        }

         
         this.drawNebulaBackgroundParticles(bass, mid, treble);

    }

     drawNebulaBackgroundParticles(bass, mid, treble) {
        const particleCount = this.particles.length; 
        const intensity = (bass + mid + treble) / 3 / 255;

        for (let i = 0; i < particleCount; i++) {
            const p = this.particles[i];

            
            p.x += p.speedX * 0.5 + (Math.random() - 0.5) * 0.2;
            p.y += p.speedY * 0.5 + (Math.random() - 0.5) * 0.2;
            p.speedX *= 0.95; 
            p.speedY *= 0.95;

            
            const size = p.size * 0.3 * (1 + intensity * 0.5);

            
            p.life -= 0.05;
            if (p.life <= 0 || p.x < 0 || p.x > this.canvas.width || p.y < 0 || p.y > this.canvas.height) {
                 this.resetParticle(p, this.canvas.width / 2, this.canvas.height / 2, true); 
            }

            
            const alpha = Math.min(1, p.life / 50) * 0.3 * (0.5 + intensity); 
            this.ctx.fillStyle = this.getRandomColor(alpha);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }


    

    getSmoothedHistoryAverage(historyArray) {
        
        let weightedSum = 0;
        let weightSum = 0;
        const len = historyArray.length;
        for(let i = 0; i < len; i++) {
            const weight = (i + 1) / len; 
            weightedSum += historyArray[i] * weight;
            weightSum += weight;
        }
        return weightSum > 0 ? weightedSum / weightSum : 0;
        
        
    }

    resetParticle(p, centerX, centerY, isBackground = false) {
        if (isBackground) {
             
             p.x = Math.random() * this.canvas.width;
             p.y = Math.random() * this.canvas.height;
             p.speedX = (Math.random() - 0.5) * 0.2;
             p.speedY = (Math.random() - 0.5) * 0.2;
        } else {
             
             p.x = centerX + (Math.random() - 0.5) * 100;
             p.y = centerY + (Math.random() - 0.5) * 100;
             p.speedX = (Math.random() - 0.5) * 1;
             p.speedY = (Math.random() - 0.5) * 1;
        }
        p.life = p.initialLife * (0.8 + Math.random() * 0.4); 
        p.color = this.getRandomColor();
        p.orbitRadius = Math.random() * 100 + 50; 
        p.angle = Math.random() * Math.PI * 2;
    }

    saveArtwork() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        
        tempCtx.fillStyle = '#0A0514'; 
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        tempCtx.drawImage(this.canvas, 0, 0);
        
        const link = document.createElement('a');
        link.download = `soundcanvas-${this.mode}-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png'); 
        link.click(); 
    }
}


document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('visualizer')) {
        new SoundCanvas();
    } else {
        console.error("L'élément Canvas avec l'ID 'visualizer' est introuvable.");
    }
});