class TextHighlighter {
  constructor() {
    this.contextMenu = document.getElementById('context-menu');
    this.currentSelection = null;
    this.highlightHistory = [];
    this.historyIndex = -1;
    
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
      
      let { rect, range } = this.currentSelection;
      
      // Ensure we have a valid range
      if (!range && window.getSelection().rangeCount > 0) {
        range = window.getSelection().getRangeAt(0);
        this.currentSelection.range = range;
      }
      
      // If no valid selection rect, try to get it from the range
      if ((!rect || (rect.width === 0 && rect.height === 0)) && range) {
        try {
          const rangeRect = range.getBoundingClientRect();
          if (rangeRect.width > 0 || rangeRect.height > 0) {
            this.currentSelection.rect = rangeRect;
            rect = rangeRect; // Update local reference
          } else {
            // Try getting the client rects of the range
            const clientRects = range.getClientRects();
            if (clientRects.length > 0) {
              this.currentSelection.rect = clientRects[0];
              rect = clientRects[0];
            }
          }
        } catch (error) {
          console.error('Error getting selection rectangle:', error);
        }
      }
      
      // If we still don't have a valid rect, try to use the event position
      if ((!rect || (rect.width === 0 && rect.height === 0)) && e) {
        this.currentSelection.rect = {
          left: e.clientX,
          top: e.clientY,
          right: e.clientX,
          bottom: e.clientY,
          width: 0,
          height: 0
        };
        rect = this.currentSelection.rect;
      }
      
      // Calculate menu position
      const menuRect = this.contextMenu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      
      // Use the stored rect or fallback to event position
      const selectionRect = this.currentSelection.rect || { 
        left: e?.clientX || 0, 
        top: e?.clientY || 0,
        width: 0,
        height: 0,
        bottom: e?.clientY || 0,
        right: (e?.clientX || 0) + 100
      };
      
      // Position the menu below the selection by default
      let left = selectionRect.left + scrollX;
      let top = selectionRect.bottom + scrollY + 5; // 5px below selection
      
      console.log('Positioning context menu:', { left, top, selectionRect, scrollX, scrollY });
      
      // Adjust if too close to right edge
      if (left + menuRect.width > viewportWidth + scrollX) {
        left = Math.max(10, viewportWidth + scrollX - menuRect.width - 10); // 10px margin
      }
      
      // Adjust if too close to bottom
      if (top + menuRect.height > viewportHeight + scrollY) {
        // Show above selection if there's not enough space below
        top = selectionRect.top + scrollY - menuRect.height - 5; // 5px above selection
        
        // If still not enough space, show at top of viewport
        if (top < scrollY) {
          top = scrollY + 10;
        }
      }
      
      // Ensure minimum distance from edges
      left = Math.max(10, Math.min(left, viewportWidth + scrollX - menuRect.width - 10));
      top = Math.max(10, Math.min(top, viewportHeight + scrollY - menuRect.height - 10));
      
      // Apply position and show menu
      this.contextMenu.style.left = `${left}px`;
      this.contextMenu.style.top = `${top}px`;
      this.contextMenu.style.display = 'block';
      this.contextMenu.classList.add('visible');
      
      console.log('Context menu shown at:', { left, top });
      
      // Prevent the context menu from closing immediately
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
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

  highlightSelection(category) {
    console.log('Highlighting selection with category:', category);
    
    if (!this.currentSelection) {
      console.log('No current selection');
      return;
    }
    
    if (!category) {
      console.log('No category provided');
      return;
    }
    
    try {
      // Use the preserved selection from currentSelection
      const { range: savedRange, text: selectedText } = this.currentSelection;
      
      if (!savedRange) {
        console.log('No saved range in selection');
        return;
      }
      
      console.log('Selected text for highlighting:', `"${selectedText}"`);
      
      if (!selectedText || selectedText.length === 0) {
        console.log('Empty selection, nothing to highlight');
        return;
      }
      
      // Create a new range from the saved range with error handling
      let range;
      let parentElement;
      
      try {
        range = document.createRange();
        range.setStart(savedRange.startContainer, savedRange.startOffset);
        range.setEnd(savedRange.endContainer, savedRange.endOffset);
        
        // Get the parent element that contains the selection
        parentElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
          ? range.commonAncestorContainer.parentNode 
          : range.commonAncestorContainer;
          
        // Validate the parent element
        if (!parentElement || !parentElement.nodeType) {
          throw new Error('Invalid parent element');
        }
      } catch (error) {
        console.error('Error creating range or finding parent element:', error);
        return; // Exit if we can't create a valid range
      }
      
      // If the parent is already a highlight, don't nest highlights
      if (parentElement.classList?.contains('text-highlight')) {
        console.log('Cannot highlight inside an existing highlight');
        return;
      }
      
      // Save the HTML content before modification
      const beforeHTML = parentElement.innerHTML;
      
      try {
        // Create a new range for the exact selection
        const newRange = document.createRange();
        
        // Ensure we have valid range boundaries
        if (!range.startContainer || !range.endContainer) {
          throw new Error('Invalid range boundaries');
        }
        
        // Set the range with error handling
        try {
          newRange.setStart(range.startContainer, range.startOffset);
          newRange.setEnd(range.endContainer, range.endOffset);
        } catch (error) {
          console.error('Error setting range boundaries:', error);
          throw new Error('Failed to set range boundaries');
        }
        
        // Extract the selected content
        let selectedContent;
        try {
          selectedContent = newRange.extractContents();
          if (!selectedContent) {
            throw new Error('Failed to extract content');
          }
        } catch (error) {
          console.error('Error extracting content:', error);
          throw new Error('Failed to extract selected content');
        }
        
        // Create the highlight element
        const highlight = document.createElement('span');
        highlight.className = `text-highlight ${category}`;
        highlight.setAttribute('data-category', category);
        
        // Add the selected content to our highlight
        highlight.appendChild(selectedContent);
        
        try {
          // Insert the highlight at the selection position
          newRange.insertNode(highlight);
          
          // Normalize the parent to merge adjacent text nodes
          parentElement.normalize();
          
          // Clear the current selection
          const currentSelection = window.getSelection();
          if (currentSelection.rangeCount > 0) {
            currentSelection.removeAllRanges();
          }
        } catch (error) {
          console.error('Error inserting highlight:', error);
          // Try to restore the original content if possible
          if (parentElement && beforeHTML) {
            parentElement.innerHTML = beforeHTML;
          }
          throw new Error('Failed to insert highlight');
        }
        
        // Get the HTML after modification
        const afterHTML = parentElement.innerHTML;
        
        // Add to history for undo/redo
        this.addToHistory({
          type: 'add',
          element: highlight,
          text: selectedText,
          category: category,
          parentElement: parentElement,
          beforeHTML: beforeHTML,
          afterHTML: afterHTML
        });
        
        // Force a reflow to ensure the highlight is rendered
        void highlight.offsetHeight;
        
        // Log the highlight for debugging
        console.log('Highlight applied:', {
          element: highlight,
          text: selectedText,
          category: category,
          parent: highlight.parentElement,
          html: highlight.outerHTML
        });
        
        // Clear the current selection
        this.currentSelection = null;
        
        // Hide the context menu
        this.hideContextMenu();
        
        console.log('Successfully highlighted text:', `"${selectedText}"`);
        
        // Dispatch a custom event that other parts of the app can listen for
        const event = new CustomEvent('highlight-added', {
          detail: {
            element: highlight,
            text: selectedText,
            category: category
          }
        });
        document.dispatchEvent(event);
        
      } catch (error) {
        // Restore original content if something goes wrong
        console.error('Error applying highlight, restoring content:', error);
        parentElement.innerHTML = beforeHTML;
      }
    } catch (error) {
      console.error('Error highlighting selection:', error);
    }
  }

  removeHighlight(element = null) {
    try {
      const target = element || 
                   (window.getSelection().anchorNode?.parentElement?.closest('.text-highlight')) ||
                   document.querySelector('.text-highlight:focus');
      
      if (!target || !target.classList.contains('text-highlight')) {
        console.log('No highlight element found to remove');
        return;
      }
      
      console.log('Removing highlight:', {
        element: target,
        text: target.textContent,
        category: target.dataset.category
      });
      
      // Get parent element for history
      const parentElement = target.parentNode;
      const beforeHTML = parentElement.innerHTML;
      
      // Create a text node with the same content
      const textNode = document.createTextNode(target.textContent);
      
      // Replace the highlight with the text node
      parentElement.replaceChild(textNode, target);
      
      // Add to history for undo/redo
      this.addToHistory({
        type: 'remove',
        element: target,
        text: target.textContent,
        category: target.dataset.category,
        parentElement: parentElement,
        beforeHTML: beforeHTML,
        afterHTML: parentElement.innerHTML
      });
      
      console.log('Highlight removed successfully');
    } catch (error) {
      console.error('Error removing highlight:', error);
    }
  }

  addToHistory(action) {
    try {
      console.log('Adding to history:', {
        type: action.type,
        text: action.text,
        category: action.category
      });
      
      // Ensure we have a valid action
      if (!action || typeof action !== 'object') {
        throw new Error('Invalid action provided to addToHistory');
      }
      
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
      
      console.log('History updated:', this.history.length, 'items, current index:', this.historyIndex);
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
    const { element } = action;
    if (element.parentNode) {
      const textNode = document.createTextNode(element.textContent);
      element.parentNode.replaceChild(textNode, element);
    }
  }

  undoRemoveHighlight(action) {
    const { element, category } = action;
    const highlight = document.createElement('span');
    highlight.className = `text-highlight ${category}`;
    highlight.setAttribute('data-category', category);
    highlight.textContent = action.text;
    
    if (element.parentNode) {
      element.parentNode.replaceChild(highlight, element);
    }
  }

  redoAddHighlight(action) {
    const { element, category, text } = action;
    const highlight = document.createElement('span');
    highlight.className = `text-highlight ${category}`;
    highlight.setAttribute('data-category', category);
    highlight.textContent = text;
    
    if (element.parentNode) {
      element.parentNode.replaceChild(highlight, element);
    }
  }

  redoRemoveHighlight(action) {
    const { element } = action;
    const textNode = document.createTextNode(element.textContent);
    element.parentNode.replaceChild(textNode, element);
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

  getTextPosition(element) {
    // This is a simplified version - you might need to implement
    // a more sophisticated way to track text positions
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = range.getBoundingClientRect();
    
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  }

  updateUndoRedoButtons() {
    try {
      // Ensure we have a valid history array
      if (!Array.isArray(this.highlightHistory)) {
        this.highlightHistory = [];
        this.historyIndex = -1;
      }
      
      const undoBtn = document.querySelector('[data-action="undo"]');
      const redoBtn = document.querySelector('[data-action="redo"]');
      
      if (undoBtn) {
        undoBtn.disabled = this.historyIndex < 0;
        undoBtn.title = this.historyIndex >= 0 ? 'Undo last action' : 'Nothing to undo';
      }
      
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
    
    // Initialize the highlighter
    window.textHighlighter = new TextHighlighter();
    console.log('TextHighlighter initialized successfully');
    
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
