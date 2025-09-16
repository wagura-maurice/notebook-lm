// Function to load and process NDJSON data
async function loadNDJSONData() {
  try {
    const response = await fetch(
      "/assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson"
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const documents = lines.map((line) => JSON.parse(line));

    return documents;
  } catch (error) {
    console.error("Error loading NDJSON data:", error);
    throw error;
  }
}

// Function to get an appropriate icon based on section title
function getSectionIcon(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('intro') || titleLower.includes('overview')) {
    return 'fas fa-home';
  } else if (titleLower.includes('method') || titleLower.includes('approach')) {
    return 'fas fa-flask';
  } else if (titleLower.includes('result') || titleLower.includes('finding')) {
    return 'fas fa-chart-bar';
  } else if (titleLower.includes('conclusion') || titleLower.includes('summary')) {
    return 'fas fa-check-circle';
  } else if (titleLower.includes('recommend') || titleLower.includes('suggestion')) {
    return 'fas fa-lightbulb';
  } else if (titleLower.includes('reference') || titleLower.includes('citation')) {
    return 'fas fa-book';
  }
  
  // Default icon
  return 'fas fa-file-alt';
}

// Function to process taxonomy data from all documents
function processTaxonomyData(docs) {
  const taxonomyCounts = {};

  // Count occurrences of each taxonomy key
  docs.forEach(doc => {
    if (doc.enrichment?.taxonomy) {
      Object.entries(doc.enrichment.taxonomy).forEach(([category, items]) => {
        if (Array.isArray(items) && items.length > 0) {
          if (!taxonomyCounts[category]) {
            taxonomyCounts[category] = 0;
          }
          // Count this taxonomy key once per document
          taxonomyCounts[category]++;
        }
      });
    }
  });

  // Convert to array of objects with counts
  return Object.entries(taxonomyCounts).map(([key, count]) => ({
    key,
    count
  }));
}

// Function to render taxonomy keys in the right column
function renderTaxonomy(taxonomyData) {
  const container = document.getElementById('taxonomy-container');
  if (!container) return;

  if (taxonomyData.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-500 italic">No taxonomy data available</p>';
    return;
  }

  // Color schemes for taxonomy items - deeper colors for better visibility
  const colorSchemes = [
    { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
    { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
    { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-600' },
    { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
    { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700' },
    { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600' },
    { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700' },
    { bg: 'bg-gray-600', text: 'text-white', border: 'border-gray-700' },
    { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-600' },
    { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600' },
    { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
    { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700' }
  ];

  // Sort by count (descending)
  taxonomyData.sort((a, b) => b.count - a.count);
  
  let html = '';
  
  taxonomyData.forEach((item, index) => {
    const colorScheme = colorSchemes[index % colorSchemes.length];
    const formattedKey = item.key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    html += `
      <div class="flex items-center justify-between py-1.5 px-3 hover:bg-gray-50 transition-colors">
        <div class="flex items-center">
          <span class="inline-flex items-center justify-center w-5 h-5 mr-2 rounded-sm ${colorScheme.bg} ${colorScheme.border} border"></span>
          <span class="text-sm text-gray-800 font-medium">${formattedKey}</span>
        </div>
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-eu-blue/10 text-eu-blue text-xs font-semibold">
          ${new Intl.NumberFormat().format(item.count)}
        </span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Function to process documents and group by section
function processDocuments(docs) {
  const sections = new Map();

  docs.forEach((doc) => {
    if (!doc.enrichment) return;

    const sectionData = {
      id: doc.id,
      doc: doc.doc,
      header: doc.header,
      text: doc.text,
      enrichment: doc.enrichment,
      annotations: doc.annotations,
      model: doc.enrichment._model,
      _ts: doc._ts,
      icon: getSectionIcon(doc.enrichment.title || 'section')
    };

    sections.set(doc.id, sectionData);
  });

  return Array.from(sections.values());
}

// Toggle between expanded and collapsed views
function setupSidebarToggle() {
  const collapseBtn = document.getElementById('collapse-left');
  const expandBtn = document.getElementById('expand-left');
  const leftColumn = document.getElementById('left-column');
  
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      leftColumn.classList.add('collapsed');
      leftColumn.querySelector('.expanded-content').classList.add('hidden');
      leftColumn.querySelector('.collapsed-content').classList.remove('hidden');
      leftColumn.classList.remove('lg:w-72');
      leftColumn.classList.add('lg:w-16');
    });
  }
  
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      leftColumn.classList.remove('collapsed');
      leftColumn.querySelector('.expanded-content').classList.remove('hidden');
      leftColumn.querySelector('.collapsed-content').classList.add('hidden');
      leftColumn.classList.add('lg:w-72');
      leftColumn.classList.remove('lg:w-16');
    });
  }
}

// Update the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", async function () {
  // Set up sidebar toggle functionality
  setupSidebarToggle();
  try {
    // Show loading state
    const loadingElement = document.getElementById("sections-loading");
    const sectionsContainer = document.getElementById("document-sections");

    // Load and process the NDJSON data
    console.log('Loading NDJSON data...');
    const rawDocuments = await loadNDJSONData();
    console.log('Raw documents loaded:', rawDocuments.length);
    const processedDocuments = processDocuments(rawDocuments);
    console.log('Processed documents:', processedDocuments.length);

    // Hide loading state
    loadingElement.style.display = "none";

    if (processedDocuments.length === 0) {
      sectionsContainer.innerHTML = `
        <div class="text-center py-4 text-eu-blue/70">
          No document sections found.
        </div>
      `;
      return;
    }

    // Process and display documents
    processedDocuments.forEach((doc) => {
      populateSection(doc);
    });

    // Process and display taxonomy data
    const taxonomyData = processTaxonomyData(processedDocuments);
    renderTaxonomy(taxonomyData);
    
    // Update document info with the latest document
    const latestDoc = processedDocuments.sort((a, b) => new Date(b._ts) - new Date(a._ts))[0];
    if (latestDoc) {
      // Update document info in both columns using the populateDocumentInfo function
      populateDocumentInfo(latestDoc);
      
      // Also update the document length if available
      if (latestDoc.annotations) {
        const lengthElements = document.querySelectorAll('.document-length');
        const length = latestDoc.annotations.length || 0;
        const words = latestDoc.annotations.words || 0;
        lengthElements.forEach(el => {
          el.textContent = `${length} characters • ${words} words`;
        });
      }
    }

    // Notify other components that documents are loaded
    const event = new CustomEvent('documentsUpdated', {
      detail: { documents: rawDocuments }
    });
    document.dispatchEvent(event);

    // Set up event listeners for the first time
    function setupEventListeners() {
      // Add any global event listeners here
      console.log('Event listeners initialized');
    }
    
    setupEventListeners();

    // Open the first section by default
    const firstSection = document.querySelector(
      '.document-section:not([data-section-id="template"])'
    );
    if (firstSection) {
      const firstTrigger = firstSection.querySelector(".section-trigger");
      firstTrigger.click();
    }
  } catch (error) {
    console.error("Error initializing document:", error);
    document.getElementById("sections-loading").innerHTML = `
      <div class="text-center py-4 text-eu-orange">
        Error loading document. Please try again later.
      </div>
    `;
  }
});

// Function to create a collapsed section icon
function createCollapsedSectionIcon(sectionData) {
  const icon = document.createElement('div');
  icon.className = 'relative group w-full flex justify-center py-2 hover:bg-eu-blue/10 transition-colors cursor-pointer';
  icon.setAttribute('data-section-id', sectionData.id);
  icon.title = sectionData.enrichment.title || 'Section';
  
  const iconElement = document.createElement('i');
  iconElement.className = `${sectionData.icon || 'fas fa-file-alt'} text-eu-blue text-lg`;
  
  // Add tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'absolute left-full ml-2 px-2 py-1 bg-eu-blue text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50';
  tooltip.textContent = sectionData.enrichment.title || 'Section';
  
  icon.appendChild(iconElement);
  icon.appendChild(tooltip);
  
  // Add click handler to scroll to section
  icon.addEventListener('click', () => {
    const section = document.querySelector(`[data-section-id="${sectionData.id}"]`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      // Highlight the section briefly
      section.style.backgroundColor = 'rgba(0, 48, 135, 0.1)';
      setTimeout(() => {
        section.style.backgroundColor = '';
      }, 1500);
    }
  });
  
  return icon;
}

// Update the populateSection function to handle the new data structure
function populateSection(data) {
  if (!data.enrichment) return;

  const template = document.querySelector(
    '.document-section[data-section-id="template"]'
  );
  const clone = template.cloneNode(true);

  clone.style.display = "";
  clone.setAttribute("data-section-id", data.id);

  // Update content
  const title = data.enrichment.title || "Untitled Section";
  const summary = data.enrichment.summary || "No summary available.";
  const keywords = data.enrichment.keywords || [];

  clone.querySelector(".section-title").textContent = title;
  clone.querySelector(".section-summary").textContent = summary;

  // Add keywords
  const keywordsContainer = clone.querySelector(".section-keywords");
  keywordsContainer.innerHTML = keywords
    .map(
      (keyword) =>
        `<span class="px-2 py-0.5 bg-eu-orange/20 text-eu-blue text-xs rounded-full">${keyword}</span>`
    )
    .join("");

  // Add to container
  document.getElementById("document-sections").appendChild(clone);
  
  // Add to collapsed view
  const collapsedSections = document.getElementById("collapsed-sections");
  if (collapsedSections) {
    const icon = createCollapsedSectionIcon(data);
    collapsedSections.appendChild(icon);
  }

  // Set up click handler
  const trigger = clone.querySelector(".section-trigger");
  trigger.addEventListener("click", function () {
    const content = this.nextElementSibling;
    const icon = this.querySelector("i");

    // Close all other sections
    document.querySelectorAll(".section-content").forEach((section) => {
      if (section !== content) {
        section.classList.add("hidden");
        const sectionIcon = section.previousElementSibling.querySelector("i");
        if (sectionIcon) {
          sectionIcon.classList.remove("fa-chevron-up");
          sectionIcon.classList.add("fa-chevron-down");
        }
      }
    });

    // Toggle current section
    content.classList.toggle("hidden");
    icon.classList.toggle("fa-chevron-up");
    icon.classList.toggle("fa-chevron-down");
  });
}

// Update the populateDocumentInfo function
function populateDocumentInfo(data) {
  console.log('populateDocumentInfo called with data:', data);
  if (!data) {
    console.error('No data provided to populateDocumentInfo');
    return;
  }

  // Update document title in both columns
  const docTitleElements = document.querySelectorAll(".document-title");
  docTitleElements.forEach(el => {
    el.textContent = data.doc ? data.doc.split("_").join(" ") : "Untitled Document";
  });

  // Update last updated time in both columns
  const docUpdatedElements = document.querySelectorAll(".document-updated");
  docUpdatedElements.forEach(el => {
    if (data._ts) {
      el.textContent = formatDate(data._ts);
    }
  });

  // Update document model in both columns
  const modelElements = document.querySelectorAll(".document-model");
  modelElements.forEach(el => {
    if (data.model) {
      el.textContent = data.model;
    }
  });

  // Update document length and word count
  const lengthElements = document.querySelectorAll(".document-length");
  if (data.annotations) {
    const length = data.annotations.length || 0;
    const words = data.annotations.words || 0;
    lengthElements.forEach(el => {
      el.textContent = `${length} characters • ${words} words`;
    });
  }

  // Update confidence display if available
  const confidenceElements = document.querySelectorAll(".confidence-value");
  if (data.enrichment?.confidence) {
    const confidence = Math.round(data.enrichment.confidence * 100);
    confidenceElements.forEach(el => {
      el.textContent = confidence;
      // Add color coding based on confidence level
      if (confidence < 50) {
        el.className = 'confidence-value text-eu-orange';
      } else if (confidence < 80) {
        el.className = 'confidence-value text-yellow-500';
      } else {
        el.className = 'confidence-value text-green-600';
      }
    });
  }
}

// Keep the formatDate function
function formatDate(dateString) {
  if (!dateString) return "Unknown date";
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid date";
  }
}
