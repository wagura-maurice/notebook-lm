class TextHighlighter {
  constructor() {
    this.contextMenu = document.getElementById('context-menu');
    this.currentSelection = null;
    this.highlightHistory = [];
    this.historyIndex = -1;
    this.taxonomies = [];
    this.taxonomyColors = {}; // Store color mapping for taxonomies
    
    // Default color palette for taxonomies
    this.colorPalette = [
      'bg-blue-100 text-blue-800 border-blue-300',
      'bg-green-100 text-green-800 border-green-300',
      'bg-yellow-100 text-yellow-800 border-yellow-300',
      'bg-red-100 text-red-800 border-red-300',
      'bg-purple-100 text-purple-800 border-purple-300',
      'bg-pink-100 text-pink-800 border-pink-300',
      'bg-indigo-100 text-indigo-800 border-indigo-300'
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
      
      // Only show menu if selection is within the #document-viewer element
      const documentViewer = document.getElementById('document-viewer');
      if (!documentViewer) {
        this.currentSelection = null;
        return;
      }
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectionRect = range.getBoundingClientRect();
        const containerRect = documentViewer.getBoundingClientRect();
        
        // Check if selection is entirely within the document viewer
        if (selectionRect.top < containerRect.top || 
            selectionRect.bottom > containerRect.bottom ||
            selectionRect.left < containerRect.left || 
            selectionRect.right > containerRect.right) {
          this.currentSelection = null;
          return;
        }
        
        // Check if selection is within a title element (which we want to exclude)
        const commonAncestor = range.commonAncestorContainer;
        const ancestorElement = commonAncestor.nodeType === Node.TEXT_NODE 
          ? commonAncestor.parentElement 
          : commonAncestor;
          
        // Check if any parent has the title class or is a title element
        const isInTitle = ancestorElement.closest('.text-sm.font-semibold.text-eu-blue.mt-2.mb-1, h1, h2, h3, h4, h5, h6');
        if (isInTitle) {
          this.currentSelection = null;
          return;
        }
        
        // Check if we're in a valid line container (should have line number)
        const lineContainer = ancestorElement.closest('.flex.items-start.group');
        if (!lineContainer) {
          this.currentSelection = null;
          return;
        }
      } else if (!documentViewer.contains(e?.target)) {
        // If no selection but click is outside document viewer
        this.currentSelection = null;
        return;
      }
      
      console.log('Text selection detected:', { 
        selectedText, 
        rangeCount: selection.rangeCount,
        nodeType: selection.anchorNode?.nodeType,
        nodeName: selection.anchorNode?.nodeName
      });
      
      // Only proceed if we have a valid text selection (not just clicking)
      if (selectedText.length > 2) { // Require at least 3 characters
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
        
        // Store the current selection range and its position
        this.currentSelection = {
          range: range,
          text: selectedText,
          rect: range.getBoundingClientRect()
        };
        
        console.log('Stored selection:', {
          text: selectedText,
          rect: this.currentSelection.rect
        });
        
        // Preserve the selection
        const preservedRange = range.cloneRange();
        
        // Show the context menu
        this.showContextMenu(e);
      } else {
        this.hideContextMenu();
        this.currentSelection = null;
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
      
      // Get the selection and its position
      const selection = window.getSelection();
      if (selection.rangeCount === 0) {
        console.log('No selection range found');
        return;
      }
      
      const range = selection.getRangeAt(0);
      const selectionRect = range.getBoundingClientRect();
      
      // If we don't have valid dimensions, try to get from the first client rect
      let clientRects;
      try {
        clientRects = range.getClientRects();
      } catch (error) {
        console.error('Error getting client rects:', error);
        clientRects = [];
      }
      
      const rect = clientRects.length > 0 ? clientRects[0] : selectionRect;
      
      // If we still don't have valid dimensions, use the event position
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
      
      // Update debug info
      this.updateDebugInfo(left, top);
    } catch (error) {
      console.error('Error showing context menu:', error);
    }
  }

  hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.classList.remove('visible');
      // Use a small delay before hiding to allow for animations
      setTimeout(() => {
        if (this.contextMenu && !this.contextMenu.classList.contains('visible')) {
          this.contextMenu.style.display = 'none';
        }
      }, 150);
      
      const statusEl = document.getElementById('context-menu-status');
      if (statusEl) statusEl.textContent = 'Hidden';
    }
  }

  /**
   * Renders taxonomy items for a specific category
   * @param {string} category - The category key
   * @param {HTMLElement} container - The container to render items in
   */
  renderTaxonomyItems(category, container) {
    if (!this.taxonomyItems[category] || this.taxonomyItems[category].length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'text-sm text-gray-500 italic pl-8 py-1';
      emptyMsg.textContent = 'No items available';
      container.appendChild(emptyMsg);
      return;
    }

    this.taxonomyItems[category].forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'flex items-center py-1.5 px-4 pl-8 hover:bg-gray-50 cursor-pointer text-sm';
      itemEl.textContent = item;
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.highlightSelection({
          category,
          item
        });
        this.hideContextMenu();
      });
      container.appendChild(itemEl);
    });
  }

  /**
   * Updates the context menu with available taxonomy options
   */
  updateContextMenu() {
    console.log('updateContextMenu called');
    
    if (!this.contextMenu) {
      console.error('Context menu element not found');
      return;
    }
    
    const highlightOptions = this.contextMenu.querySelector('.highlight-options');
    if (!highlightOptions) {
      console.error('Highlight options container not found in context menu');
      return;
    }
    
    // Clear existing options
    highlightOptions.innerHTML = '';
    
    console.log('Current taxonomies:', this.taxonomies);
    
    // Show loading state if no taxonomies are available
    if (!this.taxonomies || this.taxonomies.length === 0) {
      console.log('No taxonomies available, showing loading state');
      const loadingEl = document.createElement('div');
      loadingEl.className = 'context-menu__loading';
      loadingEl.innerHTML = `
        <i class="fas fa-spinner fa-spin mr-2"></i>
        <span>Loading items...</span>
      `;
      highlightOptions.appendChild(loadingEl);
      return;
    }
    
    // Create a container for the flat list of taxonomy items
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'space-y-1';
    
    // Add each taxonomy item as a clickable option
    this.taxonomies.forEach(taxonomy => {
      const itemEl = document.createElement('button');
      itemEl.className = 'w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center';
      itemEl.style.transition = 'background-color 0.2s';
      
      // Add color indicator
      const colorIndicator = document.createElement('span');
      colorIndicator.className = 'w-3 h-3 rounded-full mr-2 flex-shrink-0';
      
      // Set the color for this item
      if (taxonomy.colorClass) {
        const colorClass = taxonomy.colorClass.split(' ')[0]; // Get just the base color class
        colorIndicator.style.backgroundColor = this.getColorFromClass(colorClass);
      }
      
      // Item name
      const nameEl = document.createElement('span');
      nameEl.className = 'text-sm text-gray-800';
      nameEl.textContent = taxonomy.displayName || taxonomy.key;
      
      // Assemble the item
      itemEl.appendChild(colorIndicator);
      itemEl.appendChild(nameEl);
      
      // Add click handler
      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.highlightSelection(taxonomy.key);
        this.hideContextMenu();
      });
      
      itemsContainer.appendChild(itemEl);
    });
    
    // Add the items container to the menu
    highlightOptions.appendChild(itemsContainer);
    
    // Add a close button at the bottom
    const closeButton = document.createElement('div');
    closeButton.className = 'flex items-center justify-center py-2 px-3 bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer mt-2 rounded-b-md';
    closeButton.innerHTML = `
      <i class="fas fa-times mr-2"></i>
      <span>Close</span>
    `;
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideContextMenu();
    });
    highlightOptions.appendChild(closeButton);
    
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
   * Helper to convert Tailwind color classes to CSS colors
   */
  getColorFromClass(className) {
    const colorMap = {
      'bg-blue-100': '#dbeafe',
      'bg-green-100': '#d1fae5',
      'bg-yellow-100': '#fef9c3',
      'bg-red-100': '#fee2e2',
      'bg-purple-100': '#f3e8ff',
      'bg-pink-100': '#fce7f3',
      'bg-indigo-100': '#e0e7ff'
    };
    return colorMap[className] || '#e0e7ff'; // Default to indigo-100 if not found
  }

  // Process taxonomy data from documents
  processTaxonomyData(documents) {
    console.log('Processing taxonomy data from documents:', documents);
    
    // Reset taxonomies and colors
    this.taxonomies = [];
    this.taxonomyColors = {};
    this.uniqueTaxonomyItems = new Set(); // Store all unique taxonomy items
    
    // Collect all unique taxonomy items from all documents
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
    
    // Convert Set to Array and sort alphabetically
    const sortedItems = Array.from(this.uniqueTaxonomyItems).sort();
    
    // Assign colors to items based on their position in the color palette
    sortedItems.forEach((item, index) => {
      const colorClass = this.colorPalette[index % this.colorPalette.length];
      this.taxonomyColors[item] = colorClass;
      
      this.taxonomies.push({
        key: item,
        displayName: item,
        colorClass: colorClass
      });
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
        const colorClass = this.colorPalette[index % this.colorPalette.length];
        this.taxonomyColors[item] = colorClass;
        return { 
          key: item.toLowerCase().replace(/\s+/g, '_'),
          displayName: item,
          colorClass: colorClass
        };
      });
    }
    
    console.log('Processed taxonomies:', this.taxonomies);
    console.log('Taxonomy items:', this.taxonomyItems);
    
    // Update the context menu if the method exists
    if (typeof this.updateContextMenu === 'function') {
      this.updateContextMenu();
    } else {
      console.error('updateContextMenu method is not defined');
    }
    
    return this.taxonomies;
  }

  /**
   * Handles highlighting the selected text with the specified category and item
   * @param {string|Object} category - The category key or an object containing category and item
   * @param {string} [item] - Optional item within the category (if not provided in the category object)
   */
  highlightSelection(category, item) {
    console.log('Highlighting selection with:', { category, item });
    
    if (!this.currentSelection) {
      console.log('No current selection');
      return;
    }
    
    // Handle both object and string parameters for backward compatibility
    let categoryKey, categoryItem;
    if (typeof category === 'object' && category !== null) {
      categoryKey = category.category;
      categoryItem = category.item;
    } else {
      categoryKey = category;
      categoryItem = item;
    }
    
    if (!categoryKey) {
      console.log('No category provided');
      return;
    }
    
    try {
      // Use the preserved selection from currentSelection
      const { range: savedRange, text: selectedText } = this.currentSelection;
      console.log('Highlighting selection with category:', categoryKey, 'item:', categoryItem);
      
      if (!savedRange) {
        console.log('No saved range in selection');
        return;
      }
      
      console.log('Selected text for highlighting:', `"${selectedText}"`);
      
      if (!selectedText || selectedText.length === 0) {
        console.log('Empty selection, nothing to highlight');
        return;
      }
      
      // Get the color for this category
      const colorClass = this.taxonomyColors[categoryKey] || 'bg-gray-100';
      const bgColor = this.getColorFromClass(colorClass.split(' ')[0]);
      
      // Create a unique ID for this highlight
      const highlightId = `highlight-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create a new range from the saved range with error handling
      let range;
      let parentElement;
      let highlightSpan;
      
      try {
        range = document.createRange();
        range.setStart(savedRange.startContainer, savedRange.startOffset);
        range.setEnd(savedRange.endContainer, savedRange.endOffset);
        
        // Create a span element to wrap the highlighted text
        highlightSpan = document.createElement('span');
        highlightSpan.className = `highlight ${colorClass} px-0.5 rounded`;
        highlightSpan.style.backgroundColor = bgColor;
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
          text: selectedText,
          timestamp: new Date().toISOString()
        });
        
        // Apply the highlight
        range.surroundContents(highlightSpan);
        
        // Get the parent element that contains the selection
        parentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
          ? range.commonAncestorContainer.parentNode 
          : range.commonAncestorContainer;
          
        // Validate the parent element
        if (!parentElement || !parentElement.nodeType) {
          throw new Error('Invalid parent element');
        }

        // If the parent is already a highlight, don't nest highlights
        if (parentElement.classList?.contains('highlight')) {
          console.log('Cannot highlight inside an existing highlight');
          return;
        }
        
        // Add to history for undo functionality
        this.addToHistory({
          type: 'add',
          id: highlightId,
          element: highlightSpan,
          category: categoryKey,
          item: categoryItem,
          text: selectedText
        });
        
        // Clear the current selection
        if (window.getSelection) {
          const selection = window.getSelection();
          selection.removeAllRanges();
        }
        
        // Clear the current selection reference
        this.currentSelection = null;
        
        // Save the highlights
        this.saveHighlights();
        
        console.log(`Highlighted text with category: ${categoryKey}${categoryItem ? ` and item: ${categoryItem}` : ''}`);
      } catch (error) {
        console.error('Error creating highlight:', error);
        return; // Exit if we can't create a valid highlight
      }
    } catch (error) {
      console.error('Error in highlightSelection:', error);
    }
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
    
    // Check if document content exists
    const documentContent = document.querySelector('.document-content, #document-content, .content, #content');
    if (!documentContent) {
      console.warn('Document content element not found, text selection may not work');
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
    
    // Debug: Add a test highlight
    setTimeout(() => {
      const testElement = document.querySelector('.document-content');
      if (testElement) {
        console.log('Test element found, highlighter should be working');
      } else {
        console.warn('Could not find document content element');
      }
    }, 1000);
    
  } catch (error) {
    console.error('Error initializing TextHighlighter:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all other scripts are loaded
    setTimeout(initTextHighlighter, 100);
  });
} else {
  // DOMContentLoaded has already fired
  setTimeout(initTextHighlighter, 100);
}
