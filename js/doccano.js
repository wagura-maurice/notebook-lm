// Global function to hide context menu
function hideMenu(clickEvent) {
  const menu = document.getElementById('context-menu');
  if (menu && !menu.contains(clickEvent.target)) {
    menu.style.display = 'none';
    document.removeEventListener('click', hideMenu);
  }
}

// Global state for the highlighter
const highlighterState = {
  currentSelection: null,
  currentRange: null,
  taxonomyColorMap: new Map(),
  colorSchemes: [
    { 
      bg: 'bg-blue-500', 
      text: 'text-white', 
      border: 'border-blue-600',
      highlight: 'bg-blue-100',
      highlightBorder: 'border-blue-200',
      textColor: 'text-blue-800'
    },
    { 
      bg: 'bg-green-500', 
      text: 'text-white', 
      border: 'border-green-600',
      highlight: 'bg-green-100',
      highlightBorder: 'border-green-200',
      textColor: 'text-green-800'
    },
    { 
      bg: 'bg-yellow-500', 
      text: 'text-white', 
      border: 'border-yellow-600',
      highlight: 'bg-yellow-100',
      highlightBorder: 'border-yellow-200',
      textColor: 'text-yellow-800'
    },
    { 
      bg: 'bg-red-500', 
      text: 'text-white', 
      border: 'border-red-600',
      highlight: 'bg-red-100',
      highlightBorder: 'border-red-200',
      textColor: 'text-red-800'
    },
    { 
      bg: 'bg-purple-600', 
      text: 'text-white', 
      border: 'border-purple-700',
      highlight: 'bg-purple-100',
      highlightBorder: 'border-purple-200',
      textColor: 'text-purple-800'
    },
    { 
      bg: 'bg-pink-500', 
      text: 'text-white', 
      border: 'border-pink-600',
      highlight: 'bg-pink-100',
      highlightBorder: 'border-pink-200',
      textColor: 'text-pink-800'
    },
    { 
      bg: 'bg-indigo-600', 
      text: 'text-white', 
      border: 'border-indigo-700',
      highlight: 'bg-indigo-100',
      highlightBorder: 'border-indigo-200',
      textColor: 'text-indigo-800'
    },
    { 
      bg: 'bg-gray-600', 
      text: 'text-white', 
      border: 'border-gray-700',
      highlight: 'bg-gray-100',
      highlightBorder: 'border-gray-200',
      textColor: 'text-gray-800'
    },
    { 
      bg: 'bg-cyan-500', 
      text: 'text-white', 
      border: 'border-cyan-600',
      highlight: 'bg-cyan-100',
      highlightBorder: 'border-cyan-200',
      textColor: 'text-cyan-800'
    },
    { 
      bg: 'bg-teal-500', 
      text: 'text-white', 
      border: 'border-teal-600',
      highlight: 'bg-teal-100',
      highlightBorder: 'border-teal-200',
      textColor: 'text-teal-800'
    },
    { 
      bg: 'bg-amber-500', 
      text: 'text-white', 
      border: 'border-amber-600',
      highlight: 'bg-amber-100',
      highlightBorder: 'border-amber-200',
      textColor: 'text-amber-800'
    },
    { 
      bg: 'bg-rose-600', 
      text: 'text-white', 
      border: 'border-rose-700',
      highlight: 'bg-rose-100',
      highlightBorder: 'border-rose-200',
      textColor: 'text-rose-800'
    }
  ]
};

// Function to create context menu
function createContextMenu() {
  // Check if menu already exists
  let menu = document.getElementById('context-menu');
  if (menu) return menu;
  
  console.log('Creating new context menu');
  menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.className = 'fixed hidden bg-white rounded-lg shadow-lg z-50 py-2 min-w-[200px] border border-gray-200';
  
  // Create menu structure
  const menuItems = document.createElement('div');
  menuItems.className = 'context-menu__items';
  
  const menuHeader = document.createElement('div');
  menuHeader.className = 'px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100';
  menuHeader.textContent = 'Add Label';
  
  const optionsContainer = document.createElement('div');
  optionsContainer.id = 'taxonomy-options';
  optionsContainer.className = 'max-h-60 overflow-y-auto';
  
  // Assemble the menu
  menuItems.appendChild(menuHeader);
  menuItems.appendChild(optionsContainer);
  menu.appendChild(menuItems);
  
  // Add to body
  document.body.appendChild(menu);
  console.log('Context menu created');
  return menu;
}

// Helper function to position and show the menu
function positionAndShowMenu(menu, event) {
  if (!menu || !event) return;
  
  try {
    // Prevent the context menu from appearing
    event.preventDefault();
    
    // Hide any existing context menus
    document.querySelectorAll('.context-menu').forEach(m => {
      if (m !== menu) m.style.display = 'none';
    });
    
    // Position the menu
    menu.style.display = 'block';
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;
    
    // Use setTimeout to avoid immediate hide
    setTimeout(() => {
      document.addEventListener('click', hideMenu);
    }, 0);
    
  } catch (error) {
    console.error('Error positioning menu:', error);
  }
}

// Function to show context menu
function showContextMenu(e, taxonomies) {
  console.log('Showing context menu at:', e.pageX, e.pageY);
  console.log('Taxonomies to show:', taxonomies);
  
  // Ensure menu exists
  let menu = document.getElementById('context-menu');
  if (!menu) {
    console.log('Menu not found, creating new one');
    menu = createContextMenu();
    if (!menu) {
      console.error('Failed to create context menu');
      return;
    }
  }
  
  try {
  
  // Ensure options container exists
  let optionsContainer = menu.querySelector('#taxonomy-options');
  if (!optionsContainer) {
    console.warn('Options container not found, recreating menu');
    if (menu.remove) menu.remove();
    menu = createContextMenu();
    optionsContainer = menu.querySelector('#taxonomy-options');
    
    if (!optionsContainer) {
      console.error('Failed to create options container');
      return;
    }
  }
  
  // Clear previous options
  while (optionsContainer.firstChild) {
    optionsContainer.removeChild(optionsContainer.firstChild);
  }

  // Handle empty taxonomies
  if (!taxonomies || !Array.isArray(taxonomies) || taxonomies.length === 0) {
    console.warn('No valid taxonomies provided');
    const noItems = document.createElement('div');
    noItems.className = 'px-4 py-2 text-sm text-gray-500';
    noItems.textContent = 'No taxonomies available';
    optionsContainer.appendChild(noItems);
    
    // Still show the menu with the message
    positionAndShowMenu(menu, e);
    return;
  }
  
    // Add taxonomy options
    if (!taxonomies || !Array.isArray(taxonomies)) {
      console.error('Invalid taxonomies:', taxonomies);
      const errorItem = document.createElement('div');
      errorItem.className = 'px-4 py-2 text-sm text-red-500';
      errorItem.textContent = 'No taxonomies available';
      optionsContainer.appendChild(errorItem);
      return;
    }
    
    console.log(`Adding ${taxonomies.length} taxonomy options`);
    
    taxonomies.forEach((taxonomy, index) => {
      try {
        if (!taxonomy || !taxonomy.key) {
          console.warn('Invalid taxonomy item at index', index, ':', taxonomy);
          return;
        }
        
        // Get or create color scheme for this taxonomy
        if (!highlighterState.taxonomyColorMap.has(taxonomy.key)) {
          const colorIndex = highlighterState.taxonomyColorMap.size % highlighterState.colorSchemes.length;
          highlighterState.taxonomyColorMap.set(taxonomy.key, highlighterState.colorSchemes[colorIndex]);
        }
        
        const colorScheme = highlighterState.taxonomyColorMap.get(taxonomy.key);
        
        // Create option container
        const option = document.createElement('div');
        option.className = `px-4 py-2 text-sm cursor-pointer hover:opacity-90 flex items-center ${colorScheme.text} ${colorScheme.bg} rounded`;
        
        // Create color indicator
        const colorIndicator = document.createElement('span');
        colorIndicator.className = `w-3 h-3 rounded-full ${colorScheme.bg} mr-2`;
        
        // Create text node for display name
        const textNode = document.createTextNode(taxonomy.displayName || taxonomy.key);
        
        // Assemble option
        option.appendChild(colorIndicator);
        option.appendChild(textNode);
        
        // Add click handler
        option.addEventListener('click', () => {
          console.log('Selected taxonomy:', taxonomy.key);
          highlightSelection(taxonomy.key);
        });
        
        // Add to container
        optionsContainer.appendChild(option);
        
      } catch (error) {
        console.error('Error creating taxonomy option:', error, taxonomy);
      }
    });
    
    // Position and show the menu
    positionAndShowMenu(menu, e);
    
  } catch (error) {
    console.error('Error showing context menu:', error);
    // If we have a menu but an error occurred, still try to show it
    if (menu) {
      positionAndShowMenu(menu, e);
    }
  }
  
  // Set up click outside to hide menu
  setTimeout(() => document.addEventListener('click', hideMenu), 0);
}

// Function to handle text selection
function handleTextSelection(e) {
  console.log('Text selection detected');
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText && !e.target.closest('#context-menu')) {
    console.log('Valid text selection:', selectedText);
    highlighterState.currentSelection = selection;
    highlighterState.currentRange = selection.getRangeAt(0).cloneRange();
    
    // Get taxonomies from the page or use processed taxonomy data
    let taxonomies = [];
    
    // First try to use the taxonomy data we have in memory
    if (window.doccano?.taxonomyData?.length > 0) {
      console.log('Using taxonomy data from doccano.taxonomyData');
      taxonomies = window.doccano.taxonomyData.map(item => ({
        key: item.key,
        displayName: item.displayName || item.key
      }));
      console.log('Using processed taxonomies:', taxonomies);
    }
    
    // If no taxonomies in memory, try to get from the taxonomy container
    if (taxonomies.length === 0) {
      console.log('No taxonomies in memory, checking DOM...');
      const taxonomyContainer = document.getElementById('taxonomy-container');
      if (taxonomyContainer) {
        console.log('Found taxonomy container, getting taxonomies...');
        const taxonomyElements = taxonomyContainer.querySelectorAll('[data-taxonomy]');
        if (taxonomyElements.length > 0) {
          taxonomies = Array.from(taxonomyElements).map(el => ({
            key: el.getAttribute('data-taxonomy'),
            displayName: el.textContent.trim()
          }));
          console.log('Found taxonomies in DOM:', taxonomies);
          
          // Store these taxonomies for future use
          if (!window.doccano) window.doccano = {};
          if (!window.doccano.taxonomyData) {
            window.doccano.taxonomyData = taxonomies;
          }
        }
      }
    }
    
    // If we still don't have taxonomies, try to use the color map
    if (taxonomies.length === 0 && highlighterState.taxonomyColorMap.size > 0) {
      console.log('Using taxonomies from color map');
      taxonomies = Array.from(highlighterState.taxonomyColorMap.entries()).map(([key, colorScheme]) => ({
        key,
        displayName: key
      }));
    }
    
    if (taxonomies.length > 0) {
      console.log('Showing context menu with taxonomies:', taxonomies);
      e.preventDefault();
      showContextMenu(e, taxonomies);
    } else {
      console.warn('No taxonomies found to show in context menu');
      console.log('Highlighter state:', highlighterState);
      console.log('Window.doccano:', window.doccano);
      
      // Try to find any taxonomy elements in the entire document
      const allTaxonomyElements = document.querySelectorAll('[data-taxonomy]');
      console.log('All taxonomy elements in document:', allTaxonomyElements);
      
      if (allTaxonomyElements.length > 0) {
        console.log('Found taxonomy elements outside of container:', allTaxonomyElements);
        taxonomies = Array.from(allTaxonomyElements).map(el => ({
          key: el.getAttribute('data-taxonomy'),
          displayName: el.textContent.trim()
        }));
        
        if (taxonomies.length > 0) {
          console.log('Showing context menu with taxonomies from document:', taxonomies);
          e.preventDefault();
          showContextMenu(e, taxonomies);
          return;
        }
      }
      
      // As a last resort, show a default set of taxonomies
      console.log('Showing default taxonomies');
      taxonomies = [
        { key: 'concept', displayName: 'Concept' },
        { key: 'entity', displayName: 'Entity' },
        { key: 'action', displayName: 'Action' }
      ];
      showContextMenu(e, taxonomies);
    }
  }
}

// Function to create a popup element
function createPopup(text, category, colorScheme, position) {
  // Create popup container
  const popup = document.createElement('div');
  popup.className = `popup-highlight absolute z-50 px-2 py-1 rounded shadow-lg text-sm whitespace-nowrap ${colorScheme.bg} ${colorScheme.text}`;
  popup.style.left = `${position.left}px`;
  popup.style.top = `${position.top - 30}px`; // Position above the text
  popup.setAttribute('data-category', category);
  popup.style.minWidth = '120px';
  popup.style.textAlign = 'center';
  
  // Add category label
  const label = document.createElement('span');
  label.className = 'font-medium';
  label.textContent = category;
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'ml-2 text-xs opacity-70 hover:opacity-100';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    popup.remove();
  };
  
  popup.appendChild(label);
  popup.appendChild(closeBtn);
  
  return popup;
}

// Function to highlight selected text as a popup
function highlightSelection(category) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();
  
  if (!selectedText) return;

  // Only allow highlighting in the middle column document content
  const targetElement = selection.anchorNode.parentElement;
  const middleColumn = document.getElementById('middle-column');
  if (!middleColumn.contains(targetElement) || !targetElement.closest('.document-content p')) {
    console.log('Highlighting only allowed in paragraph elements within the middle column');
    selection.removeAllRanges();
    highlighterState.currentSelection = null;
    highlighterState.currentRange = null;
    return;
  }

  // Get or create color scheme for this category
  let colorScheme;
  if (!highlighterState.taxonomyColorMap.has(category)) {
    // Use the same color scheme index as in renderTaxonomy
    const index = highlighterState.taxonomyColorMap.size % highlighterState.colorSchemes.length;
    colorScheme = highlighterState.colorSchemes[index];
    highlighterState.taxonomyColorMap.set(category, colorScheme);
  } else {
    colorScheme = highlighterState.taxonomyColorMap.get(category);
  }
  
  // Create a marker span at the selection position
  const marker = document.createElement('span');
  marker.className = 'highlight-marker relative inline-block';
  
  // Store the original text and category as data attributes
  marker.setAttribute('data-original-text', selectedText);
  marker.setAttribute('data-category', category);
  
  // Get the position for the popup
  const rangeRect = range.getBoundingClientRect();
  const popup = createPopup(selectedText, category, colorScheme, {
    left: rangeRect.left + window.scrollX + (rangeRect.width / 2) - 60, // Centered
    top: rangeRect.top + window.scrollY - 35 // Slightly higher for better visibility
  });
  
  document.body.appendChild(popup);
  
  // Adjust popup position to be centered
  const popupWidth = popup.offsetWidth;
  popup.style.left = `${position.left - (popupWidth / 2)}px`;
  
  // Close popup when clicking outside
  const closePopup = (e) => {
    if (!popup.contains(e.target)) {
      popup.remove();
      document.removeEventListener('click', closePopup);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closePopup);
  }, 0);
  
  // Clear selection
  selection.removeAllRanges();
  highlighterState.currentSelection = null;
  highlighterState.currentRange = null;
  
  // Hide context menu
  const menu = document.getElementById('context-menu');
  if (menu) menu.style.display = 'none';
}

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
    
    // Get or create color scheme for this category
    let colorScheme;
    if (!highlighterState.taxonomyColorMap.has(match.category)) {
      // Use the same color scheme index as in renderTaxonomy
      const index = highlighterState.taxonomyColorMap.size % highlighterState.colorSchemes.length;
      colorScheme = highlighterState.colorSchemes[index];
      highlighterState.taxonomyColorMap.set(match.category, colorScheme);
    } else {
      colorScheme = highlighterState.taxonomyColorMap.get(match.category);
    }
    
    // Create the highlighted span
    const span = document.createElement('span');
    span.className = `taxonomy-highlight ${colorScheme.highlight} ${colorScheme.textColor} px-1 rounded border-b-2 ${colorScheme.highlightBorder} cursor-pointer`;
    span.textContent = text.substring(match.start, match.end);
    
    // Store the color scheme in the dataset for reference
    span.dataset.colorScheme = JSON.stringify({
      bg: colorScheme.bg,
      text: colorScheme.text,
      border: colorScheme.border,
      highlight: colorScheme.highlight,
      highlightBorder: colorScheme.highlightBorder,
      textColor: colorScheme.textColor
    });
    
    // Add tooltip
    const tooltip = document.createElement('span');
    tooltip.className = 'taxonomy-tooltip';
    tooltip.textContent = match.category.replace(/_/g, ' ').replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
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

  // Use the global color schemes from highlighterState
  const { colorSchemes } = highlighterState;

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
      <div class="group flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 hover:shadow-sm hover:bg-gradient-to-r hover:from-white hover:to-gray-50 border border-transparent hover:border-gray-200">
        <div class="flex items-center min-w-0">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-md ${colorScheme.bg} ${colorScheme.border} border shadow-sm group-hover:shadow-md transition-shadow">
            <span class="text-xs font-bold text-white">${formattedKey.charAt(0).toUpperCase()}</span>
          </span>
          <span class="ml-3 text-sm font-medium text-gray-800 truncate" title="${formattedKey}">
            ${formattedKey}
          </span>
        </div>
        <span class="ml-2 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 group-hover:bg-eu-blue/5 group-hover:border-eu-blue/20 group-hover:text-eu-blue transition-colors">
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

// Function to get word under cursor
function getWordAtPoint(e) {
  const range = document.caretRangeFromPoint(e.clientX, e.clientY);
  if (!range) return null;
  
  // Expand range to include full word
  range.expand('word');
  
  // Get the text and trim any whitespace
  const word = range.toString().trim();
  if (!word) return null;
  
  return { range, word };
}

// Function to handle double click word selection
function handleDoubleClick(e) {
  const wordInfo = getWordAtPoint(e);
  if (!wordInfo) return;
  
  const { range, word } = wordInfo;
  
  // Create a selection
  const selection = window.getSelection();
  selection.removeAllRanges();
  
  // Select the word
  const newRange = range.cloneRange();
  selection.addRange(newRange);
  
  // Store the selection in highlighter state
  highlighterState.currentSelection = selection;
  highlighterState.currentRange = newRange;
  
  // Get taxonomies and show context menu
  handleTextSelection({ ...e, target: e.target, preventDefault: () => {} });
}

// Update the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", async function () {
  // Set up event listeners for text selection
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('dblclick', handleDoubleClick);
  document.addEventListener('contextmenu', (e) => {
    if (highlighterState.currentSelection) {
      e.preventDefault();
    }
  });
  
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
    
    // Store taxonomy data in a globally accessible location
    if (!window.doccano) window.doccano = {};
    window.doccano.taxonomyData = taxonomyData;
    console.log('Stored taxonomy data in window.doccano.taxonomyData:', taxonomyData);
    
    // Track highlighter initialization state
    let isHighlighterInitializing = false;
    let highlighterRetryCount = 0;
    const MAX_RETRIES = 10;
    
    // Function to safely initialize the highlighter
    const initializeHighlighter = () => {
      console.log('Initializing highlighter...');
      
      // Create context menu if it doesn't exist
      createContextMenu();
      
      // Clear any existing taxonomy mappings
      highlighterState.taxonomyColorMap.clear();
      
      // First try to use the taxonomy data we just processed
      if (window.doccano?.taxonomyData?.length > 0) {
        console.log('Using taxonomy data from doccano.taxonomyData:', window.doccano.taxonomyData);
        window.doccano.taxonomyData.forEach((taxonomy, index) => {
          try {
            const colorScheme = highlighterState.colorSchemes[index % highlighterState.colorSchemes.length];
            highlighterState.taxonomyColorMap.set(taxonomy.key, colorScheme);
            console.log(`Mapped taxonomy (from data): ${taxonomy.key} to color ${colorScheme.bg}`);
            
            // Also update the DOM elements if they exist
            const selector = `[data-taxonomy="${taxonomy.key}"]`;
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              console.log(`Found ${elements.length} DOM elements for taxonomy: ${taxonomy.key}`);
            }
          } catch (error) {
            console.error('Error processing taxonomy data:', error, taxonomy);
          }
        });
      }
      
      // Then try to get taxonomies from the DOM as a fallback
      const taxonomyElements = document.querySelectorAll('[data-taxonomy]');
      console.log('Found taxonomy elements in DOM:', taxonomyElements.length);
      
      if (taxonomyElements.length > 0) {
        taxonomyElements.forEach((el, index) => {
          try {
            const taxonomy = el.getAttribute('data-taxonomy');
            // Only add if not already in the map
            if (!highlighterState.taxonomyColorMap.has(taxonomy)) {
              const colorIndex = Object.keys(highlighterState.taxonomyColorMap).length + index;
              const colorScheme = highlighterState.colorSchemes[colorIndex % highlighterState.colorSchemes.length];
              highlighterState.taxonomyColorMap.set(taxonomy, colorScheme);
              console.log(`Mapped taxonomy (from DOM): ${taxonomy} to color ${colorScheme.bg}`);
            }
          } catch (error) {
            console.error('Error processing taxonomy element:', error, el);
          }
        });
      }
      
      if (highlighterState.taxonomyColorMap.size === 0) {
        console.warn('No taxonomies found in either data or DOM. Checking renderTaxonomy...');
        // Try to get taxonomies from the renderTaxonomy function if it exists
        if (typeof renderTaxonomy === 'function') {
          console.log('renderTaxonomy function exists, checking for taxonomies...');
          // This is a hack to get the taxonomies from the renderTaxonomy function
          try {
            const tempDiv = document.createElement('div');
            const originalConsoleLog = console.log;
            const logs = [];
            console.log = (...args) => logs.push(args);
            
            // Call renderTaxonomy with a mock container
            renderTaxonomy(taxonomyData, tempDiv);
            console.log = originalConsoleLog;
            
            console.log('Render taxonomy logs:', logs);
            console.log('Render taxonomy output:', tempDiv.innerHTML);
          } catch (e) {
            console.error('Error checking renderTaxonomy:', e);
          }
        }
      }
      
      console.log('Highlighter initialized with', highlighterState.taxonomyColorMap.size, 'taxonomies');
      
      // Log the current state for debugging
      console.log('Current highlighter state:', {
        colorSchemes: highlighterState.colorSchemes.length,
        taxonomyMap: Object.fromEntries(highlighterState.taxonomyColorMap.entries())
      });
    };
    
    // Function to highlight the test section
    const highlightTestSection = () => {
      // Only proceed if we have a valid highlighter
      if (!window.textHighlighter) {
        console.error('Cannot highlight: textHighlighter not available');
        return;
      }
      
      const testSection = document.getElementById('test-section');
      if (!testSection) {
        console.error('Test section not found');
        return;
      }
      
      try {
        const range = document.createRange();
        range.selectNodeContents(testSection);
        
        // Ensure the highlightSelection method exists
        if (typeof window.textHighlighter.highlightSelection === 'function') {
          window.textHighlighter.highlightSelection('test');
          console.log('Test section highlighted successfully');
        } else {
          console.error('highlightSelection method not found on textHighlighter');
        }
      } catch (error) {
        console.error('Error highlighting test section:', error);
      } finally {
        // Reset initialization state
        isHighlighterInitializing = false;
      }
    };
    
    // Add a test section to the document viewer
    const testSection = document.createElement('div');
    testSection.id = 'test-section';
    testSection.textContent = 'This is a test section.';
    document.getElementById('document-viewer').appendChild(testSection);
    
    // Start the initialization process
    initializeHighlighter();
    
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
