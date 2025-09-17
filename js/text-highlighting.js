class TextHighlighter {
  constructor() {
    this.contextMenu = document.getElementById('context-menu');
    this.currentSelection = null;
    this.highlightHistory = [];
    this.historyIndex = -1;
    this.taxonomies = [];
    this.taxonomyColors = {}; // Store color mapping for taxonomies
    this.colorSchemes = [
      { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
      { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
      { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-600' },
      { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
      { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700' },
      { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600' },
      { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700' },
      { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-600' },
      { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600' },
      { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
      { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700' }
    ];
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Document click to hide context menu when clicking outside
    document.addEventListener('mousedown', (e) => {
      // Only hide if clicking outside both the context menu and any highlighted text
      if (this.contextMenu && !this.contextMenu.contains(e.target) && 
          !e.target.classList.contains('text-highlight')) {
        this.hideContextMenu();
      }
    });

    // Prevent context menu from closing when clicking inside it
    this.contextMenu?.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    // Initialize context menu with taxonomies when they're available
    this.updateContextMenu();
    
    // Handle remove highlight button
    document.getElementById('remove-highlight')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.currentSelection) {
        this.removeHighlight();
        this.hideContextMenu();
      }
    });

    // Context menu items
    document.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent losing focus/selection
        e.stopPropagation();
      });
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const category = e.currentTarget.dataset.category;
        
        // Restore the selection before applying the highlight
        if (this.currentSelection && this.currentSelection.range) {
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(this.currentSelection.range);
        }
        
        this.highlightSelection(category);
        this.hideContextMenu();
      });
    });

    // Remove highlight
    const removeHighlightBtn = document.getElementById('remove-highlight');
    if (removeHighlightBtn) {
      removeHighlightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeHighlight();
        this.hideContextMenu();
      });
    }

    // Listen for text selection
    document.addEventListener('mouseup', (e) => {
      // Don't show menu if clicking on the context menu itself
      if (e.target.closest('#context-menu')) {
        return;
      }
      this.handleTextSelection(e);
    });

    // Listen for double click on highlights
    document.addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('text-highlight')) {
        this.handleDoubleClick(e);
      }
    });

    // Hide menu when pressing Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
      }
    });
  }

  handleTextSelection(e) {
    try {
      // Don't show menu if clicking on the context menu itself or a highlight
      if (e && (e.target.closest('#context-menu') || e.target.closest('.text-highlight'))) {
        return;
      }
      
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      // Only proceed if there's actual text selected
      if (!selectedText) {
        this.currentSelection = null;
        return;
      }
      
      // Get or create document viewer element
      const documentViewer = document.getElementById('document-viewer') || document.body;
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Store the selection regardless of position
        this.currentSelection = {
          range: range,
          text: selectedText,
          rect: range.getBoundingClientRect()
        };
        
        // Show the context menu
        this.showContextMenu(e);
      }
      
      console.log('Text selection detected:', { 
        selectedText, 
        rangeCount: selection.rangeCount,
        nodeType: selection.anchorNode?.nodeType,
        nodeName: selection.anchorNode?.nodeName
      });
      
      // Only proceed if we have a valid text selection (not just clicking)
      if (selectedText.length >= 1) { // Reduced minimum selection length to 1 character
        // Check if the selection is within an editable area
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
        if (!range) {
          console.log('No valid range in selection');
          return;
        }
        
        const commonAncestor = range.commonAncestorContainer;
        const editableElement = commonAncestor.nodeType === Node.TEXT_NODE 
          ? commonAncestor.parentElement 
          : commonAncestor;
        
        // Only proceed if we're not inside an input or contenteditable
        if (editableElement.isContentEditable || 
            editableElement.tagName === 'INPUT' || 
            editableElement.tagName === 'TEXTAREA') {
          console.log('Selection is in editable area, ignoring');
          return;
        }
        
        // Store the current selection
        this.currentSelection = {
          range: range,
          text: selectedText,
          rect: range.getBoundingClientRect()
        };
        
        // Show the context menu
        this.showContextMenu(e);
      }
    } catch (error) {
      console.error('Error handling text selection:', error);
    }
  }

  handleDoubleClick(e) {
    if (e.target.classList.contains('text-highlight')) {
      this.removeHighlight(e.target);
    }
  }

  showContextMenu(e) {
    try {
      if (!this.contextMenu) {
        console.error('Context menu element not found');
        return;
      }
      
      if (!this.currentSelection) {
        console.log('No current selection to show context menu for');
        return;
      }
      
      // Make sure the context menu is in the document flow but hidden
      this.contextMenu.style.display = 'block';
      this.contextMenu.style.visibility = 'hidden';
      this.contextMenu.classList.add('visible');
      
      // Use the stored selection position
      const selectionRect = this.currentSelection.rect;
      
      // Position the context menu above the selection
      let posX = selectionRect.left + window.scrollX;
      let posY = selectionRect.top + window.scrollY - this.contextMenu.offsetHeight - 5;
      
      // If we don't have valid dimensions, use the event position if available
      let rect = selectionRect;
      if ((!rect || (rect.width === 0 && rect.height === 0)) && e) {
        rect = {
          left: e.clientX,
          top: e.clientY,
          right: e.clientX,
          bottom: e.clientY,
          width: 0,
          height: 0
        };
      }
      
      // Calculate viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      
      // Get menu dimensions
      const menuWidth = 240; // Fixed width from CSS
      const menuHeight = this.contextMenu.offsetHeight;
      
      // Calculate initial position (below selection by default)
      let left = rect.left + scrollX;
      let top = rect.bottom + scrollY + 5; // 5px below selection
      
      // Adjust if too close to right edge
      if (left + menuWidth > viewportWidth + scrollX) {
        left = Math.max(10, viewportWidth + scrollX - menuWidth - 10);
      }
      
      // Adjust if too close to bottom
      if (top + menuHeight > viewportHeight + scrollY) {
        // Try to show above the selection
        const spaceAbove = rect.top - 10; // 10px margin from top
        if (spaceAbove > menuHeight) {
          // Enough space above
          top = rect.top + scrollY - menuHeight - 5;
        } else {
          // Not enough space above, show at top of viewport
          top = scrollY + 10;
        }
      }
      
      // Ensure minimum distance from edges
      left = Math.max(10, Math.min(left, viewportWidth + scrollX - menuWidth - 10));
      top = Math.max(10, Math.min(top, viewportHeight + scrollY - menuHeight - 10));
      
      // Apply position and make visible
      this.contextMenu.style.left = `${left}px`;
      this.contextMenu.style.top = `${top}px`;
      this.contextMenu.style.visibility = 'visible';
      
      // Add a small delay to ensure the menu is in the DOM before adding transition
      requestAnimationFrame(() => {
        this.contextMenu.classList.add('context-menu--visible');
      });
      
      // Prevent default context menu
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
    } catch (error) {
      console.error('Error showing context menu:', error);
    }
  }

  // Update the context menu with taxonomy items
  updateContextMenu() {
    if (!this.contextMenu) return;
    
    const highlightOptions = this.contextMenu.querySelector('.highlight-options');
    if (!highlightOptions) return;
    
    // Clear existing options
    highlightOptions.innerHTML = '';
    
    // Create a container for taxonomy items
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'py-1';
    
    // Add a header
    const header = document.createElement('div');
    header.className = 'px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider';
    header.textContent = 'Highlight with';
    itemsContainer.appendChild(header);
    
    // Add each taxonomy item as a clickable option with color indicators
    this.taxonomies.forEach(taxonomy => {
      const itemEl = document.createElement('div');
      itemEl.className = `flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100`;
      
      // Add color indicator with the actual background color from the scheme
      const colorIndicator = document.createElement('span');
      const bgColor = this.getColorFromClass(taxonomy.colorScheme.bg);
      const borderColor = this.getColorFromClass(taxonomy.colorScheme.border);
      
      colorIndicator.className = 'w-4 h-4 rounded-full mr-3 flex-shrink-0';
      colorIndicator.style.backgroundColor = bgColor;
      colorIndicator.style.border = `2px solid ${borderColor}`;
      
      // Add item name
      const nameEl = document.createElement('span');
      nameEl.className = 'text-gray-800 truncate';
      nameEl.textContent = taxonomy.displayName;
      
      // Add count if available
      if (taxonomy.count !== undefined) {
        const countEl = document.createElement('span');
        countEl.className = 'ml-auto px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full';
        countEl.textContent = taxonomy.count;
        itemEl.appendChild(countEl);
      }
      
      // Assemble the item
      itemEl.insertBefore(colorIndicator, itemEl.firstChild);
      itemEl.insertBefore(nameEl, itemEl.firstChild.nextSibling);
      
      // Add click handler
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.highlightSelection(taxonomy.key);
        this.hideContextMenu();
      });
      
      itemsContainer.appendChild(itemEl);
    });
    
    // Add remove highlight option if there's a current selection
    if (this.currentSelection) {
      const removeOption = document.createElement('div');
      removeOption.className = 'flex items-center px-4 py-2 text-sm cursor-pointer text-red-600 hover:bg-red-50';
      removeOption.innerHTML = `
        <i class="fas fa-trash-alt mr-3 w-4 text-center"></i>
        <span>Remove highlight</span>
      `;
      removeOption.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeHighlight();
        this.hideContextMenu();
      });
      itemsContainer.appendChild(removeOption);
    }
    
    // Add the items container to the menu
    highlightOptions.appendChild(itemsContainer);
    
    console.log('Context menu updated with taxonomies:', this.taxonomies);
  }

  /**
   * Updates the debug information in the context menu
   * @param {number} left - The left position of the context menu
   * @param {number} top - The top position of the context menu
   */
  updateDebugInfo(left, top) {
    if (!this.contextMenu) return;
    
    const statusEl = this.contextMenu.querySelector('#context-menu-status');
    const positionEl = this.contextMenu.querySelector('#context-menu-position');
    
    if (statusEl) {
      statusEl.textContent = 'Ready';
    }
    
    if (positionEl && left !== undefined && top !== undefined) {
      positionEl.textContent = `${Math.round(left)}, ${Math.round(top)}`;
    }
  }

  /**
   * Hides the context menu and cleans up
   */
  hideContextMenu() {
    if (!this.contextMenu) return;
    
    this.contextMenu.classList.remove('context-menu--visible');
    this.contextMenu.style.visibility = 'hidden';
    this.contextMenu.style.display = 'none';
    
    // Clear current selection after a short delay to allow click events to process
    setTimeout(() => {
      this.currentSelection = null;
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }, 100);
  }

  /**
   * Helper to convert Tailwind color classes to CSS colors
   */
  getColorFromClass(className) {
    const colorMap = {
      // Background colors (100-500)
      'bg-blue-100': '#dbeafe', 'bg-blue-500': '#3b82f6', 'border-blue-600': '#2563eb',
      'bg-green-100': '#d1fae5', 'bg-green-500': '#10b981', 'border-green-600': '#059669',
      'bg-yellow-100': '#fef9c3', 'bg-yellow-500': '#eab308', 'border-yellow-600': '#ca8a04',
      'bg-red-100': '#fee2e2', 'bg-red-500': '#ef4444', 'border-red-600': '#dc2626',
      'bg-purple-100': '#f3e8ff', 'bg-purple-600': '#9333ea', 'border-purple-700': '#7e22ce',
      'bg-pink-100': '#fce7f3', 'bg-pink-500': '#ec4899', 'border-pink-600': '#db2777',
      'bg-indigo-100': '#e0e7ff', 'bg-indigo-600': '#4f46e5', 'border-indigo-700': '#4338ca',
      'bg-cyan-100': '#cffafe', 'bg-cyan-500': '#06b6d4', 'border-cyan-600': '#0891b2',
      'bg-teal-100': '#ccfbf1', 'bg-teal-500': '#14b8a6', 'border-teal-600': '#0d9488',
      'bg-amber-100': '#fef3c7', 'bg-amber-500': '#f59e0b', 'border-amber-600': '#d97706',
      'bg-rose-100': '#ffe4e6', 'bg-rose-600': '#e11d48', 'border-rose-700': '#be123c',
      // Add any other color variations used in your application
    };
    
    // If the exact class is found, return it
    if (colorMap[className]) {
      return colorMap[className];
    }
    
    // Try to find a close match if exact class not found
    const baseColor = className.replace(/^(bg|text|border)-/, '');
    for (const [key, value] of Object.entries(colorMap)) {
      if (key.includes(baseColor)) {
        return value;
      }
    }
    
    // Default fallback color
    return '#dbeafe'; // blue-100 as default
  }

  // Process taxonomy data from documents or sync from sidebar
  processTaxonomyData(documents) {
    console.log('Processing taxonomy data from documents:', documents);
    
    // First try to get taxonomies from the sidebar
    const sidebarTaxonomies = this.getTaxonomiesFromSidebar();
    
    if (sidebarTaxonomies && sidebarTaxonomies.length > 0) {
      console.log('Using taxonomies from sidebar:', sidebarTaxonomies);
      return this.syncWithSidebarTaxonomies(sidebarTaxonomies);
    }
    
    console.log('No taxonomies found in sidebar, processing from documents');
    
    // Reset taxonomies and colors
    this.taxonomies = [];
    this.taxonomyColors = {};
    this.uniqueTaxonomyItems = new Set();
    
    // Collect all unique taxonomy items from all documents
    if (documents && Array.isArray(documents)) {
      documents.forEach(doc => {
        if (doc.enrichment?.taxonomy) {
          Object.values(doc.enrichment.taxonomy).forEach(items => {
            if (Array.isArray(items) && items.length > 0) {
              items.forEach(item => {
                if (item && typeof item === 'string') {
                  this.uniqueTaxonomyItems.add(item.trim());
                }
              });
            }
          });
        }
      });
    }
    
    // Convert Set to Array and sort alphabetically
    const sortedItems = Array.from(this.uniqueTaxonomyItems).sort();
    
    // Assign colors to items based on their position in the color schemes
    this.taxonomies = sortedItems.map((item, index) => {
      const colorScheme = this.colorSchemes[index % this.colorSchemes.length];
      const colorClass = `bg-${colorScheme.bg.replace('bg-', '')}-100 text-${colorScheme.bg.replace('bg-', '')}-800 border-${colorScheme.border.replace('border-', '')}`;
      
      this.taxonomyColors[item] = colorClass;
      
      return {
        key: item.toLowerCase().replace(/\s+/g, '_'),
        displayName: item,
        colorClass: colorClass,
        colorScheme: colorScheme,
        count: 0 // Initialize count
      };
    });
    
    // If no taxonomies were found, use a default set
    if (this.taxonomies.length === 0) {
      console.log('No taxonomies found in documents, using default items');
      const defaultItems = [
        'Key Concept',
        'Important Quote',
        'Research Finding',
        'Methodology',
        'Limitation',
        'Recommendation'
      ];
      
      this.taxonomies = defaultItems.map((item, index) => {
        const colorScheme = this.colorSchemes[index % this.colorSchemes.length];
        const colorClass = `bg-${colorScheme.bg.replace('bg-', '')}-100 text-${colorScheme.bg.replace('bg-', '')}-800 border-${colorScheme.border.replace('border-', '')}`;
        
        this.taxonomyColors[item] = colorClass;
        
        return {
          key: item.toLowerCase().replace(/\s+/g, '_'),
          displayName: item,
          colorClass: colorClass,
          colorScheme: colorScheme,
          count: 0
        };
      });
    }
    
    console.log('Processed taxonomies:', this.taxonomies);
    this.updateContextMenu();
    return this.taxonomies;
  }
  
  // Get taxonomies from the sidebar
  getTaxonomiesFromSidebar() {
    const taxonomyContainer = document.getElementById('taxonomy-container');
    if (!taxonomyContainer) return null;
    
    const taxonomyElements = Array.from(taxonomyContainer.querySelectorAll('div[class*="group"]'));
    if (taxonomyElements.length === 0) return null;
    
    return taxonomyElements.map((element, index) => {
      const labelElement = element.querySelector('span[class*="text-gray-800"]');
      const countElement = element.querySelector('span[class*="text-gray-700"]');
      
      const label = labelElement ? labelElement.textContent.trim() : `Category ${index + 1}`;
      const key = label.toLowerCase().replace(/\s+/g, '_');
      const count = countElement ? parseInt(countElement.textContent.trim().replace(/[\(\)]/g, '')) || 0 : 0;
      const colorScheme = this.colorSchemes[index % this.colorSchemes.length];
      
      return {
        key: key,
        label: label,
        displayName: label,
        count: count,
        colorScheme: colorScheme,
        colorClass: `bg-${colorScheme.bg.replace('bg-', '')}-100 text-${colorScheme.bg.replace('bg-', '')}-800 border-${colorScheme.border.replace('border-', '')}`
      };
    });
  }
  
  // Sync with taxonomies from sidebar
  syncWithSidebarTaxonomies(sidebarTaxonomies) {
    this.taxonomies = sidebarTaxonomies.map(taxonomy => ({
      key: taxonomy.key,
      displayName: taxonomy.label,
      colorClass: taxonomy.colorClass,
      colorScheme: taxonomy.colorScheme,
      count: taxonomy.count || 0
    }));
    
    // Update taxonomy colors mapping
    this.taxonomyColors = {};
    this.taxonomies.forEach(taxonomy => {
      this.taxonomyColors[taxonomy.key] = taxonomy.colorClass;
    });
    
    console.log('Synced taxonomies from sidebar:', this.taxonomies);
    this.updateContextMenu();
    return this.taxonomies;
  }

  /**
   * Handles highlighting the selected text with the specified category and item
   * @param {string|Object} category - The category key or an object containing category and item
   * @param {string} [item] - Optional item within the category (if not provided in the category object)
   */
  highlightSelection(category, item) {
    let selection = window.getSelection();
    let selectedText = selection.toString().trim();
    
    // If no active selection but we have a saved selection, try to use that
    if ((!selectedText || selectedText.length === 0) && this.currentSelection?.range) {
      try {
        // Restore the saved selection
        selection.removeAllRanges();
        selection.addRange(this.currentSelection.range);
        selectedText = selection.toString().trim();
      } catch (e) {
        console.warn('Failed to restore selection:', e);
      }
    }
    
    // If we still don't have a selection, show a warning and return
    if (!selectedText || selectedText.length === 0) {
      console.warn('No text selected to highlight');
      return;
    }
    
    // Handle both string category and object with category/item properties
    let categoryKey, categoryItem;
    if (typeof category === 'object' && category !== null) {
      categoryKey = category.category;
      categoryItem = category.item || item;
    } else {
      categoryKey = category;
      categoryItem = item;
    }
    
    if (!categoryKey) {
      console.error('No category provided for highlight');
      return;
    }
    
    console.log('Highlighting with category:', categoryKey, 'item:', categoryItem);
    
    // Get the color scheme for this category
    const categoryData = this.taxonomies.find(t => t.key === categoryKey);
    if (!categoryData) {
      console.error(`No color scheme found for category: ${categoryKey}`);
      return;
    }
    
    // Use the color scheme from the taxonomy
    const colorScheme = categoryData.colorScheme || this.colorSchemes[0];
    const bgColor = this.getColorFromClass(colorScheme.bg);
    const borderColor = this.getColorFromClass(colorScheme.border);
    const textColor = colorScheme.text || 'text-white';
    
    // Store the color class for this highlight
    const highlightClass = `text-highlight ${categoryKey.toLowerCase()}`;
    
    // Make sure the category class is properly formatted
    const categoryClass = categoryKey.toLowerCase().replace(/\s+/g, '-');
    
    // Generate a unique ID for this highlight
    const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create a range from the current selection
      const range = selection.getRangeAt(0);
      const selectedContent = range.extractContents();
      
      // Create a new span for the highlight
      const highlightSpan = document.createElement('span');
      
      // Set base and category-specific classes
      highlightSpan.className = `text-highlight ${categoryClass}`;
      
      // Set inline styles as fallback (in case CSS classes don't load)
      highlightSpan.style.backgroundColor = bgColor;
      highlightSpan.style.borderBottom = `2px solid ${borderColor}`;
      highlightSpan.style.boxShadow = `0 0 0 1px ${borderColor}`;
      highlightSpan.style.borderRadius = '0.25rem';
      highlightSpan.style.padding = '0.125rem 0.25rem';
      highlightSpan.style.margin = '0 -0.125rem';
      highlightSpan.style.transition = 'all 0.2s ease';
      highlightSpan.style.display = 'inline';
      highlightSpan.style.position = 'relative';
      highlightSpan.style.zIndex = '1';
      
      // Set data attributes
      highlightSpan.dataset.highlightId = highlightId;
      highlightSpan.dataset.category = categoryKey;
      
      // Add item data if provided
      if (categoryItem) {
        highlightSpan.dataset.item = categoryItem;
      }
      
      // Store metadata for the highlight
      highlightSpan.dataset.metadata = JSON.stringify({
        category: categoryKey,
        item: categoryItem || null,
        text: selectedText.textContent || selectedText,
        timestamp: new Date().toISOString()
      });
      
      // Add the selected content to the highlight span
      highlightSpan.appendChild(selectedContent);
      
      // Insert the highlight span into the document
      range.insertNode(highlightSpan);
      
      // Clear the selection
      if (window.getSelection) {
        const sel = window.getSelection();
        sel.removeAllRanges();
      }
      
      // Save the highlights
      this.saveHighlights();
      
      console.log(`Highlighted text with category: ${categoryKey}${categoryItem ? ` and item: ${categoryItem}` : ''}`);
      
      // Add to history for undo functionality
      this.addToHistory({
        type: 'add',
        id: highlightId,
        element: highlightSpan,
        category: categoryKey,
        item: categoryItem,
        text: selectedText.textContent || selectedText
      });
      
    } catch (error) {
      console.error('Error creating highlight:', error);
    }
    
    // Clear the current selection reference
    this.currentSelection = null;
  }

  removeHighlight(element = null) {
    try {
      const highlight = element || 
                      (window.getSelection().anchorNode?.parentElement?.closest('.text-highlight')) ||
                      document.querySelector('.text-highlight:focus');
      
      if (!highlight || !highlight.classList.contains('text-highlight')) {
        console.log('No highlight element found to remove');
        return;
      }
      
      const parent = highlight.parentNode;
      if (!parent) {
        console.warn('Highlight has no parent node');
        return;
      }
      
      // Store the highlight's HTML before removal
      const beforeHTML = parent.innerHTML;
      const highlightId = highlight.dataset.highlightId || 'unknown';
      const category = highlight.dataset.category || 'uncategorized';
      const textContent = highlight.textContent || '';
      
      // Create a text node with the highlight's content
      const textNode = document.createTextNode(textContent);
      
      // Replace the highlight with the text node
      parent.replaceChild(textNode, highlight);
      
      // Normalize the parent to merge adjacent text nodes
      parent.normalize();
      
      // Get the HTML after modification
      const afterHTML = parent.innerHTML;
      
      // Add to history for undo/redo
      this.addToHistory({
        type: 'remove',
        id: highlightId,
        element: highlight,
        text: textContent,
        category: category,
        parentElement: parent,
        beforeHTML: beforeHTML,
        afterHTML: afterHTML,
        timestamp: Date.now()
      });
      
      console.log('Highlight removed successfully', { id: highlightId, category, text: textContent });
    } catch (error) {
      console.error('Error removing highlight:', error);
      throw error; // Re-throw to allow caller to handle if needed
    }
  }

  addToHistory(action) {
    try {
      // Ensure we have a valid action
      if (!action || typeof action !== 'object') {
        throw new Error('Invalid action provided to addToHistory');
      }
      
      // Ensure required action properties exist
      if (typeof action.type !== 'string') {
        throw new Error('Action type is required and must be a string');
      }
      
      console.log('Adding to history:', {
        type: action.type,
        text: action.text || '',
        category: action.category || 'unknown'
      });
      
      // Initialize history array if it doesn't exist
      if (!Array.isArray(this.highlightHistory)) {
        this.highlightHistory = [];
        this.historyIndex = -1;
      }
      
      // Add the action to the history
      this.highlightHistory = this.highlightHistory.slice(0, this.historyIndex + 1);
      this.highlightHistory.push({
        ...action,
        timestamp: Date.now()
      });
      this.historyIndex++;
      
      // Limit history size to prevent memory issues
      const MAX_HISTORY = 50;
      if (this.highlightHistory.length > MAX_HISTORY) {
        this.highlightHistory.shift();
        this.historyIndex--;
        this.historyIndex--;
      }
      
      // Update the undo/redo buttons
      this.updateUndoRedoButtons();
      
      console.log('History updated:', this.highlightHistory.length, 'items, current index:', this.historyIndex);
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  undo() {
    if (this.historyIndex < 0) {
      console.log('Nothing to undo');
      return;
    }
    
    try {
      const action = this.highlightHistory[this.historyIndex];
      if (!action) {
        console.log('No action to undo at index', this.historyIndex);
        return;
      }
      
      console.log('Undoing action:', action.type, action.text);
      
      switch (action.type) {
        case 'add':
          this.undoAddHighlight(action);
          break;
        case 'remove':
          this.undoRemoveHighlight(action);
          break;
        default:
          console.warn('Unknown action type:', action.type);
      }
      
      this.historyIndex--;
      this.updateUndoRedoButtons();
      console.log('Undo completed. New history index:', this.historyIndex);
    } catch (error) {
      console.error('Error during undo:', error);
    }
  }
  
  redo() {
    if (this.historyIndex >= this.highlightHistory.length - 1) {
      console.log('Nothing to redo');
      return;
    }
    
    this.historyIndex++;
    const action = this.highlightHistory[this.historyIndex];
    
    if (!action) {
      console.log('No action to redo at index', this.historyIndex);
      return;
    }
    
    console.log('Redoing action:', action.type, action.text);
    
    try {
      switch (action.type) {
        case 'add':
          this.redoAddHighlight(action);
          break;
        case 'remove':
          this.redoRemoveHighlight(action);
          break;
        default:
          console.warn('Unknown action type:', action.type);
      }
      
      this.updateUndoRedoButtons();
      console.log('Redo completed. New history index:', this.historyIndex);
    } catch (error) {
      console.error('Error during redo:', error);
      // Revert the history index if redo fails
      this.historyIndex--;
    }
  }

  undoAddHighlight(action) {
    try {
      const { element, parentElement, beforeHTML } = action;
      if (!parentElement) {
        console.warn('No parent element in action for undoAddHighlight');
        return;
      }
      
      // Restore the parent's HTML to the state before the highlight was added
      parentElement.innerHTML = beforeHTML;
      
      console.log('Undo add highlight:', {
        id: action.id,
        text: action.text,
        category: action.category
      });
    } catch (error) {
      console.error('Error in undoAddHighlight:', error);
      throw error;
    }
  }

  undoRemoveHighlight(action) {
    try {
      const { element, parentElement, afterHTML } = action;
      if (!parentElement) {
        console.warn('No parent element in action for undoRemoveHighlight');
        return;
      }
      
      // Restore the parent's HTML to the state before the highlight was removed
      if (element && element.parentNode) {
        // If we have the original element, re-insert it
        parentElement.replaceChild(element, parentElement.firstChild);
      } else if (afterHTML) {
        // Fallback to using the stored HTML
        parentElement.innerHTML = afterHTML;
      }
      
      console.log('Undo remove highlight:', {
        id: action.id,
        text: action.text,
        category: action.category
      });
    } catch (error) {
      console.error('Error in undoRemoveHighlight:', error);
      throw error;
    }
  }

  redoAddHighlight(action) {
    try {
      const { parentElement, afterHTML } = action;
      if (!parentElement) {
        console.warn('No parent element in action for redoAddHighlight');
        return;
      }
      
      // Restore the parent's HTML to the state after the highlight was added
      if (afterHTML) {
        parentElement.innerHTML = afterHTML;
      }
      
      console.log('Redo add highlight:', {
        id: action.id,
        text: action.text,
        category: action.category
      });
    } catch (error) {
      console.error('Error in redoAddHighlight:', error);
      throw error;
    }
  }
  
  redoRemoveHighlight(action) {
    try {
      const { parentElement, beforeHTML } = action;
      if (!parentElement) {
        console.warn('No parent element in action for redoRemoveHighlight');
        return;
      }
      
      // Restore the parent's HTML to the state before the highlight was removed
      if (beforeHTML) {
        parentElement.innerHTML = beforeHTML;
      }
      
      console.log('Redo remove highlight:', {
        id: action.id,
        text: action.text,
        category: action.category
      });
    } catch (error) {
      console.error('Error in redoRemoveHighlight:', error);
      throw error;
    }
  }

  getHighlightData() {
    const highlights = [];
    document.querySelectorAll('.text-highlight').forEach(hl => {
      highlights.push({
        text: hl.textContent,
        category: hl.dataset.category,
        position: this.getTextPosition(hl)
      });
    });
    return highlights;
  }

  updateUndoRedoButtons() {
    try {
      // Ensure we have a valid history array
      if (!Array.isArray(this.highlightHistory)) {
        this.highlightHistory = [];
      }
      
      // Get the undo/redo buttons
      const undoBtn = document.querySelector('[data-action="undo"]');
      const redoBtn = document.querySelector('[data-action="redo"]');
      
      // Update undo button state
      if (undoBtn) {
        undoBtn.disabled = this.historyIndex < 0;
        undoBtn.title = this.historyIndex >= 0 ? 'Undo last action' : 'Nothing to undo';
      }
      
      // Update redo button state
      if (redoBtn) {
        redoBtn.disabled = this.historyIndex >= this.highlightHistory.length - 1;
        redoBtn.title = this.historyIndex < this.highlightHistory.length - 1 ? 'Redo last action' : 'Nothing to redo';
      }
      
      console.log('Updated undo/redo buttons:', {
        historyLength: this.highlightHistory.length,
        historyIndex: this.historyIndex,
        canUndo: this.historyIndex >= 0,
        canRedo: this.historyIndex < this.highlightHistory.length - 1
      });
    } catch (error) {
      console.error('Error updating undo/redo buttons:', error);
    }
  }

  saveHighlights() {
    const highlights = this.getHighlightData();
    console.log('Saving highlights:', highlights);
    
    // This is where you would typically make an API call
    // For now, we'll just log the payload
    const payload = {
      timestamp: new Date().toISOString(),
      highlights: highlights
    };
    
    console.log('Payload to be sent:', JSON.stringify(payload, null, 2));
    
    // Example of how you would make the API call
    /*
    fetch('/api/highlights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
    */
    
    return payload;
  }
}

// Initialize the text highlighter when the DOM is fully loaded
function initTextHighlighter() {
  try {
    console.log('Initializing TextHighlighter...');
    
    // Check if context menu exists
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) {
      console.error('Context menu element not found');
      return;
    }
    
    // Add event listener for the close button in the header
    const closeButton = contextMenu.querySelector('.context-menu__close-btn');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const highlighter = window.textHighlighter;
        if (highlighter) {
          highlighter.hideContextMenu();
        }
      });
    } else {
      console.warn('Close button not found in context menu header');
    }
    
    // Check if document viewer exists
    const documentViewer = document.getElementById('document-viewer');
    if (!documentViewer) {
      console.warn('Document viewer element not found, text selection may not work');
    }
    
    // Initialize the highlighter
    window.textHighlighter = new TextHighlighter();
    console.log('TextHighlighter initialized successfully');
    
    // Initialize with default taxonomies
    setTimeout(() => {
      console.log('Initializing default taxonomies...');
      window.textHighlighter.processTaxonomyData([]);
      
      // Verify taxonomies were loaded
      console.log('Current taxonomies:', window.textHighlighter.taxonomies);
    }, 100);
    
    // Setup toolbar buttons
    function setupButton(selector, handler) {
      const btn = document.querySelector(selector);
      if (btn) {
        console.log(`Setting up button: ${selector}`);
        btn.addEventListener('click', handler);
      } else {
        console.warn(`Button not found: ${selector}`);
      }
    }
    
    // Setup toolbar button handlers
    setupButton('[data-action="undo"]', () => {
      console.log('Undo clicked');
      window.textHighlighter?.undo();
    });
    
    setupButton('[data-action="redo"]', () => {
      console.log('Redo clicked');
      window.textHighlighter?.redo();
    });
    
    setupButton('[data-action="save"]', () => {
      console.log('Save clicked');
      window.textHighlighter?.saveHighlights();
    });
    
    // Debug: Check if document viewer is available
    setTimeout(() => {
      const testElement = document.getElementById('document-viewer');
      if (testElement) {
        console.log('Document viewer found, highlighter should be working');
      } else {
        console.warn('Could not find document viewer element');
      }
    }, 1000);
    
  } catch (error) {
    console.error('Error initializing TextHighlighter:', error);
  }
}

// Export the TextHighlighter class and init function
window.TextHighlighter = TextHighlighter;
window.initTextHighlighter = initTextHighlighter;
