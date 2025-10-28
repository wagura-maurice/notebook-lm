// Global state
let editMode = false;
let currentChunkId = null;
let allChunksData = {};
let changes = {};
let editingEntity = null;

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

// Initialize the application
function initializeApp() {
  setupChunkListeners();
  setupNavigationListeners();
  setupOutlineToggles();

  // If there's a hash in the URL, try to select that chunk
  if (window.location.hash) {
    const chunkId = window.location.hash.substring(1);
    if (allChunksData[chunkId]) {
      selectChunk(chunkId);
    }
  }
}

// Start loading the data when the script loads
document.addEventListener("DOMContentLoaded", loadChunksData);

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
