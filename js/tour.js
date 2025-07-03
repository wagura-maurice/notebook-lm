/**
 * NotebookLM Guided Tour
 * This module provides an interactive tour of the NotebookLM interface
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
  // Only add styles once
  if (document.getElementById("shepherd-styles")) return;

  const style = document.createElement("style");
  style.id = "shepherd-styles";
  style.textContent = `
    .shepherd-theme-custom {
      max-width: 400px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .shepherd-target-highlight {
      position: relative;
      z-index: 9999;
    }
    .shepherd-button {
      background: #4f46e5;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      margin-right: 8px;
      padding: 6px 12px;
    }
    .shepherd-button-secondary {
      background: #e5e7eb;
      color: #4b5563;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initialize the tour with all necessary configurations
 * @returns {Object|null} The initialized tour instance or null if failed
 */
function initTour() {
  console.log("Initializing tour steps...");

  try {
    // Check if Shepherd is loaded
    if (typeof Shepherd === "undefined") {
      throw new Error("Shepherd.js is not loaded");
    }

    // Clean up any existing tour
    cleanupExistingTour();

    // Add custom styles for the tour
    addTourStyles();

    // Create and configure new tour instance
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: "shepherd-theme-custom",
        scrollTo: { behavior: "smooth", block: "center" },
        arrow: true,
        canClickTarget: false,
        highlightClass: "shepherd-target-highlight",
        popperOptions: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 15],
              },
            },
          ],
        },
      },
      exitOnEsc: true,
      keyboardNavigation: true,
    });

    // Store the tour instance globally
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
    title: "Welcome to NotebookLM",
    text: "This comprehensive tour will guide you through all the interactive elements of NotebookLM. Let's get started!",
    buttons: [
      {
        text: "Next",
        action: tour.next
      },
      {
        text: "Skip",
        action: tour.cancel,
        classes: "shepherd-button-secondary",
      },
    ],
    cancelIcon: { enabled: true },
    highlightClass: 'tour-highlight',
    canClickTarget: false
  });

  // Left Column - Overview
  tour.addStep({
    id: "left-column-overview",
    title: "Sources Column",
    text: "This is where all your sources (documents, PDFs, etc.) are listed. You can manage and organize them here.",
    attachTo: { element: "#left-column", on: "right" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: 'tour-highlight',
    canClickTarget: true
  });

  // Add Source Button
  tour.addStep({
    id: "add-source-button",
    title: "Add New Source",
    text: "Click here to add new sources like PDFs, Word documents, or text directly.",
    attachTo: { element: "#addSourceBtn", on: "bottom" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: 'tour-highlight',
    canClickTarget: true
  });

  // Discover Sources Button
  tour.addStep({
    id: "discover-sources-button",
    title: "Discover Sources",
    text: "Browse and add from your existing sources or connect to external services.",
    attachTo: { element: "#discoverSourceBtn", on: "bottom" },  // Fixed ID
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: 'tour-highlight',
    canClickTarget: true
  });

  // Note: Removed Select All Checkbox step as the element doesn't exist in the HTML

  // Source List Items
  tour.addStep({
    id: "source-list-items",
    title: "Source Items",
    text: "Each source shows its name, type, and status. Click to view, or use the menu (⋮) for more options.",
    attachTo: { element: ".source-item:first-child", on: "right" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: 'tour-highlight',
    canClickTarget: true
  });

  // Chat Messages
  tour.addStep({
    id: "chat-messages",
    title: "Chat Messages",
    text: "Your conversation appears here. Hover over messages to see options like 'Add to note' or 'Copy'.",
    attachTo: { element: "#chat-messages", on: "left" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: 'tour-highlight',
    canClickTarget: true
  });

  // Chat Input
  tour.addStep({
    id: "chat-input",
    title: "Chat Input",
    text: "Type your questions here. Press Enter or click the send button to submit.",
    attachTo: { element: "#chat-input", on: "top" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: 'tour-highlight',
    canClickTarget: true
  });

  // Right Column - Overview
  tour.addStep({
    id: "right-column-overview",
    title: "Studio",
    text: "Organize your notes and create structured content based on your sources.",
    attachTo: { element: "#right-column", on: "left" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: 'tour-highlight',
    canClickTarget: true
  });

  // Add Note Button
  tour.addStep({
    id: "add-note-button",
    title: "Create Notes",
    text: "Click here to create new notes from your sources or start from scratch.",
    attachTo: { element: "#add-note-btn", on: "bottom" },
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: 'tour-highlight',
    canClickTarget: true
  });

  // Notes List
  tour.addStep({
    id: "notes-list",
    title: "Your Notes",
    text: "All your notes appear here. Click to view or use the menu (⋮) for more options.",
    attachTo: { element: ".notes-list", on: "left" },  // Changed from .note-list to .notes-list
    buttons: [
      { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
      { text: "Next", action: tour.next, classes: "shepherd-button" }
    ],
    highlightClass: 'tour-highlight',
    canClickTarget: true
  });

  // User Menu - Using avatar button as fallback
  const userMenuButton = document.querySelector("#avatar-dropdown-trigger, #desktop-avatar-dropdown-trigger");
  if (userMenuButton) {
    tour.addStep({
      id: "user-menu",
      title: "Your Account",
      text: "Access your profile, settings, and sign out options here.",
      attachTo: { element: userMenuButton, on: "bottom" },
      buttons: [
        { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Finish", action: tour.complete, classes: "shepherd-button" }
      ],
      highlightClass: 'tour-highlight',
      canClickTarget: true
    });
  } else {
    // If no user menu button found, make the previous step the last one
    const lastStep = tour.steps[tour.steps.length - 1];
    if (lastStep) {
      lastStep.options.buttons = [
        { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Finish", action: tour.complete, classes: "shepherd-button" }
      ];
    }
  }
  
  // Note: Removed Theme Toggle step as the element doesn't exist in the HTML
}

/**
 * Start the tour
 */
function startTour() {
  try {
    console.log("Starting tour...");

    // Initialize the tour
    const tour = initTour();
    if (!tour) {
      console.error("Failed to initialize tour");
      showNotification(
        "Failed to start the tour. Please refresh the page and try again.",
        "error"
      );
      return false;
    }

    // Add steps to the tour
    addTourSteps(tour);

    // Check if we have any steps
    if (tour.steps.length === 0) {
      console.error("No valid steps found for the tour");
      showNotification("No tour content available at the moment.", "error");
      return false;
    }

    // Add completion handler
    tour.on("complete", () => {
      showNotification(
        "Tour completed! 🎉 You're all set to explore NotebookLM."
      );
    });

    // Add cancel handler
    tour.on("cancel", () => {
      showNotification(
        "Tour skipped. You can restart it anytime using the help button.",
        "info"
      );
    });

    // Start the tour
    tour.start();

    console.log("Tour started with", tour.steps.length, "steps");
    return true;
  } catch (error) {
    console.error("Error starting tour:", error);
    return false;
  }
}

/**
 * Add a help button to start the tour
 */
function addHelpButton() {
  // Check if button already exists
  if (document.getElementById("help-tour-button")) return;

  const helpButton = document.createElement("button");
  helpButton.id = "help-tour-button";
  helpButton.className =
    "fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-lg";
  helpButton.textContent = "Need Help?";
  helpButton.onclick = startTour;

  document.body.appendChild(helpButton);
}

// Add help button when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addHelpButton);
} else {
  addHelpButton();
}

/**
 * Show a notification message in the bottom-right corner
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = "success") {
  // Create notification container if it doesn't exist
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.style.padding = "15px 25px";
  notification.style.marginBottom = "10px";
  notification.style.borderRadius = "8px";
  notification.style.background =
    type === "error" ? "#fef2f2" : type === "info" ? "#eff6ff" : "#f0fdf4";
  notification.style.color =
    type === "error" ? "#991b1b" : type === "info" ? "#1e40af" : "#166534";
  notification.style.borderLeft = `4px solid ${
    type === "error" ? "#dc2626" : type === "info" ? "#3b82f6" : "#16a34a"
  }`;
  notification.style.boxShadow =
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
  notification.style.display = "flex";
  notification.style.alignItems = "center";
  notification.style.justifyContent = "space-between";
  notification.style.minWidth = "300px";
  notification.style.maxWidth = "400px";
  notification.style.transition = "all 0.3s ease";
  notification.style.transform = "translateX(120%)";
  notification.style.opacity = "0";

  // Add message
  const messageEl = document.createElement("div");
  messageEl.textContent = message;
  notification.appendChild(messageEl);

  // Add close button
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.fontSize = "20px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.marginLeft = "15px";
  closeBtn.style.color = "inherit";
  closeBtn.style.opacity = "0.7";
  closeBtn.onmouseover = () => (closeBtn.style.opacity = "1");
  closeBtn.onmouseout = () => (closeBtn.style.opacity = "0.7");
  closeBtn.onclick = () => {
    notification.style.transform = "translateX(120%)";
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  };
  notification.appendChild(closeBtn);

  // Add to container
  container.insertBefore(notification, container.firstChild);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
    notification.style.opacity = "1";
  }, 10);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.transform = "translateX(120%)";
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Make the startTour function globally available
window.startNotebookLMTour = startTour;

// Show welcome notification when the module loads
setTimeout(() => {
  showNotification(
    "Welcome to NotebookLM! Click the help button (?) for a guided tour.",
    "info"
  );
}, 1500);

console.log(
  "NotebookLM Tour module loaded. Call startNotebookLMTour() to begin."
);
