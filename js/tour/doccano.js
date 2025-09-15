/**
 * NotebookLM Document Annotation Tour
 * This module provides an interactive tour of the Document Annotation interface
 */

// Global tour instance
let currentTour = null;

/**
 * Clean up any existing tour instance
 */
function cleanupExistingTour() {
  if (currentTour) {
    try {
      currentTour.complete();
      currentTour = null;
    } catch (error) {
      console.error("Error cleaning up existing tour:", error);
    }
  }
}

/**
 * Add custom styles for the tour
 */
function addTourStyles() {
  if (document.getElementById("shepherd-styles")) return;

  const style = document.createElement("style");
  style.id = "shepherd-styles";
  style.textContent = `
    .shepherd-theme-custom {
      max-width: 400px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      font-family: 'Rubik', sans-serif;
    }
    .shepherd-target-highlight {
      position: relative;
      z-index: 9999;
      border-radius: 8px;
    }
    .shepherd-button {
      background: var(--eu-blue);
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      margin-right: 8px;
      padding: 6px 12px;
      font-family: 'Rubik', sans-serif;
      transition: all 0.2s ease;
    }
    .shepherd-button:hover {
      background: #002366;
      transform: translateY(-1px);
    }
    .shepherd-button-secondary {
      background: #e5e7eb;
      color: #4b5563;
    }
    .shepherd-title {
      color: var(--eu-blue);
      font-weight: 600;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initialize the tour with all necessary configurations
 * @returns {Object|null} The initialized tour instance or null if failed
 */
function initTour() {
  console.log("Initializing document annotation tour...");

  try {
    if (typeof Shepherd === "undefined") {
      throw new Error("Shepherd.js is not loaded");
    }

    cleanupExistingTour();
    addTourStyles();

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: "shepherd-theme-custom",
        scrollTo: { behavior: "smooth", block: "center" },
        arrow: true,
        canClickTarget: true,
        highlightClass: "shepherd-target-highlight",
        popperOptions: {
          modifiers: [
            {
              name: "offset",
              options: { offset: [0, 15] }
            }
          ]
        }
      },
      exitOnEsc: true,
      keyboardNavigation: true
    });

    currentTour = tour;
    return tour;
  } catch (error) {
    console.error("Failed to initialize tour:", error);
    return null;
  }
}

/**
 * Add steps to the tour
 * @param {Object} tour - The Shepherd tour instance
 */
function addTourSteps(tour) {
  if (!tour) return;

  // Welcome step
  tour.addStep({
    id: "welcome",
    title: "👋 Welcome to Document Annotation",
    text: "Let's take a quick tour to help you get the most out of the document annotation features. You'll learn how to annotate documents, manage your workspace, and more.",
    buttons: [
      { text: "Start Tour", action: tour.next, classes: "shepherd-button" },
      { text: "Skip for now", action: tour.cancel, classes: "shepherd-button-secondary" }
    ],
    cancelIcon: { enabled: true, label: "Close" },
    highlightClass: "tour-highlight-welcome",
    scrollTo: { behavior: "smooth", block: "center" }
  });

  // Left Column - Document List
  tour.addStep({
    id: "left-column",
    title: "📚 Document List",
    text: "This panel shows all your uploaded documents. Select any document to view and annotate it in the main workspace.",
    attachTo: { element: "#left-column", on: "right" },
    buttons: [
      { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next →", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: "tour-highlight-column"
  });

  // Middle Column - Annotation Workspace
  tour.addStep({
    id: "middle-column",
    title: "✏️ Annotation Workspace",
    text: "This is where you'll do most of your work. The selected document appears here, and you can add annotations, highlights, and notes directly on the text.",
    attachTo: { element: "#middle-column", on: "left" },
    buttons: [
      { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next →", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: "tour-highlight-column"
  });

  // Right Column - Annotation Tools
  tour.addStep({
    id: "right-column",
    title: "🛠️ Annotation Tools",
    text: "Use these tools to create and manage your annotations. You can add comments, tags, and more to highlight important parts of your documents.",
    attachTo: { element: "#right-column", on: "left" },
    buttons: [
      { text: "← Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Finish", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: "tour-highlight-column"
  });

  // Final step
  tour.addStep({
    id: "complete",
    title: "🎉 You're all set!",
    text: "You've completed the Document Annotation tour. Start exploring and annotating your documents. If you need help, click the question mark icon at any time.",
    buttons: [
      { text: "Got it!", action: tour.complete, classes: "shepherd-button" }
    ]
  });
}

/**
 * Start the tour
 */
function startTour() {
  try {
    const tour = initTour();
    if (tour) {
      addTourSteps(tour);
      tour.start();
      
      // Add event listener to restart the tour if needed
      document.querySelector('.help-button').addEventListener('click', function(e) {
        e.preventDefault();
        if (tour.isActive()) {
          tour.complete();
        } else {
          tour.start();
        }
      });
    }
  } catch (error) {
    console.error("Error starting tour:", error);
  }
}

// Initialize the tour when the help button is clicked
document.addEventListener("DOMContentLoaded", function () {
  const helpButton = document.querySelector('.help-button');
  if (helpButton) {
    helpButton.addEventListener('click', function(e) {
      e.preventDefault();
      startTour();
    });
  }
});

// Make the startTour function globally available
window.startDocumentAnnotationTour = startTour;