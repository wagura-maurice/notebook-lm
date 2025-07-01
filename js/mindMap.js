/*
 * Mind Map Editor
 * A jsMind-based mind mapping component
 */

class MindMap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container element with ID '${containerId}' not found`);
      return;
    }

    this.jm = null;
    this.mindMapInitialized = false;
    this.statusTimeout = null;
    this.statusEl = null;
    this.progressElements = null;

    console.log(`Initializing MindMap with container: ${containerId}`);

    // Initialize the mind map when the modal is shown
    this.initModalObserver();
  }

  /**
   * Initialize the modal observer to detect when the mind map should be shown
   */
  initModalObserver() {
    const modal = document.getElementById("mind-map-modal");
    if (!modal) {
      console.error("Mind map modal not found");
      return;
    }

    // Check if modal is already visible
    if (!modal.classList.contains("hidden") && !this.mindMapInitialized) {
      console.log("Modal is already visible, initializing mind map...");
      this.initialize();
      return;
    }

    // Use MutationObserver to detect when the modal is shown or hidden
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isVisible = !modal.classList.contains("hidden");
          console.log("Modal visibility changed, isVisible:", isVisible);

          if (isVisible) {
            // Always reinitialize when modal becomes visible
            console.log("Modal shown, initializing mind map...");
            this.initialize();
          } else {
            // Clean up when modal is hidden but keep the instance
            console.log("Modal hidden, cleaning up...");
            this.cleanup(true);
          }
        }
      });
    });

    // Start observing the modal for attribute changes
    observer.observe(modal, { attributes: true });
  }

  /**
   * Initialize the mind map
   */
  initialize() {
    console.log("Initializing mind map...");

    // Clear any existing content
    this.container.innerHTML = "";

    // Create main container
    const contentWrapper = document.createElement("div");
    contentWrapper.className = "mind-map-wrapper";
    contentWrapper.style.display = "flex";
    contentWrapper.style.flexDirection = "column";
    contentWrapper.style.height = "100vh";
    contentWrapper.style.overflow = "hidden";
    contentWrapper.style.position = "relative";

    // Create toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "mind-map-toolbar";
    toolbar.style.padding = "8px";
    toolbar.style.backgroundColor = "#1f2937";
    toolbar.style.borderBottom = "1px solid #374151";

    // Add progress indicator
    const progressContainer = document.createElement("div");
    progressContainer.className = "progress-indicator";
    progressContainer.title = "Form completion progress";

    // Create SVG container
    const progressSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    progressSvg.setAttribute("class", "progress-ring");
    progressSvg.setAttribute("width", "36");
    progressSvg.setAttribute("height", "36");
    progressSvg.setAttribute("viewBox", "0 0 36 36");

    // Background circle
    const circleBg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circleBg.setAttribute("class", "progress-ring-circle");
    circleBg.setAttribute("cx", "18");
    circleBg.setAttribute("cy", "18");
    circleBg.setAttribute("r", "15");
    circleBg.setAttribute("stroke-width", "3");

    // Progress circle
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    const radius = 15;
    const circumference = 2 * Math.PI * radius;

    circle.setAttribute("class", "progress-ring-progress");
    circle.setAttribute("cx", "18");
    circle.setAttribute("cy", "18");
    circle.setAttribute("r", radius.toString());
    circle.setAttribute("stroke-width", "3");
    circle.setAttribute(
      "stroke-dasharray",
      `${circumference} ${circumference}`
    );
    circle.setAttribute("stroke-dashoffset", circumference.toString());

    // Add circles to SVG
    progressSvg.appendChild(circleBg);
    progressSvg.appendChild(circle);

    // Add percentage text
    const progressText = document.createElement("div");
    progressText.className = "progress-text";
    progressText.textContent = "0%";

    // Add elements to container
    progressContainer.appendChild(progressSvg);
    progressContainer.appendChild(progressText);

    // Store references for updates
    this.progressElements = {
      container: progressContainer,
      circle: circle,
      text: progressText,
    };

    // Add elements to toolbar
    toolbar.appendChild(progressContainer);

    // Create save button
    const saveButton = document.createElement("button");
    saveButton.className = "save-mindmap";
    saveButton.textContent = "Save Mind Map";
    saveButton.style.marginLeft = "10px";
    saveButton.addEventListener("click", () => this.saveMindMap());
    toolbar.appendChild(saveButton);

    // Create status element
    this.statusEl = document.createElement("div");
    this.statusEl.className = "status-message";
    this.statusEl.style.padding = "4px 8px";
    this.statusEl.style.fontSize = "14px";
    this.statusEl.style.color = "#f3f4f6";
    this.statusEl.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    this.statusEl.style.borderRadius = "4px";
    this.statusEl.style.position = "absolute";
    this.statusEl.style.bottom = "20px";
    this.statusEl.style.left = "50%";
    this.statusEl.style.transform = "translateX(-50%)";
    this.statusEl.style.zIndex = "1000";

    // Create mind map container
    const jsmindContainer = document.createElement("div");
    jsmindContainer.id = "jsmind_container";
    jsmindContainer.style.flex = "1";
    jsmindContainer.style.overflow = "auto";
    jsmindContainer.style.backgroundColor = "#1f2937";

    // Add elements to content wrapper
    contentWrapper.appendChild(toolbar);
    contentWrapper.appendChild(jsmindContainer);
    contentWrapper.appendChild(this.statusEl);

    // Add content wrapper to container
    this.container.style.height = "100vh";
    this.container.style.overflow = "hidden";
    this.container.appendChild(contentWrapper);

    // Store progress elements for updates
    this.progressElements = {
      container: progressContainer,
      circle: circle, // Using the circle variable we created earlier
      text: progressText,
    };

    // Initialize jsMind
    const initSuccess = this.initJsMind();

    if (initSuccess !== false) {
      this.mindMapInitialized = true;
      console.log("Mind map initialized");

      // Trigger a resize after a short delay to ensure proper rendering
      setTimeout(() => {
        if (this.jm && typeof this.jm.resize === "function") {
          this.jm.resize();
        }
      }, 100);
    }
  }

  /**
   * Initialize jsMind
   */
  initJsMind() {
    console.log("Initializing jsMind...");

    if (!window.jsMind) {
      const errorMsg =
        "Error: jsMind library not found. Please make sure the jsMind scripts are loaded correctly.";
      console.error(errorMsg);
      this.showError(errorMsg);
      return false;
    }

    try {
      // Initialize jsMind with options
      const options = {
        container: "jsmind_container",
        theme: "primary",
        editable: true,
        mode: "full",
        view: {
          line_width: 2,
          line_color: "#555",
          node_text_vertical_padding: 8,
          node_text_horizontal_padding: 12,
          node_radius: 6,
          hmargin: 50,
          vmargin: 30,
          line_style: "curve",
        },
        onerror: (err) => {
          console.error("jsMind error:", err);
          this.showError("Mind map error: " + (err.message || "Unknown error"));
        },
      };

      console.log("jsMind options configured");

      // Initialize jsMind
      this.jm = new jsMind(options);
      console.log("jsMind instance created");

      // Load default mind map data
      const mindData = this.getDefaultMindData();
      this.jm.show(mindData);

      // Set up event handlers
      this.setupNodeHandlers();
      this.applyCustomStyles();

      // Initialize progress indicator
      this.updateProgressIndicator();

      // Update progress after any changes
      this.jm.add_event_listener("edit_finish", () => {
        this.updateProgressIndicator();
      });

      return true;
    } catch (error) {
      console.error("Error initializing jsMind:", error);
      this.showError(
        "Failed to initialize mind map: " + (error.message || "Unknown error")
      );
      return false;
    }
  }

  /**
   * Get default mind map data
   */
  getDefaultMindData() {
    return {
      meta: {
        name: "ALMPs",
        author: "Peter Thirikwa",
        version: "1.0",
      },
      format: "node_array",
      data: [
        {
          id: "root",
          topic: "Information Assessment and Management",
          isroot: true,
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "reliability",
          topic: "Assessing Reliability & Credibility?",
          parentid: "root",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "grey-lit",
          topic: "Grey Literature?",
          parentid: "reliability",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "archival",
          topic: "Archival Research?",
          parentid: "reliability",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "think-tanks",
          topic: "Think Tanks?",
          parentid: "reliability",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "push-protocol",
          topic: "Push Protocol (2KTeco Devices)?",
          parentid: "reliability",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "icea",
          topic: "ICEA LION Financial Services?",
          parentid: "reliability",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "kingo",
          topic: "Kingo Edwin Rwaro (Clinical Professional)?",
          parentid: "reliability",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "invoices",
          topic: "Invoices?",
          parentid: "reliability",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "national-switch",
          topic: "National Switch and Micro Finance Transaction Hub Upgrade?",
          parentid: "reliability",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "publication",
          topic: "Publication Types?",
          parentid: "root",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "orgs",
          topic: "Producing Organizations?",
          parentid: "publication",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "challenges",
          topic: "Challenges (Problems)?",
          parentid: "publication",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "impact",
          topic: "Impact/Importance?",
          parentid: "publication",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "access",
          topic: "Accessibility?",
          parentid: "publication",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "dbs",
          topic: "Databases/Resources?",
          parentid: "publication",
          direction: "right",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
        },
        {
          id: "psc-form",
          topic: "Public Service Commission Application Form?",
          parentid: "root",
          direction: "right",
          priority: "high",
          /* metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          }, */
        },
      ],
    };
  }

  /**
   * Handles the continue action from node click
   * @param {Object} node - The node data
   * @param {Object} metadata - The node's metadata
   */
  handleNodeContinue(node, metadata) {
    console.log("Node Continue Clicked:", {
      topic: node.topic,
      answer: metadata.answer,
    });

    // Close SweetAlert dialog if open
    if (window.Swal && Swal.isVisible()) {
      Swal.close();
    }

    // Close the mind map modal if we're in the collection page
    const mindMapModal = document.getElementById("mind-map-modal");
    if (mindMapModal) {
      mindMapModal.classList.add("hidden");
    }

    // Format the message
    const message = `Topic: ${node.topic}\n\n Answer: ${
      metadata.answer || "No additional information available"
    }`;

    // Try to find the chat input and trigger send message
    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
      // Set the message in the chat input
      chatInput.value = message;

      // Trigger input event to update any listeners
      const inputEvent = new Event("input", { bubbles: true });
      chatInput.dispatchEvent(inputEvent);

      // Try to trigger the send message functionality
      try {
        // Try jQuery first (if available)
        if (window.$) {
          const $chatInput = $(chatInput);
          // Set the value using jQuery to ensure proper event handling
          $chatInput.val(message).trigger("input");

          // Try to find and click the send button
          const $sendButton = $(".send-message-button, #send-message");
          if ($sendButton.length) {
            $sendButton.trigger("click");
          } else {
            // If no send button found, trigger Enter key on the input
            const enterEvent = new KeyboardEvent("keydown", {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true,
            });
            chatInput.dispatchEvent(enterEvent);
          }
        } else {
          // Fallback to native events if jQuery is not available
          const enterEvent = new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          });
          chatInput.dispatchEvent(enterEvent);
        }
      } catch (error) {
        console.error("Error triggering send message:", error);
      }
    }
  }

  /**
   * Handles click events on mind map nodes
   * @param {Event} event - The click event
   */
  handleNodeClick(event) {
    // Find the closest jmnode element
    const nodeElement = event.target.closest("jmnode");
    if (!nodeElement) return;

    // Get the node ID from the element
    const nodeId = nodeElement.getAttribute("nodeid");
    if (!nodeId) return;

    // Get the node data
    try {
      const node = this.jm.get_node(nodeId);

      // First, log the basic node info
      console.log("Node basic info:", {
        id: nodeId,
        hasNode: !!node,
        nodeType: node ? typeof node : "null",
      });

      if (node) {
        // Log available properties
        console.log("Available node properties:", Object.keys(node));

        // Check for metadata in different possible locations
        const possibleMetadata = {
          "node.metadata": node.metadata,
          "node.data.metadata": node.data?.metadata,
          "node.data": node.data,
          "node._data": node._data,
          "node._node_data": node._node_data,
        };

        console.log("Checking for metadata in:", Object.keys(possibleMetadata));

        // Find the first non-undefined metadata-like object
        const [foundIn, metadata] =
          Object.entries(possibleMetadata).find(([_, value]) => value) || [];

        if (metadata) {
          console.log(`Found metadata in ${foundIn}:`, metadata);
          console.log("Metadata keys:", Object.keys(metadata));

          // Try to find an answer or content
          const answer =
            metadata.answer ||
            metadata.content ||
            metadata.text ||
            metadata.desc;
          console.log("Possible answer/content:", answer);

          if (answer) {
            // Format answer with HTML if we have content
            const nodeTextLines = answer
              .split(".")
              .filter((line) => line.trim() !== "")
              .map((line) => `<p style="text-align: left">${line}.</p>`)
              .join("");

            Swal.fire({
              title: node.topic || "Node",
              html: nodeTextLines,
              icon: "success",
              showCloseButton: true,
              showCancelButton: true,
              confirmButtonText: "Continue",
              preConfirm: () => {
                this.handleNodeContinue(node, metadata);
                return false; // Prevent the modal from closing automatically
              },
            }).then((result) => {
              if (result.isConfirmed) {
                this.handleNodeContinue(node, metadata);
              }
            });
          } else {
            // Use plain text for the default message
            Swal.fire({
              title: node.topic || "Node",
              text: "No additional information available",
              icon: "info",
              showCloseButton: true,
              showCancelButton: true,
              confirmButtonText: "Continue",
              preConfirm: () => {
                this.handleNodeContinue(node, metadata);
                return false; // Prevent the modal from closing automatically
              },
            }).then((result) => {
              if (result.isConfirmed) {
                this.handleNodeContinue(node, metadata);
              }
            });
          }

          return; // Exit after showing the alert
        } else {
          // console.log("No metadata found in any expected location");
          Swal.fire({
            title: node.topic,
            text: "No metadata found in any expected location",
            icon: "info",
            showCloseButton: true,
            showCancelButton: true,
            // confirmButtonText: "Continue",
          });
        }
      }
    } catch (error) {
      console.error("Error handling node click:", error);
    }

    // Prevent default behavior
    event.stopPropagation();
  }

  /**
   * Set up node event handlers
   */
  setupNodeHandlers() {
    if (!this.jm) return;

    // Add click event listener using event delegation
    const mindMapContainer = document.getElementById("jsmind_container");
    if (mindMapContainer) {
      mindMapContainer.addEventListener("click", (e) =>
        this.handleNodeClick(e)
      );
      console.log("Added click event listener to mind map container");
    } else {
      console.error("Could not find mind map container for click events");
    }

    // Keep the existing event handlers for compatibility
    this.jm.view.add_event(this.jm, "select_node", (node) => {
      console.log("Node selected:", node);
    });

    this.jm.view.add_event(this.jm, "edit_begin", () => {
      console.log("Node edit started");
    });

    this.jm.view.add_event(this.jm, "edit_end", () => {
      console.log("Node edit ended");
      // Save changes or update UI
    });
  }

  /**
   * Apply custom styles to the mind map
   */
  applyCustomStyles() {
    if (!this.jm) return;

    // Add custom CSS classes to nodes
    const theme = this.jm.theme;
    if (theme && theme.node) {
      // Customize node appearance
      theme.node.css = Object.assign({}, theme.node.css, {
        background: "#3b82f6",
        color: "#ffffff",
        "border-radius": "4px",
        padding: "6px 12px",
        "box-shadow": "0 2px 4px rgba(0,0,0,0.1)",
      });

      // Apply the updated theme
      this.jm.setTheme(theme.name);
    }
  }

  /**
   * Save the current mind map
   */
  saveMindMap() {
    if (!this.jm) {
      this.showError("Mind map not initialized");
      return;
    }

    try {
      const mindData = this.jm.get_data("node_array");
      console.log("Saving mind map data:", mindData);

      // Here you would typically send the data to your server
      // For now, we'll just show a success message
      this.showStatus("Mind map saved successfully!");

      // You can also download the data as a file
      this.downloadAsFile(mindData, "mindmap.json");
    } catch (error) {
      console.error("Error saving mind map:", error);
      this.showError(
        "Failed to save mind map: " + (error.message || "Unknown error")
      );
    }
  }

  /**
   * Download data as a file
   */
  downloadAsFile(data, filename) {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  /**
   * Show status message
   */
  showStatus(message, isError = false) {
    if (!this.statusEl) return;

    // Clear any existing timeout
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }

    // Update status message
    this.statusEl.textContent = message;
    this.statusEl.style.display = "block";
    this.statusEl.style.backgroundColor = isError
      ? "rgba(220, 38, 38, 0.9)"
      : "rgba(0, 0, 0, 0.7)";

    // Hide after delay
    this.statusTimeout = setTimeout(() => {
      this.statusEl.style.display = "none";
    }, 3000);
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error(message);
    this.showStatus(message, true);
  }

  /**
   * Update the progress indicator based on answered questions
   */
  updateProgressIndicator() {
    if (!this.jm) return;

    // Get all nodes
    const mindData = this.jm.get_data("node_array");
    if (!mindData?.data?.length) return;

    const nodes = mindData.data;

    // Find all leaf nodes (nodes that are not parents of any other node)
    const parentIds = new Set();
    nodes.forEach((node) => {
      if (node.parentid) {
        parentIds.add(node.parentid);
      }
    });

    const leafNodes = nodes.filter((node) => {
      // A node is a leaf if it's not a parent of any other node
      return !parentIds.has(node.id);
    });

    if (leafNodes.length === 0) return;

    // Count how many leaf nodes have answers
    const answeredCount = leafNodes.filter((node) => {
      // Check if node has metadata with answer or any other answer field
      return node.metadata?.answer ||
        node.data?.metadata?.answer ||
        node._data?.answer ||
        node.answer
        ? true
        : false;
    }).length;

    // Calculate percentage
    const percentage = Math.round((answeredCount / leafNodes.length) * 100);

    // Get the progress elements
    const progressCircle = this.progressElements?.circle;
    const progressText = this.progressElements?.text;

    if (!progressCircle || !progressText) return;

    // Update progress text
    progressText.textContent = `${percentage}%`;

    // Calculate the circle's circumference and offset
    const radius = 15; // Must match the radius used in circle creation
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    // Update circle progress
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = offset;

    // Set color based on percentage
    let color;
    if (percentage <= 10) {
      color = "#ef4444"; // Red
    } else if (percentage <= 30) {
      color = "#f97316"; // Orange
    } else if (percentage <= 60) {
      color = "#eab308"; // Yellow
    } else if (percentage <= 90) {
      color = "#22c55e"; // Light Green
    } else {
      color = "#16a34a"; // Dark Green
    }

    progressCircle.style.stroke = color;

    // Update the title with emoji indicator
    const indicator =
      percentage <= 10
        ? "🔴"
        : percentage <= 30
        ? "🟠"
        : percentage <= 60
        ? "🟡"
        : "🟢";

    this.progressElements.container.title = `Form completion progress: ${percentage}% ${indicator}`;
  }

  /**
   * Clean up resources
   */
  cleanup(preserveState = false) {
    console.log("Cleaning up mind map resources...");

    // Clear any pending timeouts
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
      this.statusTimeout = null;
    }

    // Reset the mind map instance if needed
    if (!preserveState && this.jm) {
      try {
        this.jm.destroy();
      } catch (e) {
        console.error("Error destroying jsMind instance:", e);
      }
      this.jm = null;
    }

    // Clear the container
    if (this.container) {
      this.container.innerHTML = "";
    }

    // Reset state
    this.mindMapInitialized = false;
    this.statusEl = null;
    this.progressElements = null;

    console.log("Cleanup complete");
  }
}

// Initialize the mind map when the DOM is fully loaded
function initializeMindMap() {
  console.log("Initializing mind map...");

  // Check if jsMind is available
  if (!window.jsMind) {
    console.error(
      "jsMind library not found. Please include the required scripts."
    );
    return;
  }

  // Create and initialize the mind map
  const containerId = "mind-map-content";
  const mindMap = new MindMap(containerId);

  // Make it globally available for debugging
  window.mindMap = mindMap;

  return mindMap;
}

// Check if DOM is already loaded
if (document.readyState === "loading") {
  console.log("Waiting for DOM to load...");
  document.addEventListener("DOMContentLoaded", initializeMindMap);
} else {
  console.log("DOM already loaded, initializing mind map...");
  // Small timeout to ensure other scripts have loaded
  setTimeout(initializeMindMap, 100);
}

// Export for debugging
window.debugMindMap = () => {
  console.log("Debugging mind map...");
  const container = document.getElementById("mind-map-content");
  console.log("Container:", container);
  console.log("jsMind:", window.jsMind);
  return {
    container,
    jsMind: window.jsMind,
    mindMap: window.mindMap,
  };
};
