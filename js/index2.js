// js/index2.js
// Document Ready Handler
document.addEventListener("DOMContentLoaded", function () {
  // Initialize modals and event listeners
  initModals();
  initViewMode();
  initSorting();
  initMenuHandlers();
  initTaxonomyModal();
});

// Modal Functions
function initModals() {
  // Upload Document Modal
  const uploadModal = document.getElementById("uploadDocumentModal");
  const uploadBackdrop = document.getElementById("uploadDocumentBackdrop");
  // Container that centers the modal content
  const uploadContainer = uploadModal?.querySelector("div.fixed.inset-0.flex");
  const uploadModalContent = uploadModal?.querySelector(".bg-white");
  const closeUploadButton = document.getElementById("closeUploadModal");
  const cancelUploadButton = document.getElementById("cancelUpload");

  // Close upload modal function
  function closeUploadModal() {
    if (uploadModal) {
      uploadModal.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }

  // Close upload modal when clicking the backdrop
  if (uploadBackdrop) {
    uploadBackdrop.addEventListener("click", closeUploadModal);
  }

  // Also close when clicking on the empty area of the container (outside the dialog)
  if (uploadContainer) {
    uploadContainer.addEventListener("click", function (e) {
      if (e.target === uploadContainer) {
        closeUploadModal();
      }
    });
  }

  // Close upload modal when clicking the close button
  if (closeUploadButton) {
    closeUploadButton.addEventListener("click", closeUploadModal);
  }

  // Close upload modal when clicking the cancel button
  if (cancelUploadButton) {
    cancelUploadButton.addEventListener("click", closeUploadModal);
  }

  // Close upload modal with Escape key
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      uploadModal &&
      !uploadModal.classList.contains("hidden")
    ) {
      closeUploadModal();
    }
  });

  // Stop propagation for upload modal content
  if (uploadModalContent) {
    uploadModalContent.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // Make closeUploadModal available globally
  window.closeUploadModal = closeUploadModal;
}

// View Mode Toggle
function initViewMode() {
  const gridView = document.getElementById("grid-view");
  const listView = document.getElementById("list-view");
  const gridButtons = document.querySelectorAll(".grid-view");
  const listButton = document.getElementById("list-view-btn");

  // Set initial view mode from localStorage or default to 'list'
  const savedViewMode = localStorage.getItem("viewMode") || "list";
  setViewMode(savedViewMode);

  // Add event listeners to all grid view buttons
  gridButtons.forEach((button) => {
    button.addEventListener("click", () => setViewMode("grid"));
  });

  // Add event listener to list view button
  if (listButton) {
    listButton.addEventListener("click", () => setViewMode("list"));
  }
}

function setViewMode(mode) {
  const gridView = document.getElementById("grid-view");
  const listView = document.getElementById("list-view");
  const gridButtons = document.querySelectorAll(".grid-view");
  const listButton = document.getElementById("list-view-btn");

  if (mode === "grid") {
    gridView?.classList.remove("hidden");
    listView?.classList.add("hidden");

    // Update grid buttons
    gridButtons.forEach((btn) => {
      btn.classList.add("bg-eu-orange", "text-eu-white");
      btn.classList.remove("bg-eu-white", "text-eu-blue");
    });

    // Update list button
    if (listButton) {
      listButton.classList.remove("bg-eu-orange", "text-eu-white");
      listButton.classList.add("bg-eu-white", "text-eu-blue");
    }
  } else {
    listView?.classList.remove("hidden");
    gridView?.classList.add("hidden");

    // Update grid buttons
    gridButtons.forEach((btn) => {
      btn.classList.remove("bg-eu-orange", "text-eu-white");
      btn.classList.add("bg-eu-white", "text-eu-blue");
    });

    // Update list button
    if (listButton) {
      listButton.classList.add("bg-eu-orange", "text-eu-white");
      listButton.classList.remove("bg-eu-white", "text-eu-blue");
    }
  }

  // Save preference to localStorage
  localStorage.setItem("viewMode", mode);
}

// Sorting Functionality
function initSorting() {
  const sortMenu = document.getElementById("sort-menu");
  const sortButton = document.querySelector('[onclick="toggleDropdown()"]');

  // Close sort menu when clicking outside
  document.addEventListener("click", function (e) {
    if (!sortMenu?.contains(e.target) && e.target !== sortButton) {
      sortMenu?.classList.add("hidden");
    }
  });
}

function toggleDropdown() {
  const menu = document.getElementById("sort-menu");
  menu?.classList.toggle("hidden");
}

function setSort(option) {
  const label = document.getElementById("sort-label");
  const menu = document.getElementById("sort-menu");

  if (!label || !menu) return;

  switch (option) {
    case "recent":
      label.textContent = "Most recent";
      // Add sorting logic here
      break;
    case "name":
      label.textContent = "Name (A-Z)";
      // Add sorting logic here
      break;
    case "modified":
      label.textContent = "Last modified";
      // Add sorting logic here
      break;
  }

  menu.classList.add("hidden");
}

// Menu Handlers
function initMenuHandlers() {
  // Handle click outside to close all dropdowns
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".relative")) {
      document
        .querySelectorAll(".dropdown-menu, .card-menu, .list-item-menu")
        .forEach((menu) => {
          menu.classList.add("hidden");
        });
    }
  });
}

// Taxonomy Modal Functions
function initTaxonomyModal() {
  const modal = document.getElementById("taxonomyModal");
  const backdrop = document.getElementById("taxonomyBackdrop");
  // Container that centers the modal content
  const taxonomyContainer = modal?.querySelector("div.fixed.inset-0.flex");
  const closeButton = document.getElementById("closeTaxonomyModal");
  const cancelButton = document.getElementById("cancelTaxonomyChanges");
  const saveButton = document.getElementById("saveTaxonomyChanges");
  const addCategoryButton = document.getElementById("addCategory");
  const newCategoryInput = document.getElementById("newCategory");
  const categoriesList = document.getElementById("categoriesList");
  const cogButton = document.getElementById("taxonomy-edit-btn");

  // Toggle modal visibility
  window.toggleTaxonomyModal = function () {
    if (modal) {
      modal.classList.toggle("hidden");
      document.body.style.overflow = modal.classList.contains("hidden")
        ? ""
        : "hidden";

      // Load categories when opening the modal
      if (!modal.classList.contains("hidden")) {
        loadCategories();
        // Set cog active
        if (cogButton) {
          cogButton.classList.remove("bg-eu-white", "text-eu-blue");
          cogButton.classList.add("bg-eu-orange", "text-eu-white");
        }
      } else {
        // Unset cog active
        if (cogButton) {
          cogButton.classList.add("bg-eu-white", "text-eu-blue");
          cogButton.classList.remove("bg-eu-orange", "text-eu-white");
        }
      }
    }
  };

  // Close modal function
  function closeModal() {
    if (modal) {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
      // Unset cog active on explicit close
      if (cogButton) {
        cogButton.classList.add("bg-eu-white", "text-eu-blue");
        cogButton.classList.remove("bg-eu-orange", "text-eu-white");
      }
    }
  }

  // Close modal when clicking the backdrop
  if (backdrop) {
    backdrop.addEventListener("click", closeModal);
  }

  // Also close when clicking on the empty area of the container (outside the dialog)
  if (taxonomyContainer) {
    taxonomyContainer.addEventListener("click", function (e) {
      if (e.target === taxonomyContainer) {
        closeModal();
      }
    });
  }

  // Close modal when clicking the close button
  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  // Close modal when clicking the cancel button
  if (cancelButton) {
    cancelButton.addEventListener("click", closeModal);
  }

  // Save changes when clicking the save button
  if (saveButton) {
    saveButton.addEventListener("click", function () {
      // Add your save logic here
      console.log("Saving taxonomy changes...");
      closeModal();
    });
  }

  // Add new category
  if (addCategoryButton && newCategoryInput) {
    const handleAddCategory = function () {
      const categoryName = newCategoryInput.value.trim();
      if (categoryName) {
        // In a real app, you would save this to your backend
        console.log("Adding category:", categoryName);
        addCategoryToUI(categoryName);
        newCategoryInput.value = "";
      }
    };

    addCategoryButton.addEventListener("click", handleAddCategory);
    newCategoryInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        handleAddCategory();
      }
    });
  }

  // Load categories from storage or API
  function loadCategories() {
    // In a real app, you would fetch this from your backend
    const categories = JSON.parse(
      localStorage.getItem("taxonomyCategories") || "[]"
    );

    if (categories.length === 0) {
      categoriesList.innerHTML =
        '<div class="text-gray-500 text-center py-4">No categories added yet.</div>';
      return;
    }

    categoriesList.innerHTML = categories
      .map(
        (category) => `
            <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                <span class="text-gray-800">${category.name}</span>
                <div class="flex space-x-2">
                    <button class="text-blue-500 hover:text-blue-700" onclick="editCategory('${category.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700" onclick="deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Add category to UI
  function addCategoryToUI(name) {
    const category = {
      id: "cat-" + Date.now(),
      name: name,
      createdAt: new Date().toISOString(),
    };

    // In a real app, you would save this to your backend
    const categories = JSON.parse(
      localStorage.getItem("taxonomyCategories") || "[]"
    );
    categories.push(category);
    localStorage.setItem("taxonomyCategories", JSON.stringify(categories));

    // Reload categories
    loadCategories();
  }

  // Make functions available globally
  window.editCategory = function (id) {
    // In a real app, implement edit functionality
    console.log("Edit category:", id);
    const categories = JSON.parse(
      localStorage.getItem("taxonomyCategories") || "[]"
    );
    const category = categories.find((cat) => cat.id === id);
    if (category) {
      const newName = prompt("Edit category name:", category.name);
      if (newName && newName.trim() !== "") {
        category.name = newName.trim();
        localStorage.setItem("taxonomyCategories", JSON.stringify(categories));
        loadCategories();
      }
    }
  };

  window.deleteCategory = function (id) {
    if (confirm("Are you sure you want to delete this category?")) {
      // In a real app, you would delete this from your backend
      const categories = JSON.parse(
        localStorage.getItem("taxonomyCategories") || "[]"
      );
      const updatedCategories = categories.filter((cat) => cat.id !== id);
      localStorage.setItem(
        "taxonomyCategories",
        JSON.stringify(updatedCategories)
      );

      // Reload categories
      loadCategories();
    }
  };
}

// Card Menu Functions
function toggleCardMenu(event, cardId) {
  event.stopPropagation();
  const menu = document.getElementById(`${cardId}-menu`);
  if (!menu) return;

  // Close all other menus
  document.querySelectorAll(".card-menu").forEach((m) => {
    if (m !== menu) m.classList.add("hidden");
  });

  // Toggle current menu
  menu.classList.toggle("hidden");

  // Position the menu at the click location
  if (!menu.classList.contains("hidden")) {
    const rect = event.target.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    // Calculate position relative to the button
    let left = rect.left;
    let top = rect.bottom + 4; // 4px gap below the button

    // Adjust if menu would go off-screen
    if (left + menuRect.width > window.innerWidth) {
      left = window.innerWidth - menuRect.width - 10;
    }

    if (top + menuRect.height > window.innerHeight) {
      top = rect.top - menuRect.height - 4; // Show above the button
    }

    // Set the position
    menu.style.position = "fixed";
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.transform = "none";
    menu.style.zIndex = "9999";

    // Close when clicking outside
    const clickHandler = function (e) {
      if (
        !menu.contains(e.target) &&
        !e.target.closest(`[onclick*="${cardId}"]`)
      ) {
        menu.classList.add("hidden");
        document.removeEventListener("click", clickHandler);
      }
    };

    // Use setTimeout to avoid immediate close
    setTimeout(() => {
      document.addEventListener("click", clickHandler);
    }, 0);
  }
}

// List Item Menu Functions
function toggleListItemMenu(event, itemId) {
  event.stopPropagation();
  const menu = event.currentTarget.nextElementSibling;
  if (!menu || !menu.classList.contains("list-item-menu")) return;

  // Close all other menus
  document.querySelectorAll(".list-item-menu").forEach((m) => {
    if (m !== menu) m.classList.add("hidden");
  });

  // Toggle current menu
  menu.classList.toggle("hidden");

  // Position the menu at the click location
  if (!menu.classList.contains("hidden")) {
    const rect = event.target.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    // Calculate position relative to the button
    let left = rect.left;
    let top = rect.bottom + 4; // 4px gap below the button

    // Adjust if menu would go off-screen
    if (left + menuRect.width > window.innerWidth) {
      left = window.innerWidth - menuRect.width - 10;
    }

    if (top + menuRect.height > window.innerHeight) {
      top = rect.top - menuRect.height - 4; // Show above the button
    }

    // Set the position
    menu.style.position = "fixed";
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.transform = "none";
    menu.style.zIndex = "9999";

    // Close when clicking outside
    const clickHandler = function (e) {
      if (
        !menu.contains(e.target) &&
        !e.target.closest(`[onclick*="${itemId}"]`)
      ) {
        menu.classList.add("hidden");
        document.removeEventListener("click", clickHandler);
      }
    };

    // Use setTimeout to avoid immediate close
    setTimeout(() => {
      document.addEventListener("click", clickHandler);
    }, 0);
  }
}

// Make functions available globally
window.setViewMode = setViewMode;
window.toggleDropdown = toggleDropdown;
window.setSort = setSort;
window.toggleCardMenu = toggleCardMenu;
window.toggleListItemMenu = toggleListItemMenu;
