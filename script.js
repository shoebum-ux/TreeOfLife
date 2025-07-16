class RevealPainter {
    constructor() {
        this.revealCanvas = document.getElementById('revealCanvas');
        this.revealCtx = this.revealCanvas.getContext('2d');
        this.baseCanvas = document.getElementById('baseCanvas');
        this.baseCtx = this.baseCanvas.getContext('2d');
        
        // Settings for reveal effect
        this.brushSize = 40; // Reduced by 50%
        this.revealStrength = 1.0;
        this.fadeOpacity = 0.25; // Increased opacity for better visibility (15% + 10%)
        this.fadeOutDuration = 3900; // 3.9 second fade out (30% longer)
        this.revealedAreas = []; // Track revealed areas with timestamps
        
        // Image properties
        this.image = null;
        this.imageLoaded = false;
        this.initialAnimationComplete = false;
        this.initialAnimationDuration = 3000; // 3 seconds for complete formation
        
        this.loadImage();
        this.bindEvents();
        this.startFadeOutLoop();
    }
    
    loadImage() {
        console.log('Loading TreeOfLifeColoredMin.png...');
        
        // Show loading effect
        this.showLoadingState();
        
        this.image = new Image();
        this.image.onload = () => {
            console.log('Image loaded successfully! Dimensions:', this.image.width, 'x', this.image.height);
            this.setupCanvases();
            this.drawInitialImage();
            this.imageLoaded = true;
            this.hideLoadingState();
            this.startInitialAnimation();
        };
        
        this.image.onerror = () => {
            console.error('Failed to load TreeOfLifeColoredMin.png');
            this.showErrorState();
        };
        
        this.image.src = 'TreeOfLifeColoredMin.png';
    }
    
    setupCanvases() {
        // Calculate canvas size to fit the image while maintaining aspect ratio
        const maxWidth = Math.min(window.innerWidth * 0.9, 900);
        const maxHeight = Math.min(window.innerHeight * 0.7, 700);
        
        const scale = Math.min(
            maxWidth / this.image.width,
            maxHeight / this.image.height
        );
        
        const canvasWidth = this.image.width * scale;
        const canvasHeight = this.image.height * scale;
        
        // Set both canvases to the same size
        this.revealCanvas.width = canvasWidth;
        this.revealCanvas.height = canvasHeight;
        this.baseCanvas.width = canvasWidth;
        this.baseCanvas.height = canvasHeight;
        
        console.log('Canvas setup - Size:', canvasWidth, 'x', canvasHeight, 'Scale:', scale);
    }
    
    drawInitialImage() {
        // Clear both canvases
        this.baseCtx.clearRect(0, 0, this.baseCanvas.width, this.baseCanvas.height);
        this.revealCtx.clearRect(0, 0, this.revealCanvas.width, this.revealCanvas.height);
        
        // Don't draw the base image yet - it will be formed by the bleeding animation
        // Setup reveal canvas for "destination-in" blending
        this.revealCtx.globalCompositeOperation = 'source-over';
        
        console.log('Canvas prepared for bleeding animation');
    }
    
    bindEvents() {
        // Mouse events - reveal on hover (no click required)
        this.revealCanvas.addEventListener('mousemove', (e) => this.revealOnHover(e));
        this.revealCanvas.addEventListener('mouseenter', (e) => this.revealOnHover(e));
        
        // Touch events for mobile
        this.revealCanvas.addEventListener('touchstart', (e) => this.handleTouch(e, 'start'));
        this.revealCanvas.addEventListener('touchmove', (e) => this.handleTouch(e, 'move'));
        this.revealCanvas.addEventListener('touchend', (e) => this.handleTouch(e, 'end'));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Double-click to reset
        this.revealCanvas.addEventListener('dblclick', () => this.resetReveal());
    }
    
    getMousePos(e) {
        const rect = this.revealCanvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.revealCanvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.revealCanvas.height / rect.height)
        };
    }
    
    revealOnHover(e) {
        if (!this.imageLoaded || !this.initialAnimationComplete) return;
        
        const pos = this.getMousePos(e);
        
        // Reveal at the current mouse position
        this.revealAtPoint(pos.x, pos.y);
    }
    
    // Reveal line method removed - now using simple hover reveal
    
    revealAtPoint(x, y) {
        // Add this reveal to our tracking array
        this.revealedAreas.push({
            x: x,
            y: y,
            timestamp: Date.now(),
            radius: this.brushSize / 2
        });
        
        // Immediately draw this reveal
        this.drawRevealArea(x, y, this.brushSize / 2, 1.0);
    }
    
    drawRevealArea(x, y, radius, opacity) {
        // Create a brush with soft bleeding effect
        this.revealCtx.save();
        
        // Create multiple bleeding layers for organic watercolor effect
        const bleedLayers = [
            { size: 1.0, opacity: 1.0, offset: 0 },      // Core brush
            { size: 1.4, opacity: 0.6, offset: 2 },      // First bleed ring
            { size: 1.8, opacity: 0.3, offset: 4 },      // Second bleed ring
            { size: 2.2, opacity: 0.15, offset: 6 },     // Third bleed ring
            { size: 2.6, opacity: 0.08, offset: 8 }      // Outer bleed ring
        ];
        
        bleedLayers.forEach((layer, index) => {
            this.revealCtx.save();
            
            // Add slight random offset for organic bleeding
            const bleedRadius = radius * layer.size;
            const offsetX = (Math.sin(x * 0.01 + index) * layer.offset);
            const offsetY = (Math.cos(y * 0.01 + index) * layer.offset);
            
            // Create radial gradient for this bleeding layer
            const gradient = this.revealCtx.createRadialGradient(
                x + offsetX, y + offsetY, 0,
                x + offsetX, y + offsetY, bleedRadius
            );
            
            const layerOpacity = opacity * layer.opacity;
            gradient.addColorStop(0, `rgba(255, 255, 255, ${layerOpacity})`);
            gradient.addColorStop(0.3, `rgba(255, 255, 255, ${layerOpacity * 0.8})`);
            gradient.addColorStop(0.6, `rgba(255, 255, 255, ${layerOpacity * 0.4})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            // Create circular clipping path for this layer
            this.revealCtx.beginPath();
            this.revealCtx.arc(x + offsetX, y + offsetY, bleedRadius, 0, Math.PI * 2);
            this.revealCtx.clip();
            
            // Draw the image with this bleeding layer
            this.revealCtx.globalAlpha = layerOpacity;
            this.revealCtx.drawImage(this.image, 0, 0, this.revealCanvas.width, this.revealCanvas.height);
            
            this.revealCtx.restore();
        });
        
        this.revealCtx.restore();
    }
    
    drawBaseImageArea(x, y, radius, opacity) {
        // Create a bleeding effect for forming the base faint image
        this.baseCtx.save();
        
        // Create multiple bleeding layers for organic watercolor effect (same as reveal but for base)
        const bleedLayers = [
            { size: 1.0, opacity: 1.0, offset: 0 },      // Core brush
            { size: 1.4, opacity: 0.6, offset: 2 },      // First bleed ring
            { size: 1.8, opacity: 0.3, offset: 4 },      // Second bleed ring
            { size: 2.2, opacity: 0.15, offset: 6 },     // Third bleed ring
            { size: 2.6, opacity: 0.08, offset: 8 }      // Outer bleed ring
        ];
        
        bleedLayers.forEach((layer, index) => {
            this.baseCtx.save();
            
            // Add slight random offset for organic bleeding
            const bleedRadius = radius * layer.size;
            const offsetX = (Math.sin(x * 0.01 + index) * layer.offset);
            const offsetY = (Math.cos(y * 0.01 + index) * layer.offset);
            
            // Create circular clipping path for this layer
            this.baseCtx.beginPath();
            this.baseCtx.arc(x + offsetX, y + offsetY, bleedRadius, 0, Math.PI * 2);
            this.baseCtx.clip();
            
            // Draw the faint image with this bleeding layer
            const layerOpacity = opacity * layer.opacity;
            this.baseCtx.globalAlpha = layerOpacity;
            this.baseCtx.drawImage(this.image, 0, 0, this.baseCanvas.width, this.baseCanvas.height);
            
            this.baseCtx.restore();
        });
        
        this.baseCtx.restore();
    }
    
    startFadeOutLoop() {
        const animate = () => {
            this.updateFadeOut();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    updateFadeOut() {
        if (this.revealedAreas.length === 0) return;
        
        const currentTime = Date.now();
        
        // Clear the reveal canvas
        this.revealCtx.clearRect(0, 0, this.revealCanvas.width, this.revealCanvas.height);
        
        // Filter out completely faded areas and update remaining ones
        this.revealedAreas = this.revealedAreas.filter(area => {
            const age = currentTime - area.timestamp;
            
            if (age >= this.fadeOutDuration) {
                return false; // Remove this area
            }
            
            // Calculate smooth fade opacity (1.0 to 0.0 over fadeOutDuration)
            const fadeProgress = age / this.fadeOutDuration;
            const opacity = Math.max(0, 1.0 - fadeProgress);
            
            // Redraw this area with faded opacity
            this.drawRevealArea(area.x, area.y, area.radius, opacity);
            
            return true; // Keep this area
        });
    }
    
    startInitialAnimation() {
        console.log('Starting initial bleeding animation...');
        const startTime = Date.now();
        const totalPoints = 150; // Many more points for complete coverage
        const animationPoints = [];
        
        // Generate points across the canvas with better distribution for complete tree formation
        for (let i = 0; i < totalPoints; i++) {
            // Create a mix of random and grid-based points for better coverage
            const isGridPoint = i < totalPoints * 0.6; // 60% grid-based, 40% random
            
            let x, y;
            if (isGridPoint) {
                // Grid-based distribution for better coverage
                const gridSize = Math.ceil(Math.sqrt(totalPoints * 0.6));
                const row = Math.floor(i / gridSize);
                const col = i % gridSize;
                x = (col / gridSize) * this.baseCanvas.width + (Math.random() - 0.5) * 60;
                y = (row / gridSize) * this.baseCanvas.height + (Math.random() - 0.5) * 60;
            } else {
                // Random points for organic feel
                x = Math.random() * this.baseCanvas.width;
                y = Math.random() * this.baseCanvas.height;
            }
            
            // Add small random timing offset for organic feel but keep it smooth
            const baseDelay = (i / totalPoints) * this.initialAnimationDuration * 0.8;
            const randomOffset = (Math.random() - 0.5) * 100; // ±50ms random offset
            
            animationPoints.push({
                x: Math.max(0, Math.min(this.baseCanvas.width, x)),
                y: Math.max(0, Math.min(this.baseCanvas.height, y)),
                delay: Math.max(0, baseDelay + randomOffset), // Ensure no negative delays
                size: 40 + Math.random() * 80, // Doubled size for better coverage
                drawn: false
            });
        }
        
        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            
            // Check if all points have been drawn or animation time exceeded
            const allPointsDrawn = animationPoints.every(point => point.drawn);
            
            if (elapsed >= this.initialAnimationDuration + 500 || allPointsDrawn) {
                this.initialAnimationComplete = true;
                // Update cursor to indicate interactive mode (no abrupt image completion)
                this.revealCanvas.classList.add('interactive');
                this.baseCanvas.classList.add('interactive');
                console.log('Initial animation complete - interactive mode enabled');
                return;
            }
            
            // Draw new points that are ready to appear (progressive building)
            animationPoints.forEach((point, index) => {
                if (!point.drawn && elapsed >= point.delay) {
                    // Calculate opacity for this new point with smoother fade-in
                    const pointElapsed = elapsed - point.delay;
                    const fadeInDuration = 400; // Longer, smoother fade in per point
                    const fadeProgress = Math.min(pointElapsed / fadeInDuration, 1);
                    // Use easing function for smoother transition
                    const easedProgress = fadeProgress * (2 - fadeProgress); // Ease-out curve
                    const opacity = easedProgress * this.fadeOpacity;
                    
                    if (opacity > 0) {
                        this.drawBaseImageArea(point.x, point.y, point.size / 2, opacity);
                        point.drawn = true;
                    }
                }
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    resetReveal() {
        if (!this.imageLoaded) return;
        
        console.log('Resetting reveal effect...');
        this.revealCtx.clearRect(0, 0, this.revealCanvas.width, this.revealCanvas.height);
        this.revealedAreas = []; // Clear all tracked areas
        this.initialAnimationComplete = false;
        
        // Reset cursor to waiting state
        this.revealCanvas.classList.remove('interactive');
        this.baseCanvas.classList.remove('interactive');
        
        // Clear the base canvas and restart the bleeding animation
        this.baseCtx.clearRect(0, 0, this.baseCanvas.width, this.baseCanvas.height);
        this.startInitialAnimation();
    }
    
    handleTouch(e, type) {
        e.preventDefault();
        if (!this.initialAnimationComplete) return;
        
        const touch = e.touches[0] || e.changedTouches[0];
        
        if (!touch) return;
        
        const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
        });
        
        // Reveal on any touch movement
        if (type === 'start' || type === 'move') {
            this.revealOnHover(mouseEvent);
        }
    }
    
    handleResize() {
        if (!this.imageLoaded) return;
        
        // Redraw everything on resize
        setTimeout(() => {
            this.setupCanvases();
            this.drawInitialImage();
        }, 100);
    }
    
    showLoadingState() {
        const container = document.querySelector('.canvas-container');
        container.classList.add('loading-shimmer');
        
        // Set minimum size for loading state
        this.revealCanvas.width = 800;
        this.revealCanvas.height = 600;
        this.baseCanvas.width = 800;
        this.baseCanvas.height = 600;
        
        // Draw loading pattern
        const gradient = this.baseCtx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#f8f8f8');
        gradient.addColorStop(0.5, '#e8e8e8');
        gradient.addColorStop(1, '#f8f8f8');
        
        this.baseCtx.fillStyle = gradient;
        this.baseCtx.fillRect(0, 0, 800, 600);
        
        // Add loading text
        this.baseCtx.fillStyle = 'rgba(45, 80, 22, 0.8)';
        this.baseCtx.font = 'bold 24px Georgia, serif';
        this.baseCtx.textAlign = 'center';
        this.baseCtx.fillText('Loading Tree of Life...', 400, 300);
        
        this.baseCtx.font = '16px Georgia, serif';
        this.baseCtx.fillStyle = 'rgba(45, 80, 22, 0.6)';
        this.baseCtx.fillText('Preparing natural tree formation...', 400, 330);
        
        this.baseCtx.textAlign = 'left';
    }
    
    hideLoadingState() {
        const container = document.querySelector('.canvas-container');
        container.classList.remove('loading-shimmer');
    }
    
    showErrorState() {
        this.hideLoadingState();
        
        this.baseCtx.fillStyle = '#f8f8f8';
        this.baseCtx.fillRect(0, 0, this.baseCanvas.width, this.baseCanvas.height);
        
        this.baseCtx.fillStyle = '#d32f2f';
        this.baseCtx.font = 'bold 24px Georgia, serif';
        this.baseCtx.textAlign = 'center';
        this.baseCtx.fillText('Unable to load Tree of Life', 400, 280);
        
        this.baseCtx.font = '16px Georgia, serif';
        this.baseCtx.fillStyle = 'rgba(45, 80, 22, 0.8)';
        this.baseCtx.fillText('Please ensure "TreeOfLifeColoredMin.png" is in the same folder', 400, 310);
        this.baseCtx.fillText('and refresh the page to try again', 400, 335);
        
        this.baseCtx.textAlign = 'left';
    }
}

// Initialize the reveal painter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Tree of Life Reveal Painter...');
    new RevealPainter();
    
    // Initialize audio functionality
    initializeAudio();
});

// Add some utility functions
function downloadRevealedImage() {
    const revealCanvas = document.getElementById('revealCanvas');
    const baseCanvas = document.getElementById('baseCanvas');
    
    if (!revealCanvas || !baseCanvas) return;
    
    // Create a temporary canvas to combine both layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = baseCanvas.width;
    tempCanvas.height = baseCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw base (faint) image first, then revealed parts on top
    tempCtx.drawImage(baseCanvas, 0, 0);
    tempCtx.drawImage(revealCanvas, 0, 0);
    
    // Download the combined image
    const link = document.createElement('a');
    link.download = 'tree-of-life-revealed.png';
    link.href = tempCanvas.toDataURL();
    link.click();
}

// Audio functionality
function initializeAudio() {
    const audio = document.getElementById('backgroundAudio');
    const audioToggle = document.getElementById('audioToggle');
    const soundWaves = document.getElementById('soundWaves');
    
    let isPlaying = false; // Default to OFF
    
    // Update the toggle button appearance based on play state
    const updateToggleButton = () => {
        if (isPlaying) {
            audioToggle.classList.remove('muted');
            soundWaves.style.opacity = '1';
        } else {
            audioToggle.classList.add('muted');
            soundWaves.style.opacity = '0.3';
        }
    };
    
    // Toggle audio on button click
    audioToggle.addEventListener('click', async () => {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            console.log('Background audio paused');
        } else {
            try {
                await audio.play();
                isPlaying = true;
                console.log('Background audio resumed');
            } catch (error) {
                console.error('Failed to play audio:', error);
                isPlaying = false;
            }
        }
        updateToggleButton();
    });
    
    // Handle audio events
    audio.addEventListener('play', () => {
        isPlaying = true;
        updateToggleButton();
    });
    
    audio.addEventListener('pause', () => {
        isPlaying = false;
        updateToggleButton();
    });
    
    audio.addEventListener('ended', () => {
        // This shouldn't happen since we have loop="true", but just in case
        isPlaying = false;
        updateToggleButton();
    });
    
    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        isPlaying = false;
        updateToggleButton();
        // Hide the audio toggle if audio fails to load
        audioToggle.style.display = 'none';
    });
    
    // Set initial state (audio off)
    updateToggleButton();
} 