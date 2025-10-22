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
  const closeButton = document.getElementById("closeTaxonomyModal");
  const cancelButton = document.getElementById("cancelTaxonomyChanges");
  const saveButton = document.getElementById("saveTaxonomyChanges");
  const addCategoryButton = document.getElementById("addCategory");
  const newCategoryInput = document.getElementById("newCategory");
  const categoriesList = document.getElementById("categoriesList");
  const categoryCount = document.getElementById("categoryCount");

  let categories = [];
  let isEditing = false;
  let currentEditId = null;

  // Close modal function
  function closeModal() {
    if (modal) {
      modal.classList.add("hidden");
      document.body.style.overflow = "";
      resetForm();
    }
  }

  // Reset form
  function resetForm() {
    isEditing = false;
    currentEditId = null;
    if (newCategoryInput) newCategoryInput.value = "";
    const configInput = document.getElementById("categoryConfig");
    const configContainer = document.getElementById("categoryConfigContainer");
    const addButtonText = document.getElementById("addCategoryText");
    const toggleConfigBtn = document.getElementById("toggleConfigBtn");
    const configIcon = toggleConfigBtn?.querySelector("svg");
    const categoryLabel = document.querySelector('label[for="newCategory"]');
    const saveButton = document.getElementById("saveCategoryButton");

    // Reset the form title and button text
    if (categoryLabel) {
      categoryLabel.textContent = 'Add New Category';
    }
    if (addButtonText) {
      addButtonText.textContent = 'Create';
    }
    if (saveButton) {
      saveButton.textContent = 'Create';
    }

    if (configInput) configInput.value = "";
    if (configContainer) {
      configContainer.classList.add("hidden");
    }
    if (addButtonText) addButtonText.textContent = "Add";
    if (configIcon) {
      configIcon.style.transform = "rotate(0deg)";
    }

    // Re-initialize the toggle button
    initToggleConfig();

    updateCategoriesList();
  }

  // Load categories from localStorage
  function loadCategories() {
    const savedData = JSON.parse(localStorage.getItem("taxonomy")) || {
      categories: [],
    };
    categories = [...savedData.categories];
    updateCategoriesList();
  }

  // Save categories to localStorage
  function saveCategories() {
    const data = {
      categories: [...categories],
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("taxonomy", JSON.stringify(data));
  }

  // View category configuration
  window.viewCategory = function (index, event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (index >= 0 && index < categories.length) {
      const category = categories[index];
      const config = typeof category === "object" ? category.config : null;
      
      // Find the clicked category item and view button
      const categoryItems = document.querySelectorAll('#categoriesList > div');
      if (index >= categoryItems.length) return;
      
      const categoryItem = categoryItems[index];
      const viewButton = event?.currentTarget || categoryItem.querySelector('button[title="View"]');
      
      // Check if we're toggling off an already open viewer
      const existingViewer = categoryItem.nextElementSibling?.classList.contains('category-config-viewer');
      
      if (existingViewer) {
        // Remove the viewer
        categoryItem.nextElementSibling.remove();
        // Reset the eye icon
        if (viewButton) {
          viewButton.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          `;
        }
        return;
      }
      
      // Remove any other open viewers first
      document.querySelectorAll('.category-config-viewer').forEach(el => el.remove());
      
      // Update the eye icon to show it's active
      if (viewButton) {
        viewButton.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        `;
      }
      
      // Create config viewer
      const configViewer = document.createElement('div');
      configViewer.className = 'category-config-viewer bg-gray-50 p-3 border-t border-gray-200';
      
      if (config) {
        const pre = document.createElement('pre');
        pre.className = 'text-xs font-mono text-gray-700 overflow-auto max-h-40';
        pre.textContent = JSON.stringify(config, null, 2);
        configViewer.appendChild(pre);
      } else {
        const message = document.createElement('div');
        message.className = 'text-sm text-gray-500 italic';
        message.textContent = 'No configuration available';
        configViewer.appendChild(message);
      }
      
      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'absolute top-2 right-2 text-gray-400 hover:text-gray-600';
      closeBtn.innerHTML = '&times;';
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        configViewer.remove();
        // Reset the eye icon when closed via the X button
        if (viewButton) {
          viewButton.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          `;
        }
      };
      configViewer.appendChild(closeBtn);
      
      // Insert after the category item
      categoryItem.parentNode.insertBefore(configViewer, categoryItem.nextSibling);
      
      // Smooth scroll to the config if needed
      configViewer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Close JSON viewer
  function initJsonViewer() {
    const closeBtn = document.getElementById("closeJsonViewer");
    const jsonViewer = document.getElementById("jsonViewer");

    if (closeBtn && jsonViewer) {
      closeBtn.addEventListener("click", () => {
        jsonViewer.classList.add("hidden");
      });
    }
  }

  // Update categories list in the DOM
  function updateCategoriesList() {
    if (!categoriesList || !categoryCount) return;

    // Update count
    categoryCount.textContent = `${categories.length} ${
      categories.length === 1 ? "category" : "categories"
    }`;

    if (categories.length === 0) {
      categoriesList.innerHTML =
        '<div class="text-sm text-gray-500 italic text-center py-4">No categories added yet</div>';
      return;
    }

    // Get the currently expanded category index (if any)
    let expandedIndex = -1;
    const existingViewer = document.querySelector('.category-config-viewer');
    if (existingViewer && existingViewer.previousElementSibling) {
      const items = Array.from(document.querySelectorAll('#categoriesList > div'));
      expandedIndex = items.indexOf(existingViewer.previousElementSibling);
    }
    
    // Clear the list but keep any open config viewer
    const configViewer = document.querySelector('.category-config-viewer');
    if (configViewer) {
      configViewer.remove();
    }

    // Rebuild the list
    categoriesList.innerHTML = categories
      .map((category, index) => {
        const isObject = typeof category === "object";
        const name = isObject ? category.name : category;
        const config = isObject ? category.config : null;
        
        return `
        <div class="flex items-center justify-between bg-white p-3 rounded border border-gray-200 hover:bg-gray-50 group relative">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-800 truncate">${name}</div>
            ${config ? `
            <div class="text-xs text-gray-500 truncate">
              ${Object.keys(config).length} config properties
            </div>` : 
            '<div class="text-xs text-gray-400">No configuration</div>'}
          </div>
          <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="viewCategory(${index}, event)" class="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 view-toggle" title="View">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button onclick="event.stopPropagation(); deleteCategory(${index})" class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50" title="Delete">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>`;
      })
      .join("");
      
    // Re-open the config viewer if it was open before
    if (expandedIndex >= 0 && expandedIndex < categories.length) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        viewCategory(expandedIndex);
      }, 0);
    }
  }

  // Add or update category
  function handleAddCategory() {
    const categoryName = newCategoryInput ? newCategoryInput.value.trim() : "";
    const configInput = document.getElementById("categoryConfig");
    const configContainer = document.getElementById("categoryConfigContainer");
    let config = null;

    // Reset any previous error states
    if (newCategoryInput) {
      newCategoryInput.classList.remove('border-red-500');
      const errorElement = document.getElementById('categoryNameError');
      if (errorElement) {
        errorElement.remove();
      }
    }

    // Only validate and show error if we're not in the middle of resetting the form
    const isFormResetting = !categoryName && !newCategoryInput?.value && document.activeElement !== newCategoryInput;
    
    // Validate category name
    if (!categoryName && !isFormResetting) {
      if (newCategoryInput) {
        newCategoryInput.classList.add('border-red-500');
        const errorElement = document.createElement('p');
        errorElement.id = 'categoryNameError';
        errorElement.className = 'mt-1 text-sm text-red-600';
        errorElement.textContent = 'Please enter a category name';
        
        // Only add the error if there isn't one already
        if (!document.getElementById('categoryNameError')) {
          newCategoryInput.parentNode.insertBefore(errorElement, newCategoryInput.nextSibling);
        }
        
        newCategoryInput.focus();
      }
      return;
    }

    // Try to parse JSON config if it exists and is visible
    if (
      configInput &&
      configInput.value.trim() &&
      configContainer &&
      !configContainer.classList.contains("hidden")
    ) {
      try {
        config = JSON.parse(configInput.value.trim());
      } catch (e) {
        const shouldContinue = confirm(
          "Invalid JSON configuration. Click OK to fix it or Cancel to remove the configuration."
        );
        if (!shouldContinue) {
          // Clear the config if user wants to remove it
          configInput.value = "";
          configContainer.classList.add("hidden");
          const configIcon = document.querySelector("#toggleConfigBtn svg");
          if (configIcon) configIcon.style.transform = "rotate(0deg)";
        }
        return;
      }
    }

    // Create category object with name and optional config
    const category = config ? { name: categoryName, config } : categoryName;

    if (isEditing && currentEditId !== null) {
      // Update existing category
      categories[currentEditId] = category;
      isEditing = false;
      currentEditId = null;
      const addButtonText = document.getElementById("addCategoryText");
      if (addButtonText) addButtonText.textContent = "Add";
    } else {
      // Check if category name already exists (case-insensitive) on any other category
      const exists = categories.some((cat, idx) => {
        // Skip the current item when editing
        if (isEditing && idx === currentEditId) return false;
        const existingName = typeof cat === "object" ? cat.name : cat;
        return existingName.toLowerCase() === categoryName.toLowerCase();
      });

      if (exists) {
        // Remove any existing error message first
        const existingError = document.getElementById('categoryNameError');
        if (existingError) existingError.remove();
        
        // Create new error message
        const errorElement = document.createElement('p');
        errorElement.id = 'categoryNameError';
        errorElement.className = 'mt-1 text-sm text-red-600';
        errorElement.textContent = 'A category with this name already exists';
        
        // Add the new error message after the input group
        if (newCategoryInput) {
          const inputGroup = newCategoryInput.closest('.relative') || newCategoryInput.parentNode;
          inputGroup.parentNode.insertBefore(errorElement, inputGroup.nextSibling);
          newCategoryInput.focus();
        }
        return;
      }

      categories.push(category);
    }

    // Reset form
    resetForm();

    // Save and update UI
    saveCategories();
    updateCategoriesList();
  }

  // Edit category
  window.editCategory = function (index) {
    if (index >= 0 && index < categories.length) {
      isEditing = true;
      currentEditId = index;
      const category = categories[index];
      const isObject = typeof category === "object";
      const name = isObject ? category.name : category;
      const config = isObject ? category.config : null;
      const configInput = document.getElementById("categoryConfig");
      const configContainer = document.getElementById(
        "categoryConfigContainer"
      );
      const toggleConfigBtn = document.getElementById("toggleConfigBtn");
      const configIcon = toggleConfigBtn?.querySelector("svg");
      const addButtonText = document.getElementById("addCategoryText");
      const categoryLabel = document.querySelector('label[for="newCategory"]');
      const saveButton = document.getElementById("saveCategoryButton");

      // Update the form title and button text
      if (categoryLabel) {
        categoryLabel.textContent = 'Update Category';
      }
      if (addButtonText) {
        addButtonText.textContent = 'Update';
      }
      if (saveButton) {
        saveButton.textContent = 'Update';
      }

      // Set the category name
      if (newCategoryInput) {
        newCategoryInput.value = name;
        newCategoryInput.focus();
        newCategoryInput.select();
      }

      // Handle configuration
      if (configInput && configContainer && toggleConfigBtn) {
        // Show the config section if there's a config
        if (config) {
          configInput.value = JSON.stringify(config, null, 2);
          configContainer.classList.remove("hidden");
          if (configIcon) {
            configIcon.style.transform = "rotate(180deg)";
          }
          // Scroll to the config section
          configContainer.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        } else {
          configInput.value = "";
          configContainer.classList.add("hidden");
          if (configIcon) {
            configIcon.style.transform = "rotate(0deg)";
          }
        }
      }

      // Update button text
      if (addButtonText) {
        addButtonText.textContent = "Update";
      }

      // Scroll to the top of the form
      if (modal) {
        modal.scrollTop = 0;
      }
    }
  };

  // Delete category
  window.deleteCategory = function (index) {
    if (index >= 0 && index < categories.length) {
      const category = categories[index];
      const categoryName = typeof category === 'object' ? category.name : category;
      if (confirm(`Are you sure you want to delete "${categoryName}"?`)) {
        categories.splice(index, 1);
        saveCategories();
        updateCategoriesList();
      }
    }
  };

  function initToggleConfig() {
    const toggleConfigBtn = document.getElementById('toggleConfigBtn');
    const configContainer = document.getElementById('categoryConfigContainer');
    const configIcon = toggleConfigBtn?.querySelector('svg');
    const configInput = document.getElementById('categoryConfig');

    if (!toggleConfigBtn || !configContainer || !configInput) return;

    // Check if we already have a clear config button
    let clearConfigBtn = configContainer.nextElementSibling;
    const isExistingClearBtn = clearConfigBtn && clearConfigBtn.matches('button.text-red-600');
    
    // If clear button doesn't exist, create it
    if (!isExistingClearBtn) {
      // Create clear config button (initially hidden)
      clearConfigBtn = document.createElement('button');
      clearConfigBtn.type = 'button';
      clearConfigBtn.className = 'text-xs text-red-600 hover:text-red-800 mt-2 flex items-center transition-opacity duration-200 opacity-0';
      clearConfigBtn.innerHTML = `
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear Config
      `;
      clearConfigBtn.style.display = 'none';
      
      // Add clear button after the config container
      configContainer.parentNode.insertBefore(clearConfigBtn, configContainer.nextSibling);
      
      // Add event listener for the clear button
      clearConfigBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        configInput.value = '';
        updateClearButtonVisibility(configInput, clearConfigBtn, true);
      });
    }
    
    // Remove any existing event listeners to prevent duplicates
    const newToggleBtn = toggleConfigBtn.cloneNode(true);
    toggleConfigBtn.parentNode.replaceChild(newToggleBtn, toggleConfigBtn);

    // Toggle config visibility
    newToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = configContainer.classList.toggle('hidden');
      if (configIcon) {
        configIcon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
      }
      
      // Toggle clear button visibility based on content
      updateClearButtonVisibility(configInput, clearConfigBtn, isHidden);
      
      // If showing the config, focus the textarea
      if (!isHidden) {
        setTimeout(() => {
          configInput.focus();
          // Format JSON if it exists
          try {
            if (configInput.value.trim()) {
              const json = JSON.parse(configInput.value);
              configInput.value = JSON.stringify(json, null, 2);
            }
          } catch (e) {
            // Not valid JSON, leave as is
          }
        }, 100);
      }
    });

    // Update clear button visibility when input changes
    configInput.addEventListener('input', () => {
      updateClearButtonVisibility(configInput, clearConfigBtn, configContainer.classList.contains('hidden'));
    });
  }
  
  // Helper function to update clear button visibility
  function updateClearButtonVisibility(inputElement, buttonElement, isContainerHidden) {
    const hasContent = inputElement.value.trim() !== '';
    if (hasContent && !isContainerHidden) {
      buttonElement.style.display = 'flex';
      setTimeout(() => {
        buttonElement.classList.remove('opacity-0');
        buttonElement.classList.add('opacity-100');
      }, 10);
    } else {
      buttonElement.classList.remove('opacity-100');
      buttonElement.classList.add('opacity-0');
      setTimeout(() => {
        buttonElement.style.display = 'none';
      }, 200); // Match this with the transition duration
    } 
  }

  // Initialize toggle config button
  initToggleConfig();

  // Event listeners
  if (backdrop) backdrop.addEventListener("click", closeModal);

  if (closeButton) closeButton.addEventListener("click", closeModal);

  if (cancelButton) cancelButton.addEventListener("click", closeModal);

  if (saveButton) {
    saveButton.addEventListener("click", function () {
      if (categories.length === 0) {
        alert("Please add at least one category");
        return;
      }

      saveCategories();
      closeModal();
    });
  }

  // Add/Update category
  if (addCategoryButton && newCategoryInput) {
    addCategoryButton.addEventListener("click", handleAddCategory);

    newCategoryInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") handleAddCategory();
    });

    // Focus the input when modal opens
    modal.addEventListener("shown.bs.modal", function () {
      newCategoryInput.focus();
    });
  }

  // Load initial categories
  loadCategories();
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

// Initialize the taxonomy modal when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check if initTaxonomyModal exists and is a function
  if (typeof initTaxonomyModal === "function") {
    initTaxonomyModal();
  } else {
    console.error("initTaxonomyModal function not found");
  }
});

// Make toggleTaxonomyModal available globally
window.toggleTaxonomyModal = function () {
  const modal = document.getElementById("taxonomyModal");
  const cogButton = document.getElementById("taxonomy-edit-btn");

  if (!modal) {
    console.error("Taxonomy modal element not found");
    return;
  }

  modal.classList.toggle("hidden");
  document.body.style.overflow = modal.classList.contains("hidden")
    ? ""
    : "hidden";

  if (!modal.classList.contains("hidden")) {
    // Try to find and call loadCategories if it exists
    const taxonomyModal = document.querySelector("#taxonomyModal");
    if (taxonomyModal && typeof taxonomyModal.loadCategories === "function") {
      taxonomyModal.loadCategories();
    }

    if (cogButton) {
      cogButton.classList.remove("bg-eu-white", "text-eu-blue");
      cogButton.classList.add("bg-eu-orange", "text-eu-white");
    }
  } else if (cogButton) {
    cogButton.classList.add("bg-eu-white", "text-eu-blue");
    cogButton.classList.remove("bg-eu-orange", "text-eu-white");
  }
};
