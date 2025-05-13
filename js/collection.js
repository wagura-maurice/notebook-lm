/* ============================================ */
/* === DOCUMENT READY === */
/* ============================================ */
$(document).ready(function () {
  // Initialize preloader
  setTimeout(function () {
    $("#preloader").fadeOut();
  }, 1000);

  // Initialize mobile tabs
  setupMobileTabs();

  // Initialize modals
  initModals();
});

/* ============================================ */
/* === COLUMN TOGGLES === */
/* ============================================ */
$(document).ready(function () {
  // Collapse left column
  $("#collapse-left").on("click", function () {
    $("#left-column").toggleClass("collapsed");
    $("#left-column .source-menu").addClass("hidden");
  });

  // Collapse right column
  $("#collapse-right").on("click", function () {
    $("#right-column").toggleClass("collapsed");
    $("#right-column .note-menu").addClass("hidden");
  });

  // Expand left column
  $("#expand-left").on("click", function () {
    $("#left-column").removeClass("collapsed");
  });

  // Expand right column
  $("#expand-right").on("click", function () {
    $("#right-column").removeClass("collapsed");
  });

  // Expand/collapse all columns
  $("#expand-middle").on("click", function () {
    const isLeftCollapsed = $("#left-column").hasClass("collapsed");
    const isRightCollapsed = $("#right-column").hasClass("collapsed");

    if (isLeftCollapsed || isRightCollapsed) {
      $("#left-column").removeClass("collapsed");
      $("#right-column").removeClass("collapsed");
      $(this).html('<i class="fas fa-compress-alt"></i>');
    } else {
      $("#left-column").addClass("collapsed");
      $("#right-column").addClass("collapsed");
      $(this).html('<i class="fas fa-expand-alt"></i>');
    }
  });
});

/* ============================================ */
/* === DROPDOWN MENUS === */
/* ============================================ */
$(document).ready(function () {
  // Source menu dropdown with positioning
  $(document).on("click", ".source-menu-toggle", function (e) {
    e.stopPropagation();
    e.preventDefault();

    // Hide all other dropdowns
    $(".source-menu").removeClass("show").addClass("hidden");

    // Get source item position
    const sourceItem = $(this).closest(".source-item");
    const sourceItemRect = sourceItem[0].getBoundingClientRect();

    // Get dropdown menu
    const dropdown = sourceItem.find(".source-menu");

    // Position dropdown
    dropdown.css({
      top: sourceItemRect.top + 40,
      left: sourceItemRect.right - 160,
      position: "fixed",
    });

    // Toggle current dropdown
    dropdown.toggleClass("hidden show");
  });

  // Note menu dropdown
  $(document).on("click", ".note-menu-toggle", function (e) {
    e.stopPropagation();
    $(this).closest(".note-item").find(".note-menu").toggleClass("hidden show");
  });

  // Notes menu dropdown
  $("#notes-menu-button").on("click", function (e) {
    e.stopPropagation();
    $("#notes-menu-dropdown").toggleClass("hidden");
  });

  // Close dropdowns when clicking outside
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".source-menu").length &&
      !$(e.target).closest(".source-menu-toggle").length &&
      !$(e.target).closest(".note-menu").length &&
      !$(e.target).closest(".note-menu-toggle").length
    ) {
      $(".source-menu, .note-menu").removeClass("show").addClass("hidden");
    }
  });
});

/* ============================================ */
/* === SOURCE ACTIONS === */
/* ============================================ */
$(document).ready(function () {
  // Add source button
  $("#addSourceBtn").on("click", function () {
    $("#add-source-modal").removeClass("hidden");
  });

  // Save new source
  $('#add-source-modal button:contains("Add Source")').on("click", function () {
    const sourceText = $("#source-input").val().trim();

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
      $("#source-input").val("");
      $("#add-source-modal").addClass("hidden");
    }
  });

  // Discover source button
  $("#discoverSourceBtn").on("click", function () {
    $("#discover-source-modal").removeClass("hidden");
  });

  // Handle discover search (placeholder functionality)
  $('#discover-source-modal button:contains("Search")').on(
    "click",
    function () {
      const searchText = $("#discover-input").val().trim();
      if (searchText !== "") {
        console.log("Searching for sources: " + searchText);
        // Placeholder: Add logic to fetch and display sources
        $("#discover-input").val("");
        $("#discover-source-modal").addClass("hidden");
      }
    }
  );

  // Rename source
  $(document).on("click", '.source-menu a:contains("Rename")', function (e) {
    e.preventDefault();
    const sourceItem = $(this).closest(".source-item");
    const currentName = sourceItem.find(".truncate").text();

    $("#rename-input").val(currentName);
    $("#rename-modal").removeClass("hidden");
    $("#rename-modal").data("source-item", sourceItem);
  });

  // Save renamed source
  $('#rename-modal button:contains("Save")').on("click", function () {
    const newName = $("#rename-input").val();
    const sourceItem = $("#rename-modal").data("source-item");

    if (newName && sourceItem) {
      sourceItem.find(".truncate").text(newName);
    }
    $("#rename-modal").addClass("hidden");
  });

  // Delete source (show confirmation modal)
  $(document).on("click", '.source-menu a:contains("Delete")', function (e) {
    e.preventDefault();
    const sourceItem = $(this).closest(".source-item");
    $("#delete-source-modal").removeClass("hidden");
    $("#delete-source-modal").data("source-item", sourceItem);
  });

  // Confirm source deletion
  $('#delete-source-modal button:contains("Delete")').on("click", function () {
    const sourceItem = $("#delete-source-modal").data("source-item");
    if (sourceItem) {
      sourceItem.remove();
    }
    $("#delete-source-modal").addClass("hidden");
  });
});

/* ============================================ */
/* === NOTE ACTIONS === */
/* ============================================ */
$(document).ready(function () {
  // Add note button
  $("#add-note-btn").on("click", function () {
    $("#add-note-modal").removeClass("hidden");
  });

  // Save new note
  $('#add-note-modal button:contains("Save Note")').on("click", function () {
    const noteText = $("#note-input").val();

    if (noteText.trim() !== "") {
      const newNote = $(`
        <div class="relative flex items-start p-2 hover:bg-slate-700 rounded cursor-pointer transition-colors note-item group mb-2">
          <div class="relative mr-3 w-6 h-6 mt-1 flex-shrink-0">
            <i class="fas fa-sticky-note text-sky-400 note-icon transition-opacity duration-200"></i>
            <i class="fas fa-ellipsis-horizontal absolute inset-0 text-white opacity-0 note-menu-toggle transition-opacity duration-200 flex items-center justify-center"></i>
          </div>
          <div class="flex-1 min-w-0 overflow-hidden">
            <div class="font-medium truncate">${noteText.substring(0, 30)}${
        noteText.length > 30 ? "..." : ""
      }</div>
            <div class="text-xs text-slate-400 truncate">${noteText.substring(
              0,
              50
            )}${noteText.length > 50 ? "..." : ""}</div>
          </div>
          <div class="note-menu hidden absolute right-3 top-10 bg-slate-800 rounded-md shadow-lg py-1 w-48 border border-slate-700 z-30">
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
      $("#note-input").val("");
      $("#add-note-modal").addClass("hidden");
    }
  });

  // Delete note (show confirmation modal)
  $(document).on("click", '.note-menu a:contains("Delete")', function (e) {
    e.preventDefault();
    const noteItem = $(this).closest(".note-item");
    $("#delete-note-modal").removeClass("hidden");
    $("#delete-note-modal").data("note-item", noteItem);
  });

  // Confirm note deletion
  $('#delete-note-modal button:contains("Delete")').on("click", function () {
    const noteItem = $("#delete-note-modal").data("note-item");
    if (noteItem) {
      noteItem.remove();
    }
    $("#delete-note-modal").addClass("hidden");
  });
});

/* ============================================ */
/* === NOTE ITEM INTERACTIONS === */
/* ============================================ */
$(document).ready(function () {
  // Handle note item hover/click
  $(document).on("mouseenter click", ".note-item", function (e) {
    $(".note-menu.show").not($(this).find(".note-menu")).removeClass("show");
    $(this).addClass("active");

    if (
      $(e.target).closest(".note-menu-toggle").length ||
      e.type === "mouseenter"
    ) {
      $(this).find(".note-menu").addClass("show");
    }
  });

  // Handle mouse leave
  $(document).on("mouseleave", ".note-item", function () {
    if (!$(this).hasClass("keep-open")) {
      $(this).removeClass("active");
      $(this).find(".note-menu").removeClass("show");
    }
  });

  // Keep menu open when interacting
  $(document).on("mouseenter", ".note-menu", function () {
    $(this).closest(".note-item").addClass("keep-open");
  });

  $(document).on("mouseleave", ".note-menu", function () {
    $(this).closest(".note-item").removeClass("keep-open");
    $(this).removeClass("show");
  });

  // Close menus when clicking elsewhere
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".note-item").length) {
      $(".note-menu").removeClass("show");
      $(".note-item").removeClass("active keep-open");
    }
  });

  // Handle menu option clicks
  $(document).on("click", ".menu-option", function (e) {
    e.preventDefault();
    const action = $(this).text().trim();
    console.log(action + " clicked");
    if (action !== "Delete" && action !== "Delete note") {
      $(".note-menu").removeClass("show");
    }
  });
});

/* ============================================ */
/* === CHAT FUNCTIONALITY === */
/* ============================================ */
$(document).ready(function () {
  // Send chat message
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
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
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

  // Send message with Enter key
  $("#chat-input").on("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $("#send-message").click();
    }
  });
});

/* ============================================ */
/* === MESSAGE ACTIONS === */
/* ============================================ */
$(document).ready(function () {
  // Add to note button
  $(document).on("click", ".add-to-note-btn", function () {
    const messageContent = $(this)
      .closest(".bg-blue-500")
      .find(".text-white")
      .text();
    console.log("Adding to note:", messageContent);
    alert("Message added to notes!");
  });

  // Copy message button
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
});

/* ============================================ */
/* === UTILITY FUNCTIONS === */
/* ============================================ */
$(document).ready(function () {
  // Select all sources checkbox
  $("#select-all").on("change", function () {
    $(".source-checkbox").prop("checked", $(this).prop("checked"));
  });

  // Processing button functionality
  $(document).on("click", ".processing-btn", function (e) {
    e.stopPropagation();
    const btn = $(this);
    const icon = btn.find("i");

    if (btn.data("processing") === "false") {
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
        }
      }, 1000);
    }
  });
});

/* ============================================ */
/* === MOBILE TABS === */
/* ============================================ */
function setupMobileTabs() {
  // Set default active tab (middle column - Chat)
  const defaultTab = "middle-column";
  let activeTab = defaultTab;

  $(`.tab-button[data-tab="${defaultTab}"]`).addClass("active");
  $(`#${defaultTab}`).addClass("active").removeClass("inactive");

  // Hide other columns on mobile
  if (window.innerWidth < 1024) {
    $(".mobile-tab-content").not(`#${defaultTab}`).addClass("inactive");
  }

  // Tab click handler
  $(".tab-button").on("click", function () {
    const tabId = $(this).data("tab");

    if (tabId !== activeTab) {
      // Deactivate current tab
      $(`.tab-button[data-tab="${activeTab}"]`).removeClass("active");
      $(`#${activeTab}`).removeClass("active").addClass("inactive");

      // Activate new tab
      $(this).addClass("active");
      $(`#${tabId}`).addClass("active").removeClass("inactive");
      activeTab = tabId;

      // Scroll to top of new tab content
      $(`#${tabId}`)[0].scrollTop = 0;
    }
  });

  // Handle window resize
  $(window).on("resize", function () {
    if (window.innerWidth >= 1024) {
      $(".mobile-tab-content").removeClass("inactive").addClass("active");
      $(".tab-button").removeClass("active");
      activeTab = null; // Reset active tab on desktop
    } else {
      const currentTab = $(".tab-button.active").data("tab") || defaultTab;
      $(".mobile-tab-content").removeClass("active").addClass("inactive");
      $(`#${currentTab}`).addClass("active").removeClass("inactive");
      activeTab = currentTab;
    }
  });
}

/* ============================================ */
/* === MODAL HANDLING === */
/* ============================================ */
function initModals() {
  // Close modal with close button
  $(document).on("click", ".modal-close", function (e) {
    e.preventDefault();
    $(this).closest(".modal").addClass("hidden");
  });

  // Close modal when clicking outside
  $(document).on("click", ".modal", function (e) {
    if (e.target === this) {
      $(this).addClass("hidden");
    }
  });

  // Close modal with Escape key
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      $(".modal").addClass("hidden");
    }
  });

  // Prevent closing when clicking inside modal
  $(".modal > div").on("click", function (e) {
    e.stopPropagation();
  });
}
