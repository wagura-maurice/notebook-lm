// script.js
$(document).ready(function () {
  // DOM Elements
  const $container = $("#columns-container");
  const $leftColumn = $("#left-column");
  const $middleColumn = $("#middle-column");
  const $rightColumn = $("#right-column");
  const $tabButtons = $(".tab-button");
  const $collapseLeft = $("#collapse-left");
  const $collapseRight = $("#collapse-right");
  const $expandMiddle = $(".expand-middle");

  // State
  let state = {
    leftVisible: true,
    rightVisible: true,
    activeTab: "middle-column",
    isMobile: window.innerWidth < 1024,
  };

  // Initialize
  initLayout();
  setupEventListeners();
  setupSourceItemInteractions();

  // Functions
  function initLayout() {
    if (state.isMobile) {
      setupMobileView();
    } else {
      setupDesktopView();
    }
  }

  function setupMobileView() {
    $container.removeClass("collapsed-left collapsed-right full-expand");
    $(".mobile-tab-content").removeClass("active").hide();
    $(`#${state.activeTab}`).addClass("active").show();
    $tabButtons.removeClass("active");
    $(`.tab-button[data-tab="${state.activeTab}"]`).addClass("active");

    // Reset any collapsed states for mobile
    $leftColumn.removeClass("collapsed");
    $rightColumn.removeClass("collapsed");
    $collapseLeft
      .find("i")
      .removeClass("fa-chevron-right")
      .addClass("fa-chevron-left");
    $collapseRight
      .find("i")
      .removeClass("fa-chevron-left")
      .addClass("fa-chevron-right");
  }

  function setupDesktopView() {
    $(".mobile-tab-content").removeClass("active").show();
    $tabButtons.removeClass("active");
    updateColumnLayout();
  }

  function updateColumnLayout() {
    $container.removeClass("collapsed-left collapsed-right full-expand");

    if (!state.leftVisible && !state.rightVisible) {
      $container.addClass("full-expand");
      $leftColumn.addClass("collapsed");
      $rightColumn.addClass("collapsed");
      // Update icons for collapsed state
      $collapseLeft
        .find("i")
        .removeClass("fa-chevron-left")
        .addClass("fa-chevron-right");
      $collapseRight
        .find("i")
        .removeClass("fa-chevron-right")
        .addClass("fa-chevron-left");
    } else {
      if (!state.leftVisible) {
        $container.addClass("collapsed-left");
        $leftColumn.addClass("collapsed");
        $collapseLeft
          .find("i")
          .removeClass("fa-chevron-left")
          .addClass("fa-chevron-right");
      } else {
        $leftColumn.removeClass("collapsed");
        $collapseLeft
          .find("i")
          .removeClass("fa-chevron-right")
          .addClass("fa-chevron-left");
      }

      if (!state.rightVisible) {
        $container.addClass("collapsed-right");
        $rightColumn.addClass("collapsed");
        $collapseRight
          .find("i")
          .removeClass("fa-chevron-right")
          .addClass("fa-chevron-left");
      } else {
        $rightColumn.removeClass("collapsed");
        $collapseRight
          .find("i")
          .removeClass("fa-chevron-left")
          .addClass("fa-chevron-right");
      }
    }

    // Update middle column expand/collapse icon
    if (!state.leftVisible || !state.rightVisible) {
      $expandMiddle
        .find("i")
        .removeClass("fa-expand-alt")
        .addClass("fa-compress-alt");
    } else {
      $expandMiddle
        .find("i")
        .removeClass("fa-compress-alt")
        .addClass("fa-expand-alt");
    }

    // Toggle between icon and full views
    if (state.leftVisible) {
      $leftColumn.find(".source-item").show();
      $leftColumn.find(".source-icon").hide();
    } else {
      $leftColumn.find(".source-item").hide();
      $leftColumn.find(".source-icon").show();
    }

    if (state.rightVisible) {
      $rightColumn.find(".studio-item").show();
      $rightColumn.find(".studio-icon").hide();
    } else {
      $rightColumn.find(".studio-item").hide();
      $rightColumn.find(".studio-icon").show();
    }

    // Handle collapsed column styles
    if ($leftColumn.hasClass("collapsed")) {
      $leftColumn.css({
        "border-radius": "0.75rem",
        "box-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.25)",
      });
    } else {
      $leftColumn.css({
        "border-radius": "0.75rem 0 0 0.75rem",
        "box-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.25)",
      });
    }

    if ($rightColumn.hasClass("collapsed")) {
      $rightColumn.css({
        "border-radius": "0.75rem",
        "box-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.25)",
      });
    } else {
      $rightColumn.css({
        "border-radius": "0 0.75rem 0.75rem 0",
        "box-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.25)",
      });
    }
  }

  function setupEventListeners() {
    // Column toggles
    $collapseLeft.click(function () {
      state.leftVisible = !state.leftVisible;
      updateColumnLayout();
    });

    $collapseRight.click(function () {
      state.rightVisible = !state.rightVisible;
      updateColumnLayout();
    });

    $expandMiddle.click(function () {
      if (state.leftVisible || state.rightVisible) {
        state.leftVisible = false;
        state.rightVisible = false;
      } else {
        state.leftVisible = true;
        state.rightVisible = true;
      }
      updateColumnLayout();
    });

    // Mobile tabs
    $tabButtons.click(function () {
      const tabId = $(this).data("tab");
      state.activeTab = tabId;

      $tabButtons.removeClass("active");
      $(this).addClass("active");

      $(".mobile-tab-content").removeClass("active").hide();
      $(`#${tabId}`).addClass("active").show();

      // For mobile, ensure columns are fully expanded
      if (state.isMobile) {
        $leftColumn.removeClass("collapsed");
        $rightColumn.removeClass("collapsed");
      }
    });

    // Window resize
    $(window).resize(function () {
      const isMobileNow = window.innerWidth < 1024;
      if (isMobileNow !== state.isMobile) {
        state.isMobile = isMobileNow;
        if (state.isMobile) {
          setupMobileView();
        } else {
          setupDesktopView();
        }
      }
    });
  }

  function setupSourceItemInteractions() {
    const sourceItems = document.querySelectorAll(".source-item li");

    sourceItems.forEach((item) => {
      const fileIcon = item.querySelector(".file-icon-container i:first-child");
      const ellipsisIcon = item.querySelector(".fa-ellipsis-vertical");
      const dropdownMenu = item.querySelector(".dropdown-menu");
      let pressTimer;

      // Make ellipsis icon clickable
      ellipsisIcon.style.pointerEvents = "auto";

      // Desktop hover behavior
      item.addEventListener("mouseenter", () => {
        if (!state.isMobile) {
          fileIcon.style.opacity = "0";
          ellipsisIcon.style.opacity = "1";
        }
      });

      item.addEventListener("mouseleave", () => {
        if (!state.isMobile && !item.classList.contains("active")) {
          fileIcon.style.opacity = "1";
          ellipsisIcon.style.opacity = "0";
        }
      });

      // Mobile long press behavior
      item.addEventListener("touchstart", (e) => {
        if (state.isMobile) {
          pressTimer = setTimeout(() => {
            e.preventDefault();
            sourceItems.forEach((i) => i.classList.remove("active"));
            item.classList.add("active");
            document.querySelectorAll(".dropdown-menu").forEach((menu) => {
              menu.classList.add("hidden");
            });
            dropdownMenu.classList.remove("hidden");

            // Position the dropdown correctly
            positionDropdown(item, dropdownMenu);
          }, 500);
        }
      });

      item.addEventListener("touchend", () => {
        clearTimeout(pressTimer);
      });

      // Click handler for ellipsis icon
      ellipsisIcon.addEventListener("click", (e) => {
        e.stopPropagation();

        // Close all other dropdowns
        sourceItems.forEach((i) => {
          if (i !== item) {
            i.classList.remove("active");
            const menu = i.querySelector(".dropdown-menu");
            if (menu) menu.classList.add("hidden");
          }
        });

        // Toggle current dropdown
        item.classList.toggle("active");
        dropdownMenu.classList.toggle("hidden");

        if (!dropdownMenu.classList.contains("hidden")) {
          // Position the dropdown correctly
          positionDropdown(item, dropdownMenu);
        }
      });

      // Click handler for list item
      item.addEventListener("click", (e) => {
        if (
          !e.target.classList.contains("source-checkbox") &&
          e.target !== ellipsisIcon &&
          !dropdownMenu.contains(e.target)
        ) {
          // Handle normal click on item
          sourceItems.forEach((i) => {
            if (i !== item) {
              i.classList.remove("active");
              const menu = i.querySelector(".dropdown-menu");
              if (menu) menu.classList.add("hidden");
            }
          });
        }
      });
    });

    // Close dropdown when clicking elsewhere
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".source-item li")) {
        document.querySelectorAll(".dropdown-menu").forEach((menu) => {
          menu.classList.add("hidden");
        });
        document.querySelectorAll(".source-item li").forEach((item) => {
          item.classList.remove("active");
        });
      }
    });

    // Helper function to position dropdown correctly
    function positionDropdown(item, dropdown) {
      const itemRect = item.getBoundingClientRect();
      const containerRect = item
        .closest(".overflow-y-auto")
        .getBoundingClientRect();

      // Calculate available space below the item
      const spaceBelow = containerRect.bottom - itemRect.bottom;
      const dropdownHeight = dropdown.offsetHeight;

      if (spaceBelow < dropdownHeight) {
        // If not enough space below, show above the item
        dropdown.style.top = "auto";
        dropdown.style.bottom = "100%";
        dropdown.style.transform = "translateY(-4px)";
      } else {
        // Default: show below the item
        dropdown.style.top = "100%";
        dropdown.style.bottom = "auto";
        dropdown.style.transform = "translateY(4px)";
      }

      dropdown.style.right = "0";
    }
  }
});

// Initialization for modal
document.addEventListener("DOMContentLoaded", function () {
  const addSourceModal = document.querySelector(".add-source-modal");
  const discoverSourceModal = document.querySelector(".discover-source-modal");

  // Generic open/close modal functions
  function openModal(modal) {
    modal.classList.remove("fade-out");
    modal.classList.add("fade-in");
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    modal.classList.remove("fade-in");
    modal.classList.add("fade-out");

    // Wait for animation to finish before hiding
    modal.addEventListener("animationend", function onAnimationEnd() {
      if (modal.classList.contains("fade-out")) {
        modal.classList.add("hidden");
        modal.removeEventListener("animationend", onAnimationEnd);
      }
      document.body.style.overflow = "";
    });
  }

  // Assign global functions
  window.openAddSourceModal = () => openModal(addSourceModal);
  window.openDiscoverSourceModal = () => openModal(discoverSourceModal);

  window.closeAddSourceModal = () => closeModal(addSourceModal);
  window.closeDiscoverSourceModal = () => closeModal(discoverSourceModal);

  // Close buttons
  document.querySelectorAll(".add-source-modal-close").forEach((btn) => {
    btn.addEventListener("click", closeAddSourceModal);
  });

  document.querySelectorAll(".discover-source-modal-close").forEach((btn) => {
    btn.addEventListener("click", closeDiscoverSourceModal);
  });

  // Outside click
  [addSourceModal, discoverSourceModal].forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal(modal);
    });
  });

  // File upload handler
  document
    .getElementById("file-upload")
    .addEventListener("change", function () {
      if (this.files.length > 0) {
        console.log("Files selected:", this.files);
        // Handle upload logic here
      }
    });

  // Source selection in Discover modal
  const addButtons = document.querySelectorAll(
    ".discover-source-modal .p-3.hover\\:bg-gray-50.dark\\:hover\\:bg-gray-700 button"
  );

  addButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const item = this.closest(
        ".p-3.hover\\:bg-gray-50.dark\\:hover\\:bg-gray-700"
      );
      if (item.classList.contains("bg-blue-50")) {
        item.classList.remove("bg-blue-50", "dark:bg-blue-900");
        this.textContent = "Add";
      } else {
        item.classList.add("bg-blue-50", "dark:bg-blue-900");
        this.textContent = "Added";
      }
      updateSelectedCount();
    });
  });

  function updateSelectedCount() {
    const selectedCount = document.querySelectorAll(
      ".discover-source-modal .bg-blue-50"
    ).length;

    const addButton = document.querySelector(
      ".discover-source-modal .bg-blue-600"
    );
    if (addButton) addButton.textContent = `Add Selected (${selectedCount})`;
  }
});

// Initialize both modals as hidden
addSourceModal.style.display = "none";
discoverSourceModal.style.display = "none";

// actions control
// Function to handle rename action
function renameSource(sourceId) {
  Swal.fire({
    title: "Rename Source",
    text: "Enter a new name for the source:",
    input: "text",
    /* inputValue: document
      .querySelector(`[data-source-id="${sourceId}"]`)
      .textContent.trim(), */
    inputAttributes: {
      autocapitalize: "off",
    },
    showCancelButton: true,
    confirmButtonText: "Rename",
    showLoaderOnConfirm: true,
    preConfirm: (newName) => {
      if (!newName) {
        Swal.showValidationMessage("Name cannot be empty");
        return false;
      }
      return fetch(`/api/sources/${sourceId}/rename`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .catch((error) => {
          Swal.showValidationMessage(`Request failed: ${error}`);
        });
    },
    allowOutsideClick: () => !Swal.isLoading(),
  }).then((result) => {
    if (result.isConfirmed) {
      // Update the UI with the new name
      const sourceElement = document.querySelector(
        `[data-source-id="${sourceId}"]`
      );
      sourceElement.textContent = result.value.name;
      Swal.fire({
        title: "Success!",
        text: "Source renamed successfully",
        icon: "success",
      });
    }
  });
}

// Function to handle delete action
function deleteSource(sourceId) {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/api/sources/${sourceId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then(() => {
          // Remove the item from the DOM
          document
            .querySelector(`[data-source-id="${sourceId}"]`)
            .closest("li")
            .remove();
          Swal.fire("Deleted!", "Your source has been deleted.", "success");
        })
        .catch((error) => {
          Swal.fire("Error!", `Failed to delete source: ${error}`, "error");
        });
    }
  });
}

// Toggle dropdown visibility when clicking the ellipsis icon
document.querySelectorAll(".dropdown-trigger").forEach((trigger) => {
  trigger.addEventListener("click", function (e) {
    e.stopPropagation();
    const dropdown = this.closest("li").querySelector(".dropdown-menu");
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      if (menu !== dropdown) menu.classList.add("hidden");
    });
    dropdown.classList.toggle("hidden");
  });
});

// Close dropdowns when clicking elsewhere
document.addEventListener("click", function () {
  document.querySelectorAll(".dropdown-menu").forEach((menu) => {
    menu.classList.add("hidden");
  });
});
