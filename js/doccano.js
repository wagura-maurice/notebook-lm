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

      // Process taxonomy data if it exists
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

      // Process entities if they exist
      if (data.enrichment?.entities && Array.isArray(data.enrichment.entities)) {
        if (!taxonomyMap.entities) {
          taxonomyMap.entities = [];
        }
        
        // Add entities with proper formatting
        data.enrichment.entities.forEach(entity => {
          if (entity && entity.text) {
            taxonomyMap.entities.push({
              type: entity.type || 'unknown',
              text: entity.text,
              value: entity.value || '',
              unit: entity.unit || '',
              confidence: entity.confidence !== undefined ? parseFloat(entity.confidence) : 0.6,
              description: entity.description || '',
              start_offset: entity.start_offset || 0,
              end_offset: entity.end_offset || 0,
              source: 'ndjson'
            });
          }
        });
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

  // Document data - will be loaded asynchronously
  let taxonomies = [];
  let taxonomiesLoaded = false;

  // Store the loaded document data
  let documentData = [];
  let documentDataLoaded = false;
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

  // Start loading taxonomies and document data when the script loads
  Promise.all([
    loadTaxonomies().catch(console.error),
    loadDocumentData().catch(console.error),
  ]);

  // Generate a summary of the entire document
  function generateDocumentSummary() {
    if (!documentData || documentData.length === 0) {
      return {
        title: "Summary Analysis",
        summary: "No document data available for analysis.",
        totalSections: 0,
        totalWords: 0,
        keywords: [],
        sections: [],
      };
    }

    // Collect all keywords and sections
    const allKeywords = new Set();
    const sections = new Set();
    let totalWords = 0;

    documentData.forEach((item) => {
      // Count words in the text
      if (item.text) {
        totalWords += item.text.split(/\s+/).length;
      }

      // Collect keywords
      if (item.enrichment?.keywords) {
        item.enrichment.keywords.forEach((keyword) => allKeywords.add(keyword));
      }

      // Collect sections
      if (item.section) {
        sections.add(item.section);
      } else if (item.enrichment?.title) {
        sections.add(item.enrichment.title);
      }
    });

    // Get top 10 most common keywords if we have too many
    const sortedKeywords = Array.from(allKeywords)
      .sort(
        (a, b) => b.length - a.length // Sort by length as a simple proxy for importance
      )
      .slice(0, 10);

    return {
      title: "Summary Analysis",
      summary: `This document contains ${documentData.length} lines of content across ${sections.size} sections, with approximately ${totalWords} words in total.`,
      totalSections: sections.size,
      totalWords,
      keywords: sortedKeywords,
      sections: Array.from(sections).slice(0, 10), // Show first 10 sections
    };
  }

  // Update Enrichment Summary with line data or document summary
  function updateEnrichmentSummary(lineData) {
    const summaryContainer = document.getElementById(
      "enrichment-summary-content"
    );
    if (!summaryContainer) return;

    // Clear existing content
    summaryContainer.innerHTML = "";

    if (!lineData) {
      // Show document summary when no specific line is selected
      const docSummary = generateDocumentSummary();

      const section = document.createElement("div");
      section.className =
        "document-section border border-gray-200 rounded-lg overflow-hidden transition-shadow hover:shadow-sm";

      section.innerHTML = `
        <div class="w-full text-left px-5 py-3.5 bg-gray-50 font-medium">
          <h3 class="text-base font-medium text-eu-blue">${
            docSummary.title
          }</h3>
        </div>
        <div class="px-5 py-4">
          <div class="relative pl-3.5 border-l-2 border-eu-orange my-1">
            <p class="text-sm text-gray-700 font-normal leading-relaxed">${
              docSummary.summary
            }</p>
            <div class="absolute -left-px top-0 w-0.5 h-full bg-gradient-to-b from-eu-orange/30 to-transparent"></div>
          </div>
          
          ${
            docSummary.keywords.length > 0
              ? `
            <div class="mt-3 pt-3 border-t border-gray-100">
              <p class="text-xs text-gray-500 mb-2">Key Topics</p>
              <div class="flex flex-wrap gap-2">
                ${docSummary.keywords
                  .map(
                    (keyword) =>
                      `<span class="px-2 py-0.5 bg-eu-orange/20 text-eu-blue text-xs rounded-full">
                    ${keyword}
                  </span>`
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
          
          ${
            docSummary.sections.length > 0
              ? `
            <div class="mt-3 pt-3 border-t border-gray-100">
              <p class="text-xs text-gray-500 mb-2">Document Sections (${
                docSummary.totalSections
              } total)</p>
              <ul class="text-sm text-gray-700 space-y-1">
                ${docSummary.sections
                  .map(
                    (section) =>
                      `<li class="flex items-start">
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-eu-orange/50 mt-1.5 mr-2 flex-shrink-0"></span>
                    <span>${section}</span>
                  </li>`
                  )
                  .join("")}
                ${
                  docSummary.totalSections > docSummary.sections.length
                    ? `<li class="text-xs text-gray-400 italic">+ ${
                        docSummary.totalSections - docSummary.sections.length
                      } more sections</li>`
                    : ""
                }
              </ul>
            </div>
          `
              : ""
          }
          
        </div>
      `;

      summaryContainer.appendChild(section);
      return;
    }

    // Get enrichment data with defaults
    const enrichment = lineData.enrichment || {};
    const title = enrichment.title || "Document Details";
    const summary =
      enrichment.summary || lineData.text || "No content available";
    const keywords = enrichment.keywords || [];
    const rhetoricalRole = enrichment.rhetorical_role;

    // Handle temporal data with new structure
    const temporalData = lineData.temporal || {};
    const hasTemporalData =
      temporalData.start_date ||
      temporalData.end_date ||
      (temporalData.dates_mentioned && temporalData.dates_mentioned.length > 0);

    // Handle annotations with new structure
    const annotations = lineData.annotations || {};

    // Create section wrapper
    const section = document.createElement("div");
    section.className =
      "document-section border border-gray-200 rounded-lg overflow-hidden transition-shadow hover:shadow-sm";

    // Create section header
    section.innerHTML = `
      <div class="w-full text-left px-5 py-3.5 bg-gray-50 font-medium">
        <h3 class="text-base font-medium text-eu-blue">${title}</h3>
      </div>
      <div class="px-5 py-4">
        <div class="relative pl-3.5 border-l-2 border-eu-orange my-1">
          <p class="text-sm text-gray-700 font-normal leading-relaxed">${summary}</p>
          <div class="absolute -left-px top-0 w-0.5 h-full bg-gradient-to-b from-eu-orange/30 to-transparent"></div>
        </div>
        ${
          keywords.length > 0
            ? `
          <div class="flex flex-wrap gap-2 mt-3">
            ${keywords
              .map(
                (keyword) =>
                  `<span class="px-2 py-0.5 bg-eu-orange/20 text-eu-blue text-xs rounded-full">
                ${keyword}
              </span>`
              )
              .join("")}
          </div>
        `
            : ""
        }
        
        <!-- Temporal Data Section -->
        <div class="mt-3 pt-3 border-t border-gray-100">
          <p class="text-xs text-gray-500 mb-2">Temporal Data</p>
          ${
            hasTemporalData
              ? `
            <ul class="space-y-1.5 text-sm text-gray-700">
              ${
                temporalData.start_date
                  ? `
                <li class="flex items-start">
                  <span class="inline-block w-1.5 h-1.5 rounded-full bg-eu-orange mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>Start Date: <span class="font-medium">${temporalData.start_date}</span></span>
                </li>
              `
                  : ""
              }
              ${
                temporalData.end_date
                  ? `
                <li class="flex items-start">
                  <span class="inline-block w-1.5 h-1.5 rounded-full bg-eu-orange mt-1.5 mr-2 flex-shrink-0"></span>
                  <span>End Date: <span class="font-medium">${temporalData.end_date}</span></span>
                </li>
              `
                  : ""
              }
              ${
                temporalData.dates_mentioned &&
                temporalData.dates_mentioned.length > 0
                  ? `
                ${temporalData.dates_mentioned
                  .map(
                    (date) => `
                  <li class="flex items-start">
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-eu-orange/50 mt-1.5 mr-2 flex-shrink-0"></span>
                    <span>Mentioned: <span class="font-medium">${date}</span></span>
                  </li>
                `
                  )
                  .join("")}
              `
                  : ""
              }
            </ul>
          `
              : `
            <p class="text-sm text-gray-400 italic">No temporal data available</p>
          `
          }
        </div>
        
        <!-- Annotations Section -->
        <div class="mt-3 pt-3 border-t border-gray-100">
          <p class="text-xs text-gray-500 mb-2">Annotation Analysis</p>
          ${
            annotations.length || annotations.words
              ? `
            <ul class="space-y-2 text-sm">
              ${
                annotations.length
                  ? `
                <li class="p-2 bg-gray-50 rounded border border-gray-100">
                  <div class="flex justify-between items-center">
                    <span class="font-medium text-eu-blue">Annotation Length</span>
                    <span class="text-sm font-medium">${annotations.length} characters</span>
                  </div>
                </li>
              `
                  : ""
              }
              ${
                annotations.words
                  ? `
                <li class="p-2 bg-gray-50 rounded border border-gray-100">
                  <div class="flex justify-between items-center">
                    <span class="font-medium text-eu-blue">Word Count</span>
                    <span class="text-sm font-medium">${annotations.words} words</span>
                  </div>
                </li>
              `
                  : ""
              }
            </ul>
          `
              : `
            <p class="text-sm text-gray-400 italic">No annotation analysis available</p>
          `
          }
        </div>
        
        ${
          rhetoricalRole
            ? `
          <div class="mt-3 pt-3 border-t border-gray-100">
            <p class="text-xs text-gray-500">Rhetorical Role</p>
            <p class="text-sm font-medium text-gray-700">${rhetoricalRole}</p>
          </div>
        `
            : ""
        }
        
        <div class="mt-3 pt-3 border-t border-gray-100">
          <button 
            class="curator-studio-btn w-full flex items-center justify-center px-3 py-2 bg-eu-blue text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <i class="fas fa-user-edit mr-2"></i>
            Curator Studio
          </button>
        </div>
        
        <div class="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1.5">
          <div class="flex items-center">
            <span class="font-medium mr-2 text-gray-600">ID:</span>
            <span class="font-mono">${
              lineData.id?.substring(0, 8) || "N/A"
            }</span>
          </div>
          <div class="flex items-center">
            <span class="font-medium mr-2 text-gray-600">Created:</span>
            <span>${new Date(
              lineData._ts || new Date()
            ).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;

    summaryContainer.appendChild(section);
  }

  // Handle line click in the document
  function handleLineClick(lineElement) {
    console.log("Line element clicked:", lineElement);

    // Remove active class from all document lines
    document.querySelectorAll(".document-line").forEach((el) => {
      el.classList.remove("active");
    });

    // Add active class to clicked line
    lineElement.classList.add("active");

    // Get the line number from the element
    const lineNumber = getLineNumber(lineElement);
    if (!lineNumber) {
      console.error("No line number found for element:", lineElement);
      return;
    }

    // Try to get the line data from the element's dataset first
    let lineData = null;

    // Check if the line element has a data-line-data attribute with the full data
    if (lineElement.dataset.lineData) {
      try {
        lineData = JSON.parse(lineElement.dataset.lineData);
        console.log("Found line data in dataset:", lineData);
      } catch (e) {
        console.error("Error parsing line data from dataset:", e);
      }
    }

    // If no data in dataset, try to find it in documentData
    if (!lineData) {
      lineData = documentData.find(
        (item) =>
          item.lineNumber === lineNumber ||
          (item.id && item.id === lineElement.dataset.id) ||
          (item._hash && item._hash === lineElement.dataset.hash)
      );

      if (lineData) {
        console.log("Found line data in documentData:", lineData);
      }
    }

    // If still no data, create a basic one
    if (!lineData) {
      console.log("Creating basic line data");
      lineData = {
        lineNumber: lineNumber,
        text: lineElement.textContent.trim(),
        type: lineElement.dataset.type || "text",
        id: lineElement.dataset.id || "",
        section:
          lineElement.closest("[data-section]")?.dataset.section || "Document",
        metadata: {
          length: lineElement.textContent.length,
          words: lineElement.textContent.trim().split(/\s+/).length,
        },
      };
    } else {
      // Ensure lineNumber is set
      lineData.lineNumber = lineNumber;
    }

    // Add the line data to the element's dataset for future reference
    try {
      lineElement.dataset.lineData = JSON.stringify(lineData);
    } catch (e) {
      console.error("Error saving line data to dataset:", e);
    }

    // Update the URL with the line number
    window.history.pushState({ lineNumber }, "", `#L${lineNumber}`);

    // Log the line data for debugging
    console.log("Final line data:", lineData);

    // Update the enrichment summary
    updateEnrichmentSummary(lineData);
  }

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

  // Save current document state with line information and track changes
  function saveState() {
    const docContent = document.getElementById("document-content");
    if (!docContent) return null;

    // Get the currently active highlight
    const activeHighlight = document.querySelector(
      ".taxonomy-highlight.highlight-active"
    );

    // Create a snapshot of the current state with line numbers
    const currentHighlights = [];
    const currentHighlightElements = document.querySelectorAll(
      ".taxonomy-highlight"
    );

    // Track current highlights
    currentHighlightElements.forEach((hl) => {
      // Get the text content of just the highlight, excluding any tooltip content
      let text = "";

      // Find the first text node within the highlight
      const textNode = Array.from(hl.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE
      );
      if (textNode) {
        text = textNode.textContent.trim();
      } else {
        // Fallback to textContent if no direct text node is found
        text = hl.textContent
          .trim()
          .replace(/\s+/g, " ") // Replace multiple whitespace with single space
          .replace(/\n+/g, " ") // Replace newlines with space
          .trim();

        // Remove any taxonomy category name that might be at the end
        const taxonomy = taxonomies.find(
          (t) => t.id === (hl.dataset.taxonomyId || "")
        );
        if (taxonomy) {
          text = text
            .replace(new RegExp(`\\s*${taxonomy.name}\\s*$`, "i"), "")
            .trim();
        }
      }

      // Ensure line number is captured from the closest parent with data-line-number
      let lineNumber = hl.dataset.lineNumber || "";
      if (!lineNumber) {
        const lineElement = hl.closest("[data-line-number]");
        if (lineElement) {
          lineNumber = lineElement.dataset.lineNumber || "";
        }
      }

      currentHighlights.push({
        id: hl.id,
        text: text,
        lineNumber: lineNumber,
        taxonomyId: hl.dataset.taxonomyId || "",
        isActive: true, // If element exists in DOM, it's active
      });
    });

    // If we have a previous state, mark any missing highlights as inactive
    if (
      stateHistory.currentIndex >= 0 &&
      stateHistory.stack[stateHistory.currentIndex]
    ) {
      try {
        const prevState = JSON.parse(
          stateHistory.stack[stateHistory.currentIndex]
        );
        const prevHighlights = prevState.highlights || [];

        // Find highlights that were in previous state but not in current
        const currentIds = new Set(currentHighlights.map((h) => h.id));
        prevHighlights.forEach((prevHl) => {
          if (!currentIds.has(prevHl.id)) {
            // This highlight was removed
            currentHighlights.push({
              ...prevHl,
              isActive: false,
            });
          }
        });
      } catch (e) {
        console.error("Error processing previous state:", e);
      }
    }

    // Get the previous state for comparison
    let added = 0;
    let removed = 0;
    let hasChanges = false;

    // Only compare if we have a previous state
    if (
      stateHistory.currentIndex >= 0 &&
      stateHistory.stack[stateHistory.currentIndex]
    ) {
      try {
        const prevState = JSON.parse(
          stateHistory.stack[stateHistory.currentIndex]
        );
        const prevHighlights = prevState.highlights || [];

        // Create maps for easier comparison
        const currentMap = new Map(currentHighlights.map((h) => [h.id, h]));
        const prevMap = new Map(prevHighlights.map((h) => [h.id, h]));

        // Find added highlights (in current but not in previous)
        added = currentHighlights.filter((h) => !prevMap.has(h.id)).length;

        // Find removed highlights (in previous but not in current)
        removed = prevHighlights.filter((h) => !currentMap.has(h.id)).length;

        // Check for modified highlights (same ID but different content)
        let modified = 0;
        currentHighlights.forEach((ch) => {
          const ph = prevMap.get(ch.id);
          if (
            ph &&
            (ch.text !== ph.text ||
              ch.taxonomyId !== ph.taxonomyId ||
              ch.isActive !== ph.isActive)
          ) {
            modified++;
          }
        });

        hasChanges = added > 0 || removed > 0 || modified > 0;

        console.log("Changes detected:", { added, removed, modified });
      } catch (e) {
        console.error("Error comparing states:", e);
        // If we can't compare, assume there are changes to be safe
        hasChanges = currentHighlights.length > 0;
      }
    } else if (currentHighlights.length > 0) {
      // First state with highlights
      hasChanges = true;
      added = currentHighlights.length;
    }

    const snapshot = {
      html: docContent.innerHTML,
      highlights: currentHighlights,
      timestamp: new Date().toISOString(),
      currentHighlightId: activeHighlight ? activeHighlight.id : null,
    };

    // Only push to history if there are actual changes
    if (hasChanges) {
      stateHistory.pushState(JSON.stringify(snapshot));
    }

    console.log("State saved:", {
      currentHighlightId: snapshot.currentHighlightId,
      highlights: currentHighlights.length,
      added,
      removed,
      hasChanges,
    });

    return {
      snapshot,
      added,
      removed,
      hasChanges,
    };
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

      // Initialize taxonomy map to store all entities
      const taxonomyMap = {};
      
      // Process each line as a separate JSON object
      const items = lines
        .map((line) => {
          try {
            const item = JSON.parse(line);
            // Process the line to extract entities into taxonomyMap
            processLine(line, taxonomyMap);
            return item;
          } catch (e) {
            console.error("Error parsing NDJSON line:", e);
            return null;
          }
        })
        .filter((item) => item !== null);
        
      // Store the extracted entities in a global variable for later use
      if (taxonomyMap.entities) {
        window.ndjsonEntities = taxonomyMap.entities;
        console.log(`Loaded ${taxonomyMap.entities.length} entities from NDJSON`);
      }

      // Group items by their section title
      const sections = [];
      let currentSection = null;

      items.forEach((item, index) => {
        // Clean up header by removing page spans and markdown formatting
        const sectionHeader = item.header
          ? item.header
              .replace(/<span[^>]*>[^<]*<\/span>/g, "") // Remove page spans
              .replace(/\*\*/g, "") // Remove markdown bold
              .trim()
          : "";

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
            header: sectionHeader,
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
                    <div class="text-sm font-semibold text-eu-blue mt-2 mb-1">${section.header}</div>`;

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
            // Create a unique ID for this line
            const tocLineId = `line-${lineNumber}`;
            const tocLineData = JSON.stringify({
              lineNumber: lineNumber,
              text: left + (right ? ` | ${right}` : ""),
              id: tocLineId,
              type: "table_of_contents",
              section: section.title,
              enrichment: item.enrichment || null,
              _ts: item._ts || new Date().toISOString(),
              doc: item.doc || "Document",
              header: item.header || "",
            });

            html += `
                    <div class="document-line flex items-start group mb-1" data-line-number="${lineNumber}" data-line-data='${tocLineData.replace(
              /'/g,
              "&#39;"
            )}'>
                        <span class="line-number text-xs text-gray-400 w-8 flex-shrink-0 mt-0.5 cursor-pointer hover:text-gray-600">${lineStr}</span>
                        <div class="line-content flex-1">
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
            // Create a unique ID for this line
            const lineId = `line-${lineNumber}`;
            const lineData = JSON.stringify({
              lineNumber: lineNumber,
              text: text.replace(/<[^>]*>/g, ""), // Remove HTML tags for plain text
              id: lineId,
              type: "text",
              section: section.title,
              enrichment: item.enrichment || null,
              _ts: item._ts || new Date().toISOString(),
              doc: item.doc || "Document",
              header: item.header || "",
            });

            html += `
                    <div class="document-line flex items-start group mb-1" data-line-number="${lineNumber}" data-line-data='${lineData.replace(
              /'/g,
              "&#39;"
            )}'>
                        <span class="line-number text-xs text-gray-400 w-8 flex-shrink-0 mt-0.5 cursor-pointer hover:text-gray-600">${lineStr}</span>
                        <div class="line-content flex-1">
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

  // Load document data from NDJSON file
  // Function to update document metadata in the UI
  function updateDocumentMetadata() {
    if (!documentData || documentData.length === 0) return;

    // Get the first and last documents
    const firstDoc = documentData[0];
    const lastDoc = documentData[documentData.length - 1];

    // Extract document title from the first line's header or doc field
    let docTitle = firstDoc.header || firstDoc.doc || "Document";

    // Clean up the title - remove markdown formatting and extra spaces
    docTitle = docTitle
      .replace(/\*\*|##?|\[|\]/g, "") // Remove markdown formatting
      .replace(/\s+/g, " ") // Replace multiple spaces with one
      .trim(); // Trim whitespace

    // Use the last line's _ts field for the last updated date
    let lastUpdated = new Date();
    if (lastDoc._ts) {
      try {
        lastUpdated = new Date(lastDoc._ts);
      } catch (e) {
        console.warn("Invalid date in _ts field:", lastDoc._ts);
      }
    }

    // Format the date as "Month Day, Year" (e.g., "Aug 25, 2025")
    const formattedDate = lastUpdated.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Update all elements with the document-title class
    const titleElements = document.querySelectorAll(".document-title");
    titleElements.forEach((el) => {
      // Skip updating if the element is inside a template or shadow DOM
      if (!el.closest("template") && !el.getRootNode().host) {
        el.textContent = docTitle;
        // Preserve any icons or other elements by only updating the text node
        const textNode = Array.from(el.childNodes).find(
          (node) => node.nodeType === Node.TEXT_NODE
        );
        if (textNode) {
          textNode.textContent = docTitle;
        } else if (el.childNodes.length === 0) {
          el.textContent = docTitle;
        }
      }
    });

    // Function to get document statistics
    const getDocumentStats = () => {
      const documentContent = document.querySelector("#document-content");
      if (!documentContent) return { charCount: 0, wordCount: 0 };

      // Get all text nodes within the document content
      const walker = document.createTreeWalker(
        documentContent,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let fullText = "";
      let node;
      while ((node = walker.nextNode())) {
        // Skip script and style elements
        if (
          node.parentNode.nodeName === "SCRIPT" ||
          node.parentNode.nodeName === "STYLE"
        ) {
          continue;
        }
        fullText += " " + node.textContent;
      }

      // Count characters (excluding whitespace)
      const charCount = fullText.replace(/\s+/g, "").length;
      // Count words (split by whitespace and filter out empty strings)
      const wordCount = fullText
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      return { charCount, wordCount };
    };

    // Calculate average confidence from the document data
    const calculateAverageConfidence = () => {
      try {
        // Check if documentData is available and has items
        if (
          !window.documentData ||
          !Array.isArray(window.documentData) ||
          window.documentData.length === 0
        ) {
          console.log("No document data available");
          return null;
        }

        let totalConfidence = 0;
        let count = 0;
        window.documentData.forEach((doc) => {
          const confidence = parseFloat(doc?.enrichment?.confidence);
          if (!isNaN(confidence)) {
            totalConfidence += confidence;
            count += 1;
          }
        });
        if (count > 0) {
          const averageConfidence =
            Math.round((totalConfidence / count) * 100 * 100) / 100;
          console.log("Calculated average confidence:", averageConfidence);
          return averageConfidence;
        }

        // Get confidence from enrichment.confidence
        const confidence = parseFloat(firstDoc.enrichment.confidence);
        if (isNaN(confidence)) {
          console.log(
            "Invalid confidence value in document:",
            firstDoc.enrichment.confidence
          );
          return null;
        }

        console.log("Using confidence from document data:", confidence);
        return Math.round(confidence * 100 * 100) / 100;
      } catch (error) {
        console.error("Error calculating confidence:", error);
        return null; // Return null on error
      }
    };

    // Process token usage data from all documents
    const processTokenUsage = () => {
      if (!window.documentData || !Array.isArray(window.documentData)) {
        return { prompt: 0, completion: 0, total: 0 };
      }

      let promptTokens = 0;
      let completionTokens = 0;
      let totalTokens = 0;

      window.documentData.forEach((doc) => {
        if (doc?.enrichment?._usage) {
          const usage = doc.enrichment._usage;
          promptTokens += parseInt(usage.prompt_tokens) || 0;
          completionTokens += parseInt(usage.completion_tokens) || 0;
          totalTokens += parseInt(usage.total_tokens) || 0;
        }
      });

      return {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens,
      };
    };

    // Initialize token usage chart
    const initTokenChart = () => {
      const usage = processTokenUsage();

      // Only initialize if we have data
      if (usage.total === 0) return;

      const options = {
        series: [usage.prompt, usage.completion],
        chart: {
          type: "donut",
          height: 250,
          fontFamily: "Inter, sans-serif",
          toolbar: {
            show: false,
          },
        },
        labels: ["Prompt Tokens", "Completion Tokens"],
        colors: ["#3B82F6", "#10B981"], // Blue for prompt, Green for completion
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                width: 200,
              },
              legend: {
                position: "bottom",
              },
            },
          },
        ],
        plotOptions: {
          pie: {
            donut: {
              size: "75%", // Increase center space by making the donut thinner
              offsetY: 0, // Center the donut vertically
              labels: {
                show: true,
                total: {
                  show: true,
                  label: "Total Tokens",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#4B5563",
                  formatter: function (w) {
                    return usage.total.toLocaleString();
                  },
                },
                value: {
                  formatter: function (val) {
                    return parseInt(val).toLocaleString();
                  },
                },
                percentage: {
                  formatter: function (val) {
                    return Math.round(parseFloat(val)) + "%";
                  },
                },
              },
            },
          },
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          position: "bottom",
          horizontalAlign: "center",
          fontSize: "13px",
          itemMargin: {
            horizontal: 8,
            vertical: 8,
          },
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return `${val.toLocaleString()} tokens (${Math.round(
                (val / usage.total) * 100
              )}%)`;
            },
          },
        },
      };

      // Get chart element
      const chartElement = document.querySelector("#tokenChart");
      if (!chartElement) return;

      // Clear any existing content
      chartElement.innerHTML = "";

      // Create new chart
      if (typeof ApexCharts !== "undefined") {
        // Store the chart instance in a local variable first
        const chart = new ApexCharts(chartElement, options);

        // Store reference to the chart instance
        if (!window.tokenCharts) {
          window.tokenCharts = new Map();
        }

        // Remove existing chart if it exists
        if (window.tokenCharts.has("main")) {
          window.tokenCharts.get("main").destroy();
          window.tokenCharts.delete("main");
        }

        // Store and render the new chart
        window.tokenCharts.set("main", chart);
        chart.render();
      }
    };

    // Update document statistics display
    const updateDocumentStats = () => {
      const { charCount, wordCount } = getDocumentStats();

      // Update length elements
      const lengthElements = document.querySelectorAll(".document-length");
      lengthElements.forEach((el) => {
        if (!el.closest("template") && !el.getRootNode().host) {
          el.textContent = `${charCount.toLocaleString()} characters • ${wordCount.toLocaleString()} words`;
        }
      });

      // Initialize token chart
      initTokenChart();

      // Update confidence score
      const confidence = calculateAverageConfidence();
      const confidenceValue = document.getElementById("confidenceValue");
      const confidenceProgress = document.getElementById("confidenceProgress");

      if (confidenceValue) {
        confidenceValue.textContent = `${confidence}%`;
      }

      if (confidenceProgress) {
        // Update progress bar width and color based on confidence
        confidenceProgress.style.width = `${confidence}%`;

        // Change color based on confidence level
        if (confidence < 0.7) {
          confidenceProgress.classList.remove("bg-eu-orange", "bg-emerald-500");
          confidenceProgress.classList.add("bg-red-500");
        } else if (confidence < 0.9) {
          confidenceProgress.classList.remove("bg-emerald-500", "bg-red-500");
          confidenceProgress.classList.add("bg-eu-orange");
        } else {
          confidenceProgress.classList.remove("bg-eu-orange", "bg-red-500");
          confidenceProgress.classList.add("bg-emerald-500");
        }
      }

      // Update model elements
      const modelElements = document.querySelectorAll(".document-model");
      modelElements.forEach((el) => {
        if (!el.closest("template") && !el.getRootNode().host) {
          // You can update this to show the actual model being used
          const modelName = "gpt-4o";
          el.textContent = modelName;
          el.className = "document-model font-medium text-eu-blue/90";
        }
      });

      // Update status elements
      const statusElements = document.querySelectorAll(".document-status");
      statusElements.forEach((el) => {
        if (!el.closest("template") && !el.getRootNode().host) {
          // You can update this to show the actual status
          const isActive = true; // Set based on your logic
          const statusText = isActive ? "Active" : "Inactive";
          const statusClass = isActive
            ? "bg-emerald-100 text-emerald-800"
            : "bg-gray-100 text-gray-800";
          const dotClass = isActive ? "bg-emerald-500" : "bg-gray-500";

          el.innerHTML = `
            <span class="w-1.5 h-1.5 rounded-full ${dotClass} mr-1.5"></span>
            ${statusText}
          `;
          el.className = `document-status inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`;
        }
      });
    };

    // Run the update and also set up a mutation observer to update when content changes
    updateDocumentStats();

    // Set up a mutation observer to update stats when content changes
    const observer = new MutationObserver(() => {
      updateDocumentStats();
    });

    const documentContent = document.querySelector("#document-content");
    if (documentContent) {
      observer.observe(documentContent, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    // Update all elements with the document-updated class
    const dateElements = document.querySelectorAll(".document-updated");
    dateElements.forEach((el) => {
      if (!el.closest("template") && !el.getRootNode().host) {
        el.textContent = formattedDate;
      }
    });
  }

  async function loadDocumentData() {
    try {
      console.log("Loading document data from NDJSON...");
      const response = await fetch(
        "./assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      documentData = text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line));

      // Store documentData in window for global access
      window.documentData = documentData;
      console.log("Document data loaded successfully", documentData);
      documentDataLoaded = true;

      // Update document metadata (title and last updated date)
      updateDocumentMetadata();

      // Update the document summary after loading
      if (typeof updateEnrichmentSummary === "function") {
        updateEnrichmentSummary(null); // Pass null to show document summary
      }

      // Update the document analysis section with dynamic data
      updateDocumentAnalysis();

      return documentData;
    } catch (error) {
      console.error("Error loading document data:", error);
      throw error;
    }
  }

  // Function to get line content by line number
  function getLineContent(lineNumber) {
    if (!documentData || !Array.isArray(documentData)) {
      console.error("Document data not loaded or invalid");
      return "";
    }

    const line = documentData[lineNumber - 1];
    return line ? line.text || "" : "";
  }

  // Function to update the Document Analysis section with dynamic data
  function updateDocumentAnalysis() {
    if (!documentData || documentData.length === 0) {
      console.warn("No document data available for analysis");
      return;
    }

    // Generate document summary
    const summary = generateDocumentSummary();

    // Calculate total characters
    const totalChars = documentData.reduce((acc, item) => {
      return acc + (item.text ? item.text.length : 0);
    }, 0);

    // Count unique entities
    const entities = new Set();
    documentData.forEach((item) => {
      if (item.enrichment?.entities) {
        item.enrichment.entities.forEach((entity) => entities.add(entity.type));
      }
    });

    // Count unique categories
    const categories = new Set();
    documentData.forEach((item) => {
      if (item.enrichment?.categories) {
        item.enrichment.categories.forEach((cat) => categories.add(cat));
      }
    });

    // Update the Document Analysis section while preserving the header
    const analysisSection = document.querySelector(
      ".document-analysis-section"
    );
    if (analysisSection) {
      // Keep the existing header
      const header = analysisSection.querySelector(".flex.items-center.mb-3");
      const content = `
        <div class="space-y-2.5">
          <div class="flex items-center text-xs text-gray-700">
            <span class="w-20 text-gray-500">Content:</span>
            <span class="document-length font-medium">
              ${totalChars.toLocaleString()} characters • ${summary.totalWords.toLocaleString()} words
            </span>
          </div>
          <div class="flex items-center text-xs text-gray-700">
            <span class="w-20 text-gray-500">Sections:</span>
            <span class="font-medium">${summary.totalSections}</span>
          </div>
          <div class="flex items-center text-xs text-gray-700">
            <span class="w-20 text-gray-500">Entities:</span>
            <span class="font-medium">${entities.size} types</span>
          </div>
          <div class="flex items-center text-xs text-gray-700">
            <span class="w-20 text-gray-500">Categories:</span>
            <span class="font-medium">${categories.size}</span>
          </div>
          <div class="flex items-center text-xs text-gray-700">
            <span class="w-20 text-gray-500">Keywords:</span>
            <span class="font-medium">${
              summary.keywords.length
            } key terms</span>
          </div>
          <div class="flex items-center text-xs text-gray-700">
            <span class="w-20 text-gray-500">Model:</span>
            <span class="font-medium text-eu-blue/90">gpt-4o</span>
          </div>
          <div class="flex items-center text-xs text-gray-700">
            <span class="w-20 text-gray-500">Status:</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              Active
            </span>
          </div>
          <div class="pt-2 text-xs text-gray-500">
            <p>Last analyzed: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;

      // Only replace the content after the header
      const contentDiv = analysisSection.querySelector(".space-y-2.5");
      if (contentDiv) {
        contentDiv.outerHTML = content;
      } else if (header) {
        // If no content div found, insert after header
        header.insertAdjacentHTML("afterend", content);
      } else {
        // Fallback: replace entire content
        analysisSection.innerHTML = `
          <div class="flex items-center mb-3">
            <div class="bg-eu-blue/10 p-1.5 rounded-lg mr-3">
              <i class="fas fa-chart-pie text-eu-blue/80 text-sm"></i>
            </div>
            <h3 class="text-xs font-semibold text-eu-blue/90 uppercase tracking-wider">
              Document Analysis
            </h3>
          </div>
          ${content}
        `;
      }
    }
  }

  // Format enrichment data for display
  function formatEnrichmentData(enrichment) {
    if (!enrichment) return null;
    return {
      title: enrichment.title || "",
      summary: enrichment.summary || "",
      keywords: Array.isArray(enrichment.keywords)
        ? enrichment.keywords.join(", ")
        : "",
      entities: enrichment.entities || [],
      taxonomy: enrichment.taxonomy || {},
      confidence: enrichment.confidence || 0,
      temporal: enrichment.temporal || {},
      geography: enrichment.geography || {},
    };
  }

  // Generate HTML for taxonomy
  function renderTaxonomy(taxonomy) {
    if (!taxonomy)
      return '<div class="text-sm text-gray-500 italic">No taxonomy data</div>';

    return `
      <div class="space-y-3">
        ${Object.entries(taxonomy)
          .map(
            ([key, items]) => `
          <div>
            <h4 class="text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">
              ${key.replace(/_/g, " ")}
            </h4>
            <div class="flex flex-wrap gap-2">
              ${
                Array.isArray(items)
                  ? items
                      .map(
                        (item) => `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ${item}
                </span>
              `
                      )
                      .join("")
                  : "No items"
              }
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  // Curator Studio functionality
  function openCuratorStudio() {
    console.log("Curator Studio button clicked");

    const lineNumberElement = document.querySelector(".document-line.active");
    if (lineNumberElement) {
      const lineNumber = lineNumberElement.dataset.lineNumber;
      const lineElement = document.querySelector(
        `[data-line-number="${lineNumber}"]`
      );
      if (lineElement) {
        console.log("Line element found for line number: " + lineNumber);

        // Get the line content from the NDJSON file
        fetch(
          "assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson"
        )
          .then((response) => response.text())
          .then((ndjsonText) => {
            // Split the NDJSON into individual lines
            const lines = ndjsonText.trim().split("\n");
            // Get the specific line (assuming lineNumber is 1-based)
            const lineContent = lines[lineNumber - 1];
            try {
              // Parse the JSON line
              const data = JSON.parse(lineContent);
              console.log("Line data:", data);

              // Format the line content for display
              const formatLineContent = (line) => {
                if (!line) return "No line selected";
                if (typeof line === "string") return line;
                if (line.text) return line.text;
                return JSON.stringify(line, null, 2);
              };

              // Get the actual line content
              const lineContentDisplay = data
                ? formatLineContent(data.text || data)
                : "No content available";

              // Get enrichment data or use default
              const enrichment = data?.enrichment || {
                title: "",
                summary: "",
                keywords: [],
                entities: [],
                taxonomy: {},
                temporal: {},
                geography: {},
                confidence: 0,
              };

              // Highlight the selected line
              if (lineElement) {
                lineElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                lineElement.classList.add("highlighted");

                // Remove highlight after animation
                setTimeout(() => {
                  if (lineElement) {
                    lineElement.classList.remove("highlighted");
                  }
                }, 2000);
              }

              // Helper function to render entities
              const renderEntities = (entities) => {
                if (!entities || entities.length === 0) {
                  return '<div class="text-sm text-gray-500 py-2">No entities found</div>';
                }
                // Create a document fragment to hold the HTML
                const fragment = document.createDocumentFragment();
                
                entities.forEach(entity => {
                  // Ensure all fields have default values
                  const entityData = {
                    type: entity.type || '',
                    text: entity.text || '',
                    value: entity.value || '',
                    unit: entity.unit || '',
                    confidence: entity.confidence !== undefined ? parseFloat(entity.confidence) : 0.6,
                    description: entity.description || ''
                  };

                  // Create the entity element
                  const entityElement = document.createElement('div');
                  entityElement.className = 'flex items-center justify-between bg-gray-50 p-2 rounded mb-1';
                  
                  // Store all entity data as data attributes
                  Object.entries(entityData).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                      entityElement.setAttribute(`data-entity-${key}`, String(value));
                    }
                  });
                  
                  // Format the display text
                  const displayText = [
                    entityData.text,
                    entityData.value ? `: ${entityData.value}` : '',
                    entityData.unit ? ` ${entityData.unit}` : ''
                  ].join('');
                  
                  entityElement.innerHTML = `
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center">
                        <span class="text-xs font-medium text-gray-900 truncate">${entityData.text}</span>
                        <span class="ml-1 text-xs text-gray-500 whitespace-nowrap">
                          (${entityData.type}${entityData.value ? `: ${entityData.value}` : ''}${entityData.unit ? ` ${entityData.unit}` : ''}${entityData.confidence !== undefined ? ` · ${entityData.confidence.toFixed(2)}` : ''})
                        </span>
                      </div>
                      ${entityData.description ? `<div class="text-xs text-gray-500 mt-1 truncate">${entityData.description}</div>` : ''}
                    </div>
                    <button class="ml-2 text-red-400 hover:text-red-600 flex-shrink-0" data-entity="${entityData.text}">
                      <i class="fas fa-times"></i>
                    </button>
                  `;
                  
                  // Add click handler for the remove button
                  const removeButton = entityElement.querySelector('button[data-entity]');
                  if (removeButton) {
                    removeButton.addEventListener('click', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeEntity(e.target.closest('button'));
                    });
                  }
                  
                  fragment.appendChild(entityElement);
                });
                
                // Convert the fragment to a string for the template literal
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(fragment.cloneNode(true));
                return tempDiv.innerHTML;
              };

              // Helper function to render taxonomy
              const renderTaxonomy = (taxonomy) => {
                if (!taxonomy)
                  return '<div class="text-sm text-gray-500 py-2">No taxonomy data</div>';

                return Object.entries(taxonomy)
                  .map(([category, items]) => {
                    const itemsList = Array.isArray(items)
                      ? items.join(", ")
                      : "";
                    return `
                    <div class="mb-2">
                      <div class="text-xs font-medium text-gray-700">${category}</div>
                      <div class="text-sm text-gray-600">${
                        itemsList || "N/A"
                      }</div>
                    </div>
                  `;
                  })
                  .join("");
              };

              // Create modal HTML
              const modalHTML = `
                <div id="curator-studio-modal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                  <!-- Background overlay with backdrop blur -->
                  <div class="fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-all duration-300" aria-hidden="true"></div>
                  
                  <!-- Modal container -->
                  <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
                    <!-- Modal panel with smooth transition -->
                    <div class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-6xl h-[90vh] flex flex-col border border-gray-200">
                      <!-- Header with gradient background -->
                      <div class="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between rounded-t-xl">
                        <div class="flex items-center space-x-3">
                          <i class="fas fa-edit text-white/90"></i>
                          <h3 class="text-lg font-semibold text-white" id="modal-title">Curator Studio</h3>
                        </div>
                        <button type="button" id="close-curator-modal" class="text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full p-1">
                          <i class="fas fa-times text-xl"></i>
                        </button>
                      </div>
                      
                      <!-- Content area -->
                      <div class="flex-1 overflow-auto p-1 bg-gray-50">
                        <div class="space-y-6 mx-auto w-full">
                          <!-- Selected Content Card -->
                          <div class="p-6">
                            <div class="flex items-center justify-between mb-4">
                              <h4 class="font-medium text-gray-900 flex items-center">
                                <i class="fas fa-align-left text-blue-600 mr-2"></i>
                                Selected Content
                              </h4>
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Line ${lineNumber || "N/A"}
                              </span>
                            </div>
                            <div class="relative">
                              <pre class="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm font-mono overflow-x-auto max-h-60 overflow-y-auto">${lineContentDisplay}</pre>
                              <div class="absolute bottom-2 right-2 flex space-x-2">
                                <button class="text-gray-400 hover:text-gray-600 transition-colors p-1" onclick="navigator.clipboard.writeText('${lineContentDisplay.replace(
                                  /'/g,
                                  "\\'"
                                )}'); this.innerHTML='<i class=\'fas fa-check text-green-500\'></i>';">
                                  <i class="far fa-copy"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Enrichment Data Section -->
                          <div class="p-6">
                            <div class="flex items-center justify-between mb-6">
                              <div>
                                <h4 class="font-medium text-gray-900 text-lg flex items-center">
                                  <i class="fas fa-magic text-blue-600 mr-2"></i>
                                  Enrichment Data
                                </h4>
                                ${
                                  enrichment
                                    ? `
                                  <div class="flex items-center mt-1">
                                    <span class="text-xs font-medium px-2 py-0.5 rounded-full ${
                                      enrichment.confidence > 0.8
                                        ? "bg-green-100 text-green-800"
                                        : enrichment.confidence > 0.5
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }">
                                      Confidence: ${(
                                        enrichment.confidence * 100
                                      ).toFixed(0)}%
                                    </span>
                                    <span class="ml-2 text-xs text-gray-500">
                                      Last updated: ${new Date().toLocaleString()}
                                    </span>
                                  </div>
                                `
                                    : ""
                                }
                              </div>
                            </div>
                            
                            ${
                              enrichment
                                ? `
                              <div class="space-y-6">
                                <!-- Core Information -->
                                <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                                  <button type="button" class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-t-lg" 
                                    data-toggle="collapse" data-target="#coreInfoSection" aria-expanded="true" aria-controls="coreInfoSection">
                                    <div class="flex items-center">
                                      <i class="fas fa-info-circle text-blue-600 mr-3"></i>
                                      <span class="font-medium text-gray-900">Core Information</span>
                                    </div>
                                    <i class="fas fa-chevron-down text-gray-400 transition-transform duration-200 transform" data-chevron></i>
                                  </button>
                                  <div id="coreInfoSection" class="px-4 pb-4 border-t border-gray-100 transition-all duration-200" style="opacity: 1;">
                                    <p class="text-sm text-gray-500 mb-4 mt-2">Basic information including title, summary, and key details about the content.</p>
                                  
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div class="space-y-1">
                                        <div class="flex items-center justify-between">
                                          <label class="block text-sm font-medium text-gray-700">Title</label>
                                          <span class="text-xs text-gray-500">Required</span>
                                        </div>
                                        <input type="text" 
                                          class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 placeholder-gray-400" 
                                          value="${enrichment.title || ""}" 
                                          data-field="title"
                                          placeholder="Enter a descriptive title"
                                          required>
                                      </div>
                                      
                                      <div class="space-y-1">
                                        <div class="flex items-center justify-between">
                                          <label class="block text-sm font-medium text-gray-700">Rhetorical Role</label>
                                          <span class="text-xs text-gray-500">Required</span>
                                        </div>
                                        <select class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" 
                                          data-field="rhetorical_role"
                                          required>
                                          <option value="">Select role</option>
                                          <option value="introduction" ${
                                            enrichment.rhetorical_role ===
                                            "introduction"
                                              ? "selected"
                                              : ""
                                          }>Introduction</option>
                                          <option value="methodology" ${
                                            enrichment.rhetorical_role ===
                                            "methodology"
                                              ? "selected"
                                              : ""
                                          }>Methodology</option>
                                          <option value="results" ${
                                            enrichment.rhetorical_role ===
                                            "results"
                                              ? "selected"
                                              : ""
                                          }>Results</option>
                                          <option value="discussion" ${
                                            enrichment.rhetorical_role ===
                                            "discussion"
                                              ? "selected"
                                              : ""
                                          }>Discussion</option>
                                          <option value="conclusion" ${
                                            enrichment.rhetorical_role ===
                                            "conclusion"
                                              ? "selected"
                                              : ""
                                          }>Conclusion</option>
                                        </select>
                                      </div>
                                    </div>
                                    
                                    <div class="mt-4 space-y-1">
                                      <div class="flex items-center justify-between">
                                        <label class="block text-sm font-medium text-gray-700">Summary</label>
                                        <span class="text-xs text-gray-500">${
                                          enrichment.summary
                                            ? enrichment.summary.length
                                            : 0
                                        }/500 characters</span>
                                      </div>
                                      <textarea rows="3" 
                                        class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 placeholder-gray-400" 
                                        data-field="summary"
                                        placeholder="Provide a brief summary of this content"
                                        maxlength="500">${
                                          enrichment.summary || ""
                                        }</textarea>
                                      <p class="text-xs text-gray-500 mt-1">A clear, concise summary helps with quick understanding of the content.</p>
                                    </div>
                                    
                                    <div class="mt-4 space-y-1">
                                      <label class="block text-sm font-medium text-gray-700">Keywords</label>
                                      <div class="flex items-center flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-10 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200" id="keywords-container">
                                        ${
                                          Array.isArray(enrichment.keywords)
                                            ? enrichment.keywords
                                                .map(
                                                  (keyword) => `
                                          <span class="inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full transition-colors duration-150 ease-in-out" data-keyword="${keyword.trim()}">
                                            ${keyword.trim()}
                                            <button type="button" class="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none focus:text-blue-700 transition-colors" aria-label="Remove keyword">
                                              <i class="fas fa-times"></i>
                                            </button>
                                          </span>
                                        `
                                                )
                                                .join("")
                                            : ""
                                        }
                                        <input type="text" 
                                          class="flex-1 min-w-[100px] border-0 p-0 text-sm focus:ring-0 bg-transparent placeholder-gray-400 focus:outline-none" 
                                          placeholder="Add a keyword and press Enter or comma"
                                          data-field="keywords-input"
                                          id="keywords-input"
                                          autocomplete="off">
                                      </div>
                                      <p class="text-xs text-gray-500 mt-1">Press Enter or comma to add keywords. Click × to remove.</p>
                                    </div>
                                  </div>
                                </div>

                                <!-- Entities & References -->
                                <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                                  <button type="button" class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-t-lg" 
                                    data-toggle="collapse" data-target="#entitiesSection" aria-expanded="true" aria-controls="entitiesSection">
                                    <div class="flex items-center">
                                      <i class="fas fa-tag text-blue-600 mr-3"></i>
                                      <span class="font-medium text-gray-900">Entities & References</span>
                                    </div>
                                    <i class="fas fa-chevron-down text-gray-400 transition-transform duration-200 transform" data-chevron></i>
                                  </button>
                                  <div id="entitiesSection" class="px-4 pb-4 border-t border-gray-100 transition-all duration-200" style="opacity: 1;">
                                    <p class="text-sm text-gray-500 mb-4 mt-2">Key entities, people, organizations, and references mentioned in the content.</p>
                                    <button type="button" id="add-entity-trigger-button"
                                      class="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                      data-action="add-entity">
                                      <i class="fas fa-plus mr-1"></i> Add Entity
                                    </button>
                                    <!-- Collapsible form for adding entity -->
                                    <div id="add-entity-form" class="hidden mt-4 space-y-4 border border-gray-200 p-4 rounded-md bg-gray-50 transition-all duration-200">
                                      <div class="space-y-1">
                                        <label class="block text-sm font-medium text-gray-700">Entity Name</label>
                                        <input type="text" class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 placeholder-gray-400" placeholder="Enter entity name" data-entity="name">
                                      </div>
                                      <div class="space-y-1">
                                        <label class="block text-sm font-medium text-gray-700">Entity Type</label>
                                        <select class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" data-entity="type">
                                          <option value="">Select type</option>
                                          <option value="person">Person</option>
                                          <option value="organization">Organization</option>
                                          <option value="location">Location</option>
                                          <option value="concept">Concept</option>
                                        </select>
                                      </div>
                                      <div class="space-y-1">
                                        <label class="block text-sm font-medium text-gray-700">Entity Value</label>
                                        <input type="text" class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 placeholder-gray-400" placeholder="Enter entity value" data-entity="value">
                                      </div>
                                      <div class="space-y-1">
                                        <label class="block text-sm font-medium text-gray-700">Entity Unit</label>
                                        <input type="text" class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 placeholder-gray-400" placeholder="Enter unit (e.g., kg, $, %)" data-entity="unit">
                                      </div>
                                      <div class="space-y-2">
                                        <div class="flex justify-between items-center">
                                          <label class="block text-sm font-medium text-gray-700">Confidence</label>
                                          <span id="confidence-value" class="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">0.60</span>
                                        </div>
                                        <div class="relative pt-1">
                                          <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.01" 
                                            value="0.6" 
                                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            data-entity="confidence"
                                            oninput="document.getElementById('confidence-value').textContent = parseFloat(this.value).toFixed(2)"
                                          >
                                          <div class="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>0.00</span>
                                            <span>1.00</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div class="space-y-1">
                                        <label class="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea rows="2" class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 placeholder-gray-400" placeholder="Brief description" data-entity="description"></textarea>
                                      </div>
                                      <div class="flex justify-end space-x-2">
                                        <button type="button" class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" data-action="cancel-add-entity">Close</button>
                                        <button type="button" id="add-entity-button" class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" data-action="add-entity">Add</button>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="p-4">
                                    <div class="entity-list space-y-3" data-field="entities">
                                      ${renderEntities(
                                        (enrichment.entities || []).map(e => ({
                                          type: e.type || '',
                                          text: e.text || '',
                                          value: e.value || '',
                                          unit: e.unit || '',
                                          confidence: e.confidence !== undefined ? parseFloat(e.confidence) : 0.6,
                                          description: e.description || ''
                                        }))
                                      )}
                                    </div>
                                    <div class="mt-3 text-sm text-gray-500">
                                      <i class="fas fa-info-circle mr-1"></i> Add entities like people, organizations, or concepts mentioned in the text.
                                    </div>
                                  </div>
                                </div>
                                </div>

                                <!-- Taxonomy & Classification -->
                                <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200 mt-6">
                                  <button type="button" class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-t-lg" 
                                    data-toggle="collapse" data-target="#taxonomySection" aria-expanded="true" aria-controls="taxonomySection">
                                    <div class="flex items-center">
                                      <i class="fas fa-tags text-blue-600 mr-3"></i>
                                      <span class="font-medium text-gray-900">Taxonomy & Classification</span>
                                    </div>
                                    <i class="fas fa-chevron-down text-gray-400 transition-transform duration-200 transform" data-chevron></i>
                                  </button>
                                  <div id="taxonomySection" class="px-4 pb-4 border-t border-gray-100 transition-all duration-200" style="opacity: 1;">
                                    <p class="text-sm text-gray-500 mb-4 mt-2">Categorization and classification of the content using predefined taxonomies and custom categories.</p>
                                  <div>
                                    <div class="space-y-4" id="taxonomy-container" data-field="taxonomy">
                                      ${Object.entries(
                                        enrichment.taxonomy || {}
                                      )
                                        .map(
                                          ([category, keywords]) => `
                                        <div class="space-y-2 taxonomy-category" data-category="${category}">
                                          <div class="flex items-center justify-between">
                                            <h4 class="text-sm font-medium text-gray-900">
                                              ${category
                                                .split("_")
                                                .map(
                                                  (word) =>
                                                    word
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                    word.slice(1)
                                                )
                                                .join(" ")}
                                            </h4>
                                            <button type="button" class="text-xs text-red-500 hover:text-red-700 focus:outline-none" data-action="remove-taxonomy-category" data-category="${category}">
                                              <i class="fas fa-times"></i>
                                            </button>
                                          </div>
                                          <div class="flex items-center flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-10 bg-white">
                                            ${(Array.isArray(keywords)
                                              ? keywords
                                              : []
                                            )
                                              .map(
                                                (keyword) => `
                                              <span class="inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full transition-colors">
                                                ${keyword.trim()}
                                                <button type="button" class="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none" data-action="remove-taxonomy-keyword" data-category="${category}" data-keyword="${keyword.trim()}">
                                                  <i class="fas fa-times"></i>
                                                </button>
                                              </span>
                                            `
                                              )
                                              .join("")}
                                            <input type="text" 
                                              class="flex-1 min-w-[100px] border-0 p-0 text-sm focus:ring-0 bg-transparent placeholder-gray-400 focus:outline-none" 
                                              placeholder="Add a keyword and press Enter or comma"
                                              data-taxonomy-category="${category}"
                                              data-field="taxonomy-keyword-input"
                                              autocomplete="off">
                                          </div>
                                          <p class="text-xs text-gray-500 mt-1">Press Enter or comma to add keywords. Click × to remove.</p>
                                        </div>
                                      `
                                        )
                                        .join("")}
                                      
                                      <!-- Add new taxonomy category -->
                                      <div class="space-y-2 mt-6 pt-4 border-t border-gray-200" id="add-category-section">
                                        <label class="block text-sm font-medium text-gray-700">Add New Taxonomy Category</label>
                                        <div class="flex flex-col sm:flex-row gap-2 w-full">
                                          <input type="text" 
                                            id="new-category-input"
                                            class="w-full sm:flex-1 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 sm:py-2" 
                                            placeholder="Category name"
                                            data-field="new-taxonomy-category">
                                          <button type="button" 
                                            id="add-category-btn"
                                            class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
                                            data-action="add-taxonomy-category">
                                            Add Category
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="mt-3 text-sm text-gray-500">
                                      <i class="fas fa-info-circle mr-1"></i> Categorize this content using the <span class="underlined underline-off-set-4">taxonomy classification</span>.
                                    </div>
                                  </div>
                                </div>
                                </div>

                                <!-- Temporal Information -->
                                <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200 mt-6">
                                  <button type="button" class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-t-lg" 
                                    data-toggle="collapse" data-target="#temporalSection" aria-expanded="true" aria-controls="temporalSection">
                                    <div class="flex items-center">
                                      <i class="far fa-clock text-blue-600 mr-3"></i>
                                      <span class="font-medium text-gray-900">Temporal Information</span>
                                    </div>
                                    <i class="fas fa-chevron-down text-gray-400 transition-transform duration-200 transform" data-chevron></i>
                                  </button>
                                  <div id="temporalSection" class="px-4 pb-4 border-t border-gray-100 transition-all duration-200" style="opacity: 1;">
                                    <p class="text-sm text-gray-500 mb-4 mt-2">Time-related information and relevance period for this content.</p>
                                  <div class="space-y-4">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div class="space-y-1">
                                        <label class="block text-sm font-medium text-gray-700">Start Date</label>
                                        <input type="date" 
                                          class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" 
                                          value="${
                                            enrichment.temporal?.start_date ||
                                            ""
                                          }" 
                                          data-field="temporal.start_date">
                                      </div>
                                      <div class="space-y-1">
                                        <label class="block text-sm font-medium text-gray-700">End Date</label>
                                        <input type="date" 
                                          class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" 
                                          value="${
                                            enrichment.temporal?.end_date || ""
                                          }" 
                                          data-field="temporal.end_date">
                                      </div>
                                    </div>
                                    <div class="space-y-1">
                                      <label class="block text-sm font-medium text-gray-700">Dates Mentioned</label>
                                      <div class="flex items-center flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-10 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200" id="dates-mentioned-container">
                                        ${
                                          Array.isArray(
                                            enrichment.temporal?.dates_mentioned
                                          )
                                            ? enrichment.temporal.dates_mentioned
                                                .map(
                                                  (mention) => `
                                          <span class="inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full transition-colors duration-150 ease-in-out" data-date-mention="${mention.trim()}">
                                            ${mention.trim()}
                                            <button type="button" class="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none focus:text-blue-700 transition-colors" aria-label="Remove date mention">
                                              <i class="fas fa-times"></i>
                                            </button>
                                          </span>
                                        `
                                                )
                                                .join("")
                                            : ""
                                        }
                                        <input type="text" 
                                          class="flex-1 min-w-[100px] border-0 p-0 text-sm focus:ring-0 bg-transparent placeholder-gray-400 focus:outline-none" 
                                          placeholder="Add a date mention and press Enter or comma"
                                          data-field="dates-mentioned-input"
                                          id="dates-mentioned-input"
                                          autocomplete="off">
                                      </div>
                                      <p class="text-xs text-gray-500 mt-1">Press Enter or comma to add dates mentioned. Click × to remove.</p>
                                    </div>
                                  </div>
                                </div>
                                </div>

                                <!-- Geographic Coverage -->
                                <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200 mt-6">
                                  <button type="button" class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-t-lg" 
                                    data-toggle="collapse" data-target="#geographySection" aria-expanded="true" aria-controls="geographySection">
                                    <div class="flex items-center">
                                      <i class="fas fa-globe-africa text-blue-600 mr-3"></i>
                                      <span class="font-medium text-gray-900">Geographic Coverage</span>
                                    </div>
                                    <i class="fas fa-chevron-down text-gray-400 transition-transform duration-200 transform" data-chevron></i>
                                  </button>
                                  <div id="geographySection" class="px-4 pb-4 border-t border-gray-100 transition-all duration-200" style="opacity: 1;">
                                    <p class="text-sm text-gray-500 mb-4 mt-2">Geographic locations, regions, and areas relevant to this content.</p>
                                  <div class="space-y-4">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div class="space-y-1">
                                        <label class="block text-sm font-medium text-gray-700">Regions</label>
                                        <select multiple 
                                          class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" 
                                          data-field="geography.regions"
                                          data-placeholder="Select regions...">
                                          <option value="" disabled>Select regions...</option>
                                          <option value="europe" ${
                                            enrichment.geography?.regions?.includes(
                                              "europe"
                                            )
                                              ? "selected"
                                              : ""
                                          }>Europe</option>
                                          <option value="north-america" ${
                                            enrichment.geography?.regions?.includes(
                                              "north-america"
                                            )
                                              ? "selected"
                                              : ""
                                          }>North America</option>
                                          <option value="south-america" ${
                                            enrichment.geography?.regions?.includes(
                                              "south-america"
                                            )
                                              ? "selected"
                                              : ""
                                          }>South America</option>
                                          <option value="asia" ${
                                            enrichment.geography?.regions?.includes(
                                              "asia"
                                            )
                                              ? "selected"
                                              : ""
                                          }>Asia</option>
                                          <option value="africa" ${
                                            enrichment.geography?.regions?.includes(
                                              "africa"
                                            )
                                              ? "selected"
                                              : ""
                                          }>Africa</option>
                                          <option value="oceania" ${
                                            enrichment.geography?.regions?.includes(
                                              "oceania"
                                            )
                                              ? "selected"
                                              : ""
                                          }>Oceania</option>
                                          <option value="middle-east" ${
                                            enrichment.geography?.regions?.includes(
                                              "middle-east"
                                            )
                                              ? "selected"
                                              : ""
                                          }>Middle East</option>
                                        </select>
                                      </div>
                                      <div class="space-y-1">
                                        <label class="block text-sm font-medium text-gray-700">Countries</label>
                                        <select multiple 
                                          class="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" 
                                          data-field="geography.countries"
                                          data-placeholder="Select countries...">
                                          <option value="" disabled>Select countries...</option>
                                          <option value="US" ${
                                            enrichment.geography?.countries?.includes(
                                              "US"
                                            )
                                              ? "selected"
                                              : ""
                                          }>United States</option>
                                          <option value="GB" ${
                                            enrichment.geography?.countries?.includes(
                                              "GB"
                                            )
                                              ? "selected"
                                              : ""
                                          }>United Kingdom</option>
                                          <option value="DE" ${
                                            enrichment.geography?.countries?.includes(
                                              "DE"
                                            )
                                              ? "selected"
                                              : ""
                                          }>Germany</option>
                                          <option value="FR" ${
                                            enrichment.geography?.countries?.includes(
                                              "FR"
                                            )
                                              ? "selected"
                                              : ""
                                          }>France</option>
                                          <option value="IT" ${
                                            enrichment.geography?.countries?.includes(
                                              "IT"
                                            )
                                              ? "selected"
                                              : ""
                                          }>Italy</option>
                                          <option value="ES" ${
                                            enrichment.geography?.countries?.includes(
                                              "ES"
                                            )
                                              ? "selected"
                                              : ""
                                          }>Spain</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div class="space-y-1">
                                      <label class="block text-sm font-medium text-gray-700">Country Codes</label>
                                      <div class="flex items-center flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-10 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200" id="country-codes-container">
                                        ${
                                          Array.isArray(
                                            enrichment.geography?.country_codes
                                          )
                                            ? enrichment.geography.country_codes
                                                .map(
                                                  (code) => `
                                          <span class="inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full transition-colors duration-150 ease-in-out" data-country-code="${code.trim()}">
                                            ${code.trim()}
                                            <button type="button" class="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none focus:text-blue-700 transition-colors" aria-label="Remove country code">
                                              <i class="fas fa-times"></i>
                                            </button>
                                          </span>
                                        `
                                                )
                                                .join("")
                                            : ""
                                        }
                                        <input type="text" 
                                          class="flex-1 min-w-[100px] border-0 p-0 text-sm focus:ring-0 bg-transparent placeholder-gray-400 focus:outline-none" 
                                          placeholder="Add a country code and press Enter or comma"
                                          data-field="country-codes-input"
                                          id="country-codes-input"
                                          autocomplete="off">
                                      </div>
                                      <p class="text-xs text-gray-500 mt-1">Press Enter or comma to add country codes. Click × to remove.</p>
                                    </div>
                                  </div>
                                </div>
                              `
                                : `
                                <div class="text-center py-8">
                                  <i class="fas fa-exclamation-triangle text-yellow-500 text-3xl mb-2"></i>
                                  <p class="text-gray-600">No enrichment data available for this line.</p>
                                  <button type="button" class="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    <i class="fas fa-plus mr-2"></i> Add Enrichment Data
                                  </button>
                                </div>
                              `
                            }
                            </div>
                          </div>
                        </div>
                      </div>          
                      <!-- Footer -->
                      <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200">
                        <button type="button" class="inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:ml-3 sm:w-auto" id="submit-curator">
                          Submit
                        </button>
                        <button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto" id="cancel-curator">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `;

              // Add modal to the body
              document.body.insertAdjacentHTML("beforeend", modalHTML);

              // Prevent body scroll when modal is open
              document.body.style.overflow = "hidden";

              // Add event listeners
              document
                .getElementById("close-curator-modal")
                .addEventListener("click", closeCuratorModal);
              document
                .getElementById("cancel-curator")
                .addEventListener("click", closeCuratorModal);
              document
                .getElementById("submit-curator")
                .addEventListener("click", submitCuratorForm);

              // Add comma-separated keywords functionality
              const keywordsInput = document.getElementById("keywords-input");
              const keywordsContainer =
                document.getElementById("keywords-container");

              // Function to handle keyword removal
              const removeKeyword = (keywordElement) => {
                keywordElement.classList.add(
                  "opacity-0",
                  "scale-95",
                  "transition-all",
                  "duration-200"
                );
                setTimeout(() => {
                  keywordElement.remove();
                }, 200);
              };

              if (keywordsInput && keywordsContainer) {
                // Handle all remove button clicks through delegation
                keywordsContainer.addEventListener("click", (e) => {
                  const removeBtn = e.target.closest("button");
                  if (removeBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const keywordElement = removeBtn.closest("[data-keyword]");
                    if (keywordElement) {
                      removeKeyword(keywordElement);
                    }
                  }
                });

                // Add hover effect for all keyword elements
                keywordsContainer.addEventListener("mouseover", (e) => {
                  const keywordElement = e.target.closest("[data-keyword]");
                  if (keywordElement) {
                    keywordElement.classList.add("bg-blue-100");
                  }
                });

                keywordsContainer.addEventListener("mouseout", (e) => {
                  const keywordElement = e.target.closest("[data-keyword]");
                  if (keywordElement) {
                    keywordElement.classList.remove("bg-blue-100");
                  }
                });

                const addKeyword = (keyword) => {
                  keyword = keyword.trim();
                  if (!keyword) return;

                  // Check if keyword already exists
                  const existingKeywords = Array.from(
                    keywordsContainer.querySelectorAll("[data-keyword]")
                  );
                  const keywordExists = existingKeywords.some(
                    (el) =>
                      el.getAttribute("data-keyword")?.toLowerCase() ===
                      keyword.toLowerCase()
                  );

                  if (keywordExists) {
                    // Highlight existing keyword briefly
                    const existingEl = existingKeywords.find(
                      (el) =>
                        el.getAttribute("data-keyword")?.toLowerCase() ===
                        keyword.toLowerCase()
                    );
                    if (existingEl) {
                      existingEl.classList.add("ring-2", "ring-blue-500");
                      setTimeout(() => {
                        existingEl.classList.remove("ring-2", "ring-blue-500");
                      }, 1000);
                    }
                    return;
                  }

                  // Create keyword element
                  const keywordElement = document.createElement("span");
                  keywordElement.className =
                    "inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full transition-all duration-200 ease-out";
                  keywordElement.setAttribute("data-keyword", keyword);
                  keywordElement.innerHTML = `
                    ${keyword}
                    <button type="button" class="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none focus:text-blue-700 transition-colors" aria-label="Remove keyword">
                      <i class="fas fa-times"></i>
                    </button>
                  `;

                  // Insert before the input
                  keywordsContainer.insertBefore(keywordElement, keywordsInput);

                  // Animate in
                  setTimeout(() => {
                    keywordElement.classList.add("opacity-100", "scale-100");
                  }, 10);

                  // Clear input
                  keywordsInput.value = "";
                };

                // Handle both Enter and Comma keys
                keywordsInput.addEventListener("keydown", (e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const keyword = keywordsInput.value.trim();
                    if (keyword) {
                      addKeyword(keyword);
                    }
                  }
                });

                // Also handle input for comma separation
                keywordsInput.addEventListener("input", (e) => {
                  const value = e.target.value;
                  if (value.includes(",")) {
                    const keyword = value.replace(/,/g, "").trim();
                    if (keyword) {
                      addKeyword(keyword);
                    }
                  }
                });

                // Handle Enter key and comma
                keywordsInput.addEventListener("keydown", (e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const keyword = keywordsInput.value.trim();
                    if (keyword) {
                      addKeyword(keyword);
                    }
                  }
                });

                // Handle pasting text with commas
                keywordsInput.addEventListener("paste", (e) => {
                  e.preventDefault();
                  const pastedText = (
                    e.clipboardData || window.clipboardData
                  ).getData("text");
                  const keywords = pastedText
                    .split(",")
                    .map((k) => k.trim())
                    .filter((k) => k);
                  keywords.forEach((keyword) => addKeyword(keyword));
                });
              }

              // Close modal when clicking outside content
              document
                .querySelector("#curator-studio-modal > div")
                .addEventListener("click", function (e) {
                  if (e.target === this) {
                    closeCuratorModal();
                  }
                });

              // Initialize country codes functionality (same as keywords)
              const countryCodesInput = document.getElementById(
                "country-codes-input"
              );
              const countryCodesContainer = document.getElementById(
                "country-codes-container"
              );

              if (countryCodesInput && countryCodesContainer) {
                // Handle all remove button clicks through delegation
                document.addEventListener('click', function(e) {
                  const removeButton = e.target.closest('button[data-entity]');
                  if (removeButton) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const entityText = removeButton.getAttribute('data-entity');
                    const entityElement = removeButton.closest('.flex.items-center.justify-between');
                    
                    if (entityElement) {
                      // Show confirmation dialog
                      Swal.fire({
                        title: 'Remove Entity',
                        text: `Are you sure you want to remove the entity "${entityText}"?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, remove it!',
                        reverseButtons: true,
                        focusConfirm: false,
                        customClass: {
                          confirmButton: 'px-4 py-2 text-sm font-medium rounded-md',
                          cancelButton: 'px-4 py-2 text-sm font-medium rounded-md mr-2'
                        }
                      }).then((result) => {
                        if (result.isConfirmed) {
                          // Remove the entity element
                          entityElement.remove();
                          
                          // Show success message
                          const Toast = Swal.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true,
                            didOpen: (toast) => {
                              toast.addEventListener('mouseenter', Swal.stopTimer);
                              toast.addEventListener('mouseleave', Swal.resumeTimer);
                            }
                          });
                          
                          Toast.fire({
                            icon: 'success',
                            title: `Entity "${entityText}" removed`
                          });
                          
                          // If no entities left, show the empty state
                          const entitiesContainer = document.querySelector('.entity-list.space-y-3');
                          if (entitiesContainer && entitiesContainer.children.length === 0) {
                            const emptyState = document.createElement('div');
                            emptyState.className = 'text-sm text-gray-500 py-4 text-center';
                            emptyState.textContent = 'No entities found';
                            entitiesContainer.appendChild(emptyState);
                          }
                        }
                      });
                    }
                  }
                });

                // Add hover effect for all country code elements
                countryCodesContainer.addEventListener("mouseover", (e) => {
                  const codeElement = e.target.closest("[data-country-code]");
                  if (codeElement) {
                    codeElement.classList.add("bg-blue-100");
                  }
                });

                countryCodesContainer.addEventListener("mouseout", (e) => {
                  const codeElement = e.target.closest("[data-country-code]");
                  if (codeElement) {
                    codeElement.classList.remove("bg-blue-100");
                  }
                });

                const addCountryCode = (code) => {
                  code = code.trim().toUpperCase();
                  if (!code) return;

                  // Check if code already exists
                  const existingCodes = Array.from(
                    countryCodesContainer.querySelectorAll(
                      "[data-country-code]"
                    )
                  );
                  const codeExists = existingCodes.some(
                    (el) => el.getAttribute("data-country-code") === code
                  );

                  if (codeExists) {
                    // Highlight existing code briefly
                    const existingEl = existingCodes.find(
                      (el) => el.getAttribute("data-country-code") === code
                    );
                    if (existingEl) {
                      existingEl.classList.add("ring-2", "ring-blue-500");
                      setTimeout(() => {
                        existingEl.classList.remove("ring-2", "ring-blue-500");
                      }, 1000);
                    }
                    return;
                  }

                  // Create code element
                  const codeElement = document.createElement("span");
                  codeElement.className =
                    "inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full transition-all duration-200 ease-out";
                  codeElement.setAttribute("data-country-code", code);
                  codeElement.innerHTML = `
                    ${code}
                    <button type="button" class="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none focus:text-blue-700 transition-colors" aria-label="Remove country code">
                      <i class="fas fa-times"></i>
                    </button>
                  `;

                  // Insert before the input
                  countryCodesContainer.insertBefore(
                    codeElement,
                    countryCodesInput
                  );

                  // Animate in
                  setTimeout(() => {
                    codeElement.classList.add("opacity-100", "scale-100");
                  }, 10);

                  // Clear input
                  countryCodesInput.value = "";
                };

                // Handle both Enter and Comma keys
                countryCodesInput.addEventListener("keydown", (e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const code = countryCodesInput.value.trim();
                    if (code) {
                      addCountryCode(code);
                    }
                  }
                });

                // Also handle input for comma separation
                countryCodesInput.addEventListener("input", (e) => {
                  const value = e.target.value;
                  if (value.includes(",")) {
                    const code = value.replace(/,/g, "").trim();
                    if (code) {
                      addCountryCode(code);
                    }
                  }
                });
              }

              // Close on Escape key
              document.addEventListener("keydown", handleEscapeKey);

              // Initialize collapsible sections
              initCollapsibleSections();
            } catch (e) {
              console.error("Error parsing JSON line:", e);
              // Show error to user
              alert("Error loading document data. Please try again.");
            }
          })
          .catch((error) => {
            console.error("Error loading NDJSON file:", error);
            // Show error to user
            alert("Error loading document. Please try again.");
          });
      }
    }
  }

  // Handle Escape key
  function handleEscapeKey(e) {
    if (e.key === "Escape") {
      closeCuratorModal();
    }
  }

  // Toggle collapsible sections
  function toggleCollapse(button) {
    const targetId = button.getAttribute("data-target");
    const target = document.querySelector(targetId);
    const chevron = button.querySelector("[data-chevron]");
    const isExpanded = button.getAttribute("aria-expanded") === "true";

    // Toggle aria-expanded
    button.setAttribute("aria-expanded", !isExpanded);

    // Toggle chevron rotation
    if (chevron) {
      chevron.style.transform = isExpanded ? "rotate(0deg)" : "rotate(180deg)";
      chevron.style.transition = "transform 0.2s ease-in-out";
    }

    // Toggle content visibility with animation
    if (target) {
      if (isExpanded) {
        // Collapse
        target.style.maxHeight = target.scrollHeight + "px";
        // Force reflow
        target.offsetHeight;
        target.style.maxHeight = "0";
        target.style.overflow = "hidden";
        target.style.opacity = "0";
        target.style.transition =
          "max-height 0.25s ease-out, opacity 0.15s ease-out";
      } else {
        // Expand
        target.style.display = "block";
        target.style.maxHeight = "0";
        target.style.opacity = "0";
        // Force reflow
        target.offsetHeight;
        target.style.maxHeight = target.scrollHeight + "px";
        target.style.opacity = "1";
        target.style.overflow = "visible";
        target.style.transition =
          "max-height 0.25s ease-in, opacity 0.15s ease-in";
      }
    }
  }

  // Initialize collapsible sections
  function initCollapsibleSections() {
    const toggles = document.querySelectorAll('[data-toggle="collapse"]');

    toggles.forEach((toggle) => {
      const targetId = toggle.getAttribute("data-target");
      const target = document.querySelector(targetId);
      const chevron = toggle.querySelector("[data-chevron]");

      if (target) {
        // Set initial state
        const isExpanded = toggle.getAttribute("aria-expanded") === "true";

        // Add initial styles
        target.style.transition =
          "max-height 0.25s ease-in-out, opacity 0.15s ease-in-out";
        target.style.overflow = "hidden";

        if (isExpanded) {
          target.style.maxHeight = "none";
          target.style.opacity = "1";
          if (chevron) {
            chevron.style.transform = "rotate(180deg)";
            chevron.style.transition = "transform 0.2s ease-in-out";
          }
        } else {
          target.style.maxHeight = "0";
          target.style.opacity = "0";
          if (chevron) {
            chevron.style.transform = "rotate(0deg)";
            chevron.style.transition = "transform 0.2s ease-in-out";
          }
        }

        // Add click handler
        toggle.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleCollapse(toggle);
        });
      }
    });
  }

  // Close modal and clean up
  function closeCuratorModal() {
    const modal = document.getElementById("curator-studio-modal");
    if (modal) {
      // Clean up event listeners
      const toggles = modal.querySelectorAll('[data-toggle="collapse"]');
      toggles.forEach((toggle) => {
        toggle.removeEventListener("click", toggleCollapse);
      });

      // Remove modal
      modal.remove();
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscapeKey);
    }
  }

  // Submit form
  function submitCuratorForm() {
    // Get the form data
    const formData = {
      // Core Information
      title: document.querySelector('input[data-field="title"]')?.value,
      rhetorical_role: document.querySelector('select[data-field="rhetorical_role"]')?.value,
      summary: document.querySelector('textarea[data-field="summary"]')?.value,
      keywords: Array.from(document.querySelectorAll('#keywords-container [data-keyword]'))
        .map(el => el.getAttribute('data-keyword')),
      
      // Entities - extract all available fields from the model
      entities: Array.from(document.querySelectorAll('.entity-list [data-entity-text]')).map(el => {
        // Get all data attributes from the element
        const getDataAttr = (name, defaultValue = '') => {
          const value = el.getAttribute(`data-entity-${name}`);
          return value !== null ? value : defaultValue;
        };
        
        // Get numeric attributes with proper parsing
        const getNumericAttr = (name, defaultValue = 0) => {
          const value = el.getAttribute(`data-entity-${name}`);
          return value !== null ? parseFloat(value) || defaultValue : defaultValue;
        };
        
        // Build the entity object with all available fields
        return {
          // Core fields
          type: getDataAttr('type', 'unknown'),
          text: getDataAttr('text', ''),
          
          // Optional fields with proper type conversion
          value: getDataAttr('value', ''),
          unit: getDataAttr('unit', ''),
          description: getDataAttr('description', ''),
          
          // Numeric fields with proper parsing
          confidence: getNumericAttr('confidence', 0.9),
        };
      }),
      
      // Taxonomy
      taxonomy: Array.from(document.querySelectorAll('.taxonomy-category')).reduce((acc, el) => {
        const category = el.getAttribute('data-category');
        const keywords = Array.from(el.querySelectorAll('[data-keyword]'))
          .map(k => k.getAttribute('data-keyword'));
        acc[category] = keywords;
        return acc;
      }, {}),
      
      // Temporal Information
      temporal: {
        start_date: document.querySelector('input[data-field="temporal.start_date"]')?.value,
        end_date: document.querySelector('input[data-field="temporal.end_date"]')?.value,
        dates_mentioned: Array.from(document.querySelectorAll('#dates-mentioned-container [data-date-mention]'))
          .map(el => el.getAttribute('data-date-mention'))
      },
      
      // Geographic Information
      geography: {
        regions: Array.from(document.querySelectorAll('select[data-field="geography.regions"] option:checked'))
          .map(opt => opt.value)
          .filter(Boolean),
        countries: Array.from(document.querySelectorAll('select[data-field="geography.countries"] option:checked'))
          .map(opt => opt.value)
          .filter(Boolean),
        country_codes: Array.from(document.querySelectorAll('#country-codes-container [data-country-code]'))
          .map(el => el.getAttribute('data-country-code'))
      }
    };

    // Log the form data
    console.log("Form data:", JSON.stringify(formData, null, 2));
    
    // Close the modal
    // closeCuratorModal();
  }

  // Make functions available globally
  window.DoccanoApp = window.DoccanoApp || {};
  window.DoccanoApp.loadDocumentContent = loadDocumentContent;
  window.DoccanoApp.getLineContent = getLineContent;
  window.DoccanoApp.openPdfViewer = openPdfViewer;
  window.DoccanoApp.openPdfViewer = openPdfViewer;

  // Helper function to get confidence from annotation data
  function getConfidenceFromAnnotation(annotation) {
    try {
      // Check if annotation has confidence data
      if (annotation.confidence !== undefined) {
        return parseFloat(annotation.confidence);
      }

      // Check if annotation has metadata with confidence
      if (annotation.meta && annotation.meta.confidence) {
        return parseFloat(annotation.meta.confidence);
      }

      // Default confidence if not specified
      return 0.92;
    } catch (error) {
      console.error("Error getting confidence from annotation:", error);
      return 0.92; // Default confidence on error
    }
  }

  // Toggle entity form visibility
  function toggleEntityForm(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      console.log('Toggle form called from:', event.target);
    } else {
      console.log('Toggle form called programmatically');
    }
    
    const form = document.getElementById('add-entity-form');
    const button = document.getElementById('add-entity-trigger-button');
    
    if (!form || !button) {
      console.error('Could not find form or button:', { form, button });
      return;
    }
    
    const isHidden = form.classList.contains('hidden');
    
    console.log('Form is currently:', isHidden ? 'hidden' : 'visible');
    
    if (isHidden) {
      // Show the form
      console.log('Showing form');
      form.classList.remove('hidden');
      form.style.display = 'block';
      form.style.maxHeight = form.scrollHeight + 'px';
      button.disabled = true;
      button.classList.add('opacity-50', 'cursor-not-allowed');
      
      // Focus on the first input field when showing the form
      const firstInput = form.querySelector('input, select, textarea');
      if (firstInput) {
        setTimeout(() => {
          firstInput.focus();
          firstInput.select();
        }, 50);
      }
    } else {
      // Hide the form
      console.log('Hiding form');
      form.classList.add('hidden');
      form.style.maxHeight = '0';
      form.style.display = 'none';
      button.disabled = false;
      button.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // Handle entity removal
  function removeEntity(button) {
    const entityElement = button.closest('.flex.items-center.justify-between.bg-gray-50.p-2.rounded.mb-1');
    const entityName = button.getAttribute('data-entity');
    
    if (!entityElement || !entityName) {
      console.error('Could not find entity element or name');
      return;
    }
    
    // Show confirmation dialog
    Swal.fire({
      title: 'Remove Entity',
      text: `Are you sure you want to remove the entity "${entityName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!',
      reverseButtons: true,
      focusConfirm: false,
      customClass: {
        confirmButton: 'px-4 py-2 text-sm font-medium rounded-md',
        cancelButton: 'px-4 py-2 text-sm font-medium rounded-md mr-2'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove the entity element
        entityElement.remove();
        
        // Show success message
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
          }
        });
        
        Toast.fire({
          icon: 'success',
          title: `Entity "${entityName}" removed`
        });
        
        // If no entities left, show the empty state
        const entitiesContainer = document.querySelector('.entity-list.space-y-3');
        if (entitiesContainer && entitiesContainer.children.length === 0) {
          console.log('No entities left, showing empty state');
          const emptyState = document.createElement('div');
          emptyState.className = 'text-sm text-gray-500 py-4 text-center';
          emptyState.textContent = 'No entities found';
          entitiesContainer.appendChild(emptyState);
        }
      }
    });
  }

  // Handle entity record addition
  function handleEntityAddition(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      console.warn('handleEntityAddition called without event object');
    }
    
    console.log('=== Add Button Clicked ===');
    console.log('Event:', event);
    
    // Log the target that was clicked
    if (event && event.target) {
      console.log('Clicked element:', {
        tag: event.target.tagName,
        id: event.target.id,
        class: event.target.className,
        html: event.target.outerHTML
      });
    }
    
    // Get form values
    const nameInput = document.querySelector('[data-entity="name"]');
    const typeSelect = document.querySelector('select[data-entity="type"]');
    const descriptionInput = document.querySelector('[data-entity="description"]');
    
    // Log all form inputs and their values
    console.log('--- Form Inputs ---');
    console.log('Name input:', nameInput ? {
      value: nameInput.value,
      required: nameInput.required,
      disabled: nameInput.disabled
    } : 'Not found');
    
    console.log('Type select:', typeSelect ? {
      value: typeSelect.value,
      options: Array.from(typeSelect.options).map(opt => ({
        value: opt.value,
        text: opt.text,
        selected: opt.selected
      })),
      required: typeSelect.required,
      disabled: typeSelect.disabled
    } : 'Not found');
    
    console.log('Description input:', descriptionInput ? {
      value: descriptionInput.value,
      required: descriptionInput.required,
      disabled: descriptionInput.disabled
    } : 'Not found');
    
    // Log the form element itself
    const form = event && event.target && event.target.closest('form');
    console.log('Form element:', form ? {
      id: form.id,
      class: form.className,
      method: form.method,
      action: form.action,
      elements: Array.from(form.elements).map(el => ({
        name: el.name,
        type: el.type,
        value: el.value,
        checked: el.checked,
        selected: el.selected
      }))
    } : 'No form element found');
    
    if (!nameInput || !typeSelect) {
      console.error('Required form elements not found');
      return;
    }
    
    // Validate required fields
    let isValid = true;
    if (!nameInput.value.trim()) {
      nameInput.classList.add('border-red-500');
      nameInput.focus();
      isValid = false;
    } else {
      nameInput.classList.remove('border-red-500');
    }
    
    if (!typeSelect.value) {
      typeSelect.classList.add('border-red-500');
      if (isValid) typeSelect.focus();
      isValid = false;
    } else {
      typeSelect.classList.remove('border-red-500');
    }
    
    if (!isValid) {
      console.log('Form validation failed');
      return;
    }
    
    // Get additional field values
    const entityValueInput = document.querySelector('[data-entity="value"]');
    const entityUnitInput = document.querySelector('[data-entity="unit"]');
    const entityConfidenceInput = document.querySelector('input[type="range"][data-entity="confidence"]');
    
    const newEntity = {
      type: typeSelect.value,
      text: nameInput.value.trim(),
      value: entityValueInput ? entityValueInput.value.trim() : '',
      unit: entityUnitInput ? entityUnitInput.value.trim() : '',
      description: descriptionInput ? descriptionInput.value.trim() : '',
      confidence: entityConfidenceInput ? parseFloat(entityConfidenceInput.value) : 0.6,
      timestamp: new Date().toISOString()
    };
    
    console.log('Creating new entity:', newEntity);
    
    // Get the entities container - try multiple selectors
    let entitiesContainer = document.querySelector('.entity-list[data-field="entities"]');
    if (!entitiesContainer) {
      // Try alternative selectors if the first one doesn't work
      entitiesContainer = document.querySelector('.space-y-3');
      if (!entitiesContainer) {
        entitiesContainer = document.querySelector('.entity-list');
        if (!entitiesContainer) {
          // Create a container if none exists
          console.warn('No entities container found, creating one');
          const rightColumn = document.querySelector('#right-column');
          if (rightColumn) {
            entitiesContainer = document.createElement('div');
            entitiesContainer.className = 'entity-list space-y-3';
            rightColumn.appendChild(entitiesContainer);
          } else {
            console.error('Could not find or create entities container');
            return;
          }
        }
      }
    }
    
    console.log('Using container:', entitiesContainer);
    
    // Create the new entity element with the exact structure you want
    const entityElement = document.createElement('div');
    entityElement.className = 'flex items-center justify-between bg-gray-50 p-2 rounded mb-1';
    entityElement.innerHTML = `
      <div>
        <span class="text-xs font-medium text-gray-900">${newEntity.text}</span>
        <span class="ml-2 text-xs text-gray-500">${newEntity.type}${newEntity.value ? ': ' + newEntity.value : ''}${newEntity.unit ? ' ' + newEntity.unit : ''}${newEntity.confidence ? ' (' + newEntity.confidence.toFixed(1) + ')' : ''}</span>
      </div>
      <button class="text-red-400 hover:text-red-600" data-entity="${newEntity.text}">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    console.log('Created entity element:', entityElement);
    
    // Check if we need to replace the "No entities found" message
    const noEntitiesMsg = entitiesContainer.querySelector('.text-gray-500');
    if (noEntitiesMsg && noEntitiesMsg.textContent && noEntitiesMsg.textContent.includes('No entities found')) {
      console.log('Replacing "No entities found" message');
      entitiesContainer.innerHTML = '';
    }
    
    // Add the new entity to the top of the container
    if (entitiesContainer.firstChild) {
      console.log('Adding entity to top of container');
      entitiesContainer.insertBefore(entityElement, entitiesContainer.firstChild);
    } else {
      console.log('Adding first entity to container');
      entitiesContainer.appendChild(entityElement);
    }
    
    // Add click handler for the remove button
    const removeButton = entityElement.querySelector('button[data-entity]');
    if (removeButton) {
      removeButton.addEventListener('click', (e) => {
        console.log('Remove button clicked for entity:', newEntity.text);
        e.preventDefault();
        e.stopPropagation();
        removeEntity(e.target.closest('button'));
      });
    } else {
      console.warn('Remove button not found in entity element');
    }
    
    // Reset form
    if (nameInput) nameInput.value = '';
    if (typeSelect) typeSelect.value = '';
    if (entityValueInput) entityValueInput.value = '';
    if (entityUnitInput) entityUnitInput.value = '';
    if (entityConfidenceInput) {
      entityConfidenceInput.value = '0.6';
      // Update the displayed confidence value
      const confidenceValue = document.getElementById('confidence-value');
      if (confidenceValue) confidenceValue.textContent = '0.60';
    }
    if (descriptionInput) descriptionInput.value = '';
    
    // Focus back on the name input for quick addition
    if (nameInput) nameInput.focus();
    
    // Log for debugging
    console.log('Entity added to DOM:', { entity: newEntity, container: entitiesContainer });
    
    // Dispatch a custom event that the entity was added
    try {
      const entityAddedEvent = new CustomEvent('entityAdded', { 
        detail: { ...newEntity } 
      });
      document.dispatchEvent(entityAddedEvent);
      console.log('Dispatched entityAdded event');
    } catch (error) {
      console.error('Error dispatching entityAdded event:', error);
    }
  }
  
  // Initialize event listeners for entity forms
  function initEntityFormListeners() {
    console.log('Initializing entity form listeners...');
    
    // Keep track of whether we've already set up the listeners
    if (window.entityFormInitialized) {
      console.log('Entity form listeners already initialized');
      return;
    }
    
    // Mark as initialized
    window.entityFormInitialized = true;
    
    // Function to set up all form listeners
    function setupFormListeners() {
      // Toggle form button - use event delegation to handle dynamically added elements
      document.body.addEventListener('click', function(e) {
        // Handle add entity trigger button
        if (e.target.matches('#add-entity-trigger-button, #add-entity-trigger-button *')) {
          const button = e.target.closest('#add-entity-trigger-button');
          if (button) {
            e.preventDefault();
            e.stopPropagation();
            toggleEntityForm(e);
            return false;
          }
        }
        
        // Handle cancel button
        if (e.target.matches('[data-action="cancel-add-entity"], [data-action="cancel-add-entity"] *')) {
          const button = e.target.closest('[data-action="cancel-add-entity"]');
          if (button) {
            e.preventDefault();
            e.stopPropagation();
            toggleEntityForm(e);
            return false;
          }
        }
        
        // Handle add entity button
        if (e.target.matches('#add-entity-button, #add-entity-button *')) {
          const button = e.target.closest('#add-entity-button');
          if (button) {
            e.preventDefault();
            e.stopPropagation();
            handleEntityAddition(e);
            return false;
          }
        }
      });
      
      // Handle form submission
      const form = document.getElementById('add-entity-form');
      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          console.log('Form submission prevented, handling with handleEntityAddition');
          handleEntityAddition(e);
          return false;
        });
        console.log('Form submit handler attached');
      }
      
      console.log('Entity form listeners initialized');
    }
    
    // Try to set up listeners immediately
    setupFormListeners();
    
    // If form elements aren't found, try again after a short delay
    if (!document.getElementById('add-entity-form') || !document.getElementById('add-entity-trigger-button')) {
      console.log('Form elements not found, retrying...');
      setTimeout(setupFormListeners, 500);
    }
  }

  // PDF Viewer functionality
  let pdfDoc = null;
  let pageNum = 1;
  let pageNumPending = null;
  let pageRendering = false;
  let pageIsRendering = false;
  const scale = 1.5;
  
  // Open PDF Viewer
  async function openPdfViewer() {
    // Use absolute path to ensure the PDF loads correctly
    const pdfUrl = new URL('assets/WP 03.pdf', window.location.origin + window.location.pathname).href;
    const modal = document.getElementById('pdfViewerModal');
    const pdfViewer = document.getElementById('pdfViewer');
    
    // Get the document title from the page
    const docTitleElement = document.querySelector('.document-title:not(.document-title .document-title)');
    const docTitle = docTitleElement ? docTitleElement.textContent.trim() : 'Document';
    document.getElementById('pdfViewerTitle').textContent = `PDF Viewer: ${docTitle}`;
    
    // Show loading state
    pdfViewer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p class="text-gray-700">Loading PDF document...</p>
      </div>`;
    
    // Show modal
    modal.classList.remove('hidden');
    
    try {
      // Load the PDF
      const loadingTask = window.pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
        cMapPacked: true,
        withCredentials: false
      });
      pdfDoc = await loadingTask.promise;
      
      // Reset page number
      pageNum = 1;
      
      // Update pagination
      updatePaginationInfo();
      updatePaginationButtons();
      
      // Render the first page
      await renderPage(pageNum);
      
      // Add event listeners
      document.getElementById('prevPage').addEventListener('click', onPrevPage);
      document.getElementById('nextPage').addEventListener('click', onNextPage);
      document.getElementById('closePdfViewer').addEventListener('click', closePdfViewer);
      document.getElementById('closePdfViewerBottom').addEventListener('click', closePdfViewer);
      document.getElementById('pdfViewerBackdrop').addEventListener('click', closePdfViewer);
      
      // Add keyboard navigation
      document.addEventListener('keydown', handleKeyDown);
      
      // Prevent modal close when clicking inside content
      document.getElementById('pdfViewerContainer').addEventListener('click', function(e) {
        e.stopPropagation();
      });
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      document.getElementById('pdfViewer').innerHTML = `
        <div class="text-center p-8">
          <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading PDF</h3>
          <p class="text-sm text-gray-600 mb-4">The PDF could not be loaded. Please check if the file exists and try again.</p>
          <p class="text-xs text-gray-500">${error.message}</p>
        </div>
      `;
    }
  }
  
  // Close PDF Viewer
  function closePdfViewer() {
    const modal = document.getElementById('pdfViewerModal');
    modal.classList.add('hidden');
    
    // Clean up
    document.removeEventListener('keydown', handleKeyDown);
    document.getElementById('pdfViewerBackdrop').removeEventListener('click', closePdfViewer);
    document.getElementById('closePdfViewerBottom').removeEventListener('click', closePdfViewer);
    
    pdfDoc = null;
    pageNum = 1;
    document.getElementById('pdfViewer').innerHTML = '';
  }
  
  // Handle keyboard navigation
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      closePdfViewer();
    } else if (e.key === 'ArrowLeft') {
      onPrevPage();
    } else if (e.key === 'ArrowRight') {
      onNextPage();
    }
  }
  
  // Update pagination buttons state
  function updatePaginationButtons() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    // Disable/enable previous button
    if (pageNum <= 1) {
      prevBtn.disabled = true;
      prevBtn.classList.add('opacity-50', 'cursor-not-allowed');
      prevBtn.classList.remove('hover:bg-gray-200', 'text-gray-600');
    } else {
      prevBtn.disabled = false;
      prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      prevBtn.classList.add('hover:bg-gray-200', 'text-gray-600');
    }
    
    // Disable/enable next button
    if (pageNum >= pdfDoc.numPages) {
      nextBtn.disabled = true;
      nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
      nextBtn.classList.remove('hover:bg-gray-200', 'text-gray-600');
    } else {
      nextBtn.disabled = false;
      nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      nextBtn.classList.add('hover:bg-gray-200', 'text-gray-600');
    }
  }
  
  // Go to previous page
  function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
    updatePaginationButtons();
  }
  
  // Go to next page
  function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
    updatePaginationButtons();
  }
  
  // Update pagination info
  function updatePaginationInfo() {
    document.getElementById('currentPage').textContent = pageNum;
    document.getElementById('totalPages').textContent = pdfDoc.numPages;
  }
  
  // Queue a page for rendering
  function queueRenderPage(num) {
    if (pageRendering) {
      pageNumPending = num;
    } else {
      renderPage(num);
    }
  }
  
  // Render a page
  async function renderPage(num) {
    pageRendering = true;
    
    // Update page info
    updatePaginationInfo();
    
    // Get the page
    const page = await pdfDoc.getPage(num);
    
    // Get the container and calculate available width
    const container = document.getElementById('pdfViewer');
    const containerWidth = container.clientWidth;
    
    // Calculate the scale to fit the container width
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min((containerWidth - 40) / viewport.width, 1.5); // Max scale 1.5
    const scaledViewport = page.getViewport({ scale });
    
    // Prepare canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    
    // Clear the container and center the canvas
    container.innerHTML = '';
    container.appendChild(canvas);
    
    // Render the page
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport
    };
    
    const renderTask = page.render(renderContext);
    
    // Wait for rendering to finish
    await renderTask.promise;
    
    pageRendering = false;
    
    // Check if there's a pending page to render
    if (pageNumPending !== null) {
      renderPage(pageNumPending);
      pageNumPending = null;
    }
  }

  // Initialize the application
  async function init() {
    console.log('Initializing application...');
    
    // Add input event listeners to remove error states
    document.addEventListener('input', function(e) {
      if (e.target && e.target.matches && e.target.matches('[data-entity]')) {
        e.target.classList.remove('border-red-500');
      }
    });
    
    // Initialize entity form
    function initEntityForm() {
      console.log('Initializing entity form...');
      const addButton = document.getElementById('add-entity-trigger-button');
      const form = document.getElementById('add-entity-form');
      
      if (!addButton || !form) {
        console.warn('Entity form elements not found, retrying...');
        // Try to find the elements again after a short delay
        setTimeout(initEntityForm, 500);
        return;
      }
      
      console.log('Found entity form elements');
      
      // Set initial state
      form.classList.add('hidden');
      form.style.display = 'none';
      
      // Add click event to the add button
      addButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleEntityForm(e);
        return false;
      });
      
      // Add click event to cancel button if it exists
      const entityCancelBtn = form.querySelector('[data-action="cancel-entity"]');
      if (entityCancelBtn) {
        entityCancelBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          toggleEntityForm(e);
          return false;
        });
      }
      
      console.log('Entity form initialization complete');
      
      // Focus on first input when form is shown
      const firstInput = form.querySelector('input, select, textarea');
      if (firstInput) {
        firstInput.addEventListener('focus', function() {
          this.select();
        });
      }
      
      // Toggle form function
      function toggleForm(e) {
        if (e) e.preventDefault();
        console.log('Toggle form called');
        
        if (form.classList.contains('hidden')) {
          console.log('Showing form');
          form.classList.remove('hidden');
          form.style.display = 'block';
          form.style.maxHeight = form.scrollHeight + 'px';
          addButton.disabled = true;
          addButton.classList.add('opacity-50', 'cursor-not-allowed');
          
          // Focus on first input
          const firstInput = form.querySelector('input, select, textarea');
          if (firstInput) {
            setTimeout(() => firstInput.focus(), 50);
          }
        } else {
          console.log('Hiding form');
          form.classList.add('hidden');
          form.style.maxHeight = '0';
          form.style.display = 'none';
          addButton.disabled = false;
          addButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      }
      
      // Handle form submission
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submission prevented, handling with handleEntityAddition');
        handleEntityAddition(e);
        return false;
      });
      
      console.log('Entity form initialized');
    }
    
    // Initialize entity form when modal is shown
    document.addEventListener('shown.bs.modal', function() {
      console.log('Modal shown, initializing entity form');
      setTimeout(initEntityForm, 100);
    });
    
    // Also try to initialize immediately in case modal is already open
    setTimeout(initEntityForm, 500);
    
    // Add click handler for document lines
    document.addEventListener("click", (e) => {
      // Check if the click is on a line number or line content
      const lineNumberElement = e.target.closest(".line-number");
      const lineContentElement = e.target.closest(".line-content");
      let lineElement = null;

      if (lineNumberElement) {
        // If clicking on a line number, get the parent line element
        lineElement = lineNumberElement.closest("[data-line-number]");
      } else if (lineContentElement) {
        // If clicking on line content, get the parent line element
        lineElement = lineContentElement.closest("[data-line-number]");
      } else {
        // Try to find any line element
        lineElement = e.target.closest("[data-line-number]");
      }

      if (lineElement) {
        console.log("Line element found:", lineElement);
        handleLineClick(lineElement);
      } else {
        console.log("No line element found for click target:", e.target);
      }
    });

    // Handle back/forward navigation
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.lineNumber) {
        // Find and highlight the line
        const lineElement = document.querySelector(
          `[data-line-number="${e.state.lineNumber}"]`
        );
        if (lineElement) {
          handleLineClick(lineElement);
          // Scroll to the line
          lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        // Clear the summary if no line is selected
        updateEnrichmentSummary(null);
      }
    });
    // Initialize the document content
    loadDocumentContent().then(() => {
      // Check for line hash in URL on initial load
      if (window.location.hash.startsWith("#L")) {
        const lineNumber = window.location.hash.substring(2);
        const lineElement = document.querySelector(
          `[data-line-number="${lineNumber}"]`
        );
        if (lineElement) {
          handleLineClick(lineElement);
          // Small delay to ensure the document is fully rendered
          setTimeout(() => {
            lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }
      }
    });

    // Initialize other components
    initCollapsibleSections();
    initTextSelection();
    
    // Initialize entity form
    if (document.getElementById('add-entity-form')) {
      console.log('Initializing entity form...');
      initEntityFormListeners();
    }

    // Add event delegation for Curator Studio button
    document.addEventListener("click", function (event) {
      if (event.target.closest(".curator-studio-btn")) {
        event.preventDefault();
        window.DoccanoApp.openCuratorStudio();
      }
    });
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

    // Handle input events for both taxonomy keywords and dates mentioned
    function handleKeywordInput(e, isDateInput = false) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const target = e.target;
        const value = target.value.trim();
        
        if (!value) return;
        
        if (isDateInput) {
          // Handle dates mentioned input
          const dateMentionElement = document.createElement('span');
          dateMentionElement.className = 'inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full transition-colors mr-1 mb-1';
          dateMentionElement.setAttribute('data-date-mention', value);
          dateMentionElement.innerHTML = `
            ${value}
            <button type="button" class="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none" 
              data-action="remove-date-mention" 
              data-value="${value}">
              <i class="fas fa-times"></i>
            </button>
          `;
          target.parentNode.insertBefore(dateMentionElement, target);
        } else {
          // Handle taxonomy keyword input
          const category = target.dataset.taxonomyCategory;
          const keywordElement = document.createElement('span');
          keywordElement.className = 'inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full transition-colors mr-1 mb-1';
          keywordElement.innerHTML = `
            ${value}
            <button type="button" class="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none" 
              data-action="remove-taxonomy-keyword" 
              data-category="${category}" 
              data-keyword="${value}">
              <i class="fas fa-times"></i>
            </button>
          `;
          target.parentNode.insertBefore(keywordElement, target);
        }
        
        target.value = '';
      }
    }

    // Handle paste events for both taxonomy keywords and dates mentioned
    function handlePaste(e, isDateInput = false) {
      const target = e.target;
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const items = pastedText.split(/[,\n\r]+/).map(item => item.trim()).filter(item => item);
      
      if (items.length === 0) return;
      
      if (isDateInput) {
        // Handle dates mentioned paste
        items.forEach(date => {
          const dateMentionElement = document.createElement('span');
          dateMentionElement.className = 'inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full transition-colors mr-1 mb-1';
          dateMentionElement.setAttribute('data-date-mention', date);
          dateMentionElement.innerHTML = `
            ${date}
            <button type="button" class="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none" 
              data-action="remove-date-mention" 
              data-value="${date}">
              <i class="fas fa-times"></i>
            </button>
          `;
          target.parentNode.insertBefore(dateMentionElement, target);
        });
      } else {
        // Handle taxonomy keywords paste
        const category = target.dataset.taxonomyCategory;
        items.forEach(keyword => {
          const keywordElement = document.createElement('span');
          keywordElement.className = 'inline-flex items-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full transition-colors mr-1 mb-1';
          keywordElement.innerHTML = `
            ${keyword}
            <button type="button" class="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none" 
              data-action="remove-taxonomy-keyword" 
              data-category="${category}" 
              data-keyword="${keyword}">
              <i class="fas fa-times"></i>
            </button>
          `;
          target.parentNode.insertBefore(keywordElement, target);
        });
      }
      
      target.value = '';
    }

    // Add event listeners for taxonomy keyword input
    document.addEventListener('keydown', function(e) {
      const target = e.target;
      if (target.matches('[data-field="taxonomy-keyword-input"]')) {
        handleKeywordInput(e, false);
      } else if (target.matches('[data-field="dates-mentioned-input"]')) {
        handleKeywordInput(e, true);
      }
    });

    // Add paste event listeners
    document.addEventListener('paste', function(e) {
      const target = e.target;
      if (target.matches('[data-field="taxonomy-keyword-input"]')) {
        handlePaste(e, false);
      } else if (target.matches('[data-field="dates-mentioned-input"]')) {
        handlePaste(e, true);
      }
    });

    // Handle remove button clicks and add category button
    document.addEventListener('click', function(e) {
      // Handle taxonomy keyword removal
      if (e.target.closest('[data-action="remove-taxonomy-keyword"]')) {
        const button = e.target.closest('[data-action="remove-taxonomy-keyword"]');
        const keywordElement = button.closest('span');
        if (keywordElement) {
          keywordElement.remove();
        }
      }
      // Handle date mention removal
      else if (e.target.closest('[data-action="remove-date-mention"]')) {
        const button = e.target.closest('[data-action="remove-date-mention"]');
        const dateElement = button.closest('span[data-date-mention]');
        if (dateElement) {
          dateElement.remove();
        }
      }
      // Handle add new taxonomy category
      else if (e.target.closest('[data-action="add-taxonomy-category"]') || 
               e.target.matches('[data-action="add-taxonomy-category"]')) {
        e.preventDefault();
        const button = e.target.closest('[data-action="add-taxonomy-category"]') || e.target;
        const input = document.getElementById('new-category-input');
        const categoryName = input.value.trim();
        
        if (categoryName) {
          // Get the add-category section and its parent
          const addCategorySection = document.getElementById('add-category-section');
          const parentContainer = addCategorySection.parentNode;
          
          // Create new category HTML
          const categoryId = `category-${Date.now()}`;
          const newCategoryHtml = `
            <div class="space-y-2 taxonomy-category" data-category="${categoryName}">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900 flex items-center">
                  <span class="mr-2">${categoryName}</span>
                </h4>
                <button type="button" class="text-xs text-red-500 hover:text-red-700 focus:outline-none" 
                  data-action="remove-taxonomy-category" data-category="${categoryName}">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="flex items-center flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-10 bg-white">
                <input type="text" 
                  class="flex-1 min-w-[100px] border-0 p-0 text-sm focus:ring-0 bg-transparent placeholder-gray-400 focus:outline-none" 
                  placeholder="Add a keyword and press Enter or comma"
                  data-taxonomy-category="${categoryName}"
                  data-field="taxonomy-keyword-input"
                  autocomplete="off">
              </div>
              <p class="text-xs text-gray-500 mt-1">Press Enter or comma to add keywords. Click × to remove.</p>
            </div>
          `;
          
          // Insert the new category before the add-category section
          parentContainer.insertBefore(document.createRange().createContextualFragment(newCategoryHtml), addCategorySection);
          
          // Clear the input
          input.value = '';
          
          // Focus the new input field
          const newInput = parentContainer.querySelector(`[data-category="${categoryName}"] [data-field="taxonomy-keyword-input"]`);
          if (newInput) {
            newInput.focus();
          }
        }
      }
      // Handle remove taxonomy category
      if (e.target.closest('[data-action="remove-taxonomy-category"]')) {
        e.preventDefault();
        e.stopPropagation();
        
        const button = e.target.closest('[data-action="remove-taxonomy-category"]');
        const category = button.getAttribute('data-category');
        const categoryElement = document.querySelector(`.taxonomy-category[data-category="${category}"]`);
        
        if (!categoryElement) {
          console.error('Category element not found for:', category);
          return;
        }
        
        // Handle category removal with confirmation
        Swal.fire({
          title: 'Remove Category',
          text: `Are you sure you want to remove the category "${category}"?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, remove it!',
          customClass: {
            confirmButton: 'px-4 py-2 text-sm font-medium rounded-md',
            cancelButton: 'px-4 py-2 text-sm font-medium rounded-md',
            actions: 'gap-3',
            popup: 'rounded-lg',
            title: 'text-lg font-semibold',
            container: 'text-sm',
            icon: '!w-12 !h-12 !mt-4',
            htmlContainer: 'mt-2 mb-4 text-gray-700'
          },
          buttonsStyling: false,
          reverseButtons: true
        }).then((result) => {
          if (result.isConfirmed) {
            // Add removal animation
            categoryElement.style.overflow = 'hidden';
            categoryElement.style.transition = 'opacity 0.3s, transform 0.3s, height 0.3s, margin 0.3s, padding 0.3s';
            
            // Store the original height and spacing
            const originalHeight = categoryElement.offsetHeight + 'px';
            const originalMargin = window.getComputedStyle(categoryElement).margin;
            const originalPadding = window.getComputedStyle(categoryElement).padding;
            
            // Apply initial styles
            categoryElement.style.opacity = '1';
            categoryElement.style.height = originalHeight;
            categoryElement.style.margin = originalMargin;
            categoryElement.style.padding = originalPadding;
            
            // Force repaint
            void categoryElement.offsetHeight;
            
            // Start the animation
            requestAnimationFrame(() => {
              categoryElement.style.opacity = '0';
              categoryElement.style.transform = 'translateX(-20px)';
              categoryElement.style.height = '0';
              categoryElement.style.marginTop = '0';
              categoryElement.style.marginBottom = '0';
              categoryElement.style.paddingTop = '0';
              categoryElement.style.paddingBottom = '0';
              categoryElement.style.border = 'none';
              categoryElement.style.visibility = 'hidden';
            });
            
            // Remove after animation completes
            setTimeout(() => {
              categoryElement.remove();
              
              // Show success message
              Swal.fire({
                title: 'Removed!',
                text: `The category "${category}" has been removed.`,
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                customClass: {
                  popup: '!p-3 !text-sm',
                  title: '!text-base !font-medium',
                  icon: '!w-5 !h-5 !mt-0 !mr-2',
                  timerProgressBar: '!bg-blue-500',
                  container: '!w-auto !max-w-xs'
                },
                didOpen: (toast) => {
                  toast.style.display = 'flex';
                  toast.style.alignItems = 'center';
                }
              });
            }, 300);
          }
        });
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
    const saveStateBeforeChange = () => {
      // Get the line number from the selected text or current position
      const lineNumber = getLineNumber(window.getSelection().anchorNode);
      const lineContent = getLineContent(lineNumber);
      
      // Get enrichment data for the current line or document
      const enrichment = documentData[lineNumber - 1]?.enrichment || {};
      
      // Add entities from NDJSON if available
      if (window.ndjsonEntities) {
        if (!enrichment.entities) {
          enrichment.entities = [];
        }
        // Only add entities that aren't already in the enrichment
        const existingEntityTexts = new Set(enrichment.entities.map(e => e.text));
        window.ndjsonEntities.forEach(entity => {
          if (!existingEntityTexts.has(entity.text)) {
            enrichment.entities.push({
              ...entity,
              source: entity.source || 'ndjson'
            });
          }
        });
      }
      
      return { lineNumber, lineContent, enrichment };
    };
    
    const { lineNumber, lineContent, enrichment } = saveStateBeforeChange();
    
    // If the same taxonomy, remove the highlight
    if (existingHighlight && existingHighlight.id === `taxonomy-${taxonomy.id}`) {
      removeHighlight(existingHighlight);
      return;
    }
    
    // If different taxonomy, replace it
    if (existingHighlight) {
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

  function removeHighlight(highlightElement, skipConfirmation = false) {
    // Get the taxonomy ID from the data attribute instead of the element ID
    const taxonomyId = highlightElement.dataset.taxonomyId;
    const highlightText = highlightElement.textContent.trim();

    // Function to perform the actual removal
    const performRemoval = () => {
      // Get the highlight info before removing it
      const highlightInfo = {
        id: highlightElement.id,
        text: highlightText,
        taxonomyId: taxonomyId,
        lineNumber: highlightElement.dataset.lineNumber || "",
      };

      // Remove the highlight from the DOM first
      const originalText =
        highlightElement.firstChild?.textContent || highlightElement.textContent;
      const textNode = document.createTextNode(originalText);
      highlightElement.parentNode.replaceChild(textNode, highlightElement);

      // Update the taxonomy count
      if (taxonomyId) {
        const taxonomy = taxonomies.find((t) => t.id === taxonomyId);
        if (
          taxonomy &&
          (taxonomy.count > 0 || typeof taxonomy.count === "undefined")
        ) {
          taxonomy.count = Math.max(0, (taxonomy.count || 0) - 1);
          renderTaxonomies();
        }
      }

      // Create a new state that reflects this removal
      const newState = saveState();

      // If saveState didn't detect the change (which can happen with direct DOM manipulation),
      // force a new state with the removal
      if (newState && !newState.hasChanges) {
        console.log("Forcing state update after highlight removal");
        // Push a new state manually
        const docContent = document.getElementById("document-content");
        if (docContent) {
          const snapshot = {
            html: docContent.innerHTML,
            highlights: Array.from(
              document.querySelectorAll(".taxonomy-highlight")
            ).map((hl) => ({
              id: hl.id,
              text: hl.textContent.trim(),
              lineNumber: hl.dataset.lineNumber || "",
              taxonomyId: hl.dataset.taxonomyId || "",
              isActive: hl.classList.contains("highlight-active"),
            })),
            timestamp: new Date().toISOString(),
            currentHighlightId: null,
          };

          stateHistory.pushState(JSON.stringify(snapshot));
          console.log("Manual state update after highlight removal");
        }
      }

      // Show success message
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });
      
      Toast.fire({
        icon: 'success',
        title: `Taxonomy highlight removed`
      });

      // Clear any existing selection
      clearSelection();
    };

    // Skip confirmation if explicitly requested (for programmatic removal)
    if (skipConfirmation) {
      performRemoval();
      return;
    }

    // Show confirmation dialog
    Swal.fire({
      title: 'Remove Taxonomy Highlight',
      text: `Are you sure you want to remove the highlighted text "${highlightText}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!',
      reverseButtons: true,
      focusConfirm: false,
      customClass: {
        confirmButton: 'px-4 py-2 text-sm font-medium rounded-md',
        cancelButton: 'px-4 py-2 text-sm font-medium rounded-md mr-2'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        performRemoval();
      }
    });
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
      const taxonomiesHeading = container.closest(".mb-4")?.querySelector("h3");

      if (!taxonomyList || taxonomyList.length === 0) {
        container.innerHTML =
          '<div class="text-sm text-red-500 py-4">No taxonomies available</div>';
        if (taxonomiesHeading) {
          taxonomiesHeading.innerHTML =
            'Taxonomies <span class="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-normal rounded-full">0 items</span>';
        }
        return;
      }

      // Calculate total count of all taxonomy items
      const totalCount = taxonomyList.reduce(
        (sum, taxonomy) => sum + (taxonomy.count || 0),
        0
      );
      const formattedCount = totalCount.toLocaleString(); // Format number with thousand separators

      // Update the taxonomies heading with the total count
      if (taxonomiesHeading) {
        taxonomiesHeading.innerHTML = `Taxonomies <span class="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-normal rounded-full">${formattedCount} item${
          totalCount !== 1 ? "s" : ""
        }</span>`;
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
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-md border shadow-sm group-hover:shadow-md transition-all bg-opacity-50" 
                              style="background-color: ${color}; border-color: ${color}">
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

  // Helper function to download JSON file
  function downloadJSON(data, filename) {
    try {
      // Create a blob with the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "highlights-export.json";

      // Trigger the download
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      return true;
    } catch (error) {
      console.error("Error downloading JSON:", error);
      return false;
    }
  }

  // Handle save action with export functionality
  async function handleSaveWithExport(event) {
    event.preventDefault();

    // Get the save button and add loading state
    const saveBtn = document.getElementById("save-btn");
    const saveIcon = saveBtn ? saveBtn.querySelector("i, svg") : null;
    const originalHtml = saveBtn ? saveBtn.innerHTML : "";
    let exportData = null;

    try {
      // Add loading state to button
      if (saveBtn) {
        saveBtn.classList.add("opacity-75", "cursor-not-allowed");
        if (saveIcon) {
          saveIcon.classList.remove("fa-save");
          saveIcon.classList.add("fa-spinner", "animate-spin");
        } else {
          saveBtn.innerHTML = '<i class="fas fa-spinner animate-spin"></i>';
        }
        saveBtn.disabled = true;
      }

      // First save the current state
      const changes = saveState();
      if (!changes) {
        throw new Error("Failed to save document state");
      }

      const addedCount = changes.added || 0;
      const removedCount = changes.removed || 0;
      const hasChanges = changes.hasChanges || false;

      // Get all current highlight elements from the DOM
      const currentHighlightElements = Array.from(
        document.querySelectorAll(".taxonomy-highlight")
      );

      // Get the current document's line number from the document content wrapper
      const documentWrapper = document.querySelector(
        ".document-content-wrapper"
      );

      // Process only the active highlights from the DOM
      const activeHighlights = currentHighlightElements.map((hl) => {
        // Get text content
        let text = "";
        const textNode = Array.from(hl.childNodes).find(
          (node) => node.nodeType === Node.TEXT_NODE
        );
        if (textNode) {
          text = textNode.textContent.trim();
        } else {
          text = hl.textContent
            .trim()
            .replace(/\s+/g, " ")
            .replace(/\n+/g, " ")
            .trim();

          const taxonomy = taxonomies.find(
            (t) => t.id === (hl.dataset.taxonomyId || "")
          );
          if (taxonomy) {
            text = text
              .replace(new RegExp(`\\s*${taxonomy.name}\\s*$`, "i"), "")
              .trim();
          }
        }

        // Get highlight's line number within the document
        let lineNumber = hl.dataset.lineNumber || "";
        if (!lineNumber) {
          // Try to get line number from the closest line element
          const lineElement = hl.closest(".flex.items-start.group");
          if (lineElement) {
            const lineNumberSpan = lineElement.querySelector(
              "span.text-xs.text-gray-400"
            );
            if (lineNumberSpan) {
              lineNumber = lineNumberSpan.textContent.trim();
            }
          }

          // If still no line number, try to get from data attributes
          if (!lineNumber) {
            const lineElement = hl.closest("[data-line-number]");
            if (lineElement) {
              lineNumber = lineElement.dataset.lineNumber || "";
            }
          }
        }

        // Get taxonomy info
        const taxonomy =
          taxonomies.find((t) => t.id === (hl.dataset.taxonomyId || "")) || {};

        return {
          text: text,
          line_number: lineNumber,
          taxonomy_category: taxonomy.name || "",
          taxonomy_id: hl.dataset.taxonomyId || "",
        };
      });

      // Prepare export data with only active highlights
      exportData = {
        metadata: {
          exported_at: new Date().toISOString(),
          document_title: document.title,
          highlights_count: activeHighlights.length,
        },
        highlights: activeHighlights,
      };

      // Simulate API call delay (replace with actual save/export logic)
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            // Download the highlights as JSON file
            const filename = `highlights-${new Date()
              .toISOString()
              .replace(/[:.]/g, "-")}.json`;
            const downloadSuccess = downloadJSON(exportData, filename);

            if (!downloadSuccess) {
              throw new Error("Failed to generate download");
            }

            // Simulate random errors (10% chance)
            if (Math.random() < 0.1) {
              reject(
                new Error(
                  "Failed to connect to the server. Your highlights were saved locally, but could not be synced to the server."
                )
              );
            } else {
              resolve();
            }
          } catch (error) {
            console.error("Error during export:", error);
            reject(error);
          }
        }, 500); // Reduced delay for better UX
      });

      // Prepare success message
      const successMessage = hasChanges
        ? `Successfully exported ${addedCount} added and ${removedCount} removed highlights.`
        : "No changes to export.";

      // Show success message with SweetAlert2
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        width: "auto",
        minWidth: "320px",
        padding: "1rem",
        customClass: {
          container: "swal2-toast-container",
          popup: "swal2-toast shadow-lg rounded-lg",
          timerProgressBar: "swal2-timer-progress-bar bg-green-500",
        },
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });

      if (hasChanges) {
        // Create badges for added/removed counts
        const addedBadge =
          addedCount > 0
            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
              <svg class="-ml-0.5 mr-1 h-2 w-2 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
              ${addedCount} added
            </span>`
            : "";

        const removedBadge =
          removedCount > 0
            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <svg class="-ml-0.5 mr-1 h-2 w-2 text-red-500" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
              ${removedCount} removed
            </span>`
            : "";

        // Show success toast with changes summary
        await Toast.fire({
          html: `
            <div class="flex items-start w-full">
              <div class="flex-shrink-0 pt-0.5">
                <div class="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg class="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-gray-900">Highlights exported successfully!</p>
                <div class="mt-1 flex flex-wrap items-center gap-1.5">
                  ${addedBadge}${removedBadge}
                </div>
                <p class="mt-1 text-xs text-gray-500">${successMessage} File download started automatically.</p>
              </div>
              <button type="button" class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none">
                <span class="sr-only">Close</span>
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          `,
          showCloseButton: false,
          showConfirmButton: false,
          background: "#fff",
          backdrop: false,
          showClass: {
            popup: "animate-fade-in-up",
          },
          hideClass: {
            popup: "animate-fade-out-down",
          },
        });
      } else {
        // Show info message if no changes
        await Toast.fire({
          html: `
            <div class="flex items-start w-full">
              <div class="flex-shrink-0 pt-0.5">
                <div class="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg class="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-gray-900">No changes to save</p>
                <p class="mt-0.5 text-xs text-gray-500">Make some changes before saving.</p>
              </div>
              <button type="button" class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none">
                <span class="sr-only">Close</span>
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          `,
          showCloseButton: false,
          showConfirmButton: false,
          background: "#fff",
          backdrop: false,
          showClass: {
            popup: "animate-fade-in-up",
          },
          hideClass: {
            popup: "animate-fade-out-down",
          },
          timer: 3000,
        });
      }

      return changes;
    } catch (error) {
      console.error("Error saving changes:", error);

      // Show error toast
      await Swal.fire({
        toast: true,
        position: "top-end",
        html: `
          <div class="flex items-start w-full">
            <div class="flex-shrink-0 pt-0.5">
              <div class="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                <svg class="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">Failed to save changes</p>
              <p class="mt-0.5 text-xs text-gray-600">${
                error.message ||
                "An unexpected error occurred. Please try again."
              }</p>
            </div>
            <button type="button" class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none">
              <span class="sr-only">Close</span>
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        `,
        showCloseButton: false,
        showConfirmButton: false,
        background: "#fff",
        backdrop: false,
        showClass: {
          popup: "animate-fade-in-up",
        },
        hideClass: {
          popup: "animate-fade-out-down",
        },
        timer: 5000,
      });

      return null;
    } finally {
      // Always reset the button state
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove("opacity-75", "cursor-not-allowed");

        if (saveIcon) {
          saveIcon.classList.remove("fa-spinner", "animate-spin");
          saveIcon.classList.add("fa-save");
        } else {
          saveBtn.innerHTML = originalHtml;
        }

        // Add success checkmark briefly if save was successful
        if (!saveBtn.classList.contains("error")) {
          saveBtn.classList.add("text-green-500");
          if (saveIcon) {
            saveIcon.classList.remove("fa-save");
            saveIcon.classList.add("fa-check");
          }

          // Reset to original state after delay
          setTimeout(() => {
            if (saveBtn) {
              saveBtn.classList.remove("text-green-500");
              if (saveIcon) {
                saveIcon.classList.remove("fa-check");
                saveIcon.classList.add("fa-save");
              }
            }
          }, 2000);
        }
      }
    }
  }

  // Assign to window - ensure we don't overwrite existing methods
  window.DoccanoApp = window.DoccanoApp || {};

  // Add only the methods that aren't already defined
  const methods = {
    init,
    exportHighlights,
    loadDocumentContent,
    getLineContent,
    openCuratorStudio,
  };

  // Only add methods that aren't already defined on DoccanoApp
  for (const [key, value] of Object.entries(methods)) {
    if (typeof value === "function" && !window.DoccanoApp[key]) {
      window.DoccanoApp[key] = value;
    }
  }

  // Add a direct event listener for the add entity button
  document.addEventListener('click', function(e) {
    const addButton = e.target.closest && e.target.closest('#add-entity-button');
    if (addButton) {
      console.log('=== Direct click on add entity button ===');
      console.log('Button element:', addButton);
      console.log('Form values:', {
        name: document.querySelector('[data-entity="name"]')?.value,
        type: document.querySelector('select[data-entity="type"]')?.value,
        description: document.querySelector('[data-entity="description"]')?.value
      });
      
      // Call handleEntityAddition directly
      handleEntityAddition(e);
    }
  });

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
