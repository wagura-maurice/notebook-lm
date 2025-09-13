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
      this.documentData = this.ndjsonRaw
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line))
        .filter(
          (item) =>
            item.structure_type === "prose" &&
            item.text &&
            item.text.trim().length > 0 &&
            !item.text.startsWith("![]") &&
            item.text.length > 50
        );

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
  processDocumentElement(doc) {
    const handler = this.getStructureHandler(doc);
    // Ensure we have the taxonomy data from the document
    const content = doc.text || "";
    // Pass the entire doc object to maintain all properties including enrichment.taxonomy
    return handler.call(this, content, doc);
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
        currentTableContent += this.processDocumentElement(doc);
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
          currentTableContent += this.processDocumentElement(doc);
        } else {
          content += this.processDocumentElement(doc);
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
  applyTaxonomyHighlights(text, taxonomy) {
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

    // Process each taxonomy category
    Object.entries(taxonomy).forEach(([category, terms]) => {
      const config = taxonomyMap[category];
      if (!config || !terms || !Array.isArray(terms)) return;

      // Process each term in the category
      terms.forEach((term) => {
        if (!term) return;

        // Create a regex pattern that matches the whole word, case insensitive
        const pattern = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, "gi");

        // Create the highlighted version with tooltip
        const highlightedTerm = `
          <span class="taxonomy-highlight bg-${config.color}/10 border-l-4 border-${config.color} px-1 py-0.5 relative group cursor-help">
            $&
            <span class="tooltip hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded whitespace-nowrap z-10">
              ${config.displayName}: ${term}
              <span class="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 transform rotate-45"></span>
            </span>
          </span>
        `;

        // Replace all occurrences
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
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      if (selectedText.length > 0) {
        // Show taxonomy popup
        this.showTaxonomyPopup(e.clientX, e.clientY, selectedText);
      }
    });
  }

  showTaxonomyPopup(x, y, selectedText) {
    let oldPopup = document.getElementById("taxonomy-popup");
    if (oldPopup) oldPopup.remove();
    // Enhanced popup structure
    const popup = document.createElement("div");
    popup.id = "taxonomy-popup";
    popup.style.left = x + "px";
    popup.style.top = y + "px";
    // Header
    const header = document.createElement("div");
    header.className = "popup-header";
    header.innerHTML = `Assign taxonomy:`;
    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => popup.remove();
    header.appendChild(closeBtn);
    popup.appendChild(header);
    // Selected text preview
    const preview = document.createElement("div");
    preview.className = "selected-text-preview";
    preview.textContent = selectedText;
    popup.appendChild(preview);
    // Taxonomy options
    const options = document.createElement("div");
    options.className = "taxonomy-options";
    this.taxonomyTypes.forEach((type) => {
      const option = document.createElement("button");
      option.className = "taxonomy-option";
      option.setAttribute("data-taxonomy", type);
      // Color indicator
      const colorIndicator = document.createElement("span");
      colorIndicator.className = "taxonomy-color-indicator";
      option.appendChild(colorIndicator);
      // Name
      const name = document.createElement("span");
      name.className = "taxonomy-name";
      name.textContent = type.replace(/_/g, " ");
      option.appendChild(name);
      // Count
      const doc = this.documentData.find(
        (d) => d.text && d.text.includes(selectedText)
      );
      let count = 0;
      if (
        doc &&
        doc.enrichment &&
        doc.enrichment.taxonomy &&
        doc.enrichment.taxonomy[type]
      ) {
        count = doc.enrichment.taxonomy[type].length;
      }
      const countSpan = document.createElement("span");
      countSpan.className = "taxonomy-count";
      countSpan.textContent = count;
      option.appendChild(countSpan);
      option.onclick = () => {
        this.assignTaxonomy(selectedText, type);
        popup.remove();
      };
      options.appendChild(option);
    });
    popup.appendChild(options);
    // Footer
    const footer = document.createElement("div");
    footer.className = "popup-footer";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => popup.remove();
    footer.appendChild(cancelBtn);
    popup.appendChild(footer);
    document.body.appendChild(popup);
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
    // Find the first doc that contains the selected text
    const doc = this.documentData.find(
      (d) => d.text && d.text.includes(selectedText)
    );
    if (!doc) return;
    // Ensure enrichment and taxonomy exist
    if (!doc.enrichment) doc.enrichment = {};
    if (!doc.enrichment.taxonomy) doc.enrichment.taxonomy = {};
    if (!doc.enrichment.taxonomy[taxonomyType])
      doc.enrichment.taxonomy[taxonomyType] = [];
    // Add the highlighted text if not already present
    if (!doc.enrichment.taxonomy[taxonomyType].includes(selectedText)) {
      doc.enrichment.taxonomy[taxonomyType].push(selectedText);
    }
    // Update NDJSON raw data in memory
    this.updateNDJSONRaw();
    // Optionally, re-render document to show highlight
    this.displayAllDocuments();
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
