$(document).ready(function () {
  // Hide preloader when page loads
  setTimeout(function () {
    $("#preloader").fadeOut();
  }, 1000);

  // Mobile tab navigation
  $(".tab-button").on("click", function () {
    const tabId = $(this).data("tab");

    // Update active tab
    $(".tab-button").removeClass("active");
    $(this).addClass("active");

    // Show corresponding content
    $(".mobile-tab-content").removeClass("active");
    $(`#${tabId}`).addClass("active");
  });

  // Toggle collapse state for left column
  $("#collapse-left").on("click", function () {
    $("#left-column .expanded-content").toggleClass("hidden");
    $("#left-column .collapsed-content").toggleClass("hidden");
  });

  // Toggle collapse state for right column
  $("#collapse-right").on("click", function () {
    $("#right-column .expanded-content").toggleClass("hidden");
    $("#right-column .collapsed-content").toggleClass("hidden");
  });

  // Expand buttons in collapsed view
  $("#expand-left").on("click", function () {
    $("#left-column .expanded-content").removeClass("hidden");
    $("#left-column .collapsed-content").addClass("hidden");
  });

  $("#expand-right").on("click", function () {
    $("#right-column .expanded-content").removeClass("hidden");
    $("#right-column .collapsed-content").addClass("hidden");
  });

  // Middle column expand functionality
  $("#expand-middle").on("click", function () {
    const middleCol = $("#middle-column");
    middleCol.toggleClass("expanded");

    // Collapse both side columns when middle is expanded
    if (middleCol.hasClass("expanded")) {
      $("#left-column").addClass("hidden");
      $("#right-column").addClass("hidden");
    } else {
      $("#left-column").removeClass("hidden");
      $("#right-column").removeClass("hidden");
    }
  });

  // Source menu dropdown
  $(document).on("click", ".source-menu-toggle", function (e) {
    e.stopPropagation();
    $(this)
      .closest(".source-item")
      .find(".dropdown-menu")
      .toggleClass("hidden");
  });

  // Note menu dropdown
  $(document).on("click", ".note-menu-toggle", function (e) {
    e.stopPropagation();
    $(this).closest(".note-item").find(".note-menu").toggleClass("hidden");
  });

  // Notes menu dropdown
  $("#notes-menu-button").on("click", function (e) {
    e.stopPropagation();
    $("#notes-menu-dropdown").toggleClass("hidden");
  });

  // Rename source functionality
  $(document).on("click", '.dropdown-menu a:contains("Rename")', function (e) {
    e.preventDefault();
    const sourceItem = $(this).closest(".source-item");
    const currentName = sourceItem.find(".truncate").text();

    $("#rename-input").val(currentName);
    $("#rename-modal").removeClass("hidden");

    // Store reference to the source item being renamed
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
  $(document).on("click", '.dropdown-menu a:contains("Delete")', function (e) {
    e.preventDefault();
    $(this).closest(".source-item").remove();
  });

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

      // Scroll to bottom
      $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);

      // Simulate AI response after a delay
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

  // Allow sending message with Enter key (but allow Shift+Enter for new lines)
  $("#chat-input").on("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $("#send-message").click();
    }
  });

  // Close modals
  $(".modal-close, .modal").on("click", function (e) {
    if ($(e.target).is(".modal") || $(e.target).is(".modal-close")) {
      $(".modal").addClass("hidden");
    }
  });

  // Close dropdowns when clicking outside
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".dropdown-menu").length &&
      !$(e.target).closest('[class*="menu-toggle"]').length
    ) {
      $(".dropdown-menu, .note-menu").addClass("hidden");
    }
  });

  // Select all sources checkbox
  $("#select-all").on("change", function () {
    $(".source-checkbox").prop("checked", $(this).prop("checked"));
  });
});
