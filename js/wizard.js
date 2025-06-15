/* ============================================ */
/* === CONSTANTS & CONFIGURATION === */
/* ============================================ */
const CONFIG = {
  defaultTab: "middle-column",
  mobileBreakpoint: 1024,
  animationDuration: 300,
  scrollOffset: 150,
};

const SELECTORS = {
  // Layout
  columnsContainer: "#columns-container",
  leftColumn: "#left-column",
  middleColumn: "#middle-column",
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

  // Notes
  noteItem: ".note-item",
  noteMenuToggle: ".note-menu-toggle",
  notesMenuDropdown: ".notes-menu-dropdown",

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
/* === MODULE: CHAT SUGGESTIONS === */
/* ============================================ */
const ChatSuggestions = {
  init: function () {
    const chatSuggestions = $(SELECTORS.chatSuggestions);
    const leftBtn = $(SELECTORS.chatSuggestionsLeft);
    const rightBtn = $(SELECTORS.chatSuggestionsRight);

    if (chatSuggestions.length && chatSuggestions.parent().length) {
      chatSuggestions.parent().css({
        "min-width": "0",
        "flex-shrink": "0",
        "overflow-x": "auto",
      });

      // Show/hide buttons based on number of suggestions
      const suggestions = chatSuggestions.find("button");
      const showButtons = suggestions.length > 1;
      leftBtn.toggle(showButtons);
      rightBtn.toggle(showButtons);

      // Add click handlers
      leftBtn.on("click", () => {
        chatSuggestions.parent().get(0).scrollBy({
          left: -CONFIG.scrollOffset,
          behavior: "smooth",
        });
      });

      rightBtn.on("click", () => {
        chatSuggestions.parent().get(0).scrollBy({
          left: CONFIG.scrollOffset,
          behavior: "smooth",
        });
      });
    }
  },

  // Update button states when suggestions change
  updateButtonStates: function () {
    const chatSuggestions = $(SELECTORS.chatSuggestions);
    const leftBtn = $(SELECTORS.chatSuggestionsLeft);
    const rightBtn = $(SELECTORS.chatSuggestionsRight);
    const suggestions = chatSuggestions.find("button");
    const showButtons = suggestions.length > 1;

    leftBtn.toggle(showButtons);
    rightBtn.toggle(showButtons);
  },
};

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
    this.updateMiddleColumnState();
  },

  bindEvents: function () {
    $("#collapse-left").on("click", this.toggleLeftColumn.bind(this));
    $("#collapse-right").on("click", this.toggleRightColumn.bind(this));
    $("#expand-left").on("click", this.expandLeftColumn.bind(this));
    $("#expand-right").on("click", this.expandRightColumn.bind(this));
    $("#expand-middle").on("click", this.toggleMiddleColumn.bind(this));
    $(SELECTORS.middleColumn).on(
      "dblclick",
      this.toggleMiddleColumnSize.bind(this)
    );
  },

  arePanelsActive: function () {
    return $(".view-source-content, .edit-note-content").length > 0;
  },

  updateMiddleColumnState: function () {
    const $middleColumn = $(SELECTORS.middleColumn);
    const $leftColumn = $(SELECTORS.leftColumn);
    const $rightColumn = $(SELECTORS.rightColumn);

    if (this.arePanelsActive()) {
      Utils.toggleClasses(
        $middleColumn,
        ["panel-active"],
        ["expanded", "contracted"]
      );
    } else {
      $middleColumn.removeClass("panel-active");
    }

    if (
      $leftColumn.hasClass("collapsed") ||
      $rightColumn.hasClass("collapsed")
    ) {
      $middleColumn.addClass("expanded");
    } else {
      $middleColumn.removeClass("expanded");
    }
  },

  toggleLeftColumn: function () {
    const $leftColumn = $(SELECTORS.leftColumn);
    $leftColumn.toggleClass("collapsed");
    $leftColumn.find(SELECTORS.expandedContent).toggleClass("hidden");
    $leftColumn.find(SELECTORS.collapsedContent).toggleClass("hidden");
    $leftColumn.find(SELECTORS.sourceMenuDropdown).addClass("hidden");
    this.updateMiddleColumnState();
  },

  toggleRightColumn: function () {
    const $rightColumn = $(SELECTORS.rightColumn);
    $rightColumn.toggleClass("collapsed");
    $rightColumn.find(SELECTORS.expandedContent).toggleClass("hidden");
    $rightColumn.find(SELECTORS.collapsedContent).toggleClass("hidden");
    $rightColumn.find(SELECTORS.notesMenuDropdown).addClass("hidden");
    this.updateMiddleColumnState();
  },

  expandLeftColumn: function () {
    const $leftColumn = $(SELECTORS.leftColumn);
    $leftColumn.removeClass("collapsed");
    $leftColumn.find(SELECTORS.expandedContent).removeClass("hidden");
    $leftColumn.find(SELECTORS.collapsedContent).addClass("hidden");
    this.updateMiddleColumnState();
  },

  expandRightColumn: function () {
    const $rightColumn = $(SELECTORS.rightColumn);
    $rightColumn.removeClass("collapsed");
    $rightColumn.find(SELECTORS.expandedContent).removeClass("hidden");
    $rightColumn.find(SELECTORS.collapsedContent).addClass("hidden");
    this.updateMiddleColumnState();
  },

  toggleMiddleColumn: function (e) {
    const $middleColumn = $(SELECTORS.middleColumn);
    const $leftColumn = $(SELECTORS.leftColumn);
    const $rightColumn = $(SELECTORS.rightColumn);

    if (
      !$leftColumn.hasClass("collapsed") &&
      !$rightColumn.hasClass("collapsed")
    ) {
      this.collapseSideColumns();
      $middleColumn.addClass("expanded");
      $(e.currentTarget).html('<i class="fas fa-compress-alt"></i>');
    } else {
      this.expandSideColumns();
      $middleColumn.removeClass("expanded");
      $(e.currentTarget).html('<i class="fas fa-expand-alt"></i>');
    }

    this.updateMiddleColumnState();
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

  toggleMiddleColumnSize: function () {
    if (!this.arePanelsActive()) {
      $(SELECTORS.middleColumn).toggleClass("contracted");
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
      .on(
        "click",
        SELECTORS.noteMenuToggle,
        this.handleNoteMenuToggle.bind(this)
      )
      .on("click", "#notes-menu-button", this.handleNotesMenuButton.bind(this))
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

  handleNoteMenuToggle: function (e) {
    e.stopPropagation();
    const $noteItem = $(e.currentTarget).closest(SELECTORS.noteItem);
    const $dropdown = $noteItem.find(SELECTORS.notesMenuDropdown);
    const isVisible = !$dropdown.hasClass("hidden");

    this.hideAllDropdowns();

    if (!isVisible) {
      this.positionDropdown($(e.currentTarget), $dropdown);
      $dropdown.removeClass("hidden").addClass("show");
    }
  },

  handleNotesMenuButton: function (e) {
    e.stopPropagation();
    $("#notes-menu-dropdown").toggleClass("hidden");
  },

  handleDocumentClick: function (e) {
    if (
      !$(e.target).closest("#notes-menu-dropdown").length &&
      !$(e.target).closest("#notes-menu-button").length
    ) {
      $("#notes-menu-dropdown").addClass("hidden");
    }

    if (
      !$(e.target).closest(
        `${SELECTORS.sourceMenuDropdown}, ${SELECTORS.sourceMenuToggle}, ${SELECTORS.notesMenuDropdown}, ${SELECTORS.noteMenuToggle}`
      ).length
    ) {
      this.hideAllDropdowns();
    }
  },

  hideAllDropdowns: function () {
    $(`${SELECTORS.sourceMenuDropdown}, ${SELECTORS.notesMenuDropdown}`)
      .removeClass("show")
      .addClass("hidden");
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
};

/* ============================================ */
/* === MODULE: NOTE ACTIONS === */
/* ============================================ */
const NoteActions = {
  init: function () {
    this.bindEvents();
  },

  bindEvents: function () {
    $("#add-note-btn, #add-note-icon").on(
      "click",
      this.openAddNoteModal.bind(this)
    );

    // Quick Notes buttons click handler
    const self = this; // Store reference to 'this'
    $(document).on("click", ".quick-note-btn", function (e) {
      const buttonText = $(this).find("span").text().trim();
      console.log(`Quick Note button clicked: ${buttonText}`);

      // Add specific logic for each button type here if needed
      switch (buttonText) {
        case "Study guide":
          console.log("Study guide logic would run here");
          break;
        case "Briefing doc":
          console.log("Briefing doc logic would run here");
          break;
        case "FAQ":
          console.log("FAQ logic would run here");
          break;
        case "Timeline":
          console.log("Timeline logic would run here");
          break;
        case "Wizard":
          console.log("Opening canvas notes modal...");
          self.showOpenWizardModal(e);
          break;
      }
    });

    $(document)
      .on(
        "click",
        '#notes-menu-dropdown a:contains("Source all")',
        function () {
          alert("Add logic to source all notes");
        }
      )
      .on(
        "click",
        '#notes-menu-dropdown a:contains("Canvas all")',
        this.showOpenCanvasNotesToCanvasModal.bind(this)
      )
      .on(
        "click",
        '#notes-menu-dropdown a:contains("Delete all")',
        this.showDeleteAllNotesModal.bind(this)
      )
      .on(
        "click",
        '.notes-menu-dropdown a:contains("Delete")',
        this.showDeleteNoteModal.bind(this)
      )
      .on(
        "click",
        '.notes-menu-dropdown a:contains("Show note")',
        this.showNoteContent.bind(this)
      )
      .on(
        "click",
        '.notes-menu-dropdown a:contains("Add to sources")',
        this.addNoteToSources.bind(this)
      );

    $('#add-note-modal button:contains("Save Note")').on(
      "click",
      this.saveNote.bind(this)
    );

    $('#delete-all-notes-modal button:contains("Delete")').on(
      "click",
      this.deleteAllNotes.bind(this)
    );

    $('#delete-note-modal button:contains("Delete")').on(
      "click",
      this.deleteNote.bind(this)
    );
  },

  openAddNoteModal: function () {
    $("#add-note-modal").removeClass("hidden");
    this.initWysiwygToolbar();
  },

  initWysiwygToolbar: function () {
    const $wysiwygButtons = $(".wysiwyg-btn");
    $wysiwygButtons
      .css({
        background: "transparent",
        color: "#94a3b8",
        border: "none",
        padding: "4px 8px",
        margin: "0 2px",
        "border-radius": "4px",
        cursor: "pointer",
      })
      .hover(
        function () {
          $(this).css("background-color", "#334155");
        },
        function () {
          $(this).css("background-color", "transparent");
        }
      )
      .on("mousedown", function () {
        $(this).css("background-color", "#1e293b");
      })
      .on("mouseup mouseleave", function () {
        $(this).css("background-color", "transparent");
      });

    $wysiwygButtons.on("click", function (e) {
      e.preventDefault();
      const command = $(this).data("command");
      const value = $(this).data("value");
      const $textarea = $("#note-content");

      if (command === "createLink") {
        const url = prompt("Enter the link URL:");
        if (url) {
          const text = $textarea.val();
          const start = $textarea[0].selectionStart;
          const end = $textarea[0].selectionEnd;
          const before = text.substring(0, start);
          const selected = text.substring(start, end);
          const after = text.substring(end, text.length);
          $textarea.val(before + `[${selected}](${url})` + after);
        }
      } else if (command === "formatBlock") {
        const text = $textarea.val();
        const start = $textarea[0].selectionStart;
        const end = $textarea[0].selectionEnd;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end, text.length);

        switch (value) {
          case "h1":
            $textarea.val(before + `# ${selected}\n` + after);
            break;
          case "h2":
            $textarea.val(before + `## ${selected}\n` + after);
            break;
          case "h3":
            $textarea.val(before + `### ${selected}\n` + after);
            break;
        }
      } else {
        const text = $textarea.val();
        const start = $textarea[0].selectionStart;
        const end = $textarea[0].selectionEnd;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end, text.length);

        let wrappedText = selected;
        switch (command) {
          case "bold":
            wrappedText = `**${selected}**`;
            break;
          case "italic":
            wrappedText = `*${selected}*`;
            break;
          case "underline":
            wrappedText = `__${selected}__`;
            break;
          case "insertUnorderedList":
            wrappedText = `* ${selected}\n`;
            break;
          case "insertOrderedList":
            wrappedText = `1. ${selected}\n`;
            break;
        }

        $textarea.val(before + wrappedText + after);
      }
      $textarea.focus();
    });
  },

  saveNote: function () {
    const noteTitle = $("#note-title-input").val();
    const noteContent = $("#note-content").html();

    if (noteTitle.trim() !== "" && noteContent.trim() !== "") {
      const truncatedContent =
        noteContent.length > 50
          ? `${noteContent.substring(0, 50)}...`
          : noteContent;

      const $newNote = $(`
        <div class="relative flex items-start p-2 hover:bg-slate-700 rounded cursor-pointer transition-colors note-item group mb-2">
          <div class="relative mr-3 w-6 h-6 mt-1 flex-shrink-0">
            <i class="fas fa-sticky-note text-sky-400 note-icon transition-opacity duration-200"></i>
            <i class="fas fa-ellipsis-vertical absolute inset-0 text-white opacity-0 note-menu-toggle transition-opacity duration-200 flex items-center justify-center"></i>
          </div>
          <div class="flex-1 min-w-0 overflow-hidden">
            <div class="font-medium truncate">${noteTitle}</div>
            <div class="text-xs text-slate-400 truncate">${truncatedContent}</div>
          </div>
          <div class="notes-menu-dropdown hidden absolute right-3 top-10 bg-slate-800 rounded-md shadow-lg py-1 w-48 border border-slate-700 z-30">
            <a href="#" class="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 menu-option">
              <i class="fa-solid fa-eye mr-2"></i> Show note
            </a>
            <a href="#" class="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 menu-option">
              <i class="fas fa-plus-circle mr-3 text-sm"></i> Add to sources
            </a>
            <a href="#" class="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 menu-option">
              <i class="fas fa-trash-alt mr-3 text-sm"></i> Delete note
            </a>
          </div>
        </div>
      `);

      $(".note-list-container").prepend($newNote);
      $("#note-title-input").val("");
      $("#note-content").html("");
      $("#add-note-modal").addClass("hidden");
    }
  },

  showOpenWizardModal: function (e) {
    e.preventDefault();
    $("#open-wizard-modal").removeClass("hidden");
  },

  showOpenCanvasNotesToCanvasModal: function (e) {
    // alert("Add logic to converge all notes to canvas");
    e.preventDefault();
    const $noteItems = $(e.currentTarget).closest(".note-list-container");
    $("#open-canvas-notes-modal").removeClass("hidden");
    // $("#open-canvas-notes-modal").data("note-list-container", $noteItems);
    // alert($noteItems.count);
  },

  showDeleteAllNotesModal: function (e) {
    e.preventDefault();
    const $noteItems = $(e.currentTarget).closest(".note-list-container");
    $("#delete-all-notes-modal").removeClass("hidden");
    $("#delete-all-notes-modal").data("note-list-container", $noteItems);
  },

  deleteAllNotes: function () {
    const $noteItems = $("#delete-all-notes-modal").data("note-list-container");
    if ($noteItems) {
      $noteItems.empty();
    }
    $("#delete-all-notes-modal").addClass("hidden");
  },

  showDeleteNoteModal: function (e) {
    e.preventDefault();
    const $noteItem = $(e.currentTarget).closest(SELECTORS.noteItem);
    $("#delete-note-modal").removeClass("hidden");
    $("#delete-note-modal").data("note-item", $noteItem);
  },

  deleteNote: function () {
    const $noteItem = $("#delete-note-modal").data("note-item");
    if ($noteItem) {
      $noteItem.remove();
    }
    $("#delete-note-modal").addClass("hidden");
  },

  addNoteToSources: function (e) {
    e.preventDefault();
    const $noteItem = $(e.currentTarget).closest(SELECTORS.noteItem);
    const title = $noteItem.find(".font-medium.truncate").text();
    SourceActions.addSource(title, "note", title);
  },

  showNoteContent: function (e) {
    e.preventDefault();
    const $noteItem = $(e.currentTarget).closest(SELECTORS.noteItem);
    const title = $noteItem.find(".font-medium.truncate").text();
    const content = $noteItem.find(".text-xs.text-slate-400.truncate").text();

    $(SELECTORS.rightColumn)
      .find(SELECTORS.notesMenuDropdown)
      .addClass("hidden");
    const originalContent = $(SELECTORS.rightColumn).children().detach();

    const editForm = $(`
      <div class="flex flex-col h-full expanded-content edit-note-content">
        <div class="flex items-center justify-between px-5 py-3 border-b border-slate-700">
          <h3 class="text-lg font-semibold">Edit Note</h3>
          <button id="back-to-notes" class="text-sky-400 text-lg hover:text-sky-400">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>
        <div class="flex-1 w-full overflow-y-auto py-1 scrollbar-transparent">
          <div class="note-content-section p-4">
            <h4 class="text-sm font-semibold text-slate-300 mb-2">Title</h4>
            <input
              type="text"
              id="edit-note-title"
              value="${title}"
              class="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Note Title"
            />
          </div>
          <div class="note-content-section p-4">
            <h4 class="text-sm font-semibold text-slate-300 mb-2">Content</h4>
            <div class="bg-slate-800 border border-slate-600 rounded-t p-2 flex flex-wrap gap-2 items-center">
              <div class="flex pr-2 mr-2">
                <button class="wysiwyg-btn" data-command="bold" title="Bold"><i class="fas fa-bold"></i></button>
                <button class="wysiwyg-btn" data-command="italic" title="Italic"><i class="fas fa-italic"></i></button>
                <button class="wysiwyg-btn" data-command="underline" title="Underline"><i class="fas fa-underline"></i></button>
                <button class="wysiwyg-btn" data-command="justifyLeft" title="Align Left"><i class="fas fa-align-left"></i></button>
                <button class="wysiwyg-btn" data-command="justifyCenter" title="Align Center"><i class="fas fa-align-center"></i></button>
                <button class="wysiwyg-btn" data-command="justifyRight" title="Align Right"><i class="fas fa-align-right"></i></button>
                <button class="wysiwyg-btn" data-command="insertOrderedList" title="Numbered List"><i class="fas fa-list-ol"></i></button>
                <button class="wysiwyg-btn" data-command="insertUnorderedList" title="Bullet List"><i class="fas fa-list-ul"></i></button>
                <button class="wysiwyg-btn" data-command="createLink" title="Insert Link"><i class="fas fa-link"></i></button>
              </div>
            </div>
            <div 
              id="edit-note-content" 
              class="w-full flex-1 min-h-[200px] max-h-[calc(100vh-300px)] bg-slate-700 text-white border border-t-0 border-slate-600 rounded-b px-3 py-2 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-sky-400" 
              contenteditable="true"
              style="min-height: 200px; max-height: calc(100vh - 300px);"
            >${content}</div>
          </div>
          <div class="flex justify-end gap-0 p-4" id="add-note-modal-footer">
            <div class="flex justify-end gap-0">
              <button
                class="px-4 py-2 rounded-l-full text-gray-300 hover:bg-blue-gray modal-close border border-r-0 border-gray-600"
                id="cancel-note-changes"
              >
                Cancel
              </button>
              <button
                class="px-4 py-2 rounded-r-full bg-accent-blue text-white border border-gray-600"
                id="save-note-changes"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    `);

    editForm
      .find(".wysiwyg-btn")
      .css({
        background: "transparent",
        color: "#94a3b8",
        border: "none",
        padding: "4px 8px",
        margin: "0 2px",
        "border-radius": "4px",
        cursor: "pointer",
      })
      .hover(
        function () {
          $(this).css("background-color", "#334155");
        },
        function () {
          $(this).css("background-color", "transparent");
        }
      )
      .on("mousedown", function () {
        $(this).css("background-color", "#1e293b");
      })
      .on("mouseup mouseleave", function () {
        $(this).css("background-color", "transparent");
      });

    editForm.find(".wysiwyg-btn").on("click", function (e) {
      e.preventDefault();
      const command = $(this).data("command");
      if (command === "createLink") {
        const url = prompt("Enter the link URL:");
        if (url) document.execCommand(command, false, url);
      } else {
        document.execCommand(command, false, null);
      }
      $("#edit-note-content").focus();
    });

    editForm.find("#save-note-changes").on("click", () => {
      const newTitle = $("#edit-note-title").val().trim();
      const newContent = $("#edit-note-content").html().trim();

      if (newTitle && newContent) {
        $noteItem
          .find(".font-medium.truncate")
          .text(
            newTitle.length > 30 ? `${newTitle.substring(0, 30)}...` : newTitle
          );
        $noteItem
          .find(".text-xs.text-slate-400.truncate")
          .text(
            newContent.length > 50
              ? `${newContent.substring(0, 50)}...`
              : newContent
          );
      }

      $(SELECTORS.rightColumn).empty().append(originalContent);
      $(SELECTORS.rightColumn).removeClass("collapsed");
    });

    editForm.find("#cancel-note-changes").on("click", () => {
      if (confirm("Discard changes?")) {
        $(SELECTORS.rightColumn).empty().append(originalContent);
        $(SELECTORS.rightColumn).removeClass("collapsed");
      }
    });

    editForm.find("#back-to-notes").on("click", () => {
      $(SELECTORS.rightColumn).empty().append(originalContent);
      $(SELECTORS.rightColumn).removeClass("collapsed");
    });

    $(SELECTORS.rightColumn).append(editForm);
  },
};

/* ============================================ */
/* === MODULE: SOURCE ITEM INTERACTIONS === */
/* ============================================ */
const SourceItemInteractions = {
  init: function () {
    this.setupSourceTitles();
    this.setupNoteTitles();

    // Set up event listeners
    $(document)
      .on("click", SELECTORS.sourceItem, this.handleSourceItemClick.bind(this))
      .on("click", this.handleDocumentClick.bind(this));

    // Update titles when the document is fully loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.updateSourceTitles();
        this.updateNoteTitles();
      });
    } else {
      this.updateSourceTitles();
      this.updateNoteTitles();
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

    // Update note item tooltips
    document
      .querySelectorAll("#right-column .note-item .truncate")
      .forEach((span) => {
        const title = span.textContent.trim();
        if (title) {
          span.setAttribute("data-title", title);
        }
      });
  },

  setupNoteTitles: function () {
    // Initial setup for note titles
    this.updateNoteTitles();

    // Set up MutationObserver for dynamically added note items
    const notesList = document.querySelector("#right-column .px-5.py-3");
    if (notesList) {
      const observer = new MutationObserver(() => {
        this.updateNoteTitles();
      });
      observer.observe(notesList, { childList: true, subtree: true });
    }
  },

  updateNoteTitles: function () {
    // Update tooltips for note items
    document
      .querySelectorAll("#right-column .note-item .font-medium.truncate")
      .forEach((div) => {
        const title = div.textContent.trim();
        if (title) {
          div.setAttribute("data-title", title);
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
/* === MODULE: NOTE ITEM INTERACTIONS === */
/* ============================================ */
const NoteItemInteractions = {
  init: function () {
    $(document)
      .on("click", SELECTORS.noteItem, this.handleNoteItemClick.bind(this))
      .on("click", this.handleDocumentClick.bind(this));
  },

  handleNoteItemClick: function (e) {
    if (
      $(e.target).closest(
        `${SELECTORS.notesMenuDropdown}, ${SELECTORS.noteMenuToggle}`
      ).length
    ) {
      return;
    }

    const $noteItem = $(e.currentTarget);
    $noteItem.toggleClass("active").siblings().removeClass("active");

    if ($noteItem.hasClass("active")) {
      $noteItem.find(".note-icon").css("opacity", "0");
      $noteItem.find(".note-menu-toggle").css("opacity", "1");
    } else {
      $noteItem.find(".note-icon").css("opacity", "1");
      $noteItem.find(".note-menu-toggle").css("opacity", "0");
      $noteItem.find(SELECTORS.notesMenuDropdown).addClass("hidden");
    }
  },

  handleDocumentClick: function (e) {
    if (
      !$(e.target).closest(
        `${SELECTORS.notesMenuDropdown}, ${SELECTORS.noteMenuToggle}`
      ).length
    ) {
      $(SELECTORS.noteItem)
        .removeClass("active")
        .find(".note-icon")
        .css("opacity", "1")
        .end()
        .find(".note-menu-toggle")
        .css("opacity", "0")
        .end()
        .find(SELECTORS.notesMenuDropdown)
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
        <div class="max-w-[80%] bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl rounded-br-none shadow relative group">
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
              <button class="text-xs text-gray-300 hover:text-white text-sm flex items-center add-to-note-btn opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-slate-600">
                <i class="fas fa-plus-circle mr-1.5 text-base"></i> Add to note
              </button>
              <button class="text-xs text-gray-300 hover:text-white text-sm flex items-center copy-message-btn opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-slate-600">
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
const LeftColumnChat = {
  init: function() {
    this.bindEvents();
  },

  bindEvents: function() {
    const leftChatInput = document.getElementById('left-chat-input');
    const leftSendButton = document.getElementById('left-send-message');

    if (leftChatInput && leftSendButton) {
      leftChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      leftSendButton.addEventListener('click', () => this.handleSendMessage());
    }
  },

  handleSendMessage: function() {
    const input = document.getElementById('left-chat-input');
    const message = input.value.trim();
    
    if (message) {
      // Here you would typically send the message to your backend
      console.log('Left column chat message:', message);
      
      // Clear input
      input.value = '';
      
      // Focus back on input
      input.focus();
    }
  }
};

/* ============================================ */
/* === MODULE: WIZARD CHAT === */
/* ============================================ */
const WizardChat = {
  init: function () {
    this.$form = $("#wizard-chat-form");
    this.$input = $("#wizard-message-input");
    this.$sendBtn = $("#wizard-send-btn");
    this.$messagesContainer = $("#wizard-chat-messages");
    this.$welcomeMessage = $("#wizard-welcome-message");

    this.bindEvents();
  },

  bindEvents: function () {
    // Handle form submission
    this.$form.on("submit", this.handleSubmit.bind(this));

    // Handle input events to enable/disable send button
    this.$input.on("input", this.handleInput.bind(this));

    // Handle Enter/Shift+Enter for sending/new line
    this.$input.on("keydown", this.handleKeydown.bind(this));
  },

  handleSubmit: function (e) {
    e.preventDefault();
    this.sendMessage();
  },

  handleInput: function () {
    const hasText = this.$input.val().trim() !== "";
    this.$sendBtn.prop("disabled", !hasText);
  },

  handleKeydown: function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  },

  sendMessage: function () {
    const message = this.$input.val().trim();
    if (!message) return;

    // Add user message to chat
    this.addMessage("user", message);

    // Clear input and disable send button
    this.$input.val("");
    this.$sendBtn.prop("disabled", true);

    // Show typing indicator
    this.showTypingIndicator();

    // Simulate AI response after a delay
    setTimeout(() => {
      this.hideTypingIndicator();
      this.generateAIResponse(message);
    }, 1000);
  },

  addMessage: function (type, content) {
    // Delegate to CanvasChat's addMessage if available
    if (typeof CanvasChat !== "undefined" && CanvasChat.addMessage) {
      CanvasChat.addMessage(type, content);
    } else {
      // Fallback implementation if CanvasChat is not available
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const $messages = this.$messagesContainer || $("#wizard-chat-messages");

      const messageHtml = `
        <div class="chat-message ${type}-message flex mb-4">
          <div class="flex-shrink-0 mr-3">
            <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              ${
                type === "user"
                  ? '<i class="fas fa-user text-slate-300"></i>'
                  : '<i class="fas fa-robot text-blue-400"></i>'
              }
            </div>
          </div>
          <div class="flex-1">
            <div class="bg-slate-700 px-4 py-2 rounded-lg inline-block">
              <div class="message-content">${content}</div>
              <div class="text-xs text-slate-400 mt-1">${time}</div>
            </div>
          </div>
        </div>
      `;

      $messages.append(messageHtml);
      this.scrollToBottom();
    }
  },

  showTypingIndicator: function () {
    const $typing = $("#typing-indicator");
    if ($typing.length) {
      $typing.removeClass("hidden");
      this.scrollToBottom();
    }
  },

  hideTypingIndicator: function () {
    const $typing = $("#typing-indicator");
    if ($typing.length) {
      $typing.addClass("hidden");
    }
  },

  generateAIResponse: function (userMessage) {
    // Simulate AI response after a delay
    const responses = [
      `I've analyzed your input about "${userMessage}". How can I assist you further?`,
      `That's an interesting point about "${userMessage}". What would you like to know more about?`,
      `I can help you explore "${userMessage}" in more detail. What specific aspect interests you?`,
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];

    setTimeout(() => {
      this.hideTypingIndicator();
      this.addMessage("assistant", response);
    }, 1500);
  },

  scrollToBottom: function () {
    const $messages = this.$messagesContainer || $("#wizard-chat-messages");
    if ($messages.length) {
      $messages.scrollTop($messages[0].scrollHeight);
    }
  },

  initJumpToBottom: function () {
    const $chatContainer = $("#wizard-chat-messages");
    const $jumpToBottom = $("#wizard-jump-to-bottom");

    if (!$chatContainer.length || !$jumpToBottom.length) return;

    let isScrolling = false;

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = $chatContainer[0];
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;

      if (!isAtBottom && !isScrolling) {
        $jumpToBottom.removeClass("opacity-0").addClass("opacity-100");
      } else {
        $jumpToBottom.addClass("opacity-0");
      }
    };

    $chatContainer.on("scroll", checkScroll);

    $jumpToBottom.on("click", () => {
      isScrolling = true;
      $chatContainer.animate(
        { scrollTop: $chatContainer[0].scrollHeight },
        300,
        () => {
          isScrolling = false;
          checkScroll();
        }
      );
    });

    // Initial check
    setTimeout(checkScroll, 500);
  },
};

/* ============================================ */
/* === MODULE: CANVAS CHAT === */
/* ============================================ */
const CanvasChat = {
  init: function () {
    this.$form = $("#canvas-chat-form");
    this.$input = $("#canvas-message-input");
    this.$sendBtn = $("#canvas-send-btn");
    this.$messagesContainer = $("#canvas-chat-messages");
    this.$welcomeMessage = $("#canvas-welcome-message");
    this.$chatContainer = $("#canvas-chat-messages-container");

    this.bindEvents();
    this.initJumpToBottom();
  },

  bindEvents: function () {
    // Handle form submission
    this.$form.on("submit", this.handleSubmit.bind(this));

    // Handle input events to enable/disable send button
    this.$input.on("input", this.handleInput.bind(this));

    // Handle Enter/Shift+Enter for sending/new line
    this.$input.on("keydown", this.handleKeydown.bind(this));
  },

  handleSubmit: function (e) {
    e.preventDefault();
    this.sendMessage();
  },

  handleInput: function () {
    const hasText = this.$input.val().trim() !== "";
    this.$sendBtn.prop("disabled", !hasText);
  },

  handleKeydown: function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  },

  sendMessage: function () {
    const message = this.$input.val().trim();
    if (!message) return;

    // Add user message to chat
    this.addMessage("user", message);

    // Clear input and disable send button
    this.$input.val("");
    this.$sendBtn.prop("disabled", true);

    // Show typing indicator
    this.showTypingIndicator();

    // Simulate AI response after a delay
    setTimeout(() => {
      this.hideTypingIndicator();
      this.generateAIResponse(message);
    }, 1000);
  },

  addMessage: function (type, content) {
    // Hide welcome message when first message is sent
    if (this.$welcomeMessage.is(":visible")) {
      this.$welcomeMessage.hide();
    }

    const isUser = type === "user";

    if (isUser) {
      // User message styling (bubble on the right)
      const message = $(`
        <div class="flex justify-end mb-4 px-2">
          <div class="max-w-[80%] bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl rounded-br-none shadow relative group">
            <div class="text-white text-sm">${content}</div>
            <div class="text-xs text-gray-300 text-right">${Utils.formatTime()}</div>
          </div>
        </div>
      `);
      this.$chatContainer.append(message);
    } else {
      // AI message styling (full width with copy button)
      const message = $(`
        <div class="w-full px-4 py-2 group">
          <div class="text-white text-sm">${content}</div>
          <div class="flex justify-between items-center mt-2">
            <div class="text-xs text-gray-300">${Utils.formatTime()}</div>
            <button
              class="text-xs text-gray-300 hover:text-white flex items-center copy-message-btn opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
              data-message="${content.replace(/"/g, '"')}">
              <i class="fas fa-copy mr-1"></i> Copy
            </button>
          </div>
        </div>
      `);
      this.$chatContainer.append(message);
    }

    this.scrollToBottom();
  },

  showTypingIndicator: function () {
    const typingIndicator = $(`
      <div class="typing-indicator flex justify-start mb-4 px-2">
        <div class="max-w-[80%] bg-gray-800 rounded-xl rounded-bl-none px-4 py-2">
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
            <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>
    `);

    this.$chatContainer.append(typingIndicator);
    this.scrollToBottom();

    this.typingIndicator = typingIndicator;
  },

  hideTypingIndicator: function () {
    if (this.typingIndicator) {
      this.typingIndicator.remove();
      this.typingIndicator = null;
    }
  },

  generateAIResponse: function (userMessage) {
    // Simple response generation - you can replace this with an actual API call
    const responses = [
      `I understand you're interested in "${userMessage}". How can I help you explore this topic further?`,
      `That's an interesting topic! What specific aspect of "${userMessage}" would you like to discuss?`,
      `I can help you with "${userMessage}". Would you like me to find more information or help you analyze it?`,
      `"${userMessage}" is a great topic! What would you like to know more about it?`,
      `I can see you're interested in "${userMessage}". Let me know how I can assist you with this.`,
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    this.addMessage("ai", randomResponse);
  },

  scrollToBottom: function () {
    this.$messagesContainer[0].scrollTo({
      top: this.$messagesContainer[0].scrollHeight,
      behavior: "smooth",
    });
  },

  initJumpToBottom: function () {
    const chatMessages = document.getElementById("canvas-chat-messages");
    const jumpBtn = document.getElementById("canvas-jump-to-bottom-btn");

    if (chatMessages && jumpBtn) {
      function atBottom() {
        // 2px tolerance for floating point errors
        return (
          chatMessages.scrollHeight -
            chatMessages.scrollTop -
            chatMessages.clientHeight <
          2
        );
      }

      function toggleJumpBtn() {
        if (!atBottom()) {
          jumpBtn.classList.add("opacity-100", "pointer-events-auto");
          jumpBtn.classList.remove("opacity-0", "pointer-events-none");
        } else {
          jumpBtn.classList.remove("opacity-100", "pointer-events-auto");
          jumpBtn.classList.add("opacity-0", "pointer-events-none");
        }
      }

      chatMessages.addEventListener("scroll", toggleJumpBtn);

      // Initial check
      setTimeout(toggleJumpBtn, 500);

      jumpBtn.addEventListener("click", function () {
        chatMessages.scrollTo({
          top: chatMessages.scrollHeight,
          behavior: "smooth",
        });
      });

      // Handle new messages
      const observer = new MutationObserver(() => {
        // Only auto-scroll if already at bottom
        if (atBottom()) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        setTimeout(toggleJumpBtn, 100);
      });

      observer.observe(chatMessages, { childList: true, subtree: true });
    }
  },
};

/* ============================================ */
/* === MODULE: WIZARD SOURCES === */
/* ============================================ */
const WizardSources = {
  init: function () {
    this.setupEventListeners();
  },

  setupEventListeners: function () {
    // Handle refresh button click
    $(document).on("click", "#wizard-refresh-sources", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.syncSourcesToWizard();
    });

    // Also sync when the wizard modal is opened
    $(document).on("click", '[data-modal-target="open-wizard-modal"]', () => {
      setTimeout(() => {
        this.syncSourcesToWizard();
      }, 100);
    });
  },

  syncSourcesToWizard: function () {
    // Get only sources that are not currently loading (don't have the loading spinner icon)
    const $leftColumnSources = $(".source-list .source-item").filter(
      function () {
        return $(this).find(".fa-arrows-rotate").length === 0;
      }
    );

    const $wizardSourceView = $("#wizard-sources-view");
    const $wizardSourceList = $("#wizard-sources-list");
    const $sourceDetailsView = $("#wizard-source-details");
    const $backButton = $("#wizard-back-to-sources");
    const $refreshButton = $("#wizard-refresh-sources");

    // Reset view to sources list
    $wizardSourceView.removeClass("hidden");
    $sourceDetailsView.addClass("hidden");
    $backButton.addClass("hidden");
    $refreshButton.removeClass("hidden");

    // Clear existing content
    $wizardSourceView.empty();

    if ($leftColumnSources.length === 0) {
      // Show no sources message
      $wizardSourceView.html(`
        <div class="p-4 text-center text-gray-400">
          <i class="fas fa-folder-open text-2xl mb-2"></i>
          <p class="text-sm">No loaded sources available</p>
          <p class="text-xs text-gray-500 mt-1">Some sources may still be loading</p>
        </div>
      `);
      return;
    }

    // Create a container for the sources list
    const $sourcesContainer = $('<div class="space-y-1"></div>');

    // Clone and add each source to the wizard section
    $leftColumnSources.each((index, element) => {
      const $source = $(element).clone();
      const sourceTitle = $source.find(".truncate").text() || "Untitled Source";
      const sourceIcon =
        $source.find(".source-icon").attr("class") || "fas fa-file";

      // Clean up the cloned element
      $source
        .removeClass("source-item hover:bg-slate-700")
        .addClass("hover:bg-slate-700/50")
        .find('input[type="checkbox"]')
        .remove();

      // Remove any existing click handlers and loading indicators
      $source.off("click").find(".fa-arrows-rotate").parent().remove();

      // Add click handler for selection
      $source.on("click", (e) => {
        e.stopPropagation();
        // Use a class without forward slash for selection
        $sourcesContainer
          .find('[class*="bg-slate-700"]')
          .removeClass("bg-slate-700/50");
        $source.addClass("bg-slate-700/50");

        // Show source details
        this.showSourceDetails({
          title: sourceTitle,
          icon: sourceIcon,
          // Mock data - in a real app, this would come from your data source
          summary: `This is a detailed summary of ${sourceTitle}. It includes key information and insights from the document.`,
          topics: ["Methodology", "Analysis", "Research", "Data Collection"],
          content: [
            `This is a preview of the content from ${sourceTitle}.`,
            "The document contains valuable information about the subject matter.",
            "The document is formatted in a way that is easy to read and understand.",
            "The document is formatted in a way that is easy to read and understand.",
            "The document is formatted in a way that is easy to read and understand.",
            "Key points and details are presented in a clear and organized manner.",
            "Key points and details are presented in a clear and organized manner.",
            "Key points and details are presented in a clear and organized manner.",
            "Key points and details are presented in a clear and organized manner.",
            "The document is formatted in a way that is easy to read and understand.",
            "The document is formatted in a way that is easy to read and understand.",
            "The document is formatted in a way that is easy to read and understand.",
            "The document is formatted in a way that is easy to read and understand.",
          ],
        });
      });

      $sourcesContainer.append($source);
    });

    $wizardSourceView.append($sourcesContainer);

    // Initialize with first source selected if available
    const $firstSource = $sourcesContainer.find("> div:first-child");
    if ($firstSource.length) {
      $firstSource.trigger("click");
    }
  },

  showSourceDetails: function (sourceData) {
    const $sourceDetails = $("#wizard-source-details");
    const $sourcesView = $("#wizard-sources-view");
    const $backButton = $("#wizard-back-to-sources");
    const $refreshButton = $("#wizard-refresh-sources");

    // Update source details
    $("#wizard-source-title").text(sourceData.title);
    $("#wizard-source-summary").text(sourceData.summary);

    // Update topics
    const $topicsContainer = $("#wizard-source-topics").empty();
    sourceData.topics.forEach((topic) => {
      $topicsContainer.append(`
        <span class="source-topic-tag hover:bg-sky-600 cursor-pointer transition-colors">
          ${topic}
        </span>
      `);
    });

    // Update content
    const $contentContainer = $("#wizard-source-content").empty();
    sourceData.content.forEach((paragraph) => {
      $contentContainer.append(`<p>${paragraph}</p>`);
    });

    // Switch to details view
    $sourcesView.addClass("hidden");
    $sourceDetails.removeClass("hidden");
    $backButton.removeClass("hidden");
    $refreshButton.addClass("hidden");
  },
};

// Handle back button in wizard
$(document).on("click", "#wizard-back-to-sources", function (e) {
  e.preventDefault();
  const $wizardSourceView = $("#wizard-sources-view");
  const $sourceDetails = $("#wizard-source-details");
  const $backButton = $("#wizard-back-to-sources");
  const $refreshButton = $("#wizard-refresh-sources");

  $wizardSourceView.removeClass("hidden");
  $sourceDetails.addClass("hidden");
  $backButton.addClass("hidden");
  $refreshButton.removeClass("hidden");
});

/* ============================================ */
/* === DOCUMENT READY === */
/* ============================================ */
$(document).ready(function () {
  Preloader.init();
  ChatSuggestions.init();
  MobileTabs.init();
  ColumnToggles.init();
  DropdownMenus.init();
  SourceActions.init();
  NoteActions.init();
  SourceItemInteractions.init();
  NoteItemInteractions.init();
  ChatFunctionality.init();
  MessageActions.init();
  Utilities.init();
  ModalHandling.init();
  WizardSources.init();
  WizardChat.init();
  LeftColumnChat.init();
});

// More CHAT SUGGESTIONS Javascript

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const suggestionsContainer = document.getElementById("chat-suggestions");
  const leftChevron = document.getElementById("chat-suggestions-left");
  const rightChevron = document.getElementById("chat-suggestions-right");
  let scrollStep = 200; // Default scroll step in pixels, adjustable based on design

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
      const newScroll = Math.max(0, currentScroll - scrollStep); // Prevent negative scroll
      suggestionsContainer.scrollTo({ left: newScroll, behavior: "smooth" });
    } else if (direction === "right") {
      const newScroll = Math.min(maxScroll, currentScroll + scrollStep); // Prevent over-scroll
      suggestionsContainer.scrollTo({ left: newScroll, behavior: "smooth" });
    }
  };

  // Add event listeners for chevron buttons
  leftChevron.addEventListener("click", () => scrollSuggestions("left"));
  rightChevron.addEventListener("click", () => scrollSuggestions("right"));

  // Optional: Update chevron visibility based on scroll position
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

  // Initial visibility check and add scroll event listener for dynamic updates
  updateChevronVisibility();
  suggestionsContainer.addEventListener("scroll", updateChevronVisibility);
});

// ================================

(function () {
  const chatMessages = document.getElementById("chat-messages");
  const jumpBtn = document.getElementById("jump-to-bottom-btn");

  function atBottom() {
    // 2px tolerance for floating point errors
    return (
      chatMessages.scrollHeight -
        chatMessages.scrollTop -
        chatMessages.clientHeight <
      2
    );
  }

  function toggleJumpBtn() {
    if (!atBottom()) {
      jumpBtn.classList.add("show");
    } else {
      jumpBtn.classList.remove("show");
    }
  }

  chatMessages.addEventListener("scroll", toggleJumpBtn);

  // Initial check
  setTimeout(toggleJumpBtn, 500);

  // Handle AI text chat form submission in right sidebar
  const aiChatForm = document.getElementById("ai-text-chat-form-right");
  const aiTextInput = document.getElementById("ai-text-input-right");
  const aiSendButton = document.getElementById("ai-text-send-right");

  // Function to handle sending the message
  function handleSendMessage() {
    const message = aiTextInput.value.trim();

    if (message) {
      console.log("AI Action Submitted:", message);

      // Clear the input field
      aiTextInput.value = "";

      // Reset the textarea height
      aiTextInput.style.height = "auto";

      // Focus back to the input
      aiTextInput.focus();
    }
  }

  if (aiChatForm && aiTextInput && aiSendButton) {
    // Handle form submission (when pressing Enter)
    aiChatForm.addEventListener("submit", function (e) {
      e.preventDefault();
      handleSendMessage();
    });

    // Handle send button click
    aiSendButton.addEventListener("click", function () {
      handleSendMessage();
    });

    // Handle Enter key submission
    aiTextInput.addEventListener("keydown", function (e) {
      // Check if Enter was pressed and Ctrl/Cmd is not pressed
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); // Prevent line break
        handleSendMessage();
      }
    });

    // Auto-resize textarea as user types
    aiTextInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";

      // Enable/disable send button based on input
      aiSendButton.disabled = this.value.trim() === "";
    });

    // Initial button state
    aiSendButton.disabled = aiTextInput.value.trim() === "";
  }

  jumpBtn.addEventListener("click", function () {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: "smooth",
    });
  });

  // Also handle new messages (MutationObserver)
  const observer = new MutationObserver(() => {
    setTimeout(toggleJumpBtn, 100);
  });
  observer.observe(chatMessages, { childList: true, subtree: true });
})();
