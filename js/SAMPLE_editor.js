// Global state
let editMode = false;
let currentChunkId = null;
let allChunksData = {};
let changes = {};
let editingEntity = null;

// UI Elements
const UI_ELEMENTS = {
  toolbar: null,
  sidebar: null,
  documentContent: null,
  metadataPanel: null,
  entityModal: null,
  // Add references to dynamic elements
  modeToggle: null,
  modeText: null,
  changesBadge: null,
  changesCount: null,
  documentTitle: null,
  documentMeta: null
};

// Load the JSON data asynchronously
async function loadChunksData() {
  try {
    const response = await fetch("../assets/SAMPLE_editor.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allChunksData = await response.json();
    console.log("Chunks data loaded successfully");
    // Initialize the application after loading data
    initializeApp();
  } catch (error) {
    console.error("Error loading chunks data:", error);
    // Show error to user
    alert("Failed to load document data. Please try again later.");
  }
}

/**
 * Initialize the application UI by creating and appending all components
 */
function initializeUI() {
  // Create the main container
  const appContainer = document.createElement('div');
  appContainer.id = 'app';
  document.body.appendChild(appContainer);
  
  // Create and append all UI components
  createToolbar();
  createSidebar();
  createDocumentArea();
  createMetadataPanel();
  createEntityModal();
  
  // Set up the main container structure
  const container = document.createElement('div');
  container.className = 'container';
  
  // Append sidebar and document content to container
  container.appendChild(UI_ELEMENTS.sidebar);
  container.appendChild(UI_ELEMENTS.documentContent);
  
  // Append everything to the app container
  appContainer.appendChild(UI_ELEMENTS.toolbar);
  appContainer.appendChild(container);
  appContainer.appendChild(UI_ELEMENTS.metadataPanel);
  appContainer.appendChild(UI_ELEMENTS.entityModal);
  
  // Apply any initial styles
  applyInitialStyles();
}

/**
 * Initialize the application
 */
function initializeApp() {
  try {
    // Initialize UI first
    initializeUI();
    
    // Set up all event listeners
    setupEventListeners();
    
    // If there's a hash in the URL, try to select that chunk
    if (window.location.hash) {
      const chunkId = window.location.hash.substring(1);
      if (allChunksData[chunkId]) {
        selectChunk(chunkId);
      }
    }
    
    // Update UI based on initial state
    updateUIForEditMode();
    
  } catch (error) {
    console.error('Error initializing application:', error);
    // Show error to user
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'Failed to initialize the application. Please refresh the page or contact support.';
    document.body.appendChild(errorDiv);
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  setupChunkListeners();
  setupNavigationListeners();
  setupOutlineToggles();
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown);
  
  // Add window resize handler
  window.addEventListener('resize', handleWindowResize);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyDown(e) {
  // Escape key closes modals/panels
  if (e.key === 'Escape') {
    closeMetadata();
    closeEntityModal();
  }
  
  // Ctrl+S or Cmd+S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    exportAnnotations();
  }
}

/**
 * Handle window resize events
 */
function handleWindowResize() {
  // Update any responsive elements here
  if (UI_ELEMENTS.metadataPanel) {
    // Adjust metadata panel position if needed
    if (currentChunkId) {
      const chunkElement = document.getElementById(currentChunkId);
      if (chunkElement) {
        positionMetadataPanel(chunkElement);
      }
    }
  }
}

/**
 * Apply initial styles to the application
 */
function applyInitialStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
    }
    
    .container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    /* Add any other base styles here */
  `;
  document.head.appendChild(style);
}

/**
 * Update UI elements based on edit mode
 */
function updateUIForEditMode() {
  if (!UI_ELEMENTS.modeText) return;
  
  if (editMode) {
    UI_ELEMENTS.modeText.textContent = 'Switch to View Mode';
    document.body.classList.add('edit-mode');
  } else {
    UI_ELEMENTS.modeText.textContent = 'Switch to Edit Mode';
    document.body.classList.remove('edit-mode');
  }
  
  // Update other UI elements as needed
  updateChangeBadge();
}

// UI Component Creators
function createToolbar() {
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  
  const toolbarLeft = document.createElement('div');
  toolbarLeft.className = 'toolbar-left';
  
  const title = document.createElement('div');
  title.className = 'toolbar-title';
  title.textContent = '📝 Annotation Editor';
  
  const modeToggle = document.createElement('button');
  modeToggle.className = 'mode-toggle';
  modeToggle.id = 'mode-toggle';
  modeToggle.onclick = toggleEditMode;
  
  const modeText = document.createElement('span');
  modeText.id = 'mode-text';
  modeText.textContent = 'Switch to Edit Mode';
  
  modeToggle.appendChild(modeText);
  
  const changesBadge = document.createElement('span');
  changesBadge.className = 'changes-badge';
  changesBadge.id = 'changes-badge';
  changesBadge.style.display = 'none';
  
  const changesCount = document.createElement('span');
  changesCount.id = 'changes-count';
  changesCount.textContent = '0';
  
  changesBadge.appendChild(document.createTextNode(' '));
  changesBadge.appendChild(changesCount);
  changesBadge.appendChild(document.createTextNode(' changes'));
  
  toolbarLeft.appendChild(title);
  toolbarLeft.appendChild(modeToggle);
  toolbarLeft.appendChild(changesBadge);
  
  const toolbarActions = document.createElement('div');
  toolbarActions.className = 'toolbar-actions';
  
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn btn-export';
  exportBtn.onclick = exportAnnotations;
  exportBtn.innerHTML = '💾 Export Changes';
  
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-reset';
  resetBtn.onclick = resetChanges;
  resetBtn.innerHTML = '🔄 Reset All';
  
  toolbarActions.appendChild(exportBtn);
  toolbarActions.appendChild(resetBtn);
  
  toolbar.appendChild(toolbarLeft);
  toolbar.appendChild(toolbarActions);
  
  UI_ELEMENTS.toolbar = toolbar;
}

function createSidebar() {
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar';
  
  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'sidebar-header';
  
  const sidebarTitle = document.createElement('div');
  sidebarTitle.className = 'sidebar-title';
  sidebarTitle.textContent = 'Document Navigation';
  
  const sidebarSubtitle = document.createElement('div');
  sidebarSubtitle.className = 'sidebar-subtitle';
  sidebarSubtitle.textContent = '0 chunks'; // Will be updated after loading data
  
  sidebarHeader.appendChild(sidebarTitle);
  sidebarHeader.appendChild(sidebarSubtitle);
  
  const outlineSection = document.createElement('div');
  outlineSection.className = 'outline-section';
  outlineSection.style.marginLeft = '0px';
  
  sidebar.appendChild(sidebarHeader);
  sidebar.appendChild(outlineSection);
  
  UI_ELEMENTS.sidebar = sidebar;
}

function createDocumentArea() {
  const wrapper = document.createElement('div');
  wrapper.className = 'document-wrapper';
  
  const documentEl = document.createElement('div');
  documentEl.className = 'document';
  
  const documentHeader = document.createElement('div');
  documentHeader.className = 'document-header';
  
  const documentTitle = document.createElement('h1');
  documentTitle.className = 'document-title';
  documentTitle.textContent = 'Document Title';
  
  const documentMeta = document.createElement('div');
  documentMeta.className = 'document-meta';
  documentMeta.textContent = 'Loading document...';
  
  documentHeader.appendChild(documentTitle);
  documentHeader.appendChild(documentMeta);
  
  const documentContent = document.createElement('div');
  documentContent.className = 'document-content';
  documentContent.id = 'document-content';
  
  documentEl.appendChild(documentHeader);
  documentEl.appendChild(documentContent);
  wrapper.appendChild(documentEl);
  
  UI_ELEMENTS.documentContent = wrapper;
}

function createMetadataPanel() {
  const panel = document.createElement('div');
  panel.className = 'metadata-panel';
  panel.id = 'metadata-panel';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'metadata-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = closeMetadata;
  
  const content = document.createElement('div');
  content.id = 'metadata-content';
  
  const defaultContent = document.createElement('div');
  defaultContent.className = 'metadata-section';
  
  const title = document.createElement('div');
  title.className = 'metadata-title';
  title.textContent = 'Chunk Metadata';
  
  const message = document.createElement('p');
  message.textContent = 'Click on any chunk to view and edit its metadata.';
  
  defaultContent.appendChild(title);
  defaultContent.appendChild(message);
  content.appendChild(defaultContent);
  
  panel.appendChild(closeBtn);
  panel.appendChild(content);
  
  UI_ELEMENTS.metadataPanel = panel;
}

function createEntityModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'entity-modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  const modalTitle = document.createElement('div');
  modalTitle.className = 'modal-title';
  modalTitle.textContent = 'Edit Entity';
  
  const formGroup1 = document.createElement('div');
  formGroup1.className = 'form-group';
  
  const label1 = document.createElement('label');
  label1.className = 'form-label';
  label1.textContent = 'Entity Text:';
  
  const input1 = document.createElement('input');
  input1.type = 'text';
  input1.className = 'form-input';
  input1.id = 'entity-text-input';
  
  formGroup1.appendChild(label1);
  formGroup1.appendChild(input1);
  
  const formGroup2 = document.createElement('div');
  formGroup2.className = 'form-group';
  
  const label2 = document.createElement('label');
  label2.className = 'form-label';
  label2.textContent = 'Entity Type:';
  
  const select = document.createElement('select');
  select.className = 'form-input';
  select.id = 'entity-type-input';
  
  const entityTypes = [
    'person', 'org', 'location', 'program', 
    'date', 'amount', 'metric', 'law', 'policy'
  ];
  
  entityTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    select.appendChild(option);
  });
  
  formGroup2.appendChild(label2);
  formGroup2.appendChild(select);
  
  const modalActions = document.createElement('div');
  modalActions.className = 'modal-actions';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = closeEntityModal;
  
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-save';
  saveBtn.textContent = 'Save';
  saveBtn.onclick = saveEntityEdit;
  
  modalActions.appendChild(cancelBtn);
  modalActions.appendChild(saveBtn);
  
  modalContent.appendChild(modalTitle);
  modalContent.appendChild(formGroup1);
  modalContent.appendChild(formGroup2);
  modalContent.appendChild(modalActions);
  
  modal.appendChild(modalContent);
  
  UI_ELEMENTS.entityModal = modal;
}

/**
 * Start loading the data when the script loads
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadChunksData);
} else {
  // If the document is already loaded, start immediately
  loadChunksData();
}

// Expose public API
window.EditorApp = {
  toggleEditMode,
  exportAnnotations,
  resetChanges,
  selectChunk,
  closeMetadata,
  closeEntityModal
};

// Rest of your existing functions...
function setupChunkListeners() {
  document.querySelectorAll(".chunk-boundary").forEach((chunk) => {
    chunk.addEventListener("click", function (e) {
      if (e.target.tagName === "A") return;
      const chunkId = this.dataset.chunkId;
      selectChunk(chunkId);
    });
  });
}

function setupNavigationListeners() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", function () {
      const chunkId = this.dataset.chunkId;
      selectChunk(chunkId);
      scrollToChunk(chunkId);
    });
  });
}

function setupOutlineToggles() {
  document.querySelectorAll(".outline-section-header").forEach((header) => {
    header.addEventListener("click", function (e) {
      e.stopPropagation();
      const sectionId = this.dataset.sectionId;
      const content = document.querySelector(
        `.outline-section-content[data-section-id="${sectionId}"]`
      );

      if (content) {
        const isCollapsed = this.classList.contains("collapsed");
        if (isCollapsed) {
          this.classList.remove("collapsed");
          content.classList.remove("collapsed");
          content.style.maxHeight = content.scrollHeight + "px";
        } else {
          this.classList.add("collapsed");
          content.classList.add("collapsed");
          content.style.maxHeight = "0";
        }
      }
    });
  });

  // Set initial max-height
  document.querySelectorAll(".outline-section-content").forEach((content) => {
    if (!content.classList.contains("collapsed")) {
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
}

function selectChunk(chunkId) {
  currentChunkId = chunkId;

  // Update UI
  document
    .querySelectorAll(".chunk-boundary")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((c) => c.classList.remove("active"));

  const chunkEl = document.querySelector(
    `.chunk-boundary[data-chunk-id="${chunkId}"]`
  );
  const navItem = document.querySelector(
    `.nav-item[data-chunk-id="${chunkId}"]`
  );

  if (chunkEl) chunkEl.classList.add("active");
  if (navItem) {
    navItem.classList.add("active");
    navItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Show metadata
  showMetadata(chunkId);
}

function scrollToChunk(chunkId) {
  const chunk = document.querySelector(
    `.chunk-boundary[data-chunk-id="${chunkId}"]`
  );
  if (chunk) {
    chunk.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function showMetadata(chunkId) {
  const chunkData = allChunksData[chunkId];
  if (!chunkData) return;

  const panel = document.getElementById("metadata-panel");
  const content = document.getElementById("metadata-content");

  // Get changes for this chunk (if any)
  const chunkChanges = changes[chunkId] || {};

  // Build metadata HTML
  let html = "";

  // Summary (editable in edit mode)
  const summary =
    chunkChanges.summary !== undefined
      ? chunkChanges.summary
      : chunkData.summary;
  const summaryEdited = chunkChanges.summary !== undefined;

  html += `
    <div class="metadata-section">
        <div class="metadata-title">Summary</div>
        <textarea
            class="editable-field ${summaryEdited ? "edited" : ""}"
            id="summary-field"
            ${editMode ? "" : "readonly"}
            onchange="updateField('${chunkId}', 'summary', this.value)"
        >${summary || "No summary"}</textarea>
    </div>
    `;

  // Rhetorical Role
  const role =
    chunkChanges.rhetorical_role !== undefined
      ? chunkChanges.rhetorical_role
      : chunkData.rhetorical_role;
  const roleEdited = chunkChanges.rhetorical_role !== undefined;

  html += `
    <div class="metadata-section">
        <div class="metadata-title">Rhetorical Role</div>
        <select
            class="editable-field ${roleEdited ? "edited" : ""}"
            id="role-field"
            ${editMode ? "" : "disabled"}
            onchange="updateField('${chunkId}', 'rhetorical_role', this.value)"
        >
            <option value="background">Background</option>
            <option value="definition">Definition</option>
            <option value="method">Method</option>
            <option value="procedure">Procedure</option>
            <option value="result">Result</option>
            <option value="discussion">Discussion</option>
            <option value="recommendation">Recommendation</option>
            <option value="limitation">Limitation</option>
            <option value="example">Example</option>
            <option value="conclusion">Conclusion</option>
            <option value="other">Other</option>
        </select>
    </div>
    `;

  // Set selected role
  setTimeout(() => {
    const roleSelect = document.getElementById("role-field");
    if (roleSelect) roleSelect.value = role;
  }, 0);

  // Keywords
  const keywords =
    chunkChanges.keywords !== undefined
      ? chunkChanges.keywords
      : chunkData.keywords;
  const keywordsEdited = chunkChanges.keywords !== undefined;

  html += `
    <div class="metadata-section">
        <div class="metadata-title">Keywords (${keywords.length})</div>
        <div class="keywords-editor" id="keywords-editor">
    `;

  keywords.forEach((kw, idx) => {
    html += `
        <span class="keyword-tag ${editMode ? "editable" : ""}">
            ${kw}
            ${
              editMode
                ? `<span class="keyword-remove" onclick="removeKeyword('${chunkId}', ${idx})">×</span>`
                : ""
            }
        </span>
        `;
  });

  if (editMode) {
    html += `
        <button class="keyword-add" onclick="addKeyword('${chunkId}')">+ Add</button>
        `;
  }

  html += "</div></div>";

  // Entities
  const entities =
    chunkChanges.entities !== undefined
      ? chunkChanges.entities
      : chunkData.entities;
  const entitiesEdited = chunkChanges.entities !== undefined;

  html += `
    <div class="metadata-section">
        <div class="metadata-title">Entities (${entities.length})</div>
        <div class="entity-editor">
    `;

  entities.forEach((entity, idx) => {
    const color = getEntityColor(entity.type);
    html += `
        <div class="entity-item ${editMode ? "editable" : ""}" onclick="${
      editMode ? `editEntity('${chunkId}', ${idx})` : ""
    }">
            <div class="entity-text">${entity.text}</div>
            <div class="entity-type-badge" style="background: ${color};">${
      entity.type
    }</div>
            ${
              editMode
                ? `<button class="entity-remove" onclick="event.stopPropagation(); removeEntity('${chunkId}', ${idx}')">×</button>`
                : ""
            }
        </div>
        `;
  });

  if (editMode) {
    html += `
        <button class="entity-add" onclick="addEntity('${chunkId}')">+ Add Entity</button>
        `;
  }

  html += "</div></div>";

  // Statistics
  html += `
    <div class="metadata-section">
        <div class="metadata-title">Statistics</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #667eea;">${chunkData.words}</div>
                <div style="font-size: 11px; color: #7f8c8d;">Words</div>
            </div>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #667eea;">${chunkData.sentences}</div>
                <div style="font-size: 11px; color: #7f8c8d;">Sentences</div>
            </div>
        </div>
    </div>
    `;

  content.innerHTML = html;
  panel.classList.add("visible");
}

function getEntityColor(type) {
  const colors = {
    person: "#FFB3BA",
    org: "#BAFFC9",
    location: "#BAE1FF",
    program: "#FFFFBA",
    date: "#FFD8BA",
    amount: "#E0BBE4",
    metric: "#FFDAB9",
    law: "#C7CEEA",
    policy: "#B5EAD7",
  };
  return colors[type] || "#f0f0f0";
}

function closeMetadata() {
  document.getElementById("metadata-panel").classList.remove("visible");
  document
    .querySelectorAll(".chunk-boundary")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((c) => c.classList.remove("active"));
  currentChunkId = null;
}

// EDIT MODE
function toggleEditMode() {
  editMode = !editMode;
  const toggle = document.getElementById("mode-toggle");
  const modeText = document.getElementById("mode-text");
  const docContent = document.getElementById("document-content");

  if (editMode) {
    toggle.classList.add("edit-mode");
    modeText.textContent = "Switch to View Mode";
    docContent.classList.add("edit-mode");
  } else {
    toggle.classList.remove("edit-mode");
    modeText.textContent = "Switch to Edit Mode";
    docContent.classList.remove("edit-mode");
  }

  // Refresh metadata panel if open
  if (currentChunkId) {
    showMetadata(currentChunkId);
  }
}

// CHANGE TRACKING
function trackChange(chunkId, field, value) {
  if (!changes[chunkId]) {
    changes[chunkId] = {};
  }
  changes[chunkId][field] = value;

  // Update UI
  updateChangeBadge();
  markChunkAsEdited(chunkId);
}

function updateChangeBadge() {
  const count = Object.keys(changes).length;
  const badge = document.getElementById("changes-badge");
  const countEl = document.getElementById("changes-count");

  if (count > 0) {
    badge.style.display = "block";
    countEl.textContent = count;
  } else {
    badge.style.display = "none";
  }
}

function markChunkAsEdited(chunkId) {
  const chunk = document.querySelector(
    `.chunk-boundary[data-chunk-id="${chunkId}"]`
  );
  const navItem = document.querySelector(
    `.nav-item[data-chunk-id="${chunkId}"]`
  );

  if (chunk && !chunk.classList.contains("edited")) {
    chunk.classList.add("edited");
    const badge = document.createElement("span");
    badge.className = "edit-badge";
    badge.textContent = "EDITED";
    chunk.appendChild(badge);
  }

  if (navItem) {
    navItem.classList.add("edited");
  }
}

// FIELD UPDATES
function updateField(chunkId, field, value) {
  trackChange(chunkId, field, value);
  showMetadata(chunkId);
}

function removeKeyword(chunkId, index) {
  const chunkData = allChunksData[chunkId];
  const currentKeywords =
    changes[chunkId]?.keywords || chunkData.keywords || [];
  const newKeywords = currentKeywords.filter((_, i) => i !== index);
  trackChange(chunkId, "keywords", newKeywords);
  showMetadata(chunkId);
}

function addKeyword(chunkId) {
  const kw = prompt("Enter new keyword:");
  if (kw && kw.trim()) {
    const chunkData = allChunksData[chunkId];
    const currentKeywords =
      changes[chunkId]?.keywords || chunkData.keywords || [];
    const newKeywords = [...currentKeywords, kw.trim()];
    trackChange(chunkId, "keywords", newKeywords);
    showMetadata(chunkId);
  }
}

function removeEntity(chunkId, index) {
  const chunkData = allChunksData[chunkId];
  const currentEntities =
    changes[chunkId]?.entities || chunkData.entities || [];
  const newEntities = currentEntities.filter((_, i) => i !== index);
  trackChange(chunkId, "entities", newEntities);
  showMetadata(chunkId);
}

function editEntity(chunkId, index) {
  const chunkData = allChunksData[chunkId];
  const currentEntities =
    changes[chunkId]?.entities || chunkData.entities || [];
  const entity = currentEntities[index];

  editingEntity = { chunkId, index, entity };

  document.getElementById("entity-text-input").value = entity.text;
  document.getElementById("entity-type-input").value = entity.type;
  document.getElementById("entity-modal").classList.add("visible");
}

function addEntity(chunkId) {
  const text = prompt("Enter entity text:");
  if (!text || !text.trim()) return;

  const type = prompt(
    "Enter entity type (person/org/location/program/date/amount/metric/law/policy):"
  );
  if (!type || !type.trim()) return;

  const chunkData = allChunksData[chunkId];
  const currentEntities =
    changes[chunkId]?.entities || chunkData.entities || [];
  const newEntity = { text: text.trim(), type: type.trim() };
  const newEntities = [...currentEntities, newEntity];

  trackChange(chunkId, "entities", newEntities);
  showMetadata(chunkId);
}

function closeEntityModal() {
  document.getElementById("entity-modal").classList.remove("visible");
  editingEntity = null;
}

function saveEntityEdit() {
  if (!editingEntity) return;

  const { chunkId, index } = editingEntity;
  const newText = document.getElementById("entity-text-input").value;
  const newType = document.getElementById("entity-type-input").value;

  const chunkData = allChunksData[chunkId];
  const currentEntities =
    changes[chunkId]?.entities || chunkData.entities || [];

  const newEntities = [...currentEntities];
  newEntities[index] = { ...newEntities[index], text: newText, type: newType };

  trackChange(chunkId, "entities", newEntities);
  closeEntityModal();
  showMetadata(chunkId);
}

// EXPORT
function exportAnnotations() {
  // Only include chunks that have changes
  const exportData = {};

  for (const chunkId in changes) {
    const chunkData = allChunksData[chunkId];
    exportData[chunkId] = { ...chunkData, ...changes[chunkId] };
  }

  // Create a download link
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "annotations_export.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function resetChanges() {
  if (confirm("Are you sure you want to reset all changes?")) {
    changes = {};
    updateChangeBadge();

    // Reset UI
    document.querySelectorAll(".chunk-boundary").forEach((el) => {
      el.classList.remove("edited");
      const badge = el.querySelector(".edit-badge");
      if (badge) badge.remove();
    });

    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.remove("edited");
    });

    // Refresh metadata panel if open
    if (currentChunkId) {
      showMetadata(currentChunkId);
    }
  }
}

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeMetadata();
  }
});
