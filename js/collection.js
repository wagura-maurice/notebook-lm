/* ============================================ */
/* === DOCUMENT READY === */
/* ============================================ */
/* Main entry point for application initialization */
$(document).ready(function () {
  // Initialize all components
  initPreloader();
  setupMobileTabs();
  initColumnToggles();
  initDropdownMenus();
  initSourceActions();
  initNoteActions();
  initSourceItemInteractions();
  initNoteItemInteractions();
  initChatFunctionality();
  initMessageActions();
  initUtilities();
  initModals();
});

/* ============================================ */
/* === PRELOADER === */
/* ============================================ */
/* Handles the preloader fade-out animation on app load */
function initPreloader() {
  setTimeout(function () {
    $("#preloader").fadeOut();
  }, 1000);
}

/* ============================================ */
/* === MOBILE TABS === */
/* ============================================ */
/* Sets up mobile tab navigation for Sources, Chat, and Studio */
function setupMobileTabs() {
  const defaultTab = "middle-column";
  let activeTab = defaultTab;

  $(`.tab-button[data-tab="${defaultTab}"]`).addClass("active");
  $(`#${defaultTab}`).addClass("active").removeClass("inactive");

  if (window.innerWidth < 1024) {
    $(".mobile-tab-content").not(`#${defaultTab}`).addClass("inactive");
  }

  $(".tab-button").on("click", function () {
    const tabId = $(this).data("tab");

    if (tabId !== activeTab) {
      $(`.tab-button[data-tab="${activeTab}"]`).removeClass("active");
      $(`#${activeTab}`).removeClass("active").addClass("inactive");

      $(this).addClass("active");
      $(`#${tabId}`).addClass("active").removeClass("inactive");
      activeTab = tabId;

      $(`#${tabId}`)[0].scrollTop = 0;
    }
  });

  $(window).on("resize", function () {
    if (window.innerWidth >= 1024) {
      $(".mobile-tab-content").removeClass("inactive").addClass("active");
      $(".tab-button").removeClass("active");
      activeTab = null;
    } else {
      const currentTab = $(".tab-button.active").data("tab") || defaultTab;
      $(".mobile-tab-content").removeClass("active").addClass("inactive");
      $(`#${currentTab}`).addClass("active").removeClass("inactive");
      activeTab = currentTab;
    }
  });
}

/* ============================================ */
/* === COLUMN TOGGLES === */
/* ============================================ */
/* Handles collapse/expand functionality for columns */
// Function to check if any special panels are active
function arePanelsActive() {
  return (
    $(".view-source-content").length > 0 || $(".edit-note-content").length > 0
  );
}

function updateMiddleColumnState() {
  const middleColumn = $("#middle-column");
  const leftColumn = $("#left-column");
  const rightColumn = $("#right-column");

  // Check if panels are active and update middle column accordingly
  if (arePanelsActive()) {
    middleColumn.addClass("panel-active");
    middleColumn.removeClass("expanded contracted");
  } else {
    middleColumn.removeClass("panel-active");
  }

  // Update middle column expansion based on side columns
  if (leftColumn.hasClass("collapsed") || rightColumn.hasClass("collapsed")) {
    middleColumn.addClass("expanded");
  } else {
    middleColumn.removeClass("expanded");
  }
}

function initColumnToggles() {
  // Left column collapse/expand
  $("#collapse-left").on("click", function () {
    const leftColumn = $("#left-column");
    leftColumn.toggleClass("collapsed");
    leftColumn.find(".expanded-content").toggleClass("hidden");
    leftColumn.find(".collapsed-content").toggleClass("hidden");
    leftColumn.find(".source-menu-dropdown").addClass("hidden");
    updateMiddleColumnState();
  });

  // Right column collapse/expand
  $("#collapse-right").on("click", function () {
    const rightColumn = $("#right-column");
    rightColumn.toggleClass("collapsed");
    rightColumn.find(".expanded-content").toggleClass("hidden");
    rightColumn.find(".collapsed-content").toggleClass("hidden");
    rightColumn.find(".notes-menu-dropdown").addClass("hidden");
    updateMiddleColumnState();
  });

  // Left column expand from collapsed state
  $("#expand-left").on("click", function () {
    const leftColumn = $("#left-column");
    leftColumn.removeClass("collapsed");
    leftColumn.find(".expanded-content").removeClass("hidden");
    leftColumn.find(".collapsed-content").addClass("hidden");
    updateMiddleColumnState();
  });

  // Right column expand from collapsed state
  $("#expand-right").on("click", function () {
    const rightColumn = $("#right-column");
    rightColumn.removeClass("collapsed");
    rightColumn.find(".expanded-content").removeClass("hidden");
    rightColumn.find(".collapsed-content").addClass("hidden");
    updateMiddleColumnState();
  });

  // Middle column expand/contract
  $("#expand-middle").on("click", function () {
    const middleColumn = $("#middle-column");
    const leftColumn = $("#left-column");
    const rightColumn = $("#right-column");

    if (
      !leftColumn.hasClass("collapsed") &&
      !rightColumn.hasClass("collapsed")
    ) {
      // If side columns are expanded, collapse them
      leftColumn
        .addClass("collapsed")
        .find(".expanded-content")
        .addClass("hidden");
      leftColumn.find(".collapsed-content").removeClass("hidden");
      rightColumn
        .addClass("collapsed")
        .find(".expanded-content")
        .addClass("hidden");
      rightColumn.find(".collapsed-content").removeClass("hidden");
      middleColumn.addClass("expanded");
      $(this).html('<i class="fas fa-compress-alt"></i>');
    } else {
      // If any side column is collapsed, expand them
      leftColumn
        .removeClass("collapsed")
        .find(".expanded-content")
        .removeClass("hidden");
      leftColumn.find(".collapsed-content").addClass("hidden");
      rightColumn
        .removeClass("collapsed")
        .find(".expanded-content")
        .removeClass("hidden");
      rightColumn.find(".collapsed-content").addClass("hidden");
      middleColumn.removeClass("expanded");
      $(this).html('<i class="fas fa-expand-alt"></i>');
    }

    updateMiddleColumnState();
  });

  // Middle column manual resize
  $("#middle-column").on("dblclick", function () {
    // Check if any special panels are active
    if (!arePanelsActive()) {
      $(this).toggleClass("contracted");
    }
  });

  // Initial state update
  updateMiddleColumnState();
}

/* ============================================ */
/* === DROPDOWN MENUS === */
/* ============================================ */
/* Manages dropdown menu behavior for sources, notes, and studio */
function initDropdownMenus() {
  $(document).on("click", ".source-menu-toggle", function (e) {
    e.stopPropagation();
    e.preventDefault();

    const sourceItem = $(this).closest(".source-item");
    const dropdown = sourceItem.find(".source-menu-dropdown");
    const isVisible = !dropdown.hasClass("hidden");

    // Hide all dropdowns first
    $(".source-menu-dropdown, .notes-menu-dropdown")
      .removeClass("show")
      .addClass("hidden");

    if (!isVisible) {
      const triggerOffset = $(this).offset();
      const triggerHeight = $(this).outerHeight();

      dropdown.css({
        top: triggerOffset.top + triggerHeight,
        left: triggerOffset.left,
        position: "fixed",
        "min-width": $(this).outerWidth() + 140,
      });

      dropdown.removeClass("hidden").addClass("show");
    }
  });

  $(document).on("click", ".note-menu-toggle", function (e) {
    e.stopPropagation();
    e.preventDefault();

    const noteItem = $(this).closest(".note-item");
    const dropdown = noteItem.find(".notes-menu-dropdown");
    const isVisible = !dropdown.hasClass("hidden");

    // Hide all dropdowns first
    $(".source-menu-dropdown, .notes-menu-dropdown")
      .removeClass("show")
      .addClass("hidden");

    if (!isVisible) {
      const triggerOffset = $(this).offset();
      const triggerHeight = $(this).outerHeight();

      dropdown.css({
        top: triggerOffset.top + triggerHeight,
        left: triggerOffset.left,
        position: "fixed",
      });

      dropdown.removeClass("hidden").addClass("show");
    }
  });

  $("#notes-menu-button").on("click", function (e) {
    e.stopPropagation();
    $("#notes-menu-dropdown").toggleClass("hidden");
  });

  $(document).on("click", function (e) {
    if (
      !$(e.target).closest("#notes-menu-dropdown").length &&
      !$(e.target).closest("#notes-menu-button").length
    ) {
      $("#notes-menu-dropdown").addClass("hidden");
    }

    if (
      !$(e.target).closest(".source-menu-dropdown").length &&
      !$(e.target).closest(".source-menu-toggle").length &&
      !$(e.target).closest(".notes-menu-dropdown").length &&
      !$(e.target).closest(".note-menu-toggle").length
    ) {
      $(".source-menu-dropdown, .notes-menu-dropdown")
        .removeClass("show")
        .addClass("hidden");
    }
  });
}

/* ============================================ */
/* === SOURCE ACTIONS === */
/* ============================================ */
/* Handles adding, discovering, renaming, and deleting sources */
function initSourceActions() {
  $("#addSourceBtn, #addSourceIcon").on("click", function () {
    $("#add-source-modal").removeClass("hidden");
  });

  $('#add-source-modal button:contains("Add Source")').on("click", function () {
    const sourceInput = $("#source-input");
    if (!sourceInput.length) {
      console.error("Element #source-input not found in DOM");
      return;
    }

    const sourceText = sourceInput.val().trim();
    if (sourceText !== "") {
      const newSource = $(`
        <li class="group py-2 px-3 hover:bg-slate-700 rounded cursor-pointer flex items-center relative source-item">
          <div class="relative mr-3 w-6 h-6">
            <i class="fas fa-file-alt text-green-400 group-hover:opacity-0 transition-opacity source-icon"></i>
            <i class="fas fa-ellipsis-vertical absolute inset-0 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center source-menu-toggle"></i>
          </div>
          <span class="flex-1 truncate">${sourceText.substring(0, 30)}${
        sourceText.length > 30 ? "..." : ""
      }</span>
          <input type="checkbox" class="ml-2 source-checkbox" />
          <div class="source-menu hidden absolute right-3 top-10 bg-slate-800 rounded-md shadow-lg py-1 w-48 border border-slate-700 z-30">
            <a href="#" class="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 menu-option">
              <i class="fas fa-pencil-alt mr-2"></i> Rename
            </a>
            <a href="#" class="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700 menu-option">
              <i class="fas fa-trash-alt mr-2"></i> Delete
            </a>
          </div>
        </li>
      `);

      $(".source-list").prepend(newSource);
      sourceInput.val("");
      $("#add-source-modal").addClass("hidden");
    }
  });

  $("#discoverSourceBtn, #discoverSourceIcon").on("click", function () {
    $("#discover-source-modal").removeClass("hidden");
  });

  $('#discover-source-modal button:contains("Search")').on(
    "click",
    function () {
      const searchText = $("#discover-input").val().trim();
      if (searchText !== "") {
        console.log("Searching for sources: " + searchText);
        $("#discover-input").val("");
        $("#discover-source-modal").addClass("hidden");
      }
    }
  );

  $(document).on(
    "click",
    '.source-menu-dropdown a:contains("Rename")',
    function (e) {
      e.preventDefault();
      const sourceItem = $(this).closest(".source-item");
      const currentName = sourceItem.find(".truncate").text();

      $("#rename-input").val(currentName);
      $("#rename-modal").removeClass("hidden");
      $("#rename-modal").data("source-item", sourceItem);
    }
  );

  $('#rename-modal button:contains("Save")').on("click", function () {
    const newName = $("#rename-input").val();
    const sourceItem = $("#rename-modal").data("source-item");

    if (newName && sourceItem) {
      sourceItem.find(".truncate").text(newName);
    }
    $("#rename-modal").addClass("hidden");
  });

  $(document).on(
    "click",
    '.source-menu-dropdown a:contains("Delete")',
    function (e) {
      e.preventDefault();
      const sourceItem = $(this).closest(".source-item");
      $("#delete-source-modal").removeClass("hidden");
      $("#delete-source-modal").data("source-item", sourceItem);
    }
  );

  $('#delete-source-modal button:contains("Delete")').on("click", function () {
    const sourceItem = $("#delete-source-modal").data("source-item");
    if (sourceItem) {
      sourceItem.remove();
    }
    $("#delete-source-modal").addClass("hidden");
  });
}

/* ============================================ */
/* === NOTE ACTIONS === */
/* ============================================ */
/* Handles adding and deleting notes */
function initNoteActions() {
  $("#add-note-btn, #add-note-icon").on("click", function () {
    $("#add-note-modal").removeClass("hidden");

    // Initialize WYSIWYG editor when modal opens
    $(".wysiwyg-btn").css({
      background: "transparent",
      color: "#94a3b8",
      border: "none",
      padding: "4px 8px",
      margin: "0 2px",
      "border-radius": "4px",
      cursor: "pointer",
    });

    $(".wysiwyg-btn").hover(
      function () {
        $(this).css("background-color", "#334155");
      },
      function () {
        $(this).css("background-color", "transparent");
      }
    );

    $(".wysiwyg-btn")
      .on("mousedown", function () {
        $(this).css("background-color", "#1e293b");
      })
      .on("mouseup mouseleave", function () {
        $(this).css("background-color", "transparent");
      });

    // Initialize toolbar buttons
    $(".wysiwyg-btn").on("click", function () {
      const command = $(this).data("command");
      const value = $(this).data("value");
      const textarea = $("#note-content");

      if (command === "createLink") {
        const url = prompt("Enter the link URL:");
        if (url) {
          const text = textarea.val();
          const start = textarea[0].selectionStart;
          const end = textarea[0].selectionEnd;
          const before = text.substring(0, start);
          const selected = text.substring(start, end);
          const after = text.substring(end, text.length);
          textarea.val(before + `[${selected}](${url})` + after);
        }
      } else if (command === "formatBlock") {
        const text = textarea.val();
        const start = textarea[0].selectionStart;
        const end = textarea[0].selectionEnd;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end, text.length);

        switch (value) {
          case "h1":
            textarea.val(before + `# ${selected}\n` + after);
            break;
          case "h2":
            textarea.val(before + `## ${selected}\n` + after);
            break;
          case "h3":
            textarea.val(before + `### ${selected}\n` + after);
            break;
        }
      } else if (command === "bold") {
        const text = textarea.val();
        const start = textarea[0].selectionStart;
        const end = textarea[0].selectionEnd;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end, text.length);
        textarea.val(before + `**${selected}**` + after);
      } else if (command === "italic") {
        const text = textarea.val();
        const start = textarea[0].selectionStart;
        const end = textarea[0].selectionEnd;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end, text.length);
        textarea.val(before + `*${selected}*` + after);
      } else if (command === "underline") {
        const text = textarea.val();
        const start = textarea[0].selectionStart;
        const end = textarea[0].selectionEnd;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end, text.length);
        textarea.val(before + `__${selected}__` + after);
      } else if (command === "insertUnorderedList") {
        const text = textarea.val();
        const start = textarea[0].selectionStart;
        const end = textarea[0].selectionEnd;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end, text.length);
        textarea.val(before + `* ${selected}\n` + after);
      } else if (command === "insertOrderedList") {
        const text = textarea.val();
        const start = textarea[0].selectionStart;
        const end = textarea[0].selectionEnd;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end, text.length);
        textarea.val(before + `1. ${selected}\n` + after);
      }
      textarea.focus();
    });
  });

  $('#add-note-modal button:contains("Save Note")').on("click", function () {
    const noteTitle = $("#note-title").val();
    const noteContent = $("#note-content").html();

    if (noteTitle.trim() !== "" && noteContent.trim() !== "") {
      const newNote = $(`
        <div class="relative flex items-start p-2 hover:bg-slate-700 rounded cursor-pointer transition-colors note-item group mb-2">
          <div class="relative mr-3 w-6 h-6 mt-1 flex-shrink-0">
            <i class="fas fa-sticky-note text-sky-400 note-icon transition-opacity duration-200"></i>
            <i class="fas fa-ellipsis-vertical absolute inset-0 text-white opacity-0 note-menu-toggle transition-opacity duration-200 flex items-center justify-center"></i>
          </div>
          <div class="flex-1 min-w-0 overflow-hidden">
            <div class="font-medium truncate">${noteTitle}</div>
            <div class="text-xs text-slate-400 truncate">${noteContent.substring(
              0,
              50
            )}${noteContent.length > 50 ? "..." : ""}</div>
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

      $(".note-list-container").prepend(newNote);
      $("#note-title").val("");
      $("#note-content").html("");
      $("#add-note-modal").addClass("hidden");
    }
  });

  $(document).on(
    "click",
    '#notes-menu-dropdown a:contains("Delete")',
    function (e) {
      e.preventDefault();
      const noteItems = $(this).closest(".note-list-container");
      $("#delete-all-notes-modal").removeClass("hidden");
      $("#delete-all-notes-modal").data("note-list-container", noteItems);
    }
  );

  $('#delete-all-notes-modal button:contains("Delete")').on(
    "click",
    function () {
      const noteItems = $("#delete-all-notes-modal").data(
        "note-list-container"
      );
      if (noteItems) {
        noteItems.remove();
      }
      $("#delete-all-notes-modal").addClass("hidden");
    }
  );

  $(document).on(
    "click",
    '.notes-menu-dropdown a:contains("Delete")',
    function (e) {
      e.preventDefault();
      const noteItem = $(this).closest(".note-item");
      $("#delete-note-modal").removeClass("hidden");
      $("#delete-note-modal").data("note-item", noteItem);
    }
  );

  $('#delete-note-modal button:contains("Delete")').on("click", function () {
    const noteItem = $("#delete-note-modal").data("note-item");
    if (noteItem) {
      noteItem.remove();
    }
    $("#delete-note-modal").addClass("hidden");
  });
}

/* ============================================ */
/* === SOURCE ITEM INTERACTIONS === */
/* ============================================ */
/* Manages click, select, and menu actions for source items */
function initSourceItemInteractions() {
  $(document).on("click", ".source-item", function (e) {
    if (
      $(e.target).closest(".source-menu-dropdown").length ||
      $(e.target).hasClass("source-menu-toggle") ||
      $(e.target).closest(".source-menu-toggle").length
    ) {
      return;
    }

    $(".source-item").not(this).removeClass("active");
    $(this).toggleClass("active");

    if ($(this).hasClass("active")) {
      $(this).find(".source-icon").css("opacity", "0");
      $(this).find(".source-menu-toggle").css("opacity", "1");
    } else {
      $(this).find(".source-icon").css("opacity", "1");
      $(this).find(".source-menu-toggle").css("opacity", "0");
      $(this).find(".source-menu-dropdown").addClass("hidden");
    }
  });

  $(document).on("click", ".source-item", function (e) {
    if (
      $(e.target).closest(".source-menu-dropdown").length ||
      $(e.target).hasClass("source-menu-toggle") ||
      $(e.target).closest(".source-menu-toggle").length
    ) {
      return;
    }

    $(".source-item").not(this).removeClass("active");
    $(this).toggleClass("active");

    if ($(this).hasClass("active")) {
      $(this).find(".source-icon").css("opacity", "0");
      $(this).find(".source-menu-toggle").css("opacity", "1");
    } else {
      $(this).find(".source-icon").css("opacity", "1");
      $(this).find(".source-menu-toggle").css("opacity", "0");
    }
  });

  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".source-menu-dropdown").length &&
      !$(e.target).closest(".source-menu-toggle").length
    ) {
      $(".source-menu-dropdown").addClass("hidden");
      $(".source-item")
        .removeClass("active")
        .find(".source-icon")
        .css("opacity", "1")
        .end()
        .find(".source-menu-toggle")
        .css("opacity", "0");
    }
  });

  // Handle Show Source action
  $(document).on(
    "click",
    '.source-menu-dropdown a:contains("Show source")',
    function (e) {
      e.preventDefault();
      const sourceItem = $(this).closest(".source-item");
      const title = sourceItem.find(".font-medium.truncate").text();

      $("#left-column .source-menu-dropdown").addClass("hidden");
      const originalContent = $("#left-column").children().detach();

      const viewForm = $(`
        <div class="view-source-content flex flex-col h-full">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 class="text-lg font-semibold">View Source</h3>
            <button id="back-to-sources" class="text-sky-400 hover:text-sky-300">
              <i class="fas fa-arrow-left mr-2"></i>Back
            </button>
          </div>
          <div class="flex-1 flex flex-col px-4 py-3 overflow-hidden">
            <!-- Title Section -->
            <h3 class="font-medium text-sky-400 mb-4">${title} - Title Name</h3>
            
            <!-- Summary Section -->
            <div class="source-content-section">
              <h4 class="text-sm font-semibold text-slate-300 mb-2">Summary</h4>
              <p class="text-sm text-slate-400">This document provides a comprehensive overview of key concepts and methodologies in the field. It covers fundamental principles and practical applications while exploring various aspects of the subject matter.</p>
            </div>
            
            <!-- Key Topics Section -->
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
            
            <!-- Main Content Area -->
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

      $("#left-column").append(viewForm);

      $("#back-to-sources").on("click", function () {
        $(".view-source-content").remove();
        $("#left-column").append(originalContent);
      });
    }
  );
}

/* ============================================ */
/* === NOTE ITEM INTERACTIONS === */
/* ============================================ */
/* Manages click, edit, and menu actions for note items */
function initNoteItemInteractions() {
  $(document).on("click", ".note-item", function (e) {
    if (
      $(e.target).closest(".notes-menu-dropdown").length ||
      $(e.target).hasClass("note-menu-toggle") ||
      $(e.target).closest(".note-menu-toggle").length
    ) {
      return;
    }

    $(".note-item").not(this).removeClass("active");
    $(this).toggleClass("active");

    if ($(this).hasClass("active")) {
      $(this).find(".note-icon").css("opacity", "0");
      $(this).find(".note-menu-toggle").css("opacity", "1");
    } else {
      $(this).find(".note-icon").css("opacity", "1");
      $(this).find(".note-menu-toggle").css("opacity", "0");
    }
  });

  $(document).on(
    "click",
    '.notes-menu-dropdown a:contains("Show note")',
    function (e) {
      e.preventDefault();
      const noteItem = $(this).closest(".note-item");
      const title = noteItem.find(".font-medium.truncate").text();
      const content = noteItem.find(".text-xs.text-slate-400.truncate").text();

      $("#right-column .notes-menu-dropdown").addClass("hidden");
      const originalContent = $("#right-column").children().detach();

      const editForm = $(`
      <div class="edit-note-content flex flex-col h-full">
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
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

      editForm.find(".wysiwyg-btn").css({
        background: "transparent",
        color: "#94a3b8",
        border: "none",
        padding: "4px 8px",
        margin: "0 2px",
        "border-radius": "4px",
        cursor: "pointer",
      });

      editForm.find(".wysiwyg-btn").hover(
        function () {
          $(this).css("background-color", "#334155");
        },
        function () {
          $(this).css("background-color", "transparent");
        }
      );

      editForm
        .find(".wysiwyg-btn")
        .on("mousedown", function () {
          $(this).css("background-color", "#1e293b");
        })
        .on("mouseup mouseleave", function () {
          $(this).css("background-color", "transparent");
        });

      editForm.find("#save-note-changes").on("click", function () {
        const updatedTitle = $("#edit-note-title").val();
        const updatedContent = $("#edit-note-content").html();
        $("#right-column").empty().append(originalContent);
        $("#right-column").removeClass("collapsed");
      });

      editForm.find("#cancel-note-changes").on("click", function () {
        if (confirm("Discard changes?")) {
          $("#right-column").empty().append(originalContent);
          $("#right-column").removeClass("collapsed");
        }
      });

      $("#right-column").append(editForm);

      $("#back-to-notes").on("click", function () {
        $("#right-column").empty().append(originalContent);
        $("#right-column").removeClass("collapsed");
      });

      editForm.find("#save-note-changes").on("click", function () {
        const newTitle = $("#edit-note-title").val().trim();
        const newContent = $("#edit-note-content").html().trim();

        if (newTitle && newContent) {
          noteItem
            .find(".font-medium.truncate")
            .text(
              newTitle.substring(0, 30) + (newTitle.length > 30 ? "..." : "")
            );
          noteItem
            .find(".text-xs.text-slate-400.truncate")
            .text(
              newContent.substring(0, 50) +
                (newContent.length > 50 ? "..." : "")
            );
        }

        $("#right-column").empty().append(originalContent);
        $("#right-column").removeClass("collapsed");
      });
    }
  );

  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".notes-menu-dropdown").length &&
      !$(e.target).closest(".note-menu-toggle").length
    ) {
      $(".notes-menu-dropdown").addClass("hidden");
    }
  });
}

/* ============================================ */
/* === CHAT FUNCTIONALITY === */
/* ============================================ */
/* Manages sending and receiving chat messages */
function initChatFunctionality() {
  $("#send-message").on("click", function () {
    const messageText = $("#chat-input").val().trim();
    if (messageText !== "") {
      const userMessage = $(`
        <div class="flex justify-end">
          <div class="max-w-[80%] bg-purple-500 px-4 py-2 rounded-xl rounded-br-none shadow">
            <div class="text-white">${messageText}</div>
            <div class="text-xs text-purple-100 text-right mt-1">
              ${new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      `);

      $("#chat-messages").append(userMessage);
      $("#chat-input").val("");
      $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);

      setTimeout(function () {
        const aiResponse = $(`
          <div class="flex justify-start">
            <div class="max-w-[80%] bg-blue-500 px-4 py-2 rounded-xl rounded-bl-none shadow relative group">
              <div class="text-white">I received your message about "${messageText.substring(
                0,
                20
              )}..."</div>
              <div class="flex justify-between items-center mt-2">
                <button class="text-blue-100 hover:text-white text-sm flex items-center add-to-note-btn">
                  <i class="fas fa-plus-circle mr-1"></i> Add to note
                </button>
                <div class="text-xs text-blue-100">${new Date().toLocaleTimeString(
                  [],
                  { hour: "2-digit", minute: "2-digit" }
                )}</div>
                <button class="text-blue-100 hover:text-white text-sm flex items-center copy-message-btn">
                  <i class="fas fa-copy mr-1"></i> Copy
                </button>
              </div>
            </div>
          </div>
        `);

        $("#chat-messages").append(aiResponse);
        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
      }, 1000);
    }
  });

  $("#chat-input").on("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $("#send-message").click();
    }
  });
}

/* ============================================ */
/* === MESSAGE ACTIONS === */
/* ============================================ */
/* Handles actions like adding messages to notes and copying to clipboard */
function initMessageActions() {
  $(document).on("click", ".add-to-note-btn", function () {
    const messageContent = $(this)
      .closest(".bg-blue-500")
      .find(".text-white")
      .text();
    console.log("Adding to note:", messageContent);
    alert("Message added to notes!");
  });

  $(document).on("click", ".copy-message-btn", function () {
    const messageContent = $(this)
      .closest(".bg-blue-500")
      .find(".text-white")
      .text();
    navigator.clipboard.writeText(messageContent).then(
      function () {
        const copyBtn = $(this);
        copyBtn.html('<i class="fas fa-check mr-1"></i> Copied');
        setTimeout(function () {
          copyBtn.html('<i class="fas fa-copy mr-1"></i> Copy');
        }, 2000);
      }.bind(this)
    );
  });
}

/* ============================================ */
/* === UTILITY FUNCTIONS === */
/* ============================================ */
/* Miscellaneous utility functions for checkboxes and processing buttons */
function initUtilities() {
  $("#select-all").on("change", function () {
    $(".source-checkbox").prop("checked", $(this).prop("checked"));
  });

  $(document).on("click", ".processing-btn", function (e) {
    e.stopPropagation();
    const btn = $(this);
    const icon = btn.find("i");

    btn.data("processing", "true");
    btn.addClass("active");

    let spinCount = 0;
    const spinInterval = setInterval(() => {
      icon.css("animation", "none");
      void icon[0].offsetWidth;
      icon.css("animation", "spin 1s linear");
      spinCount++;

      if (spinCount >= 5) {
        clearInterval(spinInterval);
        btn.removeClass("active");
        btn.data("processing", "false");
        alert("Processing complete!");
      }
    }, 1000);
  });
}

/* ============================================ */
/* === MODAL HANDLING === */
/* ============================================ */
/* Manages modal open/close behavior for all modals */
function initModals() {
  $(document).on("click", ".modal-close", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).closest(".modal").addClass("hidden");
  });

  $(document).on("click", ".modal", function (e) {
    if (e.target === this) {
      $(this).addClass("hidden");
    }
  });

  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      $(".modal").addClass("hidden");
    }
  });
}
