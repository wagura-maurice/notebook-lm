// js/doccano.js

// Create a namespace for our application
(function () {
  "use strict";

  // Enhanced color palette with maximum perceptual difference
  // Colors are organized by hue for maximum distinction
  const colorPalette = [
    // Primary colors (0-120° hue)
    { name: "vivid-red", hex: "#FF3B30" }, // Bright red
    { name: "vivid-orange", hex: "#FF9500" }, // Vivid orange
    { name: "vivid-yellow", hex: "#FFCC00" }, // Vivid yellow
    { name: "vivid-green", hex: "#34C759" }, // Vivid green
    { name: "vivid-cyan", hex: "#00C7BE" }, // Vivid cyan
    { name: "vivid-blue", hex: "#007AFF" }, // Vivid blue

    // Secondary colors (120-240° hue)
    { name: "vivid-indigo", hex: "#5856D6" }, // Vivid indigo
    { name: "vivid-violet", hex: "#AF52DE" }, // Vivid violet
    { name: "vivid-purple", hex: "#FF2D55" }, // Vivid purple
    { name: "vivid-magenta", hex: "#FF2D55" }, // Vivid magenta
    { name: "vivid-pink", hex: "#FF375F" }, // Vivid pink

    // Tertiary colors (240-360° hue)
    { name: "deep-sky-blue", hex: "#007AFF" }, // Deep sky blue
    { name: "spring-green", hex: "#00E5A1" }, // Spring green
    { name: "electric-lime", hex: "#CDDC39" }, // Electric lime
    { name: "amber", hex: "#FFC107" }, // Amber
    { name: "deep-orange", hex: "#FF7043" }, // Deep orange
    { name: "bright-red", hex: "#FF3B30" }, // Bright red

    // Additional distinct colors with varied saturation and lightness
    { name: "emerald", hex: "#2ECC71" }, // Emerald
    { name: "peter-river", hex: "#3498DB" }, // Peter river
    { name: "amethyst", hex: "#9B59B6" }, // Amethyst
    { name: "sun-flower", hex: "#F1C40F" }, // Sun flower
    { name: "carrot", hex: "#E67E22" }, // Carrot
    { name: "alizarin", hex: "#E74C3C" }, // Alizarin
    { name: "turquoise", hex: "#1ABC9C" }, // Turquoise
    { name: "peter-river", hex: "#3498DB" }, // Peter river
    { name: "wisteria", hex: "#8E44AD" }, // Wisteria
    { name: "midnight-blue", hex: "#2C3E50" }, // Midnight blue
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
        hex: adjustShade(baseColor.hex, shadeVariant * 50),
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
      .split("_")
      .map((word) => word[0]?.toUpperCase() || "")
      .join("")
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
                name: category
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase()),
                prefix: getPrefix(category),
                color: stringToColor(category),
                count: 0,
              };
            }
            // Increment count for each document that has this category
            taxonomyMap[key].count++;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse line:", line, e);
    }
    return taxonomyMap;
  }

  function transformNdjsonToTaxonomies(ndjson) {
    const lines = ndjson.split("\n").filter((line) => line.trim());
    const taxonomyMap = {};

    lines.forEach((line) => {
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
      console.error("Error fetching or processing taxonomies:", error);
      return []; // Return empty array in case of error
    }
  }

  // Helper function to convert hex to rgba
  function hexToRgba(hex, alpha = 1) {
    // Remove # if present
    hex = hex.replace("#", "");

    // Parse r, g, b values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Only create the app if it doesn't exist
  if (window.DoccanoApp) {
    console.warn("DoccanoApp is already defined");
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
    if (!element || typeof element.closest !== "function") {
      // If it's a text node, try to use its parent element
      if (element && element.parentElement) {
        element = element.parentElement;
      } else {
        return null;
      }
    }

    try {
      // Find the closest parent with a line number
      const lineElement = element.closest(".flex.items-start.group");
      if (lineElement) {
        const lineNumberSpan = lineElement.querySelector(
          "span.text-xs.text-gray-400"
        );
        if (lineNumberSpan) {
          return lineNumberSpan.textContent.trim();
        }
      }
    } catch (e) {
      console.error("Error getting line number:", e);
    }
    return null;
  }

  // Undo/Redo stack
  const stateHistory = {
    stack: [],
    currentIndex: -1,
    maxStates: 50,

    pushState: function (html) {
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

      console.log("State saved:", {
        currentIndex: this.currentIndex,
        stackSize: this.stack.length,
        time: new Date().toISOString(),
      });
    },

    updateButtonStates: function () {
      const undoBtn = document.getElementById("undo-btn");
      const redoBtn = document.getElementById("redo-btn");

      if (undoBtn) {
        undoBtn.disabled = this.currentIndex <= 0;
        undoBtn.classList.toggle("opacity-50", this.currentIndex <= 0);
        undoBtn.classList.toggle("cursor-not-allowed", this.currentIndex <= 0);
      }

      if (redoBtn) {
        // Enable redo button if we're not at the latest state
        const atLatestState = this.currentIndex >= this.stack.length - 1;
        redoBtn.disabled = atLatestState;
        redoBtn.classList.toggle("opacity-50", atLatestState);
        redoBtn.classList.toggle("cursor-not-allowed", atLatestState);

        // Debug logging
        console.log("Redo state:", {
          currentIndex: this.currentIndex,
          stackLength: this.stack.length,
          canRedo: !atLatestState,
        });
      }
    },

    // Handle undo action
    undo: function () {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.updateButtonStates();
        return this.stack[this.currentIndex];
      }
      return null;
    },

    // Handle redo action
    redo: function () {
      if (this.currentIndex < this.stack.length - 1) {
        this.currentIndex++;
        this.updateButtonStates();
        return this.stack[this.currentIndex];
      }
      return null;
    },
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
        "./assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson"
      );
      console.log("Taxonomies loaded successfully:", taxonomies);
      taxonomiesLoaded = true;

      // Execute all pending callbacks
      while (taxonomyCallbacks.length) {
        const callback = taxonomyCallbacks.shift();
        if (typeof callback === "function") {
          try {
            callback(taxonomies);
          } catch (err) {
            console.error("Error in taxonomy callback:", err);
          }
        }
      }

      return taxonomies;
    } catch (error) {
      console.error("Failed to load taxonomies:", error);
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
      const docContent = document.getElementById("document-content");
      if (docContent) {
        try {
          const snapshot = JSON.parse(state);

          // Save current scroll position
          const scrollY = window.scrollY;

          // Restore the HTML content
          docContent.innerHTML = snapshot.html;

          // Restore all highlight states
          snapshot.highlights.forEach((hlState) => {
            const highlight = document.getElementById(hlState.id);
            if (highlight) {
              if (hlState.isActive) {
                highlight.classList.add("highlight-active");
              } else {
                highlight.classList.remove("highlight-active");
              }
            }
          });

          // Restore active highlight and scroll to it if it exists
          if (snapshot.currentHighlightId) {
            const activeHighlight = document.getElementById(
              snapshot.currentHighlightId
            );
            if (activeHighlight) {
              activeHighlight.classList.add("highlight-active");
              setTimeout(() => {
                activeHighlight.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }, 100);
            }
          } else {
            // Restore scroll position if no active highlight
            window.scrollTo(0, scrollY);
          }

          initTextSelection();
          console.log("Undo to state:", {
            currentHighlightId: snapshot.currentHighlightId,
            highlights: snapshot.highlights.length,
          });
        } catch (e) {
          console.error("Error during undo:", e);
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
      const docContent = document.getElementById("document-content");
      if (docContent) {
        try {
          const snapshot = JSON.parse(state);

          // Save current scroll position
          const scrollY = window.scrollY;

          // Restore the HTML content
          docContent.innerHTML = snapshot.html;

          // Restore all highlight states
          snapshot.highlights.forEach((hlState) => {
            const highlight = document.getElementById(hlState.id);
            if (highlight) {
              if (hlState.isActive) {
                highlight.classList.add("highlight-active");
              } else {
                highlight.classList.remove("highlight-active");
              }
            }
          });

          // Restore active highlight and scroll to it if it exists
          if (snapshot.currentHighlightId) {
            const activeHighlight = document.getElementById(
              snapshot.currentHighlightId
            );
            if (activeHighlight) {
              activeHighlight.classList.add("highlight-active");
              setTimeout(() => {
                activeHighlight.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }, 100);
            }
          } else {
            // Restore scroll position if no active highlight
            window.scrollTo(0, scrollY);
          }

          initTextSelection();
          console.log("Redo to state:", {
            currentHighlightId: snapshot.currentHighlightId,
            highlights: snapshot.highlights.length,
          });
        } catch (e) {
          console.error("Error during redo:", e);
          // Fallback for old format states
          docContent.innerHTML = state;
          initTextSelection();
        }
      }
    }
  }

  // Save current document state with line information
  function saveState() {
    const docContent = document.getElementById("document-content");
    if (docContent) {
      // Get the currently active highlight
      const activeHighlight = document.querySelector(
        ".taxonomy-highlight.highlight-active"
      );

      // Create a snapshot of the current state with line numbers
      const snapshot = {
        html: docContent.innerHTML,
        highlights: [],
        timestamp: new Date().toISOString(),
        currentHighlightId: activeHighlight ? activeHighlight.id : null,
      };

      // Store information about each highlight with their positions
      document.querySelectorAll(".taxonomy-highlight").forEach((hl) => {
        snapshot.highlights.push({
          id: hl.id,
          text: hl.textContent,
          lineNumber: hl.dataset.lineNumber || "",
          taxonomyId: hl.dataset.taxonomyId || "",
          isActive: hl.classList.contains("highlight-active"),
        });
      });

      // Save the state to history
      stateHistory.pushState(JSON.stringify(snapshot));

      console.log("State saved:", {
        currentHighlightId: snapshot.currentHighlightId,
        highlights: snapshot.highlights.length,
      });

      return snapshot;
    }
    return null;
  }

  // Set up all event listeners
  function setupEventListeners() {
    // Add event listeners for undo/redo buttons if they exist
    const undoBtn = document.getElementById("undo-btn");
    const redoBtn = document.getElementById("redo-btn");
    const saveBtn = document.getElementById("save-btn");

    if (undoBtn) {
      undoBtn.addEventListener("click", handleUndo);
    }

    if (redoBtn) {
      redoBtn.addEventListener("click", handleRedo);
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", handleSaveWithExport);
    }
  }

  /**
   * Fetches and processes the document content from NDJSON file
   * @returns {Promise<string>} HTML content string
   */
  async function fetchDocumentContent() {
    try {
      console.log("Fetching document content from NDJSON...");
      const response = await fetch(
        "./assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      const lines = text.trim().split("\n");

      // Process each line as a separate JSON object
      const items = lines
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch (e) {
            console.error("Error parsing NDJSON line:", e);
            return null;
          }
        })
        .filter((item) => item !== null);

      // Group items by their section title
      const sections = [];
      let currentSection = null;

      items.forEach((item, index) => {
        const sectionTitle =
          item.enrichment?.title || `Section ${sections.length + 1}`;

        // If this is a new section or the first item
        if (!currentSection || currentSection.title !== sectionTitle) {
          // Save the previous section if it exists
          if (currentSection) {
            sections.push({ ...currentSection });
          }

          // Start a new section
          currentSection = {
            title: sectionTitle,
            items: [],
          };
        }

        // Add the item to the current section
        currentSection.items.push(item);
      });

      // Add the last section
      if (currentSection && currentSection.items.length > 0) {
        sections.push(currentSection);
      }

      // Function to highlight taxonomy terms in text to match manual highlighting style
      function highlightTaxonomyTerms(text, taxonomy, idPrefix = "auto-") {
        if (!taxonomy) return text;

        // Create a map of terms to their taxonomy categories and colors
        const termMap = new Map();

        // Add terms from each taxonomy category
        Object.entries(taxonomy).forEach(([category, terms]) => {
          // Get or create color for this category using the same logic as in processLine
          let colorInfo = null;
          let hexColor = null;

          // Try to get the color from the global taxonomy map if it exists
          if (
            window.processedTaxonomyMap &&
            window.processedTaxonomyMap[category.toLowerCase()]
          ) {
            colorInfo = window.processedTaxonomyMap[category.toLowerCase()];
          } else {
            // If not found, generate a new color using stringToColor
            const colorObj = stringToColor(category);
            hexColor = typeof colorObj === "object" ? colorObj.hex : colorObj;

            // Store in global map for consistency
            if (!window.processedTaxonomyMap) window.processedTaxonomyMap = {};
            window.processedTaxonomyMap[category.toLowerCase()] = {
              hex: hexColor,
              category: category,
            };
          }

          // If we have a hex color, create the highlight style
          if (hexColor) {
            colorInfo = {
              bg: hexColor,
              text: "text-white",
              highlight: hexColor,
              highlightBorder: hexColor,
              textColor: "text-white",
            };
          }
          if (Array.isArray(terms)) {
            terms.forEach((term) => {
              if (term && typeof term === "string") {
                const cleanTerm = term.trim().toLowerCase();
                if (cleanTerm) {
                  termMap.set(cleanTerm, {
                    category,
                    colorScheme: colorInfo,
                  });

                  // Add variations for better matching
                  if (cleanTerm.endsWith("s")) {
                    const singular = cleanTerm.slice(0, -1);
                    if (singular) {
                      termMap.set(singular, {
                        category,
                        colorScheme: colorInfo,
                      });
                    }
                  } else {
                    termMap.set(cleanTerm + "s", {
                      category,
                      colorScheme: colorInfo,
                    });
                  }
                }
              }
            });
          }
        });

        if (termMap.size === 0) return text;

        // Create a regex pattern to match any of the terms
        const pattern = new RegExp(
          `\\b(${Array.from(termMap.keys())
            .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|")})\\b`,
          "gi"
        );

        // Generate a unique ID for this highlight
        const highlightId = `${idPrefix}${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Replace each match with a highlighted span
        return text.replace(pattern, (match) => {
          const termInfo = termMap.get(match.toLowerCase());
          if (!termInfo) return match;

          const { category, colorScheme } = termInfo;
          const displayName = category
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          // Get the color from the global taxonomy map
          const taxonomyInfo =
            window.processedTaxonomyMap &&
            window.processedTaxonomyMap[category.toLowerCase()];
          const highlightColor = taxonomyInfo?.hex || "#3b82f6"; // Default to blue if not found
          const highlightId = `taxonomy-${category
            .toLowerCase()
            .replace(/\s+/g, "-")}-${Date.now()}`;

          // Format the display name for the tooltip
          const formattedDisplayName = displayName
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");

          // Create a highlight with consistent styling and dynamic color application
          const rgbaColor = hexToRgba(highlightColor, 0.125);
          const borderColor = hexToRgba(highlightColor, 0.5);
          
          return `
            <span 
              class="taxonomy-highlight"
              id="${highlightId}"
              data-taxonomy-id="${category.toLowerCase().replace(/\s+/g, "_")}"
              data-original-text="${match}"
              style="
                background-color: ${rgbaColor};
                color: ${highlightColor};
                border-bottom: 2px solid ${borderColor};
              "
            >
              ${match}
              <span class="taxonomy-tooltip">
                <span 
                  class="taxonomy-tooltip-dot" 
                  style="background-color: ${highlightColor}">
                </span>
                ${formattedDisplayName}
              </span>
            </span>`;
        });
      }

      // Generate HTML from the sections
      let html = "";
      let lineNumber = 1;

      sections.forEach((section) => {
        if (section.items.length === 0) return;

        // Add section header
        html += `
            <div class="mb-6">
                <div class="space-y-1">
                    <div class="text-sm font-semibold text-eu-blue mt-2 mb-1">${section.title}</div>`;

        // Add section items (paragraphs)
        section.items.forEach((item) => {
          const lineStr = lineNumber.toString().padStart(3, "0");
          let text = item.text || "";

          // Highlight taxonomy terms in the text if taxonomy data exists
          if (item.enrichment?.taxonomy) {
            text = highlightTaxonomyTerms(text, item.enrichment.taxonomy);
          }

          // Check if this is a table of contents or special section
          if (
            item.structure_type === "table_of_contents" ||
            item.text?.includes("|") ||
            item.header?.includes("Table of Contents")
          ) {
            // Format as a table row
            const [left, right = ""] = text.split("|").map((s) => s.trim());
            html += `
                    <div class="flex items-start group mb-1">
                        <span class="text-xs text-gray-400 w-8 flex-shrink-0 mt-0.5">${lineStr}</span>
                        <div class="flex-1">
                            <div class="flex border-b border-gray-100 py-1">
                                <div class="px-2 flex-1 text-sm">${left}</div>
                                ${
                                  right
                                    ? `<div class="px-2 flex-1 text-sm">${right} |</div>`
                                    : ""
                                }
                            </div>
                        </div>
                    </div>`;
          } else {
            // Format as a regular paragraph with potentially highlighted text
            html += `
                    <div class="flex items-start group mb-1">
                        <span class="text-xs text-gray-400 w-8 flex-shrink-0 mt-0.5">${lineStr}</span>
                        <div class="flex-1">
                            <p class="text-sm text-gray-800 mb-2">${text}</p>
                        </div>
                    </div>`;
          }

          lineNumber++;
        });

        html += `
                </div>
            </div>`;
      });

      return html;
    } catch (error) {
      console.error("Error fetching document content:", error);
      throw error;
    }
  }

  // Load document content from NDJSON file
  async function loadDocumentContent() {
    const targetElement = document.getElementById("document-content");
    if (!targetElement) return;

    // Show loading state
    targetElement.innerHTML = `
        <div class="flex justify-center items-center h-full">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-eu-orange"></div>
        </div>`;

    try {
      // Fetch and render the document content
      const content = await fetchDocumentContent();
      targetElement.innerHTML = content;

      console.log("Document content loaded successfully");

      // Re-initialize text selection for the new content
      initTextSelection();

      // Save the initial state for undo/redo
      saveState();
    } catch (error) {
      console.error("Error loading document content:", error);

      // Fallback content in case of error
      const fallbackContent = `
            <div class="p-4 text-center text-gray-500">
                <p class="text-red-600 font-medium">Error loading document content</p>
                <p class="mt-2">${
                  error.message ||
                  "Please try refreshing the page or contact support."
                }</p>
                <button onclick="window.DoccanoApp.loadDocumentContent()" 
                        class="mt-4 px-4 py-2 bg-eu-orange text-white rounded hover:bg-orange-600 transition-colors">
                    Retry
                </button>
            </div>`;

      targetElement.innerHTML = fallbackContent;
    }
  }

  // Make loadDocumentContent available globally
  window.DoccanoApp = window.DoccanoApp || {};
  window.DoccanoApp.loadDocumentContent = loadDocumentContent;

  // Initialize the application
  function init() {
    // Load document content first
    loadDocumentContent();

    // Initialize other components
    initCollapsibleSections();
    initTextSelection();
    initTaxonomyPopup();
    setupEventListeners();
    renderTaxonomies();

    // Add double-click event listener to remove highlights
    document.addEventListener("dblclick", function (e) {
      const highlight = e.target.closest(".taxonomy-highlight");
      if (highlight) {
        e.preventDefault();
        e.stopPropagation();
        removeHighlight(highlight);
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.shiftKey ? handleRedo() : handleUndo();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        handleRedo();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        handleSaveWithExport();
        e.preventDefault();
      }
    });

    // Handle section triggers
    document.addEventListener("click", function (e) {
      // Check if the click was on a section trigger or its children
      const trigger = e.target.closest(".section-trigger");
      if (trigger) {
        e.preventDefault();

        // Find the parent section
        const section = trigger.closest(".document-section");
        if (!section) return;

        // Toggle the active class on the section
        section.classList.toggle("is-active");

        // Toggle the chevron icon
        const icon = trigger.querySelector(".section-icon");
        if (icon) {
          icon.classList.toggle("fa-chevron-down");
          icon.classList.toggle("fa-chevron-up");
        }

        // Toggle the content visibility
        const content = section.querySelector(".section-content");
        if (content) {
          content.classList.toggle("hidden");
        }
      }
    });
  }

  // Initialize all collapsible sections
  function initCollapsibleSections() {
    const sections = document.querySelectorAll(".document-section");
    sections.forEach((section) => {
      const content = section.querySelector(".section-content");
      const icon = section.querySelector(".section-icon");

      // Ensure content is hidden by default
      if (content) {
        content.classList.add("hidden");
      }

      // Ensure chevron points down by default
      if (icon) {
        icon.classList.add("fa-chevron-down");
        icon.classList.remove("fa-chevron-up");
      }
    });
  }

  // Text selection handling
  function initTextSelection() {
    // Get the document content element
    const docContent = document.getElementById("document-content");
    if (!docContent) return;

    // Only add event listeners to the document content area
    docContent.addEventListener("mouseup", handleTextSelection, true);
    docContent.addEventListener("mousedown", clearSelectionIfOutside, true);
  }

  function isSelectionInParagraph(selection) {
    // Check if the selection is within a paragraph element
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range) return false;

    // Get the common ancestor container
    const container = range.commonAncestorContainer;

    // If it's a text node, get its parent element
    const element =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    // Check if the element or any of its parents is a paragraph
    return element.closest("p") !== null;
  }

  function handleTextSelection(e) {
    console.log("handleTextSelection triggered");

    // Prevent default to avoid any potential interference
    e.preventDefault();
    e.stopPropagation();

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    console.log("Selected text:", selectedText);

    // Check if selection is within document-content and inside a paragraph
    const isInValidArea =
      isSelectionInParagraph(selection) &&
      document
        .getElementById("document-content")
        .contains(selection.anchorNode);

    // Only proceed if there's a valid text selection, we're not inside the popup,
    // and we're inside a paragraph within document-content
    if (
      selectedText.length > 0 &&
      !isInside(selection, "taxonomy-popup") &&
      isInValidArea
    ) {
      console.log("Valid selection, showing popup");

      // Store the current selection
      currentSelection = selectedText;
      currentSelectionRange = selection.getRangeAt(0);

      // Show the taxonomy popup
      showTaxonomyPopup(selection);

      // Prevent the default browser context menu
      e.preventDefault();
      return false;
    } else {
      console.log("Invalid selection, inside popup, or not in valid area");
      if (selectedText.length === 0) {
        console.log("No text selected");
      } else if (!isInValidArea) {
        console.log("Selection not within a paragraph in document-content");
      } else if (isInside(selection, "taxonomy-popup")) {
        console.log("Inside taxonomy popup");
      }
    }
  }

  function clearSelectionIfOutside(e) {
    const popup = document.getElementById("taxonomy-popup");
    if (popup && !popup.contains(e.target)) {
      clearSelection();
    }
  }

  function clearSelection() {
    // Clear text selection
    if (window.getSelection) {
      if (window.getSelection().empty) {
        // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {
      // IE
      document.selection.empty();
    }

    // Reset selection variables
    currentSelection = null;
    currentSelectionRange = null;

    // Hide the popup
    const popup = document.getElementById("taxonomy-popup");
    if (popup) {
      // Add the hidden class and remove display style to allow CSS to handle the hiding
      popup.classList.add("hidden");
      popup.style.display = "none";
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
    const popup = document.getElementById("taxonomy-popup");
    if (!popup) return;

    const closeBtn = popup.querySelector("#close-popup");

    // Close popup when clicking the close button
    if (closeBtn) {
      closeBtn.addEventListener("click", clearSelection);
    }
  }

  function showTaxonomyPopup(selection) {
    console.log("showTaxonomyPopup called");
    const popup = document.getElementById("taxonomy-popup");
    const optionsContainer = popup?.querySelector(".space-y-2");

    if (!popup) {
      console.error("Popup element not found");
      return;
    }
    if (!optionsContainer) {
      console.error("Options container not found in popup");
      return;
    }

    console.log("Popup found:", popup);
    console.log("Options container found:", optionsContainer);

    // Clear existing options
    optionsContainer.innerHTML = "";

    // Add taxonomy options
    taxonomies.forEach((taxonomy) => {
      const color =
        typeof taxonomy.color === "object"
          ? taxonomy.color.hex
          : taxonomy.color;
      const option = document.createElement("div");
      option.className =
        "flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer";
      option.innerHTML = `
                    <div class="flex items-center">
                        <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${color}; border: 1px solid ${color}"></span>
                        <span class="text-sm text-gray-700">${
                          taxonomy.name
                        }</span>
                    </div>
                    <span class="text-xs text-gray-500">${
                      taxonomy.count || 0
                    }</span>
                `;

      option.addEventListener("click", () => {
        assignTaxonomyToSelection(taxonomy);
      });

      optionsContainer.appendChild(option);
    });

    // Position the popup near the selection
    positionPopup(popup, selection);

    // Show the popup with animation
    popup.style.display = "block";
    // Force reflow to ensure the transition works
    void popup.offsetHeight;
    popup.classList.add("visible");

    // Add click outside handler
    const clickOutsideHandler = (e) => {
      if (popup && !popup.contains(e.target)) {
        clearSelection();
        document.removeEventListener("mousedown", clickOutsideHandler);
      }
    };

    // Add the event listener with a small delay to avoid immediate dismissal
    setTimeout(() => {
      document.addEventListener("mousedown", clickOutsideHandler);
    }, 100);
  }

  function positionPopup(popup, selection) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Make sure the popup is visible to get its dimensions
    popup.style.visibility = "hidden";
    popup.classList.remove("hidden");
    popup.style.display = "block";

    // Force a reflow to ensure dimensions are calculated
    void popup.offsetHeight;

    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;

    // Reset styles before calculating position
    popup.style.visibility = "visible";

    // Calculate position
    let top = window.pageYOffset + rect.top - popupHeight - 8; // 8px above selection
    let left = window.pageXOffset + rect.left + rect.width / 2 - popupWidth / 2;

    // Adjust if the popup would go off-screen horizontally
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

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
    popup.style.position = "absolute";
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
    const existingHighlight = selectionContainer.parentElement.closest(
      ".taxonomy-highlight"
    );

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
    const span = document.createElement("span");
    const bgColor =
      typeof taxonomy.color === "object" ? taxonomy.color.hex : taxonomy.color;

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

    span.className = "taxonomy-highlight";
    span.id = `taxonomy-${taxonomy.id}-${Date.now()}`; // Add timestamp for unique ID
    span.dataset.taxonomyId = taxonomy.id;
    span.dataset.lineNumber = lineNumber || "";
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
    span.addEventListener("mouseenter", (e) => {
      const tooltip = span.querySelector(".taxonomy-tooltip");
      if (tooltip) {
        tooltip.style.opacity = "1";
        tooltip.style.visibility = "visible";
        tooltip.style.transform = "translateX(-50%) translateY(-10px)";
      }
    });

    span.addEventListener("mouseleave", (e) => {
      const tooltip = span.querySelector(".taxonomy-tooltip");
      if (tooltip) {
        tooltip.style.opacity = "0";
        tooltip.style.visibility = "hidden";
        tooltip.style.transform = "translateX(-50%) translateY(-5px)";
      }
    });

    // Store position information
    const range = currentSelectionRange.cloneRange();
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(
      document.getElementById("document-content")
    );
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

    const taxonomyId = highlightElement.id.replace("taxonomy-", "");
    const taxonomy = taxonomies.find((t) => t.id === taxonomyId);

    if (taxonomy && taxonomy.count > 0) {
      taxonomy.count--;
      renderTaxonomies();
    }

    // Get the original text content (excluding the tooltip)
    const originalText =
      highlightElement.firstChild.textContent || highlightElement.textContent;

    // Replace the highlight with just the original text
    const textNode = document.createTextNode(originalText);
    highlightElement.parentNode.replaceChild(textNode, highlightElement);

    // Clear any existing selection
    clearSelection();
  }

  function renderTaxonomies() {
    const container = document.getElementById("taxonomy-container");
    if (!container) return;

    // Show loading state with animation
    container.innerHTML = `
      <div class="text-center py-4">
        <div class="animate-pulse space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>`;

    // This will be called when taxonomies are loaded
    onTaxonomiesLoaded((taxonomyList) => {
      if (!taxonomyList || taxonomyList.length === 0) {
        container.innerHTML =
          '<div class="text-sm text-red-500 py-4">No taxonomies available</div>';
        return;
      }

      container.innerHTML = "";

      taxonomyList.forEach((taxonomy) => {
        const element = document.createElement("div");
        element.className =
          "group flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 hover:shadow-sm hover:bg-gradient-to-r hover:from-white hover:to-gray-50 border border-transparent hover:border-gray-200";

        // Get the color from the taxonomy
        const color =
          typeof taxonomy.color === "object"
            ? taxonomy.color.hex
            : taxonomy.color;

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
    const docContent = document.getElementById("document-content");

    if (!docContent) {
      console.log("No document content found");
      return null;
    }

    try {
      // Get all highlight elements
      const highlightElements = docContent.querySelectorAll(
        ".taxonomy-highlight"
      );

      // First, process pre-rendered highlights
      const preRenderedHighlights = [];
      const processedIds = new Set();

      // Process all highlight elements
      highlightElements.forEach((hl) => {
        try {
          let taxonomyId = hl.dataset.taxonomyId;
          let taxonomyName = "";

          // For pre-rendered highlights, extract taxonomy info from color scheme
          if (!taxonomyId && hl.dataset.colorScheme) {
            try {
              const colorScheme = JSON.parse(hl.dataset.colorScheme);
              // Find the taxonomy that matches this color scheme
              const taxonomy = taxonomies.find(
                (t) =>
                  t.color ===
                  colorScheme.bg.replace("bg-", "").replace("-500", "")
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
            console.warn(
              "Skipping highlight - could not determine taxonomy:",
              hl
            );
            return;
          }

          // Get the text content without the tooltip
          let text = hl.textContent;
          const tooltip = hl.querySelector(".taxonomy-tooltip");
          if (tooltip) {
            text = text.replace(tooltip.textContent, "").trim();
          }

          // Generate a unique ID if needed
          const id =
            hl.id ||
            `highlight-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          // Skip if we've already processed this ID
          if (processedIds.has(id)) return;
          processedIds.add(id);

          // Get line number from parent element if available
          let lineNumber = hl.dataset.lineNumber || "";
          if (!lineNumber) {
            const lineElement = hl.closest(".flex.items-start.group");
            if (lineElement) {
              const lineNumberSpan = lineElement.querySelector(
                "span.text-xs.text-gray-400"
              );
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
              const tempSpan = document.createElement("span");
              tempSpan.id = "temp-highlight-marker";
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
              end: endOffset,
            },
            timestamp: hl.dataset.timestamp || new Date().toISOString(),
            isPreRendered: !hl.id.startsWith("taxonomy-"),
          });
        } catch (error) {
          console.error("Error processing highlight:", error, hl);
        }
      });

      // Get document title or use a default
      const docTitle =
        document.querySelector("h1")?.textContent || "Untitled Document";

      // Create export data structure
      const exportData = {
        document: docTitle.trim(),
        timestamp: new Date().toISOString(),
        highlights: highlights,
      };

      console.log("Exporting highlights:", exportData);
      return exportData;
    } catch (error) {
      console.error("Error exporting highlights:", error);
      return null;
    }
  }

  // Handle save action with export functionality
  function handleSaveWithExport(event) {
    // Prevent default form submission if triggered by a form
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      // First save the current state
      const changes = saveState();
      
      // Get the save button and add loading state
      const saveBtn = document.getElementById("save-btn");
      const saveIcon = saveBtn ? saveBtn.querySelector("i, svg") : null;
      const originalHtml = saveBtn ? saveBtn.innerHTML : '';
      
      if (saveBtn) {
        // Add loading class and disable button
        saveBtn.classList.add("opacity-75", "cursor-not-allowed");
        if (saveIcon) {
          saveIcon.classList.add("animate-spin");
        }
      }

      // Export the highlights
      const exportData = exportHighlights();

      if (exportData) {
        // Convert to pretty-printed JSON string
        const jsonString = JSON.stringify(exportData, null, 2);

        // Create a blob and download link
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `highlights_${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        // Show success message with SweetAlert2
        const addedCount = changes ? changes.added || 0 : 0;
        const removedCount = changes ? changes.removed || 0 : 0;
        
        let message = "Changes saved successfully!";
        if (addedCount > 0 || removedCount > 0) {
          message = `Changes saved: ${addedCount} added, ${removedCount} removed`;
        }
        
        // Show toast notification with progress bar and detailed counts
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          width: 'auto',
          minWidth: '300px',
          padding: '0.75rem 1rem',
          customClass: {
            container: 'swal2-toast-container',
            popup: 'swal2-toast',
            timerProgressBar: 'swal2-timer-progress-bar',
          },
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
            
            // Add custom styling for the progress bar
            const progressBar = toast.querySelector('.swal2-timer-progress-bar');
            if (progressBar) {
              progressBar.style.background = '#34D399';
              progressBar.style.height = '3px';
              progressBar.style.borderRadius = '2px';
            }
          }
        });

        // Create toast content
        const title = 'Changes saved successfully!';
        const addedBadge = addedCount > 0 ? 
          `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
            <svg class="-ml-0.5 mr-1 h-2 w-2 text-green-500" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            ${addedCount} added
          </span>` : '';
        
        const removedBadge = removedCount > 0 ?
          `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg class="-ml-0.5 mr-1 h-2 w-2 text-red-500" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            ${removedCount} removed
          </span>` : '';

        // Show the toast with just the HTML content (no duplicate title or close button)
        Toast.fire({
          html: `
            <div class="flex items-center w-full">
              <svg class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">${title}</p>
                ${(addedCount > 0 || removedCount > 0) ? 
                  `<div class="mt-1 flex items-center flex-wrap gap-1">${addedBadge}${removedBadge}</div>` : ''
                }
              </div>
            </div>
          `,
          showConfirmButton: false,
          width: 'auto',
          padding: '0.75rem 1rem',
          background: '#fff',
          showCloseButton: true,
          showClass: {
            popup: 'animate-fade-in-up'
          },
          hideClass: {
            popup: 'animate-fade-out-down'
          }
        });

        // Restore save button state
        if (saveBtn) {
          // Add success animation
          saveBtn.classList.add("text-green-500");
          if (saveIcon) {
            saveIcon.classList.remove("animate-spin");
            saveIcon.classList.add("animate-bounce");
          }
          
          // Reset button after animation
          setTimeout(() => {
            if (saveBtn) {
              saveBtn.classList.remove("opacity-75", "cursor-not-allowed", "text-green-500");
              if (saveIcon) {
                saveIcon.classList.remove("animate-bounce");
              }
              saveBtn.innerHTML = originalHtml; // Restore original HTML
            }
          }, 2000);
        }

        return jsonString;
      } else {
        console.warn("No highlights to export");
        // Show info message if no changes
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'No changes to save',
          showConfirmButton: false,
          timer: 2000
        });
        return null;
      }
    } catch (error) {
      console.error("Error in handleSaveWithExport:", error);
      // Show error message
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Error saving changes',
        text: error.message || 'An error occurred while saving',
        showConfirmButton: false,
        timer: 3000
      });
      return null;
    } finally {
      // Ensure button is always reset
      const saveBtn = document.getElementById("save-btn");
      if (saveBtn) {
        saveBtn.classList.remove("opacity-75", "cursor-not-allowed");
        const saveIcon = saveBtn.querySelector("i, svg");
        if (saveIcon) {
          saveIcon.classList.remove("animate-spin", "animate-bounce");
        }
      }
    }
  }

  // Assign to window
  window.DoccanoApp = {
    init: init,
    exportHighlights: exportHighlights,
    handleSaveWithExport: handleSaveWithExport,
  };

  // Initialize when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (typeof init === "function") init();
    });
  } else {
    // DOMContentLoaded has already fired
    if (typeof init === "function") init();
  }
})();
