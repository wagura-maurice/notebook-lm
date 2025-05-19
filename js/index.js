// js/index.js
// Preloader
$(document).ready(function () {
  setTimeout(function () {
    $("#preloader").fadeOut();
  }, 1000);
});

// Modal logic
function closeAllModals() {
  document.querySelectorAll(".modal").forEach((m) => m.classList.add("hidden"));
}

document.addEventListener("DOMContentLoaded", function () {
  // --- Create New Notebook Modal ---
  const createButton = document.querySelector(".create-button");
  const notebookModal = document.querySelector(".modal");

  if (createButton && notebookModal) {
    createButton.addEventListener("click", function (e) {
      closeAllModals();
      notebookModal.classList.remove("hidden");
    });
  }

  // Overlay click closes the modal (for all overlays)
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", function (e) {
      // Find parent modal and hide it
      const modal = overlay.closest(".modal");
      if (modal) modal.classList.add("hidden");
    });
  });

  // Cancel/close button closes the modal (for all close buttons)
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      // Find parent modal and hide it
      const modal = btn.closest(".modal");
      if (modal) modal.classList.add("hidden");
    });
  });

  // Prevent modal content click from closing modal (for all modal content blocks)
  document
    .querySelectorAll(".modal > div:not(.modal-overlay)")
    .forEach((content) => {
      content.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });

  // Escape key closes modal
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAllModals();
    }
  });

  // --- Dropdown actions (Rename, Share, Delete) ---
  document.body.addEventListener("click", function (e) {
    // Rename
    if (
      e.target.closest(".dropdown-menu a") &&
      e.target.textContent.includes("Rename")
    ) {
      e.preventDefault();
      closeAllModals();
      const renameCollectionModal = document.getElementById(
        "rename-collection-modal"
      );
      if (renameCollectionModal)
        renameCollectionModal.classList.remove("hidden");
    }
    // Share
    if (
      e.target.closest(".dropdown-menu a") &&
      e.target.textContent.includes("Share")
    ) {
      e.preventDefault();
      closeAllModals();
      const shareCollectionModal = document.getElementById(
        "share-collection-modal"
      );
      if (shareCollectionModal) shareCollectionModal.classList.remove("hidden");
    }
    // Delete
    if (
      e.target.closest(".dropdown-menu a") &&
      e.target.textContent.includes("Delete")
    ) {
      e.preventDefault();
      closeAllModals();
      const deleteCollectionModal = document.getElementById(
        "delete-collection-modal"
      );
      if (deleteCollectionModal)
        deleteCollectionModal.classList.remove("hidden");
    }
  });

  // View toggle buttons
  const gridView = document.getElementById("grid-view");
  const listView = document.getElementById("list-view");
  const gridButton = document.querySelector(".grid-view");
  const listButton = document.querySelector(".list-view");

  if (gridButton && listButton) {
    gridButton.addEventListener("click", function () {
      gridView.classList.remove("hidden");
      listView.classList.add("hidden");
      gridButton.classList.add("active");
      gridButton.classList.add("text-accent-blue");
      gridButton.classList.remove("text-text-secondary");
      listButton.classList.remove("active");
      listButton.classList.remove("text-accent-blue");
      listButton.classList.add("text-text-secondary");
    });

    listButton.addEventListener("click", function () {
      listView.classList.remove("hidden");
      gridView.classList.add("hidden");
      listButton.classList.add("active");
      listButton.classList.add("text-accent-blue");
      listButton.classList.remove("text-text-secondary");
      gridButton.classList.remove("active");
      gridButton.classList.remove("text-accent-blue");
      gridButton.classList.add("text-text-secondary");
    });
  }

  // Toggle dropdowns for ellipsis buttons
  const ellipsisButtons = document.querySelectorAll(".fa-ellipsis-vertical");
  ellipsisButtons.forEach((button) => {
    button.parentElement.addEventListener("click", function (e) {
      e.stopPropagation();
      const dropdown = this.nextElementSibling;
      dropdown.classList.toggle("hidden");

      // Close all other dropdowns
      document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        if (menu !== dropdown) {
          menu.classList.add("hidden");
        }
      });
    });
  });

  // Close dropdowns when clicking elsewhere
  document.addEventListener("click", function () {
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      menu.classList.add("hidden");
    });
  });
});

function toggleDropdown() {
  document.getElementById("sort-menu").classList.toggle("hidden");
  event.stopPropagation();
}

function selectSort(option) {
  document.getElementById("sort-label").textContent = option;
  document.getElementById("sort-menu").classList.add("hidden");
  // Sorting logic would go here
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("sort-menu");
  const button = event.target.closest("button");
  if (dropdown && !dropdown.contains(event.target) && !button) {
    dropdown.classList.add("hidden");
  }
});
