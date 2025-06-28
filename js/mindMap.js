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
            if (!this.mindMapInitialized) {
              console.log("Initializing mind map for the first time...");
              this.initialize();
            } else if (this.jm) {
              console.log("Refreshing mind map display...");
              // Refresh the display if already initialized
              setTimeout(() => {
                if (this.jm && typeof this.jm.resize === "function") {
                  this.jm.resize();
                }
              }, 100);
            }
          } else {
            // Clean up when modal is hidden
            console.log("Modal hidden, cleaning up resources...");
            this.cleanup();
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
  cleanup() {
    console.log("Cleaning up mind map resources...");

    // Stop observing modal changes
    if (this.modalObserver) {
      this.modalObserver.disconnect();
      this.modalObserver = null;
    }

    // Remove event listeners
    const container = document.getElementById("jsmind_container");
    if (container) {
      container.replaceWith(container.cloneNode(true));
    }

    // Setup click handlers for node expand/collapse
    this.setupNodeHandlers();

    // Clear the mind map if it exists
    if (this.jm) {
      try {
        this.jm.destroy();
      } catch (e) {
        console.error("Error destroying jsMind instance:", e);
      }
      this.jm = null;
    }

    this.mindMapInitialized = false;
    console.log("Mind map cleanup complete");
  }

  initialize() {
    if (this.mindMapInitialized && this.jm) {
      console.log("Mind map already initialized, refreshing...");
      // If already initialized, just refresh the display
      try {
        this.jm.show();
        // Force a resize to ensure proper rendering
        setTimeout(() => {
          if (this.jm && typeof this.jm.resize === "function") {
            this.jm.resize();
          }
        }, 100);
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
          jsmindContainer.style.width = "100%";
          jsmindContainer.style.height = "calc(100% - 40px)";
          jsmindContainer.style.position = "relative";

          // Create a toolbar
          const toolbar = document.createElement("div");
          toolbar.className = "mind-map-toolbar";
          toolbar.style.padding = "8px";
          toolbar.style.backgroundColor = "#1f2937";
          toolbar.style.borderBottom = "1px solid #374151";

          // Add buttons
          const addNodeBtn = this.createButton("Add Node", () =>
            this.addNode()
          );
          const saveBtn = this.createButton("Save", () => this.saveMindMap());
          const loadBtn = this.createLoadButton();
          const closeBtn = this.createButton("Close", () => {
            document.getElementById("mind-map-modal").classList.add("hidden");
          });

          toolbar.appendChild(addNodeBtn);
          toolbar.appendChild(saveBtn);
          toolbar.appendChild(loadBtn);
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
          this.statusEl.style.bottom = "10px";
          this.statusEl.style.left = "50%";
          this.statusEl.style.transform = "translateX(-50%)";
          this.statusEl.style.zIndex = "1000";

          // Assemble the UI
          contentWrapper.appendChild(toolbar);
          contentWrapper.appendChild(jsmindContainer);
          contentWrapper.appendChild(this.statusEl);
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

  createLoadButton() {
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.display = "inline-block";

    const label = this.createButton("Load", () => {
      document.getElementById("load-mindmap").click();
    });

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "load-mindmap";
    fileInput.accept = ".jm,.json";
    fileInput.style.display = "none";
    fileInput.addEventListener("change", (e) => this.loadMindMap(e));

    container.appendChild(label);
    container.appendChild(fileInput);

    return container;
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

      console.log("Mind map container found:", container);

      // Set container styles if not already set
      container.style.width = "100%";
      container.style.height = "calc(100% - 40px)";
      container.style.position = "relative";
      container.style.overflow = "hidden";
      container.style.backgroundColor = "#1f2937"; // Match the dark theme

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
          line_width: 2,
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

      console.log("jsMind options:", options);

      // Create a simple mind map structure with the exact format jsMind expects
      const mindData = {
        meta: {
          name: "Information Assessment and Management",
          author: "You",
          version: "1.0",
        },
        format: "node_tree",
        data: {
          id: "root",
          topic: "Information Assessment and Management",
          children: [
            {
              id: "reliability",
              topic: "Assessing Reliability & Credibility",
              direction: "right",
              children: [
                {
                  id: "grey-lit",
                  topic: "Grey Literature",
                  direction: "right",
                  children: [],
                },
                {
                  id: "archival",
                  topic: "Archival Research",
                  direction: "right",
                  children: [],
                },
                {
                  id: "think-tanks",
                  topic: "Think Tanks",
                  direction: "right",
                  children: [],
                },
                {
                  id: "push-protocol",
                  topic: "Push Protocol (2KTeco Devices)",
                  direction: "right",
                  children: [],
                },
                {
                  id: "icea",
                  topic: "ICEA LION Financial Services",
                  direction: "right",
                  children: [],
                },
                {
                  id: "kingo",
                  topic: "Kingo Edwin Rwaro (Clinical Professional)",
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
                  direction: "right",
                  children: [],
                },
              ],
            },
            {
              id: "publication",
              topic: "Publication Types",
              direction: "right",
              children: [
                {
                  id: "orgs",
                  topic: "Producing Organizations",
                  direction: "right",
                  children: [],
                },
                {
                  id: "challenges",
                  topic: "Challenges (Problems)",
                  direction: "right",
                  children: [],
                },
                {
                  id: "impact",
                  topic: "Impact/Importance",
                  direction: "right",
                  children: [],
                },
                {
                  id: "access",
                  topic: "Accessibility",
                  direction: "right",
                  children: [],
                },
                {
                  id: "dbs",
                  topic: "Databases/Resources",
                  direction: "right",
                  children: [],
                },
              ],
            },
            {
              id: "psc-form",
              topic: "Public Service Commission Application Form",
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

  addNode() {
    if (!this.jm) {
      this.updateStatus("Mind map not initialized", true);
      return;
    }

    const selectedNode = this.jm.get_selected_node();
    const parentId = selectedNode ? selectedNode.id : "root";

    const newNodeId = "node-" + Date.now();
    const newNodeTopic = "New Idea";

    try {
      this.jm.add_node(parentId, newNodeId, newNodeTopic);
      this.updateStatus("Added new node");
    } catch (error) {
      console.error("Error adding node:", error);
      this.updateStatus("Error adding node: " + error.message, true);
    }
  }

  editNode(nodeId) {
    try {
      if (!this.jm) {
        console.error("jsMind instance not available");
        return;
      }

      const node = this.jm.get_node(nodeId);
      if (!node) {
        console.error("Node not found:", nodeId);
        return;
      }

      // Get current topic, ensuring it's a string
      const currentTopic = node.topic || "";

      // Show prompt with current topic
      const newTopic = prompt("Edit node:", currentTopic);

      // If user cancelled the prompt
      if (newTopic === null) return;

      // Trim whitespace
      const trimmedTopic = newTopic.trim();

      // Check if empty after trim
      if (trimmedTopic === "") {
        this.updateStatus("Node title cannot be empty", true);
        return;
      }

      // Only update if the topic has actually changed
      if (trimmedTopic !== currentTopic) {
        // Use the jm.update_node method with the node object
        const updatedNode = Object.assign({}, node, { topic: trimmedTopic });
        this.jm.update_node(updatedNode);
        this.updateStatus("Node updated");
      }
    } catch (error) {
      console.error("Error in editNode:", error);
      this.updateStatus(
        "Error updating node: " + (error.message || "Unknown error"),
        true
      );
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

  loadMindMap(event) {
    if (!this.jm) {
      this.updateStatus("Mind map not initialized", true);
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const mindData = JSON.parse(e.target.result);
        this.jm.show(mindData);
        this.updateStatus("Mind map loaded");
      } catch (error) {
        console.error("Error loading mind map:", error);
        this.updateStatus("Error loading mind map: " + error.message, true);
      }
    };

    reader.onerror = () => {
      this.updateStatus("Error reading file", true);
    };

    reader.readAsText(file);
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
