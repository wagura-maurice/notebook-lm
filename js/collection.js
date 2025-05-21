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

    $dropdown.css({
      top: triggerOffset.top + triggerHeight,
      left: triggerOffset.left,
      position: "fixed",
      "min-width": $trigger.outerWidth() + 140,
    });
  },
};

/* ============================================ */
/* === MODULE: SOURCE ACTIONS === */
/* ============================================ */
const SourceActions = {
  init: function () {
    this.bindEvents();
    this.setupDiscoverSources();
  },

  bindEvents: function () {
    // Modal triggers
    $("#shareCollectionBtn, #share-collection-btn").on(
      "click",
      this.openShareCollectionModal.bind(this)
    );

    $("#add-source-btn, #addSourceBtn, #addSourceIcon").on(
      "click",
      this.openAddSourceModal.bind(this)
    );

    $("#discoverSourceBtn, #discoverSourceIcon").on(
      "click",
      this.openDiscoverModal.bind(this)
    );

    // Modal navigation
    $("#source-modal-back").on("click", this.showPickerStep.bind(this));
    $("#website-source-card").on("click", () => this.showStep("website"));
    $("#youtube-source-card").on("click", () => this.showStep("youtube"));
    $("#paste-source-card").on("click", () => this.showStep("paste"));

    // Input validation
    $("#website-url-input, #youtube-url-input, #paste-text-input").on(
      "input",
      this.validateInputs.bind(this)
    );

    // Insert actions
    $("#insert-website-btn").on("click", this.insertWebsite.bind(this));
    $("#insert-youtube-btn").on("click", this.insertYoutube.bind(this));
    $("#insert-paste-btn").on("click", this.insertPaste.bind(this));

    // File upload
    $("#file-upload-btn").on("click", () => $("#file-upload").click());
    $("#file-upload").on("change", this.handleFileUpload.bind(this));

    // Modal close
    $("#source-modal-footer .modal-close").on(
      "click",
      this.closeAddSourceModal.bind(this)
    );

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
    $('#add-source-modal button:contains("Add Source")').on(
      "click",
      this.addSourceFromModal.bind(this)
    );
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
    const steps = {
      picker: {
        selector: "#source-modal-step-picker",
        title: "Add Source",
      },
      website: {
        selector: "#source-modal-step-website",
        title: "Paste URL",
        showBack: true,
      },
      youtube: {
        selector: "#source-modal-step-youtube",
        title: "YouTube URL",
        showBack: true,
      },
      paste: {
        selector: "#source-modal-step-paste",
        title: "Paste copied text",
        showBack: true,
      },
    };

    $(".source-modal-step").addClass("hidden");
    $(steps[step].selector).removeClass("hidden");
    $("#source-modal-title").text(steps[step].title);
    $("#source-modal-back").toggleClass("hidden", !steps[step].showBack);
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
    $(
      "#website-url-input, #youtube-url-input, #paste-text-input, #source-input"
    ).val("");
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
    let selectedSources = new Set();

    $(document)
      .on(
        "click",
        "#discover-source-modal .discover-add-remove-btn",
        function () {
          const $btn = $(this);
          const $item = $btn.closest(".p-3");
          const sourceId = $item.index();

          if ($item.hasClass("selected")) {
            $item.removeClass("selected bg-blue-50 dark:bg-blue-900");
            $btn
              .removeClass("remove-btn bg-red-600 hover:bg-red-700 text-white")
              .addClass(
                "add-btn text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              )
              .text("Add");
            selectedSources.delete(sourceId);
          } else {
            $item.addClass("selected bg-blue-50 dark:bg-blue-900");
            $btn
              .removeClass(
                "add-btn text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              )
              .addClass("remove-btn bg-red-600 hover:bg-red-700 text-white")
              .text("Remove");
            selectedSources.add(sourceId);
          }
          this.updateAddSelectedCount();
        }.bind(this)
      )

      .on(
        "click",
        '#discover-source-modal .discover-source-modal-close, #discover-source-modal button:contains("Cancel")',
        function () {
          $("#discover-source-modal").addClass("hidden");
          selectedSources.clear();
          $("#discover-source-modal .p-3.selected").removeClass(
            "selected bg-blue-50 dark:bg-blue-900"
          );
          $("#discover-source-modal .p-3 button").text("Add");
          this.updateAddSelectedCount();
          $('#discover-source-modal input[type="text"]').val("");
          $("#discover-source-modal .p-3").show();
        }.bind(this)
      )

      .on(
        "click",
        '#discover-source-modal button:contains("Add Selected")',
        function () {
          if (selectedSources.size > 0) {
            alert(`${selectedSources.size} source(s) added!`);
            $("#discover-source-modal").addClass("hidden");
            selectedSources.clear();
            this.updateAddSelectedCount();
          }
        }.bind(this)
      )

      .on(
        "click",
        '#discover-source-modal button:contains("Search")',
        function () {
          const searchText = $("#discover-input").val().trim();
          if (searchText !== "") {
            console.log("Searching for sources: " + searchText);
            $("#discover-input").val("");
            $("#discover-source-modal").addClass("hidden");
          }
        }.bind(this)
      )

      .on("input", '#discover-source-modal input[type="text"]', function () {
        const query = $(this).val().toLowerCase();
        $("#discover-source-modal .p-3").each(function () {
          const text = $(this).text().toLowerCase();
          $(this).toggle(text.includes(query));
        });
      });
  },

  updateAddSelectedCount: function () {
    const count = $("#discover-source-modal .p-3.selected").length;
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
      <div class="view-source-content flex flex-col h-full">
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700 sm:mt-0 mt-4">
          <h3 class="text-lg font-semibold">View Source</h3>
          <button id="back-to-sources" class="text-sky-400 hover:text-sky-300">
            <i class="fas fa-arrow-left mr-2"></i>Back
          </button>
        </div>
        <div class="flex-1 flex flex-col px-4 py-3 overflow-hidden">
          <h3 class="font-medium text-sky-400 mb-4">${title}</h3>
          
          <div class="source-content-section">
            <h4 class="text-sm font-semibold text-slate-300 mb-2">Summary</h4>
            <p class="text-sm text-slate-400">This document provides a comprehensive overview of key concepts and methodologies in the field. It covers fundamental principles and practical applications while exploring various aspects of the subject matter.</p>
          </div>
          
          <div class="source-content-section">
            <h4 class="text-sm font-semibold text-slate-300 mb-2">Key Topics</h4>
            <div class="source-topics-list">
              <span class="source-topic-tag">Methodology</span>
              <span class="source-topic-tag">Analysis</span>
              <span class="source-topic-tag">Research</span>
              <span class="source-topic-tag">Data Collection</span>
              <span class="source-topic-tag">Results</span>
            </div>
          </div>
          
          <div class="source-content-section flex-1 overflow-hidden">
            <h4 class="text-sm font-semibold text-slate-300 mb-2">Content</h4>
            <div class="source-content-area flex-1 overflow-y-auto text-slate-300 space-y-4 pr-2" style="max-height: calc(100vh - 400px);">
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

    $(document)
      .on(
        "click",
        '#notes-menu-dropdown a:contains("Delete")',
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
      <div class="edit-note-content flex flex-col h-full">
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700 sm:mt-0 mt-4">
          <h3 class="text-lg font-semibold">Edit Note</h3>
          <button id="back-to-notes" class="text-sky-400 hover:text-sky-300">
            <i class="fas fa-arrow-left mr-2"></i>Back
          </button>
        </div>
        <div class="flex-1 flex flex-col px-4 py-3 overflow-hidden">
          <input
            type="text"
            id="edit-note-title"
            value="${title}"
            class="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="Note Title"
          />
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
          <div class="mt-4 flex justify-center">
            <div class="inline-flex">
              <button
                id="cancel-note-changes"
                class="px-5 py-2 rounded-l-full text-gray-400 bg-slate-700 hover:bg-slate-600 border border-r-0 border-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors"
                aria-label="Cancel editing note"
              >
                Cancel
              </button>
              <button
                id="save-note-changes"
                class="px-5 py-2 rounded-r-full bg-accent-blue text-white hover:bg-sky-500 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors"
                aria-label="Save note changes"
              >
                Save
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
    $(document)
      .on("click", SELECTORS.sourceItem, this.handleSourceItemClick.bind(this))
      .on("click", this.handleDocumentClick.bind(this));
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
  },

  sendMessage: function () {
    const messageText = $(SELECTORS.chatInput).val().trim();
    if (messageText !== "") {
      const userMessage = $(`
        <div class="flex justify-end">
          <div class="max-w-[80%] bg-purple-500 px-4 py-2 rounded-xl rounded-br-none shadow">
            <div class="text-white">${messageText}</div>
            <div class="text-xs text-gray-300 text-right">${Utils.formatTime()}</div>
          </div>
        </div>
      `);

      $(SELECTORS.chatMessages).append(userMessage);
      $(SELECTORS.chatInput).val("");
      Utils.scrollToBottom($(SELECTORS.chatMessages)[0]);

      setTimeout(() => {
        const aiResponse = $(`
          <div class="flex justify-start">
            <div class="max-w-[80%] bg-blue-500 px-4 py-2 rounded-xl rounded-bl-none shadow relative group">
              <div class="text-white">I received your message about "${messageText.substring(
                0,
                20
              )}..."</div>
              <div class="flex justify-between items-center mt-2">
                <div class="text-xs text-gray-300">${Utils.formatTime()}</div>
                <button class="text-gray-300 hover:text-white text-sm flex items-center add-to-note-btn">
                  <i class="fas fa-plus-circle mr-1"></i> Add to note
                </button>
                <button class="text-gray-300 hover:text-white text-sm flex items-center copy-message-btn">
                  <i class="fas fa-copy mr-1"></i> Copy
                </button>
              </div>
            </div>
          </div>
        `);

        $(SELECTORS.chatMessages).append(aiResponse);
        Utils.scrollToBottom($(SELECTORS.chatMessages)[0]);
      }, 1000);
    }
  },

  handleKeydown: function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $(SELECTORS.sendMessage).click();
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
    const messageContent = $(e.currentTarget)
      .closest(".bg-blue-500")
      .find(".text-white")
      .text();
    console.log("Adding to note:", messageContent);
    alert("Message added to notes!");
  },

  copyMessage: function (e) {
    const $button = $(e.currentTarget);
    const messageContent = $button
      .closest(".bg-blue-500")
      .find(".text-white")
      .text();
    navigator.clipboard.writeText(messageContent).then(() => {
      $button.html('<i class="fas fa-check mr-1"></i> Copied');
      setTimeout(() => {
        $button.html('<i class="fas fa-copy mr-1"></i> Copy');
      }, 2000);
    });
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
