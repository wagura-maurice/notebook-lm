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
    
    // Initialize taxonomy counts
    this.taxonomyCounts = {
      almp_instruments: 0,
      target_groups: 0,
      delivery_modes: 0,
      evaluation_design: 0,
    };
    
    // Track highlight history for undo/redo functionality
    this.highlightHistory = [];
    this.redoHistory = [];
    
    // Initialize visualizer
    console.log('Initializing DoccanoVisualizer...');
    try {
      this.visualizer = new DoccanoVisualizer(this);
      console.log('DoccanoVisualizer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DoccanoVisualizer:', error);
    }
    
    // Initialize visualization data
    this.usageStats = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };
    this.confidenceScores = [];
    this.tokenUsageChart = null;

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
    
    // Set up action buttons
    const undoButton = document.querySelector("button[title='Undo']");
    const redoButton = document.querySelector("button[title='Redo']");
    const saveButton = document.querySelector("button[title='Save']");
    
    if (undoButton) {
      undoButton.addEventListener("click", () => this.undoLastHighlight());
    }
    
    if (redoButton) {
      redoButton.addEventListener("click", () => this.redoLastUndo());
    }
    
    if (saveButton) {
      saveButton.addEventListener("click", () => this.saveHighlights());
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
    console.group('=== START: countTaxonomyItems ===');
    console.log('Starting taxonomy item count...');
    
    // Reset counts
    const initialCounts = {
      almp_instruments: 0,
      target_groups: 0,
      delivery_modes: 0,
      evaluation_design: 0,
    };
    this.taxonomyCounts = { ...initialCounts };
    console.log('Initialized taxonomy counts:', this.taxonomyCounts);

    if (!this.documentData) {
      console.error('documentData is undefined');
      console.groupEnd();
      return;
    }

    if (!Array.isArray(this.documentData)) {
      console.error('documentData is not an array:', typeof this.documentData);
      console.groupEnd();
      return;
    }

    console.log(`Processing ${this.documentData.length} documents`);

    if (this.documentData.length === 0) {
      console.warn('documentData array is empty');
      this.updateTaxonomyUI();
      console.groupEnd();
      return;
    }

    // Count items in each document
    this.documentData.forEach((doc, index) => {
      console.group(`Processing document ${index}`);
      
      if (!doc) {
        console.warn(`Document at index ${index} is null or undefined`);
        console.groupEnd();
        return;
      }
      
      console.log('Document structure:', Object.keys(doc));
      
      if (!doc.enrichment) {
        console.log('Document has no enrichment data');
        console.groupEnd();
        return;
      }
      
      if (!doc.enrichment.taxonomy) {
        console.log('Document has no taxonomy data in enrichment');
        console.groupEnd();
        return;
      }
      
      const { taxonomy } = doc.enrichment;
      console.log(`Document ${index} taxonomy structure:`, Object.keys(taxonomy));
      
      // Count each taxonomy type
      Object.keys(initialCounts).forEach(type => {
        console.group(`Processing taxonomy type: ${type}`);
        
        if (taxonomy[type] === undefined) {
          console.log(`No data for ${type}, skipping`);
          console.groupEnd();
          return;
        }
        
        if (Array.isArray(taxonomy[type])) {
          const count = taxonomy[type].length;
          const prevCount = this.taxonomyCounts[type];
          this.taxonomyCounts[type] += count;
          console.log(`Found ${count} items (total: ${this.taxonomyCounts[type]})`);
          if (count > 0) {
            console.log('Sample items:', taxonomy[type].slice(0, 2));
          }
        } else if (taxonomy[type] && typeof taxonomy[type] === 'object') {
          const count = Object.keys(taxonomy[type]).length;
          const prevCount = this.taxonomyCounts[type];
          this.taxonomyCounts[type] += count;
          console.log(`Found ${count} items in object format (total: ${this.taxonomyCounts[type]})`);
          if (count > 0) {
            console.log('Sample keys:', Object.keys(taxonomy[type]).slice(0, 2));
          }
        } else {
          console.warn(`Unexpected data type for ${type}:`, typeof taxonomy[type]);
        }
        
        console.groupEnd();
      });
      
      console.groupEnd(); // End document group
    });

    console.log('=== FINAL COUNTS ===');
    console.table(this.taxonomyCounts);
    
    // Log UI update attempt
    console.log('Updating UI with counts...');
    this.updateTaxonomyUI();
    
    console.log('=== END: countTaxonomyItems ===');
    console.groupEnd();
  }

  // Update the UI with taxonomy counts
  updateTaxonomyUI() {
    console.group('=== START: updateTaxonomyUI ===');
    console.log('Current taxonomy counts:', this.taxonomyCounts);
    
    // Update each taxonomy button with its count
    Object.entries(this.taxonomyCounts).forEach(([taxonomyType, count]) => {
      console.group(`Updating UI for ${taxonomyType}`);
      
      // Try to find button by data attribute
      const selector = `button[data-taxonomy-type="${taxonomyType}"]`;
      console.log(`Looking for button with selector: ${selector}`);
      
      const button = document.querySelector(selector);
      
      if (!button) {
        console.error(`❌ Could not find button with selector: ${selector}`);
        console.groupEnd();
        return;
      }
      
      console.log('Found button:', button);
      
      // Find or create the count span
      let countSpan = button.querySelector('.taxonomy-count');
      console.log('Existing count span:', countSpan);
      
      if (!countSpan) {
        console.log('No existing count span found, looking deeper...');
        // Look for the count span in the button's children
        const spans = button.getElementsByClassName('taxonomy-count');
        console.log(`Found ${spans.length} spans with class 'taxonomy-count'`);
        
        countSpan = spans.length > 0 ? spans[0] : null;
        
        // If still not found, create a new one
        if (!countSpan) {
          console.log('Creating new count span...');
          countSpan = document.createElement('span');
          countSpan.className = 'taxonomy-count bg-eu-blue/10 text-eu-blue text-xs font-medium px-2 py-0.5 rounded-full ml-2';
          
          // Find the text node to insert the count after
          const buttonText = Array.from(button.childNodes).find(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
          );
          
          if (buttonText) {
            console.log('Found text node, inserting after:', buttonText);
            buttonText.after(countSpan);
          } else {
            // If no text node found, just append to the end
            console.log('No text node found, appending to button');
            button.appendChild(countSpan);
          }
        }
      }
      
      // Update the count text and visibility
      if (countSpan) {
        console.log(`Setting count to: ${count}`);
        countSpan.textContent = count > 0 ? this.formatNumber(count) : '';
        countSpan.style.display = count > 0 ? 'inline-flex' : 'none';
        console.log('Updated count span:', countSpan);
      } else {
        console.error(`❌ Failed to find or create count span for: ${taxonomyType}`);
        console.log('Button HTML:', button.outerHTML);
      }
      
      console.groupEnd(); // End taxonomy type group
    });
    
    console.log('=== END: updateTaxonomyUI ===');
    console.groupEnd();
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
  }

  async loadDocuments() {
    try {
      // Show loading state
      if (this.documentContainer) {
        this.documentContainer.innerHTML = "<p>Loading document data...</p>";
      }

      // Load the NDJSON file
      const response = await fetch(
        "./assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson"
      );
      const text = await response.text();
      
      // Parse the NDJSON file and store line numbers
      this.documentData = text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line, index) => {
          try {
            const doc = JSON.parse(line);
            // Store the original line number (1-based)
            doc.originalLineNumber = index + 1;
            return doc;
          } catch (e) {
            console.error(`Error parsing line ${index + 1}:`, e);
            return null;
          }
        })
        .filter((doc) => doc !== null);

      console.log(`Loaded ${this.documentData.length} documents`);

      // Count taxonomy items in all loaded documents and update the UI
      this.countTaxonomyItems();

      console.log('Processing data for visualization...');
      if (this.visualizer) {
        console.log('Visualizer found, processing data...');
        this.visualizer.processData(this.documentData);
      } else {
        console.error('Visualizer not initialized');
      }

      // Display all documents
      this.displayAllDocuments();

      return this.documentData;
    } catch (error) {
      console.error("Error loading document data:", error);
      this.showError(`Error loading document: ${error.message}`);
      throw error;
    }
  }
    
  // Get the appropriate structure handler for the document
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

  // Store the exact position of the current selection
  storeSelectionPosition(selection) {
    if (!selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    // Get the exact position of the selection within its text node
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    const textNode = range.startContainer;
    const fullText = textNode.textContent || '';
    const exactText = fullText.substring(startOffset, endOffset);
    
    // Store the exact path to this text node for precise restoration
    const path = this.getNodePath(textNode);
    
    return {
      path: path,
      startOffset: startOffset,
      endOffset: endOffset,
      text: range.toString(),
      exactText: exactText
    };
  }

  // Helper method to find the document element containing a node
  getDocumentElement(node) {
    while (node && !node.classList?.contains('document-element')) {
      node = node.parentNode;
    }
    return node;
  }

  assignTaxonomy(_, taxonomyType) {
    // Get the current selection
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    if (!selectedText) return;
    
    // Get document and line information
    const docElement = this.getDocumentElement(range.commonAncestorContainer);
    if (!docElement) return;
    
    const docId = docElement.dataset.docId;
    const doc = this.documentData[docId];
    if (!doc) return;
    
    const originalLineNumber = doc.originalLineNumber || 'unknown';
    
    // Enhanced logging with line information
    console.log(
      `[Line ${originalLineNumber}] Highlighted: "${selectedText}"`,
      `Taxonomy: ${taxonomyType}`,
      `(Source: AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson:${originalLineNumber})`
    );
    
    // Create a unique ID for this highlight
    const selectionId = `sel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get the line number by finding the closest paragraph or heading
    let lineElement = range.startContainer;
    while (lineElement && lineElement !== docElement && 
          !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'LI'].includes(lineElement.nodeName)) {
      lineElement = lineElement.parentNode;
    }
    
    // Get the visual line number in the document
    let visualLineNumber = 0;
    if (lineElement?.parentNode) {
      const siblings = Array.from(lineElement.parentNode.children);
      visualLineNumber = siblings.indexOf(lineElement) + 1; // 1-based index
    }
    
    // Use the original line number if available, otherwise use the visual line number
    const displayLineNumber = originalLineNumber || visualLineNumber;
    
    // Initialize taxonomy data if it doesn't exist
    if (!doc.enrichment) doc.enrichment = {};
    if (!doc.enrichment.taxonomy) doc.enrichment.taxonomy = {};
    if (!doc.enrichment.taxonomy[taxonomyType]) {
      doc.enrichment.taxonomy[taxonomyType] = [];
    }
    
    // Create selection data with line information
    const selectionData = {
      id: selectionId,
      text: selectedText,
      type: taxonomyType,
      lineNumber: displayLineNumber,
      originalLineNumber: doc.originalLineNumber || null,
      visualLineNumber: visualLineNumber,
      timestamp: new Date().toISOString(),
      context: {
        elementType: lineElement ? lineElement.nodeName.toLowerCase() : 'unknown',
        elementText: lineElement ? lineElement.textContent.substring(0, 100) + (lineElement.textContent.length > 100 ? '...' : '') : '',
        fullPath: this.getNodePath(range.startContainer)
      }
    };
    
    // Add the selection data to the taxonomy
    doc.enrichment.taxonomy[taxonomyType].push(selectionData);
    
    // Create the highlight span
    const highlightSpan = document.createElement('span');
    highlightSpan.className = `taxonomy-highlight ${taxonomyType}`;
    highlightSpan.dataset.taxonomyType = taxonomyType;
    highlightSpan.dataset.selectionId = selectionId;
    highlightSpan.title = `${this.getTaxonomyDisplayName(taxonomyType)} (Line ${displayLineNumber})`;
    
    try {
      // Surround the exact selection with our highlight span
      range.surroundContents(highlightSpan);
      
      // Clear the selection
      selection.removeAllRanges();
      
      // Store the highlight in the document data
      if (!doc.enrichment) doc.enrichment = {};
      if (!doc.enrichment.taxonomy) doc.enrichment.taxonomy = {};
      if (!Array.isArray(doc.enrichment.taxonomy[taxonomyType])) {
        doc.enrichment.taxonomy[taxonomyType] = [];
      }
      
      // Add to highlight history for undo/redo
      const highlightData = {
        id: selectionId,
        text: selectedText,
        type: taxonomyType,
        lineNumber: displayLineNumber,
        originalLineNumber: doc.originalLineNumber || null,
        visualLineNumber: visualLineNumber,
        elementType: lineElement ? lineElement.nodeName.toLowerCase() : 'unknown',
        context: lineElement ? lineElement.textContent.substring(0, 100) + '...' : '',
        timestamp: new Date().toISOString()
      };
      
      this.highlightHistory.push({
        type: 'add',
        docId: docId,
        selectionId: selectionId,
        taxonomyType: taxonomyType,
        element: highlightSpan,
        exactText: selectedText,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        lineNumber: docElement.dataset.lineNumber,
        path: this.getNodePath(range.startContainer)  // Store the path for precise restoration
      });
      
      // Clear redo history since we've made a new change
      this.redoHistory = [];
      
      // Update the raw NDJSON data
      this.updateNDJSONRaw();
      
      // Update taxonomy counts in the UI
      this.countTaxonomyItems();
      
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
    
    // Update taxonomy counts in the UI
    this.countTaxonomyItems();
  }

  // Find text node by path and offset
  findTextNodeByPath(path, offset) {
    try {
      let node = document.body;
      for (const index of path) {
        node = node.childNodes[index];
        if (!node) return null;
      }
      return node.nodeType === Node.TEXT_NODE ? node : null;
    } catch (e) {
      console.error('Error finding text node:', e);
      return null;
    }
  }

  // Get the path to a node from the document body
  getNodePath(node) {
    const path = [];
    while (node && node !== document.body) {
      const parent = node.parentNode;
      if (!parent) break;
      
      let index = 0;
      let sibling = parent.firstChild;
      while (sibling && sibling !== node) {
        if (sibling.nodeType === Node.ELEMENT_NODE || 
            sibling.nodeType === Node.TEXT_NODE) {
          index++;
        }
        sibling = sibling.nextSibling;
      }
      
      path.unshift(index);
      node = parent;
    }
    return path;
  }

  // Undo the last highlight action
  async undoLastHighlight() {
    if (this.highlightHistory.length === 0) return;
    
    // Get the last highlight from history
    const lastHighlight = this.highlightHistory.pop();
    if (!lastHighlight) return;
    
    // Find the highlight element using the exact selection ID
    const highlightElement = document.querySelector(`[data-selection-id="${lastHighlight.selectionId}"]`);
    
    if (highlightElement) {
      // Store the exact text and position for redo
      lastHighlight.exactText = highlightElement.textContent || '';
      lastHighlight.startOffset = highlightElement.dataset.startOffset;
      lastHighlight.endOffset = highlightElement.dataset.endOffset;
      lastHighlight.lineNumber = highlightElement.dataset.lineNumber;
      lastHighlight.path = lastHighlight.path || this.getNodePath(highlightElement);
      
      // Store the parent node and next sibling for precise reinsertion
      lastHighlight.parentNode = highlightElement.parentNode;
      lastHighlight.nextSibling = highlightElement.nextSibling;
      
      // Remove the highlight
      this.removeHighlight(highlightElement, lastHighlight.selectionId);
      
      // Add to redo history
      this.redoHistory.push(lastHighlight);
    }
  }

  // Redo the last undone highlight action
  async redoLastUndo() {
    if (this.redoHistory.length === 0) return;
    
    // Get the last undone highlight
    const lastUndone = this.redoHistory.pop();
    if (!lastUndone) return;
    
    // Find the document element
    const doc = this.documentData[lastUndone.docId];
    if (!doc) return;
    
    // Recreate the highlight data with all necessary position info
    const selectionData = {
      id: lastUndone.selectionId,
      text: lastUndone.exactText || lastUndone.text || '',
      startOffset: lastUndone.startOffset,
      endOffset: lastUndone.endOffset,
      lineNumber: lastUndone.lineNumber,
      created: new Date().toISOString()
    };
    
    // Add back to the document data
    if (!doc.enrichment) doc.enrichment = {};
    if (!doc.enrichment.taxonomy) doc.enrichment.taxonomy = {};
    if (!doc.enrichment.taxonomy[lastUndone.taxonomyType]) {
      doc.enrichment.taxonomy[lastUndone.taxonomyType] = [];
    }
    
    // Check if this highlight already exists
    const exists = doc.enrichment.taxonomy[lastUndone.taxonomyType].some(
      item => item.id === lastUndone.selectionId
    );
    
    if (!exists) {
      // Add to document data first
      doc.enrichment.taxonomy[lastUndone.taxonomyType].push(selectionData);
      
      // Create a new span for the highlight
      const span = document.createElement('span');
      span.className = `taxonomy-highlight ${lastUndone.taxonomyType}`;
      span.dataset.selectionId = lastUndone.selectionId;
      span.dataset.taxonomyType = lastUndone.taxonomyType;
      span.dataset.startOffset = lastUndone.startOffset;
      span.dataset.endOffset = lastUndone.endOffset;
      span.dataset.lineNumber = lastUndone.lineNumber;
      span.title = this.getTaxonomyDisplayName(lastUndone.taxonomyType);
      
      // Try to find the exact text node using the stored path
      let targetNode = null;
      if (lastUndone.path) {
        targetNode = this.findTextNodeByPath(lastUndone.path, 0);
      }

      let highlightApplied = false;
      
      // First try: Use the exact path and offsets if possible
      if (targetNode && targetNode.nodeType === Node.TEXT_NODE) {
        const text = targetNode.textContent || '';
        const start = parseInt(lastUndone.startOffset, 10);
        const end = parseInt(lastUndone.endOffset, 10);
        
        // Only proceed if the text at the position matches what we expect
        const expectedText = lastUndone.exactText || lastUndone.text || '';
        const actualText = text.substring(start, end);
        
        if (start >= 0 && end <= text.length && actualText === expectedText) {
          const before = text.substring(0, start);
          const after = text.substring(end);
          
          // Create new nodes
          const beforeNode = document.createTextNode(before);
          const afterNode = document.createTextNode(after);
          
          // Set the text content of our highlight span
          span.textContent = expectedText;
          
          // Replace the text node with our new structure
          const parent = targetNode.parentNode;
          if (parent) {
            parent.replaceChild(beforeNode, targetNode);
            parent.insertBefore(span, beforeNode.nextSibling);
            
            // Only add after node if there's content after the highlight
            if (after) {
              parent.insertBefore(afterNode, span.nextSibling);
            }
            
            // Apply the highlight styling and events
            this.applySingleHighlight(span, selectionData, lastUndone.taxonomyType);
            highlightApplied = true;
          }
        }
      }
      
      // Second try: If exact position didn't work, try to find the text in the document
      if (!highlightApplied) {
        console.warn('Could not find exact position, falling back to text search');
        const range = document.createRange();
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        const searchText = lastUndone.exactText || lastUndone.text || '';
        let node;
        
        while ((node = walker.nextNode())) {
          const text = node.nodeValue || '';
          const index = text.indexOf(searchText);
          
          if (index !== -1) {
            const before = text.substring(0, index);
            const after = text.substring(index + searchText.length);
            
            // Create new nodes
            const beforeNode = document.createTextNode(before);
            const afterNode = document.createTextNode(after);
            
            // Set the text content of our highlight span
            span.textContent = searchText;
            
            // Replace the text node with our new structure
            const parent = node.parentNode;
            if (parent) {
              parent.replaceChild(beforeNode, node);
              parent.insertBefore(span, beforeNode.nextSibling);
              
              // Only add after node if there's content after the highlight
              if (after) {
                parent.insertBefore(afterNode, span.nextSibling);
              }
              
              // Apply the highlight styling and events
              this.applySingleHighlight(span, selectionData, lastUndone.taxonomyType);
              highlightApplied = true;
              break;
            }
          }
        }
      }
      
      if (!highlightApplied) {
        console.error('Could not find text to redo highlight:', lastUndone);
        // Remove from document data since we couldn't apply the highlight
        const index = doc.enrichment.taxonomy[lastUndone.taxonomyType].findIndex(
          item => item.id === lastUndone.selectionId
        );
        if (index !== -1) {
          doc.enrichment.taxonomy[lastUndone.taxonomyType].splice(index, 1);
        }
        return;
      }
      
      // Update the document data
      this.documentData[lastUndone.docId] = doc;
      
      // Update the lastUndone object with the new element reference
      lastUndone.element = span;
    }
    
    // Add back to history
    this.highlightHistory.push(lastUndone);
    
    // Update the UI
    this.updateNDJSONRaw();
    this.countTaxonomyItems();
  }

  // Save highlights - for now just logs the data to console
  saveHighlights() {
    console.log('Saving highlights...');
    console.log('Current document data:', this.documentData);
    
    // Get all highlights from the document
    const highlights = [];
    this.documentData.forEach((doc, docIndex) => {
      if (doc.enrichment?.taxonomy) {
        Object.entries(doc.enrichment.taxonomy).forEach(([taxonomyType, items]) => {
          items.forEach(item => {
            highlights.push({
              documentIndex: docIndex,
              taxonomyType,
              text: item.text,
              id: item.id,
              lineNumber: item.lineNumber
            });
          });
        });
      }
    });
    
    console.log('All highlights:', highlights);
    console.log('Total highlights:', highlights.length);
    
    // Show a success toast
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
      title: `Saved ${highlights.length} highlight${highlights.length !== 1 ? 's' : ''}`,
      background: '#fff',
      iconColor: '#003087',
      color: '#1a1a1a',
      customClass: {
        popup: 'border border-gray-200 rounded-lg shadow-lg'
      }
    });
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
