// js/doccano.js
// =====================================================
// DOC CANNO.JS - ALPINE.JS-FRIENDLY DOCUMENT ANNOTATION TOOL
// =====================================================

// Import Tailwind configuration
import { configureTailwind } from './tailwind-config.js';

// Load doccano-specific modules
async function loadDoccanoModules() {
    try {
        await Promise.all([
            import('./visualization.js'),
            import('./tour/doccano.js')
        ]);
        console.log('%c[DOCCANO] All modules loaded', 'color: #4CAF50;');
    } catch (error) {
        console.error('%c[DOCCANO] Error loading modules:', 'color: #F44336;', error);
    }
}

// Start loading modules when document is ready
async function initializeApp() {
    try {
        // Configure Tailwind first
        configureTailwind();
        
        // Then load other modules
        await loadDoccanoModules();
        
        console.log('%c[DOCCANO] Application initialized', 'color: #4CAF50;');
    } catch (error) {
        console.error('%c[DOCCANO] Initialization error:', 'color: #F44336;', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// This file implements a web-based document annotation interface using Alpine.js.
// It handles text selection, context menus, popups, taxonomy management, and document section population.
// The tool integrates with NDJSON data for document processing and supports ALMP taxonomies.
//
// Key Features (Alpine.js Enhanced):
// - Text highlighting with color-coded taxonomies (Alpine.js reactivity)
// - Context menu for label assignment on selection (Alpine.js positioning/visibility)
// - Popup for category selection (Alpine.js event delegation)
// - Document section rendering with collapsible UI (Alpine.js reactivity)
// - Tooltip and modal support (Alpine.js reactivity)
// - Event handling integrated with app.js (CustomEvents)
//
// Dependencies: Alpine.js (loaded before app.js), app.js (loaded before this file)
// Global State: Uses window.doccano for shared data, highlighterState for annotations.
//
// Loading Order: Alpine.js → app.js → doccano.js (this file waits for 'appContentReady')
// =====================================================

// Global state for the highlighter
const highlighterState = {
  currentSelection: null,
  currentRange: null,
  taxonomyColorMap: new Map(),
  colorSchemes: [
    {
      bg: "bg-blue-500",
      text: "text-white",
      border: "border-blue-600",
      highlight: "bg-blue-100",
      highlightBorder: "border-blue-200",
      textColor: "text-blue-800",
    },
    {
      bg: "bg-green-500",
      text: "text-white",
      border: "border-green-600",
      highlight: "bg-green-100",
      highlightBorder: "border-green-200",
      textColor: "text-green-800",
    },
    {
      bg: "bg-yellow-500",
      text: "text-white",
      border: "border-yellow-600",
      highlight: "bg-yellow-100",
      highlightBorder: "border-yellow-200",
      textColor: "text-yellow-800",
    },
    {
      bg: "bg-red-500",
      text: "text-white",
      border: "border-red-600",
      highlight: "bg-red-100",
      highlightBorder: "border-red-200",
      textColor: "text-red-800",
    },
    {
      bg: "bg-purple-600",
      text: "text-white",
      border: "border-purple-700",
      highlight: "bg-purple-100",
      highlightBorder: "border-purple-200",
      textColor: "text-purple-800",
    },
    {
      bg: "bg-pink-500",
      text: "text-white",
      border: "border-pink-600",
      highlight: "bg-pink-100",
      highlightBorder: "border-pink-200",
      textColor: "text-pink-800",
    },
    {
      bg: "bg-indigo-600",
      text: "text-white",
      border: "border-indigo-700",
      highlight: "bg-indigo-100",
      highlightBorder: "border-indigo-200",
      textColor: "text-indigo-800",
    },
    {
      bg: "bg-gray-600",
      text: "text-white",
      border: "border-gray-700",
      highlight: "bg-gray-100",
      highlightBorder: "border-gray-200",
      textColor: "text-gray-800",
    },
    {
      bg: "bg-cyan-500",
      text: "text-white",
      border: "border-cyan-600",
      highlight: "bg-cyan-100",
      highlightBorder: "border-cyan-200",
      textColor: "text-cyan-800",
    },
    {
      bg: "bg-teal-500",
      text: "text-white",
      border: "border-teal-600",
      highlight: "bg-teal-100",
      highlightBorder: "border-teal-200",
      textColor: "text-teal-800",
    },
    {
      bg: "bg-amber-500",
      text: "text-white",
      border: "border-amber-600",
      highlight: "bg-amber-100",
      highlightBorder: "border-amber-200",
      textColor: "text-amber-800",
    },
    {
      bg: "bg-rose-600",
      text: "text-white",
      border: "border-rose-700",
      highlight: "bg-rose-100",
      highlightBorder: "border-rose-200",
      textColor: "text-rose-800",
    },
  ],
};

// =====================================================
// SECTION 1: GLOBAL UTILITIES AND STATE (Alpine.js)
// =====================================================
// Alpine.js Benefits: No changes needed for state, but utilities use Alpine.js where applicable.

// Global function to hide context menu
// Alpine.js Integration: Uses DOM manipulation and event removal
function hideMenu(clickEvent) {
  const menu = document.getElementById("context-menu");
  if (menu && !menu.contains(clickEvent.target)) {
    menu.style.display = "none";
    // Remove event listener (would be implemented differently in Alpine.js)
    console.log(
      "%c[DOCCANO] Context menu hidden (outside click)",
      "color: #8b5cf6;"
    );
  }
}

// =====================================================
// SECTION 2: CONTEXT MENU FUNCTIONS (Alpine.js)
// =====================================================
// Alpine.js Benefits: Event delegation, CSS manipulation, reactivity.

// Function to create context menu
// Alpine.js Integration: Uses DOM for element creation and appending
function createContextMenu() {
  const menu = document.getElementById("context-menu");
  if (menu) return menu; // Return DOM element for compatibility

  console.log(
    "%c[DOCCANO] Creating new context menu with Alpine.js",
    "color: #8b5cf6;"
  );

  // Create menu elements manually
  const menuItems = document.createElement("div");
  menuItems.className = "context-menu__items";

  const menuHeader = document.createElement("div");
  menuHeader.className = "px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100";
  menuHeader.textContent = "Add Label";

  const optionsContainer = document.createElement("div");
  optionsContainer.id = "taxonomy-options";
  optionsContainer.className = "max-h-60 overflow-y-auto";

  menuItems.appendChild(menuHeader);
  menuItems.appendChild(optionsContainer);

  const newMenu = document.createElement("div");
  newMenu.id = "context-menu";
  newMenu.className = "fixed hidden bg-white rounded-lg shadow-lg z-50 py-2 min-w-[200px] border border-gray-200";
  newMenu.appendChild(menuItems);
  document.body.appendChild(newMenu);

  console.log("%c[DOCCANO] Alpine.js context menu created", "color: #8b5cf6;");
  return newMenu;
}

// Helper function to position and show the menu
// Alpine.js Integration: Uses manual positioning
function positionAndShowMenu(menu, event) {
  try {
    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Show menu with CSS
    menu.style.display = "block";
    menu.style.opacity = "1";
    menu.style.visibility = "visible";
    menu.style.position = "absolute";

    // Position manually
    menu.style.left = (event.pageX) + "px";
    menu.style.top = (event.pageY) + "px";
    menu.style.zIndex = "1000";

    console.log(
      "%c[DOCCANO] Alpine.js context menu positioned at:",
      "color: #8b5cf6;",
      {
        left: menu.style.left,
        top: menu.style.top,
        selection: window.getSelection().toString(),
      }
    );
  } catch (error) {
    console.error(
      "%c[DOCCANO] Error showing Alpine.js context menu:",
      "color: #ef4444;",
      error
    );
  }
}

// Function to show context menu
// Alpine.js Integration: Event delegation, dynamic option creation, visibility management
function showContextMenu(event, taxonomies) {
  try {
    if (!event) {
      console.error(
        "%c[DOCCANO] No event provided to showContextMenu",
        "color: #ef4444;"
      );
      return;
    }

    console.log(
      "%c[DOCCANO] Showing Alpine.js context menu at:",
      "color: #8b5cf6;",
      event.pageX,
      event.pageY
    );
    console.log(
      "%c[DOCCANO] Taxonomies to show:",
      "color: #10b981;",
      taxonomies
    );

    let menu = document.getElementById("context-menu");
    if (!menu) {
      menu = createContextMenu();
    }

    const optionsContainer = menu.querySelector("#taxonomy-options");
    if (!optionsContainer) {
      console.warn(
        "%c[DOCCANO] Options container not found, recreating menu",
        "color: #f59e0b;"
      );
      menu.remove();
      menu = createContextMenu();
      optionsContainer = menu.querySelector("#taxonomy-options");
    }

    // Clear previous options
    optionsContainer.innerHTML = "";

    // Handle empty taxonomies
    if (
      !taxonomies ||
      !Array.isArray(taxonomies) ||
      taxonomies.length === 0
    ) {
      console.warn(
        "%c[DOCCANO] No valid taxonomies provided",
        "color: #f59e0b;"
      );
      const noItems = document.createElement("div");
      noItems.className = "px-4 py-2 text-sm text-gray-500";
      noItems.textContent = "No taxonomies available";
      optionsContainer.appendChild(noItems);

      positionAndShowMenu(menu, event);
      return;
    }

    console.log(
      "%c[DOCCANO] Adding %d taxonomy options with Alpine.js",
      "color: #8b5cf6;",
      taxonomies.length
    );

    taxonomies.forEach(function (taxonomy, index) {
      try {
        if (!taxonomy || !taxonomy.key) {
          console.warn(
            "%c[DOCCANO] Invalid taxonomy item at index %d:",
            "color: #f59e0b;",
            index,
            taxonomy
          );
          return;
        }

        // Get or create color scheme
        if (!highlighterState.taxonomyColorMap.has(taxonomy.key)) {
          const colorIndex =
            highlighterState.taxonomyColorMap.size %
            highlighterState.colorSchemes.length;
          highlighterState.taxonomyColorMap.set(
            taxonomy.key,
            highlighterState.colorSchemes[colorIndex]
          );
        }

        const colorScheme = highlighterState.taxonomyColorMap.get(taxonomy.key);

        // Create option with Alpine.js
        const option = document.createElement("div");
        option.className = `px-4 py-2 text-sm cursor-pointer hover:opacity-90 flex items-center rounded ${colorScheme.text} ${colorScheme.bg}`;

        const colorIndicator = document.createElement("span");
        colorIndicator.className = `w-3 h-3 rounded-full mr-2 ${colorScheme.bg}`;
        option.appendChild(colorIndicator);

        const textNode = document.createElement("span");
        textNode.textContent = taxonomy.displayName || taxonomy.key;
        option.appendChild(textNode);

        // Add click handler
        option.addEventListener("click", function () {
          console.log(
            "%c[DOCCANO] Selected taxonomy:",
            "color: #10b981;",
            taxonomy.key
          );
          highlightSelection(taxonomy.key); // Assume this function exists
          console.log(
            "%c[DOCCANO] Highlight selection initiated for:",
            "color: #8b5cf6;",
            taxonomy.key
          );

          // Hide menu
          menu.style.display = "none";
        });

        optionsContainer.appendChild(option);
      } catch (error) {
        console.error(
          "%c[DOCCANO] Error creating taxonomy option:",
          "color: #ef4444;",
          error,
          taxonomy
        );
      }
    });

    // Position and show
    positionAndShowMenu(menu, event);

    // Outside click handler (Alpine.js approach)
    const handleOutsideClick = function(e) {
      if (menu && !menu.contains(e.target)) {
        menu.style.display = "none";
        document.removeEventListener('click', handleOutsideClick);
      }
    };
    document.addEventListener('click', handleOutsideClick);
  } catch (error) {
    console.error(
      "%c[DOCCANO] Error in Alpine.js showContextMenu:",
      "color: #ef4444;",
      error
    );
  }
}

// =====================================================
// SECTION 3: POPUP AND POSITIONING FUNCTIONS (Alpine.js)
// =====================================================
// Alpine.js Benefits: Manual positioning, reactivity.

// Function to update popup position based on selection
// Alpine.js Integration: Uses manual positioning
function updatePopupPosition(popup, selection) {
  if (!popup || !selection || selection.rangeCount === 0) {
    console.warn(
      "%c[DOCCANO] Invalid arguments to Alpine.js updatePopupPosition",
      "color: #f59e0b;",
      { popup: popup, selection: selection }
    );
    return;
  }

  try {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position manually (similar to jQuery .position)
    popup.style.left = (rect.left) + "px";
    popup.style.top = (rect.top - 30) + "px"; // Above selection
  } catch (error) {
    console.error(
      "%c[DOCCANO] Error updating Alpine.js popup position:",
      "color: #ef4444;",
      error
    );
  }
}

// Function to show assignment popup
// Alpine.js Integration: Dynamic creation, visibility management, event delegation
function showAssignmentPopup(selection, event) {
  try {
    if (!selection || !event) {
      console.error(
        "%c[DOCCANO] Invalid arguments to Alpine.js showAssignmentPopup",
        "color: #ef4444;",
        { selection, event }
      );
      return;
    }

    console.log(
      "%c[DOCCANO] Alpine.js showAssignmentPopup called",
      "color: #8b5cf6;",
      { selection, event }
    );

    // Remove existing popups
    const existingPopups = document.querySelectorAll(".assignment-popup");
    existingPopups.forEach(popup => popup.remove());

    // Create popup
    const popup = document.createElement("div");
    popup.id = "assignment-popup";
    popup.className = "assignment-popup fixed bg-white p-3 rounded-lg shadow-lg z-[1001] min-w-[200px] max-w-[300px] border border-gray-200";
    popup.style.display = "block";
    popup.style.visibility = "visible";
    popup.style.opacity = "1";
    popup.style.left = event.clientX + "px";
    popup.style.top = Math.max(100, event.clientY - 100) + "px";
    document.body.appendChild(popup);

    // Add header
    const header = document.createElement("div");
    header.className = "text-sm font-medium mb-2 text-gray-700";
    header.textContent = "Select a category";
    popup.appendChild(header);

    // Store selection state
    highlighterState.currentSelection = window.getSelection();
    if (highlighterState.currentSelection.rangeCount > 0) {
      highlighterState.currentRange =
        highlighterState.currentSelection.getRangeAt(0);
    }

    // Add taxonomy buttons
    const taxonomies = Array.from(highlighterState.taxonomyColorMap.entries());
    if (taxonomies.length > 0) {
      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "flex flex-col gap-1 max-h-60 overflow-y-auto";

      taxonomies.forEach(function ([taxonomyKey]) {
        const taxonomyIndex = Array.from(
          highlighterState.taxonomyColorMap.keys()
        ).indexOf(taxonomyKey);
        const colorScheme =
          highlighterState.colorSchemes[
            taxonomyIndex % highlighterState.colorSchemes.length
          ];

        let displayName = taxonomyKey
          .replace(/_/g, " ")
          .replace(/\b\w/g, function (char) {
            return char.toUpperCase();
          });

        const btn = document.createElement("button");
        btn.className = "text-left px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors flex items-center";
        
        const colorIndicator = document.createElement("span");
        colorIndicator.className = `w-3 h-3 rounded-full mr-2 border ${colorScheme.bg} ${colorScheme.border}`;
        btn.appendChild(colorIndicator);

        const textNode = document.createTextNode(displayName);
        btn.appendChild(textNode);

        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();

          popup.style.display = "none";
          popup.remove();

          // Clear selection and highlight
          if (highlighterState.currentRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(highlighterState.currentRange);
            highlightSelection(taxonomyKey); // Assume this exists
            sel.removeAllRanges();
          }

          highlighterState.currentSelection = null;
          highlighterState.currentRange = null;
        });

        buttonsContainer.appendChild(btn);
      });

      popup.appendChild(buttonsContainer);
    } else {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "text-sm text-gray-500 italic py-2";
      emptyMessage.textContent = "No categories available";
      popup.appendChild(emptyMessage);
    }

    // Update position
    updatePopupPosition(popup, selection);

    // Outside click handler
    const handleOutsideClick = function(e) {
      if (!popup.contains(e.target)) {
        popup.style.display = "none";
        popup.remove();
        document.removeEventListener('click', handleOutsideClick);
      }
    };
    document.addEventListener('click', handleOutsideClick);

    return popup;
  } catch (error) {
    console.error(
      "%c[DOCCANO] Error in Alpine.js showAssignmentPopup:",
      "color: #ef4444;",
      error
    );
    return null;
  }
}

// =====================================================
// SECTION 4: HIGHLIGHTER INITIALIZATION AND CORE LOGIC (Alpine.js)
// =====================================================
// Alpine.js Integration: Waits for 'appContentReady', uses DOM for data loading/UI setup.

// Async function to initialize the document (main entry point)
// Alpine.js Integration: Listens for app.js 'appContentReady', uses DOM for setup
function initializeDocument() {
  console.log(
    "%c[DOCCANO] Alpine.js initializeDocument called",
    "color: #8b5cf6;"
  );

  try {
    // Assume loadNDJSONData, processDocuments exist or are placeholders
    // For demo: Simulate data
    const rawDocuments = []; // await loadNDJSONData();
    const { sections, documents } = { sections: {}, documents: [] }; // processDocuments(rawDocuments);

    console.log(
      "%c[DOCCANO] Processed %d documents",
      "color: #8b5cf6;",
      documents.length
    );

    // Hide loading
    const sectionsLoading = document.getElementById("sections-loading");
    if (sectionsLoading) {
      sectionsLoading.style.display = "none";
    }

    if (Object.keys(sections).length === 0) {
      const documentSections = document.getElementById("document-sections");
      if (documentSections) {
        documentSections.innerHTML =
          '<div class="text-center py-4 text-eu-blue/70">No document sections found.</div>';
      }
      return;
    }

    // Populate sections
    documents.forEach(function (doc) {
      populateSection(doc);
    });

    // Process taxonomy data
    const taxonomyData = []; // processTaxonomyData(documents);
    renderTaxonomy(taxonomyData); // Assume this exists

    // Store in window
    if (!window.doccano) window.doccano = {};
    window.doccano.taxonomyData = taxonomyData;

    // Initialize highlighter
    initializeHighlighter();

    // Update latest doc info
    const latestDoc = documents.sort(function (a, b) {
      return new Date(b._ts) - new Date(a._ts);
    })[0];
    if (latestDoc) {
      populateDocumentInfo(latestDoc);

      if (latestDoc.annotations) {
        const length = latestDoc.annotations.length || 0;
        const words = latestDoc.annotations.words || 0;
        const documentLength = document.querySelector(".document-length");
        if (documentLength) {
          documentLength.textContent = length + " characters • " + words + " words";
        }
      }
    }

    // Dispatch event
    document.dispatchEvent(
      new CustomEvent("documentsUpdated", {
        detail: { documents: rawDocuments },
      })
    );

    // Setup tooltips and listeners
    initializeTooltips();
    setupEventListeners();

    // Open first section
    const firstSection = document.querySelector('.document-section:not([data-section-id="template"])');
    if (firstSection) {
      const trigger = firstSection.querySelector(".section-trigger");
      if (trigger) {
        trigger.click();
      }
    }
  } catch (error) {
    console.error(
      "%c[DOCCANO] Error initializing Alpine.js document:",
      "color: #ef4444; font-weight: bold;",
      error
    );
    const sectionsLoading = document.getElementById("sections-loading");
    if (sectionsLoading) {
      sectionsLoading.innerHTML =
        '<div class="text-center py-4 text-eu-orange">Error loading document. Please try again later.</div>';
    }
  }
}

// Function to initialize highlighter
// Alpine.js Integration: Uses DOM selectors for taxonomy mapping
function initializeHighlighter() {
  console.log(
    "%c[DOCCANO] Initializing Alpine.js highlighter",
    "color: #8b5cf6;"
  );

  createContextMenu(); // Ensure menu exists

  highlighterState.taxonomyColorMap.clear();

  // Map from window data
  if (window.doccano?.taxonomyData?.length > 0) {
    window.doccano.taxonomyData.forEach(function (taxonomy, index) {
      const colorScheme =
        highlighterState.colorSchemes[
          index % highlighterState.colorSchemes.length
        ];
      highlighterState.taxonomyColorMap.set(taxonomy.key, colorScheme);

      // Update DOM elements
      const elements = document.querySelectorAll(`[data-taxonomy="${taxonomy.key}"]`);
      elements.forEach(el => {
        el.classList.add(colorScheme.bg);
      });
    });
  }

  // Fallback from DOM
  const elements = document.querySelectorAll("[data-taxonomy]");
  elements.forEach(function (el, index) {
    const taxonomy = el.getAttribute("data-taxonomy");
    if (!highlighterState.taxonomyColorMap.has(taxonomy)) {
      const colorIndex = highlighterState.taxonomyColorMap.size + index;
      const colorScheme =
        highlighterState.colorSchemes[
          colorIndex % highlighterState.colorSchemes.length
        ];
      highlighterState.taxonomyColorMap.set(taxonomy, colorScheme);
      el.classList.add(colorScheme.bg);
    }
  });

  console.log(
    "%c[DOCCANO] Alpine.js highlighter initialized with %d taxonomies",
    "color: #8b5cf6;",
    highlighterState.taxonomyColorMap.size
  );
}

// Placeholder for highlightSelection (implement as needed)
function highlightSelection(taxonomyKey) {
  console.log(
    "%c[DOCCANO] Highlighting selection with taxonomy: %s",
    "color: #8b5cf6;",
    taxonomyKey
  );
  // Implementation: Wrap selection in span with color classes
  const colorScheme = highlighterState.taxonomyColorMap.get(taxonomyKey);
  if (highlighterState.currentRange && colorScheme) {
    const span = document.createElement("span");
    span.className =
      colorScheme.highlight + " " + colorScheme.highlightBorder;
    span.dataset.taxonomy = taxonomyKey;
    highlighterState.currentRange.surroundContents(span);
  }
}

// =====================================================
// SECTION 5: DOCUMENT POPULATION AND UI FUNCTIONS (Alpine.js)
// =====================================================
// Alpine.js Benefits: Reactivity, DOM manipulation, event delegation.

// Function to create a collapsed section icon
// Alpine.js Integration: Uses DOM for creation and event binding
function createCollapsedSectionIcon(sectionData) {
  const icon = document.createElement("div");
  icon.className = "relative group w-full flex justify-center py-2 hover:bg-eu-blue/10 transition-colors cursor-pointer";
  icon.setAttribute("data-section-id", sectionData.id);
  icon.setAttribute("title", sectionData.enrichment.title || "Section");

  const iconClass =
    (sectionData.icon || "fas fa-file-alt") + " text-eu-blue text-lg";
  const iconElement = document.createElement("i");
  iconElement.className = iconClass;

  const tooltip = document.createElement("div");
  tooltip.className = "absolute left-full ml-2 px-2 py-1 bg-eu-blue text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50";
  tooltip.textContent = sectionData.enrichment.title || "Section";
  
  icon.appendChild(iconElement);
  icon.appendChild(tooltip);

  // Click handler
  icon.addEventListener("click", function () {
    const section = document.querySelector(`[data-section-id="${sectionData.id}"]`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      section.style.backgroundColor = "rgba(0, 48, 135, 0.1)";
      setTimeout(function () {
        section.style.backgroundColor = "";
      }, 1500);
    }
  });

  return icon;
}

// Populate a section in the left column
// Alpine.js Integration: Cloning, manipulation, visibility management
function populateSection(data) {
  if (!data.enrichment) return;

  const template = document.querySelector('.document-section[data-section-id="template"]');
  if (!template) return;
  
  const clone = template.cloneNode(true);
  clone.setAttribute("data-section-id", data.id);
  clone.style.display = "block"; // Remove hidden class

  const titleElement = clone.querySelector(".section-title");
  if (titleElement) {
    titleElement.textContent = data.enrichment.title || "Untitled Section";
  }

  const summaryElement = clone.querySelector(".section-summary");
  if (summaryElement) {
    summaryElement.textContent = data.enrichment.summary || "No summary available.";
  }

  const keywordsElement = clone.querySelector(".section-keywords");
  if (keywordsElement) {
    const keywordsHtml = (data.enrichment.keywords || [])
      .map(function (keyword) {
        return (
          '<span class="px-2 py-0.5 bg-eu-orange/20 text-eu-blue text-xs rounded-full">' +
          keyword +
          "</span>"
        );
      })
      .join("");
    keywordsElement.innerHTML = keywordsHtml;
  }

  // Append to sections container
  const sectionsContainer = document.getElementById("document-sections");
  if (sectionsContainer) {
    sectionsContainer.appendChild(clone);
  }

  // Add to collapsed view
  const collapsedSections = document.getElementById("collapsed-sections");
  if (collapsedSections) {
    const icon = createCollapsedSectionIcon(data);
    collapsedSections.appendChild(icon);
  }

  // Setup click handler
  const trigger = clone.querySelector(".section-trigger");
  if (trigger) {
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      const content = trigger.nextElementSibling;
      const icon = trigger.querySelector("i");
      
      // Close others
      const allContent = document.querySelectorAll(".section-content");
      allContent.forEach(el => {
        if (el !== content) {
          el.style.display = "none";
          el.classList.add("hidden");
        }
      });
      
      const allIcons = document.querySelectorAll(".section-trigger i");
      allIcons.forEach(el => {
        if (el !== icon) {
          el.classList.remove("fa-chevron-up");
          el.classList.add("fa-chevron-down");
        }
      });

      // Toggle current
      if (content.style.display === "none" || content.classList.contains("hidden")) {
        content.style.display = "block";
        content.classList.remove("hidden");
        icon.classList.remove("fa-chevron-down");
        icon.classList.add("fa-chevron-up");
      } else {
        content.style.display = "none";
        content.classList.add("hidden");
        icon.classList.remove("fa-chevron-up");
        icon.classList.add("fa-chevron-down");
      }
    });
  }
}

// Update the populateDocumentInfo function
// Alpine.js Integration: Uses DOM selectors and class manipulation
function populateDocumentInfo(data) {
  console.log(
    "%c[DOCCANO] Alpine.js populateDocumentInfo called",
    "color: #8b5cf6;",
    data
  );

  if (!data) {
    console.error(
      "%c[DOCCANO] No data provided to populateDocumentInfo",
      "color: #ef4444;"
    );
    return;
  }

  // Update titles
  const documentTitle = document.querySelector(".document-title");
  if (documentTitle) {
    documentTitle.textContent =
      data.doc ? data.doc.split("_").join(" ") : "Untitled Document";
  }

  // Update dates
  const documentUpdated = document.querySelector(".document-updated");
  if (documentUpdated) {
    documentUpdated.textContent = data._ts ? formatDate(data._ts) : "";
  }

  // Update models
  const documentModel = document.querySelector(".document-model");
  if (documentModel) {
    documentModel.textContent = data.enrichment?._model || "";
  }

  // Update lengths
  if (data.annotations) {
    const length = data.annotations.length || 0;
    const words = data.annotations.words || 0;
    const documentLength = document.querySelector(".document-length");
    if (documentLength) {
      documentLength.textContent = length + " characters • " + words + " words";
    }
  }

  // Update confidence with color coding
  if (data.enrichment?.confidence) {
    const confidence = Math.round(data.enrichment.confidence * 100);
    const confidenceValue = document.querySelector(".confidence-value");
    if (confidenceValue) {
      confidenceValue.textContent = confidence;
      confidenceValue.classList.remove("text-eu-orange text-yellow-500 text-green-600");
      if (confidence < 50) {
        confidenceValue.classList.add("text-eu-orange");
      } else if (confidence < 80) {
        confidenceValue.classList.add("text-yellow-500");
      } else {
        confidenceValue.classList.add("text-green-600");
      }
    }
  }

  console.log("%c[DOCCANO] Alpine.js document info updated", "color: #8b5cf6;");
}

// Keep the formatDate function (unchanged)
function formatDate(dateString) {
  if (!dateString) return "Unknown date";
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    console.error("%c[DOCCANO] Error formatting date:", "color: #ef4444;", e);
    return "Invalid date";
  }
}

// Initialize tooltips with Alpine.js
function initializeTooltips() {
  const tooltips = document.querySelectorAll("[data-tooltip]");
  tooltips.forEach(function (el) {
    const tooltipText = el.getAttribute("data-tooltip");
    if (tooltipText) {
      el.setAttribute("title", tooltipText);
    }
  });

  // Add styles if not present
  if (!document.querySelector("style[data-tooltip-styles]")) {
    const style = document.createElement("style");
    style.setAttribute("data-tooltip-styles", "");
    style.textContent = `
      [data-tooltip] { position: relative; cursor: help; }
      [data-tooltip]:hover::after { content: attr(data-tooltip); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #003087; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; z-index: 1000; pointer-events: none; opacity: 0; transition: opacity 0.2s; }
      [data-tooltip]:hover::after { opacity: 1; }
    `;
    document.head.appendChild(style);
  }
}

// Set up event listeners with Alpine.js
function setupEventListeners() {
  console.log(
    "%c[DOCCANO] Setting up Alpine.js event listeners",
    "color: #8b5cf6;"
  );

  initializeTooltips();

  // Document Info Modal with Alpine.js
  const documentInfoIcon = document.getElementById("document-info-icon");
  const documentInfoModal = document.getElementById("document-info-modal");
  const closeDocumentInfo = document.getElementById("close-document-info");

  if (documentInfoIcon && documentInfoModal) {
    documentInfoIcon.addEventListener("click", function (e) {
      e.stopPropagation();
      documentInfoModal.classList.toggle("hidden");
    });

    closeDocumentInfo.addEventListener("click", function (e) {
      e.stopPropagation();
      documentInfoModal.classList.add("hidden");
    });

    document.addEventListener("click", function (e) {
      if (
        !documentInfoModal.contains(e.target) &&
        e.target !== documentInfoIcon
      ) {
        documentInfoModal.classList.add("hidden");
      }
    });
  }
}

// =====================================================
// SECTION 6: EVENT LISTENERS AND INITIALIZATION (Alpine.js)
// =====================================================
// Alpine.js Integration: Listens for app.js events, uses addEventListener for text selection.

// Wait for app.js 'appContentReady' before initializing
document.addEventListener("appContentReady", function (e) {
  console.log(
    "%c[DOCCANO] App.js ready - starting Alpine.js initialization",
    "color: #8b5cf6;",
    e.detail
  );

  // Setup text selection handlers
  document.addEventListener("mouseup", handleTextSelection); // Assume handleTextSelection exists
  document.addEventListener("select", handleTextSelection);
  document.addEventListener("dblclick", handleTextSelection);

  // Prevent default context menu on selection
  document.addEventListener("contextmenu", function (e) {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      e.preventDefault();
    }
  });

  // Start main initialization
  initializeDocument();

  // Listen for app.js column changes
  document.addEventListener("columnStateChanged", function (e) {
    console.log(
      "%c[DOCCANO] Column state changed: %s %s",
      "color: #8b5cf6;",
      e.detail.column,
      e.detail.collapsed ? "collapsed" : "expanded"
    );
    if (e.detail.column === "left-column" && e.detail.collapsed) {
      const sections = document.getElementById("document-sections");
      if (sections) {
        sections.style.display = "none";
      }
    }
  });

  // Listen for tab switches
  document.addEventListener("tabSwitched", function (e) {
    if (e.detail.tab === "annotations") {
      console.log("Doccano: Switched to annotations tab");
      // Alpine.js: For now, we'll leave the element handling to doccano.js
      // as it's likely using Alpine.js components for that part
    }
  });
});

// Placeholder for handleTextSelection (implement based on needs)
function handleTextSelection(e) {
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed) {
    // Show context menu or popup
    const taxonomies = Array.from(highlighterState.taxonomyColorMap.keys()).map(
      function (key) {
        return { key: key, displayName: key };
      }
    );
    showContextMenu(e, taxonomies);
  }
}

// Cleanup on unload
window.addEventListener("beforeunload", function () {
  console.log(
    "%c[DOCCANO] Alpine.js event handlers cleaned up",
    "color: #f59e0b;"
  );
});

console.log(
  "%c[DOCCANO] Alpine.js module loaded and ready for app.js signal",
  "color: #10b981; font-weight: bold;"
);
