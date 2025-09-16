// visualization.js - Visualization utilities for Doccano

class DoccanoVisualizer {
  constructor() {
    this.tokenUsageChart = null;
    this.initializeCharts();
  }

  initializeCharts() {
    // Initialize chart containers if they don't exist
    const containersReady = this.ensureChartContainers();
    if (!containersReady) {
      console.warn('Could not initialize charts: Required containers not found');
      // Retry initialization after a short delay in case the container isn't ready yet
      setTimeout(() => this.initializeCharts(), 500);
    }
  }

  ensureChartContainers() {
    console.log('Ensuring chart containers exist...');
    const visualizationsContainer = document.getElementById('visualizations-container');
    
    if (!visualizationsContainer) {
      console.warn('Visualizations container not found. Will retry...');
      return false;
    }

    // Only create containers if they don't exist
    if (!document.getElementById('tokenUsageChart')) {
      // Create container for visualizations
      const container = document.createElement('div');
      container.id = 'tokenUsageChart';
      container.className = 'w-full';
      
      // Add confidence progress bar HTML with improved chart container
      container.innerHTML = `
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-1">Confidence Level</h3>
          <p class="text-xs text-gray-500 mb-2">Average confidence level of your annotations.</p>
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-medium">Score</span>
            <span id="confidenceValue" class="text-xs font-medium">0%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div id="confidenceProgress" class="h-2.5 rounded-full transition-all duration-500 bg-eu-orange" style="width: 0%"></div>
          </div>
        </div>
        <div class="mt-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-1">Token Usage</h3>
          <p class="text-xs text-gray-500 mb-2">Visual representation of token distribution across your annotated data.</p>
          <div class="relative w-full" style="min-height: 200px;">
            <div id="tokenChart" class="w-full h-full absolute"></div>
          </div>
        </div>
      `;
      
      // Clear and append to visualizations container
      visualizationsContainer.innerHTML = '';
      visualizationsContainer.appendChild(container);
      
      // Initialize any charts if data is available
      if (this.lastProcessedData) {
        this.processData(this.lastProcessedData);
      }
    }
    
    return true;
  }

  // Process document data for visualizations
  processData(documents) {
    if (!documents || documents.length === 0) {
      console.warn('No document data provided for visualization');
      return;
    }
    
    console.log('Processing data for visualization, document count:', documents.length);
    
    // Store the processed data for potential reinitialization
    this.lastProcessedData = documents;
    
    const usageStats = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };
    
    const confidenceScores = [];

    // Process each document entry
    documents.forEach(doc => {
      // Check for enrichment data
      if (doc.enrichment) {
        // Aggregate usage stats
        if (doc.enrichment._usage) {
          usageStats.prompt_tokens += doc.enrichment._usage.prompt_tokens || 0;
          usageStats.completion_tokens += doc.enrichment._usage.completion_tokens || 0;
          usageStats.total_tokens += doc.enrichment._usage.total_tokens || 0;
        }
        
        // Collect confidence scores if available
        if (typeof doc.enrichment.confidence === 'number') {
          confidenceScores.push(doc.enrichment.confidence);
        }
      }
    });

    // Ensure chart containers exist
    if (!this.ensureChartContainers()) {
      console.log('Containers not ready, will retry after initialization');
      return;
    }
    
    // Update visualizations
    console.log('Updating visualizations with usage stats:', usageStats);
    this.updateTokenUsageChart(usageStats);
    
    // Always update confidence progress, even if no scores (will show 0%)
    this.updateConfidenceProgress(confidenceScores);
  }

  // Create or update token usage chart
  updateTokenUsageChart(usageStats) {
    console.log('Updating token usage chart with data:', usageStats);
    const chartElement = document.getElementById('tokenChart');
    if (!chartElement) {
      console.warn('Token chart element not found, attempting to initialize...');
      if (this.ensureChartContainers()) {
        // Small delay to ensure DOM is ready
        setTimeout(() => this.updateTokenUsageChart(usageStats), 100);
      }
      return;
    }

    // Ensure we have a valid parent container
    const parentElement = chartElement.parentElement;
    if (parentElement) {
      // Set a minimum height to prevent layout shifts
      parentElement.style.minHeight = '200px';
    }

    const options = {
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
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '16px',
                fontFamily: 'Rubik, sans-serif',
                color: '#111827',
                offsetY: 0,
                formatter: (val) => {
                  return val ? Math.round(val) + '%' : '0%';
                }
              },
              total: {
                show: true,
                label: 'Total',
                color: '#111827',
                fontSize: '14px',
                fontFamily: 'Rubik, sans-serif',
                formatter: () => usageStats.total_tokens.toLocaleString()
              }
            }
          }
        }
      },
      tooltip: {
        y: { 
          formatter: (val) => `${val.toLocaleString()} tokens`,
          title: {
            formatter: (seriesName) => seriesName
          }
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
            fontSize: '11px'
          },
          plotOptions: {
            pie: {
              donut: {
                size: '70%'
              }
            }
          }
        }
      }]
    };

    // Destroy previous chart if it exists
    if (this.tokenUsageChart) {
      this.tokenUsageChart.destroy();
    }

    // Create new chart
    this.tokenUsageChart = new ApexCharts(chartElement, options);
    this.tokenUsageChart.render();
  }

  // Update confidence progress bar
  updateConfidenceProgress(confidenceScores) {
    console.log('Updating confidence progress with scores:', confidenceScores);
    if (!confidenceScores.length) {
      console.log('No confidence scores available');
      return;
    }

    const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
    const percentage = Math.round(avgConfidence * 100);
    
    const progressBar = document.getElementById('confidenceProgress');
    const progressText = document.getElementById('confidenceValue');
    
    if (progressBar && progressText) {
      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${percentage}%`;
      
      // Update color based on confidence level
      progressBar.className = 'h-2.5 rounded-full transition-all duration-500 ' +
        (avgConfidence < 0.5 ? 'bg-red-500' : 
         avgConfidence < 0.8 ? 'bg-yellow-500' : 'bg-eu-orange');
    }
  }
}

// Initialize visualizer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the visualizer
  window.doccanoVisualizer = new DoccanoVisualizer();
  
  // Listen for document updates to refresh visualizations
  document.addEventListener('documentsUpdated', (event) => {
    if (event.detail && event.detail.documents) {
      window.doccanoVisualizer.processData(event.detail.documents);
    }
  });
});

// Export for use in other files
window.DoccanoVisualizer = DoccanoVisualizer;
