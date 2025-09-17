// js/app.js

document.addEventListener("DOMContentLoaded", function () {
  // Mobile avatar dropdown
  const mobileDropdownTrigger = document.getElementById('avatar-dropdown-trigger');
  const mobileDropdown = document.getElementById('avatar-dropdown');
  
  // Desktop profile dropdown
  const desktopDropdownTrigger = document.getElementById('profile-dropdown-trigger');
  const desktopDropdown = document.getElementById('profile-dropdown');
  
  // Toggle mobile dropdown
  if (mobileDropdownTrigger && mobileDropdown) {
      mobileDropdownTrigger.addEventListener('click', function(e) {
          e.stopPropagation();
          mobileDropdown.classList.toggle('hidden');
          
          // Position the dropdown for mobile
          if (!mobileDropdown.classList.contains('hidden') && window.innerWidth < 1024) {
              const rect = mobileDropdownTrigger.getBoundingClientRect();
              mobileDropdown.style.position = 'fixed';
              mobileDropdown.style.top = `${rect.bottom + window.scrollY}px`;
              mobileDropdown.style.right = '1rem';
              mobileDropdown.style.zIndex = '1000'; // Ensure it's above mobile tabs (which are usually z-10 or z-20)
          }
      });
  }
  
  // Toggle desktop dropdown
  if (desktopDropdownTrigger && desktopDropdown) {
      desktopDropdownTrigger.addEventListener('click', function(e) {
          e.stopPropagation();
          desktopDropdown.classList.toggle('hidden');
          desktopDropdown.classList.toggle('opacity-0');
          desktopDropdown.classList.toggle('translate-y-2');
          
          // Toggle aria-expanded
          const isExpanded = this.getAttribute('aria-expanded') === 'true';
          this.setAttribute('aria-expanded', !isExpanded);
      });
  }
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
      // Mobile dropdown
      if (mobileDropdown && mobileDropdownTrigger && 
          !mobileDropdown.contains(e.target) && 
          !mobileDropdownTrigger.contains(e.target)) {
          mobileDropdown.classList.add('hidden');
      }
      
      // Desktop dropdown
      if (desktopDropdown && desktopDropdownTrigger && 
          !desktopDropdown.contains(e.target) && 
          !desktopDropdownTrigger.contains(e.target)) {
          desktopDropdown.classList.add('hidden', 'opacity-0', 'translate-y-2');
          if (desktopDropdownTrigger) {
              desktopDropdownTrigger.setAttribute('aria-expanded', 'false');
          }
      }
  });
  
  // Close dropdowns when pressing Escape key
  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
          if (mobileDropdown) mobileDropdown.classList.add('hidden');
          if (desktopDropdown) {
              desktopDropdown.classList.add('hidden', 'opacity-0', 'translate-y-2');
              if (desktopDropdownTrigger) {
                  desktopDropdownTrigger.setAttribute('aria-expanded', 'false');
              }
          }
      }
  });
  
  // Handle dropdown menu item clicks
  function setupDropdownMenuItems(dropdown) {
      if (!dropdown) return;
      
      const menuItems = dropdown.querySelectorAll('a[role="menuitem"]');
      menuItems.forEach(item => {
          item.addEventListener('click', function(e) {
              e.preventDefault();
              // Close the dropdown
              const dropdown = this.closest('[role="menu"]');
              if (dropdown) {
                  dropdown.classList.add('hidden');
                  if (desktopDropdown && dropdown === desktopDropdown) {
                      dropdown.classList.add('opacity-0', 'translate-y-2');
                      if (desktopDropdownTrigger) {
                          desktopDropdownTrigger.setAttribute('aria-expanded', 'false');
                      }
                  }
              }
              console.log('Clicked:', this.textContent.trim());
              // Add your navigation logic here
          });
      });
  }
  
  // Set up menu items for both dropdowns
  setupDropdownMenuItems(mobileDropdown);
  setupDropdownMenuItems(desktopDropdown);
  
  // Handle mobile menu button
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", function () {
      const isExpanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", !isExpanded);
      // Toggle mobile menu visibility (you can add your mobile menu logic here)
      console.log("Mobile menu toggled");
    });
  }

  // Handle keyboard navigation for desktop dropdown
  if (desktopDropdown) {
    const menuItems = desktopDropdown.querySelectorAll('a[role="menuitem"]');
    const firstItem = menuItems[0];
    const lastItem = menuItems[menuItems.length - 1];

    desktopDropdown.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        desktopDropdownTrigger.focus();
        desktopDropdown.classList.add("hidden", "opacity-0", "translate-y-2");
        desktopDropdownTrigger.setAttribute("aria-expanded", "false");
      }

      if (!e.shiftKey && e.key === "Tab" && e.target === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }

      if (e.shiftKey && e.key === "Tab" && e.target === firstItem) {
        e.preventDefault();
        lastItem.focus();
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Preloader logic
  function showPreloader() {
    var preloader = document.getElementById("preloader");
    var mainContent = document.getElementById("main-content");
    if (preloader) {
      preloader.classList.remove("hide");
      preloader.style.opacity = "1";
      preloader.style.pointerEvents = "auto";
    }
    if (mainContent) {
      mainContent.classList.remove("show");
      mainContent.style.opacity = "0";
      mainContent.style.pointerEvents = "none";
    }
  }
  function hidePreloader() {
    var preloader = document.getElementById("preloader");
    var mainContent = document.getElementById("main-content");
    if (preloader) {
      preloader.classList.add("hide");
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
    }
    if (mainContent) {
      mainContent.classList.add("show");
      mainContent.style.opacity = "1";
      mainContent.style.pointerEvents = "auto";
    }
  }
  showPreloader();
  setTimeout(hidePreloader, 3000);
});

document.addEventListener("DOMContentLoaded", function () {
  const leftColumn = document.getElementById("left-column");
  const rightColumn = document.getElementById("right-column");
  const middleColumn = document.getElementById("middle-column");

  const collapseLeftBtn = document.getElementById("collapse-left");
  const expandLeftBtn = document.getElementById("expand-left");
  const collapseRightBtn = document.getElementById("collapse-right");
  const expandRightBtn = document.getElementById("expand-right");
  const expandMiddleBtn = document.getElementById("expand-middle");

  function updateColumnState(columnElement, shouldCollapse) {
    if (!columnElement) return;
    const expandedContent = columnElement.querySelector(".expanded-content");
    const collapsedContent = columnElement.querySelector(".collapsed-content");

    if (shouldCollapse) {
      columnElement.classList.add("collapsed");
      if (expandedContent) expandedContent.classList.add("hidden");
      if (collapsedContent) collapsedContent.classList.remove("hidden");
    } else {
      columnElement.classList.remove("collapsed");
      if (expandedContent) expandedContent.classList.remove("hidden");
      if (collapsedContent) collapsedContent.classList.add("hidden");
    }
  }

  // Function to handle left column collapse/expand
  if (collapseLeftBtn && expandLeftBtn) {
    collapseLeftBtn.addEventListener("click", () => {
      updateColumnState(leftColumn, true);
    });

    expandLeftBtn.addEventListener("click", () => {
      updateColumnState(leftColumn, false);
    });
  }

  // Function to handle right column collapse/expand
  if (collapseRightBtn && expandRightBtn) {
    collapseRightBtn.addEventListener("click", () => {
      updateColumnState(rightColumn, true);
    });

    expandRightBtn.addEventListener("click", () => {
      updateColumnState(rightColumn, false);
    });
  }

  // Function to handle middle column expand
  if (expandMiddleBtn) {
    expandMiddleBtn.addEventListener("click", () => {
      const leftIsCollapsed = leftColumn?.classList.contains("collapsed");
      const rightIsCollapsed = rightColumn?.classList.contains("collapsed");

      const bothCollapsed = leftIsCollapsed && rightIsCollapsed;

      if (bothCollapsed) {
        // Currently focused on middle; expand side columns
        updateColumnState(leftColumn, false);
        updateColumnState(rightColumn, false);
      } else {
        // Collapse both sides to focus middle
        updateColumnState(leftColumn, true);
        updateColumnState(rightColumn, true);
      }
    });
  }

  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-button");
  const mobileTabContents = document.querySelectorAll(".mobile-tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.getAttribute("data-tab");

      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      mobileTabContents.forEach((content) => {
        if (content.id === tab) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    });
  });
});
