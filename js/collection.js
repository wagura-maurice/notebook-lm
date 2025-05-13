/* ==================== */
/* === DOCUMENT READY === */
/* ==================== */
$(document).ready(function () {
  // Hide preloader after 1 second
  setTimeout(function () {
    $("#preloader").fadeOut();
  }, 1000);

  // Initialize mobile tabs
  setupMobileTabs();

  // Initialize modals
  initModals();

  /* ==================== */
  /* === COLUMN TOGGLES === */
  /* ==================== */
  // Left column collapse/expand
  $("#collapse-left").on("click", function () {
    $("#left-column").toggleClass("collapsed");
    $("#left-column .source-menu").addClass("hidden");
  });

  // Right column collapse/expand
  $("#collapse-right").on("click", function () {
    $("#right-column").toggleClass("collapsed");
    $("#right-column .note-menu").addClass("hidden");
  });

  // Left column expand
  $("#expand-left").on("click", function () {
    $("#left-column").removeClass("collapsed");
  });

  // Right column expand
  $("#expand-right").on("click", function () {
    $("#right-column").removeClass("collapsed");
  });

  // Middle column expand/collapse all
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

  /* ==================== */
  /* === DROPDOWN MENUS === */
  /* ==================== */
  // Source menu dropdown
  $(document).on("click", ".source-menu-toggle", function (e) {
    e.stopPropagation();
    e.preventDefault();

    // Hide all other dropdowns first
    $(".source-menu").removeClass("show").addClass("hidden");

    // Get the source item position
    const sourceItem = $(this).closest(".source-item");
    const dropdown = sourceItem.find(".source-menu");

    // Position and toggle current dropdown
    dropdown
      .css({
        top: sourceItem.offset().top + 40,
        left: sourceItem.offset().left + sourceItem.width() - 160,
        position: "absolute",
      })
      .toggleClass("hidden show");
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

  // Close dropdowns when clicking elsewhere
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".source-menu").length &&
      !$(e.target).closest(".source-menu-toggle").length
    ) {
      $(".source-menu").removeClass("show").addClass("hidden");
    }

    if (
      !$(e.target).closest(".note-menu").length &&
      !$(e.target).closest(".note-menu-toggle").length
    ) {
      $(".note-menu").removeClass("show").addClass("hidden");
    }
  });

  /* ==================== */
  /* === SOURCE ACTIONS === */
  /* ==================== */
  // Rename source
  $(document).on("click", '.source-menu a:contains("Rename")', function (e) {
    e.preventDefault();
    const sourceItem = $(this).closest(".source-item");
    const currentName = sourceItem.find(".truncate").text();

    $("#rename-input").val(currentName);
    $("#rename-modal").removeClass("hidden");
    $("#rename-modal").data("source-item", sourceItem);
  });

  // Save rename
  $('#rename-modal button:contains("Save")').on("click", function () {
    const newName = $("#rename-input").val();
    const sourceItem = $("#rename-modal").data("source-item");

    if (newName && sourceItem) {
      sourceItem.find(".truncate").text(newName);
    }
    $("#rename-modal").addClass("hidden");
  });

  // Delete source
  $(document).on("click", '.source-menu a:contains("Delete")', function (e) {
    e.preventDefault();
    $(this).closest(".source-item").remove();
  });

  /* ==================== */
  /* === NOTE ACTIONS === */
  /* ==================== */
  // Delete note
  $(document).on("click", '.note-menu a:contains("Delete")', function (e) {
    e.preventDefault();
    $(this).closest(".note-item").remove();
  });

  // Add note button
  $("#add-note-btn").on("click", function () {
    $("#add-note-modal").removeClass("hidden");
  });

  // Save new note
  $('#add-note-modal button:contains("Save Note")').on("click", function () {
    const noteText = $("#note-input").val();

    if (noteText.trim() !== "") {
      const newNote = $(`
        <div class="flex items-start p-2 hover:bg-slate-700 rounded cursor-pointer transition-colors note-item group">
          <div class="relative mr-3 w-6 h-6 mt-1">
            <i class="fas fa-sticky-note text-sky-400 group-hover:opacity-0 transition-opacity note-icon"></i>
            <i class="fas fa-ellipsis-horizontal absolute inset-0 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center note-menu-toggle"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">${noteText.substring(0, 30)}${
        noteText.length > 30 ? "..." : ""
      }</div>
            <div class="text-xs text-slate-400 truncate">${noteText.substring(
              0,
              50
            )}${noteText.length > 50 ? "..." : ""}</div>
          </div>
          <div class="note-menu hidden absolute right-3 mt-8 bg-slate-800 rounded shadow-lg py-1 w-48 border border-slate-700 z-20">
            <a href="#" class="flex items-center px-3 py-2 text-sm text-white hover:bg-slate-700">
              <i class="fas fa-plus-circle mr-2"></i> Add to sources
            </a>
            <a href="#" class="flex items-center px-3 py-2 text-sm text-white hover:bg-slate-700">
              <i class="fas fa-trash-alt mr-2"></i> Delete note
            </a>
          </div>
        </div>
      `);

      $("#right-column .expanded-content > div:last-child").prepend(newNote);
      $("#note-input").val("");
      $("#add-note-modal").addClass("hidden");
    }
  });

  /* ==================== */
  /* === CHAT FUNCTIONALITY === */
  /* ==================== */
  // Send chat message
  $("#send-message").on("click", function () {
    const messageText = $("#chat-input").val().trim();

    if (messageText !== "") {
      // Add user message
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

      // Simulate AI response
      setTimeout(function () {
        const aiResponse = $(`
          <div class="flex justify-start">
            <div class="max-w-[80%] bg-blue-500 px-4 py-2 rounded-xl rounded-bl-none shadow">
              <div class="text-white">I received your message about "${messageText.substring(
                0,
                20
              )}..."</div>
              <div class="text-xs text-blue-100 text-right mt-1">
                ${new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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

  /* ==================== */
  /* === UTILITY FUNCTIONS === */
  /* ==================== */
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
        void icon[0].offsetWidth; // Trigger reflow
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

  /* ==================== */
  /* === NOTE ITEM INTERACTIONS === */
  /* ==================== */
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

  // Keep menu open when interacting with it
  $(document).on("mouseenter", ".note-menu", function () {
    $(this).closest(".note-item").addClass("keep-open");
  });

  $(document).on("mouseleave", ".note-menu", function () {
    $(this).closest(".note-item").removeClass("keep-open");
    $(this).removeClass("show");
  });

  /* ==================== */
  /* === MESSAGE ACTIONS === */
  /* ==================== */
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

/* ==================== */
/* === MODAL HANDLING === */
/* ==================== */
function initModals() {
  // Close modal when clicking close button
  $(document).on("click", ".modal-close", function (e) {
    e.preventDefault();
    $(this).closest(".modal").addClass("hidden");
  });

  // Close modal when clicking outside content
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

  // Prevent modal from closing when clicking inside modal content
  $(".modal > div").on("click", function (e) {
    e.stopPropagation();
  });
}

/* ==================== */
/* === MOBILE TABS === */
/* ==================== */
function setupMobileTabs() {
  // Set default active tab (middle column - Chat)
  const defaultTab = "middle-column";
  $(`.tab-button[data-tab="${defaultTab}"]`).addClass("active");
  $(`#${defaultTab}`).addClass("active");

  // Hide other columns on mobile by default
  if (window.innerWidth < 1024) {
    $(".mobile-tab-content").not(`#${defaultTab}`).removeClass("active");
  }

  // Tab click handler
  $(".tab-button").on("click", function () {
    const tabId = $(this).data("tab");
    $(".tab-button").removeClass("active");
    $(this).addClass("active");
    $(".mobile-tab-content").removeClass("active");
    $(`#${tabId}`).addClass("active");
  });

  // Handle window resize
  $(window).on("resize", function () {
    if (window.innerWidth >= 1024) {
      $(".mobile-tab-content").addClass("active");
    } else {
      const activeTab = $(".tab-button.active").data("tab");
      $(".mobile-tab-content").removeClass("active");
      $(`#${activeTab}`).addClass("active");
    }
  });
}
