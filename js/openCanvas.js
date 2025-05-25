// js/openCanvas.js
// Register quill-table-better module (must be loaded via <script> before this runs)
Quill.register(
  {
    "modules/table-better": QuillTableBetter,
  },
  true
);

// Import and extend Scroll for custom drag/drop handling
let Scroll = Quill.import("blots/scroll");
class DraggableScroll extends Scroll {
  constructor(registry, domNode, { emitter }) {
    super(registry, domNode, { emitter });
    this.domNode.addEventListener("drop", (e) => this.handleDrop(e), true);
  }
  handleDrop(e) {
    if (e.dataTransfer.files.length == 0) e.stopImmediatePropagation();
  }
  handleDragStart(e) {}
}
Quill.register(DraggableScroll);

const toolbarOptions = [
  // Basic text styles
  ["bold", "italic", "underline", "strike"],
  // Block elements
  ["blockquote", "code-block"],
  // Headers
  [{ header: 1 }, { header: 2 }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  // Lists
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  // Scripts
  [{ script: "sub" }, { script: "super" }],
  // Indent and direction
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  // Font size and type
  [{ size: ["small", false, "large", "huge"] }],
  [{ font: [] }],
  // Color and background
  [{ color: [] }, { background: [] }],
  // Alignment
  [{ align: [] }],
  // Media
  ["link", "image", "video", "formula"],
  // Table-better
  ["table-better"],
  // Remove formatting
  ["clean"],
];

const quill = new Quill("#editor", {
  theme: "snow",
  modules: {
    table: false,
    toolbar: toolbarOptions,
    "table-better": {
      language: "en_US",
      menus: [
        "column",
        "row",
        "merge",
        "table",
        "cell",
        "wrap",
        "copy",
        "delete",
      ],
      toolbarTable: true,
    },
    keyboard: {
      bindings: QuillTableBetter.keyboardBindings,
    },
  },
});

// Note: For table support, install a Quill table module/plugin and uncomment the relevant lines above.
// For image upload, you may want to add a custom handler to upload and insert images from local files or URLs.

// DOM elements
const selectedTextEl = document.getElementById("selectedText");
const positionInfoEl = document.getElementById("positionInfo");
const aiResponse = document.getElementById("aiResponse");
const responseContent = document.getElementById("responseContent");
const explainBtn = document.getElementById("explainBtn");
const expandBtn = document.getElementById("expandBtn");
const summarizeBtn = document.getElementById("summarizeBtn");
const improveBtn = document.getElementById("improveBtn");

// Store current selection data
let currentSelection = null;

// Track selection changes
quill.on("selection-change", function (range, oldRange, source) {
  if (range && range.length > 0) {
    // Get selected text
    const selectedText = quill.getText(range.index, range.length);

    // Get position information
    const bounds = quill.getBounds(range.index);
    const [line, column] = quill.getLine(range.index);

    // Calculate line number (approximate)
    const textBefore = quill.getText(0, range.index);
    const lineNumber = textBefore.split("\n").length;

    // Store selection data
    currentSelection = {
      text: selectedText,
      range: range,
      lineNumber: lineNumber,
      startIndex: range.index,
      endIndex: range.index + range.length,
      bounds: bounds,
    };

    // Update UI
    updateSelectionDisplay();
    enableAIButtons(true);
  } else {
    // No selection
    currentSelection = null;
    clearSelectionDisplay();
    enableAIButtons(false);
  }
});

function updateSelectionDisplay() {
  if (!currentSelection) return;

  selectedTextEl.textContent = currentSelection.text;
  selectedTextEl.style.fontStyle = "normal";

  positionInfoEl.innerHTML = `
            <strong>Position:</strong> Line ${currentSelection.lineNumber}, 
            Characters ${currentSelection.startIndex}-${currentSelection.endIndex}<br>
            <strong>Length:</strong> ${currentSelection.text.length} characters
        `;
}

function clearSelectionDisplay() {
  selectedTextEl.textContent = "Select text in the editor to see it here...";
  selectedTextEl.style.fontStyle = "italic";
  positionInfoEl.textContent = "Position: No selection";
  hideAIResponse();
}

function enableAIButtons(enabled) {
  const buttons = [explainBtn, expandBtn, summarizeBtn, improveBtn];
  buttons.forEach((btn) => {
    btn.disabled = !enabled;
  });
}

function showAIResponse(content) {
  if (!aiResponse) return;
  responseContent.innerHTML = content;
  aiResponse.classList.add("show");
}

function hideAIResponse() {
  if (!aiResponse) return;
  aiResponse.classList.remove("show");
}

// AI Action handlers (simulated)
explainBtn.addEventListener("click", () => {
  if (!currentSelection) return;

  const mockExplanation = `
    <p><strong>Explanation for:</strong> "${currentSelection.text}"</p>
    <p>This text appears at line ${currentSelection.lineNumber} in your document. Here's what it means in context...</p>
    <p><em>This is a simulated AI response. In a real implementation, this would connect to an actual AI API.</em></p>
  `;

  // Insert the explanation at the end of the current selection in the Quill editor
  const range = quill.getSelection();
  if (range) {
    quill.clipboard.dangerouslyPasteHTML(
      range.index + range.length,
      mockExplanation
    );
  }
});

expandBtn.addEventListener("click", () => {
  if (!currentSelection) return;

  const mockExpansion = `
    <p><strong>Expanded content for:</strong> "${currentSelection.text}"</p>
    <p>Here's additional context and elaboration that could be inserted at position ${currentSelection.startIndex}...</p>
    <p><em>In a real implementation, this expanded content would be inserted directly into the document at the selection point.</em></p>
  `;

  // Insert the expansion at the end of the current selection in the Quill editor
  const range = quill.getSelection();
  if (range) {
    quill.clipboard.dangerouslyPasteHTML(
      range.index + range.length,
      mockExpansion
    );
  }
});

summarizeBtn.addEventListener("click", () => {
  if (!currentSelection) return;

  const mockSummary = `
    <p><strong>Summary:</strong></p>
    <p>Key points from the selected text: "${currentSelection.text.substring(
      0,
      50
    )}..."</p>
    <ul>
      <li>Main concept identified</li>
      <li>Context preserved</li>
      <li>Position tracked (Line ${currentSelection.lineNumber})</li>
    </ul>
  `;

  // Insert the summary at the end of the document in the Quill editor
  const lastIndex = quill.getLength();
  quill.clipboard.dangerouslyPasteHTML(lastIndex, mockSummary);
});

improveBtn.addEventListener("click", () => {
  if (!currentSelection) return;

  const mockImprovement = `
            <p><strong>Improved version:</strong></p>
            <p>Here's a refined version of your selected text with better clarity and flow...</p>
            <div style="background:rgb(29, 130, 231); padding: 10px; border-radius: 4px; margin: 10px 0;">
                Enhanced version of: "${currentSelection.text}"
            </div>
            <p><em>Click to replace original text at position ${currentSelection.startIndex}-${currentSelection.endIndex}</em></p>
        `;

  // Insert the summary at the end of the document in the Quill editor
  const lastIndex = quill.getLength();
  quill.clipboard.dangerouslyPasteHTML(lastIndex, mockImprovement);
});

// Add custom formatting for position indicators
quill.on("text-change", function (delta, oldDelta, source) {
  // This is where you could add custom formatting or tracking
  // for AI-modified content
  console.log("Document changed:", delta);
});

// Simulate drag-and-drop preparation (basic structure)
document.addEventListener("DOMContentLoaded", function () {
  console.log("Quill AI Editor initialized");
  console.log("Features available:");
  console.log("- Text selection tracking");
  console.log("- Position mapping");
  console.log("- AI integration points");
  console.log("- Rich text editing");
});
