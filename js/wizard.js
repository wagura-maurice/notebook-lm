class AIWizard {
  constructor() {
    // Modal elements
    this.wizardModal = document.getElementById("open-wizard-modal");
    this.wizardContainer = this.wizardModal?.querySelector(".wizard-container");
    this.wizardContent = document.getElementById("wizard-content");
    this.messageInput = document.getElementById("wizard-message-input");
    this.sendButton = document.getElementById("wizard-send-btn");
    this.sourcesList = document.getElementById("wizard-sources-list");
    this.refreshSourcesBtn = document.getElementById("refresh-sources");

    // Tool buttons
    this.toolButtons = [];

    // Current state
    this.currentTool = "generate";
    this.isLoading = false;

    this.initializeEventListeners();
    this.initializeToolButtons();
  }

  initializeEventListeners() {
    // Toggle wizard
    document.querySelectorAll("[data-wizard-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => this.toggleWizard());
    });

    // Close button
    const closeBtn = this.wizardModal?.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeWizard());
    }

    // Close when clicking outside content
    this.wizardModal?.addEventListener("click", (e) => {
      if (e.target === this.wizardModal) {
        this.closeWizard();
      }
    });

    // Handle message input
    if (this.messageInput) {
      this.messageInput.addEventListener("input", () =>
        this.adjustTextareaHeight()
      );
      this.messageInput.addEventListener("keydown", (e) =>
        this.handleInputKeydown(e)
      );
    }

    // Handle send button
    if (this.sendButton) {
      this.sendButton.addEventListener("click", () => this.sendMessage());
    }

    // Handle refresh sources button
    if (this.refreshSourcesBtn) {
      this.refreshSourcesBtn.addEventListener("click", () =>
        this.updateSources()
      );
    }

    // Handle window resize for responsive adjustments
    window.addEventListener("resize", () => this.handleResize());
  }

  toggleWizard() {
    if (this.wizardModal) {
      this.wizardModal.classList.toggle("hidden");
      document.body.style.overflow = this.wizardModal.classList.contains(
        "hidden"
      )
        ? ""
        : "hidden";

      if (!this.wizardModal.classList.contains("hidden")) {
        this.updateSources();
        this.messageInput?.focus();
        // Set initial tool
        this.setActiveTool("generate");
      }
    }
  }

  closeWizard() {
    if (this.wizardModal) {
      this.wizardModal.classList.add("hidden");
      document.body.style.overflow = "";
      // Clear input when closing
      if (this.messageInput) {
        this.messageInput.value = "";
        this.adjustTextareaHeight();
      }
    }
  }

  initializeToolButtons() {
    const toolButtons = document.querySelectorAll(".wizard-tool-btn");
    toolButtons.forEach((btn) => {
      this.toolButtons.push(btn);
      btn.addEventListener("click", () => this.setActiveTool(btn.dataset.tool));
    });
  }

  setActiveTool(tool) {
    this.currentTool = tool;
    this.toolButtons.forEach((btn) => {
      if (btn.dataset.tool === tool) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update UI based on selected tool
    this.updateToolUI(tool);
  }

  updateToolUI(tool) {
    // Update the main content based on the selected tool
    // This is a placeholder - implement specific UI updates for each tool
    console.log("Switched to tool:", tool);
  }

  adjustTextareaHeight() {
    if (!this.messageInput) return;

    // Reset height to get the correct scrollHeight
    this.messageInput.style.height = "auto";
    // Set the height to scrollHeight, but limit to 15rem
    this.messageInput.style.height = `${Math.min(
      this.messageInput.scrollHeight,
      240
    )}px`;
  }

  handleResize() {
    // Handle any responsive adjustments needed
    if (window.innerWidth < 1024) {
      // Mobile/tablet adjustments
      this.wizardContainer?.classList.add("mobile-layout");
    } else {
      this.wizardContainer?.classList.remove("mobile-layout");
    }
  }

  updateSources() {
    if (!this.sourcesList) return;

    const sources = document.querySelectorAll(".source-item");
    this.sourcesList.innerHTML = "";

    if (sources.length === 0) {
      this.sourcesList.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          <i class="fas fa-folder-open text-2xl mb-2"></i>
          <p class="text-sm">No sources available</p>
        </div>
      `;
      return;
    }

    sources.forEach((source, index) => {
      const sourceClone = source.cloneNode(true);
      sourceClone.classList.add(
        "source-item",
        "m-2",
        "p-2",
        "rounded",
        "hover:bg-gray-700",
        "transition-colors",
        "cursor-pointer"
      );
      sourceClone.dataset.sourceIndex = index;

      // Add source icon based on type
      const icon = this.getSourceIcon(source);
      const title =
        source.querySelector(".source-title")?.textContent ||
        `Source ${index + 1}`;

      sourceClone.innerHTML = `
        <div class="flex items-center">
          <div class="flex-shrink-0 mr-2 text-${this.getSourceColor(
            source
          )}-400">
            <i class="${icon} text-lg"></i>
          </div>
          <div class="truncate">
            <div class="text-sm font-medium text-white truncate">${title}</div>
            <div class="text-xs text-gray-400 truncate">${this.getSourceInfo(
              source
            )}</div>
          </div>
        </div>
      `;

      // Add click handler
      sourceClone.addEventListener("click", (e) =>
        this.handleSourceClick(e, sourceClone)
      );

      this.sourcesList.appendChild(sourceClone);
    });
  }

  getSourceIcon(source) {
    // Determine icon based on source type or class
    if (source.classList.contains("pdf")) return "fas fa-file-pdf";
    if (source.classList.contains("doc")) return "fas fa-file-word";
    if (source.classList.contains("link")) return "fas fa-link";
    return "fas fa-file-alt";
  }

  getSourceColor(source) {
    // Determine color based on source type or class
    if (source.classList.contains("pdf")) return "red";
    if (source.classList.contains("doc")) return "blue";
    if (source.classList.contains("link")) return "green";
    return "gray";
  }

  getSourceInfo(source) {
    // Extract and format source info (e.g., date, type, size)
    const date = source.querySelector(".source-date")?.textContent || "";
    const type = source.classList.contains("pdf")
      ? "PDF"
      : source.classList.contains("doc")
      ? "Document"
      : source.classList.contains("link")
      ? "Link"
      : "File";

    return date ? `${type} • ${date}` : type;
  }

  handleSourceClick(event, sourceElement) {
    event.stopPropagation();

    // Remove active class from all sources
    this.sourcesList.querySelectorAll(".source-item").forEach((item) => {
      item.classList.remove("bg-gray-700", "active");
    });

    // Add active class to clicked source
    sourceElement.classList.add("bg-gray-700", "active");

    const sourceIndex = sourceElement.dataset.sourceIndex;
    this.loadSourceContent(sourceIndex);
  }

  loadSourceContent(sourceIndex) {
    // TODO: Implement source content loading logic
    console.log("Loading content for source:", sourceIndex);
    // You can update the wizard content here based on the selected source
  }

  handleInputKeydown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
    // Auto-resize textarea as user types
    this.adjustTextareaHeight();
  }

  async sendMessage() {
    const message = this.messageInput?.value.trim();
    if (!message) return;

    // Add user message to chat
    this.addMessage("user", message);
    this.messageInput.value = "";

    try {
      // TODO: Implement your AI response logic here
      // This is a placeholder for the AI response
      const response = await this.generateAIResponse(message);
      this.addMessage("assistant", response);
    } catch (error) {
      console.error("Error sending message:", error);
      this.addMessage(
        "assistant",
        "Sorry, I encountered an error. Please try again."
      );
    }
  }

  addMessage(role, content) {
    if (!this.wizardContent) return;

    // If this is the first message, clear the welcome content
    if (
      role === "user" &&
      this.wizardContent.children.length === 1 &&
      this.wizardContent.firstElementChild.classList.contains("text-center")
    ) {
      this.wizardContent.innerHTML = "";
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role} mb-6 animate-fade-in`;

    // Format the message based on role
    if (role === "user") {
      messageDiv.innerHTML = `
        <div class="flex items-start justify-end">
          <div class="bg-blue-600 text-white rounded-2xl px-4 py-3 max-w-4xl">
            <div class="prose prose-invert max-w-none">
              ${content.replace(/\n/g, "<br>")}
            </div>
          </div>
          <div class="flex-shrink-0 ml-3">
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <i class="fas fa-user text-white text-sm"></i>
            </div>
          </div>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="flex items-start">
          <div class="flex-shrink-0 mr-3">
            <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <i class="fas fa-robot text-white text-sm"></i>
            </div>
          </div>
          <div class="bg-gray-700 text-white rounded-2xl px-4 py-3 max-w-4xl">
            <div class="prose prose-invert max-w-none">
              ${content.replace(/\n/g, "<br>")}
            </div>
            <div class="mt-2 text-xs text-gray-400 flex items-center">
              <button class="flex items-center text-gray-400 hover:text-white mr-3">
                <i class="far fa-thumbs-up mr-1"></i> <span>Helpful</span>
              </button>
              <button class="flex items-center text-gray-400 hover:text-white">
                <i class="far fa-thumbs-down mr-1"></i> <span>Not helpful</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    this.wizardContent.appendChild(messageDiv);
    this.wizardContent.scrollTo({
      top: this.wizardContent.scrollHeight,
      behavior: "smooth",
    });
  }

  // Generate AI response based on the current tool and message
  async generateAIResponse(message) {
    // Show loading state
    this.isLoading = true;
    this.sendButton.disabled = true;
    this.sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
      // Simulate API call delay
      return new Promise((resolve) => {
        setTimeout(() => {
          let response = "";

          // Generate response based on the current tool
          switch (this.currentTool) {
            case "generate":
              response = this.generateContentResponse(message);
              break;
            case "edit":
              response = this.editContentResponse(message);
              break;
            case "research":
              response = this.researchResponse(message);
              break;
            case "ideas":
              response = this.ideasResponse(message);
              break;
            default:
              response = this.generateContentResponse(message);
          }

          resolve(response);
        }, 1500); // Simulate network delay
      });
    } finally {
      // Reset loading state
      this.isLoading = false;
      this.sendButton.disabled = false;
      this.sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
  }

  // Response generators for each tool
  generateContentResponse(message) {
    const responses = [
      `I've generated some content based on your request: "${message}"\n\n` +
        "Here's a well-structured draft that addresses your needs. Feel free to edit or expand on any section as needed.",

      `Based on your input: "${message}", I've created the following content. ` +
        "I've made sure to include all the key points while maintaining a clear and engaging style.",

      `Here's what I've prepared based on your request for: "${message}"\n\n` +
        "I've organized the information in a logical flow and included relevant details to make it comprehensive.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  editContentResponse(message) {
    const responses = [
      `I've reviewed your content and made some improvements to enhance clarity and flow. ` +
        "Here's the edited version with my suggestions:",

      `After analyzing your content, I've made some refinements to improve readability and impact. ` +
        "The main changes include:",

      "I've edited your content to make it more concise and engaging. Here's the revised version:",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  researchResponse(message) {
    const responses = [
      `Here's what I found in your sources about "${message}":\n\n` +
        "• Key point 1\n• Key point 2\n• Key point 3\n\n" +
        "Would you like me to elaborate on any of these points or search for more specific information?",

      `I've researched "${message}" in your sources. Here are the most relevant findings:\n\n` +
        "• Finding 1\n• Finding 2\n\n" +
        "Would you like me to help you analyze or summarize this information further?",

      `Based on your sources, here's what I discovered about "${message}":\n\n` +
        "• Insight 1\n• Insight 2\n• Insight 3\n\n" +
        "Let me know if you'd like me to explore any aspect in more detail.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  ideasResponse(message) {
    const responses = [
      `Here are some creative ideas based on "${message}":\n\n` +
        "1. Idea 1\n2. Idea 2\n3. Idea 3\n\n" +
        "Would you like me to expand on any of these ideas or generate more options?",

      `Based on your input, here are some potential directions you might consider:\n\n` +
        "• Option 1\n• Option 2\n• Option 3\n\n" +
        "Let me know if you'd like me to develop any of these further.",

      `Here are some thought-starters inspired by "${message}":\n\n` +
        "• Concept 1\n• Concept 2\n• Concept 3\n\n" +
        "Would you like me to elaborate on any of these or generate additional concepts?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  /* Source item hover effect */
  .source-item {
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }
  
  .source-item:hover {
    background-color: rgba(55, 65, 81, 0.5) !important;
    border-color: rgba(96, 165, 250, 0.3);
  }
  
  .source-item.active {
    background-color: rgba(55, 65, 81, 0.8) !important;
    border-color: #60a5fa;
  }
  
  /* Tool button active state */
  .wizard-tool-btn {
    transition: all 0.2s ease;
  }
  
  .wizard-tool-btn.active {
    background-color: #374151;
    color: #60a5fa;
    border-left: 3px solid #60a5fa;
  }
  
  /* Custom scrollbar for wizard content */
  #wizard-content::-webkit-scrollbar {
    width: 6px;
  }
  
  #wizard-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  #wizard-content::-webkit-scrollbar-thumb {
    background-color: #4b5563;
    border-radius: 3px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .wizard-container.mobile-layout {
      flex-direction: column;
      height: auto;
    }
    
    .wizard-sidebar,
    .wizard-main,
    .wizard-sources {
      width: 100% !important;
      margin-bottom: 1rem;
    }
    
    .wizard-sources {
      order: 2;
    }
  }
`;
document.head.appendChild(style);

// Initialize the wizard when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.aiWizard = new AIWizard();

  // Add animation to welcome message
  const welcomeMessage = document.querySelector("#wizard-content .text-center");
  if (welcomeMessage) {
    welcomeMessage.classList.add("animate-fade-in");
  }
});
