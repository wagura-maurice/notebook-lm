/**
 * NotebookLM Guided Tour
 * This module provides an interactive tour of the NotebookLM interface
 */

// Global tour instance
let currentTour = null;

// Chat simulation state
const chatSimulation = {
  isSimulating: false,
  currentStep: 0,
  defaultWizardMessages: [
    {
      sender: 'ai',
      text: 'Hello! I\'m your AI assistant. I can help you analyze and understand your sources. What would you like to know?',
      timestamp: new Date().toISOString(),
      sources: []
    },
    {
      sender: 'user',
      text: 'Can you summarize the key points from my documents?',
      timestamp: new Date().toISOString()
    },
    {
      sender: 'ai',
      text: 'Of course! Based on the documents you\'ve uploaded, here are the key points...',
      timestamp: new Date().toISOString(),
      sources: [
        { id: 'doc1', title: 'Research Paper 1', page: 3 },
        { id: 'doc2', title: 'Article Summary', page: 1 }
      ]
    }
  ],
  policyWizardMessages: [
    {
      sender: 'ai',
      text: 'Welcome to the Policy Wizard! I can help you create and manage access policies for your documents.',
      timestamp: new Date().toISOString()
    },
    {
      sender: 'user',
      text: 'How do I restrict access to sensitive documents?',
      timestamp: new Date().toISOString()
    },
    {
      sender: 'ai',
      text: 'You can restrict access by creating a policy that specifies which users or groups can view or edit specific documents. Would you like me to help you create one?',
      timestamp: new Date().toISOString(),
      action: 'suggest_policy_creation'
    }
  ],
  
  // Initialize chat simulation
  init: function() {
    this.isSimulating = true;
    this.currentStep = 0;
    this.clearChat();
  },
  
  // Clear existing chat messages
  clearChat: function() {
    const chatContainer = document.querySelector('#chat-messages, #policy-messages');
    if (chatContainer) {
      chatContainer.innerHTML = '';
    }
  },
  
  // Add a message to the chat
  addMessage: function(message) {
    const chatContainer = document.querySelector('#chat-messages, #policy-messages');
    if (!chatContainer) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${message.sender}-message`;
    
    const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageEl.innerHTML = `
      <div class="message-content">
        <div class="message-text">${message.text}</div>
        ${message.sources ? this.renderSources(message.sources) : ''}
        <div class="message-time">${timestamp}</div>
      </div>
    `;
    
    chatContainer.appendChild(messageEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  },
  
  // Render source citations
  renderSources: function(sources) {
    if (!sources || sources.length === 0) return '';
    
    const sourcesHtml = sources.map(source => 
      `<div class="source-citation">
        <i class="fas fa-file-alt"></i>
        <span>${source.title}${source.page ? `, page ${source.page}` : ''}</span>
      </div>`
    ).join('');
    
    return `<div class="message-sources">${sourcesHtml}</div>`;
  },
  
  // Simulate typing effect
  simulateTyping: function(message, callback) {
    const input = document.querySelector('#chat-input, #policy-input');
    if (!input) return;
    
    input.value = '';
    let i = 0;
    const speed = 30; // milliseconds per character
    
    function typeWriter() {
      if (i < message.length) {
        input.value += message.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
      } else if (callback) {
        callback();
      }
    }
    
    typeWriter();
  },
  
  // Run the simulation
  runSimulation: function() {
    if (!this.isSimulating) return;
    
    const messages = getActiveWizardView() === 'policy' 
      ? this.policyWizardMessages 
      : this.defaultWizardMessages;
    
    if (this.currentStep >= messages.length) {
      this.isSimulating = false;
      return;
    }
    
    const message = messages[this.currentStep];
    
    if (message.sender === 'user') {
      this.simulateTyping(message.text, () => {
        setTimeout(() => {
          this.addMessage(message);
          this.currentStep++;
          this.runSimulation();
        }, 500);
      });
    } else {
      this.addMessage(message);
      this.currentStep++;
      setTimeout(() => this.runSimulation(), 1500);
    }
  },
  
  // Start the simulation
  start: function() {
    this.init();
    this.runSimulation();
  },
  
  // Stop the simulation
  stop: function() {
    this.isSimulating = false;
  }
};

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
 * Initialize tour styles
 * Note: All styles are now in /css/tour.css
 */
function addTourStyles() {
  // No need to add styles here as they're in the external CSS file
  // This function is kept for backward compatibility
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
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 6,
        popperOptions: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 15],
              },
            },
            {
              name: "preventOverflow",
              options: {
                padding: 10,
                boundary: "viewport",
                tether: false,
              },
            },
          ],
        },
        when: {
          show: function () {
            // Ensure our highlight class is applied
            const currentStep = tour.getCurrentStep();
            if (currentStep && currentStep.options.highlightClass) {
              const targetElement = currentStep.target;
              if (targetElement) {
                // Remove any existing highlight classes first
                targetElement.classList.remove(
                  "shepherd-target-highlight",
                  "tour-highlight-welcome",
                  "tour-highlight-column",
                  "tour-highlight-button",
                  "tour-highlight-item",
                  "tour-highlight-message-area",
                  "tour-highlight-input"
                );
                // Add the current step's highlight class
                targetElement.classList.add(currentStep.options.highlightClass);
              }
            }
          },
          hide: function () {
            // Clean up highlight classes when hiding the step
            const currentStep = tour.getCurrentStep();
            if (currentStep && currentStep.options.highlightClass) {
              const targetElement = currentStep.target;
              if (targetElement) {
                targetElement.classList.remove(
                  currentStep.options.highlightClass
                );
              }
            }
          },
        },
      },
      exitOnEsc: true,
      keyboardNavigation: true,
      tourName: "notebook-lm-tour",
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
 * Detect which wizard view is currently active
 * @returns {string} 'default' or 'policy' based on URL or wizard visibility
 */
function getActiveWizardView() {
  // First try to determine from URL if possible
  if (window.location.href.includes("policy-wizard")) {
    return "policy";
  }
  if (window.location.href.includes("default-wizard")) {
    return "default";
  }

  // Fallback to DOM detection if URL doesn't specify
  const defaultWizard = document.querySelector(".default-wizard");
  const policyWizard = document.querySelector(".policy-wizard");

  if (policyWizard && getComputedStyle(policyWizard).display !== "none") {
    return "policy";
  }

  // Default to default wizard
  return "default";
}

/**
 * Helper function to check if an element exists and is visible
 * @param {string} selector - The CSS selector for the element
 * @returns {boolean} - True if the element exists and is visible
 */
function elementExistsAndVisible(selector) {
  const el = document.querySelector(selector);
  return (
    el && getComputedStyle(el).display !== "none" && el.offsetParent !== null
  );
}

/**
 * Adds a step to the tour only if the target element exists and is visible
 * @param {Object} tour - The Shepherd tour instance
 * @param {Object} step - The step configuration
 * @returns {boolean} - True if the step was added, false otherwise
 */
function addStepIfElementExists(tour, step) {
  // If no attachTo is specified, always add the step
  if (!step.attachTo || !step.attachTo.element) {
    tour.addStep(step);
    return true;
  }

  // Check if the target element exists and is visible
  if (elementExistsAndVisible(step.attachTo.element)) {
    tour.addStep(step);
    return true;
  }

  console.warn(
    `Skipping step "${step.id}": Element "${step.attachTo.element}" not found or not visible`
  );
  return false;
}

/**
 * Add steps to the tour
 * @param {Object} tour - The Shepherd tour instance
 */
function addTourSteps(tour) {
  if (!tour) return;

  // Get the active wizard view
  const activeView = getActiveWizardView();
  const isDefaultWizard = activeView === "default";

  // Welcome step with better styling and engagement
  tour.addStep({
    id: "welcome",
    title: `👋 Welcome to ${isDefaultWizard ? "Default" : "Policy"} Wizard`,
    text: `Let's take a quick tour of the ${
      isDefaultWizard ? "Default" : "Policy"
    } Wizard. You'll learn how to ${
      isDefaultWizard
        ? "chat with your documents and generate insights"
        : "create and manage policies"
    } using this powerful tool.`,
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
        if (leftColumn && leftColumn.classList.contains("collapsed")) {
          const toggleBtn = document.querySelector(".toggle-left-column");
          if (toggleBtn) toggleBtn.click();
        }
      },
    },
  });

  // Add Add Source button step
  addStepIfElementExists(tour, {
    id: "add-source-button",
    title: "➕ Add Source",
    text: "Click here to upload documents, import from cloud storage, or paste text. Supports PDFs, Word docs, and more.",
    attachTo: {
      element: "#addSourceBtn",
      on: "right",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
      },
      { text: "Next →", action: tour.next, classes: "shepherd-button" },
    ],
    highlightClass: "tour-highlight-button",
    canClickTarget: true,
    scrollTo: { behavior: "smooth", block: "center" },
    when: {
      show: function () {
        const btn = document.querySelector("#addSourceBtn");
        if (btn) btn.classList.add("pulse-animation");
      },
      hide: function () {
        const btn = document.querySelector("#addSourceBtn");
        if (btn) btn.classList.remove("pulse-animation");
      },
    },
  });

  // Add Discover Source button step
  addStepIfElementExists(tour, {
    id: "discover-source-button",
    title: "🔍 Discover Sources",
    text: "Find and add relevant sources from your connected accounts or the web. Great for discovering new content related to your research.",
    attachTo: {
      element: "#discoverSourceBtn",
      on: "right",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
      },
      { text: "Next →", action: tour.next, classes: "shepherd-button" },
    ],
    highlightClass: "tour-highlight-button",
    canClickTarget: true,
  });

  // Add Chat About Sources button step
  addStepIfElementExists(tour, {
    id: "chat-about-sources-button",
    title: "💬 Chat About Sources",
    text: "Start a conversation about your selected sources. The AI will analyze all selected documents to provide comprehensive answers and insights.",
    attachTo: {
      element: "#chatAboutSourcesBtn",
      on: "right",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
      },
      { text: "Next →", action: tour.next, classes: "shepherd-button" },
    ],
    highlightClass: "tour-highlight-button",
    canClickTarget: true,
    beforeShowPromise: function () {
      // Ensure the button is visible by scrolling if needed
      const btn = document.querySelector("#chatAboutSourcesBtn");
      if (btn) {
        btn.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return Promise.resolve();
    },
    when: {
      show: function () {
        // Add a pulsing effect to the button
        const btn = document.querySelector("#chatAboutSourcesBtn");
        if (btn) {
          btn.classList.add("pulse-animation");
        }
      },
      hide: function () {
        // Clean up animation class
        const btn = document.querySelector("#chatAboutSourcesBtn");
        if (btn) {
          btn.classList.remove("pulse-animation");
        }
      },
    },
  });

  // Add Mind Map button step
  addStepIfElementExists(tour, {
    id: "mind-map-button",
    title: "🧠 Mind Map",
    text: "Visualize the connections between your sources and ideas. Create interactive mind maps to organize your thoughts and see relationships between concepts.",
    attachTo: {
      element: "#mindMapSourceBtn",
      on: "right",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
      },
      { text: "Next →", action: tour.next, classes: "shepherd-button" },
    ],
    highlightClass: "tour-highlight-button",
    canClickTarget: true,
    scrollTo: { behavior: "smooth", block: "center" },
    when: {
      show: function () {
        const btn = document.querySelector("#mindMapSourceBtn");
        if (btn) btn.classList.add("pulse-animation");
      },
      hide: function () {
        const btn = document.querySelector("#mindMapSourceBtn");
        if (btn) btn.classList.remove("pulse-animation");
      },
    },
  });

  // Add Canvas button step (only if it exists)
  const canvasBtn = document.querySelector("#canvasSourceBtn");
  if (canvasBtn) {
    addStepIfElementExists(tour, {
      id: "canvas-button",
      title: "🎨 Canvas",
      text: "Create free-form visualizations and diagrams. Organize your ideas spatially and make connections between different concepts in your research.",
      attachTo: {
        element: "#canvasSourceBtn",
        on: "right",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        { text: "Next →", action: tour.next, classes: "shepherd-button" },
      ],
      highlightClass: "tour-highlight-button",
      canClickTarget: true,
      scrollTo: { behavior: "smooth", block: "center" },
      when: {
        show: function () {
          const btn = document.querySelector("#canvasSourceBtn");
          if (btn) btn.classList.add("pulse-animation");
        },
        hide: function () {
          const btn = document.querySelector("#canvasSourceBtn");
          if (btn) btn.classList.remove("pulse-animation");
        },
      },
    });
  }

  // Add source list step
  addStepIfElementExists(tour, {
    id: "source-list",
    title: "📚 Your Sources",
    text: "Your uploaded sources appear here. Select one or more sources to work with them.",
    attachTo: {
      element: ".source-list",
      on: "right",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
      },
      { text: "Next →", action: tour.next, classes: "shepherd-button" },
    ],
    highlightClass: "tour-highlight-sources",
    canClickTarget: true,
    scrollTo: { behavior: "smooth", block: "start" },
  });

  // Add right column overview step
  addStepIfElementExists(tour, {
    id: "right-column-overview",
    title: "📝 Active Workspace",
    text: "This is your main workspace where you'll interact with your content. The view changes based on your current task - whether you're chatting with sources, creating mind maps, or working with the canvas.",
    attachTo: {
      element: "#right-column",
      on: "left",
    },
    buttons: [
      {
        text: "← Back",
        action: tour.back,
        classes: "shepherd-button-secondary",
      },
      { text: "Next →", action: tour.next, classes: "shepherd-button" },
    ],
    highlightClass: "tour-highlight-workspace",
    canClickTarget: true,
    scrollTo: { behavior: "smooth", block: "center" },
    when: {
      show: function () {
        // Ensure the right column is visible
        const rightColumn = document.querySelector("#right-column");
        if (rightColumn) rightColumn.style.zIndex = "1000";
      },
      hide: function () {
        const rightColumn = document.querySelector("#right-column");
        if (rightColumn) rightColumn.style.zIndex = "";
      },
    },
  });

  // Add chat interface steps if in default wizard view
  if (
    document.querySelector(".default-wizard") &&
    document.querySelector("#chat-messages")
  ) {
    addStepIfElementExists(tour, {
      id: "chat-interface",
      title: "💬 Chat with Your Sources",
      text: "Here you can have conversations about your selected sources. The AI will analyze the content and provide relevant answers based on your documents.",
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
        { text: "Next →", action: tour.next, classes: "shepherd-button" },
      ],
      highlightClass: "tour-highlight-chat",
      canClickTarget: true,
      scrollTo: { behavior: "smooth", block: "center" },
      when: {
        show: function () {
          // Ensure chat messages are visible
          const chatMessages = document.querySelector("#chat-messages");
          if (chatMessages)
            chatMessages.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        },
      },
    });

    // Add chat input step
    addStepIfElementExists(tour, {
      id: "chat-input",
      title: "✍️ Your Input",
      text: "Type your questions or requests here. The AI will analyze your selected sources to provide relevant responses.",
      attachTo: {
        element:
          "#chat-input-container, .chat-input-container, [role='textbox']",
        on: "top",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        { text: "Next →", action: tour.next, classes: "shepherd-button" },
      ],
      highlightClass: "tour-highlight-input",
      canClickTarget: true,
    });
  }

  // Add steps for default wizard
  if (document.querySelector(".default-wizard")) {
    addStepIfElementExists(tour, {
      id: "default-wizard-chat",
      title: "💬 Chat with Your Sources",
      text: "This is where you can chat with the AI about your selected sources. The AI will use the context from your sources to answer your questions.",
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
        { text: "Next →", action: tour.next, classes: "shepherd-button" },
      ],
      highlightClass: "tour-highlight-chat",
      canClickTarget: true,
      scrollTo: { behavior: "smooth", block: "center" },
    });

    // Only add the input step if the input container exists
    addStepIfElementExists(tour, {
      id: "default-wizard-input",
      title: "✍️ Your Input",
      text: "Type your questions or requests here. The AI will analyze your selected sources to provide relevant responses.",
      attachTo: {
        element:
          "#chat-input-container, .chat-input-container, [role='textbox']",
        on: "top",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        { text: "Next →", action: tour.next, classes: "shepherd-button" },
      ],
      highlightClass: "tour-highlight-input",
      canClickTarget: true,
    });
  }

  // Add steps for policy wizard
  if (document.querySelector(".policy-wizard")) {
    addStepIfElementExists(tour, {
      id: "policy-wizard-overview",
      title: "🛡️ Policy Management",
      text: "The Policy Wizard helps you create and manage access policies for your documents and resources.",
      attachTo: {
        element: ".policy-wizard",
        on: "left",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        { text: "Next →", action: tour.next, classes: "shepherd-button" },
      ],
      highlightClass: "tour-highlight-policy",
      canClickTarget: true,
      scrollTo: { behavior: "smooth", block: "center" },
    });

    addStepIfElementExists(tour, {
      id: "policy-wizard-messages",
      title: "💬 Policy Assistant",
      text: "Here you can chat with the Policy Assistant to create, improve, or analyze policies. Type your request or question in the input below.",
      attachTo: {
        element: "#policy-messages",
        on: "left",
      },
      buttons: [
        {
          text: "← Back",
          action: tour.back,
          classes: "shepherd-button-secondary",
        },
        { text: "Next →", action: tour.next, classes: "shepherd-button" },
      ],
      highlightClass: "tour-highlight-message-area",
      canClickTarget: true,
      scrollTo: { behavior: "smooth", block: "center" },
      beforeShowPromise: function () {
        // Ensure the messages container is visible
        const messages = document.querySelector("#policy-messages");
        if (messages) {
          messages.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return Promise.resolve();
      },
    });
  }

  // Common final step - always show this one
  tour.addStep({
    id: "tour-complete",
    title: "🎉 Tour Complete!",
    text: "You've completed the tour! Feel free to explore the wizard on your own. You can always take this tour again by clicking the help button.",
    buttons: [
      {
        text: "Finish",
        action: tour.complete,
        classes: "shepherd-button-primary",
      },
    ],
    highlightClass: "tour-highlight-complete",
    canClickTarget: true,
  });

  // If no steps were added (all elements were missing), show an error
  if (tour.steps.length === 0) {
    console.error(
      "No valid tour steps could be added - required elements not found"
    );
    showNotification(
      "Could not start the tour - required elements not found. Please refresh the page and try again.",
      "error"
    );
    return false;
  }

  return true;
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
    const stepsAdded = addTourSteps(tour);

    if (!stepsAdded) {
      // addTourSteps will have already shown an error message
      return false;
    }

    // Check if we have any steps (should always be at least 1 if stepsAdded is true)
    if (tour.steps.length === 0) {
      console.error("No valid steps found for the tour");
      showNotification("No tour content available at the moment.", "error");
      return false;
    }

    // Determine which wizard view is active and show appropriate notification
    const activeView = getActiveWizardView();
    const welcomeMessage =
      activeView === "default"
        ? "Welcome to the Default Wizard! Let's get started with the tour."
        : "Welcome to the Policy Wizard! Let's get started with the tour.";

    // Show welcome notification
    showNotification(welcomeMessage, "info");

    // Start the simulation when the tour starts
    setTimeout(() => {
      chatSimulation.start();
    }, 1000);

    // Start the tour
    tour.start();

    // Add completion handler
    tour.on("complete", () => {
      showNotification(
        "Tour completed! 🎉 You're all set to explore NotebookLM."
      );
      chatSimulation.stop();
    });

    // Add cancel handler
    tour.on("cancel", () => {
      chatSimulation.stop();
      showNotification(
        "Tour skipped. You can restart it anytime using the help button.",
        "info"
      );
    });

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
