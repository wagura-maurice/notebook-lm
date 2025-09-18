// js/visualization.js
// =====================================================
// VISUALIZATION.JS - ALPINE.JS-FRIENDLY VISUALIZATION UTILITIES
// =====================================================
// This file provides visualization components for the Doccano annotation interface using vanilla JavaScript.
// It creates interactive charts for token usage and confidence scores, with smooth animations
// and responsive design. The visualizer integrates with app.js and doccano.js events.
//
// Key Features (Alpine.js Enhanced):
// - Token usage donut chart (ApexCharts with vanilla DOM management)
// - Confidence progress bar with animated color transitions
// - Automatic container creation and management
// - Event-driven updates from doccano.js 'documentsUpdated'
// - Responsive design with vanilla JavaScript breakpoint handling
// - Smooth animations using CSS transitions and vanilla JavaScript
//
// Dependencies: Vanilla JS, app.js (for layout), ApexCharts (CDN/external)
// Global State: window.doccanoVisualizer for singleton access
// 
// Loading Order: Alpine.js → app.js → doccano.js → visualization.js (waits for 'appContentReady')
// =====================================================

// Global visualizer instance
window.doccanoVisualizer = null;

// =====================================================
// SECTION 1: DOCCANO VISUALIZER CLASS (Vanilla JS)
// =====================================================
// Enhanced with vanilla JavaScript for DOM manipulation, animations, and event handling.

class DoccanoVisualizer {
    constructor() {
        this.tokenUsageChart = null;
        this.visualizationsContainer = null;
        this.lastProcessedData = null;
        this.isInitialized = false;
        
        // Initialize visualizer
        this.initializeVisualizer();
    }
    
    // Main initialization method with vanilla JavaScript
    // Vanilla JS Benefits: DOM ready handling, event delegation, selector caching
    initializeVisualizer() {
        console.log('%c[VISUALIZER] Starting Alpine.js initialization', 'color: #059669;');
        
        // Wait for app.js to signal readiness
        document.addEventListener('appContentReady.visualizer', this.onAppReady.bind(this));
        
        // Also listen for doccano.js document updates
        document.addEventListener('documentsUpdated.visualizer', this.handleDocumentUpdate.bind(this));
        
        // Handle column state changes for responsive layout
        document.addEventListener('columnStateChanged.visualizer', this.handleColumnChange.bind(this));
        
        // Handle tab switching for mobile responsiveness
        document.addEventListener('tabSwitched.visualizer', this.handleTabSwitch.bind(this));
        
        // Cleanup on unload
        window.addEventListener('beforeunload.visualizer', this.cleanup.bind(this));
        
        console.log('%c[VISUALIZER] Vanilla JS event listeners attached', 'color: #059669;');
    }
    
    // Handler for app.js readiness signal
    // Vanilla JS Integration: Uses vanilla JS to ensure DOM is ready before chart setup
    onAppReady(e) {
        console.log('%c[VISUALIZER] App.js ready - initializing charts', 'color: #059669;', e.detail);
        
        // Ensure containers exist
        const containersReady = this.ensureChartContainers();
        if (containersReady) {
            this.isInitialized = true;
            console.log('%c[VISUALIZER] Vanilla JS initialization complete', 'color: #10b981; font-weight: bold;');
            
            // Process any existing data
            if (this.lastProcessedData) {
                this.processData(this.lastProcessedData);
            }
            
            // Trigger initialization complete event
            document.dispatchEvent(new CustomEvent('visualizerReady', { 
                detail: { 
                    timestamp: Date.now(),
                    charts: Object.keys(this).filter(key => key.includes('Chart')).length
                }
            }));
        } else {
            console.warn('%c[VISUALIZER] Containers not ready, retrying...', 'color: #f59e0b;');
            setTimeout(this.onAppReady.bind(this), 500);
        }
    }
    
    // Ensure chart containers exist with vanilla JavaScript
    // Vanilla JS Benefits: DOM manipulation, HTML injection, event delegation, animations
    ensureChartContainers() {
        console.log('%c[VISUALIZER] Ensuring vanilla JS chart containers...', 'color: #059669;');
        
        // Cache visualizations container
        this.visualizationsContainer = document.getElementById('visualizations-container');
        
        if (!this.visualizationsContainer) {
            console.warn('%c[VISUALIZER] Visualizations container not found, retrying...', 'color: #f59e0b;');
            return false;
        }
        
        // Only create if containers don't exist
        if (!document.getElementById('tokenUsageChart')) {
            console.log('%c[VISUALIZER] Creating vanilla JS chart containers', 'color: #059669;');
            
            // Create professional visualization layout with vanilla JS
            const container = document.createElement('div');
            container.id = 'tokenUsageChart';
            container.className = 'w-full space-y-8';
            
            // Confidence Level Section with vanilla JS
            const confidenceSection = document.createElement('div');
            confidenceSection.className = 'bg-white rounded-lg shadow-sm p-4 border border-gray-100';
            confidenceSection.innerHTML = `
                <div class="mb-3">
                    <h3 class="text-sm font-medium text-gray-700 mb-1">Annotation Confidence</h3>
                    <p class="text-xs text-gray-500">Average confidence level of your annotations based on the model's predictions.</p>
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-medium text-gray-600">Confidence Score</span>
                        <span id="confidenceValue" class="text-xs font-semibold text-gray-800">0%</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div id="confidenceProgress" 
                             class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-400 to-eu-orange" 
                             style="width: 0%">
                        </div>
                    </div>
                    <p class="text-2xs text-gray-400 text-right">Higher is better</p>
                </div>
            `;
            
            // Token Distribution Section with vanilla JS
            const tokenSection = document.createElement('div');
            tokenSection.className = 'bg-white rounded-lg shadow-sm p-4 border border-gray-100';
            tokenSection.innerHTML = `
                <div class="mb-3">
                    <h3 class="text-sm font-medium text-gray-700 mb-1">Token Distribution</h3>
                    <p class="text-xs text-gray-500">Breakdown of token usage across your annotated documents.</p>
                </div>
                <div class="relative w-full" style="min-height: 240px;">
                    <div id="tokenChart" class="w-full h-full"></div>
                    <div id="chartLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <div class="flex items-center space-x-2">
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-eu-blue"></div>
                            <span class="text-xs text-gray-500">Loading chart...</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Assemble and append with animation
            container.appendChild(confidenceSection);
            container.appendChild(tokenSection);
            container.style.display = 'none'; // Hide initially
            
            this.visualizationsContainer.appendChild(container);
            
            // Animate entrance
            setTimeout(() => {
                container.style.display = 'block';
                container.style.opacity = '0';
                container.style.transition = 'opacity 0.6s ease-in-out';
                
                // Trigger reflow to ensure animation works
                container.offsetHeight;
                container.style.opacity = '1';
            }, 10);
            
            console.log('%c[VISUALIZER] Vanilla JS containers created and animated', 'color: #059669;');
        }
        
        return true;
    }
    
    // Process document data for visualizations with vanilla JavaScript
    // Vanilla JS Benefits: Data processing with vanilla utilities, DOM updates
    processData(documents) {
        if (!documents || documents.length === 0) {
            console.warn('%c[VISUALIZER] No document data provided for vanilla JS visualization', 'color: #f59e0b;');
            return;
        }
        
        console.log('%c[VISUALIZER] Processing %d documents with vanilla JS', 'color: #059669;', documents.length);
        
        this.lastProcessedData = documents;
        
        // Process usage stats with vanilla reduce
        const usageStats = documents.reduce((stats, doc) => {
            if (doc.enrichment && doc.enrichment._usage) {
                stats.prompt_tokens += doc.enrichment._usage.prompt_tokens || 0;
                stats.completion_tokens += doc.enrichment._usage.completion_tokens || 0;
                stats.total_tokens += doc.enrichment._usage.total_tokens || 0;
            }
            return stats;
        }, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
        
        // Collect confidence scores
        const confidenceScores = documents
            .map(doc => doc.enrichment && typeof doc.enrichment.confidence === 'number' 
                ? doc.enrichment.confidence 
                : null)
            .filter(Boolean);
        
        // Ensure containers and update
        if (!this.ensureChartContainers()) {
            console.log('%c[VISUALIZER] Containers not ready, queuing update', 'color: #f59e0b;');
            setTimeout(() => this.processData(documents), 100);
            return;
        }
        
        console.log('%c[VISUALIZER] Updating charts with stats:', 'color: #059669;', usageStats);
        
        // Update charts with animations
        this.updateTokenUsageChart(usageStats);
        this.updateConfidenceProgress(confidenceScores);
        
        // Trigger update complete event
        document.dispatchEvent(new CustomEvent('visualizationsUpdated', { 
            detail: { 
                stats: usageStats, 
                confidenceCount: confidenceScores.length,
                totalDocuments: documents.length
            }
        }));
    }
    
    // Create or update token usage chart with vanilla JavaScript
    // Vanilla JS Benefits: DOM manipulation, responsive handling, loading states
    updateTokenUsageChart(usageStats) {
        console.log('%c[VISUALIZER] Updating vanilla JS token usage chart:', 'color: #059669;', usageStats);
        
        const chartElement = document.getElementById('tokenChart');
        if (!chartElement) {
            console.warn('%c[VISUALIZER] Token chart element not found', 'color: #f59e0b;');
            if (this.ensureChartContainers()) {
                setTimeout(() => this.updateTokenUsageChart(usageStats), 100);
            }
            return;
        }
        
        // Show loading state
        const loadingElement = document.getElementById('chartLoading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        
        // Ensure parent has proper dimensions
        const parent = chartElement.parentElement;
        if (parent) {
            parent.style.minHeight = '240px';
        }
        
        // Enhanced ApexCharts options with vanilla JS integration
        const chartOptions = {
            series: [usageStats.prompt_tokens, usageStats.completion_tokens],
            chart: {
                type: 'donut',
                height: '100%',
                width: '100%',
                fontFamily: 'Rubik, sans-serif',
                toolbar: { show: false },
                parentHeightOffset: 0,
                redrawOnParentResize: true,
                redrawOnWindowResize: true,
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                    animateGradually: {
                        enabled: true,
                        delay: 150
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 350
                    }
                }
            },
            colors: ['#003087', '#FF6900'],
            labels: ['Prompt Tokens', 'Completion Tokens'],
            dataLabels: { 
                enabled: false 
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '12px',
                fontFamily: 'Rubik, sans-serif',
                itemMargin: {
                    horizontal: 8,
                    vertical: 4
                },
                onItemClick: {
                    toggleDataSeries: false
                },
                onItemHover: {
                    highlightDataSeries: true
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '75%',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '12px',
                                fontFamily: 'Rubik, sans-serif',
                                color: '#4B5563',
                                offsetY: -10,
                                formatter: function() {
                                    return 'Token Usage';
                                }
                            },
                            value: {
                                show: true,
                                fontSize: '16px',
                                fontFamily: 'Rubik, sans-serif',
                                color: '#111827',
                                offsetY: 0,
                                formatter: function(val, { seriesIndex, w }) {
                                    return w && w.config && w.config.series[seriesIndex] 
                                        ? w.config.series[seriesIndex].toLocaleString() 
                                        : '0';
                                }
                            },
                            total: {
                                show: true,
                                label: 'Total',
                                color: '#111827',
                                fontSize: '14px',
                                fontFamily: 'Rubik, sans-serif',
                                formatter: function() {
                                    return usageStats.total_tokens.toLocaleString();
                                }
                            }
                        }
                    }
                }
            },
            tooltip: {
                y: { 
                    formatter: function(val) {
                        return val.toLocaleString() + ' tokens';
                    },
                    title: {
                        formatter: function(seriesName) {
                            return '<strong>' + seriesName + '</strong>';
                        }
                    }
                },
                style: {
                    fontSize: '12px',
                    fontFamily: 'Rubik, sans-serif'
                }
            },
            responsive: [{
                breakpoint: 768,
                options: {
                    chart: { 
                        height: '100%',
                        width: '100%'
                    },
                    legend: { 
                        position: 'bottom',
                        fontSize: '11px',
                        itemMargin: {
                            horizontal: 4,
                            vertical: 2
                        }
                    },
                    plotOptions: {
                        pie: {
                            donut: {
                                size: '70%',
                                labels: {
                                    name: { fontSize: '11px' },
                                    value: { fontSize: '14px' },
                                    total: { fontSize: '12px' }
                                }
                            }
                        }
                    }
                }
            }, {
                breakpoint: 480,
                options: {
                    chart: { height: 200 },
                    legend: { fontSize: '10px' },
                    plotOptions: {
                        pie: {
                            donut: {
                                size: '65%',
                                labels: {
                                    name: { fontSize: '10px' },
                                    value: { fontSize: '12px' },
                                    total: { fontSize: '11px' }
                                }
                            }
                        }
                    }
                }
            }]
        };
        
        // Destroy previous chart if it exists
        if (this.tokenUsageChart) {
            try {
                this.tokenUsageChart.destroy();
                console.log('%c[VISUALIZER] Previous chart destroyed', 'color: #059669;');
            } catch (error) {
                console.warn('%c[VISUALIZER] Error destroying previous chart:', 'color: #f59e0b;', error);
            }
        }
        
        // Create new chart with vanilla JS callback
        try {
            this.tokenUsageChart = new ApexCharts(chartElement, chartOptions);
            
            // Render with loading state management
            this.tokenUsageChart.render().then(() => {
                // Hide loading after render
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                
                // Trigger chart render complete
                document.dispatchEvent(new CustomEvent('chartRendered', { 
                    detail: { 
                        chartType: 'tokenUsage',
                        totalTokens: usageStats.total_tokens
                    }
                }));
                
                console.log('%c[VISUALIZER] Vanilla JS token chart rendered successfully', 'color: #10b981;');
            }).catch((error) => {
                console.error('%c[VISUALIZER] Error rendering chart:', 'color: #ef4444;', error);
                if (loadingElement) {
                    loadingElement.innerHTML = '<div class="text-xs text-red-500">Chart failed to load</div>';
                    loadingElement.style.display = 'flex';
                }
            });
            
        } catch (error) {
            console.error('%c[VISUALIZER] Error creating vanilla JS chart:', 'color: #ef4444;', error);
            if (loadingElement) {
                loadingElement.innerHTML = '<div class="text-xs text-red-500">Chart initialization failed</div>';
                loadingElement.style.display = 'flex';
            }
        }
    }
    
    // Update confidence progress with vanilla JavaScript animations
    // Vanilla JS Benefits: CSS class manipulation, smooth transitions, event triggering
    updateConfidenceProgress(confidenceScores = []) {
        try {
            console.log('%c[VISUALIZER] Updating vanilla JS confidence progress with %d scores', 'color: #059669;', confidenceScores.length);
            
            if (!Array.isArray(confidenceScores) || confidenceScores.length === 0) {
                console.debug('%c[VISUALIZER] No confidence scores provided', 'color: #6b7280;');
                return;
            }
            
            // Filter and calculate average
            const validScores = confidenceScores.filter(score => 
                typeof score === 'number' && score >= 0 && score <= 1
            );
            
            if (validScores.length === 0) {
                console.warn('%c[VISUALIZER] No valid confidence scores found', 'color: #f59e0b;');
                return;
            }
            
            const avgConfidence = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
            const percentage = Math.min(100, Math.max(0, Math.round(avgConfidence * 100)));
            
            const progressBar = document.getElementById('confidenceProgress');
            const progressText = document.getElementById('confidenceValue');
            
            if (!progressBar || !progressText) {
                console.warn('%c[VISUALIZER] Confidence DOM elements not found', 'color: #f59e0b;');
                return;
            }
            
            // Animate progress bar with vanilla JS
            const startTime = performance.now();
            const duration = 600;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (easeOutQuad)
                const easedProgress = 1 - Math.pow(1 - progress, 2);
                const currentPercentage = Math.round(easedProgress * percentage);
                
                // Update progress bar width
                progressBar.style.width = currentPercentage + '%';
                
                // Update text during animation
                progressText.textContent = currentPercentage + '%';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Final update after animation
                    progressText.textContent = percentage + '%';
                    
                    // Update color based on confidence with smooth transition
                    let newColorClass = '';
                    if (avgConfidence < 0.5) {
                        newColorClass = 'bg-red-500';
                    } else if (avgConfidence < 0.8) {
                        newColorClass = 'bg-yellow-500';
                    } else {
                        newColorClass = 'bg-eu-orange';
                    }
                    
                    // Remove old color classes and add new one
                    progressBar.className = progressBar.className
                        .replace(/bg-(red|yellow|eu-orange|green)-500/g, '')
                        .trim() + ' ' + newColorClass;
                    
                    console.log('%c[VISUALIZER] Confidence updated to %d%% (%s)', 'color: #059669;', percentage, newColorClass);
                    
                    // Trigger confidence update event
                    document.dispatchEvent(new CustomEvent('confidenceUpdated', { 
                        detail: { 
                            percentage: percentage, 
                            average: avgConfidence,
                            count: validScores.length
                        }
                    }));
                }
            };
            
            requestAnimationFrame(animate);
            
        } catch (error) {
            console.error('%c[VISUALIZER] Error updating vanilla JS confidence progress:', 'color: #ef4444;', error);
        }
    }
    
    // Handle column state changes for responsive layout
    // Vanilla JS Integration: Adjusts chart sizes based on column layout
    handleColumnChange(e) {
        if (!this.isInitialized) return;
        
        console.log('%c[VISUALIZER] Column %s %s - adjusting layout', 'color: #059669;', e.detail.column, e.detail.collapsed ? 'collapsed' : 'expanded');
        
        const charts = document.getElementById('tokenUsageChart');
        if (!charts) return;
        
        if (e.detail.column === 'right-column' && e.detail.collapsed) {
            // Right column collapsed - reduce chart sizes
            charts.classList.add('compact-mode');
            const whiteElements = charts.querySelectorAll('.bg-white');
            whiteElements.forEach(el => el.style.padding = '0.75rem');
            
            // Update chart dimensions
            if (this.tokenUsageChart) {
                this.tokenUsageChart.updateOptions({
                    chart: { height: '80%' },
                    plotOptions: { 
                        pie: { 
                            donut: { 
                                size: '70%' 
                            } 
                        } 
                    }
                });
            }
        } else {
            // Expand back to normal
            charts.classList.remove('compact-mode');
            const whiteElements = charts.querySelectorAll('.bg-white');
            whiteElements.forEach(el => el.style.padding = '');
            
            if (this.tokenUsageChart) {
                this.tokenUsageChart.updateOptions({
                    chart: { height: '100%' },
                    plotOptions: { 
                        pie: { 
                            donut: { 
                                size: '75%' 
                            } 
                        } 
                    }
                });
            }
        }
    }
    
    // Handle tab switching for mobile
    handleTabSwitch(e) {
        if (!this.isInitialized) return;
        
        console.log('%c[VISUALIZER] Tab switched to: %s', 'color: #059669;', e.detail.tab);
        
        const visualizations = document.getElementById('tokenUsageChart');
        if (!visualizations) return;
        
        if (e.detail.tab === 'visualizations' || e.detail.tab === 'analytics') {
            // Show visualizations with animation
            visualizations.style.display = 'block';
            visualizations.style.opacity = '0';
            visualizations.style.transition = 'opacity 0.3s ease-in-out';
            
            // Trigger reflow to ensure animation works
            visualizations.offsetHeight;
            visualizations.style.opacity = '1';
            
            // Refresh charts for current data
            if (this.lastProcessedData) {
                this.processData(this.lastProcessedData);
            }
        } else {
            // Hide when switching away
            visualizations.style.display = 'none';
        }
    }
    
    // Handle document updates from doccano.js
    handleDocumentUpdate(e) {
        console.log('%c[VISUALIZER] Documents updated - refreshing charts', 'color: #059669;', e.detail);
        
        if (e.detail && e.detail.documents) {
            this.processData(e.detail.documents);
        } else if (e.detail && e.detail.documents) {
            this.processData(e.detail.documents);
        }
    }
    
    // Cleanup method
    cleanup() {
        console.log('%c[VISUALIZER] Cleaning up vanilla JS resources', 'color: #f59e0b;');
        
        // Remove event listeners
        document.removeEventListener('appContentReady.visualizer', this.onAppReady);
        document.removeEventListener('documentsUpdated.visualizer', this.handleDocumentUpdate);
        document.removeEventListener('columnStateChanged.visualizer', this.handleColumnChange);
        document.removeEventListener('tabSwitched.visualizer', this.handleTabSwitch);
        window.removeEventListener('beforeunload.visualizer', this.cleanup);
        
        // Destroy charts
        if (this.tokenUsageChart) {
            try {
                this.tokenUsageChart.destroy();
            } catch (error) {
                console.warn('%c[VISUALIZER] Error during chart cleanup:', 'color: #f59e0b;', error);
            }
            this.tokenUsageChart = null;
        }
        
        // Remove containers
        const chartContainer = document.getElementById('tokenUsageChart');
        if (chartContainer) {
            chartContainer.remove();
        }
        this.visualizationsContainer = null;
        
        this.isInitialized = false;
    }
}

// =====================================================
// SECTION 2: INITIALIZATION AND GLOBAL ACCESS (Vanilla JS)
// =====================================================
// Vanilla JS-enhanced initialization with proper event handling.

// Initialize visualizer with DOM ready
function initializeVisualizer() {
    try {
        console.log('%c[VISUALIZER] Starting vanilla JS initialization', 'color: #059669; font-weight: bold;');
        
        // Create singleton instance
        if (!window.doccanoVisualizer) {
            window.doccanoVisualizer = new DoccanoVisualizer();
        }
        
        // Export class for external use
        window.DoccanoVisualizer = DoccanoVisualizer;
        
        // Setup additional vanilla JS utilities
        window.doccano = window.doccano || {};
        window.doccano.visualize = function(data) {
            if (window.doccanoVisualizer) {
                window.doccanoVisualizer.processData(data);
            }
            return this;
        };
        
        window.doccano.updateConfidence = function(scores) {
            if (window.doccanoVisualizer) {
                window.doccanoVisualizer.updateConfidenceProgress(scores);
            }
            return this;
        };
        
        // Responsive breakpoint handler
        window.addEventListener('resize', function() {
            if (window.doccanoVisualizer && window.doccanoVisualizer.isInitialized) {
                // Update chart responsiveness
                if (window.doccanoVisualizer.tokenUsageChart) {
                    window.doccanoVisualizer.tokenUsageChart.updateOptions({
                        responsive: [{
                            breakpoint: window.innerWidth,
                            options: {
                                chart: { 
                                    height: window.innerWidth < 768 ? '200px' : '100%' 
                                }
                            }
                        }]
                    });
                }
            }
        });
        
        console.log('%c[VISUALIZER] Vanilla JS initialization complete', 'color: #10b981; font-weight: bold;');
        
        return window.doccanoVisualizer;
        
    } catch (error) {
        console.error('%c[VISUALIZER] Failed to initialize vanilla JS visualizer:', 'color: #ef4444; font-weight: bold;', error);
        return null;
    }
}

// DOM ready initialization
if (document.readyState !== 'loading') {
    initializeVisualizer();
} else {
    document.addEventListener('DOMContentLoaded', initializeVisualizer);
}

// =====================================================
// SECTION 3: VANILLA JS UTILITY EXTENSIONS
// =====================================================
// Additional vanilla JS utilities for visualization integration.

// =====================================================
// SECTION 4: EVENT INTEGRATION GUIDE
// =====================================================
// Custom events for integration with app.js and doccano.js.

/*
// Example usage in other modules:

// Update visualizations from doccano.js
document.addEventListener('documentsUpdated', function(e) {
    window.doccano.visualize(e.detail.documents);
});

// Manual confidence update
window.doccano.updateConfidence([0.85, 0.92, 0.78]);

// Listen for visualization events
document.addEventListener('visualizerReady', function(e) {
    console.log('Visualizations ready:', e.detail.charts, 'charts initialized');
});

document.addEventListener('confidenceUpdated', function(e) {
    console.log('Confidence updated to', e.detail.percentage + '%');
    // Update UI based on confidence
});

document.addEventListener('chartRendered', function(e) {
    console.log('Chart rendered:', e.detail.chartType, e.detail.totalTokens, 'tokens');
});
*/

console.log('%c[VISUALIZER] Vanilla JS-friendly visualization module loaded and ready', 'color: #10b981; font-weight: bold; background: #f0fdf4; padding: 2px 6px; border-radius: 4px;');
