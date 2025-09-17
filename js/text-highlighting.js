class TextHighlighter {
  constructor() {
    this.contextMenu = document.getElementById('context-menu');
    this.currentSelection = null;
    this.highlightHistory = [];
    this.historyIndex = -1;
    this.taxonomies = [];
    this.taxonomyColors = {}; // Store color mapping for taxonomies
    
    // Initialize with empty taxonomies - will be updated from doccano.js
    this.taxonomyData = [];
    
    // Color schemes that match the right sidebar in doccano.js
    this.colorSchemes = [
      { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600', textColor: 'text-blue-800', bgLight: 'bg-blue-100' },
      { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600', textColor: 'text-green-800', bgLight: 'bg-green-100' },
      { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-600', textColor: 'text-yellow-800', bgLight: 'bg-yellow-100' },
      { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', textColor: 'text-red-800', bgLight: 'bg-red-100' },
      { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', textColor: 'text-purple-800', bgLight: 'bg-purple-100' },
      { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600', textColor: 'text-pink-800', bgLight: 'bg-pink-100' },
      { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', textColor: 'text-indigo-800', bgLight: 'bg-indigo-100' },
      { bg: 'bg-gray-600', text: 'text-white', border: 'border-gray-700', textColor: 'text-gray-800', bgLight: 'bg-gray-100' },
      { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-600', textColor: 'text-cyan-800', bgLight: 'bg-cyan-100' },
      { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600', textColor: 'text-teal-800', bgLight: 'bg-teal-100' },
      { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', textColor: 'text-amber-800', bgLight: 'bg-amber-100' },
      { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700', textColor: 'text-rose-800', bgLight: 'bg-rose-100' }
    ];
    
    // Map to store taxonomy key to color scheme mapping
    this.taxonomyColorMap = new Map();
    
    // Initialize with default taxonomies if none provided
    this.initializeDefaultTaxonomies();
  }

  /**
   * Hides the context menu and cleans up
   */
  hideContextMenu() {
    try {
      console.log('Hiding context menu...');
      
      if (this.contextMenu) {
        this.contextMenu.style.visibility = 'hidden';
        this.contextMenu.style.display = 'none';
        this.contextMenu.style.opacity = '0';
        this.contextMenu.classList.remove('context-menu--visible');
        
        // Clear the current selection
        if (window.getSelection) {
          const selection = window.getSelection();
          if (selection && typeof selection.removeAllRanges === 'function') {
            selection.removeAllRanges();
          }
        }
        
        // Don't clear currentSelection and currentRange here as we might need them
        // for restoring the selection when clicking on a menu item
      }
    } catch (error) {
      console.error('Error hiding context menu:', error);
    }
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
      statusEl.textContent = this.currentSelection ? 'Active Selection' : 'No Selection';
    }
    
    if (positionEl) {
      positionEl.textContent = `X: ${Math.round(left)}, Y: ${Math.round(top)}`;
    }
  }

  handleTextSelection(e) {
    try {
      console.log('Handling text selection...');
      
      // Prevent default behavior to maintain selection
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Don't show menu if clicking on the context menu itself or a highlight
      if (e && (e.target.closest('#context-menu') || e.target.closest('.text-highlight'))) {
        console.log('Clicked on context menu or highlight, ignoring...');
        return;
      }
      
      // Get the current selection
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      console.log('Current selection:', {
        selection: selection.toString(),
        rangeCount: selection.rangeCount,
        selectedText,
        hasCurrentRange: !!this.currentRange
      });
      
      // Check if we have a valid selection
      if (!selection || selection.rangeCount === 0 || selectedText === '') {
        console.log('No valid text selected');
        // If we have a stored range, try to use it
        if (this.currentRange) {
          try {
            console.log('Restoring from stored range...');
            selection.removeAllRanges();
            selection.addRange(this.currentRange.cloneRange());
            console.log('Restored selection, showing context menu...');
            // Show the context menu at the cursor position
            setTimeout(() => this.showContextMenu(e), 0);
          } catch (err) {
            console.warn('Could not restore selection:', err);
          }
        }
        return;
      }
      
      const range = selection.getRangeAt(0);
      
      // Store the current selection and range
      this.currentSelection = selection;
      this.currentRange = range.cloneRange();
      
      console.log('Stored selection and range, showing context menu...');
      // Show the context menu at the cursor position with a small delay
      setTimeout(() => this.showContextMenu(e), 0);
      
    } catch (error) {
      console.error('Error handling text selection:', error);
    }
  }
  
  showContextMenu(e) {
    try {
      console.log('Showing context menu...');
      
      if (!this.contextMenu) {
        console.error('Context menu element not found');
        return;
      }
      
      // Prevent default context menu
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      
      // Position the menu at the cursor or center of selection
      let x, y;
      if (e && e.clientX && e.clientY) {
        x = e.clientX;
        y = e.clientY;
      } else if (this.currentRange) {
        const range = this.currentRange.cloneRange();
        const rect = range.getBoundingClientRect();
        x = rect.left + (rect.width / 2);
        y = rect.bottom + window.scrollY;
      } else {
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
      }
      
      console.log('Positioning context menu at:', { x, y });
      
      // Ensure the context menu is visible and positioned correctly
      this.contextMenu.style.position = 'fixed';
      this.contextMenu.style.left = `${x}px`;
      this.contextMenu.style.top = `${y}px`;
      this.contextMenu.style.visibility = 'visible';
      this.contextMenu.style.display = 'block';
      this.contextMenu.style.opacity = '1';
      this.contextMenu.style.pointerEvents = 'auto';
      this.contextMenu.style.zIndex = '10000'; // Ensure it's above other elements
      
      // Update the context menu items
      this.updateContextMenu();
      
      // Force a reflow to ensure styles are applied
      this.contextMenu.offsetHeight;
      
      // Add a class to prevent text selection while menu is open
      document.body.classList.add('context-menu-open');
      
      console.log('Context menu should be visible now');
      
      // Focus the context menu for keyboard navigation
      this.contextMenu.focus();
      
    } catch (error) {
      console.error('Error showing context menu:', error);
    }
  }
  
  /**
   * Handles double click on highlighted text
   * @param {Event} e - The double click event
   */
  handleHighlightDoubleClick(e) {
    if (!e.target.classList.contains('text-highlight')) return;
    
    // Select the highlighted text
    const range = document.createRange();
    range.selectNodeContents(e.target);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Store the current selection and range
    this.currentSelection = selection;
    this.currentRange = range.cloneRange();
    
    // Show the context menu at the cursor position
    const rect = e.target.getBoundingClientRect();
    this.showContextMenu({
      clientX: rect.right,
      clientY: rect.bottom,
      preventDefault: () => {}
    });
  }
  
  /**
   * Initializes all event listeners
   */
  initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    // Bind the methods to maintain 'this' context
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleHighlightDoubleClick = this.handleHighlightDoubleClick.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    
    // Remove any existing event listeners to prevent duplicates
    document.removeEventListener('selectionchange', this.handleSelectionChange);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('dblclick', this.handleDoubleClick);
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('dblclick', this.handleHighlightDoubleClick, true);
    document.removeEventListener('contextmenu', this.handleContextMenu);
    
    // Add event listeners
    document.addEventListener('selectionchange', this.handleSelectionChange);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('dblclick', this.handleDoubleClick);
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('contextmenu', this.handleContextMenu);
    
    // Add double click listener for highlighted text
    document.addEventListener('dblclick', this.handleHighlightDoubleClick, true);
    
    // Initialize context menu
    this.initContextMenu();
    
    console.log('Event listeners initialized');
  }
  
  /**
   * Handles selection change events
   */
  handleSelectionChange() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      if (selectedText !== '') {
        this.currentSelection = selection;
        this.currentRange = selection.getRangeAt(0).cloneRange();
        console.log('Selection updated:', { text: selectedText });
      }
    }
  }
  
  /**
   * Handles mouse up events for text selection
   */
  handleMouseUp(e) {
    // Don't show menu if clicking on the context menu itself
    if (e.target.closest('#context-menu')) {
      return;
    }
    
    // Define the selection handler
    const handleSelection = function() {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText) {
        try {
          // Store the selection and range
          this.currentSelection = selection;
          this.currentRange = selection.rangeCount > 0 ? 
            selection.getRangeAt(0).cloneRange() : 
            null;
          
          console.log('Mouse up with selection:', selectedText);
          
          // Only show context menu if this was a text selection (not just a click)
          if (this.currentRange && !this.currentRange.collapsed) {
            this.handleTextSelection(e);
          }
        } catch (error) {
          console.error('Error handling mouse up:', error);
        }
      }
    }.bind(this);
    
    // Use a small delay to allow the selection to be properly set
    setTimeout(handleSelection, 10);
  }

  /**
   * Handles mouse down events for hiding the context menu
   */
  handleMouseDown(e) {
    // Only hide if clicking outside both the context menu and any highlighted text
    if (this.contextMenu && !this.contextMenu.contains(e.target) && 
        !e.target.classList.contains('text-highlight')) {
      this.hideContextMenu();
    }
  }
  
  /**
   * Handles context menu events
   */
  handleContextMenu(e) {
    // Only show our custom context menu for text selections
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      e.preventDefault();
      e.stopPropagation();
      
      // Store the current selection and range
      if (selection.rangeCount > 0) {
        this.currentSelection = selection;
        this.currentRange = selection.getRangeAt(0).cloneRange();
      }
      
      // Show the context menu with the stored selection
      const showMenu = function() {
        this.showContextMenu(e);
      }.bind(this);
      
      // Use requestAnimationFrame to ensure the selection is preserved
      requestAnimationFrame(showMenu);
      
      return false;
    }
  }
  
  /**
   * Handles double click events for text selection
   */
  /**
   * Handles double click events for text selection
   */
  handleDoubleClick(e) {
    // Prevent default to maintain selection
    e.preventDefault();
    e.stopPropagation();
    
    // Define the selection handler
    const handleSelection = function() {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText) {
        this.currentSelection = selection;
        this.currentRange = selection.rangeCount > 0 ? 
          selection.getRangeAt(0).cloneRange() : 
          null;
        
        console.log('Double click with selection:', selectedText);
        this.handleTextSelection(e);
      }
    }.bind(this);
    
    // Use a small delay to allow the selection to be properly set
    setTimeout(handleSelection, 10);
  }

  /**
   * Initializes the context menu event listeners
   */
  initContextMenu() {
    if (!this.contextMenu) {
      // Try to find the context menu if not already set
      this.contextMenu = document.getElementById('context-menu');
      
      if (!this.contextMenu) {
        console.warn('Context menu element not found');
        return;
      }
    }
    
    // Prevent context menu from closing when clicking inside it
    this.contextMenu.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    // Handle remove highlight button
    const removeHighlightBtn = document.getElementById('remove-highlight');
    if (removeHighlightBtn) {
      removeHighlightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (this.currentSelection) {
          this.removeHighlight();
          this.hideContextMenu();
        }
      });
    }
    
    // Initialize context menu with taxonomies when they're available
    // Use setTimeout to ensure the DOM is ready
    setTimeout(() => {
      this.updateContextMenu();
    }, 0);

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

    // Remove highlight handler is already set up above

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
  
  /**
   * Updates the context menu with taxonomy items
   */
  updateContextMenu() {
    if (!this.contextMenu) return;
    
    const menuItems = this.contextMenu.querySelector('.context-menu__items');
    if (!menuItems) return;
    
    // Clear existing items
    menuItems.innerHTML = '';
    
    // Add taxonomies to the menu
    this.taxonomies.forEach(taxonomy => {
      const item = document.createElement('div');
      item.className = 'context-menu__item';
      item.textContent = taxonomy.displayName || taxonomy.key;
      
      // Set the color scheme for this item
      const colorScheme = taxonomy.colorScheme || this.colorSchemes[0];
      item.style.borderLeft = `3px solid ${this.getColorFromClass(colorScheme.border)}`;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.highlightSelection(taxonomy.key);
        this.hideContextMenu();
      });
      
      menuItems.appendChild(item);
    });
    
    // Add remove highlight option if there's a selection
    if (this.currentSelection) {
      const removeItem = document.createElement('div');
      removeItem.className = 'context-menu__item context-menu__item--remove';
      removeItem.textContent = 'Remove Highlight';
      removeItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeHighlight();
        this.hideContextMenu();
      });
      menuItems.appendChild(removeItem);
    }
  }

  /**
   * Highlights the current text selection with the specified category
   * @param {string} category - The category/key of the taxonomy to apply
   */
  highlightSelection(category) {
    try {
      console.log('Highlighting selection with category:', category);
      
      // Get the current selection if not already stored
      const selection = this.currentSelection || window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.warn('No selection to highlight');
        return;
      }
      
      // Use the stored range if available, otherwise get it from selection
      const range = this.currentRange || selection.getRangeAt(0);
      if (!range) {
        console.warn('No range available for highlighting');
        return;
      }
      
      // Get the color scheme for this category
      const colorScheme = this.getColorSchemeForTaxonomy(category);
      console.log('Using color scheme:', colorScheme);
      
      // Create a new span for the highlight
      const highlightSpan = document.createElement('span');
      highlightSpan.className = `text-highlight ${colorScheme.bg} ${colorScheme.text} px-0.5 rounded-sm`;
      highlightSpan.dataset.category = category;
      highlightSpan.title = this.formatCategoryName(category);
      
      try {
        // Apply the highlight
        range.surroundContents(highlightSpan);
        
        // Clear the selection
        if (window.getSelection) {
          const sel = window.getSelection();
          sel.removeAllRanges();
        }
        
        // Add to history for undo/redo
        this.addToHistory();
        
        console.log('Successfully highlighted text');
      } catch (e) {
        console.error('Error highlighting text:', e);
        
        // If surrounding fails (e.g., selection crosses node boundaries),
        // try a simpler approach that works with any selection
        console.log('Falling back to text content replacement');
        const selectedText = range.toString();
        if (selectedText) {
          highlightSpan.textContent = selectedText;
          range.deleteContents();
          range.insertNode(highlightSpan);
          
          // Clear the selection
          if (window.getSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
          }
          
          // Add to history for undo/redo
          this.addToHistory();
        }
      }
      
      // Clear the current selection and range
      this.currentSelection = null;
      this.currentRange = null;
      
    } catch (error) {
      console.error('Error in highlightSelection:', error);
    }
  }
  
  /**
   * Adds the current state to the history for undo/redo
   */
  addToHistory() {
    // Only keep the last 50 states to prevent memory issues
    if (this.historyIndex < this.highlightHistory.length - 1) {
      this.highlightHistory = this.highlightHistory.slice(0, this.historyIndex + 1);
    }
    
    // Add the current state to history
    const documentViewer = document.getElementById('document-viewer');
    if (documentViewer) {
      this.highlightHistory.push(documentViewer.innerHTML);
      this.historyIndex = this.highlightHistory.length - 1;
    }
  }
  
  /**
   * Removes the highlight from the current selection
   */
  removeHighlight() {
    try {
      const selection = this.currentSelection || window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        console.warn('No selection to remove highlight from');
        return;
      }
      
      const range = this.currentRange || selection.getRangeAt(0);
      const selectedNode = range.commonAncestorContainer;
      
      // If the selection is inside a highlight, get the highlight element
      const highlightElement = selectedNode.nodeType === Node.ELEMENT_NODE && 
                             selectedNode.classList.contains('text-highlight') ? 
                             selectedNode : 
                             selectedNode.parentElement?.closest('.text-highlight');
      
      if (highlightElement) {
        // Replace the highlight with its contents
        const parent = highlightElement.parentNode;
        while (highlightElement.firstChild) {
          parent.insertBefore(highlightElement.firstChild, highlightElement);
        }
        parent.removeChild(highlightElement);
        
        // Add to history for undo/redo
        this.addToHistory();
        
        console.log('Removed highlight');
      } else {
        console.warn('No highlight found to remove');
      }
      
      // Clear the selection
      if (window.getSelection) {
        const sel = window.getSelection();
        sel.removeAllRanges();
      }
      
      // Clear the current selection and range
      this.currentSelection = null;
      this.currentRange = null;
      
    } catch (error) {
      console.error('Error removing highlight:', error);
    }
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
    
  }

  // Format category name for display
  formatCategoryName(name) {
    if (!name) return 'Untitled';
    return name
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, function(char) { return char.toUpperCase(); })
      .trim();
  }
  
  /**
   * Get color scheme for a taxonomy key
   * @param {string} key - The taxonomy key
   * @returns {Object} Color scheme object with bg, text, border, etc.
   */
  getColorSchemeForTaxonomy(key) {
    if (!key) return this.colorSchemes[0];
    
    // Normalize the key to match the format used in doccano.js
    const normalizedKey = key.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Return existing color scheme if available
    if (this.taxonomyColorMap.has(normalizedKey)) {
      return this.taxonomyColorMap.get(normalizedKey);
    }
    
    // If not found, find the taxonomy in our data
    const taxonomy = this.taxonomies.find(t => t.key === normalizedKey);
    if (taxonomy && taxonomy.colorScheme) {
      this.taxonomyColorMap.set(normalizedKey, taxonomy.colorScheme);
      return taxonomy.colorScheme;
    }
    
    // Assign a new color scheme if not found
    const colorScheme = this.colorSchemes[this.taxonomyColorMap.size % this.colorSchemes.length];
    this.taxonomyColorMap.set(normalizedKey, colorScheme);
    return colorScheme;
  }
  
  // Get default taxonomies if none found
  getDefaultTaxonomies() {
    console.log('Using default taxonomies');
    return [
      { key: 'person', displayName: 'Person', colorScheme: this.colorSchemes[0] },
      { key: 'location', displayName: 'Location', colorScheme: this.colorSchemes[1] },
      { key: 'organization', displayName: 'Organization', colorScheme: this.colorSchemes[2] }
    ];
  }

  /**
   * Initialize with default taxonomies if none are provided
   */
  initializeDefaultTaxonomies() {
    this.taxonomies = [
      { key: 'person', displayName: 'Person', colorScheme: this.colorSchemes[0] },
      { key: 'organization', displayName: 'Organization', colorScheme: this.colorSchemes[1] },
      { key: 'location', displayName: 'Location', colorScheme: this.colorSchemes[2] },
      { key: 'date', displayName: 'Date', colorScheme: this.colorSchemes[3] },
      { key: 'concept', displayName: 'Concept', colorScheme: this.colorSchemes[4] }
    ];
    
    // Initialize color mapping
    this.taxonomies.forEach((taxonomy, index) => {
      this.taxonomyColorMap.set(taxonomy.key, this.colorSchemes[index % this.colorSchemes.length]);
    });
    
    this.updateContextMenu();
  }

  /**
   * Process taxonomy data from documents or sync from doccano.js
   * @param {Array} documents - Array of document objects with taxonomy data
   * @returns {Array} Processed taxonomies
   */
  processTaxonomyData(documents) {
    try {
      console.log('Processing taxonomy data from documents:', documents);
      
      if (!documents || !Array.isArray(documents)) {
        console.warn('No documents provided for taxonomy processing');
        return this.taxonomies;
      }
      
      // Get unique taxonomy keys from all documents
      const taxonomyCounts = new Map();
      
      documents.forEach(doc => {
        if (doc.enrichment?.taxonomy) {
          Object.entries(doc.enrichment.taxonomy).forEach(([key, items]) => {
            if (Array.isArray(items) && items.length > 0) {
              const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              const currentCount = taxonomyCounts.get(normalizedKey) || 0;
              taxonomyCounts.set(normalizedKey, currentCount + items.length);
            }
          });
        }
      });
      
      // Convert to array of objects with counts and sort by count (descending)
      this.taxonomyData = Array.from(taxonomyCounts.entries())
        .map(([key, count]) => ({
          key,
          count,
          displayName: key
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
        }))
        .sort((a, b) => b.count - a.count);
      
      // Update taxonomies with color schemes
      this.taxonomies = this.taxonomyData.map((item, index) => {
        const colorScheme = this.colorSchemes[index % this.colorSchemes.length];
        this.taxonomyColorMap.set(item.key, colorScheme);
        return {
          ...item,
          colorScheme
        };
      });
      
      console.log('Processed taxonomies:', this.taxonomies);
      
      // Update the context menu with the new taxonomies
      this.updateContextMenu();
      
      return this.taxonomies;
      
    } catch (error) {
      console.error('Error processing taxonomy data:', error);
      return this.getDefaultTaxonomies();
    }
  }

  // Get taxonomies from the sidebar
  getTaxonomiesFromSidebar() {
    try {
      console.log('Looking for taxonomies in sidebar...');
      
      // First, try to find taxonomies in the right sidebar
      let sidebar = document.querySelector('.right-sidebar, .taxonomy-sidebar, [data-testid="taxonomy-sidebar"]');
      
      // If not found, try to find any element that might contain taxonomy items
      if (!sidebar) {
        sidebar = document.querySelector('.sidebar, aside, [role="complementary"]');
      }
      
      if (!sidebar) {
        console.log('Taxonomy sidebar not found in the DOM');
        return [];
      }
      
      console.log('Found sidebar element:', sidebar);
      
      // Look for taxonomy items in various possible structures
      let categoryElements = [];
      
      // Try different selectors that might contain taxonomy items
      const possibleSelectors = [
        '.taxonomy-category',
        '.category-item',
        '.tag-item',
        '.label-item',
        '.entity-type',
        '.label-category',
        '[data-category]',
        'li', // Fallback to all list items
        'div[role="button"]' // For button-like elements
      ];
      
      // Find the first selector that matches elements
      for (let i = 0; i < possibleSelectors.length; i++) {
        const selector = possibleSelectors[i];
        const elements = sidebar.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log('Found ' + elements.length + ' elements with selector: ' + selector);
          categoryElements = Array.from(elements);
          break;
        }
      }
      
      if (categoryElements.length === 0) {
        console.log('No category elements found in sidebar');
        return [];
      }
      
      // Process found elements into taxonomy items
      const taxonomies = [];
      const self = this; // Store reference to this for use in forEach
      
      categoryElements.forEach(function(el, index) {
        try {
          // Try to get the name from various possible attributes and elements
          const name = 
            el.getAttribute('data-category') ||
            el.getAttribute('title') ||
            el.getAttribute('aria-label') ||
            (el.textContent ? el.textContent.trim() : '');
            
          if (name && name.trim()) {
            // Normalize the key to match the format used in processTaxonomyData
            const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            
            // Check if we already have this taxonomy
            if (!taxonomies.some(t => t.key === key)) {
              // Get or create color scheme for this taxonomy
              let colorScheme = self.taxonomyColorMap.get(key) || 
                              self.colorSchemes[taxonomies.length % self.colorSchemes.length];
              
              // Update the color mapping if it's new
              if (!self.taxonomyColorMap.has(key)) {
                self.taxonomyColorMap.set(key, colorScheme);
              }
              
              taxonomies.push({
                key: key,
                displayName: self.formatCategoryName(name),
                colorScheme: colorScheme
              });
            }
          }
        } catch (e) {
          console.warn('Error processing taxonomy element:', e);
        }
      });
      
      console.log('Extracted ' + taxonomies.length + ' taxonomies from sidebar');
      return taxonomies;
    } catch (error) {
      console.error('Error getting taxonomies from sidebar:', error);
      return [];
    }
  }
}

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

// Initialize toolbar buttons when DOM is ready
function initToolbar() {
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
}

// Initialize the text highlighter
function initTextHighlighter() {
  console.log('Initializing text highlighter...');
  
  // Create a single instance of TextHighlighter
  if (!window.textHighlighter) {
    window.textHighlighter = new TextHighlighter();
    
    // Initialize event listeners
    window.textHighlighter.initializeEventListeners();
    
    // Initialize the toolbar
    initToolbar();
    
    // Check if we have taxonomy data from doccano.js
    if (window.doccano && window.doccano.taxonomyData) {
      console.log('Found taxonomy data in doccano, processing...');
      window.textHighlighter.processTaxonomyData(window.doccano.taxonomyData);
    }
    
    console.log('Text highlighter initialized successfully');
  } else {
    console.log('Text highlighter already initialized');
  }
  
  return window.textHighlighter;
}

// Export the TextHighlighter class and init function
window.TextHighlighter = TextHighlighter;
window.initTextHighlighter = initTextHighlighter;

// Auto-initialize if this is the main script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing highlighter...');
    initTextHighlighter();
  });
} else {
  console.log('DOM already loaded, initializing highlighter immediately');
  initTextHighlighter();
}
