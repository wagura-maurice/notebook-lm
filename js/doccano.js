// js/doccano.js
  
// Create a namespace for our application
(function() {
    'use strict';
    
    // Enhanced color palette with maximum perceptual difference
    // Colors are organized by hue for maximum distinction
    const colorPalette = [
        // Primary colors (0-120° hue)
        { name: 'vivid-red', hex: '#FF3B30' },      // Bright red
        { name: 'vivid-orange', hex: '#FF9500' },   // Vivid orange
        { name: 'vivid-yellow', hex: '#FFCC00' },   // Vivid yellow
        { name: 'vivid-green', hex: '#34C759' },    // Vivid green
        { name: 'vivid-cyan', hex: '#00C7BE' },     // Vivid cyan
        { name: 'vivid-blue', hex: '#007AFF' },     // Vivid blue
        
        // Secondary colors (120-240° hue)
        { name: 'vivid-indigo', hex: '#5856D6' },   // Vivid indigo
        { name: 'vivid-violet', hex: '#AF52DE' },   // Vivid violet
        { name: 'vivid-purple', hex: '#FF2D55' },   // Vivid purple
        { name: 'vivid-magenta', hex: '#FF2D55' },  // Vivid magenta
        { name: 'vivid-pink', hex: '#FF375F' },     // Vivid pink
        
        // Tertiary colors (240-360° hue)
        { name: 'deep-sky-blue', hex: '#007AFF' },   // Deep sky blue
        { name: 'spring-green', hex: '#00E5A1' },    // Spring green
        { name: 'electric-lime', hex: '#CDDC39' },   // Electric lime
        { name: 'amber', hex: '#FFC107' },           // Amber
        { name: 'deep-orange', hex: '#FF7043' },     // Deep orange
        { name: 'bright-red', hex: '#FF3B30' },      // Bright red
        
        // Additional distinct colors with varied saturation and lightness
        { name: 'emerald', hex: '#2ECC71' },         // Emerald
        { name: 'peter-river', hex: '#3498DB' },     // Peter river
        { name: 'amethyst', hex: '#9B59B6' },        // Amethyst
        { name: 'sun-flower', hex: '#F1C40F' },      // Sun flower
        { name: 'carrot', hex: '#E67E22' },          // Carrot
        { name: 'alizarin', hex: '#E74C3C' },        // Alizarin
        { name: 'turquoise', hex: '#1ABC9C' },       // Turquoise
        { name: 'peter-river', hex: '#3498DB' },     // Peter river
        { name: 'wisteria', hex: '#8E44AD' },        // Wisteria
        { name: 'midnight-blue', hex: '#2C3E50' }    // Midnight blue
    ];
    
    // Track which colors have been used
    const usedColorIndices = new Set();
    
    // Transformer functions (moved from transformer.js)
    function stringToColor(str) {
        // Generate a hash from the string
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Try to get a color from our palette first
        const colorIndex = Math.abs(hash) % colorPalette.length;
        
        if (!usedColorIndices.has(colorIndex)) {
            // If we haven't used this color yet, use it
            usedColorIndices.add(colorIndex);
            return colorPalette[colorIndex];
        } else {
            // If we've used all colors, start reusing from the beginning
            // but with a different shade based on the string
            const baseColor = colorPalette[colorIndex];
            const shadeVariant = (Math.abs(hash) % 7) + 1; // 1-7
            
            // Return a new object with the same name but different shade
            return {
                name: baseColor.name,
                hex: adjustShade(baseColor.hex, shadeVariant * 50)
            };
        }
    }
    
    // Helper function to adjust color shade
    function adjustShade(hex, amount) {
        // Convert hex to RGB
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        
        // Adjust brightness
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
        
        // Convert back to hex
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    function getPrefix(str) {
        return str
            .split('_')
            .map(word => word[0]?.toUpperCase() || '')
            .join('')
            .substring(0, 2);
    }

    function processLine(line, taxonomyMap = {}) {
        try {
            const data = JSON.parse(line);
            
            if (data.enrichment?.taxonomy) {
                const { taxonomy } = data.enrichment;
                
                // Process each category in the taxonomy
                for (const [category, items] of Object.entries(taxonomy)) {
                    // Only process if the category has items
                    if (Array.isArray(items) && items.length > 0) {
                        const key = category.toLowerCase();
                        if (!taxonomyMap[key]) {
                            taxonomyMap[key] = {
                                id: key,
                                name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                prefix: getPrefix(category),
                                color: stringToColor(category),
                                count: 0
                            };
                        }
                        // Increment count for each document that has this category
                        taxonomyMap[key].count++;
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to parse line:', line, e);
        }
        return taxonomyMap;
    }

    function transformNdjsonToTaxonomies(ndjson) {
        const lines = ndjson.split('\n').filter(line => line.trim());
        const taxonomyMap = {};
        
        lines.forEach(line => {
            processLine(line, taxonomyMap);
        });
        
        // Convert the map to an array and sort by count (descending)
        return Object.values(taxonomyMap).sort((a, b) => b.count - a.count);
    }
    
    async function fetchAndProcessTaxonomies(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const ndjson = await response.text();
            return transformNdjsonToTaxonomies(ndjson);
        } catch (error) {
            console.error('Error fetching or processing taxonomies:', error);
            return []; // Return empty array in case of error
        }
    }
    
    // Only create the app if it doesn't exist
    if (window.DoccanoApp) {
        console.warn('DoccanoApp is already defined');
        return;
    }
    
    // Private variables
    let currentSelection = null;
    let currentSelectionRange = null;
    let lastChangeTime = 0;
    const DEBOUNCE_TIME = 300; // ms to wait before considering a new state change
    
    // Get line number for a given element
    function getLineNumber(element) {
        // Ensure the element is a valid DOM element that has the closest method
        if (!element || typeof element.closest !== 'function') {
            // If it's a text node, try to use its parent element
            if (element && element.parentElement) {
                element = element.parentElement;
            } else {
                return null;
            }
        }
        
        try {
            // Find the closest parent with a line number
            const lineElement = element.closest('.flex.items-start.group');
            if (lineElement) {
                const lineNumberSpan = lineElement.querySelector('span.text-xs.text-gray-400');
                if (lineNumberSpan) {
                    return lineNumberSpan.textContent.trim();
                }
            }
        } catch (e) {
            console.error('Error getting line number:', e);
        }
        return null;
    }

    // Undo/Redo stack
    const stateHistory = {
        stack: [],
        currentIndex: -1,
        maxStates: 50,
        
        pushState: function(html) {
            const now = Date.now();
            
            // Debounce rapid state changes
            if (now - lastChangeTime < DEBOUNCE_TIME) {
                // If this is a rapid change, replace the last state instead of adding a new one
                if (this.stack.length > 0) {
                    this.stack[this.currentIndex] = html;
                } else {
                    this.stack.push(html);
                    this.currentIndex = 0;
                }
            } else {
                // Normal state change
                if (this.currentIndex < this.stack.length - 1) {
                    this.stack = this.stack.slice(0, this.currentIndex + 1);
                }
                this.stack.push(html);
                this.currentIndex++;
                
                // Limit stack size
                if (this.stack.length > this.maxStates) {
                    this.stack.shift();
                    this.currentIndex--;
                }
            }
            
            lastChangeTime = now;
            this.updateButtonStates();
            
            console.log('State saved:', {
                currentIndex: this.currentIndex,
                stackSize: this.stack.length,
                time: new Date().toISOString()
            });
        },
        
        updateButtonStates: function() {
            const undoBtn = document.getElementById('undo-btn');
            const redoBtn = document.getElementById('redo-btn');
            
            if (undoBtn) {
                undoBtn.disabled = this.currentIndex <= 0;
                undoBtn.classList.toggle('opacity-50', this.currentIndex <= 0);
                undoBtn.classList.toggle('cursor-not-allowed', this.currentIndex <= 0);
            }
            
            if (redoBtn) {
                // Enable redo button if we're not at the latest state
                const atLatestState = this.currentIndex >= this.stack.length - 1;
                redoBtn.disabled = atLatestState;
                redoBtn.classList.toggle('opacity-50', atLatestState);
                redoBtn.classList.toggle('cursor-not-allowed', atLatestState);
                
                // Debug logging
                console.log('Redo state:', {
                    currentIndex: this.currentIndex,
                    stackLength: this.stack.length,
                    canRedo: !atLatestState
                });
            }
        },
        
        // Handle undo action
        undo: function() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateButtonStates();
                return this.stack[this.currentIndex];
            }
            return null;
        },
        
        // Handle redo action
        redo: function() {
            if (this.currentIndex < this.stack.length - 1) {
                this.currentIndex++;
                this.updateButtonStates();
                return this.stack[this.currentIndex];
            }
            return null;
        }
    };
    
    // Taxonomies data - will be loaded asynchronously
    let taxonomies = [];
    let taxonomiesLoaded = false;
    const taxonomyCallbacks = [];

    /**
     * Load taxonomies from the NDJSON file
     * @returns {Promise<Array>} Promise that resolves with the loaded taxonomies
     */
    async function loadTaxonomies() {
        if (taxonomiesLoaded) {
            return taxonomies;
        }

        try {
            taxonomies = await fetchAndProcessTaxonomies(
                './assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson'
            );
            console.log('Taxonomies loaded successfully:', taxonomies);
            taxonomiesLoaded = true;
            
            // Execute all pending callbacks
            while (taxonomyCallbacks.length) {
                const callback = taxonomyCallbacks.shift();
                if (typeof callback === 'function') {
                    try {
                        callback(taxonomies);
                    } catch (err) {
                        console.error('Error in taxonomy callback:', err);
                    }
                }
            }
            
            return taxonomies;
        } catch (error) {
            console.error('Failed to load taxonomies:', error);
            // Return empty array if loading fails
            return [];
        }
    }

    /**
     * Register a callback to be called when taxonomies are loaded
     * @param {Function} callback - Function to call with the taxonomies array
     */
    function onTaxonomiesLoaded(callback) {
        if (taxonomiesLoaded) {
            callback(taxonomies);
        } else {
            taxonomyCallbacks.push(callback);
        }
    }

    // Start loading taxonomies when the script loads
    loadTaxonomies().catch(console.error);
    
    // Handle undo action
    function handleUndo() {
        const state = stateHistory.undo();
        if (state !== null) {
            const docContent = document.getElementById('document-content');
            if (docContent) {
                try {
                    const snapshot = JSON.parse(state);
                    
                    // Save current scroll position
                    const scrollY = window.scrollY;
                    
                    // Restore the HTML content
                    docContent.innerHTML = snapshot.html;
                    
                    // Restore all highlight states
                    snapshot.highlights.forEach(hlState => {
                        const highlight = document.getElementById(hlState.id);
                        if (highlight) {
                            if (hlState.isActive) {
                                highlight.classList.add('highlight-active');
                            } else {
                                highlight.classList.remove('highlight-active');
                            }
                        }
                    });
                    
                    // Restore active highlight and scroll to it if it exists
                    if (snapshot.currentHighlightId) {
                        const activeHighlight = document.getElementById(snapshot.currentHighlightId);
                        if (activeHighlight) {
                            activeHighlight.classList.add('highlight-active');
                            setTimeout(() => {
                                activeHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                        }
                    } else {
                        // Restore scroll position if no active highlight
                        window.scrollTo(0, scrollY);
                    }
                    
                    initTextSelection();
                    console.log('Undo to state:', { 
                        currentHighlightId: snapshot.currentHighlightId,
                        highlights: snapshot.highlights.length 
                    });
                } catch (e) {
                    console.error('Error during undo:', e);
                    // Fallback for old format states
                    docContent.innerHTML = state;
                    initTextSelection();
                }
            }
        }
    }

    // Handle redo action
    function handleRedo() {
        const state = stateHistory.redo();
        if (state !== null) {
            const docContent = document.getElementById('document-content');
            if (docContent) {
                try {
                    const snapshot = JSON.parse(state);
                    
                    // Save current scroll position
                    const scrollY = window.scrollY;
                    
                    // Restore the HTML content
                    docContent.innerHTML = snapshot.html;
                    
                    // Restore all highlight states
                    snapshot.highlights.forEach(hlState => {
                        const highlight = document.getElementById(hlState.id);
                        if (highlight) {
                            if (hlState.isActive) {
                                highlight.classList.add('highlight-active');
                            } else {
                                highlight.classList.remove('highlight-active');
                            }
                        }
                    });
                    
                    // Restore active highlight and scroll to it if it exists
                    if (snapshot.currentHighlightId) {
                        const activeHighlight = document.getElementById(snapshot.currentHighlightId);
                        if (activeHighlight) {
                            activeHighlight.classList.add('highlight-active');
                            setTimeout(() => {
                                activeHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                        }
                    } else {
                        // Restore scroll position if no active highlight
                        window.scrollTo(0, scrollY);
                    }
                    
                    initTextSelection();
                    console.log('Redo to state:', { 
                        currentHighlightId: snapshot.currentHighlightId,
                        highlights: snapshot.highlights.length 
                    });
                } catch (e) {
                    console.error('Error during redo:', e);
                    // Fallback for old format states
                    docContent.innerHTML = state;
                    initTextSelection();
                }
            }
        }
    }

    // Save current document state with line information
    function saveState() {
        const docContent = document.getElementById('document-content');
        if (docContent) {
            // Get the currently active highlight
            const activeHighlight = document.querySelector('.taxonomy-highlight.highlight-active');
            
            // Create a snapshot of the current state with line numbers
            const snapshot = {
                html: docContent.innerHTML,
                highlights: [],
                timestamp: new Date().toISOString(),
                currentHighlightId: activeHighlight ? activeHighlight.id : null
            };

            // Store information about each highlight with their positions
            document.querySelectorAll('.taxonomy-highlight').forEach(hl => {
                snapshot.highlights.push({
                    id: hl.id,
                    text: hl.textContent,
                    lineNumber: hl.dataset.lineNumber || '',
                    taxonomyId: hl.dataset.taxonomyId || '',
                    isActive: hl.classList.contains('highlight-active')
                });
            });
            
            // Save the state to history
            stateHistory.pushState(JSON.stringify(snapshot));
            
            console.log('State saved:', { 
                currentHighlightId: snapshot.currentHighlightId,
                highlights: snapshot.highlights.length 
            });
            
            return snapshot;
        }
        return null;
    }

// Set up all event listeners
function setupEventListeners() {
    // Add event listeners for undo/redo buttons if they exist
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const saveBtn = document.getElementById('save-btn');
    
    if (undoBtn) {
        undoBtn.addEventListener('click', handleUndo);
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', handleRedo);
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveWithExport);
    }
}

// Initialize the application
function init() {
    initCollapsibleSections();
    initTextSelection();
    initTaxonomyPopup();
    setupEventListeners();
    renderTaxonomies();
    
    // Add double-click event listener to remove highlights
    document.addEventListener('dblclick', function(e) {
        const highlight = e.target.closest('.taxonomy-highlight');
        if (highlight) {
            e.preventDefault();
            e.stopPropagation();
            removeHighlight(highlight);
        }
    });
            
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.shiftKey ? handleRedo() : handleUndo();
            e.preventDefault();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            handleRedo();
            e.preventDefault();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            handleSaveWithExport();
            e.preventDefault();
        }
    });
    
    // Handle section triggers
    document.addEventListener('click', function(e) {
        // Check if the click was on a section trigger or its children
        const trigger = e.target.closest('.section-trigger');
        if (trigger) {
            e.preventDefault();
            
            // Find the parent section
            const section = trigger.closest('.document-section');
            if (!section) return;
            
            // Toggle the active class on the section
            section.classList.toggle('is-active');
            
            // Toggle the chevron icon
            const icon = trigger.querySelector('.section-icon');
            if (icon) {
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            }
            
            // Toggle the content visibility
            const content = section.querySelector('.section-content');
            if (content) {
                content.classList.toggle('hidden');
            }
            }
        });
        }
    
        // Initialize all collapsible sections
        function initCollapsibleSections() {
        const sections = document.querySelectorAll('.document-section');
        sections.forEach(section => {
            const content = section.querySelector('.section-content');
            const icon = section.querySelector('.section-icon');
            
            // Ensure content is hidden by default
            if (content) {
            content.classList.add('hidden');
            }
            
            // Ensure chevron points down by default
            if (icon) {
            icon.classList.add('fa-chevron-down');
            icon.classList.remove('fa-chevron-up');
            }
        });
        }
    
        // Text selection handling
        function initTextSelection() {
            // Get the document content element
            const docContent = document.getElementById('document-content');
            if (!docContent) return;
            
            // Only add event listeners to the document content area
            docContent.addEventListener('mouseup', handleTextSelection, true);
            docContent.addEventListener('mousedown', clearSelectionIfOutside, true);
        }
    
        function isSelectionInParagraph(selection) {
            // Check if the selection is within a paragraph element
            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            if (!range) return false;
            
            // Get the common ancestor container
            const container = range.commonAncestorContainer;
            
            // If it's a text node, get its parent element
            const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
            
            // Check if the element or any of its parents is a paragraph
            return element.closest('p') !== null;
        }
    
        function handleTextSelection(e) {
            console.log('handleTextSelection triggered');
            
            // Prevent default to avoid any potential interference
            e.preventDefault();
            e.stopPropagation();
            
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            console.log('Selected text:', selectedText);
            
            // Check if selection is within document-content and inside a paragraph
            const isInValidArea = isSelectionInParagraph(selection) && 
                                document.getElementById('document-content').contains(selection.anchorNode);
            
            // Only proceed if there's a valid text selection, we're not inside the popup,
            // and we're inside a paragraph within document-content
            if (selectedText.length > 0 && !isInside(selection, 'taxonomy-popup') && isInValidArea) {
                console.log('Valid selection, showing popup');
                
                // Store the current selection
                currentSelection = selectedText;
                currentSelectionRange = selection.getRangeAt(0);
                
                // Show the taxonomy popup
                showTaxonomyPopup(selection);
                
                // Prevent the default browser context menu
                e.preventDefault();
                return false;
            } else {
                console.log('Invalid selection, inside popup, or not in valid area');
                if (selectedText.length === 0) {
                    console.log('No text selected');
                } else if (!isInValidArea) {
                    console.log('Selection not within a paragraph in document-content');
                } else if (isInside(selection, 'taxonomy-popup')) {
                    console.log('Inside taxonomy popup');
                }
            }
        }
    
        function clearSelectionIfOutside(e) {
        const popup = document.getElementById('taxonomy-popup');
        if (popup && !popup.contains(e.target)) {
            clearSelection();
        }
        }
    
        function clearSelection() {
            // Clear text selection
            if (window.getSelection) {
                if (window.getSelection().empty) {  // Chrome
                    window.getSelection().empty();
                } else if (window.getSelection().removeAllRanges) {  // Firefox
                    window.getSelection().removeAllRanges();
                }
            } else if (document.selection) {  // IE
                document.selection.empty();
            }
            
            // Reset selection variables
            currentSelection = null;
            currentSelectionRange = null;
            
            // Hide the popup
            const popup = document.getElementById('taxonomy-popup');
            if (popup) {
                // Add the hidden class and remove display style to allow CSS to handle the hiding
                popup.classList.add('hidden');
                popup.style.display = 'none';
            }
        }
    
        function isInside(selection, elementId) {
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        if (!range) return false;
        
        const node = range.commonAncestorContainer;
        return node.nodeType === 3 
            ? node.parentNode.closest(`#${elementId}`) !== null
            : node.closest(`#${elementId}`) !== null;
        }
    
        // Taxonomy popup functionality
        function initTaxonomyPopup() {
            const popup = document.getElementById('taxonomy-popup');
            if (!popup) return;
            
            const closeBtn = popup.querySelector('#close-popup');
            
            // Close popup when clicking the close button
            if (closeBtn) {
                closeBtn.addEventListener('click', clearSelection);
            }
        }
    
        function showTaxonomyPopup(selection) {
            console.log('showTaxonomyPopup called');
            const popup = document.getElementById('taxonomy-popup');
            const optionsContainer = popup?.querySelector('.space-y-2');
            
            if (!popup) {
                console.error('Popup element not found');
                return;
            }
            if (!optionsContainer) {
                console.error('Options container not found in popup');
                return;
            }
            
            console.log('Popup found:', popup);
            console.log('Options container found:', optionsContainer);
            
            // Clear existing options
            optionsContainer.innerHTML = '';
            
            // Add taxonomy options
            taxonomies.forEach(taxonomy => {
                const color = typeof taxonomy.color === 'object' ? taxonomy.color.hex : taxonomy.color;
                const option = document.createElement('div');
                option.className = 'flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer';
                option.innerHTML = `
                    <div class="flex items-center">
                        <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${color}; border: 1px solid ${color}"></span>
                        <span class="text-sm text-gray-700">${taxonomy.name}</span>
                    </div>
                    <span class="text-xs text-gray-500">${taxonomy.count || 0}</span>
                `;
                
                option.addEventListener('click', () => {
                    assignTaxonomyToSelection(taxonomy);
                });
                
                optionsContainer.appendChild(option);
            });
            
            // Position the popup near the selection
            positionPopup(popup, selection);
            
            // Show the popup with animation
            popup.style.display = 'block';
            // Force reflow to ensure the transition works
            void popup.offsetHeight;
            popup.classList.add('visible');
            
            // Add click outside handler
            const clickOutsideHandler = (e) => {
                if (popup && !popup.contains(e.target)) {
                    clearSelection();
                    document.removeEventListener('mousedown', clickOutsideHandler);
                }
            };
            
            // Add the event listener with a small delay to avoid immediate dismissal
            setTimeout(() => {
                document.addEventListener('mousedown', clickOutsideHandler);
            }, 100);
        }
    
        function positionPopup(popup, selection) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Make sure the popup is visible to get its dimensions
            popup.style.visibility = 'hidden';
            popup.classList.remove('hidden');
            popup.style.display = 'block';
            
            // Force a reflow to ensure dimensions are calculated
            void popup.offsetHeight;
            
            const popupWidth = popup.offsetWidth;
            const popupHeight = popup.offsetHeight;
            
            // Reset styles before calculating position
            popup.style.visibility = 'visible';
            
            // Calculate position
            let top = window.pageYOffset + rect.top - popupHeight - 8; // 8px above selection
            let left = window.pageXOffset + rect.left + (rect.width / 2) - (popupWidth / 2);
            
            // Adjust if the popup would go off-screen horizontally
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            
            if (left < 10) left = 10;
            if (left + popupWidth > viewportWidth - 10) {
                left = viewportWidth - popupWidth - 10;
            }
            
            // Adjust if the popup would go off-screen vertically
            if (top < 10) {
                // If there's not enough space above, show below the selection
                top = window.pageYOffset + rect.bottom + 8; // 8px below selection
                
                // If there's still not enough space, show at the bottom of the viewport
                if (top + popupHeight > viewportHeight - 10) {
                    top = viewportHeight - popupHeight - 10;
                }
            }
            
            // Apply the calculated position
            popup.style.position = 'absolute';
            popup.style.top = `${Math.max(10, top)}px`;
            popup.style.left = `${left}px`;
        }
    
        function assignTaxonomyToSelection(taxonomy) {
            if (!currentSelection || !currentSelectionRange) return;
            
            // Save state before making changes
            saveState();
            
            // Get the line number for this selection
            const lineNumber = getLineNumber(currentSelectionRange.startContainer);
            
            // Check if the selection is already highlighted
            const selectionContainer = currentSelectionRange.commonAncestorContainer;
            const existingHighlight = selectionContainer.parentElement.closest('.taxonomy-highlight');
            
            if (existingHighlight) {
                // If the same taxonomy, remove the highlight
                if (existingHighlight.id === `taxonomy-${taxonomy.id}`) {
                    removeHighlight(existingHighlight);
                    return;
                }
                // If different taxonomy, replace it
                const range = document.createRange();
                range.selectNode(existingHighlight);
                currentSelectionRange = range;
                currentSelection = existingHighlight.textContent;
                existingHighlight.remove();
            }
            
            // Create a span to wrap the selected text
            const span = document.createElement('span');
            const bgColor = typeof taxonomy.color === 'object' ? taxonomy.color.hex : taxonomy.color;
            
            // Use inline styles for consistent coloring with the taxonomy list
            span.style.cssText = `
                background-color: ${bgColor}20;
                color: ${bgColor};
                border-bottom: 2px solid ${bgColor}80;
                padding: 0 0.25rem;
                border-radius: 0.25rem;
                cursor: pointer;
                position: relative;
            `;
            
            span.className = 'taxonomy-highlight';
            span.id = `taxonomy-${taxonomy.id}-${Date.now()}`; // Add timestamp for unique ID
            span.dataset.taxonomyId = taxonomy.id;
            span.dataset.lineNumber = lineNumber || '';
            span.dataset.originalText = currentSelection; // Store original text separately
            
            // Add tooltip with matching color and hover effects
            span.innerHTML = `
                ${currentSelection}
                <span class="taxonomy-tooltip" style="
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.375rem;
                    padding: 0.25rem 0.5rem;
                    position: absolute;
                    z-index: 50;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(-5px);
                    white-space: nowrap;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    opacity: 0;
                    visibility: hidden;
                    color: #374151;
                    font-size: 0.75rem;
                    font-weight: 500;
                    transition: all 0.2s ease-in-out;
                    pointer-events: none;
                ">
                    <span class="inline-block w-2 h-2 rounded-full mr-1" style="background-color: ${bgColor}"></span>
                    ${taxonomy.name}
                </span>`;
                
            // Add hover effects for the tooltip
            span.addEventListener('mouseenter', (e) => {
                const tooltip = span.querySelector('.taxonomy-tooltip');
                if (tooltip) {
                    tooltip.style.opacity = '1';
                    tooltip.style.visibility = 'visible';
                    tooltip.style.transform = 'translateX(-50%) translateY(-10px)';
                }
            });
            
            span.addEventListener('mouseleave', (e) => {
                const tooltip = span.querySelector('.taxonomy-tooltip');
                if (tooltip) {
                    tooltip.style.opacity = '0';
                    tooltip.style.visibility = 'hidden';
                    tooltip.style.transform = 'translateX(-50%) translateY(-5px)';
                }
            });
            
            // Store position information
            const range = currentSelectionRange.cloneRange();
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(document.getElementById('document-content'));
            preCaretRange.setEnd(range.startContainer, range.startOffset);
            const startOffset = preCaretRange.toString().length;
            
            span.dataset.startOffset = startOffset;
            span.dataset.endOffset = startOffset + currentSelection.length;
            
            // Replace the selected text with our highlighted span
            currentSelectionRange.deleteContents();
            currentSelectionRange.insertNode(span);
            
            // Update the count
            taxonomy.count++;
            
            // Re-render taxonomies to update the count
            renderTaxonomies();
            
            // Clear the selection
            clearSelection();
        }
        
        function removeHighlight(highlightElement) {
            // Save state before making changes
            saveState();
            
            const taxonomyId = highlightElement.id.replace('taxonomy-', '');
            const taxonomy = taxonomies.find(t => t.id === taxonomyId);
            
            if (taxonomy && taxonomy.count > 0) {
                taxonomy.count--;
                renderTaxonomies();
            }
            
            // Get the original text content (excluding the tooltip)
            const originalText = highlightElement.firstChild.textContent || highlightElement.textContent;
            
            // Replace the highlight with just the original text
            const textNode = document.createTextNode(originalText);
            highlightElement.parentNode.replaceChild(textNode, highlightElement);
            
            // Clear any existing selection
            clearSelection();
        }
    
        function renderTaxonomies() {
            const container = document.getElementById('taxonomy-container');
            if (!container) return;
            
            // Show loading state
            container.innerHTML = '<div class="text-sm text-gray-500 py-4 text-center">Loading taxonomies...</div>';
            
            // This will be called when taxonomies are loaded
            onTaxonomiesLoaded((taxonomyList) => {
                if (!taxonomyList || taxonomyList.length === 0) {
                    container.innerHTML = '<div class="text-sm text-red-500 py-4">No taxonomies available</div>';
                    return;
                }
                
                container.innerHTML = '';
                
                taxonomyList.forEach(taxonomy => {
                    const element = document.createElement('div');
                    element.className = 'group flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 hover:shadow-sm hover:bg-gradient-to-r hover:from-white hover:to-gray-50 border border-transparent hover:border-gray-200';
                    
                    // Get the color from the taxonomy
                    const color = typeof taxonomy.color === 'object' ? taxonomy.color.hex : taxonomy.color;
                    
                    element.innerHTML = `
                    <div class="flex items-center min-w-0">
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-md border shadow-sm group-hover:shadow-md transition-all" 
                              style="background-color: ${color}80; border-color: ${color}">
                            <span class="text-xs font-bold text-white">${taxonomy.prefix}</span>
                        </span>
                        <span class="ml-3 text-sm font-medium text-gray-800 truncate" title="${taxonomy.name}">
                            ${taxonomy.name}
                        </span>
                    </div>
                    <span class="ml-2 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 group-hover:bg-gray-100 transition-colors">
                        ${taxonomy.count}
                    </span>`;
                    
                    container.appendChild(element);
                });
            });
        }

    // Export highlights to a structured format
    function exportHighlights() {
        const highlights = [];
        const docContent = document.getElementById('document-content');
        
        if (!docContent) {
            console.log("No document content found");
            return null;
        }
        
        try {
            // Get all highlight elements
            const highlightElements = docContent.querySelectorAll('.taxonomy-highlight');
            
            // First, process pre-rendered highlights
            const preRenderedHighlights = [];
            const processedIds = new Set();
            
            // Process all highlight elements
            highlightElements.forEach(hl => {
                try {
                    let taxonomyId = hl.dataset.taxonomyId;
                    let taxonomyName = '';
                    
                    // For pre-rendered highlights, extract taxonomy info from color scheme
                    if (!taxonomyId && hl.dataset.colorScheme) {
                        try {
                            const colorScheme = JSON.parse(hl.dataset.colorScheme);
                            // Find the taxonomy that matches this color scheme
                            const taxonomy = taxonomies.find(t => 
                                t.color === colorScheme.bg.replace('bg-', '').replace('-500', '')
                            );
                            if (taxonomy) {
                                taxonomyId = taxonomy.id;
                                taxonomyName = taxonomy.name;
                            }
                        } catch (e) {
                            console.warn("Failed to parse color scheme:", e);
                        }
                    }
                    
                    // Skip if we couldn't determine the taxonomy
                    if (!taxonomyId) {
                        console.warn("Skipping highlight - could not determine taxonomy:", hl);
                        return;
                    }
                    
                    // Get the text content without the tooltip
                    let text = hl.textContent;
                    const tooltip = hl.querySelector('.taxonomy-tooltip');
                    if (tooltip) {
                        text = text.replace(tooltip.textContent, '').trim();
                    }
                    
                    // Generate a unique ID if needed
                    const id = hl.id || `highlight-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    
                    // Skip if we've already processed this ID
                    if (processedIds.has(id)) return;
                    processedIds.add(id);
                    
                    // Get line number from parent element if available
                    let lineNumber = hl.dataset.lineNumber || '';
                    if (!lineNumber) {
                        const lineElement = hl.closest('.flex.items-start.group');
                        if (lineElement) {
                            const lineNumberSpan = lineElement.querySelector('span.text-xs.text-gray-400');
                            if (lineNumberSpan) {
                                lineNumber = lineNumberSpan.textContent.trim();
                            }
                        }
                    }
                    
                    // Calculate position if not available
                    let startOffset = parseInt(hl.dataset.startOffset);
                    let endOffset = parseInt(hl.dataset.endOffset);
                    
                    if (isNaN(startOffset) || isNaN(endOffset)) {
                        try {
                            const range = document.createRange();
                            range.selectNodeContents(docContent);
                            const preCaretRange = range.cloneRange();
                            const tempSpan = document.createElement('span');
                            tempSpan.id = 'temp-highlight-marker';
                            hl.parentNode.insertBefore(tempSpan, hl);
                            preCaretRange.setEndBefore(tempSpan);
                            startOffset = preCaretRange.toString().length;
                            endOffset = startOffset + text.length;
                            tempSpan.remove();
                        } catch (e) {
                            console.warn("Failed to calculate position for highlight:", e);
                            startOffset = 0;
                            endOffset = text.length;
                        }
                    }
                    
                    highlights.push({
                        id: id,
                        text: text,
                        line: lineNumber,
                        taxonomy: taxonomyId,
                        taxonomyName: taxonomyName,
                        position: {
                            start: startOffset,
                            end: endOffset
                        },
                        timestamp: hl.dataset.timestamp || new Date().toISOString(),
                        isPreRendered: !hl.id.startsWith('taxonomy-')
                    });
                    
                } catch (error) {
                    console.error("Error processing highlight:", error, hl);
                }
            });
            
            // Get document title or use a default
            const docTitle = document.querySelector('h1')?.textContent || "Untitled Document";
            
            // Create export data structure
            const exportData = {
                document: docTitle.trim(),
                timestamp: new Date().toISOString(),
                highlights: highlights
            };
            
            console.log("Exporting highlights:", exportData);
            return exportData;
        } catch (error) {
            console.error("Error exporting highlights:", error);
            return null;
        }
    }
    
    // Handle save action with export functionality
    function handleSaveWithExport() {
        try {
            // First save the current state
            saveState();
            
            // Export the highlights
            const exportData = exportHighlights();
            
            if (exportData) {
                // Convert to pretty-printed JSON string
                const jsonString = JSON.stringify(exportData, null, 2);
                
                // Create a blob and download link
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `highlights_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
                
                // Show success message
                const saveBtn = document.getElementById('save-btn');
                if (saveBtn) {
                    const originalText = saveBtn.textContent;
                    saveBtn.textContent = 'Saved!';
                    saveBtn.classList.add('text-green-500');
                    
                    setTimeout(() => {
                        saveBtn.textContent = originalText;
                        saveBtn.classList.remove('text-green-500');
                    }, 2000);
                }
                
                return jsonString;
            } else {
                console.warn("No highlights to export");
                return null;
            }
        } catch (error) {
            console.error("Error in handleSaveWithExport:", error);
            return null;
        }
    }
    
// Assign to window
window.DoccanoApp = {
    init: init,
    exportHighlights: exportHighlights,
    handleSaveWithExport: handleSaveWithExport
};

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof init === 'function') init();
        });
    } else {
        // DOMContentLoaded has already fired
        if (typeof init === 'function') init();
    }
})();