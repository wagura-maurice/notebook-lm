// Function to load and process NDJSON data
async function loadNDJSONData() {
  try {
    const response = await fetch(
      "/assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson"
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const documents = lines.map((line) => JSON.parse(line));

    return documents;
  } catch (error) {
    console.error("Error loading NDJSON data:", error);
    throw error;
  }
}

// Function to get an appropriate icon based on section title
function getSectionIcon(title) {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('intro') || titleLower.includes('overview')) {
    return 'fas fa-home';
  } else if (titleLower.includes('method') || titleLower.includes('approach')) {
    return 'fas fa-flask';
  } else if (titleLower.includes('result') || titleLower.includes('finding')) {
    return 'fas fa-chart-bar';
  } else if (titleLower.includes('conclusion') || titleLower.includes('summary')) {
    return 'fas fa-check-circle';
  } else if (titleLower.includes('recommend') || titleLower.includes('suggestion')) {
    return 'fas fa-lightbulb';
  } else if (titleLower.includes('reference') || titleLower.includes('citation')) {
    return 'fas fa-book';
  }
  
  // Default icon
  return 'fas fa-file-alt';
}

// Function to process documents and group by section
function processDocuments(docs) {
  const sections = new Map();

  docs.forEach((doc) => {
    if (!doc.enrichment) return;

    const sectionData = {
      id: doc.id,
      doc: doc.doc,
      header: doc.header,
      text: doc.text,
      enrichment: doc.enrichment,
      annotations: doc.annotations,
      model: doc.enrichment._model,
      _ts: doc._ts,
      icon: getSectionIcon(doc.enrichment.title || 'section')
    };

    sections.set(doc.id, sectionData);
  });

  return Array.from(sections.values());
}

// Toggle between expanded and collapsed views
function setupSidebarToggle() {
  const collapseBtn = document.getElementById('collapse-left');
  const expandBtn = document.getElementById('expand-left');
  const leftColumn = document.getElementById('left-column');
  
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      leftColumn.classList.add('collapsed');
      leftColumn.querySelector('.expanded-content').classList.add('hidden');
      leftColumn.querySelector('.collapsed-content').classList.remove('hidden');
      leftColumn.classList.remove('lg:w-72');
      leftColumn.classList.add('lg:w-16');
    });
  }
  
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      leftColumn.classList.remove('collapsed');
      leftColumn.querySelector('.expanded-content').classList.remove('hidden');
      leftColumn.querySelector('.collapsed-content').classList.add('hidden');
      leftColumn.classList.add('lg:w-72');
      leftColumn.classList.remove('lg:w-16');
    });
  }
}

// Update the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", async function () {
  // Set up sidebar toggle functionality
  setupSidebarToggle();
  try {
    // Show loading state
    const loadingElement = document.getElementById("sections-loading");
    const sectionsContainer = document.getElementById("document-sections");

    // Load and process the NDJSON data
    const rawDocuments = await loadNDJSONData();
    const processedDocuments = processDocuments(rawDocuments);

    // Hide loading state
    loadingElement.style.display = "none";

    if (processedDocuments.length === 0) {
      sectionsContainer.innerHTML = `
        <div class="text-center py-4 text-eu-blue/70">
          No document sections found.
        </div>
      `;
      return;
    }

    // Populate document info with the first document
    if (processedDocuments[0]) {
      populateDocumentInfo(processedDocuments[0]);
    }

    // Populate sections
    processedDocuments.forEach((doc) => {
      populateSection(doc);
    });

    // Open the first section by default
    const firstSection = document.querySelector(
      '.document-section:not([data-section-id="template"])'
    );
    if (firstSection) {
      const firstTrigger = firstSection.querySelector(".section-trigger");
      firstTrigger.click();
    }
  } catch (error) {
    console.error("Error initializing document:", error);
    document.getElementById("sections-loading").innerHTML = `
      <div class="text-center py-4 text-eu-orange">
        Error loading document. Please try again later.
      </div>
    `;
  }
});

// Function to create a collapsed section icon
function createCollapsedSectionIcon(sectionData) {
  const icon = document.createElement('div');
  icon.className = 'relative group w-full flex justify-center py-2 hover:bg-eu-blue/10 transition-colors cursor-pointer';
  icon.setAttribute('data-section-id', sectionData.id);
  icon.title = sectionData.enrichment.title || 'Section';
  
  const iconElement = document.createElement('i');
  iconElement.className = `${sectionData.icon || 'fas fa-file-alt'} text-eu-blue text-lg`;
  
  // Add tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'absolute left-full ml-2 px-2 py-1 bg-eu-blue text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50';
  tooltip.textContent = sectionData.enrichment.title || 'Section';
  
  icon.appendChild(iconElement);
  icon.appendChild(tooltip);
  
  // Add click handler to scroll to section
  icon.addEventListener('click', () => {
    const section = document.querySelector(`[data-section-id="${sectionData.id}"]`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      // Highlight the section briefly
      section.style.backgroundColor = 'rgba(0, 48, 135, 0.1)';
      setTimeout(() => {
        section.style.backgroundColor = '';
      }, 1500);
    }
  });
  
  return icon;
}

// Update the populateSection function to handle the new data structure
function populateSection(data) {
  if (!data.enrichment) return;

  const template = document.querySelector(
    '.document-section[data-section-id="template"]'
  );
  const clone = template.cloneNode(true);

  clone.style.display = "";
  clone.setAttribute("data-section-id", data.id);

  // Update content
  const title = data.enrichment.title || "Untitled Section";
  const summary = data.enrichment.summary || "No summary available.";
  const keywords = data.enrichment.keywords || [];

  clone.querySelector(".section-title").textContent = title;
  clone.querySelector(".section-summary").textContent = summary;

  // Add keywords
  const keywordsContainer = clone.querySelector(".section-keywords");
  keywordsContainer.innerHTML = keywords
    .map(
      (keyword) =>
        `<span class="px-2 py-0.5 bg-eu-orange/20 text-eu-blue text-xs rounded-full">${keyword}</span>`
    )
    .join("");

  // Add to container
  document.getElementById("document-sections").appendChild(clone);
  
  // Add to collapsed view
  const collapsedSections = document.getElementById("collapsed-sections");
  if (collapsedSections) {
    const icon = createCollapsedSectionIcon(data);
    collapsedSections.appendChild(icon);
  }

  // Set up click handler
  const trigger = clone.querySelector(".section-trigger");
  trigger.addEventListener("click", function () {
    const content = this.nextElementSibling;
    const icon = this.querySelector("i");

    // Close all other sections
    document.querySelectorAll(".section-content").forEach((section) => {
      if (section !== content) {
        section.classList.add("hidden");
        const sectionIcon = section.previousElementSibling.querySelector("i");
        if (sectionIcon) {
          sectionIcon.classList.remove("fa-chevron-up");
          sectionIcon.classList.add("fa-chevron-down");
        }
      }
    });

    // Toggle current section
    content.classList.toggle("hidden");
    icon.classList.toggle("fa-chevron-up");
    icon.classList.toggle("fa-chevron-down");
  });
}

// Update the populateDocumentInfo function
function populateDocumentInfo(data) {
  if (!data) return;

  const titleElement = document.querySelector(".document-title");
  const idElement = document.querySelector(".document-id");
  const modelElement = document.querySelector(".document-model");
  const updatedElement = document.querySelector(".document-updated");
  const lengthElement = document.querySelector(".document-length");
  const confidenceElement = document.querySelector(".confidence-value");

  if (titleElement)
    titleElement.textContent = data.doc
      ? data.doc.split("_").join(" ")
      : "Document";
  // if (idElement) idElement.textContent = data.id ? `${data.id.substring(0, 8)}...` : '-';
  if (idElement)
    idElement.textContent = data.id ? data.id.substring(0, 32) : "-";

  if (modelElement && data.model) {
    modelElement.textContent = data.model;
  }

  if (updatedElement && data._ts) {
    updatedElement.textContent = `Last updated: ${formatDate(data._ts)}`;
  }

  if (lengthElement && data.annotations) {
    const length = data.annotations.length || 0;
    const words = data.annotations.words || 0;
    lengthElement.textContent = `${length} characters • ${words} words`;
  }

  if (confidenceElement && data.enrichment?.confidence) {
    const confidence = Math.round(data.enrichment.confidence * 100);
    confidenceElement.textContent = confidence;
    // Add color coding based on confidence level
    if (confidence < 50) {
      confidenceElement.className = 'text-eu-orange';
    } else if (confidence < 80) {
      confidenceElement.className = 'text-yellow-500';
    } else {
      confidenceElement.className = 'text-green-600';
    }
  }
}

// Keep the formatDate function
function formatDate(dateString) {
  if (!dateString) return "Unknown date";
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid date";
  }
}
