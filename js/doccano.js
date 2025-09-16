// Function to load and process NDJSON data
async function loadNDJSONData() {
  try {
    const response = await fetch(
      "./assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson"
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

// Function to highlight taxonomy terms in text
function highlightTaxonomyTerms(text, taxonomy) {
  if (!taxonomy) return document.createTextNode(text);
  
  // Create a document fragment to hold the result
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  const matches = [];
  
  // Find all taxonomy terms and their positions
  Object.entries(taxonomy).forEach(([category, terms]) => {
    if (!Array.isArray(terms)) return;
    
    terms.forEach(term => {
      if (!term) return;
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          category: category
        });
      }
    });
  });
  
  // Sort matches by start position (longest first to handle nested matches)
  matches.sort((a, b) => b.start - a.start || (b.end - b.start) - (a.end - a.start));
  
  // Process non-overlapping matches
  const processedRanges = [];
  
  for (const match of matches) {
    // Skip if this range is already covered by a previous match
    if (processedRanges.some(range => 
        match.start >= range.start && match.end <= range.end)) {
      continue;
    }
    
    // Add text before the match
    if (match.start > lastIndex) {
      fragment.appendChild(document.createTextNode(
        text.substring(lastIndex, match.start)
      ));
    }
    
    // Create the highlighted span
    const span = document.createElement('span');
    span.className = `taxonomy-highlight taxonomy-${match.category}`;
    span.textContent = text.substring(match.start, match.end);
    
    // Add tooltip
    const tooltip = document.createElement('span');
    tooltip.className = 'taxonomy-tooltip';
    tooltip.textContent = match.category.replace(/_/g, ' ');
    span.appendChild(tooltip);
    
    fragment.appendChild(span);
    
    lastIndex = match.end;
    processedRanges.push({ start: match.start, end: match.end });
  }
  
  // Add remaining text after last match
  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
  }
  
  return fragment;
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

// Function to display document content in the middle column
function displayDocumentContent(docs) {
  const viewer = document.getElementById('document-viewer');
  if (!viewer) return;
  
  // Clear loading state
  viewer.innerHTML = '';
  
  // Group documents by their doc_id to show them together
  const docsById = {};
  
  docs.forEach(doc => {
    const docId = doc.doc_id || 'unknown';
    if (!docsById[docId]) {
      docsById[docId] = [];
    }
    docsById[docId].push(doc);
  });
  
  // Create document sections
  Object.entries(docsById).forEach(([docId, docEntries]) => {
    const docSection = document.createElement('div');
    docSection.className = 'mb-6';
    
    // Track the last normalized title to avoid repetition
    let lastNormalizedTitle = '';
    
    // Add document title (only if it exists and is different from previous)
    const docTitle = docEntries[0]?.doc ? docEntries[0].doc.replace(/_/g, ' ') : '';
    if (docTitle) {
      const title = document.createElement('h4');
      title.className = 'text-md font-semibold text-eu-blue mb-2';
      title.textContent = docTitle;
      docSection.appendChild(title);
      lastNormalizedTitle = docTitle.trim().toLowerCase(); // Initialize with normalized document title
    }
    
    // Add document content
    const content = document.createElement('div');
    content.className = 'space-y-1';
    
    let lastSection = null;
    
    docEntries.forEach((entry, index) => {
      if (!entry.text) return;
      
      // Add section header if it's different from the last one
      if (entry.section && entry.section !== lastSection) {
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'mt-4 mb-2';
        
        const sectionTitle = document.createElement('h5');
        sectionTitle.className = 'text-sm font-medium text-eu-blue flex items-center';
        
        const icon = document.createElement('i');
        icon.className = `${getSectionIcon(entry.section)} mr-2`;
        sectionTitle.appendChild(icon);
        
        sectionTitle.appendChild(document.createTextNode(entry.section));
        sectionHeader.appendChild(sectionTitle);
        content.appendChild(sectionHeader);
        
        lastSection = entry.section;
      }
      
      // Add title only if it's different from the last one (case-insensitive and trimmed)
      const entryTitle = entry.enrichment?.title;
      if (entryTitle) {
        const normalizedTitle = entryTitle.trim().toLowerCase();
        
        if (normalizedTitle && normalizedTitle !== lastNormalizedTitle) {
          const titleElement = document.createElement('div');
          titleElement.className = 'text-sm font-semibold text-eu-blue mt-2 mb-1';
          titleElement.textContent = entryTitle.trim(); // Display original case but trimmed
          content.appendChild(titleElement);
          lastNormalizedTitle = normalizedTitle; // Store normalized version for comparison
        }
        // Skip if title is empty or same as previous (case-insensitive)
      }
      
      // Create container for the entry
      const entryContainer = document.createElement('div');
      entryContainer.className = 'flex items-start group mb-1';
      
      // Line number
      const lineNumber = document.createElement('span');
      lineNumber.className = 'text-xs text-gray-400 w-8 flex-shrink-0 mt-0.5';
      lineNumber.textContent = (index + 1).toString().padStart(3, '0');
      entryContainer.appendChild(lineNumber);
      
      // Content container
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'flex-1';
      
      // Handle different structure types
      switch(entry.structure_type) {
        case 'table_row':
          const tableRow = document.createElement('div');
          tableRow.className = 'flex border-b border-gray-100 py-1';
          
          // Split by tabs or multiple spaces for table cells
          const cells = entry.text.split(/\t| {2,}/).filter(cell => cell.trim() !== '');
          cells.forEach(cell => {
            const cellEl = document.createElement('div');
            cellEl.className = 'px-2 flex-1 text-sm';
            
            // Apply taxonomy highlighting to table cells if available
            if (entry.enrichment?.taxonomy) {
              cellEl.appendChild(highlightTaxonomyTerms(
                cell.trim(),
                entry.enrichment.taxonomy
              ));
            } else {
              cellEl.textContent = cell.trim();
            }
            
            tableRow.appendChild(cellEl);
          });
          
          contentWrapper.appendChild(tableRow);
          break;
          
        case 'heading':
          const heading = document.createElement('h6');
          heading.className = 'font-semibold text-eu-blue mt-2 mb-1';
          
          // Apply taxonomy highlighting to headings if available
          if (entry.enrichment?.taxonomy) {
            heading.appendChild(highlightTaxonomyTerms(
              entry.text,
              entry.enrichment.taxonomy
            ));
          } else {
            heading.textContent = entry.text;
          }
          
          contentWrapper.appendChild(heading);
          break;
          
        case 'list_item':
          const listItem = document.createElement('div');
          listItem.className = 'flex items-start';
          
          const bullet = document.createElement('span');
          bullet.className = 'mr-2';
          bullet.textContent = '•';
          
          const textElement = document.createElement('p');
          textElement.className = 'text-sm text-gray-700';
          
          // Check if we have taxonomy data to highlight
          if (entry.enrichment?.taxonomy) {
            textElement.appendChild(highlightTaxonomyTerms(
              entry.text, 
              entry.enrichment.taxonomy
            ));
          } else {
            textElement.textContent = entry.text;
          }
          
          listItem.appendChild(bullet);
          listItem.appendChild(textElement);
          contentWrapper.appendChild(listItem);
          break;
          
        case 'prose':
        default:
          const paragraph = document.createElement('p');
          paragraph.className = 'text-sm text-gray-800 mb-2';
          
          // Apply taxonomy highlighting to prose text if available
          if (entry.enrichment?.taxonomy) {
            paragraph.appendChild(highlightTaxonomyTerms(
              entry.text,
              entry.enrichment.taxonomy
            ));
          } else {
            paragraph.textContent = entry.text;
          }
          
          contentWrapper.appendChild(paragraph);
      }
      
      // Add any metadata if present
      if (entry.metadata) {
        const meta = document.createElement('div');
        meta.className = 'text-xs text-gray-500 mt-1 ml-8';
        meta.textContent = Object.entries(entry.metadata)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' • ');
        contentWrapper.appendChild(meta);
      }
      
      entryContainer.appendChild(contentWrapper);
      content.appendChild(entryContainer);
    });
    
    docSection.appendChild(content);
    viewer.appendChild(docSection);
  });
}

// Function to process documents and group by section
function processDocuments(docs) {
  const sections = {};
  
  // First, display all documents in the viewer
  displayDocumentContent(docs);
  
  // Then process for the left sidebar
  docs.forEach((doc, index) => {
    const sectionTitle = doc.section || 'Uncategorized';
    
    if (!sections[sectionTitle]) {
      sections[sectionTitle] = {
        title: sectionTitle,
        docs: [],
        icon: getSectionIcon(sectionTitle)
      };
    }
    
    sections[sectionTitle].docs.push(doc);
  });

  // Return both the sections for the sidebar and the original docs array
  return {
    sections: sections,
    documents: docs
  };
}

// Update document analysis in the left column
function updateDocumentAnalysis(documents) {
  const analysisContainer = document.querySelector('.document-analysis');
  if (!analysisContainer) return;

  // Count documents by type
  const docTypes = {};
  let totalWords = 0;
  let totalChars = 0;

  documents.forEach(doc => {
    const type = doc.structure_type || 'unknown';
    docTypes[type] = (docTypes[type] || 0) + 1;
    
    if (doc.text) {
      totalWords += doc.text.split(/\s+/).length;
      totalChars += doc.text.length;
    }
  });

  // Update the analysis HTML
  let analysisHTML = `
    <div class="space-y-4">
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Document Stats</h4>
        <div class="space-y-1">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Total Documents</span>
            <span class="font-medium">${documents.length}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Total Words</span>
            <span class="font-medium">${totalWords.toLocaleString()}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Total Characters</span>
            <span class="font-medium">${totalChars.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Document Types</h4>
        <div class="space-y-1">
          ${Object.entries(docTypes)
            .map(([type, count]) => `
              <div class="flex justify-between text-sm">
                <span class="text-gray-600 capitalize">${type.replace('_', ' ')}</span>
                <span class="font-medium">${count}</span>
              </div>
            `)
            .join('')}
        </div>
      </div>
    </div>
  `;

  analysisContainer.innerHTML = analysisHTML;
}

// Toggle between expanded and collapsed views for both left and right columns
function setupSidebarToggle() {
  // Left column toggle
  const collapseLeftBtn = document.getElementById('collapse-left');
  const expandLeftBtn = document.getElementById('expand-left');
  const leftColumn = document.getElementById('left-column');
  
  // Right column toggle
  const collapseRightBtn = document.getElementById('collapse-right');
  const expandRightBtn = document.getElementById('expand-right');
  const rightColumn = document.getElementById('right-column');
  
  // Toggle left column
  if (collapseLeftBtn) {
    collapseLeftBtn.addEventListener('click', (e) => {
      e.preventDefault();
      leftColumn.classList.add('collapsed');
      leftColumn.classList.remove('lg:w-72');
      leftColumn.classList.add('lg:w-16');
      // Update chevron icon
      collapseLeftBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    });
  }
  
  if (expandLeftBtn) {
    expandLeftBtn.addEventListener('click', (e) => {
      e.preventDefault();
      leftColumn.classList.remove('collapsed');
      leftColumn.classList.add('lg:w-72');
      leftColumn.classList.remove('lg:w-16');
      // Update chevron icon
      expandLeftBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    });
  }
  
  // Toggle right column
  if (collapseRightBtn) {
    collapseRightBtn.addEventListener('click', (e) => {
      e.preventDefault();
      rightColumn.classList.add('collapsed');
      rightColumn.classList.remove('lg:hover:w-80');
      rightColumn.classList.add('lg:w-16');
      // Update chevron icon
      collapseRightBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    });
  }
  
  if (expandRightBtn) {
    expandRightBtn.addEventListener('click', (e) => {
      e.preventDefault();
      rightColumn.classList.remove('collapsed');
      rightColumn.classList.add('lg:hover:w-80');
      rightColumn.classList.remove('lg:w-16');
      // Update chevron icon
      expandRightBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
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
    const { sections, documents } = processDocuments(rawDocuments);
    console.log('Processed documents:', documents.length);

    // Hide loading state
    loadingElement.style.display = 'none';
    
    // If no sections found, show message
    if (!sections || Object.keys(sections).length === 0) {
      document.getElementById('document-sections').innerHTML = `
        <div class="text-center py-4 text-eu-blue/70">
          No document sections found.
        </div>
      `;
      return;
    }

    // Process and display documents
    documents.forEach((doc) => {
      populateSection(doc);
    });

    // Process and display taxonomy data
    const taxonomyData = processTaxonomyData(documents);
    renderTaxonomy(taxonomyData);
    
    // Update document info with the latest document
    const latestDoc = documents.sort((a, b) => new Date(b._ts) - new Date(a._ts))[0];
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

    // Initialize tooltips
    function initializeTooltips() {
      // Initialize any tooltips in the application
      const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
      
      tooltipTriggers.forEach(trigger => {
        const tooltipText = trigger.getAttribute('data-tooltip');
        if (!tooltipText) return;
        
        trigger.setAttribute('title', tooltipText);
        
        // Add custom tooltip styling if not already added
        if (!document.querySelector('style[data-tooltip-styles]')) {
          const style = document.createElement('style');
          style.setAttribute('data-tooltip-styles', '');
          style.textContent = `
            [data-tooltip] {
              position: relative;
              cursor: help;
            }
            [data-tooltip]:hover::after {
              content: attr(data-tooltip);
              position: absolute;
              bottom: 100%;
              left: 50%;
              transform: translateX(-50%);
              background: #003087;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              white-space: nowrap;
              z-index: 1000;
              pointer-events: none;
              opacity: 0;
              transition: opacity 0.2s;
            }
            [data-tooltip]:hover::after {
              opacity: 1;
            }
          `;
          document.head.appendChild(style);
        }
      });
    }

    // Set up event listeners for the first time
    function setupEventListeners() {
      // Add any global event listeners here
      console.log('Event listeners initialized');

      // Initialize tooltips
      initializeTooltips();

      // Document Info Modal
      const documentInfoIcon = document.getElementById('document-info-icon');
      const documentInfoModal = document.getElementById('document-info-modal');
      const closeDocumentInfo = document.getElementById('close-document-info');

      if (documentInfoIcon && documentInfoModal) {
        // Show modal on icon click
        documentInfoIcon.addEventListener('click', (e) => {
          e.stopPropagation();
          documentInfoModal.classList.toggle('hidden');
        });

        // Close modal on close button click
        if (closeDocumentInfo) {
          closeDocumentInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            documentInfoModal.classList.add('hidden');
          });
        }

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
          if (!documentInfoModal.contains(e.target) && e.target !== documentInfoIcon) {
            documentInfoModal.classList.add('hidden');
          }
        });
      }
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

// Populate a section in the left column
function populateSection(data) {
  if (!data.enrichment) return;

  const template = document.querySelector('.document-section[data-section-id="template"]');
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
    if (data.enrichment._model) {
      el.textContent = data.enrichment._model;
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
