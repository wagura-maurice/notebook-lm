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

    console.log(`Initializing MindMap with container: ${containerId}`);

    // Initialize the mind map when the modal is shown
    this.initModalObserver();
  }

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
            console.log("Modal hidden, cleaning up resources...");
            this.cleanup(true); // Preserve state
          }
        }
      });
    });

    // Start observing the modal for class changes
    observer.observe(modal, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Store the observer for cleanup
    this.modalObserver = observer;
  }

  // Setup click handlers for node expand/collapse
  setupNodeHandlers() {
    if (!this.jm) return;

    // Handle node clicks to toggle expand/collapse
    document.addEventListener("click", (e) => {
      const expander = e.target.closest("jmexpander");
      if (!expander) return;

      const nodeElement = expander.closest("jmnode");
      if (!nodeElement) return;

      const nodeId = nodeElement.getAttribute("nodeid");
      if (!nodeId) return;

      // Toggle the expanded state
      const node = this.jm.get_node(nodeId);
      if (node) {
        this.jm.toggle_node(nodeId);
        // The toggle will trigger the event handlers we set up below
      }
    });

    // Listen for expand/collapse events to update the UI
    this.jm.add_event_listener("expand_node", (e) => {
      const nodeId = e.node;
      if (nodeId) {
        const nodeElement = document.querySelector(
          `jmnode[nodeid="${nodeId}"]`
        );
        if (nodeElement) {
          nodeElement.classList.add("expanded");
          this.updateChevron(nodeId, true);
        }
      }
    });

    this.jm.add_event_listener("collapse_node", (e) => {
      const nodeId = e.node;
      if (nodeId) {
        const nodeElement = document.querySelector(
          `jmnode[nodeid="${nodeId}"]`
        );
        if (nodeElement) {
          nodeElement.classList.remove("expanded");
          this.updateChevron(nodeId, false);
        }
      }
    });
  }

  // Add Font Awesome chevron to a node
  addChevronToNode(nodeId) {
    if (!this.jm) return;

    const node = this.jm.get_node(nodeId);
    if (!node || !node.children || node.children.length === 0) return;

    const nodeElement = document.querySelector(`[nodeid="${nodeId}"]`);
    if (!nodeElement) return;

    // Set initial state
    this.updateChevron(nodeId, node.expanded);

    // Ensure the node has the haschild attribute for CSS targeting
    nodeElement.setAttribute("haschild", "true");
  }

  // Update chevron icon based on node state
  updateChevron(nodeId, isExpanded) {
    const nodeElement = document.querySelector(`[nodeid="${nodeId}"]`);
    if (!nodeElement) return;

    const expander = nodeElement.querySelector("jmexpander");
    if (!expander) return;

    // Update the expanded class on the node
    if (isExpanded) {
      nodeElement.classList.add("expanded");
    } else {
      nodeElement.classList.remove("expanded");
    }
  }

  // Clean up resources when the mind map is no longer needed
  cleanup(preserveState = false) {
    console.log("Cleaning up mind map resources...");

    // Clear any existing status timeout
    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
      this.statusTimeout = null;
    }

    // Don't clean up the observer or container if we're just refreshing
    if (!preserveState) {
      // Clear the container but keep the structure
      if (this.container) {
        // Instead of clearing the entire container, just hide it
        this.container.style.display = "none";
      }
    }

    // Clean up the mind map instance
    if (this.jm) {
      try {
        // Don't reset the data if we're just refreshing
        if (!preserveState && typeof this.jm.show === "function") {
          this.jm.show({
            meta: {},
            format: "node_tree",
            data: { id: "root", topic: "New Mind Map" },
          });
        }

        // Don't destroy the instance completely, just clean up event listeners
        if (this.jm.view) {
          if (typeof this.jm.view.remove_event_listener === "function") {
            this.jm.view.remove_event_listener();
          }
        }
      } catch (e) {
        console.error("Error cleaning up jsMind instance:", e);
      } finally {
        if (!preserveState) {
          // Don't set jm to null, just mark as not initialized
          this.mindMapInitialized = false;
        }
      }
    }

    console.log("Mind map cleanup complete");
  }

  initialize() {
    console.log("Initializing mind map...");

    // Make sure container is visible
    if (this.container) {
      this.container.style.display = "flex";
    }

    // If already initialized, just refresh the display
    if (this.mindMapInitialized && this.jm) {
      console.log("Mind map already initialized, refreshing display...");
      try {
        // Just refresh the display
        setTimeout(() => {
          if (this.jm) {
            if (typeof this.jm.resize === "function") {
              this.jm.resize();
            }
            if (typeof this.jm.refresh === "function") {
              this.jm.refresh();
            }
          }
        }, 100);
        return;
      } catch (error) {
        console.error("Error refreshing mind map:", error);
        this.showError(
          "Error refreshing mind map: " + (error.message || "Unknown error")
        );
      }
      return;
    }

    try {
      // Set up the container
      this.container.innerHTML = "";
      this.setupMindMapContainer();
    } catch (error) {
      console.error("Error setting up mind map container:", error);
      this.showError("Error setting up mind map container: " + error.message);
      return;
    }

    try {
      // Create a loading indicator
      const loadingDiv = document.createElement("div");
      loadingDiv.style.display = "flex";
      loadingDiv.style.flexDirection = "column";
      loadingDiv.style.alignItems = "center";
      loadingDiv.style.justifyContent = "center";
      loadingDiv.style.height = "100%";
      loadingDiv.style.color = "#f3f4f6";
      loadingDiv.innerHTML = `
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading mind map editor...</p>
      `;
      this.container.appendChild(loadingDiv);

      // Small delay to ensure UI is updated before heavy initialization
      setTimeout(() => {
        try {
          // Clear loading indicator
          this.container.innerHTML = "";

          // Create a wrapper for the mind map content
          const contentWrapper = document.createElement("div");
          contentWrapper.style.display = "flex";
          contentWrapper.style.flexDirection = "column";
          contentWrapper.style.height = "100%";
          contentWrapper.style.width = "100%";
          contentWrapper.style.position = "relative";

          // Create the jsMind container
          const jsmindContainer = document.createElement("div");
          jsmindContainer.id = "jsmind_container";
          jsmindContainer.style.flex = "1";
          jsmindContainer.style.position = "relative";
          jsmindContainer.style.overflow = "auto";
          jsmindContainer.style.backgroundColor = "#1f2937"; // Match the dark theme

          // Create a toolbar
          const toolbar = document.createElement("div");
          toolbar.className = "mind-map-toolbar";
          toolbar.style.padding = "8px";
          toolbar.style.backgroundColor = "#1f2937";
          toolbar.style.borderBottom = "1px solid #374151";

          // Add buttons
          const saveBtn = this.createButton("Save", () => this.saveMindMap());
          const closeBtn = this.createButton("Close", () => {
            document.getElementById("mind-map-modal").classList.add("hidden");
          });

          toolbar.appendChild(saveBtn);
          toolbar.appendChild(closeBtn);

          // Status element
          this.statusEl = document.createElement("div");
          this.statusEl.className = "mind-map-status";
          this.statusEl.style.padding = "4px 8px";
          this.statusEl.style.fontSize = "14px";
          this.statusEl.style.color = "#f3f4f6";
          this.statusEl.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
          this.statusEl.style.borderRadius = "4px";
          this.statusEl.style.position = "absolute";
          this.statusEl.style.bottom = "20px";
          this.statusEl.style.left = "20px";
          this.statusEl.style.zIndex = "10";
          this.statusEl.style.left = "50%";
          this.statusEl.style.transform = "translateX(-50%)";
          this.statusEl.style.zIndex = "1000";

          // Set up content wrapper
          contentWrapper.style.display = "flex";
          contentWrapper.style.flexDirection = "column";
          contentWrapper.style.height = "100vh";
          contentWrapper.style.overflow = "hidden";
          contentWrapper.style.position = "relative";

          // Add elements to the container
          contentWrapper.appendChild(toolbar);
          contentWrapper.appendChild(jsmindContainer);
          contentWrapper.appendChild(this.statusEl);

          // Ensure container takes full height
          this.container.style.height = "100vh";
          this.container.style.overflow = "hidden";
          this.container.appendChild(contentWrapper);

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
        } catch (error) {
          console.error("Error during mind map initialization:", error);
          this.showError("Failed to initialize mind map: " + error.message);
        }
      }, 100);
    } catch (error) {
      console.error("Error initializing mind map:", error);
      this.showError("Error initializing mind map: " + error.message);
    }
  }

  createButton(text, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.style.padding = "6px 12px";
    btn.style.background = "#374151";
    btn.style.border = "1px solid #4b5563";
    btn.style.borderRadius = "4px";
    btn.style.color = "#f3f4f6";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "13px";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.gap = "4px";
    btn.addEventListener("mouseover", () => {
      btn.style.background = "#4b5563";
      btn.style.borderColor = "#6b7280";
    });
    btn.addEventListener("mouseout", () => {
      btn.style.background = "#374151";
      btn.style.borderColor = "#4b5563";
    });
    btn.addEventListener("click", onClick);
    return btn;
  }

  // Set up the mind map container
  setupMindMapContainer() {
    // Create a wrapper for the mind map content
    const contentWrapper = document.createElement("div");
    contentWrapper.id = "mind-map-content";
    contentWrapper.style.display = "flex";
    contentWrapper.style.flexDirection = "column";
    contentWrapper.style.height = "100vh";
    contentWrapper.style.width = "100%";
    contentWrapper.style.position = "relative";
    contentWrapper.style.overflow = "auto"; // Changed from hidden to auto

    // Create the jsMind container
    const jsmindContainer = document.createElement("div");
    jsmindContainer.id = "jsmind_container";
    jsmindContainer.style.minWidth = "100%";
    jsmindContainer.style.minHeight = "100vh";
    jsmindContainer.style.position = "relative";
    jsmindContainer.style.display = "inline-block";
    jsmindContainer.style.whiteSpace = "nowrap";
    jsmindContainer.style.padding = "40px";
    jsmindContainer.style.backgroundColor = "#1f2937"; // Match the dark theme

    // Create a toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "mind-map-toolbar";
    toolbar.style.padding = "8px";
    toolbar.style.backgroundColor = "#1f2937";
    toolbar.style.borderBottom = "1px solid #374151";

    // Add buttons
    const saveBtn = this.createButton("Save", () => this.saveMindMap());
    const closeBtn = this.createButton("Close", () => {
      document.getElementById("mind-map-modal").classList.add("hidden");
    });

    toolbar.appendChild(saveBtn);
    toolbar.appendChild(closeBtn);

    // Status element
    this.statusEl = document.createElement("div");
    this.statusEl.className = "mind-map-status";
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

    // Add elements to the container
    contentWrapper.appendChild(toolbar);
    contentWrapper.appendChild(jsmindContainer);
    contentWrapper.appendChild(this.statusEl);

    // Clear and set up the container
    this.container.innerHTML = "";
    this.container.style.height = "100vh";
    this.container.style.overflow = "hidden";
    this.container.appendChild(contentWrapper);
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
      console.log('Node basic info:', {
        id: nodeId,
        hasNode: !!node,
        nodeType: node ? typeof node : 'null'
      });
      
      if (node) {
        // Log available properties
        console.log('Available node properties:', Object.keys(node));
        
        // Check for metadata in different possible locations
        const possibleMetadata = {
          'node.metadata': node.metadata,
          'node.data.metadata': node.data?.metadata,
          'node.data': node.data,
          'node._data': node._data,
          'node._node_data': node._node_data
        };
        
        console.log('Checking for metadata in:', Object.keys(possibleMetadata));
        
        // Find the first non-undefined metadata-like object
        const [foundIn, metadata] = Object.entries(possibleMetadata).find(([_, value]) => value) || [];
        
        if (metadata) {
          console.log(`Found metadata in ${foundIn}:`, metadata);
          console.log('Metadata keys:', Object.keys(metadata));
          
          // Try to find an answer or content
          const answer = metadata.answer || metadata.content || metadata.text || metadata.desc;
          console.log('Possible answer/content:', answer);
          
          // Update the node text with whatever we found
          const nodeText = answer || 'No additional information available';
          
          Swal.fire({
            title: node.topic || 'Node',
            text: nodeText,
            icon: 'info',
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'OK',
          });
          
          return; // Exit after showing the alert
        } else {
          console.log('No metadata found in any expected location');
        }
      }
      
      if (node && node.topic) {
        // Show an alert with the node's text
        const nodeText =
          node.metadata && node.metadata.answer !== undefined
            ? node.metadata.answer
            : "No additional information available";

        Swal.fire({
          title: node.topic,
          text: nodeText,
          icon: "info",
          showCloseButton: true,
          showCancelButton: true,
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error handling node click:", error);
    }

    // Prevent default behavior
    event.stopPropagation();
  }

  initJsMind() {
    console.log("Initializing jsMind...");

    if (!window.jsMind) {
      const errorMsg =
        "Error: jsMind library not found. Please make sure the jsMind scripts are loaded correctly.";
      console.error(errorMsg);

      // Show a more visible error message
      const errorDiv = document.createElement("div");
      errorDiv.style.padding = "20px";
      errorDiv.style.color = "#ef4444";
      errorDiv.style.backgroundColor = "#fee2e2";
      errorDiv.style.border = "1px solid #fca5a5";
      errorDiv.style.borderRadius = "4px";
      errorDiv.style.margin = "20px";
      errorDiv.style.maxWidth = "500px";
      errorDiv.innerHTML = `
        <h3 style="margin-top: 0; color: #b91c1c;">Mind Map Error</h3>
        <p>${errorMsg}</p>
        <p>If the problem persists, please refresh the page and try again.</p>
        <button onclick="window.location.reload()" 
                style="margin-top: 10px; padding: 8px 16px; 
                       background: #ef4444; color: white; 
                       border: none; border-radius: 4px; 
                       cursor: pointer;">
          Refresh Page
        </button>
      `;

      // Clear the container and show error
      this.container.innerHTML = "";
      this.container.appendChild(errorDiv);

      this.updateStatus(errorMsg, true);
      return false;
    }

    console.log("jsMind library loaded successfully:", window.jsMind);

    try {
      // Ensure the container exists and is visible
      const container = document.getElementById("jsmind_container");
      if (!container) {
        throw new Error(
          'Mind map container with ID "jsmind_container" not found'
        );
      }

      // Set container styles
      container.style.width = "100%";
      container.style.flex = "1";
      container.style.position = "relative";
      container.style.overflow = "auto";
      container.style.minHeight = "0";
      container.style.backgroundColor = "#1f2937";

      console.log("Container styles applied");

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
        // Add more robust error handling
        onerror: (err) => {
          console.error("jsMind error:", err);
          this.updateStatus(
            "Mind map error: " + (err.message || "Unknown error"),
            true
          );
        },
      };

      console.log("jsMind options configured");

      console.log("jsMind options:", options);

      // Create a simple mind map structure with the exact format jsMind expects
      const mindData = {
        meta: {
          name: "Information Assessment and Management",
          author: "Peter Thirikwa",
          version: "1.0",
        },
        format: "node_tree",
        data: {
          id: "root",
          topic: "Information Assessment and Management",
          priority: "high",
          metadata: {
            answer:
              "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
            createdAt: "2025-06-30",
          },
          children: [
            {
              id: "reliability",
              topic: "Assessing Reliability & Credibility",
              priority: "high",
              metadata: {
                answer:
                  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                createdAt: "2025-06-30",
              },
              direction: "right",
              children: [
                {
                  id: "grey-lit",
                  topic: "Grey Literature",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
                {
                  id: "archival",
                  topic: "Archival Research",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
                {
                  id: "think-tanks",
                  topic: "Think Tanks",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
                {
                  id: "push-protocol",
                  topic: "Push Protocol (2KTeco Devices)",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
                {
                  id: "icea",
                  topic: "ICEA LION Financial Services",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
                {
                  id: "kingo",
                  topic: "Kingo Edwin Rwaro (Clinical Professional)",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
                {
                  id: "invoices",
                  topic: "Invoices",
                  direction: "right",
                  children: [],
                },
                {
                  id: "national-switch",
                  topic:
                    "National Switch and Micro Finance Transaction Hub Upgrade",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
              ],
            },
            {
              id: "publication",
              topic: "Publication Types",
              priority: "high",
              metadata: {
                answer:
                  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                createdAt: "2025-06-30",
              },
              direction: "right",
              children: [
                {
                  id: "orgs",
                  topic: "Producing Organizations",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
                {
                  id: "challenges",
                  topic: "Challenges (Problems)",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
                {
                  id: "impact",
                  topic: "Impact/Importance",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
                {
                  id: "access",
                  topic: "Accessibility",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
                {
                  id: "dbs",
                  topic: "Databases/Resources",
                  priority: "high",
                  metadata: {
                    answer:
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                    createdAt: "2025-06-30",
                  },
                  direction: "right",
                  children: [],
                },
              ],
            },
            {
              id: "psc-form",
              topic: "Public Service Commission Application Form",
              priority: "high",
              metadata: {
                answer:
                  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                createdAt: "2025-06-30",
              },
              direction: "right",
              children: [],
            },
          ],
        },
      };

      console.log("Mind map data prepared:", mindData);

      // Initialize jsMind
      console.log("Creating new jsMind instance...");
      this.jm = new jsMind(options);
      console.log("jsMind instance created:", this.jm);

      // Show the mind map with the initial data
      console.log("Showing mind map with data...");
      this.jm.show(mindData);
      console.log("Mind map shown successfully");

      // Make all nodes collapsible and add Font Awesome chevrons
      const nodes = this.jm.mind.nodes;
      for (const nodeId in nodes) {
        if (nodes.hasOwnProperty(nodeId)) {
          const node = nodes[nodeId];
          if (node.children && node.children.length > 0) {
            // Set node as expandable
            node.expand = true;
            // Collapse all nodes except the root by default
            if (nodeId !== "root") {
              this.jm.collapse_node(nodeId);
            }

            // Add Font Awesome chevron
            this.addChevronToNode(nodeId);
          }
        }
      }

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

      // Store the mind map instance for debugging
      window.jm = this.jm;

      // Mark as initialized
      this.mindMapInitialized = true;
      this.updateStatus("Mind map ready");

      // Add event listeners for node clicks
      this.setupNodeHandlers();

      // Apply custom styles after a short delay to ensure the DOM is ready
      setTimeout(() => {
        this.applyCustomStyles();
      }, 100);

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
   * Applies custom styles to the mind map elements
   */
  applyCustomStyles() {
    // Add custom styles for nodes
    const style = document.createElement("style");
    style.textContent = `
      /* Custom node styles */
      jmnode {
        border-radius: 6px;
        transition: all 0.2s ease;
      }
      
      jmnode:hover {
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
      }
      
      /* Selected node */
      jmnode.selected {
        background-color: rgba(59, 130, 246, 0.1);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.8);
      }
      
      /* Node content */
      jmnodes jmcate, jmnode jmnode-title {
        color: #f3f4f6;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      
      /* Expander styles */
      jmexpander {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      }
      
      jmexpander:hover {
        color: #3b82f6;
      }
      
      /* Root node specific styles */
      jmnode.root-node {
        background-color: #1e40af;
      }
      
      jmnode.root-node jmnode-title {
        color: white;
        font-weight: 600;
      }
      
      /* Connection lines */
      jmnode:not(.root-node) > jmnode-line {
        stroke: #4b5563;
        stroke-width: 2px;
      }
    `;

    document.head.appendChild(style);

    // Add root node class if not already present
    const rootNode = this.jm?.mind?.root;
    if (rootNode) {
      const rootElement = document.querySelector(`[nodeid="${rootNode.id}"]`);
      if (rootElement) {
        rootElement.classList.add("root-node");
      }
    }
  }

  saveMindMap() {
    if (!this.jm) {
      this.updateStatus("Mind map not initialized", true);
      return;
    }

    try {
      const mindData = this.jm.get_data("node_array");
      const blob = new Blob([JSON.stringify(mindData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `mindmap-${new Date().toISOString().split("T")[0]}.jm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.updateStatus("Mind map saved");
    } catch (error) {
      console.error("Error saving mind map:", error);
      this.updateStatus("Error saving mind map: " + error.message, true);
    }
  }

  showError(message) {
    if (!this.container) return;

    const errorDiv = document.createElement("div");
    errorDiv.style.padding = "20px";
    errorDiv.style.color = "#ef4444";
    errorDiv.style.backgroundColor = "#fee2e2";
    errorDiv.style.border = "1px solid #fca5a5";
    errorDiv.style.borderRadius = "4px";
    errorDiv.style.margin = "20px";
    errorDiv.style.maxWidth = "500px";
    errorDiv.innerHTML = `
      <h3 style="margin-top: 0; color: #b91c1c;">Error</h3>
      <p>${message}</p>
      <p>Please try refreshing the page or contact support if the problem persists.</p>
      <button onclick="window.location.reload()" 
              style="margin-top: 10px; padding: 8px 16px; 
                     background: #ef4444; color: white; 
                     border: none; border-radius: 4px; 
                     cursor: pointer;">
        Refresh Page
      </button>
    `;

    this.container.innerHTML = "";
    this.container.appendChild(errorDiv);

    if (this.statusEl) {
      this.statusEl.textContent = message;
      this.statusEl.style.color = "#ef4444";
    }
  }

  updateStatus(message, isError = false) {
    if (!this.statusEl) return;

    this.statusEl.textContent = message;
    this.statusEl.style.color = isError ? "#ef4444" : "#f3f4f6";

    // Auto-hide success messages after 3 seconds
    if (!isError) {
      clearTimeout(this.statusTimeout);
      this.statusTimeout = setTimeout(() => {
        if (this.statusEl) this.statusEl.textContent = "";
      }, 3000);
    }
  }
}

// Initialize when DOM is fully loaded
function initializeMindMap() {
  console.log("Initializing mind map...");

  // Check if jsMind is loaded
  if (!window.jsMind) {
    console.error("jsMind not found. Make sure it is loaded before mindMap.js");
    const container = document.getElementById("mind-map-content");
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; color: #b91c1c; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 4px; margin: 20px; max-width: 500px;">
          <h3 style="margin-top: 0;">Mind Map Error</h3>
          <p>Failed to load the mind map editor. The required jsMind library is not available.</p>
          <p>Please refresh the page to try again.</p>
          <button onclick="window.location.reload()" 
                  style="margin-top: 10px; padding: 8px 16px; 
                         background: #ef4444; color: white; 
                         border: none; border-radius: 4px; 
                         cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
    return;
  }

  try {
    const mindMap = new MindMap("mind-map-content");
    window.mindMap = mindMap; // Expose for debugging
  } catch (error) {
    console.error("Failed to initialize mind map:", error);
    const container = document.getElementById("mind-map-content");
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; color: #b91c1c; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 4px; margin: 20px; max-width: 500px;">
          <h3 style="margin-top: 0;">Mind Map Error</h3>
          <p>Failed to initialize mind map: ${error.message}</p>
          <p>Please refresh the page to try again.</p>
          <button onclick="window.location.reload()" 
                  style="margin-top: 10px; padding: 8px 16px; 
                         background: #ef4444; color: white; 
                         border: none; border-radius: 4px; 
                         cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
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
