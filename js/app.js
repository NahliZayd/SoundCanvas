class SoundCanvas {
    constructor() {
        this.audioContext = null;
        this.source = null;
        this.analyzer = null;
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.isPlaying = false;
        this.audioElement = new Audio();
        
        this.initializeAudio();
        this.setupEventListeners();
        this.resizeCanvas();
    }

    initializeAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = 2048;
    }

    setupEventListeners() {
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('audioInput').click();
        });

        document.getElementById('audioInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.audioElement.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveArtwork());

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    async play() {
        if (!this.isPlaying) {
            await this.audioContext.resume();
            if (!this.source) {
                this.source = this.audioContext.createMediaElementSource(this.audioElement);
                this.source.connect(this.analyzer);
                this.analyzer.connect(this.audioContext.destination);
            }
            this.audioElement.play();
            this.isPlaying = true;
            this.draw();
        }
    }

    pause() {
        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
        }
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    draw() {
        if (!this.isPlaying) return;

        const bufferLength = this.analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyzer.getByteFrequencyData(dataArray);

        this.ctx.fillStyle = 'rgba(26, 26, 26, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const barWidth = (this.canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] * 2;

            const hue = (i / bufferLength) * 360;
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }

        requestAnimationFrame(() => this.draw());
    }

    saveArtwork() {
        const link = document.createElement('a');
        link.download = 'soundcanvas-artwork.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SoundCanvas();
});
