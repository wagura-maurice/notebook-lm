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
const modal = document.querySelector(".add-source-modal"); // ensure this script can also handle .discover-source-modal
const closeButton = document.querySelectorAll(".add-source-modal-close"); // ensure this script can also handle .discover-source-modal-close

const modalClose = () => {
  modal.classList.remove("fadeIn");
  modal.classList.add("fadeOut");
  setTimeout(() => {
    modal.style.display = "none";
  }, 500);
};

for (let i = 0; i < closeButton.length; i++) {
  const elements = closeButton[i];

  elements.onclick = (e) => modalClose();

  modal.style.display = "none";

  window.onclick = function (event) {
    if (event.target == modal) modalClose();
  };
}
// Get both modals and their close buttons
const addSourceModal = document.querySelector(".add-source-modal");
const discoverSourceModal = document.querySelector(".descover-source-modal");
const addSourceCloseButtons = document.querySelectorAll(
  ".add-source-modal-close"
);
const discoverSourceCloseButtons = document.querySelectorAll(
  ".descover-source-modal-close"
);

// Generic modal functions
const closeModal = (modal) => {
  modal.classList.remove("fadeIn");
  modal.classList.add("fadeOut");
  setTimeout(() => {
    modal.style.display = "none";
  }, 500);
};

const openModal = (modal) => {
  modal.classList.remove("fadeOut");
  modal.classList.add("fadeIn");
  modal.style.display = "flex";
};

// Close buttons for Add Source modal
addSourceCloseButtons.forEach((button) => {
  button.onclick = () => closeModal(addSourceModal);
});

// Close buttons for Discover Source modal
discoverSourceCloseButtons.forEach((button) => {
  button.onclick = () => closeModal(discoverSourceModal);
});

// Window click handler for both modals
window.onclick = function (event) {
  if (event.target === addSourceModal) {
    closeModal(addSourceModal);
  }
  if (event.target === discoverSourceModal) {
    closeModal(discoverSourceModal);
  }
};

// Functions to open specific modals
const openAddSourceModal = () => {
  openModal(addSourceModal);
};

const openDiscoverSourceModal = () => {
  openModal(discoverSourceModal);
};

// Initialize both modals as hidden
addSourceModal.style.display = "none";
discoverSourceModal.style.display = "none";

// actions control
document.getElementById("rename_source").addEventListener("click", function () {
  // clicking Rename on the dropdown should trigger the script code below:
  Swal.fire({
    title: "Rename Source",
    text: "Enter a new name for the source:",
    input: "text",
    inputAttributes: {
      autocapitalize: "off",
    },
    showCancelButton: true,
    confirmButtonText: "Submit",
    showLoaderOnConfirm: true,
    preConfirm: async (login) => {
      try {
        const githubUrl = `
                https://example.domain.com/rename/${login}
              `;
        const response = await fetch(githubUrl);
        if (!response.ok) {
          return Swal.showValidationMessage(`
                  ${JSON.stringify(await response.json())}
                `);
        }
        return response.json();
      } catch (error) {
        Swal.showValidationMessage(`
                Request failed: ${error}
              `);
      }
    },
    allowOutsideClick: () => !Swal.isLoading(),
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: `${result.value.login}'s avatar`,
        imageUrl: result.value.avatar_url,
      });
    }
  });
});

document.getElementById("delete_source").addEventListener("click", function () {
  // clicking Delete on the dropdown should trigger the script code below:
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
      Swal.fire({
        title: "Deleted!",
        text: "Your file has been deleted.",
        icon: "success",
      });
    }
  });
});
