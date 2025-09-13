// doccano.js - Document Annotation Tool

class DoccanoApp {
  constructor() {
    this.documentData = [];
    this.currentIndex = 0;
    this.documentContainer = null;
    this.documentTitle = null;
    this.ndjsonRaw = "";
    this.taxonomyTypes = [
      "almp_instruments",
      "target_groups",
      "delivery_modes",
      "evaluation_design",
    ];

    // Initialize structure handlers with bound context
    this.structureHandlers = {
      prose: (content, doc) => {
        // Get taxonomy from doc.enrichment.taxonomy if it exists
        const taxonomy = (doc.enrichment && doc.enrichment.taxonomy) || {};
        console.log("Processing prose with taxonomy:", taxonomy); // Debug log
        return `<div class="mb-6">${this.formatText(content, taxonomy)}</div>`;
      },

      table_row: (content, doc) => {
        // Handle table rows - they might be part of a larger table structure
        return content.trim() ? `<tr>${content}</tr>` : "";
      },

      table: (content, doc) => {
        // Wrap table rows in a proper table structure
        return `
          <div class="overflow-x-auto my-4">
            <table class="min-w-full border border-eu-gray-200">
              <tbody>${content}</tbody>
            </table>
          </div>
        `;
      },

      heading: (content, doc) => {
        const level = doc.header?.match(/^#+/)?.[0]?.length || 2;
        const headingTag = `h${Math.min(6, Math.max(2, level))}`;
        const className =
          {
            2: "text-2xl font-bold text-eu-blue mt-8 mb-4",
            3: "text-xl font-semibold text-eu-blue mt-6 mb-3",
            4: "text-lg font-semibold text-eu-blue mt-5 mb-2",
            5: "text-base font-medium text-eu-blue mt-4 mb-2",
            6: "text-base font-medium text-eu-gray-700 mt-4 mb-2",
          }[level] || "text-base font-medium";

        return `<${headingTag} class="${className}">${this.stripMarkdown(
          content
        )}</${headingTag}>`;
      },

      // Default handler for any unhandled structure types
      default: (content, doc) => {
        return `<div class="mb-4">${content}</div>`;
      },
    };

    // Initialize the app
    this.initialize();
  }

  async initialize() {
    // Set up DOM references
    this.documentContainer = document.querySelector(".prose");
    this.documentTitle = document.querySelector(".prose h1");

    // Remove pagination elements if they exist
    const pagination = document.querySelector(".pagination");
    if (pagination) {
      pagination.remove();
    }

    try {
      // Load and process the NDJSON data
      await this.loadDocuments();
    } catch (error) {
      console.error("Error initializing DoccanoApp:", error);
      this.showError(`Error loading document: ${error.message}`);
    } finally {
      // Hide preloader when done
      const preloader = document.getElementById("preloader");
      if (preloader) preloader.style.display = "none";
    }
  }

  // Format number with thousand separators
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Count taxonomy items in all loaded documents
  countTaxonomyItems() {
    // Reset counts
    this.taxonomyCounts = {
      almp_instruments: 0,
      target_groups: 0,
      delivery_modes: 0,
      evaluation_design: 0,
    };

    // Count taxonomy items in all documents
    this.documentData.forEach((doc) => {
      if (doc.enrichment?.taxonomy) {
        const { taxonomy } = doc.enrichment;
        if (taxonomy.almp_instruments?.length)
          this.taxonomyCounts.almp_instruments +=
            taxonomy.almp_instruments.length;
        if (taxonomy.target_groups?.length)
          this.taxonomyCounts.target_groups += taxonomy.target_groups.length;
        if (taxonomy.delivery_modes?.length)
          this.taxonomyCounts.delivery_modes += taxonomy.delivery_modes.length;
        if (taxonomy.evaluation_design?.length)
          this.taxonomyCounts.evaluation_design +=
            taxonomy.evaluation_design.length;
      }
    });

    // Update the UI with counts
    this.updateTaxonomyUI();
  }

  // Update the UI with taxonomy counts
  updateTaxonomyUI() {
    const taxonomyMap = {
      almp_instruments: "Almp Instruments",
      target_groups: "Target Groups",
      delivery_modes: "Delivery Modes",
      evaluation_design: "Evaluation Design",
    };

    // Update each taxonomy button with its count
    Object.entries(this.taxonomyCounts).forEach(([key, count]) => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (btn) => btn.textContent.trim().includes(taxonomyMap[key])
      );

      if (button) {
        // Remove existing count if any
        let countSpan = button.querySelector(".taxonomy-count");
        if (!countSpan) {
          countSpan = document.createElement("span");
          countSpan.className =
            "taxonomy-count ml-2 bg-eu-blue/10 text-eu-blue text-xs font-medium px-2 py-0.5 rounded-full";
          button.appendChild(countSpan);
        }
        countSpan.textContent = this.formatNumber(count);
      }
    });
  }

  async loadDocuments() {
    try {
      const response = await fetch(
        "assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.ndjsonRaw = await response.text();
      // Store both the document and its original line number
      const lines = this.ndjsonRaw.trim().split("\n");
      this.documentData = [];
      
      lines.forEach((line, index) => {
        if (line.trim() === "") return;
        
        try {
          const item = JSON.parse(line);
          // Only include prose items with sufficient content
          if (item.structure_type === "prose" &&
              item.text &&
              item.text.trim().length > 0 &&
              !item.text.startsWith("![]") &&
              item.text.length > 50) {
            // Store the original line number (1-based) with the document
            item.originalLineNumber = index + 1;
            this.documentData.push(item);
          }
        } catch (e) {
          console.error(`Error parsing line ${index + 1}:`, e);
        }
      });

      console.log(`Loaded ${this.documentData.length} documents`);

      // Count taxonomy items
      this.countTaxonomyItems();

      // Display all documents at once
      this.displayAllDocuments();

      return this.documentData;
    } catch (error) {
      console.error("Error loading document data:", error);
      this.showError(`Error loading document: ${error.message}`);
      throw error;
    }
  }

  // Get the appropriate structure handler for a document
  getStructureHandler(doc) {
    const type = doc.structure_type || "prose";
    return this.structureHandlers[type] || this.structureHandlers.default;
  }

  // Process a single document element with the appropriate handler
  processDocumentElement(doc, index) {
    const handler = this.getStructureHandler(doc);
    const content = doc.text || "";
    // Create a wrapper div with document ID for reference
    const wrapper = document.createElement('div');
    wrapper.className = 'document-element';
    wrapper.dataset.docId = index;
    wrapper.innerHTML = handler.call(this, content, doc, this.lastSelectedText || null);
    return wrapper.outerHTML;
  }

  displayAllDocuments() {
    if (!this.documentData || this.documentData.length === 0) {
      this.showError("No documents to display");
      return;
    }

    let content = "";
    let lastHeader = "";
    let currentTableContent = "";
    let inTable = false;

    // Find the main document title
    const mainTitleDoc = this.documentData.find(
      (d) => d.header && d.header.includes("AI ADOPTION IN THE PUBLIC SECTOR")
    );

    // Update canvas header with the main title
    const canvasTitle = document.querySelector("#columns-container h2");
    if (canvasTitle) {
      canvasTitle.textContent = mainTitleDoc
        ? this.stripMarkdown(mainTitleDoc.header)
        : "AI ADOPTION IN THE PUBLIC SECTOR";
    }

    // Process all documents
    this.documentData.forEach((doc, index) => {
      // Skip the main title if we already added it
      if (mainTitleDoc && doc === mainTitleDoc) return;

      // Handle table structure
      if (doc.structure_type === "table") {
        inTable = true;
        currentTableContent = "";
      } else if (doc.structure_type === "table_row" && inTable) {
        currentTableContent += this.processDocumentElement(doc, index);
        // Skip further processing until we hit the end of the table
        return;
      } else if (inTable && doc.structure_type !== "table_row") {
        // We've reached the end of a table, process the accumulated content
        content += this.structureHandlers.table.call(this, currentTableContent);
        inTable = false;
      }

      // Add header if exists and different from last header
      if (doc.header) {
        const currentHeader = this.stripMarkdown(doc.header);
        if (currentHeader !== lastHeader) {
          // Close any open table before adding a new header
          if (inTable) {
            content += this.structureHandlers.table.call(
              this,
              currentTableContent
            );
            inTable = false;
          }

          const headerContent = this.structureHandlers.heading.call(
            this,
            doc.header,
            { header: doc.header }
          );
          content += headerContent;
          lastHeader = currentHeader;
        }
      } else {
        lastHeader = ""; // Reset last header if current doc has no header
      }

      // Process the current document element
      if (doc.text) {
        if (inTable) {
          // Table content is accumulated in currentTableContent
          currentTableContent += this.processDocumentElement(doc, index);
        } else {
          content += this.processDocumentElement(doc, index);
        }
      }
    });

    // Close any open table at the end of the document
    if (inTable) {
      content += this.structureHandlers.table.call(this, currentTableContent);
    }

    // Update the document container
    if (this.documentContainer) {
      this.documentContainer.innerHTML = content;
    }

    // Initialize any interactive elements if needed
    this.initializeDocumentInteractions();
  }

  // Helper function to escape special regex characters
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Apply taxonomy highlights to text
  applyTaxonomyHighlights(text, taxonomy, selectedText = null) {
    if (!text || !taxonomy) return text;

    // Define taxonomy categories and their corresponding CSS classes and colors
    const taxonomyMap = {
      almp_instruments: {
        class: "almp",
        color: "red-500",
        displayName: "ALMP Instruments",
      },
      target_groups: {
        class: "target",
        color: "blue-500",
        displayName: "Target Groups",
      },
      delivery_modes: {
        class: "delivery",
        color: "green-500",
        displayName: "Delivery Modes",
      },
      evaluation_design: {
        class: "evaluation",
        color: "yellow-500",
        displayName: "Evaluation Design",
      },
    };

    let highlighted = text;

    // If a selection is being assigned, only highlight that instance
    if (selectedText) {
      Object.entries(taxonomy).forEach(([category, terms]) => {
        const config = taxonomyMap[category];
        if (!config || !terms || !Array.isArray(terms)) return;
        terms.forEach((term) => {
          if (!term) return;
          if (term === selectedText) {
            // Only replace the first occurrence
            const pattern = new RegExp(this.escapeRegExp(term), "");
            const highlightedTerm = `<span class=\"taxonomy-highlight bg-${config.color}/10 border-l-4 border-${config.color} px-1 py-0.5 relative group cursor-help\">${term}<span class=\"tooltip hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded whitespace-nowrap z-10\">${config.displayName}: ${term}<span class=\"absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 transform rotate-45\"></span></span></span>`;
            highlighted = highlighted.replace(pattern, highlightedTerm);
          }
        });
      });
      return highlighted;
    }

    // Default: highlight all taxonomy terms as before
    Object.entries(taxonomy).forEach(([category, terms]) => {
      const config = taxonomyMap[category];
      if (!config || !terms || !Array.isArray(terms)) return;
      terms.forEach((term) => {
        if (!term) return;
        const pattern = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, "gi");
        const highlightedTerm = `\n          <span class=\"taxonomy-highlight bg-${config.color}/10 border-l-4 border-${config.color} px-1 py-0.5 relative group cursor-help\">$&\n            <span class=\"tooltip hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded whitespace-nowrap z-10\">\n              ${config.displayName}: ${term}\n              <span class=\"absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 transform rotate-45\"></span>\n            </span>\n          </span>\n        `;
        highlighted = highlighted.replace(pattern, highlightedTerm);
      });
    });
    return highlighted;
  }

  // Format text with markdown and taxonomy highlights
  formatText(text, taxonomy = {}) {
    if (!text) return "";

    // First escape HTML to prevent XSS
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Apply taxonomy highlights if we have taxonomy data
    if (taxonomy && Object.keys(taxonomy).length > 0) {
      formatted = this.applyTaxonomyHighlights(formatted, taxonomy);
    }

    // Replace markdown-style headers
    formatted = formatted
      .replace(
        /^#\s+(.*$)/gm,
        '<h2 class="text-xl font-semibold text-eu-blue mt-6 mb-3">$1</h2>'
      )
      .replace(
        /^##\s+(.*$)/gm,
        '<h3 class="text-lg font-semibold text-eu-blue mt-5 mb-2">$1</h3>'
      )
      .replace(
        /^###\s+(.*$)/gm,
        '<h4 class="font-semibold text-eu-blue mt-4 mb-2">$1</h4>'
      );

    // Replace markdown-style bold and italic
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/_(.*?)_/g, "<em>$1</em>");

    // Replace markdown-style lists
    formatted = formatted
      .replace(/^\*\s+(.*$)/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/g, '<ul class="list-disc pl-6 my-2">$1</ul>');

    // Handle paragraphs
    return formatted
      .split("\n\n")
      .filter((para) => para.trim() !== "")
      .map((para) => {
        // Skip if already wrapped in a tag
        if (para.trim().match(/^<[a-z][\s\S]*>/i)) {
          return para;
        }
        // Don't wrap list items or lists in paragraphs
        if (para.trim().startsWith("<li>") || para.trim().startsWith("<ul>")) {
          return para;
        }
        return `<p class="mb-4">${para}</p>`;
      })
      .join("\n");
  }

  stripMarkdown(text) {
    if (!text) return "";
    return text.replace(/\*\*|\*|_/g, "");
  }

  showError(message) {
    if (this.documentContainer) {
      this.documentContainer.innerHTML = `
        <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>${message}</p>
        </div>
      `;
    }
  }

  // Initialize interactive elements in the document
  initializeDocumentInteractions() {
    // Initialize tooltips for taxonomy highlights
    const taxonomyHighlights = this.documentContainer?.querySelectorAll(
      ".taxonomy-highlight"
    );
    if (taxonomyHighlights) {
      taxonomyHighlights.forEach((highlight) => {
        // Add event listeners for better mobile support
        highlight.addEventListener("click", (e) => {
          e.stopPropagation();
          // Toggle active state on mobile
          highlight.classList.toggle("active");
        });

        // Close tooltip when clicking outside
        document.addEventListener(
          "click",
          (e) => {
            if (!highlight.contains(e.target)) {
              highlight.classList.remove("active");
            }
          },
          { once: true }
        );
      });
    }

    // Add click handlers for any interactive document elements
    const documentElements =
      this.documentContainer?.querySelectorAll(".document-element");
    if (documentElements) {
      documentElements.forEach((element) => {
        element.addEventListener("click", (e) => {
          // Handle document element click if needed
          // e.g., for selection, annotation, etc.
        });
      });
    }

    // Add selection and taxonomy assignment logic
    this.documentContainer.addEventListener("mouseup", (e) => {
      // Check if the click was inside a highlight element
      if (e.target.closest('.taxonomy-highlight')) {
        // Don't show taxonomy popup for clicks on existing highlights
        return;
      }
      
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      if (selectedText.length > 0) {
        // Show taxonomy popup
        this.showTaxonomyPopup(e.clientX, e.clientY, selectedText);
      }
    });
  }

  showTaxonomyPopup(x, y, selectedText) {
    this.lastSelectedText = selectedText;
    let oldPopup = document.getElementById("taxonomy-popup");
    if (oldPopup) oldPopup.remove();
    // Enhanced popup structure
    const popup = document.createElement("div");
    popup.id = "taxonomy-popup";
    // Temporarily set visibility hidden to measure height
    popup.style.visibility = "hidden";
    popup.style.left = x + "px";
    popup.style.top = y + "px";
    // Header
    const header = document.createElement("div");
    header.className = "popup-header";
    header.innerHTML = `Assign taxonomy:`;
    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => popup.remove();
    header.appendChild(closeBtn);
    popup.appendChild(header);
    const preview = document.createElement("div");
    preview.className = "selected-text-preview";
    preview.textContent = selectedText;
    popup.appendChild(preview);
    const options = document.createElement("div");
    options.className = "taxonomy-options";
    this.taxonomyTypes.forEach((type) => {
      const option = document.createElement("button");
      option.className = "taxonomy-option";
      option.setAttribute("data-taxonomy", type);
      const colorIndicator = document.createElement("span");
      colorIndicator.className = "taxonomy-color-indicator";
      option.appendChild(colorIndicator);
      const name = document.createElement("span");
      name.className = "taxonomy-name";
      name.textContent = type.replace(/_/g, " ");
      option.appendChild(name);
      option.onclick = () => {
        this.assignTaxonomy(selectedText, type);
        popup.remove();
      };
      options.appendChild(option);
    });
    popup.appendChild(options);
    const footer = document.createElement("div");
    footer.className = "popup-footer";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => popup.remove();
    footer.appendChild(cancelBtn);
    popup.appendChild(footer);
    document.body.appendChild(popup);
    // Now measure popup height and adjust position
    setTimeout(() => {
      popup.style.visibility = "visible";
      const popupRect = popup.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // If not enough space below, show above
      if (y + popupRect.height > windowHeight - 10) {
        let newTop = y - popupRect.height;
        if (newTop < 10) newTop = 10; // Prevent offscreen top
        popup.style.top = newTop + "px";
      }
    }, 0);
    // Remove popup if clicking outside
    setTimeout(() => {
      document.addEventListener("mousedown", function handler(ev) {
        if (!popup.contains(ev.target)) {
          popup.remove();
          document.removeEventListener("mousedown", handler);
        }
      });
    }, 100);
  }

  assignTaxonomy(selectedText, taxonomyType) {
    // Console log as requested
    console.log("Highlighted:", selectedText, "Taxonomy:", taxonomyType);
    
    // Get the current selection
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // Find the document element that contains the selection
    let docElement = range.startContainer;
    while (docElement && !docElement.classList?.contains('document-element')) {
      docElement = docElement.parentNode;
    }
    
    if (!docElement) {
      console.warn('Could not find document element containing selection');
      return;
    }
    
    // Find the corresponding document data
    const docId = docElement.dataset.docId;
    const doc = this.documentData[docId];
    if (!doc) return;
    
    // Get the original line number from the document
    const lineNumber = doc.originalLineNumber;
    
    // Ensure enrichment and taxonomy exist
    if (!doc.enrichment) doc.enrichment = {};
    if (!doc.enrichment.taxonomy) doc.enrichment.taxonomy = {};
    if (!doc.enrichment.taxonomy[taxonomyType]) {
      doc.enrichment.taxonomy[taxonomyType] = [];
    }
    
    // Create a unique identifier for this specific selection
    const selectionId = `sel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const selectionData = {
      id: selectionId,
      text: selectedText,
      lineNumber: lineNumber, // Include line number in selection data
      created: new Date().toISOString()
    };
    
    // Add the selection data to the taxonomy
    doc.enrichment.taxonomy[taxonomyType].push(selectionData);
    
    // Log the highlight with line number
    console.log(`Added highlight from line ${lineNumber}:`, JSON.stringify({
      id: selectionId,
      text: selectedText,
      lineNumber: lineNumber,
      taxonomyType: taxonomyType,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    // Create a highlight span for the exact selection
    const span = document.createElement('span');
    span.className = `taxonomy-highlight ${taxonomyType}`;
    span.dataset.taxonomyType = taxonomyType;
    span.dataset.selectionId = selectionId;
    span.title = this.getTaxonomyDisplayName(taxonomyType);
    
    try {
      // Surround the exact selection with our highlight span
      range.surroundContents(span);
      
      // Clear the selection
      window.getSelection().removeAllRanges();
      
      // Update NDJSON raw data in memory
      this.updateNDJSONRaw();
      
      // Update the document data to preserve the highlight
      this.documentData[docId] = doc;
      
      // Update the UI to show the highlight
      this.applySingleHighlight(span, selectionData, taxonomyType);
      
    } catch (e) {
      console.error('Error highlighting selection:', e);
    }
    
    this.lastSelectedText = null;
  }

  // Get the display name for a taxonomy type
  getTaxonomyDisplayName(taxonomyType) {
    const displayNames = {
      'almp_instruments': 'ALMP Instruments',
      'target_groups': 'Target Groups',
      'delivery_modes': 'Delivery Modes',
      'evaluation_design': 'Evaluation Design'
    };
    return displayNames[taxonomyType] || taxonomyType;
  }

  // Apply highlighting to a single selection
  applySingleHighlight(span, selectionData, taxonomyType) {
    // Add tooltip with taxonomy info
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.textContent = this.getTaxonomyDisplayName(taxonomyType);
    
    // Add hover effect
    span.addEventListener('mouseenter', () => {
      const rect = span.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX}px`;
      tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
      tooltip.style.display = 'block';
      document.body.appendChild(tooltip);
    });
    
    span.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
    
    // Add double-click handler to remove the highlight with confirmation
    span.addEventListener('dblclick', async (e) => {
      const result = await Swal.fire({
        title: 'Remove Highlight',
        text: 'Are you sure you want to remove this highlight?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#003087', // EU Blue
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, remove it!',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'bg-eu-blue hover:bg-eu-blue-dark text-white font-medium py-2 px-4 rounded-md',
          cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md',
          popup: 'rounded-lg shadow-lg'
        }
      });
      
      if (result.isConfirmed) {
        this.removeHighlight(span, selectionData.id);
      }
    });
  }
  
  // Remove a highlight by its ID
  removeHighlight(highlightElement, selectionId) {
    if (!highlightElement || !selectionId) return;
    
    // Find the document element containing this highlight
    let docElement = highlightElement;
    while (docElement && !docElement.classList?.contains('document-element')) {
      docElement = docElement.parentNode;
    }
    
    if (!docElement) return;
    
    // Find the document data
    const docId = docElement.dataset.docId;
    const doc = this.documentData[docId];
    if (!doc || !doc.enrichment?.taxonomy) return;
    
    // Remove the highlight from the document data
    Object.keys(doc.enrichment.taxonomy).forEach(taxonomyType => {
      const items = doc.enrichment.taxonomy[taxonomyType];
      if (Array.isArray(items)) {
        doc.enrichment.taxonomy[taxonomyType] = items.filter(
          item => item.id !== selectionId
        );
      }
    });
    
    // Remove the highlight element from the DOM
    if (highlightElement.parentNode) {
      const parent = highlightElement.parentNode;
      parent.replaceChild(
        document.createTextNode(highlightElement.textContent), 
        highlightElement
      );
      parent.normalize(); // Merge adjacent text nodes
    }
    
    // Update the document data
    this.updateNDJSONRaw();
  }

  updateNDJSONRaw() {
    // Update ndjsonRaw from documentData
    this.ndjsonRaw = this.documentData
      .map((obj) => JSON.stringify(obj))
      .join("\n");
    // Optionally, you can POST this.ndjsonRaw to server for persistence
  }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  window.doccanoApp = new DoccanoApp();
});
