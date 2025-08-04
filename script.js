// Hero Mouse Trail Effect
class HeroMouseTrail {
    constructor() {
        this.heroSection = document.getElementById('heroSection');
        this.assetPaths = [
            'Assets/1.png',
            'Assets/2.png', 
            'Assets/3.png',
            'Assets/4.png',
            'Assets/5.png',
            'Assets/6.png'
        ];
        this.lastTrailTime = 0;
        this.trailDelay = 150; // milliseconds between trail images
        
        this.bindTrailEvents();
    }
    
    bindTrailEvents() {
        if (this.heroSection) {
            this.heroSection.addEventListener('mousemove', (e) => {
                this.createTrailImage(e);
            });
        }
    }
    
    createTrailImage(e) {
        const now = Date.now();
        if (now - this.lastTrailTime < this.trailDelay) return;
        
        this.lastTrailTime = now;
        
        const rect = this.heroSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const randomAsset = this.assetPaths[Math.floor(Math.random() * this.assetPaths.length)];
        
        const trailImage = document.createElement('img');
        trailImage.src = randomAsset;
        trailImage.className = 'trail-image';
        trailImage.style.left = (x - 45) + 'px'; // Center the 90px image
        trailImage.style.top = (y - 45) + 'px';
        
        this.heroSection.appendChild(trailImage);
        
        // Remove element after animation completes
        setTimeout(() => {
            if (trailImage.parentNode) {
                trailImage.parentNode.removeChild(trailImage);
            }
        }, 2000);
    }
}

class RevealPainter {
    constructor() {
        this.revealCanvas = document.getElementById('revealCanvas');
        this.revealCtx = this.revealCanvas.getContext('2d');
        this.baseCanvas = document.getElementById('baseCanvas');
        this.baseCtx = this.baseCanvas.getContext('2d');
        
        // Settings for reveal effect
        this.brushSize = 32; // 20% smaller for more delicate painting
        this.revealStrength = 1.0;
        this.fadeOpacity = 0.25; // Increased opacity for better visibility (15% + 10%)
        this.revealedAreas = []; // Track revealed areas (no fading, permanent until viewport reset)
        this.intersectionObserver = null; // Track viewport visibility
        this.lastStrokePos = { x: -1000, y: -1000 }; // Track last stroke position for spacing
        this.strokeSpacing = 15; // Minimum distance between strokes for blob visibility
        
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
        
        this.image = new Image();
        this.image.onload = () => {
            console.log('Image loaded successfully! Dimensions:', this.image.width, 'x', this.image.height);
            this.setupCanvases();
            this.bindEvents();
            this.setupViewportObserver();
            this.drawInitialImage();
            this.imageLoaded = true;
            this.startInitialAnimation();
        };
        
        this.image.onerror = () => {
            console.error('Failed to load TreeOfLifeColoredMin.png');
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
        // Check distance from last stroke for spacing
        const distance = Math.sqrt(
            (x - this.lastStrokePos.x) ** 2 + 
            (y - this.lastStrokePos.y) ** 2
        );
        
        // Only create new stroke if far enough from last one
        if (distance >= this.strokeSpacing) {
            this.lastStrokePos = { x, y };
            
            // Add this reveal to our tracking array (permanent, no timestamp needed)
            this.revealedAreas.push({
                x: x,
                y: y,
                radius: this.brushSize / 2
            });
            
            // Immediately draw this reveal
            this.drawRevealArea(x, y, this.brushSize / 2, 1.0);
        }
    }
    
    drawRevealArea(x, y, radius, opacity) {
        // Create a brush with soft bleeding effect
        this.revealCtx.save();
        
        // Create multiple bleeding layers for organic watercolor effect with gentle opacity
        const bleedLayers = [
            { size: 1.0, opacity: 0.4, offset: 0 },      // Core brush - gentle
            { size: 1.4, opacity: 0.25, offset: 2 },     // First bleed ring
            { size: 1.8, opacity: 0.15, offset: 4 },     // Second bleed ring
            { size: 2.2, opacity: 0.08, offset: 6 },     // Third bleed ring
            { size: 2.6, opacity: 0.04, offset: 8 }      // Outer bleed ring - very subtle
        ];
        
        bleedLayers.forEach((layer, index) => {
            this.revealCtx.save();
            
            // Add slight random offset for organic bleeding
            const bleedRadius = radius * layer.size;
            const offsetX = (Math.sin(x * 0.01 + index) * layer.offset);
            const offsetY = (Math.cos(y * 0.01 + index) * layer.offset);
            
            // Create circular clipping path for this layer
            this.revealCtx.beginPath();
            this.revealCtx.arc(x + offsetX, y + offsetY, bleedRadius, 0, Math.PI * 2);
            this.revealCtx.clip();
            
            // Draw the image with this bleeding layer
            const layerOpacity = opacity * layer.opacity;
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
    
    setupViewportObserver() {
        // Create intersection observer to detect when tree is out of view
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    // Tree is completely out of view - reset everything for smooth scrolling
                    this.resetTree();
                }
            });
        }, {
            threshold: 0, // Trigger when completely out of view
            rootMargin: '0px'
        });
        
        // Observe the tree painting section
        const treePaintingSection = document.querySelector('.tree-painting-section');
        if (treePaintingSection) {
            this.intersectionObserver.observe(treePaintingSection);
        }
    }
    
    resetTree() {
        // Clear all revealed areas
        this.revealedAreas = [];
        
        // Clear the reveal canvas
        if (this.revealCtx) {
            this.revealCtx.clearRect(0, 0, this.revealCanvas.width, this.revealCanvas.height);
        }
        
        console.log('Tree reset - out of viewport');
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
}

// Initialize the reveal painter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Tree of Life Reveal Painter...');
    new RevealPainter();
    
    // Initialize audio functionality
    initializeAudio();
    
    // Scroll to top on page load
    window.scrollTo(0, 0);
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

// Instruction text functionality
function setupInstructionText() {
    const instructionText = document.getElementById('instructionText');
    const revealCanvas = document.getElementById('revealCanvas');
    
    if (!instructionText || !revealCanvas) return;
    
    let hasInteracted = false;
    
    function fadeOutInstruction() {
        if (!hasInteracted) {
            hasInteracted = true;
            instructionText.style.opacity = '0';
            
            // Remove the element after fade animation completes
            setTimeout(() => {
                if (instructionText.parentNode) {
                    instructionText.parentNode.removeChild(instructionText);
                }
            }, 500); // Match the CSS transition duration
        }
    }
    
    // Fade out when mouse enters the canvas area
    revealCanvas.addEventListener('mouseenter', fadeOutInstruction);
    
    // Also fade out on first touch for mobile devices
    revealCanvas.addEventListener('touchstart', fadeOutInstruction, { once: true });
}

// Initialize instruction text when DOM is loaded
document.addEventListener('DOMContentLoaded', setupInstructionText);

// Initialize hero mouse trail effect
document.addEventListener('DOMContentLoaded', () => {
    new HeroMouseTrail();
}); 