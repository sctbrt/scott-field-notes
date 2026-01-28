/**
 * Workbench - Interactive Canvas Experience
 * Pan, zoom, and explore Field Notes as physical artifacts
 */

class Workbench {
    constructor(container) {
        this.container = container;
        this.canvas = container.querySelector('.workbench__canvas');
        this.grid = container.querySelector('.workbench__grid');
        this.connectionsLayer = container.querySelector('.workbench__connections');

        // Transform state
        this.scale = 0.6;
        this.minScale = 0.2;
        this.maxScale = 2;
        this.offsetX = 0;
        this.offsetY = 0;

        // Interaction state
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;

        // Data
        this.artifacts = [];
        this.connections = [];

        // Zoom levels for semantic states
        this.zoomLevels = {
            overview: 0.3,
            normal: 0.6,
            detail: 1.0,
            reading: 1.5
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadEntries();
        this.centerCanvas();
    }

    bindEvents() {
        // Mouse events for panning
        this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));

        // Touch events for mobile
        this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        window.addEventListener('touchend', this.onTouchEnd.bind(this));

        // Wheel for zooming
        this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

        // Zoom buttons
        const zoomInBtn = document.querySelector('[data-zoom-in]');
        const zoomOutBtn = document.querySelector('[data-zoom-out]');
        const resetBtn = document.querySelector('[data-zoom-reset]');

        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetView());

        // Window resize
        window.addEventListener('resize', this.onResize.bind(this));
    }

    // ===================================
    // Pan & Drag
    // ===================================

    onMouseDown(e) {
        // Ignore if clicking on an artifact or control
        if (e.target.closest('.artifact') || e.target.closest('.workbench-ui')) {
            return;
        }

        this.isDragging = true;
        this.startX = e.clientX - this.offsetX;
        this.startY = e.clientY - this.offsetY;
        this.canvas.classList.add('dragging');
        this.container.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        this.offsetX = e.clientX - this.startX;
        this.offsetY = e.clientY - this.startY;
        this.updateTransform();
    }

    onMouseUp() {
        this.isDragging = false;
        this.canvas.classList.remove('dragging');
        this.container.style.cursor = 'grab';
    }

    // Touch support
    onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            if (touch.target.closest('.artifact') || touch.target.closest('.workbench-ui')) {
                return;
            }

            this.isDragging = true;
            this.startX = touch.clientX - this.offsetX;
            this.startY = touch.clientY - this.offsetY;
            this.canvas.classList.add('dragging');
        }
    }

    onTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;

        e.preventDefault();
        const touch = e.touches[0];
        this.offsetX = touch.clientX - this.startX;
        this.offsetY = touch.clientY - this.startY;
        this.updateTransform();
    }

    onTouchEnd() {
        this.isDragging = false;
        this.canvas.classList.remove('dragging');
    }

    // ===================================
    // Zoom
    // ===================================

    onWheel(e) {
        e.preventDefault();

        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(this.scale * delta, this.minScale), this.maxScale);

        // Zoom towards mouse position
        const scaleFactor = newScale / this.scale;
        this.offsetX = mouseX - (mouseX - this.offsetX) * scaleFactor;
        this.offsetY = mouseY - (mouseY - this.offsetY) * scaleFactor;
        this.scale = newScale;

        this.canvas.classList.add('zooming');
        this.updateTransform();
        this.updateZoomState();

        clearTimeout(this.zoomTimeout);
        this.zoomTimeout = setTimeout(() => {
            this.canvas.classList.remove('zooming');
        }, 300);
    }

    zoomIn() {
        this.setScale(this.scale * 1.3);
    }

    zoomOut() {
        this.setScale(this.scale / 1.3);
    }

    setScale(newScale, animate = true) {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        newScale = Math.min(Math.max(newScale, this.minScale), this.maxScale);

        const scaleFactor = newScale / this.scale;
        this.offsetX = centerX - (centerX - this.offsetX) * scaleFactor;
        this.offsetY = centerY - (centerY - this.offsetY) * scaleFactor;
        this.scale = newScale;

        if (animate) {
            this.canvas.classList.add('zooming');
            setTimeout(() => this.canvas.classList.remove('zooming'), 300);
        }

        this.updateTransform();
        this.updateZoomState();
    }

    updateZoomState() {
        // Update semantic zoom state for CSS
        let zoomState = 'normal';
        if (this.scale <= 0.35) zoomState = 'overview';
        else if (this.scale >= 1.2) zoomState = 'reading';
        else if (this.scale >= 0.8) zoomState = 'detail';

        this.container.dataset.zoom = zoomState;

        // Update zoom level display
        const zoomDisplay = document.querySelector('.workbench__zoom-level');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(this.scale * 100)}%`;
        }
    }

    resetView() {
        this.scale = 0.6;
        this.centerCanvas();
        this.updateZoomState();
    }

    centerCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.offsetX = rect.width / 2;
        this.offsetY = rect.height / 2;

        this.canvas.classList.add('zooming');
        this.updateTransform();
        setTimeout(() => this.canvas.classList.remove('zooming'), 300);
    }

    // ===================================
    // Transform
    // ===================================

    updateTransform() {
        const transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
        this.canvas.style.transform = transform;
        this.grid.style.transform = transform;

        // Update connection lines
        this.updateConnections();
    }

    onResize() {
        // Could recenter or adjust on resize
    }

    // ===================================
    // Data Loading
    // ===================================

    async loadEntries() {
        const loadingEl = document.querySelector('.workbench__loading');

        try {
            const response = await fetch('/api/field-notes');

            // Check if we got HTML/JS instead of JSON (local dev without serverless)
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.log('API not available, using mock data for preview');
                this.artifacts = this.getMockData();
                this.renderArtifacts();
                this.generateConnections();
                if (loadingEl) loadingEl.classList.add('hidden');
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load entries');
            }

            this.artifacts = data.entries;
            this.renderArtifacts();
            this.generateConnections();

            // Hide loading
            if (loadingEl) {
                loadingEl.classList.add('hidden');
            }

        } catch (error) {
            console.error('Error loading entries:', error);
            // Fall back to mock data for local development
            console.log('Falling back to mock data');
            this.artifacts = this.getMockData();
            this.renderArtifacts();
            this.generateConnections();
            if (loadingEl) loadingEl.classList.add('hidden');
        }
    }

    getMockData() {
        // Mock data for local development preview
        return [
            {
                id: 'mock-1',
                title: 'Design System Architecture',
                type: 'System',
                focus: ['Design', 'Architecture'],
                status: 'Working',
                created: '2024-11-15',
                revisited: '2025-01-25',
                media: null,
                url: '#'
            },
            {
                id: 'mock-2',
                title: 'Brand Voice Guidelines',
                type: 'Framework',
                focus: ['Brand', 'Writing'],
                status: 'Working',
                created: '2024-10-20',
                revisited: '2025-01-20',
                media: null,
                url: '#'
            },
            {
                id: 'mock-3',
                title: 'Color Theory Notes',
                type: 'Note',
                focus: ['Design', 'Color'],
                status: 'Draft',
                created: '2024-09-10',
                revisited: null,
                media: null,
                url: '#'
            },
            {
                id: 'mock-4',
                title: 'Typography Explorations',
                type: 'Observation',
                focus: ['Design', 'Typography'],
                status: 'Working',
                created: '2024-08-05',
                revisited: '2024-12-15',
                media: null,
                url: '#'
            },
            {
                id: 'mock-5',
                title: 'Component Library Patterns',
                type: 'System',
                focus: ['Architecture', 'Components'],
                status: 'Working',
                created: '2024-07-22',
                revisited: '2025-01-10',
                media: null,
                url: '#'
            },
            {
                id: 'mock-6',
                title: 'User Research Synthesis',
                type: 'Framework',
                focus: ['Research', 'Strategy'],
                status: 'Draft',
                created: '2024-06-18',
                revisited: null,
                media: null,
                url: '#'
            },
            {
                id: 'mock-7',
                title: 'Motion Design Principles',
                type: 'Note',
                focus: ['Design', 'Motion'],
                status: 'Working',
                created: '2024-05-30',
                revisited: '2024-11-20',
                media: null,
                url: '#'
            },
            {
                id: 'mock-8',
                title: 'Accessibility Checklist',
                type: 'System',
                focus: ['Architecture', 'Accessibility'],
                status: 'Working',
                created: '2024-04-12',
                revisited: '2025-01-22',
                media: null,
                url: '#'
            },
            {
                id: 'mock-9',
                title: 'Content Strategy Framework',
                type: 'Framework',
                focus: ['Strategy', 'Writing'],
                status: 'Working',
                created: '2024-03-08',
                revisited: '2024-10-05',
                media: null,
                url: '#'
            },
            {
                id: 'mock-10',
                title: 'Visual Language Evolution',
                type: 'Observation',
                focus: ['Brand', 'Design'],
                status: 'Draft',
                created: '2024-02-14',
                revisited: null,
                media: null,
                url: '#'
            }
        ];
    }

    // ===================================
    // Artifact Rendering
    // ===================================

    renderArtifacts() {
        // Clear existing
        this.canvas.innerHTML = '';

        // Calculate positions using smart clustering
        const positions = this.calculateClusteredPositions();

        this.artifacts.forEach((entry, index) => {
            // Check for saved position first
            const savedPos = this.getSavedPosition(entry.id);
            const position = savedPos || positions[index];
            const artifact = this.createArtifact(entry, position);
            this.canvas.appendChild(artifact);
        });
    }

    calculateClusteredPositions() {
        // Group artifacts by their primary focus tag
        const clusters = {};
        const clusterOrder = [];

        this.artifacts.forEach((entry, index) => {
            const primaryFocus = entry.focus[0] || 'Uncategorized';
            if (!clusters[primaryFocus]) {
                clusters[primaryFocus] = [];
                clusterOrder.push(primaryFocus);
            }
            clusters[primaryFocus].push({ entry, index });
        });

        // Position clusters in a circle around center
        const positions = new Array(this.artifacts.length);
        const clusterRadius = 350; // Distance from center to cluster centers
        const itemSpacing = 120; // Space between items in a cluster

        clusterOrder.forEach((clusterName, clusterIndex) => {
            const clusterItems = clusters[clusterName];
            const clusterAngle = (clusterIndex / clusterOrder.length) * Math.PI * 2 - Math.PI / 2;

            // Cluster center position
            const centerX = Math.cos(clusterAngle) * clusterRadius;
            const centerY = Math.sin(clusterAngle) * clusterRadius;

            // Position items within cluster
            clusterItems.forEach((item, itemIndex) => {
                // Arrange in small cluster with jitter
                const itemAngle = (itemIndex / clusterItems.length) * Math.PI * 2;
                const itemRadius = itemSpacing * (0.5 + itemIndex * 0.3);

                const jitterX = (Math.random() - 0.5) * 40;
                const jitterY = (Math.random() - 0.5) * 40;

                positions[item.index] = {
                    x: centerX + Math.cos(itemAngle) * itemRadius + jitterX,
                    y: centerY + Math.sin(itemAngle) * itemRadius + jitterY
                };
            });
        });

        return positions;
    }

    // Legacy fallback positioning
    calculatePositions(count) {
        const positions = [];
        const baseRadius = 150;
        const spacing = 300;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < count; i++) {
            const angle = i * goldenAngle;
            const radius = baseRadius + Math.sqrt(i) * spacing * 0.4;
            const jitterX = (Math.random() - 0.5) * 80;
            const jitterY = (Math.random() - 0.5) * 80;

            positions.push({
                x: Math.cos(angle) * radius + jitterX,
                y: Math.sin(angle) * radius + jitterY
            });
        }

        return positions;
    }

    createArtifact(entry, position) {
        const artifact = document.createElement('article');
        artifact.className = 'artifact';
        artifact.dataset.id = entry.id;

        // Random rotation (1-5)
        artifact.dataset.rotation = Math.ceil(Math.random() * 5);

        // Determine artifact style based on type
        if (entry.type === 'Note' || entry.type === 'Observation') {
            artifact.classList.add('artifact--sticky');
        } else if (entry.type === 'System' || entry.type === 'Framework') {
            artifact.classList.add('artifact--card');
        }

        // Check if recently active (within 14 days for demo visibility)
        if (entry.revisited) {
            const revisitDate = new Date(entry.revisited);
            const daysSince = (Date.now() - revisitDate) / (1000 * 60 * 60 * 24);
            if (daysSince < 14) {
                artifact.classList.add('artifact--active');
            }
        }

        // Position
        artifact.style.left = `${position.x}px`;
        artifact.style.top = `${position.y}px`;
        artifact.style.transform = `translate(-50%, -50%)`;

        // Content
        artifact.innerHTML = `
            <div class="artifact__pin"></div>
            ${entry.media ? `<img src="${entry.media}" alt="" class="artifact__thumbnail" loading="lazy">` : ''}
            ${entry.type ? `<div class="artifact__type">${entry.type}</div>` : ''}
            <h3 class="artifact__title">${entry.title}</h3>
            ${entry.focus.length > 0 ? `
                <div class="artifact__focus">
                    ${entry.focus.map(f => `<span class="artifact__tag">${f}</span>`).join('')}
                </div>
            ` : ''}
            <div class="artifact__date">${this.formatDate(entry.created)}</div>
        `;

        // Click handler (only if not dragging)
        artifact.addEventListener('click', (e) => {
            if (!artifact.classList.contains('was-dragged')) {
                window.location.href = entry.url;
            }
            artifact.classList.remove('was-dragged');
        });

        // Store focus tags for connections
        artifact.dataset.focus = JSON.stringify(entry.focus);

        // Add hover interactions
        artifact.addEventListener('mouseenter', () => this.highlightConnected(artifact));
        artifact.addEventListener('mouseleave', () => this.clearHighlight());

        // Make draggable
        this.makeDraggable(artifact);

        return artifact;
    }

    // ===================================
    // Hover Highlight System
    // ===================================

    highlightConnected(artifact) {
        const artifactId = artifact.dataset.id;
        const connectedIds = new Set([artifactId]);

        // Find all connected artifacts
        this.connections.forEach(conn => {
            if (conn.from.dataset.id === artifactId) {
                connectedIds.add(conn.to.dataset.id);
                conn.lineEl.classList.add('connection-line--active');
            } else if (conn.to.dataset.id === artifactId) {
                connectedIds.add(conn.from.dataset.id);
                conn.lineEl.classList.add('connection-line--active');
            }
        });

        // Dim non-connected artifacts
        this.canvas.querySelectorAll('.artifact').forEach(el => {
            if (!connectedIds.has(el.dataset.id)) {
                el.classList.add('artifact--dimmed');
            } else {
                el.classList.add('artifact--highlighted');
            }
        });

        this.container.classList.add('workbench--highlighting');
    }

    clearHighlight() {
        this.canvas.querySelectorAll('.artifact').forEach(el => {
            el.classList.remove('artifact--dimmed', 'artifact--highlighted');
        });

        this.connections.forEach(conn => {
            conn.lineEl.classList.remove('connection-line--active');
        });

        this.container.classList.remove('workbench--highlighting');
    }

    // ===================================
    // Draggable Artifacts
    // ===================================

    makeDraggable(artifact) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        const onMouseDown = (e) => {
            if (e.button !== 0) return; // Only left click
            e.stopPropagation();

            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;

            const rect = artifact.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            initialX = (rect.left + rect.width / 2 - canvasRect.left) / this.scale;
            initialY = (rect.top + rect.height / 2 - canvasRect.top) / this.scale;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            artifact.classList.add('artifact--dragging');
        };

        const onMouseMove = (e) => {
            const dx = (e.clientX - startX) / this.scale;
            const dy = (e.clientY - startY) / this.scale;

            // Only start dragging after 5px movement
            if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                isDragging = true;
            }

            if (isDragging) {
                artifact.style.left = `${initialX + dx}px`;
                artifact.style.top = `${initialY + dy}px`;
                this.updateConnections();
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            artifact.classList.remove('artifact--dragging');

            if (isDragging) {
                artifact.classList.add('was-dragged');
                // Save position to localStorage
                this.saveArtifactPosition(artifact.dataset.id, artifact.style.left, artifact.style.top);
            }
        };

        artifact.addEventListener('mousedown', onMouseDown);
    }

    saveArtifactPosition(id, x, y) {
        const positions = JSON.parse(localStorage.getItem('workbench-positions') || '{}');
        positions[id] = { x: parseFloat(x), y: parseFloat(y) };
        localStorage.setItem('workbench-positions', JSON.stringify(positions));
    }

    getSavedPosition(id) {
        const positions = JSON.parse(localStorage.getItem('workbench-positions') || '{}');
        return positions[id] || null;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    }

    // ===================================
    // Connections
    // ===================================

    generateConnections() {
        // Find artifacts with shared focus tags
        this.connections = [];
        const artifactEls = this.canvas.querySelectorAll('.artifact');
        const artifactArray = Array.from(artifactEls);

        for (let i = 0; i < artifactArray.length; i++) {
            for (let j = i + 1; j < artifactArray.length; j++) {
                const focusA = JSON.parse(artifactArray[i].dataset.focus || '[]');
                const focusB = JSON.parse(artifactArray[j].dataset.focus || '[]');

                // Find shared tags
                const shared = focusA.filter(tag => focusB.includes(tag));

                if (shared.length > 0) {
                    this.connections.push({
                        from: artifactArray[i],
                        to: artifactArray[j],
                        strength: shared.length,
                        tags: shared
                    });
                }
            }
        }

        this.renderConnections();
    }

    renderConnections() {
        // Create SVG for connections
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('workbench__connections');
        svg.style.position = 'absolute';
        svg.style.inset = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.overflow = 'visible';
        svg.style.pointerEvents = 'none';

        this.connections.forEach(conn => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.classList.add('connection-line');
            line.dataset.strength = conn.strength;
            svg.appendChild(line);
            conn.lineEl = line;
        });

        // Insert SVG before artifacts
        this.canvas.insertBefore(svg, this.canvas.firstChild);
        this.connectionsLayer = svg;

        this.updateConnections();
    }

    updateConnections() {
        if (!this.connectionsLayer) return;

        this.connections.forEach(conn => {
            const rectA = conn.from.getBoundingClientRect();
            const rectB = conn.to.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();

            // Get center points relative to canvas
            const fromX = (rectA.left + rectA.width / 2 - canvasRect.left) / this.scale;
            const fromY = (rectA.top + rectA.height / 2 - canvasRect.top) / this.scale;
            const toX = (rectB.left + rectB.width / 2 - canvasRect.left) / this.scale;
            const toY = (rectB.top + rectB.height / 2 - canvasRect.top) / this.scale;

            // Create curved path
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            const curvature = 30;

            // Perpendicular offset for curve
            const dx = toX - fromX;
            const dy = toY - fromY;
            const len = Math.sqrt(dx * dx + dy * dy);
            const offsetX = (-dy / len) * curvature;
            const offsetY = (dx / len) * curvature;

            const path = `M ${fromX} ${fromY} Q ${midX + offsetX} ${midY + offsetY} ${toX} ${toY}`;
            conn.lineEl.setAttribute('d', path);

            // Adjust opacity based on strength
            conn.lineEl.style.opacity = 0.3 + (conn.strength * 0.2);
        });
    }
}

// ===================================
// Timeline Controller
// ===================================

class TimelineController {
    constructor(workbench) {
        this.workbench = workbench;
        this.slider = document.querySelector('.workbench__timeline-slider');
        this.dateDisplay = document.querySelector('.workbench__timeline-date');

        if (this.slider) {
            this.init();
        }
    }

    init() {
        this.slider.addEventListener('input', this.onSliderChange.bind(this));
    }

    onSliderChange(e) {
        const value = parseFloat(e.target.value);

        // Calculate date range from artifacts
        const dates = this.workbench.artifacts
            .map(a => new Date(a.created).getTime())
            .filter(d => !isNaN(d));

        if (dates.length === 0) return;

        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const range = maxDate - minDate;

        const selectedDate = new Date(minDate + (range * value / 100));

        // Update date display
        if (this.dateDisplay) {
            this.dateDisplay.textContent = selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });
        }

        // Fade artifacts based on date
        const artifactEls = document.querySelectorAll('.artifact');
        artifactEls.forEach(el => {
            const artifact = this.workbench.artifacts.find(a => a.id === el.dataset.id);
            if (!artifact) return;

            const artifactDate = new Date(artifact.created).getTime();
            const isVisible = artifactDate <= selectedDate.getTime();

            el.style.opacity = isVisible ? '1' : '0.15';
            el.style.pointerEvents = isVisible ? 'auto' : 'none';
        });
    }
}

// ===================================
// Initialize
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.workbench');
    if (container) {
        const workbench = new Workbench(container);
        const timeline = new TimelineController(workbench);

        // Expose for debugging
        window.workbench = workbench;
    }
});
