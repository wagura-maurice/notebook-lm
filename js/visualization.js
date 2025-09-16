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
    }
  }

  ensureChartContainers() {
    // Create token usage chart container if it doesn't exist
    if (!document.getElementById('tokenUsageChart')) {
      // Find the right column's content area
      const rightColumn = document.querySelector('#right-column .expanded-content .overflow-y-auto');
      if (!rightColumn) {
        console.warn('Right column content area not found. Visualization will not be displayed.');
        return false;
      }
      
      // Create container for visualizations
      const container = document.createElement('div');
      container.id = 'tokenUsageChart';
      container.className = 'bg-white p-4 rounded-lg shadow mb-4';
      
      // Add confidence progress bar HTML
      container.innerHTML = `
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-eu-blue mb-1">Confidence Level</h3>
          <p class="text-xs text-gray-500 mb-2">Average confidence level of your annotations.</p>
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-medium">Score</span>
            <span id="confidenceValue" class="text-xs font-medium">0%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-2.5">
            <div id="confidenceProgress" class="h-2.5 rounded-full transition-all duration-500 bg-eu-orange" style="width: 0%"></div>
          </div>
        </div>
        <div class="mt-2">
          <h3 class="text-sm font-semibold text-eu-blue">Token Usage</h3>
          <p class="text-xs text-gray-500 mb-1">Visual representation of token distribution across your annotated data.</p>
          <div class="h-40 mt-1" id="tokenChart"></div>
        </div>
      `;
      
      // Find the taxonomy section to insert after it
      const taxonomySection = rightColumn.querySelector('h3:has(+ .taxonomy-tags)')?.parentElement;
      
      if (taxonomySection) {
        // Insert after taxonomy section
        taxonomySection.parentNode.insertBefore(container, taxonomySection.nextElementSibling);
      } else {
        // If taxonomy section not found, insert after document info or at the top
        const documentInfo = rightColumn.querySelector('[class*="bg-eu-blue"][class*="p-4"]');
        if (documentInfo && documentInfo.nextElementSibling) {
          documentInfo.parentNode.insertBefore(container, documentInfo.nextElementSibling);
        } else {
          rightColumn.prepend(container);
        }
      }
      return true;
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
    this.ensureChartContainers();
    
    // Update visualizations
    console.log('Updating visualizations with usage stats:', usageStats);
    this.updateTokenUsageChart(usageStats);
    
    // Always update confidence progress, even if no scores (will show 0%)
    this.updateConfidenceProgress(confidenceScores);
  }

  // Create or update token usage chart
  updateTokenUsageChart(usageStats) {
    console.log('Updating token usage chart with data:', usageStats);
    const chartElement = document.getElementById('tokenUsageChart');
    if (!chartElement) {
      console.warn('Token chart container not found, attempting to initialize...');
      if (this.ensureChartContainers()) {
        this.updateTokenUsageChart(usageStats); // Retry after initialization
      }
      return;
    }

    const options = {
      series: [usageStats.prompt_tokens, usageStats.completion_tokens],
      chart: {
        type: 'donut',
        height: 200,
        fontFamily: 'Rubik, sans-serif',
        toolbar: { show: false }
      },
      colors: ['#003087', '#FF6900'],
      labels: ['Prompt Tokens', 'Completion Tokens'],
      dataLabels: { enabled: false },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        fontFamily: 'Rubik, sans-serif'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '80%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                color: '#333',
                formatter: () => usageStats.total_tokens.toLocaleString()
              }
            }
          }
        }
      },
      tooltip: {
        y: { formatter: (val) => val.toLocaleString() }
      },
      responsive: [{
        breakpoint: 768,
        options: {
          chart: { height: 180 },
          legend: { position: 'bottom' }
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
