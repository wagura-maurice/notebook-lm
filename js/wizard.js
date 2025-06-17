/* ============================================ */
/* === CONSTANTS & CONFIGURATION === */
/* ============================================ */
const CONFIG = {
  defaultTab: "right-column",
  mobileBreakpoint: 1024,
  animationDuration: 300,
  scrollOffset: 150,
};

const SELECTORS = {
  // Layout
  columnsContainer: "#columns-container",
  leftColumn: "#left-column",

  rightColumn: "#right-column",
  collapsedContent: ".collapsed-content",
  expandedContent: ".expanded-content",

  // Mobile
  mobileTabs: ".mobile-tabs",
  tabButton: ".tab-button",
  mobileTabContent: ".mobile-tab-content",

  // Modals
  modal: ".modal",
  modalClose: ".modal-close",

  // Sources
  sourceItem: ".source-item",
  sourceMenuToggle: ".source-menu-toggle",
  sourceMenuDropdown: ".source-menu-dropdown",

  // Chat
  chatInput: "#chat-input",
  chatMessages: "#chat-messages",
  sendMessage: "#send-message",
  chatSuggestions: "#chat-suggestions",
  chatSuggestionsLeft: "#chat-suggestions-left",
  chatSuggestionsRight: "#chat-suggestions-right",
};

/* ============================================ */
/* === UTILITY FUNCTIONS === */
/* ============================================ */
const Utils = {
  debounce: function (func, wait) {
    let timeout;
    return function () {
      const context = this,
        args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  },

  scrollToBottom: function (element) {
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  },

  formatTime: function (date = new Date()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  },

  toggleClasses: function (element, classesToAdd, classesToRemove) {
    element.addClass(classesToAdd).removeClass(classesToRemove);
  },
};

/* ============================================ */
/* === MODULE: PRELOADER === */
/* ============================================ */
const Preloader = {
  init: function () {
    setTimeout(() => {
      $("#preloader").fadeOut();
    }, 1000);
  },
};

/* ============================================ */
/* === MODULE: CHAT and CHAT SUGGESTIONS === */
/* ============================================ */
const ChatModule = {
  init: function () {
    this.initChatSuggestions();
    this.initChatMessages();
    this.initAIChatForm();
  },

  /* === CHAT SUGGGESTIONS === */
  initChatSuggestions: function () {
    const suggestionsContainer = document.getElementById("chat-suggestions");
    const leftChevron = document.getElementById("chat-suggestions-left");
    const rightChevron = document.getElementById("chat-suggestions-right");

    if (!suggestionsContainer || !leftChevron || !rightChevron) return;

    let scrollStep = 200; // Default scroll step in pixels

    // Dynamically adjust scrollStep based on the first suggestion pill's width
    const firstSuggestion = suggestionsContainer.querySelector("button");
    if (firstSuggestion) {
      scrollStep = firstSuggestion.offsetWidth + 8; // Add gap (8px from CSS gap-2)
    }

    // Scroll function with boundary checking
    const scrollSuggestions = (direction) => {
      const currentScroll = suggestionsContainer.scrollLeft;
      const maxScroll =
        suggestionsContainer.scrollWidth - suggestionsContainer.clientWidth;

      if (direction === "left") {
        const newScroll = Math.max(0, currentScroll - scrollStep);
        suggestionsContainer.scrollTo({ left: newScroll, behavior: "smooth" });
      } else if (direction === "right") {
        const newScroll = Math.min(maxScroll, currentScroll + scrollStep);
        suggestionsContainer.scrollTo({ left: newScroll, behavior: "smooth" });
      }
    };

    // Update chevron visibility based on scroll position
    const updateChevronVisibility = () => {
      const currentScroll = suggestionsContainer.scrollLeft;
      const maxScroll =
        suggestionsContainer.scrollWidth - suggestionsContainer.clientWidth;

      leftChevron.style.opacity = currentScroll > 0 ? "1" : "0.5";
      rightChevron.style.opacity = currentScroll < maxScroll ? "1" : "0.5";
      leftChevron.style.pointerEvents = currentScroll > 0 ? "auto" : "none";
      rightChevron.style.pointerEvents =
        currentScroll < maxScroll ? "auto" : "none";
    };

    // Add event listeners
    leftChevron.addEventListener("click", () => scrollSuggestions("left"));
    rightChevron.addEventListener("click", () => scrollSuggestions("right"));
    suggestionsContainer.addEventListener("scroll", updateChevronVisibility);

    // Initial setup
    updateChevronVisibility();
  },

  /* === CHAT MESSAGES === */
  initChatMessages: function () {
    const chatMessages = document.getElementById("chat-messages");
    const jumpBtn = document.getElementById("jump-to-bottom-btn");

    if (!chatMessages || !jumpBtn) return;

    const atBottom = () => {
      return (
        chatMessages.scrollHeight -
          chatMessages.scrollTop -
          chatMessages.clientHeight <
        2
      );
    };

    const toggleJumpBtn = () => {
      jumpBtn.classList.toggle("show", !atBottom());
    };

    chatMessages.addEventListener("scroll", toggleJumpBtn);
    jumpBtn.addEventListener("click", () => {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: "smooth",
      });
    });

    // Observe for new messages
    const observer = new MutationObserver(() => {
      setTimeout(toggleJumpBtn, 100);
    });
    observer.observe(chatMessages, { childList: true, subtree: true });

    // Initial check
    setTimeout(toggleJumpBtn, 500);
  },

  /* === AI CHAT FORM === */
  initAIChatForm: function () {
    const aiChatForm = document.getElementById("ai-text-chat-form-right");
    const aiTextInput = document.getElementById("ai-text-input-right");
    const aiSendButton = document.getElementById("ai-text-send-right");

    if (!aiChatForm || !aiTextInput || !aiSendButton) return;

    const handleSendMessage = () => {
      const message = aiTextInput.value.trim();

      if (message) {
        console.log("AI Action Submitted:", message);
        aiTextInput.value = "";
        aiTextInput.style.height = "auto";
        aiTextInput.focus();
      }
    };

    // Form submission
    aiChatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSendMessage();
    });

    // Send button click
    aiSendButton.addEventListener("click", handleSendMessage);

    // Textarea handling
    aiTextInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    aiTextInput.addEventListener("input", () => {
      aiTextInput.style.height = "auto";
      aiTextInput.style.height = aiTextInput.scrollHeight + "px";
      aiSendButton.disabled = aiTextInput.value.trim() === "";
    });

    // Initial state
    aiSendButton.disabled = aiTextInput.value.trim() === "";
  },
};

// Initialize the module when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  ChatModule.init();
});

/* ============================================ */
/* === MODULE: MOBILE TABS === */
/* ============================================ */
const MobileTabs = {
  activeTab: CONFIG.defaultTab,

  init: function () {
    this.setupInitialState();
    this.bindEvents();
  },

  setupInitialState: function () {
    $(`${SELECTORS.tabButton}[data-tab="${this.activeTab}"]`).addClass(
      "active"
    );
    $(`#${this.activeTab}`).addClass("active").removeClass("inactive");

    if (window.innerWidth < CONFIG.mobileBreakpoint) {
      $(SELECTORS.mobileTabContent)
        .not(`#${this.activeTab}`)
        .addClass("inactive");
    }
  },

  bindEvents: function () {
    $(SELECTORS.tabButton).on("click", this.handleTabClick.bind(this));
    $(window).on("resize", Utils.debounce(this.handleResize.bind(this), 100));
  },

  handleTabClick: function (e) {
    const tabId = $(e.currentTarget).data("tab");

    if (tabId !== this.activeTab) {
      this.switchTab(tabId);
    }
  },

  switchTab: function (tabId) {
    $(`${SELECTORS.tabButton}[data-tab="${this.activeTab}"]`).removeClass(
      "active"
    );
    $(`#${this.activeTab}`).removeClass("active").addClass("inactive");

    $(`${SELECTORS.tabButton}[data-tab="${tabId}"]`).addClass("active");
    $(`#${tabId}`).addClass("active").removeClass("inactive");
    this.activeTab = tabId;

    $(`#${tabId}`)[0].scrollTop = 0;
  },

  handleResize: function () {
    if (window.innerWidth >= CONFIG.mobileBreakpoint) {
      $(SELECTORS.mobileTabContent).removeClass("inactive").addClass("active");
      $(SELECTORS.tabButton).removeClass("active");
      this.activeTab = null;
    } else {
      const currentTab =
        $(`${SELECTORS.tabButton}.active`).data("tab") || CONFIG.defaultTab;
      $(SELECTORS.mobileTabContent).removeClass("active").addClass("inactive");
      $(`#${currentTab}`).addClass("active").removeClass("inactive");
      this.activeTab = currentTab;
    }
  },
};

/* ============================================ */
/* === MODULE: COLUMN TOGGLES === */
/* ============================================ */
const ColumnToggles = {
  init: function () {
    this.bindEvents();
    this.updateRightColumnState();
  },

  bindEvents: function () {
    $("#collapse-left").on("click", this.toggleLeftColumn.bind(this));
    $("#expand-left").on("click", this.expandLeftColumn.bind(this));
    $("#expand-right").on("click", this.toggleRightColumn.bind(this));
    $(SELECTORS.rightColumn).on(
      "dblclick",
      this.toggleRightColumnSize.bind(this)
    );
  },

  arePanelsActive: function () {
    return $(".view-source-content").length > 0;
  },

  updateRightColumnState: function () {
    const $leftColumn = $(SELECTORS.leftColumn);
    const $rightColumn = $(SELECTORS.rightColumn);

    if (this.arePanelsActive()) {
      Utils.toggleClasses(
        $rightColumn,
        ["panel-active"],
        ["expanded", "contracted"]
      );
    } else {
      $rightColumn.removeClass("panel-active");
    }

    if (
      $leftColumn.hasClass("collapsed") ||
      $rightColumn.hasClass("collapsed")
    ) {
      $rightColumn.addClass("expanded");
    } else {
      $rightColumn.removeClass("expanded");
    }
  },

  toggleLeftColumn: function () {
    const $leftColumn = $(SELECTORS.leftColumn);
    $leftColumn.toggleClass("collapsed");
    $leftColumn.find(SELECTORS.expandedContent).toggleClass("hidden");
    $leftColumn.find(SELECTORS.collapsedContent).toggleClass("hidden");
    $leftColumn.find(SELECTORS.sourceMenuDropdown).addClass("hidden");
    this.updateRightColumnState();
  },

  expandLeftColumn: function () {
    const $leftColumn = $(SELECTORS.leftColumn);
    $leftColumn.removeClass("collapsed");
    $leftColumn.find(SELECTORS.expandedContent).removeClass("hidden");
    $leftColumn.find(SELECTORS.collapsedContent).addClass("hidden");
    this.updateRightColumnState();
  },

  toggleRightColumn: function (e) {
    const $leftColumn = $(SELECTORS.leftColumn);
    const $rightColumn = $(SELECTORS.rightColumn);

    if (
      !$leftColumn.hasClass("collapsed") &&
      !$rightColumn.hasClass("collapsed")
    ) {
      this.collapseSideColumns();
      $rightColumn.addClass("expanded");
      $(e.currentTarget).html('<i class="fas fa-compress-alt"></i>');
    } else {
      this.expandSideColumns();
      $rightColumn.removeClass("expanded");
      $(e.currentTarget).html('<i class="fas fa-expand-alt"></i>');
    }

    this.updateRightColumnState();
  },

  collapseSideColumns: function () {
    const $leftColumn = $(SELECTORS.leftColumn);
    const $rightColumn = $(SELECTORS.rightColumn);

    $leftColumn
      .addClass("collapsed")
      .find(SELECTORS.expandedContent)
      .addClass("hidden");
    $leftColumn.find(SELECTORS.collapsedContent).removeClass("hidden");

    $rightColumn
      .addClass("collapsed")
      .find(SELECTORS.expandedContent)
      .addClass("hidden");
    $rightColumn.find(SELECTORS.collapsedContent).removeClass("hidden");
  },

  expandSideColumns: function () {
    const $leftColumn = $(SELECTORS.leftColumn);
    const $rightColumn = $(SELECTORS.rightColumn);

    $leftColumn
      .removeClass("collapsed")
      .find(SELECTORS.expandedContent)
      .removeClass("hidden");
    $leftColumn.find(SELECTORS.collapsedContent).addClass("hidden");

    $rightColumn
      .removeClass("collapsed")
      .find(SELECTORS.expandedContent)
      .removeClass("hidden");
    $rightColumn.find(SELECTORS.collapsedContent).addClass("hidden");
  },

  toggleRightColumnSize: function () {
    if (!this.arePanelsActive()) {
      $(SELECTORS.rightColumn).toggleClass("contracted");
    }
  },
};

/* ============================================ */
/* === MODULE: DROPDOWN MENUS === */
/* ============================================ */
const DropdownMenus = {
  init: function () {
    this.bindEvents();
  },

  bindEvents: function () {
    $(document)
      .on(
        "click",
        SELECTORS.sourceMenuToggle,
        this.handleSourceMenuToggle.bind(this)
      )
      .on("click", this.handleDocumentClick.bind(this));
  },

  handleSourceMenuToggle: function (e) {
    e.stopPropagation();
    const $sourceItem = $(e.currentTarget).closest(SELECTORS.sourceItem);
    const $dropdown = $sourceItem.find(SELECTORS.sourceMenuDropdown);
    const isVisible = !$dropdown.hasClass("hidden");

    this.hideAllDropdowns();

    if (!isVisible) {
      this.positionDropdown($(e.currentTarget), $dropdown);
      $dropdown.removeClass("hidden").addClass("show");
    }
  },

  handleDocumentClick: function (e) {
    if (
      !$(e.target).closest(
        `${SELECTORS.sourceMenuDropdown}, ${SELECTORS.sourceMenuToggle}`
      ).length
    ) {
      this.hideAllDropdowns();
    }
  },

  hideAllDropdowns: function () {
    $(`${SELECTORS.sourceMenuDropdown}`).removeClass("show").addClass("hidden");
  },

  positionDropdown: function ($trigger, $dropdown) {
    const triggerOffset = $trigger.offset();
    const triggerHeight = $trigger.outerHeight();
    const dropdownHeight = $dropdown.outerHeight();
    const windowHeight = $(window).height();
    const spaceBelow = windowHeight - (triggerOffset.top + triggerHeight);
    const spaceAbove = triggerOffset.top;

    // Default position below the trigger
    let top = triggerOffset.top + triggerHeight;
    let transformOrigin = "top left";

    // Attachment icon triggers file input for AI right input
    $(document).on("click", "#ai-attach-right", function () {
      // $('#ai-file-input-right').trigger('click');
      console.log("Attachment icon clicked");
    });

    // If not enough space below but enough space above, position above the trigger
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      top = triggerOffset.top - dropdownHeight - 8; // 8px gap
      transformOrigin = "bottom left";
    }
    // If not enough space in either direction, position where there's more space
    else if (spaceBelow < dropdownHeight && spaceAbove < dropdownHeight) {
      if (spaceBelow > spaceAbove) {
        top = triggerOffset.top + triggerHeight;
      } else {
        top = triggerOffset.top - dropdownHeight - 8; // 8px gap
        transformOrigin = "bottom left";
      }
    }

    $dropdown.css({
      top: top,
      left: triggerOffset.left,
      position: "fixed",
      "min-width": $trigger.outerWidth() + 140,
      "transform-origin": transformOrigin,
    });
  },
};

/* ============================================ */
/* === MODULE: SOURCE ACTIONS === */
/* ============================================ */
const SourceActions = {
  selectedSources: new Set(), // Move this here from being inside a function

  init: function () {
    this.bindEvents();
    this.setupDiscoverSources();
  },

  bindEvents: function () {
    // Modal triggers
    $("#shareCollectionBtn, #share-collection-btn").on("click", () => {
      $("#share-collection-modal").removeClass("hidden");
      this.showStep("picker");
      this.clearInputs();
    });

    $("#add-source-btn, #addSourceBtn, #addSourceIcon").on("click", () => {
      $("#add-source-modal").removeClass("hidden");
      this.showStep("picker");
      this.clearInputs();
    });

    $("#discoverSourceBtn, #discoverSourceIcon").on(
      "click",
      this.openDiscoverModal.bind(this)
    );

    $("#chatAboutSourcesBtn, #chatAboutSourcesIcon").on(
      "click",
      this.showChatAboutSourcesContent.bind(this)
    );

    // Modal navigation
    $("#source-modal-back").on("click", () => {
      this.showStep("picker");
      this.clearInputs();
    });
    $("#website-source-card").on("click", () => this.showStep("website"));
    $("#youtube-source-card").on("click", () => this.showStep("youtube"));
    $("#paste-source-card").on("click", () => this.showStep("paste"));

    // Input validation
    $("#website-url-input").on("input", function () {
      $("#insert-website-btn").prop("disabled", !$(this).val().trim());
    });
    $("#youtube-url-input").on("input", function () {
      $("#insert-youtube-btn").prop("disabled", !$(this).val().trim());
    });
    $("#paste-text-input").on("input", function () {
      $("#insert-paste-btn").prop("disabled", !$(this).val().trim());
    });

    // Insert actions
    $("#insert-website-btn").on("click", () => {
      const url = $("#website-url-input").val().trim();
      if (url) {
        this.addSource(url, "website", url);
        $("#add-source-modal").addClass("hidden");
        this.showStep("picker");
        this.clearInputs();
      }
    });
    $("#insert-youtube-btn").on("click", () => {
      const url = $("#youtube-url-input").val().trim();
      if (url) {
        this.addSource(url, "youtube", url);
        $("#add-source-modal").addClass("hidden");
        this.showStep("picker");
        this.clearInputs();
      }
    });
    $("#insert-paste-btn").on("click", () => {
      const text = $("#paste-text-input").val().trim();
      if (text) {
        this.addSource(text, "text", text);
        $("#add-source-modal").addClass("hidden");
        this.showStep("picker");
        this.clearInputs();
      }
    });

    // File upload
    $("#file-upload-btn").on("click", () => $("#file-upload").click());
    $("#file-upload").on("change", (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        for (let file of files) {
          this.addSource(file.name, "file", file);
        }
        $("#add-source-modal").addClass("hidden");
        this.showStep("picker");
        this.clearInputs();
      }
    });

    // Modal close
    $("#source-modal-footer .modal-close").on("click", () => {
      $("#add-source-modal").addClass("hidden");
      this.showStep("picker");
      this.clearInputs();
    });

    // Source item actions
    $(document)
      .on(
        "click",
        '.source-menu-dropdown a:contains("Rename")',
        this.showRenameModal.bind(this)
      )
      .on(
        "click",
        '.source-menu-dropdown a:contains("Delete")',
        this.showDeleteModal.bind(this)
      )
      .on(
        "click",
        '.source-menu-dropdown a:contains("Show source")',
        this.showSourceContent.bind(this)
      );

    // Rename/delete confirmations
    $('#rename-modal button:contains("Save")').on(
      "click",
      this.saveRename.bind(this)
    );
    $('#delete-source-modal button:contains("Delete")').on(
      "click",
      this.confirmDelete.bind(this)
    );

    // Add source modal submit
    $('#add-source-modal button:contains("Add Source")').on("click", () => {
      const sourceInput = $("#source-input");
      if (!sourceInput.length) {
        console.error("Element #source-input not found in DOM");
        return;
      }
      const sourceText = sourceInput.val().trim();
      if (sourceText !== "") {
        this.addSource(sourceText, "text", sourceText);
        sourceInput.val("");
        $("#add-source-modal").addClass("hidden");
      }
    });
  },

  openShareCollectionModal: function () {
    $("#share-collection-modal").removeClass("hidden");
    this.showPickerStep();
    this.clearInputs();
  },

  openAddSourceModal: function () {
    $("#add-source-modal").removeClass("hidden");
    this.showPickerStep();
    this.clearInputs();
  },

  openDiscoverModal: function () {
    $("#discover-source-modal").removeClass("hidden");
  },

  closeAddSourceModal: function () {
    $("#add-source-modal").addClass("hidden");
    this.showPickerStep();
    this.clearInputs();
  },

  showStep: function (step) {
    $(
      "#source-modal-step-picker, #source-modal-step-website, #source-modal-step-youtube, #source-modal-step-paste"
    ).addClass("hidden");
    $("#source-modal-back").addClass("hidden");
    if (step === "picker") {
      $("#source-modal-title").text("Add Source");
      $("#source-modal-step-picker").removeClass("hidden");
    } else if (step === "website") {
      $("#source-modal-title").text("Paste URL");
      $("#source-modal-step-website").removeClass("hidden");
      $("#source-modal-back").removeClass("hidden");
    } else if (step === "youtube") {
      $("#source-modal-title").text("YouTube URL");
      $("#source-modal-step-youtube").removeClass("hidden");
      $("#source-modal-back").removeClass("hidden");
    } else if (step === "paste") {
      $("#source-modal-title").text("Paste copied text");
      $("#source-modal-step-paste").removeClass("hidden");
      $("#source-modal-back").removeClass("hidden");
    }
  },

  showPickerStep: function () {
    this.showStep("picker");
  },

  validateInputs: function () {
    const $input = $(this);
    const btnId = `#insert-${$input.attr("id").replace("-input", "")}-btn`;
    $(btnId).prop("disabled", !$input.val().trim());
  },

  clearInputs: function () {
    $("#website-url-input").val("");
    $("#youtube-url-input").val("");
    $("#paste-text-input").val("");
    $("#source-input").val("");
    $("#insert-website-btn, #insert-youtube-btn, #insert-paste-btn").prop(
      "disabled",
      true
    );
  },

  insertWebsite: function () {
    const url = $("#website-url-input").val().trim();
    if (url) {
      this.addSource(url, "website", url);
      this.closeAddSourceModal();
    }
  },

  insertYoutube: function () {
    const url = $("#youtube-url-input").val().trim();
    if (url) {
      this.addSource(url, "youtube", url);
      this.closeAddSourceModal();
    }
  },

  insertPaste: function () {
    const text = $("#paste-text-input").val().trim();
    if (text) {
      this.addSource(text, "text", text);
      this.closeAddSourceModal();
    }
  },

  handleFileUpload: function (e) {
    const files = e.target.files;
    if (files.length > 0) {
      Array.from(files).forEach((file) => {
        this.addSource(file.name, "file", file);
      });
      this.closeAddSourceModal();
    }
  },

  addSource: function (name, type, content) {
    const truncatedName =
      name.length > 30 ? `${name.substring(0, 30)}...` : name;

    const $newSource = $(`
      <li class="group py-2 px-3 hover:bg-slate-700 rounded cursor-pointer flex items-center relative source-item">
        <div class="relative mr-3 w-6 h-6">
          <i class="fas fa-file-alt text-green-400 group-hover:opacity-0 transition-opacity source-icon"></i>
          <i class="fas fa-ellipsis-vertical absolute inset-0 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center source-menu-toggle"></i>
        </div>
        <span class="flex-1 truncate">${truncatedName}</span>
        <input type="checkbox" class="ml-2 source-checkbox" />
        <div class="source-menu hidden absolute right-3 top-10 bg-slate-800 rounded-md shadow-lg py-1 w-48 border border-slate-700 z-30">
          <a href="#" class="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 menu-option">
            <i class="fas fa-eye mr-2"></i> Show source
          </a>
          <a href="#" class="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 menu-option">
            <i class="fas fa-pencil-alt mr-2"></i> Rename
          </a>
          <a href="#" class="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 menu-option">
            <i class="fas fa-trash-alt mr-2"></i> Delete
          </a>
        </div>
      </li>
    `);

    $(".source-list").prepend($newSource);
    return $newSource;
  },

  addSourceFromModal: function () {
    const sourceInput = $("#source-input");
    if (!sourceInput.length) {
      console.error("Element #source-input not found in DOM");
      return;
    }

    const sourceText = sourceInput.val().trim();
    if (sourceText !== "") {
      this.addSource(sourceText, "text", sourceText);
      sourceInput.val("");
      $("#add-source-modal").addClass("hidden");
    }
  },

  setupDiscoverSources: function () {
    // Helper to get a unique ID for each source item (fallback to index if no data-id)
    function getSourceId($item) {
      return $item.data("id") !== undefined ? $item.data("id") : $item.index();
    }

    $(document)
      .on(
        "click",
        '#discover-source-modal .discover-source-modal-close, #discover-source-modal button:contains("Cancel")',
        function () {
          $("#discover-source-modal").addClass("hidden");
          SourceActions.selectedSources.clear(); // Changed from this.selectedSources
          $("#discover-source-modal .p-3.selected").removeClass(
            "selected bg-blue-50 dark:bg-blue-900"
          );
          $("#discover-source-modal .p-3 button")
            .removeClass("remove-btn bg-red-600 hover:bg-red-700 text-white")
            .addClass(
              "add-btn text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            )
            .text("Add");
          SourceActions.updateAddSelectedCount(); // Changed from this.updateAddSelectedCount
          $('#discover-source-modal input[type="text"]').val("");
          $("#discover-source-modal .p-3").show();
        }
      )
      .on(
        "click",
        '#discover-source-modal button:contains("Add Selected")',
        function () {
          if (SourceActions.selectedSources.size > 0) {
            // Changed from this.selectedSources
            alert(`${SourceActions.selectedSources.size} source(s) added!`); // Changed from this.selectedSources
            $("#discover-source-modal").addClass("hidden");
            SourceActions.selectedSources.clear(); // Changed from this.selectedSources
            SourceActions.updateAddSelectedCount(); // Changed from this.updateAddSelectedCount
            $("#discover-source-modal .p-3.selected").removeClass(
              "selected bg-blue-50 dark:bg-blue-900"
            );
            $("#discover-source-modal .p-3 button")
              .removeClass("remove-btn bg-red-600 hover:bg-red-700 text-white")
              .addClass(
                "add-btn text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              )
              .text("Add");
          }
        }
      )
      .on(
        "click",
        "#discover-source-modal .discover-add-remove-btn",
        function () {
          const $btn = $(this);
          const $item = $btn.closest(".p-3");
          const sourceId = getSourceId($item);

          if ($item.hasClass("selected")) {
            $item.removeClass("selected bg-blue-50 dark:bg-blue-900");
            $btn
              .removeClass("remove-btn bg-red-600 hover:bg-red-700 text-white")
              .addClass(
                "add-btn text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              )
              .text("Add");
            SourceActions.selectedSources.delete(sourceId); // Changed from this.selectedSources
          } else {
            $item.addClass("selected bg-blue-50 dark:bg-blue-900");
            $btn
              .removeClass(
                "add-btn text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              )
              .addClass("remove-btn bg-red-600 hover:bg-red-700 text-white")
              .text("Remove");
            SourceActions.selectedSources.add(sourceId); // Changed from this.selectedSources
          }
          SourceActions.updateAddSelectedCount(); // Changed from this.updateAddSelectedCount
        }
      );
  },

  updateAddSelectedCount: function () {
    const count = SourceActions.selectedSources.size; // Changed from this.selectedSources
    $('#discover-source-modal button:contains("Add Selected")').text(
      `Add Selected (${count})`
    );
  },

  showRenameModal: function (e) {
    e.preventDefault();
    const $sourceItem = $(e.currentTarget).closest(SELECTORS.sourceItem);
    const currentName = $sourceItem.find(".truncate").text();

    $("#rename-input").val(currentName);
    $("#rename-modal").removeClass("hidden");
    $("#rename-modal").data("source-item", $sourceItem);
  },

  saveRename: function () {
    const newName = $("#rename-input").val();
    const $sourceItem = $("#rename-modal").data("source-item");

    if (newName && $sourceItem) {
      $sourceItem.find(".truncate").text(newName);
    }
    $("#rename-modal").addClass("hidden");
  },

  showDeleteModal: function (e) {
    e.preventDefault();
    const $sourceItem = $(e.currentTarget).closest(SELECTORS.sourceItem);
    $("#delete-source-modal").removeClass("hidden");
    $("#delete-source-modal").data("source-item", $sourceItem);
  },

  confirmDelete: function () {
    const $sourceItem = $("#delete-source-modal").data("source-item");
    if ($sourceItem) {
      $sourceItem.remove();
    }
    $("#delete-source-modal").addClass("hidden");
  },

  showSourceContent: function (e) {
    e.preventDefault();
    const $sourceItem = $(e.currentTarget).closest(SELECTORS.sourceItem);
    const title = $sourceItem.find(".truncate").text();

    $(SELECTORS.leftColumn)
      .find(SELECTORS.sourceMenuDropdown)
      .addClass("hidden");
    const originalContent = $(SELECTORS.leftColumn).children().detach();

    const viewForm = $(`
      <div class="flex flex-col h-full expanded-content view-source-content">
        <div class="flex items-center justify-between px-5 py-3 border-b border-slate-700">
          <h3 class="text-lg font-semibold">View Source</h3>
          <button id="back-to-sources" class="text-sky-400 text-lg hover:text-sky-400">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>
        <div class="flex-1 w-full overflow-y-auto py-1 scrollbar-transparent">
          <h3 class="font-medium text-sky-400 text-center py-3">${title}</h3>
          
          <div class="source-content-section p-4">
            <h4 class="text-sm font-semibold text-slate-300 mb-2">Summary</h4>
            <p class="text-sm text-slate-400">This document provides a comprehensive overview of key concepts and methodologies in the field. It covers fundamental principles and practical applications while exploring various aspects of the subject matter.</p>
          </div>
          
          <div class="source-content-section p-4">
            <h4 class="text-sm font-semibold text-slate-300 mb-2">Key Topics</h4>
            <div class="source-topics-list">
              <span class="source-topic-tag hover:bg-sky-600 cursor-pointer transition-colors" data-topic="Methodology">Methodology</span>
              <span class="source-topic-tag hover:bg-sky-600 cursor-pointer transition-colors" data-topic="Analysis">Analysis</span>
              <span class="source-topic-tag hover:bg-sky-600 cursor-pointer transition-colors" data-topic="Research">Research</span>
              <span class="source-topic-tag hover:bg-sky-600 cursor-pointer transition-colors" data-topic="Data Collection">Data Collection</span>
              <span class="source-topic-tag hover:bg-sky-600 cursor-pointer transition-colors" data-topic="Results">Results</span>
            </div>
          </div>
          
          <div class="source-content-section p-4 flex-1 overflow-hidden">
            <h4 class="text-sm font-semibold text-slate-300 mb-2">Content</h4>
            <div class="flex-1 overflow-y-auto text-slate-400 space-y-4">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
              <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
              <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>
              <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur.</p>
            </div>
          </div>
        </div>
      </div>
    `);

    $(SELECTORS.leftColumn).append(viewForm);

    $("#back-to-sources").on("click", () => {
      $(".view-source-content").remove();
      $(SELECTORS.leftColumn).append(originalContent);
    });
  },

  showChatAboutSourcesContent: function (e) {
    e.preventDefault();

    $(SELECTORS.leftColumn)
      .find(SELECTORS.sourceMenuDropdown)
      .addClass("hidden");
    const originalContent = $(SELECTORS.leftColumn).children().detach();

    const viewChatWithSourcesContent = $(`
      <div class="flex flex-col h-full expanded-content view-source-content">
        <div class="flex items-center justify-between px-5 py-3 border-b border-slate-700">
          <h3 class="text-lg font-semibold">Chat Sources</h3>
          <button id="back-to-sources" class="text-sky-400 text-lg hover:text-sky-400">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>

        <!-- Chat Messages -->
        <div
          class="flex-1 flex flex-col overflow-hidden"
        >
          <div
            id="left-column-chat-message-welcome-message"
            class="text-center text-gray-300 py-12"
          >
            <div
              class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4"
            >
              <i class="fas fa-robot text-3xl text-purple-400"></i>
            </div>
            <h3 class="text-xl font-semibold text-slate-300 mb-2">
              How can I help with your sources today?
            </h3>
            <p class="text-slate-400 text-sm px-4">
              Ask me anything about your sources or request help with writing,
              editing, or organizing your thoughts.
            </p>
          </div>
          <!-- Messages will be inserted here by JavaScript -->
          <div id="left-column-chat-messages-container" class="flex-1 overflow-y-auto px-5 py-3 space-y-4 scrollbar-transparent"></div>
        </div>

        <!-- Jump to Bottom Button -->
        <div
          class="sticky bottom-4 left-0 right-0 flex justify-center z-10"
        >
          <button
            id="left-column-jump-to-bottom-btn"
            class="bg-indigo-500 text-white rounded-full py-2 px-6 shadow-md hover:bg-indigo-600 focus:outline-none transition-opacity duration-300 opacity-0 pointer-events-none"
          >
            Jump to Bottom
          </button>
        </div>

        <!-- Message Input -->
        <div class="border-t-2 border-slate-700">
          <form id="left-column-chat-form" class="p-3 bg-slate-800">
            <div class="relative">
              <textarea
                id="left-column-message-input"
                class="w-full bg-slate-900 rounded-lg p-3 pr-12 text-white !text-white resize-none focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Chat about these sources..."
                rows="2"
              ></textarea>
              <button
                type="button"
                id="left-column-send-btn"
                class="absolute right-3 bottom-3 text-sky-400 hover:text-white p-1 rounded-full transition-colors"
              >
                <i class="fas fa-paper-plane text-sm"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    `);

    $(SELECTORS.leftColumn).append(viewChatWithSourcesContent);

    // Initialize chat module
    const leftColumnChatInput = document.getElementById(
      "left-column-message-input"
    );
    const leftColumnSendButton = document.getElementById(
      "left-column-send-btn"
    );
    const leftColumnChatMessages = document.getElementById(
      "left-column-chat-messages-container"
    );

    if (leftColumnChatInput && leftColumnSendButton && leftColumnChatMessages) {
      LeftColumnChatModule.init(
        leftColumnChatInput,
        leftColumnSendButton,
        leftColumnChatMessages
      );
    }

    $("#back-to-sources").on("click", () => {
      $(".view-source-content").remove();
      $(SELECTORS.leftColumn).append(originalContent);
    });
  },
};

/* ============================================ */
/* === MODULE: SOURCE ITEM INTERACTIONS === */
/* ============================================ */
const SourceItemInteractions = {
  init: function () {
    this.setupSourceTitles();

    // Set up event listeners
    $(document)
      .on("click", SELECTORS.sourceItem, this.handleSourceItemClick.bind(this))
      .on("click", this.handleDocumentClick.bind(this));

    // Update titles when the document is fully loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.updateSourceTitles();
      });
    } else {
      this.updateSourceTitles();
    }
  },

  setupSourceTitles: function () {
    // Set initial titles
    this.updateSourceTitles();

    // Update titles when new items are added
    const observer = new MutationObserver(() => this.updateSourceTitles());
    const sourcesList = document.querySelector("#sources-list");
    if (sourcesList) {
      observer.observe(sourcesList, { childList: true, subtree: true });
    }
  },

  updateSourceTitles: function () {
    // Update source item tooltips
    document.querySelectorAll(".source-item .truncate").forEach((span) => {
      if (!span.title) {
        span.title = span.textContent.trim();
      }
    });
  },

  handleSourceItemClick: function (e) {
    if (
      $(e.target).closest(
        `${SELECTORS.sourceMenuDropdown}, ${SELECTORS.sourceMenuToggle}`
      ).length
    ) {
      return;
    }

    const $sourceItem = $(e.currentTarget);
    $sourceItem.toggleClass("active").siblings().removeClass("active");

    if ($sourceItem.hasClass("active")) {
      $sourceItem.find(".source-icon").css("opacity", "0");
      $sourceItem.find(".source-menu-toggle").css("opacity", "1");
    } else {
      $sourceItem.find(".source-icon").css("opacity", "1");
      $sourceItem.find(".source-menu-toggle").css("opacity", "0");
      $sourceItem.find(SELECTORS.sourceMenuDropdown).addClass("hidden");
    }
  },

  handleDocumentClick: function (e) {
    if (
      !$(e.target).closest(
        `${SELECTORS.sourceMenuDropdown}, ${SELECTORS.sourceMenuToggle}`
      ).length
    ) {
      $(SELECTORS.sourceItem)
        .removeClass("active")
        .find(".source-icon")
        .css("opacity", "1")
        .end()
        .find(".source-menu-toggle")
        .css("opacity", "0")
        .end()
        .find(SELECTORS.sourceMenuDropdown)
        .addClass("hidden");
    }
  },
};

/* ============================================ */
/* === MODULE: CHAT FUNCTIONALITY === */
/* ============================================ */
const ChatFunctionality = {
  init: function () {
    $(SELECTORS.sendMessage).on("click", this.sendMessage.bind(this));
    $(SELECTORS.chatInput).on("keydown", this.handleKeydown.bind(this));

    // Add click handler for chat suggestions
    $(document).on("click", `${SELECTORS.chatSuggestions} button`, (e) => {
      e.preventDefault();
      const message = $(e.target).closest("button").text().trim();
      this.submitMessage(message);
    });

    // Add click handler for key topics in source view
    $(document).on("click", ".key-topic", (e) => {
      e.preventDefault();
      const message = $(e.target).text().trim();
      this.submitMessage(message);
    });

    // Add click handler for source topic tags
    $(document).on("click", ".source-topic-tag", (e) => {
      e.preventDefault();
      const topic = $(e.target).data("topic") || $(e.target).text().trim();
      this.submitMessage(topic);
    });
  },

  submitMessage: function (messageText) {
    // Update the chat input with the message
    $(SELECTORS.chatInput).val(messageText);
    // Trigger the send message functionality
    this.sendMessage();
  },

  sendMessage: function () {
    // Get the message text and clear the input
    const messageText = $(SELECTORS.chatInput).val().trim();
    if (messageText !== "") {
      // Clear the input immediately after getting the message
      $(SELECTORS.chatInput).val("");

      // Add the user message to the chat
      this.addUserMessage(messageText);

      // Simulate AI response after a short delay
      this.simulateAIResponse(messageText);
    }
  },

  addUserMessage: function (messageText) {
    const userMessage = $(`
      <div class="flex justify-end">
          <div
            class="max-w-[80%] bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl rounded-br-none shadow relative group"
          >
            <div class="text-white text-sm">${messageText}</div>
            <div class="text-xs text-gray-300 text-right">${Utils.formatTime()}</div>
          </div>
        </div>
    `);

    $(SELECTORS.chatMessages).append(userMessage);
    Utils.scrollToBottom($(SELECTORS.chatMessages)[0]);
  },

  getAIResponse: function (userMessage) {
    // Simple response logic - you can expand this with more sophisticated AI responses
    const responses = [
      "I'm here to help with your notes and questions. What would you like to know?",
      "That's an interesting point. Could you tell me more about it?",
      "I've made a note of that. Is there anything else you'd like to discuss?",
      "Thanks for sharing! How can I assist you further?",
      "I understand. What would you like to do next?",
    ];

    // Return a random response
    return responses[Math.floor(Math.random() * responses.length)];
  },

  simulateAIResponse: function (userMessage) {
    // Show loading state
    const loadingMessage = $(`
      <div class="w-full px-4 py-2">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full bg-white opacity-75 animate-bounce"></div>
          <div class="w-2 h-2 rounded-full bg-white opacity-50 animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="w-2 h-2 rounded-full bg-white opacity-25 animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
      </div>
    `);

    const $loadingMessage = $(loadingMessage);
    $(SELECTORS.chatMessages).append($loadingMessage);
    Utils.scrollToBottom($(SELECTORS.chatMessages)[0]);

    // Simulate API call delay
    setTimeout(() => {
      // Remove loading message
      $loadingMessage.remove();

      // Create AI response
      const aiResponse = $(`
        <div class="w-full px-4 py-2 group">
            <div class="text-white text-sm">
            ${this.getAIResponse(userMessage)}
            </div>
            <div class="flex justify-between items-center mt-2">
              <div class="text-xs text-gray-300">${Utils.formatTime()}</div>
              <div class="flex gap-3">
                <button
                  class="text-xs text-gray-300 hover:text-white text-sm flex items-center add-to-note-btn opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-slate-600"
                >
                  <i class="fas fa-plus-circle mr-1.5 text-base"></i> Add to
                  note
                </button>
                <button
                  class="text-xs text-gray-300 hover:text-white text-sm flex items-center copy-message-btn opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-slate-600"
                >
                  <i class="fas fa-copy mr-1.5 text-base"></i> Copy
                </button>
              </div>
            </div>
          </div>
      `);

      $(SELECTORS.chatMessages).append(aiResponse);
      Utils.scrollToBottom($(SELECTORS.chatMessages)[0]);
    }, 1000);
  },

  handleKeydown: function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  },
};

/* ============================================ */
/* === MODULE: MESSAGE ACTIONS === */
/* ============================================ */
const MessageActions = {
  init: function () {
    $(document)
      .on("click", ".add-to-note-btn", this.addToNote.bind(this))
      .on("click", ".copy-message-btn", this.copyMessage.bind(this));
  },

  addToNote: function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $messageElement = $(e.currentTarget).closest(".group");
    const messageContent = $messageElement
      .find(".text-white")
      .first()
      .text()
      .trim();
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!messageContent) return;

    // Create a unique ID for the new note
    const noteId = "note-" + Date.now();

    // Create the new note HTML for expanded view
    const newNoteHtml = `
      <div class="relative flex items-start p-2 hover:bg-slate-700 rounded cursor-pointer transition-colors note-item" data-note-id="${noteId}">
        <div class="relative mr-3 w-6 h-6 mt-1 flex-shrink-0">
          <i class="fa-solid fa-clipboard text-amber-400 note-icon transition-opacity duration-200"></i>
          <i class="fas fa-check text-green-400 absolute inset-0 flex items-center justify-center opacity-0 note-check-icon transition-opacity duration-200"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-white truncate note-title">
            ${messageContent.substring(0, 50)}${
      messageContent.length > 50 ? "..." : ""
    }
          </div>
          <div class="text-xs text-gray-400 note-time">${timestamp}</div>
        </div>
      </div>`;

    // Create the new note HTML for collapsed view (just the icon)
    const newCollapsedNoteHtml = `
      <button class="w-full flex items-center justify-center py-3 text-amber-400 hover:text-sky-400 transition-colors" data-note-id="${noteId}">
        <i class="fa-solid fa-clipboard text-xl"></i>
      </button>`;

    // Add the new note to the top of the expanded notes list
    $(".note-item").first().before(newNoteHtml);

    // Add the new note to the collapsed view, right after the divider
    const $divider = $(".collapsed-content .border-t");
    if ($divider.length) {
      $divider.after(newCollapsedNoteHtml);
    } else {
      // If no divider found, add to the end of the container
      $(".collapsed-content .flex-1").append(newCollapsedNoteHtml);
    }

    // Show a success message
    const $successMsg = $(
      `<div class="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-200">Added to notes</div>`
    );
    $messageElement.append($successMsg);

    // Animate the success message
    setTimeout(() => {
      $successMsg.addClass("opacity-100");
      setTimeout(() => {
        $successMsg.removeClass("opacity-100");
        setTimeout(() => $successMsg.remove(), 200);
      }, 2000);
    }, 100);

    console.log("Added new note:", messageContent);
  },

  copyMessage: function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $messageElement = $(e.currentTarget).closest(".group");
    const messageContent = $messageElement
      .find(".text-white")
      .first()
      .text()
      .trim();

    if (!messageContent) return;

    // Create a temporary textarea element to copy the text
    const textarea = document.createElement("textarea");
    textarea.value = messageContent;
    document.body.appendChild(textarea);
    textarea.select();

    try {
      // Copy the text
      const successful = document.execCommand("copy");

      if (successful) {
        // Show success feedback
        const $copyButton = $(e.currentTarget);
        const originalHtml = $copyButton.html();
        const originalClasses = $copyButton.attr("class");

        // Update button to show success state
        $copyButton.html('<i class="fas fa-check mr-1.5"></i> Copied!');
        $copyButton
          .removeClass("text-gray-400 hover:text-white")
          .addClass("text-green-400");

        // Revert back to original state after 2 seconds
        setTimeout(() => {
          $copyButton.html(originalHtml);
          $copyButton.attr("class", originalClasses);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    } finally {
      // Clean up
      document.body.removeChild(textarea);
    }
  },
};

/* ============================================ */
/* === MODULE: UTILITIES === */
/* ============================================ */
const Utilities = {
  init: function () {
    $("#select-all").on("change", this.handleSelectAll.bind(this));
    $(document).on(
      "click",
      ".processing-btn",
      this.handleProcessingButton.bind(this)
    );
  },

  handleSelectAll: function (e) {
    $(".source-checkbox").prop("checked", $(e.currentTarget).prop("checked"));
  },

  handleProcessingButton: function (e) {
    e.stopPropagation();
    const $btn = $(e.currentTarget);
    const $icon = $btn.find("i");

    $btn.data("processing", "true").addClass("active");

    let spinCount = 0;
    const spinInterval = setInterval(() => {
      $icon.css("animation", "none");
      void $icon[0].offsetWidth;
      $icon.css("animation", "spin 1s linear");
      spinCount++;

      if (spinCount >= 5) {
        clearInterval(spinInterval);
        $btn.removeClass("active").data("processing", "false");
        alert("Processing complete!");
      }
    }, 1000);
  },
};

/* ============================================ */
/* === MODULE: MODAL HANDLING === */
/* ============================================ */
const ModalHandling = {
  init: function () {
    $(document)
      .on("click", SELECTORS.modalClose, this.closeModal.bind(this))
      .on("click", SELECTORS.modal, this.closeModalOnClickOutside.bind(this))
      .on("keydown", this.closeModalOnEscape.bind(this));
  },

  closeModal: function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(e.currentTarget).closest(SELECTORS.modal).addClass("hidden");
  },

  closeModalOnClickOutside: function (e) {
    if (e.target === e.currentTarget) {
      $(e.currentTarget).addClass("hidden");
    }
  },

  closeModalOnEscape: function (e) {
    if (e.key === "Escape") {
      $(SELECTORS.modal).addClass("hidden");
    }
  },
};

/* ============================================ */
/* === MODULE: LEFT COLUMN CHAT === */
/* ============================================ */
const LeftColumnChatModule = {
  init: function (input, sendButton, messagesContainer) {
    this.input = input;
    this.sendButton = sendButton;
    this.messagesContainer = messagesContainer;
    this.jumpButton = document.getElementById("left-column-jump-to-bottom-btn");

    // Add event listeners
    this.input.addEventListener("keydown", this.handleKeydown.bind(this));
    this.sendButton.addEventListener(
      "click",
      this.handleLeftColumnSubmit.bind(this)
    );
    this.input.addEventListener("input", this.handleInput.bind(this));

    // Initialize jump button if it exists
    if (this.jumpButton) {
      this.jumpButton.addEventListener("click", () => this.scrollToBottom());
      this.messagesContainer.addEventListener("scroll", () =>
        this.toggleJumpButton()
      );
      this.toggleJumpButton(); // Initial check
    }

    // Focus the input when the chat opens
    this.input.focus();
  },

  handleKeydown: function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleLeftColumnSubmit();
    }
  },

  handleInput: function (e) {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  },

  handleLeftColumnSubmit: function () {
    const messageText = this.input.value.trim();
    if (messageText) {
      // Hide welcome message if it's the first message
      const welcomeMessage = document.getElementById(
        "left-column-chat-message-welcome-message"
      );
      if (welcomeMessage) {
        welcomeMessage.style.display = "none";
      }

      // Add user message
      this.addLeftColumnUserMessage(messageText);

      // Clear input
      this.input.value = "";

      // Simulate AI response
      this.simulateLeftColumnAIResponse(messageText);
    }
  },

  addLeftColumnUserMessage: function (message) {
    const messageDiv = $(`
      <div class="flex justify-end">
            <div
              class="max-w-[80%] bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl rounded-br-none shadow relative group"
            >
              <div class="text-white text-sm">
                ${message}
              </div>
              <div class="text-xs text-gray-300 text-right">${Utils.formatTime()}</div>
            </div>
          </div>
    `);

    $(this.messagesContainer).append(messageDiv);
    this.scrollToBottom();
  },

  scrollToBottom: function () {
    this.messagesContainer.scrollTo({
      top: this.messagesContainer.scrollHeight,
      behavior: "smooth",
    });
    // Hide jump button after scrolling to bottom
    if (this.jumpButton) {
      this.jumpButton.classList.remove("show");
    }
  },

  toggleJumpButton: function () {
    if (!this.jumpButton) return;

    const { scrollTop, scrollHeight, clientHeight } = this.messagesContainer;
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 100; // 100px threshold

    if (isAtBottom) {
      this.jumpButton.classList.remove("show");
    } else {
      this.jumpButton.classList.add("show");
    }
  },

  simulateLeftColumnAIResponse: function (userMessage) {
    // Show loading state
    const loadingDiv = $(`
      <div class="w-full px-4 py-2">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full bg-white opacity-75 animate-bounce"></div>
          <div class="w-2 h-2 rounded-full bg-white opacity-50 animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="w-2 h-2 rounded-full bg-white opacity-25 animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
      </div>
    `);

    $(this.messagesContainer).append(loadingDiv);
    Utils.scrollToBottom(this.messagesContainer);

    // Simulate delay and replace with actual response
    setTimeout(() => {
      const response = this.getLeftColumnAIResponse(userMessage);
      const responseDiv = $(`
        <div class="w-full px-4 py-2 group">
            <div class="text-white text-sm">
              ${response}
            </div>
            <div class="flex justify-between items-center mt-2">
              <div class="text-xs text-gray-300">${Utils.formatTime()}</div>
              <div class="flex gap-3">
                <button
                  class="text-xs text-gray-300 hover:text-white text-sm flex items-center add-to-note-btn opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-slate-600"
                >
                  <i class="fas fa-plus-circle mr-1.5 text-base"></i> Add to
                  note
                </button>
                <button
                  class="text-xs text-gray-300 hover:text-white text-sm flex items-center copy-message-btn opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-slate-600"
                >
                  <i class="fas fa-copy mr-1.5 text-base"></i> Copy
                </button>
              </div>
            </div>
          </div>
      `);

      loadingDiv.replaceWith(responseDiv);
      Utils.scrollToBottom(this.messagesContainer);
    }, 1000); // 1 second delay
  },

  getLeftColumnAIResponse: function (userMessage) {
    const responses = [
      "I'm here to help with your notes and questions. What would you like to know?",
      "That's an interesting point. Could you tell me more about it?",
      "I've made a note of that. Is there anything else you'd like to discuss?",
      "Thanks for sharing! How can I assist you further?",
      "I understand. What would you like to do next?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },

  setupColumnObserver: function () {
    const leftColumn = document.getElementById("left-column");
    const chatArea = document.querySelector(".left-column-chat");

    if (!leftColumn || !chatArea) return;

    // Check initial state
    this.toggleChatAreaVisibility(leftColumn, chatArea);

    // Create a mutation observer to watch for class changes on the left column
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          this.toggleChatAreaVisibility(leftColumn, chatArea);
        }
      });
    });

    // Start observing the left column for attribute changes
    observer.observe(leftColumn, { attributes: true });
  },

  toggleChatAreaVisibility: function (leftColumn, chatArea) {
    const isExpanded = leftColumn.classList.contains("lg:flex");
    if (isExpanded) {
      chatArea.classList.remove("hidden");
    } else {
      chatArea.classList.add("hidden");
    }
  },

  handleSendMessage: function () {
    const input = document.getElementById("left-column-chat-input");
    const message = input.value.trim();

    if (message) {
      // Here you would typically send the message to your backend
      console.log("Left column chat message:", message);

      // Clear input
      input.value = "";

      // Focus back on input
      input.focus();
    }
  },
};

/* ============================================ */
/* === MODULE: RIGHT COLUMN CHAT === */
/* ============================================ */
const RightColumnChat = {
  init: function () {
    const rightColumnMessages = document.getElementById(
      "right-column-chat-messages"
    );
    const rightColumnJumpButton = document.getElementById(
      "right-column-jump-bottom"
    );

    if (rightColumnMessages && rightColumnJumpButton) {
      // Toggle jump button visibility
      const toggleRightColumnJumpButton = () => {
        const isAtBottom =
          rightColumnMessages.scrollHeight -
            rightColumnMessages.scrollTop -
            rightColumnMessages.clientHeight <
          50;
        rightColumnJumpButton.classList.toggle("hidden", isAtBottom);
      };

      // Scroll to bottom when jump button is clicked
      rightColumnJumpButton.addEventListener("click", () => {
        rightColumnMessages.scrollTop = rightColumnMessages.scrollHeight;
      });

      // Add scroll event listener to toggle button visibility
      rightColumnMessages.addEventListener(
        "scroll",
        toggleRightColumnJumpButton
      );

      // Initial check
      setTimeout(toggleRightColumnJumpButton, 500);
    }
  },
};

/* ============================================ */
/* === DOCUMENT READY === */
/* ============================================ */
$(document).ready(function () {
  Preloader.init();
  ChatModule.init();
  MobileTabs.init();
  ColumnToggles.init();
  DropdownMenus.init();
  SourceActions.init();
  SourceItemInteractions.init();
  ChatFunctionality.init();
  MessageActions.init();
  Utilities.init();
  ModalHandling.init();
  RightColumnChat.init();
});
