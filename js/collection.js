/* ============================================ */
/* === DOCUMENT READY === */
/* ============================================ */
$(document).ready(function () {
  // Fade out the preloader after 1 second
  setTimeout(function () {
    $("#preloader").fadeOut();
  }, 1000);

  // Initialize mobile tab navigation
  setupMobileTabs();

  // Initialize modal functionality
  // Ensure modal handlers are attached after DOM is ready
  $(function () {
    initModals();
  });
});

/* ============================================ */
/* === COLUMN TOGGLES === */
/* ============================================ */
$(document).ready(function () {
  // Toggle collapse/expand for the left column (Sources)
  $("#collapse-left").on("click", function () {
    $("#left-column").toggleClass("collapsed");
    $("#left-column .source-menu").addClass("hidden");
  });

  // Toggle collapse/expand for the right column (Studio)
  $("#collapse-right").on("click", function () {
    $("#right-column").toggleClass("collapsed");
    $("#right-column .note-menu").addClass("hidden");
  });

  // Expand the left column (Sources)
  $("#expand-left").on("click", function () {
    $("#left-column").removeClass("collapsed");
  });

  // Expand the right column (Studio)
  $("#expand-right").on("click", function () {
    $("#right-column").removeClass("collapsed");
  });

  // Expand or collapse all columns based on current state
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
  // Handle source menu dropdown with positioning
  $(document).on("click", ".source-menu-toggle", function (e) {
    // alert("Source menu toggle clicked"); this is for debugging an i see its being triggered
    e.stopPropagation();
    // e.preventDefault();

    // Hide all other source dropdowns
    $(".source-menu").removeClass("show").addClass("hidden");

    // Get the position of the source item
    const sourceItem = $(this).closest(".source-item");
    const sourceItemRect = sourceItem[0].getBoundingClientRect();

    // Get the dropdown menu
    const dropdown = sourceItem.find(".source-menu");

    // Position the dropdown directly below the icon, like note menus
    const triggerOffset = $(this).offset();
    const triggerHeight = $(this).outerHeight();
    dropdown.css({
      top: triggerOffset.top + triggerHeight,
      left: triggerOffset.left,
      position: "fixed",
      "min-width": $(this).outerWidth() + 140, // ensure width is similar to note menu
    });
    // Show only this dropdown
    dropdown.removeClass("hidden").addClass("show");
  });

  // Handle note menu dropdown
  $(document).on("click", ".note-menu-toggle", function (e) {
    e.stopPropagation();
    // Hide all other note dropdowns
    $(".note-menu").removeClass("show").addClass("hidden");
    // Find the current note menu
    const noteItem = $(this).closest(".note-item");
    const dropdown = noteItem.find(".note-menu");
    // Position the dropdown directly below the trigger
    const triggerOffset = $(this).offset();
    const triggerHeight = $(this).outerHeight();
    dropdown.css({
      top: triggerOffset.top + triggerHeight,
      left: triggerOffset.left,
      position: "fixed",
    });
    // Show the dropdown
    dropdown.toggleClass("hidden show");
  });

  // Handle notes menu dropdown
  $("#notes-menu-button").on("click", function (e) {
    e.stopPropagation();
    $("#notes-menu-dropdown").toggleClass("hidden");
  });

  // Hide notes menu dropdown when clicking outside
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest("#notes-menu-dropdown").length &&
      !$(e.target).closest("#notes-menu-button").length
    ) {
      $("#notes-menu-dropdown").addClass("hidden");
    }
  });

  // Close all dropdowns when clicking outside
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
/* $(document).ready(function () {
  // Show the add source modal
  $("#addSourceBtn").on("click", function () {
    $("#add-source-modal").removeClass("hidden");
  });

  // Save a new source
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

  // Show the discover source modal
  $("#discoverSourceBtn").on("click", function () {
    $("#discover-source-modal").removeClass("hidden");
  });

  // Handle discover search action
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

  // Initiate source rename
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

  // Show delete source confirmation
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
}); */
/* ============================================ */
/* === SOURCE ACTIONS === */
/* ============================================ */
$(document).ready(function () {
  // Show the add source modal
  $("#addSourceBtn").on("click", function () {
    $("#add-source-modal").removeClass("hidden");
  });

  $("#addSourceIcon").on("click", function () {
    $("#add-source-modal").removeClass("hidden");
  });

  // Save a new source
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

  // Show the discover source modal
  $("#discoverSourceBtn").on("click", function () {
    $("#discover-source-modal").removeClass("hidden");
  });

  $("#discoverSourceIcon").on("click", function () {
    $("#discover-source-modal").removeClass("hidden");
  });

  // Handle discover search action
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

  // Initiate source rename
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

  // Show delete source confirmation
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
  // Show the add note modal
  $("#add-note-btn").on("click", function () {
    $("#add-note-modal").removeClass("hidden");
  });

  $("#add-note-icon").on("click", function () {
    $("#add-note-modal").removeClass("hidden");
  });

  // Save a new note
  $('#add-note-modal button:contains("Save Note")').on("click", function () {
    const noteText = $("#note-input").val();

    if (noteText.trim() !== "") {
      const newNote = $(`
        <div class="relative flex items-start p-2 hover:bg-slate-700 rounded cursor-pointer transition-colors note-item group mb-2">
          <div class="relative mr-3 w-6 h-6 mt-1 flex-shrink-0">
            <i class="fas fa-sticky-note text-sky-400 note-icon transition-opacity duration-200"></i>
            <i class="fas fa-ellipsis-vertical absolute inset-0 text-white opacity-0 note-menu-toggle transition-opacity duration-200 flex items-center justify-center"></i>
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
      $("#note-input").val("");
      $("#add-note-modal").addClass("hidden");
    }
  });

  // Show delete note confirmation
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
/* === SOURCE ITEM INTERACTIONS === */
/* ============================================ */
/* $(document).ready(function () {
  // Handle source item click to toggle active state
  $(document).on("click", ".source-item", function (e) {
    // Prevent action if clicking on the dropdown menu
    if ($(e.target).closest(".source-menu").length) return;

    // Remove active class from all other sources
    $(".source-item").not(this).removeClass("active");

    // Toggle active class on the clicked source
    $(this).toggleClass("active");

    // Update icon visibility based on active state
    if ($(this).hasClass("active")) {
      $(this).find(".source-icon").css("opacity", "0");
      $(this).find(".source-menu-toggle").css("opacity", "1");
    } else {
      $(this).find(".source-icon").css("opacity", "1");
      $(this).find(".source-menu-toggle").css("opacity", "0");
      $(this).find(".source-menu").addClass("hidden");
    }
  });

  // Handle ellipsis icon click to show menu
  $(document).on("click", ".source-menu-toggle", function (e) {
    e.stopPropagation();
    e.preventDefault();

    const sourceItem = $(this).closest(".source-item");
    const sourceMenu = sourceItem.find(".source-menu");

    // Close all other open menus before toggling the current one
    $(".source-menu").not(sourceMenu).addClass("hidden");

    // Position the dropdown menu
    const sourceItemRect = sourceItem[0].getBoundingClientRect();
    sourceMenu.css({
      top: sourceItemRect.top + 40,
      left: sourceItemRect.right - 160,
      position: "fixed",
    });

    // Toggle the visibility of the current menu
    sourceMenu.toggleClass("hidden show");

    // Rebind event listeners to the menu items to ensure functionality
    sourceMenu
      .find(".menu-option")
      .off("click")
      .on("click", function (e) {
        e.preventDefault();
      });
  });

  // Handle "Show source" action
  $(document).on("click", '.source-menu a:contains("Show")', function (e) {
    e.preventDefault();
    const sourceItem = $(this).closest(".source-item");
    const sourceName = sourceItem.find(".truncate").text();

    // Sample data for demonstration (replace with actual data retrieval logic)
    const summary = `This library resource offers guidance on how to find experts for reporting purposes. It suggests looking to various institutions such as universities, professional associations, and government offices for potential sources, advising users to consider diverse perspectives. The guide also highlights useful tools like expert search engines and specific databases, while providing crucial tips on evaluating expert sources to ensure credibility and avoid misleading information.`;
    const keyTopics = [
      "Find experts",
      "Research guides",
      "Expert search engines",
      "Evaluate sources",
    ];
    const metadata = {
      Created: "2025-01-15",
      "Last Modified": "2025-05-14",
      "Source Type": "Library Guide",
      "AI Confidence": "92%",
    };

    // Hide the source menu
    $(".source-menu").addClass("hidden");

    // Store the original content of the left column
    const originalContent = $("#left-column").children().detach();

    // Create the source view
    const sourceView = $(`
      <div class="source-view flex flex-col h-full p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">${sourceName}</h3>
          <button id="back-to-sources" class="text-sky-400 hover:text-sky-300">
            <i class="fas fa-arrow-left mr-2"></i>Back
          </button>
        </div>
        <div class="flex-1 flex flex-col overflow-y-auto">
          <div class="bg-slate-700 rounded-lg p-4 mb-4">
            <h4 class="text-sm font-medium text-sky-400 mb-2">Summary</h4>
            <p class="text-sm text-slate-300">${summary}</p>
          </div>
          <div class="bg-slate-700 rounded-lg p-4 mb-4">
            <h4 class="text-sm font-medium text-sky-400 mb-2">Key Topics</h4>
            <ul class="list-disc list-inside text-sm text-slate-300">
              ${keyTopics.map((topic) => `<li>${topic}</li>`).join("")}
            </ul>
          </div>
          <div class="bg-slate-700 rounded-lg p-4">
            <h4 class="text-sm font-medium text-sky-400 mb-2">Metadata</h4>
            <dl class="text-sm text-slate-300">
              ${Object.entries(metadata)
                .map(
                  ([key, value]) => `
                <div class="flex justify-between mb-1">
                  <dt>${key}:</dt>
                  <dd>${value}</dd>
                </div>
              `
                )
                .join("")}
            </dl>
          </div>
        </div>
      </div>
    `);

    // Append the source view to the left column
    $("#left-column").append(sourceView);

    // Handle "Back" button to restore the original content and rebind events
    $("#back-to-sources").on("click", function () {
      $("#left-column").empty().append(originalContent);
      $("#left-column").removeClass("collapsed");
      // Reinitialize dropdown behavior after restoring content
      $(".source-menu-toggle")
        .off("click")
        .on("click", function (e) {
          e.stopPropagation();
          e.preventDefault();

          const sourceItem = $(this).closest(".source-item");
          const sourceMenu = sourceItem.find(".source-menu");

          $(".source-menu").not(sourceMenu).addClass("hidden");

          const sourceItemRect = sourceItem[0].getBoundingClientRect();
          sourceMenu.css({
            top: sourceItemRect.top + 40,
            left: sourceItemRect.right - 160,
            position: "fixed",
          });

          sourceMenu.toggleClass("hidden show");
        });
    });
  });

  // Close menu when clicking outside
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".source-menu").length &&
      !$(e.target).closest(".source-menu-toggle").length
    ) {
      $(".source-menu").addClass("hidden");
    }
  });
}); */

/* ============================================ */
/* === SOURCE ITEM INTERACTIONS === */
/* ============================================ */
$(document).ready(function () {
  // Handle source item click to toggle active state
  $(document).on("click", ".source-item", function (e) {
    // Prevent action if clicking on the dropdown menu or ellipsis icon
    if (
      $(e.target).closest(".source-menu").length ||
      $(e.target).hasClass("source-menu-toggle") ||
      $(e.target).closest(".source-menu-toggle").length
    ) {
      return;
    }

    // Remove active class from all other sources
    $(".source-item").not(this).removeClass("active");

    // Toggle active class on the clicked source
    $(this).toggleClass("active");

    // Update icon visibility based on active state
    if ($(this).hasClass("active")) {
      $(this).find(".source-icon").css("opacity", "0");
      $(this).find(".source-menu-toggle").css("opacity", "1");
    } else {
      $(this).find(".source-icon").css("opacity", "1");
      $(this).find(".source-menu-toggle").css("opacity", "0");
      $(this).find(".source-menu").addClass("hidden");
    }
  });

  // Handle ellipsis icon click to show menu
  $(document).on("click", ".source-menu-toggle", function (e) {
    e.stopPropagation();
    e.preventDefault();

    const sourceItem = $(this).closest(".source-item");
    const sourceMenu = sourceItem.find(".source-menu");

    // Close all other open menus before toggling the current one
    $(".source-menu").not(sourceMenu).addClass("hidden");

    // Position the dropdown menu
    const sourceItemRect = sourceItem[0].getBoundingClientRect();
    sourceMenu.css({
      top: sourceItemRect.top + 40,
      left: sourceItemRect.right - 160,
      position: "fixed",
    });

    // Toggle the visibility of the current menu
    sourceMenu.toggleClass("hidden show");

    // Ensure the source item is active
    $(".source-item")
      .not(sourceItem)
      .removeClass("active")
      .find(".source-icon")
      .css("opacity", "1")
      .end()
      .find(".source-menu-toggle")
      .css("opacity", "0");

    sourceItem
      .addClass("active")
      .find(".source-icon")
      .css("opacity", "0")
      .end()
      .find(".source-menu-toggle")
      .css("opacity", "1");
  });

  // Close menu when clicking outside
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".source-menu").length &&
      !$(e.target).closest(".source-menu-toggle").length
    ) {
      $(".source-menu").addClass("hidden");
      $(".source-item")
        .removeClass("active")
        .find(".source-icon")
        .css("opacity", "1")
        .end()
        .find(".source-menu-toggle")
        .css("opacity", "0");
    }
  });
});

/* ============================================ */
/* === NOTE ITEM INTERACTIONS === */
/* ============================================ */
$(document).ready(function () {
  // Handle note item click to toggle active state
  $(document).on("click", ".note-item", function (e) {
    // Prevent action if clicking on the dropdown menu
    if ($(e.target).closest(".note-menu").length) return;

    // Remove active class from all other notes
    $(".note-item").not(this).removeClass("active");

    // Toggle active class on the clicked note
    $(this).toggleClass("active");

    // Update icon visibility based on active state
    if ($(this).hasClass("active")) {
      $(this).find(".note-icon").css("opacity", "0");
      $(this).find(".note-menu-toggle").css("opacity", "1");
    } else {
      $(this).find(".note-icon").css("opacity", "1");
      $(this).find(".note-menu-toggle").css("opacity", "0");
      $(this).find(".note-menu").addClass("hidden");
    }
  });

  // Handle ellipsis icon click to show menu
  $(document).on("click", ".note-menu-toggle", function (e) {
    e.stopPropagation();
    const noteItem = $(this).closest(".note-item");
    const noteMenu = noteItem.find(".note-menu");

    // Close all other open menus before toggling the current one
    $(".note-menu").not(noteMenu).addClass("hidden");

    // Toggle the visibility of the current menu
    noteMenu.toggleClass("hidden");
  });

  // Handle "Show note" action
  $(document).on("click", '.note-menu a:contains("Show note")', function (e) {
    e.preventDefault();
    const noteItem = $(this).closest(".note-item");
    const title = noteItem.find(".font-medium.truncate").text();
    const content = noteItem.find(".text-xs.text-slate-400.truncate").text();

    $("#right-column .note-menu").addClass("hidden");

    // Store the original content of the right column
    const originalContent = $("#right-column").children().detach();

    // Create the edit form for the note with WYSIWYG editor
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
      
      <!-- WYSIWYG Toolbar -->
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
      
      <!-- Editable Content Area with fixed height and scrolling -->
      <div 
        id="edit-note-content" 
        class="w-full flex-1 min-h-[200px] max-h-[calc(100vh-300px)] bg-slate-700 text-white border border-t-0 border-slate-600 rounded-b px-3 py-2 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-sky-400" 
        contenteditable="true"
        style="min-height: 200px; max-height: calc(100vh - 300px);"
      >${content}</div>
      
      <!-- Pill-style joined buttons -->
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

    // Initialize WYSIWYG functionality
    editForm.find(".wysiwyg-btn").on("click", function (e) {
      e.preventDefault();
      const command = $(this).data("command");

      if (command === "createLink") {
        const url = prompt("Enter the link URL:");
        if (url) document.execCommand(command, false, url);
      } else {
        document.execCommand(command, false, null);
      }

      // Focus back on the editor
      $("#edit-note-content").focus();
    });

    // Style for WYSIWYG buttons
    editForm.find(".wysiwyg-btn").css({
      background: "transparent",
      color: "#94a3b8",
      border: "none",
      padding: "4px 8px",
      margin: "0 2px",
      "border-radius": "4px",
      cursor: "pointer",
    });

    // Hover effect for WYSIWYG buttons
    editForm.find(".wysiwyg-btn").hover(
      function () {
        $(this).css("background-color", "#334155");
      },
      function () {
        $(this).css("background-color", "transparent");
      }
    );

    // Add active state for WYSIWYG buttons
    editForm
      .find(".wysiwyg-btn")
      .on("mousedown", function () {
        $(this).css("background-color", "#1e293b");
      })
      .on("mouseup mouseleave", function () {
        $(this).css("background-color", "transparent");
      });

    // Save note function
    editForm.find("#save-note-changes").on("click", function () {
      const updatedTitle = $("#edit-note-title").val();
      const updatedContent = $("#edit-note-content").html();

      // Call your save function here
      // saveNote(noteId, updatedTitle, updatedContent); // to be defined

      // Return to notes list
      $("#right-column").empty().append(originalContent);
      $("#right-column").removeClass("collapsed");
    });

    // Cancel button action
    editForm.find("#cancel-note-changes").on("click", function () {
      if (confirm("Discard changes?")) {
        // showNotesList();
        $("#right-column").empty().append(originalContent);
        $("#right-column").removeClass("collapsed");
      }
    });

    // Append the edit form to the right column
    $("#right-column").append(editForm);

    // Handle "Back" button to restore the original content
    $("#back-to-notes").on("click", function () {
      $("#right-column").empty().append(originalContent);
      $("#right-column").removeClass("collapsed");
    });

    // Handle "Save" button to update the note
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
            newContent.substring(0, 50) + (newContent.length > 50 ? "..." : "")
          );
      }

      // Restore the original content
      $("#right-column").empty().append(originalContent);
      $("#right-column").removeClass("collapsed");
    });
  });

  // Close menu when clicking outside
  $(document).on("click", function (e) {
    if (
      !$(e.target).closest(".note-menu").length &&
      !$(e.target).closest(".note-menu-toggle").length
    ) {
      $(".note-menu").addClass("hidden");
    }
  });
});

/* ============================================ */
/* === CHAT FUNCTIONALITY === */
/* ============================================ */
$(document).ready(function () {
  // Send chat message when send button is clicked
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
  // Add message to note
  $(document).on("click", ".add-to-note-btn", function () {
    const messageContent = $(this)
      .closest(".bg-blue-500")
      .find(".text-white")
      .text();
    console.log("Adding to note:", messageContent);
    alert("Message added to notes!");
  });

  // Copy message to clipboard
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
  // Toggle all source checkboxes
  $("#select-all").on("change", function () {
    $(".source-checkbox").prop("checked", $(this).prop("checked"));
  });

  // Handle processing button animation
  $(document).on("click", ".processing-btn", function (e) {
    e.stopPropagation();
    const btn = $(this);
    const icon = btn.find("i");

    // if (btn.data("processing") === "false") {
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
    // }
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
    e.stopPropagation();
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
  /* $(".modal > div").on("click", function (e) {
    e.stopPropagation();
  }); */
}

/* ============================================ */
/* === ADD SOURCE === */
/* ============================================ */
/* (No additional JS content for Add Source modal) */

/* ============================================ */
/* === DISCOVER SOURCE === */
/* ============================================ */
/* (No additional JS content for Discover Source modal) */

/* ============================================ */
/* === RENAME SOURCE === */
/* ============================================ */
/* (No additional JS content for Rename Source modal) */

/* ============================================ */
/* === ADD NOTE === */
/* ============================================ */
/* (No additional JS content for Add Note modal) */

/* ============================================ */
/* === DELETE NOTE === */
/* ============================================ */
/* (No additional JS content for Delete Note modal) */

/* ============================================ */
/* === DELETE SOURCE === */
/* ============================================ */
/* (No additional JS content for Delete Source modal) */
