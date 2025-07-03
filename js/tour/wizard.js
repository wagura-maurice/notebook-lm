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

  // Welcome step with better styling and engagement
  tour.addStep({
    id: "welcome",
    title: "👋 Welcome to NotebookLM",
    text: "Let's take a quick tour to help you get the most out of NotebookLM. You'll learn how to manage sources, chat with your documents, and create notes efficiently.",
    buttons: [
      {
        text: "Start Tour",
        action: tour.next,
        classes: "shepherd-button-primary",
      },
      {
        text: "Skip for now",
        action: tour.cancel,
        classes: "shepherd-button-secondary",
      },
    ],
    cancelIcon: {
      enabled: true,
      label: "Close",
    },
    highlightClass: "tour-highlight-welcome",
    canClickTarget: true,
    scrollTo: { behavior: "smooth", block: "center" },
    beforeShowPromise: function () {
      return new Promise(function (resolve) {
        // Add a slight delay for a smoother experience
        setTimeout(resolve, 300);
      });
    },
    when: {
      show: function () {
        // Add a class to the body when tour starts
        document.body.classList.add("tour-active");
      },
      hide: function () {
        // Remove the class when tour ends or is skipped
        if (tour.isActive()) {
          document.body.classList.remove("tour-active");
        }
      },
    },
  });

  // Left Column - Overview with more engaging content
  tour.addStep({
    id: "left-column-overview",
    title: "📚 Your Knowledge Base",
    text: "This is your Sources panel where all your documents live. You can upload PDFs, Word docs, and more. Each source can be selected, organized, and used to generate insights.",
    attachTo: {
      element: "#left-column",
      on: "right",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
        secondary: true,
      },
      {
        text: "Next →",
        action: tour.next,
        classes: "shepherd-button",
      },
    ],
    highlightClass: "tour-highlight-column",
    canClickTarget: true,
    scrollTo: { behavior: "smooth", block: "center" },
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
    when: {
      show: function () {
        // Ensure the left column is expanded
        const leftColumn = document.querySelector("#left-column");
        if (leftColumn) {
          leftColumn.classList.remove("collapsed");
        }
      },
    },
  });

  // Add Source Button with interactive tips
  tour.addStep({
    id: "add-source-button",
    title: "➕ Add Content",
    text: "Click here to upload documents, import from cloud storage, or paste text. NotebookLM supports PDFs, Word docs, and more!",
    attachTo: {
      element: "#addSourceBtn",
      on: "bottom",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Got it! Next →",
        action: tour.next,
        classes: "shepherd-button",
      },
    ],
    highlightClass: "tour-highlight-button",
    canClickTarget: true,
    scrollTo: { behavior: "smooth", block: "center" },
    when: {
      show: function () {
        // Add a pulsing effect to the button
        const btn = document.querySelector("#addSourceBtn");
        if (btn) {
          btn.classList.add("pulse-animation");
          // Remove the class after animation completes
          setTimeout(() => {
            btn.classList.remove("pulse-animation");
          }, 2000);
        }
      },
      hide: function () {
        // Clean up animation class
        const btn = document.querySelector("#addSourceBtn");
        if (btn) {
          btn.classList.remove("pulse-animation");
        }
      },
    },
  });

  // Discover Sources Button with more context
  tour.addStep({
    id: "discover-sources-button",
    title: "🔍 Discover Content",
    text: "Find and add existing sources or connect to external services like Google Drive, Dropbox, or OneDrive. Great for accessing your previously uploaded documents!",
    attachTo: {
      element: "#discoverSourceBtn",
      on: "bottom",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Next →",
        action: tour.next,
        classes: "shepherd-button",
      },
    ],
    highlightClass: "tour-highlight-button",
    canClickTarget: true,
    scrollTo: { behavior: "smooth", block: "center" },
    when: {
      show: function () {
        // Ensure the left column is still expanded
        const leftColumn = document.querySelector("#left-column");
        if (leftColumn) {
          leftColumn.classList.remove("collapsed");
        }
      },
    },
  });

  // Note: Removed Select All Checkbox step as the element doesn't exist in the HTML

  // Source List Items with interactive example
  tour.addStep({
    id: "source-list-items",
    title: "📑 Your Documents",
    text: "Each source shows its name, type, and status. <br><br>💡 <em>Try clicking on a document to view its contents or use the menu (⋮) to access more options like renaming or removing.</em>",
    attachTo: {
      element: ".source-item:first-child",
      on: "right",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Got it! Next →",
        action: tour.next,
        classes: "shepherd-button",
      },
    ],
    highlightClass: "tour-highlight-item",
    canClickTarget: true,
    scrollTo: { behavior: "smooth", block: "center" },
    when: {
      show: function () {
        // Highlight the first source item
        const firstSource = document.querySelector(".source-item:first-child");
        if (firstSource) {
          firstSource.classList.add("highlighted-item");
          setTimeout(() => {
            firstSource.classList.remove("highlighted-item");
          }, 1500);
        }
      },
    },
  });

  // Chat Messages with interactive tips
  tour.addStep({
    id: "chat-messages",
    title: "📜 Conversation History",
    text: "Your chat history appears here. <br><br>💡 <em>Hover over messages to see options like 'Add to note' or 'Copy'. You can also click on citations to jump to the source.</em>",
    attachTo: {
      element: "#chat-messages",
      on: "left",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Next →",
        action: tour.next,
        classes: "shepherd-button",
      },
    ],
    highlightClass: "tour-highlight-message-area",
    canClickTarget: true,
    scrollTo: { behavior: "smooth", block: "center" },
    when: {
      show: function () {
        // Add a subtle animation to the message area
        const messageArea = document.querySelector("#chat-messages");
        if (messageArea) {
          messageArea.classList.add("highlight-message-area");
          setTimeout(() => {
            messageArea.classList.remove("highlight-message-area");
          }, 1500);
        }
      },
    },
  });

  // Chat Input with suggestions
  const chatInput = document.querySelector("#chat-input");
  if (chatInput) {
    tour.addStep({
      id: "chat-input",
      title: "💬 Chat with NotebookLM",
      text: "Type your questions here. The AI will analyze your documents and provide helpful responses. <br><br>💡 <em>Try asking about the content of your documents or request summaries!</em>",
      attachTo: {
        element: chatInput,
        on: "top",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Got it! Next →",
          action: tour.next,
          classes: "shepherd-button",
        },
      ],
      highlightClass: "tour-highlight-input",
      canClickTarget: true,
      scrollTo: { behavior: "smooth", block: "center" },
      when: {
        show: function () {
          // Add focus to the input
          chatInput.focus({ preventScroll: true });
          chatInput.classList.add("input-highlight");
          setTimeout(() => {
            chatInput.classList.remove("input-highlight");
          }, 1500);
        },
      },
    });
  }

  // Studio Column Overview
  const rightColumn = document.querySelector("#right-column");
  if (rightColumn) {
    tour.addStep({
      id: "studio-overview",
      title: "📚 Studio Workspace",
      text: "Welcome to your Studio workspace! This is where you can organize your notes, create structured content, and build upon your research.<br><br>💡 <em>You can drag and drop content from chat or sources directly into your notes!</em>",
      attachTo: {
        element: rightColumn,
        on: "left",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next →",
          action: tour.next,
          classes: "shepherd-button",
        },
      ],
      highlightClass: "tour-highlight-column",
      canClickTarget: true,
      scrollTo: { behavior: "smooth", block: "center" },
      when: {
        show: function () {
          // Ensure right column is expanded
          rightColumn.classList.remove("collapsed");
          rightColumn.classList.add("expanded");
        },
      },
    });
  }

  // Add Note Button
  const addNoteBtn = document.querySelector("#add-note-btn");
  if (addNoteBtn) {
    tour.addStep({
      id: "add-note-button",
      title: "📝 Create New Notes",
      text: "Click here to create a new note. You can organize your thoughts, save important information, and structure your research.<br><br>💡 <em>Try creating different types of notes for different topics or projects!</em>",
      attachTo: {
        element: addNoteBtn,
        on: "bottom",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next →",
          action: tour.next,
          classes: "shepherd-button",
        },
      ],
      highlightClass: "tour-highlight-button",
      canClickTarget: true,
      scrollTo: { behavior: "smooth", block: "center" },
      when: {
        show: function () {
          // Add a pulsing effect to the button
          addNoteBtn.classList.add("pulse-animation");
          // Remove the class after animation completes
          setTimeout(() => {
            addNoteBtn.classList.remove("pulse-animation");
          }, 2000);
        },
      },
    });
  }

  // Notes List with interactive example
  const firstNote = document.querySelector(
    ".notes-list .note-item:first-child"
  );
  if (firstNote) {
    // Note item actions
    tour.addStep({
      id: "note-actions",
      title: "📌 Note Actions",
      text: "Each note has several actions available on hover:<br>• Click to view/edit<br>• Use the menu (⋮) for more options<br>• Drag to reorder notes<br><br>💡 <em>Try right-clicking a note for quick actions!</em>",
      attachTo: {
        element: firstNote,
        on: "left",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next →",
          action: tour.next,
          classes: "shepherd-button",
        },
      ],
      highlightClass: "tour-highlight-item",
      canClickTarget: true,
      scrollTo: { behavior: "smooth", block: "center" },
      when: {
        show: function () {
          // Simulate hover on the first note
          firstNote.classList.add("highlighted-note");
          // Show the menu toggle
          const menuToggle = firstNote.querySelector(".note-menu-toggle");
          if (menuToggle) menuToggle.style.opacity = "1";
        },
        hide: function () {
          firstNote.classList.remove("highlighted-note");
          const menuToggle = firstNote.querySelector(".note-menu-toggle");
          if (menuToggle) menuToggle.style.opacity = "";
        },
      },
    });
  } else {
    // Fallback if no notes exist
    tour.addStep({
      id: "notes-list-empty",
      title: "📝 Your Notes",
      text: "Your saved notes will appear here. Create your first note to get started!<br><br>💡 <em>Notes help you organize information from different sources in one place.</em>",
      attachTo: {
        element: ".notes-list",
        on: "left",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next →",
          action: tour.next,
          classes: "shepherd-button",
        },
      ],
      highlightClass: "tour-highlight-item",
      canClickTarget: true,
    });
  }

  // Note Organization
  const notesList = document.querySelector(".notes-list");
  if (notesList) {
    tour.addStep({
      id: "note-organization",
      title: "🗂️ Organize Your Notes",
      text: "Keep your research organized with these tips:<br>• Use descriptive titles<br>• Group related notes together<br>• Use tags for easy filtering<br>• Pin important notes to the top<br><br>💡 <em>You can create folders to better organize your notes!</em>",
      attachTo: {
        element: notesList,
        on: "top",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        {
          text: "Next →",
          action: tour.next,
          classes: "shepherd-button",
        },
      ],
      highlightClass: "tour-highlight-section",
      canClickTarget: true,
    });
  }

  // Final step - completion
  tour.addStep({
    id: "tour-complete",
    title: "🎉 Tour Complete!",
    text:
      "You've completed the NotebookLM tour! Here are some next steps to get started:<br><br>" +
      "1. Upload or connect your documents<br>" +
      "2. Ask questions about your content<br>" +
      "3. Create notes to organize your insights<br><br>" +
      "<em>You can always access this tour again by clicking the help button in the bottom right corner.</em>",
    buttons: [
      {
        text: "Start Exploring! 🚀",
        action: tour.complete,
        classes: "shepherd-button shepherd-button-primary",
      },
    ],
    cancelIcon: { enabled: false },
    highlightClass: "tour-highlight-welcome",
    canClickTarget: true,
    when: {
      hide: function () {
        // Clean up any tour-related classes
        document.body.classList.remove("tour-active");

        // Show a thank you message
        const notification = document.createElement("div");
        notification.className =
          "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center";
        notification.innerHTML = `
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Tour completed! Happy exploring!</span>
        `;
        document.body.appendChild(notification);

        // Remove the notification after 3 seconds
        setTimeout(() => {
          notification.style.opacity = "0";
          notification.style.transition = "opacity 0.5s ease";
          setTimeout(() => {
            notification.remove();
          }, 500);
        }, 3000);
      },
    },
  });
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
 * Initialize the tour when the help button is clicked
 */
document.addEventListener("DOMContentLoaded", function () {
  const tourHelpBtn = document.getElementById("tourHelpBtn");

  if (tourHelpBtn) {
    // Add hover effect
    tourHelpBtn.addEventListener("mouseenter", () => {
      tourHelpBtn.classList.add("ring-2", "ring-offset-2", "ring-indigo-400");
    });

    tourHelpBtn.addEventListener("mouseleave", () => {
      tourHelpBtn.classList.remove(
        "ring-2",
        "ring-offset-2",
        "ring-indigo-400"
      );
    });

    // Initialize the tour when the help button is clicked
    tourHelpBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Start the tour
      startTour();
    });
  } else {
    console.warn("Tour help button not found in the DOM");
  }
});

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
