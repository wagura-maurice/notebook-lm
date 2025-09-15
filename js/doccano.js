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

  // Initialize preloader
  showPreloader();
  setTimeout(hidePreloader, 3000);

  // Handle profile dropdown
  const profileDropdownTrigger = document.getElementById("profile-dropdown-trigger");
  const profileDropdownMenu = document.getElementById("profile-dropdown");
  const avatarDropdownTrigger = document.getElementById("avatar-dropdown-trigger");
  const avatarDropdownMenu = document.getElementById("avatar-dropdown");

  function setupDropdown(trigger, menu) {
    if (!trigger || !menu) return;

    // Toggle dropdown on click
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      const isExpanded = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", !isExpanded);
      
      menu.classList.toggle("hidden");
      if (menu === profileDropdownMenu) {
        menu.classList.toggle("opacity-0");
        menu.classList.toggle("translate-y-2");
      }

      // Position the dropdown for mobile
      if (window.innerWidth < 1024) {
        const rect = trigger.getBoundingClientRect();
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.right = "1rem";
      }
    });

    // Close dropdown when clicking on a menu item
    const menuItems = menu.querySelectorAll("a");
    menuItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        menu.classList.add("hidden");
        if (menu === profileDropdownMenu) {
          menu.classList.add("opacity-0", "translate-y-2");
        }
        trigger.setAttribute("aria-expanded", "false");
        console.log("Clicked:", item.textContent.trim());
      });
    });
  }

  // Initialize dropdowns
  setupDropdown(profileDropdownTrigger, profileDropdownMenu);
  setupDropdown(avatarDropdownTrigger, avatarDropdownMenu);

  // Handle window resize
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      [profileDropdownMenu, avatarDropdownMenu].forEach(menu => {
        if (menu && !menu.classList.contains("hidden")) {
          menu.classList.add("hidden");
        }
      });
    }, 250);
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", function (e) {
    [
      { trigger: profileDropdownTrigger, menu: profileDropdownMenu },
      { trigger: avatarDropdownTrigger, menu: avatarDropdownMenu }
    ].forEach(({ trigger, menu }) => {
      if (trigger && menu && 
          !trigger.contains(e.target) && 
          !menu.contains(e.target)) {
        trigger.setAttribute("aria-expanded", "false");
        menu.classList.add("hidden");
        if (menu === profileDropdownMenu) {
          menu.classList.add("opacity-0", "translate-y-2");
        }
      }
    });
  });

  // Close dropdowns when pressing Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      [profileDropdownMenu, avatarDropdownMenu].forEach(menu => {
        if (menu) {
          menu.classList.add("hidden");
          if (menu === profileDropdownMenu) {
            menu.classList.add("opacity-0", "translate-y-2");
          }
        }
      });
      
      [profileDropdownTrigger, avatarDropdownTrigger].forEach(trigger => {
        if (trigger) {
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    }
  });
}); // Close the main DOMContentLoaded event listener

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
