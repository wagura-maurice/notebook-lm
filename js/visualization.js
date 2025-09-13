// visualization.js - Visualization utilities for Doccano

class DoccanoVisualizer {
  constructor(doccanoApp) {
    this.doccanoApp = doccanoApp;
    this.tokenUsageChart = null;
    this.initialize();
  }

  initialize() {
    // Initialize any required event listeners or setup
  }

  // Process document data for visualizations
  processData(documentData) {
    console.log('Processing data for visualization, document count:', documentData.length);
    const usageStats = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };
    
    const confidenceScores = [];

    // Process each document entry
    documentData.forEach(doc => {
      // Aggregate usage stats
      if (doc.enrichment?._usage) {
        usageStats.prompt_tokens += doc.enrichment._usage.prompt_tokens || 0;
        usageStats.completion_tokens += doc.enrichment._usage.completion_tokens || 0;
        usageStats.total_tokens += doc.enrichment._usage.total_tokens || 0;
      }
      
      // Collect confidence scores
      if (typeof doc.enrichment?.confidence === 'number') {
        confidenceScores.push(doc.enrichment.confidence);
      }
    });

    // Update visualizations
    console.log('Updating visualizations with usage stats:', usageStats);
    console.log('Confidence scores:', confidenceScores);
    this.updateTokenUsageChart(usageStats);
    this.updateConfidenceProgress(confidenceScores);
  }

  // Create or update token usage chart
  updateTokenUsageChart(usageStats) {
    console.log('Updating token usage chart with data:', usageStats);
    const chartElement = document.getElementById('tokenUsageChart');
    if (!chartElement) {
      console.error('Token usage chart element not found');
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
            size: '65%',
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

// Export for use in other files
window.DoccanoVisualizer = DoccanoVisualizer;
