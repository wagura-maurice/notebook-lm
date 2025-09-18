// js/doccano.js
  
// Create a namespace for our application
(function() {
    'use strict';
    
    // Only create the app if it doesn't exist
    if (window.DoccanoApp) {
        console.warn('DoccanoApp is already defined');
        return;
    }
    
    // Private variables
    let currentSelection = null;
    let currentSelectionRange = null;
    let taxonomies = [
        {
            id: 'target-groups',
            name: 'Target Groups',
            prefix: 'T',
            color: 'blue',
            count: 16
        },
        {
            id: 'almp-instruments',
            name: 'Almp Instruments',
            prefix: 'A',
            color: 'green',
            count: 9
        },
        {
            id: 'delivery-modes',
            name: 'Delivery Modes',
            prefix: 'D',
            color: 'yellow',
            count: 9
        },
        {
            id: 'evaluation-methods',
            name: 'Evaluation Methods',
            prefix: 'E',
            color: 'red',
            count: 5
        },
        {
            id: 'policy-areas',
            name: 'Policy Areas',
            prefix: 'P',
            color: 'purple',
            count: 7
        },
        {
            id: 'geographic-scope',
            name: 'Geographic Scope',
            prefix: 'G',
            color: 'pink',
            count: 12
        }
        ];
    
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
        }
    
        // Set up event listeners
        function setupEventListeners() {
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
            
            // Remove the hidden class and set display to block
            popup.classList.remove('hidden');
            popup.style.display = 'block';
            
            // Clear previous options
            optionsContainer.innerHTML = '';
            
            // Add taxonomy options
            taxonomies.forEach(taxonomy => {
                const option = document.createElement('div');
                option.className = 'taxonomy-option flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer';
                option.innerHTML = `
                    <div class="flex items-center">
                        <span class="inline-flex items-center justify-center w-5 h-5 mr-2">
                            <span class="w-3 h-3 rounded-full bg-${taxonomy.color}-500 border-${taxonomy.color}-600 border"></span>
                        </span>
                        <span class="text-sm">${taxonomy.name}</span>
                    </div>
                `;
                
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
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
            span.className = `taxonomy-highlight bg-${taxonomy.color}-100 text-${taxonomy.color}-800 px-1 rounded border-b-2 border-${taxonomy.color}-200 cursor-pointer`;
            span.id = `taxonomy-${taxonomy.id}`;
            span.dataset.taxonomyId = taxonomy.id;
            
            // Add tooltip
            span.innerHTML = `${currentSelection}<span class="taxonomy-tooltip">${taxonomy.name}</span>`;
            
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
        
        container.innerHTML = '';
        
        taxonomies.forEach(taxonomy => {
            const element = document.createElement('div');
            element.className = 'group flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 hover:shadow-sm hover:bg-gradient-to-r hover:from-white hover:to-gray-50 border border-transparent hover:border-gray-200';
            element.innerHTML = `
            <div class="flex items-center min-w-0">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-${taxonomy.color}-500 border-${taxonomy.color}-600 border shadow-sm group-hover:shadow-md transition-shadow">
                <span class="text-xs font-bold text-white">${taxonomy.prefix}</span>
                </span>
                <span class="ml-3 text-sm font-medium text-gray-800 truncate" title="${taxonomy.name}">
                ${taxonomy.name}
                </span>
            </div>
            <span class="ml-2 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 group-hover:bg-eu-blue/5 group-hover:border-eu-blue/20 group-hover:text-eu-blue transition-colors">
                ${taxonomy.count}
            </span>
        `;

        container.appendChild(element);
    });
}

    // Assign to window
    window.DoccanoApp = {
        init: init
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